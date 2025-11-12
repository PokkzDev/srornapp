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
    // Campos para REM
    tieneAnomaliaCongenita: false,
    profilaxisHepatitisB: false,
    profilaxisOcular: false,
    reanimacionBasica: false,
    reanimacionAvanzada: false,
    ehi23: false,
    madreHepatitisB: false,
    profilaxisCompletaHepB: false,
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
        // Campos para REM
        tieneAnomaliaCongenita: initialData.tieneAnomaliaCongenita || false,
        profilaxisHepatitisB: initialData.profilaxisHepatitisB || false,
        profilaxisOcular: initialData.profilaxisOcular || false,
        reanimacionBasica: initialData.reanimacionBasica || false,
        reanimacionAvanzada: initialData.reanimacionAvanzada || false,
        ehi23: initialData.ehi23 || false,
        madreHepatitisB: initialData.madreHepatitisB || false,
        profilaxisCompletaHepB: initialData.profilaxisCompletaHepB || false,
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
            
            {/* Sección: Datos para Reportes REM */}
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--color-primary)' }}>Datos para Reportes REM</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Los siguientes datos son necesarios para la generación de reportes estadísticos (REM)
              </p>
            </div>
            
            {/* Anomalía Congénita */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="tieneAnomaliaCongenita"
                  checked={formData.tieneAnomaliaCongenita}
                  onChange={(e) => setFormData({...formData, tieneAnomaliaCongenita: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>Tiene Anomalía Congénita</span>
              </label>
            </div>
            
            {/* Profilaxis Hepatitis B */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="profilaxisHepatitisB"
                  checked={formData.profilaxisHepatitisB}
                  onChange={(e) => setFormData({...formData, profilaxisHepatitisB: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>Profilaxis Hepatitis B</span>
              </label>
            </div>
            
            {/* Profilaxis Ocular */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="profilaxisOcular"
                  checked={formData.profilaxisOcular}
                  onChange={(e) => setFormData({...formData, profilaxisOcular: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>Profilaxis Ocular (Gonorrea)</span>
              </label>
            </div>
            
            {/* Reanimación Básica */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="reanimacionBasica"
                  checked={formData.reanimacionBasica}
                  onChange={(e) => setFormData({...formData, reanimacionBasica: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>Reanimación Básica (Apgar 0-3 al 1 min)</span>
              </label>
            </div>
            
            {/* Reanimación Avanzada */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="reanimacionAvanzada"
                  checked={formData.reanimacionAvanzada}
                  onChange={(e) => setFormData({...formData, reanimacionAvanzada: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>Reanimación Avanzada (Apgar 6-5 a los 5 min)</span>
              </label>
            </div>
            
            {/* EHI Grado II y III */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="ehi23"
                  checked={formData.ehi23}
                  onChange={(e) => setFormData({...formData, ehi23: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>EHI Grado II y III</span>
              </label>
            </div>
            
            {/* Madre con Hepatitis B */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="madreHepatitisB"
                  checked={formData.madreHepatitisB}
                  onChange={(e) => setFormData({...formData, madreHepatitisB: e.target.checked})}
                  className={styles.checkbox}
                />
                <span>Madre con Hepatitis B Positiva</span>
              </label>
            </div>
            
            {/* Profilaxis Completa Hep B (si madre positiva) */}
            {formData.madreHepatitisB && (
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="profilaxisCompletaHepB"
                    checked={formData.profilaxisCompletaHepB}
                    onChange={(e) => setFormData({...formData, profilaxisCompletaHepB: e.target.checked})}
                    className={styles.checkbox}
                  />
                  <span>Profilaxis Completa según Normativa</span>
                </label>
              </div>
            )}
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

