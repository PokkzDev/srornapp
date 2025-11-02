import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import styles from './page.module.css'

export default async function AtencionURNPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  // Permisos para atención URN (solo doctor)
  const canAccess = permissions.includes('atencion_urn:create')

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para acceder al módulo de atención URN.</p>
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
        <div className={styles.mockupBox}>
          <p>Aqui ira la atencion URN</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

