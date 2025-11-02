const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Truncate all tables before seeding
  console.log('🗑️  Truncating all tables...')
  
  // Disable foreign key checks for MySQL
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`
  
  // Truncate tables in reverse dependency order
  // Start with tables that have foreign keys
  // Table names match Prisma schema (@@map or default PascalCase)
  const tables = [
    'InformeAlta',
    'AtencionURNI',
    'ControlNeonatal',
    'PulseraNFC',
    'EpisodioURNI',
    'RecienNacido',
    'PartoMatrona',
    'PartoMedico',
    'PartoEnfermera',
    'Parto',
    'EpisodioMadre',
    'Madre',
    'Auditoria',
    'ReporteREM',
    'UserRole',
    'UserPermission',
    'RolePermission',
    'User',
    'Role',
    'Permission',
  ]
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`)
      console.log(`  ✓ Truncated table: ${table}`)
    } catch (error) {
      // Table might not exist yet, continue
      console.log(`  ⚠ Skipped table: ${table} (may not exist)`)
    }
  }
  
  // Re-enable foreign key checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`
  
  console.log('✅ Tables truncated successfully\n')

  // Roles to create
  const roles = [
    { name: 'matrona', description: 'Matrona - Profesional de salud especializado en atención materno-infantil' },
    { name: 'medico', description: 'Médico - Profesional médico' },
    { name: 'enfermera', description: 'Enfermera - Profesional de enfermería' },
    { name: 'administrativo', description: 'Administrativo - Personal administrativo' },
    { name: 'jefatura', description: 'Jefatura - Personal de jefatura y dirección' },
  ]

  // Create roles
  console.log('📝 Creating roles...')
  const createdRoles = {}
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description,
        isSystem: true,
      },
    })
    createdRoles[roleData.name] = role
    console.log(`  ✓ Role "${roleData.name}" created/updated`)
  }

  // Permissions to create
  const permissions = [
    { code: 'madre:view', description: 'Visualizar madres' },
    { code: 'madre:create', description: 'Registrar madre' },
    { code: 'madre:update', description: 'Editar madre' },
    { code: 'madre:delete', description: 'Eliminar madre' },
    { code: 'madre:view_limited', description: 'Visualizar madres (solo datos básicos)' },
    { code: 'madre:create_limited', description: 'Registrar madre (solo datos básicos)' },
    { code: 'madre:update_limited', description: 'Editar madre (solo datos básicos)' },
    { code: 'madre:delete_limited', description: 'Eliminar madre (solo si no tiene partos/RN)' },
    { code: 'parto:view', description: 'Visualizar partos' },
    { code: 'parto:create', description: 'Registrar parto' },
    { code: 'parto:update', description: 'Editar parto' },
    { code: 'parto:delete', description: 'Eliminar parto' },
    { code: 'recien-nacido:view', description: 'Visualizar recién nacidos' },
    { code: 'recien-nacido:create', description: 'Registrar recién nacido' },
    { code: 'recien-nacido:update', description: 'Editar recién nacido' },
    { code: 'recien-nacido:delete', description: 'Eliminar recién nacido' },
    { code: 'recien_nacido:create', description: 'Registrar recién nacido (legacy)' }, // Mantener compatibilidad
    { code: 'registro_clinico:edit', description: 'Editar registro clínico' },
    { code: 'fichas:view', description: 'Visualizar fichas' },
    { code: 'atencion_urn:create', description: 'Registrar atención URN' },
    { code: 'control_neonatal:create', description: 'Registrar control neonatal' },
    { code: 'reporte_rem:generate', description: 'Generar reporte REM' },
    { code: 'ingreso_alta:manage', description: 'Gestionar ingreso/alta' },
    { code: 'ingreso_alta:view', description: 'Visualizar ingresos/altas' },
    { code: 'ingreso_alta:create', description: 'Registrar ingreso' },
    { code: 'ingreso_alta:update', description: 'Editar ingreso/alta' },
    { code: 'ingreso_alta:alta', description: 'Procesar alta' },
    { code: 'informe_alta:generate', description: 'Generar informe para alta' },
    { code: 'modulo_alta:aprobar', description: 'Aprobar alta médica' },
    { code: 'auditoria:review', description: 'Revisar auditoría' },
    { code: 'indicadores:consult', description: 'Consultar indicadores' },
  ]

  // Create permissions
  console.log('🔐 Creating permissions...')
  const createdPermissions = {}
  for (const permData of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: permData.code },
      update: { description: permData.description },
      create: {
        code: permData.code,
        description: permData.description,
      },
    })
    createdPermissions[permData.code] = permission
    console.log(`  ✓ Permission "${permData.code}" created/updated`)
  }

  // Role-permission mappings
  const rolePermissions = {
    matrona: [
      'madre:view',
      'madre:create',
      'madre:update',
      'madre:delete',
      'parto:view',
      'parto:create',
      'parto:update',
      'parto:delete',
      'recien-nacido:view',
      'recien-nacido:create',
      'recien-nacido:update',
      'recien-nacido:delete',
      'recien_nacido:create', // Mantener compatibilidad legacy
      'registro_clinico:edit',
      'fichas:view',
      'informe_alta:generate',
    ],
    medico: [
      'registro_clinico:edit',
      'fichas:view',
      'atencion_urn:create',
      'modulo_alta:aprobar',
    ],
    enfermera: [
      'fichas:view',
      'control_neonatal:create',
    ],
    administrativo: [
      'reporte_rem:generate',
      'ingreso_alta:manage',
      'ingreso_alta:view',
      'ingreso_alta:create',
      'ingreso_alta:update',
      'ingreso_alta:alta',
      'madre:view_limited',
      'madre:create_limited',
      'madre:update_limited',
      'madre:delete_limited',
    ],
    jefatura: [
      'auditoria:review',
      'indicadores:consult',
    ],
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...')
  for (const [roleName, permissionCodes] of Object.entries(rolePermissions)) {
    const role = createdRoles[roleName]
    
    // First, delete all existing permissions for this role to ensure clean state
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
      },
    })
    
    // Then assign only the permissions we want
    for (const permCode of permissionCodes) {
      const permission = createdPermissions[permCode]
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
    }
    console.log(`  ✓ Assigned ${permissionCodes.length} permissions to role "${roleName}"`)
  }

  // Hash password for test accounts (default password: "Asdf1234")
  const passwordHash = await bcrypt.hash('Asdf1234', 10)

  // Users to create - one for each role
  const users = [
    {
      rut: '12345678-9',
      nombre: 'María González',
      email: 'matrona@srorn.cl',
      role: 'matrona',
    },
    {
      rut: '23456789-0',
      nombre: 'Dr. Carlos Pérez',
      email: 'medico@srorn.cl',
      role: 'medico',
    },
    {
      rut: '34567890-1',
      nombre: 'Ana Martínez',
      email: 'enfermera@srorn.cl',
      role: 'enfermera',
    },
    {
      rut: '45678901-2',
      nombre: 'Roberto Silva',
      email: 'administrativo@srorn.cl',
      role: 'administrativo',
    },
    {
      rut: '56789012-3',
      nombre: 'Dra. Patricia López',
      email: 'jefatura@srorn.cl',
      role: 'jefatura',
    },
  ]

  // Create users and assign roles
  console.log('👤 Creating users...')
  for (const userData of users) {
    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        nombre: userData.nombre,
        passwordHash: passwordHash,
        activo: true,
      },
      create: {
        rut: userData.rut,
        nombre: userData.nombre,
        email: userData.email,
        passwordHash: passwordHash,
        activo: true,
      },
    })

    // Assign role to user
    const role = createdRoles[userData.role]
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    })

    console.log(`  ✓ User "${userData.nombre}" (${userData.email}) created/updated with role "${userData.role}"`)
  }

  // Obtener usuario matrona para asignar como creador de madres
  const matronaUser = await prisma.user.findFirst({
    where: { email: 'matrona@srorn.cl' },
  })

  // Create mothers
  console.log('👩 Creating mothers...')
  const madres = [
    {
      rut: '11111111-1',
      nombres: 'Ana María',
      apellidos: 'Fernández López',
      edad: 28,
      telefono: '+56912345678',
      direccion: 'Av. Principal 123, Santiago',
      fichaClinica: 'FC-2024-001',
    },
    {
      rut: '22222222-2',
      nombres: 'María José',
      apellidos: 'Rodríguez Pérez',
      edad: 32,
      telefono: '+56923456789',
      direccion: 'Calle Los Olivos 456, Valparaíso',
      fichaClinica: 'FC-2024-002',
    },
    {
      rut: '33333333-3',
      nombres: 'Carmen Rosa',
      apellidos: 'González Martínez',
      edad: 25,
      telefono: '+56934567890',
      direccion: 'Pasaje Esperanza 789, Concepción',
      fichaClinica: 'FC-2024-003',
    },
    {
      rut: '44444444-4',
      nombres: 'Laura Patricia',
      apellidos: 'Sánchez Torres',
      edad: 30,
      telefono: '+56945678901',
      direccion: 'Av. Libertad 321, Temuco',
      fichaClinica: 'FC-2024-004',
    },
    {
      rut: '55555555-5',
      nombres: 'Patricia Alejandra',
      apellidos: 'Muñoz Silva',
      edad: 27,
      telefono: '+56956789012',
      direccion: 'Calle Central 654, La Serena',
      fichaClinica: 'FC-2024-005',
    },
  ]

  const createdMadres = []
  for (const madreData of madres) {
    const madre = await prisma.madre.upsert({
      where: { rut: madreData.rut },
      update: {
        nombres: madreData.nombres,
        apellidos: madreData.apellidos,
        edad: madreData.edad,
        telefono: madreData.telefono,
        direccion: madreData.direccion,
        fichaClinica: madreData.fichaClinica,
        updatedById: matronaUser?.id,
      },
      create: {
        rut: madreData.rut,
        nombres: madreData.nombres,
        apellidos: madreData.apellidos,
        edad: madreData.edad,
        telefono: madreData.telefono,
        direccion: madreData.direccion,
        fichaClinica: madreData.fichaClinica,
        createdById: matronaUser?.id,
      },
    })

    createdMadres.push(madre)
    console.log(`  ✓ Mother "${madreData.nombres} ${madreData.apellidos}" (${madreData.rut}) created/updated`)
  }

  // Obtener usuarios profesionales para asignar a partos
  const medicoUser = await prisma.user.findFirst({
    where: { email: 'medico@srorn.cl' },
  })
  const enfermeraUser = await prisma.user.findFirst({
    where: { email: 'enfermera@srorn.cl' },
  })

  // Crear partos para las madres (algunas madres pueden tener múltiples partos)
  console.log('👶 Creating births...')
  const partosData = [
    // Ana María Fernández López - Primer parto
    {
      madre: createdMadres[0],
      fechaHora: new Date('2023-05-12T10:20:00'),
      tipo: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicaciones: null,
      observaciones: 'Primer parto normal sin complicaciones',
    },
    // Ana María Fernández López - Segundo parto (GEMELOS IDÉNTICOS)
    {
      madre: createdMadres[0],
      fechaHora: new Date('2024-10-15T14:30:00'),
      tipo: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicaciones: null,
      observaciones: 'Segundo parto - Gemelas idénticas, parto normal sin complicaciones',
    },
    // María José Rodríguez Pérez - GEMELOS NO IDÉNTICOS
    {
      madre: createdMadres[1],
      fechaHora: new Date('2024-10-18T09:15:00'),
      tipo: 'CESAREA_ELECTIVA',
      lugar: 'PABELLON',
      complicaciones: 'Cesárea programada por embarazo gemelar y presentación podálica',
      observaciones: 'Procedimiento realizado sin complicaciones - Gemelos no idénticos',
    },
    // Carmen Rosa González Martínez - Primer parto
    {
      madre: createdMadres[2],
      fechaHora: new Date('2023-08-20T11:30:00'),
      tipo: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicaciones: null,
      observaciones: 'Primer parto vaginal asistido',
    },
    // Carmen Rosa González Martínez - Segundo parto (GEMELOS IDÉNTICOS)
    {
      madre: createdMadres[2],
      fechaHora: new Date('2024-10-20T16:45:00'),
      tipo: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicaciones: null,
      observaciones: 'Segundo parto - Gemelos idénticos, parto vaginal asistido',
    },
    // Laura Patricia Sánchez Torres
    {
      madre: createdMadres[3],
      fechaHora: new Date('2024-10-22T03:20:00'),
      tipo: 'CESAREA_EMERGENCIA',
      lugar: 'PABELLON',
      complicaciones: 'Sufrimiento fetal agudo',
      observaciones: 'Cesárea de emergencia realizada con éxito',
    },
    // Patricia Alejandra Muñoz Silva
    {
      madre: createdMadres[4],
      fechaHora: new Date('2024-10-25T11:00:00'),
      tipo: 'DISTOCICO',
      lugar: 'SALA_PARTO',
      complicaciones: 'Parto prolongado',
      observaciones: 'Requiere uso de fórceps',
    },
  ]

  const createdPartos = []
  for (const partoData of partosData) {
    const parto = await prisma.parto.create({
      data: {
        madreId: partoData.madre.id,
        fechaHora: partoData.fechaHora,
        tipo: partoData.tipo,
        lugar: partoData.lugar,
        complicaciones: partoData.complicaciones,
        observaciones: partoData.observaciones,
        createdById: matronaUser?.id,
        matronas: {
          create: matronaUser ? [{ userId: matronaUser.id }] : [],
        },
        medicos: {
          create: medicoUser ? [{ userId: medicoUser.id }] : [],
        },
        enfermeras: {
          create: enfermeraUser ? [{ userId: enfermeraUser.id }] : [],
        },
      },
    })

    createdPartos.push(parto)
    console.log(`  ✓ Birth created for "${partoData.madre.nombres} ${partoData.madre.apellidos}" (${partoData.tipo})`)
  }

  // Crear recién nacidos para los partos (algunos partos tienen gemelos)
  console.log('👼 Creating newborns...')
  const recienNacidosData = [
    // Ana María Fernández López - Primer parto (2023) - Un solo hijo
    {
      parto: createdPartos[0],
      sexo: 'M',
      pesoGr: 3180,
      tallaCm: 49,
      apgar1: 9,
      apgar5: 10,
      observaciones: 'Primer hijo, recién nacido a término, estado saludable',
    },
    // Ana María Fernández López - Segundo parto (2024) - GEMELOS IDÉNTICOS (mismo sexo, pesos similares)
    {
      parto: createdPartos[1],
      sexo: 'F',
      pesoGr: 2980,
      tallaCm: 47,
      apgar1: 9,
      apgar5: 10,
      observaciones: 'Primera gemela idéntica, recién nacida a término, estado saludable',
    },
    {
      parto: createdPartos[1],
      sexo: 'F',
      pesoGr: 3010,
      tallaCm: 47,
      apgar1: 8,
      apgar5: 10,
      observaciones: 'Segunda gemela idéntica, recién nacida a término, estado saludable',
    },
    // María José Rodríguez Pérez - CESAREA_ELECTIVA - GEMELOS NO IDÉNTICOS (diferente sexo)
    {
      parto: createdPartos[2],
      sexo: 'M',
      pesoGr: 2650,
      tallaCm: 46,
      apgar1: 8,
      apgar5: 9,
      observaciones: 'Primer gemelo (no idéntico), recién nacido sano post cesárea electiva',
    },
    {
      parto: createdPartos[2],
      sexo: 'F',
      pesoGr: 2720,
      tallaCm: 46,
      apgar1: 8,
      apgar5: 9,
      observaciones: 'Segunda gemela (no idéntica), recién nacida sana post cesárea electiva',
    },
    // Carmen Rosa González Martínez - Primer parto (2023) - Un solo hijo
    {
      parto: createdPartos[3],
      sexo: 'F',
      pesoGr: 3020,
      tallaCm: 48,
      apgar1: 9,
      apgar5: 10,
      observaciones: 'Primer hijo, parto normal, recién nacida saludable',
    },
    // Carmen Rosa González Martínez - Segundo parto (2024) - GEMELOS IDÉNTICOS
    {
      parto: createdPartos[4],
      sexo: 'M',
      pesoGr: 2840,
      tallaCm: 45,
      apgar1: 9,
      apgar5: 10,
      observaciones: 'Primer gemelo idéntico, parto normal, recién nacido saludable',
    },
    {
      parto: createdPartos[4],
      sexo: 'M',
      pesoGr: 2810,
      tallaCm: 45,
      apgar1: 9,
      apgar5: 10,
      observaciones: 'Segundo gemelo idéntico, parto normal, recién nacido saludable',
    },
    // Laura Patricia Sánchez Torres - CESAREA_EMERGENCIA - Un solo hijo
    {
      parto: createdPartos[5],
      sexo: 'M',
      pesoGr: 3100,
      tallaCm: 49,
      apgar1: 7,
      apgar5: 9,
      observaciones: 'Recién nacido recuperado satisfactoriamente post cesárea de emergencia',
    },
    // Patricia Alejandra Muñoz Silva - DISTOCICO - Un solo hijo
    {
      parto: createdPartos[6],
      sexo: 'F',
      pesoGr: 3420,
      tallaCm: 51,
      apgar1: 8,
      apgar5: 10,
      observaciones: 'Parto distócico asistido con fórceps, recién nacida en buen estado',
    },
  ]

  for (const rnData of recienNacidosData) {
    const recienNacido = await prisma.recienNacido.create({
      data: {
        partoId: rnData.parto.id,
        sexo: rnData.sexo,
        pesoGr: rnData.pesoGr,
        tallaCm: rnData.tallaCm,
        apgar1: rnData.apgar1,
        apgar5: rnData.apgar5,
        observaciones: rnData.observaciones,
        createdById: matronaUser?.id,
      },
    })

    console.log(`  ✓ Newborn created (${rnData.sexo === 'M' ? 'M' : 'F'}) - Peso: ${rnData.pesoGr}g, Talla: ${rnData.tallaCm}cm, Apgar: ${rnData.apgar1}/${rnData.apgar5}`)
  }

  // Obtener usuario administrativo para crear episodios
  const administrativoUser = await prisma.user.findFirst({
    where: { email: 'administrativo@srorn.cl' },
  })

  // Crear episodios de ingreso/alta para madres con partos recientes (2024)
  console.log('🏥 Creating episodes (EpisodioMadre)...')
  const episodiosData = [
    // Ana María Fernández López - Episodio para segundo parto (2024)
    {
      madre: createdMadres[0],
      fechaIngreso: new Date('2024-10-10T08:00:00'),
      motivoIngreso: 'Control prenatal y seguimiento de embarazo gemelar',
      estado: 'INGRESADO',
      parto: createdPartos[1], // Segundo parto (gemelas)
      crearInforme: true, // Este episodio tendrá informe
    },
    // María José Rodríguez Pérez - Episodio para parto gemelar
    {
      madre: createdMadres[1],
      fechaIngreso: new Date('2024-10-12T09:00:00'),
      motivoIngreso: 'Ingreso para cesárea programada por embarazo gemelar',
      estado: 'INGRESADO',
      parto: createdPartos[2], // Parto gemelar
      crearInforme: false, // Este episodio NO tendrá informe (para demostración)
    },
    // Carmen Rosa González Martínez - Episodio para segundo parto (2024)
    {
      madre: createdMadres[2],
      fechaIngreso: new Date('2024-10-15T10:00:00'),
      motivoIngreso: 'Control prenatal y seguimiento de embarazo gemelar',
      estado: 'INGRESADO',
      parto: createdPartos[4], // Segundo parto (gemelos)
      crearInforme: true, // Este episodio tendrá informe
    },
    // Laura Patricia Sánchez Torres - Episodio para cesárea de emergencia
    {
      madre: createdMadres[3],
      fechaIngreso: new Date('2024-10-20T07:00:00'),
      motivoIngreso: 'Ingreso de emergencia por sufrimiento fetal agudo',
      estado: 'INGRESADO',
      parto: createdPartos[5], // Cesárea de emergencia
      crearInforme: false, // Este episodio NO tendrá informe (para demostración)
    },
    // Patricia Alejandra Muñoz Silva - Episodio para parto distócico
    {
      madre: createdMadres[4],
      fechaIngreso: new Date('2024-10-23T08:30:00'),
      motivoIngreso: 'Control prenatal y seguimiento de embarazo',
      estado: 'INGRESADO',
      parto: createdPartos[6], // Parto distócico
      crearInforme: false, // Este episodio NO tendrá informe (para demostración)
    },
  ]

  const createdEpisodios = []
  for (const episodioData of episodiosData) {
    const episodio = await prisma.episodioMadre.create({
      data: {
        madreId: episodioData.madre.id,
        fechaIngreso: episodioData.fechaIngreso,
        motivoIngreso: episodioData.motivoIngreso,
        estado: episodioData.estado,
        createdById: administrativoUser?.id,
      },
    })

    createdEpisodios.push({
      episodio,
      parto: episodioData.parto,
      crearInforme: episodioData.crearInforme,
    })

    console.log(`  ✓ Episode created for "${episodioData.madre.nombres} ${episodioData.madre.apellidos}" - Estado: ${episodioData.estado}`)
  }

  // Crear informes de alta solo para algunos episodios (los demás quedan sin informe para demostración)
  console.log('📄 Creating discharge reports (InformeAlta)...')
  for (const { episodio, parto, crearInforme } of createdEpisodios) {
    if (crearInforme) {
      // Obtener datos completos para el contenido del informe
      const partoCompleto = await prisma.parto.findUnique({
        where: { id: parto.id },
        include: {
          recienNacidos: {
            select: {
              id: true,
              sexo: true,
              pesoGr: true,
              tallaCm: true,
              apgar1: true,
              apgar5: true,
              observaciones: true,
            },
          },
        },
      })

      const episodioCompleto = await prisma.episodioMadre.findUnique({
        where: { id: episodio.id },
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
      })

      // Preparar contenido del informe
      const contenido = {
        madre: {
          id: episodioCompleto.madre.id,
          rut: episodioCompleto.madre.rut,
          nombres: episodioCompleto.madre.nombres,
          apellidos: episodioCompleto.madre.apellidos,
          edad: episodioCompleto.madre.edad,
          telefono: episodioCompleto.madre.telefono,
          direccion: episodioCompleto.madre.direccion,
        },
        episodio: {
          id: episodioCompleto.id,
          fechaIngreso: episodioCompleto.fechaIngreso.toISOString(),
          motivoIngreso: episodioCompleto.motivoIngreso,
          estado: episodioCompleto.estado,
        },
        parto: {
          id: partoCompleto.id,
          fechaHora: partoCompleto.fechaHora.toISOString(),
          tipo: partoCompleto.tipo,
          lugar: partoCompleto.lugar,
          lugarDetalle: partoCompleto.lugarDetalle,
          complicaciones: partoCompleto.complicaciones,
          observaciones: partoCompleto.observaciones,
        },
        recienNacidos: partoCompleto.recienNacidos.map((rn) => ({
          id: rn.id,
          sexo: rn.sexo,
          pesoGr: rn.pesoGr,
          tallaCm: rn.tallaCm,
          apgar1: rn.apgar1,
          apgar5: rn.apgar5,
          observaciones: rn.observaciones,
        })),
      }

      const informe = await prisma.informeAlta.create({
        data: {
          partoId: parto.id,
          episodioId: episodio.id,
          formato: 'PDF',
          generadoPorId: matronaUser?.id,
          contenido: contenido,
        },
      })

      console.log(`  ✓ Discharge report created for episode of "${episodioCompleto.madre.nombres} ${episodioCompleto.madre.apellidos}"`)
    } else {
      // Obtener nombre de la madre para el log
      const episodioConMadre = await prisma.episodioMadre.findUnique({
        where: { id: episodio.id },
        include: {
          madre: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
        },
      })
      console.log(`  ⏳ Episode for "${episodioConMadre.madre.nombres} ${episodioConMadre.madre.apellidos}" left without report (for demonstration)`)
    }
  }

  console.log('✅ Seed completed successfully!')
  console.log('\n📋 Test accounts created:')
  console.log('  Default password for all accounts: Asdf1234')
  users.forEach((user) => {
    console.log(`  - ${user.email} (${user.role})`)
  })
  console.log(`\n👩 ${madres.length} mothers created`)
  console.log(`👶 ${partosData.length} births created`)
  console.log(`👼 ${recienNacidosData.length} newborns created`)
  console.log(`\n🏥 ${episodiosData.length} episodes created`)
  const informesCreados = createdEpisodios.filter(e => e.crearInforme).length
  const episodiosSinInforme = createdEpisodios.filter(e => !e.crearInforme).length
  console.log(`📄 ${informesCreados} discharge reports created`)
  console.log(`⏳ ${episodiosSinInforme} episodes left without reports (for demonstration)`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

