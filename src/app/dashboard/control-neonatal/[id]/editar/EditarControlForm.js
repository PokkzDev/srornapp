'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import DateTimePicker from '@/components/DateTimePicker'

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
    fechaHora: null,
    tipo: 'SIGNOS_VITALES',
    datos: '',
    observaciones: '',
  })

  // Estado para campos individuales según el tipo de control
  const [datosFields, setDatosFields] = useState({
    // SIGNOS_VITALES
    temp: '',
    fc: '',
    fr: '',
    spo2: '',
    // GLUCEMIA
    glucemia: '',
    // ALIMENTACION
    tipoAlimentacion: '',
    cantidad: '',
    unidad: 'ml',
    // MEDICACION
    medicamento: '',
    dosis: '',
    via: '',
    // OTRO (JSON como texto)
    datosOtro: '',
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
        
        // Convertir fechaHora a Date object para DateTimePicker
        const fechaHora = controlData.fechaHora ? new Date(controlData.fechaHora) : new Date()

        setFormData({
          rnId: controlData.rnId || '',
          episodioUrniId: controlData.episodioUrniId || '',
          fechaHora: fechaHora,
          tipo: controlData.tipo || 'SIGNOS_VITALES',
          datos: controlData.datos ? JSON.stringify(controlData.datos, null, 2) : '',
          observaciones: controlData.observaciones || '',
        })

        // Parsear datos existentes a campos individuales
        if (controlData.datos) {
          const parsedFields = parseDatosToFields(controlData.tipo || 'SIGNOS_VITALES', controlData.datos)
          setDatosFields(parsedFields)
        }

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

  // Función auxiliar para construir objeto JSON desde campos individuales
  const buildDatosFromFields = (tipo, fields) => {
    const datos = {}
    
    switch (tipo) {
      case 'SIGNOS_VITALES':
        if (fields.temp !== '') datos.temp = Number.parseFloat(fields.temp)
        if (fields.fc !== '') datos.fc = Number.parseFloat(fields.fc)
        if (fields.fr !== '') datos.fr = Number.parseFloat(fields.fr)
        if (fields.spo2 !== '') datos.spo2 = Number.parseFloat(fields.spo2)
        break
      case 'GLUCEMIA':
        if (fields.glucemia !== '') datos.glucemia = Number.parseFloat(fields.glucemia)
        break
      case 'ALIMENTACION':
        if (fields.tipoAlimentacion !== '') datos.tipo = fields.tipoAlimentacion
        if (fields.cantidad !== '') datos.cantidad = Number.parseFloat(fields.cantidad)
        if (fields.unidad !== '') datos.unidad = fields.unidad
        break
      case 'MEDICACION':
        if (fields.medicamento !== '') datos.medicamento = fields.medicamento
        if (fields.dosis !== '') datos.dosis = fields.dosis
        if (fields.via !== '') datos.via = fields.via
        break
      case 'OTRO':
        if (fields.datosOtro && fields.datosOtro.trim()) {
          try {
            return JSON.parse(fields.datosOtro)
          } catch (e) {
            return null
          }
        }
        return null
      default:
        return null
    }
    
    // Retornar null si el objeto está vacío
    return Object.keys(datos).length > 0 ? datos : null
  }

  // Función auxiliar para parsear JSON y poblar campos individuales
  const parseDatosToFields = (tipo, datos) => {
    if (!datos) {
      return {
        temp: '', fc: '', fr: '', spo2: '',
        glucemia: '',
        tipoAlimentacion: '', cantidad: '', unidad: 'ml',
        medicamento: '', dosis: '', via: '',
        datosOtro: '',
      }
    }

    const datosObj = typeof datos === 'string' ? JSON.parse(datos) : datos
    const fields = {
      temp: '', fc: '', fr: '', spo2: '',
      glucemia: '',
      tipoAlimentacion: '', cantidad: '', unidad: 'ml',
      medicamento: '', dosis: '', via: '',
      datosOtro: '',
    }

    switch (tipo) {
      case 'SIGNOS_VITALES':
        if (datosObj.temp !== undefined && datosObj.temp !== null) fields.temp = datosObj.temp.toString()
        if (datosObj.fc !== undefined && datosObj.fc !== null) fields.fc = datosObj.fc.toString()
        if (datosObj.fr !== undefined && datosObj.fr !== null) fields.fr = datosObj.fr.toString()
        if (datosObj.spo2 !== undefined && datosObj.spo2 !== null) fields.spo2 = datosObj.spo2.toString()
        break
      case 'GLUCEMIA':
        if (datosObj.glucemia !== undefined && datosObj.glucemia !== null) fields.glucemia = datosObj.glucemia.toString()
        break
      case 'ALIMENTACION':
        if (datosObj.tipo !== undefined && datosObj.tipo !== null) fields.tipoAlimentacion = datosObj.tipo.toString()
        if (datosObj.cantidad !== undefined && datosObj.cantidad !== null) fields.cantidad = datosObj.cantidad.toString()
        if (datosObj.unidad !== undefined && datosObj.unidad !== null) fields.unidad = datosObj.unidad.toString()
        break
      case 'MEDICACION':
        if (datosObj.medicamento !== undefined && datosObj.medicamento !== null) fields.medicamento = datosObj.medicamento.toString()
        if (datosObj.dosis !== undefined && datosObj.dosis !== null) fields.dosis = datosObj.dosis.toString()
        if (datosObj.via !== undefined && datosObj.via !== null) fields.via = datosObj.via.toString()
        break
      case 'OTRO':
        fields.datosOtro = JSON.stringify(datosObj, null, 2)
        break
    }

    return fields
  }

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

  // Limpiar campos cuando cambia el tipo de control (solo si ya se cargaron los datos iniciales)
  useEffect(() => {
    // Solo limpiar si ya se cargaron los datos del control
    if (control) {
      if (control.datos && formData.tipo === control.tipo) {
        // Si el tipo no cambió, mantener los datos parseados
        return
      } else {
        // Si cambió el tipo, limpiar campos
        setDatosFields({
          temp: '', fc: '', fr: '', spo2: '',
          glucemia: '',
          tipoAlimentacion: '', cantidad: '', unidad: 'ml',
          medicamento: '', dosis: '', via: '',
          datosOtro: '',
        })
      }
    }
  }, [formData.tipo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleDatosFieldChange = (fieldName, value) => {
    setDatosFields({ ...datosFields, [fieldName]: value })
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Construir datos JSON desde campos individuales
    let datosParsed = buildDatosFromFields(formData.tipo, datosFields)
    
    // Validar JSON para tipo OTRO
    if (formData.tipo === 'OTRO' && datosFields.datosOtro && datosFields.datosOtro.trim()) {
      try {
        datosParsed = JSON.parse(datosFields.datosOtro)
      } catch (err) {
        setError('El campo datos debe ser un JSON válido')
        setLoading(false)
        return
      }
    }

    try {
      const submitData = {
        episodioUrniId: formData.episodioUrniId || null,
        fechaHora: formData.fechaHora ? formData.fechaHora.toISOString() : new Date().toISOString(),
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
          <DateTimePicker
            id="fechaHora"
            name="fechaHora"
            selected={formData.fechaHora}
            onChange={(date) => setFormData((prev) => ({ ...prev, fechaHora: date }))}
            maxDate={new Date()}
            required
            placeholderText="Seleccione fecha y hora"
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
          <label>
            Datos del Control
          </label>
          
          {formData.tipo === 'SIGNOS_VITALES' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="temp" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  id="temp"
                  step="0.1"
                  value={datosFields.temp}
                  onChange={(e) => handleDatosFieldChange('temp', e.target.value)}
                  placeholder="36.7"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="fc" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Frecuencia Cardíaca (lpm)
                </label>
                <input
                  type="number"
                  id="fc"
                  value={datosFields.fc}
                  onChange={(e) => handleDatosFieldChange('fc', e.target.value)}
                  placeholder="140"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="fr" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Frecuencia Respiratoria (rpm)
                </label>
                <input
                  type="number"
                  id="fr"
                  value={datosFields.fr}
                  onChange={(e) => handleDatosFieldChange('fr', e.target.value)}
                  placeholder="40"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="spo2" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Saturación O2 (%)
                </label>
                <input
                  type="number"
                  id="spo2"
                  value={datosFields.spo2}
                  onChange={(e) => handleDatosFieldChange('spo2', e.target.value)}
                  placeholder="98"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {formData.tipo === 'GLUCEMIA' && (
            <div>
              <label htmlFor="glucemia" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Glucemia (mg/dL)
              </label>
              <input
                type="number"
                id="glucemia"
                step="0.1"
                value={datosFields.glucemia}
                onChange={(e) => handleDatosFieldChange('glucemia', e.target.value)}
                placeholder="90"
                className={styles.input}
                style={{ maxWidth: '300px' }}
              />
            </div>
          )}

          {formData.tipo === 'ALIMENTACION' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="tipoAlimentacion" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Tipo de Alimentación
                </label>
                <input
                  type="text"
                  id="tipoAlimentacion"
                  value={datosFields.tipoAlimentacion}
                  onChange={(e) => handleDatosFieldChange('tipoAlimentacion', e.target.value)}
                  placeholder="Ej: Leche materna"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="cantidad" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Cantidad
                </label>
                <input
                  type="number"
                  id="cantidad"
                  step="0.1"
                  value={datosFields.cantidad}
                  onChange={(e) => handleDatosFieldChange('cantidad', e.target.value)}
                  placeholder="50"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="unidad" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Unidad
                </label>
                <input
                  type="text"
                  id="unidad"
                  value={datosFields.unidad}
                  onChange={(e) => handleDatosFieldChange('unidad', e.target.value)}
                  placeholder="ml"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {formData.tipo === 'MEDICACION' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="medicamento" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Medicamento
                </label>
                <input
                  type="text"
                  id="medicamento"
                  value={datosFields.medicamento}
                  onChange={(e) => handleDatosFieldChange('medicamento', e.target.value)}
                  placeholder="Nombre del medicamento"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="dosis" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Dosis
                </label>
                <input
                  type="text"
                  id="dosis"
                  value={datosFields.dosis}
                  onChange={(e) => handleDatosFieldChange('dosis', e.target.value)}
                  placeholder="Ej: 5 mg"
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="via" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Vía de Administración
                </label>
                <input
                  type="text"
                  id="via"
                  value={datosFields.via}
                  onChange={(e) => handleDatosFieldChange('via', e.target.value)}
                  placeholder="Ej: Oral, IV"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {formData.tipo === 'OTRO' && (
            <div>
              <label htmlFor="datosOtro" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Datos (JSON) <span className={styles.help}>Ej: {"{"}"campo1": "valor1", "campo2": "valor2{"}"}</span>
              </label>
              <textarea
                id="datosOtro"
                value={datosFields.datosOtro}
                onChange={(e) => handleDatosFieldChange('datosOtro', e.target.value)}
                placeholder='{"campo1": "valor1", "campo2": "valor2"}'
                rows={4}
                className={styles.textarea}
              />
            </div>
          )}
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


