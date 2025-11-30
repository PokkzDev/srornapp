'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function CrearEpisodioURNIForm({ rnIdPreseleccionado }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchingRN, setSearchingRN] = useState(false)
  const [recienNacidos, setRecienNacidos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRN, setSelectedRN] = useState(null)
  const [medicos, setMedicos] = useState([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)

  const [formData, setFormData] = useState({
    rnId: rnIdPreseleccionado || '',
    fechaHoraIngreso: new Date().toISOString().slice(0, 16),
    motivoIngreso: '',
    servicioUnidad: '',
    responsableClinicoId: '',
  })

  // Cargar RN preseleccionado si existe
  useEffect(() => {
    if (rnIdPreseleccionado) {
      const loadRN = async () => {
        try {
          const response = await fetch(`/api/recien-nacidos/${rnIdPreseleccionado}`)
          if (response.ok) {
            const data = await response.json()
            setSelectedRN(data.data)
            setFormData((prev) => ({ ...prev, rnId: rnIdPreseleccionado }))
          }
        } catch (err) {
          console.error('Error loading RN:', err)
        }
      }
      loadRN()
    }
  }, [rnIdPreseleccionado])

  // Cargar médicos para selector de responsable clínico
  useEffect(() => {
    const loadMedicos = async () => {
      setLoadingMedicos(true)
      try {
        const response = await fetch('/api/users?role=medico')
        if (response.ok) {
          const data = await response.json()
          setMedicos(data.data || [])
        } else {
          const errorData = await response.json()
          console.error('Error loading medicos:', errorData.error)
        }
      } catch (err) {
        console.error('Error loading medicos:', err)
      } finally {
        setLoadingMedicos(false)
      }
    }
    loadMedicos()
  }, [])

  // Buscar recién nacidos
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchRecienNacidos()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setRecienNacidos([])
    }
  }, [searchTerm])

  const searchRecienNacidos = async () => {
    setSearchingRN(true)
    try {
      const response = await fetch(`/api/recien-nacidos?search=${encodeURIComponent(searchTerm)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRecienNacidos(data.data || [])
      }
    } catch (err) {
      console.error('Error searching recien nacidos:', err)
    } finally {
      setSearchingRN(false)
    }
  }

  const handleSelectRN = (rn) => {
    setSelectedRN(rn)
    setFormData({ ...formData, rnId: rn.id })
    setSearchTerm('')
    setRecienNacidos([])
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

    if (!formData.fechaHoraIngreso) {
      setError('La fecha/hora de ingreso es requerida')
      return
    }

    // Validar longitud de motivoIngreso
    if (formData.motivoIngreso && formData.motivoIngreso.length > 300) {
      setError('El motivo de ingreso no puede exceder 300 caracteres')
      return
    }

    setLoading(true)
    try {
      // Asegurar que la fecha esté en formato ISO
      let fechaHoraIngreso = formData.fechaHoraIngreso
      if (fechaHoraIngreso && !fechaHoraIngreso.includes('T')) {
        // Si viene sin T, agregarlo
        fechaHoraIngreso = fechaHoraIngreso.replace(' ', 'T')
      }
      
      const response = await fetch('/api/urni/episodio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rnId: formData.rnId,
          fechaHoraIngreso: fechaHoraIngreso,
          motivoIngreso: formData.motivoIngreso || null,
          servicioUnidad: formData.servicioUnidad || null,
          responsableClinicoId: formData.responsableClinicoId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error response:', data)
        setError(data.error || 'Error al registrar el episodio URNI')
        setLoading(false)
        return
      }

      // Resetear loading antes de navegar
      setLoading(false)
      
      // Verificar que tenemos el ID del episodio
      if (data.data && data.data.id) {
        try {
          router.push(`/dashboard/urni/${data.data.id}`)
        } catch (navError) {
          console.error('Error al navegar:', navError)
          // Si falla la navegación, al menos mostrar éxito
          setSuccess('Episodio URNI registrado exitosamente. ID: ' + data.data.id)
        }
      } else {
        console.error('Respuesta inválida: no se recibió el ID del episodio', data)
        setError('Error: No se recibió el ID del episodio creado')
      }
    } catch (err) {
      console.error('Error creating episodio:', err)
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
    <div className={styles.formContainer}>
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
                    Parto: {formatFecha(selectedRN.parto?.fechaHora)} | 
                    Sexo: {selectedRN.sexo === 'M' ? 'Masculino' : selectedRN.sexo === 'F' ? 'Femenino' : 'Indeterminado'}
                    {selectedRN.pesoNacimientoGramos && ` | Peso: ${selectedRN.pesoNacimientoGramos}g`}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRN(null)
                    setFormData({ ...formData, rnId: '' })
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
                  aria-label="Buscar recién nacido"
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
            </>
          )}
        </div>

        {/* Fecha/Hora Ingreso */}
        <div className={styles.formGroup}>
          <label htmlFor="fechaHoraIngreso">
            Fecha y Hora de Ingreso <span className={styles.required}>*</span>
          </label>
          <input
            type="datetime-local"
            id="fechaHoraIngreso"
            name="fechaHoraIngreso"
            value={formData.fechaHoraIngreso}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        {/* Motivo Ingreso */}
        <div className={styles.formGroup}>
          <label htmlFor="motivoIngreso">Motivo de Ingreso</label>
          <textarea
            id="motivoIngreso"
            name="motivoIngreso"
            value={formData.motivoIngreso}
            onChange={handleChange}
            rows={3}
            maxLength={300}
            className={styles.textarea}
            placeholder="Describa el motivo del ingreso a URNI..."
          />
          <small className={styles.helpText}>
            {formData.motivoIngreso.length}/300 caracteres
          </small>
        </div>

        {/* Servicio/Unidad */}
        <div className={styles.formGroup}>
          <label htmlFor="servicioUnidad">Servicio/Unidad</label>
          <select
            id="servicioUnidad"
            name="servicioUnidad"
            value={formData.servicioUnidad}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">Seleccione un servicio/unidad</option>
            <option value="URNI">URNI</option>
            <option value="UCIN">UCIN</option>
            <option value="NEONATOLOGIA">Neonatología</option>
          </select>
        </div>

        {/* Responsable Clínico */}
        <div className={styles.formGroup}>
          <label htmlFor="responsableClinicoId">Responsable Clínico</label>
          <select
            id="responsableClinicoId"
            name="responsableClinicoId"
            value={formData.responsableClinicoId}
            onChange={handleChange}
            className={styles.select}
            disabled={loadingMedicos}
          >
            <option value="">Seleccione un médico responsable</option>
            {medicos.map((medico) => (
              <option key={medico.id} value={medico.id}>
                {medico.nombre} {medico.email ? `(${medico.email})` : ''}
              </option>
            ))}
          </select>
          <small className={styles.helpText}>
            Puede asignarse después si no está disponible ahora
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
                Registrar Episodio URNI
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

