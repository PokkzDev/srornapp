import { prisma } from '@/lib/prisma'
import {
  verificarAuth,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  getAuditData,
  crearAuditoria,
} from '@/lib/api-helpers'

const AUDITORIA_INCLUDE = {
  usuario: {
    select: { id: true, nombre: true, email: true, rut: true },
  },
}

function construirWhereAuditoria(searchParams) {
  const where = {}
  const usuarioId = searchParams.get('usuarioId')
  const entidad = searchParams.get('entidad')
  const accion = searchParams.get('accion')
  const fechaInicio = searchParams.get('fechaInicio')
  const fechaFin = searchParams.get('fechaFin')

  if (usuarioId) where.usuarioId = usuarioId
  if (entidad) where.entidad = entidad
  if (accion) where.accion = accion

  if (fechaInicio || fechaFin) {
    where.fechaHora = {}
    if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio)
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin)
      fechaFinDate.setHours(23, 59, 59, 999)
      where.fechaHora.lte = fechaFinDate
    }
  }

  return where
}

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'auditoria:review', 'Auditoria')
    if (auth.error) {
      // Registrar intento de acceso sin permisos si no es error de autenticación
      if (auth.errorStatus === 403 && auth.dbUser) {
        const auditData = getAuditData(request)
        try {
          await crearAuditoria(prisma, {
            usuarioId: auth.dbUser.id,
            rol: auth.user?.roles ? (Array.isArray(auth.user.roles) ? auth.user.roles.join(', ') : auth.user.roles) : null,
            entidad: 'Auditoria',
            accion: 'PERMISSION_DENIED',
            ...auditData,
          })
        } catch (auditError) {
          console.error('Error al registrar auditoría:', auditError)
        }
      }
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams, 50)
    const where = construirWhereAuditoria(searchParams)

    const [registros, total] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaHora: 'desc' },
        include: AUDITORIA_INCLUDE,
      }),
      prisma.auditoria.count({ where }),
    ])

    return paginatedResponse(registros, { page, limit, total })
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error)
    return errorResponse('Error al obtener registros de auditoría', 500)
  }
}











