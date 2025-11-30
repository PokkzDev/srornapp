// Constantes de validación
export const SEXOS_VALIDOS = ['M', 'F', 'I']

// Include para consultas de recién nacidos
export const RN_INCLUDE = {
  parto: {
    include: {
      madre: {
        select: {
          id: true,
          rut: true,
          nombres: true,
          apellidos: true,
        },
      },
    },
  },
}

export const RN_INCLUDE_DETAIL = {
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
}

/**
 * Normaliza los nombres de campos antiguos a nuevos
 */
export function normalizarCamposRN(data) {
  return {
    pesoNacimientoGramos: data.pesoNacimientoGramos !== undefined ? data.pesoNacimientoGramos : data.pesoGr,
    apgar1Min: data.apgar1Min !== undefined ? data.apgar1Min : data.apgar1,
    apgar5Min: data.apgar5Min !== undefined ? data.apgar5Min : data.apgar5,
  }
}

/**
 * Valida un campo numérico y retorna error si es inválido
 */
function validarCampoNumerico(valor, nombreCampo, min = 0, max = null) {
  if (valor === undefined || valor === null || valor === '') {
    return null // Campo vacío, no hay error
  }
  const num = Number.parseInt(valor)
  if (Number.isNaN(num) || num < min) {
    return `${nombreCampo} debe ser un número válido`
  }
  if (max !== null && num > max) {
    return `${nombreCampo} debe estar entre ${min} y ${max}`
  }
  return null
}

/**
 * Valida los campos numéricos del recién nacido
 * Retorna un objeto con el primer error encontrado o null si todo es válido
 */
export function validarCamposNumericos(data) {
  const { pesoNacimientoGramos, apgar1Min, apgar5Min } = normalizarCamposRN(data)
  
  const errores = [
    validarCampoNumerico(pesoNacimientoGramos, 'El peso (gramos)'),
    validarCampoNumerico(data.tallaCm, 'La talla (centímetros)'),
    validarCampoNumerico(apgar1Min, "El Apgar 1'", 0, 10),
    validarCampoNumerico(apgar5Min, "El Apgar 5'", 0, 10),
  ]
  
  const primerError = errores.find(e => e !== null)
  return primerError ? { error: primerError } : null
}

/**
 * Procesa un campo numérico para guardado
 */
function procesarNumerico(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return null
  }
  const num = Number.parseInt(valor)
  return Number.isNaN(num) ? null : num
}

/**
 * Construye el objeto de datos para crear un recién nacido
 */
export function construirRNDataCreate(data, userId) {
  const { pesoNacimientoGramos, apgar1Min, apgar5Min } = normalizarCamposRN(data)
  
  const rnData = {
    partoId: data.partoId,
    sexo: data.sexo,
    createdById: userId,
    // Campos booleanos/enum con valores por defecto
    esNacidoVivo: data.esNacidoVivo !== undefined ? data.esNacidoVivo : true,
    categoriaPeso: data.categoriaPeso || null,
    // Anomalías
    anomaliaCongenita: data.anomaliaCongenita || null,
    anomaliaCongenitaDescripcion: data.anomaliaCongenita 
      ? (data.anomaliaCongenitaDescripcion?.trim().substring(0, 500) || null) 
      : null,
    // Reanimación
    reanimacionBasica: data.reanimacionBasica || null,
    reanimacionAvanzada: data.reanimacionAvanzada || null,
    ehiGradoII_III: data.ehiGradoII_III || null,
    // Profilaxis
    profilaxisOcularGonorrea: data.profilaxisOcularGonorrea || null,
    profilaxisHepatitisB: data.profilaxisHepatitisB || null,
    profilaxisCompletaHepatitisB: data.profilaxisCompletaHepatitisB || null,
    // Transmisión vertical
    hijoMadreHepatitisBPositiva: data.hijoMadreHepatitisBPositiva || null,
    // Lactancia
    lactancia60Min: data.lactancia60Min || null,
    alojamientoConjuntoInmediato: data.alojamientoConjuntoInmediato || null,
    contactoPielPielInmediato: data.contactoPielPielInmediato || null,
    // Condición étnica
    esPuebloOriginario: data.esPuebloOriginario || null,
    esMigrante: data.esMigrante || null,
  }

  // Campos numéricos
  const pesoVal = procesarNumerico(pesoNacimientoGramos)
  if (pesoVal !== null) rnData.pesoNacimientoGramos = pesoVal
  
  const tallaVal = procesarNumerico(data.tallaCm)
  if (tallaVal !== null) rnData.tallaCm = tallaVal
  
  const apgar1Val = procesarNumerico(apgar1Min)
  if (apgar1Val !== null) rnData.apgar1Min = apgar1Val
  
  const apgar5Val = procesarNumerico(apgar5Min)
  if (apgar5Val !== null) rnData.apgar5Min = apgar5Val

  if (data.observaciones) {
    rnData.observaciones = data.observaciones.trim().substring(0, 500)
  }

  return rnData
}

