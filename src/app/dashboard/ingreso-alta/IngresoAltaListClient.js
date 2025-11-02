'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function IngresoAltaListClient({ permissions }) {
  const router = useRouter()
  const [episodios, setEpisodios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [error, setError] = useState('')
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

  // Cargar lista de episodios
  const loadEpisodios = useCallback(async () => {
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

      if (estadoFilter) {
        params.append('estado', estadoFilter)
      }

      const response = await fetch(`/api/ingreso-alta?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los ingresos/altas')
        setLoading(false)
        return
      }

      const data = await response.json()
      setEpisodios(data.data || [])
      setPagination(data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      })
    } catch (err) {
      console.error('Error loading episodios:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [search, estadoFilter, currentPage, itemsPerPage])

  useEffect(() => {
    loadEpisodios()
  }, [loadEpisodios])

  const handleProcesarAlta = async (id) => {
    if (!window.confirm('¿Está seguro que desea procesar el alta de este episodio?')) {
      return
    }

    try {
      const response = await fetch(`/api/ingreso-alta/${id}/alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.validation && !data.validation.isValid) {
          alert(`No se puede procesar el alta:\n${data.validation.errors.join('\n')}`)
        } else {
          alert(data.error || 'Error al procesar el alta')
        }
        return
      }

      alert('Alta procesada exitosamente')
      loadEpisodios()
    } catch (err) {
      console.error('Error procesando alta:', err)
      alert('Error al conectar con el servidor')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h1>Ingreso/Alta</h1>
        {permissions.create && (
          <Link href="/dashboard/ingreso-alta/nuevo" className={styles.btnPrimary}>
            <i className="fas fa-plus"></i> Nuevo Ingreso
          </Link>
        )}
      </div>

      {error && (
        <div className={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por RUT, nombre de madre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={estadoFilter}
          onChange={(e) => {
            setEstadoFilter(e.target.value)
            setCurrentPage(1)
          }}
          className={styles.filterSelect}
        >
          <option value="">Todos los estados</option>
          <option value="INGRESADO">Ingresado</option>
          <option value="ALTA">Alta</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : episodios.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No se encontraron ingresos/altas</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Madre</th>
                  <th>Fecha Ingreso</th>
                  <th>Estado</th>
                  <th>Hospital Anterior</th>
                  <th>Fecha Alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {episodios.map((episodio) => (
                  <tr key={episodio.id}>
                    <td>{episodio.madre.rut}</td>
                    <td>
                      {episodio.madre.nombres} {episodio.madre.apellidos}
                    </td>
                    <td>{formatDate(episodio.fechaIngreso)}</td>
                    <td>
                      <span
                        className={
                          episodio.estado === 'ALTA'
                            ? styles.statusAlta
                            : styles.statusIngresado
                        }
                      >
                        {episodio.estado === 'ALTA' ? 'Alta' : 'Ingresado'}
                      </span>
                    </td>
                    <td>
                      {episodio.hospitalAnterior ? (
                        <span className={styles.hospitalBadge}>
                          <i className="fas fa-hospital"></i> {episodio.hospitalAnterior}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{formatDate(episodio.fechaAlta)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/dashboard/ingreso-alta/${episodio.id}`}
                          className={styles.btnView}
                        >
                          <i className="fas fa-eye"></i> Ver
                        </Link>
                        {episodio.estado === 'INGRESADO' && permissions.alta && (
                          <button
                            onClick={() => handleProcesarAlta(episodio.id)}
                            className={styles.btnAlta}
                          >
                            <i className="fas fa-door-open"></i> Procesar Alta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                Anterior
              </button>
              <span className={styles.pageInfo}>
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={currentPage === pagination.totalPages}
                className={styles.pageButton}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

