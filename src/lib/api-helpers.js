import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Verifica autenticación y permisos del usuario
 * @param {Request} request - Request object
 * @param {string|string[]} permiso - Permiso(s) requerido(s) (ej: 'control_neonatal:view' o ['perm1', 'perm2'])
 * @param {string} entidad - Nombre de la entidad para auditoría
 * @param {object} opciones - Opciones adicionales
 * @param {boolean} opciones.requireAll - Si true, requiere todos los permisos; si false, cualquiera (default: true para array, ignorado para string)
 * @param {boolean} opciones.skipPermissionCheck - Si true, solo verifica autenticación
 * @returns {Promise<{success: boolean, user?: object, dbUser?: object, error?: Response, errorStatus?: number}>}
 */
export async function verificarAuth(request, permiso, entidad, opciones = {}) {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      success: false,
      error: Response.json({ error: 'No autenticado' }, { status: 401 }),
      errorStatus: 401
    }
  }

  // Obtener usuario de la base de datos si es necesario
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  // Si se solicita saltar verificación de permisos, retornar éxito
  if (opciones.skipPermissionCheck) {
    return { success: true, user, dbUser, permissions: [] }
  }

  const permissions = await getUserPermissions()
  
  // Verificar permisos
  const permisos = Array.isArray(permiso) ? permiso : [permiso]
  const requireAll = opciones.requireAll !== false && !Array.isArray(permiso) // default true para string, configurable para array
  
  let tienePermiso
  if (requireAll || permisos.length === 1) {
    tienePermiso = permisos.every(p => permissions.includes(p))
  } else {
    tienePermiso = permisos.some(p => permissions.includes(p))
  }
  
  if (!tienePermiso) {
    await registrarAuditoriaPermisoDenegado(request, user, entidad)
    
    const accion = permisos[0].split(':')[1]
    const mensajeAccion = {
      view: 'visualizar',
      create: 'crear',
      update: 'editar',
      delete: 'eliminar',
      alta: 'procesar alta de',
      manage: 'gestionar'
    }[accion] || accion

    return {
      success: false,
      error: Response.json(
        { error: `No tiene permisos para ${mensajeAccion} ${entidad.toLowerCase()}` },
        { status: 403 }
      ),
      errorStatus: 403
    }
  }

  return { success: true, user, dbUser, permissions }
}

/**
 * Registra intento de acceso sin permisos en auditoría
 */
async function registrarAuditoriaPermisoDenegado(request, user, entidad) {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
        entidad,
        accion: 'PERMISSION_DENIED',
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || null,
      },
    })
  } catch (auditError) {
    console.error('Error al registrar auditoría:', auditError)
  }
}

/**
 * Obtiene la IP del cliente desde los headers
 */
export function getClientIp(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         null
}

/**
 * Obtiene datos de auditoría del request
 */
export function getAuditData(request) {
  return {
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || null
  }
}

/**
 * Crea registro de auditoría
 * @param {object} tx - Transacción de Prisma o cliente prisma
 * @param {object} params - Parámetros de auditoría
 */
export async function crearAuditoria(tx, { usuarioId, rol, entidad, entidadId, accion, detalleBefore, detalleAfter, ip, userAgent }) {
  // Convertir rol a string si es un array
  const rolString = Array.isArray(rol) ? rol.join(', ') : (rol || null)
  
  await tx.auditoria.create({
    data: {
      usuarioId,
      rol: rolString,
      entidad,
      entidadId: entidadId || null,
      accion,
      detalleBefore: detalleBefore || undefined,
      detalleAfter: detalleAfter || undefined,
      ip,
      userAgent,
    },
  })
}

/**
 * Parsea y valida una fecha
 * @param {string|Date} fecha - Fecha a validar
 * @param {Date} defaultValue - Valor por defecto si no se proporciona fecha
 * @returns {{valid: boolean, date?: Date, error?: string}}
 */
export function parsearFecha(fecha, defaultValue = null) {
  if (!fecha && defaultValue) {
    return { valid: true, date: defaultValue }
  }
  
  if (!fecha) {
    return { valid: true, date: null }
  }

  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) {
    return { valid: false, error: 'Fecha/hora inválida' }
  }
  
  return { valid: true, date }
}

/**
 * Valida un valor contra una lista de opciones válidas
 */
export function validarEnum(valor, opcionesValidas, nombreCampo) {
  if (!opcionesValidas.includes(valor)) {
    return { valid: false, error: `${nombreCampo} inválido` }
  }
  return { valid: true }
}

/**
 * Parsea JSON de forma segura
 */
export function parsearJsonSeguro(data) {
  if (data === null || data === undefined) {
    return { valid: true, data: null }
  }
  
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return { valid: true, data: parsed }
  } catch {
    return { valid: false, error: 'El campo debe ser un JSON válido' }
  }
}

/**
 * Construye filtro de fecha para Prisma
 */
export function construirFiltroFecha(fechaDesde, fechaHasta) {
  if (!fechaDesde && !fechaHasta) {
    return null
  }

  const filtro = {}
  
  if (fechaDesde) {
    filtro.gte = new Date(fechaDesde)
  }
  
  if (fechaHasta) {
    const fechaHastaDate = new Date(fechaHasta)
    fechaHastaDate.setHours(23, 59, 59, 999)
    filtro.lte = fechaHastaDate
  }
  
  return filtro
}

/**
 * Verifica si un string es un UUID válido
 */
export function esUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Respuesta de error estándar
 */
export function errorResponse(message, status = 400) {
  return Response.json({ error: message }, { status })
}

/**
 * Respuesta de éxito estándar
 */
export function successResponse(data, message = null, status = 200) {
  const response = { success: true, data }
  if (message) {
    response.message = message
  }
  return Response.json(response, { status })
}

/**
 * Maneja errores de Prisma comunes
 */
export function manejarErrorPrisma(error, mensajeDefault = 'Error interno del servidor') {
  console.error('Error de Prisma:', error)
  
  if (error.code === 'P2003') {
    return errorResponse('Referencia inválida en los datos proporcionados', 400)
  }
  
  if (error.code === 'P2002') {
    return errorResponse('Ya existe un registro con esos datos', 409)
  }
  
  if (error.code === 'P2025') {
    return errorResponse('Registro no encontrado', 404)
  }
  
  return errorResponse(mensajeDefault, 500)
}

/**
 * Extrae parámetros de paginación del request
 * @param {URLSearchParams} searchParams - Los parámetros de búsqueda
 * @param {number} defaultLimit - Límite por defecto (20 si no se especifica)
 */
export function getPaginationParams(searchParams, defaultLimit = 20) {
  const page = Number.parseInt(searchParams.get('page') || '1')
  const limit = Number.parseInt(searchParams.get('limit') || String(defaultLimit))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

/**
 * Construye respuesta paginada
 */
export function paginatedResponse(data, { page, limit, total }) {
  return Response.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
