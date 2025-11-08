import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import styles from './page.module.css'

export default async function ReporteREMPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  // Permisos para generar reporte REM
  const canGenerate = permissions.includes('reporte_rem:generate')

  if (!canGenerate) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para generar reportes REM.</p>
            <a href="/dashboard" className={styles.btnSecondary}>
              Volver al Dashboard
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>
            <i className="fas fa-file-alt"></i> Reporte REM
          </h1>
        </div>
        <div className={styles.developmentBox}>
          <div className={styles.developmentIcon}>
            <i className="fas fa-tools"></i>
          </div>
          <h2>Módulo en Desarrollo</h2>
          <p>
            El módulo de Reporte REM se encuentra actualmente en desarrollo.
            Estará disponible próximamente.
          </p>
          <a href="/dashboard" className={styles.btnSecondary}>
            Volver al Dashboard
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}

