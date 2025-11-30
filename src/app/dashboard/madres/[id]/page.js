import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import styles from './page.module.css'
import formStyles from '@/components/MadreForm.module.css'

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

  // Función para formatear fecha para mostrar (DD/MM/YYYY)
  function formatearFechaParaMostrar(fecha) {
    if (!fecha) return ''
    const date = new Date(fecha)
    if (Number.isNaN(date.getTime())) return ''
    const dia = String(date.getDate()).padStart(2, '0')
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const anio = date.getFullYear()
    return `${dia}/${mes}/${anio}`
  }

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

        <div className={formStyles.form}>
          {/* Sección: Datos Personales */}
          <div className={formStyles.formSection}>
            <h2 className={formStyles.sectionTitle}>Datos Personales</h2>
            <div className={formStyles.formGrid}>
              {/* RUT */}
              <div className={formStyles.formGroup}>
                <label htmlFor="rut">
                  RUT <span className={formStyles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="rut"
                  name="rut"
                  value={madre.rut}
                  disabled
                />
              </div>

              {/* Nombres */}
              <div className={formStyles.formGroup}>
                <label htmlFor="nombres">
                  Nombres <span className={formStyles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  value={madre.nombres}
                  disabled
                />
              </div>

              {/* Apellidos */}
              <div className={formStyles.formGroup}>
                <label htmlFor="apellidos">
                  Apellidos <span className={formStyles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={madre.apellidos}
                  disabled
                />
              </div>

              {/* Edad */}
              <div className={formStyles.formGroup}>
                <label htmlFor="edad">Edad</label>
                <input
                  type="number"
                  id="edad"
                  name="edad"
                  value={madre.edad || ''}
                  disabled
                />
              </div>

              {/* Edad en Años (para REM) */}
              {madre.edadAnos !== null && madre.edadAnos !== undefined && (
                <div className={formStyles.formGroup}>
                  <label htmlFor="edadAnos">Edad en Años (REM)</label>
                  <input
                    type="number"
                    id="edadAnos"
                    name="edadAnos"
                    value={madre.edadAnos}
                    disabled
                  />
                  <small className={formStyles.helpText}>
                    Edad en años para tramos REM
                  </small>
                </div>
              )}

              {/* Fecha de Nacimiento */}
              <div className={formStyles.formGroup}>
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                <input
                  type="text"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  value={formatearFechaParaMostrar(madre.fechaNacimiento)}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Sección: Datos de Contacto */}
          <div className={formStyles.formSection}>
            <h2 className={formStyles.sectionTitle}>Datos de Contacto</h2>
            <div className={formStyles.formGrid}>
              {/* Dirección */}
              <div className={formStyles.formGroup}>
                <label htmlFor="direccion">Dirección</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={madre.direccion || ''}
                  disabled
                />
              </div>

              {/* Teléfono */}
              <div className={formStyles.formGroup}>
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={madre.telefono || ''}
                  disabled
                />
              </div>

              {/* Ficha Clínica */}
              <div className={formStyles.formGroup}>
                <label htmlFor="fichaClinica">Ficha Clínica</label>
                <input
                  type="text"
                  id="fichaClinica"
                  name="fichaClinica"
                  value={madre.fichaClinica || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Sección: Información Demográfica y Social */}
          <div className={formStyles.formSection}>
            <h2 className={formStyles.sectionTitle}>Información Demográfica y Social</h2>
            <div className={formStyles.formGrid}>
              {/* Pertenencia a Pueblo Originario */}
              <div className={formStyles.formGroup}>
                <label>Pertenencia a Pueblo Originario</label>
                <input
                  type="text"
                  value={madre.pertenenciaPuebloOriginario === null ? 'No especificado' : madre.pertenenciaPuebloOriginario ? 'Sí' : 'No'}
                  disabled
                />
              </div>

              {/* Condición Migrante */}
              <div className={formStyles.formGroup}>
                <label>Condición Migrante</label>
                <input
                  type="text"
                  value={madre.condicionMigrante === null ? 'No especificado' : madre.condicionMigrante ? 'Sí' : 'No'}
                  disabled
                />
              </div>

              {/* Condición Discapacidad */}
              <div className={formStyles.formGroup}>
                <label>Condición Discapacidad</label>
                <input
                  type="text"
                  value={madre.condicionDiscapacidad === null ? 'No especificado' : madre.condicionDiscapacidad ? 'Sí' : 'No'}
                  disabled
                />
              </div>

              {/* Condición Privada de Libertad */}
              <div className={formStyles.formGroup}>
                <label>Condición Privada de Libertad</label>
                <input
                  type="text"
                  value={madre.condicionPrivadaLibertad === null ? 'No especificado' : madre.condicionPrivadaLibertad ? 'Sí' : 'No'}
                  disabled
                />
              </div>

              {/* Identidad Trans */}
              <div className={formStyles.formGroup}>
                <label>Identidad Trans</label>
                <input
                  type="text"
                  value={madre.identidadTrans === null ? 'No especificado' : madre.identidadTrans ? 'Sí' : 'No'}
                  disabled
                />
              </div>

              {/* Hepatitis B Positiva */}
              <div className={formStyles.formGroup}>
                <label>Hepatitis B Positiva</label>
                <input
                  type="text"
                  value={madre.hepatitisBPositiva === null ? 'No especificado' : madre.hepatitisBPositiva ? 'Sí' : 'No'}
                  disabled
                />
                <small className={formStyles.helpText}>
                  Para sección J transmisión vertical
                </small>
              </div>

              {/* Control Prenatal */}
              <div className={formStyles.formGroup}>
                <label>Control Prenatal</label>
                <input
                  type="text"
                  value={madre.controlPrenatal === null ? 'No especificado' : madre.controlPrenatal ? 'Sí' : 'No'}
                  disabled
                />
                <small className={formStyles.helpText}>
                  Embarazo controlado / no controlado
                </small>
              </div>
            </div>
          </div>

          {/* Sección: Partos Registrados */}
          {!isLimited && (
            <div className={formStyles.formSection}>
              <h2 className={formStyles.sectionTitle}>
                Partos Registrados ({madre.partos?.length || 0})
              </h2>
              {!madre.partos || madre.partos.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
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
          )}

          {/* Sección: Información del Sistema */}
          <div className={formStyles.formSection}>
            <h2 className={formStyles.sectionTitle}>Información del Sistema</h2>
            <div className={formStyles.formGrid}>
              <div className={formStyles.formGroup}>
                <label>Fecha de Registro</label>
                <input
                  type="text"
                  value={new Date(madre.createdAt).toLocaleString('es-CL')}
                  disabled
                />
              </div>
              <div className={formStyles.formGroup}>
                <label>Última Actualización</label>
                <input
                  type="text"
                  value={new Date(madre.updatedAt).toLocaleString('es-CL')}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}



