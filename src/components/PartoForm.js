'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PartoForm.module.css'

// Función para formatear fecha para input datetime-local (YYYY-MM-DDTHH:mm)
function formatearFechaParaInput(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha)
  if (isNaN(date.getTime())) return ''
  // Convertir a zona horaria local y formatear
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function PartoForm({ initialData = null, isEdit = false, partoId = null, preselectedMadreId = null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [madres, setMadres] = useState([])
  const [preselectedMadre, setPreselectedMadre] = useState(null)
  const [matronas, setMatronas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [enfermeras, setEnfermeras] = useState([])
  const [loadingMadres, setLoadingMadres] = useState(false)
  const [loadingMatronas, setLoadingMatronas] = useState(true)
  const [loadingMedicos, setLoadingMedicos] = useState(true)
  const [loadingEnfermeras, setLoadingEnfermeras] = useState(true)

  const [formData, setFormData] = useState({
    madreId: preselectedMadreId || '',
    fechaHora: '',
    tipo: '',
    lugar: '',
    lugarDetalle: '',
    matronasIds: [],
    medicosIds: [],
    enfermerasIds: [],
    complicaciones: '',
    observaciones: '',
  })

  // Cargar madre preseleccionada si existe
  useEffect(() => {
    if (preselectedMadreId) {
      const loadPreselectedMadre = async () => {
        try {
          const response = await fetch(`/api/madres/${preselectedMadreId}`)
          if (response.ok) {
            const data = await response.json()
            setPreselectedMadre(data.data)
            setFormData((prev) => ({ ...prev, madreId: preselectedMadreId }))
          }
        } catch (err) {
          console.error('Error loading preselected madre:', err)
        }
      }
      loadPreselectedMadre()
    }
  }, [preselectedMadreId])

  // Cargar madres y usuarios al montar (solo si no hay madre preseleccionada)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Solo cargar madres si no hay una preseleccionada
        if (!preselectedMadreId) {
          setLoadingMadres(true)
          const madresResponse = await fetch('/api/madres?limit=1000')
          if (madresResponse.ok) {
            const madresData = await madresResponse.json()
            setMadres(madresData.data || [])
          }
          setLoadingMadres(false)
        }

        // Cargar matronas
        setLoadingMatronas(true)
        const matronasResponse = await fetch('/api/users?role=matrona')
        if (matronasResponse.ok) {
          const matronasData = await matronasResponse.json()
          setMatronas(matronasData.data || [])
        }
        setLoadingMatronas(false)

        // Cargar médicos
        setLoadingMedicos(true)
        const medicosResponse = await fetch('/api/users?role=medico')
        if (medicosResponse.ok) {
          const medicosData = await medicosResponse.json()
          setMedicos(medicosData.data || [])
        }
        setLoadingMedicos(false)

        // Cargar enfermeras
        setLoadingEnfermeras(true)
        const enfermerasResponse = await fetch('/api/users?role=enfermera')
        if (enfermerasResponse.ok) {
          const enfermerasData = await enfermerasResponse.json()
          setEnfermeras(enfermerasData.data || [])
        }
        setLoadingEnfermeras(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setLoadingMadres(false)
        setLoadingMatronas(false)
        setLoadingMedicos(false)
        setLoadingEnfermeras(false)
      }
    }

    loadData()
  }, [preselectedMadreId])

  // Cargar datos iniciales si es modo edición
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        madreId: initialData.madreId || '',
        fechaHora: formatearFechaParaInput(initialData.fechaHora),
        tipo: initialData.tipo || '',
        lugar: initialData.lugar || '',
        lugarDetalle: initialData.lugarDetalle || '',
        matronasIds: initialData.matronas?.map((m) => m.user.id) || [],
        medicosIds: initialData.medicos?.map((m) => m.user.id) || [],
        enfermerasIds: initialData.enfermeras?.map((e) => e.user.id) || [],
        complicaciones: initialData.complicaciones || '',
        observaciones: initialData.observaciones || '',
      })
    }
  }, [isEdit, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Limpiar lugarDetalle si lugar cambia y no es OTRO
    if (name === 'lugar' && value !== 'OTRO') {
      setFormData((prev) => ({ ...prev, lugarDetalle: '' }))
    }
    
    // Limpiar errores al cambiar campos
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleAddProfessional = (type, userId) => {
    if (!userId) return
    
    const fieldName = `${type}Ids`
    const currentIds = formData[fieldName] || []
    
    if (!currentIds.includes(userId)) {
      setFormData({
        ...formData,
        [fieldName]: [...currentIds, userId],
      })
    }
  }

  const handleRemoveProfessional = (type, userId) => {
    const fieldName = `${type}Ids`
    const currentIds = formData[fieldName] || []
    setFormData({
      ...formData,
      [fieldName]: currentIds.filter((id) => id !== userId),
    })
  }

  const getProfessionalName = (type, userId) => {
    let professionals = []
    if (type === 'matronas') professionals = matronas
    else if (type === 'medicos') professionals = medicos
    else if (type === 'enfermeras') professionals = enfermeras
    
    const professional = professionals.find((p) => p.id === userId)
    if (professional) {
      return professional.nombre || professional.email || 'Profesional'
    }
    
    // Si no se encuentra en la lista, intentar obtenerlo de initialData (modo edición)
    if (isEdit && initialData) {
      let dataArray = []
      if (type === 'matronas') dataArray = initialData.matronas || []
      else if (type === 'medicos') dataArray = initialData.medicos || []
      else if (type === 'enfermeras') dataArray = initialData.enfermeras || []
      
      const found = dataArray.find((item) => item.user?.id === userId)
      if (found?.user) {
        return found.user.nombre || found.user.email || 'Profesional'
      }
    }
    
    return 'Profesional'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validaciones básicas
    if (!formData.madreId || !formData.fechaHora || !formData.tipo || !formData.lugar) {
      setError('Madre, fecha/hora, tipo y lugar son requeridos')
      setLoading(false)
      return
    }

    // Validar lugarDetalle si lugar es OTRO
    if (formData.lugar === 'OTRO' && !formData.lugarDetalle.trim()) {
      setError('El detalle del lugar es requerido cuando el lugar es OTRO')
      setLoading(false)
      return
    }

    try {
      const url = isEdit ? `/api/partos/${partoId}` : '/api/partos'
      const method = isEdit ? 'PUT' : 'POST'

      // Preparar datos para enviar
      const submitData = {
        madreId: formData.madreId,
        fechaHora: formData.fechaHora,
        tipo: formData.tipo,
        lugar: formData.lugar,
        lugarDetalle: formData.lugar === 'OTRO' ? formData.lugarDetalle : '',
        matronasIds: formData.matronasIds || [],
        medicosIds: formData.medicosIds || [],
        enfermerasIds: formData.enfermerasIds || [],
        complicaciones: formData.complicaciones || null,
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
        setError(data.error || `Error al ${isEdit ? 'actualizar' : 'registrar'} el parto`)
        setLoading(false)
        return
      }

      setSuccess(`Parto ${isEdit ? 'actualizado' : 'registrado'} exitosamente`)
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/partos')
      }, 2000)
    } catch (err) {
      console.error(`Error al ${isEdit ? 'actualizar' : 'registrar'} parto:`, err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
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

      {(loadingMadres || loadingMatronas || loadingMedicos || loadingEnfermeras) ? (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Cargando datos...</span>
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
            {/* Madre */}
            <div className={styles.formGroup}>
              <label htmlFor="madreId">
                Madre <span className={styles.required}>*</span>
              </label>
              {preselectedMadreId && preselectedMadre ? (
                <div className={styles.preselectedMadre}>
                  <div className={styles.madreDisplay}>
                    <strong>{preselectedMadre.nombres} {preselectedMadre.apellidos}</strong>
                    <span className={styles.madreRut}>{preselectedMadre.rut}</span>
                  </div>
                </div>
              ) : (
                <select
                  id="madreId"
                  name="madreId"
                  value={formData.madreId}
                  onChange={handleChange}
                  required
                  className={styles.select}
                  disabled={loadingMadres}
                >
                  <option value="">Seleccione una madre</option>
                  {madres.map((madre) => (
                    <option key={madre.id} value={madre.id}>
                      {madre.nombres} {madre.apellidos} ({madre.rut})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Fecha y Hora */}
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
              />
            </div>

            {/* Tipo */}
            <div className={styles.formGroup}>
              <label htmlFor="tipo">
                Tipo de Parto <span className={styles.required}>*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Seleccione un tipo</option>
                <option value="EUTOCICO">Eutócico</option>
                <option value="DISTOCICO">Distócico</option>
                <option value="CESAREA_ELECTIVA">Cesárea Electiva</option>
                <option value="CESAREA_EMERGENCIA">Cesárea Emergencia</option>
              </select>
            </div>

            {/* Lugar */}
            <div className={styles.formGroup}>
              <label htmlFor="lugar">
                Lugar <span className={styles.required}>*</span>
              </label>
              <select
                id="lugar"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Seleccione un lugar</option>
                <option value="SALA_PARTO">Sala de Parto</option>
                <option value="PABELLON">Pabellón</option>
                <option value="DOMICILIO">Domicilio</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {/* Lugar Detalle (solo si lugar es OTRO) */}
            {formData.lugar === 'OTRO' && (
              <div className={styles.formGroup}>
                <label htmlFor="lugarDetalle">
                  Detalle del Lugar <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="lugarDetalle"
                  name="lugarDetalle"
                  value={formData.lugarDetalle}
                  onChange={handleChange}
                  required={formData.lugar === 'OTRO'}
                  maxLength={120}
                  placeholder="Especifique el lugar"
                />
              </div>
            )}
            </div>
          </div>

          {/* Sección 2: Personal Asistente */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-user-md"></i>
              Personal Asistente
            </h2>
            
            {/* Matronas */}
            <div className={styles.professionalGroup}>
              <label className={styles.professionalLabel}>
                <i className="fas fa-user-nurse"></i>
                Matronas
              </label>
              <div className={styles.professionalContainer}>
                <select
                  onChange={(e) => {
                    handleAddProfessional('matronas', e.target.value)
                    e.target.value = ''
                  }}
                  className={styles.professionalSelect}
                  disabled={loadingMatronas}
                >
                  <option value="">Seleccionar matrona para agregar</option>
                  {matronas
                    .filter((matrona) => !formData.matronasIds.includes(matrona.id))
                    .map((matrona) => (
                      <option key={matrona.id} value={matrona.id}>
                        {matrona.nombre} ({matrona.email})
                      </option>
                    ))}
                </select>
                {formData.matronasIds.length > 0 && (
                  <div className={styles.selectedPills}>
                    {formData.matronasIds.map((matronaId) => (
                      <div key={matronaId} className={styles.pill}>
                        <span className={styles.pillName}>{getProfessionalName('matronas', matronaId)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProfessional('matronas', matronaId)}
                          className={styles.pillRemove}
                          title="Eliminar"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.matronasIds.length === 0 && (
                  <p className={styles.emptyProfessional}>No hay matronas seleccionadas</p>
                )}
              </div>
            </div>

            {/* Médicos */}
            <div className={styles.professionalGroup}>
              <label className={styles.professionalLabel}>
                <i className="fas fa-stethoscope"></i>
                Médicos
              </label>
              <div className={styles.professionalContainer}>
                <select
                  onChange={(e) => {
                    handleAddProfessional('medicos', e.target.value)
                    e.target.value = ''
                  }}
                  className={styles.professionalSelect}
                  disabled={loadingMedicos}
                >
                  <option value="">Seleccionar médico para agregar</option>
                  {medicos
                    .filter((medico) => !formData.medicosIds.includes(medico.id))
                    .map((medico) => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nombre} ({medico.email})
                      </option>
                    ))}
                </select>
                {formData.medicosIds.length > 0 && (
                  <div className={styles.selectedPills}>
                    {formData.medicosIds.map((medicoId) => (
                      <div key={medicoId} className={styles.pill}>
                        <span className={styles.pillName}>{getProfessionalName('medicos', medicoId)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProfessional('medicos', medicoId)}
                          className={styles.pillRemove}
                          title="Eliminar"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.medicosIds.length === 0 && (
                  <p className={styles.emptyProfessional}>No hay médicos seleccionados</p>
                )}
              </div>
            </div>

            {/* Enfermeras */}
            <div className={styles.professionalGroup}>
              <label className={styles.professionalLabel}>
                <i className="fas fa-user-nurse"></i>
                Enfermeras
              </label>
              <div className={styles.professionalContainer}>
                <select
                  onChange={(e) => {
                    handleAddProfessional('enfermeras', e.target.value)
                    e.target.value = ''
                  }}
                  className={styles.professionalSelect}
                  disabled={loadingEnfermeras}
                >
                  <option value="">Seleccionar enfermera para agregar</option>
                  {enfermeras
                    .filter((enfermera) => !formData.enfermerasIds.includes(enfermera.id))
                    .map((enfermera) => (
                      <option key={enfermera.id} value={enfermera.id}>
                        {enfermera.nombre} ({enfermera.email})
                      </option>
                    ))}
                </select>
                {formData.enfermerasIds.length > 0 && (
                  <div className={styles.selectedPills}>
                    {formData.enfermerasIds.map((enfermeraId) => (
                      <div key={enfermeraId} className={styles.pill}>
                        <span className={styles.pillName}>{getProfessionalName('enfermeras', enfermeraId)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProfessional('enfermeras', enfermeraId)}
                          className={styles.pillRemove}
                          title="Eliminar"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.enfermerasIds.length === 0 && (
                  <p className={styles.emptyProfessional}>No hay enfermeras seleccionadas</p>
                )}
              </div>
            </div>
          </div>

          {/* Sección 3: Observaciones Clínicas */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-notes-medical"></i>
              Observaciones Clínicas
            </h2>
            <div className={styles.formGrid}>
              {/* Complicaciones */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="complicaciones">Complicaciones</label>
                <textarea
                  id="complicaciones"
                  name="complicaciones"
                  value={formData.complicaciones}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className={styles.textarea}
                  placeholder="Describa las complicaciones si las hubo"
                />
                <small className={styles.helpText}>
                  {formData.complicaciones.length}/500 caracteres
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
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/partos')}
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
                  <i className="fas fa-save"></i> {isEdit ? 'Actualizar Parto' : 'Registrar Parto'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </>
  )
}

