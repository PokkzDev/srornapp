'use client'
import { StatCard, ChartCard, ProgressBar } from '@/components/indicadores'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import styles from './tabs.module.css'

// Metas recomendadas (basadas en guías OMS/MINSAL)
const METAS = {
  oxitocinaProfilactica: 95,
  ligaduraTardiaCordon: 90,
  contactoPielPielMadre30min: 90,
  lactancia60minAlMenosUnRn: 90,
  acompananteDuranteTrabajo: 85,
  libertadMovimiento: 80,
  planDeParto: 50,
  episiotomia: 10, // Inverso - menor es mejor
  embarazoNoControlado: 5, // Inverso - menor es mejor
}

const PRACTICAS_CONFIG = {
  oxitocinaProfilactica: { label: 'Oxitocina Profiláctica', icon: 'fa-solid fa-syringe', invert: false },
  ligaduraTardiaCordon: { label: 'Ligadura Tardía Cordón', icon: 'fa-solid fa-link', invert: false },
  atencionPertinenciaCultural: { label: 'Pertinencia Cultural', icon: 'fa-solid fa-globe', invert: false },
  contactoPielPielMadre30min: { label: 'Piel a Piel Madre 30min', icon: 'fa-solid fa-hand-holding-heart', invert: false },
  contactoPielPielAcomp30min: { label: 'Piel a Piel Acompañante', icon: 'fa-solid fa-people-group', invert: false },
  lactancia60minAlMenosUnRn: { label: 'Lactancia en 60 min', icon: 'fa-solid fa-baby', invert: false },
  acompananteDuranteTrabajo: { label: 'Acompañamiento Trabajo', icon: 'fa-solid fa-handshake', invert: false },
  acompananteSoloExpulsivo: { label: 'Acompañamiento Expulsivo', icon: 'fa-solid fa-users', invert: false },
  planDeParto: { label: 'Plan de Parto', icon: 'fa-solid fa-clipboard-list', invert: false },
  episiotomia: { label: 'Episiotomía', icon: 'fa-solid fa-scissors', invert: true }, // Menor es mejor
  embarazoNoControlado: { label: 'Embarazo No Controlado', icon: 'fa-solid fa-triangle-exclamation', invert: true },
  libertadMovimiento: { label: 'Libertad Movimiento', icon: 'fa-solid fa-person-walking', invert: false },
}

