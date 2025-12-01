'use client'
import { StatCard, ChartCard, DataTable } from '@/components/indicadores'
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#0066A4', '#28A745', '#FFC107', '#DC3545', '#17A2B8', '#6F42C1', '#E83E8C', '#20C997']

const TIPO_PARTO_LABELS = {
  VAGINAL: 'Vaginal',
  INSTRUMENTAL: 'Instrumental',
  CESAREA_ELECTIVA: 'Cesárea Electiva',
  CESAREA_URGENCIA: 'Cesárea Urgencia',
  PREHOSPITALARIO: 'Prehospitalario',
  FUERA_RED: 'Fuera de Red',
  DOMICILIO_PROFESIONAL: 'Domicilio c/Prof.',
  DOMICILIO_SIN_PROFESIONAL: 'Domicilio s/Prof.',
}

const LUGAR_LABELS = {
  SALA_PARTO: 'Sala de Parto',
  PABELLON: 'Pabellón',
  DOMICILIO: 'Domicilio',
  OTRO: 'Otro',
}

const CURSO_LABELS = {
  EUTOCICO: 'Eutócico',
  DISTOCICO: 'Distócico',
}

const INICIO_LABELS = {
  ESPONTANEO: 'Espontáneo',
  INDUCIDO_MECANICO: 'Inducido Mecánico',
  INDUCIDO_FARMACOLOGICO: 'Inducido Farmacológico',
}

export default function PartosTab({ data, loading }) {
  if (loading || !data?.partos) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { partos } = data

  // Preparar datos para gráficos
  const tipoData = partos.porTipo?.map(p => ({
    name: TIPO_PARTO_LABELS[p.tipo] || p.tipo,
    value: p.cantidad,
    porcentaje: p.porcentaje
  })) || []

  const lugarData = partos.porLugar?.map(p => ({
    name: LUGAR_LABELS[p.lugar] || p.lugar,
    value: p.cantidad,
    porcentaje: p.porcentaje
  })) || []

  const cursoData = partos.porCurso?.filter(p => p.curso).map(p => ({
    name: CURSO_LABELS[p.curso] || p.curso,
    value: p.cantidad,
    porcentaje: p.porcentaje
  })) || []

  const inicioData = partos.porInicio?.filter(p => p.inicio).map(p => ({
    name: INICIO_LABELS[p.inicio] || p.inicio,
    value: p.cantidad,
    porcentaje: p.porcentaje
  })) || []

  const evolucionData = partos.evolucion || []

  // Datos de edad gestacional
  const edadGest = partos.edadGestacional || {}
  const edadGestData = [
    { name: '<28 sem', value: edadGest.extremadamentePretérmino || 0, color: '#DC3545' },
    { name: '28-31 sem', value: edadGest.muyPretérmino || 0, color: '#FFC107' },
    { name: '32-33 sem', value: edadGest.pretérminoModerado || 0, color: '#FFC107' },
    { name: '34-36 sem', value: edadGest.pretérminoTardío || 0, color: '#17A2B8' },
    { name: '37-41 sem', value: edadGest.término || 0, color: '#28A745' },
    { name: '>41 sem', value: edadGest.postTérmino || 0, color: '#6F42C1' },
  ].filter(d => d.value > 0)

  // Columnas para tabla detallada
  const columns = [
    { key: 'tipo', label: 'Tipo de Parto', sortable: true },
    { key: 'cantidad', label: 'Cantidad', sortable: true, align: 'center' },
    { key: 'porcentaje', label: 'Porcentaje', sortable: true, align: 'center', render: (v) => `${v}%` },
  ]

  const tableData = partos.porTipo?.map(p => ({
    tipo: TIPO_PARTO_LABELS[p.tipo] || p.tipo,
    cantidad: p.cantidad,
    porcentaje: p.porcentaje
  })) || []

  return (
    <div className={styles.tabContent}>
      {/* KPIs */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Partos"
          value={partos.total}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="info"
          trend={partos.tendencia ? {
            value: partos.tendencia.porcentaje,
            isPositive: partos.tendencia.direccion === 'up',
            label: 'vs anterior'
          } : undefined}
        />
        <StatCard
          title="Tasa Cesárea"
          value={`${partos.cesareas?.tasa || 0}%`}
          icon={<i className="fa-solid fa-hospital"></i>}
          variant={parseFloat(partos.cesareas?.tasa || 0) > 15 ? 'warning' : 'success'}
          subtitle={`${partos.cesareas?.total || 0} cesáreas (${partos.cesareas?.urgencia || 0} urgencia)`}
        />
        <StatCard
          title="Partos Vaginales"
          value={partos.porTipo?.find(p => p.tipo === 'VAGINAL')?.cantidad || 0}
          icon={<i className="fa-solid fa-heart"></i>}
          variant="success"
          subtitle={`${partos.porTipo?.find(p => p.tipo === 'VAGINAL')?.porcentaje || 0}% del total`}
        />
        <StatCard
          title="Instrumentales"
          value={partos.instrumentales?.total || 0}
          icon={<i className="fa-solid fa-kit-medical"></i>}
          variant="default"
          subtitle={`Tasa: ${partos.instrumentales?.tasa || 0}%`}
        />
      </div>

      {/* Edad Gestacional */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="EG Promedio"
          value={`${edadGest.promedio || 0} sem`}
          icon={<i className="fa-regular fa-calendar"></i>}
          variant="info"
          subtitle={`Total con EG: ${edadGest.total || 0}`}
        />
        <StatCard
          title="Tasa Prematurez"
          value={`${edadGest.tasaPretérmino || 0}%`}
          icon={<i className="fa-regular fa-clock"></i>}
          variant={parseFloat(edadGest.tasaPretérmino || 0) > 10 ? 'warning' : 'success'}
          subtitle="< 37 semanas"
        />
        <StatCard
          title="Muy Pretérmino"
          value={(edadGest.extremadamentePretérmino || 0) + (edadGest.muyPretérmino || 0)}
          icon={<i className="fa-solid fa-triangle-exclamation"></i>}
          variant="danger"
          subtitle="< 32 semanas"
        />
        <StatCard
          title="Post-término"
          value={edadGest.postTérmino || 0}
          icon={<i className="fa-solid fa-calendar-day"></i>}
          variant={edadGest.postTérmino > 0 ? 'warning' : 'default'}
          subtitle="> 41 semanas"
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Distribución por Tipo */}
        <ChartCard title="Distribución por Tipo de Parto" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tipoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                outerRadius={100}
                dataKey="value"
              >
                {tipoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, 'Cantidad']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Distribución por Lugar */}
        <ChartCard title="Distribución por Lugar" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lugarData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Cantidad" fill="#0066A4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Curso del Parto */}
        {cursoData.length > 0 && (
          <ChartCard title="Curso del Parto" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cursoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                >
                  {cursoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#28A745' : '#FFC107'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Inicio del Trabajo de Parto */}
        {inicioData.length > 0 && (
          <ChartCard title="Inicio Trabajo de Parto" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inicioData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad" fill="#17A2B8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Edad Gestacional */}
        {edadGestData.length > 0 && (
          <ChartCard title="Distribución Edad Gestacional" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={edadGestData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                  {edadGestData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Evolución Temporal */}
        <ChartCard title="Evolución de Partos" subtitle="Por período" height={320} fullWidth>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cantidad" name="Partos" stroke="#0066A4" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tabla detallada */}
      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-clipboard-list"></i> Detalle por Tipo de Parto</h3>
        <DataTable columns={columns} data={tableData} pageSize={10} />
      </div>
    </div>
  )
}
