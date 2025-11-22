'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import styles from './page.module.css'

export default function UsuariosClient({ permissions }) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(null)
  
  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmar',
    showCancel: true,
    cancelText: 'Cancelar',
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Cargar lista de usuarios
  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/users')

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar los usuarios')
        setLoading(false)
        return
      }

      const data = await response.json()
      let usuariosData = data.data || []

      // Filtrar por búsqueda si existe
      if (search) {
        const searchLower = search.toLowerCase()
        usuariosData = usuariosData.filter((u) =>
          u.nombre?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.rut?.toLowerCase().includes(searchLower) ||
          u.roles?.some((r) => r.toLowerCase().includes(searchLower))
        )
      }

      setUsuarios(usuariosData)
    } catch (err) {
      console.error('Error loading usuarios:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  const openDeleteModal = (id, nombre, email) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar Eliminación',
      message: `¿Está seguro que desea eliminar al usuario ${nombre} (${email})?\n\nEsta acción no se puede deshacer.`,
      onConfirm: () => handleDelete(id),
      confirmText: 'Eliminar',
      showCancel: true,
      cancelText: 'Cancelar',
    })
  }

  const openToggleModal = (id, nombre, activo) => {
    const accion = activo ? 'desactivar' : 'activar'
    setModal({
      isOpen: true,
      type: 'warning',
      title: `Confirmar ${accion === 'desactivar' ? 'Desactivación' : 'Activación'}`,
      message: `¿Está seguro que desea ${accion} al usuario ${nombre}?`,
      onConfirm: () => handleToggleActivo(id, !activo),
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
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
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Eliminar',
          message: data.error || 'Error al eliminar el usuario',
          onConfirm: closeModal,
          confirmText: 'Aceptar',
          showCancel: false,
        })
        setDeleteLoading(null)
        return
      }

      loadUsuarios()
    } catch (err) {
      console.error('Error deleting usuario:', err)
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

  const handleToggleActivo = async (id, nuevoEstado) => {
    setToggleLoading(id)
    closeModal()
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: nuevoEstado }),
      })

      const data = await response.json()

      if (!response.ok) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: data.error || 'Error al cambiar el estado del usuario',
          onConfirm: closeModal,
          confirmText: 'Aceptar',
          showCancel: false,
        })
        setToggleLoading(null)
        return
      }

      loadUsuarios()
    } catch (err) {
      console.error('Error toggling usuario:', err)
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
      setToggleLoading(null)
    }
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Gestión de Usuarios</h1>
            <p>Administración de cuentas de usuario del sistema</p>
          </div>
          {permissions.create && (
            <Link href="/dashboard/usuarios/nuevo" className={styles.btnNew}>
              <i className="fas fa-plus"></i>
              Nuevo Usuario
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por nombre, email, RUT o rol..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearch('')
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
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Cargando usuarios...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-users"></i>
          <h3>No hay usuarios</h3>
          <p>
            {search
              ? 'No se encontraron usuarios que coincidan con la búsqueda'
              : 'Aún no hay usuarios registrados en el sistema'}
          </p>
          {permissions.create && !search && (
            <Link href="/dashboard/usuarios/nuevo" className={styles.btnNew}>
              <i className="fas fa-plus"></i>
              Crear Primer Usuario
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>RUT</th>
                  <th>Roles</th>
                  <th>Estado</th>
                  <th className={styles.actionsCol}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.rut || '-'}</td>
                    <td>
                      <div className={styles.roles}>
                        {usuario.roles && usuario.roles.length > 0 ? (
                          usuario.roles.map((rol, idx) => (
                            <span key={idx} className={styles.roleBadge}>
                              {rol}
                            </span>
                          ))
                        ) : (
                          <span className={styles.noRoles}>Sin roles</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          usuario.activo ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {usuario.activo ? (
                          <>
                            <i className="fas fa-check-circle"></i>
                            Activo
                          </>
                        ) : (
                          <>
                            <i className="fas fa-times-circle"></i>
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className={styles.actionsCol}>
                      <div className={styles.actions}>
                        {permissions.update && (
                          <Link
                            href={`/dashboard/usuarios/${usuario.id}/editar`}
                            className={`${styles.btnAction} ${styles.btnEdit}`}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                        )}
                        {permissions.manage && (
                          <button
                            onClick={() => openToggleModal(usuario.id, usuario.nombre, usuario.activo)}
                            className={`${styles.btnAction} ${styles.btnToggle}`}
                            disabled={toggleLoading === usuario.id}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            {toggleLoading === usuario.id ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : usuario.activo ? (
                              <i className="fas fa-ban"></i>
                            ) : (
                              <i className="fas fa-check"></i>
                            )}
                          </button>
                        )}
                        {permissions.delete && (
                          <button
                            onClick={() => openDeleteModal(usuario.id, usuario.nombre, usuario.email)}
                            className={`${styles.btnAction} ${styles.btnDelete}`}
                            disabled={deleteLoading === usuario.id}
                            title="Eliminar"
                          >
                            {deleteLoading === usuario.id ? (
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

      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />
    </div>
  )
}







