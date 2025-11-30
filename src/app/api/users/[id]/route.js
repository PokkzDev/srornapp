import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse, successResponse, getAuditData, crearAuditoria } from '@/lib/api-helpers'
import {
  formatearUsuario,
  USER_INCLUDE,
  actualizarRoles,
  prepararActualizacion,
} from '@/lib/user-helpers'

export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'user:view', 'User')
    if (auth.error) return auth.error

    const { id } = await params

    const usuario = await prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    })

    if (!usuario) {
      return errorResponse('Usuario no encontrado', 404)
    }

    return successResponse(formatearUsuario(usuario))
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'user:update', 'User')
    if (auth.error) return auth.error

    const { id } = await params
    const { roles, ...data } = await request.json()

    const usuarioExistente = await prisma.user.findUnique({ 
      where: { id },
      include: USER_INCLUDE,
    })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

    // Guardar estado anterior para auditoría
    const estadoAnterior = formatearUsuario(usuarioExistente)

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

export async function DELETE(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'user:delete', 'User')
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

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

export async function PATCH(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'user:manage', 'User')
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params
    const { activo } = await request.json()

    if (user.id === id && activo === false) {
      return errorResponse('No puede desactivar su propia cuenta', 400)
    }

    const usuarioExistente = await prisma.user.findUnique({ 
      where: { id },
      include: USER_INCLUDE,
    })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

    // Guardar estado anterior para auditoría
    const estadoAnterior = {
      id: usuarioExistente.id,
      nombre: usuarioExistente.nombre,
      activo: usuarioExistente.activo,
    }

    const usuarioActualizado = await prisma.user.update({
      where: { id },
      data: { activo: activo === true },
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
      detalleAfter: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        activo: usuarioActualizado.activo,
        cambio: activo ? 'Cuenta activada' : 'Cuenta bloqueada',
      },
      ...auditData,
    })

    return successResponse({
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      email: usuarioActualizado.email,
      rut: usuarioActualizado.rut,
      activo: usuarioActualizado.activo,
    })
  } catch (error) {
    console.error('Error al actualizar estado de usuario:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}







