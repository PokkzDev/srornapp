'use client'
import styles from './ExportButton.module.css'

/**
 * ExportButton - Botón de exportación a CSV/Excel
 * @param {array} data - Datos a exportar
 * @param {array} columns - Columnas: [{ key, label }]
 * @param {string} filename - Nombre del archivo
 * @param {string} format - Formato: 'csv' | 'excel'
 */
export default function ExportButton({ 
  data, 
  columns, 
  filename = 'export',
  format = 'csv',
  disabled = false 
}) {
  
  const exportToCSV = () => {
    if (!data || !data.length) return

    // Header
    const headers = columns.map(col => col.label).join(',')
    
    // Rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key]
        // Escapar valores con comas o comillas
        if (value === null || value === undefined) return ''
        const strValue = String(value)
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`
        }
        return strValue
      }).join(',')
    ).join('\n')

    const csv = `${headers}\n${rows}`
    
    // Agregar BOM para Excel en español
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    
    downloadBlob(blob, `${filename}.csv`)
  }

  const exportToExcel = () => {
    if (!data || !data.length) return

    // Crear HTML table para Excel
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
    html += '<head><meta charset="utf-8"></head>'
    html += '<body><table border="1">'
    
    // Header
    html += '<thead><tr>'
    columns.forEach(col => {
      html += `<th style="background:#0066A4;color:white;font-weight:bold;padding:8px;">${col.label}</th>`
    })
    html += '</tr></thead>'
    
    // Body
    html += '<tbody>'
    data.forEach(row => {
      html += '<tr>'
      columns.forEach(col => {
        const value = row[col.key]
        html += `<td style="padding:6px;">${value !== null && value !== undefined ? value : ''}</td>`
      })
      html += '</tr>'
    })
    html += '</tbody></table></body></html>'

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    downloadBlob(blob, `${filename}.xls`)
  }

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (format === 'excel') {
      exportToExcel()
    } else {
      exportToCSV()
    }
  }

  return (
    <button 
      className={styles.button}
      onClick={handleExport}
      disabled={disabled || !data || !data.length}
      title={`Exportar a ${format.toUpperCase()}`}
    >
      <span className={styles.icon}>
        {format === 'excel' ? '📊' : '📄'}
      </span>
      <span className={styles.label}>
        {format === 'excel' ? 'Excel' : 'CSV'}
      </span>
    </button>
  )
}
