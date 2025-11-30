import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse, successResponse } from '@/lib/api-helpers'

const ROLES_VALIDOS = ['matrona', 'medico', 'enfermera']

export async function GET(request) {
  try {
    const auth = await verificarAuth(
      request,
      ['parto:create', 'parto:update'],
      'Profesional',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role || !ROLES_VALIDOS.includes(role)) {
      return errorResponse('Rol inválido. Debe ser: matrona, medico o enfermera', 400)
    }

    const users = await prisma.user.findMany({
      where: {
        activo: true,
        roles: { some: { role: { name: role } } },
      },
      select: { id: true, nombre: true, email: true, rut: true },
      orderBy: { nombre: 'asc' },
    })

    return successResponse(users)
  } catch (error) {
    console.error('Error al obtener profesionales:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

