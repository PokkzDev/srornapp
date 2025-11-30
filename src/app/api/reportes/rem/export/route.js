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

    // Colores del tema
    const colorPrimario = [0, 82, 147] // Azul oscuro
    const colorSecundario = [41, 128, 185] // Azul medio
    const colorHeaderBg = [52, 73, 94] // Gris azulado oscuro
    const colorHeaderText = [255, 255, 255] // Blanco
    const colorFilaAlt = [236, 240, 241] // Gris muy claro

    // Función para agregar nueva página si es necesario
    const checkNewPage = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        return true
      }
      return false
    }

    // Función para agregar encabezado de sección con estilo
    const addSectionHeader = (text, fontSize = 12) => {
      checkNewPage(18)
      // Fondo del encabezado de seccion
      doc.setFillColor(...colorSecundario)
      doc.rect(margin, yPos - 2, maxWidth, 10, 'F')
      // Texto
      doc.setFontSize(fontSize)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(...colorHeaderText)
      doc.text(text, margin + 3, yPos + 5)
      doc.setTextColor(0, 0, 0) // Restaurar color negro
      yPos += 12
      doc.setFont(undefined, 'normal')
    }

    // Función para agregar tabla con estilo mejorado
    const addSimpleTable = (headers, rows, colWidths) => {
      checkNewPage(30)
      
      const rowHeight = 8
      const headerHeight = 12
      
      // Normalizar anchos de columna
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0)
      const scaleFactor = maxWidth / totalWidth
      const normalizedWidths = colWidths.map(w => w * scaleFactor)

      // Calcular altura del encabezado
      doc.setFontSize(8)
      let maxHeaderLines = 1
      headers.forEach((header, i) => {
        const lines = doc.splitTextToSize(header, normalizedWidths[i] - 4)
        if (lines.length > maxHeaderLines) {
          maxHeaderLines = lines.length
        }
      })
      const actualHeaderHeight = Math.max(headerHeight, maxHeaderLines * 4 + 4)
      
      // Dibujar fondo del encabezado
      doc.setFillColor(...colorHeaderBg)
      doc.rect(margin, yPos, maxWidth, actualHeaderHeight, 'F')
      
      // Dibujar texto del encabezado
      doc.setFont(undefined, 'bold')
      doc.setTextColor(...colorHeaderText)
      let xPos = margin
      
      headers.forEach((header, i) => {
        const cellCenterX = xPos + normalizedWidths[i] / 2
        const textLines = doc.splitTextToSize(header, normalizedWidths[i] - 4)
        const lineHeight = 4
        const startY = yPos + (actualHeaderHeight - (textLines.length - 1) * lineHeight) / 2 + 1
        
        textLines.forEach((line, lineIdx) => {
          doc.text(line, cellCenterX, startY + (lineIdx * lineHeight), { 
            maxWidth: normalizedWidths[i] - 4, 
            align: 'center' 
          })
        })
        xPos += normalizedWidths[i]
      })
      
      doc.setTextColor(0, 0, 0) // Restaurar color negro
      yPos += actualHeaderHeight

      // Filas de datos
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
      
      rows.forEach((row, rowIdx) => {
        checkNewPage(rowHeight)
        xPos = margin
        
        // Fondo alternado para filas
        if (rowIdx % 2 === 1) {
          doc.setFillColor(...colorFilaAlt)
          doc.rect(margin, yPos, maxWidth, rowHeight, 'F')
        }
        
        // Borde de la fila
        doc.setDrawColor(189, 195, 199)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPos, maxWidth, rowHeight, 'S')
        
        // Dibujar lineas verticales y texto
        row.forEach((cell, i) => {
          if (i > 0) {
            doc.setDrawColor(189, 195, 199)
            doc.line(xPos, yPos, xPos, yPos + rowHeight)
          }
          
          const cellCenterX = xPos + normalizedWidths[i] / 2
          const cellValue = String(cell !== null && cell !== undefined ? cell : '-')
          const align = i === 0 ? 'left' : 'center'
          const textX = i === 0 ? xPos + 3 : cellCenterX
          
          doc.text(cellValue, textX, yPos + 5.5, { 
            maxWidth: normalizedWidths[i] - 4, 
            align: align 
          })
          xPos += normalizedWidths[i]
        })
        
        yPos += rowHeight
      })

      yPos += 8
    }

    // Encabezado del documento con estilo
    // Barra superior decorativa
    doc.setFillColor(...colorPrimario)
    doc.rect(0, 0, pageWidth, 25, 'F')
    
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...colorHeaderText)
    doc.text('REPORTE REM - REGISTRO ESTADISTICO MENSUAL', pageWidth / 2, 12, { align: 'center' })

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Periodo: ${meses[mes - 1]} ${anio}`, pageWidth / 2, 20, { align: 'center' })
    
    doc.setTextColor(0, 0, 0) // Restaurar color negro
    yPos = 32

    // SECCION D.1: INFORMACION GENERAL DE RECIEN NACIDOS VIVOS
    addSectionHeader('SECCION D.1: INFORMACION GENERAL DE RECIEN NACIDOS VIVOS', 12)
    
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

    // SECCION D.2: ATENCION INMEDIATA DEL RECIEN NACIDO
    addSectionHeader('SECCION D.2: ATENCION INMEDIATA DEL RECIEN NACIDO', 12)
    
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

    // Desglose instrumental y cesáreas con estilo
    checkNewPage(25)
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(margin, yPos, 120, 22, 2, 2, 'F')
    doc.setDrawColor(...colorSecundario)
    doc.roundedRect(margin, yPos, 120, 22, 2, 2, 'S')
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...colorPrimario)
    doc.text('Desglose:', margin + 3, yPos + 5)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.text(`Instrumental - Distocico: ${reporteData.seccionD2.instrumental.distocico}`, margin + 5, yPos + 10)
    doc.text(`Instrumental - Vacuum: ${reporteData.seccionD2.instrumental.vacuum}`, margin + 5, yPos + 15)
    doc.text(`Cesarea Urgencia: ${reporteData.seccionD2.cesareas.urgencia}`, margin + 65, yPos + 10)
    doc.text(`Cesarea Electiva: ${reporteData.seccionD2.cesareas.electiva}`, margin + 65, yPos + 15)
    yPos += 28

    // SECCION D: PROFILAXIS OCULAR
    addSectionHeader('SECCION D: APLICACION DE PROFILAXIS OCULAR PARA GONORREA EN RECIEN NACIDOS', 11)
    
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
        'Recien nacidos vivos',
        reporteData.seccionDProfilaxisOcular.totalRNVivos,
        0,
        0,
        reporteData.seccionDProfilaxisOcular.remA11 || '-',
      ],
    ]
    addSimpleTable(headersDOcular, rowsDOcular, colWidthsDOcular)

    // SECCION J: PROFILAXIS HEPATITIS B
    addSectionHeader('SECCION J: PROFILAXIS DE TRANSMISION VERTICAL APLICADA AL RECIEN NACIDO', 11)
    
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
        'RN con profilaxis completa segun normativa',
        reporteData.seccionJ.profilaxisCompleta.total,
        reporteData.seccionJ.profilaxisCompleta.pueblosOriginarios,
        reporteData.seccionJ.profilaxisCompleta.migrantes,
        reporteData.seccionJ.profilaxisCompleta.remA11 || '-',
      ],
    ]
    addSimpleTable(headersJ, rowsJ, colWidthsJ)

    // CARACTERISTICAS DEL PARTO (simplificada para PDF)
    addSectionHeader('CARACTERISTICAS DEL PARTO', 12)
    
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

    // SECCION G: ESTERILIZACIONES QUIRURGICAS
    addSectionHeader('SECCION G: ESTERILIZACIONES QUIRURGICAS', 12)
    
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

    // COMPLICACIONES OBSTETRICAS (simplificada)
    addSectionHeader('COMPLICACIONES OBSTETRICAS', 12)
    
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

    // Pie de página en todas las páginas con estilo
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      
      // Linea decorativa
      doc.setDrawColor(...colorSecundario)
      doc.setLineWidth(0.5)
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
      
      doc.setFontSize(8)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100, 100, 100)
      
      const fechaGen = new Date().toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      
      doc.text(
        `Generado: ${fechaGen} por ${user.nombre || user.email || 'Usuario'}`,
        margin,
        pageHeight - 8
      )
      
      doc.text(
        'Sistema de Registro Obstetrico de Recien Nacidos (SRORN)',
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      )
      
      doc.text(
        `Pagina ${i} de ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
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

