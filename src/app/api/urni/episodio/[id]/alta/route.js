import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  parsearFecha,
  errorResponse,
  successResponse,
} from '@/lib/api-helpers'
import { construirAltaUrniData } from '@/lib/urni-helpers'

export async function POST(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'alta:manage', 'EpisodioURNI')
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

    const episodio = await prisma.episodioURNI.findUnique({
      where: { id },
      include: { rn: { include: { parto: { include: { madre: true } } } } },
    })

    if (!episodio) {
      return errorResponse('Episodio URNI no encontrado', 404)
    }

    if (episodio.estado !== 'INGRESADO') {
      const mensaje = episodio.estado === 'ALTA'
        ? 'El episodio URNI ya fue dado de alta'
        : `El episodio URNI no está en estado válido para procesar alta. Estado actual: ${episodio.estado || 'desconocido'}`
      return errorResponse(mensaje, 400)
    }

    const data = await request.json()
    const updateData = construirAltaUrniData(data, user.id)

    // Si se proporciona fechaHoraAlta específica, validarla
    if (data.fechaHoraAlta) {
      const fechaResult = parsearFecha(data.fechaHoraAlta)
      if (!fechaResult || !fechaResult.valid) {
        return errorResponse('Fecha/hora de alta inválida', 400)
      }
      if (fechaResult.date < episodio.fechaHoraIngreso) {
        return errorResponse('La fecha/hora de alta no puede ser anterior a la fecha/hora de ingreso', 400)
      }
      updateData.fechaHoraAlta = fechaResult.date
    }

    const auditData = getAuditData(request)

    const episodioActualizado = await prisma.$transaction(async (tx) => {
      const antes = await tx.episodioURNI.findUnique({ where: { id } })

      const actualizado = await tx.episodioURNI.update({
        where: { id },
        data: updateData,
        include: {
          rn: { include: { parto: { include: { madre: { select: { id: true, rut: true, nombres: true, apellidos: true } } } } } },
          responsableClinico: { select: { id: true, nombre: true, email: true } },
        },
      })

      await crearAuditoria(tx, {
        user: { id: user.id, roles: user.roles },
        entidad: 'EpisodioURNI',
        entidadId: actualizado.id,
        accion: 'UPDATE',
        detalleBefore: antes,
        detalleAfter: actualizado,
        ...auditData,
      })

      return actualizado
    })

    return successResponse(episodioActualizado, 'Alta URNI procesada exitosamente')
  } catch (error) {
    console.error('Error al procesar alta URNI:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}











