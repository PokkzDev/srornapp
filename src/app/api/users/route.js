import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Obtener parámetro de filtro por rol
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'matrona', 'medico', 'enfermera'

    // Construir query base
    let where = {
      activo: true,
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

    // Obtener usuarios activos con sus roles
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
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

