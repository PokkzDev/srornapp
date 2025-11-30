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
  SERVICIOS_URNI_VALIDOS,
  EPISODIO_URNI_INCLUDE,
  construirWhereEpisodioUrni,
  construirEpisodioUrniData,
} from '@/lib/urni-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(
      request,
      ['urni:read', 'urni:episodio:view'],
      'EpisodioURNI',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''
    const rnId = searchParams.get('rnId') || ''
    const responsableId = searchParams.get('responsableId') || ''
    const search = searchParams.get('search') || ''
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where = construirWhereEpisodioUrni({ estado, rnId, responsableId, search })

    const [episodios, total] = await Promise.all([
      prisma.episodioURNI.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaHoraIngreso: 'desc' },
        include: EPISODIO_URNI_INCLUDE,
      }),
      prisma.episodioURNI.count({ where }),
    ])

    return paginatedResponse(episodios, { page, limit, total })
  } catch (error) {
    console.error('Error al obtener episodios URNI:', error)
    return errorResponse('Error al obtener episodios URNI', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'urni:episodio:create', 'EpisodioURNI')
    if (auth.error) return auth.error
    const { user, dbUser } = auth

    if (!dbUser) {
      return errorResponse('Usuario no encontrado. Por favor, inicie sesión nuevamente.', 401)
    }

    const data = await request.json()

    if (!data.rnId || !data.fechaHoraIngreso) {
      return errorResponse('Recién nacido y fecha/hora de ingreso son requeridos', 400)
    }

    const rn = await prisma.recienNacido.findUnique({ where: { id: data.rnId } })
    if (!rn) {
      return errorResponse('El recién nacido especificado no existe', 404)
    }

    const episodioActivo = await prisma.episodioURNI.findFirst({
      where: { rnId: data.rnId, estado: 'INGRESADO' },
    })
    if (episodioActivo) {
      return errorResponse('El recién nacido ya tiene un episodio URNI activo', 400)
    }

    const fechaHoraIngreso = parsearFecha(data.fechaHoraIngreso)
    if (!fechaHoraIngreso) {
      return errorResponse('Fecha/hora de ingreso inválida', 400)
    }

    if (data.responsableClinicoId) {
      const responsable = await prisma.user.findUnique({ where: { id: data.responsableClinicoId } })
      if (!responsable) {
        return errorResponse('El responsable clínico especificado no existe', 404)
      }
    }

    if (data.servicioUnidad && !SERVICIOS_URNI_VALIDOS.includes(data.servicioUnidad)) {
      return errorResponse('Servicio/unidad inválido', 400)
    }

    const episodioData = construirEpisodioUrniData(data, dbUser.id, fechaHoraIngreso)
    const auditData = getAuditData(request)

    const episodio = await prisma.$transaction(async (tx) => {
      const nuevoEpisodio = await tx.episodioURNI.create({
        data: episodioData,
        include: {
          rn: { include: { parto: { include: { madre: { select: { id: true, rut: true, nombres: true, apellidos: true } } } } } },
          responsableClinico: { select: { id: true, nombre: true, email: true } },
          createdBy: { select: { id: true, nombre: true } },
        },
      })

      await crearAuditoria(tx, {
        usuarioId: dbUser.id,
        rol: user.roles,
        entidad: 'EpisodioURNI',
        entidadId: nuevoEpisodio.id,
        accion: 'CREATE',
        detalleAfter: nuevoEpisodio,
        ...auditData,
      })

      return nuevoEpisodio
    })

    return successResponse(episodio, 'Episodio URNI registrado exitosamente', 201)
  } catch (error) {
    console.error('Error al registrar episodio URNI:', error)

    if (error.code === 'P2003' && error.meta?.field_name?.includes('createdById')) {
      return errorResponse('Usuario no válido. Por favor, inicie sesión nuevamente.', 401)
    }

    if (error.code === 'P2002') {
      return errorResponse('Ya existe un episodio con estos datos', 400)
    }

    const prismaError = manejarErrorPrisma(error)
    if (prismaError) return prismaError

    return errorResponse('Error al registrar episodio URNI', 500)
  }
}