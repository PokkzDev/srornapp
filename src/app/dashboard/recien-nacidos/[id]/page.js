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
      episodios: {
        orderBy: { fechaHoraIngreso: 'desc' },
        include: {
          responsableClinico: {
            select: {
              id: true,
              nombre: true,
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
  const canCreateEpisodio = permissions.includes('urni:episodio:create')
  const canViewEpisodios = permissions.includes('urni:read') || permissions.includes('urni:episodio:view')

  // Verificar si hay episodio activo
  const episodioActivo = recienNacido?.episodios?.find(ep => ep.estado === 'INGRESADO')

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

  // Función para formatear servicio/unidad
  const formatServicioUnidad = (servicio) => {
    if (!servicio) return '-'
    const servicios = {
      URNI: 'URNI',
      UCIN: 'UCIN',
      NEONATOLOGIA: 'Neonatología',
    }
    return servicios[servicio] || servicio
  }

  // Función para formatear estado
  const formatEstado = (estado) => {
    const estados = {
      INGRESADO: 'Ingresado',
      ALTA: 'Alta',
    }
    return estados[estado] || estado
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {canCreateEpisodio && !episodioActivo && (
                <Link
                  href={`/dashboard/urni/nuevo?rnId=${id}`}
                  className={styles.btnEdit}
                  style={{ backgroundColor: '#28a745' }}
                >
                  <i className="fas fa-hospital"></i>
                  Ingresar a URNI
                </Link>
              )}
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
              {recienNacido.pesoNacimientoGramos && (
                <div className={styles.infoItem}>
                  <label>Peso</label>
                  <span>{recienNacido.pesoNacimientoGramos} g</span>
                </div>
              )}
              {recienNacido.tallaCm && (
                <div className={styles.infoItem}>
                  <label>Talla</label>
                  <span>{recienNacido.tallaCm} cm</span>
                </div>
              )}
              {recienNacido.apgar1Min !== null && recienNacido.apgar1Min !== undefined && (
                <div className={styles.infoItem}>
                  <label>Apgar 1'</label>
                  <span>{recienNacido.apgar1Min}</span>
                </div>
              )}
              {recienNacido.apgar5Min !== null && recienNacido.apgar5Min !== undefined && (
                <div className={styles.infoItem}>
                  <label>Apgar 5'</label>
                  <span>{recienNacido.apgar5Min}</span>
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

          {canViewEpisodios && recienNacido.episodios && recienNacido.episodios.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-hospital"></i>
                Episodios URNI
              </h2>
              <div className={styles.infoGrid}>
                {recienNacido.episodios.map((episodio) => (
                  <div key={episodio.id} className={styles.infoItem} style={{ gridColumn: '1 / -1', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>Estado:</strong> <span className={styles.badge} style={{ backgroundColor: episodio.estado === 'INGRESADO' ? '#ffc107' : '#28a745' }}>
                          {formatEstado(episodio.estado)}
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/urni/${episodio.id}`}
                        style={{ color: '#007bff', textDecoration: 'none' }}
                      >
                        Ver detalle <i className="fas fa-arrow-right"></i>
                      </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                      <div>
                        <label>Fecha Ingreso:</label>
                        <span>{formatFecha(episodio.fechaHoraIngreso)}</span>
                      </div>
                      {episodio.fechaHoraAlta && (
                        <div>
                          <label>Fecha Alta:</label>
                          <span>{formatFecha(episodio.fechaHoraAlta)}</span>
                        </div>
                      )}
                      {episodio.servicioUnidad && (
                        <div>
                          <label>Servicio/Unidad:</label>
                          <span>{formatServicioUnidad(episodio.servicioUnidad)}</span>
                        </div>
                      )}
                      {episodio.responsableClinico && (
                        <div>
                          <label>Responsable Clínico:</label>
                          <span>{episodio.responsableClinico.nombre}</span>
                        </div>
                      )}
                      {episodio.motivoIngreso && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label>Motivo Ingreso:</label>
                          <span>{episodio.motivoIngreso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canViewEpisodios && episodioActivo && (
            <div className={styles.section} style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', border: '1px solid #ffc107' }}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-exclamation-circle"></i>
                Episodio URNI Activo
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Estado</label>
                  <span className={styles.badge} style={{ backgroundColor: '#ffc107' }}>
                    {formatEstado(episodioActivo.estado)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>Fecha Ingreso</label>
                  <span>{formatFecha(episodioActivo.fechaHoraIngreso)}</span>
                </div>
                {episodioActivo.servicioUnidad && (
                  <div className={styles.infoItem}>
                    <label>Servicio/Unidad</label>
                    <span>{formatServicioUnidad(episodioActivo.servicioUnidad)}</span>
                  </div>
                )}
                {episodioActivo.responsableClinico && (
                  <div className={styles.infoItem}>
                    <label>Responsable Clínico</label>
                    <span>{episodioActivo.responsableClinico.nombre}</span>
                  </div>
                )}
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <Link
                    href={`/dashboard/urni/${episodioActivo.id}`}
                    className={styles.btnEdit}
                    style={{ display: 'inline-block' }}
                  >
                    <i className="fas fa-eye"></i>
                    Ver Detalle del Episodio
                  </Link>
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









