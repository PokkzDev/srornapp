import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import IngresoAltaListClient from './IngresoAltaListClient'
import styles from './page.module.css'

export default async function IngresoAltaListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('ingreso_alta:view') && !permissions.includes('ingreso_alta:manage')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar ingresos/altas.</p>
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
      <IngresoAltaListClient
        permissions={{
          view: permissions.includes('ingreso_alta:view') || permissions.includes('ingreso_alta:manage'),
          create: permissions.includes('ingreso_alta:create') || permissions.includes('ingreso_alta:manage'),
          update: permissions.includes('ingreso_alta:update') || permissions.includes('ingreso_alta:manage'),
          alta: permissions.includes('ingreso_alta:alta') || permissions.includes('ingreso_alta:manage'),
        }}
      />
    </DashboardLayout>
  )
}

