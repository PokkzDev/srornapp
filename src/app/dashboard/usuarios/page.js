import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import UsuariosClient from './UsuariosClient'
import styles from './page.module.css'

export default async function UsuariosPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('user:view')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar usuarios.</p>
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
      <UsuariosClient
        permissions={{
          view: permissions.includes('user:view'),
          create: permissions.includes('user:create'),
          update: permissions.includes('user:update'),
          delete: permissions.includes('user:delete'),
          manage: permissions.includes('user:manage'),
        }}
      />
    </DashboardLayout>
  )
}







