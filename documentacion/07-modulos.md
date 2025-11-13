# Módulos del Sistema

Documentación detallada de cada módulo funcional del sistema SRORN.

## Módulo de Madres

### Descripción

Gestión completa del registro de madres embarazadas que ingresan al sistema.

### Funcionalidades

- **Registro de Madres**: Crear nuevos registros con información completa
- **Edición de Madres**: Actualizar información de madres existentes
- **Consulta de Historial**: Ver historial completo de partos y episodios
- **Búsqueda Avanzada**: Buscar por RUT, nombres, apellidos o ficha clínica
- **Campos REM**: Registro de información para reportes estadísticos

### Permisos Requeridos

- `madre:view` - Visualizar madres (acceso completo)
- `madre:view_limited` - Visualizar madres (solo datos básicos)
- `madre:create` - Crear madres (acceso completo)
- `madre:create_limited` - Crear madres (solo datos básicos)
- `madre:update` - Editar madres (acceso completo)
- `madre:update_limited` - Editar madres (solo datos básicos)
- `madre:delete` - Eliminar madres

### Campos Principales

- **Identificación**: RUT, nombres, apellidos
- **Demográficos**: Edad, fecha de nacimiento, dirección, teléfono
- **Clínica**: Ficha clínica hospitalaria
- **REM**: Pertenencia a pueblo originario, condición migrante, discapacidad, etc.

### Flujo de Trabajo

1. Usuario busca o crea madre
2. Registra información básica y demográfica
3. Completa campos REM si aplica
4. El sistema vincula automáticamente con partos y episodios

### Casos de Uso

- **Registro Inicial**: Administrativo registra madre al ingreso
- **Actualización de Datos**: Matrona actualiza información clínica
- **Consulta de Historial**: Cualquier profesional consulta historial completo

## Módulo de Partos

### Descripción

Registro detallado de eventos de parto con información completa del proceso obstétrico.

### Funcionalidades

- **Registro de Partos**: Crear eventos de parto con fecha, tipo y lugar
- **Asignación de Profesionales**: Asignar matronas, médicos y enfermeras
- **Registro de Complicaciones**: Registrar complicaciones obstétricas
- **Buenas Prácticas**: Registrar prácticas implementadas durante el parto
- **Búsqueda y Filtrado**: Buscar por madre, tipo, lugar, fecha

### Permisos Requeridos

- `parto:view` - Visualizar partos
- `parto:create` - Crear partos
- `parto:update` - Editar partos
- `parto:delete` - Eliminar partos

### Campos Principales

- **Evento**: Fecha/hora, tipo (vaginal, instrumental, cesárea, etc.), lugar
- **Profesionales**: Matronas, médicos, enfermeras asignados
- **Curso del Parto**: Eutócico o distócico
- **Modelo de Atención**: Inicio trabajo parto, conducción, manejo dolor, etc.
- **Buenas Prácticas**: Oxitocina profiláctica, ligadura tardía, contacto piel a piel, etc.
- **Complicaciones**: Texto libre y complicaciones estructuradas

### Flujo de Trabajo

1. Seleccionar madre
2. Registrar datos del parto
3. Asignar profesionales involucrados (mínimo: 1 matrona, 1 enfermera)
4. Si es cesárea, asignar al menos 1 médico
5. Registrar complicaciones si aplica
6. Registrar buenas prácticas implementadas
7. Registrar recién nacidos asociados

### Casos de Uso

- **Parto Normal**: Matrona registra parto vaginal con equipo multidisciplinario
- **Cesárea**: Médico y matrona registran cesárea con profesionales involucrados
- **Complicaciones**: Registrar complicaciones obstétricas con contexto

## Módulo de Recién Nacidos

### Descripción

Gestión completa de la información de los bebés desde su nacimiento.

### Funcionalidades

- **Registro de RN**: Crear registros con datos neonatales iniciales
- **Medidas Antropométricas**: Peso, talla al nacer
- **Evaluación Apgar**: Apgar al minuto y a los 5 minutos
- **Campos REM**: Información para reportes estadísticos
- **Historial Completo**: Ver episodios URNI, controles y atenciones

