import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse, successResponse, getAuditData, crearAuditoria } from '@/lib/api-helpers'
import {
  validarComplejidadPassword,
  hashPassword,
  formatearUsuario,
  USER_INCLUDE,
  validarEmailUnico,
  validarRutUnico,
  asignarRoles,
  actualizarRoles,
  tienePermisoUrni,
  construirWhereUsuarios,
  prepararActualizacion,
} from '@/lib/user-helpers'
import { getUserPermissions } from '@/lib/auth'

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'user:view', 'User', { skipPermissionCheck: true })
    if (auth.error && auth.errorStatus === 401) return auth.error

    const permissions = await getUserPermissions()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const esUrni = tienePermisoUrni(permissions, role)
    const tieneUserView = permissions.includes('user:view')

    if (!tieneUserView && !esUrni) {
      return errorResponse('No tiene permisos para ver usuarios', 403)
    }

    const where = construirWhereUsuarios(role, esUrni, tieneUserView)

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rut: true,
        activo: true,
        roles: {
          select: { role: { select: { name: true } } },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    const formattedUsers = users.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rut: u.rut,
      activo: u.activo,
      roles: u.roles.map((ur) => ur.role.name),
    }))

    return successResponse(formattedUsers)
  } catch (error) {
    console.error('Error al listar usuarios:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'user:create', 'User')
    if (auth.error) return auth.error

    const { rut, nombre, email, password, roles } = await request.json()

    if (!nombre || !email || !password) {
      return errorResponse('Nombre, email y contraseña son requeridos', 400)
    }

    const validacionPassword = validarComplejidadPassword(password)
    if (!validacionPassword.valida) {
      return errorResponse(validacionPassword.error, 400)
    }

    const emailVal = await validarEmailUnico(prisma, email)
    if (!emailVal.valido) {
      return errorResponse(emailVal.error, 400)
    }

    const rutVal = await validarRutUnico(prisma, rut)
    if (!rutVal.valido) {
      return errorResponse(rutVal.error, 400)
    }

    const passwordHash = await hashPassword(password)

    const nuevoUsuario = await prisma.user.create({
      data: {
        rut: rut ? rut.trim() : null,
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        activo: true,
      },
    })

    await asignarRoles(prisma, nuevoUsuario.id, roles)

    const usuarioCompleto = await prisma.user.findUnique({
      where: { id: nuevoUsuario.id },
      include: USER_INCLUDE,
    })

    // Registrar auditoría
    const auditData = getAuditData(request)
    await crearAuditoria(prisma, {
      usuarioId: auth.dbUser.id,
      rol: auth.user?.roles ? (Array.isArray(auth.user.roles) ? auth.user.roles.join(', ') : auth.user.roles) : null,
      entidad: 'User',
      entidadId: nuevoUsuario.id,
      accion: 'CREATE',
      detalleAfter: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rut: nuevoUsuario.rut,
        roles: roles || [],
      },
      ...auditData,
    })

    return Response.json({
      success: true,
      data: formatearUsuario(usuarioCompleto),
    }, { status: 201 })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function PUT(request) {
  try {
    const auth = await verificarAuth(request, 'user:update', 'User')
    if (auth.error) return auth.error

    const { id, roles, ...data } = await request.json()

    if (!id) {
      return errorResponse('ID de usuario es requerido', 400)
    }

    const usuarioExistente = await prisma.user.findUnique({ where: { id } })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

    // Guardar estado anterior para auditoría
    const usuarioAnterior = await prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    })
    const estadoAnterior = usuarioAnterior ? formatearUsuario(usuarioAnterior) : null

    const actualizacion = await prepararActualizacion(data, id, prisma)
    if (actualizacion.error) {
      return errorResponse(actualizacion.error, 400)
    }

    await prisma.user.update({
      where: { id },
      data: actualizacion.datos,
    })

    await actualizarRoles(prisma, id, roles)

    const usuarioCompleto = await prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    })

    // Registrar auditoría
    const auditData = getAuditData(request)
    await crearAuditoria(prisma, {
      usuarioId: auth.dbUser.id,
      rol: auth.user?.roles ? (Array.isArray(auth.user.roles) ? auth.user.roles.join(', ') : auth.user.roles) : null,
      entidad: 'User',
      entidadId: id,
      accion: 'UPDATE',
      detalleBefore: estadoAnterior,
      detalleAfter: formatearUsuario(usuarioCompleto),
      ...auditData,
    })

    return successResponse(formatearUsuario(usuarioCompleto))
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function DELETE(request) {
  try {
    const auth = await verificarAuth(request, 'user:delete', 'User')
    if (auth.error) return auth.error
    const { user } = auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('ID de usuario es requerido', 400)
    }

    if (user.id === id) {
      return errorResponse('No puede eliminar su propia cuenta', 400)
    }

    const usuarioExistente = await prisma.user.findUnique({ 
      where: { id },
      include: USER_INCLUDE,
    })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

    // Guardar datos para auditoría antes de eliminar
    const usuarioEliminado = formatearUsuario(usuarioExistente)

    await prisma.user.delete({ where: { id } })

    // Registrar auditoría
    const auditData = getAuditData(request)
    await crearAuditoria(prisma, {
      usuarioId: auth.dbUser.id,
      rol: auth.user?.roles ? (Array.isArray(auth.user.roles) ? auth.user.roles.join(', ') : auth.user.roles) : null,
      entidad: 'User',
      entidadId: id,
      accion: 'DELETE',
      detalleBefore: usuarioEliminado,
      ...auditData,
    })

    return successResponse(null, 'Usuario eliminado correctamente')
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}