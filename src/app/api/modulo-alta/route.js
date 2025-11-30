import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse, successResponse } from '@/lib/api-helpers'

const MODULO_ALTA_INCLUDE = {
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
}

function formatearEpisodioModuloAlta(episodio) {
  return {
    id: episodio.id,
    fechaIngreso: episodio.fechaIngreso.toISOString(),
    estado: episodio.estado,
    madre: episodio.madre,
    informeGenerado: !!episodio.informeAlta,
    informeFecha: episodio.informeAlta?.fechaGeneracion.toISOString() || null,
  }
}

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'modulo_alta:aprobar', 'ModuloAlta')
    if (auth.error) return auth.error

    const episodios = await prisma.episodioMadre.findMany({
      where: { informeAlta: { isNot: null } },
      include: MODULO_ALTA_INCLUDE,
      orderBy: { fechaIngreso: 'desc' },
    })

    return successResponse(episodios.map(formatearEpisodioModuloAlta))
  } catch (error) {
    console.error('Error al listar episodios con informes:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}


















