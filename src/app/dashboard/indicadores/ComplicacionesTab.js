'use client'
import { StatCard, ChartCard, DataTable } from '@/components/indicadores'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import styles from './tabs.module.css'

const COLORS = ['#DC3545', '#FFC107', '#17A2B8', '#6F42C1', '#E83E8C', '#0066A4', '#28A745', '#20C997']

const TIPO_COMPLICACION_LABELS = {
  HPP_INERCIA: 'HPP - Inercia Uterina',
  HPP_RESTOS: 'HPP - Restos Placentarios',
  HPP_TRAUMA: 'HPP - Trauma',
  DESGARROS_III_IV: 'Desgarros III-IV',
  ALTERACION_COAGULACION: 'Alt. Coagulación',
  PREECLAMPSIA_SEVERA: 'Preeclampsia Severa',
  ECLAMPSIA: 'Eclampsia',
  SEPSIS_SISTEMICA_GRAVE: 'Sepsis Sistémica Grave',
  MANEJO_QUIRURGICO_INERCIA: 'Manejo Qx Inercia',
  HISTERCTOMIA_OBSTETRICA: 'Histerectomía Obstétrica',
  ANEMIA_SEVERA_TRANSFUSION: 'Anemia Severa c/Transfusión',
}

const CONTEXTO_LABELS = {
  PREPARTO: 'Pre-parto',
  INTRAPARTO: 'Intra-parto',
  POSTPARTO: 'Post-parto',
}

