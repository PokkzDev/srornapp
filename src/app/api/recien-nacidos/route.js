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
    if (!permissions.includes('recien-nacido:view')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'RecienNacido',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar recién nacidos' },
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
      where.OR = [
        { sexo: { contains: search } },
        { parto: { madre: { rut: { contains: search } } } },
        { parto: { madre: { nombres: { contains: search } } } },
        { parto: { madre: { apellidos: { contains: search } } } },
        { observaciones: { contains: search } },
      ]
    }

    // Obtener recién nacidos con paginación
    const [recienNacidos, total] = await Promise.all([
      prisma.recienNacido.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
        ],
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
      }),
      prisma.recienNacido.count({ where }),
    ])

    return Response.json({
      success: true,
      data: recienNacidos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al listar recién nacidos:', error)
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
    if (!permissions.includes('recien-nacido:create')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'RecienNacido',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para registrar recién nacidos' },
        { status: 403 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.partoId || !data.sexo) {
      return Response.json(
        { error: 'Parto y sexo son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el parto existe
    const parto = await prisma.parto.findUnique({
      where: { id: data.partoId },
    })

    if (!parto) {
      return Response.json(
        { error: 'El parto especificado no existe' },
        { status: 404 }
      )
    }

    // Validar sexo (enum)
    const sexosValidos = ['M', 'F', 'I']
    if (!sexosValidos.includes(data.sexo)) {
      return Response.json(
        { error: 'Sexo inválido. Valores válidos: M, F, I' },
        { status: 400 }
      )
    }

    // Validar valores numéricos si están presentes
    if (data.pesoGr !== undefined && data.pesoGr !== null && data.pesoGr !== '') {
      const pesoGr = parseInt(data.pesoGr)
      if (isNaN(pesoGr) || pesoGr < 0) {
        return Response.json(
          { error: 'El peso debe ser un número válido (gramos)' },
          { status: 400 }
        )
      }
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      const tallaCm = parseInt(data.tallaCm)
      if (isNaN(tallaCm) || tallaCm < 0) {
        return Response.json(
          { error: 'La talla debe ser un número válido (centímetros)' },
          { status: 400 }
        )
      }
    }

    if (data.apgar1 !== undefined && data.apgar1 !== null && data.apgar1 !== '') {
      const apgar1 = parseInt(data.apgar1)
      if (isNaN(apgar1) || apgar1 < 0 || apgar1 > 10) {
        return Response.json(
          { error: 'El Apgar 1\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    if (data.apgar5 !== undefined && data.apgar5 !== null && data.apgar5 !== '') {
      const apgar5 = parseInt(data.apgar5)
      if (isNaN(apgar5) || apgar5 < 0 || apgar5 > 10) {
        return Response.json(
          { error: 'El Apgar 5\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para crear
    const rnData = {
      partoId: data.partoId,
      sexo: data.sexo,
      createdById: user.id,
    }

    // Agregar campos opcionales si están presentes
    if (data.pesoGr !== undefined && data.pesoGr !== null && data.pesoGr !== '') {
      rnData.pesoGr = parseInt(data.pesoGr)
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      rnData.tallaCm = parseInt(data.tallaCm)
    }

    if (data.apgar1 !== undefined && data.apgar1 !== null && data.apgar1 !== '') {
      rnData.apgar1 = parseInt(data.apgar1)
    }

    if (data.apgar5 !== undefined && data.apgar5 !== null && data.apgar5 !== '') {
      rnData.apgar5 = parseInt(data.apgar5)
    }

    if (data.observaciones) {
      rnData.observaciones = data.observaciones.trim().substring(0, 500)
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear recién nacido en transacción con auditoría
    const recienNacido = await prisma.$transaction(async (tx) => {
      // Crear recién nacido
      const nuevoRN = await tx.recienNacido.create({
        data: rnData,
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
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'RecienNacido',
          entidadId: nuevoRN.id,
          accion: 'CREATE',
          detalleAfter: nuevoRN,
          ip,
          userAgent,
        },
      })

      return nuevoRN
    })

    return Response.json(
      {
        success: true,
        message: 'Recién nacido registrado exitosamente',
        data: recienNacido,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar recién nacido:', error)

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



