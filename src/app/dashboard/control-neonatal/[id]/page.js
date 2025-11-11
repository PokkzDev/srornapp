import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import ControlNeonatalDetailClient from './ControlNeonatalDetailClient'
import styles from './page.module.css'

export default async function ControlNeonatalDetailPage({ params }) {
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
            <a href="/dashboard/control-neonatal" className={styles.btnSecondary}>
              Volver a Controles Neonatales
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { id } = await params

  return (
    <DashboardLayout>
      <ControlNeonatalDetailClient
        controlId={id}
        permissions={{
          view: permissions.includes('control_neonatal:view'),
          update: permissions.includes('control_neonatal:update'),
          delete: permissions.includes('control_neonatal:delete'),
        }}
      />
    </DashboardLayout>
  )
}










