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
    suma += parseInt(numero[i]) * multiplicador
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
    const numero = partes[0].replace(/[^0-9]/g, '').substring(0, 8) // máximo 8 dígitos
    const dv = partes[1] ? partes[1].replace(/[^0-9Kk]/g, '').substring(0, 1) : ''
    
    if (numero.length === 0) return ''
    
    if (dv.length > 0) {
      return numero + '-' + dv.toUpperCase()
    }
    return numero + '-'
  }
  
  // Si no tiene guion, remover caracteres inválidos
  let rut = valor.replace(/[^0-9Kk]/g, '')
  
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
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

export default function MadreForm({ initialData = null, isEdit = false, madreId = null, isLimited = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rutError, setRutError] = useState('')

  const [formData, setFormData] = useState({
    rut: '',
    nombres: '',
    apellidos: '',
    edad: '',
    fechaNacimiento: '',
    direccion: '',
    telefono: '',
    fichaClinica: '',
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
    if (!formData.rut || !formData.nombres || !formData.apellidos) {
      setError('RUT, nombres y apellidos son requeridos')
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

    try {
      const url = isEdit ? `/api/madres/${madreId}` : '/api/madres'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
            />
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
            />
          </div>

          {/* Edad */}
          <div className={styles.formGroup}>
            <label htmlFor="edad">Edad</label>
            <input
              type="number"
              id="edad"
              name="edad"
              value={formData.edad}
              onChange={handleChange}
              min="0"
              max="150"
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div className={styles.formGroup}>
            <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
            />
          </div>

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
              maxLength={20}
            />
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
            disabled={loading || !!rutError}
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



