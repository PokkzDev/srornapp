'use client'
import { StatCard, ChartCard, DataTable } from '@/components/indicadores'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#0066A4', '#28A745', '#FFC107', '#DC3545', '#17A2B8', '#6F42C1', '#E83E8C', '#20C997']

export default function REMTab({ data, loading }) {
  if (loading || !data?.rem) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { rem } = data

  // Datos para gráficos de grupos etarios
  const gruposEtariosData = rem.gruposEtarios?.filter(g => g.cantidad > 0).map(g => ({
    name: g.grupo,
    value: g.cantidad,
    porcentaje: g.porcentaje
  })) || []

  // Datos para gráfico de barras demográficas
  const demograficosData = [
    { nombre: 'Pueblos Originarios', tasa: parseFloat(rem.puebloOriginario?.tasa || 0), cantidad: rem.puebloOriginario?.cantidad || 0 },
    { nombre: 'Migrantes', tasa: parseFloat(rem.migrantes?.tasa || 0), cantidad: rem.migrantes?.cantidad || 0 },
    { nombre: 'Discapacidad', tasa: parseFloat(rem.discapacidad?.tasa || 0), cantidad: rem.discapacidad?.cantidad || 0 },
    { nombre: 'Identidad Trans', tasa: parseFloat(rem.identidadTrans?.tasa || 0), cantidad: rem.identidadTrans?.cantidad || 0 },
    { nombre: 'Privadas Libertad', tasa: parseFloat(rem.privadaLibertad?.tasa || 0), cantidad: rem.privadaLibertad?.cantidad || 0 },
  ]

  // Datos clínicos REM
  const clinicosRemData = [
    { nombre: 'Hepatitis B+', tasa: parseFloat(rem.hepatitisBPositiva?.tasa || 0), cantidad: rem.hepatitisBPositiva?.cantidad || 0 },
    { nombre: 'Control Prenatal', tasa: parseFloat(rem.controlPrenatal?.tasa || 0), cantidad: rem.controlPrenatal?.cantidad || 0 },
  ]

  // Datos de tabla grupos etarios
  const tableData = rem.gruposEtarios?.map(g => ({
    grupo: g.grupo,
    cantidad: g.cantidad,
    porcentaje: `${g.porcentaje}%`
  })) || []

  return (
    <div className={styles.tabContent}>
      {/* KPIs principales */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Madres"
          value={rem.totalMadres || 0}
          icon={<i className="fa-solid fa-person-pregnant"></i>}
          variant="info"
          subtitle="En el período"
        />
        <StatCard
          title="Pueblos Originarios"
          value={rem.puebloOriginario?.cantidad || 0}
          icon={<i className="fa-solid fa-globe"></i>}
          variant="default"
          subtitle={`${rem.puebloOriginario?.tasa || 0}% del total`}
        />
        <StatCard
          title="Migrantes"
          value={rem.migrantes?.cantidad || 0}
          icon={<i className="fa-solid fa-plane"></i>}
          variant="default"
          subtitle={`${rem.migrantes?.tasa || 0}% del total`}
        />
        <StatCard
          title="Con Discapacidad"
          value={rem.discapacidad?.cantidad || 0}
          icon={<i className="fa-solid fa-wheelchair"></i>}
          variant="default"
          subtitle={`${rem.discapacidad?.tasa || 0}% del total`}
        />
      </div>

      {/* KPIs clínicos */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Control Prenatal"
          value={`${rem.controlPrenatal?.tasa || 0}%`}
          icon={<i className="fa-solid fa-stethoscope"></i>}
          variant={parseFloat(rem.controlPrenatal?.tasa || 0) >= 80 ? 'success' : 'warning'}
          subtitle={`${rem.controlPrenatal?.cantidad || 0} de ${rem.totalMadres || 0}`}
        />
        <StatCard
          title="Hepatitis B+"
          value={rem.hepatitisBPositiva?.cantidad || 0}
          icon={<i className="fa-solid fa-flask"></i>}
          variant={rem.hepatitisBPositiva?.cantidad > 0 ? 'warning' : 'success'}
          subtitle={`${rem.hepatitisBPositiva?.tasa || 0}% del total`}
        />
        <StatCard
          title="RN Pueblos Originarios"
          value={rem.rnPuebloOriginario?.cantidad || 0}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="default"
          subtitle={`${rem.rnPuebloOriginario?.tasa || 0}% de RN`}
        />
        <StatCard
          title="RN Migrantes"
          value={rem.rnMigrante?.cantidad || 0}
          icon={<i className="fa-solid fa-earth-americas"></i>}
          variant="default"
          subtitle={`${rem.rnMigrante?.tasa || 0}% de RN`}
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Grupos Etarios */}
        {gruposEtariosData.length > 0 ? (
          <ChartCard title="Distribución por Grupo Etario" height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gruposEtariosData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [value, 'Cantidad']} />
                <Bar dataKey="value" name="Cantidad" fill="#0066A4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Distribución por Grupo Etario" height={350} isEmpty emptyMessage="Sin datos de edad" />
        )}

        {/* Variables demográficas REM */}
        <ChartCard title="Variables Demográficas REM (%)" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demograficosData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(value) => [`${value}%`, 'Tasa']} />
              <Bar dataKey="tasa" name="Tasa %" fill="#17A2B8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie de grupos etarios */}
        {gruposEtariosData.length > 0 && (
          <ChartCard title="Distribución Etaria (Pie)" height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gruposEtariosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {gruposEtariosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Variables clínicas */}
        <ChartCard title="Variables Clínicas REM (%)" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clinicosRemData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}%`, 'Tasa']} />
              <Bar dataKey="tasa" name="Tasa %" fill="#28A745" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Alertas especiales */}
      <div className={styles.alertsSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-thumbtack"></i> Puntos de Atención REM</h3>
        <div className={styles.alertsGrid}>
          {parseFloat(rem.controlPrenatal?.tasa || 0) < 80 && (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-triangle-exclamation"></i></span>
              <div>
                <strong>Bajo Control Prenatal</strong>
                <p>Solo {rem.controlPrenatal?.tasa}% de madres con control prenatal (meta: ≥80%)</p>
              </div>
            </div>
          )}
          {(rem.hepatitisBPositiva?.cantidad || 0) > 0 && (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-flask"></i></span>
              <div>
                <strong>Casos Hepatitis B+</strong>
                <p>{rem.hepatitisBPositiva?.cantidad} madres con Hepatitis B positiva - verificar profilaxis RN</p>
              </div>
            </div>
          )}
          {parseFloat(rem.puebloOriginario?.tasa || 0) > 10 && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-globe"></i></span>
              <div>
                <strong>Población Pueblos Originarios</strong>
                <p>{rem.puebloOriginario?.tasa}% pertenece a pueblos originarios - considerar pertinencia cultural</p>
              </div>
            </div>
          )}
          {parseFloat(rem.migrantes?.tasa || 0) > 15 && (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <span className={styles.alertIcon}><i className="fa-solid fa-plane"></i></span>
              <div>
                <strong>Población Migrante Significativa</strong>
                <p>{rem.migrantes?.tasa}% de madres son migrantes - considerar barreras idiomáticas y culturales</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla detallada de grupos etarios */}
      {tableData.length > 0 && (
        <div className={styles.tableSection}>
          <h3 className={styles.sectionTitle}><i className="fa-solid fa-clipboard-list"></i> Detalle por Grupo Etario</h3>
          <DataTable 
            columns={[
              { key: 'grupo', label: 'Grupo Etario', sortable: true },
              { key: 'cantidad', label: 'Cantidad', sortable: true, align: 'center' },
              { key: 'porcentaje', label: 'Porcentaje', sortable: true, align: 'center' },
            ]}
            data={tableData}
            pageSize={10}
          />
        </div>
      )}

      {/* Resumen para reporte */}
      <div className={styles.summarySection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-file-lines"></i> Resumen para Reporte REM</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Madres:</span>
            <span className={styles.summaryValue}>{rem.totalMadres || 0}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pueblos Originarios:</span>
            <span className={styles.summaryValue}>{rem.puebloOriginario?.cantidad || 0} ({rem.puebloOriginario?.tasa || 0}%)</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Migrantes:</span>
            <span className={styles.summaryValue}>{rem.migrantes?.cantidad || 0} ({rem.migrantes?.tasa || 0}%)</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Con Discapacidad:</span>
            <span className={styles.summaryValue}>{rem.discapacidad?.cantidad || 0} ({rem.discapacidad?.tasa || 0}%)</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Hepatitis B+:</span>
            <span className={styles.summaryValue}>{rem.hepatitisBPositiva?.cantidad || 0} ({rem.hepatitisBPositiva?.tasa || 0}%)</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Control Prenatal:</span>
            <span className={styles.summaryValue}>{rem.controlPrenatal?.cantidad || 0} ({rem.controlPrenatal?.tasa || 0}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
