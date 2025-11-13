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

  const exportarPDF = async () => {
    if (!reporte) {
      alert('Primero debe generar un reporte')
      return
    }

    try {
      const response = await fetch(`/api/reportes/rem/export?mes=${mes}&anio=${anio}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al exportar el PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reporte_REM_${anio}_${mes.toString().padStart(2, '0')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting PDF:', err)
      alert('Error al exportar el PDF: ' + err.message)
    }
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
                  <div className={styles.statValue}>{reporte.caracteristicasParto.total.total}</div>
                  <div className={styles.statLabel}>Total Partos</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-baby-carriage"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{reporte.seccionD1.total}</div>
                  <div className={styles.statLabel}>Recién Nacidos Vivos</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-heartbeat"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{reporte.seccionD2.tipoParto.vaginal}</div>
                  <div className={styles.statLabel}>Partos Vaginales</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-procedures"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>
                    {reporte.seccionD2.cesareas.urgencia + reporte.seccionD2.cesareas.electiva}
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
                  <td>{reporte.caracteristicasParto.total.edadMadre.menor15}</td>
                  <td>
                    {reporte.caracteristicasParto.total.total > 0
                      ? ((reporte.caracteristicasParto.total.edadMadre.menor15 / reporte.caracteristicasParto.total.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>15-19 años</td>
                  <td>{reporte.caracteristicasParto.total.edadMadre.entre15y19}</td>
                  <td>
                    {reporte.caracteristicasParto.total.total > 0
                      ? ((reporte.caracteristicasParto.total.edadMadre.entre15y19 / reporte.caracteristicasParto.total.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>20-34 años</td>
                  <td>{reporte.caracteristicasParto.total.edadMadre.entre20y34}</td>
                  <td>
                    {reporte.caracteristicasParto.total.total > 0
                      ? ((reporte.caracteristicasParto.total.edadMadre.entre20y34 / reporte.caracteristicasParto.total.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>≥ 35 años</td>
                  <td>{reporte.caracteristicasParto.total.edadMadre.mayor35}</td>
                  <td>
                    {reporte.caracteristicasParto.total.total > 0
                      ? ((reporte.caracteristicasParto.total.edadMadre.mayor35 / reporte.caracteristicasParto.total.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Peso al Nacer */}
          <div className={styles.section}>
            <h3>SECCIÓN D.1: Información General de Recién Nacidos Vivos</h3>
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
                  <td>{reporte.seccionD1.pesoAlNacer.menor500}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.menor500 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>500-999g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre500y999}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre500y999 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>1,000-1,499g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre1000y1499}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre1000y1499 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>1,500-1,999g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre1500y1999}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre1500y1999 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>2,000-2,499g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre2000y2499}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre2000y2499 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>2,500-2,999g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre2500y2999}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre2500y2999 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>3,000-3,999g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre3000y3999}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre3000y3999 / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td>≥ 4,000g</td>
                  <td>{reporte.seccionD1.pesoAlNacer.entre4000yMas}</td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.pesoAlNacer.entre4000yMas / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
                <tr className={styles.totalRow}>
                  <td><strong>Anomalías Congénitas</strong></td>
                  <td><strong>{reporte.seccionD1.anomaliasCongenitas}</strong></td>
                  <td>
                    {reporte.seccionD1.total > 0
                      ? ((reporte.seccionD1.anomaliasCongenitas / reporte.seccionD1.total) * 100).toFixed(1)
                      : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Atención Inmediata */}
          <div className={styles.section}>
            <h3>SECCIÓN D.2: Atención Inmediata del Recién Nacido</h3>
            <div className={styles.subsectionGrid}>
              <div className={styles.subsection}>
                <h4>Profilaxis</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>Hepatitis B</td>
                      <td>{reporte.seccionD2.profilaxis.hepatitisB}</td>
                    </tr>
                    <tr>
                      <td>Ocular</td>
                      <td>{reporte.seccionD2.profilaxis.ocular}</td>
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
                      <td>{reporte.seccionD2.tipoParto.vaginal}</td>
                    </tr>
                    <tr>
                      <td>Instrumental</td>
                      <td>{reporte.seccionD2.tipoParto.instrumental}</td>
                    </tr>
                    <tr>
                      <td>Cesárea</td>
                      <td>{reporte.seccionD2.tipoParto.cesarea}</td>
                    </tr>
                    <tr>
                      <td>Extrahospitalario</td>
                      <td>{reporte.seccionD2.tipoParto.extrahospitalario}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.subsection}>
                <h4>Desglose Instrumental</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>Distócico</td>
                      <td>{reporte.seccionD2.instrumental.distocico}</td>
                    </tr>
                    <tr>
                      <td>Vacuum</td>
                      <td>{reporte.seccionD2.instrumental.vacuum}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.subsection}>
                <h4>Desglose Cesáreas</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>Urgencia</td>
                      <td>{reporte.seccionD2.cesareas.urgencia}</td>
                    </tr>
                    <tr>
                      <td>Electiva</td>
                      <td>{reporte.seccionD2.cesareas.electiva}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.subsection}>
                <h4>APGAR</h4>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>≤3 al 1 minuto</td>
                      <td>{reporte.seccionD2.apgar.menorIgual3al1min}</td>
                    </tr>
                    <tr>
                      <td>≤6 a los 5 minutos</td>
                      <td>{reporte.seccionD2.apgar.menorIgual6a5min}</td>
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
                      <td>{reporte.seccionD2.reanimacion.basica}</td>
                    </tr>
                    <tr>
                      <td>Avanzada</td>
                      <td>{reporte.seccionD2.reanimacion.avanzada}</td>
                    </tr>
                    <tr>
                      <td>EHI Grado II y III</td>
                      <td>{reporte.seccionD2.ehi23}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECCIÓN D: Profilaxis Ocular */}
          <div className={styles.section}>
            <h3>SECCIÓN D: Aplicación de Profilaxis Ocular para Gonorrea en Recién Nacidos</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Total</th>
                  <th>Pueblos Originarios</th>
                  <th>Migrantes</th>
                  <th>REM A11</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>RN vivos que reciben profilaxis ocular</td>
                  <td>{reporte.seccionDProfilaxisOcular.totalConProfilaxis}</td>
                  <td>{reporte.seccionDProfilaxisOcular.pueblosOriginarios}</td>
                  <td>{reporte.seccionDProfilaxisOcular.migrantes}</td>
                  <td>{reporte.seccionDProfilaxisOcular.remA11 || '-'}</td>
                </tr>
                <tr>
                  <td>Recién nacidos vivos</td>
                  <td>{reporte.seccionDProfilaxisOcular.totalRNVivos}</td>
                  <td>0</td>
                  <td>0</td>
                  <td>{reporte.seccionDProfilaxisOcular.remA11 || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECCIÓN J: Profilaxis Hepatitis B */}
          <div className={styles.section}>
            <h3>SECCIÓN J: Profilaxis de Transmisión Vertical Aplicada al Recién Nacido</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Total</th>
                  <th>Pueblos Originarios</th>
                  <th>Migrantes</th>
                  <th>REM A11</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>RN hijos de madre Hepatitis B positiva</td>
                  <td>{reporte.seccionJ.hijosHepatitisBPositiva.total}</td>
                  <td>{reporte.seccionJ.hijosHepatitisBPositiva.pueblosOriginarios}</td>
                  <td>{reporte.seccionJ.hijosHepatitisBPositiva.migrantes}</td>
                  <td>{reporte.seccionJ.hijosHepatitisBPositiva.remA11 || '-'}</td>
                </tr>
                <tr>
                  <td>RN con profilaxis completa según normativa</td>
                  <td>{reporte.seccionJ.profilaxisCompleta.total}</td>
                  <td>{reporte.seccionJ.profilaxisCompleta.pueblosOriginarios}</td>
                  <td>{reporte.seccionJ.profilaxisCompleta.migrantes}</td>
                  <td>{reporte.seccionJ.profilaxisCompleta.remA11 || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECCIÓN G: Esterilizaciones Quirúrgicas */}
          <div className={styles.section}>
            <h3>SECCIÓN G: Esterilizaciones Quirúrgicas</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SEXO</th>
                  <th>TOTAL</th>
                  <th>&lt;20 años</th>
                  <th>20-34 años</th>
                  <th>≥35 años</th>
                  <th>Trans</th>
                  <th>REM A21</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>MUJER</td>
                  <td>{reporte.seccionGEsterilizaciones.mujer.total}</td>
                  <td>{reporte.seccionGEsterilizaciones.mujer.menor20}</td>
                  <td>{reporte.seccionGEsterilizaciones.mujer.entre20y34}</td>
                  <td>{reporte.seccionGEsterilizaciones.mujer.mayor35}</td>
                  <td>{reporte.seccionGEsterilizaciones.mujer.trans}</td>
                  <td>{reporte.seccionGEsterilizaciones.mujer.remA21 || '-'}</td>
                </tr>
                <tr>
                  <td>HOMBRE</td>
                  <td>{reporte.seccionGEsterilizaciones.hombre.total}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
