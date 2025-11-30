'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import DateTimePicker from '@/components/DateTimePicker'

export default function EditarEpisodioURNIForm({ episodioId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [medicos, setMedicos] = useState([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)
  const [episodio, setEpisodio] = useState(null)

  const [formData, setFormData] = useState({
    fechaHoraIngreso: null,
    motivoIngreso: '',
    servicioUnidad: '',
    responsableClinicoId: '',
  })

  // Cargar datos del episodio
  useEffect(() => {
    const loadEpisodio = async () => {
      setLoadingData(true)
      setError('')
      try {
        const response = await fetch(`/api/urni/episodio/${episodioId}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al cargar el episodio')
        }

        const data = await response.json()
        const episodioData = data.data

        // Verificar que el episodio no esté dado de alta
        if (episodioData.estado === 'ALTA') {
          setError('No se puede editar un episodio que ya fue dado de alta')
          setLoadingData(false)
          return
        }

        setEpisodio(episodioData)

        // Convertir fechaHoraIngreso a Date object para DateTimePicker
        const fechaHoraIngreso = episodioData.fechaHoraIngreso ? new Date(episodioData.fechaHoraIngreso) : null

        setFormData({
          fechaHoraIngreso: fechaHoraIngreso,
          motivoIngreso: episodioData.motivoIngreso || '',
          servicioUnidad: episodioData.servicioUnidad || '',
          responsableClinicoId: episodioData.responsableClinicoId || '',
        })
      } catch (err) {
        console.error('Error loading episodio:', err)
        setError(err.message || 'Error al cargar el episodio')
      } finally {
        setLoadingData(false)
      }
    }

    if (episodioId) {
      loadEpisodio()
    }
  }, [episodioId])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

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
      // Convertir fecha a ISO para enviar al servidor
      const fechaHoraIngreso = formData.fechaHoraIngreso ? formData.fechaHoraIngreso.toISOString() : null

      const response = await fetch(`/api/urni/episodio/${episodioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaHoraIngreso: fechaHoraIngreso,
          motivoIngreso: formData.motivoIngreso || null,
          servicioUnidad: formData.servicioUnidad || null,
          responsableClinicoId: formData.responsableClinicoId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error response:', data)
        setError(data.error || 'Error al actualizar el episodio URNI')
        setLoading(false)
        return
      }

      setSuccess('Episodio URNI actualizado exitosamente')
      setTimeout(() => {
        router.push(`/dashboard/urni/${episodioId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating episodio:', err)
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

  if (loadingData) {
    return <div className={styles.loading}>Cargando datos del episodio...</div>
  }

  if (error && !episodio) {
    return (
      <div className={styles.errorBox}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          className={styles.btnSecondary}
        >
          Volver
        </button>
      </div>
    )
  }

  if (!episodio) {
    return (
      <div className={styles.errorBox}>
        <h2>Episodio no encontrado</h2>
        <p>El episodio URNI solicitado no existe.</p>
        <button
          onClick={() => router.back()}
          className={styles.btnSecondary}
        >
          Volver
        </button>
      </div>
    )
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

      {/* Información del Recién Nacido (solo lectura) */}
      {episodio.rn && (
        <div className={styles.infoSection}>
          <h3>Información del Recién Nacido</h3>
          <div className={styles.infoGrid}>
            {episodio.rn.parto?.madre && (
              <>
                <div className={styles.infoItem}>
                  <label>Madre</label>
                  <span>
                    {episodio.rn.parto.madre.nombres} {episodio.rn.parto.madre.apellidos}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>RUT</label>
                  <span>{episodio.rn.parto.madre.rut}</span>
                </div>
              </>
            )}
            <div className={styles.infoItem}>
              <label>Fecha Parto</label>
              <span>{formatFecha(episodio.rn.parto?.fechaHora)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Sexo</label>
              <span>
                {episodio.rn.sexo === 'M' ? 'Masculino' : episodio.rn.sexo === 'F' ? 'Femenino' : 'Indeterminado'}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Fecha/Hora Ingreso */}
        <div className={styles.formGroup}>
          <label htmlFor="fechaHoraIngreso">
            Fecha y Hora de Ingreso <span className={styles.required}>*</span>
          </label>
          <DateTimePicker
            id="fechaHoraIngreso"
            name="fechaHoraIngreso"
            selected={formData.fechaHoraIngreso}
            onChange={(date) => setFormData((prev) => ({ ...prev, fechaHoraIngreso: date }))}
            maxDate={new Date()}
            required
            placeholderText="Seleccione fecha y hora de ingreso"
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
            Puede dejarse sin asignar si no está disponible
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
            disabled={loading || !formData.fechaHoraIngreso}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Actualizando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

