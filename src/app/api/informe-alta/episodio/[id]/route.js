import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar permisos - tanto para generar como para aprobar
    const permissions = await getUserPermissions()
    const canView = permissions.includes('informe_alta:generate') || permissions.includes('modulo_alta:aprobar')
    
    if (!canView) {
      return Response.json(
        { error: 'No tiene permisos para ver informes de alta' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obtener el informe con todos los datos relacionados
    const informe = await prisma.informeAlta.findUnique({
      where: { episodioId: id },
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
            recienNacidos: {
              select: {
                id: true,
                sexo: true,
                pesoNacimientoGramos: true,
                tallaCm: true,
                apgar1Min: true,
                apgar5Min: true,
                observaciones: true,
              },
            },
          },
        },
        episodio: {
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
        },
      },
    })

    if (!informe) {
      return Response.json(
        { error: 'Informe no encontrado para este episodio' },
        { status: 404 }
      )
    }

    // Formatear los datos para que coincidan con la estructura esperada por el frontend
    const informeFormateado = {
      id: informe.id,
      fechaGeneracion: informe.fechaGeneracion.toISOString(),
      generadoPor: informe.generadoPor?.nombre || informe.generadoPor?.email || 'Desconocido',
      formato: informe.formato,
      parto: {
        fechaHora: informe.parto.fechaHora.toISOString(),
        tipo: informe.parto.tipo,
        lugar: informe.parto.lugar,
        lugarDetalle: informe.parto.lugarDetalle,
        observaciones: informe.parto.observaciones || informe.parto.complicacionesTexto,
      },
      recienNacidos: informe.parto.recienNacidos.map((rn) => ({
        sexo: rn.sexo,
        pesoNacimientoGramos: rn.pesoNacimientoGramos,
        tallaCm: rn.tallaCm,
        apgar1Min: rn.apgar1Min,
        apgar5Min: rn.apgar5Min,
        observaciones: rn.observaciones,
      })),
      episodio: {
        id: informe.episodio.id,
        fechaIngreso: informe.episodio.fechaIngreso.toISOString(),
        estado: informe.episodio.estado,
        motivoIngreso: informe.episodio.motivoIngreso,
        fechaAlta: informe.episodio.fechaAlta?.toISOString() || null,
        condicionEgreso: informe.episodio.condicionEgreso || null,
      },
      madre: {
        id: informe.episodio.madre.id,
        rut: informe.episodio.madre.rut,
        nombres: informe.episodio.madre.nombres,
        apellidos: informe.episodio.madre.apellidos,
        edad: informe.episodio.madre.edad,
        telefono: informe.episodio.madre.telefono,
        direccion: informe.episodio.madre.direccion,
      },
    }

    return Response.json({
      success: true,
      data: informeFormateado,
    })
  } catch (error) {
    console.error('Error al obtener informe de alta:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}







