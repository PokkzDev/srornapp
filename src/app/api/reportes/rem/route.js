import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('reporte_rem:generate')) {
      return Response.json(
        { error: 'No tiene permisos para generar reportes REM' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || new Date().getMonth() + 1)
    const anio = parseInt(searchParams.get('anio') || new Date().getFullYear())

    // Validar parámetros
    if (mes < 1 || mes > 12 || anio < 2000 || anio > 2100) {
      return Response.json(
        { error: 'Parámetros de fecha inválidos' },
        { status: 400 }
      )
    }

    // Calcular rango de fechas
    const fechaInicio = new Date(anio, mes - 1, 1)
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999)

    // Obtener todos los partos del periodo
    const partos = await prisma.parto.findMany({
      where: {
        fechaHora: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        madre: true,
        recienNacidos: true,
      },
    })

    // Generar estadísticas para el reporte REM
    const reporte = generarReporteREM(partos, mes, anio)

    return Response.json({
      success: true,
      data: reporte,
      periodo: {
        mes,
        anio,
        fechaInicio,
        fechaFin,
      },
    })
  } catch (error) {
    console.error('Error al generar reporte REM:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generarReporteREM(partos, mes, anio) {
  const reporte = {
    periodo: `${anio}-${String(mes).padStart(2, '0')}`,
    mes,
    anio,
    
    // CARACTERÍSTICAS DEL PARTO
    caracteristicasParto: {
      totalPartos: partos.length,
      
      // Partos según edad de la madre
      partosSegunEdadMadre: {
        menor15: 0,
        entre15y19: 0,
        entre20y24: 0,
        mayor35: 0,
      },
      
      // Partos primíparas según semanas de gestación
      partosPrimiparas: {
        totalPrimiparas: 0,
        menor20Semanas: 0,
        entre20y36Semanas: 0,
        mayor37Semanas: 0,
        presentacionNalgas: 0,
        presentacionCara: 0,
        presentacionTransversa: 0,
      },
      
      // Tipos de parto
      tiposParto: {
        eutocico: 0,
        distocico: 0,
        cesareasElectivas: 0,
        cesareasEmergencia: 0,
      },
    },
    
    // SECCIÓN D.1: INFORMACIÓN GENERAL DE RECIÉN NACIDOS VIVOS
    recienNacidosVivos: {
      total: 0,
      
      // Peso al nacer (en gramos)
      pesoAlNacer: {
        menor500: 0,
        entre500y999: 0,
        entre1000y1499: 0,
        entre1500y1999: 0,
        entre2000y2499: 0,
        entre2500y2999: 0,
        entre3000y3999: 0,
        entre4000yMas: 0,
      },
      
      // Anomalías congénitas
      anomaliasCongenitas: 0,
    },
    
    // SECCIÓN D.2: ATENCIÓN INMEDIATA DEL RECIÉN NACIDO
    atencionInmediata: {
      // Profilaxis
      profilaxis: {
        hepatitisB: 0,
        ocular: 0,
      },
      
      // Tipo de parto
      tipoParto: {
        vaginal: 0,
        instrumental: 0,
        cesarea: 0,
        extrahospitalario: 0,
      },
      
      // APGAR
      apgar: {
        apgar0a3al1min: 0,
        apgar6a5a5min: 0,
      },
      
      // Reanimación
      reanimacion: {
        basica: 0,
        avanzada: 0,
      },
      
      // EHI Grado II y III
      ehi23: 0,
    },
    
    // SECCIÓN D: PROFILAXIS OCULAR PARA GONORREA
    profilaxisOcular: {
      total: 0,
      pueblosOriginarios: 0,
      migrantes: 0,
    },
    
    // SECCIÓN J: PROFILAXIS HEPATITIS B
    profilaxisHepatitisB: {
      hijosDeHepatitisBPositiva: 0,
      profilaxisCompleta: 0,
    },
    
    // CARACTERÍSTICAS DEL PARTO - LACTANCIA MATERNA
    lactanciaMaterna: {
      totalPartos: 0,
      vaginal: 0,
      instrumental: 0,
      cesareasElectivas: 0,
      cesareasUrgencia: 0,
      lactanciaEn60Min: 0, // RN con peso >= 2500g
    },
  }

  // Procesar cada parto
  partos.forEach(parto => {
    const madre = parto.madre
    const edad = madre.edad || 0
    const semanasGestacion = parto.semanasGestacion || 0
    
    // Partos según edad de la madre
    if (edad < 15) {
      reporte.caracteristicasParto.partosSegunEdadMadre.menor15++
    } else if (edad >= 15 && edad <= 19) {
      reporte.caracteristicasParto.partosSegunEdadMadre.entre15y19++
    } else if (edad >= 20 && edad <= 24) {
      reporte.caracteristicasParto.partosSegunEdadMadre.entre20y24++
    } else if (edad > 35) {
      reporte.caracteristicasParto.partosSegunEdadMadre.mayor35++
    }
    
    // Partos primíparas
    if (madre.esPrimigestas) {
      reporte.caracteristicasParto.partosPrimiparas.totalPrimiparas++
      
      if (semanasGestacion < 20) {
        reporte.caracteristicasParto.partosPrimiparas.menor20Semanas++
      } else if (semanasGestacion >= 20 && semanasGestacion <= 36) {
        reporte.caracteristicasParto.partosPrimiparas.entre20y36Semanas++
      } else if (semanasGestacion >= 37) {
        reporte.caracteristicasParto.partosPrimiparas.mayor37Semanas++
      }
      
      // Presentación fetal
      const presentacion = parto.presentacionFetal?.toLowerCase() || ''
      if (presentacion.includes('nalgas') || presentacion.includes('podálica')) {
        reporte.caracteristicasParto.partosPrimiparas.presentacionNalgas++
      } else if (presentacion.includes('cara')) {
        reporte.caracteristicasParto.partosPrimiparas.presentacionCara++
      } else if (presentacion.includes('transversa')) {
        reporte.caracteristicasParto.partosPrimiparas.presentacionTransversa++
      }
    }
    
    // Tipos de parto
    switch (parto.tipo) {
      case 'EUTOCICO':
        reporte.caracteristicasParto.tiposParto.eutocico++
        reporte.atencionInmediata.tipoParto.vaginal++
        break
      case 'DISTOCICO':
        reporte.caracteristicasParto.tiposParto.distocico++
        reporte.atencionInmediata.tipoParto.instrumental++
        break
      case 'CESAREA_ELECTIVA':
        reporte.caracteristicasParto.tiposParto.cesareasElectivas++
        reporte.atencionInmediata.tipoParto.cesarea++
        break
      case 'CESAREA_EMERGENCIA':
        reporte.caracteristicasParto.tiposParto.cesareasEmergencia++
        reporte.atencionInmediata.tipoParto.cesarea++
        break
    }
    
    // Lactancia materna (para RN con peso >= 2500g)
    reporte.lactanciaMaterna.totalPartos++
    switch (parto.tipo) {
      case 'EUTOCICO':
        reporte.lactanciaMaterna.vaginal++
        break
      case 'DISTOCICO':
        reporte.lactanciaMaterna.instrumental++
        break
      case 'CESAREA_ELECTIVA':
        reporte.lactanciaMaterna.cesareasElectivas++
        break
      case 'CESAREA_EMERGENCIA':
        reporte.lactanciaMaterna.cesareasUrgencia++
        break
    }
    
    if (parto.lactanciaMaterna60min) {
      reporte.lactanciaMaterna.lactanciaEn60Min++
    }
    
    // Procesar recién nacidos
    parto.recienNacidos.forEach(rn => {
      reporte.recienNacidosVivos.total++
      
      // Peso al nacer
      const peso = rn.pesoGr || 0
      if (peso < 500) {
        reporte.recienNacidosVivos.pesoAlNacer.menor500++
      } else if (peso >= 500 && peso <= 999) {
        reporte.recienNacidosVivos.pesoAlNacer.entre500y999++
      } else if (peso >= 1000 && peso <= 1499) {
        reporte.recienNacidosVivos.pesoAlNacer.entre1000y1499++
      } else if (peso >= 1500 && peso <= 1999) {
        reporte.recienNacidosVivos.pesoAlNacer.entre1500y1999++
      } else if (peso >= 2000 && peso <= 2499) {
        reporte.recienNacidosVivos.pesoAlNacer.entre2000y2499++
      } else if (peso >= 2500 && peso <= 2999) {
        reporte.recienNacidosVivos.pesoAlNacer.entre2500y2999++
      } else if (peso >= 3000 && peso <= 3999) {
        reporte.recienNacidosVivos.pesoAlNacer.entre3000y3999++
      } else if (peso >= 4000) {
        reporte.recienNacidosVivos.pesoAlNacer.entre4000yMas++
      }
      
      // Anomalías congénitas
      if (rn.tieneAnomaliaCongenita) {
        reporte.recienNacidosVivos.anomaliasCongenitas++
      }
      
      // Profilaxis
      if (rn.profilaxisHepatitisB) {
        reporte.atencionInmediata.profilaxis.hepatitisB++
      }
      if (rn.profilaxisOcular) {
        reporte.atencionInmediata.profilaxis.ocular++
        reporte.profilaxisOcular.total++
      }
      
      // APGAR
      if (rn.apgar1 !== null && rn.apgar1 <= 3) {
        reporte.atencionInmediata.apgar.apgar0a3al1min++
      }
      if (rn.apgar5 !== null && rn.apgar5 >= 6 && rn.apgar5 <= 5) {
        reporte.atencionInmediata.apgar.apgar6a5a5min++
      }
      
      // Reanimación
      if (rn.reanimacionBasica) {
        reporte.atencionInmediata.reanimacion.basica++
      }
      if (rn.reanimacionAvanzada) {
        reporte.atencionInmediata.reanimacion.avanzada++
      }
      
      // EHI
      if (rn.ehi23) {
        reporte.atencionInmediata.ehi23++
      }
      
      // Hepatitis B
      if (rn.madreHepatitisB) {
        reporte.profilaxisHepatitisB.hijosDeHepatitisBPositiva++
        if (rn.profilaxisCompletaHepB) {
          reporte.profilaxisHepatitisB.profilaxisCompleta++
        }
      }
    })
  })

  return reporte
}
