import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse, successResponse } from '@/lib/api-helpers'
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

    const usuarioExistente = await prisma.user.findUnique({ where: { id } })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

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

    const usuarioExistente = await prisma.user.findUnique({ where: { id } })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

    await prisma.user.delete({ where: { id } })

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

    const usuarioExistente = await prisma.user.findUnique({ where: { id } })
    if (!usuarioExistente) {
      return errorResponse('Usuario no encontrado', 404)
    }

    const usuarioActualizado = await prisma.user.update({
      where: { id },
      data: { activo: activo === true },
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







