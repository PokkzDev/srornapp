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
    pesoNacimientoGramos: '',
    tallaCm: '',
    apgar1Min: '',
    apgar5Min: '',
    // REM
    esNacidoVivo: true,
    categoriaPeso: '',
    // Anomalías congénitas
    anomaliaCongenita: false,
    anomaliaCongenitaDescripcion: '',
    // Reanimación y EHI
    reanimacionBasica: false,
    reanimacionAvanzada: false,
    ehiGradoII_III: false,
    // Profilaxis inmediata
    profilaxisOcularGonorrea: false,
    profilaxisHepatitisB: false,
    profilaxisCompletaHepatitisB: false,
    // Transmisión vertical Hep B
    hijoMadreHepatitisBPositiva: false,
    // Lactancia / contacto / alojamiento
    lactancia60Min: false,
    alojamientoConjuntoInmediato: false,
    contactoPielPielInmediato: false,
    // Condición étnica/migrante
    esPuebloOriginario: false,
    esMigrante: false,
    // Observaciones
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
        pesoNacimientoGramos: initialData.pesoNacimientoGramos != null ? initialData.pesoNacimientoGramos.toString() : '',
        tallaCm: initialData.tallaCm != null ? initialData.tallaCm.toString() : '',
        apgar1Min: initialData.apgar1Min != null ? initialData.apgar1Min.toString() : '',
        apgar5Min: initialData.apgar5Min != null ? initialData.apgar5Min.toString() : '',
        esNacidoVivo: initialData.esNacidoVivo !== undefined ? initialData.esNacidoVivo : true,
        categoriaPeso: initialData.categoriaPeso || '',
        anomaliaCongenita: initialData.anomaliaCongenita === true,
        anomaliaCongenitaDescripcion: initialData.anomaliaCongenitaDescripcion || '',
        reanimacionBasica: initialData.reanimacionBasica === true,
        reanimacionAvanzada: initialData.reanimacionAvanzada === true,
        ehiGradoII_III: initialData.ehiGradoII_III === true,
        profilaxisOcularGonorrea: initialData.profilaxisOcularGonorrea === true,
        profilaxisHepatitisB: initialData.profilaxisHepatitisB === true,
        profilaxisCompletaHepatitisB: initialData.profilaxisCompletaHepatitisB === true,
        hijoMadreHepatitisBPositiva: initialData.hijoMadreHepatitisBPositiva === true,
        lactancia60Min: initialData.lactancia60Min === true,
        alojamientoConjuntoInmediato: initialData.alojamientoConjuntoInmediato === true,
        contactoPielPielInmediato: initialData.contactoPielPielInmediato === true,
        esPuebloOriginario: initialData.esPuebloOriginario === true,
        esMigrante: initialData.esMigrante === true,
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
    const { name, value, type, checked } = e.target
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    })
    
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

    // Validar peso si está presente
    if (formData.pesoNacimientoGramos && formData.pesoNacimientoGramos !== '') {
      const peso = parseInt(formData.pesoNacimientoGramos)
      if (isNaN(peso) || peso <= 0) {
        setError('El peso debe ser un número mayor a 0')
        setLoading(false)
        return
      }
    }

    // Validar talla si está presente
    if (formData.tallaCm && formData.tallaCm !== '') {
      const talla = parseInt(formData.tallaCm)
      if (isNaN(talla) || talla <= 0) {
        setError('La talla debe ser un número mayor a 0')
        setLoading(false)
        return
      }
    }

    // Validar Apgar si están presentes
    if (formData.apgar1Min && formData.apgar1Min !== '') {
      const apgar1 = parseInt(formData.apgar1Min)
      if (isNaN(apgar1) || apgar1 < 0 || apgar1 > 10) {
        setError('El Apgar 1\' debe ser un número entre 0 y 10')
        setLoading(false)
        return
      }
    }

    if (formData.apgar5Min && formData.apgar5Min !== '') {
      const apgar5 = parseInt(formData.apgar5Min)
      if (isNaN(apgar5) || apgar5 < 0 || apgar5 > 10) {
        setError('El Apgar 5\' debe ser un número entre 0 y 10')
        setLoading(false)
        return
      }
    }

    // Validar que si hay anomalía congénita, debe haber descripción
    if (formData.anomaliaCongenita && !formData.anomaliaCongenitaDescripcion?.trim()) {
      setError('Si presenta anomalía congénita, debe proporcionar una descripción')
      setLoading(false)
      return
    }

    try {
      const url = isEdit ? `/api/recien-nacidos/${recienNacidoId}` : '/api/recien-nacidos'
      const method = isEdit ? 'PUT' : 'POST'

      // Función helper para convertir strings vacíos a null y números
      const toIntOrNull = (value) => {
        if (!value || value === '') return null
        const num = parseInt(value)
        return isNaN(num) ? null : num
      }

      // Preparar datos para enviar (usar nombres exactos del schema)
      const submitData = {
        partoId: formData.partoId,
        sexo: formData.sexo,
        pesoNacimientoGramos: toIntOrNull(formData.pesoNacimientoGramos),
        tallaCm: toIntOrNull(formData.tallaCm),
        apgar1Min: toIntOrNull(formData.apgar1Min),
        apgar5Min: toIntOrNull(formData.apgar5Min),
        esNacidoVivo: formData.esNacidoVivo !== undefined ? formData.esNacidoVivo : true,
        categoriaPeso: formData.categoriaPeso && formData.categoriaPeso !== '' ? formData.categoriaPeso : null,
        anomaliaCongenita: formData.anomaliaCongenita || null,
        anomaliaCongenitaDescripcion: formData.anomaliaCongenita && formData.anomaliaCongenitaDescripcion?.trim() 
          ? formData.anomaliaCongenitaDescripcion.trim().substring(0, 500) 
          : null,
        reanimacionBasica: formData.reanimacionBasica || null,
        reanimacionAvanzada: formData.reanimacionAvanzada || null,
        ehiGradoII_III: formData.ehiGradoII_III || null,
        profilaxisOcularGonorrea: formData.profilaxisOcularGonorrea || null,
        profilaxisHepatitisB: formData.profilaxisHepatitisB || null,
        profilaxisCompletaHepatitisB: formData.profilaxisCompletaHepatitisB || null,
        hijoMadreHepatitisBPositiva: formData.hijoMadreHepatitisBPositiva || null,
        lactancia60Min: formData.lactancia60Min || null,
        alojamientoConjuntoInmediato: formData.alojamientoConjuntoInmediato || null,
        contactoPielPielInmediato: formData.contactoPielPielInmediato || null,
        esPuebloOriginario: formData.esPuebloOriginario || null,
        esMigrante: formData.esMigrante || null,
        observaciones: formData.observaciones?.trim() ? formData.observaciones.trim().substring(0, 500) : null,
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
          {/* Sección 1: Información Básica */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Información Básica
            </h2>
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
                <label htmlFor="pesoNacimientoGramos">Peso al Nacimiento (gramos)</label>
                <input
                  type="number"
                  id="pesoNacimientoGramos"
                  name="pesoNacimientoGramos"
                  value={formData.pesoNacimientoGramos}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  placeholder="Ej: 3250"
                />
                <small className={styles.helpText}>
                  Peso en gramos al momento del nacimiento
                </small>
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
                  min="1"
                  step="1"
                  placeholder="Ej: 50"
                />
                <small className={styles.helpText}>
                  Talla en centímetros al momento del nacimiento
                </small>
              </div>

              {/* Apgar 1' */}
              <div className={styles.formGroup}>
                <label htmlFor="apgar1Min">Apgar 1'</label>
                <input
                  type="number"
                  id="apgar1Min"
                  name="apgar1Min"
                  value={formData.apgar1Min}
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
                <label htmlFor="apgar5Min">Apgar 5'</label>
                <input
                  type="number"
                  id="apgar5Min"
                  name="apgar5Min"
                  value={formData.apgar5Min}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  placeholder="0-10"
                />
                <small className={styles.helpText}>
                  Escala de 0 a 10
                </small>
              </div>
            </div>
          </div>

          {/* Sección 2: REM - Estado y Categoría */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-clipboard-list"></i>
              REM - Estado y Categoría
            </h2>
            <div className={styles.formGrid}>
              {/* Es Nacido Vivo */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="esNacidoVivo"
                    name="esNacidoVivo"
                    checked={formData.esNacidoVivo}
                    onChange={handleChange}
                  />
                  <label htmlFor="esNacidoVivo">Es Nacido Vivo</label>
                </div>
              </div>

              {/* Categoría de Peso */}
              <div className={styles.formGroup}>
                <label htmlFor="categoriaPeso">Categoría de Peso (REM)</label>
                <select
                  id="categoriaPeso"
                  name="categoriaPeso"
                  value={formData.categoriaPeso}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="MENOR_500">Menor a 500g</option>
                  <option value="RANGO_500_999">500 - 999g</option>
                  <option value="RANGO_1000_1499">1000 - 1499g</option>
                  <option value="RANGO_1500_1999">1500 - 1999g</option>
                  <option value="RANGO_2000_2499">2000 - 2499g</option>
                  <option value="RANGO_2500_2999">2500 - 2999g</option>
                  <option value="RANGO_3000_3999">3000 - 3999g</option>
                  <option value="RANGO_4000_MAS">4000g o más</option>
                </select>
                <small className={styles.helpText}>
                  Clasificación según peso al nacer para reportes REM
                </small>
              </div>
            </div>
          </div>

          {/* Sección 3: Anomalías Congénitas */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-exclamation-triangle"></i>
              Anomalías Congénitas
            </h2>
            <div className={styles.formGrid}>
              {/* Anomalía Congénita */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="anomaliaCongenita"
                    name="anomaliaCongenita"
                    checked={formData.anomaliaCongenita}
                    onChange={handleChange}
                  />
                  <label htmlFor="anomaliaCongenita">Presenta Anomalía Congénita</label>
                </div>
              </div>

              {/* Descripción de Anomalía */}
              {formData.anomaliaCongenita && (
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="anomaliaCongenitaDescripcion">Descripción de la Anomalía</label>
                  <textarea
                    id="anomaliaCongenitaDescripcion"
                    name="anomaliaCongenitaDescripcion"
                    value={formData.anomaliaCongenitaDescripcion}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className={styles.textarea}
                    placeholder="Describa la anomalía congénita..."
                  />
                  <small className={styles.helpText}>
                    {formData.anomaliaCongenitaDescripcion.length}/500 caracteres
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Sección 4: Reanimación y EHI */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-heartbeat"></i>
              Reanimación y EHI
            </h2>
            <div className={styles.formGrid}>
              {/* Reanimación Básica */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="reanimacionBasica"
                    name="reanimacionBasica"
                    checked={formData.reanimacionBasica}
                    onChange={handleChange}
                  />
                  <label htmlFor="reanimacionBasica">Reanimación Básica</label>
                </div>
              </div>

              {/* Reanimación Avanzada */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="reanimacionAvanzada"
                    name="reanimacionAvanzada"
                    checked={formData.reanimacionAvanzada}
                    onChange={handleChange}
                  />
                  <label htmlFor="reanimacionAvanzada">Reanimación Avanzada</label>
                </div>
              </div>

              {/* EHI Grado II-III */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="ehiGradoII_III"
                    name="ehiGradoII_III"
                    checked={formData.ehiGradoII_III}
                    onChange={handleChange}
                  />
                  <label htmlFor="ehiGradoII_III">EHI Grado II-III</label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 5: Profilaxis Inmediata */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-shield-alt"></i>
              Profilaxis Inmediata
            </h2>
            <div className={styles.formGrid}>
              {/* Profilaxis Ocular Gonorrea */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="profilaxisOcularGonorrea"
                    name="profilaxisOcularGonorrea"
                    checked={formData.profilaxisOcularGonorrea}
                    onChange={handleChange}
                  />
                  <label htmlFor="profilaxisOcularGonorrea">Profilaxis Ocular Gonorrea</label>
                </div>
              </div>

              {/* Profilaxis Hepatitis B */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="profilaxisHepatitisB"
                    name="profilaxisHepatitisB"
                    checked={formData.profilaxisHepatitisB}
                    onChange={handleChange}
                  />
                  <label htmlFor="profilaxisHepatitisB">Profilaxis Hepatitis B</label>
                </div>
              </div>

              {/* Profilaxis Completa Hepatitis B */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="profilaxisCompletaHepatitisB"
                    name="profilaxisCompletaHepatitisB"
                    checked={formData.profilaxisCompletaHepatitisB}
                    onChange={handleChange}
                  />
                  <label htmlFor="profilaxisCompletaHepatitisB">Profilaxis Completa Hepatitis B</label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 6: Transmisión Vertical Hep B */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-virus"></i>
              Transmisión Vertical Hepatitis B
            </h2>
            <div className={styles.formGrid}>
              {/* Hijo de Madre Hepatitis B Positiva */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="hijoMadreHepatitisBPositiva"
                    name="hijoMadreHepatitisBPositiva"
                    checked={formData.hijoMadreHepatitisBPositiva}
                    onChange={handleChange}
                  />
                  <label htmlFor="hijoMadreHepatitisBPositiva">Hijo de Madre Hepatitis B Positiva</label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 7: Lactancia / Contacto / Alojamiento */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-baby"></i>
              Lactancia / Contacto / Alojamiento
            </h2>
            <div className={styles.formGrid}>
              {/* Lactancia 60 Min */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="lactancia60Min"
                    name="lactancia60Min"
                    checked={formData.lactancia60Min}
                    onChange={handleChange}
                  />
                  <label htmlFor="lactancia60Min">Lactancia en los primeros 60 minutos</label>
                </div>
              </div>

              {/* Alojamiento Conjunto Inmediato */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="alojamientoConjuntoInmediato"
                    name="alojamientoConjuntoInmediato"
                    checked={formData.alojamientoConjuntoInmediato}
                    onChange={handleChange}
                  />
                  <label htmlFor="alojamientoConjuntoInmediato">Alojamiento Conjunto Inmediato</label>
                </div>
              </div>

              {/* Contacto Piel a Piel Inmediato */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="contactoPielPielInmediato"
                    name="contactoPielPielInmediato"
                    checked={formData.contactoPielPielInmediato}
                    onChange={handleChange}
                  />
                  <label htmlFor="contactoPielPielInmediato">Contacto Piel a Piel Inmediato</label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 8: Condición Étnica/Migrante */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-globe"></i>
              Condición Étnica/Migrante
            </h2>
            <div className={styles.formGrid}>
              {/* Es Pueblo Originario */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="esPuebloOriginario"
                    name="esPuebloOriginario"
                    checked={formData.esPuebloOriginario}
                    onChange={handleChange}
                  />
                  <label htmlFor="esPuebloOriginario">Es Pueblo Originario</label>
                </div>
              </div>

              {/* Es Migrante */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="esMigrante"
                    name="esMigrante"
                    checked={formData.esMigrante}
                    onChange={handleChange}
                  />
                  <label htmlFor="esMigrante">Es Migrante</label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 9: Observaciones */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-notes-medical"></i>
              Observaciones
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="observaciones">Observaciones Generales</label>
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
