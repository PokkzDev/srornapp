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
    { name: 'administrador_ti', description: 'Administrador TI - Departamento de Tecnologías de la Información' },
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
    { code: 'control_neonatal:view', description: 'Visualizar controles neonatales' },
    { code: 'control_neonatal:update', description: 'Editar controles neonatales' },
    { code: 'control_neonatal:delete', description: 'Eliminar controles neonatales' },
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
    { code: 'urni:episodio:create', description: 'Crear episodio URNI' },
    { code: 'urni:episodio:view', description: 'Ver episodios URNI' },
    { code: 'urni:episodio:update', description: 'Actualizar episodio URNI' },
    { code: 'urni:atencion:create', description: 'Crear atención URNI' },
    { code: 'urni:atencion:view', description: 'Ver atenciones URNI' },
    { code: 'urni:read', description: 'Lectura general URNI' },
    { code: 'alta:manage', description: 'Gestionar alta URNI' },
    { code: 'user:create', description: 'Crear usuarios' },
    { code: 'user:view', description: 'Ver usuarios' },
    { code: 'user:update', description: 'Editar usuarios' },
    { code: 'user:delete', description: 'Eliminar usuarios' },
    { code: 'user:manage', description: 'Gestionar usuarios (activar/desactivar)' },
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
      'urni:episodio:create',
      'urni:read',
      // Permisos de ingreso/alta de madre
      'ingreso_alta:view',
      'ingreso_alta:create',
      'ingreso_alta:update',
    ],
    medico: [
      'registro_clinico:edit',
      'fichas:view',
      'atencion_urn:create',
      'modulo_alta:aprobar',
      'urni:atencion:create',
      'urni:atencion:view',
      'urni:read',
      'alta:manage',
      'recien-nacido:view',
    ],
    enfermera: [
      'fichas:view',
      'control_neonatal:create',
      'control_neonatal:view',
      'control_neonatal:update',
      'control_neonatal:delete',
      'urni:read',
    ],
    administrativo: [
      'reporte_rem:generate',
      'madre:view_limited',
      'madre:create_limited',
      'madre:update_limited',
      'madre:delete_limited',
      'alta:manage',
    ],
    jefatura: [
      'auditoria:review',
      'indicadores:consult',
      'urni:atencion:view',
    ],
    administrador_ti: [
      'user:create',
      'user:view',
      'user:update',
      'user:delete',
      'user:manage',
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
    {
      rut: '99999999-9',
      nombre: 'Departamento TI',
      email: 'ti@srorn.cl',
      role: 'administrador_ti',
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
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicacionesTexto: null,
      observaciones: 'Primer parto normal sin complicaciones',
    },
    // Ana María Fernández López - Segundo parto (GEMELOS IDÉNTICOS)
    {
      madre: createdMadres[0],
      fechaHora: new Date('2024-10-15T14:30:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicacionesTexto: null,
      observaciones: 'Segundo parto - Gemelas idénticas, parto normal sin complicaciones',
    },
    // María José Rodríguez Pérez - GEMELOS NO IDÉNTICOS
    {
      madre: createdMadres[1],
      fechaHora: new Date('2024-10-18T09:15:00'),
      tipo: 'CESAREA_ELECTIVA',
      lugar: 'PABELLON',
      complicacionesTexto: 'Cesárea programada por embarazo gemelar y presentación podálica',
      observaciones: 'Procedimiento realizado sin complicaciones - Gemelos no idénticos',
    },
    // Carmen Rosa González Martínez - Primer parto
    {
      madre: createdMadres[2],
      fechaHora: new Date('2023-08-20T11:30:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicacionesTexto: null,
      observaciones: 'Primer parto vaginal asistido',
    },
    // Carmen Rosa González Martínez - Segundo parto (GEMELOS IDÉNTICOS)
    {
      madre: createdMadres[2],
      fechaHora: new Date('2024-10-20T16:45:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      complicacionesTexto: null,
      observaciones: 'Segundo parto - Gemelos idénticos, parto vaginal asistido',
    },
    // Laura Patricia Sánchez Torres
    {
      madre: createdMadres[3],
      fechaHora: new Date('2024-10-22T03:20:00'),
      tipo: 'CESAREA_URGENCIA',
      lugar: 'PABELLON',
      complicacionesTexto: 'Sufrimiento fetal agudo',
      observaciones: 'Cesárea de emergencia realizada con éxito',
    },
    // Patricia Alejandra Muñoz Silva
    {
      madre: createdMadres[4],
      fechaHora: new Date('2024-10-25T11:00:00'),
      tipo: 'INSTRUMENTAL',
      tipoCursoParto: 'DISTOCICO',
      lugar: 'SALA_PARTO',
      complicacionesTexto: 'Parto prolongado',
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
        tipoCursoParto: partoData.tipoCursoParto || null,
        lugar: partoData.lugar,
        complicacionesTexto: partoData.complicacionesTexto,
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
      pesoNacimientoGramos: 3180,
      tallaCm: 49,
      apgar1Min: 9,
      apgar5Min: 10,
      observaciones: 'Primer hijo, recién nacido a término, estado saludable',
    },
    // Ana María Fernández López - Segundo parto (2024) - GEMELOS IDÉNTICOS (mismo sexo, pesos similares)
    {
      parto: createdPartos[1],
      sexo: 'F',
      pesoNacimientoGramos: 2980,
      tallaCm: 47,
      apgar1Min: 9,
      apgar5Min: 10,
      observaciones: 'Primera gemela idéntica, recién nacida a término, estado saludable',
    },
    {
      parto: createdPartos[1],
      sexo: 'F',
      pesoNacimientoGramos: 3010,
      tallaCm: 47,
      apgar1Min: 8,
      apgar5Min: 10,
      observaciones: 'Segunda gemela idéntica, recién nacida a término, estado saludable',
    },
    // María José Rodríguez Pérez - CESAREA_ELECTIVA - GEMELOS NO IDÉNTICOS (diferente sexo)
    {
      parto: createdPartos[2],
      sexo: 'M',
      pesoNacimientoGramos: 2650,
      tallaCm: 46,
      apgar1Min: 8,
      apgar5Min: 9,
      observaciones: 'Primer gemelo (no idéntico), recién nacido sano post cesárea electiva',
    },
    {
      parto: createdPartos[2],
      sexo: 'F',
      pesoNacimientoGramos: 2720,
      tallaCm: 46,
      apgar1Min: 8,
      apgar5Min: 9,
      observaciones: 'Segunda gemela (no idéntica), recién nacida sana post cesárea electiva',
    },
    // Carmen Rosa González Martínez - Primer parto (2023) - Un solo hijo
    {
      parto: createdPartos[3],
      sexo: 'F',
      pesoNacimientoGramos: 3020,
      tallaCm: 48,
      apgar1Min: 9,
      apgar5Min: 10,
      observaciones: 'Primer hijo, parto normal, recién nacida saludable',
    },
    // Carmen Rosa González Martínez - Segundo parto (2024) - GEMELOS IDÉNTICOS
    {
      parto: createdPartos[4],
      sexo: 'M',
      pesoNacimientoGramos: 2840,
      tallaCm: 45,
      apgar1Min: 9,
      apgar5Min: 10,
      observaciones: 'Primer gemelo idéntico, parto normal, recién nacido saludable',
    },
    {
      parto: createdPartos[4],
      sexo: 'M',
      pesoNacimientoGramos: 2810,
      tallaCm: 45,
      apgar1Min: 9,
      apgar5Min: 10,
      observaciones: 'Segundo gemelo idéntico, parto normal, recién nacido saludable',
    },
    // Laura Patricia Sánchez Torres - CESAREA_URGENCIA - Un solo hijo
    {
      parto: createdPartos[5],
      sexo: 'M',
      pesoNacimientoGramos: 3100,
      tallaCm: 49,
      apgar1Min: 7,
      apgar5Min: 9,
      observaciones: 'Recién nacido recuperado satisfactoriamente post cesárea de emergencia',
    },
    // Patricia Alejandra Muñoz Silva - INSTRUMENTAL - Un solo hijo
    {
      parto: createdPartos[6],
      sexo: 'F',
      pesoNacimientoGramos: 3420,
      tallaCm: 51,
      apgar1Min: 8,
      apgar5Min: 10,
      observaciones: 'Parto distócico asistido con fórceps, recién nacida en buen estado',
    },
  ]

  for (const rnData of recienNacidosData) {
    const recienNacido = await prisma.recienNacido.create({
      data: {
        partoId: rnData.parto.id,
        sexo: rnData.sexo,
        pesoNacimientoGramos: rnData.pesoNacimientoGramos,
        tallaCm: rnData.tallaCm,
        apgar1Min: rnData.apgar1Min,
        apgar5Min: rnData.apgar5Min,
        observaciones: rnData.observaciones,
        createdById: matronaUser?.id,
      },
    })

    console.log(`  ✓ Newborn created (${rnData.sexo === 'M' ? 'M' : 'F'}) - Peso: ${rnData.pesoNacimientoGramos}g, Talla: ${rnData.tallaCm}cm, Apgar: ${rnData.apgar1Min}/${rnData.apgar5Min}`)
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
              pesoNacimientoGramos: true,
              tallaCm: true,
              apgar1Min: true,
              apgar5Min: true,
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
          complicacionesTexto: partoCompleto.complicacionesTexto,
          observaciones: partoCompleto.observaciones,
        },
        recienNacidos: partoCompleto.recienNacidos.map((rn) => ({
          id: rn.id,
          sexo: rn.sexo,
          pesoNacimientoGramos: rn.pesoNacimientoGramos,
          tallaCm: rn.tallaCm,
          apgar1Min: rn.apgar1Min,
          apgar5Min: rn.apgar5Min,
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

  // Crear episodios URNI de ejemplo para algunos recién nacidos recientes (2024)
  console.log('🏥 Creating URNI episodes (EpisodioURNI)...')
  const recienNacidos2024 = await prisma.recienNacido.findMany({
    where: {
      parto: {
        fechaHora: {
          gte: new Date('2024-01-01'),
        },
      },
    },
    include: {
      parto: {
        include: {
          madre: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
      },
    },
    take: 5, // Tomar algunos RN de 2024
  })

  const episodiosURNIData = []
  for (let i = 0; i < Math.min(recienNacidos2024.length, 3); i++) {
    const rn = recienNacidos2024[i]
    const fechaIngreso = new Date(rn.parto.fechaHora)
    fechaIngreso.setHours(fechaIngreso.getHours() + 2) // 2 horas después del parto
    
    episodiosURNIData.push({
      rnId: rn.id,
      fechaHoraIngreso: fechaIngreso,
      motivoIngreso: i === 0 
        ? 'Prematuridad - Requiere monitoreo en URNI'
        : i === 1
        ? 'Bajo peso al nacer - Control en UCIN'
        : 'Control neonatal rutinario',
      servicioUnidad: i === 0 ? 'URNI' : i === 1 ? 'UCIN' : 'NEONATOLOGIA',
      responsableClinicoId: medicoUser?.id || null,
      estado: i === 0 ? 'INGRESADO' : 'INGRESADO', // Todos ingresados para demostración
    })
  }

  const createdEpisodiosURNI = []
  for (const episodioData of episodiosURNIData) {
    try {
      // Verificar que no exista ya un episodio activo para este RN
      const episodioExistente = await prisma.episodioURNI.findFirst({
        where: {
          rnId: episodioData.rnId,
          estado: 'INGRESADO',
        },
      })

      if (!episodioExistente) {
        const episodio = await prisma.episodioURNI.create({
          data: {
            ...episodioData,
            createdById: administrativoUser?.id,
          },
        })
        createdEpisodiosURNI.push(episodio)
        const rn = recienNacidos2024.find(r => r.id === episodioData.rnId)
        console.log(`  ✓ Episodio URNI creado para RN de ${rn?.parto?.madre?.nombres} ${rn?.parto?.madre?.apellidos} - Estado: ${episodioData.estado}`)
      } else {
        console.log(`  ⏳ RN ya tiene un episodio activo, se omite`)
      }
    } catch (err) {
      console.error(`  ❌ Error creando episodio URNI:`, err)
    }
  }

  // Crear controles neonatales de ejemplo
  console.log('👩‍⚕️ Creating neonatal controls...')
  // Reutilizar enfermeraUser ya declarado anteriormente
  const createdControles = []
  
  // Crear controles para algunos RN con episodios URNI
  for (let i = 0; i < Math.min(createdEpisodiosURNI.length, 3); i++) {
    const episodio = createdEpisodiosURNI[i]
    const rn = recienNacidos2024.find(r => r.id === episodio.rnId)
    
    if (!rn) continue
    
    // Crear varios controles para cada episodio
    const tiposControles = ['SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION']
    const datosEjemplo = [
      { temp: 36.7, fc: 140, fr: 40, spo2: 98 },
      { glucemia: 85 },
      { tipo: 'Lactancia materna', cantidad: 30, unidad: 'ml' },
      { medicamento: 'Vitamina D', dosis: '400 UI', via: 'Oral' },
    ]
    
    for (let j = 0; j < Math.min(2, tiposControles.length); j++) {
      const fechaControl = new Date(episodio.fechaHoraIngreso)
      fechaControl.setHours(fechaControl.getHours() + (j + 1) * 4) // Cada 4 horas
      
      try {
        const control = await prisma.controlNeonatal.create({
          data: {
            rnId: rn.id,
            episodioUrniId: episodio.id,
            fechaHora: fechaControl,
            tipo: tiposControles[j],
            datos: datosEjemplo[j],
            observaciones: j === 0 
              ? 'Control rutinario - RN estable'
              : 'Seguimiento según protocolo',
            enfermeraId: enfermeraUser?.id || null,
          },
        })
        createdControles.push(control)
        console.log(`  ✓ Control ${tiposControles[j]} creado para RN de ${rn?.parto?.madre?.nombres} ${rn?.parto?.madre?.apellidos}`)
      } catch (err) {
        console.error(`  ❌ Error creando control neonatal:`, err)
      }
    }
  }
  
  // Crear algunos controles sin episodio URNI (para RN sin episodio activo)
  const rnSinEpisodio = recienNacidos2024.filter(rn => 
    !createdEpisodiosURNI.some(e => e.rnId === rn.id)
  ).slice(0, 2)
  
  for (const rn of rnSinEpisodio) {
    const fechaControl = new Date(rn.parto.fechaHora)
    fechaControl.setHours(fechaControl.getHours() + 6) // 6 horas después del parto
    
    try {
      const control = await prisma.controlNeonatal.create({
        data: {
          rnId: rn.id,
          episodioUrniId: null,
          fechaHora: fechaControl,
          tipo: 'SIGNOS_VITALES',
          datos: { temp: 36.8, fc: 135, fr: 38, spo2: 99 },
          observaciones: 'Control post-parto - RN en buen estado',
          enfermeraId: enfermeraUser?.id || null,
        },
      })
      createdControles.push(control)
      console.log(`  ✓ Control SIGNOS_VITALES creado para RN de ${rn?.parto?.madre?.nombres} ${rn?.parto?.madre?.apellidos} (sin episodio URNI)`)
    } catch (err) {
      console.error(`  ❌ Error creando control neonatal:`, err)
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
  console.log(`\n🏥 ${episodiosData.length} episodes (EpisodioMadre) created`)
  const informesCreados = createdEpisodios.filter(e => e.crearInforme).length
  const episodiosSinInforme = createdEpisodios.filter(e => !e.crearInforme).length
  console.log(`📄 ${informesCreados} discharge reports created`)
  console.log(`⏳ ${episodiosSinInforme} episodes left without reports (for demonstration)`)
  console.log(`\n🏥 ${createdEpisodiosURNI.length} URNI episodes created`)
  
  const controlesCreados = createdControles?.length || 0
  if (controlesCreados > 0) {
    console.log(`👩‍⚕️ ${controlesCreados} neonatal controls created`)
  }

  // ============================================
  // DATOS ADICIONALES PARA OCTUBRE 2025 - REPORTE REM COMPLETO
  // ============================================
  console.log('\n📅 Creating additional data for October 2025 (REM Report)...')

  // Crear más madres con diferentes características REM
  const madresOctubre2025 = [
    {
      rut: '66666666-6',
      nombres: 'Rosa',
      apellidos: 'Quispe Mamani',
      edad: 22,
      edadAnos: 22,
      telefono: '+56911111111',
      direccion: 'Comunidad Aymara, Región de Arica',
      fichaClinica: 'FC-2025-101',
      pertenenciaPuebloOriginario: true,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '77777777-7',
      nombres: 'María Elena',
      apellidos: 'García Hernández',
      edad: 19,
      edadAnos: 19,
      telefono: '+56922222222',
      direccion: 'Santiago Centro',
      fichaClinica: 'FC-2025-102',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: true,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '88888888-8',
      nombres: 'Catalina',
      apellidos: 'Morales Vega',
      edad: 16,
      edadAnos: 16,
      telefono: '+56933333333',
      direccion: 'Valparaíso',
      fichaClinica: 'FC-2025-103',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '99999999-0',
      nombres: 'Andrea',
      apellidos: 'Torres Rojas',
      edad: 38,
      edadAnos: 38,
      telefono: '+56944444444',
      direccion: 'Concepción',
      fichaClinica: 'FC-2025-104',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: true,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: true, // Para probar sección J
      controlPrenatal: true,
    },
    {
      rut: '10101010-1',
      nombres: 'Sofía',
      apellidos: 'López Martínez',
      edad: 24,
      edadAnos: 24,
      telefono: '+56955555555',
      direccion: 'La Serena',
      fichaClinica: 'FC-2025-105',
      pertenenciaPuebloOriginario: true,
      condicionMigrante: true,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: false, // Embarazo no controlado
    },
    {
      rut: '11111111-2',
      nombres: 'Paula',
      apellidos: 'Ramírez Soto',
      edad: 29,
      edadAnos: 29,
      telefono: '+56966666666',
      direccion: 'Temuco',
      fichaClinica: 'FC-2025-106',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: true,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '12121212-3',
      nombres: 'Daniela',
      apellidos: 'Castro Fuentes',
      edad: 26,
      edadAnos: 26,
      telefono: '+56977777777',
      direccion: 'Antofagasta',
      fichaClinica: 'FC-2025-107',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: true,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '13131313-4',
      nombres: 'Valentina',
      apellidos: 'Jiménez Díaz',
      edad: 31,
      edadAnos: 31,
      telefono: '+56988888888',
      direccion: 'Puerto Montt',
      fichaClinica: 'FC-2025-108',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '14141414-5',
      nombres: 'Camila',
      apellidos: 'Vargas Ríos',
      edad: 20,
      edadAnos: 20,
      telefono: '+56999999999',
      direccion: 'Iquique',
      fichaClinica: 'FC-2025-109',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
    {
      rut: '15151515-6',
      nombres: 'Isabella',
      apellidos: 'Moreno Campos',
      edad: 35,
      edadAnos: 35,
      telefono: '+56900000000',
      direccion: 'Rancagua',
      fichaClinica: 'FC-2025-110',
      pertenenciaPuebloOriginario: false,
      condicionMigrante: false,
      condicionDiscapacidad: false,
      condicionPrivadaLibertad: false,
      identidadTrans: false,
      hepatitisBPositiva: false,
      controlPrenatal: true,
    },
  ]

  const createdMadresOctubre = []
  for (const madreData of madresOctubre2025) {
    const madre = await prisma.madre.create({
      data: {
        rut: madreData.rut,
        nombres: madreData.nombres,
        apellidos: madreData.apellidos,
        edad: madreData.edad,
        edadAnos: madreData.edadAnos,
        telefono: madreData.telefono,
        direccion: madreData.direccion,
        fichaClinica: madreData.fichaClinica,
        pertenenciaPuebloOriginario: madreData.pertenenciaPuebloOriginario,
        condicionMigrante: madreData.condicionMigrante,
        condicionDiscapacidad: madreData.condicionDiscapacidad,
        condicionPrivadaLibertad: madreData.condicionPrivadaLibertad,
        identidadTrans: madreData.identidadTrans,
        hepatitisBPositiva: madreData.hepatitisBPositiva,
        controlPrenatal: madreData.controlPrenatal,
        createdById: matronaUser?.id,
      },
    })
    createdMadresOctubre.push(madre)
    console.log(`  ✓ Mother "${madreData.nombres} ${madreData.apellidos}" created`)
  }

  // Crear partos para octubre 2025 con diferentes características
  const partosOctubre2025 = [
    // Parto vaginal normal - Rosa Quispe (Pueblo Originario)
    {
      madre: createdMadresOctubre[0],
      fechaHora: new Date('2025-10-01T08:00:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 39,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: true,
      manejoDolorFarmacologico: false,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      contactoPielPielAcomp30min: false,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: true,
      anestesiaNeuroaxial: false,
      medidasNoFarmacologicasAnestesia: true,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    // Parto vaginal - María Elena García (Migrante)
    {
      madre: createdMadresOctubre[1],
      fechaHora: new Date('2025-10-02T14:30:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 38,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      contactoPielPielAcomp30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      medidasNoFarmacologicasAnestesia: false,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    // Parto prematuro <24 semanas - Catalina Morales (16 años)
    {
      madre: createdMadresOctubre[2],
      fechaHora: new Date('2025-10-03T10:15:00'),
      tipo: 'CESAREA_URGENCIA',
      lugar: 'PABELLON',
      edadGestacionalSemanas: 23,
      inicioTrabajoParto: 'ESPONTANEO',
      tipoCursoParto: 'DISTOCICO',
      anestesiaGeneral: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: false,
      contactoPielPielMadre30min: false,
      lactancia60minAlMenosUnRn: false,
      atencionPertinenciaCultural: false,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    // Parto prematuro 24-28 semanas - Andrea Torres (Hepatitis B positiva)
    {
      madre: createdMadresOctubre[3],
      fechaHora: new Date('2025-10-04T16:20:00'),
      tipo: 'CESAREA_ELECTIVA',
      lugar: 'PABELLON',
      edadGestacionalSemanas: 26,
      inicioTrabajoParto: 'INDUCIDO_FARMACOLOGICO',
      tipoCursoParto: 'EUTOCICO',
      anestesiaNeuroaxial: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: false,
      atencionPertinenciaCultural: false,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    // Parto prematuro 29-32 semanas - Sofía López (Pueblo Originario + Migrante)
    {
      madre: createdMadresOctubre[4],
      fechaHora: new Date('2025-10-05T09:45:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 31,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: true,
      libertadMovimiento: false,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: true,
      manejoDolorFarmacologico: false,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: false,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: true,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: false,
      lactancia60minAlMenosUnRn: false,
      atencionPertinenciaCultural: true,
      anestesiaNeuroaxial: false,
      medidasNoFarmacologicasAnestesia: true,
      planDeParto: false,
      embarazoNoControlado: true,
    },
    // Parto prematuro 33-36 semanas - Paula Ramírez (Privada de libertad)
    {
      madre: createdMadresOctubre[5],
      fechaHora: new Date('2025-10-06T11:30:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 35,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: false,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'LITOTOMIA',
      episiotomia: false,
      acompananteDuranteTrabajo: false,
      acompananteSoloExpulsivo: false,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: false,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      medidasNoFarmacologicasAnestesia: false,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    // Parto instrumental distócico - Daniela Castro (Trans)
    {
      madre: createdMadresOctubre[6],
      fechaHora: new Date('2025-10-07T13:00:00'),
      tipo: 'INSTRUMENTAL',
      tipoCursoParto: 'DISTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 40,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: true,
      libertadMovimiento: false,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'LITOTOMIA',
      episiotomia: true,
      acompananteDuranteTrabajo: true,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: true,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      medidasNoFarmacologicasAnestesia: false,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    // Parto vaginal normal ≥38 semanas - Valentina Jiménez
    {
      madre: createdMadresOctubre[7],
      fechaHora: new Date('2025-10-08T07:20:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 39,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: true,
      manejoDolorFarmacologico: false,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      contactoPielPielAcomp30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: false,
      medidasNoFarmacologicasAnestesia: true,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    // Parto inducido farmacológico - Camila Vargas (20 años)
    {
      madre: createdMadresOctubre[8],
      fechaHora: new Date('2025-10-09T15:45:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 41,
      inicioTrabajoParto: 'INDUCIDO_FARMACOLOGICO',
      conduccionOxitocica: true,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: true,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      medidasNoFarmacologicasAnestesia: false,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    // Parto ≥35 años - Isabella Moreno
    {
      madre: createdMadresOctubre[9],
      fechaHora: new Date('2025-10-10T12:00:00'),
      tipo: 'CESAREA_ELECTIVA',
      lugar: 'PABELLON',
      edadGestacionalSemanas: 38,
      inicioTrabajoParto: null,
      tipoCursoParto: 'EUTOCICO',
      anestesiaNeuroaxial: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    // Más partos para tener más datos
    {
      madre: createdMadresOctubre[0], // Rosa - segundo parto
      fechaHora: new Date('2025-10-12T10:00:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 37,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: true,
      medidasNoFarmacologicasAnestesia: true,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[1], // María Elena - segundo parto
      fechaHora: new Date('2025-10-14T08:30:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 38,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[7], // Valentina - segundo parto
      fechaHora: new Date('2025-10-16T14:15:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 40,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      medidasNoFarmacologicasAnestesia: true,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[8], // Camila - segundo parto
      fechaHora: new Date('2025-10-18T09:00:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 39,
      inicioTrabajoParto: 'INDUCIDO_MECANICO',
      conduccionOxitocica: true,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      oxitocinaProfilactica: true,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[9], // Isabella - segundo parto
      fechaHora: new Date('2025-10-20T11:30:00'),
      tipo: 'CESAREA_URGENCIA',
      lugar: 'PABELLON',
      edadGestacionalSemanas: 37,
      inicioTrabajoParto: 'ESPONTANEO',
      tipoCursoParto: 'DISTOCICO',
      anestesiaGeneral: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[2], // Catalina - segundo parto (prematuro 24-28)
      fechaHora: new Date('2025-10-22T16:00:00'),
      tipo: 'CESAREA_URGENCIA',
      lugar: 'PABELLON',
      edadGestacionalSemanas: 27,
      inicioTrabajoParto: 'ESPONTANEO',
      tipoCursoParto: 'DISTOCICO',
      anestesiaGeneral: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: false,
      contactoPielPielMadre30min: false,
      lactancia60minAlMenosUnRn: false,
      atencionPertinenciaCultural: false,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[3], // Andrea - segundo parto (prematuro 29-32)
      fechaHora: new Date('2025-10-24T13:45:00'),
      tipo: 'CESAREA_ELECTIVA',
      lugar: 'PABELLON',
      edadGestacionalSemanas: 30,
      inicioTrabajoParto: 'INDUCIDO_FARMACOLOGICO',
      tipoCursoParto: 'EUTOCICO',
      anestesiaNeuroaxial: true,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: false,
      atencionPertinenciaCultural: false,
      planDeParto: true,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[4], // Sofía - segundo parto (prematuro 33-36)
      fechaHora: new Date('2025-10-26T10:20:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 34,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: true,
      libertadMovimiento: true,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: true,
      posicionExpulsivo: 'OTRAS',
      episiotomia: false,
      acompananteDuranteTrabajo: true,
      oxitocinaProfilactica: true,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: false,
      lactancia60minAlMenosUnRn: false,
      atencionPertinenciaCultural: true,
      medidasNoFarmacologicasAnestesia: true,
      planDeParto: false,
      embarazoNoControlado: true,
    },
    {
      madre: createdMadresOctubre[5], // Paula - segundo parto
      fechaHora: new Date('2025-10-28T07:30:00'),
      tipo: 'VAGINAL',
      tipoCursoParto: 'EUTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 38,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: false,
      libertadMovimiento: true,
      regimenHidricoAmplio: false,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'LITOTOMIA',
      episiotomia: false,
      acompananteDuranteTrabajo: false,
      acompananteSoloExpulsivo: false,
      oxitocinaProfilactica: false,
      ligaduraTardiaCordon: false,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      planDeParto: false,
      embarazoNoControlado: false,
    },
    {
      madre: createdMadresOctubre[6], // Daniela - segundo parto (instrumental)
      fechaHora: new Date('2025-10-30T15:00:00'),
      tipo: 'INSTRUMENTAL',
      tipoCursoParto: 'DISTOCICO',
      lugar: 'SALA_PARTO',
      edadGestacionalSemanas: 39,
      inicioTrabajoParto: 'ESPONTANEO',
      conduccionOxitocica: true,
      libertadMovimiento: false,
      regimenHidricoAmplio: true,
      manejoDolorNoFarmacologico: false,
      manejoDolorFarmacologico: true,
      posicionExpulsivo: 'LITOTOMIA',
      episiotomia: true,
      acompananteDuranteTrabajo: true,
      acompananteSoloExpulsivo: true,
      oxitocinaProfilactica: true,
      ligaduraTardiaCordon: true,
      contactoPielPielMadre30min: true,
      lactancia60minAlMenosUnRn: true,
      atencionPertinenciaCultural: false,
      anestesiaNeuroaxial: true,
      planDeParto: true,
      embarazoNoControlado: false,
    },
  ]

  const createdPartosOctubre = []
  for (const partoData of partosOctubre2025) {
    const parto = await prisma.parto.create({
      data: {
        madreId: partoData.madre.id,
        fechaHora: partoData.fechaHora,
        tipo: partoData.tipo,
        tipoCursoParto: partoData.tipoCursoParto || null,
        lugar: partoData.lugar,
        edadGestacionalSemanas: partoData.edadGestacionalSemanas,
        inicioTrabajoParto: partoData.inicioTrabajoParto || null,
        conduccionOxitocica: partoData.conduccionOxitocica ?? null,
        libertadMovimiento: partoData.libertadMovimiento ?? null,
        regimenHidricoAmplio: partoData.regimenHidricoAmplio ?? null,
        manejoDolorNoFarmacologico: partoData.manejoDolorNoFarmacologico ?? null,
        manejoDolorFarmacologico: partoData.manejoDolorFarmacologico ?? null,
        posicionExpulsivo: partoData.posicionExpulsivo || null,
        episiotomia: partoData.episiotomia ?? null,
        acompananteDuranteTrabajo: partoData.acompananteDuranteTrabajo ?? null,
        acompananteSoloExpulsivo: partoData.acompananteSoloExpulsivo ?? null,
        oxitocinaProfilactica: partoData.oxitocinaProfilactica ?? null,
        ligaduraTardiaCordon: partoData.ligaduraTardiaCordon ?? null,
        contactoPielPielMadre30min: partoData.contactoPielPielMadre30min ?? null,
        contactoPielPielAcomp30min: partoData.contactoPielPielAcomp30min ?? null,
        lactancia60minAlMenosUnRn: partoData.lactancia60minAlMenosUnRn ?? null,
        atencionPertinenciaCultural: partoData.atencionPertinenciaCultural ?? null,
        anestesiaNeuroaxial: partoData.anestesiaNeuroaxial ?? null,
        anestesiaGeneral: partoData.anestesiaGeneral ?? null,
        medidasNoFarmacologicasAnestesia: partoData.medidasNoFarmacologicasAnestesia ?? null,
        planDeParto: partoData.planDeParto ?? null,
        embarazoNoControlado: partoData.embarazoNoControlado ?? null,
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
    createdPartosOctubre.push(parto)
    console.log(`  ✓ Birth created for "${partoData.madre.nombres} ${partoData.madre.apellidos}" (${partoData.tipo})`)
  }

  // Crear recién nacidos con diferentes características
  const recienNacidosOctubre2025 = [
    // Rosa Quispe - RN normal peso 3000-3999
    {
      parto: createdPartosOctubre[0],
      sexo: 'M',
      pesoNacimientoGramos: 3250,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 50,
      apgar1Min: 9,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: true,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    // María Elena García - RN normal peso 2500-2999
    {
      parto: createdPartosOctubre[1],
      sexo: 'F',
      pesoNacimientoGramos: 2750,
      categoriaPeso: 'RANGO_2500_2999',
      tallaCm: 48,
      apgar1Min: 8,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: true,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    // Catalina Morales - RN prematuro <500g (muy prematuro)
    {
      parto: createdPartosOctubre[2],
      sexo: 'F',
      pesoNacimientoGramos: 480,
      categoriaPeso: 'MENOR_500',
      tallaCm: 25,
      apgar1Min: 2,
      apgar5Min: 4,
      esNacidoVivo: true,
      anomaliaCongenita: true,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: true,
      reanimacionAvanzada: true,
      ehiGradoII_III: true,
      lactancia60Min: false,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: false,
    },
    // Andrea Torres - RN prematuro 500-999g (hijo de madre Hepatitis B positiva)
    {
      parto: createdPartosOctubre[3],
      sexo: 'M',
      pesoNacimientoGramos: 850,
      categoriaPeso: 'RANGO_500_999',
      tallaCm: 32,
      apgar1Min: 3,
      apgar5Min: 5,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      profilaxisCompletaHepatitisB: true,
      hijoMadreHepatitisBPositiva: true,
      reanimacionBasica: true,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: false,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: true,
    },
    // Sofía López - RN prematuro 1000-1499g
    {
      parto: createdPartosOctubre[4],
      sexo: 'F',
      pesoNacimientoGramos: 1250,
      categoriaPeso: 'RANGO_1000_1499',
      tallaCm: 38,
      apgar1Min: 5,
      apgar5Min: 7,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: true,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: false,
      esPuebloOriginario: true,
      esMigrante: true,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: false,
    },
    // Paula Ramírez - RN prematuro 1500-1999g
    {
      parto: createdPartosOctubre[5],
      sexo: 'M',
      pesoNacimientoGramos: 1750,
      categoriaPeso: 'RANGO_1500_1999',
      tallaCm: 42,
      apgar1Min: 6,
      apgar5Min: 8,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: false,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: true,
    },
    // Daniela Castro - RN normal peso 2000-2499g
    {
      parto: createdPartosOctubre[6],
      sexo: 'F',
      pesoNacimientoGramos: 2250,
      categoriaPeso: 'RANGO_2000_2499',
      tallaCm: 45,
      apgar1Min: 7,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    // Valentina Jiménez - RN normal peso 3000-3999
    {
      parto: createdPartosOctubre[7],
      sexo: 'M',
      pesoNacimientoGramos: 3450,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 51,
      apgar1Min: 9,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    // Camila Vargas - RN normal peso 4000 y más
    {
      parto: createdPartosOctubre[8],
      sexo: 'M',
      pesoNacimientoGramos: 4200,
      categoriaPeso: 'RANGO_4000_MAS',
      tallaCm: 53,
      apgar1Min: 8,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    // Isabella Moreno - RN normal peso 3000-3999
    {
      parto: createdPartosOctubre[9],
      sexo: 'F',
      pesoNacimientoGramos: 3100,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 49,
      apgar1Min: 9,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    // Más recién nacidos para los partos adicionales
    {
      parto: createdPartosOctubre[10], // Rosa - segundo parto
      sexo: 'F',
      pesoNacimientoGramos: 2950,
      categoriaPeso: 'RANGO_2500_2999',
      tallaCm: 48,
      apgar1Min: 9,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: true,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[11], // María Elena - segundo parto
      sexo: 'M',
      pesoNacimientoGramos: 2800,
      categoriaPeso: 'RANGO_2500_2999',
      tallaCm: 47,
      apgar1Min: 8,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: true,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[12], // Valentina - segundo parto
      sexo: 'F',
      pesoNacimientoGramos: 3300,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 50,
      apgar1Min: 9,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[13], // Camila - segundo parto
      sexo: 'M',
      pesoNacimientoGramos: 3600,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 52,
      apgar1Min: 9,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[14], // Isabella - segundo parto
      sexo: 'F',
      pesoNacimientoGramos: 3200,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 49,
      apgar1Min: 8,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[15], // Catalina - segundo parto (prematuro 24-28)
      sexo: 'M',
      pesoNacimientoGramos: 950,
      categoriaPeso: 'RANGO_500_999',
      tallaCm: 33,
      apgar1Min: 4,
      apgar5Min: 6,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: true,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: false,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: false,
    },
    {
      parto: createdPartosOctubre[16], // Andrea - segundo parto (prematuro 29-32)
      sexo: 'F',
      pesoNacimientoGramos: 1350,
      categoriaPeso: 'RANGO_1000_1499',
      tallaCm: 39,
      apgar1Min: 6,
      apgar5Min: 8,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      profilaxisCompletaHepatitisB: true,
      hijoMadreHepatitisBPositiva: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: false,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[17], // Sofía - segundo parto (prematuro 33-36)
      sexo: 'M',
      pesoNacimientoGramos: 1950,
      categoriaPeso: 'RANGO_1500_1999',
      tallaCm: 43,
      apgar1Min: 7,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: false,
      esPuebloOriginario: true,
      esMigrante: true,
      alojamientoConjuntoInmediato: false,
      contactoPielPielInmediato: false,
    },
    {
      parto: createdPartosOctubre[18], // Paula - segundo parto
      sexo: 'F',
      pesoNacimientoGramos: 2900,
      categoriaPeso: 'RANGO_2500_2999',
      tallaCm: 48,
      apgar1Min: 8,
      apgar5Min: 9,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
    {
      parto: createdPartosOctubre[19], // Daniela - segundo parto (instrumental)
      sexo: 'M',
      pesoNacimientoGramos: 3800,
      categoriaPeso: 'RANGO_3000_3999',
      tallaCm: 52,
      apgar1Min: 8,
      apgar5Min: 10,
      esNacidoVivo: true,
      anomaliaCongenita: false,
      profilaxisHepatitisB: true,
      profilaxisOcularGonorrea: true,
      reanimacionBasica: false,
      reanimacionAvanzada: false,
      ehiGradoII_III: false,
      lactancia60Min: true,
      esPuebloOriginario: false,
      esMigrante: false,
      alojamientoConjuntoInmediato: true,
      contactoPielPielInmediato: true,
    },
  ]

  for (const rnData of recienNacidosOctubre2025) {
    const recienNacido = await prisma.recienNacido.create({
      data: {
        partoId: rnData.parto.id,
        sexo: rnData.sexo,
        pesoNacimientoGramos: rnData.pesoNacimientoGramos,
        categoriaPeso: rnData.categoriaPeso,
        tallaCm: rnData.tallaCm,
        apgar1Min: rnData.apgar1Min,
        apgar5Min: rnData.apgar5Min,
        esNacidoVivo: rnData.esNacidoVivo,
        anomaliaCongenita: rnData.anomaliaCongenita,
        profilaxisHepatitisB: rnData.profilaxisHepatitisB,
        profilaxisOcularGonorrea: rnData.profilaxisOcularGonorrea,
        profilaxisCompletaHepatitisB: rnData.profilaxisCompletaHepatitisB || null,
        hijoMadreHepatitisBPositiva: rnData.hijoMadreHepatitisBPositiva || null,
        reanimacionBasica: rnData.reanimacionBasica,
        reanimacionAvanzada: rnData.reanimacionAvanzada,
        ehiGradoII_III: rnData.ehiGradoII_III,
        lactancia60Min: rnData.lactancia60Min,
        esPuebloOriginario: rnData.esPuebloOriginario,
        esMigrante: rnData.esMigrante,
        alojamientoConjuntoInmediato: rnData.alojamientoConjuntoInmediato,
        contactoPielPielInmediato: rnData.contactoPielPielInmediato,
        createdById: matronaUser?.id,
      },
    })
    console.log(`  ✓ Newborn created (${rnData.sexo}) - Peso: ${rnData.pesoNacimientoGramos}g, Categoría: ${rnData.categoriaPeso}`)
  }

  // Crear complicaciones obstétricas
  console.log('⚠️  Creating obstetric complications...')
  const complicacionesData = [
    {
      parto: createdPartosOctubre[2], // Catalina - parto prematuro
      tipo: 'HPP_RESTOS',
      contexto: 'CESAREA_URGENCIA',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-03T10:30:00'),
    },
    {
      parto: createdPartosOctubre[3], // Andrea - cesárea electiva
      tipo: 'PREECLAMPSIA_SEVERA',
      contexto: 'CESAREA_ELECTIVA',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-04T16:30:00'),
    },
    {
      parto: createdPartosOctubre[4], // Sofía - parto vaginal
      tipo: 'HPP_INERCIA',
      contexto: 'PARTO_INDUCIDO_INSTITUCIONAL',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-05T10:00:00'),
    },
    {
      parto: createdPartosOctubre[5], // Paula - parto vaginal
      tipo: 'SEPSIS_SISTEMICA_GRAVE',
      contexto: 'PARTO_ESPONTANEO_INSTITUCIONAL',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-06T12:00:00'),
    },
    {
      parto: createdPartosOctubre[6], // Daniela - parto instrumental
      tipo: 'HPP_TRAUMA',
      contexto: 'DISTOCICO_ESPONTANEO',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-07T13:30:00'),
    },
    {
      parto: createdPartosOctubre[14], // Isabella - cesárea urgencia
      tipo: 'PREECLAMPSIA_SEVERA',
      contexto: 'CESAREA_URGENCIA',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-20T12:00:00'),
    },
    {
      parto: createdPartosOctubre[14], // Isabella - segunda complicación
      tipo: 'SEPSIS_SISTEMICA_GRAVE',
      contexto: 'CESAREA_URGENCIA',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-20T13:00:00'),
    },
    {
      parto: createdPartosOctubre[4], // Sofía - segunda complicación
      tipo: 'HPP_RESTOS',
      contexto: 'EUTOCICO_INDUCIDO',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-05T11:00:00'),
    },
    {
      parto: createdPartosOctubre[5], // Paula - segunda complicación
      tipo: 'ANEMIA_SEVERA_TRANSFUSION',
      contexto: 'EUTOCICO_ESPONTANEO',
      requiereTransfusion: true,
      fechaComplicacion: new Date('2025-10-06T13:00:00'),
    },
    {
      parto: createdPartosOctubre[6], // Daniela - segunda complicación
      tipo: 'MANEJO_QUIRURGICO_INERCIA',
      contexto: 'DISTOCICO_INDUCIDO',
      requiereTransfusion: false,
      fechaComplicacion: new Date('2025-10-07T14:00:00'),
    },
  ]

  for (const compData of complicacionesData) {
    try {
      await prisma.complicacionObstetrica.create({
        data: {
          partoId: compData.parto.id,
          tipo: compData.tipo,
          contexto: compData.contexto,
          requiereTransfusion: compData.requiereTransfusion,
          fechaComplicacion: compData.fechaComplicacion,
        },
      })
      console.log(`  ✓ Complication "${compData.tipo}" created`)
    } catch (err) {
      console.error(`  ❌ Error creating complication:`, err)
    }
  }

  // Crear esterilizaciones quirúrgicas
  console.log('🔬 Creating surgical sterilizations...')
  const esterilizacionesData = [
    {
      fecha: new Date('2025-10-01T10:00:00'),
      sexo: 'F',
      edadAnos: 22,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: true,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[0].id,
    },
    {
      fecha: new Date('2025-10-02T15:00:00'),
      sexo: 'F',
      edadAnos: 19,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: false,
      esMigrante: true,
      vinculoConParto: true,
      partoId: createdPartosOctubre[1].id,
    },
    {
      fecha: new Date('2025-10-08T08:00:00'),
      sexo: 'F',
      edadAnos: 31,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: false,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[7].id,
    },
    {
      fecha: new Date('2025-10-10T13:00:00'),
      sexo: 'F',
      edadAnos: 35,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: false,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[9].id,
    },
    {
      fecha: new Date('2025-10-12T11:00:00'),
      sexo: 'F',
      edadAnos: 22,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: true,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[10].id,
    },
    {
      fecha: new Date('2025-10-16T15:00:00'),
      sexo: 'F',
      edadAnos: 31,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: false,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[12].id,
    },
    {
      fecha: new Date('2025-10-20T12:00:00'),
      sexo: 'F',
      edadAnos: 35,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: false,
      esPuebloOriginario: false,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[14].id,
    },
    {
      fecha: new Date('2025-10-07T14:00:00'),
      sexo: 'F',
      edadAnos: 26,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: true,
      esPuebloOriginario: false,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[6].id,
    },
    {
      fecha: new Date('2025-10-30T16:00:00'),
      sexo: 'F',
      edadAnos: 26,
      tipo: 'LIGADURA_TUBARIA',
      condicionTrans: true,
      esPuebloOriginario: false,
      esMigrante: false,
      vinculoConParto: true,
      partoId: createdPartosOctubre[19].id,
    },
  ]

  for (const esterData of esterilizacionesData) {
    try {
      await prisma.esterilizacionQuirurgica.create({
        data: {
          fecha: esterData.fecha,
          sexo: esterData.sexo,
          edadAnos: esterData.edadAnos,
          tipo: esterData.tipo,
          condicionTrans: esterData.condicionTrans,
          esPuebloOriginario: esterData.esPuebloOriginario,
          esMigrante: esterData.esMigrante,
          vinculoConParto: esterData.vinculoConParto,
          partoId: esterData.partoId,
        },
      })
      console.log(`  ✓ Sterilization created (${esterData.sexo}, ${esterData.edadAnos} años)`)
    } catch (err) {
      console.error(`  ❌ Error creating sterilization:`, err)
    }
  }

  console.log(`\n✅ October 2025 data created successfully!`)
  console.log(`  👩 ${createdMadresOctubre.length} additional mothers`)
  console.log(`  👶 ${createdPartosOctubre.length} additional births`)
  console.log(`  👼 ${recienNacidosOctubre2025.length} additional newborns`)
  console.log(`  ⚠️  ${complicacionesData.length} complications`)
  console.log(`  🔬 ${esterilizacionesData.length} sterilizations`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

