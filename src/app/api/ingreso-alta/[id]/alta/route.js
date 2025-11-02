import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to validate Alta completeness
async function validateAltaCompleteness(madreId) {
  const errors = []

  // Get mother with all related data
  const madre = await prisma.madre.findUnique({
    where: { id: madreId },
    include: {
      partos: {
        include: {
          recienNacidos: true,
        },
      },
    },
  })

  if (!madre) {
    return {
      isValid: false,
      errors: ['La madre no existe'],
    }
  }

  // Validate mother required fields
  if (!madre.rut || !madre.nombres || !madre.apellidos) {
    errors.push('La madre debe tener RUT, nombres y apellidos completos')
  }

  // Validate at least one birth exists
  if (!madre.partos || madre.partos.length === 0) {
    errors.push('Debe existir al menos un parto registrado')
  } else {
    // Validate each birth has required fields
    for (const parto of madre.partos) {
      if (!parto.fechaHora || !parto.tipo || !parto.lugar) {
        errors.push(`El parto del ${parto.fechaHora ? new Date(parto.fechaHora).toLocaleDateString() : 'fecha desconocida'} debe tener fecha/hora, tipo y lugar completos`)
      }

      // Validate each birth has at least one newborn
      if (!parto.recienNacidos || parto.recienNacidos.length === 0) {
        errors.push(`El parto del ${parto.fechaHora ? new Date(parto.fechaHora).toLocaleDateString() : 'fecha desconocida'} debe tener al menos un recién nacido registrado`)
      } else {
        // Validate each newborn has sexo
        for (const rn of parto.recienNacidos) {
          if (!rn.sexo) {
            errors.push(`El recién nacido del parto del ${parto.fechaHora ? new Date(parto.fechaHora).toLocaleDateString() : 'fecha desconocida'} debe tener sexo registrado`)
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

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
    if (!permissions.includes('ingreso_alta:alta') && !permissions.includes('ingreso_alta:manage')) {
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
        { error: 'No tiene permisos para procesar altas' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el episodio existe
    const episodio = await prisma.episodioMadre.findUnique({
      where: { id },
      include: {
        madre: true,
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

    // Parsear datos del request
    const data = await request.json()

    // Validar completitud antes de procesar alta
    const validation = await validateAltaCompleteness(episodio.madreId)

    if (!validation.isValid) {
      return Response.json(
        {
          error: 'No se puede procesar el alta. Faltan datos requeridos.',
          validation,
        },
        { status: 400 }
      )
    }

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
      message: 'Alta procesada exitosamente',
      data: episodioActualizado,
    })
  } catch (error) {
    console.error('Error al procesar alta:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

