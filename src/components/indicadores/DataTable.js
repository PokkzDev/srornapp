'use client'
import { useState, useMemo } from 'react'
import styles from './DataTable.module.css'

/**
 * DataTable - Tabla con ordenamiento y paginación
 * @param {array} columns - Columnas: [{ key, label, sortable, render, align }]
 * @param {array} data - Datos a mostrar
 * @param {number} pageSize - Tamaño de página (default 10)
 * @param {boolean} loading - Estado de carga
 * @param {string} emptyMessage - Mensaje cuando no hay datos
 */
export default function DataTable({ 
  columns, 
  data = [], 
  pageSize = 10,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <span>Cargando datos...</span>
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          <span>{emptyMessage}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={`${styles.th} ${col.align ? styles[col.align] : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  <span className={styles.thContent}>
                    {col.label}
                    {col.sortable && (
                      <span className={styles.sortIcon}>
                        {sortConfig.key === col.key 
                          ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                          : '↕'
                        }
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr 
                key={row.id || idx} 
                className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => (
                  <td 
                    key={col.key} 
                    className={`${styles.td} ${col.align ? styles[col.align] : ''}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
          </span>
          <div className={styles.pageControls}>
            <button 
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              ««
            </button>
            <button 
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <span className={styles.currentPage}>
              Página {currentPage} de {totalPages}
            </span>
            <button 
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
            <button 
              className={styles.pageBtn}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
