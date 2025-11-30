import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  errorResponse,
  successResponse,
  paginatedResponse,
  getPaginationParams,
  manejarErrorPrisma,
} from '@/lib/api-helpers'
import {
  SEXOS_VALIDOS,
  RN_INCLUDE,
  construirWhereBusqueda,
  validarCamposNumericos,
  construirRNDataCreate,
} from '@/lib/recien-nacido-helpers'

export async function GET(request) {
  try {
    // Verificar autenticación con permisos múltiples
    const auth = await verificarAuth(
      request,
      ['recien-nacido:view', 'control_neonatal:create'],
      'RecienNacido',
      { requireAll: false } // OR: cualquiera de los permisos
    )
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where = construirWhereBusqueda(search)

    const [recienNacidos, total] = await Promise.all([
      prisma.recienNacido.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: RN_INCLUDE,
      }),
      prisma.recienNacido.count({ where }),
    ])

    return paginatedResponse(recienNacidos, { page, limit, total })
  } catch (error) {
    console.error('Error al listar recién nacidos:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'recien-nacido:create', 'RecienNacido')
    if (auth.error) return auth.error
    const { user, dbUser } = auth

    if (!dbUser) {
      return errorResponse('Usuario no encontrado. Por favor, inicie sesión nuevamente.', 401)
    }

    const data = await request.json()

    // Validaciones requeridas
    if (!data.partoId || !data.sexo) {
      return errorResponse('Parto y sexo son requeridos', 400)
    }

    const parto = await prisma.parto.findUnique({ where: { id: data.partoId } })
    if (!parto) {
      return errorResponse('El parto especificado no existe', 404)
    }

    if (!SEXOS_VALIDOS.includes(data.sexo)) {
      return errorResponse('Sexo inválido. Valores válidos: M, F, I', 400)
    }

    // Validar campos numéricos
    const validacionNumeros = validarCamposNumericos(data)
    if (validacionNumeros) {
      return errorResponse(validacionNumeros.error, 400)
    }

    const rnData = construirRNDataCreate(data, dbUser.id)
    const auditData = getAuditData(request)

    const recienNacido = await prisma.$transaction(async (tx) => {
      const nuevoRN = await tx.recienNacido.create({
        data: rnData,
        include: RN_INCLUDE,
      })

      await crearAuditoria(tx, {
        user: { id: dbUser.id, roles: user.roles },
        entidad: 'RecienNacido',
        entidadId: nuevoRN.id,
        accion: 'CREATE',
        detalleAfter: nuevoRN,
        ...auditData,
      })

      return nuevoRN
    })

    return successResponse(recienNacido, 'Recién nacido registrado exitosamente', 201)
  } catch (error) {
    console.error('Error al registrar recién nacido:', error)

    if (error.code === 'P2003' && error.meta?.field_name?.includes('createdById')) {
      return errorResponse('Usuario no válido. Por favor, inicie sesión nuevamente.', 401)
    }

    const prismaError = manejarErrorPrisma(error)
    if (prismaError) return prismaError

    return errorResponse('Error interno del servidor', 500)
  }
}








