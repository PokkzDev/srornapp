'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PartoForm.module.css'

// Función para formatear fecha para input datetime-local (YYYY-MM-DDTHH:mm:ss)
function formatearFechaParaInput(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return ''
  // Convertir a zona horaria local y formatear con segundos
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

// Función para formatear fecha para input date (YYYY-MM-DD)
function formatearFechaDate(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Función para obtener la fecha y hora actual en formato datetime-local con segundos
function obtenerFechaHoraActual() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

// Función para derivar el lugar del tipo de parto
function derivarLugarDeTipo(tipo) {
  if (!tipo) return null
  
  // Si el tipo ya incluye el lugar, extraerlo
  switch (tipo) {
    case 'DOMICILIO_PROFESIONAL':
    case 'DOMICILIO_SIN_PROFESIONAL':
      return 'DOMICILIO'
    case 'PREHOSPITALARIO':
    case 'FUERA_RED':
      return 'OTRO'
    case 'CESAREA_ELECTIVA':
    case 'CESAREA_URGENCIA':
      return 'PABELLON'
    case 'VAGINAL':
    case 'INSTRUMENTAL':
    default:
      return 'SALA_PARTO'
  }
}

// Función para obtener el tipo de parto puro (sin lugar)
function obtenerTipoPartoPuro(tipo) {
  if (!tipo) return null
  
  // Si el tipo incluye lugar, extraer solo el tipo médico
  switch (tipo) {
    case 'DOMICILIO_PROFESIONAL':
    case 'DOMICILIO_SIN_PROFESIONAL':
      return 'VAGINAL' // Asumimos que domicilio es vaginal
    case 'PREHOSPITALARIO':
    case 'FUERA_RED':
      return 'VAGINAL' // Asumimos que prehospitalario es vaginal
    case 'VAGINAL':
    case 'INSTRUMENTAL':
    case 'CESAREA_ELECTIVA':
    case 'CESAREA_URGENCIA':
      return tipo
    default:
      return tipo
  }
}

// Función para obtener el contexto/lugar especial del tipo
function obtenerContextoEspecial(tipo) {
  if (!tipo) return null
  
  switch (tipo) {
    case 'DOMICILIO_PROFESIONAL':
      return 'DOMICILIO_PROFESIONAL'
    case 'DOMICILIO_SIN_PROFESIONAL':
      return 'DOMICILIO_SIN_PROFESIONAL'
    case 'PREHOSPITALARIO':
      return 'PREHOSPITALARIO'
    case 'FUERA_RED':
      return 'FUERA_RED'
    default:
      return null
  }
}

// Función para determinar el curso del parto sugerido basado en el tipo
function obtenerCursoPartoSugerido(tipo) {
  if (!tipo) return ''
  
  switch (tipo) {
    case 'VAGINAL':
      return 'EUTOCICO' // Parto vaginal normal, sin complicaciones
    case 'INSTRUMENTAL':
      return 'DISTOCICO' // Fórceps/vacuum = distocia, requiere intervención
    case 'CESAREA_ELECTIVA':
      return 'EUTOCICO' // Cesárea planificada, sin complicaciones
    case 'CESAREA_URGENCIA':
      return 'DISTOCICO' // Cesárea por complicaciones
    default:
      return ''
  }
}

// Función para derivar el detalle del lugar del tipo de parto
function derivarLugarDetalleDeTipo(tipo) {
  if (!tipo) return null
  
  switch (tipo) {
    case 'PREHOSPITALARIO':
      return 'Prehospitalario'
    case 'FUERA_RED':
      return 'Fuera de red'
    default:
      return null
  }
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
  const [cursoModificadoManualmente, setCursoModificadoManualmente] = useState(false)

  const [formData, setFormData] = useState({
    madreId: preselectedMadreId || '',
    fechaHora: '',
    fechaParto: '',
    tipo: '',
    lugar: '',
    lugarDetalle: '',
    contextoEspecial: '',
    establecimientoId: '',
    edadGestacionalSemanas: '',
    tipoCursoParto: '',
    inicioTrabajoParto: '',
    conduccionOxitocica: false,
    libertadMovimiento: false,
    regimenHidricoAmplio: false,
    manejoDolorNoFarmacologico: false,
    manejoDolorFarmacologico: false,
    posicionExpulsivo: '',
    episiotomia: false,
    // Anestesia y/o Analgesia del parto
    anestesiaNeuroaxial: false,
    oxidoNitroso: false,
    analgesiaEndovenosa: false,
    anestesiaGeneral: false,
    anestesiaLocal: false,
    medidasNoFarmacologicasAnestesia: false,
    // Acompañamiento
    acompananteDuranteTrabajo: false,
    acompananteSoloExpulsivo: false,
    // Buenas prácticas
    oxitocinaProfilactica: false,
    ligaduraTardiaCordon: false,
    atencionPertinenciaCultural: false,
    contactoPielPielMadre30min: false,
    contactoPielPielAcomp30min: false,
    lactancia60minAlMenosUnRn: false,
    // Campos adicionales REM
    planDeParto: false,
    entregaPlacentaSolicitud: false,
    embarazoNoControlado: false,
    // Profesionales
    matronasIds: [],
    medicosIds: [],
    enfermerasIds: [],
    // Observaciones
    complicaciones: '',
    observaciones: '',
    // Campos para REM
    semanasGestacion: '',
    presentacionFetal: '',
    lactanciaMaterna60min: false,
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
        try {
          const matronasResponse = await fetch('/api/partos/profesionales?role=matrona')
          if (matronasResponse.ok) {
            const matronasData = await matronasResponse.json()
            console.log('Matronas cargadas:', matronasData.data?.length || 0)
            setMatronas(matronasData.data || [])
          } else {
            const errorData = await matronasResponse.json().catch(() => ({ error: 'Error desconocido' }))
            console.error('Error loading matronas:', errorData.error, 'Status:', matronasResponse.status)
            setError(`Error al cargar matronas: ${errorData.error || 'Error desconocido'}`)
          }
        } catch (err) {
          console.error('Error loading matronas:', err)
          setError('Error al conectar con el servidor para cargar matronas')
        }
        setLoadingMatronas(false)

        // Cargar médicos
        setLoadingMedicos(true)
        try {
          const medicosResponse = await fetch('/api/partos/profesionales?role=medico')
          if (medicosResponse.ok) {
            const medicosData = await medicosResponse.json()
            console.log('Médicos cargados:', medicosData.data?.length || 0)
            setMedicos(medicosData.data || [])
          } else {
            const errorData = await medicosResponse.json().catch(() => ({ error: 'Error desconocido' }))
            console.error('Error loading medicos:', errorData.error, 'Status:', medicosResponse.status)
            setError(`Error al cargar médicos: ${errorData.error || 'Error desconocido'}`)
          }
        } catch (err) {
          console.error('Error loading medicos:', err)
          setError('Error al conectar con el servidor para cargar médicos')
        }
        setLoadingMedicos(false)

        // Cargar enfermeras
        setLoadingEnfermeras(true)
        try {
          const enfermerasResponse = await fetch('/api/partos/profesionales?role=enfermera')
          if (enfermerasResponse.ok) {
            const enfermerasData = await enfermerasResponse.json()
            console.log('Enfermeras cargadas:', enfermerasData.data?.length || 0)
            setEnfermeras(enfermerasData.data || [])
          } else {
            const errorData = await enfermerasResponse.json().catch(() => ({ error: 'Error desconocido' }))
            console.error('Error loading enfermeras:', errorData.error, 'Status:', enfermerasResponse.status)
            setError(`Error al cargar enfermeras: ${errorData.error || 'Error desconocido'}`)
          }
        } catch (err) {
          console.error('Error loading enfermeras:', err)
          setError('Error al conectar con el servidor para cargar enfermeras')
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
      const tipoPuro = obtenerTipoPartoPuro(initialData.tipo)
      const contextoEspecial = obtenerContextoEspecial(initialData.tipo)
      const lugar = derivarLugarDeTipo(initialData.tipo)
      const lugarDetalle = derivarLugarDetalleDeTipo(initialData.tipo)
      
      // Verificar si el curso del parto difiere del sugerido (fue modificado manualmente)
      const cursoSugerido = obtenerCursoPartoSugerido(tipoPuro || initialData.tipo)
      const cursoExiste = initialData.tipoCursoParto && initialData.tipoCursoParto !== ''
      const cursoDifiere = cursoExiste && initialData.tipoCursoParto !== cursoSugerido
      if (cursoDifiere) {
        setCursoModificadoManualmente(true)
      }
      
      setFormData({
        madreId: initialData.madreId || '',
        fechaHora: formatearFechaParaInput(initialData.fechaHora),
        fechaParto: formatearFechaDate(initialData.fechaParto),
        tipo: tipoPuro || '',
        lugar: initialData.lugar || lugar || '',
        lugarDetalle: initialData.lugarDetalle || lugarDetalle || '',
        contextoEspecial: contextoEspecial || '',
        establecimientoId: initialData.establecimientoId || '',
        edadGestacionalSemanas: initialData.edadGestacionalSemanas || '',
        tipoCursoParto: initialData.tipoCursoParto || '',
        inicioTrabajoParto: initialData.inicioTrabajoParto || '',
        conduccionOxitocica: initialData.conduccionOxitocica || false,
        libertadMovimiento: initialData.libertadMovimiento || false,
        regimenHidricoAmplio: initialData.regimenHidricoAmplio || false,
        manejoDolorNoFarmacologico: initialData.manejoDolorNoFarmacologico || false,
        manejoDolorFarmacologico: initialData.manejoDolorFarmacologico || false,
        posicionExpulsivo: initialData.posicionExpulsivo || '',
        episiotomia: initialData.episiotomia || false,
        // Anestesia y/o Analgesia del parto
        anestesiaNeuroaxial: initialData.anestesiaNeuroaxial || false,
        oxidoNitroso: initialData.oxidoNitroso || false,
        analgesiaEndovenosa: initialData.analgesiaEndovenosa || false,
        anestesiaGeneral: initialData.anestesiaGeneral || false,
        anestesiaLocal: initialData.anestesiaLocal || false,
        medidasNoFarmacologicasAnestesia: initialData.medidasNoFarmacologicasAnestesia || false,
        // Acompañamiento
        acompananteDuranteTrabajo: initialData.acompananteDuranteTrabajo || false,
        acompananteSoloExpulsivo: initialData.acompananteSoloExpulsivo || false,
        // Buenas prácticas
        oxitocinaProfilactica: initialData.oxitocinaProfilactica || false,
        ligaduraTardiaCordon: initialData.ligaduraTardiaCordon || false,
        atencionPertinenciaCultural: initialData.atencionPertinenciaCultural || false,
        contactoPielPielMadre30min: initialData.contactoPielPielMadre30min || false,
        contactoPielPielAcomp30min: initialData.contactoPielPielAcomp30min || false,
        lactancia60minAlMenosUnRn: initialData.lactancia60minAlMenosUnRn || false,
        // Campos adicionales REM
        planDeParto: initialData.planDeParto || false,
        entregaPlacentaSolicitud: initialData.entregaPlacentaSolicitud || false,
        embarazoNoControlado: initialData.embarazoNoControlado || false,
        // Profesionales
        matronasIds: initialData.matronas?.map((m) => m.user.id) || [],
        medicosIds: initialData.medicos?.map((m) => m.user.id) || [],
        enfermerasIds: initialData.enfermeras?.map((e) => e.user.id) || [],
        // Observaciones
        complicaciones: initialData.complicacionesTexto || '',
        observaciones: initialData.observaciones || '',
        // Campos para REM
        semanasGestacion: initialData.semanasGestacion?.toString() || '',
        presentacionFetal: initialData.presentacionFetal || '',
        lactanciaMaterna60min: initialData.lactanciaMaterna60min || false,
      })
    }
  }, [isEdit, initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    // Si cambia el tipo de parto, auto-completar el curso del parto sugerido
    if (name === 'tipo') {
      const cursoSugerido = obtenerCursoPartoSugerido(value)
      setFormData((prev) => ({
        ...prev,
        tipo: value,
        // Solo auto-completar si el curso está vacío o si no ha sido modificado manualmente
        // Si el usuario ya seleccionó un curso diferente manualmente, no sobrescribirlo
        tipoCursoParto: (!cursoModificadoManualmente && (prev.tipoCursoParto === '' || prev.tipoCursoParto === obtenerCursoPartoSugerido(prev.tipo)))
          ? cursoSugerido 
          : prev.tipoCursoParto
      }))
      return
    }
    
    // Si el usuario cambia manualmente el curso del parto, marcar como modificado manualmente
    if (name === 'tipoCursoParto') {
      setCursoModificadoManualmente(true)
      setFormData({ ...formData, tipoCursoParto: value })
      return
    }
    
    // Si cambia el contexto especial, ajustar lugar automáticamente
    if (name === 'contextoEspecial') {
      if (value === 'DOMICILIO_PROFESIONAL' || value === 'DOMICILIO_SIN_PROFESIONAL') {
        setFormData((prev) => ({
          ...prev,
          contextoEspecial: value,
          lugar: 'DOMICILIO',
          lugarDetalle: '',
        }))
      } else if (value === 'PREHOSPITALARIO' || value === 'FUERA_RED') {
        setFormData((prev) => ({
          ...prev,
          contextoEspecial: value,
          lugar: 'OTRO',
          lugarDetalle: value === 'PREHOSPITALARIO' ? 'Prehospitalario' : value === 'FUERA_RED' ? 'Fuera de red' : '',
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          contextoEspecial: value || '',
          lugarDetalle: '',
        }))
      }
    } else {
      setFormData({ ...formData, [name]: newValue })
    }
    
    // Si cambia el lugar, limpiar lugarDetalle si no aplica
    if (name === 'lugar' && value !== 'OTRO') {
      setFormData((prev) => ({ ...prev, lugarDetalle: '' }))
    }
    
    // Si cambia el lugar y hay contexto especial incompatible, limpiar contexto especial
    if (name === 'lugar') {
      if (value === 'DOMICILIO' && formData.contextoEspecial && 
          formData.contextoEspecial !== 'DOMICILIO_PROFESIONAL' && 
          formData.contextoEspecial !== 'DOMICILIO_SIN_PROFESIONAL') {
        setFormData((prev) => ({ ...prev, contextoEspecial: '' }))
      } else if (value === 'OTRO' && formData.contextoEspecial && 
                 formData.contextoEspecial !== 'PREHOSPITALARIO' && 
                 formData.contextoEspecial !== 'FUERA_RED') {
        setFormData((prev) => ({ ...prev, contextoEspecial: '' }))
      } else if (value !== 'DOMICILIO' && value !== 'OTRO') {
        setFormData((prev) => ({ ...prev, contextoEspecial: '' }))
      }
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
      setError('Madre, fecha/hora, tipo de parto y lugar son requeridos')
      setLoading(false)
      return
    }

    // Validar que la fecha no sea mayor que la fecha y hora actual
    const fechaHoraSeleccionada = new Date(formData.fechaHora)
    const fechaHoraActual = new Date()
    if (fechaHoraSeleccionada > fechaHoraActual) {
      setError('La fecha y hora del parto no puede ser mayor que la fecha y hora actual')
      setLoading(false)
      return
    }

    // Validar lugarDetalle si lugar es OTRO y no hay contexto especial
    if (formData.lugar === 'OTRO' && !formData.contextoEspecial && !formData.lugarDetalle.trim()) {
      setError('Debe especificar el detalle del lugar cuando el lugar es OTRO')
      setLoading(false)
      return
    }

    // Determinar el tipo de parto final según tipo + contexto especial
    let tipoFinal = formData.tipo
    if (formData.contextoEspecial) {
      // Si hay contexto especial, usar ese como tipo
      tipoFinal = formData.contextoEspecial
    }

    // Determinar lugar y lugarDetalle
    let lugarFinal = formData.lugar
    let lugarDetalleFinal = formData.lugarDetalle || null
    
    // Si hay contexto especial, ajustar lugar y detalle
    if (formData.contextoEspecial === 'DOMICILIO_PROFESIONAL' || formData.contextoEspecial === 'DOMICILIO_SIN_PROFESIONAL') {
      lugarFinal = 'DOMICILIO'
      lugarDetalleFinal = null
    } else if (formData.contextoEspecial === 'PREHOSPITALARIO') {
      lugarFinal = 'OTRO'
      lugarDetalleFinal = 'Prehospitalario'
    } else if (formData.contextoEspecial === 'FUERA_RED') {
      lugarFinal = 'OTRO'
      lugarDetalleFinal = 'Fuera de red'
    }

    // Validar al menos una matrona (obligatorio siempre)
    if (!formData.matronasIds || formData.matronasIds.length === 0) {
      setError('Debe seleccionar al menos una matrona')
      setLoading(false)
      return
    }

    // Validar al menos una enfermera (obligatorio siempre)
    if (!formData.enfermerasIds || formData.enfermerasIds.length === 0) {
      setError('Debe seleccionar al menos una enfermera')
      setLoading(false)
      return
    }

    // Validar al menos un médico si es cesárea
    const esCesarea = tipoFinal === 'CESAREA_ELECTIVA' || tipoFinal === 'CESAREA_URGENCIA'
    if (esCesarea && (!formData.medicosIds || formData.medicosIds.length === 0)) {
      setError('Debe seleccionar al menos un médico cuando el tipo de parto es cesárea')
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
        fechaParto: formData.fechaParto || null,
        tipo: tipoFinal,
        lugar: lugarFinal,
        lugarDetalle: lugarDetalleFinal,
        establecimientoId: formData.establecimientoId || null,
        edadGestacionalSemanas: formData.edadGestacionalSemanas ? Number.parseInt(formData.edadGestacionalSemanas) : null,
        tipoCursoParto: formData.tipoCursoParto || null,
        inicioTrabajoParto: formData.inicioTrabajoParto || null,
        conduccionOxitocica: formData.conduccionOxitocica || null,
        libertadMovimiento: formData.libertadMovimiento || null,
        regimenHidricoAmplio: formData.regimenHidricoAmplio || null,
        manejoDolorNoFarmacologico: formData.manejoDolorNoFarmacologico || null,
        manejoDolorFarmacologico: formData.manejoDolorFarmacologico || null,
        posicionExpulsivo: formData.posicionExpulsivo || null,
        episiotomia: formData.episiotomia || null,
        // Anestesia y/o Analgesia del parto
        anestesiaNeuroaxial: formData.anestesiaNeuroaxial || null,
        oxidoNitroso: formData.oxidoNitroso || null,
        analgesiaEndovenosa: formData.analgesiaEndovenosa || null,
        anestesiaGeneral: formData.anestesiaGeneral || null,
        anestesiaLocal: formData.anestesiaLocal || null,
        medidasNoFarmacologicasAnestesia: formData.medidasNoFarmacologicasAnestesia || null,
        // Acompañamiento
        acompananteDuranteTrabajo: formData.acompananteDuranteTrabajo || null,
        acompananteSoloExpulsivo: formData.acompananteSoloExpulsivo || null,
        // Buenas prácticas
        oxitocinaProfilactica: formData.oxitocinaProfilactica || null,
        ligaduraTardiaCordon: formData.ligaduraTardiaCordon || null,
        atencionPertinenciaCultural: formData.atencionPertinenciaCultural || null,
        contactoPielPielMadre30min: formData.contactoPielPielMadre30min || null,
        contactoPielPielAcomp30min: formData.contactoPielPielAcomp30min || null,
        lactancia60minAlMenosUnRn: formData.lactancia60minAlMenosUnRn || null,
        // Campos adicionales REM
        planDeParto: formData.planDeParto || null,
        entregaPlacentaSolicitud: formData.entregaPlacentaSolicitud || null,
        embarazoNoControlado: formData.embarazoNoControlado || null,
        matronasIds: formData.matronasIds || [],
        medicosIds: formData.medicosIds || [],
        enfermerasIds: formData.enfermerasIds || [],
        complicacionesTexto: formData.complicaciones || null,
        observaciones: formData.observaciones || null,
        // Campos para REM
        semanasGestacion: formData.semanasGestacion ? Number.parseInt(formData.semanasGestacion) : null,
        presentacionFetal: formData.presentacionFetal || null,
        lactanciaMaterna60min: formData.lactanciaMaterna60min || false,
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
                max={obtenerFechaHoraActual()}
                step="1"
                required
              />
              <small className={styles.helpText}>
                Incluye minutos y segundos para mayor precisión
              </small>
            </div>

            {/* Fecha del Parto */}
            <div className={styles.formGroup}>
              <label htmlFor="fechaParto">Fecha del Parto</label>
              <input
                type="date"
                id="fechaParto"
                name="fechaParto"
                value={formData.fechaParto}
                onChange={handleChange}
                max={obtenerFechaHoraActual().split('T')[0]}
              />
              <small className={styles.helpText}>
                Fecha específica del parto (opcional, diferente de fecha y hora)
              </small>
            </div>

            {/* Tipo de Parto */}
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
                <option value="VAGINAL">Vaginal</option>
                <option value="INSTRUMENTAL">Instrumental</option>
                <option value="CESAREA_ELECTIVA">Cesárea Electiva</option>
                <option value="CESAREA_URGENCIA">Cesárea Urgencia</option>
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

            {/* Contexto Especial (solo para partos vaginales en domicilio u otros lugares especiales) */}
            {(formData.tipo === 'VAGINAL' || formData.tipo === 'INSTRUMENTAL') && (
              <div className={styles.formGroup}>
                <label htmlFor="contextoEspecial">
                  Contexto Especial
                </label>
                <select
                  id="contextoEspecial"
                  name="contextoEspecial"
                  value={formData.contextoEspecial}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Ninguno (parto estándar)</option>
                  {formData.lugar === 'DOMICILIO' && (
                    <>
                      <option value="DOMICILIO_PROFESIONAL">Domicilio con Profesional</option>
                      <option value="DOMICILIO_SIN_PROFESIONAL">Domicilio sin Profesional</option>
                    </>
                  )}
                  {formData.lugar === 'OTRO' && (
                    <>
                      <option value="PREHOSPITALARIO">Prehospitalario</option>
                      <option value="FUERA_RED">Fuera de Red</option>
                    </>
                  )}
                </select>
                <small className={styles.helpText}>
                  Especifique si el parto ocurrió en un contexto especial
                </small>
              </div>
            )}

            {/* Lugar Detalle (solo cuando lugar es OTRO y no hay contexto especial) */}
            {formData.lugar === 'OTRO' && !formData.contextoEspecial && (
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
                  placeholder="Especifique el lugar"
                  required={formData.lugar === 'OTRO' && !formData.contextoEspecial}
                />
              </div>
            )}
            </div>
          </div>

          {/* Sección 2: Características del Parto */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Características del Parto
            </h2>
            <div className={styles.formGrid}>
              {/* Establecimiento ID */}
              <div className={styles.formGroup}>
                <label htmlFor="establecimientoId">Establecimiento ID</label>
                <input
                  type="text"
                  id="establecimientoId"
                  name="establecimientoId"
                  value={formData.establecimientoId}
                  onChange={handleChange}
                  placeholder="ID del establecimiento"
                />
              </div>

              {/* Edad Gestacional */}
              <div className={styles.formGroup}>
                <label htmlFor="edadGestacionalSemanas">Edad Gestacional (semanas)</label>
                <input
                  type="number"
                  id="edadGestacionalSemanas"
                  name="edadGestacionalSemanas"
                  value={formData.edadGestacionalSemanas}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  placeholder="Semanas"
                />
              </div>

              {/* Curso del Parto */}
              <div className={styles.formGroup}>
                <label htmlFor="tipoCursoParto">Curso del Parto</label>
                <select
                  id="tipoCursoParto"
                  name="tipoCursoParto"
                  value={formData.tipoCursoParto}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="EUTOCICO">Eutócico</option>
                  <option value="DISTOCICO">Distócico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 3: Modelo de Atención */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-hospital"></i>
              Modelo de Atención
            </h2>
            <div className={styles.formGrid}>
              {/* Inicio Trabajo Parto */}
              <div className={styles.formGroup}>
                <label htmlFor="inicioTrabajoParto">Inicio Trabajo Parto</label>
                <select
                  id="inicioTrabajoParto"
                  name="inicioTrabajoParto"
                  value={formData.inicioTrabajoParto}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="ESPONTANEO">Espontáneo</option>
                  <option value="INDUCIDO_MECANICO">Inducido Mecánico</option>
                  <option value="INDUCIDO_FARMACOLOGICO">Inducido Farmacológico</option>
                </select>
              </div>

              {/* Posición Expulsivo */}
              <div className={styles.formGroup}>
                <label htmlFor="posicionExpulsivo">Posición Expulsivo</label>
                <select
                  id="posicionExpulsivo"
                  name="posicionExpulsivo"
                  value={formData.posicionExpulsivo}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="LITOTOMIA">Litotomía</option>
                  <option value="OTRAS">Otras</option>
                </select>
              </div>
            </div>

            {/* Checkboxes del Modelo de Atención */}
            <div className={styles.checkboxGrid}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="conduccionOxitocica"
                    checked={formData.conduccionOxitocica}
                    onChange={handleChange}
                  />
                  <span>Conducción Oxitócica</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="libertadMovimiento"
                    checked={formData.libertadMovimiento}
                    onChange={handleChange}
                  />
                  <span>Libertad de Movimiento</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="regimenHidricoAmplio"
                    checked={formData.regimenHidricoAmplio}
                    onChange={handleChange}
                  />
                  <span>Régimen Hídrico Amplio</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="manejoDolorNoFarmacologico"
                    checked={formData.manejoDolorNoFarmacologico}
                    onChange={handleChange}
                  />
                  <span>Manejo Dolor No Farmacológico</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="manejoDolorFarmacologico"
                    checked={formData.manejoDolorFarmacologico}
                    onChange={handleChange}
                  />
                  <span>Manejo Dolor Farmacológico</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="episiotomia"
                    checked={formData.episiotomia}
                    onChange={handleChange}
                  />
                  <span>Episiotomía</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección 3.5: Anestesia y/o Analgesia del Parto */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-syringe"></i>
              Anestesia y/o Analgesia del Parto
            </h2>
            <div className={styles.checkboxGrid}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="anestesiaNeuroaxial"
                    checked={formData.anestesiaNeuroaxial}
                    onChange={handleChange}
                  />
                  <span>Anestesia Neuroaxial</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="oxidoNitroso"
                    checked={formData.oxidoNitroso}
                    onChange={handleChange}
                  />
                  <span>Óxido Nitroso</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="analgesiaEndovenosa"
                    checked={formData.analgesiaEndovenosa}
                    onChange={handleChange}
                  />
                  <span>Analgesia Endovenosa</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="anestesiaGeneral"
                    checked={formData.anestesiaGeneral}
                    onChange={handleChange}
                  />
                  <span>Anestesia General</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="anestesiaLocal"
                    checked={formData.anestesiaLocal}
                    onChange={handleChange}
                  />
                  <span>Anestesia Local</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="medidasNoFarmacologicasAnestesia"
                    checked={formData.medidasNoFarmacologicasAnestesia}
                    onChange={handleChange}
                  />
                  <span>Medidas No Farmacológicas (Anestesia)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección 4: Acompañamiento */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-users"></i>
              Acompañamiento
            </h2>
            <div className={styles.checkboxGrid}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="acompananteDuranteTrabajo"
                    checked={formData.acompananteDuranteTrabajo}
                    onChange={handleChange}
                  />
                  <span>Acompañante Durante Trabajo</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="acompananteSoloExpulsivo"
                    checked={formData.acompananteSoloExpulsivo}
                    onChange={handleChange}
                  />
                  <span>Acompañante Solo en Expulsivo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección 5: Buenas Prácticas */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-check-circle"></i>
              Buenas Prácticas
            </h2>
            <div className={styles.checkboxGrid}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="oxitocinaProfilactica"
                    checked={formData.oxitocinaProfilactica}
                    onChange={handleChange}
                  />
                  <span>Oxitocina Profiláctica</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="ligaduraTardiaCordon"
                    checked={formData.ligaduraTardiaCordon}
                    onChange={handleChange}
                  />
                  <span>Ligadura Tardía Cordón</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="atencionPertinenciaCultural"
                    checked={formData.atencionPertinenciaCultural}
                    onChange={handleChange}
                  />
                  <span>Atención Pertinencia Cultural</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="contactoPielPielMadre30min"
                    checked={formData.contactoPielPielMadre30min}
                    onChange={handleChange}
                  />
                  <span>Contacto Piel-Piel Madre (30 min)</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="contactoPielPielAcomp30min"
                    checked={formData.contactoPielPielAcomp30min}
                    onChange={handleChange}
                  />
                  <span>Contacto Piel-Piel Acompañante (30 min)</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="lactancia60minAlMenosUnRn"
                    checked={formData.lactancia60minAlMenosUnRn}
                    onChange={handleChange}
                  />
                  <span>Lactancia 60 min (al menos 1 RN)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección 5.5: Campos Adicionales REM */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-clipboard-list"></i>
              Campos Adicionales REM
            </h2>
            <div className={styles.checkboxGrid}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="planDeParto"
                    checked={formData.planDeParto}
                    onChange={handleChange}
                  />
                  <span>Plan de Parto</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="entregaPlacentaSolicitud"
                    checked={formData.entregaPlacentaSolicitud}
                    onChange={handleChange}
                  />
                  <span>Entrega de Placenta a Solicitud</span>
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="embarazoNoControlado"
                    checked={formData.embarazoNoControlado}
                    onChange={handleChange}
                  />
                  <span>Embarazo No Controlado</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección 6: Personal Asistente */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-user-md"></i>
              Personal Asistente
            </h2>
            
            {/* Matronas */}
            <div className={styles.professionalGroup}>
              <label className={styles.professionalLabel}>
                <i className="fas fa-user-nurse"></i>
                Matronas <span className={styles.required}>*</span>
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
                  {matronas.length === 0 && !loadingMatronas && (
                    <option value="" disabled>No hay matronas disponibles</option>
                  )}
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
                Médicos {(formData.tipo === 'CESAREA_ELECTIVA' || formData.tipo === 'CESAREA_URGENCIA') && <span className={styles.required}>*</span>}
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
                  {medicos.length === 0 && !loadingMedicos && (
                    <option value="" disabled>No hay médicos disponibles</option>
                  )}
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
                Enfermeras <span className={styles.required}>*</span>
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
                  {enfermeras.length === 0 && !loadingEnfermeras && (
                    <option value="" disabled>No hay enfermeras disponibles</option>
                  )}
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

          {/* Sección 7: Observaciones Clínicas */}
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
              
              {/* Semanas de Gestación (para REM) */}
              <div className={styles.formGroup}>
                <label htmlFor="semanasGestacion">Semanas de Gestación</label>
                <input
                  type="number"
                  id="semanasGestacion"
                  name="semanasGestacion"
                  value={formData.semanasGestacion}
                  onChange={handleChange}
                  min="0"
                  max="45"
                  className={styles.input}
                  placeholder="Ej: 38"
                />
                <small className={styles.helpText}>
                  Para reportes REM (clasificación &lt;20, 20-36, ≥37 semanas)
                </small>
              </div>
              
              {/* Presentación Fetal (para REM) */}
              <div className={styles.formGroup}>
                <label htmlFor="presentacionFetal">Presentación Fetal</label>
                <select
                  id="presentacionFetal"
                  name="presentacionFetal"
                  value={formData.presentacionFetal}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccione...</option>
                  <option value="Cefálica">Cefálica</option>
                  <option value="Podálica/Nalgas">Podálica/Nalgas</option>
                  <option value="Cara">Cara</option>
                  <option value="Transversa">Transversa</option>
                  <option value="Otra">Otra</option>
                </select>
                <small className={styles.helpText}>
                  Para reportes REM
                </small>
              </div>
              
              {/* Lactancia Materna 60 min (para REM) */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="lactanciaMaterna60min"
                    checked={formData.lactanciaMaterna60min}
                    onChange={(e) => setFormData({...formData, lactanciaMaterna60min: e.target.checked})}
                    className={styles.checkbox}
                  />
                  <span>Lactancia materna en primeros 60 minutos (para RN ≥ 2,500g)</span>
                </label>
                <small className={styles.helpText}>
                  Marcar si el recién nacido con peso ≥ 2,500g tuvo lactancia materna en los primeros 60 minutos de vida
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

