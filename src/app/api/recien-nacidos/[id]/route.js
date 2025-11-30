import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  errorResponse,
  successResponse,
  manejarErrorPrisma,
} from '@/lib/api-helpers'
import {
  SEXOS_VALIDOS,
  RN_INCLUDE,
  RN_INCLUDE_DETAIL,
  validarCamposNumericos,
  construirRNDataUpdate,
} from '@/lib/recien-nacido-helpers'

// GET - Obtener un recién nacido específico
export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'recien-nacido:view', 'RecienNacido')
    if (auth.error) return auth.error

    const { id } = await params

    const recienNacido = await prisma.recienNacido.findUnique({
      where: { id },
      include: RN_INCLUDE_DETAIL,
    })

    if (!recienNacido) {
      return errorResponse('Recién nacido no encontrado', 404)
    }

    return successResponse(recienNacido)
  } catch (error) {
    console.error('Error al obtener recién nacido:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

// PUT - Actualizar un recién nacido
export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'recien-nacido:update', 'RecienNacido')
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

    const rnExistente = await prisma.recienNacido.findUnique({ where: { id } })
    if (!rnExistente) {
      return errorResponse('Recién nacido no encontrado', 404)
    }

    const data = await request.json()

    if (!data.sexo) {
      return errorResponse('Sexo es requerido', 400)
    }

    if (!SEXOS_VALIDOS.includes(data.sexo)) {
      return errorResponse('Sexo inválido. Valores válidos: M, F, I', 400)
    }

    const validacionNumeros = validarCamposNumericos(data)
    if (validacionNumeros) {
      return errorResponse(validacionNumeros.error, 400)
    }

    const rnData = construirRNDataUpdate(data, user.id, rnExistente)
    const auditData = getAuditData(request)

    const rnActualizado = await prisma.$transaction(async (tx) => {
      const rn = await tx.recienNacido.update({
        where: { id },
        data: rnData,
        include: RN_INCLUDE,
      })

      await crearAuditoria(tx, {
        user: { id: user.id, roles: user.roles },
        entidad: 'RecienNacido',
        entidadId: rn.id,
        accion: 'UPDATE',
        detalleBefore: rnExistente,
        detalleAfter: rn,
        ...auditData,
      })

      return rn
    })

    return successResponse(rnActualizado, 'Recién nacido actualizado exitosamente')
  } catch (error) {
    console.error('Error al actualizar recién nacido:', error)
    const prismaError = manejarErrorPrisma(error)
    if (prismaError) return prismaError
    return errorResponse('Error interno del servidor', 500)
  }
}

// DELETE - Eliminar un recién nacido
export async function DELETE(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'recien-nacido:delete', 'RecienNacido')
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params

    const rnExistente = await prisma.recienNacido.findUnique({
      where: { id },
      include: {
        episodios: { take: 1 },
        controles: { take: 1 },
        atenciones: { take: 1 },
      },
    })

    if (!rnExistente) {
      return errorResponse('Recién nacido no encontrado', 404)
    }

    const tieneRegistros = rnExistente.episodios.length > 0 || 
                          rnExistente.controles.length > 0 || 
                          rnExistente.atenciones.length > 0

    if (tieneRegistros) {
      return errorResponse(
        'No se puede eliminar un recién nacido que tiene registros asociados (episodios, controles o atenciones)',
        409
      )
    }

    const auditData = getAuditData(request)

    await prisma.$transaction(async (tx) => {
      await crearAuditoria(tx, {
        user: { id: user.id, roles: user.roles },
        entidad: 'RecienNacido',
        entidadId: rnExistente.id,
        accion: 'DELETE',
        detalleBefore: rnExistente,
        ...auditData,
      })

      await tx.recienNacido.delete({ where: { id } })
    })

    return successResponse(null, 'Recién nacido eliminado exitosamente')
  } catch (error) {
    console.error('Error al eliminar recién nacido:', error)

    if (error.code === 'P2003') {
      return errorResponse('No se puede eliminar un recién nacido que tiene registros asociados', 409)
    }


    return errorResponse('Error interno del servidor', 500)
  }
}








