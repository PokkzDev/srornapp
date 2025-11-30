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
  EPISODIO_SIN_INFORME_INCLUDE,
  validarFormato,
  construirContenidoInforme,
  obtenerPartosDisponibles,
} from '@/lib/informe-alta-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'informe_alta:generate', 'InformeAlta')
    if (auth.error) return auth.error

    // Obtener episodios en estado INGRESADO sin informe
    const episodios = await prisma.episodioMadre.findMany({
      where: { estado: 'INGRESADO', informeAlta: null },
      include: EPISODIO_SIN_INFORME_INCLUDE,
      orderBy: { fechaIngreso: 'desc' },
    })

    // Obtener partos disponibles para cada episodio
    const episodiosConPartos = await Promise.all(
      episodios.map(async (episodio) => {
        const partos = await obtenerPartosDisponibles(prisma, episodio)
        return { ...episodio, partos }
      })
    )

    return successResponse(episodiosConPartos)
  } catch (error) {
    console.error('Error al listar episodios para informe:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}

export async function POST(request) {
  try {
    const auth = await verificarAuth(request, 'informe_alta:generate', 'InformeAlta')
    if (auth.error) return auth.error
    const { user, dbUser } = auth

    if (!dbUser || !dbUser.activo) {
      return errorResponse('Usuario no válido o inactivo', 401)
    }

    const data = await request.json()

    if (!data.partoId || !data.episodioId) {
      return errorResponse('Parto y episodio son requeridos', 400)
    }

    const formatoValidacion = validarFormato(data.formato)
    if (formatoValidacion.error) {
      return errorResponse(formatoValidacion.error, 400)
    }
    const formato = formatoValidacion.formato

    const episodio = await prisma.episodioMadre.findUnique({
      where: { id: data.episodioId },
      include: { madre: true },
    })

    if (!episodio) {
      return errorResponse('Episodio no encontrado', 404)
    }

    if (episodio.estado !== 'INGRESADO') {
      return errorResponse('Solo se pueden generar informes para episodios en estado INGRESADO', 400)
    }

    const informeExistente = await prisma.informeAlta.findUnique({
      where: { episodioId: data.episodioId },
    })

    if (informeExistente) {
      return errorResponse('Este episodio ya tiene un informe de alta generado', 400)
    }

    const parto = await prisma.parto.findUnique({
      where: { id: data.partoId },
      include: {
        recienNacidos: {
          select: {
            id: true,
            sexo: true,
            pesoNacimientoGramos: true,
            tallaCm: true,
            apgar1Min: true,
            apgar5Min: true,
            observaciones: true,
          },
        },
      },
    })

    if (!parto) {
      return errorResponse('Parto no encontrado', 404)
    }

    if (parto.madreId !== episodio.madreId) {
      return errorResponse('El parto no pertenece a la madre del episodio', 400)
    }

    const contenido = construirContenidoInforme(episodio, parto)
    const auditData = getAuditData(request)

    const informe = await prisma.$transaction(async (tx) => {
      const nuevoInforme = await tx.informeAlta.create({
        data: {
          partoId: data.partoId,
          episodioId: data.episodioId,
          formato,
          generadoPorId: user.id,
          contenido,
        },
        include: {
          generadoPor: { select: { id: true, nombre: true, email: true } },
          parto: { include: { recienNacidos: true } },
          episodio: { include: { madre: true } },
        },
      })

      await crearAuditoria(tx, {
        usuarioId: user.id,
        rol: user.roles,
        entidad: 'InformeAlta',
        entidadId: nuevoInforme.id,
        accion: 'CREATE',
        detalleAfter: nuevoInforme,
        ...auditData,
      })

      return nuevoInforme
    })

    return successResponse(informe, 'Informe de alta generado exitosamente', 201)
  } catch (error) {
    console.error('Error al generar informe de alta:', error)

    if (error.code === 'P2002') {
      return errorResponse('Este episodio ya tiene un informe de alta generado', 400)
    }

    const prismaError = manejarErrorPrisma(error)
    if (prismaError) return prismaError

    return errorResponse('Error interno del servidor', 500)
  }
}
