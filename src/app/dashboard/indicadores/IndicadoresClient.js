'use client'

import { useState, useEffect, useCallback } from 'react'
import { FilterBar, ExportButton } from '@/components/indicadores'
import styles from './page.module.css'
import { getLocalDateString } from '@/lib/date-utils'

// Importar tabs especializados
import ResumenTab from './ResumenTab'
import PartosTab from './PartosTab'
import RecienNacidosTab from './RecienNacidosTab'
import BuenasPracticasTab from './BuenasPracticasTab'
import ComplicacionesTab from './ComplicacionesTab'
import REMTab from './REMTab'
import URNITab from './URNITab'
import CargaLaboralTab from './CargaLaboralTab'

const TABS = [
  { id: 'resumen', label: 'Resumen Ejecutivo', icon: 'fa-solid fa-chart-pie' },
  { id: 'partos', label: 'Partos', icon: 'fa-solid fa-baby' },
  { id: 'recien-nacidos', label: 'Recién Nacidos', icon: 'fa-solid fa-baby-carriage' },
  { id: 'buenas-practicas', label: 'Buenas Prácticas', icon: 'fa-solid fa-clipboard-check' },
  { id: 'complicaciones', label: 'Complicaciones', icon: 'fa-solid fa-triangle-exclamation' },
  { id: 'rem', label: 'REM', icon: 'fa-solid fa-file-medical' },
  { id: 'urni', label: 'URNI', icon: 'fa-solid fa-hospital' },
  { id: 'carga-laboral', label: 'Carga Laboral', icon: 'fa-solid fa-users' },
]

