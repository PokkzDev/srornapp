import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import styles from './page.module.css'

export default async function MadreDetailPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  const hasViewPermission = permissions.includes('madre:view') || permissions.includes('madre:view_limited')
  if (!hasViewPermission) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar madres.</p>
            <Link href="/dashboard/madres" className={styles.btnSecondary}>
              Volver al Módulo Madres
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isLimited = permissions.includes('madre:view_limited') && !permissions.includes('madre:view')

  const { id } = await params

  const madre = await prisma.madre.findUnique({
    where: { id },
    include: isLimited ? {} : {
      partos: {
        orderBy: { fechaHora: 'desc' },
        take: 10,
      },
    },
  })

  if (!madre) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Madre no encontrada</h2>
            <p>La madre solicitada no existe en el sistema.</p>
            <Link href="/dashboard/madres" className={styles.btnSecondary}>
              Volver al Módulo Madres
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const canUpdate = permissions.includes('madre:update') || permissions.includes('madre:update_limited')

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <Link href="/dashboard/madres" className={styles.backLink}>
                <i className="fas fa-arrow-left"></i> Volver al listado
              </Link>
              <h1>Detalles de la Madre</h1>
              <p>Información completa de la madre registrada</p>
            </div>
            {canUpdate && (
              <Link
                href={`/dashboard/madres/${id}/editar`}
                className={styles.btnEdit}
              >
                <i className="fas fa-edit"></i>
                Editar Madre
              </Link>
            )}
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-id-card"></i>
              Información de Identificación
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>RUT</label>
                <span>{madre.rut}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Nombres</label>
                <span>{madre.nombres}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Apellidos</label>
                <span>{madre.apellidos}</span>
              </div>
              {madre.fichaClinica && (
                <div className={styles.infoItem}>
                  <label>Ficha Clínica</label>
                  <span>{madre.fichaClinica}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Información Demográfica
            </h2>
            <div className={styles.infoGrid}>
              {madre.edad && (
                <div className={styles.infoItem}>
                  <label>Edad</label>
                  <span>{madre.edad} años</span>
                </div>
              )}
              {madre.fechaNacimiento && (
                <div className={styles.infoItem}>
                  <label>Fecha de Nacimiento</label>
                  <span>
                    {new Date(madre.fechaNacimiento).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}
              {madre.direccion && (
                <div className={styles.infoItem}>
                  <label>Dirección</label>
                  <span>{madre.direccion}</span>
                </div>
              )}
              {madre.telefono && (
                <div className={styles.infoItem}>
                  <label>Teléfono</label>
                  <span>{madre.telefono}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-baby"></i>
              Partos Registrados ({madre.partos?.length || 0})
            </h2>
            {isLimited ? (
              <p className={styles.emptyText}>
                No tiene permisos para visualizar información de partos.
              </p>
            ) : !madre.partos || madre.partos.length === 0 ? (
              <p className={styles.emptyText}>
                No hay partos registrados para esta madre.
              </p>
            ) : (
              <div className={styles.partosList}>
                {madre.partos.map((parto) => (
                  <div key={parto.id} className={styles.partoItem}>
                    <div className={styles.partoHeader}>
                      <span className={styles.partoDate}>
                        {new Date(parto.fechaHora).toLocaleString('es-CL')}
                      </span>
                      <span className={styles.partoTipo}>{parto.tipo}</span>
                    </div>
                    <div className={styles.partoDetails}>
                      <span>
                        <strong>Lugar:</strong> {parto.lugar}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-clock"></i>
              Información del Sistema
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Fecha de Registro</label>
                <span>
                  {new Date(madre.createdAt).toLocaleString('es-CL')}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Última Actualización</label>
                <span>
                  {new Date(madre.updatedAt).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}



