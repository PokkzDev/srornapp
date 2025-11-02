import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return Response.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    if (!user.activo) {
      return Response.json(
        { error: 'Cuenta desactivada. Contacte al administrador.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      return Response.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Create session token (simple implementation - in production use proper session management)
    const sessionToken = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    // Set cookie with user info
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    cookieStore.set('user', JSON.stringify({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      roles: user.roles.map(ur => ur.role.name),
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        roles: user.roles.map(ur => ur.role.name),
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

