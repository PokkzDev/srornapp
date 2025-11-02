import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import MadreForm from '@/components/MadreForm'
import styles from './page.module.css'

export default async function EditarMadrePage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  const hasUpdatePermission = permissions.includes('madre:update') || permissions.includes('madre:update_limited')
  if (!hasUpdatePermission) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para editar madres.</p>
            <a href="/dashboard/madres" className={styles.btnSecondary}>
              Volver al Módulo Madres
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { id } = await params

  const madre = await prisma.madre.findUnique({
    where: { id },
  })

  if (!madre) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Madre no encontrada</h2>
            <p>La madre solicitada no existe en el sistema.</p>
            <a href="/dashboard/madres" className={styles.btnSecondary}>
              Volver al Módulo Madres
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isLimited = permissions.includes('madre:update_limited') && !permissions.includes('madre:update')

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Editar Madre</h1>
          <p>Modifique los datos de la madre</p>
        </div>
        <MadreForm 
          initialData={madre} 
          isEdit={true} 
          madreId={id}
          isLimited={isLimited}
        />
      </div>
    </DashboardLayout>
  )
}



