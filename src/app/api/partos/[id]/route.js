import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  getAuditData,
  crearAuditoria,
  errorResponse,
  successResponse
} from '@/lib/api-helpers'
import {
  PARTO_INCLUDE,
  PARTO_INCLUDE_FULL,
  validarCamposRequeridos,
  validarFechaParto,
  validarEnumsParto,
  extraerIdsProfesionales,
  validarProfesionales,
  prepararDatosBaseParto,
  agregarCamposOpcionales,
  manejarErrorParto
} from '@/lib/parto-helpers'

const ENTIDAD = 'Parto'

// GET - Obtener un parto específico
export async function GET(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'parto:view', ENTIDAD)
    if (!auth.success) return auth.error

    const { id } = await params

    const parto = await prisma.parto.findUnique({
      where: { id },
      include: PARTO_INCLUDE_FULL,
    })

    if (!parto) {
      return errorResponse('Parto no encontrado', 404)
    }

    return successResponse(parto)
  } catch (error) {
    console.error('Error al obtener parto:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

// PUT - Actualizar un parto
export async function PUT(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'parto:update', ENTIDAD)
    if (!auth.success) return auth.error

    const { id } = await params
    const partoExistente = await prisma.parto.findUnique({ where: { id } })

    if (!partoExistente) {
      return errorResponse('Parto no encontrado', 404)
    }

    const data = await request.json()

    // Validar campos requeridos
    const camposResult = validarCamposRequeridos(data)
    if (!camposResult.valid) return errorResponse(camposResult.error)

    // Validar madre existe
    const madre = await prisma.madre.findUnique({ where: { id: data.madreId } })
    if (!madre) return errorResponse('La madre especificada no existe', 404)

    // Validar fecha
    const fechaResult = validarFechaParto(data.fechaHora)
    if (!fechaResult.valid) return errorResponse(fechaResult.error)

    // Validar enums
    const enumsResult = validarEnumsParto(data.tipo, data.lugar)
    if (!enumsResult.valid) return errorResponse(enumsResult.error)

    // Extraer y validar profesionales
    const { matronasIds, medicosIds, enfermerasIds } = extraerIdsProfesionales(data)
    const profesResult = await validarProfesionales(matronasIds, medicosIds, enfermerasIds, data.tipo)
    if (!profesResult.valid) return errorResponse(profesResult.error)

    // Preparar datos
    const partoData = prepararDatosBaseParto(data, auth.user.id, fechaResult.fecha, false)
    agregarCamposOpcionales(partoData, data, true)

    const { ip, userAgent } = getAuditData(request)

    // Actualizar en transacción
    const partoActualizado = await prisma.$transaction(async (tx) => {
      // Eliminar relaciones existentes
      await tx.partoMatrona.deleteMany({ where: { partoId: id } })
      await tx.partoMedico.deleteMany({ where: { partoId: id } })
      await tx.partoEnfermera.deleteMany({ where: { partoId: id } })

      // Actualizar parto con nuevas relaciones
      const parto = await tx.parto.update({
        where: { id },
        data: {
          ...partoData,
          matronas: matronasIds.length > 0 
            ? { create: matronasIds.map(userId => ({ userId })) } 
            : undefined,
          medicos: medicosIds.length > 0 
            ? { create: medicosIds.map(userId => ({ userId })) } 
            : undefined,
          enfermeras: enfermerasIds.length > 0 
            ? { create: enfermerasIds.map(userId => ({ userId })) } 
            : undefined,
        },
        include: PARTO_INCLUDE,
      })

      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: parto.id,
        accion: 'UPDATE',
        detalleBefore: partoExistente,
        detalleAfter: parto,
        ip,
        userAgent,
      })

      return parto
    })

    return Response.json({
      success: true,
      message: 'Parto actualizado exitosamente',
      data: partoActualizado,
    })
  } catch (error) {
    return manejarErrorParto(error)
  }
}

// DELETE - Eliminar un parto
export async function DELETE(request, { params }) {
  try {
    const auth = await verificarAuth(request, 'parto:delete', ENTIDAD)
    if (!auth.success) return auth.error

    const { id } = await params

    const partoExistente = await prisma.parto.findUnique({
      where: { id },
      include: { recienNacidos: { take: 1 } },
    })

    if (!partoExistente) {
      return errorResponse('Parto no encontrado', 404)
    }

    // Verificar que no tenga recién nacidos
    if (partoExistente.recienNacidos.length > 0) {
      return errorResponse('No se puede eliminar un parto que tiene recién nacidos registrados', 409)
    }

    const { ip, userAgent } = getAuditData(request)

    await prisma.$transaction(async (tx) => {
      await crearAuditoria(tx, {
        user: auth.user,
        entidad: ENTIDAD,
        entidadId: partoExistente.id,
        accion: 'DELETE',
        detalleBefore: partoExistente,
        ip,
        userAgent,
      })

      await tx.parto.delete({ where: { id } })
    })

    return Response.json({
      success: true,
      message: 'Parto eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar parto:', error)

    if (error.code === 'P2003') {
      return errorResponse('No se puede eliminar un parto que tiene recién nacidos registrados', 409)
    }

    return errorResponse('Error interno del servidor', 500)
  }
}