export default function ComplicacionesTab({ data, loading }) {
  if (loading || !data?.complicaciones) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.cardsGrid}>
          {[1,2,3,4].map(i => <StatCard key={i} loading />)}
        </div>
      </div>
    )
  }

  const { complicaciones, partos } = data

  // Datos para gráficos
  const tipoData = complicaciones.porTipo?.map(c => ({
    name: TIPO_COMPLICACION_LABELS[c.tipo] || c.tipo,
    value: c.cantidad,
    porcentaje: c.porcentaje,
  })) || []

  const contextoData = complicaciones.porContexto?.map(c => ({
    name: CONTEXTO_LABELS[c.contexto] || c.contexto,
    value: c.cantidad,
    porcentaje: c.porcentaje,
  })) || []

  // Datos para tabla
  const tableData = tipoData.map(t => ({
    tipo: t.name,
    cantidad: t.value,
    porcentaje: `${t.porcentaje}%`
  }))

  // Complicaciones graves
  const hppTotal = (complicaciones.hpp || 0)
  const complicacionesGraves = [
    { nombre: 'HPP (todas las causas)', cantidad: hppTotal, gravedad: 'alta' },
    { nombre: 'Preeclampsia Severa', cantidad: complicaciones.preeclampsia || 0, gravedad: 'alta' },
    { nombre: 'Eclampsia', cantidad: complicaciones.eclampsia || 0, gravedad: 'crítica' },
    { nombre: 'Desgarros III-IV', cantidad: complicaciones.desgarrosIIIIV || 0, gravedad: 'media' },
    { nombre: 'Histerectomía', cantidad: complicaciones.histerectomia || 0, gravedad: 'crítica' },
    { nombre: 'Transfusiones', cantidad: complicaciones.transfusiones || 0, gravedad: 'alta' },
  ].filter(c => c.cantidad > 0)

  return (
    <div className={styles.tabContent}>
      {/* KPIs principales */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Total Complicaciones"
          value={complicaciones.total || 0}
          icon={<i className="fa-solid fa-triangle-exclamation"></i>}
          variant={complicaciones.total > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Tasa Complicaciones"
          value={`${complicaciones.tasaComplicaciones || 0}%`}
          icon={<i className="fa-solid fa-chart-line"></i>}
          variant={parseFloat(complicaciones.tasaComplicaciones || 0) > 5 ? 'danger' : 'warning'}
          subtitle={`Sobre ${partos?.total || 0} partos`}
        />
        <StatCard
          title="HPP (Hemorragia)"
          value={hppTotal}
          icon={<i className="fa-solid fa-droplet"></i>}
          variant={hppTotal > 0 ? 'danger' : 'success'}
          subtitle="Todas las causas"
        />
        <StatCard
          title="Transfusiones"
          value={complicaciones.transfusiones || 0}
          icon={<i className="fa-solid fa-syringe"></i>}
          variant={complicaciones.transfusiones > 0 ? 'danger' : 'success'}
          subtitle={`Tasa: ${complicaciones.tasaTransfusion || 0}%`}
        />
      </div>

      {/* KPIs secundarios */}
      <div className={styles.cardsGrid}>
        <StatCard
          title="Preeclampsia Severa"
          value={complicaciones.preeclampsia || 0}
          icon={<i className="fa-solid fa-arrow-up"></i>}
          variant={complicaciones.preeclampsia > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Eclampsia"
          value={complicaciones.eclampsia || 0}
          icon={<i className="fa-solid fa-bolt"></i>}
          variant={complicaciones.eclampsia > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Desgarros III-IV"
          value={complicaciones.desgarrosIIIIV || 0}
          icon={<i className="fa-solid fa-location-dot"></i>}
          variant={complicaciones.desgarrosIIIIV > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Histerectomía"
          value={complicaciones.histerectomia || 0}
          icon={<i className="fa-solid fa-hospital"></i>}
          variant={complicaciones.histerectomia > 0 ? 'danger' : 'success'}
          subtitle="Obstétrica"
        />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Por Tipo */}
        {tipoData.length > 0 ? (
          <ChartCard title="Distribución por Tipo" height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tipoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, porcentaje }) => `${porcentaje}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {tipoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, 'Cantidad']} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Distribución por Tipo" height={350} isEmpty emptyMessage="No hay complicaciones registradas" />
        )}

        {/* Por Contexto */}
        {contextoData.length > 0 ? (
          <ChartCard title="Distribución por Contexto" height={350}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contextoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad" fill="#DC3545" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Distribución por Contexto" height={350} isEmpty emptyMessage="Sin datos de contexto" />
        )}
      </div>

      {/* Alertas por complicaciones graves */}
      {complicacionesGraves.length > 0 && (
        <div className={styles.alertsSection}>
          <h3 className={styles.sectionTitle}><i className="fa-solid fa-circle-exclamation"></i> Complicaciones Graves Detectadas</h3>
          <div className={styles.alertsGrid}>
            {complicacionesGraves.map((comp, idx) => (
              <div 
                key={idx} 
                className={`${styles.alert} ${
                  comp.gravedad === 'crítica' ? styles.alertDanger : 
                  comp.gravedad === 'alta' ? styles.alertWarning : 
                  styles.alertInfo
                }`}
              >
                <span className={styles.alertIcon}>
                  {comp.gravedad === 'crítica' ? <i className="fa-solid fa-circle-exclamation"></i> : comp.gravedad === 'alta' ? <i className="fa-solid fa-triangle-exclamation"></i> : <i className="fa-solid fa-thumbtack"></i>}
                </span>
                <div>
                  <strong>{comp.nombre}</strong>
                  <p>{comp.cantidad} caso{comp.cantidad !== 1 ? 's' : ''} registrado{comp.cantidad !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla detallada */}
      {tableData.length > 0 && (
        <div className={styles.tableSection}>
          <h3 className={styles.sectionTitle}><i className="fa-solid fa-clipboard-list"></i> Detalle por Tipo de Complicación</h3>
          <DataTable 
            columns={[
              { key: 'tipo', label: 'Tipo de Complicación', sortable: true },
              { key: 'cantidad', label: 'Cantidad', sortable: true, align: 'center' },
              { key: 'porcentaje', label: '% del Total', sortable: true, align: 'center' },
            ]}
            data={tableData}
            pageSize={15}
          />
        </div>
      )}

      {/* Mensaje cuando no hay complicaciones */}
      {complicaciones.total === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><i className="fa-solid fa-circle-check"></i></span>
          <h3>Sin Complicaciones Registradas</h3>
          <p>No se han registrado complicaciones obstétricas en el período seleccionado.</p>
        </div>
      )}
    </div>
  )
}
