'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function InformeAltaClient() {
  const router = useRouter()
  const [episodios, setEpisodios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEpisodioId, setSelectedEpisodioId] = useState('')
  const [selectedPartoId, setSelectedPartoId] = useState('')
  const [formato, setFormato] = useState('PDF')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEpisodios()
  }, [])

  const loadEpisodios = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/informe-alta')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar episodios')
      }

      setEpisodios(result.data || [])
    } catch (err) {
      console.error('Error loading episodios:', err)
      setError(err.message || 'Error al cargar episodios')
    } finally {
      setLoading(false)
    }
  }

  const selectedEpisodio = episodios.find(e => e.id === selectedEpisodioId)
  // Deduplicar partos por ID como medida de seguridad
  const partosRaw = selectedEpisodio?.partos || []
  const partosMap = new Map()
  partosRaw.forEach(parto => {
    if (!partosMap.has(parto.id)) {
      partosMap.set(parto.id, parto)
    }
  })
  const partosDisponibles = Array.from(partosMap.values())
  const selectedParto = partosDisponibles.find(p => p.id === selectedPartoId)

  const handleEpisodioChange = (e) => {
    setSelectedEpisodioId(e.target.value)
    setSelectedPartoId('') // Reset parto selection when episodio changes
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    
    if (!selectedEpisodioId || !selectedPartoId) {
      alert('Por favor seleccione un episodio y un parto')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/informe-alta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodioId: selectedEpisodioId,
          partoId: selectedPartoId,
          formato: formato,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al generar el informe')
      }

      alert(`Informe generado exitosamente\nMadre: ${selectedEpisodio?.madre.nombres} ${selectedEpisodio?.madre.apellidos}\nParto: ${formatTipoParto(selectedParto?.tipo)}\nFormato: ${formato}`)
      
      // Reload episodios to refresh the list (episodio will no longer appear as it now has informe)
      await loadEpisodios()
      
      // Reset form
      setSelectedEpisodioId('')
      setSelectedPartoId('')
    } catch (err) {
      console.error('Error generating informe:', err)
      setError(err.message || 'Error al generar el informe')
      alert(err.message || 'Error al generar el informe')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async (formatoExport) => {
    if (!selectedPartoId) {
      alert('Por favor seleccione un parto primero')
      return
    }

    // For now, just show an alert
    alert(`Función de exportación en ${formatoExport} aún no implementada. Se mostrará un alert por ahora.`)
  }

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return ''
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          Cargando episodios...
        </div>
      </div>
    )
  }

  if (error && !episodios.length) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadEpisodios} className={styles.btnSecondary}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h1>
          <i className="fas fa-file-pdf" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          Generar Informe para Alta
        </h1>
      </div>

      <div className={styles.infoMessage}>
        <i className="fas fa-info-circle"></i>
        <p>
          Esta sección permite generar el informe de alta para pacientes del módulo de maternidad. 
          Seleccione primero el episodio (madre) y luego el parto correspondiente.
        </p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleGenerate} className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label htmlFor="episodio">
            <i className="fas fa-door-open" style={{ marginRight: '0.5rem' }}></i>
            Seleccionar Episodio (Madre)
          </label>
          {episodios.length === 0 ? (
            <div className={styles.warningBox}>
              <i className="fas fa-info-circle"></i>
              <span>No hay episodios disponibles para generar informes. Todos los episodios ya tienen informes generados o no hay episodios en estado INGRESADO.</span>
            </div>
          ) : (
            <select
              id="episodio"
              value={selectedEpisodioId}
              onChange={handleEpisodioChange}
              required
            >
              <option value="">-- Seleccione un episodio --</option>
              {episodios.map((episodio) => (
                <option key={episodio.id} value={episodio.id}>
                  {episodio.madre.nombres} {episodio.madre.apellidos} - RUT: {episodio.madre.rut} 
                  {' '}(Ingreso: {formatFecha(episodio.fechaIngreso)})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedEpisodioId && (
          <div className={styles.formGroup}>
            <label htmlFor="parto">
              <i className="fas fa-baby" style={{ marginRight: '0.5rem' }}></i>
              Seleccionar Parto
            </label>
            {partosDisponibles.length > 0 ? (
              <select
                id="parto"
                value={selectedPartoId}
                onChange={(e) => setSelectedPartoId(e.target.value)}
                required
              >
                <option value="">-- Seleccione un parto --</option>
                {partosDisponibles.map((parto) => (
                  <option key={parto.id} value={parto.id}>
                    {formatFecha(parto.fechaHora)} - {formatTipoParto(parto.tipo)} ({formatLugarParto(parto.lugar)})
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles.warningBox}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>Este episodio no tiene partos registrados después de la fecha de ingreso.</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="formato">
            <i className="fas fa-file-export" style={{ marginRight: '0.5rem' }}></i>
            Formato del Informe
          </label>
          <select
            id="formato"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            <option value="PDF">PDF</option>
            <option value="DOCX">Word (DOCX)</option>
            <option value="HTML">HTML</option>
          </select>
        </div>

        {selectedEpisodio && selectedParto && (
          <div className={styles.previewBox}>
            <h3>Vista Previa del Informe</h3>
            <div className={styles.previewInfo}>
              <p>
                <strong>Madre:</strong> {selectedEpisodio.madre.nombres} {selectedEpisodio.madre.apellidos}
              </p>
              <p>
                <strong>RUT:</strong> {selectedEpisodio.madre.rut}
              </p>
              {selectedEpisodio.madre.edad && (
                <p>
                  <strong>Edad:</strong> {selectedEpisodio.madre.edad} años
                </p>
              )}
              <p>
                <strong>Fecha de Ingreso:</strong> {formatFecha(selectedEpisodio.fechaIngreso)}
              </p>
              <p>
                <strong>Fecha del Parto:</strong> {formatFecha(selectedParto.fechaHora)}
              </p>
              <p>
                <strong>Tipo de Parto:</strong> {formatTipoParto(selectedParto.tipo)}
              </p>
              <p>
                <strong>Lugar:</strong> {formatLugarParto(selectedParto.lugar)}
              </p>
              <p>
                <strong>Formato:</strong> {formato}
              </p>
              <p>
                <strong>Recién Nacidos:</strong> {selectedParto.recienNacidos?.length || 0}
              </p>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={!selectedEpisodioId || !selectedPartoId || isGenerating}
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Generando...
              </>
            ) : (
              <>
                <i className="fas fa-file-download"></i>
                Generar Informe
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
