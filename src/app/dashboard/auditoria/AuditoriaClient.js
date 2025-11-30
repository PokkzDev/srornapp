'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'
import DateTimePicker from '../../../components/DateTimePicker'
import { getLocalDateString } from '../../../lib/date-utils'

const ACCIONES = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' },
  { value: 'EXPORT', label: 'Exportar' },
  { value: 'PERMISSION_DENIED', label: 'Acceso denegado' },
]

const ENTIDADES = [
  { value: '', label: 'Todas las entidades' },
  { value: 'Session', label: 'Sesión' },
  { value: 'User', label: 'Usuario' },
  { value: 'Madre', label: 'Madre' },
  { value: 'Parto', label: 'Parto' },
  { value: 'RecienNacido', label: 'Recién Nacido' },
  { value: 'EpisodioMadre', label: 'Episodio Madre' },
  { value: 'EpisodioURNI', label: 'Episodio URNI' },
  { value: 'AtencionURNI', label: 'Atención URNI' },
  { value: 'ControlNeonatal', label: 'Control Neonatal' },
  { value: 'InformeAlta', label: 'Informe de Alta' },
  { value: 'ReporteREM', label: 'Reporte REM' },
  { value: 'Auditoria', label: 'Auditoría' },
]

export default function AuditoriaClient() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Filtros
  const [filtros, setFiltros] = useState({
    usuarioId: '',
    entidad: '',
    accion: '',
    fechaInicio: null,
    fechaFin: null,
  })

  // Usuarios para el filtro
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)

  // Modal de detalles
  const [modalDetalles, setModalDetalles] = useState({
    isOpen: false,
    registro: null,
  })

  // Cargar usuarios para el filtro
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsuarios(data.data || [])
        }
      } catch (err) {
        console.error('Error loading usuarios:', err)
      } finally {
        setLoadingUsuarios(false)
      }
    }
    loadUsuarios()
  }, [])

  // Cargar registros de auditoría
  const loadRegistros = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })

      if (filtros.usuarioId) {
        params.append('usuarioId', filtros.usuarioId)
      }
      if (filtros.entidad) {
        params.append('entidad', filtros.entidad)
      }
      if (filtros.accion) {
        params.append('accion', filtros.accion)
      }
      if (filtros.fechaInicio) {
        params.append('fechaInicio', getLocalDateString(filtros.fechaInicio))
      }
      if (filtros.fechaFin) {
        params.append('fechaFin', getLocalDateString(filtros.fechaFin))
      }

      const response = await fetch(`/api/auditoria?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los registros de auditoría')
        setLoading(false)
        return
      }

      const data = await response.json()
      setRegistros(data.data || [])
      const paginationData = data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      }
      setPagination(paginationData)
    } catch (err) {
      console.error('Error loading auditoria:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [filtros, currentPage, itemsPerPage])

  useEffect(() => {
    loadRegistros()
  }, [loadRegistros])

  // Corregir currentPage si excede el total de páginas disponibles
  useEffect(() => {
    if (pagination.totalPages > 0 && currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages)
    }
  }, [pagination.totalPages, currentPage])

  const handleFilterChange = (field, value) => {
    setFiltros((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset a primera página al cambiar filtros
  }

  const setQuickFilter = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFiltros((prev) => ({
      ...prev,
      fechaInicio: start,
      fechaFin: end,
    }))
    setCurrentPage(1)
  }

  const setToday = () => {
    const today = new Date()
    setFiltros((prev) => ({
      ...prev,
      fechaInicio: today,
      fechaFin: today,
    }))
    setCurrentPage(1)
  }

  const setCurrentMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFiltros((prev) => ({
      ...prev,
      fechaInicio: start,
      fechaFin: end,
    }))
    setCurrentPage(1)
  }

  const setQuickAction = (accion) => {
    setFiltros((prev) => ({
      ...prev,
      accion: accion,
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFiltros({
      usuarioId: '',
      entidad: '',
      accion: '',
      fechaInicio: null,
      fechaFin: null,
    })
    setCurrentPage(1)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    return d.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatAccion = (accion) => {
    const accionMap = {
      CREATE: 'Crear',
      UPDATE: 'Actualizar',
      DELETE: 'Eliminar',
      LOGIN: 'Inicio de sesión',
      LOGOUT: 'Cierre de sesión',
      EXPORT: 'Exportar',
      PERMISSION_DENIED: 'Acceso denegado',
    }
    return accionMap[accion] || accion
  }

  const getAccionBadgeClass = (accion) => {
    const classMap = {
      CREATE: styles.badgeCreate,
      UPDATE: styles.badgeUpdate,
      DELETE: styles.badgeDelete,
      LOGIN: styles.badgeLogin,
      LOGOUT: styles.badgeLogout,
      EXPORT: styles.badgeExport,
      PERMISSION_DENIED: styles.badgeDenied,
    }
    return classMap[accion] || styles.badgeDefault
  }

  const openDetalles = (registro) => {
    setModalDetalles({
      isOpen: true,
      registro,
    })
  }

  const closeDetalles = () => {
    setModalDetalles({
      isOpen: false,
      registro: null,
    })
  }

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modalDetalles.isOpen) {
        closeDetalles()
      }
    }

    if (modalDetalles.isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [modalDetalles.isOpen])

  const renderDetalles = () => {
    if (!modalDetalles.registro) return null

    const reg = modalDetalles.registro

    return (
      <div className={styles.detallesContent}>
        <div className={styles.detallesSection}>
          <h3>Información General</h3>
          <div className={styles.detallesGrid}>
            <div>
              <strong>Fecha y Hora:</strong>
              <p>{formatFecha(reg.fechaHora)}</p>
            </div>
            <div>
              <strong>Usuario:</strong>
              <p>{reg.usuario ? `${reg.usuario.nombre} (${reg.usuario.email})` : 'No disponible'}</p>
            </div>
            <div>
              <strong>Rol:</strong>
              <p>{reg.rol || 'No disponible'}</p>
            </div>
            <div>
              <strong>Entidad:</strong>
              <p>{reg.entidad}</p>
            </div>
            <div>
              <strong>ID de Entidad:</strong>
              <p>{reg.entidadId || 'No disponible'}</p>
            </div>
            <div>
              <strong>Acción:</strong>
              <p><span className={getAccionBadgeClass(reg.accion)}>{formatAccion(reg.accion)}</span></p>
            </div>
            {reg.ip && (
              <div>
                <strong>IP:</strong>
                <p>{reg.ip}</p>
              </div>
            )}
            {reg.userAgent && (
              <div>
                <strong>User Agent:</strong>
                <p>{reg.userAgent}</p>
              </div>
            )}
          </div>
        </div>

        {reg.detalleBefore && (
          <div className={styles.detallesSection}>
            <h3>Estado Anterior</h3>
            <pre className={styles.jsonView}>{JSON.stringify(reg.detalleBefore, null, 2)}</pre>
          </div>
        )}

        {reg.detalleAfter && (
          <div className={styles.detallesSection}>
            <h3>Estado Posterior</h3>
            <pre className={styles.jsonView}>{JSON.stringify(reg.detalleAfter, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }

  if (loading && registros.length === 0) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          Cargando registros de auditoría...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>
              <i className="fas fa-search" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
              Auditoría del Sistema
            </h1>
            <p>Trazabilidad de acciones realizadas en la plataforma</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="filtro-usuario">Usuario</label>
            <select
              id="filtro-usuario"
              className={styles.filterSelect}
              value={filtros.usuarioId}
              onChange={(e) => handleFilterChange('usuarioId', e.target.value)}
              disabled={loadingUsuarios}
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="filtro-entidad">Entidad</label>
            <select
              id="filtro-entidad"
              className={styles.filterSelect}
              value={filtros.entidad}
              onChange={(e) => handleFilterChange('entidad', e.target.value)}
            >
              {ENTIDADES.map((ent) => (
                <option key={ent.value} value={ent.value}>
                  {ent.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="filtro-accion">Acción</label>
            <select
              id="filtro-accion"
              className={styles.filterSelect}
              value={filtros.accion}
              onChange={(e) => handleFilterChange('accion', e.target.value)}
            >
              {ACCIONES.map((acc) => (
                <option key={acc.value} value={acc.value}>
                  {acc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label>Acciones Rápidas</label>
            <div className={styles.quickFilters}>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === '' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('')}
              >
                Todas
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'CREATE' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('CREATE')}
              >
                Crear
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'UPDATE' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('UPDATE')}
              >
                Actualizar
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'DELETE' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('DELETE')}
              >
                Eliminar
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'LOGIN' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('LOGIN')}
              >
                Inicio de sesión
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'LOGOUT' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('LOGOUT')}
              >
                Cierre de sesión
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'EXPORT' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('EXPORT')}
              >
                Exportar
              </button>
              <button 
                className={`${styles.quickFilterBtn} ${filtros.accion === 'PERMISSION_DENIED' ? styles.quickFilterBtnActive : ''}`}
                onClick={() => setQuickAction('PERMISSION_DENIED')}
              >
                Acceso denegado
              </button>
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label>Fecha Inicio</label>
            <DateTimePicker
              selected={filtros.fechaInicio}
              onChange={(date) => handleFilterChange('fechaInicio', date)}
              dateOnly
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha Fin</label>
            <DateTimePicker
              selected={filtros.fechaFin}
              onChange={(date) => handleFilterChange('fechaFin', date)}
              dateOnly
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Filtros Rápidos</label>
            <div className={styles.quickFilters}>
              <button className={styles.quickFilterBtn} onClick={() => setToday()}>
                Hoy
              </button>
              <button className={styles.quickFilterBtn} onClick={() => setQuickFilter(7)}>
                Últimos 7 días
              </button>
              <button className={styles.quickFilterBtn} onClick={() => setQuickFilter(30)}>
                Últimos 30 días
              </button>
              <button className={styles.quickFilterBtn} onClick={() => setQuickFilter(90)}>
                Últimos 90 días
              </button>
              <button className={styles.quickFilterBtn} onClick={setCurrentMonth}>
                Mes actual
              </button>
              <button className={styles.quickFilterBtn} onClick={clearFilters}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Tabla de registros */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Entidad</th>
              <th>Acción</th>
              <th>ID Entidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  <i className="fas fa-inbox"></i>
                  <p>No se encontraron registros de auditoría</p>
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id}>
                  <td>{formatFecha(registro.fechaHora)}</td>
                  <td>
                    {registro.usuario ? (
                      <>
                        <div>{registro.usuario.nombre}</div>
                        <div className={styles.email}>{registro.usuario.email}</div>
                      </>
                    ) : (
                      'No disponible'
                    )}
                  </td>
                  <td>{registro.rol || '-'}</td>
                  <td>{registro.entidad}</td>
                  <td>
                    <span className={getAccionBadgeClass(registro.accion)}>
                      {formatAccion(registro.accion)}
                    </span>
                  </td>
                  <td className={styles.entityId}>{registro.entidadId || '-'}</td>
                  <td>
                    <button
                      className={styles.btnDetails}
                      onClick={() => openDetalles(registro)}
                      title="Ver detalles"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          {pagination.total > 0 ? (
            <>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registro{pagination.total !== 1 ? 's' : ''}
            </>
          ) : (
            'No hay registros que mostrar'
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1 || loading}
            >
              <i className="fas fa-chevron-left"></i> Anterior
            </button>
            <span className={styles.paginationPage}>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Siguiente <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
        <div className={styles.paginationLimit}>
          <label htmlFor="registros-por-pagina">Registros por página:</label>
          <select
            id="registros-por-pagina"
            value={itemsPerPage}
            onChange={(e) => {
              const newLimit = Number.parseInt(e.target.value)
              setItemsPerPage(newLimit)
              setCurrentPage(1)
            }}
            disabled={loading}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
      </div>

      {/* Modal de detalles */}
      {modalDetalles.isOpen && (
        <div 
          className={styles.modalOverlay} 
          onClick={closeDetalles}
          onKeyDown={(e) => e.key === 'Escape' && closeDetalles()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-auditoria-title"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="modal-auditoria-title" className={styles.modalTitle}>
                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
                Detalles del Registro de Auditoría
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeDetalles} aria-label="Cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              {renderDetalles()}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalBtn} onClick={closeDetalles}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

