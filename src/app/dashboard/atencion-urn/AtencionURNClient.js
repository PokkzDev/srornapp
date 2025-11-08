'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function AtencionURNClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const episodioIdParam = searchParams.get('episodioId')
  const rnIdParam = searchParams.get('rnId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchingRN, setSearchingRN] = useState(false)
  const [recienNacidos, setRecienNacidos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRN, setSelectedRN] = useState(null)
  const [episodioActivo, setEpisodioActivo] = useState(null)

  const [formData, setFormData] = useState({
    rnId: rnIdParam || '',
    episodioId: episodioIdParam || '',
    fechaHora: new Date().toISOString().slice(0, 16),
    diagnostico: '',
    indicaciones: '',
    evolucion: '',
  })

  // Cargar RN preseleccionado si existe
  useEffect(() => {
    if (rnIdParam) {
      const loadRN = async () => {
        try {
          const response = await fetch(`/api/recien-nacidos/${rnIdParam}`)
          if (response.ok) {
            const data = await response.json()
            setSelectedRN(data.data)
            setFormData((prev) => ({ ...prev, rnId: rnIdParam }))
            
            // Buscar episodio activo
            if (episodioIdParam) {
              const episodioResponse = await fetch(`/api/urni/episodio/${episodioIdParam}`)
              if (episodioResponse.ok) {
                const episodioData = await episodioResponse.json()
                setEpisodioActivo(episodioData.data)
              }
            } else {
              // Buscar episodio activo del RN
              const episodiosResponse = await fetch(`/api/urni/episodio?rnId=${rnIdParam}&estado=INGRESADO`)
              if (episodiosResponse.ok) {
                const episodiosData = await episodiosResponse.json()
                if (episodiosData.data && episodiosData.data.length > 0) {
                  setEpisodioActivo(episodiosData.data[0])
                  setFormData((prev) => ({ ...prev, episodioId: episodiosData.data[0].id }))
                }
              }
            }
          }
        } catch (err) {
          console.error('Error loading RN:', err)
        }
      }
      loadRN()
    }
  }, [rnIdParam, episodioIdParam])

  // Función para buscar recién nacidos
  const searchRecienNacidos = useCallback(async () => {
    if (searchTerm.length < 2) {
      setRecienNacidos([])
      return
    }

    setSearchingRN(true)
    setError('')
    try {
      const response = await fetch(`/api/recien-nacidos?search=${encodeURIComponent(searchTerm)}&limit=10`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error en búsqueda:', data.error)
        setError(data.error || 'Error al buscar recién nacidos')
        setRecienNacidos([])
        return
      }

      // La API devuelve { success: true, data: [...], pagination: {...} }
      setRecienNacidos(data.data || [])
    } catch (err) {
      console.error('Error searching recien nacidos:', err)
      setError('Error al conectar con el servidor')
      setRecienNacidos([])
    } finally {
      setSearchingRN(false)
    }
  }, [searchTerm])

  // Buscar recién nacidos con debounce
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchRecienNacidos()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setRecienNacidos([])
      setSearchingRN(false)
    }
  }, [searchTerm, searchRecienNacidos])

  const handleSelectRN = async (rn) => {
    setSelectedRN(rn)
    setFormData({ ...formData, rnId: rn.id, episodioId: '' })
    setSearchTerm('')
    setRecienNacidos([])
    setEpisodioActivo(null)

    // Buscar episodio activo del RN
    try {
      const response = await fetch(`/api/urni/episodio?rnId=${rn.id}&estado=INGRESADO`)
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setEpisodioActivo(data.data[0])
          setFormData((prev) => ({ ...prev, episodioId: data.data[0].id }))
        }
      }
    } catch (err) {
      console.error('Error loading episodio activo:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.rnId) {
      setError('Debe seleccionar un recién nacido')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/urni/atencion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rnId: formData.rnId,
          episodioId: formData.episodioId || null,
          fechaHora: formData.fechaHora,
          diagnostico: formData.diagnostico || null,
          indicaciones: formData.indicaciones || null,
          evolucion: formData.evolucion || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al registrar la atención')
        setLoading(false)
        return
      }

      // Resetear loading inmediatamente después de éxito
      setLoading(false)
      
      setSuccess('Atención URNI registrada exitosamente')
      
      // Limpiar formulario
      setFormData({
        rnId: formData.rnId, // Mantener RN seleccionado
        episodioId: formData.episodioId, // Mantener episodio
        fechaHora: new Date().toISOString().slice(0, 16),
        diagnostico: '',
        indicaciones: '',
        evolucion: '',
      })

      // Si hay episodio, redirigir a su detalle después de mostrar el mensaje de éxito
      if (formData.episodioId) {
        setTimeout(() => {
          try {
            router.push(`/dashboard/urni/${formData.episodioId}`)
          } catch (navError) {
            console.error('Error al navegar:', navError)
            // Si falla la navegación, el mensaje de éxito ya se mostró
          }
        }, 1500)
      }
    } catch (err) {
      console.error('Error creating atencion:', err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

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

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div>
          <h1>Atención URNI</h1>
          <p>Registrar evaluación y atención médica para recién nacidos en URNI</p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Selección de Recién Nacido */}
        <div className={styles.formGroup}>
          <label htmlFor="rnId">
            Recién Nacido <span className={styles.required}>*</span>
          </label>
          {selectedRN ? (
            <div className={styles.selectedItem}>
              <div className={styles.selectedItemContent}>
                <div>
                  <strong>
                    RN de {selectedRN.parto?.madre?.nombres} {selectedRN.parto?.madre?.apellidos}
                  </strong>
                  <br />
                  <small>
                    RUT: {selectedRN.parto?.madre?.rut} | 
                    Parto: {formatFecha(selectedRN.parto?.fechaHora)} | 
                    Sexo: {selectedRN.sexo === 'M' ? 'Masculino' : selectedRN.sexo === 'F' ? 'Femenino' : 'Indeterminado'}
                  </small>
                  {episodioActivo && (
                    <>
                      <br />
                      <small style={{ color: '#28a745', fontWeight: 600 }}>
                        Episodio URNI Activo: Ingreso {formatFecha(episodioActivo.fechaHoraIngreso)}
                      </small>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRN(null)
                    setFormData({ ...formData, rnId: '', episodioId: '' })
                    setEpisodioActivo(null)
                  }}
                  className={styles.btnRemove}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.searchBox}>
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Buscar por madre, RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchingRN && (
                  <i className="fas fa-spinner fa-spin"></i>
                )}
              </div>
              {recienNacidos.length > 0 && (
                <div className={styles.dropdown}>
                  {recienNacidos.map((rn) => (
                    <div
                      key={rn.id}
                      onClick={() => handleSelectRN(rn)}
                      className={styles.dropdownItem}
                    >
                      <div>
                        <strong>
                          RN de {rn.parto?.madre?.nombres} {rn.parto?.madre?.apellidos}
                        </strong>
                        <br />
                        <small>
                          RUT: {rn.parto?.madre?.rut} | 
                          Parto: {formatFecha(rn.parto?.fechaHora)} | 
                          Sexo: {rn.sexo === 'M' ? 'Masculino' : rn.sexo === 'F' ? 'Femenino' : 'Indeterminado'}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm.length >= 2 && !searchingRN && recienNacidos.length === 0 && (
                <div className={styles.emptySearch}>
                  <p>No se encontraron recién nacidos con ese criterio de búsqueda</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Información del Episodio Activo */}
        {episodioActivo && (
          <div className={styles.infoBox}>
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Episodio URNI Activo</strong>
              <p>
                El recién nacido tiene un episodio URNI activo. La atención se vinculará automáticamente a este episodio.
                {episodioActivo.servicioUnidad && ` Servicio: ${episodioActivo.servicioUnidad}`}
                {episodioActivo.responsableClinico && ` | Responsable: ${episodioActivo.responsableClinico.nombre}`}
              </p>
            </div>
          </div>
        )}

        {/* Fecha/Hora */}
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

        {/* Diagnóstico */}
        <div className={styles.formGroup}>
          <label htmlFor="diagnostico">Diagnóstico / Impresión Clínica</label>
          <textarea
            id="diagnostico"
            name="diagnostico"
            value={formData.diagnostico}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            className={styles.textarea}
            placeholder="Describa el diagnóstico o impresión clínica..."
          />
          <small className={styles.helpText}>
            {formData.diagnostico.length}/500 caracteres
          </small>
        </div>

        {/* Indicaciones */}
        <div className={styles.formGroup}>
          <label htmlFor="indicaciones">Indicaciones</label>
          <textarea
            id="indicaciones"
            name="indicaciones"
            value={formData.indicaciones}
            onChange={handleChange}
            rows={4}
            maxLength={800}
            className={styles.textarea}
            placeholder="Describa las indicaciones médicas..."
          />
          <small className={styles.helpText}>
            {formData.indicaciones.length}/800 caracteres
          </small>
        </div>

        {/* Evolución */}
        <div className={styles.formGroup}>
          <label htmlFor="evolucion">Evolución</label>
          <textarea
            id="evolucion"
            name="evolucion"
            value={formData.evolucion}
            onChange={handleChange}
            rows={5}
            maxLength={1000}
            className={styles.textarea}
            placeholder="Describa la evolución del paciente..."
          />
          <small className={styles.helpText}>
            {formData.evolucion.length}/1000 caracteres
          </small>
        </div>

        {/* Botones */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.btnSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading || !formData.rnId}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Registrando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Registrar Atención URNI
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

