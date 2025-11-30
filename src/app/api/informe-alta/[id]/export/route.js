import { prisma } from '@/lib/prisma'
import { verificarAuth, getAuditData, crearAuditoria, errorResponse } from '@/lib/api-helpers'
import { jsPDF } from 'jspdf'

// Include completo para exportar informe
const INFORME_EXPORT_INCLUDE = {
  generadoPor: { select: { id: true, nombre: true, email: true } },
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
      updatedBy: { select: { id: true, nombre: true, rut: true, email: true } },
    },
  },
}

export async function POST(request, { params }) {
  try {
    const auth = await verificarAuth(
      request,
      ['informe_alta:generate', 'modulo_alta:aprobar'],
      'InformeAlta',
      { requireAll: false }
    )
    if (auth.error) return auth.error
    const { user } = auth

    const { id } = await params
    const data = await request.json()
    const formato = data.formato || 'PDF'

    const formatosValidos = ['PDF', 'DOCX', 'HTML']
    if (!formatosValidos.includes(formato.toUpperCase())) {
      return errorResponse(`Formato inválido. Debe ser uno de: ${formatosValidos.join(', ')}`, 400)
    }

    const informe = await prisma.informeAlta.findUnique({
      where: { id },
      include: INFORME_EXPORT_INCLUDE,
    })

    if (!informe) {
      return errorResponse('Informe no encontrado', 404)
    }

    if (informe.episodio.estado !== 'ALTA') {
      return errorResponse('Solo se puede exportar el informe cuando el alta esté aprobada', 400)
    }

    const auditData = getAuditData(request)

    // Si el formato es PDF, generar el PDF
    if (formato.toUpperCase() === 'PDF') {
      const pdfBuffer = generarPDF(informe)

      // Registrar auditoría de exportación
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'InformeAlta',
            entidadId: informe.id,
            accion: 'EXPORT',
            detalleAfter: { formato: 'PDF', timestamp: new Date().toISOString() },
            ...auditData,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría de exportación:', auditError)
      }

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

    try {
      await prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
          entidad: 'InformeAlta',
          entidadId: informe.id,
          accion: 'EXPORT',
          detalleAfter: { formato: formato.toUpperCase(), timestamp: new Date().toISOString() },
          ...auditData,
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
    return errorResponse('Error interno del servidor', 500)
  }
}

/**
 * Genera el PDF del informe de alta
 */
function generarPDF(informe) {
  const doc = new jsPDF()
  let yPos = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)

  const addText = (text, x, y, maxW, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize)
    doc.setFont(undefined, isBold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(text || '-', maxW)
    doc.text(lines, x, y)
    return y + (lines.length * fontSize * 0.4)
  }

  // Encabezado
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('INFORME DE ALTA', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

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
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  yPos = addText(`Fecha de Ingreso: ${fechaIngreso}`, margin, yPos, maxWidth)
  
  if (informe.episodio.fechaAlta) {
    const fechaAlta = new Date(informe.episodio.fechaAlta).toLocaleDateString('es-CL', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
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
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  yPos = addText(`Fecha y Hora: ${fechaParto}`, margin, yPos, maxWidth)

  const tipoPartoMap = {
    'EUTOCICO': 'Eutócico', 'DISTOCICO': 'Distócico',
    'CESAREA_ELECTIVA': 'Cesárea Electiva', 'CESAREA_EMERGENCIA': 'Cesárea de Emergencia',
  }
  yPos = addText(`Tipo de Parto: ${tipoPartoMap[informe.parto.tipo] || informe.parto.tipo}`, margin, yPos, maxWidth)

  const lugarPartoMap = {
    'SALA_PARTO': 'Sala de Parto', 'PABELLON': 'Pabellón', 'DOMICILIO': 'Domicilio', 'OTRO': 'Otro',
  }
  const lugarTexto = informe.parto.lugarDetalle 
    ? `${lugarPartoMap[informe.parto.lugar] || informe.parto.lugar} - ${informe.parto.lugarDetalle}`
    : lugarPartoMap[informe.parto.lugar] || informe.parto.lugar
  yPos = addText(`Lugar: ${lugarTexto}`, margin, yPos, maxWidth)

  if (informe.parto.observaciones || informe.parto.complicacionesTexto) {
    yPos = addText(`Observaciones: ${informe.parto.observaciones || informe.parto.complicacionesTexto}`, margin, yPos, maxWidth)
  }
  yPos += 5

  // Recién Nacidos
  if (informe.parto.recienNacidos?.length > 0) {
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('RECIÉN NACIDOS', margin, yPos)
    yPos += 8

    if (yPos > 250) { doc.addPage(); yPos = 20 }

    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    const colWidths = [30, 30, 30, 25, 25, 60]
    const headers = ['Sexo', 'Peso (g)', 'Talla (cm)', 'Apgar 1\'', 'Apgar 5\'', 'Observaciones']
    let xPos = margin

    headers.forEach((header, index) => {
      doc.text(header, xPos, yPos)
      xPos += colWidths[index]
    })
    yPos += 6

    doc.setFont(undefined, 'normal')
    const sexoMap = { 'M': 'M', 'F': 'F', 'I': 'I' }

    informe.parto.recienNacidos.forEach((rn) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
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
      doc.text(rn.pesoNacimientoGramos?.toString() || '-', xPos, yPos)
      xPos += colWidths[1]
      doc.text(rn.tallaCm?.toString() || '-', xPos, yPos)
      xPos += colWidths[2]
      doc.text(rn.apgar1Min?.toString() || '-', xPos, yPos)
      xPos += colWidths[3]
      doc.text(rn.apgar5Min?.toString() || '-', xPos, yPos)
      xPos += colWidths[4]
      const obs = rn.observaciones || '-'
      const obsLines = doc.splitTextToSize(obs, colWidths[5])
      doc.text(obsLines, xPos, yPos)
      yPos += Math.max(6, obsLines.length * 4)
    })
  }

  // Sección de Aprobación Médica
  if (yPos > 200) { doc.addPage(); yPos = 20 } else { yPos += 10 }

  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('APROBACIÓN MÉDICA', margin, yPos)
  yPos += 15

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  const medicoAprobacion = informe.episodio.updatedBy
  if (medicoAprobacion?.nombre) {
    yPos = addText(`Médico: ${medicoAprobacion.nombre}`, margin, yPos, maxWidth)
  }
  if (medicoAprobacion?.rut) {
    yPos = addText(`RUT: ${medicoAprobacion.rut}`, margin, yPos, maxWidth)
  }

  if (informe.episodio.fechaAlta) {
    const fechaAprobacion = new Date(informe.episodio.fechaAlta).toLocaleDateString('es-CL', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
    yPos = addText(`Fecha de Aprobación: ${fechaAprobacion}`, margin, yPos, maxWidth)
  }
  yPos += 15

  // Espacio para firma y timbre
  const signatureY = yPos
  const signatureWidth = 80
  const signatureHeight = 40
  const signatureX = pageWidth - margin - signatureWidth

  doc.setLineWidth(0.5)
  doc.rect(signatureX, signatureY, signatureWidth, signatureHeight)
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.text('TIMBRE/SELLO', signatureX + signatureWidth / 2, signatureY + 5, { align: 'center' })

  const firmaX = margin
  const firmaWidth = pageWidth - margin * 2 - signatureWidth - 10
  const firmaY = signatureY + signatureHeight - 10
  
  doc.setLineWidth(0.5)
  doc.line(firmaX, firmaY, firmaX + firmaWidth, firmaY)
  doc.setFontSize(9)
  doc.text('Firma del Médico', firmaX, firmaY - 2)

  if (medicoAprobacion?.nombre) {
    doc.text(medicoAprobacion.nombre, firmaX, firmaY + 5)
  }

  // Pie de página
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    const fechaGen = new Date(informe.fechaGeneracion).toLocaleDateString('es-CL', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
    const generadoPor = informe.generadoPor?.nombre || informe.generadoPor?.email || 'Desconocido'
    doc.text(`Generado el ${fechaGen} por ${generadoPor}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}









