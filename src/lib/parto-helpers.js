import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-helpers'

// Constantes
export const TIPOS_PARTO = ['VAGINAL', 'INSTRUMENTAL', 'CESAREA_ELECTIVA', 'CESAREA_URGENCIA', 'PREHOSPITALARIO', 'FUERA_RED', 'DOMICILIO_PROFESIONAL', 'DOMICILIO_SIN_PROFESIONAL']
export const LUGARES_PARTO = ['SALA_PARTO', 'PABELLON', 'DOMICILIO', 'OTRO']
export const TIPOS_CURSO = ['EUTOCICO', 'DISTOCICO']
export const TIPOS_INICIO = ['ESPONTANEO', 'INDUCIDO_MECANICO', 'INDUCIDO_FARMACOLOGICO']
export const POSICIONES_EXPULSIVO = ['LITOTOMIA', 'OTRAS']

// Include común para partos
export const PARTO_INCLUDE = {
  madre: {
    select: { id: true, rut: true, nombres: true, apellidos: true },
  },
  matronas: {
    select: { user: { select: { id: true, nombre: true, email: true } } },
  },
  medicos: {
    select: { user: { select: { id: true, nombre: true, email: true } } },
  },
  enfermeras: {
    select: { user: { select: { id: true, nombre: true, email: true } } },
  },
}

export const PARTO_INCLUDE_FULL = {
  ...PARTO_INCLUDE,
  madre: {
    select: { id: true, rut: true, nombres: true, apellidos: true, edad: true },
  },
  recienNacidos: {
    select: {
      id: true, sexo: true, pesoNacimientoGramos: true, tallaCm: true,
      apgar1Min: true, apgar5Min: true,
    },
  },
}

/**
 * Construye where para búsqueda de partos
 */
export function construirWhereParto(search) {
  if (!search) return {}

  const searchUpper = search.toUpperCase()
  const orConditions = [
    { madre: { rut: { contains: search } } },
    { madre: { nombres: { contains: search } } },
    { madre: { apellidos: { contains: search } } },
    { lugarDetalle: { contains: search } },
  ]

  // Buscar en enums
  const tiposMatch = TIPOS_PARTO.filter(t => t.includes(searchUpper))
  if (tiposMatch.length === 1) {
    orConditions.push({ tipo: { equals: tiposMatch[0] } })
  } else if (tiposMatch.length > 1) {
    orConditions.push({ tipo: { in: tiposMatch } })
  }

  const lugaresMatch = LUGARES_PARTO.filter(l => l.includes(searchUpper))
  if (lugaresMatch.length === 1) {
    orConditions.push({ lugar: { equals: lugaresMatch[0] } })
  } else if (lugaresMatch.length > 1) {
    orConditions.push({ lugar: { in: lugaresMatch } })
  }

  return { OR: orConditions }
}

/**
 * Valida campos requeridos del parto
 */
export function validarCamposRequeridos(data) {
  if (!data.madreId || !data.fechaHora || !data.tipo || !data.lugar) {
    return { valid: false, error: 'Madre, fecha/hora, tipo de parto y lugar son requeridos' }
  }
  return { valid: true }
}

/**
 * Valida fecha de parto
 */
export function validarFechaParto(fechaHora) {
  const fecha = new Date(fechaHora)
  if (Number.isNaN(fecha.getTime())) {
    return { valid: false, error: 'Fecha y hora inválida' }
  }
  if (fecha > new Date()) {
    return { valid: false, error: 'La fecha y hora del parto no puede ser mayor que la fecha y hora actual' }
  }
  return { valid: true, fecha }
}

/**
 * Valida enums de parto
 */
export function validarEnumsParto(tipo, lugar) {
  if (!TIPOS_PARTO.includes(tipo)) {
    return { valid: false, error: 'Tipo de parto inválido' }
  }
  if (!LUGARES_PARTO.includes(lugar)) {
    return { valid: false, error: 'Lugar de parto inválido' }
  }
  return { valid: true }
}

/**
 * Extrae y normaliza IDs de profesionales
 */
export function extraerIdsProfesionales(data) {
  return {
    matronasIds: Array.isArray(data.matronasIds) ? data.matronasIds : (data.matronaId ? [data.matronaId] : []),
    medicosIds: Array.isArray(data.medicosIds) ? data.medicosIds : (data.medicoId ? [data.medicoId] : []),
    enfermerasIds: Array.isArray(data.enfermerasIds) ? data.enfermerasIds : [],
  }
}

/**
 * Valida profesionales por rol
 */
async function validarProfesionalesPorRol(ids, rol, nombrePlural) {
  if (ids.length === 0) return { valid: true }
  
  const usuarios = await prisma.user.findMany({
    where: {
      id: { in: ids },
      roles: { some: { role: { name: rol } } },
    },
  })
  
  if (usuarios.length !== ids.length) {
    return { valid: false, error: `Una o más ${nombrePlural} especificadas no existen o no tienen el rol correcto` }
  }
  return { valid: true }
}

/**
 * Valida todos los profesionales del parto
 */
