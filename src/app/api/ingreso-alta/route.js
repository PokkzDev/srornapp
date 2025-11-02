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
    if (!permissions.includes('ingreso_alta:view') && !permissions.includes('ingreso_alta:manage')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioMadre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar ingresos/altas' },
        { status: 403 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (estado) {
      where.estado = estado
    }
    
    if (search) {
      where.OR = [
        { madre: { rut: { contains: search } } },
        { madre: { nombres: { contains: search } } },
        { madre: { apellidos: { contains: search } } },
        { motivoIngreso: { contains: search } },
        { hospitalAnterior: { contains: search } },
      ]
    }

    // Obtener episodios con paginación
    const [episodios, total] = await Promise.all([
      prisma.episodioMadre.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { fechaIngreso: 'desc' },
        ],
        include: {
          madre: {
            select: {
              id: true,
              rut: true,
              nombres: true,
              apellidos: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      }),
      prisma.episodioMadre.count({ where }),
    ])

    return Response.json({
      success: true,
      data: episodios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al listar ingresos/altas:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
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
    if (!permissions.includes('ingreso_alta:create') && !permissions.includes('ingreso_alta:manage')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioMadre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para registrar ingresos' },
        { status: 403 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.madreId || !data.fechaIngreso) {
      return Response.json(
        { error: 'Madre y fecha de ingreso son requeridos' },
        { status: 400 }
      )
    }

    // Validar que la madre existe
    const madre = await prisma.madre.findUnique({
      where: { id: data.madreId },
    })

    if (!madre) {
      return Response.json(
        { error: 'La madre especificada no existe' },
        { status: 404 }
      )
    }

    // Validar fechaIngreso
    const fechaIngreso = new Date(data.fechaIngreso)
    if (isNaN(fechaIngreso.getTime())) {
      return Response.json(
        { error: 'Fecha de ingreso inválida' },
        { status: 400 }
      )
    }

    // Preparar datos para crear
    const episodioData = {
      madreId: data.madreId,
      fechaIngreso: fechaIngreso,
      estado: 'INGRESADO',
      createdById: user.id,
    }

    // Agregar campos opcionales
    if (data.motivoIngreso) {
      episodioData.motivoIngreso = data.motivoIngreso.trim().substring(0, 300)
    }

    if (data.hospitalAnterior) {
      episodioData.hospitalAnterior = data.hospitalAnterior.trim().substring(0, 200)
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear episodio en transacción con auditoría
    const episodio = await prisma.$transaction(async (tx) => {
      // Crear episodio
      const nuevoEpisodio = await tx.episodioMadre.create({
        data: episodioData,
        include: {
          madre: {
            select: {
              id: true,
              rut: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'EpisodioMadre',
          entidadId: nuevoEpisodio.id,
          accion: 'CREATE',
          detalleAfter: nuevoEpisodio,
          ip,
          userAgent,
        },
      })

      return nuevoEpisodio
    })

    return Response.json(
      {
        success: true,
        message: 'Ingreso registrado exitosamente',
        data: episodio,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar ingreso:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'Referencia inválida en los datos proporcionados' },
        { status: 400 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

