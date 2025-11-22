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
    if (!permissions.includes('alta:manage')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioURNI',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para gestionar altas URNI' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el episodio existe
    const episodio = await prisma.episodioURNI.findUnique({
      where: { id },
      include: {
        rn: {
          include: {
            parto: {
              include: {
                madre: true,
              },
            },
          },
        },
      },
    })

    if (!episodio) {
      return Response.json(
        { error: 'Episodio URNI no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el episodio está en estado INGRESADO
    if (episodio.estado !== 'INGRESADO') {
      return Response.json(
        { 
          error: episodio.estado === 'ALTA' 
            ? 'El episodio URNI ya fue dado de alta' 
            : `El episodio URNI no está en estado válido para procesar alta. Estado actual: ${episodio.estado || 'desconocido'}` 
        },
        { status: 400 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Preparar datos para actualizar
    const updateData = {
      estado: 'ALTA',
      fechaHoraAlta: new Date(),
      updatedById: user.id,
    }

    if (data.condicionEgreso) {
      updateData.condicionEgreso = data.condicionEgreso.trim().substring(0, 300)
    }

    // Si se proporciona fechaHoraAlta específica, validarla
    if (data.fechaHoraAlta) {
      const fechaHoraAlta = new Date(data.fechaHoraAlta)
      if (isNaN(fechaHoraAlta.getTime())) {
        return Response.json(
          { error: 'Fecha/hora de alta inválida' },
          { status: 400 }
        )
      }
      // Validar que la fecha de alta no sea anterior a la fecha de ingreso
      if (fechaHoraAlta < episodio.fechaHoraIngreso) {
        return Response.json(
          { error: 'La fecha/hora de alta no puede ser anterior a la fecha/hora de ingreso' },
          { status: 400 }
        )
      }
      updateData.fechaHoraAlta = fechaHoraAlta
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar episodio en transacción con auditoría
    const episodioActualizado = await prisma.$transaction(async (tx) => {
      const antes = await tx.episodioURNI.findUnique({ where: { id } })
      
      const actualizado = await tx.episodioURNI.update({
        where: { id },
        data: updateData,
        include: {
          rn: {
            include: {
              parto: {
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
              },
            },
          },
          responsableClinico: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'EpisodioURNI',
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
      message: 'Alta URNI procesada exitosamente',
      data: episodioActualizado,
    })
  } catch (error) {
    console.error('Error al procesar alta URNI:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}












