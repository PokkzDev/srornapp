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
    // Permitir acceso si tiene permiso para ver recién nacidos O si tiene permiso para crear controles neonatales
    // (necesario para que las enfermeras puedan buscar recién nacidos al registrar controles)
    const permissions = await getUserPermissions()
    const canView = permissions.includes('recien-nacido:view')
    const canCreateControl = permissions.includes('control_neonatal:create')
    
    if (!canView && !canCreateControl) {
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
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {}
    
    if (search) {
      const searchConditions = [
        { parto: { madre: { rut: { contains: search } } } },
        { parto: { madre: { nombres: { contains: search } } } },
        { parto: { madre: { apellidos: { contains: search } } } },
        { observaciones: { contains: search } },
      ]
      
      // Solo buscar por sexo si el término de búsqueda coincide exactamente con un valor del enum
      const sexosValidos = ['M', 'F', 'I']
      if (sexosValidos.includes(search.toUpperCase())) {
        searchConditions.push({ sexo: search.toUpperCase() })
      }
      
      where.OR = searchConditions
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
    if (!permissions.includes('recien-nacido:create')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: dbUser.id,
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

    // Normalizar nombres de campos (aceptar ambos nombres antiguos y nuevos)
    const pesoNacimientoGramos = data.pesoNacimientoGramos !== undefined ? data.pesoNacimientoGramos : data.pesoGr
    const apgar1Min = data.apgar1Min !== undefined ? data.apgar1Min : data.apgar1
    const apgar5Min = data.apgar5Min !== undefined ? data.apgar5Min : data.apgar5

    // Validar valores numéricos si están presentes
    if (pesoNacimientoGramos !== undefined && pesoNacimientoGramos !== null && pesoNacimientoGramos !== '') {
      const peso = Number.parseInt(pesoNacimientoGramos)
      if (Number.isNaN(peso) || peso < 0) {
        return Response.json(
          { error: 'El peso debe ser un número válido (gramos)' },
          { status: 400 }
        )
      }
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      const tallaCm = Number.parseInt(data.tallaCm)
      if (Number.isNaN(tallaCm) || tallaCm < 0) {
        return Response.json(
          { error: 'La talla debe ser un número válido (centímetros)' },
          { status: 400 }
        )
      }
    }

    if (apgar1Min !== undefined && apgar1Min !== null && apgar1Min !== '') {
      const apgar1 = Number.parseInt(apgar1Min)
      if (Number.isNaN(apgar1) || apgar1 < 0 || apgar1 > 10) {
        return Response.json(
          { error: 'El Apgar 1\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    if (apgar5Min !== undefined && apgar5Min !== null && apgar5Min !== '') {
      const apgar5 = Number.parseInt(apgar5Min)
      if (Number.isNaN(apgar5) || apgar5 < 0 || apgar5 > 10) {
        return Response.json(
          { error: 'El Apgar 5\' debe ser un número entre 0 y 10' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para crear (usar nombres nuevos del schema)
    const rnData = {
      partoId: data.partoId,
      sexo: data.sexo,
      createdById: dbUser.id,
      // REM
      esNacidoVivo: data.esNacidoVivo !== undefined ? data.esNacidoVivo : true,
      categoriaPeso: data.categoriaPeso || null,
      // Anomalías congénitas
      anomaliaCongenita: data.anomaliaCongenita || null,
      anomaliaCongenitaDescripcion: data.anomaliaCongenita ? (data.anomaliaCongenitaDescripcion?.trim().substring(0, 500) || null) : null,
      // Reanimación y EHI
      reanimacionBasica: data.reanimacionBasica || null,
      reanimacionAvanzada: data.reanimacionAvanzada || null,
      ehiGradoII_III: data.ehiGradoII_III || null,
      // Profilaxis inmediata
      profilaxisOcularGonorrea: data.profilaxisOcularGonorrea || null,
      profilaxisHepatitisB: data.profilaxisHepatitisB || null,
      profilaxisCompletaHepatitisB: data.profilaxisCompletaHepatitisB || null,
      // Transmisión vertical Hep B
      hijoMadreHepatitisBPositiva: data.hijoMadreHepatitisBPositiva || null,
      // Lactancia / contacto / alojamiento
      lactancia60Min: data.lactancia60Min || null,
      alojamientoConjuntoInmediato: data.alojamientoConjuntoInmediato || null,
      contactoPielPielInmediato: data.contactoPielPielInmediato || null,
      // Condición étnica/migrante
      esPuebloOriginario: data.esPuebloOriginario || null,
      esMigrante: data.esMigrante || null,
    }

    // Agregar campos numéricos si están presentes (usar nombres nuevos)
    if (pesoNacimientoGramos !== undefined && pesoNacimientoGramos !== null && pesoNacimientoGramos !== '') {
      rnData.pesoNacimientoGramos = Number.parseInt(pesoNacimientoGramos)
    }

    if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
      rnData.tallaCm = Number.parseInt(data.tallaCm)
    }

    if (apgar1Min !== undefined && apgar1Min !== null && apgar1Min !== '') {
      rnData.apgar1Min = Number.parseInt(apgar1Min)
    }

    if (apgar5Min !== undefined && apgar5Min !== null && apgar5Min !== '') {
      rnData.apgar5Min = Number.parseInt(apgar5Min)
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
          usuarioId: dbUser.id,
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









