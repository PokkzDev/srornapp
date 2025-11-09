import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import PartosListClient from './PartosListClient'
import styles from './page.module.css'

export default async function PartosListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('parto:view')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar partos.</p>
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
      <PartosListClient
        permissions={{
          view: permissions.includes('parto:view'),
          create: permissions.includes('parto:create'),
          update: permissions.includes('parto:update'),
          delete: permissions.includes('parto:delete'),
        }}
      />
    </DashboardLayout>
  )
}