/**
 * Construye el objeto de datos para actualizar un recién nacido
 */
export function construirRNDataUpdate(data, userId, existente) {
  const { pesoNacimientoGramos, apgar1Min, apgar5Min } = normalizarCamposRN(data)
  
  // Función helper para valor con fallback
  const conFallback = (campo, fallback) => 
    data[campo] !== undefined ? (data[campo] || null) : fallback

  const rnData = {
    sexo: data.sexo,
    updatedById: userId,
    // Campos con fallback al valor existente
    esNacidoVivo: data.esNacidoVivo !== undefined 
      ? data.esNacidoVivo 
      : (existente.esNacidoVivo !== undefined ? existente.esNacidoVivo : true),
    categoriaPeso: conFallback('categoriaPeso', existente.categoriaPeso),
    // Anomalías
    anomaliaCongenita: conFallback('anomaliaCongenita', existente.anomaliaCongenita),
    anomaliaCongenitaDescripcion: data.anomaliaCongenita !== undefined
      ? (data.anomaliaCongenita ? (data.anomaliaCongenitaDescripcion?.trim().substring(0, 500) || null) : null)
      : existente.anomaliaCongenitaDescripcion,
    // Reanimación
    reanimacionBasica: conFallback('reanimacionBasica', existente.reanimacionBasica),
    reanimacionAvanzada: conFallback('reanimacionAvanzada', existente.reanimacionAvanzada),
    ehiGradoII_III: conFallback('ehiGradoII_III', existente.ehiGradoII_III),
    // Profilaxis
    profilaxisOcularGonorrea: conFallback('profilaxisOcularGonorrea', existente.profilaxisOcularGonorrea),
    profilaxisHepatitisB: conFallback('profilaxisHepatitisB', existente.profilaxisHepatitisB),
    profilaxisCompletaHepatitisB: conFallback('profilaxisCompletaHepatitisB', existente.profilaxisCompletaHepatitisB),
    // Transmisión vertical
    hijoMadreHepatitisBPositiva: conFallback('hijoMadreHepatitisBPositiva', existente.hijoMadreHepatitisBPositiva),
    // Lactancia
    lactancia60Min: conFallback('lactancia60Min', existente.lactancia60Min),
    alojamientoConjuntoInmediato: conFallback('alojamientoConjuntoInmediato', existente.alojamientoConjuntoInmediato),
    contactoPielPielInmediato: conFallback('contactoPielPielInmediato', existente.contactoPielPielInmediato),
    // Condición étnica
    esPuebloOriginario: conFallback('esPuebloOriginario', existente.esPuebloOriginario),
    esMigrante: conFallback('esMigrante', existente.esMigrante),
  }

  // Campos numéricos con lógica de null explícito
  if (pesoNacimientoGramos !== undefined && pesoNacimientoGramos !== null && pesoNacimientoGramos !== '') {
    rnData.pesoNacimientoGramos = Number.parseInt(pesoNacimientoGramos)
  } else if (data.pesoNacimientoGramos === null || data.pesoGr === null) {
    rnData.pesoNacimientoGramos = null
  }

  if (data.tallaCm !== undefined && data.tallaCm !== null && data.tallaCm !== '') {
    rnData.tallaCm = Number.parseInt(data.tallaCm)
  } else if (data.tallaCm === null) {
    rnData.tallaCm = null
  }

  if (apgar1Min !== undefined && apgar1Min !== null && apgar1Min !== '') {
    rnData.apgar1Min = Number.parseInt(apgar1Min)
  } else if (data.apgar1Min === null || data.apgar1 === null) {
    rnData.apgar1Min = null
  }

  if (apgar5Min !== undefined && apgar5Min !== null && apgar5Min !== '') {
    rnData.apgar5Min = Number.parseInt(apgar5Min)
  } else if (data.apgar5Min === null || data.apgar5 === null) {
    rnData.apgar5Min = null
  }

  if (data.observaciones !== undefined) {
    rnData.observaciones = data.observaciones ? data.observaciones.trim().substring(0, 500) : null
  }

  return rnData
}

/**
 * Construye las condiciones de búsqueda para recién nacidos
 */
export function construirWhereBusqueda(search) {
  if (!search) return {}
  
  const searchConditions = [
    { parto: { madre: { rut: { contains: search } } } },
    { parto: { madre: { nombres: { contains: search } } } },
    { parto: { madre: { apellidos: { contains: search } } } },
    { observaciones: { contains: search } },
  ]
  
  // Solo buscar por sexo si coincide exactamente con un valor del enum
  if (SEXOS_VALIDOS.includes(search.toUpperCase())) {
    searchConditions.push({ sexo: search.toUpperCase() })
  }
  
  return { OR: searchConditions }
}
