import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getAuditData,
  crearAuditoria,
  errorResponse,
  paginatedResponse,
  getPaginationParams
} from '@/lib/api-helpers'

// Constantes
const ENTIDAD = 'Madre'
const CAMPOS_PERMITIDOS_LIMITADOS = [
  'rut', 'nombres', 'apellidos', 'edad', 'edadAnos', 'fechaNacimiento',
  'direccion', 'telefono', 'fichaClinica', 'pertenenciaPuebloOriginario',
  'condicionMigrante', 'condicionDiscapacidad', 'condicionPrivadaLibertad',
  'identidadTrans', 'hepatitisBPositiva', 'controlPrenatal'
]

// Campos base para select
const BASE_SELECT = {
  id: true,
  rut: true,
  nombres: true,
  apellidos: true,
  edad: true,
  edadAnos: true,
  fechaNacimiento: true,
  direccion: true,
  telefono: true,
  fichaClinica: true,
  pertenenciaPuebloOriginario: true,
  condicionMigrante: true,
  condicionDiscapacidad: true,
  condicionPrivadaLibertad: true,
  identidadTrans: true,
  hepatitisBPositiva: true,
  controlPrenatal: true,
  createdAt: true,
  updatedAt: true,
}

const FULL_SELECT = {
  ...BASE_SELECT,
  createdById: true,
  updatedById: true,
  createdBy: { select: { id: true, nombre: true, email: true } },
  updatedBy: { select: { id: true, nombre: true, email: true } },
}

/**
 * Verifica permisos especiales con variantes limitadas
 */
async function verificarAuthMadre(request, accion) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: errorResponse('No autenticado', 401) }
  }

  const permissions = await getUserPermissions()
  const permisoCompleto = `madre:${accion}`
  const permisoLimitado = `madre:${accion}_limited`
  
  const hasPermission = permissions.includes(permisoCompleto) || permissions.includes(permisoLimitado)
  
  if (!hasPermission) {
    await registrarPermisoDenegado(request, user)
    const mensajes = { view: 'visualizar', create: 'registrar', update: 'editar', delete: 'eliminar' }
    return { 
      success: false, 
      error: errorResponse(`No tiene permisos para ${mensajes[accion]} madres`, 403) 
    }
  }

  const isLimited = permissions.includes(permisoLimitado) && !permissions.includes(permisoCompleto)
  return { success: true, user, permissions, isLimited }
}

async function registrarPermisoDenegado(request, user) {
  try {
    const { ip, userAgent } = getAuditData(request)
    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
        entidad: ENTIDAD,
        accion: 'PERMISSION_DENIED',
        ip,
        userAgent,
      },
    })
  } catch (auditError) {
    console.error('Error al registrar auditoría:', auditError)
  }
}

/**
 * Valida RUT chileno
 */
function validarRUT(rut) {
  if (!rut || typeof rut !== 'string') return false

  const rutRegex = /^(\d{7,8})-(\d|k|K)$/
  if (!rutRegex.test(rut)) return false

  const [numero, dv] = rut.split('-')
  const dvUpper = dv.toUpperCase()

  let suma = 0
  let multiplicador = 2

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += Number.parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  const dvNumero = 11 - resto
  
  let dvCalculado
  if (dvNumero === 11) dvCalculado = '0'
  else if (dvNumero === 10) dvCalculado = 'K'
  else dvCalculado = dvNumero.toString()

  return dvUpper === dvCalculado
}

/**
 * Construye where para búsqueda
 */
function construirWhere(search) {
  if (!search) return {}
  
  return {
    OR: [
      { rut: { contains: search } },
      { nombres: { contains: search } },
      { apellidos: { contains: search } },
      { fichaClinica: { contains: search } },
    ]
  }
}

