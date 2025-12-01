'use client'
import styles from './ProgressBar.module.css'

/**
 * ProgressBar - Barra de progreso con target
 * @param {number} value - Valor actual (0-100)
 * @param {number} target - Valor objetivo
 * @param {string} label - Etiqueta
 * @param {string} variant - Variante de color según cumplimiento
 * @param {boolean} showTarget - Mostrar línea de target
 * @param {boolean} invertThreshold - Invertir lógica (menor es mejor)
 */
export default function ProgressBar({ 
  value, 
  target,
  label,
  variant,
  showTarget = true,
  invertThreshold = false,
  suffix = '%'
}) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  
  // Determinar variante automáticamente si no se proporciona
  const getAutoVariant = () => {
    if (variant) return variant
    if (!target) return 'info'
    
    const meetsTarget = invertThreshold 
      ? value <= target 
      : value >= target
    
    if (meetsTarget) return 'success'
    
    const threshold = invertThreshold
      ? target * 1.2  // 20% por encima del target
      : target * 0.8  // 80% del target
    
    const nearTarget = invertThreshold
      ? value <= threshold
      : value >= threshold
    
    return nearTarget ? 'warning' : 'danger'
  }

  const currentVariant = getAutoVariant()
  const targetPosition = target ? Math.min(100, Math.max(0, target)) : null

  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{value.toFixed(1)}{suffix}</span>
        </div>
      )}
      
      <div className={styles.barContainer}>
        <div 
          className={`${styles.bar} ${styles[currentVariant]}`}
          style={{ width: `${normalizedValue}%` }}
        />
        
        {showTarget && targetPosition && (
          <div 
            className={styles.targetLine}
            style={{ left: `${targetPosition}%` }}
          >
            <span className={styles.targetLabel}>Meta: {target}{suffix}</span>
          </div>
        )}
      </div>
      
      {target && (
        <div className={styles.footer}>
          <span className={`${styles.status} ${styles[currentVariant]}`}>
            {getStatusText(value, target, invertThreshold)}
          </span>
        </div>
      )}
    </div>
  )
}

function getStatusText(value, target, invertThreshold) {
  const meetsTarget = invertThreshold ? value <= target : value >= target
  
  if (meetsTarget) {
    return '✓ Cumple meta'
  }
  
  const diff = Math.abs(value - target)
  const direction = invertThreshold 
    ? (value > target ? 'por encima' : 'por debajo')
    : (value < target ? 'por debajo' : 'por encima')
  
  return `${diff.toFixed(1)}pp ${direction} de la meta`
}
