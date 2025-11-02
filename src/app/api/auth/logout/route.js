import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
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

