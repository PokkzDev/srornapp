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
  calcularTasa,
  calcularTendenciaComparativa,
  calcularEdadGestacionalRangos,
} from '@/lib/indicadores-helpers'

export async function GET(request) {
  try {
    const auth = await verificarAuth(request, 'indicadores:consult', 'Indicadores')
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const agrupacion = searchParams.get('agrupacion') || 'mes'
    const incluirComparativo = searchParams.get('comparativo') === 'true'

    const fechaFilter = construirFiltroFecha(fechaInicio, fechaFin)
    
    // Calcular período anterior para comparativas
    let fechaFilterAnterior = null
    if (incluirComparativo && fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      const duracion = fin - inicio
      const inicioAnterior = new Date(inicio.getTime() - duracion - 86400000)
      const finAnterior = new Date(inicio.getTime() - 86400000)
      fechaFilterAnterior = { gte: inicioAnterior, lte: finAnterior }
    }

    // ============================================
    // INDICADORES DE PARTOS (Expandido)
    // ============================================
    const partosWhere = fechaFilter ? { fechaHora: fechaFilter } : {}
    const partosWhereAnterior = fechaFilterAnterior ? { fechaHora: fechaFilterAnterior } : null
    
    const [
      totalPartos, partosPorTipo, partosPorLugar, partos,
      partosPorCurso, partosPorInicio, partosPorPosicion, totalPartosAnterior
    ] = await Promise.all([
      prisma.parto.count({ where: partosWhere }),
      prisma.parto.groupBy({ by: ['tipo'], where: partosWhere, _count: true }),
      prisma.parto.groupBy({ by: ['lugar'], where: partosWhere, _count: true }),
      prisma.parto.findMany({ 
        where: partosWhere, 
        select: { 
          fechaHora: true, tipo: true, lugar: true, tipoCursoParto: true,
          inicioTrabajoParto: true, posicionExpulsivo: true, edadGestacionalSemanas: true,
          oxitocinaProfilactica: true, ligaduraTardiaCordon: true, atencionPertinenciaCultural: true,
          contactoPielPielMadre30min: true, contactoPielPielAcomp30min: true, lactancia60minAlMenosUnRn: true,
          acompananteDuranteTrabajo: true, acompananteSoloExpulsivo: true, planDeParto: true,
          episiotomia: true, embarazoNoControlado: true, libertadMovimiento: true,
          manejoDolorNoFarmacologico: true, manejoDolorFarmacologico: true,
          anestesiaNeuroaxial: true, anestesiaGeneral: true, anestesiaLocal: true,
          oxidoNitroso: true, analgesiaEndovenosa: true, medidasNoFarmacologicasAnestesia: true,
          conduccionOxitocica: true,
        }, 
        orderBy: { fechaHora: 'asc' } 
      }),
      prisma.parto.groupBy({ by: ['tipoCursoParto'], where: partosWhere, _count: true }),
      prisma.parto.groupBy({ by: ['inicioTrabajoParto'], where: partosWhere, _count: true }),
      prisma.parto.groupBy({ by: ['posicionExpulsivo'], where: partosWhere, _count: true }),
      partosWhereAnterior ? prisma.parto.count({ where: partosWhereAnterior }) : Promise.resolve(null),
    ])

    const partosEvolucion = procesarEvolucionSimple(partos, 'fechaHora', agrupacion)
    
    // Calcular tasas de cesáreas
    const cesareasTotal = partos.filter(p => p.tipo === 'CESAREA_ELECTIVA' || p.tipo === 'CESAREA_URGENCIA').length
    const cesareasUrgencia = partos.filter(p => p.tipo === 'CESAREA_URGENCIA').length
    const instrumentales = partos.filter(p => p.tipo === 'INSTRUMENTAL').length
    
    // Métricas de edad gestacional
    const partosConEdadGest = partos.filter(p => p.edadGestacionalSemanas)
    const edadGestacionalRangos = calcularEdadGestacionalRangos(partosConEdadGest)

    // ============================================
    // MÉTRICAS DE BUENAS PRÁCTICAS
    // ============================================
    const buenasPracticas = {
      oxitocinaProfilactica: calcularTasa(partos, 'oxitocinaProfilactica'),
      ligaduraTardiaCordon: calcularTasa(partos, 'ligaduraTardiaCordon'),
      atencionPertinenciaCultural: calcularTasa(partos, 'atencionPertinenciaCultural'),
      contactoPielPielMadre30min: calcularTasa(partos, 'contactoPielPielMadre30min'),
      contactoPielPielAcomp30min: calcularTasa(partos, 'contactoPielPielAcomp30min'),
      lactancia60minAlMenosUnRn: calcularTasa(partos, 'lactancia60minAlMenosUnRn'),
      acompananteDuranteTrabajo: calcularTasa(partos, 'acompananteDuranteTrabajo'),
      acompananteSoloExpulsivo: calcularTasa(partos, 'acompananteSoloExpulsivo'),
      planDeParto: calcularTasa(partos, 'planDeParto'),
      episiotomia: calcularTasa(partos, 'episiotomia'),
      embarazoNoControlado: calcularTasa(partos, 'embarazoNoControlado'),
      libertadMovimiento: calcularTasa(partos, 'libertadMovimiento'),
    }

    // ============================================
    // MÉTRICAS DE ANESTESIA Y MANEJO DEL DOLOR
    // ============================================
    const anestesia = {
      manejoDolorNoFarmacologico: calcularTasa(partos, 'manejoDolorNoFarmacologico'),
      manejoDolorFarmacologico: calcularTasa(partos, 'manejoDolorFarmacologico'),
      anestesiaNeuroaxial: calcularTasa(partos, 'anestesiaNeuroaxial'),
      anestesiaGeneral: calcularTasa(partos, 'anestesiaGeneral'),
      anestesiaLocal: calcularTasa(partos, 'anestesiaLocal'),
      oxidoNitroso: calcularTasa(partos, 'oxidoNitroso'),
      analgesiaEndovenosa: calcularTasa(partos, 'analgesiaEndovenosa'),
      medidasNoFarmacologicasAnestesia: calcularTasa(partos, 'medidasNoFarmacologicasAnestesia'),
      conduccionOxitocica: calcularTasa(partos, 'conduccionOxitocica'),
    }

    // ============================================
    // INDICADORES DE RECIÉN NACIDOS (Expandido)
    // ============================================
    const rnWhere = fechaFilter ? { parto: { fechaHora: fechaFilter } } : {}

    const [totalRN, rnPorSexo, recienNacidos] = await Promise.all([
      prisma.recienNacido.count({ where: rnWhere }),
      prisma.recienNacido.groupBy({ by: ['sexo'], where: rnWhere, _count: true }),
      prisma.recienNacido.findMany({
        where: rnWhere,
        select: { 
          pesoNacimientoGramos: true, tallaCm: true, apgar1Min: true, apgar5Min: true, sexo: true,
          esNacidoVivo: true, anomaliaCongenita: true, reanimacionBasica: true,
          reanimacionAvanzada: true, ehiGradoII_III: true, profilaxisHepatitisB: true,
          profilaxisOcularGonorrea: true, profilaxisCompletaHepatitisB: true, lactancia60Min: true,
          alojamientoConjuntoInmediato: true, contactoPielPielInmediato: true,
          esPuebloOriginario: true, esMigrante: true, categoriaPeso: true,
        },
      }),
    ])

    const rnConPeso = recienNacidos.filter(rn => rn.pesoNacimientoGramos)
    const pesoPromedio = rnConPeso.length > 0
      ? Math.round(rnConPeso.reduce((sum, rn) => sum + (rn.pesoNacimientoGramos || 0), 0) / rnConPeso.length)
      : 0

    const rnConTalla = recienNacidos.filter(rn => rn.tallaCm)
    const tallaPromedio = rnConTalla.length > 0
      ? Math.round(rnConTalla.reduce((sum, rn) => sum + (rn.tallaCm || 0), 0) / rnConTalla.length)
      : 0

    const apgar1Dist = calcularDistribucionApgar(recienNacidos, 'apgar1Min')
    const apgar5Dist = calcularDistribucionApgar(recienNacidos, 'apgar5Min')
    const pesoRangos = calcularRangosPeso(recienNacidos)

    // Métricas clínicas de RN
    const rnClinicos = {
      esNacidoVivo: calcularTasa(recienNacidos, 'esNacidoVivo'),
      anomaliaCongenita: calcularTasa(recienNacidos, 'anomaliaCongenita'),
      reanimacionBasica: calcularTasa(recienNacidos, 'reanimacionBasica'),
      reanimacionAvanzada: calcularTasa(recienNacidos, 'reanimacionAvanzada'),
      ehiGradoII_III: calcularTasa(recienNacidos, 'ehiGradoII_III'),
      bajoPeso: recienNacidos.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos < 2500).length,
      muyBajoPeso: recienNacidos.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos < 1500).length,
      macrosomia: recienNacidos.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos >= 4000).length,
      apgarBajo1: recienNacidos.filter(rn => rn.apgar1Min !== null && rn.apgar1Min < 7).length,
      apgarBajo5: recienNacidos.filter(rn => rn.apgar5Min !== null && rn.apgar5Min < 7).length,
    }

    // Profilaxis y cuidados inmediatos RN
    const cuidadosRN = {
      profilaxisHepatitisB: calcularTasa(recienNacidos, 'profilaxisHepatitisB'),
      profilaxisOcularGonorrea: calcularTasa(recienNacidos, 'profilaxisOcularGonorrea'),
      profilaxisCompletaHepatitisB: calcularTasa(recienNacidos, 'profilaxisCompletaHepatitisB'),
      lactancia60Min: calcularTasa(recienNacidos, 'lactancia60Min'),
      alojamientoConjuntoInmediato: calcularTasa(recienNacidos, 'alojamientoConjuntoInmediato'),
      contactoPielPielInmediato: calcularTasa(recienNacidos, 'contactoPielPielInmediato'),
    }

    // ============================================
    // MÉTRICAS REM (Demográficas)
    // ============================================
    const madresWhere = fechaFilter ? { createdAt: fechaFilter } : {}
    const [madresData, totalMadresREM] = await Promise.all([
      prisma.madre.findMany({
        where: madresWhere,
        select: {
          pertenenciaPuebloOriginario: true, condicionMigrante: true, condicionDiscapacidad: true,
          identidadTrans: true, condicionPrivadaLibertad: true, hepatitisBPositiva: true,
          controlPrenatal: true, edad: true, fechaNacimiento: true,
        }
      }),
      prisma.madre.count({ where: madresWhere }),
    ])

    const metricasREM = {
      puebloOriginario: calcularTasa(madresData, 'pertenenciaPuebloOriginario'),
      migrantes: calcularTasa(madresData, 'condicionMigrante'),
      discapacidad: calcularTasa(madresData, 'condicionDiscapacidad'),
      identidadTrans: calcularTasa(madresData, 'identidadTrans'),
      privadaLibertad: calcularTasa(madresData, 'condicionPrivadaLibertad'),
      hepatitisBPositiva: calcularTasa(madresData, 'hepatitisBPositiva'),
      controlPrenatal: calcularTasa(madresData, 'controlPrenatal'),
      totalMadres: totalMadresREM,
      gruposEtarios: calcularGruposEtarios(madresData),
      rnPuebloOriginario: calcularTasa(recienNacidos, 'esPuebloOriginario'),
      rnMigrante: calcularTasa(recienNacidos, 'esMigrante'),
    }

    // ============================================
    // COMPLICACIONES OBSTÉTRICAS
    // ============================================
    const complicacionesWhere = fechaFilter ? { fechaComplicacion: fechaFilter } : {}
    
    const [complicaciones, complicacionesPorTipo, complicacionesPorContexto] = await Promise.all([
      prisma.complicacionObstetrica.findMany({
        where: complicacionesWhere,
        select: { tipo: true, contexto: true, requiereTransfusion: true, fechaComplicacion: true }
      }),
      prisma.complicacionObstetrica.groupBy({ by: ['tipo'], where: complicacionesWhere, _count: true }),
      prisma.complicacionObstetrica.groupBy({ by: ['contexto'], where: complicacionesWhere, _count: true }),
    ])

    const totalComplicaciones = complicaciones.length
    const metricasComplicaciones = {
      total: totalComplicaciones,
      tasaComplicaciones: totalPartos > 0 ? ((totalComplicaciones / totalPartos) * 100).toFixed(2) : 0,
      porTipo: complicacionesPorTipo.map(c => ({
        tipo: c.tipo,
        cantidad: c._count,
        porcentaje: totalComplicaciones > 0 ? ((c._count / totalComplicaciones) * 100).toFixed(1) : 0,
      })),
      porContexto: complicacionesPorContexto.map(c => ({
        contexto: c.contexto,
        cantidad: c._count,
        porcentaje: totalComplicaciones > 0 ? ((c._count / totalComplicaciones) * 100).toFixed(1) : 0,
      })),
      transfusiones: complicaciones.filter(c => c.requiereTransfusion).length,
      tasaTransfusion: totalPartos > 0 
        ? ((complicaciones.filter(c => c.requiereTransfusion).length / totalPartos) * 100).toFixed(2) : 0,
      hpp: complicaciones.filter(c => c.tipo?.startsWith('HPP')).length,
      preeclampsia: complicaciones.filter(c => c.tipo === 'PREECLAMPSIA_SEVERA').length,
      eclampsia: complicaciones.filter(c => c.tipo === 'ECLAMPSIA').length,
      desgarrosIIIIV: complicaciones.filter(c => c.tipo === 'DESGARROS_III_IV').length,
      histerectomia: complicaciones.filter(c => c.tipo === 'HISTERCTOMIA_OBSTETRICA').length,
    }

    // ============================================
    // ESTERILIZACIONES QUIRÚRGICAS
    // ============================================
    const esterilizacionesWhere = fechaFilter ? { fecha: fechaFilter } : {}
    const [esterilizaciones, esterilizacionesPorTipo, esterilizacionesPorSexo] = await Promise.all([
      prisma.esterilizacionQuirurgica.count({ where: esterilizacionesWhere }),
      prisma.esterilizacionQuirurgica.groupBy({ by: ['tipo'], where: esterilizacionesWhere, _count: true }),
      prisma.esterilizacionQuirurgica.groupBy({ by: ['sexo'], where: esterilizacionesWhere, _count: true }),
    ])

    const metricasEsterilizacion = {
      total: esterilizaciones,
      porTipo: esterilizacionesPorTipo.map(e => ({ tipo: e.tipo, cantidad: e._count })),
      porSexo: esterilizacionesPorSexo.map(e => ({ sexo: e.sexo, cantidad: e._count })),
    }

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
        select: { fechaHoraIngreso: true, fechaHoraAlta: true, servicioUnidad: true },
      }),
      prisma.episodioURNI.groupBy({ by: ['servicioUnidad'], where: episodiosUrniWhere, _count: true }),
      prisma.episodioURNI.findMany({ where: episodiosUrniWhere, select: { fechaHoraIngreso: true, fechaHoraAlta: true, servicioUnidad: true } }),
    ])

    const diasEstadiaPromedio = calcularDiasEstadiaPromedio(episodiosConAltaUrni, 'fechaHoraIngreso', 'fechaHoraAlta')
    const episodiosUrniEvolucion = procesarEvolucionEpisodios(episodiosUrni, 'fechaHoraIngreso', 'fechaHoraAlta', agrupacion)

    // Estadía promedio por servicio
    const estadiaPorServicio = {}
    const servicios = ['URNI', 'UCIN', 'NEONATOLOGIA']
    servicios.forEach(servicio => {
      const episodiosServicio = episodiosConAltaUrni.filter(e => e.servicioUnidad === servicio)
      estadiaPorServicio[servicio] = calcularDiasEstadiaPromedio(episodiosServicio, 'fechaHoraIngreso', 'fechaHoraAlta')
    })

    const tasaIngresoURNI = totalRN > 0 ? ((totalEpisodiosUrni / totalRN) * 100).toFixed(2) : 0

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
      prisma.episodioMadre.findMany({ where: episodiosMadreWhere, select: { fechaIngreso: true, fechaAlta: true, hospitalAnterior: true } }),
    ])

    const diasEstadiaMadrePromedio = calcularDiasEstadiaPromedio(episodiosMadreConAlta, 'fechaIngreso', 'fechaAlta')
    const episodiosMadreEvolucion = procesarEvolucionEpisodios(episodiosMadre, 'fechaIngreso', 'fechaAlta', agrupacion)
    const trasladosExternos = episodiosMadre.filter(e => e.hospitalAnterior).length

    // ============================================
    // INDICADORES DE CONTROLES NEONATALES
    // ============================================
    const controlesWhere = fechaFilter ? { fechaHora: fechaFilter } : {}

    const [totalControles, controlesPorTipo, controlesPorEpisodio, controles] = await Promise.all([
      prisma.controlNeonatal.count({ where: controlesWhere }),
      prisma.controlNeonatal.groupBy({ by: ['tipo'], where: controlesWhere, _count: true }),
      prisma.controlNeonatal.groupBy({ by: ['episodioUrniId'], where: controlesWhere, _count: true }),
      prisma.controlNeonatal.findMany({ where: controlesWhere, select: { fechaHora: true, enfermeraId: true } }),
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
    // CARGA LABORAL POR PROFESIONAL
    // ============================================
    const [partoMatronas, partoMedicos, partoEnfermeras] = await Promise.all([
      prisma.partoMatrona.groupBy({ by: ['userId'], where: fechaFilter ? { parto: { fechaHora: fechaFilter } } : {}, _count: true }),
      prisma.partoMedico.groupBy({ by: ['userId'], where: fechaFilter ? { parto: { fechaHora: fechaFilter } } : {}, _count: true }),
      prisma.partoEnfermera.groupBy({ by: ['userId'], where: fechaFilter ? { parto: { fechaHora: fechaFilter } } : {}, _count: true }),
    ])

    const allProfIds = [
      ...partoMatronas.map(p => p.userId),
      ...partoMedicos.map(p => p.userId),
      ...partoEnfermeras.map(p => p.userId),
      ...controles.map(c => c.enfermeraId).filter(Boolean),
    ]

    const profesionales = await prisma.user.findMany({
      where: { id: { in: [...new Set(allProfIds)] } },
      select: { id: true, nombre: true },
    })

    // Helper function to calculate workload stats
    const calcularEstadisticasCarga = (datos, profesionales) => {
      if (!datos || datos.length === 0) {
        return {
          total: 0,
          profesionalesUnicos: 0,
          promedioPorProfesional: 0,
          maximo: 0,
          topProfesionales: []
        }
      }
      
      const total = datos.reduce((sum, d) => sum + d._count, 0)
      const profesionalesUnicos = datos.length
      const promedioPorProfesional = profesionalesUnicos > 0 ? Math.round(total / profesionalesUnicos) : 0
      const maximo = Math.max(...datos.map(d => d._count))
      const topProfesionales = datos
        .map(d => ({
          id: d.userId,
          nombre: profesionales.find(p => p.id === d.userId)?.nombre || 'Desconocido',
          cantidad: d._count
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
      
      return { total, profesionalesUnicos, promedioPorProfesional, maximo, topProfesionales }
    }

    // Calculate stats for controles by enfermera
    const controlesPorEnfermera = {}
    controles.forEach(c => {
      if (c.enfermeraId) {
        controlesPorEnfermera[c.enfermeraId] = (controlesPorEnfermera[c.enfermeraId] || 0) + 1
      }
    })
    const controlesEnfermeraArray = Object.entries(controlesPorEnfermera).map(([userId, count]) => ({
      userId,
      _count: count
    }))

    const cargaLaboral = {
      partosPorMatrona: calcularEstadisticasCarga(partoMatronas, profesionales),
      partosPorMedico: calcularEstadisticasCarga(partoMedicos, profesionales),
      atencionesEnfermera: calcularEstadisticasCarga(controlesEnfermeraArray, profesionales),
      atencionesMedico: {
        total: totalAtenciones,
        profesionalesUnicos: atencionesPorMedico.length,
        promedioPorProfesional: atencionesPorMedico.length > 0 ? Math.round(totalAtenciones / atencionesPorMedico.length) : 0,
        maximo: atencionesPorMedico.length > 0 ? Math.max(...atencionesPorMedico.map(a => a._count)) : 0,
        topProfesionales: atencionesPorMedicoConNombre.map(a => ({
          id: a.medicoId,
          nombre: a.medicoNombre,
          cantidad: a.cantidad
        }))
      },
      // Keep original format for backwards compatibility
      matronas: partoMatronas.map(p => ({
        id: p.userId,
        nombre: profesionales.find(pr => pr.id === p.userId)?.nombre || 'Desconocido',
        partos: p._count,
      })).sort((a, b) => b.partos - a.partos),
      medicos: partoMedicos.map(p => ({
        id: p.userId,
        nombre: profesionales.find(pr => pr.id === p.userId)?.nombre || 'Desconocido',
        partos: p._count,
      })).sort((a, b) => b.partos - a.partos),
      enfermeras: partoEnfermeras.map(p => ({
        id: p.userId,
        nombre: profesionales.find(pr => pr.id === p.userId)?.nombre || 'Desconocido',
        partos: p._count,
      })).sort((a, b) => b.partos - a.partos),
      medicosAtenciones: atencionesPorMedicoConNombre.sort((a, b) => b.cantidad - a.cantidad),
    }

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

    // ============================================
    // RETORNAR TODOS LOS INDICADORES
    // ============================================
    return Response.json({
      data: {
        partos: {
          total: totalPartos,
          totalAnterior: totalPartosAnterior,
          tendencia: calcularTendenciaComparativa(totalPartos, totalPartosAnterior),
          porTipo: partosPorTipo.map(p => ({
            tipo: p.tipo, cantidad: p._count,
            porcentaje: totalPartos > 0 ? ((p._count / totalPartos) * 100).toFixed(1) : 0,
          })),
          porLugar: partosPorLugar.map(p => ({
            lugar: p.lugar, cantidad: p._count,
            porcentaje: totalPartos > 0 ? ((p._count / totalPartos) * 100).toFixed(1) : 0,
          })),
          porCurso: partosPorCurso.map(p => ({
            curso: p.tipoCursoParto, cantidad: p._count,
            porcentaje: totalPartos > 0 ? ((p._count / totalPartos) * 100).toFixed(1) : 0,
          })),
          porInicio: partosPorInicio.map(p => ({
            inicio: p.inicioTrabajoParto, cantidad: p._count,
            porcentaje: totalPartos > 0 ? ((p._count / totalPartos) * 100).toFixed(1) : 0,
          })),
          porPosicion: partosPorPosicion.filter(p => p.posicionExpulsivo).map(p => ({
            posicion: p.posicionExpulsivo, cantidad: p._count,
            porcentaje: totalPartos > 0 ? ((p._count / totalPartos) * 100).toFixed(1) : 0,
          })),
          cesareas: {
            total: cesareasTotal,
            tasa: totalPartos > 0 ? ((cesareasTotal / totalPartos) * 100).toFixed(1) : 0,
            urgencia: cesareasUrgencia,
            tasaUrgencia: totalPartos > 0 ? ((cesareasUrgencia / totalPartos) * 100).toFixed(1) : 0,
          },
          instrumentales: {
            total: instrumentales,
            tasa: totalPartos > 0 ? ((instrumentales / totalPartos) * 100).toFixed(1) : 0,
          },
          edadGestacional: edadGestacionalRangos,
          evolucion: formatearEvolucionSimple(partosEvolucion),
        },
        buenasPracticas,
        anestesia,
        recienNacidos: {
          total: totalRN,
          porSexo: rnPorSexo.map(r => ({
            sexo: r.sexo, cantidad: r._count,
            porcentaje: totalRN > 0 ? ((r._count / totalRN) * 100).toFixed(1) : 0,
          })),
          pesoPromedio, tallaPromedio, apgar1: apgar1Dist, apgar5: apgar5Dist, pesoRangos,
          clinicos: rnClinicos, cuidados: cuidadosRN,
        },
        rem: metricasREM,
        complicaciones: metricasComplicaciones,
        esterilizaciones: metricasEsterilizacion,
        episodiosUrni: {
          total: totalEpisodiosUrni, activos: episodiosUrniActivos, altas: episodiosUrniAlta,
          diasEstadiaPromedio, estadiaPorServicio, tasaIngresoURNI,
          porServicio: episodiosPorServicio.map(e => ({
            servicio: e.servicioUnidad || 'Sin servicio', cantidad: e._count,
            porcentaje: totalEpisodiosUrni > 0 ? ((e._count / totalEpisodiosUrni) * 100).toFixed(1) : 0,
          })),
          evolucion: formatearEvolucionEpisodios(episodiosUrniEvolucion),
        },
        episodiosMadre: {
          total: totalEpisodiosMadre, activos: episodiosMadreActivos, altas: episodiosMadreAlta,
          diasEstadiaPromedio: diasEstadiaMadrePromedio, trasladosExternos,
          evolucion: formatearEvolucionEpisodios(episodiosMadreEvolucion),
        },
        controlesNeonatales: {
          total: totalControles,
          porTipo: controlesPorTipo.map(c => ({
            tipo: c.tipo, cantidad: c._count,
            porcentaje: totalControles > 0 ? ((c._count / totalControles) * 100).toFixed(1) : 0,
          })),
          promedioPorEpisodio: controlesPorEpisodioPromedio,
          evolucion: formatearEvolucionSimple(controlesEvolucion),
        },
        atencionesUrni: {
          total: totalAtenciones, porMedico: atencionesPorMedicoConNombre,
          promedioPorEpisodio: atencionesPorEpisodioPromedio,
        },
        cargaLaboral,
        informesAlta: { total: totalInformes, evolucion: formatearEvolucionSimple(informesEvolucion) },
        operacionales: {
          totales: {
            madres: totalMadres, partos: totalPartosGlobal, recienNacidos: totalRNGlobal,
            episodiosUrni: totalEpisodiosUrniGlobal, episodiosMadre: totalEpisodiosMadreGlobal,
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

// Función auxiliar para calcular grupos etarios
function calcularGruposEtarios(madres) {
  const grupos = {
    'Menor de 15': 0, '15-19': 0, '20-24': 0, '25-29': 0,
    '30-34': 0, '35-39': 0, '40-44': 0, '45 o más': 0,
  }

  madres.forEach(madre => {
    let edad = madre.edad
    if (!edad && madre.fechaNacimiento) {
      const hoy = new Date()
      const nacimiento = new Date(madre.fechaNacimiento)
      edad = hoy.getFullYear() - nacimiento.getFullYear()
    }
    if (!edad) return

    if (edad < 15) grupos['Menor de 15']++
    else if (edad < 20) grupos['15-19']++
    else if (edad < 25) grupos['20-24']++
    else if (edad < 30) grupos['25-29']++
    else if (edad < 35) grupos['30-34']++
    else if (edad < 40) grupos['35-39']++
    else if (edad < 45) grupos['40-44']++
    else grupos['45 o más']++
  })

  return Object.entries(grupos).map(([grupo, cantidad]) => ({
    grupo, cantidad,
    porcentaje: madres.length > 0 ? ((cantidad / madres.length) * 100).toFixed(1) : 0,
  }))
}
