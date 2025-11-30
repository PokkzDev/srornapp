import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  parsearFecha,
  validarEnum,
  parsearJsonSeguro,
  errorResponse,
  successResponse,
  manejarErrorPrisma
} from '@/lib/api-helpers'

// Constantes
const ENTIDAD = 'ControlNeonatal'
const TIPOS_CONTROL = ['SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION', 'OTRO']

// Includes reutilizables
const CONTROL_INCLUDE_FULL = {
  rn: {
    include: {
      parto: {
        include: {
          madre: {
            select: { id: true, rut: true, nombres: true, apellidos: true, edad: true },
          },
        },
      },
    },
  },
  episodioUrni: {
    include: {
      responsableClinico: {
        select: { id: true, nombre: true, email: true },
      },
    },
  },
  enfermera: {
    select: { id: true, nombre: true, email: true },
  },
}

const CONTROL_INCLUDE_BASIC = {
  rn: {
    include: {
      parto: {
        include: {
          madre: {
            select: { id: true, rut: true, nombres: true, apellidos: true },
          },
        },
      },
    },
  },
  episodioUrni: {
    select: { id: true, estado: true, fechaHoraIngreso: true },
  },
  enfermera: {
    select: { id: true, nombre: true, email: true },
  },
}

// GET - Obtener un control neonatal específico
export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'control_neonatal:view', ENTIDAD)
    if (!auth.success) return auth.error

    const { id } = await params

    const control = await prisma.controlNeonatal.findUnique({
      where: { id },
      include: CONTROL_INCLUDE_FULL,
    })

    if (!control) {
      return errorResponse('Control neonatal no encontrado', 404)
    }

    return successResponse(control)
  } catch (error) {
    console.error('Error al obtener control neonatal:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

/**
 * Valida el RN si se proporciona un nuevo ID
 */
async function validarCambioRN(nuevoRnId, rnIdActual) {
  if (!nuevoRnId || nuevoRnId === rnIdActual) {
    return { valid: true }
  }
  
  const rn = await prisma.recienNacido.findUnique({ where: { id: nuevoRnId } })
  return rn ? { valid: true } : { valid: false, error: 'El recién nacido especificado no existe' }
}

/**
 * Valida el episodio URNI si se proporciona
 */
async function validarEpisodioUrni(episodioUrniId, rnId) {
  if (episodioUrniId === undefined) return { valid: true }
  if (episodioUrniId === null) return { valid: true, allowUnlink: true }

  const episodio = await prisma.episodioURNI.findUnique({ where: { id: episodioUrniId } })
  
  if (!episodio) {
    return { valid: false, error: 'El episodio URNI especificado no existe' }
  }
  
  if (episodio.rnId !== rnId) {
    return { valid: false, error: 'El episodio URNI no pertenece al recién nacido especificado' }
  }
  
  return { valid: true }
}

/**
 * Prepara los datos para actualizar el control
 */
function prepararDatosActualizacion(data, controlExistente, fechaHora, datosJson) {
  const controlData = {}

  if (data.tipo !== undefined) controlData.tipo = data.tipo
  if (data.fechaHora !== undefined) controlData.fechaHora = fechaHora
  if (data.rnId !== undefined) controlData.rnId = data.rnId
  if (data.episodioUrniId !== undefined) controlData.episodioUrniId = data.episodioUrniId
  if (data.datos !== undefined) controlData.datos = datosJson
  if (data.observaciones !== undefined) {
    controlData.observaciones = data.observaciones ? data.observaciones.trim().substring(0, 500) : null
  }

  return controlData
}

// PUT - Actualizar un control neonatal
export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'control_neonatal:update', ENTIDAD)
    if (!auth.success) return auth.error

    const { id } = await params
    const controlExistente = await prisma.controlNeonatal.findUnique({ where: { id } })

    if (!controlExistente) {
      return errorResponse('Control neonatal no encontrado', 404)
    }

    const data = await request.json()

    // Validar tipo si se proporciona
    if (data.tipo) {
      const tipoValidation = validarEnum(data.tipo, TIPOS_CONTROL, 'Tipo de control')
      if (!tipoValidation.valid) return errorResponse(tipoValidation.error)
    }

    // Validar fecha si se proporciona
    const fechaResult = parsearFecha(data.fechaHora, controlExistente.fechaHora)
    if (!fechaResult.valid) return errorResponse(fechaResult.error)

    // Validar RN si se proporciona
    const rnValidation = await validarCambioRN(data.rnId, controlExistente.rnId)
    if (!rnValidation.valid) return errorResponse(rnValidation.error, 404)

    // Validar episodio URNI
    const rnIdFinal = data.rnId || controlExistente.rnId
    const episodioValidation = await validarEpisodioUrni(data.episodioUrniId, rnIdFinal)
    if (!episodioValidation.valid) return errorResponse(episodioValidation.error, 400)

    // Validar datos JSON
    const datosResult = parsearJsonSeguro(data.datos)
    if (!datosResult.valid) return errorResponse('El campo datos debe ser un JSON válido')

    const { ip, userAgent } = getAuditData(request)
    const controlData = prepararDatosActualizacion(data, controlExistente, fechaResult.date, datosResult.data)

    // Actualizar en transacción
    const controlActualizado = await prisma.$transaction(async (tx) => {
      const control = await tx.controlNeonatal.update({
        where: { id },
        data: controlData,
        include: CONTROL_INCLUDE_BASIC,
      })

      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: control.id,
        accion: 'UPDATE',
        detalleBefore: controlExistente,
        detalleAfter: control,
        ip,
        userAgent,
      })

      return control
    })

    return Response.json({
      success: true,
      message: 'Control neonatal actualizado exitosamente',
      data: controlActualizado,
    })
  } catch (error) {
    console.error('Error al actualizar control neonatal:', error)
    return manejarErrorPrisma(error, 'Error interno del servidor')
  }
}

// DELETE - Eliminar un control neonatal
export async function DELETE(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'control_neonatal:delete', ENTIDAD)
    if (!auth.success) return auth.error

    const { id } = await params

    const controlExistente = await prisma.controlNeonatal.findUnique({
      where: { id },
      include: {
        rn: {
          include: {
            parto: {
              include: {
                madre: { select: { nombres: true, apellidos: true } },
              },
            },
          },
        },
      },
    })

    if (!controlExistente) {
      return errorResponse('Control neonatal no encontrado', 404)
    }

    const { ip, userAgent } = getAuditData(request)

    await prisma.$transaction(async (tx) => {
      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: controlExistente.id,
        accion: 'DELETE',
        detalleBefore: controlExistente,
        ip,
        userAgent,
      })

      await tx.controlNeonatal.delete({ where: { id } })
    })

    return Response.json({
      success: true,
      message: 'Control neonatal eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar control neonatal:', error)

    if (error.code === 'P2003') {
      return errorResponse('No se puede eliminar el control debido a restricciones de integridad', 409)
    }

    return errorResponse('Error interno del servidor', 500)
  }
}












