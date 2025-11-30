import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  errorResponse,
  paginatedResponse,
  getPaginationParams
} from '@/lib/api-helpers'
import {
  PARTO_INCLUDE,
  construirWhereParto,
  validarCamposRequeridos,
  validarFechaParto,
  validarEnumsParto,
  extraerIdsProfesionales,
  validarProfesionales,
  prepararDatosBaseParto,
  agregarCamposOpcionales,
  agregarRelacionesProfesionales,
  manejarErrorParto
} from '@/lib/parto-helpers'

const ENTIDAD = 'Parto'

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'parto:view', ENTIDAD)
    if (!auth.success) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const search = searchParams.get('search') || ''
    const where = construirWhereParto(search)

    const [partos, total] = await Promise.all([
      prisma.parto.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fechaHora: 'desc' }],
        include: PARTO_INCLUDE,
      }),
      prisma.parto.count({ where }),
    ])

    return paginatedResponse(partos, { page, limit, total })
  } catch (error) {
    console.error('Error al listar partos:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'parto:create', ENTIDAD)
    if (!auth.success) return auth.error

    // Verificar usuario en BD
    const dbUser = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!dbUser) {
      return errorResponse('Usuario no encontrado. Por favor, inicie sesión nuevamente.', 401)
    }

    const data = await request.json()

    // Validar campos requeridos
    const camposResult = validarCamposRequeridos(data)
    if (!camposResult.valid) return errorResponse(camposResult.error)

    // Validar madre existe
    const madre = await prisma.madre.findUnique({ where: { id: data.madreId } })
    if (!madre) return errorResponse('La madre especificada no existe', 404)

    // Validar fecha
    const fechaResult = validarFechaParto(data.fechaHora)
    if (!fechaResult.valid) return errorResponse(fechaResult.error)

    // Validar enums
    const enumsResult = validarEnumsParto(data.tipo, data.lugar)
    if (!enumsResult.valid) return errorResponse(enumsResult.error)

    // Extraer y validar profesionales
    const { matronasIds, medicosIds, enfermerasIds } = extraerIdsProfesionales(data)
    const profesResult = await validarProfesionales(matronasIds, medicosIds, enfermerasIds, data.tipo)
    if (!profesResult.valid) return errorResponse(profesResult.error)

    // Preparar datos
    const partoData = prepararDatosBaseParto(data, dbUser.id, fechaResult.fecha, true)
    agregarCamposOpcionales(partoData, data, false)
    agregarRelacionesProfesionales(partoData, matronasIds, medicosIds, enfermerasIds)

    const { ip, userAgent } = getAuditData(request)

    // Crear en transacción
    const parto = await prisma.$transaction(async (tx) => {
      const nuevoParto = await tx.parto.create({
        data: partoData,
        include: PARTO_INCLUDE,
      })

      await crearAuditoria(tx, {
        user: { ...auth.user, id: dbUser.id },
        entidad: ENTIDAD,
        entidadId: nuevoParto.id,
        accion: 'CREATE',
        detalleAfter: nuevoParto,
        ip,
        userAgent,
      })

      return nuevoParto
    })

    return Response.json({
      success: true,
      message: 'Parto registrado exitosamente',
      data: parto,
    }, { status: 201 })
  } catch (error) {
    return manejarErrorParto(error)
  }
}
