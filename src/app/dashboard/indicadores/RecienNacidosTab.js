'use client'
import { StatCard, ChartCard, DataTable } from '@/components/indicadores'
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#0066A4', '#E83E8C', '#6F42C1', '#28A745', '#FFC107', '#DC3545']

const SEXO_LABELS = { M: 'Masculino', F: 'Femenino', I: 'Indeterminado' }
const SEXO_COLORS = { M: '#0066A4', F: '#E83E8C', I: '#6F42C1' }

export default function RecienNacidosTab({ data, loading }) {
  if (loading || !data?.recienNacidos) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { recienNacidos } = data
  const { clinicos, cuidados } = recienNacidos

  // Datos para gráfico de sexo
  const sexoData = recienNacidos.porSexo?.map(s => ({
    name: SEXO_LABELS[s.sexo] || s.sexo,
    value: s.cantidad,
    porcentaje: s.porcentaje,
    color: SEXO_COLORS[s.sexo] || COLORS[0]
  })) || []

  // Datos para gráfico de Apgar
  const apgar1Data = [
    { name: 'Bajo (<7)', value: recienNacidos.apgar1?.bajo || 0, color: '#DC3545' },
    { name: 'Normal (7-9)', value: recienNacidos.apgar1?.normal || 0, color: '#28A745' },
    { name: 'Excelente (10)', value: recienNacidos.apgar1?.excelente || 0, color: '#0066A4' },
  ].filter(d => d.value > 0)

  const apgar5Data = [
    { name: 'Bajo (<7)', value: recienNacidos.apgar5?.bajo || 0, color: '#DC3545' },
    { name: 'Normal (7-9)', value: recienNacidos.apgar5?.normal || 0, color: '#28A745' },
    { name: 'Excelente (10)', value: recienNacidos.apgar5?.excelente || 0, color: '#0066A4' },
  ].filter(d => d.value > 0)

  // Datos para gráfico de peso
  const pesoData = [
    { name: 'Bajo Peso (<2500g)', value: recienNacidos.pesoRangos?.bajoPeso || 0, color: '#DC3545' },
    { name: 'Normal (2500-4000g)', value: recienNacidos.pesoRangos?.normal || 0, color: '#28A745' },
    { name: 'Macrosomía (>4000g)', value: recienNacidos.pesoRangos?.macrosomia || 0, color: '#FFC107' },
  ]

  // Datos para cuidados inmediatos
  const cuidadosData = cuidados ? [
    { name: 'Lactancia 60 min', value: parseFloat(cuidados.lactancia60Min?.tasa || 0) },
    { name: 'Alojamiento Conjunto', value: parseFloat(cuidados.alojamientoConjuntoInmediato?.tasa || 0) },
    { name: 'Piel a Piel', value: parseFloat(cuidados.contactoPielPielInmediato?.tasa || 0) },
    { name: 'Profilaxis Hep B', value: parseFloat(cuidados.profilaxisHepatitisB?.tasa || 0) },
    { name: 'Profilaxis Gonorrea', value: parseFloat(cuidados.profilaxisOcularGonorrea?.tasa || 0) },
  ] : []

  return (
    <div className={styles.tabContent}>
      {/* KPIs principales */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total RN"
          value={recienNacidos.total}
          icon={<i className="fa-solid fa-baby"></i>}
          variant="info"
        />
        <StatCard
          title="Peso Promedio"
          value={`${recienNacidos.pesoPromedio || 0}g`}
          icon={<i className="fa-solid fa-weight-scale"></i>}
          variant="default"
          subtitle={`Talla: ${recienNacidos.tallaPromedio || 0} cm`}
        />
        <StatCard
          title="Nacidos Vivos"
          value={`${clinicos?.esNacidoVivo?.tasa || 0}%`}
          icon={<i className="fa-solid fa-heart-pulse"></i>}
          variant="success"
          subtitle={`${clinicos?.esNacidoVivo?.cantidad || 0} de ${clinicos?.esNacidoVivo?.total || 0}`}
        />
        <StatCard
          title="Anomalías Congénitas"
          value={clinicos?.anomaliaCongenita?.cantidad || 0}
          icon={<i className="fa-solid fa-microscope"></i>}
          variant={clinicos?.anomaliaCongenita?.cantidad > 0 ? 'warning' : 'success'}
          subtitle={`Tasa: ${clinicos?.anomaliaCongenita?.tasa || 0}%`}
        />
      </div>

      {/* KPIs clínicos */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Bajo Peso"
          value={clinicos?.bajoPeso || 0}
          icon={<i className="fa-solid fa-arrow-trend-down"></i>}
          variant={clinicos?.bajoPeso > 0 ? 'warning' : 'success'}
          subtitle="< 2500g"
        />
        <StatCard
          title="Muy Bajo Peso"
          value={clinicos?.muyBajoPeso || 0}
          icon={<i className="fa-solid fa-triangle-exclamation"></i>}
          variant={clinicos?.muyBajoPeso > 0 ? 'danger' : 'success'}
          subtitle="< 1500g"
        />
        <StatCard
          title="Requiere Reanimación"
          value={clinicos?.reanimacionBasica?.cantidad || 0}
          icon={<i className="fa-solid fa-lungs"></i>}
          variant={clinicos?.reanimacionBasica?.cantidad > 0 ? 'warning' : 'success'}
          subtitle={`Tasa: ${clinicos?.reanimacionBasica?.tasa || 0}%`}
        />
        <StatCard
          title="Apgar Bajo 5'"
          value={clinicos?.apgarBajo5 || 0}
          icon={<i className="fa-solid fa-heart"></i>}
          variant={clinicos?.apgarBajo5 > 0 ? 'danger' : 'success'}
          subtitle="< 7 puntos"
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Distribución por Sexo */}
        <ChartCard title="Distribución por Sexo" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sexoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                outerRadius={90}
                dataKey="value"
              >
                {sexoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Distribución de Peso */}
        <ChartCard title="Distribución por Peso" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pesoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                {pesoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Apgar 1 minuto */}
        <ChartCard title="Apgar al Minuto" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={apgar1Data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {apgar1Data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Apgar 5 minutos */}
        <ChartCard title="Apgar a los 5 Minutos" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={apgar5Data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {apgar5Data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cuidados Inmediatos */}
        <ChartCard title="Cumplimiento Cuidados Inmediatos (%)" height={300} fullWidth>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cuidadosData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(value) => [`${value}%`, 'Tasa']} />
              <Bar dataKey="value" name="Cumplimiento" fill="#28A745" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tabla de métricas clínicas */}
      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}><i className="fa-solid fa-clipboard-list"></i> Métricas Clínicas Detalladas</h3>
        <DataTable 
          columns={[
            { key: 'metrica', label: 'Métrica', sortable: true },
            { key: 'cantidad', label: 'Cantidad', sortable: true, align: 'center' },
            { key: 'tasa', label: 'Tasa', sortable: true, align: 'center' },
          ]}
          data={[
            { metrica: 'Nacido Vivo', cantidad: clinicos?.esNacidoVivo?.cantidad || 0, tasa: `${clinicos?.esNacidoVivo?.tasa || 0}%` },
            { metrica: 'Anomalías Congénitas', cantidad: clinicos?.anomaliaCongenita?.cantidad || 0, tasa: `${clinicos?.anomaliaCongenita?.tasa || 0}%` },
            { metrica: 'Reanimación Básica', cantidad: clinicos?.reanimacionBasica?.cantidad || 0, tasa: `${clinicos?.reanimacionBasica?.tasa || 0}%` },
            { metrica: 'Reanimación Avanzada', cantidad: clinicos?.reanimacionAvanzada?.cantidad || 0, tasa: `${clinicos?.reanimacionAvanzada?.tasa || 0}%` },
            { metrica: 'EHI Grado II/III', cantidad: clinicos?.ehiGradoII_III?.cantidad || 0, tasa: `${clinicos?.ehiGradoII_III?.tasa || 0}%` },
            { metrica: 'Bajo Peso (<2500g)', cantidad: clinicos?.bajoPeso || 0, tasa: '-' },
            { metrica: 'Muy Bajo Peso (<1500g)', cantidad: clinicos?.muyBajoPeso || 0, tasa: '-' },
            { metrica: 'Macrosomía (≥4000g)', cantidad: clinicos?.macrosomia || 0, tasa: '-' },
            { metrica: 'Apgar <7 al minuto', cantidad: clinicos?.apgarBajo1 || 0, tasa: '-' },
            { metrica: 'Apgar <7 a los 5 min', cantidad: clinicos?.apgarBajo5 || 0, tasa: '-' },
          ]}
          pageSize={10}
        />
      </div>
    </div>
  )
}
