'use client'

import { useState } from 'react'
import styles from './ReporteREMClient.module.css'

const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' },
]

export default function ReporteREMClient() {
  const fechaActual = new Date()
  const [mes, setMes] = useState(fechaActual.getMonth() + 1)
  const [anio, setAnio] = useState(fechaActual.getFullYear())
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generarReporte = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/reportes/rem?mes=${mes}&anio=${anio}`)
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Error al generar el reporte')
        setReporte(null)
        return
      }
      
      setReporte(data.data)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al conectar con el servidor')
      setReporte(null)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    // TODO: Implementar exportación a Excel
    alert('Funcionalidad de exportación en desarrollo')
  }

  const exportarPDF = () => {
    // TODO: Implementar exportación a PDF
    alert('Funcionalidad de exportación en desarrollo')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <i className="fas fa-file-alt"></i> Reporte REM A.11
        </h1>
        <p className={styles.subtitle}>
          Registro Estadístico Mensual - Sección D: Atención del Parto y Recién Nacido
        </p>
      </div>

      {/* Controles */}
      <div className={styles.controls}>
        <div className={styles.formGroup}>
          <label htmlFor="mes">Mes:</label>
          <select
            id="mes"
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className={styles.select}
          >
            {MESES.map(m => (
              <option key={m.valor} value={m.valor}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="anio">Año:</label>
          <input
            type="number"
            id="anio"
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            min="2000"
            max="2100"
            className={styles.input}
          />
        </div>

        <button
          onClick={generarReporte}
          disabled={loading}
          className={styles.btnPrimary}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Generando...
            </>
          ) : (
            <>
              <i className="fas fa-chart-bar"></i> Generar Reporte
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.alertError}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Reporte */}
      {reporte && (
        <div className={styles.reportContainer}>
          {/* Botones de exportación */}
          <div className={styles.exportButtons}>
            <button onClick={exportarExcel} className={styles.btnSuccess}>
              <i className="fas fa-file-excel"></i> Exportar a Excel
            </button>
            <button onClick={exportarPDF} className={styles.btnDanger}>
              <i className="fas fa-file-pdf"></i> Exportar a PDF
            </button>
          </div>

          {/* Resumen General */}
          <div className={styles.section}>
            <h2>Resumen General - {MESES.find(m => m.valor === mes)?.nombre} {anio}</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-baby"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{reporte.caracteristicasParto.totalPartos}</div>
                  <div className={styles.statLabel}>Total Partos</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-baby-carriage"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{reporte.recienNacidosVivos.total}</div>
                  <div className={styles.statLabel}>Recién Nacidos Vivos</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-heartbeat"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{reporte.caracteristicasParto.tiposParto.eutocico}</div>
                  <div className={styles.statLabel}>Partos Eutócicos</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-procedures"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>
                    {reporte.caracteristicasParto.tiposParto.cesareasElectivas + 
                     reporte.caracteristicasParto.tiposParto.cesareasEmergencia}
                  </div>
                  <div className={styles.statLabel}>Cesáreas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Partos según Edad de la Madre */}
          <div className={styles.section}>
            <h3>Partos según Edad de la Madre</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rango de Edad</th>
                  <th>Cantidad</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>&lt; 15 años</td>
                  <td>{reporte.caracteristicasParto.partosSegunEdadMadre.menor15}</td>
                  <td>
                    {reporte.caracteristicasParto.totalPartos > 0
                      ? ((reporte.caracteristicasParto.partosSegunEdadMadre.menor15 / reporte.caracteristicasParto.totalPartos) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>15-19 años</td>
                  <td>{reporte.caracteristicasParto.partosSegunEdadMadre.entre15y19}</td>
                  <td>
                    {reporte.caracteristicasParto.totalPartos > 0
                      ? ((reporte.caracteristicasParto.partosSegunEdadMadre.entre15y19 / reporte.caracteristicasParto.totalPartos) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>20-24 años</td>
                  <td>{reporte.caracteristicasParto.partosSegunEdadMadre.entre20y24}</td>
                  <td>
                    {reporte.caracteristicasParto.totalPartos > 0
                      ? ((reporte.caracteristicasParto.partosSegunEdadMadre.entre20y24 / reporte.caracteristicasParto.totalPartos) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>&gt; 35 años</td>
                  <td>{reporte.caracteristicasParto.partosSegunEdadMadre.mayor35}</td>
                  <td>
                    {reporte.caracteristicasParto.totalPartos > 0
                      ? ((reporte.caracteristicasParto.partosSegunEdadMadre.mayor35 / reporte.caracteristicasParto.totalPartos) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Partos Primíparas */}
          <div className={styles.section}>
            <h3>Partos Primíparas según Semanas de Gestación</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Primíparas</td>
                  <td><strong>{reporte.caracteristicasParto.partosPrimiparas.totalPrimiparas}</strong></td>
                </tr>
                <tr>
                  <td>&lt; 20 semanas</td>
                  <td>{reporte.caracteristicasParto.partosPrimiparas.menor20Semanas}</td>
                </tr>
                <tr>
                  <td>20-36 semanas</td>
                  <td>{reporte.caracteristicasParto.partosPrimiparas.entre20y36Semanas}</td>
                </tr>
                <tr>
                  <td>≥ 37 semanas</td>
                  <td>{reporte.caracteristicasParto.partosPrimiparas.mayor37Semanas}</td>
                </tr>
                <tr>
                  <td>Presentación de nalgas</td>
                  <td>{reporte.caracteristicasParto.partosPrimiparas.presentacionNalgas}</td>
                </tr>
                <tr>
                  <td>Presentación de cara</td>
                  <td>{reporte.caracteristicasParto.partosPrimiparas.presentacionCara}</td>
                </tr>
                <tr>
                  <td>Presentación transversa</td>
                  <td>{reporte.caracteristicasParto.partosPrimiparas.presentacionTransversa}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Peso al Nacer */}
          <div className={styles.section}>
            <h3>Sección D.1: Peso al Nacer (Gramos)</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rango de Peso</th>
                  <th>Cantidad</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>&lt; 500g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.menor500}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.menor500 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>500-999g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre500y999}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre500y999 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>1,000-1,499g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre1000y1499}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre1000y1499 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>1,500-1,999g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre1500y1999}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre1500y1999 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>2,000-2,499g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre2000y2499}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre2000y2499 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>2,500-2,999g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre2500y2999}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre2500y2999 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>3,000-3,999g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre3000y3999}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre3000y3999 / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>≥ 4,000g</td>
                  <td>{reporte.recienNacidosVivos.pesoAlNacer.entre4000yMas}</td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.pesoAlNacer.entre4000yMas / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr className={styles.totalRow}>
                  <td><strong>Anomalías Congénitas</strong></td>
                  <td><strong>{reporte.recienNacidosVivos.anomaliasCongenitas}</strong></td>
                  <td>
                    {reporte.recienNacidosVivos.total > 0
                      ? ((reporte.recienNacidosVivos.anomaliasCongenitas / reporte.recienNacidosVivos.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Atención Inmediata */}
          <div className={styles.section}>
            <h3>Sección D.2: Atención Inmediata del Recién Nacido</h3>
            <div className={styles.subsectionGrid}>
              <div className={styles.subsection}>
                <h4>Profilaxis</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>Hepatitis B</td>
                      <td>{reporte.atencionInmediata.profilaxis.hepatitisB}</td>
                    </tr>
                    <tr>
                      <td>Ocular</td>
                      <td>{reporte.atencionInmediata.profilaxis.ocular}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.subsection}>
                <h4>Tipo de Parto</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>Vaginal</td>
                      <td>{reporte.atencionInmediata.tipoParto.vaginal}</td>
                    </tr>
                    <tr>
                      <td>Instrumental</td>
                      <td>{reporte.atencionInmediata.tipoParto.instrumental}</td>
                    </tr>
                    <tr>
                      <td>Cesárea</td>
                      <td>{reporte.atencionInmediata.tipoParto.cesarea}</td>
                    </tr>
                    <tr>
                      <td>Extrahospitalario</td>
                      <td>{reporte.atencionInmediata.tipoParto.extrahospitalario}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.subsection}>
                <h4>APGAR</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>0-3 al 1 minuto</td>
                      <td>{reporte.atencionInmediata.apgar.apgar0a3al1min}</td>
                    </tr>
                    <tr>
                      <td>6-5 a los 5 minutos</td>
                      <td>{reporte.atencionInmediata.apgar.apgar6a5a5min}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.subsection}>
                <h4>Reanimación</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>Básica</td>
                      <td>{reporte.atencionInmediata.reanimacion.basica}</td>
                    </tr>
                    <tr>
                      <td>Avanzada</td>
                      <td>{reporte.atencionInmediata.reanimacion.avanzada}</td>
                    </tr>
                    <tr>
                      <td>EHI Grado II y III</td>
                      <td>{reporte.atencionInmediata.ehi23}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lactancia Materna */}
          <div className={styles.section}>
            <h3>Lactancia Materna en primeros 60 minutos (RN ≥ 2,500g)</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo de Parto</th>
                  <th>Total Partos</th>
                  <th>Con Lactancia 60 min</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total</td>
                  <td>{reporte.lactanciaMaterna.totalPartos}</td>
                  <td>{reporte.lactanciaMaterna.lactanciaEn60Min}</td>
                  <td>
                    {reporte.lactanciaMaterna.totalPartos > 0
                      ? ((reporte.lactanciaMaterna.lactanciaEn60Min / reporte.lactanciaMaterna.totalPartos) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>Vaginal</td>
                  <td>{reporte.lactanciaMaterna.vaginal}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Instrumental</td>
                  <td>{reporte.lactanciaMaterna.instrumental}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Cesárea Electiva</td>
                  <td>{reporte.lactanciaMaterna.cesareasElectivas}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Cesárea Urgencia</td>
                  <td>{reporte.lactanciaMaterna.cesareasUrgencia}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Profilaxis Hepatitis B */}
          {reporte.profilaxisHepatitisB.hijosDeHepatitisBPositiva > 0 && (
            <div className={styles.section}>
              <h3>Sección J: Profilaxis de Transmisión Vertical Hepatitis B</h3>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td>RN hijos de madre Hepatitis B positiva</td>
                    <td>{reporte.profilaxisHepatitisB.hijosDeHepatitisBPositiva}</td>
                  </tr>
                  <tr>
                    <td>Con profilaxis completa según normativa</td>
                    <td>{reporte.profilaxisHepatitisB.profilaxisCompleta}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
