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
  EPISODIO_MADRE_INCLUDE,
  construirWhereBusquedaEpisodio,
  construirEpisodioDataCreate,
} from '@/lib/episodio-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(
      request,
      ['ingreso_alta:view', 'ingreso_alta:manage'],
      'EpisodioMadre',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where = construirWhereBusquedaEpisodio(search, estado)

    const [episodios, total] = await Promise.all([
      prisma.episodioMadre.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fechaIngreso: 'desc' }],
        include: EPISODIO_MADRE_INCLUDE,
      }),
      prisma.episodioMadre.count({ where }),
    ])

    return paginatedResponse(episodios, { page, limit, total })
  } catch (error) {
    console.error('Error al listar ingresos/altas:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(
      request,
      ['ingreso_alta:create', 'ingreso_alta:manage'],
      'EpisodioMadre',
      { requireAll: false }
    )
    if (auth.error) return auth.error
    const { user, dbUser } = auth

    if (!dbUser) {
      return errorResponse('Usuario no encontrado. Por favor, inicie sesión nuevamente.', 401)
    }

    const data = await request.json()

    if (!data.madreId || !data.fechaIngreso) {
      return errorResponse('Madre y fecha de ingreso son requeridos', 400)
    }

    const madre = await prisma.madre.findUnique({ where: { id: data.madreId } })
    if (!madre) {
      return errorResponse('La madre especificada no existe', 404)
    }

    const fechaIngresoResult = parsearFecha(data.fechaIngreso)
    if (!fechaIngresoResult || !fechaIngresoResult.valid) {
      return errorResponse('Fecha de ingreso inválida', 400)
    }

    const episodioData = construirEpisodioDataCreate(data, dbUser.id, fechaIngresoResult.date)
    const auditData = getAuditData(request)

    const episodio = await prisma.$transaction(async (tx) => {
      const nuevoEpisodio = await tx.episodioMadre.create({
        data: episodioData,
        include: { madre: { select: { id: true, rut: true, nombres: true, apellidos: true } } },
      })

      await crearAuditoria(tx, {
        user: { id: dbUser.id, roles: user.roles },
        entidad: 'EpisodioMadre',
        entidadId: nuevoEpisodio.id,
        accion: 'CREATE',
        detalleAfter: nuevoEpisodio,
        ...auditData,
      })

      return nuevoEpisodio
    })

    return successResponse(episodio, 'Ingreso registrado exitosamente', 201)
  } catch (error) {
    console.error('Error al registrar ingreso:', error)

    if (error.code === 'P2003' && error.meta?.field_name?.includes('createdById')) {
      return errorResponse('Usuario no válido. Por favor, inicie sesión nuevamente.', 401)
    }

    const prismaError = manejarErrorPrisma(error)
    if (prismaError) return prismaError

    return errorResponse('Error interno del servidor', 500)
  }
}