export default function IndicadoresClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('resumen')
  
  // Estado de filtros
  const [filters, setFilters] = useState({
    fechaInicio: null,
    fechaFin: null,
    agrupacion: 'mes',
    tipoParto: '',
    servicio: '',
  })

  // Opciones para filtros
  const filterOptions = {
    tipoParto: [
      { value: '', label: 'Todos' },
      { value: 'VAGINAL', label: 'Vaginal' },
      { value: 'CESAREA', label: 'Cesárea' },
      { value: 'FORCEPS', label: 'Fórceps' },
    ],
    servicio: [
      { value: '', label: 'Todos' },
      { value: 'URNI', label: 'URNI' },
      { value: 'UCIN', label: 'UCIN' },
      { value: 'NEONATOLOGIA', label: 'Neonatología' },
    ],
    agrupacion: [
      { value: 'dia', label: 'Día' },
      { value: 'semana', label: 'Semana' },
      { value: 'mes', label: 'Mes' },
    ]
  }

  const loadIndicadores = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.fechaInicio) {
        // Handle both Date objects and string dates
        const fechaInicioStr = filters.fechaInicio instanceof Date 
          ? getLocalDateString(filters.fechaInicio) 
          : filters.fechaInicio
        params.append('fechaInicio', fechaInicioStr)
      }
      if (filters.fechaFin) {
        const fechaFinStr = filters.fechaFin instanceof Date 
          ? getLocalDateString(filters.fechaFin) 
          : filters.fechaFin
        params.append('fechaFin', fechaFinStr)
      }
      params.append('agrupacion', filters.agrupacion)
      if (filters.tipoParto) params.append('tipoParto', filters.tipoParto)
      if (filters.servicio) params.append('servicio', filters.servicio)

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
  }, [filters])

  useEffect(() => {
    loadIndicadores()
  }, [loadIndicadores])

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleDatePreset = (preset) => {
    const now = new Date()
    let start, end
    
    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        break
      case 'last7days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        end = now
        break
      case 'last30days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        end = now
        break
      case 'last90days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
        end = now
        break
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
        break
      case 'all':
      default:
        start = null
        end = null
    }
    
    setFilters(prev => ({ ...prev, fechaInicio: start, fechaFin: end }))
  }

  const handleExport = (format) => {
    if (!data) return
    
    const exportData = prepareExportData()
    
    if (format === 'csv') {
      exportToCSV(exportData)
    } else if (format === 'excel') {
      exportToExcel(exportData)
    } else if (format === 'print') {
      window.print()
    }
  }

  const prepareExportData = () => {
    if (!data) return []
    
    const rows = []
    const tab = activeTab
    
    if (tab === 'resumen' || tab === 'partos') {
      rows.push(['Indicadores de Partos'])
      rows.push(['Total Partos', data.partos?.total || 0])
      rows.push(['Partos Vaginales', data.partos?.porTipo?.find(t => t.tipo === 'VAGINAL')?.cantidad || 0])
      rows.push(['Cesáreas', data.partos?.porTipo?.find(t => t.tipo === 'CESAREA')?.cantidad || 0])
      rows.push([''])
    }
    
    if (tab === 'resumen' || tab === 'recien-nacidos') {
      rows.push(['Indicadores de Recién Nacidos'])
      rows.push(['Total RN', data.recienNacidos?.total || 0])
      rows.push(['Peso Promedio', `${data.recienNacidos?.pesoPromedio || 0}g`])
      rows.push(['Talla Promedio', `${data.recienNacidos?.tallaPromedio || 0}cm`])
      rows.push([''])
    }
    
    if (tab === 'resumen' || tab === 'buenas-practicas') {
      rows.push(['Buenas Prácticas'])
      const bp = data.buenasPracticas || {}
      rows.push(['Oxitocina Profiláctica', `${bp.oxitocinaProfilactica?.tasa || 0}%`])
      rows.push(['Ligadura Tardía Cordón', `${bp.ligaduraTardiaCordon?.tasa || 0}%`])
      rows.push(['Contacto Piel a Piel', `${bp.contactoPielPiel?.tasa || 0}%`])
      rows.push(['Lactancia Precoz', `${bp.lactanciaPrecoz?.tasa || 0}%`])
      rows.push([''])
    }
    
    if (tab === 'resumen' || tab === 'complicaciones') {
      rows.push(['Complicaciones'])
      const comp = data.complicaciones || {}
      rows.push(['HPP', comp.hpp?.cantidad || 0])
      rows.push(['Preeclampsia', comp.preeclampsia?.cantidad || 0])
      rows.push(['Eclampsia', comp.eclampsia?.cantidad || 0])
      rows.push([''])
    }
    
    if (tab === 'urni') {
      rows.push(['URNI'])
      rows.push(['Total Episodios', data.episodiosUrni?.total || 0])
      rows.push(['Activos', data.episodiosUrni?.activos || 0])
      rows.push(['Altas', data.episodiosUrni?.altas || 0])
      rows.push(['Estadía Promedio', `${data.episodiosUrni?.diasEstadiaPromedio || 0} días`])
    }
    
    return rows
  }

  const exportToCSV = (rows) => {
    const csvContent = rows.map(row => Array.isArray(row) ? row.join(',') : row).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `indicadores_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToExcel = (rows) => {
    // Crear un HTML table para Excel
    let html = '<table>'
    rows.forEach(row => {
      html += '<tr>'
      if (Array.isArray(row)) {
        row.forEach(cell => {
          html += `<td>${cell}</td>`
        })
      } else {
        html += `<td>${row}</td>`
      }
      html += '</tr>'
    })
    html += '</table>'
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `indicadores_${activeTab}_${new Date().toISOString().split('T')[0]}.xls`
    link.click()
  }

  const renderActiveTab = () => {
    const tabProps = { data, loading }
    
    switch (activeTab) {
      case 'resumen':
        return <ResumenTab {...tabProps} />
      case 'partos':
        return <PartosTab {...tabProps} />
      case 'recien-nacidos':
        return <RecienNacidosTab {...tabProps} />
      case 'buenas-practicas':
        return <BuenasPracticasTab {...tabProps} />
      case 'complicaciones':
        return <ComplicacionesTab {...tabProps} />
      case 'rem':
        return <REMTab {...tabProps} />
      case 'urni':
        return <URNITab {...tabProps} />
      case 'carga-laboral':
        return <CargaLaboralTab {...tabProps} />
      default:
        return <ResumenTab {...tabProps} />
    }
  }

  const getPeriodLabel = () => {
    if (!filters.fechaInicio && !filters.fechaFin) return 'Todo el período'
    if (filters.fechaInicio && filters.fechaFin) {
      // Handle both Date objects and string dates
      const startDate = filters.fechaInicio instanceof Date 
        ? filters.fechaInicio 
        : new Date(filters.fechaInicio + 'T00:00:00')
      const endDate = filters.fechaFin instanceof Date 
        ? filters.fechaFin 
        : new Date(filters.fechaFin + 'T00:00:00')
      const start = startDate.toLocaleDateString('es-CL')
      const end = endDate.toLocaleDateString('es-CL')
      return `${start} - ${end}`
    }
    return 'Período personalizado'
  }

  return (
    <div className={styles.content}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h1>
            <i className={`fa-solid fa-chart-line ${styles.headerIcon}`}></i>
            Indicadores y Analítica
          </h1>
          <p className={styles.headerSubtitle}>
            Dashboard completo del sistema SRORN
          </p>
        </div>
        <div className={styles.headerActions}>
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {/* Período actual */}
      <div className={styles.periodBadge}>
        <i className={`fa-regular fa-calendar ${styles.periodIcon}`}></i>
        <span>{getPeriodLabel()}</span>
        {data && !loading && (
          <span className={styles.lastUpdate}>
            Actualizado: {new Date().toLocaleTimeString('es-CL')}
          </span>
        )}
      </div>

      {/* Barra de filtros */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onPresetSelect={handleDatePreset}
        options={filterOptions}
      />

      {/* Error */}
      {error && (
        <div className={styles.errorBanner}>
          <i className={`fa-solid fa-exclamation-triangle ${styles.errorIcon}`}></i>
          <span>{error}</span>
          <button onClick={loadIndicadores} className={styles.retryBtn}>
            Reintentar
          </button>
        </div>
      )}

      {/* Navegación de tabs */}
      <div className={styles.tabsNav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`${tab.icon} ${styles.tabIcon}`}></i>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      <div className={styles.tabContent}>
        {renderActiveTab()}
      </div>
    </div>
  )
}

