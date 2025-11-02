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
    const hasViewPermission = permissions.includes('madre:view') || permissions.includes('madre:view_limited')
    if (!hasViewPermission) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Madre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para visualizar madres' },
        { status: 403 }
      )
    }

    const isLimited = permissions.includes('madre:view_limited') && !permissions.includes('madre:view')

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20') // Default 20 items per page
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (search) {
      where.OR = [
        { rut: { contains: search } },
        { nombres: { contains: search } },
        { apellidos: { contains: search } },
        { fichaClinica: { contains: search } },
      ]
    }

    // Obtener madres con paginación
    // Si tiene permisos limitados, solo mostrar campos básicos
    const selectFields = isLimited ? {
      id: true,
      rut: true,
      nombres: true,
      apellidos: true,
      edad: true,
      fechaNacimiento: true,
      direccion: true,
      telefono: true,
      fichaClinica: true,
      createdAt: true,
      updatedAt: true,
    } : {
      id: true,
      rut: true,
      nombres: true,
      apellidos: true,
      edad: true,
      fechaNacimiento: true,
      direccion: true,
      telefono: true,
      fichaClinica: true,
      createdAt: true,
      updatedAt: true,
    }

    const [madres, total] = await Promise.all([
      prisma.madre.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { apellidos: 'asc' },
          { nombres: 'asc' },
        ],
        select: selectFields,
      }),
      prisma.madre.count({ where }),
    ])

    return Response.json({
      success: true,
      data: madres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al listar madres:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para validar RUT chileno (formato: sin puntos, con guion)
function validarRUT(rut) {
  if (!rut || typeof rut !== 'string') {
    return false
  }

  // Formato esperado: números seguidos de guion y dígito verificador
  const rutRegex = /^(\d{7,8})-(\d|k|K)$/
  if (!rutRegex.test(rut)) {
    return false
  }

  // Separar número y dígito verificador
  const [numero, dv] = rut.split('-')
  const dvUpper = dv.toUpperCase()

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  // Sumar desde el final
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  let dvCalculado = 11 - resto

  if (dvCalculado === 11) {
    dvCalculado = '0'
  } else if (dvCalculado === 10) {
    dvCalculado = 'K'
  } else {
    dvCalculado = dvCalculado.toString()
  }

  return dvUpper === dvCalculado
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
    const hasCreatePermission = permissions.includes('madre:create') || permissions.includes('madre:create_limited')
    if (!hasCreatePermission) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Madre',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para registrar madres' },
        { status: 403 }
      )
    }

    const isLimited = permissions.includes('madre:create_limited') && !permissions.includes('madre:create')

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.rut || !data.nombres || !data.apellidos) {
      return Response.json(
        { error: 'RUT, nombres y apellidos son requeridos' },
        { status: 400 }
      )
    }

    // Si tiene permisos limitados, validar que solo se envíen campos permitidos
    if (isLimited) {
      const allowedFields = ['rut', 'nombres', 'apellidos', 'edad', 'fechaNacimiento', 'direccion', 'telefono', 'fichaClinica']
      const providedFields = Object.keys(data)
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field))
      
      if (invalidFields.length > 0) {
        return Response.json(
          { error: `No tiene permisos para establecer los siguientes campos: ${invalidFields.join(', ')}` },
          { status: 403 }
        )
      }
    }

    // Validar formato RUT
    if (!validarRUT(data.rut)) {
      return Response.json(
        { error: 'RUT inválido. Formato esperado: 12345678-9 (sin puntos, con guion)' },
        { status: 400 }
      )
    }

    // Normalizar RUT (mayúsculas en dígito verificador)
    const rutNormalizado = data.rut.toUpperCase()

    // Validar que el RUT no exista
    const rutExistente = await prisma.madre.findUnique({
      where: { rut: rutNormalizado },
    })

    if (rutExistente) {
      return Response.json(
        { error: 'Ya existe una madre registrada con este RUT' },
        { status: 409 }
      )
    }

    // Si se proporciona ficha clínica, validar que sea única
    if (data.fichaClinica) {
      const fichaExistente = await prisma.madre.findUnique({
        where: { fichaClinica: data.fichaClinica },
      })

      if (fichaExistente) {
        return Response.json(
          { error: 'Ya existe una madre registrada con esta ficha clínica' },
          { status: 409 }
        )
      }
    }

    // Preparar datos para crear
    const madreData = {
      rut: rutNormalizado,
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      createdById: user.id,
    }

    // Agregar campos opcionales si están presentes
    if (data.edad !== undefined && data.edad !== null && data.edad !== '') {
      madreData.edad = parseInt(data.edad)
      if (isNaN(madreData.edad) || madreData.edad < 0) {
        return Response.json(
          { error: 'La edad debe ser un número válido' },
          { status: 400 }
        )
      }
    }

    if (data.fechaNacimiento) {
      madreData.fechaNacimiento = new Date(data.fechaNacimiento)
      if (isNaN(madreData.fechaNacimiento.getTime())) {
        return Response.json(
          { error: 'Fecha de nacimiento inválida' },
          { status: 400 }
        )
      }
    }

    if (data.direccion) {
      madreData.direccion = data.direccion.trim()
    }

    if (data.telefono) {
      madreData.telefono = data.telefono.trim()
    }

    if (data.fichaClinica) {
      madreData.fichaClinica = data.fichaClinica.trim()
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear madre en transacción con auditoría
    const madre = await prisma.$transaction(async (tx) => {
      // Crear madre
      const nuevaMadre = await tx.madre.create({
        data: madreData,
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'Madre',
          entidadId: nuevaMadre.id,
          accion: 'CREATE',
          detalleAfter: nuevaMadre,
          ip,
          userAgent,
        },
      })

      return nuevaMadre
    })

    return Response.json(
      {
        success: true,
        message: 'Madre registrada exitosamente',
        data: madre,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar madre:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2002') {
      // Error de unique constraint
      if (error.meta?.target?.includes('rut')) {
        return Response.json(
          { error: 'Ya existe una madre registrada con este RUT' },
          { status: 409 }
        )
      }
      if (error.meta?.target?.includes('fichaClinica')) {
        return Response.json(
          { error: 'Ya existe una madre registrada con esta ficha clínica' },
          { status: 409 }
        )
      }
    }

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

