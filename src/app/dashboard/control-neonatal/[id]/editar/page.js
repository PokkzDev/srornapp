import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import EditarControlForm from './EditarControlForm'
import styles from './page.module.css'

export default async function EditarControlNeonatalPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('control_neonatal:update')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para editar controles neonatales.</p>
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
      <EditarControlForm controlId={id} />
    </DashboardLayout>
  )
}












