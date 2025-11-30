import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  parsearFecha,
  errorResponse,
  successResponse,
  paginatedResponse,
  getPaginationParams,
  manejarErrorPrisma,
} from '@/lib/api-helpers'
import {
  ATENCION_URNI_INCLUDE,
  construirWhereAtencionUrni,
  construirAtencionUrniData,
  validarEpisodioParaAtencion,
} from '@/lib/urni-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(
      request,
      ['urni:read', 'urni:atencion:view'],
      'AtencionURNI',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const episodioId = searchParams.get('episodioId') || ''
    const rnId = searchParams.get('rnId') || ''
    const medicoId = searchParams.get('medicoId') || ''
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where = construirWhereAtencionUrni({ episodioId, rnId, medicoId })

    const [atenciones, total] = await Promise.all([
      prisma.atencionURNI.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaHora: 'desc' },
        include: ATENCION_URNI_INCLUDE,
      }),
      prisma.atencionURNI.count({ where }),
    ])

    return paginatedResponse(atenciones, { page, limit, total })
  } catch (error) {
    console.error('Error al obtener atenciones URNI:', error)
    return errorResponse('Error al obtener atenciones URNI', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'urni:atencion:create', 'AtencionURNI')
    if (auth.error) return auth.error
    const { user } = auth

    const data = await request.json()

    if (!data.rnId) {
      return errorResponse('Recién nacido es requerido', 400)
    }

    const rn = await prisma.recienNacido.findUnique({ where: { id: data.rnId } })
    if (!rn) {
      return errorResponse('El recién nacido especificado no existe', 404)
    }

    // Determinar episodioId: usar el proporcionado o buscar el episodio activo
    let episodioId = data.episodioId || null

    if (!episodioId) {
      const episodioActivo = await prisma.episodioURNI.findFirst({
        where: { rnId: data.rnId, estado: 'INGRESADO' },
      })
      if (episodioActivo) {
        episodioId = episodioActivo.id
      }
    }

    // Validar episodio si se proporcionó
    if (episodioId) {
      const validacionEpisodio = await validarEpisodioParaAtencion(prisma, episodioId, data.rnId)
      if (validacionEpisodio.error) {
        return errorResponse(validacionEpisodio.error, validacionEpisodio.status)
      }
    }

    let fechaHora = new Date()
    if (data.fechaHora) {
      const fechaResult = parsearFecha(data.fechaHora)
      if (!fechaResult || !fechaResult.valid) {
        return errorResponse('Fecha/hora inválida', 400)
      }
      fechaHora = fechaResult.date
    }

    // Validar que el usuario existe en la base de datos
    let medicoId = null
    if (user.id) {
      const usuarioExiste = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      })
      if (usuarioExiste) {
        medicoId = user.id
      } else {
        console.warn(`Usuario autenticado con ID ${user.id} no encontrado en la base de datos`)
      }
    }

    const atencionData = construirAtencionUrniData(data, episodioId, medicoId, fechaHora)
    const auditData = getAuditData(request)

    const atencion = await prisma.$transaction(async (tx) => {
      const nuevaAtencion = await tx.atencionURNI.create({
        data: atencionData,
        include: ATENCION_URNI_INCLUDE,
      })

      await crearAuditoria(tx, {
        user: { id: medicoId, roles: user.roles },
        entidad: 'AtencionURNI',
        entidadId: nuevaAtencion.id,
        accion: 'CREATE',
        detalleAfter: nuevaAtencion,
        ...auditData,
      })

      return nuevaAtencion
    })

    return successResponse(atencion, 'Atención URNI registrada exitosamente', 201)
  } catch (error) {
    console.error('Error al registrar atención URNI:', error)

    const prismaError = manejarErrorPrisma(error)
    if (prismaError) return prismaError

    return errorResponse('Error interno del servidor', 500)
  }
}
