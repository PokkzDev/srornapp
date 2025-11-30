'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'
import { validarRUT, formatearRUT, esEmail } from '@/lib/rut'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const [rutError, setRutError] = useState('')
  const [testUsers, setTestUsers] = useState([])

  useEffect(() => {
    // Check if we're in development mode based on NEXT_PUBLIC_ENVIRONMENT from .env
    const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
    setIsDev(isDevelopment)
    
    // Cargar usuarios de prueba solo en modo desarrollo
    if (isDevelopment) {
      fetchTestUsers()
    }
  }, [])

  const fetchTestUsers = async () => {
    try {
      const response = await fetch('/api/auth/dev-users')
      if (response.ok) {
        const data = await response.json()
        setTestUsers(data.users || [])
      }
    } catch {
      // Silenciar errores en producción
      console.error('Error al cargar usuarios de prueba')
    }
  }

  const handleIdentifierChange = (value) => {
    setRutError('')
    
    // Si parece ser un RUT (contiene números y posiblemente guion), formatearlo
    if (!esEmail(value) && /[\d-]/.test(value)) {
      const formatted = formatearRUT(value)
      setIdentifier(formatted)
      
      // Validar RUT si tiene formato completo
      if (formatted.includes('-') && formatted.length >= 9) {
        if (!validarRUT(formatted)) {
          setRutError('RUT inválido')
        }
      }
    } else {
      setIdentifier(value)
    }
  }

  const handleLogin = async (userIdentifier, userPassword) => {
    setError('')
    setRutError('')
    setIsLoading(true)

    // Validar RUT si parece ser uno
    if (!esEmail(userIdentifier.trim())) {
      let rutToValidate = userIdentifier.trim()
      
      // Formatear si no tiene guion
      if (!rutToValidate.includes('-')) {
        rutToValidate = formatearRUT(rutToValidate)
      }
      
      if (rutToValidate.includes('-') && !validarRUT(rutToValidate)) {
        setRutError('RUT inválido. Formato esperado: 12345678-9')
        setIsLoading(false)
        return
      }
    }

    try {
      // Determinar si enviar como email o rut
      const isEmailInput = esEmail(userIdentifier.trim())
      const body = isEmailInput
        ? { email: userIdentifier.trim(), password: userPassword }
        : { rut: userIdentifier.trim(), password: userPassword }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setIsLoading(false)
        return
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Error de conexión. Por favor intenta nuevamente.')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleLogin(identifier, password)
  }

  const handleDevLogin = async (user) => {
    // El servidor manejará la autenticación de desarrollo
    setError('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Image
            src="/logo.png"
            alt="SRORN Logo"
            width={120}
            height={120}
            className={styles.logo}
            priority
          />
          <h1>Sistema SRORN</h1>
          <p className={styles.subtitle}>Ingrese sus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="identifier">Correo electrónico o RUT</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              required
              autoComplete="username"
              disabled={isLoading}
              placeholder="usuario@srorn.cl o 12345678-9"
            />
            {rutError && (
              <div className={styles.error} style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                {rutError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.button}`}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {isDev && testUsers.length > 0 && (
          <div className={styles.devSection}>
            <div className={styles.devDivider}>
              <span>Desarrollo</span>
            </div>
            <p className={styles.devNote}>
              Acceso rápido con cuentas de prueba
            </p>
            <div className={styles.devButtons}>
              {testUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleDevLogin(user)}
                  className={`btn btn-secondary ${styles.devButton}`}
                  disabled={isLoading}
                >
                  {user.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
