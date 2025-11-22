import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener profesionales por rol para el módulo de partos
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

    // Verificar permisos de parto (create o update)
    const permissions = await getUserPermissions()
    const tienePermisoParto = permissions.includes('parto:create') || permissions.includes('parto:update')
    
    if (!tienePermisoParto) {
      return Response.json(
        { error: 'No tiene permisos para acceder a esta información' },
        { status: 403 }
      )
    }

    // Obtener parámetro de rol
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'matrona', 'medico', 'enfermera'

    // Validar que el rol sea válido
    const rolesValidos = ['matrona', 'medico', 'enfermera']
    if (!role || !rolesValidos.includes(role)) {
      return Response.json(
        { error: 'Rol inválido. Debe ser: matrona, medico o enfermera' },
        { status: 400 }
      )
    }

    // Obtener usuarios con el rol especificado (solo activos)
    const users = await prisma.user.findMany({
      where: {
        activo: true,
        roles: {
          some: {
            role: {
              name: role,
            },
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rut: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    })

    return Response.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Error al obtener profesionales:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

