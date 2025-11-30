import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getAuditData, crearAuditoria } from '@/lib/api-helpers'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    
    // Obtener información del usuario antes de cerrar sesión
    const userCookie = cookieStore.get('user')
    let userId = null
    let userRoles = null
    
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie.value)
        userId = userData.id
        userRoles = userData.roles
      } catch {
        // Si no se puede parsear la sesión, continuar sin auditoría
      }
    }
    
    // Registrar auditoría de logout si tenemos el usuario
    if (userId) {
      try {
        const auditData = getAuditData(request)
        await crearAuditoria(prisma, {
          usuarioId: userId,
          rol: Array.isArray(userRoles) ? userRoles.join(', ') : userRoles,
          entidad: 'Session',
          accion: 'LOGOUT',
          ...auditData,
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría de logout:', auditError)
        // Continuar con el logout aunque falle la auditoría
      }
    }
    
    // Delete session cookies
    cookieStore.delete('session')
    cookieStore.delete('user')

    return Response.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

