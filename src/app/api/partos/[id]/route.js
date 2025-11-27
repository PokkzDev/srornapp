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
            pesoNacimientoGramos: true,
            tallaCm: true,
            apgar1Min: true,
            apgar5Min: true,
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
        { error: 'Madre, fecha/hora, tipo de parto y lugar son requeridos' },
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

    // Validar que la fecha no sea mayor que la fecha y hora actual
    const fechaHoraActual = new Date()
    if (fechaHora > fechaHoraActual) {
      return Response.json(
        { error: 'La fecha y hora del parto no puede ser mayor que la fecha y hora actual' },
        { status: 400 }
      )
    }

    // Validar tipo (enum)
    const tiposValidos = ['VAGINAL', 'INSTRUMENTAL', 'CESAREA_ELECTIVA', 'CESAREA_URGENCIA', 'PREHOSPITALARIO', 'FUERA_RED', 'DOMICILIO_PROFESIONAL', 'DOMICILIO_SIN_PROFESIONAL']
    if (!tiposValidos.includes(data.tipo)) {
      return Response.json(
        { error: 'Tipo de parto inválido' },
        { status: 400 }
      )
    }

    // Usar lugar proporcionado (ya es requerido)
    const lugar = data.lugar

    // Validar lugar (enum)
    const lugaresValidos = ['SALA_PARTO', 'PABELLON', 'DOMICILIO', 'OTRO']
    if (!lugaresValidos.includes(lugar)) {
      return Response.json(
        { error: 'Lugar de parto inválido' },
        { status: 400 }
      )
    }

    // Usar lugarDetalle proporcionado
    const lugarDetalle = data.lugarDetalle || null

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
    
    // Validar al menos una matrona (obligatorio siempre)
    if (matronasIds.length === 0) {
      return Response.json(
        { error: 'Debe seleccionar al menos una matrona' },
        { status: 400 }
      )
    }

    // Validar al menos una enfermera (obligatorio siempre)
    if (enfermerasIds.length === 0) {
      return Response.json(
        { error: 'Debe seleccionar al menos una enfermera' },
        { status: 400 }
      )
    }

    // Validar al menos un médico si es cesárea (verificar tipo puro o contexto especial)
    const esCesarea = data.tipo === 'CESAREA_ELECTIVA' || data.tipo === 'CESAREA_URGENCIA'
    if (esCesarea && medicosIds.length === 0) {
      return Response.json(
        { error: 'Debe seleccionar al menos un médico cuando el tipo de parto es cesárea' },
        { status: 400 }
      )
    }

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
      lugar: lugar,
      updatedById: user.id,
    }

    // Agregar campos opcionales
    if (lugar === 'OTRO') {
      partoData.lugarDetalle = lugarDetalle ? lugarDetalle.trim() : null
    } else {
      partoData.lugarDetalle = null
    }

    if (data.fechaParto !== undefined) {
      if (data.fechaParto) {
        const fechaParto = new Date(data.fechaParto)
        if (!isNaN(fechaParto.getTime())) {
          partoData.fechaParto = fechaParto
        } else {
          partoData.fechaParto = null
        }
      } else {
        partoData.fechaParto = null
      }
    }

    if (data.establecimientoId !== undefined) {
      partoData.establecimientoId = data.establecimientoId ? data.establecimientoId.trim() : null
    }

    if (data.edadGestacionalSemanas !== undefined) {
      if (data.edadGestacionalSemanas !== null && data.edadGestacionalSemanas !== '') {
        const edadGestacional = parseInt(data.edadGestacionalSemanas)
        if (!isNaN(edadGestacional) && edadGestacional >= 0) {
          partoData.edadGestacionalSemanas = edadGestacional
        } else {
          partoData.edadGestacionalSemanas = null
        }
      } else {
        partoData.edadGestacionalSemanas = null
      }
    }

    if (data.tipoCursoParto !== undefined) {
      partoData.tipoCursoParto = (data.tipoCursoParto && ['EUTOCICO', 'DISTOCICO'].includes(data.tipoCursoParto)) ? data.tipoCursoParto : null
    }

    if (data.inicioTrabajoParto !== undefined) {
      partoData.inicioTrabajoParto = (data.inicioTrabajoParto && ['ESPONTANEO', 'INDUCIDO_MECANICO', 'INDUCIDO_FARMACOLOGICO'].includes(data.inicioTrabajoParto)) ? data.inicioTrabajoParto : null
    }

    if (data.conduccionOxitocica !== undefined) {
      partoData.conduccionOxitocica = data.conduccionOxitocica ? Boolean(data.conduccionOxitocica) : null
    }

    if (data.libertadMovimiento !== undefined) {
      partoData.libertadMovimiento = data.libertadMovimiento ? Boolean(data.libertadMovimiento) : null
    }

    if (data.regimenHidricoAmplio !== undefined) {
      partoData.regimenHidricoAmplio = data.regimenHidricoAmplio ? Boolean(data.regimenHidricoAmplio) : null
    }

    if (data.manejoDolorNoFarmacologico !== undefined) {
      partoData.manejoDolorNoFarmacologico = data.manejoDolorNoFarmacologico ? Boolean(data.manejoDolorNoFarmacologico) : null
    }

    if (data.manejoDolorFarmacologico !== undefined) {
      partoData.manejoDolorFarmacologico = data.manejoDolorFarmacologico ? Boolean(data.manejoDolorFarmacologico) : null
    }

    if (data.posicionExpulsivo !== undefined) {
      partoData.posicionExpulsivo = (data.posicionExpulsivo && ['LITOTOMIA', 'OTRAS'].includes(data.posicionExpulsivo)) ? data.posicionExpulsivo : null
    }

    if (data.episiotomia !== undefined) {
      partoData.episiotomia = data.episiotomia ? Boolean(data.episiotomia) : null
    }

    if (data.acompananteDuranteTrabajo !== undefined) {
      partoData.acompananteDuranteTrabajo = data.acompananteDuranteTrabajo ? Boolean(data.acompananteDuranteTrabajo) : null
    }

    if (data.acompananteSoloExpulsivo !== undefined) {
      partoData.acompananteSoloExpulsivo = data.acompananteSoloExpulsivo ? Boolean(data.acompananteSoloExpulsivo) : null
    }

    if (data.oxitocinaProfilactica !== undefined) {
      partoData.oxitocinaProfilactica = data.oxitocinaProfilactica ? Boolean(data.oxitocinaProfilactica) : null
    }

    if (data.ligaduraTardiaCordon !== undefined) {
      partoData.ligaduraTardiaCordon = data.ligaduraTardiaCordon ? Boolean(data.ligaduraTardiaCordon) : null
    }

    if (data.atencionPertinenciaCultural !== undefined) {
      partoData.atencionPertinenciaCultural = data.atencionPertinenciaCultural ? Boolean(data.atencionPertinenciaCultural) : null
    }

    if (data.contactoPielPielMadre30min !== undefined) {
      partoData.contactoPielPielMadre30min = data.contactoPielPielMadre30min ? Boolean(data.contactoPielPielMadre30min) : null
    }

    if (data.contactoPielPielAcomp30min !== undefined) {
      partoData.contactoPielPielAcomp30min = data.contactoPielPielAcomp30min ? Boolean(data.contactoPielPielAcomp30min) : null
    }

    if (data.lactancia60minAlMenosUnRn !== undefined) {
      partoData.lactancia60minAlMenosUnRn = data.lactancia60minAlMenosUnRn ? Boolean(data.lactancia60minAlMenosUnRn) : null
    }

    if (data.complicaciones !== undefined) {
      partoData.complicacionesTexto = data.complicaciones ? data.complicaciones.trim().substring(0, 500) : null
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

