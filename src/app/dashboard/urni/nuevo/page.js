import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import CrearEpisodioURNIForm from './CrearEpisodioURNIForm'
import styles from './page.module.css'

export default async function CrearEpisodioURNIPage({ searchParams }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('urni:episodio:create')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para crear episodios URNI.</p>
            <a href="/dashboard/urni" className={styles.btnSecondary}>
              Volver a Episodios URNI
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const rnId = (await searchParams)?.rnId || null

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <a href="/dashboard/urni" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i> Volver al listado
            </a>
            <h1>Nuevo Episodio URNI</h1>
            <p>Registrar ingreso de recién nacido a la Unidad de Recién Nacidos</p>
          </div>
        </div>

        <CrearEpisodioURNIForm rnIdPreseleccionado={rnId} />
      </div>
    </DashboardLayout>
  )
}









