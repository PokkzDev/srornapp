'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './MadreForm.module.css'

// Función para validar RUT chileno (formato: sin puntos, con guion)
function validarRUT(rut) {
  if (!rut || typeof rut !== 'string') {
    return false
  }

  // Formato esperado: números seguidos de guion y dígito verificador
  const rutRegex = /^(\d{7,8})-(\d|k|K)$/
  if (!rutRegex.test(rut)) {
    return false
  }

  // Separar número y dígito verificador
  const [numero, dv] = rut.split('-')
  const dvUpper = dv.toUpperCase()

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  // Sumar desde el final
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += Number.parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  let dvCalculado = 11 - resto

  if (dvCalculado === 11) {
    dvCalculado = '0'
  } else if (dvCalculado === 10) {
    dvCalculado = 'K'
  } else {
    dvCalculado = dvCalculado.toString()
  }

  return dvUpper === dvCalculado
}

// Función para formatear RUT mientras se escribe (sin puntos, con guion)
function formatearRUT(valor) {
  if (!valor) return ''
  
  // Si ya tiene guion, preservarlo y limpiar solo caracteres inválidos
  if (valor.includes('-')) {
    const partes = valor.split('-')
    const numero = partes[0].replaceAll(/[^0-9]/g, '').substring(0, 8) // máximo 8 dígitos
    const dv = partes[1] ? partes[1].replaceAll(/[^0-9Kk]/g, '').substring(0, 1) : ''
    
    if (numero.length === 0) return ''
    
    if (dv.length > 0) {
      return numero + '-' + dv.toUpperCase()
    }
    return numero + '-'
  }
  
  // Si no tiene guion, remover caracteres inválidos
  let rut = valor.replaceAll(/[^0-9Kk]/g, '')
  
  if (rut.length === 0) return ''
  
  // Si tiene más de 9 caracteres (8 dígitos + 1 dígito verificador), truncar
  if (rut.length > 9) {
    rut = rut.substring(0, 9)
  }
  
  // Agregar guion automáticamente cuando tenga 8 dígitos o más
  if (rut.length >= 8) {
    rut = rut.slice(0, 8) + '-' + rut.slice(8)
  }
  
  return rut.toUpperCase()
}

// Función para formatear fecha para input date (YYYY-MM-DD)
function formatearFechaParaInput(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

// Función para obtener la fecha actual en formato YYYY-MM-DD en zona horaria America/Santiago
function obtenerFechaActualSantiago() {
  const ahora = new Date()
  // Obtener la fecha en zona horaria de Santiago usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(ahora)
}

// Función para validar que la fecha de nacimiento no sea superior a la fecha actual
function validarFechaNacimiento(fechaNacimiento) {
  if (!fechaNacimiento) return { valida: true, error: '' }
  
  const fechaActual = obtenerFechaActualSantiago()
  
  // Comparar directamente las cadenas YYYY-MM-DD (comparación lexicográfica funciona correctamente)
  if (fechaNacimiento > fechaActual) {
    return { valida: false, error: 'La fecha de nacimiento no puede ser superior a la fecha actual' }
  }
  
  return { valida: true, error: '' }
}

// Función para validar nombres y apellidos (solo letras, espacios, acentos y caracteres especiales permitidos)
function validarNombreApellido(valor) {
  if (!valor) return { valida: true, error: '' }
  
  // Permitir letras (incluyendo acentos y caracteres especiales del español), espacios, guiones y apóstrofes
  // No permitir números
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/
  
  if (!regex.test(valor)) {
    return { valida: false, error: 'Solo se permiten letras, espacios y caracteres especiales (no números)' }
  }
  
  return { valida: true, error: '' }
}

// Función para formatear teléfono mientras se escribe (formato internacional: +XX...)
function formatearTelefono(valor) {
  if (!valor) return ''
  
  // Remover todo excepto números y el signo +
  let telefono = valor.replaceAll(/[^\d+]/g, '')
  
  // Si no empieza con +, agregarlo
  if (telefono.length > 0 && !telefono.startsWith('+')) {
    telefono = '+' + telefono.replaceAll('+', '')
  }
  
  // Limitar longitud total (código de país 1-3 dígitos + hasta 15 dígitos del número)
  // Formato E.164 permite hasta 15 dígitos después del +
  if (telefono.length > 16) {
    telefono = telefono.substring(0, 16)
  }
  
  return telefono
}

// Función para validar formato de teléfono internacional
function validarTelefono(telefono) {
  if (!telefono) return { valida: true, error: '' }
  
  // Debe empezar con +
  if (!telefono.startsWith('+')) {
    return { valida: false, error: 'El teléfono debe empezar con + seguido del código de país' }
  }
  
  // Remover el + y validar que solo queden números
  const numero = telefono.substring(1)
  if (!/^\d+$/.test(numero)) {
    return { valida: false, error: 'El teléfono solo puede contener números después del +' }
  }
  
  // Validar longitud mínima: + (código país 1-3 dígitos) + número (mínimo 4 dígitos)
  if (numero.length < 5) {
    return { valida: false, error: 'El teléfono debe tener al menos 5 dígitos después del +' }
  }
  
  // Validar longitud máxima según E.164 (máximo 15 dígitos después del +)
  if (numero.length > 15) {
    return { valida: false, error: 'El teléfono no puede tener más de 15 dígitos después del +' }
  }
  
  return { valida: true, error: '' }
}

// Función para calcular la edad basada en la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return ''
  
  try {
    // Obtener fecha actual en zona horaria de Santiago
    const fechaActual = obtenerFechaActualSantiago()
    const [añoActual, mesActual, diaActual] = fechaActual.split('-').map(Number)
    const [añoNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number)
    
    let edad = añoActual - añoNac
    
    // Ajustar si aún no ha cumplido años este año
    if (mesActual < mesNac || (mesActual === mesNac && diaActual < diaNac)) {
      edad--
    }
    
    return edad >= 0 ? edad.toString() : ''
  } catch (error) {
    return ''
  }
}

