import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import RecienNacidosListClient from './RecienNacidosListClient'
import styles from './page.module.css'

export default async function RecienNacidosListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('recien-nacido:view')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar recién nacidos.</p>
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
      <RecienNacidosListClient
        permissions={{
          view: permissions.includes('recien-nacido:view'),
          create: permissions.includes('recien-nacido:create'),
          update: permissions.includes('recien-nacido:update'),
          delete: permissions.includes('recien-nacido:delete'),
        }}
      />
    </DashboardLayout>
  )
}










