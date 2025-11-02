import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import RegistrarPartoClient from './RegistrarPartoClient'
import styles from './page.module.css'

export default async function RegistrarPartoPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()
  
  if (!permissions.includes('parto:create')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para registrar partos.</p>
            <a href="/dashboard/partos" className={styles.btnSecondary}>
              Volver al Módulo Partos
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <RegistrarPartoClient />
    </DashboardLayout>
  )
}

