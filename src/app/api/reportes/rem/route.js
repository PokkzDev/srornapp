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
    // QUERY: Obtener todos los partos del período con TODOS los campos necesarios
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
            pertenenciaPuebloOriginario: true,
            condicionMigrante: true,
            condicionDiscapacidad: true,
            condicionPrivadaLibertad: true,
            identidadTrans: true,
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
            esPuebloOriginario: true,
            esMigrante: true,
            sexo: true,
            alojamientoConjuntoInmediato: true,
            contactoPielPielInmediato: true,
          },
        },
        complicaciones: {
          select: {
            tipo: true,
            contexto: true,
          },
        },
      },
      orderBy: {
        fechaHora: 'asc',
      },
    })

    // Obtener esterilizaciones del período
    const esterilizaciones = await prisma.esterilizacionQuirurgica.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      select: {
        sexo: true,
        edadAnos: true,
        condicionTrans: true,
        tipo: true,
      },
    })

    const totalPartos = partos.length

    // ============================================
    // SECCIÓN D.1: INFORMACIÓN GENERAL DE RECIÉN NACIDOS VIVOS
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

    const anomaliasCongenitas = recienNacidosVivos.filter(
      rn => rn.anomaliaCongenita === true
    ).length

    // REM A 24: Por ahora se deja como campo calculable (requiere fórmula específica)
    const remA24 = null // TODO: Calcular según fórmula específica

    const seccionD1 = {
      total: totalRNVivos,
      pesoAlNacer,
      anomaliasCongenitas,
      remA24,
    }

    // ============================================
    // SECCIÓN D.2: ATENCIÓN INMEDIATA DEL RECIÉN NACIDO
    // ============================================
    
    // Profilaxis
    const profilaxis = {
      hepatitisB: recienNacidosVivos.filter(rn => rn.profilaxisHepatitisB === true).length,
      ocular: recienNacidosVivos.filter(rn => rn.profilaxisOcularGonorrea === true).length,
    }

    // Tipo de parto
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

    // Desglose instrumental: Distócico y Vacuum
    // Nota: Vacuum se infiere del tipo INSTRUMENTAL, distócico del tipoCursoParto
    const partosInstrumentales = partos.filter(p => p.tipo === 'INSTRUMENTAL')
    const instrumentalDistocico = partosInstrumentales.filter(
      p => p.tipoCursoParto === 'DISTOCICO'
    ).length
    const instrumentalVacuum = partosInstrumentales.length // Todos los instrumentales se asumen como vacuum

    // Desglose cesáreas
    const cesareaUrgencia = partos.filter(p => p.tipo === 'CESAREA_URGENCIA').length
    const cesareaElectiva = partos.filter(p => p.tipo === 'CESAREA_ELECTIVA').length

    // APGAR - CORREGIDO: ≤3 al minuto y ≤6 a los 5 minutos
    const apgar = {
      menorIgual3al1min: recienNacidosVivos.filter(
        rn => rn.apgar1Min !== null && rn.apgar1Min !== undefined && rn.apgar1Min <= 3
      ).length,
      menorIgual6a5min: recienNacidosVivos.filter(
        rn => rn.apgar5Min !== null && rn.apgar5Min !== undefined && rn.apgar5Min <= 6
      ).length,
    }

    // Reanimación
    const reanimacion = {
      basica: recienNacidosVivos.filter(rn => rn.reanimacionBasica === true).length,
      avanzada: recienNacidosVivos.filter(rn => rn.reanimacionAvanzada === true).length,
    }

    // EHI Grado II y III
    const ehi23 = recienNacidosVivos.filter(rn => rn.ehiGradoII_III === true).length

    const seccionD2 = {
      profilaxis,
      tipoParto,
      instrumental: {
        distocico: instrumentalDistocico,
        vacuum: instrumentalVacuum,
      },
      cesareas: {
        urgencia: cesareaUrgencia,
        electiva: cesareaElectiva,
      },
      apgar,
      reanimacion,
      ehi23,
      remA24,
      totalPartos,
    }

    // ============================================
    // SECCIÓN D: PROFILAXIS OCULAR PARA GONORREA
    // ============================================
    const rnConProfilaxisOcular = recienNacidosVivos.filter(
      rn => rn.profilaxisOcularGonorrea === true
    )
    
    const profilaxisOcularPueblosOriginarios = rnConProfilaxisOcular.filter(
      rn => rn.esPuebloOriginario === true
    ).length

    const profilaxisOcularMigrantes = rnConProfilaxisOcular.filter(
      rn => rn.esMigrante === true
    ).length

    // REM A11: Por ahora se deja como campo calculable
    const remA11ProfilaxisOcular = null // TODO: Calcular según fórmula específica

    const seccionDProfilaxisOcular = {
      totalConProfilaxis: rnConProfilaxisOcular.length,
      pueblosOriginarios: profilaxisOcularPueblosOriginarios,
      migrantes: profilaxisOcularMigrantes,
      remA11: remA11ProfilaxisOcular,
      totalRNVivos: totalRNVivos,
    }

    // ============================================
    // SECCIÓN J: PROFILAXIS HEPATITIS B
    // ============================================
    const rnHijosHepatitisB = recienNacidosVivos.filter(
      rn => rn.hijoMadreHepatitisBPositiva === true
    )

    const rnProfilaxisCompletaHepatitisB = rnHijosHepatitisB.filter(
      rn => rn.profilaxisCompletaHepatitisB === true
    )

    const seccionJ = {
      hijosHepatitisBPositiva: {
        total: rnHijosHepatitisB.length,
        pueblosOriginarios: rnHijosHepatitisB.filter(rn => rn.esPuebloOriginario === true).length,
        migrantes: rnHijosHepatitisB.filter(rn => rn.esMigrante === true).length,
        remA11: null, // TODO: Calcular según fórmula específica
      },
      profilaxisCompleta: {
        total: rnProfilaxisCompletaHepatitisB.length,
        pueblosOriginarios: rnProfilaxisCompletaHepatitisB.filter(rn => rn.esPuebloOriginario === true).length,
        migrantes: rnProfilaxisCompletaHepatitisB.filter(rn => rn.esMigrante === true).length,
        remA11: null, // TODO: Calcular según fórmula específica
      },
    }

    // ============================================
    // CARACTERÍSTICAS DEL PARTO (tabla completa)
    // ============================================
    
    // Función auxiliar para obtener peso RN de un parto
    const obtenerPesoRN = (parto) => {
      const rn = parto.recienNacidos.find(r => r.esNacidoVivo === true)
      if (!rn) return null
      if (rn.categoriaPeso) {
        const categoriasMenores = ['MENOR_500', 'RANGO_500_999', 'RANGO_1000_1499', 'RANGO_1500_1999', 'RANGO_2000_2499']
        if (categoriasMenores.includes(rn.categoriaPeso)) return 'menor2499'
        return 'mayor2500'
      }
      if (rn.pesoNacimientoGramos !== null && rn.pesoNacimientoGramos !== undefined) {
        return rn.pesoNacimientoGramos <= 2499 ? 'menor2499' : 'mayor2500'
      }
      return null
    }

    // Función auxiliar para obtener semanas gestación
    const obtenerSemanasGestacion = (parto) => {
      const semanas = parto.edadGestacionalSemanas
      if (semanas === null || semanas === undefined) return null
      if (semanas < 24) return 'menor24'
      if (semanas >= 24 && semanas <= 28) return '24a28'
      if (semanas >= 29 && semanas <= 32) return '29a32'
      if (semanas >= 33 && semanas <= 36) return '33a36'
      return 'mayor36'
    }

    // Función auxiliar para obtener edad madre
    const obtenerEdadMadre = (parto) => {
      const edad = parto.madre.edadAnos || parto.madre.edad
      if (edad === null || edad === undefined) return null
      if (edad < 15) return 'menor15'
      if (edad >= 15 && edad <= 19) return '15a19'
      if (edad >= 20 && edad <= 34) return '20a34'
      if (edad >= 35) return 'mayor35'
      return null
    }

    // Inicializar estructura de características del parto
    const caracteristicasParto = {
      total: {
        total: totalPartos,
        edadMadre: { menor15: 0, entre15y19: 0, entre20y34: 0, mayor35: 0 },
        prematuros: { menor24: 0, entre24y28: 0, entre29y32: 0, entre33y36: 0 },
        oxitocinaProfilactica: 0,
        anestesia: {
          neuroaxial: 0,
          oxidoNitroso: 0,
          endovenosa: 0,
          general: 0,
          local: 0,
          noFarmacologica: 0,
        },
        ligaduraTardiaCordon: 0,
        contactoPielPiel: {
          conMadre: { menor2499: 0, mayor2500: 0 },
          conPadre: { menor2499: 0, mayor2500: 0 },
        },
        lactancia60min: { menor2499: 0, mayor2500: 0 },
        alojamientoConjunto: 0,
        pertinenciaCultural: 0,
        condicionesEspeciales: {
          pueblosOriginarios: { masculino: 0, femenino: 0 },
          migrantes: 0,
          discapacidad: 0,
          privadaLibertad: 0,
          trans: 0,
        },
      },
      vaginal: { total: 0, /* misma estructura */ },
      instrumental: { total: 0, /* misma estructura */ },
      cesareaElectiva: { total: 0, /* misma estructura */ },
      cesareaUrgencia: { total: 0, /* misma estructura */ },
      prehospitalario: { total: 0, /* misma estructura */ },
      planDeParto: { total: 0, /* misma estructura */ },
      fueraRed: { total: 0, /* misma estructura */ },
      entregaPlacenta: { total: 0, /* misma estructura */ },
      embarazoNoControlado: { total: 0, /* misma estructura */ },
      domicilioConProfesional: { total: 0, /* misma estructura */ },
      domicilioSinProfesional: { total: 0, /* misma estructura */ },
    }

    // Función para inicializar estructura de fila
    const inicializarFila = () => ({
      total: 0,
      edadMadre: { menor15: 0, entre15y19: 0, entre20y34: 0, mayor35: 0 },
      prematuros: { menor24: 0, entre24y28: 0, entre29y32: 0, entre33y36: 0 },
      oxitocinaProfilactica: 0,
      anestesia: {
        neuroaxial: 0,
        oxidoNitroso: 0,
        endovenosa: 0,
        general: 0,
        local: 0,
        noFarmacologica: 0,
      },
      ligaduraTardiaCordon: 0,
      contactoPielPiel: {
        conMadre: { menor2499: 0, mayor2500: 0 },
        conPadre: { menor2499: 0, mayor2500: 0 },
      },
      lactancia60min: { menor2499: 0, mayor2500: 0 },
      alojamientoConjunto: 0,
      pertinenciaCultural: 0,
      condicionesEspeciales: {
        pueblosOriginarios: { masculino: 0, femenino: 0 },
        migrantes: 0,
        discapacidad: 0,
        privadaLibertad: 0,
        trans: 0,
      },
    })

    // Inicializar todas las filas
    caracteristicasParto.vaginal = inicializarFila()
    caracteristicasParto.instrumental = inicializarFila()
    caracteristicasParto.cesareaElectiva = inicializarFila()
    caracteristicasParto.cesareaUrgencia = inicializarFila()
    caracteristicasParto.prehospitalario = inicializarFila()
    caracteristicasParto.planDeParto = inicializarFila()
    caracteristicasParto.fueraRed = inicializarFila()
    caracteristicasParto.entregaPlacenta = inicializarFila()
    caracteristicasParto.embarazoNoControlado = inicializarFila()
    caracteristicasParto.domicilioConProfesional = inicializarFila()
    caracteristicasParto.domicilioSinProfesional = inicializarFila()

    // Procesar cada parto
    partos.forEach(parto => {
      const semanasGest = obtenerSemanasGestacion(parto)
      const edadMadre = obtenerEdadMadre(parto)
      const pesoRN = obtenerPesoRN(parto)
      const tieneRNVivo = parto.recienNacidos.some(rn => rn.esNacidoVivo === true)
      const rnVivo = parto.recienNacidos.find(rn => rn.esNacidoVivo === true)

      // Función para actualizar una fila
      const actualizarFila = (fila) => {
        fila.total++
        
        // Edad madre
        if (edadMadre === 'menor15') fila.edadMadre.menor15++
        else if (edadMadre === '15a19') fila.edadMadre.entre15y19++
        else if (edadMadre === '20a34') fila.edadMadre.entre20y34++
        else if (edadMadre === 'mayor35') fila.edadMadre.mayor35++

        // Prematuros
        if (semanasGest === 'menor24') fila.prematuros.menor24++
        else if (semanasGest === '24a28') fila.prematuros.entre24y28++
        else if (semanasGest === '29a32') fila.prematuros.entre29y32++
        else if (semanasGest === '33a36') fila.prematuros.entre33y36++

        // Oxitocina profiláctica
        if (parto.oxitocinaProfilactica === true) fila.oxitocinaProfilactica++

        // Anestesia
        if (parto.anestesiaNeuroaxial === true) fila.anestesia.neuroaxial++
        if (parto.oxidoNitroso === true) fila.anestesia.oxidoNitroso++
        if (parto.analgesiaEndovenosa === true) fila.anestesia.endovenosa++
        if (parto.anestesiaGeneral === true) fila.anestesia.general++
        if (parto.anestesiaLocal === true) fila.anestesia.local++
        if (parto.medidasNoFarmacologicasAnestesia === true) fila.anestesia.noFarmacologica++

        // Ligadura tardía
        if (parto.ligaduraTardiaCordon === true) fila.ligaduraTardiaCordon++

        // Contacto piel a piel
        if (tieneRNVivo && rnVivo) {
          if (parto.contactoPielPielMadre30min === true) {
            if (pesoRN === 'menor2499') fila.contactoPielPiel.conMadre.menor2499++
            else if (pesoRN === 'mayor2500') fila.contactoPielPiel.conMadre.mayor2500++
          }
          if (parto.contactoPielPielAcomp30min === true) {
            if (pesoRN === 'menor2499') fila.contactoPielPiel.conPadre.menor2499++
            else if (pesoRN === 'mayor2500') fila.contactoPielPiel.conPadre.mayor2500++
          }
          // También verificar en RN
          if (rnVivo.contactoPielPielInmediato === true) {
            if (pesoRN === 'menor2499') fila.contactoPielPiel.conMadre.menor2499++
            else if (pesoRN === 'mayor2500') fila.contactoPielPiel.conMadre.mayor2500++
          }
        }

        // Lactancia 60min
        if (tieneRNVivo && rnVivo) {
          const tieneLactancia = parto.lactancia60minAlMenosUnRn === true || rnVivo.lactancia60Min === true
          if (tieneLactancia) {
            if (pesoRN === 'menor2499') fila.lactancia60min.menor2499++
            else if (pesoRN === 'mayor2500') fila.lactancia60min.mayor2500++
          }
        }

        // Alojamiento conjunto
        if (tieneRNVivo && rnVivo && rnVivo.alojamientoConjuntoInmediato === true) {
          fila.alojamientoConjunto++
        }

        // Pertinencia cultural
        if (parto.atencionPertinenciaCultural === true) fila.pertinenciaCultural++

        // Condiciones especiales
        if (parto.madre.pertenenciaPuebloOriginario === true) {
          if (tieneRNVivo && rnVivo) {
            if (rnVivo.sexo === 'M') fila.condicionesEspeciales.pueblosOriginarios.masculino++
            else if (rnVivo.sexo === 'F') fila.condicionesEspeciales.pueblosOriginarios.femenino++
          }
        }
        if (parto.madre.condicionMigrante === true) fila.condicionesEspeciales.migrantes++
        if (parto.madre.condicionDiscapacidad === true) fila.condicionesEspeciales.discapacidad++
        if (parto.madre.condicionPrivadaLibertad === true) fila.condicionesEspeciales.privadaLibertad++
        if (parto.madre.identidadTrans === true) fila.condicionesEspeciales.trans++
      }

      // Actualizar total
      actualizarFila(caracteristicasParto.total)

      // Actualizar según tipo de parto
      if (parto.tipo === 'VAGINAL') actualizarFila(caracteristicasParto.vaginal)
      else if (parto.tipo === 'INSTRUMENTAL') actualizarFila(caracteristicasParto.instrumental)
      else if (parto.tipo === 'CESAREA_ELECTIVA') actualizarFila(caracteristicasParto.cesareaElectiva)
      else if (parto.tipo === 'CESAREA_URGENCIA') actualizarFila(caracteristicasParto.cesareaUrgencia)
      else if (parto.tipo === 'PREHOSPITALARIO') actualizarFila(caracteristicasParto.prehospitalario)
      else if (parto.tipo === 'DOMICILIO_PROFESIONAL') actualizarFila(caracteristicasParto.domicilioConProfesional)
      else if (parto.tipo === 'DOMICILIO_SIN_PROFESIONAL') actualizarFila(caracteristicasParto.domicilioSinProfesional)
      else if (parto.tipo === 'FUERA_RED') actualizarFila(caracteristicasParto.fueraRed)

      // Campos booleanos específicos
      if (parto.planDeParto === true) actualizarFila(caracteristicasParto.planDeParto)
      if (parto.entregaPlacentaSolicitud === true) actualizarFila(caracteristicasParto.entregaPlacenta)
      if (parto.embarazoNoControlado === true) actualizarFila(caracteristicasParto.embarazoNoControlado)
    })

    // ============================================
    // MODELO DE ATENCIÓN (tabla completa)
    // ============================================
    
    // Función para obtener categoría de semanas gestación para modelo de atención
    const obtenerCategoriaSemanas = (semanas) => {
      if (semanas === null || semanas === undefined) return null
      if (semanas < 28) return 'menor28'
      if (semanas >= 28 && semanas <= 37) return '28a37'
      if (semanas >= 38) return 'mayor38'
      return null
    }

    // Inicializar estructura modelo de atención
    const modeloAtencion = {
      espontaneo: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      inducidoMecanico: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      inducidoFarmacologico: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      conduccionOxitocica: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      libertadMovimiento: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      regimenHidricoAmplio: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      manejoDolorNoFarmacologico: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      manejoDolorFarmacologico: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      posicionLitotomia: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      posicionOtras: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      episiotomia: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      acompanamientoDuranteTrabajo: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
      acompanamientoSoloExpulsivo: {
        total: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        menor28: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        entre28y37: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
        mayor38: { total: 0, eutocico: { menor28: 0, entre28y37: 0, mayor38: 0 }, distocico: { menor28: 0, entre28y37: 0, mayor38: 0 } },
      },
    }

    // Función para actualizar modelo de atención
    const actualizarModeloAtencion = (campo, parto) => {
      const semanas = obtenerCategoriaSemanas(parto.edadGestacionalSemanas)
      const curso = parto.tipoCursoParto
      
      if (!semanas || !curso) return

      const categorias = ['total', semanas]
      categorias.forEach(cat => {
        if (!modeloAtencion[campo][cat]) return
        
        modeloAtencion[campo][cat].total++
        if (curso === 'EUTOCICO') {
          modeloAtencion[campo][cat].eutocico[semanas]++
        } else if (curso === 'DISTOCICO') {
          modeloAtencion[campo][cat].distocico[semanas]++
        }
      })
    }

    // Procesar cada parto para modelo de atención
    partos.forEach(parto => {
      if (parto.inicioTrabajoParto === 'ESPONTANEO') {
        actualizarModeloAtencion('espontaneo', parto)
      } else if (parto.inicioTrabajoParto === 'INDUCIDO_MECANICO') {
        actualizarModeloAtencion('inducidoMecanico', parto)
      } else if (parto.inicioTrabajoParto === 'INDUCIDO_FARMACOLOGICO') {
        actualizarModeloAtencion('inducidoFarmacologico', parto)
      }

      if (parto.conduccionOxitocica === true) {
        actualizarModeloAtencion('conduccionOxitocica', parto)
      }
      if (parto.libertadMovimiento === true) {
        actualizarModeloAtencion('libertadMovimiento', parto)
      }
      if (parto.regimenHidricoAmplio === true) {
        actualizarModeloAtencion('regimenHidricoAmplio', parto)
      }
      if (parto.manejoDolorNoFarmacologico === true) {
        actualizarModeloAtencion('manejoDolorNoFarmacologico', parto)
      }
      if (parto.manejoDolorFarmacologico === true) {
        actualizarModeloAtencion('manejoDolorFarmacologico', parto)
      }
      if (parto.posicionExpulsivo === 'LITOTOMIA') {
        actualizarModeloAtencion('posicionLitotomia', parto)
      } else if (parto.posicionExpulsivo === 'OTRAS') {
        actualizarModeloAtencion('posicionOtras', parto)
      }
      if (parto.episiotomia === true) {
        actualizarModeloAtencion('episiotomia', parto)
      }
      if (parto.acompananteDuranteTrabajo === true) {
        actualizarModeloAtencion('acompanamientoDuranteTrabajo', parto)
      }
      if (parto.acompananteSoloExpulsivo === true) {
        actualizarModeloAtencion('acompanamientoSoloExpulsivo', parto)
      }
    })

    // ============================================
    // SECCIÓN G: ESTERILIZACIONES QUIRÚRGICAS
    // ============================================
    const esterilizacionesMujer = esterilizaciones.filter(e => e.sexo === 'F')
    const esterilizacionesHombre = esterilizaciones.filter(e => e.sexo === 'M')

    const seccionGEsterilizaciones = {
      mujer: {
        total: esterilizacionesMujer.length,
        menor20: esterilizacionesMujer.filter(e => e.edadAnos < 20).length,
        entre20y34: esterilizacionesMujer.filter(e => e.edadAnos >= 20 && e.edadAnos <= 34).length,
        mayor35: esterilizacionesMujer.filter(e => e.edadAnos >= 35).length,
        trans: esterilizacionesMujer.filter(e => e.condicionTrans === true).length,
        remA21: null, // TODO: Calcular según fórmula específica
      },
      hombre: {
        total: esterilizacionesHombre.length,
      },
    }

    // ============================================
    // COMPLICACIONES OBSTÉTRICAS
    // ============================================
    const complicacionesPorTipo = {}
    const complicacionesPorContexto = {}

    // Inicializar estructuras
    const tiposComplicacion = [
      'HPP_INERCIA', 'HPP_RESTOS', 'HPP_TRAUMA', 'DESGARROS_III_IV',
      'ALTERACION_COAGULACION', 'PREECLAMPSIA_SEVERA', 'ECLAMPSIA',
      'SEPSIS_SISTEMICA_GRAVE', 'MANEJO_QUIRURGICO_INERCIA',
      'HISTERCTOMIA_OBSTETRICA', 'ANEMIA_SEVERA_TRANSFUSION'
    ]

    const contextosComplicacion = [
      'PARTO_ESPONTANEO_INSTITUCIONAL', 'PARTO_INDUCIDO_INSTITUCIONAL',
      'CESAREA_URGENCIA', 'CESAREA_ELECTIVA', 'PARTO_DOMICILIO',
      'EUTOCICO_ESPONTANEO', 'EUTOCICO_INDUCIDO',
      'DISTOCICO_ESPONTANEO', 'DISTOCICO_INDUCIDO'
    ]

    tiposComplicacion.forEach(tipo => {
      complicacionesPorTipo[tipo] = {
        partoEspontaneo: 0,
        partoInducido: 0,
        cesarea: 0,
        partoDomicilio: 0,
        cesareaUrgencia: 0,
        cesareaElectiva: 0,
        eutocicoEspontaneo: 0,
        eutocicoInducido: 0,
        distocicoEspontaneo: 0,
        distocicoInducido: 0,
      }
    })

    // Procesar complicaciones
    partos.forEach(parto => {
      parto.complicaciones.forEach(complicacion => {
        const tipo = complicacion.tipo
        const contexto = complicacion.contexto

        if (!complicacionesPorTipo[tipo]) {
          complicacionesPorTipo[tipo] = {
            partoEspontaneo: 0,
            partoInducido: 0,
            cesarea: 0,
            partoDomicilio: 0,
            cesareaUrgencia: 0,
            cesareaElectiva: 0,
            eutocicoEspontaneo: 0,
            eutocicoInducido: 0,
            distocicoEspontaneo: 0,
            distocicoInducido: 0,
          }
        }

        if (contexto === 'PARTO_ESPONTANEO_INSTITUCIONAL') {
          complicacionesPorTipo[tipo].partoEspontaneo++
        } else if (contexto === 'PARTO_INDUCIDO_INSTITUCIONAL') {
          complicacionesPorTipo[tipo].partoInducido++
        } else if (contexto === 'CESAREA_URGENCIA') {
          complicacionesPorTipo[tipo].cesarea++
          complicacionesPorTipo[tipo].cesareaUrgencia++
        } else if (contexto === 'CESAREA_ELECTIVA') {
          complicacionesPorTipo[tipo].cesarea++
          complicacionesPorTipo[tipo].cesareaElectiva++
        } else if (contexto === 'PARTO_DOMICILIO') {
          complicacionesPorTipo[tipo].partoDomicilio++
        } else if (contexto === 'EUTOCICO_ESPONTANEO') {
          complicacionesPorTipo[tipo].eutocicoEspontaneo++
        } else if (contexto === 'EUTOCICO_INDUCIDO') {
          complicacionesPorTipo[tipo].eutocicoInducido++
        } else if (contexto === 'DISTOCICO_ESPONTANEO') {
          complicacionesPorTipo[tipo].distocicoEspontaneo++
        } else if (contexto === 'DISTOCICO_INDUCIDO') {
          complicacionesPorTipo[tipo].distocicoInducido++
        }
      })
    })

    const complicacionesObstetricas = {
      porTipo: complicacionesPorTipo,
    }

    // ============================================
    // ESTRUCTURAR RESPUESTA COMPLETA
    // ============================================
    const reporteData = {
      seccionD1,
      seccionD2,
      seccionDProfilaxisOcular,
      seccionJ,
      caracteristicasParto,
      modeloAtencion,
      seccionGEsterilizaciones,
      complicacionesObstetricas,
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
