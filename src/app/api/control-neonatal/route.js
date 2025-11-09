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
    if (!permissions.includes('control_neonatal:view')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'ControlNeonatal',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar controles neonatales' },
        { status: 403 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const rnId = searchParams.get('rnId') || ''
    const episodioUrniId = searchParams.get('episodioUrniId') || ''
    const tipo = searchParams.get('tipo') || ''
    const enfermeraId = searchParams.get('enfermeraId') || ''
    const fechaDesde = searchParams.get('fechaDesde') || ''
    const fechaHasta = searchParams.get('fechaHasta') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (rnId) {
      where.rnId = rnId
    }
    
    if (episodioUrniId) {
      where.episodioUrniId = episodioUrniId
    }
    
    if (tipo) {
      where.tipo = tipo
    }
    
    if (enfermeraId) {
      where.enfermeraId = enfermeraId
    }

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      where.fechaHora = {}
      if (fechaDesde) {
        where.fechaHora.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta)
        fechaHastaDate.setHours(23, 59, 59, 999) // Incluir todo el día
        where.fechaHora.lte = fechaHastaDate
      }
    }

    // Implementar búsqueda por texto
    if (search) {
      const searchTerm = search.trim()
      
      // Validar si es un UUID (ID de recién nacido o control)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isUUID = uuidRegex.test(searchTerm)
      
      const searchConditions = [
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
        // Buscar por nombre de enfermera
        {
          enfermera: {
            nombre: {
              contains: searchTerm,
            },
          },
        },
        // Buscar por observaciones
        {
          observaciones: {
            contains: searchTerm,
          },
        },
      ]
      
      // Si es un UUID válido, también buscar por ID del recién nacido o control
      if (isUUID) {
        searchConditions.push({ rnId: searchTerm })
        searchConditions.push({ id: searchTerm })
      }
      
      where.OR = searchConditions
    }

    // Obtener controles con relaciones
    const [controles, total] = await Promise.all([
      prisma.controlNeonatal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaHora: 'desc' },
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
          episodioUrni: {
            select: {
              id: true,
              estado: true,
              fechaHoraIngreso: true,
              servicioUnidad: true,
            },
          },
          enfermera: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      }),
      prisma.controlNeonatal.count({ where }),
    ])

    return Response.json({
      success: true,
      data: controles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener controles neonatales:', error)
    return Response.json(
      { error: 'Error al obtener controles neonatales' },
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
    if (!permissions.includes('control_neonatal:create')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'ControlNeonatal',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para crear controles neonatales' },
        { status: 403 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.rnId) {
      return Response.json(
        { error: 'Recién nacido es requerido' },
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

    // Determinar episodioUrniId: usar el proporcionado o buscar el episodio activo
    let episodioUrniId = data.episodioUrniId || null

    if (!episodioUrniId) {
      // Buscar episodio activo del RN para sugerir vinculación
      const episodioActivo = await prisma.episodioURNI.findFirst({
        where: {
          rnId: data.rnId,
          estado: 'INGRESADO',
        },
      })

      if (episodioActivo) {
        episodioUrniId = episodioActivo.id
      }
    }

    // Si se proporciona episodioUrniId, validar que existe y pertenece al RN
    if (episodioUrniId) {
      const episodio = await prisma.episodioURNI.findUnique({
        where: { id: episodioUrniId },
      })

      if (!episodio) {
        return Response.json(
          { error: 'El episodio URNI especificado no existe' },
          { status: 404 }
        )
      }

      // Validar que el episodio pertenece al RN
      if (episodio.rnId !== data.rnId) {
        return Response.json(
          { error: 'El episodio URNI no pertenece al recién nacido especificado' },
          { status: 400 }
        )
      }
    }

    // Validar tipo de control
    const tiposValidos = ['SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION', 'OTRO']
    const tipo = data.tipo || 'SIGNOS_VITALES'
    
    if (!tiposValidos.includes(tipo)) {
      return Response.json(
        { error: 'Tipo de control inválido' },
        { status: 400 }
      )
    }

    // Validar fechaHora si se proporciona
    let fechaHora = new Date()
    if (data.fechaHora) {
      fechaHora = new Date(data.fechaHora)
      if (isNaN(fechaHora.getTime())) {
        return Response.json(
          { error: 'Fecha/hora inválida' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para crear
    const controlData = {
      rnId: data.rnId,
      episodioUrniId: episodioUrniId,
      fechaHora: fechaHora,
      tipo: tipo,
      enfermeraId: user.id, // La enfermera que crea el control es el usuario autenticado
    }

    // Agregar campos opcionales
    if (data.datos) {
      // Validar que datos es un objeto JSON válido
      try {
        const datosParsed = typeof data.datos === 'string' ? JSON.parse(data.datos) : data.datos
        controlData.datos = datosParsed
      } catch (error) {
        return Response.json(
          { error: 'El campo datos debe ser un JSON válido' },
          { status: 400 }
        )
      }
    }

    if (data.observaciones) {
      controlData.observaciones = data.observaciones.trim().substring(0, 500)
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear control en transacción con auditoría
    const control = await prisma.$transaction(async (tx) => {
      // Crear control
      const nuevoControl = await tx.controlNeonatal.create({
        data: controlData,
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
          episodioUrni: {
            select: {
              id: true,
              estado: true,
              fechaHoraIngreso: true,
            },
          },
          enfermera: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'ControlNeonatal',
          entidadId: nuevoControl.id,
          accion: 'CREATE',
          detalleAfter: nuevoControl,
          ip,
          userAgent,
        },
      })

      return nuevoControl
    })

    return Response.json(
      {
        success: true,
        message: 'Control neonatal registrado exitosamente',
        data: control,
        // Informar si se vinculó automáticamente a un episodio
        autoLinked: episodioUrniId && !data.episodioUrniId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar control neonatal:', error)
    return Response.json(
      { error: 'Error al registrar control neonatal' },
      { status: 500 }
    )
  }
}




