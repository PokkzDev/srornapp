import bcrypt from 'bcryptjs'

/**
 * Valida la complejidad de la contraseña
 */
export function validarComplejidadPassword(password) {
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
  
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    return { valida: false, error: 'La contraseña debe contener al menos un símbolo especial' }
  }
  
  return { valida: true, error: '' }
}

/**
 * Hashea una contraseña
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

/**
 * Formatea un usuario para respuesta
 */
export function formatearUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rut: usuario.rut,
    activo: usuario.activo,
    roles: usuario.roles?.map((ur) => ur.role.name) || [],
  }
}

/**
 * Include básico para usuarios
 */
export const USER_INCLUDE = {
  roles: {
    include: {
      role: true,
    },
  },
}

/**
 * Valida email único
 */
export async function validarEmailUnico(prisma, email, excludeId = null) {
  const existente = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (existente && (!excludeId || existente.id !== excludeId)) {
    return { valido: false, error: 'El email ya está en uso' }
  }
  return { valido: true }
}

/**
 * Valida RUT único
 */
export async function validarRutUnico(prisma, rut, excludeId = null) {
  if (!rut) return { valido: true }
  
  const existente = await prisma.user.findUnique({
    where: { rut: rut.trim() },
  })

  if (existente && (!excludeId || existente.id !== excludeId)) {
    return { valido: false, error: 'El RUT ya está en uso' }
  }
  return { valido: true }
}

/**
 * Asigna roles a un usuario
 */
export async function asignarRoles(prisma, userId, roles) {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return

  const rolesEncontrados = await prisma.role.findMany({
    where: { name: { in: roles } },
  })

  await prisma.userRole.createMany({
    data: rolesEncontrados.map((role) => ({
      userId,
      roleId: role.id,
    })),
  })
}

/**
 * Actualiza roles de un usuario
 */
export async function actualizarRoles(prisma, userId, roles) {
  if (!roles || !Array.isArray(roles)) return

  // Eliminar roles existentes
  await prisma.userRole.deleteMany({ where: { userId } })

  // Asignar nuevos roles
  if (roles.length > 0) {
    await asignarRoles(prisma, userId, roles)
  }
}

/**
 * Verifica permisos URNI para listar médicos
 */
export function tienePermisoUrni(permissions, role) {
  if (role !== 'medico') return false
  
  return (
    permissions.includes('urni:episodio:create') || 
    permissions.includes('urni:episodio:update') ||
    permissions.includes('urni:read') ||
    permissions.includes('urni:episodio:view')
  )
}

/**
 * Construye where para listar usuarios
 */
export function construirWhereUsuarios(role, tienePermisoUrni, tieneUserView) {
  const where = {}
  
  // Si viene de URNI sin user:view, solo mostrar activos
  if (tienePermisoUrni && !tieneUserView) {
    where.activo = true
  }

  // Filtrar por rol si se especifica
  if (role) {
    where.roles = {
      some: {
        role: { name: role },
      },
    }
  }

  return where
}

/**
 * Prepara datos de actualización de usuario
 */
export async function prepararActualizacion(data, userId, prisma) {
  const { rut, nombre, email, password } = data
  const datosActualizacion = {}

  if (nombre) {
    datosActualizacion.nombre = nombre.trim()
  }

  if (email) {
    const emailVal = await validarEmailUnico(prisma, email, userId)
    if (!emailVal.valido) {
      return { error: emailVal.error }
    }
    datosActualizacion.email = email.toLowerCase().trim()
  }

  if (rut !== undefined) {
    if (rut === null || rut === '') {
      datosActualizacion.rut = null
    } else {
      const rutVal = await validarRutUnico(prisma, rut, userId)
      if (!rutVal.valido) {
        return { error: rutVal.error }
      }
      datosActualizacion.rut = rut.trim()
    }
  }

  if (password) {
    const validacionPassword = validarComplejidadPassword(password)
    if (!validacionPassword.valida) {
      return { error: validacionPassword.error }
    }
    datosActualizacion.passwordHash = await hashPassword(password)
  }

  return { datos: datosActualizacion }
}
