import { getCurrentUser, getUserPermissions } from '@/lib/auth'

export async function POST(request, { params }) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('modulo_alta:aprobar')) {
      return Response.json(
        { error: 'No tiene permisos para aprobar altas médicas' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Parsear datos del request
    const data = await request.json()

    // Mockup: Simular aprobación de alta
    // En producción, esto actualizaría el EpisodioMadre con estado ALTA
    
    // Simular delay de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mockup response
    return Response.json({
      success: true,
      message: 'Alta médica aprobada exitosamente',
      data: {
        episodioId: id,
        estado: 'ALTA',
        fechaAlta: new Date().toISOString(),
        condicionEgreso: data.condicionEgreso || null,
        aprobadoPor: user.nombre || user.email,
        aprobadoAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error al aprobar alta:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

