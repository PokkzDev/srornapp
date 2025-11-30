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
      permissions.includes('urni:atencion:view')
    
    if (!hasViewPermission) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'AtencionURNI',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar atenciones URNI' },
        { status: 403 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const episodioId = searchParams.get('episodioId') || ''
    const rnId = searchParams.get('rnId') || ''
    const medicoId = searchParams.get('medicoId') || ''
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (episodioId) {
      where.episodioId = episodioId
    }
    
    if (rnId) {
      where.rnId = rnId
    }
    
    if (medicoId) {
      where.medicoId = medicoId
    }

    // Obtener atenciones con relaciones
    const [atenciones, total] = await Promise.all([
      prisma.atencionURNI.findMany({
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
          episodio: {
            select: {
              id: true,
              estado: true,
              fechaHoraIngreso: true,
            },
          },
          medico: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      }),
      prisma.atencionURNI.count({ where }),
    ])

    return Response.json({
      data: atenciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener atenciones URNI:', error)
    return Response.json(
      { error: 'Error al obtener atenciones URNI' },
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
    if (!permissions.includes('urni:atencion:create')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'AtencionURNI',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para crear atenciones URNI' },
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

    // Determinar episodioId: usar el proporcionado o buscar el episodio activo
    let episodioId = data.episodioId || null

    if (!episodioId) {
      // Buscar episodio activo del RN
      const episodioActivo = await prisma.episodioURNI.findFirst({
        where: {
          rnId: data.rnId,
          estado: 'INGRESADO',
        },
      })

      if (episodioActivo) {
        episodioId = episodioActivo.id
      }
    }

    // Si se proporciona episodioId, validar que existe y está activo
    if (episodioId) {
      const episodio = await prisma.episodioURNI.findUnique({
        where: { id: episodioId },
      })

      if (!episodio) {
        return Response.json(
          { error: 'El episodio URNI especificado no existe' },
          { status: 404 }
        )
      }

      if (episodio.estado !== 'INGRESADO') {
        return Response.json(
          { error: 'Solo se pueden crear atenciones para episodios URNI en estado INGRESADO' },
          { status: 400 }
        )
      }

      // Validar que el episodio pertenece al RN
      if (episodio.rnId !== data.rnId) {
        return Response.json(
          { error: 'El episodio URNI no pertenece al recién nacido especificado' },
          { status: 400 }
        )
      }
    } else {
      // Si no hay episodio activo, aún se puede crear la atención pero sin episodio
      // Esto permite flexibilidad según el flujo clínico
    }

    // Validar fechaHora si se proporciona
    let fechaHora = new Date()
    if (data.fechaHora) {
      fechaHora = new Date(data.fechaHora)
      if (Number.isNaN(fechaHora.getTime())) {
        return Response.json(
          { error: 'Fecha/hora inválida' },
          { status: 400 }
        )
      }
    }

    // Validar que el usuario existe en la base de datos antes de usarlo como médico
    let medicoId = null
    if (user.id) {
      const usuarioExiste = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      })

      if (usuarioExiste) {
        medicoId = user.id
      } else {
        console.warn(`Usuario autenticado con ID ${user.id} no encontrado en la base de datos`)
        // No fallar, solo registrar sin médico asignado (medicoId es opcional)
      }
    }

    // Preparar datos para crear
    const atencionData = {
      rnId: data.rnId,
      episodioId: episodioId,
      fechaHora: fechaHora,
    }

    // Solo agregar medicoId si es válido
    if (medicoId) {
      atencionData.medicoId = medicoId
    }

    // Agregar campos opcionales
    if (data.diagnostico) {
      atencionData.diagnostico = data.diagnostico.trim().substring(0, 500)
    }

    if (data.indicaciones) {
      atencionData.indicaciones = data.indicaciones.trim().substring(0, 800)
    }

    if (data.evolucion) {
      atencionData.evolucion = data.evolucion.trim().substring(0, 1000)
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear atención en transacción con auditoría
    const atencion = await prisma.$transaction(async (tx) => {
      // Crear atención
      const nuevaAtencion = await tx.atencionURNI.create({
        data: atencionData,
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
          episodio: {
            select: {
              id: true,
              estado: true,
              fechaHoraIngreso: true,
            },
          },
          medico: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      })

      // Registrar auditoría (solo si el usuario existe en la base de datos)
      if (medicoId) {
        await tx.auditoria.create({
          data: {
            usuarioId: medicoId,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'AtencionURNI',
            entidadId: nuevaAtencion.id,
            accion: 'CREATE',
            detalleAfter: nuevaAtencion,
            ip,
            userAgent,
          },
        })
      } else {
        // Registrar auditoría sin usuarioId si el usuario no existe en la BD
        await tx.auditoria.create({
          data: {
            usuarioId: null,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'AtencionURNI',
            entidadId: nuevaAtencion.id,
            accion: 'CREATE',
            detalleAfter: nuevaAtencion,
            ip,
            userAgent,
          },
        })
      }

      return nuevaAtencion
    })

    return Response.json(
      {
        success: true,
        message: 'Atención URNI registrada exitosamente',
        data: atencion,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar atención URNI:', error)
    
    // Manejar errores de Prisma
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'Referencia inválida en los datos proporcionados. Verifique que el usuario, recién nacido o episodio existan.' },
        { status: 400 }
      )
    }
    
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

