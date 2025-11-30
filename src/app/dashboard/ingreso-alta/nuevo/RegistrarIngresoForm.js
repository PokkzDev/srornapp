'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import DateTimePicker from '@/components/DateTimePicker'

export default function RegistrarIngresoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchingMadre, setSearchingMadre] = useState(false)
  const [madres, setMadres] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMadre, setSelectedMadre] = useState(null)
  const [showCreateMadre, setShowCreateMadre] = useState(false)

  const [formData, setFormData] = useState({
    madreId: '',
    fechaIngreso: new Date(),
    motivoIngreso: '',
    hospitalAnterior: '',
    tratadaEnOtroHospital: false,
  })

  const [madreFormData, setMadreFormData] = useState({
    rut: '',
    nombres: '',
    apellidos: '',
    edad: '',
    fechaNacimiento: '',
    direccion: '',
    telefono: '',
    fichaClinica: '',
  })

  // Search for mothers
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchMadres()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setMadres([])
    }
  }, [searchTerm])

  const searchMadres = async () => {
    setSearchingMadre(true)
    try {
      const response = await fetch(`/api/madres?search=${encodeURIComponent(searchTerm)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setMadres(data.data || [])
      }
    } catch (err) {
      console.error('Error searching madres:', err)
    } finally {
      setSearchingMadre(false)
    }
  }

  const handleSelectMadre = (madre) => {
    setSelectedMadre(madre)
    setFormData({ ...formData, madreId: madre.id })
    setSearchTerm('')
    setMadres([])
  }

  const handleCreateMadre = async () => {
    // Validate required fields
    if (!madreFormData.rut || !madreFormData.nombres || !madreFormData.apellidos) {
      setError('RUT, nombres y apellidos son requeridos para crear una madre')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/madres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(madreFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear la madre')
        setLoading(false)
        return
      }

      // Select the newly created mother
      handleSelectMadre(data.data)
      setShowCreateMadre(false)
      setMadreFormData({
        rut: '',
        nombres: '',
        apellidos: '',
        edad: '',
        fechaNacimiento: '',
        direccion: '',
        telefono: '',
        fichaClinica: '',
      })
    } catch (err) {
      console.error('Error creating madre:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.madreId) {
      setError('Debe seleccionar o crear una madre')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ingreso-alta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          madreId: formData.madreId,
          fechaIngreso: formData.fechaIngreso ? formData.fechaIngreso.toISOString() : null,
          motivoIngreso: formData.motivoIngreso || null,
          hospitalAnterior: formData.tratadaEnOtroHospital ? formData.hospitalAnterior || null : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al registrar el ingreso')
        setLoading(false)
        return
      }

      router.push(`/dashboard/ingreso-alta/${data.data.id}`)
    } catch (err) {
      console.error('Error creating ingreso:', err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <h1>Registrar Nuevo Ingreso</h1>
        <p>Registre el ingreso de una madre cuando se notifica su embarazo</p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Mother Selection */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Seleccionar Madre</h2>

        {selectedMadre ? (
          <div className={styles.selectedMadre}>
            <div className={styles.selectedMadreInfo}>
              <strong>{selectedMadre.nombres} {selectedMadre.apellidos}</strong>
              <span>RUT: {selectedMadre.rut}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMadre(null)
                setFormData({ ...formData, madreId: '' })
              }}
              className={styles.btnChange}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Buscar madre por RUT o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                aria-label="Buscar madre"
              />
              {searchingMadre && <i className="fas fa-spinner fa-spin"></i>}
            </div>

            {madres.length > 0 && (
              <div className={styles.madresList}>
                {madres.map((madre) => (
                  <div
                    key={madre.id}
                    onClick={() => handleSelectMadre(madre)}
                    className={styles.madreItem}
                  >
                    <div>
                      <strong>{madre.nombres} {madre.apellidos}</strong>
                      <span>RUT: {madre.rut}</span>
                    </div>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                ))}
              </div>
            )}

            {!showCreateMadre && (
              <button
                type="button"
                onClick={() => setShowCreateMadre(true)}
                className={styles.btnCreateMadre}
              >
                <i className="fas fa-plus"></i>
                Crear Nueva Madre
              </button>
            )}

            {showCreateMadre && (
              <div className={styles.createMadreForm}>
                <h3>Crear Nueva Madre</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="rut">RUT *</label>
                    <input
                      id="rut"
                      type="text"
                      value={madreFormData.rut}
                      onChange={(e) => setMadreFormData({ ...madreFormData, rut: e.target.value })}
                      placeholder="12345678-9"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="nombres">Nombres *</label>
                    <input
                      id="nombres"
                      type="text"
                      value={madreFormData.nombres}
                      onChange={(e) => setMadreFormData({ ...madreFormData, nombres: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="apellidos">Apellidos *</label>
                    <input
                      id="apellidos"
                      type="text"
                      value={madreFormData.apellidos}
                      onChange={(e) => setMadreFormData({ ...madreFormData, apellidos: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edad">Edad</label>
                    <input
                      id="edad"
                      type="number"
                      value={madreFormData.edad}
                      onChange={(e) => setMadreFormData({ ...madreFormData, edad: e.target.value })}
                      min="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      type="tel"
                      value={madreFormData.telefono}
                      onChange={(e) => setMadreFormData({ ...madreFormData, telefono: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="direccion">Dirección</label>
                    <input
                      id="direccion"
                      type="text"
                      value={madreFormData.direccion}
                      onChange={(e) => setMadreFormData({ ...madreFormData, direccion: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={handleCreateMadre}
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    Crear Madre
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateMadre(false)
                      setMadreFormData({
                        rut: '',
                        nombres: '',
                        apellidos: '',
                        edad: '',
                        fechaNacimiento: '',
                        direccion: '',
                        telefono: '',
                        fichaClinica: '',
                      })
                    }}
                    className={styles.btnSecondary}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admission Details */}
      {selectedMadre && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Datos del Ingreso</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="fechaIngreso">Fecha y Hora de Ingreso *</label>
                <DateTimePicker
                  id="fechaIngreso"
                  selected={formData.fechaIngreso}
                  onChange={(date) => setFormData({ ...formData, fechaIngreso: date })}
                  maxDate={new Date()}
                  required
                  placeholderText="Seleccione fecha y hora de ingreso"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="motivoIngreso">Motivo de Ingreso</label>
                <textarea
                  id="motivoIngreso"
                  value={formData.motivoIngreso}
                  onChange={(e) => setFormData({ ...formData, motivoIngreso: e.target.value })}
                  rows={3}
                  placeholder="Describa el motivo del ingreso..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.tratadaEnOtroHospital}
                    onChange={(e) =>
                      setFormData({ ...formData, tratadaEnOtroHospital: e.target.checked })
                    }
                  />
                  <span>Fue tratada en otro hospital</span>
                </label>
              </div>

              {formData.tratadaEnOtroHospital && (
                <div className={styles.formGroup}>
                  <label htmlFor="hospitalAnterior">Nombre del Hospital Anterior</label>
                  <input
                    id="hospitalAnterior"
                    type="text"
                    value={formData.hospitalAnterior}
                    onChange={(e) => setFormData({ ...formData, hospitalAnterior: e.target.value })}
                    placeholder="Ingrese el nombre del hospital..."
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Ingreso'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </form>
  )
}

