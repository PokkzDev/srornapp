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
    if (!permissions.includes('parto:view')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Parto',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar partos' },
        { status: 403 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (search) {
      const searchUpper = search.toUpperCase()
      const orConditions = [
        { madre: { rut: { contains: search } } },
        { madre: { nombres: { contains: search } } },
        { madre: { apellidos: { contains: search } } },
        { lugarDetalle: { contains: search } },
      ]

      // Buscar en enum TipoParto (case-insensitive)
      const tiposValidos = ['EUTOCICO', 'DISTOCICO', 'CESAREA_ELECTIVA', 'CESAREA_EMERGENCIA']
      const tiposMatch = tiposValidos.filter(tipo => tipo.includes(searchUpper))
      if (tiposMatch.length > 0) {
        if (tiposMatch.length === 1) {
          orConditions.push({ tipo: { equals: tiposMatch[0] } })
        } else {
          orConditions.push({ tipo: { in: tiposMatch } })
        }
      }

      // Buscar en enum LugarParto (case-insensitive)
      const lugaresValidos = ['SALA_PARTO', 'PABELLON', 'DOMICILIO', 'OTRO']
      const lugaresMatch = lugaresValidos.filter(lugar => lugar.includes(searchUpper))
      if (lugaresMatch.length > 0) {
        if (lugaresMatch.length === 1) {
          orConditions.push({ lugar: { equals: lugaresMatch[0] } })
        } else {
          orConditions.push({ lugar: { in: lugaresMatch } })
        }
      }

      where.OR = orConditions
    }

    // Obtener partos con paginación
    const [partos, total] = await Promise.all([
      prisma.parto.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { fechaHora: 'desc' },
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
          matronas: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
          medicos: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
          enfermeras: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.parto.count({ where }),
    ])

    return Response.json({
      success: true,
      data: partos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al listar partos:', error)
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
    if (!permissions.includes('parto:create')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: dbUser.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Parto',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para registrar partos' },
        { status: 403 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.madreId || !data.fechaHora || !data.tipo || !data.lugar) {
      return Response.json(
        { error: 'Madre, fecha/hora, tipo y lugar son requeridos' },
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

    // Validar fechaHora
    const fechaHora = new Date(data.fechaHora)
    if (isNaN(fechaHora.getTime())) {
      return Response.json(
        { error: 'Fecha y hora inválida' },
        { status: 400 }
      )
    }

    // Validar que la fecha no sea mayor que la fecha y hora actual
    const fechaHoraActual = new Date()
    if (fechaHora > fechaHoraActual) {
      return Response.json(
        { error: 'La fecha y hora del parto no puede ser mayor que la fecha y hora actual' },
        { status: 400 }
      )
    }

    // Validar tipo (enum)
    const tiposValidos = ['EUTOCICO', 'DISTOCICO', 'CESAREA_ELECTIVA', 'CESAREA_EMERGENCIA']
    if (!tiposValidos.includes(data.tipo)) {
      return Response.json(
        { error: 'Tipo de parto inválido' },
        { status: 400 }
      )
    }

    // Validar lugar (enum)
    const lugaresValidos = ['SALA_PARTO', 'PABELLON', 'DOMICILIO', 'OTRO']
    if (!lugaresValidos.includes(data.lugar)) {
      return Response.json(
        { error: 'Lugar de parto inválido' },
        { status: 400 }
      )
    }

    // Validar lugarDetalle si lugar es OTRO
    if (data.lugar === 'OTRO' && (!data.lugarDetalle || data.lugarDetalle.trim() === '')) {
      return Response.json(
        { error: 'Detalle del lugar es requerido cuando el lugar es OTRO' },
        { status: 400 }
      )
    }

    // Validar matronas si se proporcionan
    const matronasIds = Array.isArray(data.matronasIds) ? data.matronasIds : (data.matronaId ? [data.matronaId] : [])
    if (matronasIds.length > 0) {
      const matronas = await prisma.user.findMany({
        where: {
          id: { in: matronasIds },
          roles: {
            some: {
              role: {
                name: 'matrona',
              },
            },
          },
        },
      })
      if (matronas.length !== matronasIds.length) {
        return Response.json(
          { error: 'Una o más matronas especificadas no existen o no tienen el rol correcto' },
          { status: 404 }
        )
      }
    }

    // Validar medicos si se proporcionan
    const medicosIds = Array.isArray(data.medicosIds) ? data.medicosIds : (data.medicoId ? [data.medicoId] : [])
    if (medicosIds.length > 0) {
      const medicos = await prisma.user.findMany({
        where: {
          id: { in: medicosIds },
          roles: {
            some: {
              role: {
                name: 'medico',
              },
            },
          },
        },
      })
      if (medicos.length !== medicosIds.length) {
        return Response.json(
          { error: 'Uno o más médicos especificados no existen o no tienen el rol correcto' },
          { status: 404 }
        )
      }
    }

    // Validar enfermeras si se proporcionan
    const enfermerasIds = Array.isArray(data.enfermerasIds) ? data.enfermerasIds : []
    
    // Validar al menos una matrona (obligatorio siempre)
    if (matronasIds.length === 0) {
      return Response.json(
        { error: 'Debe seleccionar al menos una matrona' },
        { status: 400 }
      )
    }

    // Validar al menos una enfermera (obligatorio siempre)
    if (enfermerasIds.length === 0) {
      return Response.json(
        { error: 'Debe seleccionar al menos una enfermera' },
        { status: 400 }
      )
    }

    // Validar al menos un médico si es cesárea
    const esCesarea = data.tipo === 'CESAREA_ELECTIVA' || data.tipo === 'CESAREA_EMERGENCIA'
    if (esCesarea && medicosIds.length === 0) {
      return Response.json(
        { error: 'Debe seleccionar al menos un médico cuando el tipo de parto es cesárea' },
        { status: 400 }
      )
    }

    if (enfermerasIds.length > 0) {
      const enfermeras = await prisma.user.findMany({
        where: {
          id: { in: enfermerasIds },
          roles: {
            some: {
              role: {
                name: 'enfermera',
              },
            },
          },
        },
      })
      if (enfermeras.length !== enfermerasIds.length) {
        return Response.json(
          { error: 'Una o más enfermeras especificadas no existen o no tienen el rol correcto' },
          { status: 404 }
        )
      }
    }

    // Preparar datos para crear
    const partoData = {
      madreId: data.madreId,
      fechaHora: fechaHora,
      tipo: data.tipo,
      lugar: data.lugar,
      createdById: dbUser.id,
    }

    // Agregar campos opcionales
    if (data.lugarDetalle && data.lugar === 'OTRO') {
      partoData.lugarDetalle = data.lugarDetalle.trim()
    }

    if (data.complicaciones) {
      partoData.complicaciones = data.complicaciones.trim().substring(0, 500)
    }

    if (data.observaciones) {
      partoData.observaciones = data.observaciones.trim().substring(0, 500)
    }

    // Preparar relaciones many-to-many
    if (matronasIds.length > 0) {
      partoData.matronas = {
        create: matronasIds.map((userId) => ({ userId })),
      }
    }

    if (medicosIds.length > 0) {
      partoData.medicos = {
        create: medicosIds.map((userId) => ({ userId })),
      }
    }

    if (enfermerasIds.length > 0) {
      partoData.enfermeras = {
        create: enfermerasIds.map((userId) => ({ userId })),
      }
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear parto en transacción con auditoría
    const parto = await prisma.$transaction(async (tx) => {
      // Crear parto
      const nuevoParto = await tx.parto.create({
        data: partoData,
        include: {
          madre: {
            select: {
              id: true,
              rut: true,
              nombres: true,
              apellidos: true,
            },
          },
          matronas: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
          medicos: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
          enfermeras: {
            select: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: dbUser.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'Parto',
          entidadId: nuevoParto.id,
          accion: 'CREATE',
          detalleAfter: nuevoParto,
          ip,
          userAgent,
        },
      })

      return nuevoParto
    })

    return Response.json(
      {
        success: true,
        message: 'Parto registrado exitosamente',
        data: parto,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar parto:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Error al crear el parto' },
        { status: 409 }
      )
    }

    if (error.code === 'P2003') {
      // Error de foreign key constraint
      if (error.meta?.field_name?.includes('createdById')) {
        return Response.json(
          { error: 'Usuario no válido. Por favor, inicie sesión nuevamente.' },
          { status: 401 }
        )
      }
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

