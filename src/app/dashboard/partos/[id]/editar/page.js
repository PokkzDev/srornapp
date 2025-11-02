import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import PartoForm from '@/components/PartoForm'
import styles from './page.module.css'

export default async function EditarPartoPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('parto:update')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para editar partos.</p>
            <a href="/dashboard/partos" className={styles.btnSecondary}>
              Volver al Módulo Partos
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { id } = await params

  const parto = await prisma.parto.findUnique({
    where: { id },
    include: {
      madre: {
        select: {
          id: true,
          rut: true,
          nombres: true,
          apellidos: true,
        },
      },
      matronas: {
        select: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      },
      medicos: {
        select: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      },
      enfermeras: {
        select: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!parto) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Parto no encontrado</h2>
            <p>El parto solicitado no existe en el sistema.</p>
            <a href="/dashboard/partos" className={styles.btnSecondary}>
              Volver al Módulo Partos
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
          <h1>Editar Parto</h1>
          <p>Modifique los datos del parto</p>
        </div>
        <PartoForm initialData={parto} isEdit={true} partoId={id} />
      </div>
    </DashboardLayout>
  )
}



