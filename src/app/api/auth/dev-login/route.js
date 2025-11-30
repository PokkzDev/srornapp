import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/dev-login
 * Login rápido para desarrollo SOLO en modo development
 * No requiere contraseña, solo funciona en entorno de desarrollo
 */
export async function POST(request) {
  // Solo permitir en modo desarrollo - CRÍTICO para seguridad
  if (process.env.NODE_ENV !== 'development' && process.env.ENVIRONMENT !== 'development') {
    return NextResponse.json(
      { error: 'No autorizado - Solo disponible en modo desarrollo' },
      { status: 403 }
    )
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (!user.activo) {
      return NextResponse.json(
        { error: 'Usuario desactivado' },
        { status: 403 }
      )
    }

    // Obtener roles y permisos
    const roles = user.roles.map(ur => ur.role.name)
    
    const rolePermissions = user.roles.flatMap(ur =>
      ur.role.permissions.map(rp => rp.permission.code)
    )
    const directPermissions = user.permissions.map(up => up.permission.code)
    const allPermissions = [...new Set([...rolePermissions, ...directPermissions])]

    // Crear datos de sesión
    const sessionData = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rut: user.rut,
      roles,
      permissions: allPermissions,
    }

    // Establecer cookie de sesión
    const cookieStore = await cookies()
    cookieStore.set('user', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: false, // Solo desarrollo
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })

    // Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        rol: roles[0] || null,
        entidad: 'User',
        entidadId: user.id,
        accion: 'LOGIN',
        detalleAfter: { method: 'dev-login', email: user.email },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        roles,
      },
    })
  } catch (error) {
    console.error('Error en dev-login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
