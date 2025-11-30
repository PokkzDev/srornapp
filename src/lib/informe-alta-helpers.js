// Constantes para informes de alta
export const FORMATOS_VALIDOS = ['PDF', 'DOCX', 'HTML']

// Include para episodios en estado INGRESADO sin informe
export const EPISODIO_SIN_INFORME_INCLUDE = {
  madre: {
    select: {
      id: true,
      rut: true,
      nombres: true,
      apellidos: true,
      edad: true,
      telefono: true,
      direccion: true,
    },
  },
}

// Include completo para informe
export const INFORME_INCLUDE = {
  generadoPor: {
    select: { id: true, nombre: true, email: true },
  },
  parto: {
    include: {
      recienNacidos: {
        select: {
          id: true,
          sexo: true,
          pesoNacimientoGramos: true,
          tallaCm: true,
          apgar1Min: true,
          apgar5Min: true,
          observaciones: true,
        },
      },
    },
  },
  episodio: {
    include: {
      madre: {
        select: {
          id: true,
          rut: true,
          nombres: true,
          apellidos: true,
          edad: true,
          telefono: true,
          direccion: true,
        },
      },
    },
  },
}

/**
 * Valida el formato de informe
 */
export function validarFormato(formato) {
  const formatoUpper = formato ? formato.toUpperCase() : 'PDF'
  if (!FORMATOS_VALIDOS.includes(formatoUpper)) {
    return { error: `Formato inválido. Debe ser uno de: ${FORMATOS_VALIDOS.join(', ')}` }
  }
  return { formato: formatoUpper }
}

/**
 * Construye el contenido del informe
 */
export function construirContenidoInforme(episodio, parto) {
  return {
    madre: {
      id: episodio.madre.id,
      rut: episodio.madre.rut,
      nombres: episodio.madre.nombres,
      apellidos: episodio.madre.apellidos,
      edad: episodio.madre.edad,
      telefono: episodio.madre.telefono,
      direccion: episodio.madre.direccion,
    },
    episodio: {
      id: episodio.id,
      fechaIngreso: episodio.fechaIngreso.toISOString(),
      motivoIngreso: episodio.motivoIngreso,
      estado: episodio.estado,
    },
    parto: {
      id: parto.id,
      fechaHora: parto.fechaHora.toISOString(),
      tipo: parto.tipo,
      lugar: parto.lugar,
      lugarDetalle: parto.lugarDetalle,
      complicacionesTexto: parto.complicacionesTexto,
      observaciones: parto.observaciones,
    },
    recienNacidos: parto.recienNacidos.map((rn) => ({
      id: rn.id,
      sexo: rn.sexo,
      pesoNacimientoGramos: rn.pesoNacimientoGramos,
      tallaCm: rn.tallaCm,
      apgar1Min: rn.apgar1Min,
      apgar5Min: rn.apgar5Min,
      observaciones: rn.observaciones,
    })),
  }
}

/**
 * Formatea un informe para respuesta al frontend
 */
export function formatearInformeResponse(informe) {
  return {
    id: informe.id,
    fechaGeneracion: informe.fechaGeneracion.toISOString(),
    generadoPor: informe.generadoPor?.nombre || informe.generadoPor?.email || 'Desconocido',
    formato: informe.formato,
    parto: {
      fechaHora: informe.parto.fechaHora.toISOString(),
      tipo: informe.parto.tipo,
      lugar: informe.parto.lugar,
      lugarDetalle: informe.parto.lugarDetalle,
      observaciones: informe.parto.observaciones || informe.parto.complicacionesTexto,
    },
    recienNacidos: informe.parto.recienNacidos.map((rn) => ({
      sexo: rn.sexo,
      pesoNacimientoGramos: rn.pesoNacimientoGramos,
      tallaCm: rn.tallaCm,
      apgar1Min: rn.apgar1Min,
      apgar5Min: rn.apgar5Min,
      observaciones: rn.observaciones,
    })),
    episodio: {
      id: informe.episodio.id,
      fechaIngreso: informe.episodio.fechaIngreso.toISOString(),
      estado: informe.episodio.estado,
      motivoIngreso: informe.episodio.motivoIngreso,
      fechaAlta: informe.episodio.fechaAlta?.toISOString() || null,
      condicionEgreso: informe.episodio.condicionEgreso || null,
    },
    madre: {
      id: informe.episodio.madre.id,
      rut: informe.episodio.madre.rut,
      nombres: informe.episodio.madre.nombres,
      apellidos: informe.episodio.madre.apellidos,
      edad: informe.episodio.madre.edad,
      telefono: informe.episodio.madre.telefono,
      direccion: informe.episodio.madre.direccion,
    },
  }
}

/**
 * Obtiene partos de un episodio que no tienen informe
 */
export async function obtenerPartosDisponibles(prisma, episodio) {
  const fechaFilter = episodio.fechaAlta
    ? { gte: episodio.fechaIngreso, lte: episodio.fechaAlta }
    : { gte: episodio.fechaIngreso }

  const partosRaw = await prisma.parto.findMany({
    where: {
      madreId: episodio.madreId,
      fechaHora: fechaFilter,
      informesAlta: { none: {} },
    },
    include: {
      recienNacidos: {
        select: {
          id: true,
          sexo: true,
          pesoNacimientoGramos: true,
          tallaCm: true,
          apgar1Min: true,
          apgar5Min: true,
          observaciones: true,
        },
      },
    },
    orderBy: { fechaHora: 'desc' },
  })

  // Deduplicar por ID
  const partosMap = new Map()
  partosRaw.forEach(parto => {
    if (!partosMap.has(parto.id)) {
      partosMap.set(parto.id, parto)
    }
  })
  return Array.from(partosMap.values())
}
