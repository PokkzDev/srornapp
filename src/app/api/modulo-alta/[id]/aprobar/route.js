import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request, { params }) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('modulo_alta:aprobar')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioMadre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para aprobar altas médicas' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el episodio existe
    const episodio = await prisma.episodioMadre.findUnique({
      where: { id },
      include: {
        madre: {
          select: {
            id: true,
            rut: true,
            nombres: true,
            apellidos: true,
          },
        },
        informeAlta: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!episodio) {
      return Response.json(
        { error: 'Episodio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el episodio está en estado INGRESADO
    if (episodio.estado === 'ALTA') {
      return Response.json(
        { error: 'El episodio ya fue dado de alta' },
        { status: 400 }
      )
    }

    // Verificar que existe un informe de alta generado
    if (!episodio.informeAlta) {
      return Response.json(
        { error: 'No existe un informe de alta generado para este episodio' },
        { status: 400 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Preparar datos para actualizar
    const updateData = {
      estado: 'ALTA',
      fechaAlta: new Date(),
      updatedById: user.id,
    }

    if (data.condicionEgreso) {
      updateData.condicionEgreso = data.condicionEgreso.trim().substring(0, 300)
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar episodio en transacción con auditoría
    const episodioActualizado = await prisma.$transaction(async (tx) => {
      const antes = await tx.episodioMadre.findUnique({ where: { id } })
      
      const actualizado = await tx.episodioMadre.update({
        where: { id },
        data: updateData,
        include: {
          madre: {
            select: {
              id: true,
              rut: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'EpisodioMadre',
          entidadId: actualizado.id,
          accion: 'UPDATE',
          detalleBefore: antes,
          detalleAfter: actualizado,
          ip,
          userAgent,
        },
      })

      return actualizado
    })

    return Response.json({
      success: true,
      message: 'Alta médica aprobada exitosamente',
      data: {
        id: episodioActualizado.id,
        estado: episodioActualizado.estado,
        fechaAlta: episodioActualizado.fechaAlta?.toISOString() || null,
        condicionEgreso: episodioActualizado.condicionEgreso,
        madre: episodioActualizado.madre,
      },
    })
  } catch (error) {
    console.error('Error al aprobar alta:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}







