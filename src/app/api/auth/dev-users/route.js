import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/dev-users
 * Retorna la lista de usuarios de prueba SOLO en modo desarrollo
 * No expone contraseñas ni información sensible
 */
export async function GET() {
  // Solo permitir en modo desarrollo
  if (process.env.NODE_ENV !== 'development' && process.env.ENVIRONMENT !== 'development') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    )
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        activo: true,
      },
      select: {
        email: true,
        nombre: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    })

    // Formatear la respuesta sin exponer datos sensibles
    const formattedUsers = users.map(user => ({
      email: user.email,
      nombre: user.nombre,
      role: user.roles[0]?.role?.name || 'Sin rol',
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error al obtener usuarios de prueba:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
