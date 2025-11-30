import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un recién nacido específico
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
    if (!permissions.includes('recien-nacido:view')) {
      return Response.json(
        { error: 'No tiene permisos para visualizar recién nacidos' },
        { status: 403 }
      )
    }

    const { id } = await params

    const recienNacido = await prisma.recienNacido.findUnique({
      where: { id },
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
    })

    if (!recienNacido) {
      return Response.json(
        { error: 'Recién nacido no encontrado' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: recienNacido,
    })
  } catch (error) {
    console.error('Error al obtener recién nacido:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un recién nacido
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
    if (!permissions.includes('recien-nacido:update')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'RecienNacido',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para editar recién nacidos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el recién nacido existe
    const rnExistente = await prisma.recienNacido.findUnique({
      where: { id },
    })

    if (!rnExistente) {
      return Response.json(
        { error: 'Recién nacido no encontrado' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.sexo) {
      return Response.json(
        { error: 'Sexo es requerido' },
        { status: 400 }
      )
    }

    // Validar sexo (enum)
    const sexosValidos = ['M', 'F', 'I']
    if (!sexosValidos.includes(data.sexo)) {
      return Response.json(
        { error: 'Sexo inválido. Valores válidos: M, F, I' },
        { status: 400 }
      )
    }

    // Normalizar nombres de campos (aceptar ambos nombres antiguos y nuevos)
    const pesoNacimientoGramos = data.pesoNacimientoGramos !== undefined ? data.pesoNacimientoGramos : data.pesoGr
    const apgar1Min = data.apgar1Min !== undefined ? data.apgar1Min : data.apgar1
    const apgar5Min = data.apgar5Min !== undefined ? data.apgar5Min : data.apgar5

    // Validar valores numéricos si están presentes
    if (pesoNacimientoGramos !== undefined && pesoNacimientoGramos !== null && pesoNacimientoGramos !== '') {
      const peso = Number.parseInt(pesoNacimientoGramos)
      if (Number.isNaN(peso) || peso < 0) {
        return Response.json(
          { error: 'El peso debe ser un número válido (gramos)' },
          { status: 400 }
        )
      }
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      const tallaCm = Number.parseInt(data.tallaCm)
      if (Number.isNaN(tallaCm) || tallaCm < 0) {
        return Response.json(
          { error: 'La talla debe ser un número válido (centímetros)' },
          { status: 400 }
        )
      }
    }

    if (apgar1Min !== undefined && apgar1Min !== null && apgar1Min !== '') {
      const apgar1 = Number.parseInt(apgar1Min)
      if (Number.isNaN(apgar1) || apgar1 < 0 || apgar1 > 10) {
        return Response.json(
          { error: 'El Apgar 1\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    if (apgar5Min !== undefined && apgar5Min !== null && apgar5Min !== '') {
      const apgar5 = Number.parseInt(apgar5Min)
      if (Number.isNaN(apgar5) || apgar5 < 0 || apgar5 > 10) {
        return Response.json(
          { error: 'El Apgar 5\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar (usar nombres nuevos del schema)
    const rnData = {
      sexo: data.sexo,
      updatedById: user.id,
      // REM
      esNacidoVivo: data.esNacidoVivo !== undefined ? data.esNacidoVivo : rnExistente.esNacidoVivo !== undefined ? rnExistente.esNacidoVivo : true,
      categoriaPeso: data.categoriaPeso !== undefined ? (data.categoriaPeso || null) : rnExistente.categoriaPeso,
      // Anomalías congénitas
      anomaliaCongenita: data.anomaliaCongenita !== undefined ? (data.anomaliaCongenita || null) : rnExistente.anomaliaCongenita,
      anomaliaCongenitaDescripcion: data.anomaliaCongenita !== undefined 
        ? (data.anomaliaCongenita ? (data.anomaliaCongenitaDescripcion?.trim().substring(0, 500) || null) : null)
        : rnExistente.anomaliaCongenitaDescripcion,
      // Reanimación y EHI
      reanimacionBasica: data.reanimacionBasica !== undefined ? (data.reanimacionBasica || null) : rnExistente.reanimacionBasica,
      reanimacionAvanzada: data.reanimacionAvanzada !== undefined ? (data.reanimacionAvanzada || null) : rnExistente.reanimacionAvanzada,
      ehiGradoII_III: data.ehiGradoII_III !== undefined ? (data.ehiGradoII_III || null) : rnExistente.ehiGradoII_III,
      // Profilaxis inmediata
      profilaxisOcularGonorrea: data.profilaxisOcularGonorrea !== undefined ? (data.profilaxisOcularGonorrea || null) : rnExistente.profilaxisOcularGonorrea,
      profilaxisHepatitisB: data.profilaxisHepatitisB !== undefined ? (data.profilaxisHepatitisB || null) : rnExistente.profilaxisHepatitisB,
      profilaxisCompletaHepatitisB: data.profilaxisCompletaHepatitisB !== undefined ? (data.profilaxisCompletaHepatitisB || null) : rnExistente.profilaxisCompletaHepatitisB,
      // Transmisión vertical Hep B
      hijoMadreHepatitisBPositiva: data.hijoMadreHepatitisBPositiva !== undefined ? (data.hijoMadreHepatitisBPositiva || null) : rnExistente.hijoMadreHepatitisBPositiva,
      // Lactancia / contacto / alojamiento
      lactancia60Min: data.lactancia60Min !== undefined ? (data.lactancia60Min || null) : rnExistente.lactancia60Min,
      alojamientoConjuntoInmediato: data.alojamientoConjuntoInmediato !== undefined ? (data.alojamientoConjuntoInmediato || null) : rnExistente.alojamientoConjuntoInmediato,
      contactoPielPielInmediato: data.contactoPielPielInmediato !== undefined ? (data.contactoPielPielInmediato || null) : rnExistente.contactoPielPielInmediato,
      // Condición étnica/migrante
      esPuebloOriginario: data.esPuebloOriginario !== undefined ? (data.esPuebloOriginario || null) : rnExistente.esPuebloOriginario,
      esMigrante: data.esMigrante !== undefined ? (data.esMigrante || null) : rnExistente.esMigrante,
    }

    // Agregar campos numéricos (usar nombres nuevos)
    if (pesoNacimientoGramos !== undefined && pesoNacimientoGramos !== null && pesoNacimientoGramos !== '') {
      rnData.pesoNacimientoGramos = Number.parseInt(pesoNacimientoGramos)
    } else if (data.pesoNacimientoGramos === null || data.pesoGr === null) {
      rnData.pesoNacimientoGramos = null
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      rnData.tallaCm = Number.parseInt(data.tallaCm)
    } else if (data.tallaCm === null) {
      rnData.tallaCm = null
    }

    if (apgar1Min !== undefined && apgar1Min !== null && apgar1Min !== '') {
      rnData.apgar1Min = Number.parseInt(apgar1Min)
    } else if (data.apgar1Min === null || data.apgar1 === null) {
      rnData.apgar1Min = null
    }

    if (apgar5Min !== undefined && apgar5Min !== null && apgar5Min !== '') {
      rnData.apgar5Min = Number.parseInt(apgar5Min)
    } else if (data.apgar5Min === null || data.apgar5 === null) {
      rnData.apgar5Min = null
    }

    if (data.observaciones !== undefined) {
      rnData.observaciones = data.observaciones ? data.observaciones.trim().substring(0, 500) : null
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar recién nacido en transacción con auditoría
    const rnActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar recién nacido
      const rn = await tx.recienNacido.update({
        where: { id },
        data: rnData,
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
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'RecienNacido',
          entidadId: rn.id,
          accion: 'UPDATE',
          detalleBefore: rnExistente,
          detalleAfter: rn,
          ip,
          userAgent,
        },
      })

      return rn
    })

    return Response.json({
      success: true,
      message: 'Recién nacido actualizado exitosamente',
      data: rnActualizado,
    })
  } catch (error) {
    console.error('Error al actualizar recién nacido:', error)

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

// DELETE - Eliminar un recién nacido
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
    if (!permissions.includes('recien-nacido:delete')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'RecienNacido',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para eliminar recién nacidos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el recién nacido existe
    const rnExistente = await prisma.recienNacido.findUnique({
      where: { id },
      include: {
        episodios: {
          take: 1, // Solo verificar si tiene episodios
        },
        controles: {
          take: 1, // Solo verificar si tiene controles
        },
        atenciones: {
          take: 1, // Solo verificar si tiene atenciones
        },
      },
    })

    if (!rnExistente) {
      return Response.json(
        { error: 'Recién nacido no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga registros asociados (evitar eliminación en cascada)
    if (rnExistente.episodios.length > 0 || rnExistente.controles.length > 0 || 
        rnExistente.atenciones.length > 0) {
      return Response.json(
        { error: 'No se puede eliminar un recién nacido que tiene registros asociados (episodios, controles o atenciones)' },
        { status: 409 }
      )
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Eliminar recién nacido en transacción con auditoría
    await prisma.$transaction(async (tx) => {
      // Registrar auditoría antes de eliminar
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'RecienNacido',
          entidadId: rnExistente.id,
          accion: 'DELETE',
          detalleBefore: rnExistente,
          ip,
          userAgent,
        },
      })

      // Eliminar recién nacido
      await tx.recienNacido.delete({
        where: { id },
      })
    })

    return Response.json({
      success: true,
      message: 'Recién nacido eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar recién nacido:', error)

    // Manejar error de constraint (si tiene registros asociados)
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'No se puede eliminar un recién nacido que tiene registros asociados' },
        { status: 409 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}










