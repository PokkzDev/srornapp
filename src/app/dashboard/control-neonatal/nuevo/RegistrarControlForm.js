'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import DateTimePicker from '@/components/DateTimePicker'

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
    fechaHora: new Date(),
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

  // Limpiar campos cuando cambia el tipo de control
  useEffect(() => {
    setDatosFields({
      temp: '', fc: '', fr: '', spo2: '',
      glucemia: '',
      tipoAlimentacion: '', cantidad: '', unidad: 'ml',
      medicamento: '', dosis: '', via: '',
      datosOtro: '',
    })
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

    // Validaciones
    if (!formData.rnId) {
      setError('Debe seleccionar un recién nacido')
      setLoading(false)
      return
    }

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
        rnId: formData.rnId,
        episodioUrniId: formData.episodioUrniId || null,
        fechaHora: formData.fechaHora ? formData.fechaHora.toISOString() : new Date().toISOString(),
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
              aria-label="Buscar recién nacido"
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
                  fechaHora: getLocalDateTimeString(),
                  tipo: 'SIGNOS_VITALES',
                  datos: '',
                  observaciones: '',
                })
                setDatosFields({
                  temp: '', fc: '', fr: '', spo2: '',
                  glucemia: '',
                  tipoAlimentacion: '', cantidad: '', unidad: 'ml',
                  medicamento: '', dosis: '', via: '',
                  datosOtro: '',
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
            {/* <option value="OTRO">Otro</option> */}
          </select>
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


