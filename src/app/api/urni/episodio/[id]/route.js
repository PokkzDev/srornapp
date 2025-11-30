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
  SERVICIOS_URNI_VALIDOS,
  EPISODIO_URNI_DETAIL_INCLUDE,
  construirEpisodioUrniUpdateData,
} from '@/lib/urni-helpers'

export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(
      request,
      ['urni:read', 'urni:episodio:view'],
      'EpisodioURNI',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { id } = await params

    const episodio = await prisma.episodioURNI.findUnique({
      where: { id },
      include: EPISODIO_URNI_DETAIL_INCLUDE,
    })

    if (!episodio) {
      return errorResponse('Episodio URNI no encontrado', 404)
    }

    return successResponse(episodio)
  } catch (error) {
    console.error('Error al obtener episodio URNI:', error)
    return errorResponse('Error al obtener episodio URNI', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'urni:episodio:update', 'EpisodioURNI')
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

    const episodioActual = await prisma.episodioURNI.findUnique({ where: { id } })
    if (!episodioActual) {
      return errorResponse('Episodio URNI no encontrado', 404)
    }

    if (episodioActual.estado === 'ALTA') {
      return errorResponse('No se puede actualizar un episodio que ya fue dado de alta', 400)
    }

    const data = await request.json()

    // Validar servicio/unidad si se proporciona
    if (data.servicioUnidad && !SERVICIOS_URNI_VALIDOS.includes(data.servicioUnidad)) {
      return errorResponse('Servicio/unidad inválido', 400)
    }

    // Validar responsable si se proporciona
    if (data.responsableClinicoId) {
      const responsable = await prisma.user.findUnique({ where: { id: data.responsableClinicoId } })
      if (!responsable) {
        return errorResponse('El responsable clínico especificado no existe', 404)
      }
    }

    // Validar fecha de ingreso si se proporciona
    if (data.fechaHoraIngreso !== undefined) {
      const fechaResult = parsearFecha(data.fechaHoraIngreso)
      if (!fechaResult || !fechaResult.valid) {
        return errorResponse('Fecha/hora de ingreso inválida', 400)
      }
      if (episodioActual.fechaHoraAlta && fechaResult.date > episodioActual.fechaHoraAlta) {
        return errorResponse('La fecha/hora de ingreso no puede ser posterior a la fecha/hora de alta', 400)
      }
      data.fechaHoraIngreso = fechaResult.date
    }

    const updateData = construirEpisodioUrniUpdateData(data, user.id)
    const auditData = getAuditData(request)

    const episodio = await prisma.$transaction(async (tx) => {
      const episodioActualizado = await tx.episodioURNI.update({
        where: { id },
        data: updateData,
        include: {
          rn: { include: { parto: { include: { madre: { select: { id: true, rut: true, nombres: true, apellidos: true } } } } } },
          responsableClinico: { select: { id: true, nombre: true, email: true } },
          createdBy: { select: { id: true, nombre: true } },
          updatedBy: { select: { id: true, nombre: true } },
        },
      })

      await crearAuditoria(tx, {
        user: { id: user.id, roles: user.roles },
        entidad: 'EpisodioURNI',
        entidadId: episodioActualizado.id,
        accion: 'UPDATE',
        detalleBefore: episodioActual,
        detalleAfter: episodioActualizado,
        ...auditData,
      })

      return episodioActualizado
    })

    return successResponse(episodio, 'Episodio URNI actualizado exitosamente')
  } catch (error) {
    console.error('Error al actualizar episodio URNI:', error)
    return errorResponse('Error al actualizar episodio URNI', 500)
  }
}










