/**
 * Utilidades para manejo de fechas en zona horaria de Chile
 * Resuelve el problema de que datetime-local usa hora local pero
 * toISOString() convierte a UTC, causando diferencias de 3-4 horas
 */

/**
 * Obtiene la fecha/hora actual en formato compatible con input datetime-local
 * Usa la hora local del navegador (que debería estar en Chile)
 * @returns {string} Fecha en formato YYYY-MM-DDTHH:mm
 */
export function getLocalDateTimeString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convierte una fecha ISO (del servidor) a formato datetime-local
 * Esto muestra la fecha en hora local del navegador
 * @param {string} isoString - Fecha en formato ISO
 * @returns {string} Fecha en formato YYYY-MM-DDTHH:mm
 */
export function isoToLocalDateTimeString(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return getLocalDateTimeString(date)
}

/**
 * Convierte una fecha de input datetime-local a ISO para enviar al servidor
 * El input datetime-local devuelve fecha sin zona horaria (ej: "2025-11-30T06:25")
 * Esta función crea un Date interpretándolo como hora local y lo convierte a ISO
 * @param {string} localDateTimeString - Fecha del input datetime-local
 * @returns {string} Fecha en formato ISO (UTC)
 */
export function localDateTimeToISO(localDateTimeString) {
  if (!localDateTimeString) return null
  // new Date() interpreta strings sin zona horaria como hora local
  const date = new Date(localDateTimeString)
  return date.toISOString()
}

/**
 * Formatea una fecha para mostrar al usuario en formato chileno
 * @param {string|Date} fecha - Fecha a formatear
 * @param {object} options - Opciones de formateo
 * @returns {string} Fecha formateada
 */
export function formatearFechaChile(fecha, options = {}) {
  if (!fecha) return ''
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
    ...options,
  }
  
  return date.toLocaleString('es-CL', defaultOptions)
}

/**
 * Formatea solo la fecha (sin hora) en formato chileno
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada DD/MM/YYYY
 */
export function formatearSoloFechaChile(fecha) {
  return formatearFechaChile(fecha, {
    hour: undefined,
    minute: undefined,
  })
}

/**
 * Obtiene la fecha/hora actual en formato datetime-local CON segundos
 * Útil para registros que requieren precisión de segundos (ej: partos)
 * @param {Date} date - Fecha a formatear (default: ahora)
 * @returns {string} Fecha en formato YYYY-MM-DDTHH:mm:ss
 */
export function getLocalDateTimeStringWithSeconds(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Convierte una fecha ISO a formato datetime-local con segundos
 * @param {string} isoString - Fecha en formato ISO
 * @returns {string} Fecha en formato YYYY-MM-DDTHH:mm:ss
 */
export function isoToLocalDateTimeStringWithSeconds(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return getLocalDateTimeStringWithSeconds(date)
}

/**
 * Obtiene solo la fecha en formato YYYY-MM-DD para input date
 * @param {Date} date - Fecha a formatear (default: ahora)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte una fecha ISO a formato date-only (YYYY-MM-DD)
 * Útil para campos de fecha de nacimiento, etc.
 * @param {string} isoString - Fecha en formato ISO
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function isoToLocalDateString(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return getLocalDateString(date)
}
