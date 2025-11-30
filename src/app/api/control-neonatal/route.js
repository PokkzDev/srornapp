import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  parsearFecha,
  validarEnum,
  parsearJsonSeguro,
  construirFiltroFecha,
  esUUID,
  errorResponse,
  getPaginationParams,
  paginatedResponse,
  manejarErrorPrisma
} from '@/lib/api-helpers'

// Constantes
const ENTIDAD = 'ControlNeonatal'
const TIPOS_CONTROL = ['SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION', 'OTRO']

// Includes reutilizables
const CONTROL_INCLUDE = {
  rn: {
    include: {
      parto: {
        include: {
          madre: {
            select: { id: true, rut: true, nombres: true, apellidos: true },
          },
        },
      },
    },
  },
  episodioUrni: {
    select: { id: true, estado: true, fechaHoraIngreso: true, servicioUnidad: true },
  },
  enfermera: {
    select: { id: true, nombre: true, email: true },
  },
}

/**
 * Construye condiciones de búsqueda para controles neonatales
 */
function construirWhere(searchParams) {
  const where = {}
  
  // Filtros directos
  const rnId = searchParams.get('rnId')
  const episodioUrniId = searchParams.get('episodioUrniId')
  const tipo = searchParams.get('tipo')
  const enfermeraId = searchParams.get('enfermeraId')
  
  if (rnId) where.rnId = rnId
  if (episodioUrniId) where.episodioUrniId = episodioUrniId
  if (tipo) where.tipo = tipo
  if (enfermeraId) where.enfermeraId = enfermeraId

  // Filtros de fecha
  const filtroFecha = construirFiltroFecha(
    searchParams.get('fechaDesde'),
    searchParams.get('fechaHasta')
  )
  if (filtroFecha) where.fechaHora = filtroFecha

  // Búsqueda por texto
  const search = searchParams.get('search')?.trim()
  if (search) {
    where.OR = construirCondicionesBusqueda(search)
  }

  return where
}

/**
 * Construye condiciones de búsqueda por texto
 */
function construirCondicionesBusqueda(searchTerm) {
  const condiciones = [
    { rn: { parto: { madre: { rut: { contains: searchTerm } } } } },
    { rn: { parto: { madre: { nombres: { contains: searchTerm } } } } },
    { rn: { parto: { madre: { apellidos: { contains: searchTerm } } } } },
    { enfermera: { nombre: { contains: searchTerm } } },
    { observaciones: { contains: searchTerm } },
  ]

  if (esUUID(searchTerm)) {
    condiciones.push({ rnId: searchTerm }, { id: searchTerm })
  }

  return condiciones
}

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'control_neonatal:view', ENTIDAD)
    if (!auth.success) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const where = construirWhere(searchParams)

    const [controles, total] = await Promise.all([
      prisma.controlNeonatal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaHora: 'desc' },
        include: CONTROL_INCLUDE,
      }),
      prisma.controlNeonatal.count({ where }),
    ])

    return paginatedResponse(controles, { page, limit, total })
  } catch (error) {
    console.error('Error al obtener controles neonatales:', error)
    return errorResponse('Error al obtener controles neonatales', 500)
  }
}

/**
 * Valida que el RN existe
 */
async function validarRN(rnId) {
  const rn = await prisma.recienNacido.findUnique({ where: { id: rnId } })
  return rn ? { valid: true, rn } : { valid: false }
}

/**
 * Busca episodio activo del RN o valida el proporcionado
 */
async function obtenerEpisodioUrni(rnId, episodioUrniIdProporcionado) {
  if (episodioUrniIdProporcionado) {
    const episodio = await prisma.episodioURNI.findUnique({
      where: { id: episodioUrniIdProporcionado }
    })
    
    if (!episodio) {
      return { valid: false, error: 'El episodio URNI especificado no existe' }
    }
    
    if (episodio.rnId !== rnId) {
      return { valid: false, error: 'El episodio URNI no pertenece al recién nacido especificado' }
    }
    
    return { valid: true, episodioUrniId: episodioUrniIdProporcionado, autoLinked: false }
  }

  // Buscar episodio activo
  const episodioActivo = await prisma.episodioURNI.findFirst({
    where: { rnId, estado: 'INGRESADO' }
  })

  return {
    valid: true,
    episodioUrniId: episodioActivo?.id || null,
    autoLinked: !!episodioActivo
  }
}

/**
 * Prepara los datos del control neonatal
 */
function prepararDatosControl(data, userId, fechaHora, episodioUrniId, datosJson) {
  const controlData = {
    rnId: data.rnId,
    episodioUrniId,
    fechaHora,
    tipo: data.tipo || 'SIGNOS_VITALES',
    enfermeraId: userId,
  }

  if (datosJson) controlData.datos = datosJson
  if (data.observaciones) {
    controlData.observaciones = data.observaciones.trim().substring(0, 500)
  }

  return controlData
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'control_neonatal:create', ENTIDAD)
    if (!auth.success) return auth.error

    const data = await request.json()

    // Validar campo requerido
    if (!data.rnId) {
      return errorResponse('Recién nacido es requerido')
    }

    // Validar RN existe
    const rnValidation = await validarRN(data.rnId)
    if (!rnValidation.valid) {
      return errorResponse('El recién nacido especificado no existe', 404)
    }

    // Validar/obtener episodio URNI
    const episodioResult = await obtenerEpisodioUrni(data.rnId, data.episodioUrniId)
    if (!episodioResult.valid) {
      return errorResponse(episodioResult.error, 400)
    }

    // Validar tipo de control
    const tipo = data.tipo || 'SIGNOS_VITALES'
    const tipoValidation = validarEnum(tipo, TIPOS_CONTROL, 'Tipo de control')
    if (!tipoValidation.valid) {
      return errorResponse(tipoValidation.error)
    }

    // Validar fecha
    const fechaResult = parsearFecha(data.fechaHora, new Date())
    if (!fechaResult.valid) {
      return errorResponse(fechaResult.error)
    }

    // Validar datos JSON
    const datosResult = parsearJsonSeguro(data.datos)
    if (!datosResult.valid) {
      return errorResponse('El campo datos debe ser un JSON válido')
    }

    const { ip, userAgent } = getAuditData(request)
    const controlData = prepararDatosControl(
      data, auth.user.id, fechaResult.date, episodioResult.episodioUrniId, datosResult.data
    )

    // Crear control en transacción
    const control = await prisma.$transaction(async (tx) => {
      const nuevoControl = await tx.controlNeonatal.create({
        data: controlData,
        include: CONTROL_INCLUDE,
      })

      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: nuevoControl.id,
        accion: 'CREATE',
        detalleAfter: nuevoControl,
        ip,
        userAgent,
      })

      return nuevoControl
    })

    return Response.json({
      success: true,
      message: 'Control neonatal registrado exitosamente',
      data: control,
      autoLinked: episodioResult.autoLinked,
    }, { status: 201 })
  } catch (error) {
    console.error('Error al registrar control neonatal:', error)
    return manejarErrorPrisma(error, 'Error al registrar control neonatal')
  }
}












