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
    if (!permissions.includes('ingreso_alta:view') && !permissions.includes('ingreso_alta:manage')) {
      return Response.json(
        { error: 'No tiene permisos para visualizar ingresos/altas' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obtener episodio con datos relacionados
    const episodio = await prisma.episodioMadre.findUnique({
      where: { id },
      include: {
        madre: {
          include: {
            partos: {
              include: {
                recienNacidos: true,
              },
              orderBy: {
                fechaHora: 'desc',
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            nombre: true,
            email: true,
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

    // Validate completeness if estado is INGRESADO
    let validation = null
    if (episodio.estado === 'INGRESADO') {
      validation = await validateAltaCompleteness(episodio.madreId)
    }

    return Response.json({
      success: true,
      data: episodio,
      validation,
    })
  } catch (error) {
    console.error('Error al obtener episodio:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
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
    if (!permissions.includes('ingreso_alta:update') && !permissions.includes('ingreso_alta:manage')) {
      return Response.json(
        { error: 'No tiene permisos para editar ingresos/altas' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el episodio existe
    const episodioExistente = await prisma.episodioMadre.findUnique({
      where: { id },
    })

    if (!episodioExistente) {
      return Response.json(
        { error: 'Episodio no encontrado' },
        { status: 404 }
      )
    }

    // No permitir editar si ya está dado de alta
    if (episodioExistente.estado === 'ALTA') {
      return Response.json(
        { error: 'No se puede editar un episodio que ya fue dado de alta' },
        { status: 400 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Preparar datos para actualizar
    const updateData = {
      updatedById: user.id,
    }

    // Solo permitir actualizar ciertos campos antes del alta
    if (data.fechaIngreso) {
      const fechaIngreso = new Date(data.fechaIngreso)
      if (isNaN(fechaIngreso.getTime())) {
        return Response.json(
          { error: 'Fecha de ingreso inválida' },
          { status: 400 }
        )
      }
      updateData.fechaIngreso = fechaIngreso
    }

    if (data.motivoIngreso !== undefined) {
      updateData.motivoIngreso = data.motivoIngreso ? data.motivoIngreso.trim().substring(0, 300) : null
    }

    if (data.hospitalAnterior !== undefined) {
      updateData.hospitalAnterior = data.hospitalAnterior ? data.hospitalAnterior.trim().substring(0, 200) : null
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar episodio en transacción con auditoría
    const episodio = await prisma.$transaction(async (tx) => {
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
      message: 'Episodio actualizado exitosamente',
      data: episodio,
    })
  } catch (error) {
    console.error('Error al actualizar episodio:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