### Permisos Requeridos

- `recien-nacido:view` - Visualizar recién nacidos
- `recien-nacido:create` - Crear recién nacidos
- `recien-nacido:update` - Editar recién nacidos
- `recien-nacido:delete` - Eliminar recién nacidos

### Campos Principales

- **Básicos**: Sexo (M, F, I), peso (gramos), talla (cm)
- **Apgar**: Al minuto y a los 5 minutos (0-10)
- **REM**: Categoría de peso, anomalías congénitas, reanimación, profilaxis
- **Lactancia y Contacto**: Lactancia 60min, contacto piel a piel, alojamiento conjunto

### Flujo de Trabajo

1. Seleccionar parto asociado
2. Registrar datos básicos del RN
3. Registrar medidas antropométricas
4. Registrar evaluación Apgar
5. Completar campos REM si aplica
6. El sistema vincula automáticamente con episodios URNI y controles

### Casos de Uso

- **RN Normal**: Registrar datos básicos después del parto
- **RN Prematuro**: Registrar con categoría de peso y medidas especiales
- **RN con Complicaciones**: Registrar reanimación y atención especializada

## Módulo de Ingreso/Alta

### Descripción

Gestión administrativa de episodios de ingreso y alta de madres.

### Funcionalidades

- **Registro de Ingreso**: Crear episodios de ingreso con motivo y fecha
- **Gestión de Alta**: Procesar altas con condición de egreso
- **Validación de Completitud**: Verificar que el episodio tenga datos completos antes del alta
- **Historial de Episodios**: Ver todos los episodios de una madre
- **Cálculo de Estadía**: Sistema calcula días de estadía automáticamente

### Permisos Requeridos

- `ingreso_alta:view` - Visualizar episodios
- `ingreso_alta:create` - Crear episodios de ingreso
- `ingreso_alta:update` - Editar episodios
- `ingreso_alta:alta` - Procesar altas
- `ingreso_alta:manage` - Gestión completa

### Campos Principales

- **Ingreso**: Fecha de ingreso, motivo, hospital anterior (si transferencia)
- **Alta**: Fecha de alta, condición de egreso
- **Estado**: INGRESADO o ALTA

### Flujo de Trabajo

1. Crear episodio de ingreso al llegar la madre
2. Registrar motivo de ingreso y hospital anterior si aplica
3. Durante la estadía, se registran partos y recién nacidos
4. Antes del alta, sistema valida completitud de datos
5. Generar informe de alta (matrona)
6. Aprobar alta médica (médico)
7. Procesar alta con condición de egreso

### Validaciones de Alta

El sistema valida que:
- Madre tenga RUT, nombres y apellidos completos
- Exista al menos un parto registrado
- Cada parto tenga fecha/hora, tipo y lugar completos
- Cada parto tenga al menos un recién nacido
- Cada recién nacido tenga sexo registrado

### Casos de Uso

- **Ingreso Normal**: Administrativo registra ingreso de madre
- **Transferencia**: Registrar ingreso con hospital anterior
- **Alta Completa**: Proceso completo desde ingreso hasta alta

## Módulo de Episodios URNI

### Descripción

Gestión de episodios de ingreso a la Unidad de Recién Nacidos.

### Funcionalidades

- **Crear Episodio**: Registrar ingreso de RN a URNI
- **Asignar Responsable**: Asignar médico responsable clínico
- **Gestionar Alta**: Procesar alta con condición de egreso
- **Cálculo de Estadía**: Sistema calcula días de estadía automáticamente
- **Historial Completo**: Ver todas las atenciones y controles del episodio

### Permisos Requeridos

- `urni:episodio:view` - Visualizar episodios
- `urni:episodio:create` - Crear episodios
- `urni:episodio:update` - Actualizar episodios
- `urni:read` - Lectura general URNI
- `alta:manage` - Gestionar altas

### Campos Principales

