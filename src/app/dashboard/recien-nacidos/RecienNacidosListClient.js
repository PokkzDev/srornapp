'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import styles from './page.module.css'

export default function RecienNacidosListClient({ permissions }) {
  const router = useRouter()
  const [recienNacidos, setRecienNacidos] = useState([])
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

  // Cargar lista de recién nacidos cuando cambia la página o la búsqueda
  const loadRecienNacidos = useCallback(async () => {
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

      const response = await fetch(`/api/recien-nacidos?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los recién nacidos')
        setLoading(false)
        return
      }

      const data = await response.json()
      setRecienNacidos(data.data || [])
      setPagination(data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      })
    } catch (err) {
      console.error('Error loading recien nacidos:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [search, currentPage, itemsPerPage])

  useEffect(() => {
    loadRecienNacidos()
  }, [loadRecienNacidos])

  const openDeleteModal = (id, madreInfo) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar Eliminación',
      message: `¿Está seguro que desea eliminar el recién nacido de ${madreInfo}?\n\nEsta acción no se puede deshacer.`,
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
      const response = await fetch(`/api/recien-nacidos/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Eliminar',
          message: data.error || 'Error al eliminar el recién nacido',
          onConfirm: closeModal,
          confirmText: 'Aceptar',
          showCancel: false,
        })
        setDeleteLoading(null)
        return
      }

      // Recargar lista - si estamos en la última página y solo quedaba 1 item,
      // volver a la página anterior
      const wasLastItem = recienNacidos.length === 1 && currentPage === pagination.totalPages
      if (wasLastItem && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        loadRecienNacidos()
      }
    } catch (err) {
      console.error('Error deleting recien nacido:', err)
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

  // Función para formatear sexo
  const formatSexo = (sexo) => {
    const sexos = {
      M: 'Masculino',
      F: 'Femenino',
      I: 'Indeterminado',
    }
    return sexos[sexo] || sexo
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Modulo Recién Nacidos</h1>
            <p>Gestión de recién nacidos registrados en el sistema</p>
          </div>
          {permissions.create && (
            <Link href="/dashboard/recien-nacidos/nuevo" className={styles.btnNew}>
              <i className="fas fa-plus"></i>
              Nuevo Recién Nacido
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por madre, sexo, observaciones..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar recién nacidos"
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
          <span>Cargando recién nacidos...</span>
        </div>
      ) : recienNacidos.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-baby"></i>
          <h3>No se encontraron recién nacidos</h3>
          <p>
            {search
              ? 'No hay recién nacidos que coincidan con su búsqueda.'
              : 'Aún no hay recién nacidos registrados en el sistema.'}
          </p>
        </div>
      ) : (
        <>
          {!loading && recienNacidos.length > 0 && (
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
                <th>Madre</th>
                <th>Fecha/Hora Parto</th>
                <th>Sexo</th>
                <th>Peso (g)</th>
                <th>Talla (cm)</th>
                <th>Apgar 1'</th>
                <th>Apgar 5'</th>
                <th className={styles.actionsCol}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recienNacidos.map((rn) => (
                <tr key={rn.id}>
                  <td>
                    {rn.parto?.madre
                      ? `${rn.parto.madre.nombres} ${rn.parto.madre.apellidos} (${rn.parto.madre.rut})`
                      : '-'}
                  </td>
                  <td>
                    {rn.parto?.fechaHora
                      ? new Date(rn.parto.fechaHora).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td>
                    <span className={styles.badge}>{formatSexo(rn.sexo)}</span>
                  </td>
                  <td>{rn.pesoNacimientoGramos ? `${rn.pesoNacimientoGramos} g` : '-'}</td>
                  <td>{rn.tallaCm ? `${rn.tallaCm} cm` : '-'}</td>
                  <td>{rn.apgar1Min !== null && rn.apgar1Min !== undefined ? rn.apgar1Min : '-'}</td>
                  <td>{rn.apgar5Min !== null && rn.apgar5Min !== undefined ? rn.apgar5Min : '-'}</td>
                  <td className={styles.actionsCol}>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/recien-nacidos/${rn.id}`}
                        className={styles.btnAction}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      {permissions.update && (
                        <Link
                          href={`/dashboard/recien-nacidos/${rn.id}/editar`}
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
                              rn.id,
                              rn.parto?.madre
                                ? `${rn.parto.madre.nombres} ${rn.parto.madre.apellidos}`
                                : 'la madre'
                            )
                          }
                          className={`${styles.btnAction} ${styles.btnDelete}`}
                          disabled={deleteLoading === rn.id}
                          title="Eliminar"
                        >
                          {deleteLoading === rn.id ? (
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
      {!loading && recienNacidos.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {((currentPage - 1) * pagination.limit) + 1} -{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} de{' '}
            {pagination.total} recién nacidos
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



