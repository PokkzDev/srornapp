'use client'
import { StatCard, ChartCard, DataTable } from '@/components/indicadores'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#0066A4', '#28A745', '#FFC107', '#DC3545', '#17A2B8', '#6F42C1']

const SERVICIO_LABELS = {
  URNI: 'URNI',
  UCIN: 'UCIN',
  NEONATOLOGIA: 'Neonatología',
}

const SERVICIO_COLORS = {
  URNI: '#0066A4',
  UCIN: '#DC3545',
  NEONATOLOGIA: '#28A745',
}

export default function URNITab({ data, loading }) {
  if (loading || !data?.episodiosUrni) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { episodiosUrni, recienNacidos, controlesNeonatales, atencionesUrni } = data

  // Datos para gráfico de servicios
  const servicioData = episodiosUrni.porServicio?.map(s => ({
    name: SERVICIO_LABELS[s.servicio] || s.servicio,
    value: s.cantidad,
    porcentaje: s.porcentaje,
    color: SERVICIO_COLORS[s.servicio] || COLORS[0]
  })) || []

  // Datos para evolución
  const evolucionData = episodiosUrni.evolucion || []

  // Datos para controles por tipo
  const controlesTipoData = controlesNeonatales?.porTipo?.map(c => ({
    name: c.tipo,
    value: c.cantidad,
    porcentaje: c.porcentaje
  })) || []

  // Estadía por servicio
  const estadiaPorServicioData = Object.entries(episodiosUrni.estadiaPorServicio || {})
    .filter(([_, dias]) => dias > 0)
    .map(([servicio, dias]) => ({
      name: SERVICIO_LABELS[servicio] || servicio,
      dias,
      color: SERVICIO_COLORS[servicio] || COLORS[0]
    }))

  // Atenciones por médico (top 5)
  const atencionesMedicoData = atencionesUrni?.porMedico
    ?.slice(0, 5)
    .map(a => ({
      nombre: a.medicoNombre,
      cantidad: a.cantidad
    })) || []

  return (
    <div className={styles.tabContent}>
      {/* KPIs principales */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Episodios"
          value={episodiosUrni.total || 0}
          icon={<i className="fa-solid fa-hospital"></i>}
          variant="info"
        />
        <StatCard
          title="Activos"
          value={episodiosUrni.activos || 0}
          icon={<i className="fa-solid fa-location-dot"></i>}
          variant={episodiosUrni.activos > 0 ? 'warning' : 'success'}
          subtitle="Pacientes ingresados"
        />
        <StatCard
          title="Altas"
          value={episodiosUrni.altas || 0}
          icon={<i className="fa-solid fa-circle-check"></i>}
          variant="success"
          subtitle="En el período"
        />
        <StatCard
          title="Tasa Ingreso URNI"
          value={`${episodiosUrni.tasaIngresoURNI || 0}%`}
          icon={<i className="fa-solid fa-chart-line"></i>}
          variant="default"
          subtitle={`Sobre ${recienNacidos?.total || 0} RN`}
        />
      </div>

      {/* KPIs de estadía */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Estadía Promedio"
          value={`${episodiosUrni.diasEstadiaPromedio || 0} días`}
          icon={<i className="fa-regular fa-calendar"></i>}
          variant="default"
          subtitle="Global URNI"
        />
        <StatCard
          title="Estadía URNI"
          value={`${episodiosUrni.estadiaPorServicio?.URNI || 0} días`}
          icon={<i className="fa-solid fa-stethoscope"></i>}
          variant="info"
        />
        <StatCard
          title="Estadía UCIN"
          value={`${episodiosUrni.estadiaPorServicio?.UCIN || 0} días`}
          icon={<i className="fa-solid fa-kit-medical"></i>}
          variant={episodiosUrni.estadiaPorServicio?.UCIN > 10 ? 'warning' : 'default'}
        />
        <StatCard
          title="Estadía Neonatología"
          value={`${episodiosUrni.estadiaPorServicio?.NEONATOLOGIA || 0} días`}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="default"
        />
      </div>

      {/* KPIs de controles y atenciones */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Controles"
          value={controlesNeonatales?.total || 0}
          icon={<i className="fa-solid fa-clipboard-list"></i>}
          variant="info"
        />
        <StatCard
          title="Controles/Episodio"
          value={controlesNeonatales?.promedioPorEpisodio || 0}
          icon={<i className="fa-solid fa-arrow-trend-up"></i>}
          variant="default"
          subtitle="Promedio"
        />
        <StatCard
          title="Total Atenciones"
          value={atencionesUrni?.total || 0}
          icon={<i className="fa-solid fa-stethoscope"></i>}
          variant="info"
        />
        <StatCard
          title="Atenciones/Episodio"
          value={atencionesUrni?.promedioPorEpisodio || 0}
          icon={<i className="fa-solid fa-chart-simple"></i>}
          variant="default"
          subtitle="Promedio"
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Por Servicio */}
        {servicioData.length > 0 ? (
          <ChartCard title="Distribución por Servicio" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {servicioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Distribución por Servicio" height={320} isEmpty emptyMessage="Sin datos de servicio" />
        )}

        {/* Estadía por Servicio */}
        {estadiaPorServicioData.length > 0 && (
          <ChartCard title="Estadía Promedio por Servicio (días)" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estadiaPorServicioData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} días`, 'Estadía']} />
                <Bar dataKey="dias" name="Días" radius={[4, 4, 0, 0]}>
                  {estadiaPorServicioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Controles por Tipo */}
        {controlesTipoData.length > 0 && (
          <ChartCard title="Controles por Tipo" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={controlesTipoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {controlesTipoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Atenciones por Médico */}
        {atencionesMedicoData.length > 0 && (
          <ChartCard title="Top 5 Atenciones por Médico" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atencionesMedicoData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Atenciones" fill="#17A2B8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Evolución Temporal */}
        <ChartCard title="Evolución Ingresos y Altas" subtitle="Por período" height={320} fullWidth>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#0066A4" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="altas" name="Altas" stroke="#28A745" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablas detalladas */}
      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-clipboard-list"></i> Detalle por Servicio</h3>
        <DataTable 
          columns={[
            { key: 'servicio', label: 'Servicio', sortable: true },
            { key: 'cantidad', label: 'Episodios', sortable: true, align: 'center' },
            { key: 'porcentaje', label: 'Porcentaje', sortable: true, align: 'center' },
            { key: 'estadia', label: 'Estadía Prom.', sortable: true, align: 'center' },
          ]}
          data={episodiosUrni.porServicio?.map(s => ({
            servicio: SERVICIO_LABELS[s.servicio] || s.servicio,
            cantidad: s.cantidad,
            porcentaje: `${s.porcentaje}%`,
            estadia: `${episodiosUrni.estadiaPorServicio?.[s.servicio] || 0} días`
          })) || []}
          pageSize={10}
        />
      </div>

      {/* Mensaje cuando hay pacientes activos */}
      {episodiosUrni.activos > 0 && (
        <div className={styles.alertsSection}>
          <h3 className={styles.sectionTitle}><i className="fa-solid fa-thumbtack"></i> Estado Actual</h3>
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            <span className={styles.alertIcon}><i className="fa-solid fa-hospital"></i></span>
            <div>
              <strong>{episodiosUrni.activos} Paciente{episodiosUrni.activos !== 1 ? 's' : ''} Activo{episodiosUrni.activos !== 1 ? 's' : ''}</strong>
              <p>Distribución: {episodiosUrni.porServicio?.filter(s => s.cantidad > 0).map(s => 
                `${SERVICIO_LABELS[s.servicio] || s.servicio}: ${s.cantidad}`
              ).join(' | ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
