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
      // Registrar intento de acceso sin permisos
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
            entidad: 'ReporteREM',
            accion: 'PERMISSION_DENIED',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
        })
      } catch (auditError) {
        console.error('Error al registrar auditoría:', auditError)
      }

      return Response.json(
        { error: 'No tiene permisos para generar reportes REM' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes'))
    const anio = parseInt(searchParams.get('anio'))

    // Validar parámetros
    if (!mes || !anio || mes < 1 || mes > 12 || anio < 2000 || anio > 2100) {
      return Response.json(
        { error: 'Mes y año son requeridos y deben ser válidos' },
        { status: 400 }
      )
    }

    // Construir rango de fechas para el mes/año especificado
    const fechaInicio = new Date(anio, mes - 1, 1, 0, 0, 0, 0)
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999) // Último día del mes

    // ============================================
    // QUERY: Obtener todos los partos del período
    // ============================================
    const partos = await prisma.parto.findMany({
      where: {
        fechaHora: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        madre: {
          select: {
            id: true,
            edad: true,
            edadAnos: true,
            hepatitisBPositiva: true,
          },
        },
        recienNacidos: {
          select: {
            id: true,
            esNacidoVivo: true,
            pesoNacimientoGramos: true,
            categoriaPeso: true,
            anomaliaCongenita: true,
            profilaxisHepatitisB: true,
            profilaxisOcularGonorrea: true,
            profilaxisCompletaHepatitisB: true,
            hijoMadreHepatitisBPositiva: true,
            apgar1Min: true,
            apgar5Min: true,
            reanimacionBasica: true,
            reanimacionAvanzada: true,
            ehiGradoII_III: true,
            lactancia60Min: true,
          },
        },
      },
      orderBy: {
        fechaHora: 'asc',
      },
    })

    const totalPartos = partos.length

    // ============================================
    // CALCULAR: Características del Parto
    // ============================================
    
    // Tipos de parto
    const tiposParto = {
      eutocico: partos.filter(p => p.tipoCursoParto === 'EUTOCICO').length,
      cesareasElectivas: partos.filter(p => p.tipo === 'CESAREA_ELECTIVA').length,
      cesareasEmergencia: partos.filter(p => p.tipo === 'CESAREA_URGENCIA').length,
    }

    // Partos según edad de la madre
    const partosSegunEdadMadre = {
      menor15: 0,
      entre15y19: 0,
      entre20y24: 0,
      mayor35: 0,
    }

    partos.forEach(parto => {
      const edad = parto.madre.edadAnos || parto.madre.edad
      if (edad !== null && edad !== undefined) {
        if (edad < 15) {
          partosSegunEdadMadre.menor15++
        } else if (edad >= 15 && edad <= 19) {
          partosSegunEdadMadre.entre15y19++
        } else if (edad >= 20 && edad <= 24) {
          partosSegunEdadMadre.entre20y24++
        } else if (edad > 35) {
          partosSegunEdadMadre.mayor35++
        }
      }
    })

    // Partos primíparas
    // Para cada parto, verificar si la madre tiene partos anteriores
    const partosPrimiparas = {
      totalPrimiparas: 0,
      menor20Semanas: 0,
      entre20y36Semanas: 0,
      mayor37Semanas: 0,
      presentacionNalgas: 0, // No disponible en schema
      presentacionCara: 0, // No disponible en schema
      presentacionTransversa: 0, // No disponible en schema
    }

    for (const parto of partos) {
      // Contar partos anteriores de la misma madre antes del período actual
      const partosAnteriores = await prisma.parto.count({
        where: {
          madreId: parto.madreId,
          fechaHora: {
            lt: fechaInicio,
          },
        },
      })

      // Si no tiene partos anteriores, es primípara
      if (partosAnteriores === 0) {
        partosPrimiparas.totalPrimiparas++
        
        // Agrupar por semanas de gestación
        const semanasGestacion = parto.edadGestacionalSemanas
        if (semanasGestacion !== null && semanasGestacion !== undefined) {
          if (semanasGestacion < 20) {
            partosPrimiparas.menor20Semanas++
          } else if (semanasGestacion >= 20 && semanasGestacion <= 36) {
            partosPrimiparas.entre20y36Semanas++
          } else if (semanasGestacion >= 37) {
            partosPrimiparas.mayor37Semanas++
          }
        }
      }
    }

    const caracteristicasParto = {
      totalPartos,
      tiposParto,
      partosSegunEdadMadre,
      partosPrimiparas,
    }

    // ============================================
    // CALCULAR: Recién Nacidos Vivos
    // ============================================
    const recienNacidosVivos = partos
      .flatMap(p => p.recienNacidos)
      .filter(rn => rn.esNacidoVivo === true)

    const totalRNVivos = recienNacidosVivos.length

    // Peso al nacer por categorías
    const pesoAlNacer = {
      menor500: 0,
      entre500y999: 0,
      entre1000y1499: 0,
      entre1500y1999: 0,
      entre2000y2499: 0,
      entre2500y2999: 0,
      entre3000y3999: 0,
      entre4000yMas: 0,
    }

    recienNacidosVivos.forEach(rn => {
      if (rn.categoriaPeso) {
        switch (rn.categoriaPeso) {
          case 'MENOR_500':
            pesoAlNacer.menor500++
            break
          case 'RANGO_500_999':
            pesoAlNacer.entre500y999++
            break
          case 'RANGO_1000_1499':
            pesoAlNacer.entre1000y1499++
            break
          case 'RANGO_1500_1999':
            pesoAlNacer.entre1500y1999++
            break
          case 'RANGO_2000_2499':
            pesoAlNacer.entre2000y2499++
            break
          case 'RANGO_2500_2999':
            pesoAlNacer.entre2500y2999++
            break
          case 'RANGO_3000_3999':
            pesoAlNacer.entre3000y3999++
            break
          case 'RANGO_4000_MAS':
            pesoAlNacer.entre4000yMas++
            break
        }
      } else if (rn.pesoNacimientoGramos !== null && rn.pesoNacimientoGramos !== undefined) {
        // Fallback: calcular categoría desde peso en gramos
        const peso = rn.pesoNacimientoGramos
        if (peso < 500) {
          pesoAlNacer.menor500++
        } else if (peso >= 500 && peso < 1000) {
          pesoAlNacer.entre500y999++
        } else if (peso >= 1000 && peso < 1500) {
          pesoAlNacer.entre1000y1499++
        } else if (peso >= 1500 && peso < 2000) {
          pesoAlNacer.entre1500y1999++
        } else if (peso >= 2000 && peso < 2500) {
          pesoAlNacer.entre2000y2499++
        } else if (peso >= 2500 && peso < 3000) {
          pesoAlNacer.entre2500y2999++
        } else if (peso >= 3000 && peso < 4000) {
          pesoAlNacer.entre3000y3999++
        } else if (peso >= 4000) {
          pesoAlNacer.entre4000yMas++
        }
      }
    })

    // Anomalías congénitas
    const anomaliasCongenitas = recienNacidosVivos.filter(
      rn => rn.anomaliaCongenita === true
    ).length

    const recienNacidosVivosData = {
      total: totalRNVivos,
      pesoAlNacer,
      anomaliasCongenitas,
    }

    // ============================================
    // CALCULAR: Atención Inmediata del Recién Nacido
    // ============================================
    
    // Profilaxis
    const profilaxis = {
      hepatitisB: recienNacidosVivos.filter(rn => rn.profilaxisHepatitisB === true).length,
      ocular: recienNacidosVivos.filter(rn => rn.profilaxisOcularGonorrea === true).length,
    }

    // Tipo de parto (contar partos, no recién nacidos)
    const tipoParto = {
      vaginal: partos.filter(p => p.tipo === 'VAGINAL').length,
      instrumental: partos.filter(p => p.tipo === 'INSTRUMENTAL').length,
      cesarea: partos.filter(
        p => p.tipo === 'CESAREA_ELECTIVA' || p.tipo === 'CESAREA_URGENCIA'
      ).length,
      extrahospitalario: partos.filter(
        p => p.tipo === 'PREHOSPITALARIO' ||
            p.tipo === 'FUERA_RED' ||
            p.tipo === 'DOMICILIO_PROFESIONAL' ||
            p.tipo === 'DOMICILIO_SIN_PROFESIONAL'
      ).length,
    }

    // APGAR
    const apgar = {
      apgar0a3al1min: recienNacidosVivos.filter(
        rn => rn.apgar1Min !== null && rn.apgar1Min !== undefined && rn.apgar1Min >= 0 && rn.apgar1Min <= 3
      ).length,
      apgar6a5a5min: recienNacidosVivos.filter(
        rn => rn.apgar5Min !== null && rn.apgar5Min !== undefined && rn.apgar5Min >= 5 && rn.apgar5Min <= 6
      ).length,
    }

    // Reanimación
    const reanimacion = {
      basica: recienNacidosVivos.filter(rn => rn.reanimacionBasica === true).length,
      avanzada: recienNacidosVivos.filter(rn => rn.reanimacionAvanzada === true).length,
    }

    // EHI Grado II y III
    const ehi23 = recienNacidosVivos.filter(rn => rn.ehiGradoII_III === true).length

    const atencionInmediata = {
      profilaxis,
      tipoParto,
      apgar,
      reanimacion,
      ehi23,
    }

    // ============================================
    // CALCULAR: Lactancia Materna
    // ============================================
    // Filtrar partos con recién nacidos ≥ 2,500g
    const partosConRN2500g = partos.filter(parto => {
      return parto.recienNacidos.some(rn => {
        if (rn.categoriaPeso) {
          // Si tiene categoría, verificar que sea >= RANGO_2500_2999
          const categoriasValidas = [
            'RANGO_2500_2999',
            'RANGO_3000_3999',
            'RANGO_4000_MAS',
          ]
          return categoriasValidas.includes(rn.categoriaPeso)
        } else if (rn.pesoNacimientoGramos !== null && rn.pesoNacimientoGramos !== undefined) {
          return rn.pesoNacimientoGramos >= 2500
        }
        return false
      })
    })

    const lactanciaMaterna = {
      totalPartos: partosConRN2500g.length,
      lactanciaEn60Min: partosConRN2500g.filter(
        p => p.lactancia60minAlMenosUnRn === true ||
             p.recienNacidos.some(rn => rn.lactancia60Min === true)
      ).length,
      vaginal: partosConRN2500g.filter(p => p.tipo === 'VAGINAL').length,
      instrumental: partosConRN2500g.filter(p => p.tipo === 'INSTRUMENTAL').length,
      cesareasElectivas: partosConRN2500g.filter(p => p.tipo === 'CESAREA_ELECTIVA').length,
      cesareasUrgencia: partosConRN2500g.filter(p => p.tipo === 'CESAREA_URGENCIA').length,
    }

    // ============================================
    // CALCULAR: Profilaxis Hepatitis B
    // ============================================
    const profilaxisHepatitisB = {
      hijosDeHepatitisBPositiva: recienNacidosVivos.filter(
        rn => rn.hijoMadreHepatitisBPositiva === true
      ).length,
      profilaxisCompleta: recienNacidosVivos.filter(
        rn => rn.profilaxisCompletaHepatitisB === true
      ).length,
    }

    // ============================================
    // ESTRUCTURAR RESPUESTA
    // ============================================
    const reporteData = {
      caracteristicasParto,
      recienNacidosVivos: recienNacidosVivosData,
      atencionInmediata,
      lactanciaMaterna,
      profilaxisHepatitisB,
    }

    // Opcional: Guardar reporte en base de datos
    try {
      const periodo = `${anio}-${mes.toString().padStart(2, '0')}`
      
      await prisma.reporteREM.create({
        data: {
          periodo,
          jsonFuente: partos, // Datos fuente completos
          totales: reporteData, // Totales agregados
          generadoPorId: user.id,
        },
      })
    } catch (saveError) {
      // No fallar si no se puede guardar, solo loggear
      console.error('Error al guardar reporte REM:', saveError)
    }

    return Response.json({
      success: true,
      data: reporteData,
    })
  } catch (error) {
    console.error('Error al generar reporte REM:', error)
    return Response.json(
      { error: 'Error al generar reporte REM', details: error.message },
      { status: 500 }
    )
  }
}

