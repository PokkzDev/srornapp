import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import ControlNeonatalListClient from './ControlNeonatalListClient'
import styles from './page.module.css'

export default async function ControlNeonatalPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('control_neonatal:view')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar controles neonatales.</p>
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
      <ControlNeonatalListClient
        permissions={{
          view: permissions.includes('control_neonatal:view'),
          create: permissions.includes('control_neonatal:create'),
          update: permissions.includes('control_neonatal:update'),
          delete: permissions.includes('control_neonatal:delete'),
        }}
      />
    </DashboardLayout>
  )
}










