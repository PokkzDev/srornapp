'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function URNIEpisodioListClient({ permissions }) {
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
      
      if (estadoFilter) {
        params.append('estado', estadoFilter)
      }

      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/urni/episodio?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los episodios URNI')
        setLoading(false)
        return
      }

      const data = await response.json()
      setEpisodios(data.data || [])
      const paginationData = data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      }
      setPagination(paginationData)
      // Sincronizar currentPage con la respuesta del servidor
      setCurrentPage(paginationData.page)
    } catch (err) {
      console.error('Error loading episodios:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [estadoFilter, currentPage, itemsPerPage, search])

  useEffect(() => {
    loadEpisodios()
  }, [loadEpisodios])

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

  const formatServicioUnidad = (servicio) => {
    if (!servicio) return '-'
    const servicios = {
      URNI: 'URNI',
      UCIN: 'UCIN',
      NEONATOLOGIA: 'Neonatología',
    }
    return servicios[servicio] || servicio
  }

  return (
    <>
      {error && (
        <div className={styles.alertError}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por madre, RUT..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar episodios URNI"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => {
            setEstadoFilter(e.target.value)
            setCurrentPage(1)
          }}
          className={styles.filterSelect}
          aria-label="Filtrar por estado"
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
          <p>No se encontraron episodios URNI</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Recién Nacido</th>
                  <th>Madre</th>
                  <th>Fecha Ingreso</th>
                  <th>Servicio/Unidad</th>
                  <th>Responsable Clínico</th>
                  <th>Estado</th>
                  <th>Atenciones</th>
                  <th>Controles</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {episodios.map((episodio) => (
                  <tr key={episodio.id}>
                    <td>
                      {episodio.rn?.parto?.madre ? (
                        <>
                          RN de {episodio.rn.parto.madre.nombres} {episodio.rn.parto.madre.apellidos}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {episodio.rn?.parto?.madre ? (
                        <>
                          {episodio.rn.parto.madre.nombres} {episodio.rn.parto.madre.apellidos}
                          <br />
                          <small>{episodio.rn.parto.madre.rut}</small>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{formatDate(episodio.fechaHoraIngreso)}</td>
                    <td>{formatServicioUnidad(episodio.servicioUnidad)}</td>
                    <td>
                      {episodio.responsableClinico ? (
                        episodio.responsableClinico.nombre
                      ) : (
                        <span style={{ color: '#999' }}>Sin asignar</span>
                      )}
                    </td>
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
                    <td>{episodio._count?.atenciones || 0}</td>
                    <td>{episodio._count?.controles || 0}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/dashboard/urni/${episodio.id}`}
                          className={styles.btnView}
                        >
                          <i className="fas fa-eye"></i> Ver
                        </Link>
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
    </>
  )
}

