'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import styles from './page.module.css'

export default function MadresListClient({ permissions }) {
  const router = useRouter()
  const [madres, setMadres] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // Para debouncing
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  
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
      setCurrentPage(1) // Reset to first page when searching
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  // Cargar lista de madres cuando cambia la página o la búsqueda
  const loadMadres = useCallback(async () => {
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

      const response = await fetch(`/api/madres?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar las madres')
        setLoading(false)
        return
      }

      const data = await response.json()
      setMadres(data.data || [])
      setPagination(data.pagination || {
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      })
    } catch (err) {
      console.error('Error loading madres:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [search, currentPage, itemsPerPage])

  useEffect(() => {
    loadMadres()
  }, [loadMadres])

  const openDeleteModal = (id, rut, nombres, apellidos) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar Eliminación',
      message: `¿Está seguro que desea eliminar a la madre ${nombres} ${apellidos} (RUT: ${rut})?\n\nEsta acción no se puede deshacer.`,
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
      const response = await fetch(`/api/madres/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Eliminar',
          message: data.error || 'Error al eliminar la madre',
          onConfirm: closeModal,
          confirmText: 'Aceptar',
          showCancel: false,
        })
        setDeleteLoading(null)
        return
      }

      // Recargar lista - si estamos en la última página y solo quedaba 1 item,
      // volver a la página anterior
      const wasLastItem = madres.length === 1 && currentPage === pagination.totalPages
      if (wasLastItem && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        loadMadres()
      }
    } catch (err) {
      console.error('Error deleting madre:', err)
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

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Modulo Madres</h1>
            <p>Gestión de madres registradas en el sistema</p>
          </div>
          {permissions.create && (
            <Link href="/dashboard/madres/nuevo" className={styles.btnNew}>
              <i className="fas fa-plus"></i>
              Nueva Madre
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por RUT, nombres, apellidos o ficha clínica..."
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
          <span>Cargando madres...</span>
        </div>
      ) : madres.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-user-injured"></i>
          <h3>No se encontraron madres</h3>
          <p>
            {search
              ? 'No hay madres que coincidan con su búsqueda.'
              : 'Aún no hay madres registradas en el sistema.'}
          </p>
        </div>
      ) : (
        <>
          {!loading && madres.length > 0 && (
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
                <th>RUT</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Edad</th>
                <th>Teléfono</th>
                <th>Ficha Clínica</th>
                <th className={styles.actionsCol}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {madres.map((madre) => (
                <tr key={madre.id}>
                  <td>{madre.rut}</td>
                  <td>{madre.nombres}</td>
                  <td>{madre.apellidos}</td>
                  <td>{madre.edad || '-'}</td>
                  <td>{madre.telefono || '-'}</td>
                  <td>{madre.fichaClinica || '-'}</td>
                  <td className={styles.actionsCol}>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/madres/${madre.id}`}
                        className={styles.btnAction}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      {permissions.update && (
                        <Link
                          href={`/dashboard/madres/${madre.id}/editar`}
                          className={`${styles.btnAction} ${styles.btnEdit}`}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                      )}
                      {permissions.delete && (
                        <button
                          onClick={() => openDeleteModal(madre.id, madre.rut, madre.nombres, madre.apellidos)}
                          className={`${styles.btnAction} ${styles.btnDelete}`}
                          disabled={deleteLoading === madre.id}
                          title="Eliminar"
                        >
                          {deleteLoading === madre.id ? (
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
      {!loading && madres.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {((currentPage - 1) * pagination.limit) + 1} -{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} de{' '}
            {pagination.total} madres
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