export async function GET(request) {
  try {
    const auth = await verificarAuthMadre(request, 'view')
    if (!auth.success) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const where = construirWhere(search)
    const selectFields = auth.isLimited ? BASE_SELECT : FULL_SELECT

    const [madres, total] = await Promise.all([
      prisma.madre.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
        select: selectFields,
      }),
      prisma.madre.count({ where }),
    ])

    return paginatedResponse(madres, { page, limit, total })
  } catch (error) {
    console.error('Error al listar madres:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

/**
 * Valida campos limitados
 */
function validarCamposLimitados(data) {
  const providedFields = Object.keys(data)
  const invalidFields = providedFields.filter(field => !CAMPOS_PERMITIDOS_LIMITADOS.includes(field))
  
  if (invalidFields.length > 0) {
    return { valid: false, error: `No tiene permisos para establecer los siguientes campos: ${invalidFields.join(', ')}` }
  }
  return { valid: true }
}

/**
 * Valida unicidad de RUT y ficha clínica
 */
async function validarUnicidad(rut, fichaClinica, excludeId = null) {
  const whereRut = { rut }
  if (excludeId) whereRut.id = { not: excludeId }
  
  const rutExistente = await prisma.madre.findFirst({ where: whereRut })
  if (rutExistente) {
    return { valid: false, error: 'Ya existe una madre registrada con este RUT' }
  }

  if (fichaClinica) {
    const whereFicha = { fichaClinica }
    if (excludeId) whereFicha.id = { not: excludeId }
    
    const fichaExistente = await prisma.madre.findFirst({ where: whereFicha })
    if (fichaExistente) {
      return { valid: false, error: 'Ya existe una madre registrada con esta ficha clínica' }
    }
  }

  return { valid: true }
}

/**
 * Valida y parsea un campo numérico entero
 */
function validarEntero(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') {
    return { valid: true, valor: undefined }
  }
  
  const num = Number.parseInt(valor)
  if (Number.isNaN(num) || num < 0) {
    return { valid: false, error: `${nombreCampo} debe ser un número válido` }
  }
  return { valid: true, valor: num }
}

/**
 * Prepara datos de madre para crear/actualizar
 */
function prepararDatosMadre(data, userId, isCreate = true) {
  const madreData = {
    rut: data.rut.toUpperCase(),
    nombres: data.nombres.trim(),
    apellidos: data.apellidos.trim(),
  }

  if (isCreate) {
    madreData.createdById = userId
  } else {
    madreData.updatedById = userId
  }

  // Campos opcionales string
  if (data.direccion) madreData.direccion = data.direccion.trim()
  if (data.telefono) madreData.telefono = data.telefono.trim()
  if (data.fichaClinica) madreData.fichaClinica = data.fichaClinica.trim()

  // Fecha de nacimiento
  if (data.fechaNacimiento) {
    const fecha = new Date(data.fechaNacimiento)
    if (!Number.isNaN(fecha.getTime())) {
      madreData.fechaNacimiento = fecha
    }
  }

  return madreData
}

/**
 * Agrega campos numéricos validados
 */
function agregarCamposNumericos(madreData, data) {
  const errores = []
  
  const edadResult = validarEntero(data.edad, 'La edad')
  if (!edadResult.valid) errores.push(edadResult.error)
  else if (edadResult.valor !== undefined) madreData.edad = edadResult.valor

  const edadAnosResult = validarEntero(data.edadAnos, 'La edad en años')
  if (!edadAnosResult.valid) errores.push(edadAnosResult.error)
  else if (edadAnosResult.valor !== undefined) madreData.edadAnos = edadAnosResult.valor

  return errores.length > 0 ? { valid: false, error: errores[0] } : { valid: true }
}

/**
 * Agrega campos booleanos REM
 */
function agregarCamposREM(madreData, data) {
  const camposREM = [
    'pertenenciaPuebloOriginario', 'condicionMigrante', 'condicionDiscapacidad',
    'condicionPrivadaLibertad', 'identidadTrans', 'hepatitisBPositiva', 'controlPrenatal'
  ]
  
  for (const campo of camposREM) {
    if (data[campo] !== undefined) {
      madreData[campo] = data[campo] === null ? null : Boolean(data[campo])
    }
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuthMadre(request, 'create')
    if (!auth.success) return auth.error

    // Verificar usuario en BD
    const dbUser = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!dbUser) {
      return errorResponse('Usuario no encontrado. Por favor, inicie sesión nuevamente.', 401)
    }

    const data = await request.json()

    // Validar campos requeridos
    if (!data.rut || !data.nombres || !data.apellidos) {
      return errorResponse('RUT, nombres y apellidos son requeridos')
    }

    // Validar campos limitados si aplica
    if (auth.isLimited) {
      const camposValidation = validarCamposLimitados(data)
      if (!camposValidation.valid) return errorResponse(camposValidation.error, 403)
    }

    // Validar RUT
    if (!validarRUT(data.rut)) {
      return errorResponse('RUT inválido. Formato esperado: 12345678-9 (sin puntos, con guion)')
    }

    // Validar unicidad
    const unicidadResult = await validarUnicidad(data.rut.toUpperCase(), data.fichaClinica)
    if (!unicidadResult.valid) return errorResponse(unicidadResult.error, 409)

    // Preparar datos
    const madreData = prepararDatosMadre(data, dbUser.id, true)
    
    // Agregar campos numéricos
    const numericResult = agregarCamposNumericos(madreData, data)
    if (!numericResult.valid) return errorResponse(numericResult.error)
    
    // Agregar campos REM
    agregarCamposREM(madreData, data)

    const { ip, userAgent } = getAuditData(request)

    // Crear en transacción
    const madre = await prisma.$transaction(async (tx) => {
      const nuevaMadre = await tx.madre.create({ data: madreData })

      await crearAuditoria(tx, {
        user: { ...auth.user, id: dbUser.id },
        entidad: ENTIDAD,
        entidadId: nuevaMadre.id,
        accion: 'CREATE',
        detalleAfter: nuevaMadre,
        ip,
        userAgent,
      })

      return nuevaMadre
    })

    return Response.json({
      success: true,
      message: 'Madre registrada exitosamente',
      data: madre,
    }, { status: 201 })
  } catch (error) {
    console.error('Error al registrar madre:', error)

    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('rut')) {
        return errorResponse('Ya existe una madre registrada con este RUT', 409)
      }
      if (error.meta?.target?.includes('fichaClinica')) {
        return errorResponse('Ya existe una madre registrada con esta ficha clínica', 409)
      }
    }

    if (error.code === 'P2003' && error.meta?.field_name?.includes('createdById')) {
      return errorResponse('Usuario no válido. Por favor, inicie sesión nuevamente.', 401)
    }

    return errorResponse('Error interno del servidor', 500)
  }
}

