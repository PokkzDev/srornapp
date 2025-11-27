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
    if (!permissions.includes('auditoria:review')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Auditoria',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para revisar auditoría' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const usuarioId = searchParams.get('usuarioId')
    const entidad = searchParams.get('entidad')
    const accion = searchParams.get('accion')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    // Construir filtros
    const where = {}

    if (usuarioId) {
      where.usuarioId = usuarioId
    }

    if (entidad) {
      where.entidad = entidad
    }

    if (accion) {
      where.accion = accion
    }

    // Filtro de fechas
    if (fechaInicio || fechaFin) {
      where.fechaHora = {}
      if (fechaInicio) {
        where.fechaHora.gte = new Date(fechaInicio)
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin)
        fechaFinDate.setHours(23, 59, 59, 999) // Incluir todo el día
        where.fechaHora.lte = fechaFinDate
      }
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit

    // Obtener total de registros
    const total = await prisma.auditoria.count({ where })

    // Obtener registros con información del usuario
    const registros = await prisma.auditoria.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        fechaHora: 'desc',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true,
          },
        },
      },
    })

    // Calcular total de páginas
    const totalPages = Math.ceil(total / limit)

    return Response.json({
      success: true,
      data: registros,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error)
    return Response.json(
      { error: 'Error al obtener registros de auditoría', details: error.message },
      { status: 500 }
    )
  }
}











