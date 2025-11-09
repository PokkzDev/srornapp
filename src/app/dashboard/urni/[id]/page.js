import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import URNIEpisodioDetailClient from './URNIEpisodioDetailClient'
import styles from './page.module.css'

export default async function URNIEpisodioDetailPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  const canView = 
    permissions.includes('urni:read') || 
    permissions.includes('urni:episodio:view')
  
  const canCreateAtencion = permissions.includes('urni:atencion:create')
  const canAlta = permissions.includes('alta:manage')

  if (!canView) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar episodios URNI.</p>
            <a href="/dashboard/urni" className={styles.btnSecondary}>
              Volver a Episodios URNI
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
        <URNIEpisodioDetailClient 
          episodioId={id}
          permissions={{
            view: canView,
            createAtencion: canCreateAtencion,
            alta: canAlta,
          }}
        />
      </div>
    </DashboardLayout>
  )
}




