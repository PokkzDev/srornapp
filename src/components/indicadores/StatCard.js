'use client'
import styles from './StatCard.module.css'

/**
 * StatCard - Tarjeta de estadística con variantes de color
 * @param {string} title - Título de la métrica
 * @param {string|number} value - Valor principal
 * @param {string} subtitle - Subtítulo o descripción adicional
 * @param {string} variant - Variante de color: 'default' | 'success' | 'warning' | 'danger' | 'info'
 * @param {string} icon - Emoji o ícono a mostrar
 * @param {object} trend - Objeto con { value: number, isPositive: boolean, label: string }
 * @param {boolean} loading - Estado de carga
 */
export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  variant = 'default', 
  icon,
  trend,
  loading = false,
  onClick
}) {
  const cardClasses = [
    styles.card,
    styles[variant],
    onClick ? styles.clickable : ''
  ].filter(Boolean).join(' ')

  if (loading) {
    return (
      <div className={cardClasses}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonValue}></div>
          <div className={styles.skeletonSubtitle}></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      
      <div className={styles.valueContainer}>
        <span className={styles.value}>{value}</span>
        {trend && (
          <div className={`${styles.trend} ${trend.isPositive ? styles.trendUp : styles.trendDown}`}>
            <span className={styles.trendIcon}>
              {trend.isPositive ? '↑' : '↓'}
            </span>
            <span className={styles.trendValue}>{trend.value}%</span>
            {trend.label && <span className={styles.trendLabel}>{trend.label}</span>}
          </div>
        )}
      </div>
      
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  )
}
