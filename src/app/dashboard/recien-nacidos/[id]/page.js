import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import styles from './page.module.css'

export default async function RecienNacidoDetailPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('recien-nacido:view')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar recién nacidos.</p>
            <Link href="/dashboard/recien-nacidos" className={styles.btnSecondary}>
              Volver al Módulo Recién Nacidos
            </Link>
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
              edad: true,
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
            <Link href="/dashboard/recien-nacidos" className={styles.btnSecondary}>
              Volver al Módulo Recién Nacidos
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const canUpdate = permissions.includes('recien-nacido:update')

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Función para formatear sexo
  const formatSexo = (sexo) => {
    const sexos = {
      M: 'Masculino',
      F: 'Femenino',
      I: 'Indeterminado',
    }
    return sexos[sexo] || sexo
  }

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <Link href="/dashboard/recien-nacidos" className={styles.backLink}>
                <i className="fas fa-arrow-left"></i> Volver al listado
              </Link>
              <h1>Detalles del Recién Nacido</h1>
              <p>Información completa del recién nacido registrado</p>
            </div>
            {canUpdate && (
              <Link
                href={`/dashboard/recien-nacidos/${id}/editar`}
                className={styles.btnEdit}
              >
                <i className="fas fa-edit"></i>
                Editar Recién Nacido
              </Link>
            )}
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-baby"></i>
              Información del Recién Nacido
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Sexo</label>
                <span className={styles.badge}>{formatSexo(recienNacido.sexo)}</span>
              </div>
              {recienNacido.pesoGr && (
                <div className={styles.infoItem}>
                  <label>Peso</label>
                  <span>{recienNacido.pesoGr} g</span>
                </div>
              )}
              {recienNacido.tallaCm && (
                <div className={styles.infoItem}>
                  <label>Talla</label>
                  <span>{recienNacido.tallaCm} cm</span>
                </div>
              )}
              {recienNacido.apgar1 !== null && recienNacido.apgar1 !== undefined && (
                <div className={styles.infoItem}>
                  <label>Apgar 1'</label>
                  <span>{recienNacido.apgar1}</span>
                </div>
              )}
              {recienNacido.apgar5 !== null && recienNacido.apgar5 !== undefined && (
                <div className={styles.infoItem}>
                  <label>Apgar 5'</label>
                  <span>{recienNacido.apgar5}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-user-injured"></i>
              Información del Parto y Madre
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Fecha y Hora del Parto</label>
                <span>{formatFecha(recienNacido.parto?.fechaHora)}</span>
              </div>
              {recienNacido.parto?.madre && (
                <>
                  <div className={styles.infoItem}>
                    <label>RUT Madre</label>
                    <span>{recienNacido.parto.madre.rut}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Nombres Madre</label>
                    <span>{recienNacido.parto.madre.nombres}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Apellidos Madre</label>
                    <span>{recienNacido.parto.madre.apellidos}</span>
                  </div>
                  {recienNacido.parto.madre.edad && (
                    <div className={styles.infoItem}>
                      <label>Edad Madre</label>
                      <span>{recienNacido.parto.madre.edad} años</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {recienNacido.observaciones && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-notes-medical"></i>
                Observaciones
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <label>Observaciones</label>
                  <span>{recienNacido.observaciones}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-clock"></i>
              Información del Sistema
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Fecha de Registro</label>
                <span>
                  {new Date(recienNacido.createdAt).toLocaleString('es-CL')}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Última Actualización</label>
                <span>
                  {new Date(recienNacido.updatedAt).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}



