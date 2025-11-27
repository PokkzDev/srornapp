import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Función para validar complejidad de contraseña
function validarComplejidadPassword(password) {
  if (!password || password.length < 8) {
    return { valida: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valida: false, error: 'La contraseña debe contener al menos una mayúscula' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { valida: false, error: 'La contraseña debe contener al menos una minúscula' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valida: false, error: 'La contraseña debe contener al menos un número' }
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { valida: false, error: 'La contraseña debe contener al menos un símbolo especial' }
  }
  
  return { valida: true, error: '' }
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
    if (!permissions.includes('user:view')) {
      return Response.json(
        { error: 'No tiene permisos para ver usuarios' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obtener usuario con roles
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!usuario) {
      return Response.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rut: usuario.rut,
        activo: usuario.activo,
        roles: usuario.roles.map((ur) => ur.role.name),
      },
    })
  } catch (error) {
    console.error('Error al obtener usuario:', error)
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
    if (!permissions.includes('user:update')) {
      return Response.json(
        { error: 'No tiene permisos para actualizar usuarios' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { rut, nombre, email, password, roles } = await request.json()

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { id },
    })

    if (!usuarioExistente) {
      return Response.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const datosActualizacion = {}

    if (nombre) {
      datosActualizacion.nombre = nombre.trim()
    }

    if (email) {
      const emailLower = email.toLowerCase().trim()
      // Validar email único (excepto para el mismo usuario)
      const emailExistente = await prisma.user.findUnique({
        where: { email: emailLower },
      })

      if (emailExistente && emailExistente.id !== id) {
        return Response.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        )
      }

      datosActualizacion.email = emailLower
    }

    if (rut !== undefined) {
      if (rut === null || rut === '') {
        datosActualizacion.rut = null
      } else {
        // Validar RUT único (excepto para el mismo usuario)
        const rutExistente = await prisma.user.findUnique({
          where: { rut: rut.trim() },
        })

        if (rutExistente && rutExistente.id !== id) {
          return Response.json(
            { error: 'El RUT ya está en uso' },
            { status: 400 }
          )
        }

        datosActualizacion.rut = rut.trim()
      }
    }

    if (password) {
      // Validar complejidad de contraseña
      const validacionPassword = validarComplejidadPassword(password)
      if (!validacionPassword.valida) {
        return Response.json(
          { error: validacionPassword.error },
          { status: 400 }
        )
      }

      datosActualizacion.passwordHash = await bcrypt.hash(password, 10)
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id },
      data: datosActualizacion,
    })

    // Actualizar roles si se proporcionan
    if (roles && Array.isArray(roles)) {
      // Eliminar roles existentes
      await prisma.userRole.deleteMany({
        where: { userId: id },
      })

      // Asignar nuevos roles
      if (roles.length > 0) {
        const rolesEncontrados = await prisma.role.findMany({
          where: {
            name: {
              in: roles,
            },
          },
        })

        await prisma.userRole.createMany({
          data: rolesEncontrados.map((role) => ({
            userId: id,
            roleId: role.id,
          })),
        })
      }
    }

    // Obtener usuario actualizado con roles
    const usuarioCompleto = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return Response.json({
      success: true,
      data: {
        id: usuarioCompleto.id,
        nombre: usuarioCompleto.nombre,
        email: usuarioCompleto.email,
        rut: usuarioCompleto.rut,
        activo: usuarioCompleto.activo,
        roles: usuarioCompleto.roles.map((ur) => ur.role.name),
      },
    })
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
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
    if (!permissions.includes('user:delete')) {
      return Response.json(
        { error: 'No tiene permisos para eliminar usuarios' },
        { status: 403 }
      )
    }

    const { id } = await params

    // No permitir auto-eliminación
    if (user.id === id) {
      return Response.json(
        { error: 'No puede eliminar su propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { id },
    })

    if (!usuarioExistente) {
      return Response.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar usuario (las relaciones se eliminan en cascada)
    await prisma.user.delete({
      where: { id },
    })

    return Response.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
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
    if (!permissions.includes('user:manage')) {
      return Response.json(
        { error: 'No tiene permisos para gestionar usuarios' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { activo } = await request.json()

    // No permitir auto-desactivación
    if (user.id === id && activo === false) {
      return Response.json(
        { error: 'No puede desactivar su propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { id },
    })

    if (!usuarioExistente) {
      return Response.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar estado activo
    const usuarioActualizado = await prisma.user.update({
      where: { id },
      data: { activo: activo === true },
    })

    return Response.json({
      success: true,
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        rut: usuarioActualizado.rut,
        activo: usuarioActualizado.activo,
      },
    })
  } catch (error) {
    console.error('Error al actualizar estado de usuario:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}









