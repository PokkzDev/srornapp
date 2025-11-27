import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import RegistrarUsuarioForm from './RegistrarUsuarioForm'
import styles from './page.module.css'

export default async function RegistrarUsuarioPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()
  
  if (!permissions.includes('user:create')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para crear usuarios.</p>
            <a href="/dashboard/usuarios" className={styles.btnSecondary}>
              Volver a Gestión de Usuarios
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <a href="/dashboard/usuarios" className={styles.backLink}>
            <i className="fas fa-arrow-left"></i> Volver al listado
          </a>
          <h1>Crear Nuevo Usuario</h1>
          <p>Complete el formulario con los datos del nuevo usuario</p>
        </div>
        <RegistrarUsuarioForm />
      </div>
    </DashboardLayout>
  )
}









