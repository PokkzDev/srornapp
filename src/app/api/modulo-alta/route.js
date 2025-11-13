import { getCurrentUser, getUserPermissions } from '@/lib/auth'
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

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('modulo_alta:aprobar')) {
      return Response.json(
        { error: 'No tiene permisos para acceder al módulo de alta' },
        { status: 403 }
      )
    }

    // Obtener episodios que tienen informes generados
    const episodios = await prisma.episodioMadre.findMany({
      where: {
        informeAlta: {
          isNot: null,
        },
      },
      include: {
        madre: {
          select: {
            id: true,
            rut: true,
            nombres: true,
            apellidos: true,
          },
        },
        informeAlta: {
          select: {
            id: true,
            fechaGeneracion: true,
          },
        },
      },
      orderBy: {
        fechaIngreso: 'desc',
      },
    })

    // Formatear datos para el frontend
    const episodiosFormateados = episodios.map((episodio) => ({
      id: episodio.id,
      fechaIngreso: episodio.fechaIngreso.toISOString(),
      estado: episodio.estado,
      madre: episodio.madre,
      informeGenerado: !!episodio.informeAlta,
      informeFecha: episodio.informeAlta?.fechaGeneracion.toISOString() || null,
    }))

    return Response.json({
      success: true,
      data: episodiosFormateados,
    })
  } catch (error) {
    console.error('Error al listar episodios con informes:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


















