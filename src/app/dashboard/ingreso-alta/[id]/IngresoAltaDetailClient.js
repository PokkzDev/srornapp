'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function IngresoAltaDetailClient({ episodioId, permissions }) {
  const router = useRouter()
  const [episodio, setEpisodio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingAlta, setProcessingAlta] = useState(false)
  const [showAltaForm, setShowAltaForm] = useState(false)
  const [condicionEgreso, setCondicionEgreso] = useState('')

  useEffect(() => {
    loadEpisodio()
  }, [episodioId])

  const loadEpisodio = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/ingreso-alta/${episodioId}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al cargar el episodio')
        setLoading(false)
        return
      }

      const data = await response.json()
      setEpisodio(data.data)
    } catch (err) {
      console.error('Error loading episodio:', err)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleProcesarAlta = async () => {
    if (!window.confirm('¿Está seguro que desea procesar el alta de este episodio?')) {
      return
    }

    setProcessingAlta(true)
    try {
      const response = await fetch(`/api/ingreso-alta/${episodioId}/alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condicionEgreso: condicionEgreso || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.validation && !data.validation.isValid) {
          alert(`No se puede procesar el alta:\n${data.validation.errors.join('\n')}`)
        } else {
          alert(data.error || 'Error al procesar el alta')
        }
        setProcessingAlta(false)
        return
      }

      alert('Alta procesada exitosamente')
      loadEpisodio()
      setShowAltaForm(false)
      setCondicionEgreso('')
    } catch (err) {
      console.error('Error procesando alta:', err)
      alert('Error al conectar con el servidor')
    } finally {
      setProcessingAlta(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    )
  }

  if (error || !episodio) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox}>
          <h2>Error</h2>
          <p>{error || 'Episodio no encontrado'}</p>
          <Link href="/dashboard/ingreso-alta" className={styles.btnSecondary}>
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  const validation = episodio.validation
  const canUpdate = permissions.update
  const canAlta = permissions.alta && episodio.estado === 'INGRESADO'

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <Link href="/dashboard/ingreso-alta" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i> Volver al listado
            </Link>
            <h1>Detalles de Ingreso/Alta</h1>
            <p>Información completa del episodio</p>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {episodio.estado === 'INGRESADO' && validation && !validation.isValid && (
        <div className={styles.validationWarning}>
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            No se puede procesar el alta - Faltan datos requeridos
          </h3>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alta Success */}
      {episodio.estado === 'ALTA' && (
        <div className={styles.successBox}>
          <i className="fas fa-check-circle"></i>
          <span>Este episodio fue dado de alta el {formatDate(episodio.fechaAlta)}</span>
        </div>
      )}

      {/* Episode Details */}
      <div className={styles.detailCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-door-open"></i>
            Información del Episodio
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Estado</label>
              <span
                className={
                  episodio.estado === 'ALTA'
                    ? styles.statusAlta
                    : styles.statusIngresado
                }
              >
                {episodio.estado === 'ALTA' ? 'Alta' : 'Ingresado'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Fecha de Ingreso</label>
              <span>{formatDate(episodio.fechaIngreso)}</span>
            </div>
            {episodio.motivoIngreso && (
              <div className={styles.infoItem}>
                <label>Motivo de Ingreso</label>
                <span>{episodio.motivoIngreso}</span>
              </div>
            )}
            {episodio.hospitalAnterior && (
              <div className={styles.infoItem}>
                <label>Hospital Anterior</label>
                <span className={styles.hospitalBadge}>
                  <i className="fas fa-hospital"></i> {episodio.hospitalAnterior}
                </span>
              </div>
            )}
            {episodio.fechaAlta && (
              <div className={styles.infoItem}>
                <label>Fecha de Alta</label>
                <span>{formatDate(episodio.fechaAlta)}</span>
              </div>
            )}
            {episodio.condicionEgreso && (
              <div className={styles.infoItem}>
                <label>Condición de Egreso</label>
                <span>{episodio.condicionEgreso}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mother Information */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-user-injured"></i>
            Información de la Madre
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>RUT</label>
              <span>{episodio.madre.rut}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Nombres</label>
              <span>{episodio.madre.nombres}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Apellidos</label>
              <span>{episodio.madre.apellidos}</span>
            </div>
          </div>
          <div className={styles.actionLinks}>
            <Link href={`/dashboard/madres/${episodio.madre.id}`} className={styles.linkButton}>
              Ver detalles de la madre
            </Link>
          </div>
        </div>

        {/* Births */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-baby"></i>
            Partos Registrados ({episodio.madre.partos?.length || 0})
          </h2>
          {episodio.madre.partos && episodio.madre.partos.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Tipo</th>
                    <th>Lugar</th>
                    <th>Recién Nacidos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {episodio.madre.partos.map((parto) => (
                    <tr key={parto.id}>
                      <td>{formatDate(parto.fechaHora)}</td>
                      <td>{parto.tipo.replace('_', ' ')}</td>
                      <td>{parto.lugar.replace('_', ' ')}</td>
                      <td>{parto.recienNacidos?.length || 0}</td>
                      <td>
                        <Link
                          href={`/dashboard/partos/${parto.id}`}
                          className={styles.btnView}
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyMessage}>
              No hay partos registrados para esta madre.
            </p>
          )}
        </div>
      </div>

      {/* Alta Form */}
      {canAlta && (
        <div className={styles.altaSection}>
          {!showAltaForm ? (
            <button
              onClick={() => setShowAltaForm(true)}
              className={styles.btnAlta}
              disabled={validation && !validation.isValid}
            >
              <i className="fas fa-door-open"></i>
              Procesar Alta
            </button>
          ) : (
            <div className={styles.altaForm}>
              <h3>Procesar Alta</h3>
              <div className={styles.formGroup}>
                <label htmlFor="condicionEgreso">Condición de Egreso (opcional)</label>
                <textarea
                  id="condicionEgreso"
                  value={condicionEgreso}
                  onChange={(e) => setCondicionEgreso(e.target.value)}
                  placeholder="Describa la condición de egreso..."
                  rows={3}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  onClick={handleProcesarAlta}
                  className={styles.btnPrimary}
                  disabled={processingAlta}
                >
                  {processingAlta ? 'Procesando...' : 'Confirmar Alta'}
                </button>
                <button
                  onClick={() => {
                    setShowAltaForm(false)
                    setCondicionEgreso('')
                  }}
                  className={styles.btnSecondary}
                  disabled={processingAlta}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

