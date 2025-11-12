import { redirect } from 'next/navigation'
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import styles from './page.module.css'

export default async function PartoDetailPage({ params }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  const permissions = await getUserPermissions()

  if (!permissions.includes('parto:view')) {
    return (
      <DashboardLayout>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <h2>Acceso Denegado</h2>
            <p>No tiene permisos para visualizar partos.</p>
            <Link href="/dashboard/partos" className={styles.btnSecondary}>
              Volver al Módulo Partos
            </Link>
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
          edad: true,
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
      recienNacidos: {
        select: {
          id: true,
          sexo: true,
          pesoNacimientoGramos: true,
          tallaCm: true,
          apgar1Min: true,
          apgar5Min: true,
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
            <Link href="/dashboard/partos" className={styles.btnSecondary}>
              Volver al Módulo Partos
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const canUpdate = permissions.includes('parto:update')

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

  // Función para obtener el tipo de parto puro (sin lugar)
  const obtenerTipoPartoPuro = (tipo) => {
    if (!tipo) return null
    
    switch (tipo) {
      case 'DOMICILIO_PROFESIONAL':
      case 'DOMICILIO_SIN_PROFESIONAL':
        return 'VAGINAL'
      case 'PREHOSPITALARIO':
      case 'FUERA_RED':
        return 'VAGINAL'
      case 'VAGINAL':
      case 'INSTRUMENTAL':
      case 'CESAREA_ELECTIVA':
      case 'CESAREA_URGENCIA':
        return tipo
      default:
        return tipo
    }
  }

  // Función para obtener el contexto especial del tipo
  const obtenerContextoEspecial = (tipo) => {
    if (!tipo) return null
    
    switch (tipo) {
      case 'DOMICILIO_PROFESIONAL':
        return 'Domicilio con Profesional'
      case 'DOMICILIO_SIN_PROFESIONAL':
        return 'Domicilio sin Profesional'
      case 'PREHOSPITALARIO':
        return 'Prehospitalario'
      case 'FUERA_RED':
        return 'Fuera de Red'
      default:
        return null
    }
  }

  // Función para formatear tipo de parto
  const formatTipo = (tipo) => {
    const tipoPuro = obtenerTipoPartoPuro(tipo)
    const tipos = {
      VAGINAL: 'Vaginal',
      INSTRUMENTAL: 'Instrumental',
      CESAREA_ELECTIVA: 'Cesárea Electiva',
      CESAREA_URGENCIA: 'Cesárea Urgencia',
    }
    return tipos[tipoPuro] || tipoPuro
  }

  // Función para formatear lugar
  const formatLugar = (lugar) => {
    const lugares = {
      SALA_PARTO: 'Sala de Parto',
      PABELLON: 'Pabellón',
      DOMICILIO: 'Domicilio',
      OTRO: 'Otro',
    }
    return lugares[lugar] || lugar
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
              <Link href="/dashboard/partos" className={styles.backLink}>
                <i className="fas fa-arrow-left"></i> Volver al listado
              </Link>
              <h1>Detalles del Parto</h1>
              <p>Información completa del parto registrado</p>
            </div>
            {canUpdate && (
              <Link
                href={`/dashboard/partos/${id}/editar`}
                className={styles.btnEdit}
              >
                <i className="fas fa-edit"></i>
                Editar Parto
              </Link>
            )}
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-baby"></i>
              Información del Parto
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Fecha y Hora</label>
                <span>{formatFecha(parto.fechaHora)}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Tipo de Parto</label>
                <span className={styles.badge}>{formatTipo(parto.tipo)}</span>
              </div>
              {obtenerContextoEspecial(parto.tipo) && (
                <div className={styles.infoItem}>
                  <label>Contexto Especial</label>
                  <span className={styles.badge}>{obtenerContextoEspecial(parto.tipo)}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <label>Lugar</label>
                <span>
                  {formatLugar(parto.lugar)}
                  {parto.lugar === 'OTRO' && parto.lugarDetalle && (
                    <span className={styles.detail}> - {parto.lugarDetalle}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Características del Parto */}
          {(parto.establecimientoId || parto.edadGestacionalSemanas !== null) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-info-circle"></i>
                Características del Parto
              </h2>
              <div className={styles.infoGrid}>
                {parto.establecimientoId && (
                  <div className={styles.infoItem}>
                    <label>Establecimiento ID</label>
                    <span>{parto.establecimientoId}</span>
                  </div>
                )}
                {parto.edadGestacionalSemanas !== null && (
                  <div className={styles.infoItem}>
                    <label>Edad Gestacional</label>
                    <span>{parto.edadGestacionalSemanas} semanas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modelo de Atención */}
          {(parto.inicioTrabajoParto || parto.posicionExpulsivo || 
            parto.conduccionOxitocica !== null || parto.libertadMovimiento !== null ||
            parto.regimenHidricoAmplio !== null || parto.manejoDolorNoFarmacologico !== null ||
            parto.manejoDolorFarmacologico !== null || parto.episiotomia !== null) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-hospital"></i>
                Modelo de Atención
              </h2>
              <div className={styles.infoGrid}>
                {parto.inicioTrabajoParto && (
                  <div className={styles.infoItem}>
                    <label>Inicio Trabajo Parto</label>
                    <span>
                      {parto.inicioTrabajoParto === 'ESPONTANEO' ? 'Espontáneo' :
                       parto.inicioTrabajoParto === 'INDUCIDO_MECANICO' ? 'Inducido Mecánico' :
                       parto.inicioTrabajoParto === 'INDUCIDO_FARMACOLOGICO' ? 'Inducido Farmacológico' :
                       parto.inicioTrabajoParto}
                    </span>
                  </div>
                )}
                {parto.posicionExpulsivo && (
                  <div className={styles.infoItem}>
                    <label>Posición Expulsivo</label>
                    <span>
                      {parto.posicionExpulsivo === 'LITOTOMIA' ? 'Litotomía' :
                       parto.posicionExpulsivo === 'OTRAS' ? 'Otras' :
                       parto.posicionExpulsivo}
                    </span>
                  </div>
                )}
                {(parto.conduccionOxitocica !== null || parto.libertadMovimiento !== null ||
                  parto.regimenHidricoAmplio !== null || parto.manejoDolorNoFarmacologico !== null ||
                  parto.manejoDolorFarmacologico !== null || parto.episiotomia !== null) && (
                  <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                    <label>Prácticas Aplicadas</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {parto.conduccionOxitocica && <span className={styles.badge}>Conducción Oxitócica</span>}
                      {parto.libertadMovimiento && <span className={styles.badge}>Libertad de Movimiento</span>}
                      {parto.regimenHidricoAmplio && <span className={styles.badge}>Régimen Hídrico Amplio</span>}
                      {parto.manejoDolorNoFarmacologico && <span className={styles.badge}>Manejo Dolor No Farmacológico</span>}
                      {parto.manejoDolorFarmacologico && <span className={styles.badge}>Manejo Dolor Farmacológico</span>}
                      {parto.episiotomia && <span className={styles.badge}>Episiotomía</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acompañamiento */}
          {(parto.acompananteDuranteTrabajo !== null || parto.acompananteSoloExpulsivo !== null) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-users"></i>
                Acompañamiento
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <label>Acompañamiento</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {parto.acompananteDuranteTrabajo && <span className={styles.badge}>Acompañante Durante Trabajo</span>}
                    {parto.acompananteSoloExpulsivo && <span className={styles.badge}>Acompañante Solo en Expulsivo</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buenas Prácticas */}
          {(parto.oxitocinaProfilactica !== null || parto.ligaduraTardiaCordon !== null ||
            parto.atencionPertinenciaCultural !== null || parto.contactoPielPielMadre30min !== null ||
            parto.contactoPielPielAcomp30min !== null || parto.lactancia60minAlMenosUnRn !== null) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-check-circle"></i>
                Buenas Prácticas
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <label>Buenas Prácticas Aplicadas</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {parto.oxitocinaProfilactica && <span className={styles.badge}>Oxitocina Profiláctica</span>}
                    {parto.ligaduraTardiaCordon && <span className={styles.badge}>Ligadura Tardía Cordón</span>}
                    {parto.atencionPertinenciaCultural && <span className={styles.badge}>Atención Pertinencia Cultural</span>}
                    {parto.contactoPielPielMadre30min && <span className={styles.badge}>Contacto Piel-Piel Madre (30 min)</span>}
                    {parto.contactoPielPielAcomp30min && <span className={styles.badge}>Contacto Piel-Piel Acompañante (30 min)</span>}
                    {parto.lactancia60minAlMenosUnRn && <span className={styles.badge}>Lactancia 60 min</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-user-injured"></i>
              Información de la Madre
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>RUT</label>
                <span>{parto.madre.rut}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Nombres</label>
                <span>{parto.madre.nombres}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Apellidos</label>
                <span>{parto.madre.apellidos}</span>
              </div>
              {parto.madre.edad && (
                <div className={styles.infoItem}>
                  <label>Edad</label>
                  <span>{parto.madre.edad} años</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-user-md"></i>
              Personal Asistente
            </h2>
            <div className={styles.infoGrid}>
              {parto.matronas && parto.matronas.length > 0 && (
                <div className={styles.infoItem}>
                  <label>Matronas</label>
                  <div className={styles.personnelList}>
                    {parto.matronas.map((matrona) => (
                      <div key={matrona.user.id} className={styles.personnelItem}>
                        <span>{matrona.user.nombre}</span>
                        {matrona.user.email && (
                          <span className={styles.detail}>{matrona.user.email}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {parto.medicos && parto.medicos.length > 0 && (
                <div className={styles.infoItem}>
                  <label>Médicos</label>
                  <div className={styles.personnelList}>
                    {parto.medicos.map((medico) => (
                      <div key={medico.user.id} className={styles.personnelItem}>
                        <span>{medico.user.nombre}</span>
                        {medico.user.email && (
                          <span className={styles.detail}>{medico.user.email}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {parto.enfermeras && parto.enfermeras.length > 0 && (
                <div className={styles.infoItem}>
                  <label>Enfermeras</label>
                  <div className={styles.personnelList}>
                    {parto.enfermeras.map((enfermera) => (
                      <div key={enfermera.user.id} className={styles.personnelItem}>
                        <span>{enfermera.user.nombre}</span>
                        {enfermera.user.email && (
                          <span className={styles.detail}>{enfermera.user.email}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!parto.matronas || parto.matronas.length === 0) &&
                (!parto.medicos || parto.medicos.length === 0) &&
                (!parto.enfermeras || parto.enfermeras.length === 0) && (
                  <p className={styles.emptyText}>No se registró personal asistente.</p>
                )}
            </div>
          </div>

          {(parto.complicacionesTexto || parto.observaciones) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-notes-medical"></i>
                Observaciones Clínicas
              </h2>
              <div className={styles.infoGrid}>
                {parto.complicacionesTexto && (
                  <div className={styles.infoItem}>
                    <label>Complicaciones</label>
                    <span>{parto.complicacionesTexto}</span>
                  </div>
                )}
                {parto.observaciones && (
                  <div className={styles.infoItem}>
                    <label>Observaciones</label>
                    <span>{parto.observaciones}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-baby-carriage"></i>
              Recién Nacidos ({parto.recienNacidos.length})
            </h2>
            {parto.recienNacidos.length === 0 ? (
              <p className={styles.emptyText}>
                No hay recién nacidos registrados para este parto.
              </p>
            ) : (
              <div className={styles.rnList}>
                {parto.recienNacidos.map((rn) => (
                  <div key={rn.id} className={styles.rnItem}>
                    <div className={styles.rnHeader}>
                      <span className={styles.rnSexo}>{formatSexo(rn.sexo)}</span>
                    </div>
                    <div className={styles.rnDetails}>
                      {rn.pesoNacimientoGramos && (
                        <span>
                          <strong>Peso:</strong> {rn.pesoNacimientoGramos} g
                        </span>
                      )}
                      {rn.tallaCm && (
                        <span>
                          <strong>Talla:</strong> {rn.tallaCm} cm
                        </span>
                      )}
                      {rn.apgar1Min !== null && (
                        <span>
                          <strong>Apgar 1':</strong> {rn.apgar1Min}
                        </span>
                      )}
                      {rn.apgar5Min !== null && (
                        <span>
                          <strong>Apgar 5':</strong> {rn.apgar5Min}
                        </span>
                      )}
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
                  {new Date(parto.createdAt).toLocaleString('es-CL')}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Última Actualización</label>
                <span>
                  {new Date(parto.updatedAt).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}



