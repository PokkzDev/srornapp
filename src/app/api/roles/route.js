import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse, successResponse } from '@/lib/api-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, null, 'Role', { skipPermissionCheck: true })
    if (auth.error) return auth.error

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    })

    return successResponse(roles)
  } catch (error) {
    console.error('Error al listar roles:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}









