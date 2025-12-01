'use client'
import styles from './ChartCard.module.css'

/**
 * ChartCard - Contenedor de gráficos con título y controles
 * @param {string} title - Título del gráfico
 * @param {string} subtitle - Descripción del gráfico
 * @param {React.ReactNode} children - Contenido del gráfico (Recharts)
 * @param {React.ReactNode} actions - Botones o controles adicionales
 * @param {number} height - Altura del contenedor del gráfico
 * @param {boolean} loading - Estado de carga
 * @param {string} emptyMessage - Mensaje cuando no hay datos
 * @param {boolean} isEmpty - Si no hay datos que mostrar
 */
export default function ChartCard({ 
  title, 
  subtitle,
  children, 
  actions,
  height = 300,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  isEmpty = false,
  fullWidth = false
}) {
  const cardClasses = [
    styles.card,
    fullWidth ? styles.fullWidth : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      
      <div className={styles.content} style={{ height }}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span className={styles.loadingText}>Cargando datos...</span>
          </div>
        ) : isEmpty ? (
          <div className={styles.emptyContainer}>
            <span className={styles.emptyIcon}><i className="fa-solid fa-chart-column"></i></span>
            <span className={styles.emptyText}>{emptyMessage}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
