import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import MadreForm from '@/components/MadreForm'
import styles from './page.module.css'

export default async function RegistrarMadrePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()
  
  const hasCreatePermission = permissions.includes('madre:create') || permissions.includes('madre:create_limited')
  if (!hasCreatePermission) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para registrar madres.</p>
            <a href="/dashboard/madres" className={styles.btnSecondary}>
              Volver al Módulo Madres
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isLimited = permissions.includes('madre:create_limited') && !permissions.includes('madre:create')

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Registrar Nueva Madre</h1>
          <p>Complete el formulario con los datos de la madre</p>
        </div>
        <MadreForm isLimited={isLimited} />
      </div>
    </DashboardLayout>
  )
}

