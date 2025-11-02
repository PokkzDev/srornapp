import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un parto específico
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
    if (!permissions.includes('parto:view')) {
      return Response.json(
        { error: 'No tiene permisos para visualizar partos' },
        { status: 403 }
      )
    }

    const { id } = await params

    const parto = await prisma.parto.findUnique({
      where: { id },
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
        matronas: {
          select: {
            user: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        medicos: {
          select: {
            user: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        enfermeras: {
          select: {
            user: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        recienNacidos: {
          select: {
            id: true,
            sexo: true,
            pesoGr: true,
            tallaCm: true,
            apgar1: true,
            apgar5: true,
          },
        },
      },
    })

    if (!parto) {
      return Response.json(
        { error: 'Parto no encontrado' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: parto,
    })
  } catch (error) {
    console.error('Error al obtener parto:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un parto
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
    if (!permissions.includes('parto:update')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Parto',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para editar partos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el parto existe
    const partoExistente = await prisma.parto.findUnique({
      where: { id },
    })

    if (!partoExistente) {
      return Response.json(
        { error: 'Parto no encontrado' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.madreId || !data.fechaHora || !data.tipo || !data.lugar) {
      return Response.json(
        { error: 'Madre, fecha/hora, tipo y lugar son requeridos' },
        { status: 400 }
      )
    }

    // Validar que la madre existe
    const madre = await prisma.madre.findUnique({
      where: { id: data.madreId },
    })

    if (!madre) {
      return Response.json(
        { error: 'La madre especificada no existe' },
        { status: 404 }
      )
    }

    // Validar fechaHora
    const fechaHora = new Date(data.fechaHora)
    if (isNaN(fechaHora.getTime())) {
      return Response.json(
        { error: 'Fecha y hora inválida' },
        { status: 400 }
      )
    }

    // Validar tipo (enum)
    const tiposValidos = ['EUTOCICO', 'DISTOCICO', 'CESAREA_ELECTIVA', 'CESAREA_EMERGENCIA']
    if (!tiposValidos.includes(data.tipo)) {
      return Response.json(
        { error: 'Tipo de parto inválido' },
        { status: 400 }
      )
    }

    // Validar lugar (enum)
    const lugaresValidos = ['SALA_PARTO', 'PABELLON', 'DOMICILIO', 'OTRO']
    if (!lugaresValidos.includes(data.lugar)) {
      return Response.json(
        { error: 'Lugar de parto inválido' },
        { status: 400 }
      )
    }

    // Validar lugarDetalle si lugar es OTRO
    if (data.lugar === 'OTRO' && (!data.lugarDetalle || data.lugarDetalle.trim() === '')) {
      return Response.json(
        { error: 'Detalle del lugar es requerido cuando el lugar es OTRO' },
        { status: 400 }
      )
    }

    // Validar matronas si se proporcionan
    const matronasIds = Array.isArray(data.matronasIds) ? data.matronasIds : (data.matronaId ? [data.matronaId] : [])
    if (matronasIds.length > 0) {
      const matronas = await prisma.user.findMany({
        where: {
          id: { in: matronasIds },
          roles: {
            some: {
              role: {
                name: 'matrona',
              },
            },
          },
        },
      })
      if (matronas.length !== matronasIds.length) {
        return Response.json(
          { error: 'Una o más matronas especificadas no existen o no tienen el rol correcto' },
          { status: 404 }
        )
      }
    }

    // Validar medicos si se proporcionan
    const medicosIds = Array.isArray(data.medicosIds) ? data.medicosIds : (data.medicoId ? [data.medicoId] : [])
    if (medicosIds.length > 0) {
      const medicos = await prisma.user.findMany({
        where: {
          id: { in: medicosIds },
          roles: {
            some: {
              role: {
                name: 'medico',
              },
            },
          },
        },
      })
      if (medicos.length !== medicosIds.length) {
        return Response.json(
          { error: 'Uno o más médicos especificados no existen o no tienen el rol correcto' },
          { status: 404 }
        )
      }
    }

    // Validar enfermeras si se proporcionan
    const enfermerasIds = Array.isArray(data.enfermerasIds) ? data.enfermerasIds : []
    if (enfermerasIds.length > 0) {
      const enfermeras = await prisma.user.findMany({
        where: {
          id: { in: enfermerasIds },
          roles: {
            some: {
              role: {
                name: 'enfermera',
              },
            },
          },
        },
      })
      if (enfermeras.length !== enfermerasIds.length) {
        return Response.json(
          { error: 'Una o más enfermeras especificadas no existen o no tienen el rol correcto' },
          { status: 404 }
        )
      }
    }

    // Preparar datos para actualizar
    const partoData = {
      madreId: data.madreId,
      fechaHora: fechaHora,
      tipo: data.tipo,
      lugar: data.lugar,
      updatedById: user.id,
    }

    // Agregar campos opcionales
    if (data.lugar === 'OTRO') {
      partoData.lugarDetalle = data.lugarDetalle ? data.lugarDetalle.trim() : null
    } else {
      partoData.lugarDetalle = null
    }

    if (data.complicaciones !== undefined) {
      partoData.complicaciones = data.complicaciones ? data.complicaciones.trim().substring(0, 500) : null
    }

    if (data.observaciones !== undefined) {
      partoData.observaciones = data.observaciones ? data.observaciones.trim().substring(0, 500) : null
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar parto en transacción con auditoría
    const partoActualizado = await prisma.$transaction(async (tx) => {
      // Primero eliminar relaciones existentes y luego crear las nuevas
      await tx.partoMatrona.deleteMany({
        where: { partoId: id },
      })
      await tx.partoMedico.deleteMany({
        where: { partoId: id },
      })
      await tx.partoEnfermera.deleteMany({
        where: { partoId: id },
      })

      // Actualizar parto
      const parto = await tx.parto.update({
        where: { id },
        data: {
          ...partoData,
          // Crear nuevas relaciones
          matronas: matronasIds.length > 0 ? {
            create: matronasIds.map((userId) => ({ userId })),
          } : undefined,
          medicos: medicosIds.length > 0 ? {
            create: medicosIds.map((userId) => ({ userId })),
          } : undefined,
          enfermeras: enfermerasIds.length > 0 ? {
            create: enfermerasIds.map((userId) => ({ userId })),
          } : undefined,
        },
        include: {
          madre: {
            select: {
              id: true,
              rut: true,
              nombres: true,
              apellidos: true,
            },
          },
          matronas: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
          medicos: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
          enfermeras: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'Parto',
          entidadId: parto.id,
          accion: 'UPDATE',
          detalleBefore: partoExistente,
          detalleAfter: parto,
          ip,
          userAgent,
        },
      })

      return parto
    })

    return Response.json({
      success: true,
      message: 'Parto actualizado exitosamente',
      data: partoActualizado,
    })
  } catch (error) {
    console.error('Error al actualizar parto:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Error al actualizar el parto' },
        { status: 409 }
      )
    }

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

// DELETE - Eliminar un parto
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
    if (!permissions.includes('parto:delete')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Parto',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para eliminar partos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el parto existe
    const partoExistente = await prisma.parto.findUnique({
      where: { id },
      include: {
        recienNacidos: {
          take: 1, // Solo verificar si tiene recién nacidos
        },
      },
    })

    if (!partoExistente) {
      return Response.json(
        { error: 'Parto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga recién nacidos asociados (evitar eliminación en cascada)
    if (partoExistente.recienNacidos.length > 0) {
      return Response.json(
        { error: 'No se puede eliminar un parto que tiene recién nacidos registrados' },
        { status: 409 }
      )
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Eliminar parto en transacción con auditoría
    await prisma.$transaction(async (tx) => {
      // Registrar auditoría antes de eliminar
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'Parto',
          entidadId: partoExistente.id,
          accion: 'DELETE',
          detalleBefore: partoExistente,
          ip,
          userAgent,
        },
      })

      // Eliminar parto
      await tx.parto.delete({
        where: { id },
      })
    })

    return Response.json({
      success: true,
      message: 'Parto eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar parto:', error)

    // Manejar error de constraint (si tiene recién nacidos)
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'No se puede eliminar un parto que tiene recién nacidos registrados' },
        { status: 409 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