- **Ingreso**: Fecha/hora de ingreso, motivo, servicio/unidad
- **Responsable**: Médico responsable clínico asignado
- **Alta**: Fecha/hora de alta, condición de egreso
- **Estado**: INGRESADO o ALTA

### Flujo de Trabajo

1. Crear episodio de ingreso para RN
2. Asignar responsable clínico
3. Médicos registran atenciones durante el episodio
4. Enfermeras registran controles neonatales
5. Procesar alta cuando corresponda
6. Sistema calcula días de estadía

### Validaciones

- RN no puede tener más de un episodio activo simultáneamente
- Fecha de alta no puede ser anterior a fecha de ingreso

### Casos de Uso

- **Ingreso URNI**: Matrona crea episodio para RN que requiere atención especializada
- **Seguimiento**: Médico y enfermeras registran atenciones y controles
- **Alta URNI**: Médico procesa alta cuando RN está listo

## Módulo de Atención URNI

### Descripción

Registro de evaluaciones y atenciones médicas a recién nacidos en URNI.

### Funcionalidades

- **Registrar Atenciones**: Crear evaluaciones médicas con diagnóstico e indicaciones
- **Evolución Clínica**: Registrar evolución del paciente
- **Vinculación con Episodio**: Asociar atenciones con episodio URNI
- **Historial Médico**: Ver todas las atenciones de un RN

### Permisos Requeridos

- `urni:atencion:create` - Crear atenciones
- `urni:atencion:view` - Visualizar atenciones
- `urni:read` - Lectura general URNI

### Campos Principales

- **Fecha/Hora**: Fecha y hora de la atención
- **Diagnóstico**: Diagnóstico médico
- **Indicaciones**: Indicaciones de tratamiento
- **Evolución**: Evolución clínica del paciente
- **Médico**: Médico que registró la atención

### Flujo de Trabajo

1. Médico selecciona RN y episodio URNI
2. Registra evaluación médica con fecha/hora
3. Ingresa diagnóstico e indicaciones
4. Registra evolución clínica
5. El sistema vincula automáticamente con episodio y RN

### Casos de Uso

- **Evaluación Inicial**: Médico registra primera evaluación al ingreso
- **Seguimiento Diario**: Médico registra evaluaciones periódicas
- **Evolución**: Registrar cambios en condición del paciente

## Módulo de Control Neonatal

### Descripción

Registro de controles periódicos de recién nacidos por parte de enfermería.

### Funcionalidades

- **Registrar Controles**: Crear controles de diferentes tipos
- **Datos Flexibles**: Almacenar datos específicos según tipo de control
- **Vinculación con Episodio**: Asociar controles con episodio URNI
- **Historial de Controles**: Ver todos los controles de un RN

### Permisos Requeridos

- `control_neonatal:create` - Crear controles
- `control_neonatal:view` - Visualizar controles
- `control_neonatal:update` - Editar controles
- `control_neonatal:delete` - Eliminar controles

### Tipos de Control

- **SIGNOS_VITALES**: Temperatura, frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno
- **GLUCEMIA**: Nivel de glucosa en sangre
- **ALIMENTACION**: Tipo y cantidad de alimentación
- **MEDICACION**: Medicamentos administrados
- **OTRO**: Otros tipos de control personalizados

### Campos Principales

- **Fecha/Hora**: Fecha y hora del control
- **Tipo**: Tipo de control realizado
- **Datos**: Objeto JSON con datos específicos del tipo
- **Observaciones**: Observaciones de la enfermera
- **Enfermera**: Enfermera que registró el control

### Flujo de Trabajo

1. Enfermera busca RN por RUT de la madre
2. Selecciona tipo de control
3. Ingresa datos específicos según tipo
4. Opcionalmente vincula con episodio URNI
5. Registra observaciones
6. El sistema guarda con fecha/hora y enfermera responsable

### Casos de Uso

- **Signos Vitales**: Enfermera registra controles periódicos de signos vitales
- **Glucemia**: Registrar controles de glucosa en sangre
- **Alimentación**: Registrar tipo y cantidad de alimentación administrada

## Módulo de Informe de Alta

### Descripción

