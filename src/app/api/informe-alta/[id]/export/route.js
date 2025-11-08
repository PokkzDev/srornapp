import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request, { params }) {
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
    const canExport = permissions.includes('informe_alta:generate') || permissions.includes('modulo_alta:aprobar')
    
    if (!canExport) {
      return Response.json(
        { error: 'No tiene permisos para exportar informes de alta' },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await request.json()
    const formato = data.formato || 'PDF'

    // Validar formato
    const formatosValidos = ['PDF', 'DOCX', 'HTML']
    if (!formatosValidos.includes(formato.toUpperCase())) {
      return Response.json(
        { error: `Formato inválido. Debe ser uno de: ${formatosValidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar que el informe existe
    const informe = await prisma.informeAlta.findUnique({
      where: { id },
      include: {
        episodio: {
          include: {
            madre: true,
          },
        },
      },
    })

    if (!informe) {
      return Response.json(
        { error: 'Informe no encontrado' },
        { status: 404 }
      )
    }

    // Mock export - por ahora solo retornamos un mensaje
    // En el futuro aquí se implementaría la generación real del archivo
    const mensaje = `Función de exportación en ${formato.toUpperCase()} aún no implementada. Se mostrará un alert por ahora.`

    // Registrar auditoría de exportación
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
      const userAgent = request.headers.get('user-agent') || null

      await prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'InformeAlta',
          entidadId: informe.id,
          accion: 'EXPORT',
          detalleAfter: {
            formato: formato.toUpperCase(),
            timestamp: new Date().toISOString(),
          },
          ip,
          userAgent,
        },
      })
    } catch (auditError) {
      console.error('Error al registrar auditoría de exportación:', auditError)
    }

    return Response.json({
      success: true,
      message: mensaje,
      data: {
        informeId: informe.id,
        formato: formato.toUpperCase(),
        episodioId: informe.episodioId,
        madreNombre: `${informe.episodio.madre.nombres} ${informe.episodio.madre.apellidos}`,
      },
    })
  } catch (error) {
    console.error('Error al exportar informe de alta:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}







