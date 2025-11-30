// Constantes de validación para URNI
export const SERVICIOS_URNI_VALIDOS = ['URNI', 'UCIN', 'NEONATOLOGIA']

// Include común para episodios URNI (listado)
export const EPISODIO_URNI_INCLUDE = {
  rn: {
    include: {
      parto: {
        include: {
          madre: {
            select: { id: true, rut: true, nombres: true, apellidos: true },
          },
        },
      },
    },
  },
  responsableClinico: {
    select: { id: true, nombre: true, email: true },
  },
  createdBy: {
    select: { id: true, nombre: true },
  },
  _count: {
    select: { atenciones: true, controles: true },
  },
}

// Include detallado para episodio URNI individual
export const EPISODIO_URNI_DETAIL_INCLUDE = {
  rn: {
    include: {
      parto: {
        include: {
          madre: {
            select: { id: true, rut: true, nombres: true, apellidos: true, edad: true },
          },
        },
      },
    },
  },
  responsableClinico: { select: { id: true, nombre: true, email: true } },
  createdBy: { select: { id: true, nombre: true } },
  updatedBy: { select: { id: true, nombre: true } },
  atenciones: {
    orderBy: { fechaHora: 'desc' },
    include: { medico: { select: { id: true, nombre: true } } },
  },
  controles: {
    orderBy: { fechaHora: 'desc' },
    include: { enfermera: { select: { id: true, nombre: true } } },
  },
}

// Include para atenciones URNI
export const ATENCION_URNI_INCLUDE = {
  rn: {
    include: {
      parto: {
        include: {
          madre: {
            select: { id: true, rut: true, nombres: true, apellidos: true },
          },
        },
      },
    },
  },
  episodio: {
    select: { id: true, estado: true, fechaHoraIngreso: true },
  },
  medico: {
    select: { id: true, nombre: true, email: true },
  },
}

// Regex para validar UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Construye las condiciones de búsqueda para episodios URNI
 */
export function construirWhereEpisodioUrni(params) {
  const { estado, rnId, responsableId, search } = params
  const where = {}

  if (estado) where.estado = estado
  if (rnId) where.rnId = rnId
  if (responsableId) where.responsableClinicoId = responsableId

  if (search) {
    const searchTerm = search.trim()
    const isUUID = UUID_REGEX.test(searchTerm)

    where.OR = [
      { rn: { parto: { madre: { rut: { contains: searchTerm } } } } },
      { rn: { parto: { madre: { nombres: { contains: searchTerm } } } } },
      { rn: { parto: { madre: { apellidos: { contains: searchTerm } } } } },
    ]

    if (isUUID) {
      where.OR.push({ rnId: searchTerm })
    }
  }

  return where
}

/**
 * Construye las condiciones de búsqueda para atenciones URNI
 */
export function construirWhereAtencionUrni(params) {
  const { episodioId, rnId, medicoId } = params
  const where = {}

  if (episodioId) where.episodioId = episodioId
  if (rnId) where.rnId = rnId
  if (medicoId) where.medicoId = medicoId

  return where
}

/**
 * Construye los datos para crear un episodio URNI
 */
export function construirEpisodioUrniData(data, userId, fechaHoraIngreso) {
  const episodioData = {
    rnId: data.rnId,
    fechaHoraIngreso,
    estado: 'INGRESADO',
    createdById: userId,
  }

  if (data.motivoIngreso) {
    episodioData.motivoIngreso = data.motivoIngreso.trim().substring(0, 300)
  }

  if (data.servicioUnidad && SERVICIOS_URNI_VALIDOS.includes(data.servicioUnidad)) {
    episodioData.servicioUnidad = data.servicioUnidad
  }

  if (data.responsableClinicoId) {
    episodioData.responsableClinicoId = data.responsableClinicoId
  }

  return episodioData
}

/**
 * Construye los datos para crear una atención URNI
 */
export function construirAtencionUrniData(data, episodioId, medicoId, fechaHora) {
  const atencionData = {
    rnId: data.rnId,
    episodioId,
    fechaHora,
  }

  if (medicoId) {
    atencionData.medicoId = medicoId
  }

  if (data.diagnostico) {
    atencionData.diagnostico = data.diagnostico.trim().substring(0, 500)
  }

  if (data.indicaciones) {
    atencionData.indicaciones = data.indicaciones.trim().substring(0, 800)
  }

  if (data.evolucion) {
    atencionData.evolucion = data.evolucion.trim().substring(0, 1000)
  }

  return atencionData
}

/**
 * Construye los datos para actualizar un episodio URNI
 */
export function construirEpisodioUrniUpdateData(data, userId) {
  const updateData = { updatedById: userId }

  if (data.motivoIngreso !== undefined) {
    updateData.motivoIngreso = data.motivoIngreso 
      ? data.motivoIngreso.trim().substring(0, 300) 
      : null
  }

  if (data.servicioUnidad !== undefined) {
    updateData.servicioUnidad = SERVICIOS_URNI_VALIDOS.includes(data.servicioUnidad) 
      ? data.servicioUnidad 
      : null
  }

  if (data.responsableClinicoId !== undefined) {
    updateData.responsableClinicoId = data.responsableClinicoId || null
  }

  return updateData
}

/**
 * Construye los datos para el alta de un episodio URNI
 */
export function construirAltaUrniData(data, userId) {
  const updateData = {
    estado: 'ALTA',
    fechaHoraAlta: new Date(),
    updatedById: userId,
  }

  if (data.condicionEgreso) {
    updateData.condicionEgreso = data.condicionEgreso.trim().substring(0, 300)
  }

  return updateData
}

/**
 * Valida que un episodio existe, está activo y pertenece al RN
 */
export async function validarEpisodioParaAtencion(prisma, episodioId, rnId) {
  const episodio = await prisma.episodioURNI.findUnique({
    where: { id: episodioId },
  })

  if (!episodio) {
    return { error: 'El episodio URNI especificado no existe', status: 404 }
  }

  if (episodio.estado !== 'INGRESADO') {
    return { error: 'Solo se pueden crear atenciones para episodios URNI en estado INGRESADO', status: 400 }
  }

  if (episodio.rnId !== rnId) {
    return { error: 'El episodio URNI no pertenece al recién nacido especificado', status: 400 }
  }

  return { episodio }
}
