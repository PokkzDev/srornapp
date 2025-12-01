import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker/locale/es_MX'

const prisma = new PrismaClient()

// ================================
// CONFIGURACIÓN DE GENERACIÓN
// ================================
// Un hospital regional de Chile atiende aprox. 3000-5000 partos al año
// Esto significa ~250-400 partos mensuales
const CONFIG = {
  // Número de registros a generar
  MADRES_COUNT: 500,           // Madres totales a generar (muchas con múltiples partos)
  PARTOS_POR_MADRE_MAX: 2,     // Máximo de partos por madre en el año
  PROB_GEMELOS: 0.035,         // 3.5% de probabilidad de gemelos (realista)
  PROB_TRILLIZOS: 0.002,       // 0.2% de probabilidad de trillizos
  
  // Rango de fechas
  FECHA_INICIO: new Date('2025-01-01T00:00:00'),
  FECHA_FIN: new Date('2025-12-31T23:59:59'),
}

// ================================
// UTILIDADES
// ================================

// Generar RUT chileno válido
function generateRut() {
  const num = faker.number.int({ min: 6000000, max: 25000000 })
  const dv = calculateDV(num)
  return `${num}-${dv}`
}

function calculateDV(rut) {
  let sum = 0
  let mul = 2
  let rutStr = rut.toString()
  
  for (let i = rutStr.length - 1; i >= 0; i--) {
    sum += parseInt(rutStr[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  
  const remainder = sum % 11
  const dv = 11 - remainder
  
  if (dv === 11) return '0'
  if (dv === 10) return 'K'
  return dv.toString()
}

// Generar fecha aleatoria en rango
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Generar fecha en un mes específico de 2025
function randomDateInMonth(month) {
  const year = 2025
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const day = faker.number.int({ min: 1, max: daysInMonth })
  const hour = faker.number.int({ min: 0, max: 23 })
  const minute = faker.number.int({ min: 0, max: 59 })
  return new Date(year, month, day, hour, minute)
}

// Selección aleatoria de array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Probabilidad booleana
function randomBool(probability = 0.5) {
  return Math.random() < probability
}

// ================================
// GENERADORES DE DATOS
// ================================

// Contador global para ficha clínica única
let fichaClinicaCounter = 1

function generateMadre(usedRuts) {
  let rut
  do {
    rut = generateRut()
  } while (usedRuts.has(rut))
  usedRuts.add(rut)

  const edad = faker.number.int({ min: 15, max: 45 })
  const fechaNacimiento = new Date()
  fechaNacimiento.setFullYear(fechaNacimiento.getFullYear() - edad)

  // Nombres chilenos comunes
  const nombresChilenos = [
    'María', 'Ana', 'Sofía', 'Valentina', 'Catalina', 'Constanza', 'Francisca',
    'Javiera', 'Antonia', 'Fernanda', 'Camila', 'Martina', 'Isidora', 'Florencia',
    'Josefa', 'Agustina', 'Amanda', 'Trinidad', 'Macarena', 'Paula', 'Daniela',
    'Carolina', 'Gabriela', 'Nicole', 'Andrea', 'Claudia', 'Lorena', 'Patricia',
    'Rosa', 'Carmen', 'Lucía', 'Elena', 'Isabella', 'Victoria', 'Alejandra'
  ]
  
  const apellidosChilenos = [
    'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras',
    'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes',
    'Hernández', 'García', 'Garrido', 'Bravo', 'Reyes', 'Núñez', 'Jara',
    'Vera', 'Torres', 'Araya', 'Figueroa', 'Espinoza', 'Riquelme', 'Vargas',
    'Castro', 'Tapia', 'Sandoval', 'Carrasco', 'Aravena', 'Cárdenas', 'Vega',
    'Quispe', 'Mamani', 'Huanca', 'Condori' // Apellidos de pueblos originarios
  ]

  const regiones = [
    'Santiago Centro', 'Providencia', 'Las Condes', 'Maipú', 'Puente Alto',
    'La Florida', 'Valparaíso', 'Viña del Mar', 'Concepción', 'Temuco',
    'Antofagasta', 'Iquique', 'La Serena', 'Rancagua', 'Talca',
    'Puerto Montt', 'Arica', 'Coyhaique', 'Punta Arenas', 'Osorno'
  ]

  const nombre = randomChoice(nombresChilenos)
  const segundoNombre = randomBool(0.7) ? randomChoice(nombresChilenos) : ''
  const nombres = segundoNombre ? `${nombre} ${segundoNombre}` : nombre
  
  // Generar ficha clínica única usando contador
  const fichaClinica = `FC-2025-${String(fichaClinicaCounter++).padStart(5, '0')}`

  return {
    rut,
    nombres,
    apellidos: `${randomChoice(apellidosChilenos)} ${randomChoice(apellidosChilenos)}`,
    edad,
    edadAnos: edad,
    fechaNacimiento,
    telefono: `+569${faker.number.int({ min: 10000000, max: 99999999 })}`,
    direccion: `${faker.location.streetAddress()}, ${randomChoice(regiones)}`,
    fichaClinica,
    pertenenciaPuebloOriginario: randomBool(0.12), // 12% población originaria en Chile
    condicionMigrante: randomBool(0.08), // 8% migrantes
    condicionDiscapacidad: randomBool(0.03),
    condicionPrivadaLibertad: randomBool(0.01),
    identidadTrans: randomBool(0.005),
    hepatitisBPositiva: randomBool(0.02),
    controlPrenatal: randomBool(0.92), // 92% con control prenatal
  }
}

function generateParto(madre, fechaParto, matronaId, medicoId, enfermeraId) {
  const tipos = ['VAGINAL', 'VAGINAL', 'VAGINAL', 'VAGINAL', 'CESAREA_ELECTIVA', 'CESAREA_URGENCIA', 'INSTRUMENTAL']
  const tipo = randomChoice(tipos)
  
  const isCesarea = tipo.includes('CESAREA')
  const lugar = isCesarea ? 'PABELLON' : (randomBool(0.95) ? 'SALA_PARTO' : randomChoice(['DOMICILIO', 'OTRO']))
  
  // Edad gestacional - distribución realista
  let edadGestacional
  const rand = Math.random()
  if (rand < 0.02) edadGestacional = faker.number.int({ min: 22, max: 27 }) // Muy prematuro
  else if (rand < 0.05) edadGestacional = faker.number.int({ min: 28, max: 32 }) // Prematuro
  else if (rand < 0.12) edadGestacional = faker.number.int({ min: 33, max: 36 }) // Prematuro tardío
  else if (rand < 0.95) edadGestacional = faker.number.int({ min: 37, max: 41 }) // A término
  else edadGestacional = faker.number.int({ min: 42, max: 43 }) // Post término

  const inicioTrabajoPartoOpciones = ['ESPONTANEO', 'ESPONTANEO', 'ESPONTANEO', 'INDUCIDO_FARMACOLOGICO', 'INDUCIDO_MECANICO']
  
  const tipoCursoParto = isCesarea ? null : (tipo === 'INSTRUMENTAL' ? 'DISTOCICO' : (randomBool(0.85) ? 'EUTOCICO' : 'DISTOCICO'))

  return {
    madreId: madre.id,
    fechaHora: fechaParto,
    fechaParto: fechaParto,
    tipo,
    tipoCursoParto,
    lugar,
    edadGestacionalSemanas: edadGestacional,
    inicioTrabajoParto: isCesarea && tipo === 'CESAREA_ELECTIVA' ? null : randomChoice(inicioTrabajoPartoOpciones),
    conduccionOxitocica: isCesarea ? null : randomBool(0.25),
    libertadMovimiento: isCesarea ? null : randomBool(0.70),
    regimenHidricoAmplio: isCesarea ? null : randomBool(0.65),
    manejoDolorNoFarmacologico: randomBool(0.40),
    manejoDolorFarmacologico: randomBool(0.50),
    posicionExpulsivo: isCesarea ? null : (randomBool(0.60) ? 'OTRAS' : 'LITOTOMIA'),
    episiotomia: isCesarea ? null : randomBool(0.15),
    anestesiaNeuroaxial: isCesarea ? randomBool(0.85) : randomBool(0.35),
    anestesiaGeneral: isCesarea ? randomBool(0.15) : randomBool(0.02),
    anestesiaLocal: !isCesarea && randomBool(0.10),
    medidasNoFarmacologicasAnestesia: randomBool(0.45),
    acompananteDuranteTrabajo: randomBool(0.75),
    acompananteSoloExpulsivo: randomBool(0.80),
    oxitocinaProfilactica: randomBool(0.60),
    ligaduraTardiaCordon: randomBool(0.75),
    atencionPertinenciaCultural: madre.pertenenciaPuebloOriginario ? randomBool(0.80) : randomBool(0.10),
    contactoPielPielMadre30min: edadGestacional >= 34 ? randomBool(0.85) : randomBool(0.40),
    contactoPielPielAcomp30min: randomBool(0.50),
    lactancia60minAlMenosUnRn: edadGestacional >= 34 ? randomBool(0.80) : randomBool(0.30),
    planDeParto: randomBool(0.35),
    entregaPlacentaSolicitud: randomBool(0.15),
    embarazoNoControlado: !madre.controlPrenatal,
    createdById: matronaId,
  }
}

function generateRecienNacido(parto, madre, matronaId) {
  const sexo = randomChoice(['M', 'F'])
  
  // Peso basado en edad gestacional
  let pesoBase
  const eg = parto.edadGestacionalSemanas || 39
  if (eg < 28) pesoBase = faker.number.int({ min: 400, max: 1200 })
  else if (eg < 32) pesoBase = faker.number.int({ min: 800, max: 2000 })
  else if (eg < 37) pesoBase = faker.number.int({ min: 1500, max: 2800 })
  else pesoBase = faker.number.int({ min: 2400, max: 4500 })

  // Variación de peso
  const peso = pesoBase + faker.number.int({ min: -200, max: 200 })
  
  // Categoría de peso
  let categoriaPeso
  if (peso < 500) categoriaPeso = 'MENOR_500'
  else if (peso < 1000) categoriaPeso = 'RANGO_500_999'
  else if (peso < 1500) categoriaPeso = 'RANGO_1000_1499'
  else if (peso < 2000) categoriaPeso = 'RANGO_1500_1999'
  else if (peso < 2500) categoriaPeso = 'RANGO_2000_2499'
  else if (peso < 3000) categoriaPeso = 'RANGO_2500_2999'
  else if (peso < 4000) categoriaPeso = 'RANGO_3000_3999'
  else categoriaPeso = 'RANGO_4000_MAS'

  // Talla basada en peso
  const talla = Math.round(peso / 70 + faker.number.int({ min: -3, max: 3 }))

  // APGAR basado en prematuridad
  let apgar1, apgar5
  if (eg < 28) {
    apgar1 = faker.number.int({ min: 2, max: 6 })
    apgar5 = faker.number.int({ min: 4, max: 8 })
  } else if (eg < 34) {
    apgar1 = faker.number.int({ min: 5, max: 8 })
    apgar5 = faker.number.int({ min: 7, max: 9 })
  } else {
    apgar1 = faker.number.int({ min: 7, max: 9 })
    apgar5 = faker.number.int({ min: 8, max: 10 })
  }

  const needsResuscitation = apgar1 < 7 || eg < 34

  return {
    partoId: parto.id,
    sexo,
    pesoNacimientoGramos: peso,
    categoriaPeso,
    tallaCm: talla,
    apgar1Min: apgar1,
    apgar5Min: apgar5,
    esNacidoVivo: randomBool(0.995), // 99.5% nacidos vivos
    anomaliaCongenita: randomBool(0.03),
    anomaliaCongenitaDescripcion: randomBool(0.03) ? faker.lorem.sentence() : null,
    profilaxisOcularGonorrea: randomBool(0.98),
    profilaxisHepatitisB: randomBool(0.97),
    profilaxisCompletaHepatitisB: madre.hepatitisBPositiva ? randomBool(0.95) : null,
    hijoMadreHepatitisBPositiva: madre.hepatitisBPositiva,
    reanimacionBasica: needsResuscitation ? randomBool(0.60) : randomBool(0.05),
    reanimacionAvanzada: needsResuscitation ? randomBool(0.20) : randomBool(0.01),
    ehiGradoII_III: needsResuscitation ? randomBool(0.05) : false,
    lactancia60Min: eg >= 34 ? randomBool(0.80) : randomBool(0.20),
    alojamientoConjuntoInmediato: eg >= 35 && peso >= 2000 ? randomBool(0.85) : randomBool(0.30),
    contactoPielPielInmediato: eg >= 34 ? randomBool(0.85) : randomBool(0.40),
    esPuebloOriginario: madre.pertenenciaPuebloOriginario,
    esMigrante: madre.condicionMigrante,
    createdById: matronaId,
  }
}

// Tipos de complicaciones
const TIPOS_COMPLICACION = [
  'HPP_INERCIA', 'HPP_RESTOS', 'HPP_TRAUMA', 'DESGARROS_III_IV',
  'ALTERACION_COAGULACION', 'PREECLAMPSIA_SEVERA', 'ECLAMPSIA',
  'SEPSIS_SISTEMICA_GRAVE', 'MANEJO_QUIRURGICO_INERCIA',
  'HISTERCTOMIA_OBSTETRICA', 'ANEMIA_SEVERA_TRANSFUSION'
]

const CONTEXTOS_COMPLICACION = [
  'PARTO_ESPONTANEO_INSTITUCIONAL', 'PARTO_INDUCIDO_INSTITUCIONAL',
  'CESAREA_URGENCIA', 'CESAREA_ELECTIVA', 'PARTO_DOMICILIO',
  'EUTOCICO_ESPONTANEO', 'EUTOCICO_INDUCIDO',
  'DISTOCICO_ESPONTANEO', 'DISTOCICO_INDUCIDO'
]

// ================================
// FUNCIÓN PRINCIPAL
// ================================
async function main() {
  console.log('🌱 Starting seed with Faker...')
  console.log(`📊 Configuration:`)
  console.log(`   - Mothers to generate: ${CONFIG.MADRES_COUNT}`)
  console.log(`   - Date range: ${CONFIG.FECHA_INICIO.toISOString().split('T')[0]} to ${CONFIG.FECHA_FIN.toISOString().split('T')[0]}`)

  // Truncate all tables before seeding
  console.log('\n🗑️  Truncating all tables...')
  
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`
  
  const tables = [
    'InformeAlta',
    'AtencionURNI',
    'ControlNeonatal',
    'EpisodioURNI',
    'ComplicacionObstetrica',
    'EsterilizacionQuirurgica',
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
      console.log(`  ⚠ Skipped table: ${table} (may not exist)`)
    }
  }
  
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`
  console.log('✅ Tables truncated successfully\n')

  // ================================
  // CREAR ROLES Y PERMISOS
  // ================================
  const roles = [
    { name: 'matrona', description: 'Matrona - Profesional de salud especializado en atención materno-infantil' },
    { name: 'medico', description: 'Médico - Profesional médico' },
    { name: 'enfermera', description: 'Enfermera - Profesional de enfermería' },
    { name: 'administrativo', description: 'Administrativo - Personal administrativo' },
    { name: 'jefatura', description: 'Jefatura - Personal de jefatura y dirección' },
    { name: 'administrador_ti', description: 'Administrador TI - Departamento de Tecnologías de la Información' },
  ]

  console.log('📝 Creating roles...')
  const createdRoles = {}
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: { name: roleData.name, description: roleData.description, isSystem: true },
    })
    createdRoles[roleData.name] = role
    console.log(`  ✓ Role "${roleData.name}" created`)
  }

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
    { code: 'recien_nacido:create', description: 'Registrar recién nacido (legacy)' },
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

  console.log('🔐 Creating permissions...')
  const createdPermissions = {}
  for (const permData of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: permData.code },
      update: { description: permData.description },
      create: { code: permData.code, description: permData.description },
    })
    createdPermissions[permData.code] = permission
  }
  console.log(`  ✓ ${permissions.length} permissions created`)

  const rolePermissions = {
    matrona: [
      'madre:view', 'madre:create', 'madre:update', 'madre:delete',
      'parto:view', 'parto:create', 'parto:update', 'parto:delete',
      'recien-nacido:view', 'recien-nacido:create', 'recien-nacido:update', 'recien-nacido:delete',
      'recien_nacido:create', 'registro_clinico:edit', 'fichas:view', 'informe_alta:generate',
      'urni:episodio:create', 'urni:read', 'ingreso_alta:view', 'ingreso_alta:create', 'ingreso_alta:update',
    ],
    medico: [
      'registro_clinico:edit', 'fichas:view', 'atencion_urn:create', 'modulo_alta:aprobar',
      'urni:atencion:create', 'urni:atencion:view', 'urni:read', 'alta:manage', 'recien-nacido:view',
    ],
    enfermera: [
      'fichas:view', 'control_neonatal:create', 'control_neonatal:view',
      'control_neonatal:update', 'control_neonatal:delete', 'urni:read',
    ],
    administrativo: [
      'reporte_rem:generate', 'madre:view_limited', 'madre:create_limited',
      'madre:update_limited', 'madre:delete_limited', 'alta:manage',
    ],
    jefatura: ['auditoria:review', 'indicadores:consult', 'urni:atencion:view'],
    administrador_ti: ['user:create', 'user:view', 'user:update', 'user:delete', 'user:manage'],
  }

  console.log('🔗 Assigning permissions to roles...')
  for (const [roleName, permissionCodes] of Object.entries(rolePermissions)) {
    const role = createdRoles[roleName]
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    for (const permCode of permissionCodes) {
      const permission = createdPermissions[permCode]
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      })
    }
  }
  console.log('  ✓ Permissions assigned to roles')

  // ================================
  // CREAR USUARIOS
  // ================================
  const passwordHash = await bcrypt.hash('Asdf1234', 10)

  const users = [
    { rut: '12345678-9', nombre: 'María González', email: 'matrona@srorn.cl', role: 'matrona' },
    { rut: '23456789-0', nombre: 'Dr. Carlos Pérez', email: 'medico@srorn.cl', role: 'medico' },
    { rut: '34567890-1', nombre: 'Ana Martínez', email: 'enfermera@srorn.cl', role: 'enfermera' },
    { rut: '45678901-2', nombre: 'Roberto Silva', email: 'administrativo@srorn.cl', role: 'administrativo' },
    { rut: '56789012-3', nombre: 'Dra. Patricia López', email: 'jefatura@srorn.cl', role: 'jefatura' },
    { rut: '99999999-9', nombre: 'Departamento TI', email: 'ti@srorn.cl', role: 'administrador_ti' },
  ]

  console.log('👤 Creating users...')
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { nombre: userData.nombre, passwordHash, activo: true },
      create: { rut: userData.rut, nombre: userData.nombre, email: userData.email, passwordHash, activo: true },
    })
    const role = createdRoles[userData.role]
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    })
    console.log(`  ✓ User "${userData.nombre}" (${userData.email})`)
  }

  // Obtener usuarios para referencias
  const matronaUser = await prisma.user.findFirst({ where: { email: 'matrona@srorn.cl' } })
  const medicoUser = await prisma.user.findFirst({ where: { email: 'medico@srorn.cl' } })
  const enfermeraUser = await prisma.user.findFirst({ where: { email: 'enfermera@srorn.cl' } })
  const administrativoUser = await prisma.user.findFirst({ where: { email: 'administrativo@srorn.cl' } })

  // ================================
  // GENERAR MADRES
  // ================================
  console.log(`\n👩 Generating ${CONFIG.MADRES_COUNT} mothers...`)
  const usedRuts = new Set()
  const createdMadres = []

  for (let i = 0; i < CONFIG.MADRES_COUNT; i++) {
    const madreData = generateMadre(usedRuts)
    const madre = await prisma.madre.create({
      data: {
        ...madreData,
        createdById: matronaUser?.id,
      },
    })
    createdMadres.push({ ...madre, ...madreData })
    
    if ((i + 1) % 25 === 0) {
      console.log(`  ✓ Created ${i + 1}/${CONFIG.MADRES_COUNT} mothers...`)
    }
  }
  console.log(`  ✅ ${createdMadres.length} mothers created`)

  // ================================
  // GENERAR PARTOS Y RECIÉN NACIDOS
  // ================================
  console.log('\n👶 Generating births and newborns...')
  
  let totalPartos = 0
  let totalRN = 0
  let totalComplicaciones = 0
  let totalEsterilizaciones = 0
  const createdPartos = []

  // Distribuir partos a lo largo del año
  for (const madre of createdMadres) {
    // Determinar cuántos partos tendrá esta madre (mayoría solo 1, algunos 2)
    const numPartos = randomBool(0.15) ? 2 : 1 // 15% tiene 2 partos en el año
    
    for (let p = 0; p < numPartos; p++) {
      // Generar fecha de parto distribuida en el año
      const mes = faker.number.int({ min: 0, max: 11 }) // Enero a Diciembre
      const fechaParto = randomDateInMonth(mes)
      
      const partoData = generateParto(madre, fechaParto, matronaUser?.id, medicoUser?.id, enfermeraUser?.id)
      
      const parto = await prisma.parto.create({
        data: {
          ...partoData,
          matronas: { create: matronaUser ? [{ userId: matronaUser.id }] : [] },
          medicos: { create: medicoUser ? [{ userId: medicoUser.id }] : [] },
          enfermeras: { create: enfermeraUser ? [{ userId: enfermeraUser.id }] : [] },
        },
      })
      
      createdPartos.push({ ...parto, madre, edadGestacionalSemanas: partoData.edadGestacionalSemanas })
      totalPartos++

      // Determinar número de RN (gemelos/trillizos)
      let numRN = 1
      if (randomBool(CONFIG.PROB_GEMELOS)) numRN = 2
      else if (randomBool(CONFIG.PROB_TRILLIZOS)) numRN = 3

      // Crear recién nacidos
      for (let r = 0; r < numRN; r++) {
        const rnData = generateRecienNacido(
          { ...parto, edadGestacionalSemanas: partoData.edadGestacionalSemanas },
          madre,
          matronaUser?.id
        )
        
        await prisma.recienNacido.create({
          data: rnData,
        })
        totalRN++
      }

      // Posibilidad de complicación (10%)
      if (randomBool(0.10)) {
        try {
          await prisma.complicacionObstetrica.create({
            data: {
              partoId: parto.id,
              tipo: randomChoice(TIPOS_COMPLICACION),
              contexto: randomChoice(CONTEXTOS_COMPLICACION),
              requiereTransfusion: randomBool(0.15),
              fechaComplicacion: new Date(fechaParto.getTime() + faker.number.int({ min: 0, max: 3600000 })),
            },
          })
          totalComplicaciones++
        } catch (e) {
          // Ignorar errores de complicaciones duplicadas
        }
      }

      // Posibilidad de esterilización quirúrgica (8% de partos)
      if (randomBool(0.08)) {
        try {
          await prisma.esterilizacionQuirurgica.create({
            data: {
              fecha: new Date(fechaParto.getTime() + faker.number.int({ min: 3600000, max: 86400000 })),
              sexo: 'F',
              edadAnos: madre.edad,
              tipo: 'LIGADURA_TUBARIA',
              condicionTrans: madre.identidadTrans,
              esPuebloOriginario: madre.pertenenciaPuebloOriginario,
              esMigrante: madre.condicionMigrante,
              vinculoConParto: true,
              partoId: parto.id,
            },
          })
          totalEsterilizaciones++
        } catch (e) {
          // Ignorar errores
        }
      }
    }
    
    if (totalPartos % 50 === 0) {
      console.log(`  ✓ Created ${totalPartos} births, ${totalRN} newborns...`)
    }
  }

  console.log(`  ✅ ${totalPartos} births created`)
  console.log(`  ✅ ${totalRN} newborns created`)
  console.log(`  ✅ ${totalComplicaciones} complications created`)
  console.log(`  ✅ ${totalEsterilizaciones} sterilizations created`)

  // ================================
  // CREAR EPISODIOS DE MADRE
  // ================================
  console.log('\n🏥 Creating mother episodes...')
  
  // Seleccionar algunos partos para crear episodios
  const partosParaEpisodios = createdPartos.filter(() => randomBool(0.45)) // 45% de partos tienen episodio
  let totalEpisodios = 0
  let totalInformes = 0

  for (const parto of partosParaEpisodios) {
    const fechaIngreso = new Date(parto.fechaHora)
    fechaIngreso.setDate(fechaIngreso.getDate() - faker.number.int({ min: 1, max: 5 }))

    const estado = randomBool(0.70) ? 'ALTA' : 'INGRESADO'
    const fechaAlta = estado === 'ALTA' 
      ? new Date(parto.fechaHora.getTime() + faker.number.int({ min: 86400000, max: 259200000 }))
      : null

    try {
      const episodio = await prisma.episodioMadre.create({
        data: {
          madreId: parto.madre.id,
          fechaIngreso,
          motivoIngreso: randomChoice([
            'Control prenatal',
            'Trabajo de parto',
            'Control de embarazo de alto riesgo',
            'Evaluación obstétrica',
            'Amenaza de parto prematuro',
            'Rotura prematura de membranas',
          ]),
          estado,
          fechaAlta,
          condicionEgreso: estado === 'ALTA' ? 'Alta médica en buenas condiciones' : null,
          createdById: administrativoUser?.id,
        },
      })
      totalEpisodios++

      // Crear informe de alta para algunos episodios con alta
      if (estado === 'ALTA' && randomBool(0.60)) {
        const partoCompleto = await prisma.parto.findUnique({
          where: { id: parto.id },
          include: { recienNacidos: true },
        })

        await prisma.informeAlta.create({
          data: {
            partoId: parto.id,
            episodioId: episodio.id,
            formato: 'PDF',
            generadoPorId: matronaUser?.id,
            contenido: {
              madre: {
                rut: parto.madre.rut,
                nombres: parto.madre.nombres,
                apellidos: parto.madre.apellidos,
              },
              parto: {
                fechaHora: parto.fechaHora,
                tipo: parto.tipo,
              },
              recienNacidos: partoCompleto?.recienNacidos || [],
            },
          },
        })
        totalInformes++
      }
    } catch (e) {
      // Ignorar errores de episodios duplicados
    }
  }

  console.log(`  ✅ ${totalEpisodios} mother episodes created`)
  console.log(`  ✅ ${totalInformes} discharge reports created`)

  // ================================
  // CREAR EPISODIOS URNI Y CONTROLES
  // ================================
  console.log('\n🏥 Creating URNI episodes and neonatal controls...')

  // Obtener RN recientes para crear episodios URNI
  const recienNacidosParaURNI = await prisma.recienNacido.findMany({
    where: {
      OR: [
        { pesoNacimientoGramos: { lt: 2500 } },
        { apgar1Min: { lt: 7 } },
        { reanimacionBasica: true },
        { reanimacionAvanzada: true },
      ],
    },
    include: {
      parto: { include: { madre: true } },
    },
    take: 150, // Más episodios URNI para un hospital regional
  })

  let totalEpisodiosURNI = 0
  let totalControles = 0
  let totalAtenciones = 0

  for (const rn of recienNacidosParaURNI) {
    const fechaIngreso = new Date(rn.parto.fechaHora)
    fechaIngreso.setHours(fechaIngreso.getHours() + faker.number.int({ min: 1, max: 6 }))

    try {
      const episodioURNI = await prisma.episodioURNI.create({
        data: {
          rnId: rn.id,
          fechaHoraIngreso: fechaIngreso,
          motivoIngreso: randomChoice([
            'Prematuridad',
            'Bajo peso al nacer',
            'Dificultad respiratoria',
            'Hipoglicemia neonatal',
            'Ictericia neonatal',
            'Observación post reanimación',
          ]),
          servicioUnidad: randomChoice(['URNI', 'UCIN', 'NEONATOLOGIA']),
          estado: randomBool(0.60) ? 'ALTA' : 'INGRESADO',
          responsableClinicoId: medicoUser?.id,
          createdById: administrativoUser?.id,
        },
      })
      totalEpisodiosURNI++

      // Crear controles neonatales
      const numControles = faker.number.int({ min: 2, max: 8 })
      for (let c = 0; c < numControles; c++) {
        const fechaControl = new Date(fechaIngreso)
        fechaControl.setHours(fechaControl.getHours() + c * 4)

        const tipoControl = randomChoice(['SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION', 'OTRO'])
        
        let datos = {}
        switch (tipoControl) {
          case 'SIGNOS_VITALES':
            datos = {
              temp: faker.number.float({ min: 36.0, max: 37.5, fractionDigits: 1 }),
              fc: faker.number.int({ min: 120, max: 160 }),
              fr: faker.number.int({ min: 30, max: 60 }),
              spo2: faker.number.int({ min: 92, max: 100 }),
            }
            break
          case 'GLUCEMIA':
            datos = { glucemia: faker.number.int({ min: 40, max: 120 }) }
            break
          case 'ALIMENTACION':
            datos = {
              tipo: randomChoice(['Lactancia materna', 'Fórmula', 'Mixta']),
              cantidad: faker.number.int({ min: 20, max: 80 }),
              unidad: 'ml',
            }
            break
          case 'MEDICACION':
            datos = {
              medicamento: randomChoice(['Vitamina K', 'Vitamina D', 'Hierro']),
              dosis: `${faker.number.int({ min: 100, max: 500 })} ${randomChoice(['UI', 'mg', 'mcg'])}`,
              via: randomChoice(['Oral', 'IM', 'IV']),
            }
            break
        }

        await prisma.controlNeonatal.create({
          data: {
            rnId: rn.id,
            episodioUrniId: episodioURNI.id,
            fechaHora: fechaControl,
            tipo: tipoControl,
            datos,
            observaciones: randomBool(0.30) ? faker.lorem.sentence() : null,
            enfermeraId: enfermeraUser?.id,
          },
        })
        totalControles++
      }

      // Crear atenciones médicas
      const numAtenciones = faker.number.int({ min: 1, max: 3 })
      for (let a = 0; a < numAtenciones; a++) {
        const fechaAtencion = new Date(fechaIngreso)
        fechaAtencion.setHours(fechaAtencion.getHours() + a * 12)

        await prisma.atencionURNI.create({
          data: {
            rnId: rn.id,
            episodioId: episodioURNI.id,
            fechaHora: fechaAtencion,
            diagnostico: randomChoice([
              'RN prematuro en evolución favorable',
              'RN de bajo peso en ganancia ponderal',
              'Dificultad respiratoria en resolución',
              'Hipoglicemia corregida',
              'Ictericia en fototerapia',
            ]),
            indicaciones: faker.lorem.sentences(2),
            evolucion: faker.lorem.sentences(3),
            medicoId: medicoUser?.id,
          },
        })
        totalAtenciones++
      }
    } catch (e) {
      // Ignorar errores
    }
  }

  console.log(`  ✅ ${totalEpisodiosURNI} URNI episodes created`)
  console.log(`  ✅ ${totalControles} neonatal controls created`)
  console.log(`  ✅ ${totalAtenciones} medical attentions created`)

  // ================================
  // RESUMEN FINAL
  // ================================
  console.log('\n' + '='.repeat(60))
  console.log('✅ SEED COMPLETED SUCCESSFULLY!')
  console.log('='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`   👩 Mothers: ${createdMadres.length}`)
  console.log(`   👶 Births: ${totalPartos}`)
  console.log(`   👼 Newborns: ${totalRN}`)
  console.log(`   ⚠️  Complications: ${totalComplicaciones}`)
  console.log(`   🔬 Sterilizations: ${totalEsterilizaciones}`)
  console.log(`   🏥 Mother episodes: ${totalEpisodios}`)
  console.log(`   📄 Discharge reports: ${totalInformes}`)
  console.log(`   🩺 URNI episodes: ${totalEpisodiosURNI}`)
  console.log(`   📋 Neonatal controls: ${totalControles}`)
  console.log(`   💉 Medical attentions: ${totalAtenciones}`)
  
  console.log('\n📋 Test accounts (password: Asdf1234):')
  users.forEach((user) => {
    console.log(`   - ${user.email} (${user.role})`)
  })

  // Estadísticas por mes
  console.log('\n📅 Distribution by month:')
  const conteoMensual = {}
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  
  for (let m = 0; m < 12; m++) {
    const inicio = new Date(2025, m, 1)
    const fin = new Date(2025, m + 1, 0, 23, 59, 59)
    const count = await prisma.parto.count({
      where: {
        fechaHora: { gte: inicio, lte: fin },
      },
    })
    conteoMensual[meses[m]] = count
  }
  
  console.log('   ' + Object.entries(conteoMensual).map(([m, c]) => `${m}: ${c}`).join(' | '))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
