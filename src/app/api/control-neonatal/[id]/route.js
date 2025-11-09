import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un control neonatal específico
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const permissions = await getUserPermissions()
    if (!permissions.includes('control_neonatal:view')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'ControlNeonatal',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar controles neonatales' },
        { status: 403 }
      )
    }

    const { id } = await params

    const control = await prisma.controlNeonatal.findUnique({
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
        episodioUrni: {
          include: {
            responsableClinico: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        enfermera: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    })

    if (!control) {
      return Response.json(
        { error: 'Control neonatal no encontrado' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: control,
    })
  } catch (error) {
    console.error('Error al obtener control neonatal:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un control neonatal
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const permissions = await getUserPermissions()
    if (!permissions.includes('control_neonatal:update')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'ControlNeonatal',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para editar controles neonatales' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el control existe
    const controlExistente = await prisma.controlNeonatal.findUnique({
      where: { id },
    })

    if (!controlExistente) {
      return Response.json(
        { error: 'Control neonatal no encontrado' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Validar tipo de control si se proporciona
    if (data.tipo) {
      const tiposValidos = ['SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION', 'OTRO']
      if (!tiposValidos.includes(data.tipo)) {
        return Response.json(
          { error: 'Tipo de control inválido' },
          { status: 400 }
        )
      }
    }

    // Validar fechaHora si se proporciona
    let fechaHora = controlExistente.fechaHora
    if (data.fechaHora !== undefined) {
      fechaHora = new Date(data.fechaHora)
      if (isNaN(fechaHora.getTime())) {
        return Response.json(
          { error: 'Fecha/hora inválida' },
          { status: 400 }
        )
      }
    }

    // Validar RN si se proporciona
    if (data.rnId && data.rnId !== controlExistente.rnId) {
      const rn = await prisma.recienNacido.findUnique({
        where: { id: data.rnId },
      })

      if (!rn) {
        return Response.json(
          { error: 'El recién nacido especificado no existe' },
          { status: 404 }
        )
      }
    }

    // Validar episodio URNI si se proporciona
    if (data.episodioUrniId !== undefined) {
      if (data.episodioUrniId === null) {
        // Permitir desvincular episodio
      } else {
        const episodio = await prisma.episodioURNI.findUnique({
          where: { id: data.episodioUrniId },
        })

        if (!episodio) {
          return Response.json(
            { error: 'El episodio URNI especificado no existe' },
            { status: 404 }
          )
        }

        // Validar que el episodio pertenece al RN
        const rnIdFinal = data.rnId || controlExistente.rnId
        if (episodio.rnId !== rnIdFinal) {
          return Response.json(
            { error: 'El episodio URNI no pertenece al recién nacido especificado' },
            { status: 400 }
          )
        }
      }
    }

    // Preparar datos para actualizar
    const controlData = {}

    if (data.tipo !== undefined) {
      controlData.tipo = data.tipo
    }

    if (data.fechaHora !== undefined) {
      controlData.fechaHora = fechaHora
    }

    if (data.rnId !== undefined) {
      controlData.rnId = data.rnId
    }

    if (data.episodioUrniId !== undefined) {
      controlData.episodioUrniId = data.episodioUrniId
    }

    if (data.datos !== undefined) {
      if (data.datos === null) {
        controlData.datos = null
      } else {
        // Validar que datos es un objeto JSON válido
        try {
          const datosParsed = typeof data.datos === 'string' ? JSON.parse(data.datos) : data.datos
          controlData.datos = datosParsed
        } catch (error) {
          return Response.json(
            { error: 'El campo datos debe ser un JSON válido' },
            { status: 400 }
          )
        }
      }
    }

    if (data.observaciones !== undefined) {
      controlData.observaciones = data.observaciones ? data.observaciones.trim().substring(0, 500) : null
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar control en transacción con auditoría
    const controlActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar control
      const control = await tx.controlNeonatal.update({
        where: { id },
        data: controlData,
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
          episodioUrni: {
            select: {
              id: true,
              estado: true,
              fechaHoraIngreso: true,
            },
          },
          enfermera: {
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
          entidad: 'ControlNeonatal',
          entidadId: control.id,
          accion: 'UPDATE',
          detalleBefore: controlExistente,
          detalleAfter: control,
          ip,
          userAgent,
        },
      })

      return control
    })

    return Response.json({
      success: true,
      message: 'Control neonatal actualizado exitosamente',
      data: controlActualizado,
    })
  } catch (error) {
    console.error('Error al actualizar control neonatal:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'Referencia inválida en los datos proporcionados' },
        { status: 400 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un control neonatal
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const permissions = await getUserPermissions()
    if (!permissions.includes('control_neonatal:delete')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'ControlNeonatal',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para eliminar controles neonatales' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el control existe
    const controlExistente = await prisma.controlNeonatal.findUnique({
      where: { id },
      include: {
        rn: {
          include: {
            parto: {
              include: {
                madre: {
                  select: {
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!controlExistente) {
      return Response.json(
        { error: 'Control neonatal no encontrado' },
        { status: 404 }
      )
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Eliminar control en transacción con auditoría
    await prisma.$transaction(async (tx) => {
      // Registrar auditoría antes de eliminar
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'ControlNeonatal',
          entidadId: controlExistente.id,
          accion: 'DELETE',
          detalleBefore: controlExistente,
          ip,
          userAgent,
        },
      })

      // Eliminar control
      await tx.controlNeonatal.delete({
        where: { id },
      })
    })

    return Response.json({
      success: true,
      message: 'Control neonatal eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar control neonatal:', error)

    // Manejar error de constraint (si tiene registros asociados)
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'No se puede eliminar el control debido a restricciones de integridad' },
        { status: 409 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}




