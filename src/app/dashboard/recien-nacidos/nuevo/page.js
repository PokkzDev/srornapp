import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import RegistrarRecienNacidoClient from './RegistrarRecienNacidoClient'
import styles from './page.module.css'

export default async function RegistrarRecienNacidoPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()
  
  if (!permissions.includes('recien-nacido:create')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para registrar recién nacidos.</p>
            <a href="/dashboard/recien-nacidos" className={styles.btnSecondary}>
              Volver al Módulo Recién Nacidos
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <RegistrarRecienNacidoClient />
    </DashboardLayout>
  )
}

