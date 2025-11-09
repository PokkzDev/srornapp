import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validarRUT, esEmail, formatearRUT } from '@/lib/rut'

export async function POST(request) {
  try {
    const { email, rut, password } = await request.json()

    // Aceptar email o rut (puede venir como 'email' o 'rut' en el body)
    const identifier = email || rut

    if (!identifier || !password) {
      return Response.json(
        { error: 'Email/RUT y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const identifierTrimmed = identifier.trim()

    // Detectar si es email o RUT
    let user = null

    if (esEmail(identifierTrimmed)) {
      // Buscar por email
      user = await prisma.user.findUnique({
        where: { email: identifierTrimmed.toLowerCase() },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })
    } else {
      // Intentar como RUT
      // Formatear RUT si es necesario (normalizar formato)
      let rutFormateado = identifierTrimmed
      if (!rutFormateado.includes('-')) {
        // Si no tiene guion, intentar formatearlo
        rutFormateado = formatearRUT(rutFormateado)
      }

      // Validar formato de RUT
      if (!validarRUT(rutFormateado)) {
        return Response.json(
          { error: 'RUT inválido. Formato esperado: 12345678-9' },
          { status: 400 }
        )
      }

      // Buscar por RUT
      user = await prisma.user.findUnique({
        where: { rut: rutFormateado },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })
    }

    // Si no se encontró usuario, retornar error genérico (por seguridad)
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

