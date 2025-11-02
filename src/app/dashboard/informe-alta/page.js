import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import InformeAltaClient from './InformeAltaClient'
import styles from './page.module.css'

export default async function InformeAltaPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  // Permisos para generar informe de alta
  const canGenerate = permissions.includes('informe_alta:generate')

  if (!canGenerate) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para generar informes de alta.</p>
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
      <InformeAltaClient />
    </DashboardLayout>
  )
}

