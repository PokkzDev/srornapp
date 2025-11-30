import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getAuditData,
  crearAuditoria,
  errorResponse,
  successResponse
} from '@/lib/api-helpers'

// Constantes
const ENTIDAD = 'Madre'
const CAMPOS_PERMITIDOS_LIMITADOS = [
  'rut', 'nombres', 'apellidos', 'edad', 'edadAnos', 'fechaNacimiento',
  'direccion', 'telefono', 'fichaClinica', 'pertenenciaPuebloOriginario',
  'condicionMigrante', 'condicionDiscapacidad', 'condicionPrivadaLibertad',
  'identidadTrans', 'hepatitisBPositiva', 'controlPrenatal'
]

// Selects
const BASE_SELECT = {
  id: true, rut: true, nombres: true, apellidos: true, edad: true,
  edadAnos: true, fechaNacimiento: true, direccion: true, telefono: true,
  fichaClinica: true, pertenenciaPuebloOriginario: true, condicionMigrante: true,
  condicionDiscapacidad: true, condicionPrivadaLibertad: true, identidadTrans: true,
  hepatitisBPositiva: true, controlPrenatal: true, createdAt: true, updatedAt: true,
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
 * Valida campos limitados
 */
function validarCamposLimitados(data) {
  const invalidFields = Object.keys(data).filter(field => !CAMPOS_PERMITIDOS_LIMITADOS.includes(field))
  if (invalidFields.length > 0) {
    return { valid: false, error: `No tiene permisos para modificar los siguientes campos: ${invalidFields.join(', ')}` }
  }
  return { valid: true }
}

/**
 * Valida unicidad de RUT y ficha clínica
 */
async function validarUnicidad(rut, fichaClinica, excludeId) {
  const rutExistente = await prisma.madre.findFirst({
    where: { rut, id: { not: excludeId } }
  })
  if (rutExistente) {
    return { valid: false, error: 'Ya existe otra madre registrada con este RUT' }
  }

  if (fichaClinica) {
    const fichaExistente = await prisma.madre.findFirst({
      where: { fichaClinica, id: { not: excludeId } }
    })
    if (fichaExistente) {
      return { valid: false, error: 'Ya existe otra madre registrada con esta ficha clínica' }
    }
  }

  return { valid: true }
}

/**
 * Valida y parsea un campo numérico entero
 */
function validarEntero(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') {
    return { valid: true, valor: null }
  }
  
  const num = Number.parseInt(valor)
  if (Number.isNaN(num) || num < 0) {
    return { valid: false, error: `${nombreCampo} debe ser un número válido` }
  }
  return { valid: true, valor: num }
}

/**
 * Prepara datos de madre para actualizar
 */
function prepararDatosActualizacion(data, userId) {
  const madreData = {
    rut: data.rut.toUpperCase(),
    nombres: data.nombres.trim(),
    apellidos: data.apellidos.trim(),
    updatedById: userId,
    direccion: data.direccion ? data.direccion.trim() : null,
    telefono: data.telefono ? data.telefono.trim() : null,
    fichaClinica: data.fichaClinica ? data.fichaClinica.trim() : null,
  }

  // Fecha de nacimiento
  if (data.fechaNacimiento) {
    const fecha = new Date(data.fechaNacimiento)
    madreData.fechaNacimiento = !Number.isNaN(fecha.getTime()) ? fecha : null
  } else {
    madreData.fechaNacimiento = null
  }

  return madreData
}

/**
 * Agrega campos numéricos validados
 */
