'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function ControlNeonatalListClient({ permissions }) {
  const router = useRouter()
  const [controles, setControles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Cargar lista de controles cuando cambia la página, búsqueda o filtros
  const loadControles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      
      if (search) {
        params.append('search', search)
      }

      if (tipoFilter) {
        params.append('tipo', tipoFilter)
      }

      const response = await fetch(`/api/control-neonatal?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los controles neonatales')
        setLoading(false)
        return
      }

      const data = await response.json()
      setControles(data.data || [])
      setPagination(data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      })
    } catch (err) {
      console.error('Error loading controles:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [search, tipoFilter, currentPage, itemsPerPage])

  useEffect(() => {
    loadControles()
  }, [loadControles])

  const handleDelete = async (id, rnInfo) => {
    if (
      !window.confirm(
        `¿Está seguro que desea eliminar este control neonatal de ${rnInfo}? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }

    setDeleteLoading(id)
    try {
      const response = await fetch(`/api/control-neonatal/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al eliminar el control neonatal')
        setDeleteLoading(null)
        return
      }

      // Recargar lista
      const wasLastItem = controles.length === 1 && currentPage === pagination.totalPages
      if (wasLastItem && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        loadControles()
      }
    } catch (err) {
      console.error('Error deleting control:', err)
      alert('Error al conectar con el servidor')
    } finally {
      setDeleteLoading(null)
    }
  }

  // Función para formatear tipo de control
  const formatTipo = (tipo) => {
    const tipos = {
      SIGNOS_VITALES: 'Signos Vitales',
      GLUCEMIA: 'Glucemia',
      ALIMENTACION: 'Alimentación',
      MEDICACION: 'Medicación',
      OTRO: 'Otro',
    }
    return tipos[tipo] || tipo
  }

  // Función para formatear datos de forma compacta para la tabla
  const formatDatosTabla = (tipo, datos) => {
    if (!datos) return '-'
    
    try {
      const datosObj = typeof datos === 'string' ? JSON.parse(datos) : datos
      const partes = []

      switch (tipo) {
        case 'SIGNOS_VITALES':
          if (datosObj.temp !== undefined && datosObj.temp !== null) {
            partes.push(`Temp: ${datosObj.temp}°C`)
          }
          if (datosObj.fc !== undefined && datosObj.fc !== null) {
            partes.push(`FC: ${datosObj.fc} lpm`)
          }
          if (datosObj.fr !== undefined && datosObj.fr !== null) {
            partes.push(`FR: ${datosObj.fr} rpm`)
          }
          if (datosObj.spo2 !== undefined && datosObj.spo2 !== null) {
            partes.push(`SpO2: ${datosObj.spo2}%`)
          }
          return partes.length > 0 ? partes.join(', ') : '-'

        case 'GLUCEMIA':
          if (datosObj.glucemia !== undefined && datosObj.glucemia !== null) {
            return `${datosObj.glucemia} mg/dL`
          }
          return '-'

        case 'ALIMENTACION':
          const alimentacionParts = []
          if (datosObj.tipo !== undefined && datosObj.tipo !== null) {
            alimentacionParts.push(datosObj.tipo)
          }
          if (datosObj.cantidad !== undefined && datosObj.cantidad !== null) {
            alimentacionParts.push(`${datosObj.cantidad} ${datosObj.unidad || 'ml'}`)
          }
          return alimentacionParts.length > 0 ? alimentacionParts.join(' - ') : '-'

        case 'MEDICACION':
          const medicacionParts = []
          if (datosObj.medicamento !== undefined && datosObj.medicamento !== null) {
            medicacionParts.push(datosObj.medicamento)
          }
          if (datosObj.dosis !== undefined && datosObj.dosis !== null) {
            medicacionParts.push(datosObj.dosis)
          }
          if (datosObj.via !== undefined && datosObj.via !== null) {
            medicacionParts.push(`vía ${datosObj.via}`)
          }
          return medicacionParts.length > 0 ? medicacionParts.join(' - ') : '-'

        case 'OTRO':
        default:
          // Para OTRO, mostrar los primeros campos de forma compacta
          const otrosParts = Object.entries(datosObj).slice(0, 3).map(([key, value]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
            return `${label}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
          })
          return otrosParts.length > 0 ? otrosParts.join(', ') : '-'
      }
    } catch (error) {
      return String(datos)
    }
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Controles Neonatales</h1>
            <p>Gestión de controles neonatales registrados por enfermeras</p>
          </div>
          {permissions.create && (
            <Link href="/dashboard/control-neonatal/nuevo" className={styles.btnNew}>
              <i className="fas fa-plus"></i>
              Nuevo Control
            </Link>
          )}
        </div>

        {/* Search Bar and Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className={styles.searchBar} style={{ flex: 1, minWidth: '200px' }}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar por RN, madre, enfermera..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={styles.searchInput}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setCurrentPage(1)
                }}
                className={styles.clearSearch}
                title="Limpiar búsqueda"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <select
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.paginationSelect}
            style={{ minWidth: '180px' }}
          >
            <option value="">Todos los tipos</option>
            <option value="SIGNOS_VITALES">Signos Vitales</option>
            <option value="GLUCEMIA">Glucemia</option>
            <option value="ALIMENTACION">Alimentación</option>
            <option value="MEDICACION">Medicación</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>

      {error && (
        <div className={styles.alertError}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Cargando controles neonatales...</span>
        </div>
      ) : controles.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-heartbeat"></i>
          <h3>No se encontraron controles neonatales</h3>
          <p>
            {search || tipoFilter
              ? 'No hay controles que coincidan con su búsqueda o filtros.'
              : 'Aún no hay controles neonatales registrados en el sistema.'}
          </p>
        </div>
      ) : (
        <>
          {!loading && controles.length > 0 && (
            <div className={styles.tableTopControls}>
              <div className={styles.paginationSelector}>
                <label htmlFor="itemsPerPage">Resultados por página:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className={styles.paginationSelect}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
          <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>RN (Madre)</th>
                <th>Fecha/Hora</th>
                <th>Tipo</th>
                <th>Datos</th>
                <th>Enfermera</th>
                <th className={styles.actionsCol}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {controles.map((control) => (
                <tr key={control.id}>
                  <td>
                    {control.rn?.parto?.madre
                      ? `${control.rn.parto.madre.nombres} ${control.rn.parto.madre.apellidos} (${control.rn.parto.madre.rut})`
                      : '-'}
                  </td>
                  <td>
                    {control.fechaHora
                      ? new Date(control.fechaHora).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td>
                    <span className={styles.badge}>{formatTipo(control.tipo)}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {formatDatosTabla(control.tipo, control.datos)}
                    </div>
                  </td>
                  <td>{control.enfermera?.nombre || '-'}</td>
                  <td className={styles.actionsCol}>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/control-neonatal/${control.id}`}
                        className={styles.btnAction}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      {permissions.update && (
                        <Link
                          href={`/dashboard/control-neonatal/${control.id}/editar`}
                          className={`${styles.btnAction} ${styles.btnEdit}`}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                      )}
                      {permissions.delete && (
                        <button
                          onClick={() =>
                            handleDelete(
                              control.id,
                              control.rn?.parto?.madre
                                ? `${control.rn.parto.madre.nombres} ${control.rn.parto.madre.apellidos}`
                                : 'el RN'
                            )
                          }
                          className={`${styles.btnAction} ${styles.btnDelete}`}
                          disabled={deleteLoading === control.id}
                          title="Eliminar"
                        >
                          {deleteLoading === control.id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-trash"></i>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Pagination Controls */}
      {!loading && controles.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {((currentPage - 1) * pagination.limit) + 1} -{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} de{' '}
            {pagination.total} controles neonatales
          </div>
          <div className={styles.paginationControls}>
            {pagination.totalPages > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={styles.paginationBtn}
                >
                  <i className="fas fa-chevron-left"></i>
                  Anterior
                </button>
                <div className={styles.paginationNumbers}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1
                      
                      return (
                        <span key={page}>
                          {showEllipsis && <span className={styles.paginationEllipsis}>...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`${styles.paginationBtn} ${styles.paginationNumber} ${
                              currentPage === page ? styles.paginationActive : ''
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      )
                    })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                  className={styles.paginationBtn}
                >
                  Siguiente
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

