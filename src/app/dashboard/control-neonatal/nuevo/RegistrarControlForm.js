'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function RegistrarControlForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [recienNacidos, setRecienNacidos] = useState([])
  const [loadingRN, setLoadingRN] = useState(false)
  const [selectedRN, setSelectedRN] = useState(null)
  
  const [episodiosURNI, setEpisodiosURNI] = useState([])
  const [loadingEpisodios, setLoadingEpisodios] = useState(false)

  const [formData, setFormData] = useState({
    rnId: '',
    episodioUrniId: '',
    fechaHora: new Date().toISOString().slice(0, 16),
    tipo: 'SIGNOS_VITALES',
    datos: '',
    observaciones: '',
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Search recién nacidos
  const searchRecienNacidos = useCallback(async () => {
    setLoadingRN(true)
    setError('')
    try {
      const params = new URLSearchParams({
        search: search,
        limit: '20',
      })

      const response = await fetch(`/api/recien-nacidos?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al buscar recién nacidos')
        setRecienNacidos([])
        setLoadingRN(false)
        return
      }

      const data = await response.json()
      setRecienNacidos(data.data || [])
    } catch (err) {
      console.error('Error searching recien nacidos:', err)
      setError('Error al conectar con el servidor')
      setRecienNacidos([])
    } finally {
      setLoadingRN(false)
    }
  }, [search])

  // Search recién nacidos when search changes
  useEffect(() => {
    if (search.trim().length >= 2) {
      searchRecienNacidos()
    } else {
      setRecienNacidos([])
    }
  }, [search, searchRecienNacidos])

  // Load episodios URNI when RN is selected
  useEffect(() => {
    if (selectedRN) {
      const loadEpisodios = async () => {
        setLoadingEpisodios(true)
        try {
          const response = await fetch(`/api/urni/episodio?rnId=${selectedRN.id}&limit=100`)
          if (response.ok) {
            const data = await response.json()
            setEpisodiosURNI(data.data || [])
            // Auto-select active episode if exists
            const activo = (data.data || []).find(e => e.estado === 'INGRESADO')
            if (activo) {
              setFormData(prev => ({ ...prev, episodioUrniId: activo.id }))
            }
          }
        } catch (err) {
          console.error('Error loading episodios:', err)
        } finally {
          setLoadingEpisodios(false)
        }
      }
      loadEpisodios()
    }
  }, [selectedRN])

  const handleSelectRN = (rn) => {
    setSelectedRN(rn)
    setFormData(prev => ({ ...prev, rnId: rn.id }))
    setSearchInput('')
    setSearch('')
    setRecienNacidos([])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validaciones
    if (!formData.rnId) {
      setError('Debe seleccionar un recién nacido')
      setLoading(false)
      return
    }

    // Validar datos JSON si se proporciona
    let datosParsed = null
    if (formData.datos && formData.datos.trim()) {
      try {
        datosParsed = JSON.parse(formData.datos)
      } catch (err) {
        setError('El campo datos debe ser un JSON válido')
        setLoading(false)
        return
      }
    }

    try {
      const submitData = {
        rnId: formData.rnId,
        episodioUrniId: formData.episodioUrniId || null,
        fechaHora: formData.fechaHora ? new Date(formData.fechaHora).toISOString() : new Date().toISOString(),
        tipo: formData.tipo,
        datos: datosParsed,
        observaciones: formData.observaciones || null,
      }

      const response = await fetch('/api/control-neonatal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al registrar el control neonatal')
        setLoading(false)
        return
      }

      setSuccess('Control neonatal registrado exitosamente')
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/dashboard/control-neonatal')
      }, 1000)
    } catch (err) {
      console.error('Error submitting form:', err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  // If RN is not selected, show search interface
  if (!selectedRN) {
    return (
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Registrar Nuevo Control Neonatal</h1>
          <p>Primero busque y seleccione el recién nacido</p>
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
              autoFocus
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setRecienNacidos([])
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

          {loadingRN && (
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Buscando recién nacidos...</span>
            </div>
          )}

          {!loadingRN && search.trim().length >= 2 && recienNacidos.length === 0 && (
            <div className={styles.emptyState}>
              <i className="fas fa-baby"></i>
              <p>No se encontraron recién nacidos que coincidan con "{search}"</p>
            </div>
          )}

          {search.trim().length < 2 && (
            <div className={styles.helpText}>
              <i className="fas fa-info-circle"></i>
              <p>Ingrese al menos 2 caracteres para buscar por RUT o nombre de la madre</p>
            </div>
          )}

          {recienNacidos.length > 0 && (
            <div className={styles.resultsList}>
              <h3 className={styles.resultsTitle}>
                Resultados ({recienNacidos.length})
              </h3>
              <div className={styles.madresList}>
                {recienNacidos.map((rn) => (
                  <div
                    key={rn.id}
                    className={styles.madreCard}
                    onClick={() => handleSelectRN(rn)}
                  >
                    <div className={styles.madreInfo}>
                      <div className={styles.madreName}>
                        {rn.parto?.madre
                          ? `${rn.parto.madre.nombres} ${rn.parto.madre.apellidos} (${rn.parto.madre.rut})`
                          : 'RN sin madre asociada'}
                      </div>
                      <div className={styles.madreDetails}>
                        <span className={styles.madreRut}>
                          Parto: {rn.parto?.fechaHora
                            ? new Date(rn.parto.fechaHora).toLocaleString('es-CL')
                            : '-'}
                        </span>
                        {rn.sexo && (
                          <span className={styles.madreAge}>
                            Sexo: {rn.sexo === 'M' ? 'Masculino' : rn.sexo === 'F' ? 'Femenino' : 'Indeterminado'}
                          </span>
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

  // Show form when RN is selected
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <button
              onClick={() => {
                setSelectedRN(null)
                setFormData({
                  rnId: '',
                  episodioUrniId: '',
                  fechaHora: new Date().toISOString().slice(0, 16),
                  tipo: 'SIGNOS_VITALES',
                  datos: '',
                  observaciones: '',
                })
              }}
              className={styles.backButton}
            >
              <i className="fas fa-arrow-left"></i> Seleccionar otro RN
            </button>
            <h1>Registrar Nuevo Control Neonatal</h1>
            <p>
              RN: <strong>
                {selectedRN.parto?.madre
                  ? `${selectedRN.parto.madre.nombres} ${selectedRN.parto.madre.apellidos} (${selectedRN.parto.madre.rut})`
                  : 'RN sin madre asociada'}
              </strong>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.alertError}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.alertSuccess}>
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="fechaHora">
            Fecha y Hora <span className={styles.required}>*</span>
          </label>
          <input
            type="datetime-local"
            id="fechaHora"
            name="fechaHora"
            value={formData.fechaHora}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tipo">
            Tipo de Control <span className={styles.required}>*</span>
          </label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="SIGNOS_VITALES">Signos Vitales</option>
            <option value="GLUCEMIA">Glucemia</option>
            <option value="ALIMENTACION">Alimentación</option>
            <option value="MEDICACION">Medicación</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="episodioUrniId">
            Episodio URNI (Opcional)
          </label>
          {loadingEpisodios ? (
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Cargando episodios...</span>
            </div>
          ) : (
            <select
              id="episodioUrniId"
              name="episodioUrniId"
              value={formData.episodioUrniId}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Sin episodio URNI</option>
              {episodiosURNI.map((episodio) => (
                <option key={episodio.id} value={episodio.id}>
                  {new Date(episodio.fechaHoraIngreso).toLocaleString('es-CL')} - {episodio.estado} {episodio.servicioUnidad ? `(${episodio.servicioUnidad})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="datos">
            Datos (JSON) <span className={styles.help}>Ej: {"{"}"temp": 36.7, "fc": 140, "fr": 40, "spo2": 98{"}"}</span>
          </label>
          <textarea
            id="datos"
            name="datos"
            value={formData.datos}
            onChange={handleChange}
            placeholder='{"temp": 36.7, "fc": 140, "fr": 40, "spo2": 98}'
            rows={4}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="observaciones">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Observaciones adicionales..."
            rows={4}
            maxLength={500}
            className={styles.textarea}
          />
          <div className={styles.charCount}>
            {formData.observaciones.length}/500 caracteres
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/control-neonatal')}
            className={styles.btnSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Registrando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Registrar Control
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


