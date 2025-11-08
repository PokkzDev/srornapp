'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function EditarControlForm({ controlId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [episodiosURNI, setEpisodiosURNI] = useState([])
  const [loadingEpisodios, setLoadingEpisodios] = useState(false)

  const [formData, setFormData] = useState({
    rnId: '',
    episodioUrniId: '',
    fechaHora: '',
    tipo: 'SIGNOS_VITALES',
    datos: '',
    observaciones: '',
  })

  const [control, setControl] = useState(null)

  // Load control data
  useEffect(() => {
    const loadControl = async () => {
      try {
        const response = await fetch(`/api/control-neonatal/${controlId}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Error al cargar el control neonatal')
          setLoadingData(false)
          return
        }

        const controlData = data.data
        setControl(controlData)
        
        // Format fechaHora for datetime-local input
        const fechaHora = controlData.fechaHora
          ? new Date(controlData.fechaHora).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)

        setFormData({
          rnId: controlData.rnId || '',
          episodioUrniId: controlData.episodioUrniId || '',
          fechaHora: fechaHora,
          tipo: controlData.tipo || 'SIGNOS_VITALES',
          datos: controlData.datos ? JSON.stringify(controlData.datos, null, 2) : '',
          observaciones: controlData.observaciones || '',
        })

        // Load episodios URNI for this RN
        if (controlData.rnId) {
          loadEpisodios(controlData.rnId)
        }
      } catch (err) {
        console.error('Error loading control:', err)
        setError('Error al conectar con el servidor')
      } finally {
        setLoadingData(false)
      }
    }

    loadControl()
  }, [controlId])

  const loadEpisodios = async (rnId) => {
    setLoadingEpisodios(true)
    try {
      const response = await fetch(`/api/urni/episodio?rnId=${rnId}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setEpisodiosURNI(data.data || [])
      }
    } catch (err) {
      console.error('Error loading episodios:', err)
    } finally {
      setLoadingEpisodios(false)
    }
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
        episodioUrniId: formData.episodioUrniId || null,
        fechaHora: formData.fechaHora ? new Date(formData.fechaHora).toISOString() : new Date().toISOString(),
        tipo: formData.tipo,
        datos: datosParsed,
        observaciones: formData.observaciones || null,
      }

      const response = await fetch(`/api/control-neonatal/${controlId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al actualizar el control neonatal')
        setLoading(false)
        return
      }

      setSuccess('Control neonatal actualizado exitosamente')
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push(`/dashboard/control-neonatal/${controlId}`)
      }, 1000)
    } catch (err) {
      console.error('Error submitting form:', err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Cargando control neonatal...</span>
        </div>
      </div>
    )
  }

  if (error && !control) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox}>
          <h2>{error}</h2>
          <p>El control neonatal solicitado no existe en el sistema.</p>
          <a href="/dashboard/control-neonatal" className={styles.btnSecondary}>
            Volver a Controles Neonatales
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <button
              onClick={() => router.push(`/dashboard/control-neonatal/${controlId}`)}
              className={styles.backButton}
            >
              <i className="fas fa-arrow-left"></i> Volver al detalle
            </button>
            <h1>Editar Control Neonatal</h1>
            <p>
              RN: <strong>
                {control?.rn?.parto?.madre
                  ? `${control.rn.parto.madre.nombres} ${control.rn.parto.madre.apellidos} (${control.rn.parto.madre.rut})`
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
            rows={6}
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
            onClick={() => router.push(`/dashboard/control-neonatal/${controlId}`)}
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
                Actualizando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Actualizar Control
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


