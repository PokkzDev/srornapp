import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

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

    // Obtener datos del reporte
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

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook()
    workbook.creator = user.nombre || user.email || 'SRORN'
    workbook.created = new Date()

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    // Estilos comunes
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FF95A5A6' } },
        left: { style: 'thin', color: { argb: 'FF95A5A6' } },
        bottom: { style: 'thin', color: { argb: 'FF95A5A6' } },
        right: { style: 'thin', color: { argb: 'FF95A5A6' } }
      }
    }

    const sectionHeaderStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } },
      alignment: { horizontal: 'left', vertical: 'middle' }
    }

    const dataStyle = {
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
        left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
        bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
        right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
      }
    }

    const dataStyleLeft = {
      ...dataStyle,
      alignment: { horizontal: 'left', vertical: 'middle' }
    }

    // Función para aplicar estilos a una fila de encabezado
    const applyHeaderStyle = (row) => {
      row.eachCell((cell) => {
        cell.font = headerStyle.font
        cell.fill = headerStyle.fill
        cell.alignment = headerStyle.alignment
        cell.border = headerStyle.border
      })
      row.height = 25
    }

    // Función para aplicar estilos a filas de datos
    const applyDataStyle = (row, isAlt = false) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = colNumber === 1 ? dataStyleLeft.alignment : dataStyle.alignment
        cell.border = dataStyle.border
        if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
        }
      })
      row.height = 20
    }

    // ==================== HOJA 1: RESUMEN ====================
    const wsResumen = workbook.addWorksheet('Resumen', {
      properties: { tabColor: { argb: 'FF2980B9' } }
    })

    // Título
    wsResumen.mergeCells('A1:F1')
    const titleCell = wsResumen.getCell('A1')
    titleCell.value = `REPORTE REM - ${meses[mes - 1].toUpperCase()} ${anio}`
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF2C3E50' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    wsResumen.getRow(1).height = 30

    // Subtítulo
    wsResumen.mergeCells('A2:F2')
    const subtitleCell = wsResumen.getCell('A2')
    subtitleCell.value = 'Registro Estadístico Mensual - Atención del Parto y Recién Nacido'
    subtitleCell.font = { size: 11, color: { argb: 'FF7F8C8D' } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Resumen ejecutivo
    wsResumen.getCell('A4').value = 'RESUMEN EJECUTIVO'
    wsResumen.getCell('A4').font = sectionHeaderStyle.font
    wsResumen.getCell('A4').fill = sectionHeaderStyle.fill
    wsResumen.mergeCells('A4:F4')

    const resumenData = [
      ['Indicador', 'Total'],
      ['Total Partos', reporteData.caracteristicasParto?.total?.total || 0],
      ['Recién Nacidos Vivos', reporteData.seccionD1?.total || 0],
      ['Partos Vaginales', reporteData.seccionD2?.tipoParto?.vaginal || 0],
      ['Partos Instrumentales', reporteData.seccionD2?.tipoParto?.instrumental || 0],
      ['Cesáreas', reporteData.seccionD2?.tipoParto?.cesarea || 0],
      ['RN con Profilaxis Ocular', reporteData.seccionDProfilaxisOcular?.totalConProfilaxis || 0],
      ['RN con Profilaxis Hepatitis B', reporteData.seccionD2?.profilaxis?.hepatitisB || 0],
    ]

    let rowIndex = 5
    resumenData.forEach((row, idx) => {
      const excelRow = wsResumen.addRow(row)
      if (idx === 0) {
        applyHeaderStyle(excelRow)
      } else {
        applyDataStyle(excelRow, idx % 2 === 0)
      }
    })

    wsResumen.getColumn(1).width = 35
    wsResumen.getColumn(2).width = 15

    // ==================== HOJA 2: SECCIÓN D.1 ====================
    const wsD1 = workbook.addWorksheet('D.1 - RN Vivos', {
      properties: { tabColor: { argb: 'FF27AE60' } }
    })

    wsD1.mergeCells('A1:L1')
    wsD1.getCell('A1').value = 'SECCIÓN D.1: INFORMACIÓN GENERAL DE RECIÉN NACIDOS VIVOS'
    wsD1.getCell('A1').font = sectionHeaderStyle.font
    wsD1.getCell('A1').fill = sectionHeaderStyle.fill
    wsD1.getRow(1).height = 25

    const headersD1 = ['TIPO', 'TOTAL', '<500g', '500-999g', '1000-1499g', '1500-1999g', '2000-2499g', '2500-2999g', '3000-3999g', '≥4000g', 'Anomalía', 'REM A24']
    const rowD1Header = wsD1.addRow(headersD1)
    applyHeaderStyle(rowD1Header)

    const rowD1Data = wsD1.addRow([
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
    ])
    applyDataStyle(rowD1Data)

    // Ajustar anchos
    wsD1.columns.forEach((col, i) => {
      col.width = i === 0 ? 18 : 12
    })

    // ==================== HOJA 3: SECCIÓN D.2 ====================
    const wsD2 = workbook.addWorksheet('D.2 - Atención RN', {
      properties: { tabColor: { argb: 'FF9B59B6' } }
    })

    wsD2.mergeCells('A1:M1')
    wsD2.getCell('A1').value = 'SECCIÓN D.2: ATENCIÓN INMEDIATA DEL RECIÉN NACIDO'
    wsD2.getCell('A1').font = sectionHeaderStyle.font
    wsD2.getCell('A1').fill = sectionHeaderStyle.fill
    wsD2.getRow(1).height = 25

    const headersD2 = ['TIPO', 'Profil. H.B', 'Profil. Ocular', 'Vaginal', 'Instrumental', 'Cesárea', 'Extrahospitalario', 'APGAR ≤3 1min', 'APGAR ≤6 5min', 'Rean. Básica', 'Rean. Avanzada', 'EHI II-III', 'REM A24']
    const rowD2Header = wsD2.addRow(headersD2)
    applyHeaderStyle(rowD2Header)

    const rowD2Data = wsD2.addRow([
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
    ])
    applyDataStyle(rowD2Data)

    // Desglose
    wsD2.addRow([])
    wsD2.addRow(['DESGLOSE:'])
    wsD2.addRow(['Instrumental - Distócico:', reporteData.seccionD2.instrumental.distocico])
    wsD2.addRow(['Instrumental - Vacuum:', reporteData.seccionD2.instrumental.vacuum])
    wsD2.addRow(['Cesárea Urgencia:', reporteData.seccionD2.cesareas.urgencia])
    wsD2.addRow(['Cesárea Electiva:', reporteData.seccionD2.cesareas.electiva])

    wsD2.columns.forEach((col, i) => {
      col.width = i === 0 ? 20 : 14
    })

    // ==================== HOJA 4: PROFILAXIS ====================
    const wsProfilaxis = workbook.addWorksheet('Profilaxis', {
      properties: { tabColor: { argb: 'FFE74C3C' } }
    })

    // Profilaxis Ocular
    wsProfilaxis.mergeCells('A1:E1')
    wsProfilaxis.getCell('A1').value = 'SECCIÓN D: APLICACIÓN DE PROFILAXIS OCULAR PARA GONORREA'
    wsProfilaxis.getCell('A1').font = sectionHeaderStyle.font
    wsProfilaxis.getCell('A1').fill = sectionHeaderStyle.fill
    wsProfilaxis.getRow(1).height = 25

    const headersProfOcular = ['Concepto', 'Total', 'Pueblos Originarios', 'Migrantes', 'REM A11']
    const rowProfOcularHeader = wsProfilaxis.addRow(headersProfOcular)
    applyHeaderStyle(rowProfOcularHeader)

    const rowProfOcular1 = wsProfilaxis.addRow([
      'RN vivos que reciben profilaxis ocular',
      reporteData.seccionDProfilaxisOcular.totalConProfilaxis,
      reporteData.seccionDProfilaxisOcular.pueblosOriginarios,
      reporteData.seccionDProfilaxisOcular.migrantes,
      reporteData.seccionDProfilaxisOcular.remA11 || '-',
    ])
    applyDataStyle(rowProfOcular1)

    const rowProfOcular2 = wsProfilaxis.addRow([
      'Recién nacidos vivos',
      reporteData.seccionDProfilaxisOcular.totalRNVivos,
      0,
      0,
      '-',
    ])
    applyDataStyle(rowProfOcular2, true)

    // Espacio
    wsProfilaxis.addRow([])
    wsProfilaxis.addRow([])

    // Profilaxis Hepatitis B
    wsProfilaxis.mergeCells('A7:E7')
    wsProfilaxis.getCell('A7').value = 'SECCIÓN J: PROFILAXIS DE TRANSMISIÓN VERTICAL'
    wsProfilaxis.getCell('A7').font = sectionHeaderStyle.font
    wsProfilaxis.getCell('A7').fill = sectionHeaderStyle.fill

    const headersProfHepB = ['Concepto', 'Total', 'Pueblos Originarios', 'Migrantes', 'REM A11']
    const rowProfHepBHeader = wsProfilaxis.addRow(headersProfHepB)
    applyHeaderStyle(rowProfHepBHeader)

    const rowProfHepB1 = wsProfilaxis.addRow([
      'RN hijos de madre Hepatitis B positiva',
      reporteData.seccionJ.hijosHepatitisBPositiva.total,
      reporteData.seccionJ.hijosHepatitisBPositiva.pueblosOriginarios,
      reporteData.seccionJ.hijosHepatitisBPositiva.migrantes,
      reporteData.seccionJ.hijosHepatitisBPositiva.remA11 || '-',
    ])
    applyDataStyle(rowProfHepB1)

    const rowProfHepB2 = wsProfilaxis.addRow([
      'RN con profilaxis completa según normativa',
      reporteData.seccionJ.profilaxisCompleta.total,
      reporteData.seccionJ.profilaxisCompleta.pueblosOriginarios,
      reporteData.seccionJ.profilaxisCompleta.migrantes,
      reporteData.seccionJ.profilaxisCompleta.remA11 || '-',
    ])
    applyDataStyle(rowProfHepB2, true)

    wsProfilaxis.getColumn(1).width = 45
    wsProfilaxis.getColumn(2).width = 12
    wsProfilaxis.getColumn(3).width = 22
    wsProfilaxis.getColumn(4).width = 12
    wsProfilaxis.getColumn(5).width = 12

    // ==================== HOJA 5: CARACTERÍSTICAS DEL PARTO ====================
    const wsParto = workbook.addWorksheet('Características Parto', {
      properties: { tabColor: { argb: 'FFF39C12' } }
    })

    wsParto.mergeCells('A1:J1')
    wsParto.getCell('A1').value = 'CARACTERÍSTICAS DEL PARTO'
    wsParto.getCell('A1').font = sectionHeaderStyle.font
    wsParto.getCell('A1').fill = sectionHeaderStyle.fill
    wsParto.getRow(1).height = 25

    const headersCarParto = ['Tipo Parto', 'Total', '<15 años', '15-19 años', '20-34 años', '≥35 años', 'Premat. <24', 'Premat. 24-28', 'Premat. 29-32', 'Premat. 33-36']
    const rowCarPartoHeader = wsParto.addRow(headersCarParto)
    applyHeaderStyle(rowCarPartoHeader)

    const tiposParto = ['total', 'vaginal', 'instrumental', 'cesareaElectiva', 'cesareaUrgencia']
    const nombresTipos = ['TOTAL PARTOS', 'VAGINAL', 'INSTRUMENTAL', 'CESÁREA ELECTIVA', 'CESÁREA URGENCIA']

    tiposParto.forEach((tipo, idx) => {
      const fila = reporteData.caracteristicasParto[tipo]
      if (!fila) return

      const rowData = wsParto.addRow([
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
      ])
      applyDataStyle(rowData, idx % 2 === 1)
    })

    wsParto.getColumn(1).width = 20
    for (let i = 2; i <= 10; i++) {
      wsParto.getColumn(i).width = 14
    }

    // ==================== HOJA 6: ESTERILIZACIONES ====================
    const wsEsterilizaciones = workbook.addWorksheet('Esterilizaciones', {
      properties: { tabColor: { argb: 'FF1ABC9C' } }
    })

    wsEsterilizaciones.mergeCells('A1:G1')
    wsEsterilizaciones.getCell('A1').value = 'SECCIÓN G: ESTERILIZACIONES QUIRÚRGICAS'
    wsEsterilizaciones.getCell('A1').font = sectionHeaderStyle.font
    wsEsterilizaciones.getCell('A1').fill = sectionHeaderStyle.fill
    wsEsterilizaciones.getRow(1).height = 25

    const headersG = ['SEXO', 'TOTAL', '<20 años', '20-34 años', '≥35 años', 'Trans', 'REM A21']
    const rowGHeader = wsEsterilizaciones.addRow(headersG)
    applyHeaderStyle(rowGHeader)

    const rowGMujer = wsEsterilizaciones.addRow([
      'MUJER',
      reporteData.seccionGEsterilizaciones.mujer.total,
      reporteData.seccionGEsterilizaciones.mujer.menor20,
      reporteData.seccionGEsterilizaciones.mujer.entre20y34,
      reporteData.seccionGEsterilizaciones.mujer.mayor35,
      reporteData.seccionGEsterilizaciones.mujer.trans,
      reporteData.seccionGEsterilizaciones.mujer.remA21 || '-',
    ])
    applyDataStyle(rowGMujer)

    const rowGHombre = wsEsterilizaciones.addRow([
      'HOMBRE',
      reporteData.seccionGEsterilizaciones.hombre.total,
      '-',
      '-',
      '-',
      '-',
      '-',
    ])
    applyDataStyle(rowGHombre, true)

    wsEsterilizaciones.columns.forEach((col, i) => {
      col.width = i === 0 ? 15 : 14
    })

    // ==================== HOJA 7: COMPLICACIONES ====================
    const wsComplicaciones = workbook.addWorksheet('Complicaciones', {
      properties: { tabColor: { argb: 'FFE74C3C' } }
    })

    wsComplicaciones.mergeCells('A1:E1')
    wsComplicaciones.getCell('A1').value = 'COMPLICACIONES OBSTÉTRICAS'
    wsComplicaciones.getCell('A1').font = sectionHeaderStyle.font
    wsComplicaciones.getCell('A1').fill = sectionHeaderStyle.fill
    wsComplicaciones.getRow(1).height = 25

    const headersComp = ['Tipo Complicación', 'Parto Espontáneo', 'Parto Inducido', 'Cesárea Urgencia', 'Cesárea Electiva']
    const rowCompHeader = wsComplicaciones.addRow(headersComp)
    applyHeaderStyle(rowCompHeader)

    const tiposComp = Object.keys(reporteData.complicacionesObstetricas.porTipo)
    tiposComp.forEach((tipo, idx) => {
      const comp = reporteData.complicacionesObstetricas.porTipo[tipo]
      const nombreTipo = tipo.replaceAll('_', ' ').toUpperCase()
      const rowData = wsComplicaciones.addRow([
        nombreTipo,
        comp.partoEspontaneo,
        comp.partoInducido,
        comp.cesareaUrgencia,
        comp.cesareaElectiva,
      ])
      applyDataStyle(rowData, idx % 2 === 1)
    })

    wsComplicaciones.getColumn(1).width = 30
    for (let i = 2; i <= 5; i++) {
      wsComplicaciones.getColumn(i).width = 18
    }

    // Generar buffer del Excel
    const buffer = await workbook.xlsx.writeBuffer()

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
            formato: 'EXCEL',
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

    // Retornar el archivo Excel
    const fileName = `Reporte_REM_${anio}_${mes.toString().padStart(2, '0')}.xlsx`

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error al exportar reporte REM a Excel:', error)
    return Response.json(
      { error: 'Error al exportar reporte REM', details: error.message },
      { status: 500 }
    )
  }
}
