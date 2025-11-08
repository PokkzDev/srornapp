'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import styles from './page.module.css'

export default function PartosListClient({ permissions }) {
  const router = useRouter()
  const [partos, setPartos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // Para debouncing
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

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Eliminar',
    showCancel: true,
    cancelText: 'Cancelar',
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1) // Reset to first page when searching
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  // Cargar lista de partos cuando cambia la página o la búsqueda
  const loadPartos = useCallback(async () => {
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

      const response = await fetch(`/api/partos?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los partos')
        setLoading(false)
        return
      }

      const data = await response.json()
      setPartos(data.data || [])
      setPagination(data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      })
    } catch (err) {
      console.error('Error loading partos:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [search, currentPage, itemsPerPage])

  useEffect(() => {
    loadPartos()
  }, [loadPartos])

  const openDeleteModal = (id, madreInfo) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar Eliminación',
      message: `¿Está seguro que desea eliminar el parto de ${madreInfo}?\n\nEsta acción no se puede deshacer.`,
      onConfirm: () => handleDelete(id),
      confirmText: 'Eliminar',
      showCancel: true,
      cancelText: 'Cancelar',
    })
  }

  const closeModal = () => {
    setModal({
      ...modal,
      isOpen: false,
      onConfirm: null,
    })
  }

  const handleDelete = async (id) => {
    setDeleteLoading(id)
    closeModal()
    
    try {
      const response = await fetch(`/api/partos/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Eliminar',
          message: data.error || 'Error al eliminar el parto',
          onConfirm: closeModal,
          confirmText: 'Aceptar',
          showCancel: false,
        })
        setDeleteLoading(null)
        return
      }

      // Recargar lista - si estamos en la última página y solo quedaba 1 item,
      // volver a la página anterior
      const wasLastItem = partos.length === 1 && currentPage === pagination.totalPages
      if (wasLastItem && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        loadPartos()
      }
    } catch (err) {
      console.error('Error deleting parto:', err)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Conexión',
        message: 'Error al conectar con el servidor',
        onConfirm: closeModal,
        confirmText: 'Aceptar',
        showCancel: false,
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Función para formatear tipo de parto
  const formatTipo = (tipo) => {
    const tipos = {
      EUTOCICO: 'Eutócico',
      DISTOCICO: 'Distócico',
      CESAREA_ELECTIVA: 'Cesárea Electiva',
      CESAREA_EMERGENCIA: 'Cesárea Emergencia',
    }
    return tipos[tipo] || tipo
  }

  // Función para formatear lugar
  const formatLugar = (lugar) => {
    const lugares = {
      SALA_PARTO: 'Sala de Parto',
      PABELLON: 'Pabellón',
      DOMICILIO: 'Domicilio',
      OTRO: 'Otro',
    }
    return lugares[lugar] || lugar
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Modulo Partos</h1>
            <p>Gestión de partos registrados en el sistema</p>
          </div>
          {permissions.create && (
            <Link href="/dashboard/partos/nuevo" className={styles.btnNew}>
              <i className="fas fa-plus"></i>
              Nuevo Parto
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por madre, tipo, lugar..."
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
          <span>Cargando partos...</span>
        </div>
      ) : partos.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-baby"></i>
          <h3>No se encontraron partos</h3>
          <p>
            {search
              ? 'No hay partos que coincidan con su búsqueda.'
              : 'Aún no hay partos registrados en el sistema.'}
          </p>
        </div>
      ) : (
        <>
          {!loading && partos.length > 0 && (
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
                <th>Fecha/Hora</th>
                <th>Madre</th>
                <th>Tipo</th>
                <th>Lugar</th>
                <th className={styles.actionsCol}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {partos.map((parto) => (
                <tr key={parto.id}>
                  <td>{formatFecha(parto.fechaHora)}</td>
                  <td>
                    {parto.madre
                      ? `${parto.madre.nombres} ${parto.madre.apellidos} (${parto.madre.rut})`
                      : '-'}
                  </td>
                  <td>
                    <span className={styles.badge}>{formatTipo(parto.tipo)}</span>
                  </td>
                  <td>
                    {formatLugar(parto.lugar)}
                    {parto.lugar === 'OTRO' && parto.lugarDetalle && (
                      <span className={styles.detail}> - {parto.lugarDetalle}</span>
                    )}
                  </td>
                  <td className={styles.actionsCol}>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/partos/${parto.id}`}
                        className={styles.btnAction}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      {permissions.update && (
                        <Link
                          href={`/dashboard/partos/${parto.id}/editar`}
                          className={`${styles.btnAction} ${styles.btnEdit}`}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                      )}
                      {permissions.delete && (
                        <button
                          onClick={() =>
                            openDeleteModal(
                              parto.id,
                              parto.madre
                                ? `${parto.madre.nombres} ${parto.madre.apellidos}`
                                : 'la madre'
                            )
                          }
                          className={`${styles.btnAction} ${styles.btnDelete}`}
                          disabled={deleteLoading === parto.id}
                          title="Eliminar"
                        >
                          {deleteLoading === parto.id ? (
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
      {!loading && partos.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {((currentPage - 1) * pagination.limit) + 1} -{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} de{' '}
            {pagination.total} partos
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
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
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

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        showCancel={modal.showCancel}
        cancelText={modal.cancelText}
      />
    </div>
  )
}

