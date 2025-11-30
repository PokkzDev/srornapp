'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import styles from './page.module.css'
import DateTimePicker from '../../../components/DateTimePicker'
import { getLocalDateString } from '@/lib/date-utils'

const COLORS = ['#0066A4', '#28A745', '#FFC107', '#DC3545', '#17A2B8', '#6F42C1', '#E83E8C']

const SECTIONS = [
  { id: 'resumen', label: 'Resumen General', icon: 'fa-home' },
  { id: 'partos', label: 'Partos', icon: 'fa-baby' },
  { id: 'recien-nacidos', label: 'Recién Nacidos', icon: 'fa-baby-carriage' },
  { id: 'episodios-urni', label: 'Episodios URNI', icon: 'fa-hospital-alt' },
  { id: 'episodios-madre', label: 'Episodios Madre', icon: 'fa-user-injured' },
  { id: 'controles', label: 'Controles Neonatales', icon: 'fa-heartbeat' },
  { id: 'atenciones', label: 'Atenciones URNI', icon: 'fa-stethoscope' },
  { id: 'informes', label: 'Informes de Alta', icon: 'fa-file-pdf' },
  { id: 'operacionales', label: 'Métricas Operacionales', icon: 'fa-chart-line' },
]

export default function IndicadoresClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [fechaInicio, setFechaInicio] = useState(null)
  const [fechaFin, setFechaFin] = useState(null)
  const [agrupacion, setAgrupacion] = useState('mes')
  const [activeSection, setActiveSection] = useState('resumen')

  useEffect(() => {
    loadIndicadores()
  }, [fechaInicio, fechaFin, agrupacion])

  const loadIndicadores = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append('fechaInicio', getLocalDateString(fechaInicio))
      if (fechaFin) params.append('fechaFin', getLocalDateString(fechaFin))
      params.append('agrupacion', agrupacion)

      const response = await fetch(`/api/indicadores?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar indicadores')
      }

      setData(result.data)
    } catch (err) {
      console.error('Error loading indicadores:', err)
      setError(err.message || 'Error al cargar los indicadores')
    } finally {
      setLoading(false)
    }
  }

  const setQuickFilter = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFechaInicio(start)
    setFechaFin(end)
  }

  const setCurrentMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFechaInicio(start)
    setFechaFin(end)
  }

  const setCurrentYear = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)
    setFechaInicio(start)
    setFechaFin(end)
  }

  const clearFilters = () => {
    setFechaInicio('')
    setFechaFin('')
  }

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          Cargando indicadores...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.content}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const renderSection = () => {
    if (!data) return null

    switch (activeSection) {
      case 'resumen':
        return renderResumen()
      case 'partos':
        return renderPartos()
      case 'recien-nacidos':
        return renderRecienNacidos()
      case 'episodios-urni':
        return renderEpisodiosUrni()
      case 'episodios-madre':
        return renderEpisodiosMadre()
      case 'controles':
        return renderControles()
      case 'atenciones':
        return renderAtenciones()
      case 'informes':
        return renderInformes()
      case 'operacionales':
        return renderOperacionales()
      default:
        return renderResumen()
    }
  }

  const renderResumen = () => (
    <>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Total Partos</h3>
            <div className={styles.statCardIcon} style={{ background: '#0066A4' }}>
              <i className="fas fa-baby"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.partos.total}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Total Recién Nacidos</h3>
            <div className={styles.statCardIcon} style={{ background: '#28A745' }}>
              <i className="fas fa-baby-carriage"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.recienNacidos.total}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Episodios URNI</h3>
            <div className={styles.statCardIcon} style={{ background: '#FFC107' }}>
              <i className="fas fa-hospital-alt"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.episodiosUrni.total}</p>
          <p className={styles.statCardSubtext}>
            {data.episodiosUrni.activos} activos, {data.episodiosUrni.altas} altas
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Controles Neonatales</h3>
            <div className={styles.statCardIcon} style={{ background: '#DC3545' }}>
              <i className="fas fa-heartbeat"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.controlesNeonatales.total}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Episodios Madre</h3>
            <div className={styles.statCardIcon} style={{ background: '#17A2B8' }}>
              <i className="fas fa-user-injured"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.episodiosMadre.total}</p>
          <p className={styles.statCardSubtext}>
            {data.episodiosMadre.activos} activos, {data.episodiosMadre.altas} altas
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Atenciones URNI</h3>
            <div className={styles.statCardIcon} style={{ background: '#6F42C1' }}>
              <i className="fas fa-stethoscope"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.atencionesUrni.total}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>Informes de Alta</h3>
            <div className={styles.statCardIcon} style={{ background: '#E83E8C' }}>
              <i className="fas fa-file-pdf"></i>
            </div>
          </div>
          <p className={styles.statCardValue}>{data.informesAlta.total}</p>
        </div>
      </div>
    </>
  )

  const renderPartos = () => (
    <section className={styles.section}>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Tipo de Parto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.partos.porTipo}
                dataKey="cantidad"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ tipo, porcentaje }) => `${tipo}: ${porcentaje}%`}
              >
                {data.partos.porTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Lugar de Parto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.partos.porLugar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="lugar" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#0066A4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Evolución Temporal de Partos</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.partos.evolucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cantidad" stroke="#0066A4" strokeWidth={2} name="Partos" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  const renderRecienNacidos = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Peso Promedio</h3>
          <p className={styles.statCardValue}>{data.recienNacidos.pesoPromedio}g</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Talla Promedio</h3>
          <p className={styles.statCardValue}>{data.recienNacidos.tallaPromedio}cm</p>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Sexo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.recienNacidos.porSexo}
                dataKey="cantidad"
                nameKey="sexo"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ sexo, porcentaje }) => `${sexo}: ${porcentaje}%`}
              >
                {data.recienNacidos.porSexo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Rangos de Peso</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { rango: 'Bajo Peso (<2500g)', cantidad: data.recienNacidos.pesoRangos.bajoPeso },
                { rango: 'Normal (2500-4000g)', cantidad: data.recienNacidos.pesoRangos.normal },
                { rango: 'Macrosomía (>4000g)', cantidad: data.recienNacidos.pesoRangos.macrosomia },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rango" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#28A745" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución Apgar 1 minuto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { categoria: 'Bajo (<7)', cantidad: data.recienNacidos.apgar1.bajo },
                { categoria: 'Normal (7-9)', cantidad: data.recienNacidos.apgar1.normal },
                { categoria: 'Excelente (10)', cantidad: data.recienNacidos.apgar1.excelente },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#17A2B8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución Apgar 5 minutos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { categoria: 'Bajo (<7)', cantidad: data.recienNacidos.apgar5.bajo },
                { categoria: 'Normal (7-9)', cantidad: data.recienNacidos.apgar5.normal },
                { categoria: 'Excelente (10)', cantidad: data.recienNacidos.apgar5.excelente },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#6F42C1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )

  const renderEpisodiosUrni = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Días de Estadía Promedio</h3>
          <p className={styles.statCardValue}>{data.episodiosUrni.diasEstadiaPromedio}</p>
          <p className={styles.statCardSubtext}>días</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Episodios Activos</h3>
          <p className={styles.statCardValue}>{data.episodiosUrni.activos}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Episodios con Alta</h3>
          <p className={styles.statCardValue}>{data.episodiosUrni.altas}</p>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Servicio/Unidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.episodiosUrni.porServicio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="servicio" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#FFC107" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Evolución Temporal de Episodios URNI</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.episodiosUrni.evolucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#0066A4" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="altas" stroke="#28A745" strokeWidth={2} name="Altas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  const renderEpisodiosMadre = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Episodios</h3>
          <p className={styles.statCardValue}>{data.episodiosMadre.total}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Días de Estadía Promedio</h3>
          <p className={styles.statCardValue}>{data.episodiosMadre.diasEstadiaPromedio}</p>
          <p className={styles.statCardSubtext}>días</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Activos</h3>
          <p className={styles.statCardValue}>{data.episodiosMadre.activos}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Con Alta</h3>
          <p className={styles.statCardValue}>{data.episodiosMadre.altas}</p>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Evolución Temporal de Episodios Madre</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.episodiosMadre.evolucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#0066A4" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="altas" stroke="#28A745" strokeWidth={2} name="Altas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  const renderControles = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Controles</h3>
          <p className={styles.statCardValue}>{data.controlesNeonatales.total}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Promedio por Episodio</h3>
          <p className={styles.statCardValue}>{data.controlesNeonatales.promedioPorEpisodio}</p>
          <p className={styles.statCardSubtext}>controles</p>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Tipo de Control</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.controlesNeonatales.porTipo}
                dataKey="cantidad"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ tipo, porcentaje }) => `${tipo}: ${porcentaje}%`}
              >
                {data.controlesNeonatales.porTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Evolución Temporal de Controles</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.controlesNeonatales.evolucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cantidad" stroke="#DC3545" strokeWidth={2} name="Controles" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  const renderAtenciones = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Atenciones</h3>
          <p className={styles.statCardValue}>{data.atencionesUrni.total}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Promedio por Episodio</h3>
          <p className={styles.statCardValue}>{data.atencionesUrni.promedioPorEpisodio}</p>
          <p className={styles.statCardSubtext}>atenciones</p>
        </div>
      </div>

      {data.atencionesUrni.porMedico.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Distribución por Médico</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.atencionesUrni.porMedico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="medicoNombre" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#17A2B8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )

  const renderInformes = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Informes Generados</h3>
          <p className={styles.statCardValue}>{data.informesAlta.total}</p>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Evolución Temporal de Informes Generados</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.informesAlta.evolucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cantidad" stroke="#E83E8C" strokeWidth={2} name="Informes" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  const renderOperacionales = () => (
    <section className={styles.section}>
      <div className={styles.cardsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Madres</h3>
          <p className={styles.statCardValue}>{data.operacionales.totales.madres}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Partos</h3>
          <p className={styles.statCardValue}>{data.operacionales.totales.partos}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Recién Nacidos</h3>
          <p className={styles.statCardValue}>{data.operacionales.totales.recienNacidos}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Episodios URNI</h3>
          <p className={styles.statCardValue}>{data.operacionales.totales.episodiosUrni}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statCardTitle}>Total Episodios Madre</h3>
          <p className={styles.statCardValue}>{data.operacionales.totales.episodiosMadre}</p>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Actividad Reciente (Últimos 30 días)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={[
              { categoria: 'Madres', cantidad: data.operacionales.actividadReciente.madres },
              { categoria: 'Partos', cantidad: data.operacionales.actividadReciente.partos },
              { categoria: 'Recién Nacidos', cantidad: data.operacionales.actividadReciente.recienNacidos },
              { categoria: 'Episodios URNI', cantidad: data.operacionales.actividadReciente.episodiosUrni },
              { categoria: 'Controles', cantidad: data.operacionales.actividadReciente.controles },
              { categoria: 'Atenciones', cantidad: data.operacionales.actividadReciente.atenciones },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#0066A4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h1>
          <i className="fas fa-chart-bar" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          Indicadores y Estadísticas
        </h1>
        <p>Métricas y análisis del sistema SRORN</p>
      </div>

      {/* Submenú de Secciones */}
      <div className={styles.sectionsMenu}>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            className={`${styles.sectionTab} ${activeSection === section.id ? styles.sectionTabActive : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <i className={`fas ${section.icon}`}></i>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Fecha Inicio</label>
          <DateTimePicker
            selected={fechaInicio}
            onChange={(date) => setFechaInicio(date)}
            dateOnly
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Fecha Fin</label>
          <DateTimePicker
            selected={fechaFin}
            onChange={(date) => setFechaFin(date)}
            dateOnly
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Agrupación</label>
          <select
            className={styles.filterSelect}
            value={agrupacion}
            onChange={(e) => setAgrupacion(e.target.value)}
          >
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Filtros Rápidos</label>
          <div className={styles.quickFilters}>
            <button className={styles.quickFilterBtn} onClick={() => setQuickFilter(7)}>
              Últimos 7 días
            </button>
            <button className={styles.quickFilterBtn} onClick={() => setQuickFilter(30)}>
              Últimos 30 días
            </button>
            <button className={styles.quickFilterBtn} onClick={() => setQuickFilter(90)}>
              Últimos 90 días
            </button>
            <button className={styles.quickFilterBtn} onClick={setCurrentMonth}>
              Mes actual
            </button>
            <button className={styles.quickFilterBtn} onClick={setCurrentYear}>
              Año actual
            </button>
            <button className={styles.quickFilterBtn} onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de la sección activa */}
      <div className={styles.sectionContent}>
        {renderSection()}
      </div>
    </div>
  )
}

