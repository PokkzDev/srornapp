'use client'
import styles from './TrendIndicator.module.css'

/**
 * TrendIndicator - Indicador de tendencia compacto
 * @param {number} current - Valor actual
 * @param {number} previous - Valor período anterior
 * @param {string} format - Formato: 'number' | 'percent' | 'currency'
 * @param {boolean} invertColors - Invertir colores (para métricas donde bajar es bueno)
 * @param {string} label - Etiqueta adicional
 */
export default function TrendIndicator({ 
  current, 
  previous, 
  format = 'number',
  invertColors = false,
  label = 'vs período anterior',
  showValue = true
}) {
  if (previous === null || previous === undefined || previous === 0) {
    return null
  }

  const change = ((current - previous) / previous) * 100
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 0.5

  // Determinar si el cambio es "bueno" o "malo"
  // Por defecto: subir es bueno, bajar es malo
  // Con invertColors: bajar es bueno, subir es malo
  const isGood = invertColors ? !isPositive : isPositive

  const getVariantClass = () => {
    if (isNeutral) return styles.neutral
    return isGood ? styles.positive : styles.negative
  }

  const formatChange = () => {
    const absChange = Math.abs(change)
    if (format === 'percent') {
      return `${absChange.toFixed(1)}pp`
    }
    return `${absChange.toFixed(1)}%`
  }

  return (
    <div className={`${styles.container} ${getVariantClass()}`}>
      <span className={styles.icon}>
        {isNeutral ? '→' : (isPositive ? '↑' : '↓')}
      </span>
      {showValue && (
        <span className={styles.value}>{formatChange()}</span>
      )}
      {label && (
        <span className={styles.label}>{label}</span>
      )}
    </div>
  )
}

/**
 * Calcula la tendencia entre dos valores
 */
export function calcularTendencia(actual, anterior) {
  if (!anterior || anterior === 0) return null
  
  const cambio = ((actual - anterior) / anterior) * 100
  return {
    value: Math.abs(cambio).toFixed(1),
    isPositive: cambio > 0,
    cambioAbsoluto: actual - anterior,
    porcentaje: cambio
  }
}
