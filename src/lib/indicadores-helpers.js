// Funciones auxiliares para indicadores

/**
 * Agrupa fechas según la agrupación especificada
 */
export function agruparPorFecha(date, agrupacion) {
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

/**
 * Construye el filtro de fecha para queries
 */
export function construirFiltroFecha(fechaInicio, fechaFin) {
  const fechaFilter = {}
  if (fechaInicio) {
    fechaFilter.gte = new Date(fechaInicio)
  }
  if (fechaFin) {
    const fechaFinDate = new Date(fechaFin)
    fechaFinDate.setHours(23, 59, 59, 999)
    fechaFilter.lte = fechaFinDate
  }
  return Object.keys(fechaFilter).length > 0 ? fechaFilter : null
}

/**
 * Calcula estadísticas de Apgar
 */
export function calcularDistribucionApgar(rnConPeso, campo) {
  return {
    bajo: rnConPeso.filter(rn => rn[campo] !== null && rn[campo] < 7).length,
    normal: rnConPeso.filter(rn => rn[campo] !== null && rn[campo] >= 7 && rn[campo] <= 9).length,
    excelente: rnConPeso.filter(rn => rn[campo] !== null && rn[campo] === 10).length,
  }
}

/**
 * Calcula distribución por rangos de peso
 */
export function calcularRangosPeso(rnConPeso) {
  return {
    bajoPeso: rnConPeso.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos < 2500).length,
    normal: rnConPeso.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos >= 2500 && rn.pesoNacimientoGramos <= 4000).length,
    macrosomia: rnConPeso.filter(rn => rn.pesoNacimientoGramos && rn.pesoNacimientoGramos > 4000).length,
  }
}

/**
 * Calcula promedio de días de estadía
 */
export function calcularDiasEstadiaPromedio(episodiosConAlta, campoIngreso, campoAlta) {
  if (episodiosConAlta.length === 0) return 0
  
  const totalDias = episodiosConAlta.reduce((sum, ep) => {
    const dias = Math.ceil(
      (new Date(ep[campoAlta]) - new Date(ep[campoIngreso])) / (1000 * 60 * 60 * 24)
    )
    return sum + dias
  }, 0)
  
  return Math.round(totalDias / episodiosConAlta.length)
}

/**
 * Procesa evolución temporal de episodios (ingresos y altas)
 */
export function procesarEvolucionEpisodios(episodios, campoIngreso, campoAlta, agrupacion) {
  const evolucion = {}
  
  episodios.forEach(ep => {
    const keyIngreso = agruparPorFecha(ep[campoIngreso], agrupacion)
    if (!evolucion[keyIngreso]) {
      evolucion[keyIngreso] = { ingresos: 0, altas: 0 }
    }
    evolucion[keyIngreso].ingresos += 1
    
    if (ep[campoAlta]) {
      const keyAlta = agruparPorFecha(ep[campoAlta], agrupacion)
      if (!evolucion[keyAlta]) {
        evolucion[keyAlta] = { ingresos: 0, altas: 0 }
      }
      evolucion[keyAlta].altas += 1
    }
  })
  
  return evolucion
}

/**
 * Procesa evolución temporal simple (conteo por fecha)
 */
export function procesarEvolucionSimple(items, campoFecha, agrupacion) {
  const evolucion = {}
  
  items.forEach(item => {
    const key = agruparPorFecha(item[campoFecha], agrupacion)
    evolucion[key] = (evolucion[key] || 0) + 1
  })
  
  return evolucion
}

/**
 * Formatea evolución para respuesta
 */
export function formatearEvolucionSimple(evolucion) {
  return Object.entries(evolucion)
    .map(([fecha, cantidad]) => ({ fecha, cantidad }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/**
 * Formatea evolución con ingresos/altas para respuesta
 */
export function formatearEvolucionEpisodios(evolucion) {
  return Object.entries(evolucion)
    .map(([fecha, datos]) => ({
      fecha,
      ingresos: datos.ingresos || 0,
      altas: datos.altas || 0,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/**
 * Formatea distribución con porcentajes
 */
export function formatearDistribucionConPorcentaje(items, total, campoNombre, campoCantidad = '_count') {
  return items.map(item => ({
    [campoNombre === 'tipo' ? 'tipo' : campoNombre === 'lugar' ? 'lugar' : campoNombre === 'sexo' ? 'sexo' : campoNombre === 'servicio' ? 'servicio' : campoNombre]: item[campoNombre] || (campoNombre === 'servicio' ? 'Sin servicio' : null),
    cantidad: typeof campoCantidad === 'string' ? item[campoCantidad] : item._count,
    porcentaje: total > 0 ? Math.round((item._count / total) * 100) : 0,
  }))
}
