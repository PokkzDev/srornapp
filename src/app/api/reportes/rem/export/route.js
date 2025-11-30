import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'

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
    if (!permissions.includes('reporte_rem:generate')) {
      return Response.json(
        { error: 'No tiene permisos para exportar reportes REM' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const mes = Number.parseInt(searchParams.get('mes'))
    const anio = Number.parseInt(searchParams.get('anio'))

    // Validar parámetros
    if (!mes || !anio || mes < 1 || mes > 12 || anio < 2000 || anio > 2100) {
      return Response.json(
        { error: 'Mes y año son requeridos y deben ser válidos' },
        { status: 400 }
      )
    }

    // Obtener datos del reporte - usar URL interna para evitar problemas SSL
    // En servidor, usar localhost con HTTP para llamadas internas
    // Permite usar variable de entorno para casos especiales (ej: contenedores)
    const internalBaseUrl = process.env.INTERNAL_API_URL || `http://localhost:${process.env.PORT || 3005}`
    const reporteUrl = `${internalBaseUrl}/api/reportes/rem?mes=${mes}&anio=${anio}`
    
    const reporteResponse = await fetch(reporteUrl, {
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    if (!reporteResponse.ok) {
      const errorData = await reporteResponse.json()
      return Response.json(
        { error: errorData.error || 'Error al obtener datos del reporte' },
        { status: reporteResponse.status }
      )
    }

    const { data: reporteData } = await reporteResponse.json()

    // Crear PDF
    const doc = new jsPDF({
      orientation: 'landscape', // Horizontal para tablas anchas
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    const maxWidth = pageWidth - (margin * 2)
    let yPos = margin

    // Función para agregar nueva página si es necesario
    const checkNewPage = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        return true
      }
      return false
    }

    // Función para agregar encabezado de sección
    const addSectionHeader = (text, fontSize = 14) => {
      checkNewPage(15)
      doc.setFontSize(fontSize)
      doc.setFont(undefined, 'bold')
      doc.text(text, margin, yPos)
      yPos += 8
      doc.setFont(undefined, 'normal')
    }

    // Función para agregar tabla simple con mejor alineación
    const addSimpleTable = (headers, rows, colWidths) => {
      checkNewPage(30)
      
      const rowHeight = 7
      // Altura del encabezado más grande para permitir texto en múltiples líneas
      const headerHeight = 10
      
      // Normalizar anchos de columna para que sumen exactamente el ancho disponible
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0)
      const scaleFactor = maxWidth / totalWidth
      const normalizedWidths = colWidths.map(w => w * scaleFactor)

      // Dibujar encabezado con bordes
      doc.setFontSize(8) // Tamaño de fuente más pequeño para encabezados
      doc.setFont(undefined, 'bold')
      let xPos = margin
      
      // Configurar estilo de línea
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.1)
      
      // Calcular altura necesaria para el encabezado (puede variar según el texto)
      let maxHeaderLines = 1
      headers.forEach((header, i) => {
        const lines = doc.splitTextToSize(header, normalizedWidths[i] - 4)
        if (lines.length > maxHeaderLines) {
          maxHeaderLines = lines.length
        }
      })
      const actualHeaderHeight = Math.max(headerHeight, maxHeaderLines * 4 + 2)
      
      // Dibujar líneas horizontales del encabezado
      doc.line(margin, yPos, margin + maxWidth, yPos) // Línea superior
      doc.line(margin, yPos + actualHeaderHeight, margin + maxWidth, yPos + actualHeaderHeight) // Línea inferior
      
      // Dibujar línea vertical del borde izquierdo
      doc.line(margin, yPos, margin, yPos + actualHeaderHeight)
      
      // Dibujar líneas verticales entre columnas del encabezado y texto
      headers.forEach((header, i) => {
        // Dibujar línea vertical antes de cada columna (excepto la primera)
        if (i > 0) {
          doc.line(xPos, yPos, xPos, yPos + actualHeaderHeight)
        }
        // Texto centrado en la celda con soporte para múltiples líneas
        const cellCenterX = xPos + normalizedWidths[i] / 2
        const textLines = doc.splitTextToSize(header, normalizedWidths[i] - 4)
        const lineHeight = 4
        const startY = yPos + (actualHeaderHeight - (textLines.length - 1) * lineHeight) / 2 + 3
        
        textLines.forEach((line, lineIdx) => {
          doc.text(line, cellCenterX, startY + (lineIdx * lineHeight), { 
            maxWidth: normalizedWidths[i] - 4, 
            align: 'center' 
          })
        })
        xPos += normalizedWidths[i]
      })
      
      // Dibujar línea vertical del borde derecho
      doc.line(margin + maxWidth, yPos, margin + maxWidth, yPos + actualHeaderHeight)
      
      yPos += actualHeaderHeight

      // Filas de datos
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)
      rows.forEach((row, rowIdx) => {
        checkNewPage(rowHeight)
        xPos = margin
        
        // Dibujar líneas verticales entre columnas y rectángulo de la fila
        row.forEach((cell, i) => {
          // Dibujar línea vertical antes de cada columna (excepto la primera)
          if (i > 0) {
            doc.line(xPos, yPos, xPos, yPos + rowHeight)
          }
          
          // Texto centrado en la celda (excepto primera columna que puede ser texto largo)
          const cellCenterX = xPos + normalizedWidths[i] / 2
          const cellValue = String(cell !== null && cell !== undefined ? cell : '-')
          const align = i === 0 ? 'left' : 'center' // Primera columna alineada a la izquierda, resto centrado
          const textX = i === 0 ? xPos + 2 : cellCenterX
          
          doc.text(cellValue, textX, yPos + 5, { 
            maxWidth: normalizedWidths[i] - 4, 
            align: align 
          })
          xPos += normalizedWidths[i]
        })
        
        // Dibujar líneas horizontales: superior e inferior de la fila
        doc.line(margin, yPos, margin + maxWidth, yPos) // Línea superior
        doc.line(margin, yPos + rowHeight, margin + maxWidth, yPos + rowHeight) // Línea inferior
        
        // Dibujar líneas verticales de los bordes
        doc.line(margin, yPos, margin, yPos + rowHeight) // Borde izquierdo
        doc.line(margin + maxWidth, yPos, margin + maxWidth, yPos + rowHeight) // Borde derecho
        
        yPos += rowHeight
      })

      yPos += 5
    }

    // Encabezado del documento
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('REPORTE REM - REGISTRO ESTADÍSTICO MENSUAL', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Período: ${meses[mes - 1]} ${anio}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    // SECCIÓN D.1: INFORMACIÓN GENERAL DE RECIÉN NACIDOS VIVOS
    addSectionHeader('SECCIÓN D.1: INFORMACIÓN GENERAL DE RECIÉN NACIDOS VIVOS', 12)
    
    const headersD1 = ['TIPO', 'TOTAL', '<500', '500-999', '1000-1499', '1500-1999', '2000-2499', '2500-2999', '3000-3999', '>=4000', 'Anomalia', 'REM A24']
    const colWidthsD1 = [35, 14, 12, 13, 15, 15, 15, 15, 15, 13, 14, 12]
    const rowsD1 = [
      [
        'NACIDOS VIVOS',
        reporteData.seccionD1.total,
        reporteData.seccionD1.pesoAlNacer.menor500,
        reporteData.seccionD1.pesoAlNacer.entre500y999,
        reporteData.seccionD1.pesoAlNacer.entre1000y1499,
        reporteData.seccionD1.pesoAlNacer.entre1500y1999,
        reporteData.seccionD1.pesoAlNacer.entre2000y2499,
        reporteData.seccionD1.pesoAlNacer.entre2500y2999,
        reporteData.seccionD1.pesoAlNacer.entre3000y3999,
        reporteData.seccionD1.pesoAlNacer.entre4000yMas,
        reporteData.seccionD1.anomaliasCongenitas,
        reporteData.seccionD1.remA24 || '-',
      ],
    ]
    addSimpleTable(headersD1, rowsD1, colWidthsD1)

    // SECCIÓN D.2: ATENCIÓN INMEDIATA DEL RECIÉN NACIDO
    addSectionHeader('SECCIÓN D.2: ATENCIÓN INMEDIATA DEL RECIÉN NACIDO', 12)
    
    const headersD2 = ['TIPO', 'PROFIL. H.B', 'PROFIL. OCULAR', 'VAGINAL', 'INSTRUM.', 'CESAREA', 'EXTRAH.', 'APGAR <=3 1min', 'APGAR <=6 5min', 'REAN. BASICA', 'REAN. AVANZ.', 'EHI II-III', 'REM A24']
    const colWidthsD2 = [30, 18, 18, 14, 16, 14, 16, 18, 18, 16, 16, 14, 12]
    const rowsD2 = [
      [
        'NACIDOS VIVOS',
        reporteData.seccionD2.profilaxis.hepatitisB,
        reporteData.seccionD2.profilaxis.ocular,
        reporteData.seccionD2.tipoParto.vaginal,
        reporteData.seccionD2.tipoParto.instrumental,
        reporteData.seccionD2.tipoParto.cesarea,
        reporteData.seccionD2.tipoParto.extrahospitalario,
        reporteData.seccionD2.apgar.menorIgual3al1min,
        reporteData.seccionD2.apgar.menorIgual6a5min,
        reporteData.seccionD2.reanimacion.basica,
        reporteData.seccionD2.reanimacion.avanzada,
        reporteData.seccionD2.ehi23,
        reporteData.seccionD2.remA24 || '-',
      ],
    ]
    addSimpleTable(headersD2, rowsD2, colWidthsD2)

    // Desglose instrumental y cesáreas
    checkNewPage(20)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Desglose:', margin, yPos)
    yPos += 6
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.text(`Instrumental - Distócico: ${reporteData.seccionD2.instrumental.distocico}`, margin + 10, yPos)
    yPos += 5
    doc.text(`Instrumental - Vacuum: ${reporteData.seccionD2.instrumental.vacuum}`, margin + 10, yPos)
    yPos += 5
    doc.text(`Cesárea Urgencia: ${reporteData.seccionD2.cesareas.urgencia}`, margin + 10, yPos)
    yPos += 5
    doc.text(`Cesárea Electiva: ${reporteData.seccionD2.cesareas.electiva}`, margin + 10, yPos)
    yPos += 8

    // SECCIÓN D: PROFILAXIS OCULAR
    addSectionHeader('SECCIÓN D: APLICACIÓN DE PROFILAXIS OCULAR PARA GONORREA EN RECIÉN NACIDOS', 11)
    
    const headersDOcular = ['Concepto', 'Total', 'Pueblos Originarios', 'Migrantes', 'REM A11']
    const colWidthsDOcular = [80, 20, 30, 20, 20]
    const rowsDOcular = [
      [
        'RN vivos que reciben profilaxis ocular',
        reporteData.seccionDProfilaxisOcular.totalConProfilaxis,
        reporteData.seccionDProfilaxisOcular.pueblosOriginarios,
        reporteData.seccionDProfilaxisOcular.migrantes,
        reporteData.seccionDProfilaxisOcular.remA11 || '-',
      ],
      [
        'Recién nacidos vivos',
        reporteData.seccionDProfilaxisOcular.totalRNVivos,
        0,
        0,
        reporteData.seccionDProfilaxisOcular.remA11 || '-',
      ],
    ]
    addSimpleTable(headersDOcular, rowsDOcular, colWidthsDOcular)

    // SECCIÓN J: PROFILAXIS HEPATITIS B
    addSectionHeader('SECCIÓN J: PROFILAXIS DE TRANSMISIÓN VERTICAL APLICADA AL RECIÉN NACIDO', 11)
    
    const headersJ = ['Concepto', 'Total', 'Pueblos Originarios', 'Migrantes', 'REM A11']
    const colWidthsJ = [80, 20, 30, 20, 20]
    const rowsJ = [
      [
        'RN hijos de madre Hepatitis B positiva',
        reporteData.seccionJ.hijosHepatitisBPositiva.total,
        reporteData.seccionJ.hijosHepatitisBPositiva.pueblosOriginarios,
        reporteData.seccionJ.hijosHepatitisBPositiva.migrantes,
        reporteData.seccionJ.hijosHepatitisBPositiva.remA11 || '-',
      ],
      [
        'RN con profilaxis completa según normativa',
        reporteData.seccionJ.profilaxisCompleta.total,
        reporteData.seccionJ.profilaxisCompleta.pueblosOriginarios,
        reporteData.seccionJ.profilaxisCompleta.migrantes,
        reporteData.seccionJ.profilaxisCompleta.remA11 || '-',
      ],
    ]
    addSimpleTable(headersJ, rowsJ, colWidthsJ)

    // CARACTERÍSTICAS DEL PARTO (simplificada para PDF)
    addSectionHeader('CARACTERÍSTICAS DEL PARTO', 12)
    
    const carParto = reporteData.caracteristicasParto.total
    const headersCarParto = ['Tipo Parto', 'Total', '<15 anios', '15-19 anios', '20-34 anios', '>=35 anios', 'Premat. <24', 'Premat. 24-28', 'Premat. 29-32', 'Premat. 33-36']
    const colWidthsCarParto = [32, 13, 13, 13, 13, 13, 16, 16, 16, 16]
    
    const tiposParto = ['total', 'vaginal', 'instrumental', 'cesareaElectiva', 'cesareaUrgencia']
    const nombresTipos = ['TOTAL PARTOS', 'VAGINAL', 'INSTRUMENTAL', 'CESAREA ELECTIVA', 'CESAREA URGENCIA']
    
    tiposParto.forEach((tipo, idx) => {
      checkNewPage(25)
      const fila = reporteData.caracteristicasParto[tipo]
      if (!fila) return
      
      const rowsCarParto = [
        [
          nombresTipos[idx],
          fila.total,
          fila.edadMadre.menor15,
          fila.edadMadre.entre15y19,
          fila.edadMadre.entre20y34,
          fila.edadMadre.mayor35,
          fila.prematuros.menor24,
          fila.prematuros.entre24y28,
          fila.prematuros.entre29y32,
          fila.prematuros.entre33y36,
        ],
      ]
      addSimpleTable(headersCarParto, rowsCarParto, colWidthsCarParto)
    })

    // SECCIÓN G: ESTERILIZACIONES QUIRÚRGICAS
    addSectionHeader('SECCIÓN G: ESTERILIZACIONES QUIRÚRGICAS', 12)
    
    const headersG = ['SEXO', 'TOTAL', '<20 anios', '20-34 anios', '>=35 anios', 'Trans', 'REM A21']
    const colWidthsG = [30, 15, 15, 15, 15, 12, 15]
    const rowsG = [
      [
        'MUJER',
        reporteData.seccionGEsterilizaciones.mujer.total,
        reporteData.seccionGEsterilizaciones.mujer.menor20,
        reporteData.seccionGEsterilizaciones.mujer.entre20y34,
        reporteData.seccionGEsterilizaciones.mujer.mayor35,
        reporteData.seccionGEsterilizaciones.mujer.trans,
        reporteData.seccionGEsterilizaciones.mujer.remA21 || '-',
      ],
      [
        'HOMBRE',
        reporteData.seccionGEsterilizaciones.hombre.total,
        '-',
        '-',
        '-',
        '-',
        '-',
      ],
    ]
    addSimpleTable(headersG, rowsG, colWidthsG)

    // COMPLICACIONES OBSTÉTRICAS (simplificada)
    addSectionHeader('COMPLICACIONES OBSTÉTRICAS', 12)
    
    const headersComp = ['Tipo Complicacion', 'Parto Espontaneo', 'Parto Inducido', 'Cesarea Urgencia', 'Cesarea Electiva']
    const colWidthsComp = [50, 25, 25, 25, 25]
    
    const tiposComp = Object.keys(reporteData.complicacionesObstetricas.porTipo)
    const primerosTipos = tiposComp.slice(0, 5) // Mostrar solo los primeros 5 para no hacer el PDF muy largo
    
    primerosTipos.forEach(tipo => {
      checkNewPage(20)
      const comp = reporteData.complicacionesObstetricas.porTipo[tipo]
      const nombreTipo = tipo.replaceAll('_', ' ').toUpperCase()
      const rowsComp = [
        [
          nombreTipo,
          comp.partoEspontaneo,
          comp.partoInducido,
          comp.cesareaUrgencia,
          comp.cesareaElectiva,
        ],
      ]
      addSimpleTable(headersComp, rowsComp, colWidthsComp)
    })

    // Pie de página en todas las páginas
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont(undefined, 'normal')
      const fechaGen = new Date().toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      doc.text(
        `Generado el ${fechaGen} por ${user.nombre || user.email || 'Usuario'}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
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
          entidad: 'ReporteREM',
          entidadId: null,
          accion: 'EXPORT',
          detalleAfter: {
            formato: 'PDF',
            periodo: `${anio}-${mes.toString().padStart(2, '0')}`,
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
    const fileName = `Reporte_REM_${anio}_${mes.toString().padStart(2, '0')}.pdf`
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error al exportar reporte REM a PDF:', error)
    return Response.json(
      { error: 'Error al exportar reporte REM', details: error.message },
      { status: 500 }
    )
  }
}

