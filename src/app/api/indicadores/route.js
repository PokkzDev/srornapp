import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('indicadores:consult')) {
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'Indicadores',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para consultar indicadores' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const agrupacion = searchParams.get('agrupacion') || 'mes' // dia, semana, mes

    // Construir filtro de fecha
    const fechaFilter = {}
    if (fechaInicio) {
      fechaFilter.gte = new Date(fechaInicio)
    }
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin)
      fechaFinDate.setHours(23, 59, 59, 999) // Incluir todo el día
      fechaFilter.lte = fechaFinDate
    }

    // Función auxiliar para agrupar fechas
    const groupByDate = (date, agrupacion) => {
      const d = new Date(date)
      if (agrupacion === 'dia') {
        return d.toISOString().split('T')[0] // YYYY-MM-DD
      } else if (agrupacion === 'semana') {
        const year = d.getFullYear()
        const start = new Date(year, 0, 1)
        const days = Math.floor((d - start) / (24 * 60 * 60 * 1000))
        const week = Math.ceil((days + start.getDay() + 1) / 7)
        return `${year}-W${week.toString().padStart(2, '0')}`
      } else {
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}` // YYYY-MM
      }
    }

    // ============================================
    // INDICADORES DE PARTOS
    // ============================================
    const partosWhere = fechaInicio || fechaFin ? { fechaHora: fechaFilter } : {}
    
    const totalPartos = await prisma.parto.count({ where: partosWhere })
    
    const partosPorTipo = await prisma.parto.groupBy({
      by: ['tipo'],
      where: partosWhere,
      _count: true,
    })

    const partosPorLugar = await prisma.parto.groupBy({
      by: ['lugar'],
      where: partosWhere,
      _count: true,
    })

    // Evolución temporal de partos
    const partos = await prisma.parto.findMany({
      where: partosWhere,
      select: { fechaHora: true },
      orderBy: { fechaHora: 'asc' },
    })

    const partosEvolucion = {}
    partos.forEach(parto => {
      const key = groupByDate(parto.fechaHora, agrupacion)
      partosEvolucion[key] = (partosEvolucion[key] || 0) + 1
    })

    // ============================================
    // INDICADORES DE RECIÉN NACIDOS
    // ============================================
    const rnWhere = fechaInicio || fechaFin 
      ? { 
          parto: {
            fechaHora: fechaFilter
          }
        }
      : {}

    const totalRN = await prisma.recienNacido.count({ where: rnWhere })

    const rnPorSexo = await prisma.recienNacido.groupBy({
      by: ['sexo'],
      where: rnWhere,
      _count: true,
    })

    // Promedios de peso y talla
    const rnConPeso = await prisma.recienNacido.findMany({
      where: { ...rnWhere, pesoNacimientoGramos: { not: null } },
      select: { pesoNacimientoGramos: true, tallaCm: true, apgar1Min: true, apgar5Min: true },
    })

    const pesoPromedio = rnConPeso.length > 0
      ? Math.round(rnConPeso.reduce((sum, rn) => sum + (rn.pesoNacimientoGramos || 0), 0) / rnConPeso.length)
      : 0

    const tallaPromedio = rnConPeso.length > 0
      ? Math.round(rnConPeso.filter(rn => rn.tallaCm).reduce((sum, rn) => sum + (rn.tallaCm || 0), 0) / rnConPeso.filter(rn => rn.tallaCm).length)
      : 0

    // Distribución de Apgar
    const apgar1Dist = {
      bajo: rnConPeso.filter(rn => rn.apgar1Min !== null && rn.apgar1Min < 7).length,
      normal: rnConPeso.filter(rn => rn.apgar1Min !== null && rn.apgar1Min >= 7 && rn.apgar1Min <= 9).length,
      excelente: rnConPeso.filter(rn => rn.apgar1Min !== null && rn.apgar1Min === 10).length,
    }

    const apgar5Dist = {
      bajo: rnConPeso.filter(rn => rn.apgar5Min !== null && rn.apgar5Min < 7).length,
      normal: rnConPeso.filter(rn => rn.apgar5Min !== null && rn.apgar5Min >= 7 && rn.apgar5Min <= 9).length,
      excelente: rnConPeso.filter(rn => rn.apgar5Min !== null && rn.apgar5Min === 10).length,
    }

    // Distribución por rangos de peso
    const pesoRangos = {
      bajoPeso: rnConPeso.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos < 2500).length,
      normal: rnConPeso.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos >= 2500 && rn.pesoNacimientoGramos <= 4000).length,
      macrosomia: rnConPeso.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos > 4000).length,
    }

    // ============================================
    // INDICADORES DE EPISODIOS URNI
    // ============================================
    const episodiosUrniWhere = fechaInicio || fechaFin
      ? {
          OR: [
            { fechaHoraIngreso: fechaFilter },
            { fechaHoraAlta: fechaFilter },
          ]
        }
      : {}

    const totalEpisodiosUrni = await prisma.episodioURNI.count({ where: episodiosUrniWhere })

    const episodiosUrniActivos = await prisma.episodioURNI.count({
      where: { ...episodiosUrniWhere, estado: 'INGRESADO' },
    })

    const episodiosUrniAlta = await prisma.episodioURNI.count({
      where: { ...episodiosUrniWhere, estado: 'ALTA' },
    })

    // Promedio de días de estadía
    const episodiosConAlta = await prisma.episodioURNI.findMany({
      where: {
        ...episodiosUrniWhere,
        estado: 'ALTA',
        fechaHoraAlta: { not: null },
      },
      select: {
        fechaHoraIngreso: true,
        fechaHoraAlta: true,
      },
    })

    const diasEstadiaPromedio = episodiosConAlta.length > 0
      ? Math.round(
          episodiosConAlta.reduce((sum, ep) => {
            const dias = Math.ceil(
              (new Date(ep.fechaHoraAlta) - new Date(ep.fechaHoraIngreso)) / (1000 * 60 * 60 * 24)
            )
            return sum + dias
          }, 0) / episodiosConAlta.length
        )
      : 0

    // Distribución por servicio
    const episodiosPorServicio = await prisma.episodioURNI.groupBy({
      by: ['servicioUnidad'],
      where: episodiosUrniWhere,
      _count: true,
    })

    // Evolución temporal
    const episodiosUrni = await prisma.episodioURNI.findMany({
      where: episodiosUrniWhere,
      select: { fechaHoraIngreso: true, fechaHoraAlta: true },
    })

    const episodiosUrniEvolucion = {}
    episodiosUrni.forEach(ep => {
      const keyIngreso = groupByDate(ep.fechaHoraIngreso, agrupacion)
      if (!episodiosUrniEvolucion[keyIngreso]) {
        episodiosUrniEvolucion[keyIngreso] = { ingresos: 0, altas: 0 }
      }
      episodiosUrniEvolucion[keyIngreso].ingresos += 1
      
      if (ep.fechaHoraAlta) {
        const keyAlta = groupByDate(ep.fechaHoraAlta, agrupacion)
        if (!episodiosUrniEvolucion[keyAlta]) {
          episodiosUrniEvolucion[keyAlta] = { ingresos: 0, altas: 0 }
        }
        episodiosUrniEvolucion[keyAlta].altas += 1
      }
    })

    // ============================================
    // INDICADORES DE EPISODIOS MADRE
    // ============================================
    const episodiosMadreWhere = fechaInicio || fechaFin
      ? {
          OR: [
            { fechaIngreso: fechaFilter },
            { fechaAlta: fechaFilter },
          ]
        }
      : {}

    const totalEpisodiosMadre = await prisma.episodioMadre.count({ where: episodiosMadreWhere })

    const episodiosMadreActivos = await prisma.episodioMadre.count({
      where: { ...episodiosMadreWhere, estado: 'INGRESADO' },
    })

    const episodiosMadreAlta = await prisma.episodioMadre.count({
      where: { ...episodiosMadreWhere, estado: 'ALTA' },
    })

    // Promedio de días de estadía
    const episodiosMadreConAlta = await prisma.episodioMadre.findMany({
      where: {
        ...episodiosMadreWhere,
        estado: 'ALTA',
        fechaAlta: { not: null },
      },
      select: {
        fechaIngreso: true,
        fechaAlta: true,
      },
    })

    const diasEstadiaMadrePromedio = episodiosMadreConAlta.length > 0
      ? Math.round(
          episodiosMadreConAlta.reduce((sum, ep) => {
            const dias = Math.ceil(
              (new Date(ep.fechaAlta) - new Date(ep.fechaIngreso)) / (1000 * 60 * 60 * 24)
            )
            return sum + dias
          }, 0) / episodiosMadreConAlta.length
        )
      : 0

    // Evolución temporal
    const episodiosMadre = await prisma.episodioMadre.findMany({
      where: episodiosMadreWhere,
      select: { fechaIngreso: true, fechaAlta: true },
    })

    const episodiosMadreEvolucion = {}
    episodiosMadre.forEach(ep => {
      const keyIngreso = groupByDate(ep.fechaIngreso, agrupacion)
      if (!episodiosMadreEvolucion[keyIngreso]) {
        episodiosMadreEvolucion[keyIngreso] = { ingresos: 0, altas: 0 }
      }
      episodiosMadreEvolucion[keyIngreso].ingresos += 1
      
      if (ep.fechaAlta) {
        const keyAlta = groupByDate(ep.fechaAlta, agrupacion)
        if (!episodiosMadreEvolucion[keyAlta]) {
          episodiosMadreEvolucion[keyAlta] = { ingresos: 0, altas: 0 }
        }
        episodiosMadreEvolucion[keyAlta].altas += 1
      }
    })

    // ============================================
    // INDICADORES DE CONTROLES NEONATALES
    // ============================================
    const controlesWhere = fechaInicio || fechaFin
      ? { fechaHora: fechaFilter }
      : {}

    const totalControles = await prisma.controlNeonatal.count({ where: controlesWhere })

    const controlesPorTipo = await prisma.controlNeonatal.groupBy({
      by: ['tipo'],
      where: controlesWhere,
      _count: true,
    })

    // Promedio de controles por episodio
    const controlesPorEpisodio = await prisma.controlNeonatal.groupBy({
      by: ['episodioUrniId'],
      where: controlesWhere,
      _count: true,
    })

    const controlesPorEpisodioPromedio = controlesPorEpisodio.length > 0
      ? Math.round(
          controlesPorEpisodio.reduce((sum, c) => sum + c._count, 0) / controlesPorEpisodio.length
        )
      : 0

    // Evolución temporal
    const controles = await prisma.controlNeonatal.findMany({
      where: controlesWhere,
      select: { fechaHora: true },
    })

    const controlesEvolucion = {}
    controles.forEach(control => {
      const key = groupByDate(control.fechaHora, agrupacion)
      controlesEvolucion[key] = (controlesEvolucion[key] || 0) + 1
    })

    // ============================================
    // INDICADORES DE ATENCIONES URNI
    // ============================================
    const atencionesWhere = fechaInicio || fechaFin
      ? { fechaHora: fechaFilter }
      : {}

    const totalAtenciones = await prisma.atencionURNI.count({ where: atencionesWhere })

    // Distribución por médico
    const atencionesPorMedico = await prisma.atencionURNI.groupBy({
      by: ['medicoId'],
      where: atencionesWhere,
      _count: true,
    })

    // Obtener nombres de médicos
    const medicoIds = atencionesPorMedico.map(a => a.medicoId).filter(Boolean)
    const medicos = await prisma.user.findMany({
      where: { id: { in: medicoIds } },
      select: { id: true, nombre: true },
    })

    const atencionesPorMedicoConNombre = atencionesPorMedico.map(a => ({
      medicoId: a.medicoId,
      medicoNombre: medicos.find(m => m.id === a.medicoId)?.nombre || 'Sin asignar',
      cantidad: a._count,
    }))

    // Promedio de atenciones por episodio
    const atencionesPorEpisodio = await prisma.atencionURNI.groupBy({
      by: ['episodioId'],
      where: atencionesWhere,
      _count: true,
    })

    const atencionesPorEpisodioPromedio = atencionesPorEpisodio.length > 0
      ? Math.round(
          atencionesPorEpisodio.reduce((sum, a) => sum + a._count, 0) / atencionesPorEpisodio.length
        )
      : 0

    // ============================================
    // INDICADORES DE INFORMES DE ALTA
    // ============================================
    const informesWhere = fechaInicio || fechaFin
      ? { fechaGeneracion: fechaFilter }
      : {}

    const totalInformes = await prisma.informeAlta.count({ where: informesWhere })

    // Evolución temporal
    const informes = await prisma.informeAlta.findMany({
      where: informesWhere,
      select: { fechaGeneracion: true },
    })

    const informesEvolucion = {}
    informes.forEach(informe => {
      const key = groupByDate(informe.fechaGeneracion, agrupacion)
      informesEvolucion[key] = (informesEvolucion[key] || 0) + 1
    })

    // ============================================
    // MÉTRICAS OPERACIONALES
    // ============================================
    const totalMadres = await prisma.madre.count()
    const totalPartosGlobal = await prisma.parto.count()
    const totalRNGlobal = await prisma.recienNacido.count()
    const totalEpisodiosUrniGlobal = await prisma.episodioURNI.count()
    const totalEpisodiosMadreGlobal = await prisma.episodioMadre.count()

    // Actividad reciente (últimos 30 días)
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)
    
    const actividadReciente = {
      madres: await prisma.madre.count({
        where: { createdAt: { gte: hace30Dias } },
      }),
      partos: await prisma.parto.count({
        where: { createdAt: { gte: hace30Dias } },
      }),
      recienNacidos: await prisma.recienNacido.count({
        where: { createdAt: { gte: hace30Dias } },
      }),
      episodiosUrni: await prisma.episodioURNI.count({
        where: { createdAt: { gte: hace30Dias } },
      }),
      controles: await prisma.controlNeonatal.count({
        where: { createdAt: { gte: hace30Dias } },
      }),
      atenciones: await prisma.atencionURNI.count({
        where: { createdAt: { gte: hace30Dias } },
      }),
    }

    // Retornar todos los indicadores
    return Response.json({
      data: {
        partos: {
          total: totalPartos,
          porTipo: partosPorTipo.map(p => ({
            tipo: p.tipo,
            cantidad: p._count,
            porcentaje: totalPartos > 0 ? Math.round((p._count / totalPartos) * 100) : 0,
          })),
          porLugar: partosPorLugar.map(p => ({
            lugar: p.lugar,
            cantidad: p._count,
            porcentaje: totalPartos > 0 ? Math.round((p._count / totalPartos) * 100) : 0,
          })),
          evolucion: Object.entries(partosEvolucion).map(([fecha, cantidad]) => ({
            fecha,
            cantidad,
          })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        },
        recienNacidos: {
          total: totalRN,
          porSexo: rnPorSexo.map(r => ({
            sexo: r.sexo,
            cantidad: r._count,
            porcentaje: totalRN > 0 ? Math.round((r._count / totalRN) * 100) : 0,
          })),
          pesoPromedio,
          tallaPromedio,
          apgar1: apgar1Dist,
          apgar5: apgar5Dist,
          pesoRangos,
        },
        episodiosUrni: {
          total: totalEpisodiosUrni,
          activos: episodiosUrniActivos,
          altas: episodiosUrniAlta,
          diasEstadiaPromedio,
          porServicio: episodiosPorServicio.map(e => ({
            servicio: e.servicioUnidad || 'Sin servicio',
            cantidad: e._count,
            porcentaje: totalEpisodiosUrni > 0 ? Math.round((e._count / totalEpisodiosUrni) * 100) : 0,
          })),
          evolucion: Object.entries(episodiosUrniEvolucion).map(([fecha, datos]) => ({
            fecha,
            ingresos: datos.ingresos || 0,
            altas: datos.altas || 0,
          })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        },
        episodiosMadre: {
          total: totalEpisodiosMadre,
          activos: episodiosMadreActivos,
          altas: episodiosMadreAlta,
          diasEstadiaPromedio: diasEstadiaMadrePromedio,
          evolucion: Object.entries(episodiosMadreEvolucion).map(([fecha, datos]) => ({
            fecha,
            ingresos: datos.ingresos || 0,
            altas: datos.altas || 0,
          })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        },
        controlesNeonatales: {
          total: totalControles,
          porTipo: controlesPorTipo.map(c => ({
            tipo: c.tipo,
            cantidad: c._count,
            porcentaje: totalControles > 0 ? Math.round((c._count / totalControles) * 100) : 0,
          })),
          promedioPorEpisodio: controlesPorEpisodioPromedio,
          evolucion: Object.entries(controlesEvolucion).map(([fecha, cantidad]) => ({
            fecha,
            cantidad,
          })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        },
        atencionesUrni: {
          total: totalAtenciones,
          porMedico: atencionesPorMedicoConNombre,
          promedioPorEpisodio: atencionesPorEpisodioPromedio,
        },
        informesAlta: {
          total: totalInformes,
          evolucion: Object.entries(informesEvolucion).map(([fecha, cantidad]) => ({
            fecha,
            cantidad,
          })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        },
        operacionales: {
          totales: {
            madres: totalMadres,
            partos: totalPartosGlobal,
            recienNacidos: totalRNGlobal,
            episodiosUrni: totalEpisodiosUrniGlobal,
            episodiosMadre: totalEpisodiosMadreGlobal,
          },
          actividadReciente,
        },
      },
    })
  } catch (error) {
    console.error('Error al obtener indicadores:', error)
    return Response.json(
      { error: 'Error al obtener indicadores', details: error.message },
      { status: 500 }
    )
  }
}

