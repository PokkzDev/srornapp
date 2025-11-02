import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import RegistrarIngresoForm from './RegistrarIngresoForm'
import styles from './page.module.css'

export default async function RegistrarIngresoPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('ingreso_alta:create') && !permissions.includes('ingreso_alta:manage')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para registrar ingresos.</p>
            <a href="/dashboard/ingreso-alta" className={styles.btnSecondary}>
              Volver al listado
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <RegistrarIngresoForm />
      </div>
    </DashboardLayout>
  )
}

