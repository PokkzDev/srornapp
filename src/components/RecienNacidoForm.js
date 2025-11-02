'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './RecienNacidoForm.module.css'

export default function RecienNacidoForm({ initialData = null, isEdit = false, recienNacidoId = null, preselectedPartoId = null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [partos, setPartos] = useState([])
  const [preselectedParto, setPreselectedParto] = useState(null)
  const [loadingPartos, setLoadingPartos] = useState(false)

  const [formData, setFormData] = useState({
    partoId: preselectedPartoId || '',
    sexo: '',
    pesoGr: '',
    tallaCm: '',
    apgar1: '',
    apgar5: '',
    observaciones: '',
  })

  // Cargar parto preseleccionado si existe
  useEffect(() => {
    if (preselectedPartoId) {
      const loadPreselectedParto = async () => {
        try {
          const response = await fetch(`/api/partos/${preselectedPartoId}`)
          if (response.ok) {
            const data = await response.json()
            setPreselectedParto(data.data)
            setFormData((prev) => ({ ...prev, partoId: preselectedPartoId }))
          }
        } catch (err) {
          console.error('Error loading preselected parto:', err)
        }
      }
      loadPreselectedParto()
    }
  }, [preselectedPartoId])

  // Si es edición, también cargar el parto asociado
  useEffect(() => {
    if (isEdit && initialData?.partoId) {
      const loadParto = async () => {
        try {
          const response = await fetch(`/api/partos/${initialData.partoId}`)
          if (response.ok) {
            const data = await response.json()
            setPreselectedParto(data.data)
          }
        } catch (err) {
          console.error('Error loading parto:', err)
        }
      }
      loadParto()
    }
  }, [isEdit, initialData?.partoId])

  // Cargar partos al montar (solo si no hay parto preseleccionado)
  useEffect(() => {
    const loadPartos = async () => {
      if (!preselectedPartoId) {
        try {
          setLoadingPartos(true)
          const response = await fetch('/api/partos?limit=1000')
          if (response.ok) {
            const data = await response.json()
            setPartos(data.data || [])
          }
        } catch (err) {
          console.error('Error loading partos:', err)
        } finally {
          setLoadingPartos(false)
        }
      }
    }

    loadPartos()
  }, [preselectedPartoId])

  // Cargar datos iniciales si es modo edición
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        partoId: initialData.partoId || '',
        sexo: initialData.sexo || '',
        pesoGr: initialData.pesoGr?.toString() || '',
        tallaCm: initialData.tallaCm?.toString() || '',
        apgar1: initialData.apgar1?.toString() || '',
        apgar5: initialData.apgar5?.toString() || '',
        observaciones: initialData.observaciones || '',
      })
    }
  }, [isEdit, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Limpiar errores al cambiar campos
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validaciones básicas
    if (!formData.partoId || !formData.sexo) {
      setError('Parto y sexo son requeridos')
      setLoading(false)
      return
    }

    // Validar Apgar si están presentes
    if (formData.apgar1 && (parseInt(formData.apgar1) < 0 || parseInt(formData.apgar1) > 10)) {
      setError('El Apgar 1\' debe ser un número entre 0 y 10')
      setLoading(false)
      return
    }

    if (formData.apgar5 && (parseInt(formData.apgar5) < 0 || parseInt(formData.apgar5) > 10)) {
      setError('El Apgar 5\' debe ser un número entre 0 y 10')
      setLoading(false)
      return
    }

    try {
      const url = isEdit ? `/api/recien-nacidos/${recienNacidoId}` : '/api/recien-nacidos'
      const method = isEdit ? 'PUT' : 'POST'

      // Preparar datos para enviar
      const submitData = {
        partoId: formData.partoId,
        sexo: formData.sexo,
        pesoGr: formData.pesoGr || null,
        tallaCm: formData.tallaCm || null,
        apgar1: formData.apgar1 || null,
        apgar5: formData.apgar5 || null,
        observaciones: formData.observaciones || null,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Error al ${isEdit ? 'actualizar' : 'registrar'} el recién nacido`)
        setLoading(false)
        return
      }

      setSuccess(`Recién nacido ${isEdit ? 'actualizado' : 'registrado'} exitosamente`)
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/recien-nacidos')
      }, 2000)
    } catch (err) {
      console.error(`Error al ${isEdit ? 'actualizar' : 'registrar'} recién nacido:`, err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  // Función para formatear tipo de parto
  const formatTipo = (tipo) => {
    const tipos = {
      EUTOCICO: 'Eutócico',
      DISTOCICO: 'Distócico',
      CESAREA_ELECTIVA: 'Cesárea Electiva',
      CESAREA_EMERGENCIA: 'Cesárea Emergencia',
    }
    return tipos[tipo] || tipo
  }

  return (
    <>
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

      {loadingPartos ? (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Cargando partos...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Parto */}
            <div className={styles.formGroup}>
              <label htmlFor="partoId">
                Parto <span className={styles.required}>*</span>
              </label>
              {(preselectedPartoId || (isEdit && initialData?.partoId)) && preselectedParto ? (
                <div className={styles.preselectedParto}>
                  <div className={styles.partoDisplay}>
                    <strong>
                      {preselectedParto.madre?.nombres} {preselectedParto.madre?.apellidos}
                    </strong>
                    <span className={styles.partoDate}>
                      {new Date(preselectedParto.fechaHora).toLocaleString('es-CL')}
                    </span>
                    {preselectedParto.tipo && (
                      <span className={styles.partoTipo}>{formatTipo(preselectedParto.tipo)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <select
                  id="partoId"
                  name="partoId"
                  value={formData.partoId}
                  onChange={handleChange}
                  required
                  className={styles.select}
                  disabled={loadingPartos || isEdit || !!preselectedPartoId}
                >
                  <option value="">Seleccione un parto</option>
                  {partos.map((parto) => (
                    <option key={parto.id} value={parto.id}>
                      {parto.madre
                        ? `${parto.madre.nombres} ${parto.madre.apellidos} - ${new Date(parto.fechaHora).toLocaleString('es-CL')}`
                        : `Parto ${parto.id}`}
                    </option>
                  ))}
                </select>
              )}
              {isEdit && (
                <small className={styles.helpText}>
                  El parto no se puede modificar
                </small>
              )}
            </div>

            {/* Sexo */}
            <div className={styles.formGroup}>
              <label htmlFor="sexo">
                Sexo <span className={styles.required}>*</span>
              </label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Seleccione un sexo</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="I">Indeterminado</option>
              </select>
            </div>

            {/* Peso */}
            <div className={styles.formGroup}>
              <label htmlFor="pesoGr">Peso (gramos)</label>
              <input
                type="number"
                id="pesoGr"
                name="pesoGr"
                value={formData.pesoGr}
                onChange={handleChange}
                min="0"
                placeholder="Ej: 3250"
              />
            </div>

            {/* Talla */}
            <div className={styles.formGroup}>
              <label htmlFor="tallaCm">Talla (centímetros)</label>
              <input
                type="number"
                id="tallaCm"
                name="tallaCm"
                value={formData.tallaCm}
                onChange={handleChange}
                min="0"
                placeholder="Ej: 50"
              />
            </div>

            {/* Apgar 1' */}
            <div className={styles.formGroup}>
              <label htmlFor="apgar1">Apgar 1'</label>
              <input
                type="number"
                id="apgar1"
                name="apgar1"
                value={formData.apgar1}
                onChange={handleChange}
                min="0"
                max="10"
                placeholder="0-10"
              />
              <small className={styles.helpText}>
                Escala de 0 a 10
              </small>
            </div>

            {/* Apgar 5' */}
            <div className={styles.formGroup}>
              <label htmlFor="apgar5">Apgar 5'</label>
              <input
                type="number"
                id="apgar5"
                name="apgar5"
                value={formData.apgar5}
                onChange={handleChange}
                min="0"
                max="10"
                placeholder="0-10"
              />
              <small className={styles.helpText}>
                Escala de 0 a 10
              </small>
            </div>

            {/* Observaciones */}
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                className={styles.textarea}
                placeholder="Agregue observaciones adicionales"
              />
              <small className={styles.helpText}>
                {formData.observaciones.length}/500 caracteres
              </small>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/recien-nacidos')}
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
                  <i className="fas fa-spinner fa-spin"></i> Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> {isEdit ? 'Actualizar Recién Nacido' : 'Registrar Recién Nacido'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </>
  )
}

