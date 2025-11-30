'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

export default function ModuloAltaListClient() {
  const [episodios, setEpisodios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('all')
  const debounceTimer = useRef(null)

  useEffect(() => {
    loadEpisodios()
  }, [])

  // Debounce para el término de búsqueda
  useEffect(() => {
    // Limpiar el timer anterior si existe
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Crear un nuevo timer
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms de delay

    // Limpiar el timer cuando el componente se desmonte o searchTerm cambie
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchTerm])

  const loadEpisodios = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/modulo-alta')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar episodios')
      }

      setEpisodios(result.data || [])
    } catch (err) {
      console.error('Error loading episodios:', err)
    } finally {
      setLoading(false)
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

  const filteredEpisodios = episodios.filter((episodio) => {
    const matchesSearch =
      episodio.madre.rut.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      episodio.madre.nombres.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      episodio.madre.apellidos.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    
    const matchesFilter = filterEstado === 'all' || episodio.estado === filterEstado

    return matchesSearch && matchesFilter && episodio.informeGenerado
  })

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          Cargando episodios...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div>
          <h1>
            <i className="fas fa-check-circle" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
            Modulo de Alta
          </h1>
          <p>Revisar y aprobar altas basadas en informes generados por matronas</p>
        </div>
      </div>

      <div className={styles.infoMessage}>
        <i className="fas fa-info-circle"></i>
        <p>
          En esta sección puede revisar los informes de alta generados por las matronas y aprobar el alta médica de los pacientes.
        </p>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por RUT, nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar módulo de alta"
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          <option value="INGRESADO">Ingresados</option>
          <option value="ALTA">Dados de alta</option>
        </select>
      </div>

      {filteredEpisodios.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-clipboard-list" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}></i>
          <p>No se encontraron episodios con informes pendientes de revisión.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Madre</th>
                <th>RUT</th>
                <th>Fecha Ingreso</th>
                <th>Informe Generado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEpisodios.map((episodio) => (
                <tr key={episodio.id}>
                  <td>
                    {episodio.madre.nombres} {episodio.madre.apellidos}
                  </td>
                  <td>{episodio.madre.rut}</td>
                  <td>{formatDate(episodio.fechaIngreso)}</td>
                  <td>
                    {episodio.informeGenerado ? (
                      <span className={styles.informeBadge}>
                        <i className="fas fa-check"></i> {formatDate(episodio.informeFecha)}
                      </span>
                    ) : (
                      <span className={styles.informeBadgeMissing}>
                        <i className="fas fa-times"></i> Sin informe
                      </span>
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
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/modulo-alta/${episodio.id}`}
                        className={styles.btnView}
                      >
                        <i className="fas fa-eye"></i>
                        Revisar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