Generación de informes de alta por parte de matronas para revisión médica.

### Funcionalidades

- **Generar Informes**: Crear informes completos con toda la información del caso
- **Múltiples Formatos**: Exportar en PDF, DOCX o HTML
- **Vinculación**: Asociar informe con episodio y parto específico
- **Almacenamiento**: Informes se guardan en el sistema con metadatos

### Permisos Requeridos

- `informe_alta:generate` - Generar informes

### Contenido del Informe

El informe incluye:
- **Datos de la Madre**: Información completa de identificación y demográfica
- **Información del Parto**: Tipo, lugar, fecha, profesionales involucrados
- **Datos de Recién Nacidos**: Información completa de cada RN asociado
- **Información del Episodio**: Motivo de ingreso, fechas, estado

### Flujo de Trabajo

1. Matrona selecciona episodio en estado INGRESADO
2. Selecciona parto asociado al episodio
3. Sistema genera informe con toda la información
4. Selecciona formato de exportación (PDF, DOCX, HTML)
5. Informe se almacena en el sistema
6. Médico puede revisar informe en módulo de alta

### Validaciones

- Episodio debe estar en estado INGRESADO
- Episodio no debe tener informe previo
- Parto debe pertenecer a la madre del episodio

### Casos de Uso

- **Informe Completo**: Matrona genera informe antes del alta
- **Revisión Médica**: Médico revisa informe en módulo de alta
- **Exportación**: Exportar informe en formato requerido

## Módulo de Alta (Aprobación Médica)

### Descripción

Revisión y aprobación de altas basadas en informes generados por matronas.

### Funcionalidades

- **Listar Episodios**: Ver episodios con informes generados
- **Revisar Informes**: Acceder a información completa del caso
- **Aprobar Altas**: Procesar aprobación médica antes del alta
- **Filtrado y Búsqueda**: Buscar por RUT, nombre o estado

### Permisos Requeridos

- `modulo_alta:aprobar` - Aprobar altas médicas

### Flujo de Trabajo

1. Médico accede al módulo de alta
2. Ve listado de episodios con informes generados
3. Selecciona episodio para revisar
4. Revisa información completa del caso (madre, parto, RN, episodio)
5. Aprueba alta con fecha y condición de egreso
6. Sistema procesa el alta del episodio

### Validaciones

- Episodio debe tener informe generado
- Episodio debe estar en estado INGRESADO
- Debe tener parto y recién nacidos registrados

### Casos de Uso

- **Aprobación Normal**: Médico aprueba alta después de revisar informe
- **Revisión Completa**: Médico revisa toda la información antes de aprobar
- **Alta con Condiciones**: Registrar condición de egreso específica

## Módulo de Indicadores

### Descripción

Sistema de indicadores y métricas para análisis y toma de decisiones.

### Funcionalidades

- **Visualizaciones Gráficas**: Gráficos interactivos con Recharts
- **Filtrado por Fechas**: Filtrar indicadores por rangos de fechas
- **Agrupación Temporal**: Agrupar por día, semana o mes
- **Múltiples Métricas**: Partos, RN, episodios, controles, atenciones, informes
- **Exportación**: Exportar datos para análisis externo

### Permisos Requeridos

- `indicadores:consult` - Consultar indicadores

### Indicadores Disponibles

#### Partos
- Total de partos
- Distribución por tipo (vaginal, instrumental, cesárea, etc.)
- Distribución por lugar
- Evolución temporal

#### Recién Nacidos
- Total de recién nacidos
- Distribución por sexo
- Promedios de peso y talla
- Distribución de Apgar
- Rangos de peso

#### Episodios URNI
- Total de episodios
- Episodios activos vs altas
- Días de estadía promedio
- Distribución por servicio/unidad
- Evolución temporal

#### Episodios Madre
- Total de episodios
- Episodios activos vs altas
- Días de estadía promedio
- Evolución temporal

#### Controles Neonatales
- Total de controles
- Distribución por tipo
- Promedio por episodio
- Evolución temporal

#### Atenciones URNI
- Total de atenciones
- Distribución por médico
- Promedio por episodio

