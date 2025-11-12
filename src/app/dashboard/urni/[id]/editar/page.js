import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EditarEpisodioURNIForm from './EditarEpisodioURNIForm'
import styles from './page.module.css'

export default async function EditarEpisodioURNIPage({ params }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const permissions = await getUserPermissions()
  if (!permissions.includes('urni:episodio:update')) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox}>
          <h2>Sin permisos</h2>
          <p>No tiene permisos para editar episodios URNI.</p>
          <a href="/dashboard/urni" className={styles.btnSecondary}>
            Volver a Episodios URNI
          </a>
        </div>
      </div>
    )
  }

  const { id } = await params

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <a href="/dashboard/urni" className={styles.backLink}>
          <i className="fas fa-arrow-left"></i> Volver al listado
        </a>
        <h1>Editar Episodio URNI</h1>
        <p>Modifique la información del episodio de ingreso a URNI</p>
      </div>

      <EditarEpisodioURNIForm episodioId={id} />
    </div>
  )
}

