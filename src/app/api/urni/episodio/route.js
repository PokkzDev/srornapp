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
    const hasViewPermission = 
      permissions.includes('urni:read') || 
      permissions.includes('urni:episodio:view')
    
    if (!hasViewPermission) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioURNI',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar episodios URNI' },
        { status: 403 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''
    const rnId = searchParams.get('rnId') || ''
    const responsableId = searchParams.get('responsableId') || ''
    const search = searchParams.get('search') || ''
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (estado) {
      where.estado = estado
    }
    
    if (rnId) {
      where.rnId = rnId
    }
    
    if (responsableId) {
      where.responsableClinicoId = responsableId
    }

    // Implementar búsqueda por texto
    if (search) {
      const searchTerm = search.trim()
      
      // Validar si es un UUID (ID de recién nacido)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isUUID = uuidRegex.test(searchTerm)
      
      where.OR = [
        // Buscar por RUT de la madre
        {
          rn: {
            parto: {
              madre: {
                rut: {
                  contains: searchTerm,
                },
              },
            },
          },
        },
        // Buscar por nombres de la madre
        {
          rn: {
            parto: {
              madre: {
                nombres: {
                  contains: searchTerm,
                },
              },
            },
          },
        },
        // Buscar por apellidos de la madre
        {
          rn: {
            parto: {
              madre: {
                apellidos: {
                  contains: searchTerm,
                },
              },
            },
          },
        },
      ]
      
      // Si es un UUID válido, también buscar por ID del recién nacido
      if (isUUID) {
        where.OR.push({
          rnId: searchTerm,
        })
      }
    }

    // Obtener episodios con relaciones
    const [episodios, total] = await Promise.all([
      prisma.episodioURNI.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaHoraIngreso: 'desc' },
        include: {
          rn: {
            include: {
              parto: {
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
              },
            },
          },
          responsableClinico: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              nombre: true,
            },
          },
          _count: {
            select: {
              atenciones: true,
              controles: true,
            },
          },
        },
      }),
      prisma.episodioURNI.count({ where }),
    ])

    return Response.json({
      data: episodios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener episodios URNI:', error)
    return Response.json(
      { error: 'Error al obtener episodios URNI' },
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

    // Verificar que el usuario existe en la base de datos
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      return Response.json(
        { error: 'Usuario no encontrado. Por favor, inicie sesión nuevamente.' },
        { status: 401 }
      )
    }

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('urni:episodio:create')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: dbUser.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioURNI',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para crear episodios URNI' },
        { status: 403 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.rnId || !data.fechaHoraIngreso) {
      return Response.json(
        { error: 'Recién nacido y fecha/hora de ingreso son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el RN existe
    const rn = await prisma.recienNacido.findUnique({
      where: { id: data.rnId },
    })

    if (!rn) {
      return Response.json(
        { error: 'El recién nacido especificado no existe' },
        { status: 404 }
      )
    }

    // Validar que no tenga un episodio activo
    const episodioActivo = await prisma.episodioURNI.findFirst({
      where: {
        rnId: data.rnId,
        estado: 'INGRESADO',
      },
    })

    if (episodioActivo) {
      return Response.json(
        { error: 'El recién nacido ya tiene un episodio URNI activo' },
        { status: 400 }
      )
    }

    // Validar fechaHoraIngreso
    const fechaHoraIngreso = new Date(data.fechaHoraIngreso)
    if (Number.isNaN(fechaHoraIngreso.getTime())) {
      return Response.json(
        { error: 'Fecha/hora de ingreso inválida' },
        { status: 400 }
      )
    }

    // Validar responsable clínico si se proporciona
    if (data.responsableClinicoId) {
      const responsable = await prisma.user.findUnique({
        where: { id: data.responsableClinicoId },
      })

      if (!responsable) {
        return Response.json(
          { error: 'El responsable clínico especificado no existe' },
          { status: 404 }
        )
      }
    }

    // Preparar datos para crear
    const episodioData = {
      rnId: data.rnId,
      fechaHoraIngreso: fechaHoraIngreso,
      estado: 'INGRESADO',
      createdById: dbUser.id,
    }

    // Agregar campos opcionales
    if (data.motivoIngreso) {
      episodioData.motivoIngreso = data.motivoIngreso.trim().substring(0, 300)
    }

    if (data.servicioUnidad) {
      if (!['URNI', 'UCIN', 'NEONATOLOGIA'].includes(data.servicioUnidad)) {
        return Response.json(
          { error: 'Servicio/unidad inválido' },
          { status: 400 }
        )
      }
      episodioData.servicioUnidad = data.servicioUnidad
    }

    if (data.responsableClinicoId) {
      episodioData.responsableClinicoId = data.responsableClinicoId
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Log para depuración
    console.log('Creando episodio URNI con datos:', {
      rnId: episodioData.rnId,
      fechaHoraIngreso: episodioData.fechaHoraIngreso,
      motivoIngreso: episodioData.motivoIngreso,
      servicioUnidad: episodioData.servicioUnidad,
      responsableClinicoId: episodioData.responsableClinicoId,
      createdById: episodioData.createdById,
    })

    // Crear episodio en transacción con auditoría
    const episodio = await prisma.$transaction(async (tx) => {
      // Crear episodio
      const nuevoEpisodio = await tx.episodioURNI.create({
        data: episodioData,
        include: {
          rn: {
            include: {
              parto: {
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
              },
            },
          },
          responsableClinico: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      })

      console.log('Episodio creado exitosamente:', nuevoEpisodio.id)

      // Registrar auditoría
      try {
        await tx.auditoria.create({
          data: {
            usuarioId: dbUser.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'EpisodioURNI',
            entidadId: nuevoEpisodio.id,
            accion: 'CREATE',
            detalleAfter: nuevoEpisodio,
            ip,
            userAgent,
          },
        })
        console.log('Auditoría registrada exitosamente')
      } catch (auditError) {
        // No fallar la transacción si falla la auditoría, solo loguear
        console.error('Error al registrar auditoría (no crítico):', auditError)
      }

      return nuevoEpisodio
    })

    return Response.json(
      {
        success: true,
        message: 'Episodio URNI registrado exitosamente',
        data: episodio,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar episodio URNI:', error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      // Error de foreign key constraint
      if (error.meta?.field_name?.includes('createdById')) {
        return Response.json(
          { error: 'Usuario no válido. Por favor, inicie sesión nuevamente.' },
          { status: 401 }
        )
      }
      return Response.json(
        { error: 'Referencia inválida. Verifique que el recién nacido o responsable clínico existan.' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un episodio con estos datos' },
        { status: 400 }
      )
    }
    
    // Incluir más detalles del error en desarrollo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Error al registrar episodio URNI'
      : 'Error al registrar episodio URNI'
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

