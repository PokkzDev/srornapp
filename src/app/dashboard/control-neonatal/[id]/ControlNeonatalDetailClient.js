'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function ControlNeonatalDetailClient({ controlId, permissions }) {
  const router = useRouter()
  const [control, setControl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const loadControl = async () => {
      try {
        const response = await fetch(`/api/control-neonatal/${controlId}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Error al cargar el control neonatal')
          setLoading(false)
          return
        }

        setControl(data.data)
      } catch (err) {
        console.error('Error loading control:', err)
        setError('Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    loadControl()
  }, [controlId])

  const handleDelete = async () => {
    if (
      !window.confirm(
        '¿Está seguro que desea eliminar este control neonatal? Esta acción no se puede deshacer.'
      )
    ) {
      return
    }

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/control-neonatal/${controlId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al eliminar el control neonatal')
        setDeleteLoading(false)
        return
      }

      router.push('/dashboard/control-neonatal')
    } catch (err) {
      console.error('Error deleting control:', err)
      alert('Error al conectar con el servidor')
      setDeleteLoading(false)
    }
  }

  const formatTipo = (tipo) => {
    const tipos = {
      SIGNOS_VITALES: 'Signos Vitales',
      GLUCEMIA: 'Glucemia',
      ALIMENTACION: 'Alimentación',
      MEDICACION: 'Medicación',
      OTRO: 'Otro',
    }
    return tipos[tipo] || tipo
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderDatosFormateados = (tipo, datos) => {
    if (!datos) return null

    try {
      const datosObj = typeof datos === 'string' ? JSON.parse(datos) : datos

      switch (tipo) {
        case 'SIGNOS_VITALES':
          return (
            <>
              {datosObj.temp !== undefined && datosObj.temp !== null && (
                <div className={styles.infoItem}>
                  <label>Temperatura</label>
                  <span>{datosObj.temp} °C</span>
                </div>
              )}
              {datosObj.fc !== undefined && datosObj.fc !== null && (
                <div className={styles.infoItem}>
                  <label>Frecuencia Cardíaca</label>
                  <span>{datosObj.fc} lpm</span>
                </div>
              )}
              {datosObj.fr !== undefined && datosObj.fr !== null && (
                <div className={styles.infoItem}>
                  <label>Frecuencia Respiratoria</label>
                  <span>{datosObj.fr} rpm</span>
                </div>
              )}
              {datosObj.spo2 !== undefined && datosObj.spo2 !== null && (
                <div className={styles.infoItem}>
                  <label>Saturación O2</label>
                  <span>{datosObj.spo2}%</span>
                </div>
              )}
            </>
          )

        case 'GLUCEMIA':
          return (
            <>
              {datosObj.glucemia !== undefined && datosObj.glucemia !== null && (
                <div className={styles.infoItem}>
                  <label>Glucemia</label>
                  <span>{datosObj.glucemia} mg/dL</span>
                </div>
              )}
            </>
          )

        case 'ALIMENTACION':
          return (
            <>
              {datosObj.tipo !== undefined && datosObj.tipo !== null && (
                <div className={styles.infoItem}>
                  <label>Tipo de Alimentación</label>
                  <span>{datosObj.tipo}</span>
                </div>
              )}
              {datosObj.cantidad !== undefined && datosObj.cantidad !== null && (
                <div className={styles.infoItem}>
                  <label>Cantidad</label>
                  <span>{datosObj.cantidad} {datosObj.unidad || 'ml'}</span>
                </div>
              )}
              {datosObj.unidad && datosObj.cantidad === undefined && (
                <div className={styles.infoItem}>
                  <label>Unidad</label>
                  <span>{datosObj.unidad}</span>
                </div>
              )}
            </>
          )

        case 'MEDICACION':
          return (
            <>
              {datosObj.medicamento !== undefined && datosObj.medicamento !== null && (
                <div className={styles.infoItem}>
                  <label>Medicamento</label>
                  <span>{datosObj.medicamento}</span>
                </div>
              )}
              {datosObj.dosis !== undefined && datosObj.dosis !== null && (
                <div className={styles.infoItem}>
                  <label>Dosis</label>
                  <span>{datosObj.dosis}</span>
                </div>
              )}
              {datosObj.via !== undefined && datosObj.via !== null && (
                <div className={styles.infoItem}>
                  <label>Vía de Administración</label>
                  <span>{datosObj.via}</span>
                </div>
              )}
            </>
          )

        case 'OTRO':
        default:
          // Para OTRO o tipos desconocidos, mostrar todos los campos genéricamente
          return Object.entries(datosObj).map(([key, value]) => (
            <div key={key} className={styles.infoItem}>
              <label>{key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ')}</label>
              <span>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))
      }
    } catch (error) {
      // Si hay error al parsear, mostrar como texto
      return (
        <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
          <label>Datos</label>
          <span>{String(datos)}</span>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Cargando control neonatal...</span>
        </div>
      </div>
    )
  }

  if (error || !control) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox}>
          <h2>{error || 'Control no encontrado'}</h2>
          <p>El control neonatal solicitado no existe en el sistema.</p>
          <Link href="/dashboard/control-neonatal" className={styles.btnSecondary}>
            Volver a Controles Neonatales
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <Link href="/dashboard/control-neonatal" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i> Volver al listado
            </Link>
            <h1>Detalles del Control Neonatal</h1>
            <p>Información completa del control registrado</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {permissions.delete && (
              <button
                onClick={handleDelete}
                className={styles.btnDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Eliminar
                  </>
                )}
              </button>
            )}
            {permissions.update && (
              <Link
                href={`/dashboard/control-neonatal/${controlId}/editar`}
                className={styles.btnEdit}
              >
                <i className="fas fa-edit"></i>
                Editar Control
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-heartbeat"></i>
            Información del Control
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Fecha y Hora</label>
              <span>{formatFecha(control.fechaHora)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Tipo de Control</label>
              <span className={styles.badge}>{formatTipo(control.tipo)}</span>
            </div>
            {control.enfermera && (
              <div className={styles.infoItem}>
                <label>Enfermera</label>
                <span>{control.enfermera.nombre}</span>
              </div>
            )}
            {control.enfermera?.email && (
              <div className={styles.infoItem}>
                <label>Email Enfermera</label>
                <span>{control.enfermera.email}</span>
              </div>
            )}
          </div>
        </div>

        {control.datos && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-database"></i>
              Datos del Control
            </h2>
            <div className={styles.infoGrid}>
              {renderDatosFormateados(control.tipo, control.datos)}
            </div>
          </div>
        )}

        {control.observaciones && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-notes-medical"></i>
              Observaciones
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <label>Observaciones</label>
                <span>{control.observaciones}</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-baby"></i>
            Información del Recién Nacido
          </h2>
          <div className={styles.infoGrid}>
            {control.rn?.parto?.madre && (
              <>
                <div className={styles.infoItem}>
                  <label>Madre</label>
                  <span>
                    {control.rn.parto.madre.nombres} {control.rn.parto.madre.apellidos}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>RUT Madre</label>
                  <span>{control.rn.parto.madre.rut}</span>
                </div>
                {control.rn.parto.madre.edad && (
                  <div className={styles.infoItem}>
                    <label>Edad Madre</label>
                    <span>{control.rn.parto.madre.edad} años</span>
                  </div>
                )}
              </>
            )}
            {control.rn?.parto?.fechaHora && (
              <div className={styles.infoItem}>
                <label>Fecha/Hora Parto</label>
                <span>{formatFecha(control.rn.parto.fechaHora)}</span>
              </div>
            )}
            <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <Link
                href={`/dashboard/recien-nacidos/${control.rnId}`}
                className={styles.btnLink}
              >
                <i className="fas fa-eye"></i>
                Ver Detalles del Recién Nacido
              </Link>
            </div>
          </div>
        </div>

        {control.episodioUrni && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-hospital"></i>
              Episodio URNI Asociado
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Estado</label>
                <span className={styles.badge}>
                  {control.episodioUrni.estado === 'INGRESADO' ? 'Ingresado' : 'Alta'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Fecha Ingreso</label>
                <span>{formatFecha(control.episodioUrni.fechaHoraIngreso)}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <Link
                  href={`/dashboard/urni/${control.episodioUrni.id}`}
                  className={styles.btnLink}
                >
                  <i className="fas fa-eye"></i>
                  Ver Detalles del Episodio URNI
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-clock"></i>
            Información del Sistema
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Fecha de Registro</label>
              <span>{formatFecha(control.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Última Actualización</label>
              <span>{formatFecha(control.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

