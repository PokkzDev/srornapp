import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import RecienNacidoForm from '@/components/RecienNacidoForm'
import styles from './page.module.css'

export default async function EditarRecienNacidoPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('recien-nacido:update')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para editar recién nacidos.</p>
            <a href="/dashboard/recien-nacidos" className={styles.btnSecondary}>
              Volver al Módulo Recién Nacidos
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { id } = await params

  const recienNacido = await prisma.recienNacido.findUnique({
    where: { id },
    include: {
      parto: {
        include: {
          madre: {
            select: {
              id: true,
              rut: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
      },
    },
  })

  if (!recienNacido) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Recién Nacido no encontrado</h2>
            <p>El recién nacido solicitado no existe en el sistema.</p>
            <a href="/dashboard/recien-nacidos" className={styles.btnSecondary}>
              Volver al Módulo Recién Nacidos
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
          <h1>Editar Recién Nacido</h1>
          <p>Modifique los datos del recién nacido</p>
        </div>
        <RecienNacidoForm initialData={recienNacido} isEdit={true} recienNacidoId={id} />
      </div>
    </DashboardLayout>
  )
}



