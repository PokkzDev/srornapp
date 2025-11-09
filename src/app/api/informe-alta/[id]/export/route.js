import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'

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

    // Verificar que el informe existe con todos los datos necesarios
    const informe = await prisma.informeAlta.findUnique({
      where: { id },
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
                pesoGr: true,
                tallaCm: true,
                apgar1: true,
                apgar5: true,
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
        { error: 'Informe no encontrado' },
        { status: 404 }
      )
    }

    // Validar que el episodio esté aprobado (estado === 'ALTA')
    if (informe.episodio.estado !== 'ALTA') {
      return Response.json(
        { error: 'Solo se puede exportar el informe cuando el alta esté aprobada' },
        { status: 400 }
      )
    }

    // Si el formato es PDF, generar el PDF
    if (formato.toUpperCase() === 'PDF') {
      const doc = new jsPDF()
      let yPos = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)

      // Función auxiliar para agregar texto con wrap
      const addText = (text, x, y, maxWidth, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize)
        if (isBold) {
          doc.setFont(undefined, 'bold')
        } else {
          doc.setFont(undefined, 'normal')
        }
        const lines = doc.splitTextToSize(text || '-', maxWidth)
        doc.text(lines, x, y)
        return y + (lines.length * fontSize * 0.4)
      }

      // Encabezado
      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.text('INFORME DE ALTA', pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      // Línea separadora
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10

      // Información de la Madre
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text('INFORMACIÓN DE LA MADRE', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      yPos = addText(`RUT: ${informe.episodio.madre.rut}`, margin, yPos, maxWidth)
      yPos = addText(`Nombres: ${informe.episodio.madre.nombres} ${informe.episodio.madre.apellidos}`, margin, yPos, maxWidth)
      if (informe.episodio.madre.edad) {
        yPos = addText(`Edad: ${informe.episodio.madre.edad} años`, margin, yPos, maxWidth)
      }
      if (informe.episodio.madre.telefono) {
        yPos = addText(`Teléfono: ${informe.episodio.madre.telefono}`, margin, yPos, maxWidth)
      }
      if (informe.episodio.madre.direccion) {
        yPos = addText(`Dirección: ${informe.episodio.madre.direccion}`, margin, yPos, maxWidth)
      }
      yPos += 5

      // Información del Episodio
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text('INFORMACIÓN DEL EPISODIO', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const fechaIngreso = new Date(informe.episodio.fechaIngreso).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      yPos = addText(`Fecha de Ingreso: ${fechaIngreso}`, margin, yPos, maxWidth)
      
      if (informe.episodio.fechaAlta) {
        const fechaAlta = new Date(informe.episodio.fechaAlta).toLocaleDateString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
        yPos = addText(`Fecha de Alta: ${fechaAlta}`, margin, yPos, maxWidth)
      }
      
      if (informe.episodio.motivoIngreso) {
        yPos = addText(`Motivo de Ingreso: ${informe.episodio.motivoIngreso}`, margin, yPos, maxWidth)
      }
      
      if (informe.episodio.condicionEgreso) {
        yPos = addText(`Condición de Egreso: ${informe.episodio.condicionEgreso}`, margin, yPos, maxWidth)
      }
      yPos += 5

      // Información del Parto
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text('INFORMACIÓN DEL PARTO', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const fechaParto = new Date(informe.parto.fechaHora).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      yPos = addText(`Fecha y Hora: ${fechaParto}`, margin, yPos, maxWidth)

      const tipoPartoMap = {
        'EUTOCICO': 'Eutócico',
        'DISTOCICO': 'Distócico',
        'CESAREA_ELECTIVA': 'Cesárea Electiva',
        'CESAREA_EMERGENCIA': 'Cesárea de Emergencia',
      }
      yPos = addText(`Tipo de Parto: ${tipoPartoMap[informe.parto.tipo] || informe.parto.tipo}`, margin, yPos, maxWidth)

      const lugarPartoMap = {
        'SALA_PARTO': 'Sala de Parto',
        'PABELLON': 'Pabellón',
        'DOMICILIO': 'Domicilio',
        'OTRO': 'Otro',
      }
      const lugarTexto = informe.parto.lugarDetalle 
        ? `${lugarPartoMap[informe.parto.lugar] || informe.parto.lugar} - ${informe.parto.lugarDetalle}`
        : lugarPartoMap[informe.parto.lugar] || informe.parto.lugar
      yPos = addText(`Lugar: ${lugarTexto}`, margin, yPos, maxWidth)

      if (informe.parto.observaciones || informe.parto.complicaciones) {
        yPos = addText(`Observaciones: ${informe.parto.observaciones || informe.parto.complicaciones}`, margin, yPos, maxWidth)
      }
      yPos += 5

      // Recién Nacidos
      if (informe.parto.recienNacidos && informe.parto.recienNacidos.length > 0) {
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.text('RECIÉN NACIDOS', margin, yPos)
        yPos += 8

        // Verificar si necesitamos una nueva página
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        // Encabezados de tabla
        doc.setFontSize(9)
        doc.setFont(undefined, 'bold')
        const tableStartY = yPos
        const colWidths = [30, 30, 30, 25, 25, 60]
        const headers = ['Sexo', 'Peso (g)', 'Talla (cm)', 'Apgar 1\'', 'Apgar 5\'', 'Observaciones']
        let xPos = margin

        headers.forEach((header, index) => {
          doc.text(header, xPos, yPos)
          xPos += colWidths[index]
        })
        yPos += 6

        // Datos de la tabla
        doc.setFont(undefined, 'normal')
        const sexoMap = {
          'M': 'M',
          'F': 'F',
          'I': 'I',
        }

        informe.parto.recienNacidos.forEach((rn, index) => {
          // Verificar si necesitamos una nueva página
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
            // Redibujar encabezados
            doc.setFont(undefined, 'bold')
            xPos = margin
            headers.forEach((header, idx) => {
              doc.text(header, xPos, yPos)
              xPos += colWidths[idx]
            })
            yPos += 6
            doc.setFont(undefined, 'normal')
          }

          xPos = margin
          doc.text(sexoMap[rn.sexo] || rn.sexo, xPos, yPos)
          xPos += colWidths[0]
          doc.text(rn.pesoGr?.toString() || '-', xPos, yPos)
          xPos += colWidths[1]
          doc.text(rn.tallaCm?.toString() || '-', xPos, yPos)
          xPos += colWidths[2]
          doc.text(rn.apgar1?.toString() || '-', xPos, yPos)
          xPos += colWidths[3]
          doc.text(rn.apgar5?.toString() || '-', xPos, yPos)
          xPos += colWidths[4]
          const observaciones = rn.observaciones || '-'
          const obsLines = doc.splitTextToSize(observaciones, colWidths[5])
          doc.text(obsLines, xPos, yPos)
          yPos += Math.max(6, obsLines.length * 4)
        })
      }

      // Pie de página
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont(undefined, 'normal')
        const fechaGen = new Date(informe.fechaGeneracion).toLocaleDateString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
        const generadoPor = informe.generadoPor?.nombre || informe.generadoPor?.email || 'Desconocido'
        doc.text(
          `Generado el ${fechaGen} por ${generadoPor}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        )
      }

      // Generar el PDF como buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

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
              formato: 'PDF',
              timestamp: new Date().toISOString(),
            },
            ip,
            userAgent,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría de exportación:', auditError)
      }

      // Retornar el PDF con headers apropiados
      const fileName = `Informe_Alta_${informe.episodio.madre.rut}_${new Date().toISOString().split('T')[0]}.pdf`
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    }

    // Para otros formatos (DOCX, HTML) aún no implementados
    const mensaje = `Función de exportación en ${formato.toUpperCase()} aún no implementada.`

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