function agregarCamposNumericos(madreData, data) {
  const edadResult = validarEntero(data.edad, 'La edad')
  if (!edadResult.valid) return edadResult
  madreData.edad = edadResult.valor

  const edadAnosResult = validarEntero(data.edadAnos, 'La edad en años')
  if (!edadAnosResult.valid) return edadAnosResult
  madreData.edadAnos = edadAnosResult.valor

  return { valid: true }
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

// GET - Obtener una madre específica
export async function GET(request, { params }) {
  try {
    const auth = await verificarAuthMadre(request, 'view')
    if (!auth.success) return auth.error

    const { id } = await params

    const madre = auth.isLimited 
      ? await prisma.madre.findUnique({ where: { id }, select: BASE_SELECT })
      : await prisma.madre.findUnique({
          where: { id },
          include: { partos: { orderBy: { fechaHora: 'desc' }, take: 10 } },
        })

    if (!madre) {
      return errorResponse('Madre no encontrada', 404)
    }

    return successResponse(madre)
  } catch (error) {
    console.error('Error al obtener madre:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

// PUT - Actualizar una madre
export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuthMadre(request, 'update')
    if (!auth.success) return auth.error

    const { id } = await params
    const madreExistente = await prisma.madre.findUnique({ where: { id } })

    if (!madreExistente) {
      return errorResponse('Madre no encontrada', 404)
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

    // Validar unicidad si cambiaron
    const rutNormalizado = data.rut.toUpperCase()
    if (rutNormalizado !== madreExistente.rut || data.fichaClinica !== madreExistente.fichaClinica) {
      const unicidadResult = await validarUnicidad(rutNormalizado, data.fichaClinica, id)
      if (!unicidadResult.valid) return errorResponse(unicidadResult.error, 409)
    }

    // Preparar datos
    const madreData = prepararDatosActualizacion(data, auth.user.id)
    
    // Agregar campos numéricos
    const numericResult = agregarCamposNumericos(madreData, data)
    if (!numericResult.valid) return errorResponse(numericResult.error)
    
    // Agregar campos REM
    agregarCamposREM(madreData, data)

    const { ip, userAgent } = getAuditData(request)

    // Actualizar en transacción
    const madreActualizada = await prisma.$transaction(async (tx) => {
      const madre = await tx.madre.update({ where: { id }, data: madreData })

      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: madre.id,
        accion: 'UPDATE',
        detalleBefore: madreExistente,
        detalleAfter: madre,
        ip,
        userAgent,
      })

      return madre
    })

    return Response.json({
      success: true,
      message: 'Madre actualizada exitosamente',
      data: madreActualizada,
    })
  } catch (error) {
    console.error('Error al actualizar madre:', error)

    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('rut')) {
        return errorResponse('Ya existe otra madre registrada con este RUT', 409)
      }
      if (error.meta?.target?.includes('fichaClinica')) {
        return errorResponse('Ya existe otra madre registrada con esta ficha clínica', 409)
      }
    }

    return errorResponse('Error interno del servidor', 500)
  }
}

// DELETE - Eliminar una madre
export async function DELETE(request, { params }) {
  try {
    const auth = await verificarAuthMadre(request, 'delete')
    if (!auth.success) return auth.error

    const { id } = await params

    const madreExistente = await prisma.madre.findUnique({
      where: { id },
      include: {
        partos: { take: 1, include: { recienNacidos: { take: 1 } } },
      },
    })

    if (!madreExistente) {
      return errorResponse('Madre no encontrada', 404)
    }

    // Verificar restricciones
    const tienePartos = madreExistente.partos.length > 0
    
    if (auth.isLimited && tienePartos) {
      const tieneRN = madreExistente.partos.some(parto => parto.recienNacidos.length > 0)
      if (tienePartos || tieneRN) {
        return errorResponse('No se puede eliminar una madre que tiene partos o recién nacidos registrados', 409)
      }
    }

    if (tienePartos) {
      return errorResponse('No se puede eliminar una madre que tiene partos registrados', 409)
    }

    const { ip, userAgent } = getAuditData(request)

    await prisma.$transaction(async (tx) => {
      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: madreExistente.id,
        accion: 'DELETE',
        detalleBefore: madreExistente,
        ip,
        userAgent,
      })

      await tx.madre.delete({ where: { id } })
    })

    return Response.json({
      success: true,
      message: 'Madre eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar madre:', error)

    if (error.code === 'P2003') {
      return errorResponse('No se puede eliminar una madre que tiene partos registrados', 409)
    }

    return errorResponse('Error interno del servidor', 500)
  }
}