export async function validarProfesionales(matronasIds, medicosIds, enfermerasIds, tipo) {
  // Validar matronas obligatorias
  if (matronasIds.length === 0) {
    return { valid: false, error: 'Debe seleccionar al menos una matrona' }
  }

  // Validar enfermeras obligatorias
  if (enfermerasIds.length === 0) {
    return { valid: false, error: 'Debe seleccionar al menos una enfermera' }
  }

  // Validar médico obligatorio si es cesárea
  const esCesarea = tipo === 'CESAREA_ELECTIVA' || tipo === 'CESAREA_URGENCIA'
  if (esCesarea && medicosIds.length === 0) {
    return { valid: false, error: 'Debe seleccionar al menos un médico cuando el tipo de parto es cesárea' }
  }

  // Validar existencia en BD
  const matronasResult = await validarProfesionalesPorRol(matronasIds, 'matrona', 'matronas')
  if (!matronasResult.valid) return matronasResult

  const medicosResult = await validarProfesionalesPorRol(medicosIds, 'medico', 'médicos')
  if (!medicosResult.valid) return medicosResult

  const enfermerasResult = await validarProfesionalesPorRol(enfermerasIds, 'enfermera', 'enfermeras')
  if (!enfermerasResult.valid) return enfermerasResult

  return { valid: true }
}

/**
 * Lista de campos booleanos del parto
 */
const CAMPOS_BOOLEANOS = [
  'conduccionOxitocica', 'libertadMovimiento', 'regimenHidricoAmplio',
  'manejoDolorNoFarmacologico', 'manejoDolorFarmacologico', 'episiotomia',
  'acompananteDuranteTrabajo', 'acompananteSoloExpulsivo', 'oxitocinaProfilactica',
  'ligaduraTardiaCordon', 'atencionPertinenciaCultural', 'contactoPielPielMadre30min',
  'contactoPielPielAcomp30min'
]

/**
 * Prepara datos base del parto
 */
export function prepararDatosBaseParto(data, userId, fechaHora, isCreate = true) {
  const partoData = {
    madreId: data.madreId,
    fechaHora,
    tipo: data.tipo,
    lugar: data.lugar,
  }

  if (isCreate) {
    partoData.createdById = userId
  } else {
    partoData.updatedById = userId
  }

  // Lugar detalle
  if (data.lugar === 'OTRO') {
    partoData.lugarDetalle = data.lugarDetalle ? data.lugarDetalle.trim() : null
  } else {
    partoData.lugarDetalle = null
  }

  return partoData
}

/**
 * Agrega campos opcionales al parto
 */
export function agregarCamposOpcionales(partoData, data, isUpdate = false) {
  // Fecha parto adicional
  if (data.fechaParto !== undefined || !isUpdate) {
    if (data.fechaParto) {
      const fecha = new Date(data.fechaParto)
      partoData.fechaParto = !Number.isNaN(fecha.getTime()) ? fecha : null
    } else if (isUpdate) {
      partoData.fechaParto = null
    }
  }

  // Establecimiento
  if (data.establecimientoId !== undefined || !isUpdate) {
    partoData.establecimientoId = data.establecimientoId ? data.establecimientoId.trim() : null
  }

  // Edad gestacional
  if (data.edadGestacionalSemanas !== undefined || !isUpdate) {
    const edad = Number.parseInt(data.edadGestacionalSemanas)
    partoData.edadGestacionalSemanas = (!Number.isNaN(edad) && edad >= 0) ? edad : null
  }

  // Enums opcionales
  if (data.tipoCursoParto !== undefined || !isUpdate) {
    partoData.tipoCursoParto = TIPOS_CURSO.includes(data.tipoCursoParto) ? data.tipoCursoParto : null
  }

  if (data.inicioTrabajoParto !== undefined || !isUpdate) {
    partoData.inicioTrabajoParto = TIPOS_INICIO.includes(data.inicioTrabajoParto) ? data.inicioTrabajoParto : null
  }

  if (data.posicionExpulsivo !== undefined || !isUpdate) {
    partoData.posicionExpulsivo = POSICIONES_EXPULSIVO.includes(data.posicionExpulsivo) ? data.posicionExpulsivo : null
  }

  // Campos booleanos
  for (const campo of CAMPOS_BOOLEANOS) {
    if (data[campo] !== undefined || !isUpdate) {
      partoData[campo] = data[campo] !== undefined && data[campo] !== null ? Boolean(data[campo]) : null
    }
  }

  // Textos
  if (data.complicaciones !== undefined || !isUpdate) {
    partoData.complicacionesTexto = data.complicaciones ? data.complicaciones.trim().substring(0, 500) : null
  }

  if (data.observaciones !== undefined || !isUpdate) {
    partoData.observaciones = data.observaciones ? data.observaciones.trim().substring(0, 500) : null
  }
}

/**
 * Agrega relaciones de profesionales para crear
 */
export function agregarRelacionesProfesionales(partoData, matronasIds, medicosIds, enfermerasIds) {
  if (matronasIds.length > 0) {
    partoData.matronas = { create: matronasIds.map(userId => ({ userId })) }
  }
  if (medicosIds.length > 0) {
    partoData.medicos = { create: medicosIds.map(userId => ({ userId })) }
  }
  if (enfermerasIds.length > 0) {
    partoData.enfermeras = { create: enfermerasIds.map(userId => ({ userId })) }
  }
}

/**
 * Maneja errores de Prisma específicos de partos
 */
export function manejarErrorParto(error) {
  console.error('Error en operación de parto:', error)

  if (error.code === 'P2002') {
    return errorResponse('Error al procesar el parto', 409)
  }

  if (error.code === 'P2003') {
    if (error.meta?.field_name?.includes('createdById')) {
      return errorResponse('Usuario no válido. Por favor, inicie sesión nuevamente.', 401)
    }
    return errorResponse('Referencia inválida en los datos proporcionados', 400)
  }

  return errorResponse('Error interno del servidor', 500)
}
