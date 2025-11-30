import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  parsearFecha,
  errorResponse,
  successResponse,
} from '@/lib/api-helpers'
import {
  EPISODIO_MADRE_INCLUDE_DETAIL,
  validarAltaCompletitud,
  construirEpisodioDataUpdate,
} from '@/lib/episodio-helpers'

export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(
      request,
      ['ingreso_alta:view', 'ingreso_alta:manage'],
      'EpisodioMadre',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { id } = await params

    const episodio = await prisma.episodioMadre.findUnique({
      where: { id },
      include: EPISODIO_MADRE_INCLUDE_DETAIL,
    })

    if (!episodio) {
      return errorResponse('Episodio no encontrado', 404)
    }

    // Validar completitud si está en estado INGRESADO
    let validation = null
    if (episodio.estado === 'INGRESADO') {
      validation = await validarAltaCompletitud(episodio.madreId)
    }

    return Response.json({ success: true, data: episodio, validation })
  } catch (error) {
    console.error('Error al obtener episodio:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuth(
      request,
      ['ingreso_alta:update', 'ingreso_alta:manage'],
      'EpisodioMadre',
      { requireAll: false }
    )
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

    const episodioExistente = await prisma.episodioMadre.findUnique({ where: { id } })

    if (!episodioExistente) {
      return errorResponse('Episodio no encontrado', 404)
    }

    if (episodioExistente.estado === 'ALTA') {
      return errorResponse('No se puede editar un episodio que ya fue dado de alta', 400)
    }

    const data = await request.json()

    // Validar fecha si se proporciona
    if (data.fechaIngreso) {
      const fechaResult = parsearFecha(data.fechaIngreso)
      if (!fechaResult || !fechaResult.valid) {
        return errorResponse('Fecha de ingreso inválida', 400)
      }
    }

    const updateData = construirEpisodioDataUpdate(data, user.id)
    const auditData = getAuditData(request)

    const episodio = await prisma.$transaction(async (tx) => {
      const antes = await tx.episodioMadre.findUnique({ where: { id } })
      
      const actualizado = await tx.episodioMadre.update({
        where: { id },
        data: updateData,
        include: { madre: { select: { id: true, rut: true, nombres: true, apellidos: true } } },
      })

      await crearAuditoria(tx, {
        user: { id: user.id, roles: user.roles },
        entidad: 'EpisodioMadre',
        entidadId: actualizado.id,
        accion: 'UPDATE',
        detalleBefore: antes,
        detalleAfter: actualizado,
        ...auditData,
      })

      return actualizado
    })

    return successResponse(episodio, 'Episodio actualizado exitosamente')
  } catch (error) {
    console.error('Error al actualizar episodio:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}