export default function BuenasPracticasTab({ data, loading }) {
  if (loading || !data?.buenasPracticas) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { buenasPracticas } = data

  // Preparar datos para el radar chart
  const radarData = Object.entries(buenasPracticas)
    .filter(([key]) => PRACTICAS_CONFIG[key] && !PRACTICAS_CONFIG[key].invert)
    .map(([key, val]) => ({
      practica: PRACTICAS_CONFIG[key]?.label.substring(0, 15) || key,
      valor: parseFloat(val?.tasa || 0),
      meta: METAS[key] || 80,
    }))

  // Preparar datos para barras
  const barData = Object.entries(buenasPracticas)
    .filter(([key]) => PRACTICAS_CONFIG[key])
    .map(([key, val]) => ({
      name: PRACTICAS_CONFIG[key]?.label || key,
      tasa: parseFloat(val?.tasa || 0),
      meta: METAS[key] || 80,
      invert: PRACTICAS_CONFIG[key]?.invert || false,
      cantidad: val?.cantidad || 0,
      total: val?.total || 0,
    }))
    .sort((a, b) => b.tasa - a.tasa)

  // Prácticas que cumplen/no cumplen meta
  const cumplenMeta = barData.filter(p => p.invert ? p.tasa <= p.meta : p.tasa >= p.meta).length
  const noCumplenMeta = barData.length - cumplenMeta

  return (
    <div className={styles.tabContent}>
      {/* KPIs de cumplimiento */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Prácticas Evaluadas"
          value={barData.length}
          icon={<i className="fa-solid fa-chart-pie"></i>}
          variant="info"
        />
        <StatCard
          title="Cumplen Meta"
          value={cumplenMeta}
          icon={<i className="fa-solid fa-circle-check"></i>}
          variant="success"
          subtitle={`${((cumplenMeta / barData.length) * 100).toFixed(0)}% del total`}
        />
        <StatCard
          title="Bajo Meta"
          value={noCumplenMeta}
          icon={<i className="fa-solid fa-triangle-exclamation"></i>}
          variant={noCumplenMeta > 3 ? 'danger' : 'warning'}
          subtitle="Requieren atención"
        />
        <StatCard
          title="Piel a Piel 30min"
          value={`${buenasPracticas.contactoPielPielMadre30min?.tasa || 0}%`}
          icon={<i className="fa-solid fa-hand-holding-heart"></i>}
          variant={parseFloat(buenasPracticas.contactoPielPielMadre30min?.tasa || 0) >= 90 ? 'success' : 'warning'}
          subtitle={`Meta: ≥90%`}
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Radar de prácticas */}
        <ChartCard title="Radar de Cumplimiento" subtitle="Prácticas positivas" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="practica" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Actual" dataKey="valor" stroke="#0066A4" fill="#0066A4" fillOpacity={0.5} />
              <Radar name="Meta" dataKey="meta" stroke="#28A745" fill="#28A745" fillOpacity={0.2} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Barras comparativas */}
        <ChartCard title="Tasas vs Metas" subtitle="Todas las prácticas" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 30, left: 150, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
              <Tooltip formatter={(value) => [`${value}%`, 'Tasa']} />
              <Legend />
              <Bar dataKey="tasa" name="Actual" fill="#0066A4" radius={[0, 4, 4, 0]} />
              <Bar dataKey="meta" name="Meta" fill="#28A745" fillOpacity={0.3} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detalle de cada práctica con progress bar */}
      <div className={styles.practicesSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-chart-bar"></i> Detalle por Práctica</h3>
        
        <div className={styles.practicesGrid}>
          {/* Prácticas positivas (mayor es mejor) */}
          <div className={styles.practiceCategory}>
            <h4 className={styles.categoryTitle}><i className="fa-solid fa-star"></i> Prácticas Positivas</h4>
            <div className={styles.practicesList}>
              {Object.entries(buenasPracticas)
                .filter(([key]) => PRACTICAS_CONFIG[key] && !PRACTICAS_CONFIG[key].invert)
                .map(([key, val]) => (
                  <div key={key} className={styles.practiceItem}>
                    <div className={styles.practiceHeader}>
                      <span className={styles.practiceIcon}><i className={PRACTICAS_CONFIG[key]?.icon}></i></span>
                      <span className={styles.practiceName}>{PRACTICAS_CONFIG[key]?.label}</span>
                      <span className={styles.practiceStat}>
                        {val?.cantidad || 0} / {val?.total || 0}
                      </span>
                    </div>
                    <ProgressBar
                      value={parseFloat(val?.tasa || 0)}
                      target={METAS[key]}
                      showTarget={!!METAS[key]}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Prácticas a minimizar */}
          <div className={styles.practiceCategory}>
            <h4 className={styles.categoryTitle}><i className="fa-solid fa-triangle-exclamation"></i> Prácticas a Minimizar</h4>
            <div className={styles.practicesList}>
              {Object.entries(buenasPracticas)
                .filter(([key]) => PRACTICAS_CONFIG[key]?.invert)
                .map(([key, val]) => (
                  <div key={key} className={styles.practiceItem}>
                    <div className={styles.practiceHeader}>
                      <span className={styles.practiceIcon}><i className={PRACTICAS_CONFIG[key]?.icon}></i></span>
                      <span className={styles.practiceName}>{PRACTICAS_CONFIG[key]?.label}</span>
                      <span className={styles.practiceStat}>
                        {val?.cantidad || 0} / {val?.total || 0}
                      </span>
                    </div>
                    <ProgressBar
                      value={parseFloat(val?.tasa || 0)}
                      target={METAS[key]}
                      showTarget={!!METAS[key]}
                      invertThreshold
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className={styles.recommendationsSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-lightbulb"></i> Áreas de Mejora Prioritarias</h3>
        <div className={styles.recommendationsGrid}>
          {barData
            .filter(p => p.invert ? p.tasa > p.meta : p.tasa < p.meta)
            .slice(0, 4)
            .map((practica, idx) => (
              <div key={idx} className={`${styles.alert} ${styles.alertInfo}`}>
                <span className={styles.alertIcon}>
                  <i className={Object.entries(PRACTICAS_CONFIG).find(([k]) => PRACTICAS_CONFIG[k]?.label === practica.name)?.[1]?.icon || 'fa-solid fa-thumbtack'}></i>
                </span>
                <div>
                  <strong>{practica.name}</strong>
                  <p>
                    Actual: {practica.tasa}% | Meta: {practica.invert ? '≤' : '≥'}{practica.meta}% | 
                    Diferencia: {Math.abs(practica.tasa - practica.meta).toFixed(1)}pp
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
