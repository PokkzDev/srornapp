'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PartoForm from '@/components/PartoForm'
import styles from './page.module.css'

export default function RegistrarPartoClient() {
  const router = useRouter()
  const [selectedMadre, setSelectedMadre] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [madres, setMadres] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  // Search mothers function
  const searchMadres = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        search: search,
        limit: '20', // Limit results to 20
      })

      const response = await fetch(`/api/madres?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al buscar madres')
        setMadres([])
        setLoading(false)
        return
      }

      const data = await response.json()
      setMadres(data.data || [])
    } catch (err) {
      console.error('Error searching madres:', err)
      setError('Error al conectar con el servidor')
      setMadres([])
    } finally {
      setLoading(false)
    }
  }, [search])

  // Search mothers when search changes
  useEffect(() => {
    if (search.trim().length >= 2) {
      searchMadres()
    } else {
      setMadres([])
    }
  }, [search, searchMadres])

  const handleSelectMadre = (madre) => {
    setSelectedMadre(madre)
    setSearchInput('')
    setSearch('')
    setMadres([])
  }

  const handleBackToSearch = () => {
    setSelectedMadre(null)
  }

  // If mother is selected, show the form
  if (selectedMadre) {
    return (
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <button onClick={handleBackToSearch} className={styles.backButton}>
                <i className="fas fa-arrow-left"></i> Buscar otra madre
              </button>
              <h1>Registrar Nuevo Parto</h1>
              <p>
                Madre seleccionada: <strong>{selectedMadre.nombres} {selectedMadre.apellidos}</strong> ({selectedMadre.rut})
              </p>
            </div>
          </div>
        </div>
        <PartoForm preselectedMadreId={selectedMadre.id} />
      </div>
    )
  }

  // Show search interface
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h1>Registrar Nuevo Parto</h1>
        <p>Primero busque y seleccione la madre</p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por RUT o nombre de la madre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar madre"
            autoFocus
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setMadres([])
              }}
              className={styles.clearSearch}
              title="Limpiar búsqueda"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {error && (
          <div className={styles.alertError}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {loading && (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <span>Buscando madres...</span>
          </div>
        )}

        {!loading && search.trim().length >= 2 && madres.length === 0 && (
          <div className={styles.emptyState}>
            <i className="fas fa-user-injured"></i>
            <p>No se encontraron madres que coincidan con "{search}"</p>
          </div>
        )}

        {search.trim().length < 2 && (
          <div className={styles.helpText}>
            <i className="fas fa-info-circle"></i>
            <p>Ingrese al menos 2 caracteres para buscar por RUT o nombre</p>
          </div>
        )}

        {madres.length > 0 && (
          <div className={styles.resultsList}>
            <h3 className={styles.resultsTitle}>
              Resultados ({madres.length})
            </h3>
            <div className={styles.madresList}>
              {madres.map((madre) => (
                <div
                  key={madre.id}
                  className={styles.madreCard}
                  onClick={() => handleSelectMadre(madre)}
                >
                  <div className={styles.madreInfo}>
                    <div className={styles.madreName}>
                      {madre.nombres} {madre.apellidos}
                    </div>
                    <div className={styles.madreDetails}>
                      <span className={styles.madreRut}>RUT: {madre.rut}</span>
                      {madre.edad && (
                        <span className={styles.madreAge}>Edad: {madre.edad} años</span>
                      )}
                      {madre.telefono && (
                        <span className={styles.madrePhone}>Tel: {madre.telefono}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.selectButton}>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

