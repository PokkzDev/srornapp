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

export async function GET(request) {
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
    
    // Obtener parámetro de filtro por rol
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'matrona', 'medico', 'enfermera'
    
    // Si se solicita con role=medico y el usuario tiene permisos de URNI, permitir acceso
    const tienePermisoUrni = 
      role === 'medico' && (
        permissions.includes('urni:episodio:create') || 
        permissions.includes('urni:episodio:update') ||
        permissions.includes('urni:read') ||
        permissions.includes('urni:episodio:view')
      )
    
    // Si no tiene permiso user:view ni permisos de URNI (cuando role=medico), denegar acceso
    if (!permissions.includes('user:view') && !tienePermisoUrni) {
      return Response.json(
        { error: 'No tiene permisos para ver usuarios' },
        { status: 403 }
      )
    }

    // Construir query base
    let where = {}
    
    // Si se solicita con role=medico desde URNI sin permiso user:view, solo mostrar usuarios activos
    // Si tiene permiso user:view, mostrar todos (activos e inactivos)
    if (tienePermisoUrni && !permissions.includes('user:view')) {
      where.activo = true
    }

    // Si se especifica un rol, filtrar usuarios que tengan ese rol
    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      }
    }

    // Obtener usuarios con sus roles
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rut: true,
        activo: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    })

    // Formatear datos para incluir nombres de roles
    const formattedUsers = users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rut: user.rut,
      activo: user.activo,
      roles: user.roles.map((ur) => ur.role.name),
    }))

    return Response.json({
      success: true,
      data: formattedUsers,
    })
  } catch (error) {
    console.error('Error al listar usuarios:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
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
    if (!permissions.includes('user:create')) {
      return Response.json(
        { error: 'No tiene permisos para crear usuarios' },
        { status: 403 }
      )
    }

    const { rut, nombre, email, password, roles } = await request.json()

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return Response.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validar complejidad de contraseña
    const validacionPassword = validarComplejidadPassword(password)
    if (!validacionPassword.valida) {
      return Response.json(
        { error: validacionPassword.error },
        { status: 400 }
      )
    }

    // Validar email único
    const emailExistente = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (emailExistente) {
      return Response.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      )
    }

    // Validar RUT único si se proporciona
    if (rut) {
      const rutExistente = await prisma.user.findUnique({
        where: { rut: rut.trim() },
      })

      if (rutExistente) {
        return Response.json(
          { error: 'El RUT ya está en uso' },
          { status: 400 }
        )
      }
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Crear usuario
    const nuevoUsuario = await prisma.user.create({
      data: {
        rut: rut ? rut.trim() : null,
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        activo: true,
      },
    })

    // Asignar roles si se proporcionan
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // Obtener IDs de roles
      const rolesEncontrados = await prisma.role.findMany({
        where: {
          name: {
            in: roles,
          },
        },
      })

      // Crear relaciones UserRole
      await prisma.userRole.createMany({
        data: rolesEncontrados.map((role) => ({
          userId: nuevoUsuario.id,
          roleId: role.id,
        })),
      })
    }

    // Obtener usuario con roles para respuesta
    const usuarioCompleto = await prisma.user.findUnique({
      where: { id: nuevoUsuario.id },
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
    }, { status: 201 })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
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

    const { id, rut, nombre, email, password, roles } = await request.json()

    if (!id) {
      return Response.json(
        { error: 'ID de usuario es requerido' },
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

    if (rut) {
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
    const usuarioActualizado = await prisma.user.update({
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

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      )
    }

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

