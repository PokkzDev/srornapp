'use client'
import { useState } from 'react'
import styles from './FilterBar.module.css'

/**
 * FilterBar - Barra de filtros multidimensional
 * @param {object} filters - Estado actual de los filtros
 * @param {function} onFilterChange - Callback al cambiar filtros
 * @param {boolean} showTipoParto - Mostrar filtro de tipo de parto
 * @param {boolean} showServicio - Mostrar filtro de servicio URNI
 * @param {boolean} showSexo - Mostrar filtro de sexo
 * @param {object} customFilters - Filtros personalizados adicionales
 */
export default function FilterBar({ 
  filters, 
  onFilterChange,
  showTipoParto = false,
  showServicio = false,
  showSexo = false,
  customFilters = [],
  onExport,
  onPrint
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const handleClear = () => {
    onFilterChange({
      fechaInicio: '',
      fechaFin: '',
      tipoParto: '',
      servicio: '',
      sexo: '',
      ...customFilters.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
    })
  }

  const tipoPartoOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'VAGINAL', label: 'Vaginal' },
    { value: 'INSTRUMENTAL', label: 'Instrumental' },
    { value: 'CESAREA_ELECTIVA', label: 'Cesárea Electiva' },
    { value: 'CESAREA_URGENCIA', label: 'Cesárea Urgencia' },
    { value: 'PREHOSPITALARIO', label: 'Prehospitalario' },
    { value: 'DOMICILIO_PROFESIONAL', label: 'Domicilio c/Profesional' },
    { value: 'DOMICILIO_SIN_PROFESIONAL', label: 'Domicilio s/Profesional' }
  ]

  const servicioOptions = [
    { value: '', label: 'Todos los servicios' },
    { value: 'URNI', label: 'URNI' },
    { value: 'UCIN', label: 'UCIN' },
    { value: 'NEONATOLOGIA', label: 'Neonatología' }
  ]

  const sexoOptions = [
    { value: '', label: 'Todos' },
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'I', label: 'Indeterminado' }
  ]

  const hasActiveFilters = filters.fechaInicio || filters.fechaFin || 
    filters.tipoParto || filters.servicio || filters.sexo ||
    customFilters.some(f => filters[f.key])

  // Rangos de fecha predefinidos
  const setPresetRange = (preset) => {
    const today = new Date()
    let fechaInicio, fechaFin
    
    switch(preset) {
      case 'hoy':
        fechaInicio = fechaFin = today.toISOString().split('T')[0]
        break
      case 'semana':
        fechaFin = today.toISOString().split('T')[0]
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        fechaInicio = weekAgo.toISOString().split('T')[0]
        break
      case 'mes':
        fechaFin = today.toISOString().split('T')[0]
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        fechaInicio = monthAgo.toISOString().split('T')[0]
        break
      case 'trimestre':
        fechaFin = today.toISOString().split('T')[0]
        const quarterAgo = new Date(today)
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        fechaInicio = quarterAgo.toISOString().split('T')[0]
        break
      case 'año':
        fechaFin = today.toISOString().split('T')[0]
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        fechaInicio = yearAgo.toISOString().split('T')[0]
        break
      default:
        return
    }
    
    onFilterChange({ ...filters, fechaInicio, fechaFin })
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainRow}>
        <div className={styles.dateFilters}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Desde</label>
            <input
              type="date"
              className={styles.input}
              value={filters.fechaInicio || ''}
              onChange={(e) => handleChange('fechaInicio', e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Hasta</label>
            <input
              type="date"
              className={styles.input}
              value={filters.fechaFin || ''}
              onChange={(e) => handleChange('fechaFin', e.target.value)}
            />
          </div>
          <div className={styles.presets}>
            <button 
              type="button" 
              className={styles.presetBtn}
              onClick={() => setPresetRange('hoy')}
            >
              Hoy
            </button>
            <button 
              type="button" 
              className={styles.presetBtn}
              onClick={() => setPresetRange('semana')}
            >
              7 días
            </button>
            <button 
              type="button" 
              className={styles.presetBtn}
              onClick={() => setPresetRange('mes')}
            >
              30 días
            </button>
            <button 
              type="button" 
              className={styles.presetBtn}
              onClick={() => setPresetRange('trimestre')}
            >
              3 meses
            </button>
            <button 
              type="button" 
              className={styles.presetBtn}
              onClick={() => setPresetRange('año')}
            >
              1 año
            </button>
          </div>
        </div>

        <div className={styles.actionsRow}>
          {(showTipoParto || showServicio || showSexo || customFilters.length > 0) && (
            <button 
              type="button"
              className={styles.expandBtn}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <i className={isExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}></i> {isExpanded ? 'Menos filtros' : 'Más filtros'}
            </button>
          )}
          
          {hasActiveFilters && (
            <button 
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
            >
              <i className="fa-solid fa-xmark"></i> Limpiar
            </button>
          )}
          
          {onExport && (
            <button 
              type="button"
              className={styles.exportBtn}
              onClick={onExport}
            >
              <i className="fa-solid fa-download"></i> Exportar
            </button>
          )}
          
          {onPrint && (
            <button 
              type="button"
              className={styles.printBtn}
              onClick={onPrint}
            >
              <i className="fa-solid fa-print"></i> Imprimir
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expandedRow}>
          {showTipoParto && (
            <div className={styles.filterGroup}>
              <label className={styles.label}>Tipo de Parto</label>
              <select
                className={styles.select}
                value={filters.tipoParto || ''}
                onChange={(e) => handleChange('tipoParto', e.target.value)}
              >
                {tipoPartoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          
          {showServicio && (
            <div className={styles.filterGroup}>
              <label className={styles.label}>Servicio</label>
              <select
                className={styles.select}
                value={filters.servicio || ''}
                onChange={(e) => handleChange('servicio', e.target.value)}
              >
                {servicioOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          
          {showSexo && (
            <div className={styles.filterGroup}>
              <label className={styles.label}>Sexo RN</label>
              <select
                className={styles.select}
                value={filters.sexo || ''}
                onChange={(e) => handleChange('sexo', e.target.value)}
              >
                {sexoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          
          {customFilters.map(filter => (
            <div key={filter.key} className={styles.filterGroup}>
              <label className={styles.label}>{filter.label}</label>
              <select
                className={styles.select}
                value={filters[filter.key] || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
              >
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
