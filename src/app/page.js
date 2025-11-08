'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

// Test users from seed.js
const TEST_USERS = [
  {
    email: 'matrona@srorn.cl',
    nombre: 'María González',
    role: 'Matrona',
  },
  {
    email: 'medico@srorn.cl',
    nombre: 'Dr. Carlos Pérez',
    role: 'Médico',
  },
  {
    email: 'enfermera@srorn.cl',
    nombre: 'Ana Martínez',
    role: 'Enfermera',
  },
  {
    email: 'administrativo@srorn.cl',
    nombre: 'Roberto Silva',
    role: 'Administrativo',
  },
  {
    email: 'jefatura@srorn.cl',
    nombre: 'Dra. Patricia López',
    role: 'Jefatura',
  },
]

const DEFAULT_PASSWORD = 'Asdf1234' // Password from seed.js

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Check if we're in development mode
    // Show desarrollo accounts for localhost, 127.0.0.1, or ngrok tunnels
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
      const isNgrok = hostname.endsWith('.ngrok.io') || hostname.endsWith('.ngrok-free.app')
      const isCloudflare = hostname.endsWith('.trycloudflare.com')
      const isLocaltunnel = hostname.endsWith('.loca.lt')
      
      setIsDev(isLocalhost || isNgrok || isCloudflare || isLocaltunnel)
    }
  }, [])

  const handleLogin = async (userEmail, userPassword) => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
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
    await handleLogin(email, password)
  }

  const handleDevLogin = async (userEmail) => {
    await handleLogin(userEmail, DEFAULT_PASSWORD)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
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
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              placeholder="usuario@srorn.cl"
            />
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

        {isDev && (
          <div className={styles.devSection}>
            <div className={styles.devDivider}>
              <span>Desarrollo</span>
            </div>
            <p className={styles.devNote}>
              Acceso rápido con cuentas de prueba
            </p>
            <div className={styles.devButtons}>
              {TEST_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleDevLogin(user.email)}
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
