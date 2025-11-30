import { prisma } from '@/lib/prisma'
import { verificarAuth, errorResponse } from '@/lib/api-helpers'
import {
  construirFiltroFecha,
  calcularDistribucionApgar,
  calcularRangosPeso,
  calcularDiasEstadiaPromedio,
  procesarEvolucionEpisodios,
  procesarEvolucionSimple,
  formatearEvolucionSimple,
  formatearEvolucionEpisodios,
} from '@/lib/indicadores-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'indicadores:consult', 'Indicadores')
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const agrupacion = searchParams.get('agrupacion') || 'mes'

    const fechaFilter = construirFiltroFecha(fechaInicio, fechaFin)

    // ============================================
    // INDICADORES DE PARTOS
    // ============================================
    const partosWhere = fechaFilter ? { fechaHora: fechaFilter } : {}
    
    const [totalPartos, partosPorTipo, partosPorLugar, partos] = await Promise.all([
      prisma.parto.count({ where: partosWhere }),
      prisma.parto.groupBy({ by: ['tipo'], where: partosWhere, _count: true }),
      prisma.parto.groupBy({ by: ['lugar'], where: partosWhere, _count: true }),
      prisma.parto.findMany({ where: partosWhere, select: { fechaHora: true }, orderBy: { fechaHora: 'asc' } }),
    ])

    const partosEvolucion = procesarEvolucionSimple(partos, 'fechaHora', agrupacion)

    // ============================================
    // INDICADORES DE RECIÉN NACIDOS
    // ============================================
    const rnWhere = fechaFilter ? { parto: { fechaHora: fechaFilter } } : {}

    const [totalRN, rnPorSexo, rnConPeso] = await Promise.all([
      prisma.recienNacido.count({ where: rnWhere }),
      prisma.recienNacido.groupBy({ by: ['sexo'], where: rnWhere, _count: true }),
      prisma.recienNacido.findMany({
        where: { ...rnWhere, pesoNacimientoGramos: { not: null } },
        select: { pesoNacimientoGramos: true, tallaCm: true, apgar1Min: true, apgar5Min: true },
      }),
    ])

    const pesoPromedio = rnConPeso.length > 0
      ? Math.round(rnConPeso.reduce((sum, rn) => sum + (rn.pesoNacimientoGramos || 0), 0) / rnConPeso.length)
      : 0

    const rnConTalla = rnConPeso.filter(rn => rn.tallaCm)
    const tallaPromedio = rnConTalla.length > 0
      ? Math.round(rnConTalla.reduce((sum, rn) => sum + (rn.tallaCm || 0), 0) / rnConTalla.length)
      : 0

    const apgar1Dist = calcularDistribucionApgar(rnConPeso, 'apgar1Min')
    const apgar5Dist = calcularDistribucionApgar(rnConPeso, 'apgar5Min')
    const pesoRangos = calcularRangosPeso(rnConPeso)

    // ============================================
    // INDICADORES DE EPISODIOS URNI
    // ============================================
    const episodiosUrniWhere = fechaFilter
      ? { OR: [{ fechaHoraIngreso: fechaFilter }, { fechaHoraAlta: fechaFilter }] }
      : {}

    const [totalEpisodiosUrni, episodiosUrniActivos, episodiosUrniAlta, episodiosConAltaUrni, episodiosPorServicio, episodiosUrni] = await Promise.all([
      prisma.episodioURNI.count({ where: episodiosUrniWhere }),
      prisma.episodioURNI.count({ where: { ...episodiosUrniWhere, estado: 'INGRESADO' } }),
      prisma.episodioURNI.count({ where: { ...episodiosUrniWhere, estado: 'ALTA' } }),
      prisma.episodioURNI.findMany({
        where: { ...episodiosUrniWhere, estado: 'ALTA', fechaHoraAlta: { not: null } },
        select: { fechaHoraIngreso: true, fechaHoraAlta: true },
      }),
      prisma.episodioURNI.groupBy({ by: ['servicioUnidad'], where: episodiosUrniWhere, _count: true }),
      prisma.episodioURNI.findMany({ where: episodiosUrniWhere, select: { fechaHoraIngreso: true, fechaHoraAlta: true } }),
    ])

    const diasEstadiaPromedio = calcularDiasEstadiaPromedio(episodiosConAltaUrni, 'fechaHoraIngreso', 'fechaHoraAlta')
    const episodiosUrniEvolucion = procesarEvolucionEpisodios(episodiosUrni, 'fechaHoraIngreso', 'fechaHoraAlta', agrupacion)

    // ============================================
    // INDICADORES DE EPISODIOS MADRE
    // ============================================
    const episodiosMadreWhere = fechaFilter
      ? { OR: [{ fechaIngreso: fechaFilter }, { fechaAlta: fechaFilter }] }
      : {}

    const [totalEpisodiosMadre, episodiosMadreActivos, episodiosMadreAlta, episodiosMadreConAlta, episodiosMadre] = await Promise.all([
      prisma.episodioMadre.count({ where: episodiosMadreWhere }),
      prisma.episodioMadre.count({ where: { ...episodiosMadreWhere, estado: 'INGRESADO' } }),
      prisma.episodioMadre.count({ where: { ...episodiosMadreWhere, estado: 'ALTA' } }),
      prisma.episodioMadre.findMany({
        where: { ...episodiosMadreWhere, estado: 'ALTA', fechaAlta: { not: null } },
        select: { fechaIngreso: true, fechaAlta: true },
      }),
      prisma.episodioMadre.findMany({ where: episodiosMadreWhere, select: { fechaIngreso: true, fechaAlta: true } }),
    ])

    const diasEstadiaMadrePromedio = calcularDiasEstadiaPromedio(episodiosMadreConAlta, 'fechaIngreso', 'fechaAlta')
    const episodiosMadreEvolucion = procesarEvolucionEpisodios(episodiosMadre, 'fechaIngreso', 'fechaAlta', agrupacion)

    // ============================================
    // INDICADORES DE CONTROLES NEONATALES
    // ============================================
    const controlesWhere = fechaFilter ? { fechaHora: fechaFilter } : {}

    const [totalControles, controlesPorTipo, controlesPorEpisodio, controles] = await Promise.all([
      prisma.controlNeonatal.count({ where: controlesWhere }),
      prisma.controlNeonatal.groupBy({ by: ['tipo'], where: controlesWhere, _count: true }),
      prisma.controlNeonatal.groupBy({ by: ['episodioUrniId'], where: controlesWhere, _count: true }),
      prisma.controlNeonatal.findMany({ where: controlesWhere, select: { fechaHora: true } }),
    ])

    const controlesPorEpisodioPromedio = controlesPorEpisodio.length > 0
      ? Math.round(controlesPorEpisodio.reduce((sum, c) => sum + c._count, 0) / controlesPorEpisodio.length)
      : 0

    const controlesEvolucion = procesarEvolucionSimple(controles, 'fechaHora', agrupacion)

    // ============================================
    // INDICADORES DE ATENCIONES URNI
    // ============================================
    const atencionesWhere = fechaFilter ? { fechaHora: fechaFilter } : {}

    const [totalAtenciones, atencionesPorMedico, atencionesPorEpisodio] = await Promise.all([
      prisma.atencionURNI.count({ where: atencionesWhere }),
      prisma.atencionURNI.groupBy({ by: ['medicoId'], where: atencionesWhere, _count: true }),
      prisma.atencionURNI.groupBy({ by: ['episodioId'], where: atencionesWhere, _count: true }),
    ])

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

    const atencionesPorEpisodioPromedio = atencionesPorEpisodio.length > 0
      ? Math.round(atencionesPorEpisodio.reduce((sum, a) => sum + a._count, 0) / atencionesPorEpisodio.length)
      : 0

    // ============================================
    // INDICADORES DE INFORMES DE ALTA
    // ============================================
    const informesWhere = fechaFilter ? { fechaGeneracion: fechaFilter } : {}

    const [totalInformes, informes] = await Promise.all([
      prisma.informeAlta.count({ where: informesWhere }),
      prisma.informeAlta.findMany({ where: informesWhere, select: { fechaGeneracion: true } }),
    ])

    const informesEvolucion = procesarEvolucionSimple(informes, 'fechaGeneracion', agrupacion)

    // ============================================
    // MÉTRICAS OPERACIONALES
    // ============================================
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const [totalMadres, totalPartosGlobal, totalRNGlobal, totalEpisodiosUrniGlobal, totalEpisodiosMadreGlobal, actividadReciente] = await Promise.all([
      prisma.madre.count(),
      prisma.parto.count(),
      prisma.recienNacido.count(),
      prisma.episodioURNI.count(),
      prisma.episodioMadre.count(),
      Promise.all([
        prisma.madre.count({ where: { createdAt: { gte: hace30Dias } } }),
        prisma.parto.count({ where: { createdAt: { gte: hace30Dias } } }),
        prisma.recienNacido.count({ where: { createdAt: { gte: hace30Dias } } }),
        prisma.episodioURNI.count({ where: { createdAt: { gte: hace30Dias } } }),
        prisma.controlNeonatal.count({ where: { createdAt: { gte: hace30Dias } } }),
        prisma.atencionURNI.count({ where: { createdAt: { gte: hace30Dias } } }),
      ]).then(([madres, partos, recienNacidos, episodiosUrni, controles, atenciones]) => ({
        madres, partos, recienNacidos, episodiosUrni, controles, atenciones,
      })),
    ])

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
          evolucion: formatearEvolucionSimple(partosEvolucion),
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
          evolucion: formatearEvolucionEpisodios(episodiosUrniEvolucion),
        },
        episodiosMadre: {
          total: totalEpisodiosMadre,
          activos: episodiosMadreActivos,
          altas: episodiosMadreAlta,
          diasEstadiaPromedio: diasEstadiaMadrePromedio,
          evolucion: formatearEvolucionEpisodios(episodiosMadreEvolucion),
        },
        controlesNeonatales: {
          total: totalControles,
          porTipo: controlesPorTipo.map(c => ({
            tipo: c.tipo,
            cantidad: c._count,
            porcentaje: totalControles > 0 ? Math.round((c._count / totalControles) * 100) : 0,
          })),
          promedioPorEpisodio: controlesPorEpisodioPromedio,
          evolucion: formatearEvolucionSimple(controlesEvolucion),
        },
        atencionesUrni: {
          total: totalAtenciones,
          porMedico: atencionesPorMedicoConNombre,
          promedioPorEpisodio: atencionesPorEpisodioPromedio,
        },
        informesAlta: {
          total: totalInformes,
          evolucion: formatearEvolucionSimple(informesEvolucion),
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
    return errorResponse('Error al obtener indicadores', 500)
  }
}
