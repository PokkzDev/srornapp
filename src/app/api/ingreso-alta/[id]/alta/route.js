import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  errorResponse,
  successResponse,
} from '@/lib/api-helpers'
import { validarAltaCompletitud, construirAltaData } from '@/lib/episodio-helpers'

export async function POST(request, { params }) {
  try {
    const auth = await verificarAuth(
      request,
      ['ingreso_alta:alta', 'ingreso_alta:manage'],
      'EpisodioMadre',
      { requireAll: false }
    )
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

    const episodio = await prisma.episodioMadre.findUnique({
      where: { id },
      include: { madre: true },
    })

    if (!episodio) {
      return errorResponse('Episodio no encontrado', 404)
    }

    if (episodio.estado === 'ALTA') {
      return errorResponse('El episodio ya fue dado de alta', 400)
    }

    const data = await request.json()

    // Validar completitud antes de procesar alta
    const validation = await validarAltaCompletitud(episodio.madreId)

    if (!validation.isValid) {
      return Response.json(
        { error: 'No se puede procesar el alta. Faltan datos requeridos.', validation },
        { status: 400 }
      )
    }

    const updateData = construirAltaData(data, user.id)
    const auditData = getAuditData(request)

    const episodioActualizado = await prisma.$transaction(async (tx) => {
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

    return successResponse(episodioActualizado, 'Alta procesada exitosamente')
  } catch (error) {
    console.error('Error al procesar alta:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}