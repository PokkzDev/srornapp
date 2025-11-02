import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Función para validar RUT chileno (formato: sin puntos, con guion)
function validarRUT(rut) {
  if (!rut || typeof rut !== 'string') {
    return false
  }

  // Formato esperado: números seguidos de guion y dígito verificador
  const rutRegex = /^(\d{7,8})-(\d|k|K)$/
  if (!rutRegex.test(rut)) {
    return false
  }

  // Separar número y dígito verificador
  const [numero, dv] = rut.split('-')
  const dvUpper = dv.toUpperCase()

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  // Sumar desde el final
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  let dvCalculado = 11 - resto

  if (dvCalculado === 11) {
    dvCalculado = '0'
  } else if (dvCalculado === 10) {
    dvCalculado = 'K'
  } else {
    dvCalculado = dvCalculado.toString()
  }

  return dvUpper === dvCalculado
}

// GET - Obtener una madre específica
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
    const hasViewPermission = permissions.includes('madre:view') || permissions.includes('madre:view_limited')
    if (!hasViewPermission) {
      return Response.json(
        { error: 'No tiene permisos para visualizar madres' },
        { status: 403 }
      )
    }

    const isLimited = permissions.includes('madre:view_limited') && !permissions.includes('madre:view')

    const { id } = await params

    // Si tiene permisos limitados, excluir relaciones con partos y recién nacidos
    const madre = isLimited ? await prisma.madre.findUnique({
      where: { id },
      select: {
        id: true,
        rut: true,
        nombres: true,
        apellidos: true,
        edad: true,
        fechaNacimiento: true,
        direccion: true,
        telefono: true,
        fichaClinica: true,
        createdAt: true,
        updatedAt: true,
      },
    }) : await prisma.madre.findUnique({
      where: { id },
      include: {
        partos: {
          orderBy: { fechaHora: 'desc' },
          take: 10, // Solo últimos 10 partos
        },
      },
    })

    if (!madre) {
      return Response.json(
        { error: 'Madre no encontrada' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: madre,
    })
  } catch (error) {
    console.error('Error al obtener madre:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una madre
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
    const hasUpdatePermission = permissions.includes('madre:update') || permissions.includes('madre:update_limited')
    if (!hasUpdatePermission) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Madre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para editar madres' },
        { status: 403 }
      )
    }

    const isLimited = permissions.includes('madre:update_limited') && !permissions.includes('madre:update')

    const { id } = await params

    // Verificar que la madre existe
    const madreExistente = await prisma.madre.findUnique({
      where: { id },
    })

    if (!madreExistente) {
      return Response.json(
        { error: 'Madre no encontrada' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.rut || !data.nombres || !data.apellidos) {
      return Response.json(
        { error: 'RUT, nombres y apellidos son requeridos' },
        { status: 400 }
      )
    }

    // Si tiene permisos limitados, validar que solo se envíen campos permitidos
    if (isLimited) {
      const allowedFields = ['rut', 'nombres', 'apellidos', 'edad', 'fechaNacimiento', 'direccion', 'telefono', 'fichaClinica']
      const providedFields = Object.keys(data)
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field))
      
      if (invalidFields.length > 0) {
        return Response.json(
          { error: `No tiene permisos para modificar los siguientes campos: ${invalidFields.join(', ')}` },
          { status: 403 }
        )
      }
    }

    // Validar formato RUT
    if (!validarRUT(data.rut)) {
      return Response.json(
        { error: 'RUT inválido. Formato esperado: 12345678-9 (sin puntos, con guion)' },
        { status: 400 }
      )
    }

    // Normalizar RUT (mayúsculas en dígito verificador)
    const rutNormalizado = data.rut.toUpperCase()

    // Validar que el RUT no exista en otra madre
    if (rutNormalizado !== madreExistente.rut) {
      const rutExistente = await prisma.madre.findUnique({
        where: { rut: rutNormalizado },
      })

      if (rutExistente) {
        return Response.json(
          { error: 'Ya existe otra madre registrada con este RUT' },
          { status: 409 }
        )
      }
    }

    // Si se proporciona ficha clínica, validar que sea única (si cambió)
    if (data.fichaClinica && data.fichaClinica !== madreExistente.fichaClinica) {
      const fichaExistente = await prisma.madre.findUnique({
        where: { fichaClinica: data.fichaClinica },
      })

      if (fichaExistente) {
        return Response.json(
          { error: 'Ya existe otra madre registrada con esta ficha clínica' },
          { status: 409 }
        )
      }
    }

    // Preparar datos para actualizar
    const madreData = {
      rut: rutNormalizado,
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      updatedById: user.id,
    }

    // Agregar campos opcionales
    if (data.edad !== undefined && data.edad !== null && data.edad !== '') {
      madreData.edad = parseInt(data.edad)
      if (isNaN(madreData.edad) || madreData.edad < 0) {
        return Response.json(
          { error: 'La edad debe ser un número válido' },
          { status: 400 }
        )
      }
    } else {
      madreData.edad = null
    }

    if (data.fechaNacimiento) {
      madreData.fechaNacimiento = new Date(data.fechaNacimiento)
      if (isNaN(madreData.fechaNacimiento.getTime())) {
        return Response.json(
          { error: 'Fecha de nacimiento inválida' },
          { status: 400 }
        )
      }
    } else {
      madreData.fechaNacimiento = null
    }

    if (data.direccion) {
      madreData.direccion = data.direccion.trim()
    } else {
      madreData.direccion = null
    }

    if (data.telefono) {
      madreData.telefono = data.telefono.trim()
    } else {
      madreData.telefono = null
    }

    if (data.fichaClinica) {
      madreData.fichaClinica = data.fichaClinica.trim()
    } else {
      madreData.fichaClinica = null
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Actualizar madre en transacción con auditoría
    const madreActualizada = await prisma.$transaction(async (tx) => {
      // Actualizar madre
      const madre = await tx.madre.update({
        where: { id },
        data: madreData,
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'Madre',
          entidadId: madre.id,
          accion: 'UPDATE',
          detalleBefore: madreExistente,
          detalleAfter: madre,
          ip,
          userAgent,
        },
      })

      return madre
    })

    return Response.json({
      success: true,
      message: 'Madre actualizada exitosamente',
      data: madreActualizada,
    })
  } catch (error) {
    console.error('Error al actualizar madre:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('rut')) {
        return Response.json(
          { error: 'Ya existe otra madre registrada con este RUT' },
          { status: 409 }
        )
      }
      if (error.meta?.target?.includes('fichaClinica')) {
        return Response.json(
          { error: 'Ya existe otra madre registrada con esta ficha clínica' },
          { status: 409 }
        )
      }
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una madre
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
    const hasDeletePermission = permissions.includes('madre:delete') || permissions.includes('madre:delete_limited')
    if (!hasDeletePermission) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Madre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para eliminar madres' },
        { status: 403 }
      )
    }

    const isLimited = permissions.includes('madre:delete_limited') && !permissions.includes('madre:delete')

    const { id } = await params

    // Verificar que la madre existe
    const madreExistente = await prisma.madre.findUnique({
      where: { id },
      include: {
        partos: {
          take: 1, // Solo verificar si tiene partos
          include: {
            recienNacidos: {
              take: 1, // Solo verificar si tiene RN
            },
          },
        },
      },
    })

    if (!madreExistente) {
      return Response.json(
        { error: 'Madre no encontrada' },
        { status: 404 }
      )
    }

    // Si tiene permisos limitados, validar que no tenga partos ni recién nacidos
    if (isLimited) {
      const tienePartos = madreExistente.partos.length > 0
      const tieneRN = madreExistente.partos.some(parto => parto.recienNacidos.length > 0)
      
      if (tienePartos || tieneRN) {
        return Response.json(
          { error: 'No se puede eliminar una madre que tiene partos o recién nacidos registrados' },
          { status: 409 }
        )
      }
    }

    // Verificar que no tenga partos asociados (evitar eliminación en cascada)
    if (madreExistente.partos.length > 0) {
      return Response.json(
        { error: 'No se puede eliminar una madre que tiene partos registrados' },
        { status: 409 }
      )
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Eliminar madre en transacción con auditoría
    await prisma.$transaction(async (tx) => {
      // Registrar auditoría antes de eliminar
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'Madre',
          entidadId: madreExistente.id,
          accion: 'DELETE',
          detalleBefore: madreExistente,
          ip,
          userAgent,
        },
      })

      // Eliminar madre
      await tx.madre.delete({
        where: { id },
      })
    })

    return Response.json({
      success: true,
      message: 'Madre eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar madre:', error)

    // Manejar error de constraint (si tiene partos)
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'No se puede eliminar una madre que tiene partos registrados' },
        { status: 409 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



