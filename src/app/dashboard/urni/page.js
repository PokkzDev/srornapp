import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import URNIEpisodioListClient from './URNIEpisodioListClient'
import styles from './page.module.css'

export default async function URNIEpisodioPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  // Verificar permisos para ver episodios URNI
  const canView = 
    permissions.includes('urni:read') || 
    permissions.includes('urni:episodio:view')
  
  const canCreate = permissions.includes('urni:episodio:create')

  if (!canView) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar episodios URNI.</p>
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
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Episodios URNI</h1>
              <p>Gestión de episodios de Unidad de Recién Nacidos</p>
            </div>
            {canCreate && (
              <a href="/dashboard/urni/nuevo" className={styles.btnNew}>
                <i className="fas fa-plus"></i>
                Nuevo Episodio URNI
              </a>
            )}
          </div>
        </div>

        <URNIEpisodioListClient 
          permissions={{
            view: canView,
            create: canCreate,
            update: permissions.includes('urni:episodio:update'),
            alta: permissions.includes('alta:manage'),
          }}
        />
      </div>
    </DashboardLayout>
  )
}


