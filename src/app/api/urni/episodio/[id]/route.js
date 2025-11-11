import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
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
    const hasViewPermission = 
      permissions.includes('urni:read') || 
      permissions.includes('urni:episodio:view')
    
    if (!hasViewPermission) {
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
        { error: 'No tiene permisos para visualizar episodios URNI' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obtener episodio con todas las relaciones
    const episodio = await prisma.episodioURNI.findUnique({
      where: { id },
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
                    edad: true,
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
        createdBy: {
          select: {
            id: true,
            nombre: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            nombre: true,
          },
        },
        atenciones: {
          orderBy: { fechaHora: 'desc' },
          include: {
            medico: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        controles: {
          orderBy: { fechaHora: 'desc' },
          include: {
            enfermera: {
              select: {
                id: true,
                nombre: true,
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

    return Response.json({ data: episodio })
  } catch (error) {
    console.error('Error al obtener episodio URNI:', error)
    return Response.json(
      { error: 'Error al obtener episodio URNI' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
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
    if (!permissions.includes('urni:episodio:update')) {
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
        { error: 'No tiene permisos para actualizar episodios URNI' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obtener episodio actual
    const episodioActual = await prisma.episodioURNI.findUnique({
      where: { id },
    })

    if (!episodioActual) {
      return Response.json(
        { error: 'Episodio URNI no encontrado' },
        { status: 404 }
      )
    }

    // No permitir actualizar si ya está dado de alta
    if (episodioActual.estado === 'ALTA') {
      return Response.json(
        { error: 'No se puede actualizar un episodio que ya fue dado de alta' },
        { status: 400 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Preparar datos de actualización
    const updateData = {
      updatedById: user.id,
    }

    // Campos actualizables
    if (data.motivoIngreso !== undefined) {
      updateData.motivoIngreso = data.motivoIngreso ? data.motivoIngreso.trim().substring(0, 300) : null
    }

    if (data.servicioUnidad !== undefined) {
      if (data.servicioUnidad && !['URNI', 'UCIN', 'NEONATOLOGIA'].includes(data.servicioUnidad)) {
        return Response.json(
          { error: 'Servicio/unidad inválido' },
          { status: 400 }
        )
      }
      updateData.servicioUnidad = data.servicioUnidad || null
    }

    if (data.responsableClinicoId !== undefined) {
      if (data.responsableClinicoId) {
        // Validar que el responsable existe
        const responsable = await prisma.user.findUnique({
          where: { id: data.responsableClinicoId },
        })

        if (!responsable) {
          return Response.json(
            { error: 'El responsable clínico especificado no existe' },
            { status: 404 }
          )
        }
      }
      updateData.responsableClinicoId = data.responsableClinicoId || null
    }

    if (data.fechaHoraIngreso !== undefined) {
      const fechaHoraIngreso = new Date(data.fechaHoraIngreso)
      if (isNaN(fechaHoraIngreso.getTime())) {
        return Response.json(
          { error: 'Fecha/hora de ingreso inválida' },
          { status: 400 }
        )
      }
      updateData.fechaHoraIngreso = fechaHoraIngreso
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar episodio en transacción con auditoría
    const episodio = await prisma.$transaction(async (tx) => {
      // Actualizar episodio
      const episodioActualizado = await tx.episodioURNI.update({
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
          entidadId: episodioActualizado.id,
          accion: 'UPDATE',
          detalleBefore: episodioActual,
          detalleAfter: episodioActualizado,
          ip,
          userAgent,
        },
      })

      return episodioActualizado
    })

    return Response.json({
      success: true,
      message: 'Episodio URNI actualizado exitosamente',
      data: episodio,
    })
  } catch (error) {
    console.error('Error al actualizar episodio URNI:', error)
    return Response.json(
      { error: 'Error al actualizar episodio URNI' },
      { status: 500 }
    )
  }
}









