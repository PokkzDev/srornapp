'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function URNIEpisodioDetailClient({ episodioId, permissions }) {
  const router = useRouter()
  const [episodio, setEpisodio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [procesandoAlta, setProcesandoAlta] = useState(false)
  const [showAltaForm, setShowAltaForm] = useState(false)
  const [condicionEgreso, setCondicionEgreso] = useState('')

  useEffect(() => {
    loadEpisodio()
  }, [episodioId])

  const loadEpisodio = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/urni/episodio/${episodioId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cargar el episodio')
      }

      const data = await response.json()
      setEpisodio(data.data)
      
      // Debug: verificar estado y permisos
      if (data.data) {
        console.log('Episodio cargado:', {
          id: data.data.id,
          estado: data.data.estado,
          tienePermisoAlta: permissions?.alta,
          permisos: permissions
        })
      }
    } catch (err) {
      console.error('Error loading episodio:', err)
      setError(err.message || 'Error al cargar el episodio')
    } finally {
      setLoading(false)
    }
  }

  const handleProcesarAlta = async () => {
    // Validar estado antes de proceder
    if (!episodio || episodio.estado !== 'INGRESADO') {
      alert(`No se puede procesar el alta. El episodio está en estado: ${episodio?.estado || 'desconocido'}`)
      return
    }

    if (!window.confirm('¿Está seguro que desea procesar el alta de este episodio URNI?')) {
      return
    }

    setProcesandoAlta(true)
    try {
      const response = await fetch(`/api/urni/episodio/${episodioId}/alta`, {
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
        console.error('Error al procesar alta:', {
          status: response.status,
          error: data.error,
          episodioEstado: episodio?.estado
        })
        alert(data.error || 'Error al procesar el alta')
        setProcesandoAlta(false)
        return
      }

      alert('Alta procesada exitosamente')
      setShowAltaForm(false)
      setCondicionEgreso('')
      loadEpisodio()
    } catch (err) {
      console.error('Error procesando alta:', err)
      alert('Error al conectar con el servidor')
    } finally {
      setProcesandoAlta(false)
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

  const formatServicioUnidad = (servicio) => {
    if (!servicio) return '-'
    const servicios = {
      URNI: 'URNI',
      UCIN: 'UCIN',
      NEONATOLOGIA: 'Neonatología',
    }
    return servicios[servicio] || servicio
  }

  const formatEstado = (estado) => {
    const estados = {
      INGRESADO: 'Ingresado',
      ALTA: 'Alta',
    }
    return estados[estado] || estado
  }

  const formatSexo = (sexo) => {
    const sexos = {
      M: 'Masculino',
      F: 'Femenino',
      I: 'Indeterminado',
    }
    return sexos[sexo] || sexo
  }

  const renderDatosControl = (tipo, datos) => {
    if (!datos) return null

    try {
      const datosObj = typeof datos === 'string' ? JSON.parse(datos) : datos
      const partes = []

      switch (tipo) {
        case 'SIGNOS_VITALES':
          if (datosObj.temp !== undefined && datosObj.temp !== null) {
            partes.push(`Temp: ${datosObj.temp}°C`)
          }
          if (datosObj.fc !== undefined && datosObj.fc !== null) {
            partes.push(`FC: ${datosObj.fc} lpm`)
          }
          if (datosObj.fr !== undefined && datosObj.fr !== null) {
            partes.push(`FR: ${datosObj.fr} rpm`)
          }
          if (datosObj.spo2 !== undefined && datosObj.spo2 !== null) {
            partes.push(`SpO2: ${datosObj.spo2}%`)
          }
          return partes.length > 0 ? partes.join(', ') : null

        case 'GLUCEMIA':
          if (datosObj.glucemia !== undefined && datosObj.glucemia !== null) {
            return `Glucemia: ${datosObj.glucemia} mg/dL`
          }
          return null

        case 'ALIMENTACION':
          const alimentacionParts = []
          if (datosObj.tipo !== undefined && datosObj.tipo !== null) {
            alimentacionParts.push(`Tipo: ${datosObj.tipo}`)
          }
          if (datosObj.cantidad !== undefined && datosObj.cantidad !== null) {
            alimentacionParts.push(`Cantidad: ${datosObj.cantidad} ${datosObj.unidad || 'ml'}`)
          }
          return alimentacionParts.length > 0 ? alimentacionParts.join(' | ') : null

        case 'MEDICACION':
          const medicacionParts = []
          if (datosObj.medicamento !== undefined && datosObj.medicamento !== null) {
            medicacionParts.push(`Medicamento: ${datosObj.medicamento}`)
          }
          if (datosObj.dosis !== undefined && datosObj.dosis !== null) {
            medicacionParts.push(`Dosis: ${datosObj.dosis}`)
          }
          if (datosObj.via !== undefined && datosObj.via !== null) {
            medicacionParts.push(`Vía: ${datosObj.via}`)
          }
          return medicacionParts.length > 0 ? medicacionParts.join(' | ') : null

        case 'OTRO':
        default:
          // Para OTRO, mostrar los primeros campos de forma compacta
          const otrosParts = Object.entries(datosObj).slice(0, 3).map(([key, value]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
            return `${label}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
          })
          return otrosParts.length > 0 ? otrosParts.join(' | ') : null
      }
    } catch (error) {
      return String(datos)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (error) {
    return (
      <div className={styles.errorBox}>
        <h2>Error</h2>
        <p>{error}</p>
        <Link href="/dashboard/urni" className={styles.btnSecondary}>
          Volver al listado
        </Link>
      </div>
    )
  }

  if (!episodio) {
    return (
      <div className={styles.errorBox}>
        <h2>Episodio no encontrado</h2>
        <p>El episodio URNI solicitado no existe.</p>
        <Link href="/dashboard/urni" className={styles.btnSecondary}>
          Volver al listado
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <Link href="/dashboard/urni" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i> Volver al listado
            </Link>
            <h1>Detalle del Episodio URNI</h1>
            <p>Información completa del episodio de ingreso a URNI</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {episodio.estado === 'INGRESADO' && permissions.update && (
              <Link
                href={`/dashboard/urni/${episodioId}/editar`}
                className={styles.btnEdit}
              >
                <i className="fas fa-edit"></i>
                Editar
              </Link>
            )}
            {episodio.estado === 'INGRESADO' && permissions.alta && (
              <button
                onClick={() => setShowAltaForm(true)}
                className={styles.btnAlta}
              >
                <i className="fas fa-door-open"></i>
                Procesar Alta
              </button>
            )}
            {episodio.estado === 'INGRESADO' && !permissions.alta && (
              <span style={{ 
                color: '#856404', 
                backgroundColor: '#fff3cd', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px',
                fontSize: '0.875rem',
                border: '1px solid #ffc107'
              }}>
                <i className="fas fa-info-circle"></i> No tiene permisos para procesar altas
              </span>
            )}
          </div>
        </div>
      </div>

      {showAltaForm && (
        <div className={styles.altaForm}>
          <h3>Procesar Alta URNI</h3>
          <div className={styles.formGroup}>
            <label htmlFor="condicionEgreso">Condición de Egreso</label>
            <textarea
              id="condicionEgreso"
              value={condicionEgreso}
              onChange={(e) => setCondicionEgreso(e.target.value)}
              rows={3}
              maxLength={300}
              className={styles.textarea}
              placeholder="Describa la condición de egreso..."
            />
            <small className={styles.helpText}>
              {condicionEgreso.length}/300 caracteres
            </small>
          </div>
          <div className={styles.formActions}>
            <button
              onClick={() => {
                setShowAltaForm(false)
                setCondicionEgreso('')
              }}
              className={styles.btnSecondary}
              disabled={procesandoAlta}
            >
              Cancelar
            </button>
            <button
              onClick={handleProcesarAlta}
              className={styles.btnPrimary}
              disabled={procesandoAlta}
            >
              {procesandoAlta ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Procesando...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Confirmar Alta
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className={styles.detailCard}>
        {/* Información del Recién Nacido */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-baby"></i>
            Información del Recién Nacido
          </h2>
          <div className={styles.infoGrid}>
            {episodio.rn && (
              <>
                <div className={styles.infoItem}>
                  <label>Sexo</label>
                  <span className={styles.badge}>{formatSexo(episodio.rn.sexo)}</span>
                </div>
                {episodio.rn.pesoNacimientoGramos && (
                  <div className={styles.infoItem}>
                    <label>Peso</label>
                    <span>{episodio.rn.pesoNacimientoGramos} g</span>
                  </div>
                )}
                {episodio.rn.tallaCm && (
                  <div className={styles.infoItem}>
                    <label>Talla</label>
                    <span>{episodio.rn.tallaCm} cm</span>
                  </div>
                )}
                {episodio.rn.apgar1Min !== null && episodio.rn.apgar1Min !== undefined && (
                  <div className={styles.infoItem}>
                    <label>Apgar 1'</label>
                    <span>{episodio.rn.apgar1Min}</span>
                  </div>
                )}
                {episodio.rn.apgar5Min !== null && episodio.rn.apgar5Min !== undefined && (
                  <div className={styles.infoItem}>
                    <label>Apgar 5'</label>
                    <span>{episodio.rn.apgar5Min}</span>
                  </div>
                )}
                {episodio.rn.parto?.madre && (
                  <>
                    <div className={styles.infoItem}>
                      <label>Madre</label>
                      <span>
                        {episodio.rn.parto.madre.nombres} {episodio.rn.parto.madre.apellidos}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>RUT Madre</label>
                      <span>{episodio.rn.parto.madre.rut}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Fecha Parto</label>
                      <span>{formatDate(episodio.rn.parto.fechaHora)}</span>
                    </div>
                  </>
                )}
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <Link
                    href={`/dashboard/recien-nacidos/${episodio.rn.id}`}
                    className={styles.btnLink}
                  >
                    <i className="fas fa-eye"></i>
                    Ver Detalle del Recién Nacido
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Información del Episodio */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-hospital"></i>
            Información del Episodio URNI
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Estado</label>
              <span className={styles.badge} style={{ backgroundColor: episodio.estado === 'INGRESADO' ? '#ffc107' : '#28a745' }}>
                {formatEstado(episodio.estado)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Fecha/Hora Ingreso</label>
              <span>{formatDate(episodio.fechaHoraIngreso)}</span>
            </div>
            {episodio.fechaHoraAlta && (
              <div className={styles.infoItem}>
                <label>Fecha/Hora Alta</label>
                <span>{formatDate(episodio.fechaHoraAlta)}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <label>Servicio/Unidad</label>
              <span>{formatServicioUnidad(episodio.servicioUnidad)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Responsable Clínico</label>
              <span>
                {episodio.responsableClinico ? (
                  episodio.responsableClinico.nombre
                ) : (
                  <span style={{ color: '#999' }}>Sin asignar</span>
                )}
              </span>
            </div>
            {episodio.motivoIngreso && (
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <label>Motivo de Ingreso</label>
                <span>{episodio.motivoIngreso}</span>
              </div>
            )}
            {episodio.condicionEgreso && (
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <label>Condición de Egreso</label>
                <span>{episodio.condicionEgreso}</span>
              </div>
            )}
          </div>
        </div>

        {/* Atenciones URNI */}
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-stethoscope"></i>
              Atenciones URNI ({episodio.atenciones?.length || 0})
            </h2>
            {episodio.estado === 'INGRESADO' && permissions.createAtencion && (
              <Link
                href={`/dashboard/atencion-urn?episodioId=${episodioId}&rnId=${episodio.rnId}`}
                className={styles.btnSmall}
              >
                <i className="fas fa-plus"></i>
                Nueva Atención
              </Link>
            )}
          </div>
          {episodio.atenciones && episodio.atenciones.length > 0 ? (
            <div className={styles.list}>
              {episodio.atenciones.map((atencion) => (
                <div key={atencion.id} className={styles.listItem}>
                  <div className={styles.listItemHeader}>
                    <div>
                      <strong>{formatDate(atencion.fechaHora)}</strong>
                      {atencion.medico && (
                        <small> - {atencion.medico.nombre}</small>
                      )}
                    </div>
                  </div>
                  {atencion.diagnostico && (
                    <div className={styles.listItemContent}>
                      <label>Diagnóstico:</label>
                      <span>{atencion.diagnostico}</span>
                    </div>
                  )}
                  {atencion.indicaciones && (
                    <div className={styles.listItemContent}>
                      <label>Indicaciones:</label>
                      <span>{atencion.indicaciones}</span>
                    </div>
                  )}
                  {atencion.evolucion && (
                    <div className={styles.listItemContent}>
                      <label>Evolución:</label>
                      <span>{atencion.evolucion}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No hay atenciones registradas</p>
          )}
        </div>

        {/* Controles Neonatales */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-heartbeat"></i>
            Controles Neonatales ({episodio.controles?.length || 0})
          </h2>
          {episodio.controles && episodio.controles.length > 0 ? (
            <div className={styles.list}>
              {episodio.controles.map((control) => (
                <div key={control.id} className={styles.listItem}>
                  <div className={styles.listItemHeader}>
                    <div>
                      <strong>{formatDate(control.fechaHora)}</strong>
                      {control.enfermera && (
                        <small> - {control.enfermera.nombre}</small>
                      )}
                    </div>
                    <span className={styles.badgeSmall}>
                      {control.tipo === 'SIGNOS_VITALES' ? 'Signos Vitales' :
                       control.tipo === 'GLUCEMIA' ? 'Glucemia' :
                       control.tipo === 'ALIMENTACION' ? 'Alimentación' :
                       control.tipo === 'MEDICACION' ? 'Medicación' :
                       'Otro'}
                    </span>
                  </div>
                  {control.observaciones && (
                    <div className={styles.listItemContent}>
                      <label>Observaciones:</label>
                      <span>{control.observaciones}</span>
                    </div>
                  )}
                  {control.datos && renderDatosControl(control.tipo, control.datos) && (
                    <div className={styles.listItemContent}>
                      <label>Datos:</label>
                      <span>{renderDatosControl(control.tipo, control.datos)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No hay controles neonatales registrados</p>
          )}
        </div>

        {/* Información del Sistema */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-clock"></i>
            Información del Sistema
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Fecha de Registro</label>
              <span>{formatDate(episodio.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Última Actualización</label>
              <span>{formatDate(episodio.updatedAt)}</span>
            </div>
            {episodio.createdBy && (
              <div className={styles.infoItem}>
                <label>Registrado por</label>
                <span>{episodio.createdBy.nombre}</span>
              </div>
            )}
            {episodio.updatedBy && (
              <div className={styles.infoItem}>
                <label>Última modificación por</label>
                <span>{episodio.updatedBy.nombre}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