#### Informes de Alta
- Total generados
- Evolución temporal

#### Métricas Operacionales
- Totales globales
- Actividad reciente (últimos 30 días)

### Flujo de Trabajo

1. Usuario accede al módulo de indicadores
2. Selecciona rango de fechas
3. Selecciona agrupación temporal (día, semana, mes)
4. Sistema calcula y muestra indicadores
5. Visualiza gráficos interactivos
6. Opcionalmente exporta datos

### Casos de Uso

- **Análisis Mensual**: Jefatura revisa indicadores del mes
- **Tendencias**: Analizar evolución temporal de indicadores
- **Reportes**: Exportar datos para reportes externos

## Módulo de Auditoría

### Descripción

Sistema completo de auditoría que registra todas las acciones realizadas en el sistema.

### Funcionalidades

- **Consulta de Registros**: Ver historial completo de actividades
- **Filtrado Avanzado**: Filtrar por usuario, entidad, acción, fecha
- **Visualización de Cambios**: Ver estados antes y después de modificaciones
- **Trazabilidad Completa**: Saber quién hizo qué y cuándo

### Permisos Requeridos

- `auditoria:review` - Revisar auditoría

### Acciones Registradas

- **CREATE**: Creación de registros
- **UPDATE**: Actualización de registros
- **DELETE**: Eliminación de registros
- **LOGIN**: Inicios de sesión
- **EXPORT**: Exportación de documentos
- **PERMISSION_DENIED**: Intentos de acceso denegados

### Información Capturada

- Usuario que realizó la acción
- Rol del usuario al momento de la acción
- Entidad afectada (Madre, Parto, RecienNacido, etc.)
- ID de la entidad afectada
- Fecha y hora de la acción
- Estado antes y después (para UPDATE)
- Dirección IP
- User Agent del navegador

### Flujo de Trabajo

1. Usuario accede al módulo de auditoría
2. Aplica filtros según necesidad (usuario, entidad, fecha, etc.)
3. Revisa registros de auditoría
4. Ve detalles de cambios realizados
5. Exporta registros si es necesario

### Casos de Uso

- **Trazabilidad**: Ver quién modificó un registro específico
- **Cumplimiento**: Auditar actividades para cumplimiento normativo
- **Seguridad**: Detectar intentos de acceso no autorizados
- **Análisis**: Analizar patrones de uso del sistema

## Módulo de Reporte REM

### Descripción

Generación de reportes REM (Registro Estadístico de Maternidad) para cumplimiento normativo.

### Funcionalidades

- **Generar Reportes**: Crear reportes para períodos específicos (mes/año)
- **Snapshots de Datos**: Almacenar datos fuente completos
- **Totales Agregados**: Calcular totales listos para hoja REM
- **Exportación**: Exportar reportes en formato requerido

### Permisos Requeridos

- `reporte_rem:generate` - Generar reportes REM

### Secciones del Reporte

- **Sección D.1**: Información general de recién nacidos vivos
- **Sección D.2**: Atención inmediata del recién nacido
- **Sección D**: Profilaxis ocular para gonorrea
- **Sección J**: Profilaxis hepatitis B
- **Características del Parto**: Tabla completa con desgloses
- **Modelo de Atención**: Tabla completa con desgloses
- **Sección G**: Esterilizaciones quirúrgicas
- **Complicaciones Obstétricas**: Por tipo y contexto

### Flujo de Trabajo

1. Usuario selecciona mes y año del reporte
2. Sistema consulta todos los partos del período
3. Calcula totales y agregados según fórmulas REM
4. Genera estructura completa del reporte
5. Almacena snapshot de datos fuente y totales
6. Retorna reporte para visualización o exportación

### Casos de Uso

- **Reporte Mensual**: Generar reporte REM del mes
- **Cumplimiento Normativo**: Cumplir con requerimientos estadísticos
- **Análisis Estadístico**: Analizar datos agregados del período

---

**Anterior**: [Referencia de API](06-api-reference.md) | **Siguiente**: [Componentes](08-componentes.md)

