import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import EditarUsuarioForm from './EditarUsuarioForm'
import styles from './page.module.css'

export default async function EditarUsuarioPage({ params }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()
  
  if (!permissions.includes('user:update')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para editar usuarios.</p>
            <a href="/dashboard/usuarios" className={styles.btnSecondary}>
              Volver a Gestión de Usuarios
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { id } = await params

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <a href="/dashboard/usuarios" className={styles.backLink}>
            <i className="fas fa-arrow-left"></i> Volver al listado
          </a>
          <h1>Editar Usuario</h1>
          <p>Modifique los datos del usuario</p>
        </div>
        <EditarUsuarioForm userId={id} />
      </div>
    </DashboardLayout>
  )
}







