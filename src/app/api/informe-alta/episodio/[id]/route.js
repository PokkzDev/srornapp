import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  errorResponse,
  successResponse,
} from '@/lib/api-helpers'
import { INFORME_INCLUDE, formatearInformeResponse } from '@/lib/informe-alta-helpers'

export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(
      request,
      ['informe_alta:generate', 'modulo_alta:aprobar'],
      'InformeAlta',
      { requireAll: false }
    )
    if (auth.error) return auth.error

    const { id } = await params

    const informe = await prisma.informeAlta.findUnique({
      where: { episodioId: id },
      include: INFORME_INCLUDE,
    })

    if (!informe) {
      return errorResponse('Informe no encontrado para este episodio', 404)
    }

    const informeFormateado = formatearInformeResponse(informe)

    return successResponse(informeFormateado)
  } catch (error) {
    console.error('Error al obtener informe de alta:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}






