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
    if (!permissions.includes('informe_alta:generate')) {
      return Response.json(
        { error: 'No tiene permisos para generar informes de alta' },
        { status: 403 }
      )
    }

    // Obtener episodios en estado INGRESADO con sus madres
    const episodios = await prisma.episodioMadre.findMany({
      where: {
        estado: 'INGRESADO',
        // Solo episodios que aún no tienen informe
        informeAlta: null,
      },
      include: {
        madre: {
          select: {
            id: true,
            rut: true,
            nombres: true,
            apellidos: true,
            edad: true,
            telefono: true,
            direccion: true,
          },
        },
      },
      orderBy: {
        fechaIngreso: 'desc',
      },
    })

    // Para cada episodio, obtener los partos de la madre que ocurrieron durante o después del episodio
    const episodiosConPartos = await Promise.all(
      episodios.map(async (episodio) => {
        // Construir filtro de fecha: desde fechaIngreso hasta fechaAlta (si existe)
        const fechaFilter = episodio.fechaAlta
          ? {
              gte: episodio.fechaIngreso,
              lte: episodio.fechaAlta,
            }
          : {
              gte: episodio.fechaIngreso,
            }

        const partosRaw = await prisma.parto.findMany({
          where: {
            madreId: episodio.madreId,
            fechaHora: fechaFilter,
            // Excluir partos que ya tienen informes asociados
            informesAlta: {
              none: {},
            },
          },
          include: {
            recienNacidos: {
              select: {
                id: true,
                sexo: true,
                pesoGr: true,
                tallaCm: true,
                apgar1: true,
                apgar5: true,
                observaciones: true,
              },
            },
          },
          orderBy: {
            fechaHora: 'desc',
          },
        })

        // Deduplicar partos por ID (por si acaso hay duplicados en la BD)
        const partosMap = new Map()
        partosRaw.forEach(parto => {
          if (!partosMap.has(parto.id)) {
            partosMap.set(parto.id, parto)
          }
        })
        const partos = Array.from(partosMap.values())

        return {
          ...episodio,
          partos,
        }
      })
    )

    return Response.json({
      success: true,
      data: episodiosConPartos,
    })
  } catch (error) {
    console.error('Error al listar episodios para informe:', error)
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
    if (!user || !user.id) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('informe_alta:generate')) {
      return Response.json(
        { error: 'No tiene permisos para generar informes de alta' },
        { status: 403 }
      )
    }

    // Verificar que el usuario existe en la base de datos
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser || !dbUser.activo) {
      return Response.json(
        { error: 'Usuario no válido o inactivo' },
        { status: 401 }
      )
    }

    // Parsear datos del request
    const data = await request.json()

    // Validaciones de campos requeridos
    if (!data.partoId || !data.episodioId || !data.formato) {
      return Response.json(
        { error: 'Parto, episodio y formato son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato
    const formatosValidos = ['PDF', 'DOCX', 'HTML']
    if (!formatosValidos.includes(data.formato.toUpperCase())) {
      return Response.json(
        { error: `Formato inválido. Debe ser uno de: ${formatosValidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar que el episodio existe y está en estado INGRESADO
    const episodio = await prisma.episodioMadre.findUnique({
      where: { id: data.episodioId },
      include: {
        madre: true,
      },
    })

    if (!episodio) {
      return Response.json(
        { error: 'Episodio no encontrado' },
        { status: 404 }
      )
    }

    if (episodio.estado !== 'INGRESADO') {
      return Response.json(
        { error: 'Solo se pueden generar informes para episodios en estado INGRESADO' },
        { status: 400 }
      )
    }

    // Verificar que el episodio no tenga ya un informe
    const informeExistente = await prisma.informeAlta.findUnique({
      where: { episodioId: data.episodioId },
    })

    if (informeExistente) {
      return Response.json(
        { error: 'Este episodio ya tiene un informe de alta generado' },
        { status: 400 }
      )
    }

    // Verificar que el parto existe y pertenece a la misma madre del episodio
    const parto = await prisma.parto.findUnique({
      where: { id: data.partoId },
      include: {
        recienNacidos: {
          select: {
            id: true,
            sexo: true,
            pesoGr: true,
            tallaCm: true,
            apgar1: true,
            apgar5: true,
            observaciones: true,
          },
        },
      },
    })

    if (!parto) {
      return Response.json(
        { error: 'Parto no encontrado' },
        { status: 404 }
      )
    }

    if (parto.madreId !== episodio.madreId) {
      return Response.json(
        { error: 'El parto no pertenece a la madre del episodio' },
        { status: 400 }
      )
    }

    // Preparar contenido del informe en formato JSON
    const contenido = {
      madre: {
        id: episodio.madre.id,
        rut: episodio.madre.rut,
        nombres: episodio.madre.nombres,
        apellidos: episodio.madre.apellidos,
        edad: episodio.madre.edad,
        telefono: episodio.madre.telefono,
        direccion: episodio.madre.direccion,
      },
      episodio: {
        id: episodio.id,
        fechaIngreso: episodio.fechaIngreso.toISOString(),
        motivoIngreso: episodio.motivoIngreso,
        estado: episodio.estado,
      },
      parto: {
        id: parto.id,
        fechaHora: parto.fechaHora.toISOString(),
        tipo: parto.tipo,
        lugar: parto.lugar,
        lugarDetalle: parto.lugarDetalle,
        complicaciones: parto.complicaciones,
        observaciones: parto.observaciones,
      },
      recienNacidos: parto.recienNacidos.map((rn) => ({
        id: rn.id,
        sexo: rn.sexo,
        pesoGr: rn.pesoGr,
        tallaCm: rn.tallaCm,
        apgar1: rn.apgar1,
        apgar5: rn.apgar5,
        observaciones: rn.observaciones,
      })),
    }

    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Crear informe en transacción con auditoría
    const informe = await prisma.$transaction(async (tx) => {
      // Crear informe
      const nuevoInforme = await tx.informeAlta.create({
        data: {
          partoId: data.partoId,
          episodioId: data.episodioId,
          formato: data.formato.toUpperCase(),
          generadoPorId: user.id,
          contenido: contenido,
        },
        include: {
          generadoPor: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          parto: {
            include: {
              recienNacidos: true,
            },
          },
          episodio: {
            include: {
              madre: true,
            },
          },
        },
      })

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'InformeAlta',
          entidadId: nuevoInforme.id,
          accion: 'CREATE',
          detalleAfter: nuevoInforme,
          ip,
          userAgent,
        },
      })

      return nuevoInforme
    })

    return Response.json({
      success: true,
      message: 'Informe de alta generado exitosamente',
      data: informe,
    })
  } catch (error) {
    console.error('Error al generar informe de alta:', error)

    // Manejar errores de Prisma
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Este episodio ya tiene un informe de alta generado' },
        { status: 400 }
      )
    }

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

