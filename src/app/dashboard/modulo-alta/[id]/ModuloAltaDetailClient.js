'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import styles from './page.module.css'

export default function ModuloAltaDetailClient({ episodioId }) {
  const router = useRouter()
  const [episodio, setEpisodio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aprovingAlta, setAprovingAlta] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [condicionEgreso, setCondicionEgreso] = useState('')
  
  // Modal states
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Aceptar',
    showCancel: false,
  })

  useEffect(() => {
    loadEpisodio()
  }, [episodioId])

  const loadEpisodio = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch informe from API
      const informeResponse = await fetch(`/api/informe-alta/episodio/${episodioId}`)
      const informeResult = await informeResponse.json()

      if (!informeResponse.ok) {
        throw new Error(informeResult.error || 'Error al cargar el informe')
      }

      // Format data to match component structure
      const informeData = informeResult.data
      setEpisodio({
        id: informeData.episodio.id,
        fechaIngreso: informeData.episodio.fechaIngreso,
        estado: informeData.episodio.estado,
        motivoIngreso: informeData.episodio.motivoIngreso,
        fechaAlta: informeData.episodio.fechaAlta,
        condicionEgreso: informeData.episodio.condicionEgreso,
        madre: informeData.madre,
        informe: {
          id: informeData.id,
          fechaGeneracion: informeData.fechaGeneracion,
          generadoPor: informeData.generadoPor,
          formato: informeData.formato,
          parto: informeData.parto,
          recienNacidos: informeData.recienNacidos,
        },
      })
    } catch (err) {
      console.error('Error loading episodio:', err)
      setError(err.message || 'Error al cargar el informe')
    } finally {
      setLoading(false)
    }
  }

  const showModal = (type, title, message, onConfirm = null, confirmText = 'Aceptar', showCancel = false) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel,
    })
  }

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'Aceptar',
      showCancel: false,
    })
  }

  const handleExport = async (formato) => {
    if (!episodio?.informe?.id) {
      showModal('warning', 'Informe no disponible', 'No hay informe disponible para exportar')
      return
    }

    try {
      const response = await fetch(`/api/informe-alta/${episodio.informe.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formato }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al exportar el informe')
      }

      // Show modal for mock export
      showModal(
        'info',
        'Exportación',
        `Función de exportación en ${formato} aún no implementada.\n\nInforme: ${result.data.madreNombre}\nFormato: ${formato}`
      )
    } catch (err) {
      console.error('Error exporting informe:', err)
      showModal('error', 'Error al exportar', err.message || 'Error al exportar el informe')
    }
  }

  const handleConfirmAprobarAlta = async () => {
    closeModal()
    setAprovingAlta(true)
    try {
      const response = await fetch(`/api/modulo-alta/${episodioId}/aprobar`, {
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
        showModal('error', 'Error al aprobar', data.error || 'Error al aprobar el alta')
        setAprovingAlta(false)
        return
      }

      // Recargar los datos del episodio para reflejar el cambio de estado
      await loadEpisodio()
      
      // Cerrar el formulario de aprobación
      setShowApprovalForm(false)
      setCondicionEgreso('')

      // Mostrar mensaje de éxito
      showModal(
        'success',
        'Alta aprobada',
        'Alta médica aprobada exitosamente',
        () => {
          closeModal()
          router.push('/dashboard/modulo-alta')
        }
      )
    } catch (err) {
      console.error('Error aprobando alta:', err)
      showModal('error', 'Error de conexión', 'Error al conectar con el servidor')
    } finally {
      setAprovingAlta(false)
    }
  }

  const handleAprobarAlta = () => {
    showModal(
      'warning',
      'Confirmar aprobación',
      '¿Está seguro que desea aprobar el alta médica de este paciente?',
      handleConfirmAprobarAlta,
      'Sí, aprobar',
      true
    )
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

  const formatTipoParto = (tipo) => {
    const tipos = {
      'EUTOCICO': 'Eutócico',
      'DISTOCICO': 'Distócico',
      'CESAREA_ELECTIVA': 'Cesárea Electiva',
      'CESAREA_EMERGENCIA': 'Cesárea de Emergencia',
    }
    return tipos[tipo] || tipo
  }

  const formatLugarParto = (lugar) => {
    const lugares = {
      'SALA_PARTO': 'Sala de Parto',
      'PABELLON': 'Pabellón',
      'DOMICILIO': 'Domicilio',
      'OTRO': 'Otro',
    }
    return lugares[lugar] || lugar
  }

  const formatSexo = (sexo) => {
    const sexos = {
      'M': 'Masculino',
      'F': 'Femenino',
      'I': 'Indeterminado',
    }
    return sexos[sexo] || sexo
  }

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          Cargando...
        </div>
      </div>
    )
  }

  if (error || !episodio) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox}>
          <h2>Error</h2>
          <p>{error || 'Episodio no encontrado'}</p>
          <Link href="/dashboard/modulo-alta" className={styles.btnSecondary}>
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  const canApprove = episodio.estado === 'INGRESADO' && episodio.informe

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <Link href="/dashboard/modulo-alta" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i> Volver al listado
            </Link>
            <h1>Revisar Informe y Aprobar Alta</h1>
            <p>Informe generado por matrona - Revisión médica</p>
          </div>
        </div>
      </div>

      {/* Informe Document Section */}
      {episodio.informe && (
        <div className={styles.detailCard}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-file-pdf"></i>
              Informe de Alta Generado
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Fecha de Generación</label>
                <span>{formatDate(episodio.informe.fechaGeneracion)}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Generado por</label>
                <span>{episodio.informe.generadoPor}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Formato</label>
                <span>{episodio.informe.formato}</span>
              </div>
            </div>
            
            {/* Export Buttons */}
            <div className={styles.exportActions} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleExport('PDF')}
                className={styles.btnSecondary}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className="fas fa-file-pdf"></i>
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport('DOCX')}
                className={styles.btnSecondary}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className="fas fa-file-word"></i>
                Exportar DOCX
              </button>
              <button
                type="button"
                onClick={() => handleExport('HTML')}
                className={styles.btnSecondary}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className="fas fa-file-code"></i>
                Exportar HTML
              </button>
            </div>
          </div>

          {/* Informe Content */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Resumen del Informe
            </h2>
            <div className={styles.informeContent}>
              <div className={styles.informeSection}>
                <h3>Información del Parto</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Fecha y Hora</label>
                    <span>{formatDate(episodio.informe.parto.fechaHora)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Tipo de Parto</label>
                    <span>{formatTipoParto(episodio.informe.parto.tipo)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Lugar</label>
                    <span>{formatLugarParto(episodio.informe.parto.lugar)}</span>
                  </div>
                  {episodio.informe.parto.observaciones && (
                    <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                      <label>Observaciones</label>
                      <span>{episodio.informe.parto.observaciones}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.informeSection}>
                <h3>Recién Nacidos</h3>
                {episodio.informe.recienNacidos && episodio.informe.recienNacidos.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Sexo</th>
                          <th>Peso (g)</th>
                          <th>Talla (cm)</th>
                          <th>Apgar 1'</th>
                          <th>Apgar 5'</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {episodio.informe.recienNacidos.map((rn, index) => (
                          <tr key={index}>
                            <td>{formatSexo(rn.sexo)}</td>
                            <td>{rn.pesoGr}</td>
                            <td>{rn.tallaCm}</td>
                            <td>{rn.apgar1}</td>
                            <td>{rn.apgar5}</td>
                            <td>{rn.observaciones || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.emptyMessage}>No hay recién nacidos registrados.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Episodio Details */}
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
            {episodio.estado === 'ALTA' && episodio.fechaAlta && (
              <div className={styles.infoItem}>
                <label>Fecha de Alta</label>
                <span>{formatDate(episodio.fechaAlta)}</span>
              </div>
            )}
            {episodio.motivoIngreso && (
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <label>Motivo de Ingreso</label>
                <span>{episodio.motivoIngreso}</span>
              </div>
            )}
            {episodio.estado === 'ALTA' && episodio.condicionEgreso && (
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <label>Condición de Egreso</label>
                <span>{episodio.condicionEgreso}</span>
              </div>
            )}
          </div>
        </div>

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
            {episodio.madre.edad && (
              <div className={styles.infoItem}>
                <label>Edad</label>
                <span>{episodio.madre.edad} años</span>
              </div>
            )}
            {episodio.madre.telefono && (
              <div className={styles.infoItem}>
                <label>Teléfono</label>
                <span>{episodio.madre.telefono}</span>
              </div>
            )}
            {episodio.madre.direccion && (
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <label>Dirección</label>
                <span>{episodio.madre.direccion}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Form */}
      {canApprove && (
        <div className={styles.altaSection}>
          {!showApprovalForm ? (
            <button
              onClick={() => setShowApprovalForm(true)}
              className={styles.btnAlta}
            >
              <i className="fas fa-check-circle"></i>
              Aprobar Alta Médica
            </button>
          ) : (
            <div className={styles.altaForm}>
              <h3>Aprobar Alta Médica</h3>
              <div className={styles.infoMessage}>
                <i className="fas fa-info-circle"></i>
                <p>
                  Revise el informe de alta generado por la matrona. Si está de acuerdo, puede aprobar el alta médica.
                  Puede agregar una condición de egreso adicional si lo considera necesario.
                </p>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="condicionEgreso">Condición de Egreso (opcional)</label>
                <textarea
                  id="condicionEgreso"
                  value={condicionEgreso}
                  onChange={(e) => setCondicionEgreso(e.target.value)}
                  placeholder="Describa la condición de egreso médica..."
                  rows={4}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  onClick={handleAprobarAlta}
                  className={styles.btnPrimary}
                  disabled={aprovingAlta}
                >
                  {aprovingAlta ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      Confirmar Aprobación
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowApprovalForm(false)
                    setCondicionEgreso('')
                  }}
                  className={styles.btnSecondary}
                  disabled={aprovingAlta}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already Approved */}
      {episodio.estado === 'ALTA' && (
        <div className={styles.successBox}>
          <i className="fas fa-check-circle"></i>
          <span>Este episodio ya fue dado de alta médica.</span>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        showCancel={modal.showCancel}
      />
    </div>
  )
}

