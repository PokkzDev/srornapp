import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import MadresListClient from './MadresListClient'
import styles from './page.module.css'

export default async function MadresListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  const hasViewPermission = permissions.includes('madre:view') || permissions.includes('madre:view_limited')
  if (!hasViewPermission) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar madres.</p>
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
      <MadresListClient
        permissions={{
          view: hasViewPermission,
          create: permissions.includes('madre:create') || permissions.includes('madre:create_limited'),
          update: permissions.includes('madre:update') || permissions.includes('madre:update_limited'),
          delete: permissions.includes('madre:delete') || permissions.includes('madre:delete_limited'),
          isLimited: permissions.includes('madre:view_limited') && !permissions.includes('madre:view'),
        }}
      />
    </DashboardLayout>
  )
}
