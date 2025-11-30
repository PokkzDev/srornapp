'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

// Función para validar RUT chileno
function validarRUT(rut) {
  if (!rut || typeof rut !== 'string') {
    return false
  }

  const rutRegex = /^(\d{7,8})-(\d|k|K)$/
  if (!rutRegex.test(rut)) {
    return false
  }

  const [numero, dv] = rut.split('-')
  const dvUpper = dv.toUpperCase()

  let suma = 0
  let multiplicador = 2

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

// Función para formatear RUT
function formatearRUT(valor) {
  if (!valor) return ''
  
  if (valor.includes('-')) {
    const partes = valor.split('-')
    const numero = partes[0].replaceAll(/[^0-9]/g, '').substring(0, 8)
    const dv = partes[1] ? partes[1].replaceAll(/[^0-9Kk]/g, '').substring(0, 1) : ''
    
    if (numero.length === 0) return ''
    
    if (dv.length > 0) {
      return numero + '-' + dv.toUpperCase()
    }
    return numero + '-'
  }
  
  let rut = valor.replaceAll(/[^0-9Kk]/g, '')
  
  if (rut.length === 0) return ''
  
  if (rut.length > 9) {
    rut = rut.substring(0, 9)
  }
  
  if (rut.length >= 8) {
    rut = rut.slice(0, 8) + '-' + rut.slice(8)
  }
  
  return rut.toUpperCase()
}

// Función para validar complejidad de contraseña
function validarComplejidadPassword(password) {
  const validaciones = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  }

  return {
    valida: Object.values(validaciones).every(v => v),
    validaciones,
  }
}

export default function RegistrarUsuarioForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roles, setRoles] = useState([])
  const [rutError, setRutError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordValidaciones, setPasswordValidaciones] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  })

  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    password: '',
    roles: [],
  })

  // Cargar roles disponibles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        if (response.ok) {
          const data = await response.json()
          setRoles(data.data || [])
        }
      } catch (err) {
        console.error('Error loading roles:', err)
      }
    }
    loadRoles()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'rut') {
      const rutFormateado = formatearRUT(value)
      setFormData({ ...formData, rut: rutFormateado })
      if (rutFormateado && !validarRUT(rutFormateado)) {
        setRutError('RUT inválido')
      } else {
        setRutError('')
      }
    } else if (name === 'password') {
      setFormData({ ...formData, password: value })
      const validacion = validarComplejidadPassword(value)
      setPasswordValidaciones(validacion.validaciones)
      if (value && !validacion.valida) {
        setPasswordError('La contraseña no cumple con los requisitos')
      } else {
        setPasswordError('')
      }
    } else if (name === 'roles') {
      const selectedRoles = Array.from(e.target.selectedOptions, option => option.value)
      setFormData({ ...formData, roles: selectedRoles })
    } else {
      setFormData({ ...formData, [name]: value })
    }

    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validaciones
    if (!formData.nombre || !formData.email || !formData.password || !formData.rut) {
      setError('RUT, nombre, email y contraseña son requeridos')
      setLoading(false)
      return
    }

    if (!validarRUT(formData.rut)) {
      setError('Por favor ingrese un RUT válido')
      setRutError('RUT inválido')
      setLoading(false)
      return
    }

    const validacionPassword = validarComplejidadPassword(formData.password)
    if (!validacionPassword.valida) {
      setError('La contraseña no cumple con los requisitos de complejidad')
      setPasswordError('La contraseña no cumple con los requisitos')
      setLoading(false)
      return
    }

    if (formData.roles.length === 0) {
      setError('Debe seleccionar al menos un rol')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut: formData.rut || null,
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
          roles: formData.roles,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear el usuario')
        setLoading(false)
        return
      }

      router.push('/dashboard/usuarios')
      router.refresh()
    } catch (err) {
      console.error('Error creating usuario:', err)
      setError('Error de conexión. Por favor intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.alertError}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="rut">
            RUT <span className={styles.required}>*</span>
          </label>
          <input
            id="rut"
            name="rut"
            type="text"
            value={formData.rut}
            onChange={handleChange}
            placeholder="12345678-9"
            className={rutError ? styles.inputError : ''}
            disabled={loading}
            required
          />
          {rutError && <span className={styles.errorText}>{rutError}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="nombre">
            Nombre <span className={styles.required}>*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">
            Email <span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">
            Contraseña <span className={styles.required}>*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {passwordError && <span className={styles.errorText}>{passwordError}</span>}
          <div className={styles.passwordRequirements}>
            <p className={styles.requirementsTitle}>Requisitos de contraseña:</p>
            <ul className={styles.requirementsList}>
              <li className={passwordValidaciones.length ? styles.valid : styles.invalid}>
                <i className={`fas ${passwordValidaciones.length ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                Mínimo 8 caracteres
              </li>
              <li className={passwordValidaciones.uppercase ? styles.valid : styles.invalid}>
                <i className={`fas ${passwordValidaciones.uppercase ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                Al menos una mayúscula
              </li>
              <li className={passwordValidaciones.lowercase ? styles.valid : styles.invalid}>
                <i className={`fas ${passwordValidaciones.lowercase ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                Al menos una minúscula
              </li>
              <li className={passwordValidaciones.number ? styles.valid : styles.invalid}>
                <i className={`fas ${passwordValidaciones.number ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                Al menos un número
              </li>
              <li className={passwordValidaciones.symbol ? styles.valid : styles.invalid}>
                <i className={`fas ${passwordValidaciones.symbol ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                Al menos un símbolo especial
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="roles">
            Roles <span className={styles.required}>*</span>
          </label>
          <select
            id="roles"
            name="roles"
            multiple
            value={formData.roles}
            onChange={handleChange}
            disabled={loading}
            className={styles.selectMultiple}
            size="5"
            required
          >
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name} - {role.description}
              </option>
            ))}
          </select>
          <span className={styles.helpText}>
            Mantén presionada la tecla Ctrl (Cmd en Mac) para seleccionar múltiples roles
          </span>
        </div>
      </div>

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
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Creando...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              Crear Usuario
            </>
          )}
        </button>
      </div>
    </form>
  )
}









