'use client'
import { StatCard, ChartCard, DataTable } from '@/components/indicadores'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Line } from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#0066A4', '#28A745', '#FFC107', '#DC3545', '#17A2B8', '#6F42C1', '#E83E8C', '#20C997']

const PROFESIONAL_COLORS = {
  matrona: '#0066A4',
  medico: '#28A745',
  enfermera: '#17A2B8',
  pediatra: '#6F42C1'
}

const PROFESIONAL_LABELS = {
  matrona: 'Matrona',
  medico: 'Médico',
  enfermera: 'Enfermera',
  pediatra: 'Pediatra'
}

export default function CargaLaboralTab({ data, loading }) {
  if (loading || !data?.cargaLaboral) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { cargaLaboral } = data

  // Datos para gráfico comparativo de totales
  const totalesComparativoData = [
    { 
      tipo: 'Partos', 
      matrona: cargaLaboral.partosPorMatrona?.total || 0,
      medico: cargaLaboral.partosPorMedico?.total || 0,
    },
    { 
      tipo: 'Atenciones URNI', 
      enfermera: cargaLaboral.atencionesEnfermera?.total || 0,
      medico: cargaLaboral.atencionesMedico?.total || 0,
    }
  ]

  // Top 5 matronas
  const topMatronasData = cargaLaboral.partosPorMatrona?.topProfesionales?.slice(0, 5).map(p => ({
    nombre: p.nombre,
    cantidad: p.cantidad
  })) || []

  // Top 5 médicos
  const topMedicosData = cargaLaboral.partosPorMedico?.topProfesionales?.slice(0, 5).map(p => ({
    nombre: p.nombre,
    cantidad: p.cantidad
  })) || []

  // Top 5 enfermeras
  const topEnfermerasData = cargaLaboral.atencionesEnfermera?.topProfesionales?.slice(0, 5).map(p => ({
    nombre: p.nombre,
    cantidad: p.cantidad
  })) || []

  // Distribución de partos por tipo profesional
  const partosDistribucionData = [
    { name: 'Matronas', value: cargaLaboral.partosPorMatrona?.total || 0 },
    { name: 'Médicos', value: cargaLaboral.partosPorMedico?.total || 0 },
  ].filter(d => d.value > 0)

  // Distribución atenciones
  const atencionesDistribucionData = [
    { name: 'Enfermeras', value: cargaLaboral.atencionesEnfermera?.total || 0 },
    { name: 'Médicos', value: cargaLaboral.atencionesMedico?.total || 0 },
  ].filter(d => d.value > 0)

  // Calcular totales
  const totalPartosAtendidos = (cargaLaboral.partosPorMatrona?.total || 0) + (cargaLaboral.partosPorMedico?.total || 0)
  const totalAtenciones = (cargaLaboral.atencionesEnfermera?.total || 0) + (cargaLaboral.atencionesMedico?.total || 0)
  const profesionalesActivos = (cargaLaboral.partosPorMatrona?.profesionalesUnicos || 0) + 
    (cargaLaboral.partosPorMedico?.profesionalesUnicos || 0) +
    (cargaLaboral.atencionesEnfermera?.profesionalesUnicos || 0) +
    (cargaLaboral.atencionesMedico?.profesionalesUnicos || 0)

  return (
    <div className={styles.tabContent}>
      {/* KPIs principales */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Partos"
          value={totalPartosAtendidos}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="info"
          subtitle="Atendidos por profesionales"
        />
        <StatCard
          title="Total Atenciones"
          value={totalAtenciones}
          icon={<i className="fa-solid fa-stethoscope"></i>}
          variant="success"
          subtitle="En URNI"
        />
        <StatCard
          title="Profesionales Activos"
          value={profesionalesActivos}
          icon={<i className="fa-solid fa-users"></i>}
          variant="default"
          subtitle="En el período"
        />
        <StatCard
          title="Promedio/Profesional"
          value={profesionalesActivos > 0 ? Math.round((totalPartosAtendidos + totalAtenciones) / profesionalesActivos) : 0}
          icon={<i className="fa-solid fa-chart-simple"></i>}
          variant="default"
          subtitle="Actividades promedio"
        />
      </div>

      {/* Sección Matronas */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-user-nurse"></i> Matronas - Partos Atendidos</h3>
      </div>
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Partos"
          value={cargaLaboral.partosPorMatrona?.total || 0}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="info"
        />
        <StatCard
          title="Matronas Activas"
          value={cargaLaboral.partosPorMatrona?.profesionalesUnicos || 0}
          icon={<i className="fa-solid fa-user-nurse"></i>}
          variant="default"
        />
        <StatCard
          title="Promedio/Matrona"
          value={cargaLaboral.partosPorMatrona?.promedioPorProfesional || 0}
          icon={<i className="fa-solid fa-chart-simple"></i>}
          variant={cargaLaboral.partosPorMatrona?.promedioPorProfesional > 10 ? 'warning' : 'success'}
          subtitle="En el período"
        />
        <StatCard
          title="Máximo"
          value={cargaLaboral.partosPorMatrona?.maximo || 0}
          icon={<i className="fa-solid fa-arrow-trend-up"></i>}
          variant="default"
          subtitle="Por una matrona"
        />
      </div>

      {/* Sección Médicos */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-user-doctor"></i> Médicos - Partos Atendidos</h3>
      </div>
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Partos"
          value={cargaLaboral.partosPorMedico?.total || 0}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="success"
        />
        <StatCard
          title="Médicos Activos"
          value={cargaLaboral.partosPorMedico?.profesionalesUnicos || 0}
          icon={<i className="fa-solid fa-user-doctor"></i>}
          variant="default"
        />
        <StatCard
          title="Promedio/Médico"
          value={cargaLaboral.partosPorMedico?.promedioPorProfesional || 0}
          icon={<i className="fa-solid fa-chart-simple"></i>}
          variant="default"
          subtitle="En el período"
        />
        <StatCard
          title="Máximo"
          value={cargaLaboral.partosPorMedico?.maximo || 0}
          icon={<i className="fa-solid fa-arrow-trend-up"></i>}
          variant="default"
          subtitle="Por un médico"
        />
      </div>

      {/* Sección Enfermeras */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-syringe"></i> Enfermeras - Atenciones URNI</h3>
      </div>
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Atenciones"
          value={cargaLaboral.atencionesEnfermera?.total || 0}
          icon={<i className="fa-solid fa-stethoscope"></i>}
          variant="info"
        />
        <StatCard
          title="Enfermeras Activas"
          value={cargaLaboral.atencionesEnfermera?.profesionalesUnicos || 0}
          icon={<i className="fa-solid fa-syringe"></i>}
          variant="default"
        />
        <StatCard
          title="Promedio/Enfermera"
          value={cargaLaboral.atencionesEnfermera?.promedioPorProfesional || 0}
          icon={<i className="fa-solid fa-chart-simple"></i>}
          variant="default"
          subtitle="En el período"
        />
        <StatCard
          title="Máximo"
          value={cargaLaboral.atencionesEnfermera?.maximo || 0}
          icon={<i className="fa-solid fa-arrow-trend-up"></i>}
          variant="default"
          subtitle="Por una enfermera"
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Distribución Partos */}
        {partosDistribucionData.length > 0 && (
          <ChartCard title="Distribución de Partos por Profesional" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={partosDistribucionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  <Cell fill={PROFESIONAL_COLORS.matrona} />
                  <Cell fill={PROFESIONAL_COLORS.medico} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Distribución Atenciones */}
        {atencionesDistribucionData.length > 0 && (
          <ChartCard title="Distribución de Atenciones URNI" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={atencionesDistribucionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value}`}
                  dataKey="value"
                >
                  <Cell fill={PROFESIONAL_COLORS.enfermera} />
                  <Cell fill={PROFESIONAL_COLORS.medico} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Top Matronas */}
        {topMatronasData.length > 0 && (
          <ChartCard title="Top 5 Matronas por Partos" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMatronasData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Partos" fill={PROFESIONAL_COLORS.matrona} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Top Médicos */}
        {topMedicosData.length > 0 && (
          <ChartCard title="Top 5 Médicos por Partos" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMedicosData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Partos" fill={PROFESIONAL_COLORS.medico} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Top Enfermeras - Full width */}
        {topEnfermerasData.length > 0 && (
          <ChartCard title="Top 5 Enfermeras por Atenciones URNI" height={320} fullWidth>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEnfermerasData} margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Atenciones" fill={PROFESIONAL_COLORS.enfermera} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Tablas de ranking */}
      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-chart-simple"></i> Ranking Completo - Matronas</h3>
        <DataTable 
          columns={[
            { key: 'rank', label: '#', sortable: false, align: 'center' },
            { key: 'nombre', label: 'Matrona', sortable: true },
            { key: 'cantidad', label: 'Partos', sortable: true, align: 'center' },
            { key: 'porcentaje', label: '% Total', sortable: true, align: 'center' },
          ]}
          data={cargaLaboral.partosPorMatrona?.topProfesionales?.map((p, idx) => ({
            rank: idx + 1,
            nombre: p.nombre,
            cantidad: p.cantidad,
            porcentaje: `${((p.cantidad / (cargaLaboral.partosPorMatrona?.total || 1)) * 100).toFixed(1)}%`
          })) || []}
          pageSize={10}
        />
      </div>

      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-chart-simple"></i> Ranking Completo - Médicos</h3>
        <DataTable 
          columns={[
            { key: 'rank', label: '#', sortable: false, align: 'center' },
            { key: 'nombre', label: 'Médico', sortable: true },
            { key: 'cantidad', label: 'Partos', sortable: true, align: 'center' },
            { key: 'porcentaje', label: '% Total', sortable: true, align: 'center' },
          ]}
          data={cargaLaboral.partosPorMedico?.topProfesionales?.map((p, idx) => ({
            rank: idx + 1,
            nombre: p.nombre,
            cantidad: p.cantidad,
            porcentaje: `${((p.cantidad / (cargaLaboral.partosPorMedico?.total || 1)) * 100).toFixed(1)}%`
          })) || []}
          pageSize={10}
        />
      </div>

      {/* Resumen y análisis */}
      <div className={styles.alertsSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-chart-line"></i> Análisis de Carga</h3>
        
        {cargaLaboral.partosPorMatrona?.promedioPorProfesional > 15 && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <span className={styles.alertIcon}><i className="fa-solid fa-triangle-exclamation"></i></span>
            <div>
              <strong>Alta carga para matronas</strong>
              <p>El promedio de partos por matrona ({cargaLaboral.partosPorMatrona?.promedioPorProfesional}) supera el umbral recomendado de 15.</p>
            </div>
          </div>
        )}

        {cargaLaboral.partosPorMedico?.promedioPorProfesional > 20 && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <span className={styles.alertIcon}><i className="fa-solid fa-triangle-exclamation"></i></span>
            <div>
              <strong>Alta carga para médicos</strong>
              <p>El promedio de partos por médico ({cargaLaboral.partosPorMedico?.promedioPorProfesional}) supera el umbral recomendado de 20.</p>
            </div>
          </div>
        )}

        <div className={`${styles.alert} ${styles.alertInfo}`}>
          <span className={styles.alertIcon}><i className="fa-solid fa-chart-pie"></i></span>
          <div>
            <strong>Resumen del Período</strong>
            <p>
              {cargaLaboral.partosPorMatrona?.profesionalesUnicos || 0} matronas y {cargaLaboral.partosPorMedico?.profesionalesUnicos || 0} médicos 
              atendieron {totalPartosAtendidos} partos. {cargaLaboral.atencionesEnfermera?.profesionalesUnicos || 0} enfermeras 
              realizaron {cargaLaboral.atencionesEnfermera?.total || 0} atenciones en URNI.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