// Función helper para convertir valor booleano/null a string para select
function booleanToString(valor) {
  if (valor === true) return 'true'
  if (valor === false) return 'false'
  return ''
}

export default function MadreForm({ initialData = null, isEdit = false, madreId = null, isLimited = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rutError, setRutError] = useState('')
  const [fechaNacimientoError, setFechaNacimientoError] = useState('')
  const [nombresError, setNombresError] = useState('')
  const [apellidosError, setApellidosError] = useState('')
  const [telefonoError, setTelefonoError] = useState('')

  const [formData, setFormData] = useState({
    rut: '',
    nombres: '',
    apellidos: '',
    edad: '',
    edadAnos: '',
    fechaNacimiento: '',
    direccion: '',
    telefono: '',
    fichaClinica: '',
    // Campos REM
    pertenenciaPuebloOriginario: null,
    condicionMigrante: null,
    condicionDiscapacidad: null,
    condicionPrivadaLibertad: null,
    identidadTrans: null,
    hepatitisBPositiva: null,
    controlPrenatal: null,
  })

  // Cargar datos iniciales si es modo edición
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        rut: initialData.rut || '',
        nombres: initialData.nombres || '',
        apellidos: initialData.apellidos || '',
        edad: initialData.edad?.toString() || '',
        fechaNacimiento: formatearFechaParaInput(initialData.fechaNacimiento),
        direccion: initialData.direccion || '',
        telefono: initialData.telefono || '',
        fichaClinica: initialData.fichaClinica || '',
        // Campos REM
        pertenenciaPuebloOriginario: initialData.pertenenciaPuebloOriginario ?? null,
        condicionMigrante: initialData.condicionMigrante ?? null,
        condicionDiscapacidad: initialData.condicionDiscapacidad ?? null,
        condicionPrivadaLibertad: initialData.condicionPrivadaLibertad ?? null,
        identidadTrans: initialData.identidadTrans ?? null,
        hepatitisBPositiva: initialData.hepatitisBPositiva ?? null,
        controlPrenatal: initialData.controlPrenatal ?? null,
      })
    }
  }, [isEdit, initialData])

  // Validar RUT en tiempo real
  const handleRUTChange = (e) => {
    const valor = e.target.value
    const rutFormateado = formatearRUT(valor)
    
    setFormData({ ...formData, rut: rutFormateado })
    
    if (rutFormateado && rutFormateado.includes('-')) {
      if (!validarRUT(rutFormateado)) {
        setRutError('RUT inválido')
      } else {
        setRutError('')
      }
    } else if (rutFormateado.length > 0) {
      setRutError('Formato: 12345678-9')
    } else {
      setRutError('')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let valorFinal = value
    
    // Filtrar números de nombres y apellidos mientras se escribe
    if (name === 'nombres' || name === 'apellidos') {
      // Remover números del valor
      valorFinal = value.replaceAll(/[0-9]/g, '')
      setFormData({ ...formData, [name]: valorFinal })
      
      // Validar el valor filtrado
      const validacion = validarNombreApellido(valorFinal)
      if (!validacion.valida && valorFinal.length > 0) {
        if (name === 'nombres') {
          setNombresError(validacion.error)
        } else {
          setApellidosError(validacion.error)
        }
      } else {
        if (name === 'nombres') {
          setNombresError('')
        } else {
          setApellidosError('')
        }
      }
    } else if (name === 'telefono') {
      // Formatear y validar teléfono en tiempo real
      valorFinal = formatearTelefono(value)
      setFormData({ ...formData, [name]: valorFinal })
      
      // Validar el teléfono formateado
      const validacion = validarTelefono(valorFinal)
      if (!validacion.valida && valorFinal.length > 0) {
        setTelefonoError(validacion.error)
      } else {
        setTelefonoError('')
      }
    } else {
      // Manejar campos booleanos con dropdowns (select)
      const camposBooleanos = [
        'pertenenciaPuebloOriginario',
        'condicionMigrante',
        'condicionDiscapacidad',
        'condicionPrivadaLibertad',
        'identidadTrans',
        'hepatitisBPositiva',
        'controlPrenatal'
      ]
      
      if (camposBooleanos.includes(name)) {
        // Convertir string a boolean o null
        let valorBooleano = null
        if (value === 'true') {
          valorBooleano = true
        } else if (value === 'false') {
          valorBooleano = false
        } else {
          valorBooleano = null
        }
        setFormData({ ...formData, [name]: valorBooleano })
      } else {
        setFormData({ ...formData, [name]: value })
        
        // Validar fecha de nacimiento en tiempo real
        if (name === 'fechaNacimiento') {
          const validacion = validarFechaNacimiento(value)
          if (!validacion.valida) {
            setFechaNacimientoError(validacion.error)
          } else {
            setFechaNacimientoError('')
          }
          // Calcular edad cuando se cambia fechaNacimiento
          if (value) {
            const edadCalculada = calcularEdad(value)
            if (edadCalculada) {
              setFormData(prev => ({ ...prev, edad: edadCalculada }))
            }
          }
        }
      }
    }
    
    // Limpiar errores al cambiar campos
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validaciones básicas según esquema de BD (rut, nombres, apellidos son obligatorios)
    if (!formData.rut || !formData.nombres || !formData.apellidos) {
      setError('RUT, nombres y apellidos son requeridos')
      setLoading(false)
      return
    }

    // Validar que nombres y apellidos no estén vacíos (trim)
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setError('Nombres y apellidos no pueden estar vacíos')
      setLoading(false)
      return
    }

    // Validar fecha de nacimiento obligatoria (regla de negocio)
    if (!formData.fechaNacimiento) {
      setError('La fecha de nacimiento es obligatoria')
      setFechaNacimientoError('La fecha de nacimiento es obligatoria')
      setLoading(false)
      return
    }

    // Validar RUT
    if (!validarRUT(formData.rut)) {
      setError('Por favor ingrese un RUT válido')
      setRutError('RUT inválido')
      setLoading(false)
      return
    }

    // Validar nombres
    const validacionNombres = validarNombreApellido(formData.nombres)
    if (!validacionNombres.valida) {
      setError(validacionNombres.error)
      setNombresError(validacionNombres.error)
      setLoading(false)
      return
    }

    // Validar apellidos
    const validacionApellidos = validarNombreApellido(formData.apellidos)
    if (!validacionApellidos.valida) {
      setError(validacionApellidos.error)
      setApellidosError(validacionApellidos.error)
      setLoading(false)
      return
    }

    // Validar teléfono si está presente
    if (formData.telefono) {
      const validacionTelefono = validarTelefono(formData.telefono)
      if (!validacionTelefono.valida) {
        setError(validacionTelefono.error)
        setTelefonoError(validacionTelefono.error)
        setLoading(false)
        return
      }
    }

    // Validar fecha de nacimiento
    if (formData.fechaNacimiento) {
      const validacion = validarFechaNacimiento(formData.fechaNacimiento)
      if (!validacion.valida) {
        setError(validacion.error)
        setFechaNacimientoError(validacion.error)
        setLoading(false)
        return
      }
    }

    // Calcular edad automáticamente si hay fecha de nacimiento
    const datosParaEnviar = { ...formData }
    if (datosParaEnviar.fechaNacimiento) {
      const edadCalculada = calcularEdad(datosParaEnviar.fechaNacimiento)
      datosParaEnviar.edad = edadCalculada || ''
    }
    
    // Sincronizar edadAnos con edad (para REM) - siempre desde edad, ya sea calculada o manual
    if (datosParaEnviar.edad && datosParaEnviar.edad !== '') {
      const edadNum = Number.parseInt(datosParaEnviar.edad)
      if (!Number.isNaN(edadNum) && edadNum >= 0) {
        datosParaEnviar.edadAnos = edadNum
      } else {
        datosParaEnviar.edadAnos = null
      }
    } else {
      datosParaEnviar.edadAnos = null
    }
    
    // Convertir campos booleanos: null -> null, 'true' -> true, 'false' -> false
    const camposBooleanos = [
      'pertenenciaPuebloOriginario',
      'condicionMigrante',
      'condicionDiscapacidad',
      'condicionPrivadaLibertad',
      'identidadTrans',
      'hepatitisBPositiva',
      'controlPrenatal'
    ]
    
    camposBooleanos.forEach(campo => {
      if (datosParaEnviar[campo] === 'true') {
        datosParaEnviar[campo] = true
      } else if (datosParaEnviar[campo] === 'false') {
        datosParaEnviar[campo] = false
      } else if (datosParaEnviar[campo] === '') {
        datosParaEnviar[campo] = null
      }
    })

    try {
      const url = isEdit ? `/api/madres/${madreId}` : '/api/madres'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaEnviar),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Error al ${isEdit ? 'actualizar' : 'registrar'} la madre`)
        setLoading(false)
        return
      }

      setSuccess(`Madre ${isEdit ? 'actualizada' : 'registrada'} exitosamente`)
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/madres')
      }, 2000)
    } catch (err) {
      console.error(`Error al ${isEdit ? 'actualizar' : 'registrar'} madre:`, err)
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

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Sección: Datos Personales */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Datos Personales</h2>
          <div className={styles.formGrid}>
            {/* RUT */}
            <div className={styles.formGroup}>
              <label htmlFor="rut">
                RUT <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleRUTChange}
                placeholder="12345678-9"
                maxLength="10"
                required
                disabled={isEdit}
                className={rutError ? styles.inputError : ''}
              />
              {rutError && (
                <span className={styles.errorText}>{rutError}</span>
              )}
              {!isEdit && (
                <small className={styles.helpText}>
                  Sin puntos, con guion (ej: 12345678-9)
                </small>
              )}
              {isEdit && (
                <small className={styles.helpText}>
                  El RUT no se puede modificar
                </small>
              )}
            </div>

            {/* Nombres */}
            <div className={styles.formGroup}>
              <label htmlFor="nombres">
                Nombres <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
                maxLength={120}
                className={nombresError ? styles.inputError : ''}
              />
              {nombresError && (
                <span className={styles.errorText}>{nombresError}</span>
              )}
            </div>

            {/* Apellidos */}
            <div className={styles.formGroup}>
              <label htmlFor="apellidos">
                Apellidos <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                required
                maxLength={120}
                className={apellidosError ? styles.inputError : ''}
              />
              {apellidosError && (
                <span className={styles.errorText}>{apellidosError}</span>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div className={styles.formGroup}>
              <label htmlFor="fechaNacimiento">
                Fecha de Nacimiento <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                max={obtenerFechaActualSantiago()}
                required
                className={fechaNacimientoError ? styles.inputError : ''}
              />
              {fechaNacimientoError && (
                <span className={styles.errorText}>{fechaNacimientoError}</span>
              )}
              <small className={styles.helpText}>
                La edad se calculará automáticamente
              </small>
            </div>
          </div>
        </div>

        {/* Sección: Datos de Contacto */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Datos de Contacto</h2>
          <div className={styles.formGrid}>
            {/* Dirección */}
            <div className={styles.formGroup}>
              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                maxLength={200}
              />
            </div>

            {/* Teléfono */}
            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                maxLength={16}
                placeholder="+56912345678"
                className={telefonoError ? styles.inputError : ''}
              />
              {telefonoError && (
                <span className={styles.errorText}>{telefonoError}</span>
              )}
              <small className={styles.helpText}>
                Formato internacional: + (código de país) + número (ej: +56912345678)
              </small>
            </div>

            {/* Ficha Clínica */}
            <div className={styles.formGroup}>
              <label htmlFor="fichaClinica">Ficha Clínica</label>
              <input
                type="text"
                id="fichaClinica"
                name="fichaClinica"
                value={formData.fichaClinica}
                onChange={handleChange}
                maxLength={30}
                placeholder="Número de ficha clínica del hospital"
              />
              <small className={styles.helpText}>
                Número de identificación clínica del hospital (opcional, debe ser único)
              </small>
            </div>
          </div>
        </div>

        {/* Sección: Información Demográfica y Social */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Información Demográfica y Social</h2>
          <div className={styles.formGrid}>
          {/* Pertenencia a Pueblo Originario */}
          <div className={styles.formGroup}>
            <label htmlFor="pertenenciaPuebloOriginario">Pertenencia a Pueblo Originario</label>
            <select
              id="pertenenciaPuebloOriginario"
              name="pertenenciaPuebloOriginario"
              value={booleanToString(formData.pertenenciaPuebloOriginario)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Condición Migrante */}
          <div className={styles.formGroup}>
            <label htmlFor="condicionMigrante">Condición Migrante</label>
            <select
              id="condicionMigrante"
              name="condicionMigrante"
              value={booleanToString(formData.condicionMigrante)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Condición Discapacidad */}
          <div className={styles.formGroup}>
            <label htmlFor="condicionDiscapacidad">Condición Discapacidad</label>
            <select
              id="condicionDiscapacidad"
              name="condicionDiscapacidad"
              value={booleanToString(formData.condicionDiscapacidad)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Condición Privada de Libertad */}
          <div className={styles.formGroup}>
            <label htmlFor="condicionPrivadaLibertad">Condición Privada de Libertad</label>
            <select
              id="condicionPrivadaLibertad"
              name="condicionPrivadaLibertad"
              value={booleanToString(formData.condicionPrivadaLibertad)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Identidad Trans */}
          <div className={styles.formGroup}>
            <label htmlFor="identidadTrans">Identidad Trans</label>
            <select
              id="identidadTrans"
              name="identidadTrans"
              value={booleanToString(formData.identidadTrans)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Hepatitis B Positiva */}
          <div className={styles.formGroup}>
            <label htmlFor="hepatitisBPositiva">Hepatitis B Positiva</label>
            <select
              id="hepatitisBPositiva"
              name="hepatitisBPositiva"
              value={booleanToString(formData.hepatitisBPositiva)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
            <small className={styles.helpText}>
              Para sección J transmisión vertical
            </small>
          </div>

          {/* Control Prenatal */}
          <div className={styles.formGroup}>
            <label htmlFor="controlPrenatal">Control Prenatal</label>
            <select
              id="controlPrenatal"
              name="controlPrenatal"
              value={booleanToString(formData.controlPrenatal)}
              onChange={handleChange}
            >
              <option value="">No especificado</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
            <small className={styles.helpText}>
              Embarazo controlado / no controlado
            </small>
          </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/madres')}
            className={styles.btnSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading || !!rutError || !!fechaNacimientoError || !!nombresError || !!apellidosError || !!telefonoError}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> {isEdit ? 'Actualizar Madre' : 'Registrar Madre'}
              </>
            )}
          </button>
        </div>
      </form>
    </>
  )
}



