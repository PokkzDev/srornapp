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

    // Validar valores numéricos si están presentes
    if (data.pesoGr !== undefined && data.pesoGr !== null && data.pesoGr !== '') {
      const pesoGr = parseInt(data.pesoGr)
      if (isNaN(pesoGr) || pesoGr < 0) {
        return Response.json(
          { error: 'El peso debe ser un número válido (gramos)' },
          { status: 400 }
        )
      }
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      const tallaCm = parseInt(data.tallaCm)
      if (isNaN(tallaCm) || tallaCm < 0) {
        return Response.json(
          { error: 'La talla debe ser un número válido (centímetros)' },
          { status: 400 }
        )
      }
    }

    if (data.apgar1 !== undefined && data.apgar1 !== null && data.apgar1 !== '') {
      const apgar1 = parseInt(data.apgar1)
      if (isNaN(apgar1) || apgar1 < 0 || apgar1 > 10) {
        return Response.json(
          { error: 'El Apgar 1\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    if (data.apgar5 !== undefined && data.apgar5 !== null && data.apgar5 !== '') {
      const apgar5 = parseInt(data.apgar5)
      if (isNaN(apgar5) || apgar5 < 0 || apgar5 > 10) {
        return Response.json(
          { error: 'El Apgar 5\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const rnData = {
      sexo: data.sexo,
      updatedById: user.id,
    }

    // Agregar campos opcionales
    if (data.pesoGr !== undefined && data.pesoGr !== null && data.pesoGr !== '') {
      rnData.pesoGr = parseInt(data.pesoGr)
    } else {
      rnData.pesoGr = null
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      rnData.tallaCm = parseInt(data.tallaCm)
    } else {
      rnData.tallaCm = null
    }

    if (data.apgar1 !== undefined && data.apgar1 !== null && data.apgar1 !== '') {
      rnData.apgar1 = parseInt(data.apgar1)
    } else {
      rnData.apgar1 = null
    }

    if (data.apgar5 !== undefined && data.apgar5 !== null && data.apgar5 !== '') {
      rnData.apgar5 = parseInt(data.apgar5)
    } else {
      rnData.apgar5 = null
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










