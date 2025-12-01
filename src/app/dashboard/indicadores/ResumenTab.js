'use client'
import { StatCard, ChartCard, ProgressBar } from '@/components/indicadores'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#0066A4', '#28A745', '#FFC107', '#DC3545', '#17A2B8', '#6F42C1']

export default function ResumenTab({ data, loading }) {
  if (loading || !data) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4,5,6].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { partos, recienNacidos, episodiosUrni, episodiosMadre, operacionales, buenasPracticas, complicaciones } = data

  // KPIs principales
  const kpis = [
    { 
      title: 'Total Partos', 
      value: partos?.total || 0, 
      icon: <i className="fa-solid fa-baby"></i>,
      variant: 'info',
      subtitle: `${operacionales?.actividadReciente?.partos || 0} últimos 30 días`,
      trend: partos?.tendencia
    },
    { 
      title: 'Recién Nacidos', 
      value: recienNacidos?.total || 0, 
      icon: <i className="fa-solid fa-baby-carriage"></i>,
      variant: 'success',
      subtitle: `Peso promedio: ${recienNacidos?.pesoPromedio || 0}g`
    },
    { 
      title: 'Tasa Cesárea', 
      value: `${partos?.cesareas?.tasa || 0}%`, 
      icon: <i className="fa-solid fa-hospital"></i>,
      variant: parseFloat(partos?.cesareas?.tasa || 0) > 15 ? 'warning' : 'success',
      subtitle: `${partos?.cesareas?.total || 0} cesáreas`
    },
    { 
      title: 'Episodios URNI', 
      value: episodiosUrni?.total || 0, 
      icon: <i className="fa-solid fa-stethoscope"></i>,
      variant: 'info',
      subtitle: `${episodiosUrni?.activos || 0} activos`
    },
    { 
      title: 'Estadía Promedio', 
      value: `${episodiosUrni?.diasEstadiaPromedio || 0} días`, 
      icon: <i className="fa-regular fa-calendar-days"></i>,
      variant: 'default',
      subtitle: 'URNI'
    },
    { 
      title: 'Complicaciones', 
      value: complicaciones?.total || 0, 
      icon: <i className="fa-solid fa-triangle-exclamation"></i>,
      variant: complicaciones?.total > 0 ? 'danger' : 'success',
      subtitle: `Tasa: ${complicaciones?.tasaComplicaciones || 0}%`
    },
  ]

  // Datos para gráfico de actividad reciente
  const actividadData = operacionales?.actividadReciente ? [
    { nombre: 'Madres', cantidad: operacionales.actividadReciente.madres },
    { nombre: 'Partos', cantidad: operacionales.actividadReciente.partos },
    { nombre: 'RN', cantidad: operacionales.actividadReciente.recienNacidos },
    { nombre: 'Ep. URNI', cantidad: operacionales.actividadReciente.episodiosUrni },
    { nombre: 'Controles', cantidad: operacionales.actividadReciente.controles },
    { nombre: 'Atenciones', cantidad: operacionales.actividadReciente.atenciones },
  ] : []

  // Métricas de buenas prácticas destacadas
  const practicasDestacadas = [
    { label: 'Contacto Piel a Piel (30 min)', value: parseFloat(buenasPracticas?.contactoPielPielMadre30min?.tasa || 0), target: 90 },
    { label: 'Lactancia en 60 min', value: parseFloat(buenasPracticas?.lactancia60minAlMenosUnRn?.tasa || 0), target: 90 },
    { label: 'Ligadura Tardía Cordón', value: parseFloat(buenasPracticas?.ligaduraTardiaCordon?.tasa || 0), target: 85 },
    { label: 'Acompañamiento en Trabajo', value: parseFloat(buenasPracticas?.acompananteDuranteTrabajo?.tasa || 0), target: 80 },
  ]

  return (
    <div className={styles.tabContent}>
      {/* KPIs Grid */}
      <div className={styles.cardsGrid}>
        {kpis.map((kpi, idx) => (
          <StatCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            variant={kpi.variant}
            subtitle={kpi.subtitle}
            trend={kpi.trend ? {
              value: kpi.trend.porcentaje,
              isPositive: kpi.trend.direccion === 'up',
              label: 'vs período anterior'
            } : undefined}
          />
        ))}
      </div>

      {/* Gráficos principales */}
      <div className={styles.chartsGrid}>
        {/* Actividad últimos 30 días */}
        <ChartCard 
          title="Actividad Últimos 30 Días" 
          subtitle="Registros por tipo de entidad"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actividadData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="cantidad" fill="#0066A4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Buenas Prácticas Destacadas */}
        <ChartCard 
          title="Cumplimiento Buenas Prácticas" 
          subtitle="Principales indicadores de calidad"
          height={300}
        >
          <div className={styles.progressList}>
            {practicasDestacadas.map((practica, idx) => (
              <ProgressBar
                key={idx}
                label={practica.label}
                value={practica.value}
                target={practica.target}
              />
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Alertas y Resumen */}
      <div className={styles.alertsSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-thumbtack"></i> Puntos de Atención</h3>
        <div className={styles.alertsGrid}>
          {parseFloat(partos?.cesareas?.tasa || 0) > 15 && (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-exclamation-triangle"></i></span>
              <div>
                <strong>Tasa de Cesárea Elevada</strong>
                <p>La tasa de cesárea ({partos?.cesareas?.tasa}%) supera el 15% recomendado por OMS</p>
              </div>
            </div>
          )}
          {complicaciones?.total > 0 && (
            <div className={`${styles.alert} ${styles.alertDanger}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-circle-exclamation"></i></span>
              <div>
                <strong>{complicaciones.total} Complicaciones Registradas</strong>
                <p>HPP: {complicaciones.hpp}, Preeclampsia: {complicaciones.preeclampsia}, Transfusiones: {complicaciones.transfusiones}</p>
              </div>
            </div>
          )}
          {parseFloat(buenasPracticas?.contactoPielPielMadre30min?.tasa || 0) < 80 && (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-lightbulb"></i></span>
              <div>
                <strong>Mejorar Contacto Piel a Piel</strong>
                <p>El contacto piel a piel está en {buenasPracticas?.contactoPielPielMadre30min?.tasa}%, meta recomendada: 90%</p>
              </div>
            </div>
          )}
          {episodiosUrni?.activos > 0 && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-circle-check"></i></span>
              <div>
                <strong>{episodiosUrni.activos} RN Activos en URNI</strong>
                <p>Distribución: {episodiosUrni.porServicio?.map(s => `${s.servicio}: ${s.cantidad}`).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Totales globales */}
      <div className={styles.totalsSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-chart-simple"></i> Totales Históricos</h3>
        <div className={styles.totalsGrid}>
          <div className={styles.totalItem}>
            <span className={styles.totalValue}>{operacionales?.totales?.madres || 0}</span>
            <span className={styles.totalLabel}>Madres</span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalValue}>{operacionales?.totales?.partos || 0}</span>
            <span className={styles.totalLabel}>Partos</span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalValue}>{operacionales?.totales?.recienNacidos || 0}</span>
            <span className={styles.totalLabel}>Recién Nacidos</span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalValue}>{operacionales?.totales?.episodiosUrni || 0}</span>
            <span className={styles.totalLabel}>Episodios URNI</span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalValue}>{operacionales?.totales?.episodiosMadre || 0}</span>
            <span className={styles.totalLabel}>Episodios Madre</span>
          </div>
        </div>
      </div>
    </div>
  )
}
