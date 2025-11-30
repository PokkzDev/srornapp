import { prisma } from '@/lib/prisma'

// Include para episodios de madre
export const EPISODIO_MADRE_INCLUDE = {
  madre: {
    select: {
      id: true,
      rut: true,
      nombres: true,
      apellidos: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  },
}

export const EPISODIO_MADRE_INCLUDE_DETAIL = {
  madre: {
    include: {
      partos: {
        include: {
          recienNacidos: true,
        },
        orderBy: {
          fechaHora: 'desc',
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  },
}

/**
 * Valida la completitud de datos antes del alta
 */
export async function validarAltaCompletitud(madreId) {
  const madre = await prisma.madre.findUnique({
    where: { id: madreId },
    include: {
      partos: {
        include: {
          recienNacidos: true,
        },
      },
    },
  })

  if (!madre) {
    return { isValid: false, errors: ['La madre no existe'] }
  }

  const errors = []

  // Validar campos requeridos de la madre
  if (!madre.rut || !madre.nombres || !madre.apellidos) {
    errors.push('La madre debe tener RUT, nombres y apellidos completos')
  }

  // Validar al menos un parto
  if (!madre.partos?.length) {
    errors.push('Debe existir al menos un parto registrado')
    return { isValid: false, errors }
  }

  // Validar cada parto
  validarPartos(madre.partos, errors)

  return { isValid: errors.length === 0, errors }
}

/**
 * Helper para validar partos y sus recién nacidos
 */
function validarPartos(partos, errors) {
  for (const parto of partos) {
    const fechaStr = parto.fechaHora 
      ? new Date(parto.fechaHora).toLocaleDateString() 
      : 'fecha desconocida'

    if (!parto.fechaHora || !parto.tipo || !parto.lugar) {
      errors.push(`El parto del ${fechaStr} debe tener fecha/hora, tipo y lugar completos`)
    }

    if (!parto.recienNacidos?.length) {
      errors.push(`El parto del ${fechaStr} debe tener al menos un recién nacido registrado`)
    } else {
      for (const rn of parto.recienNacidos) {
        if (!rn.sexo) {
          errors.push(`El recién nacido del parto del ${fechaStr} debe tener sexo registrado`)
        }
      }
    }
  }
}

/**
 * Construye las condiciones de búsqueda para episodios
 */
export function construirWhereBusquedaEpisodio(search, estado) {
  const where = {}
  
  if (estado) {
    where.estado = estado
  }
  
  if (search) {
    where.OR = [
      { madre: { rut: { contains: search } } },
      { madre: { nombres: { contains: search } } },
      { madre: { apellidos: { contains: search } } },
      { motivoIngreso: { contains: search } },
      { hospitalAnterior: { contains: search } },
    ]
  }
  
  return where
}

/**
 * Construye los datos para crear un episodio
 */
export function construirEpisodioDataCreate(data, userId, fechaIngreso) {
  const episodioData = {
    madreId: data.madreId,
    fechaIngreso: fechaIngreso,
    estado: 'INGRESADO',
    createdById: userId,
  }

  if (data.motivoIngreso) {
    episodioData.motivoIngreso = data.motivoIngreso.trim().substring(0, 300)
  }

  if (data.hospitalAnterior) {
    episodioData.hospitalAnterior = data.hospitalAnterior.trim().substring(0, 200)
  }

  return episodioData
}

/**
 * Construye los datos para actualizar un episodio
 */
export function construirEpisodioDataUpdate(data, userId) {
  const updateData = { updatedById: userId }

  if (data.fechaIngreso) {
    const fechaIngreso = new Date(data.fechaIngreso)
    if (!Number.isNaN(fechaIngreso.getTime())) {
      updateData.fechaIngreso = fechaIngreso
    }
  }

  if (data.motivoIngreso !== undefined) {
    updateData.motivoIngreso = data.motivoIngreso ? data.motivoIngreso.trim().substring(0, 300) : null
  }

  if (data.hospitalAnterior !== undefined) {
    updateData.hospitalAnterior = data.hospitalAnterior ? data.hospitalAnterior.trim().substring(0, 200) : null
  }

  return updateData
}

/**
 * Construye los datos para procesar el alta
 */
export function construirAltaData(data, userId) {
  const updateData = {
    estado: 'ALTA',
    fechaAlta: new Date(),
    updatedById: userId,
  }

  if (data.condicionEgreso) {
    updateData.condicionEgreso = data.condicionEgreso.trim().substring(0, 300)
  }

  return updateData
}
