import Link from 'next/link'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import UserMenu from './UserMenu'
import styles from './Sidebar.module.css'

export default async function Sidebar() {
  const user = await getCurrentUser()
  const permissions = await getUserPermissions()

  if (!user) {
    return null
  }

  // Organize menu items by sections
  const modulos = []
  const informes = []

  // MÓDULOS
  // Modulo Madres
  if (
    permissions.includes('madre:view') ||
    permissions.includes('madre:create') ||
    permissions.includes('madre:update') ||
    permissions.includes('madre:delete')
  ) {
    modulos.push({
      icon: 'fa-user-injured',
      label: 'Modulo Madres',
      href: '/dashboard/madres',
      permission: 'madre:view',
    })
  }

  // Modulo Partos
  if (
    permissions.includes('parto:view') ||
    permissions.includes('parto:create') ||
    permissions.includes('parto:update') ||
    permissions.includes('parto:delete')
  ) {
    modulos.push({
      icon: 'fa-baby',
      label: 'Modulo Partos',
      href: '/dashboard/partos',
      permission: 'parto:view',
    })
  }

  // Modulo Recién Nacidos
  if (
    permissions.includes('recien-nacido:view') ||
    permissions.includes('recien-nacido:create') ||
    permissions.includes('recien-nacido:update') ||
    permissions.includes('recien-nacido:delete') ||
    permissions.includes('recien_nacido:create') // Support legacy format
  ) {
    modulos.push({
      icon: 'fa-baby-carriage',
      label: 'Modulo Recién Nacidos',
      href: '/dashboard/recien-nacidos',
      permission: 'recien-nacido:view',
    })
  }

  // Atención URN
  if (permissions.includes('atencion_urn:create')) {
    modulos.push({
      icon: 'fa-hospital',
      label: 'Atención URN',
      href: '/dashboard/atencion-urn',
      permission: 'atencion_urn:create',
    })
  }

  // Control Neonatal
  if (permissions.includes('control_neonatal:create')) {
    modulos.push({
      icon: 'fa-heartbeat',
      label: 'Control Neonatal',
      href: '/dashboard/control-neonatal',
      permission: 'control_neonatal:create',
    })
  }

  // Modulo de Alta (Doctor)
  if (permissions.includes('modulo_alta:aprobar')) {
    modulos.push({
      icon: 'fa-check-circle',
      label: 'Modulo de Alta',
      href: '/dashboard/modulo-alta',
      permission: 'modulo_alta:aprobar',
    })
  }

  // Gestión Ingreso/Alta
  if (
    permissions.includes('ingreso_alta:view') ||
    permissions.includes('ingreso_alta:create') ||
    permissions.includes('ingreso_alta:update') ||
    permissions.includes('ingreso_alta:alta') ||
    permissions.includes('ingreso_alta:manage')
  ) {
    modulos.push({
      icon: 'fa-door-open',
      label: 'Ingreso/Alta',
      href: '/dashboard/ingreso-alta',
      permission: 'ingreso_alta:view',
    })
  }

  // Auditoría
  if (permissions.includes('auditoria:review')) {
    modulos.push({
      icon: 'fa-search',
      label: 'Auditoría',
      href: '/dashboard/auditoria',
      permission: 'auditoria:review',
    })
  }

  // Indicadores
  if (permissions.includes('indicadores:consult')) {
    modulos.push({
      icon: 'fa-chart-bar',
      label: 'Indicadores',
      href: '/dashboard/indicadores',
      permission: 'indicadores:consult',
    })
  }

  // INFORMES
  // Generar Informe para Alta
  if (permissions.includes('informe_alta:generate')) {
    informes.push({
      icon: 'fa-file-pdf',
      label: 'Generar Informe para Alta',
      href: '/dashboard/informe-alta',
      permission: 'informe_alta:generate',
    })
  }

  // Reporte REM
  if (permissions.includes('reporte_rem:generate')) {
    informes.push({
      icon: 'fa-file-alt',
      label: 'Reporte REM',
      href: '/dashboard/reportes/rem',
      permission: 'reporte_rem:generate',
    })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2>Sistema SRORN</h2>
      </div>
      <nav className={styles.nav}>
        {/* Sección Módulos */}
        {modulos.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Módulos</h3>
            <ul className={styles.menu}>
              {modulos.map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className={styles.menuItem}>
                    <i className={`fas ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sección Informes */}
        {informes.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Informes</h3>
            <ul className={styles.menu}>
              {informes.map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className={styles.menuItem}>
                    <i className={`fas ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
      <div className={styles.footer}>
        <UserMenu user={user} />
      </div>
    </aside>
  )
}
