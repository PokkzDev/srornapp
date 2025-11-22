# Base de Datos - Esquema y Modelos

Este documento describe en detalle el esquema de base de datos del sistema SRORN, incluyendo todos los modelos, relaciones, enums e índices.

## Visión General

SRORN utiliza **MySQL** como base de datos relacional y **Prisma ORM** como capa de abstracción. El esquema está diseñado para:

- Mantener integridad referencial
- Facilitar consultas eficientes con índices
- Soportar trazabilidad completa
- Permitir flexibilidad con campos JSON donde es necesario

## Diagrama Conceptual de Entidades

```
User ──┬── Role (many-to-many)
       ├── Permission (many-to-many)
       ├── Madre (createdBy, updatedBy)
       ├── Parto (createdBy, updatedBy)
       ├── RecienNacido (createdBy, updatedBy)
       ├── EpisodioURNI (createdBy, updatedBy, responsableClinico)
       ├── EpisodioMadre (createdBy, updatedBy)
       ├── AtencionURNI (medico)
       ├── ControlNeonatal (enfermera)
       ├── InformeAlta (generadoPor)
       ├── ReporteREM (generadoPor)
       └── Auditoria (usuario)

Madre ──┬── Parto (one-to-many)
        └── EpisodioMadre (one-to-many)

Parto ──┬── RecienNacido (one-to-many)
        ├── PartoMatrona (many-to-many)
        ├── PartoMedico (many-to-many)
        ├── PartoEnfermera (many-to-many)
        ├── ComplicacionObstetrica (one-to-many)
        ├── EsterilizacionQuirurgica (one-to-many)
        └── InformeAlta (one-to-many)

RecienNacido ──┬── EpisodioURNI (one-to-many)
               ├── ControlNeonatal (one-to-many)
               └── AtencionURNI (one-to-many)

EpisodioURNI ──┬── AtencionURNI (one-to-many)
               └── ControlNeonatal (one-to-many)

EpisodioMadre ── InformeAlta (one-to-one)
```

## Enums

### Enums de Soporte Clínico

#### TipoParto
Tipos de parto registrados en el sistema:
- `VAGINAL` - Parto vaginal espontáneo
- `INSTRUMENTAL` - Parto vaginal instrumental
- `CESAREA_ELECTIVA` - Cesárea electiva
- `CESAREA_URGENCIA` - Cesárea de urgencia
- `PREHOSPITALARIO` - Parto prehospitalario (ambulancia/establecimiento)
- `FUERA_RED` - Parto fuera de la red de salud
- `DOMICILIO_PROFESIONAL` - Parto en domicilio con profesional
- `DOMICILIO_SIN_PROFESIONAL` - Parto en domicilio sin profesional

#### LugarParto
Lugares donde puede ocurrir el parto:
- `SALA_PARTO` - Sala de parto
- `PABELLON` - Pabellón quirúrgico
- `DOMICILIO` - Domicilio
- `OTRO` - Otro lugar (requiere `lugarDetalle`)

#### SexoRN
Sexo del recién nacido:
- `M` - Masculino
- `F` - Femenino
- `I` - Intersexual

#### Sexo
Sexo para esterilizaciones:
- `M` - Masculino
- `F` - Femenino
- `INTERSEX` - Intersexual
- `NO_REGISTRA` - No registra

#### CursoParto
Curso del parto:
- `EUTOCICO` - Eutócico (normal)
- `DISTOCICO` - Distócico (con complicaciones)

#### InicioTrabajoParto
Cómo inició el trabajo de parto:
- `ESPONTANEO` - Espontáneo
- `INDUCIDO_MECANICO` - Inducido mecánicamente
- `INDUCIDO_FARMACOLOGICO` - Inducido farmacológicamente

#### PosicionExpulsivo
Posición durante el expulsivo:
- `LITOTOMIA` - Litotomía
- `OTRAS` - Otras posiciones

#### CategoriaPeso
Categorías de peso al nacer (para reportes REM):
- `MENOR_500` - Menor a 500g
- `RANGO_500_999` - 500-999g
- `RANGO_1000_1499` - 1000-1499g
- `RANGO_1500_1999` - 1500-1999g
- `RANGO_2000_2499` - 2000-2499g
- `RANGO_2500_2999` - 2500-2999g
- `RANGO_3000_3999` - 3000-3999g
- `RANGO_4000_MAS` - 4000g o más

#### TipoComplicacion
Tipos de complicaciones obstétricas:
- `HPP_INERCIA` - Hemorragia postparto por inercia
- `HPP_RESTOS` - Hemorragia postparto por restos
- `HPP_TRAUMA` - Hemorragia postparto por trauma
- `DESGARROS_III_IV` - Desgarros grado III o IV
- `ALTERACION_COAGULACION` - Alteración de coagulación
- `PREECLAMPSIA_SEVERA` - Preeclampsia severa
- `ECLAMPSIA` - Eclampsia
- `SEPSIS_SISTEMICA_GRAVE` - Sepsis sistémica grave
- `MANEJO_QUIRURGICO_INERCIA` - Manejo quirúrgico de inercia
- `HISTERCTOMIA_OBSTETRICA` - Histerectomía obstétrica
- `ANEMIA_SEVERA_TRANSFUSION` - Anemia severa que requiere transfusión

#### ContextoComplicacion
Contexto en que ocurrió la complicación:
- `PARTO_ESPONTANEO_INSTITUCIONAL` - Parto espontáneo institucional
- `PARTO_INDUCIDO_INSTITUCIONAL` - Parto inducido institucional
- `CESAREA_URGENCIA` - Cesárea de urgencia
- `CESAREA_ELECTIVA` - Cesárea electiva
- `PARTO_DOMICILIO` - Parto en domicilio
- `EUTOCICO_ESPONTANEO` - Eutócico espontáneo
- `EUTOCICO_INDUCIDO` - Eutócico inducido
- `DISTOCICO_ESPONTANEO` - Distócico espontáneo
- `DISTOCICO_INDUCIDO` - Distócico inducido

#### TipoEsterilizacion
Tipos de esterilización quirúrgica:
- `LIGADURA_TUBARIA` - Ligadura tubaria
- `VASECTOMIA` - Vasectomía
- `OTRO` - Otro tipo

#### EstadoEpisodio
Estado de un episodio:
- `INGRESADO` - Episodio activo
- `ALTA` - Episodio dado de alta

#### TipoControlNeonatal
Tipos de controles neonatales:
- `SIGNOS_VITALES` - Signos vitales
- `GLUCEMIA` - Glucemia
- `ALIMENTACION` - Alimentación
- `MEDICACION` - Medicación
- `OTRO` - Otro tipo de control

#### AuditAction
Acciones registradas en auditoría:
- `CREATE` - Creación de registro
- `UPDATE` - Actualización de registro
- `DELETE` - Eliminación de registro
- `LOGIN` - Inicio de sesión
- `EXPORT` - Exportación de documento
- `PERMISSION_DENIED` - Intento de acceso denegado

#### ServicioUnidad
Servicios o unidades de atención:
- `URNI` - Unidad de Recién Nacidos
- `UCIN` - Unidad de Cuidados Intensivos Neonatales
- `NEONATOLOGIA` - Neonatología

## Modelos Detallados

### Modelo: User

Usuario del sistema con sistema RBAC.

**Campos**:
- `id` (String, UUID, PK) - Identificador único
- `rut` (String?, Unique) - RUT chileno (formato: sin puntos, con guion)
- `nombre` (String) - Nombre completo del usuario
- `email` (String, Unique) - Email único
- `passwordHash` (String) - Hash de la contraseña (bcrypt)
- `activo` (Boolean, default: true) - Si el usuario está activo
- `createdAt` (DateTime) - Fecha de creación
- `updatedAt` (DateTime) - Fecha de última actualización

**Relaciones**:
- `roles` (UserRole[]) - Roles asignados al usuario
- `permissions` (UserPermission[]) - Permisos directos (sobreescriben roles)
- Múltiples relaciones inversas para trazabilidad (createdBy, updatedBy)

**Índices**:
- `email` - Para búsquedas rápidas por email

### Modelo: Role

Rol del sistema RBAC.

**Campos**:
- `id` (String, UUID, PK)
- `name` (String, Unique) - Nombre del rol (matrona, medico, etc.)
- `description` (String?) - Descripción del rol
- `isSystem` (Boolean, default: false) - Si es un rol del sistema

**Relaciones**:
- `users` (UserRole[]) - Usuarios con este rol
- `permissions` (RolePermission[]) - Permisos del rol

### Modelo: Permission

Permiso del sistema RBAC.

**Campos**:
- `id` (String, UUID, PK)
- `code` (String, Unique) - Código del permiso (ej: "madre:create")
- `description` (String?) - Descripción del permiso

**Relaciones**:
- `roles` (RolePermission[]) - Roles que tienen este permiso
- `users` (UserPermission[]) - Usuarios con permiso directo

### Modelo: Madre

Información de la madre embarazada.

**Campos de Identificación**:
- `id` (String, UUID, PK)
- `rut` (String, Unique) - RUT sin puntos, con guion
- `nombres` (String) - Nombres
- `apellidos` (String) - Apellidos

**Campos Demográficos**:
- `edad` (Int?) - Edad
- `edadAnos` (Int?) - Edad en años (para tramos REM)
- `fechaNacimiento` (DateTime?) - Fecha de nacimiento
- `direccion` (String?) - Dirección
- `telefono` (String?) - Teléfono
- `fichaClinica` (String?, Unique) - Ficha clínica hospitalaria

**Campos REM**:
- `pertenenciaPuebloOriginario` (Boolean?)
- `condicionMigrante` (Boolean?)
- `condicionDiscapacidad` (Boolean?)
- `condicionPrivadaLibertad` (Boolean?)
- `identidadTrans` (Boolean?)
- `hepatitisBPositiva` (Boolean?)
- `controlPrenatal` (Boolean?)

**Relaciones**:
- `partos` (Parto[]) - Partos de la madre
- `episodios` (EpisodioMadre[]) - Episodios de ingreso/alta
- `createdBy` (User?) - Usuario que creó el registro
- `updatedBy` (User?) - Usuario que actualizó por última vez

**Índices**:
- `rut` - Búsqueda por RUT
- `fichaClinica` - Búsqueda por ficha clínica
- `apellidos, nombres` - Búsqueda por nombre completo

### Modelo: Parto

Evento de parto.

**Campos Básicos**:
- `id` (String, UUID, PK)
- `madreId` (String, FK → Madre) - Madre del parto
- `fechaHora` (DateTime) - Fecha y hora del parto
- `fechaParto` (DateTime?) - Fecha del parto (puede diferir de fechaHora)
- `tipo` (TipoParto) - Tipo de parto
- `lugar` (LugarParto) - Lugar donde ocurrió
- `lugarDetalle` (String?) - Detalle del lugar si es "OTRO"
- `complicacionesTexto` (String?) - Texto de complicaciones
- `observaciones` (String?) - Observaciones generales

**Campos REM**:
- `establecimientoId` (String?) - ID del establecimiento
- `edadGestacionalSemanas` (Int?) - Edad gestacional en semanas

**Campos de Curso del Parto**:
- `tipoCursoParto` (CursoParto?) - Eutócico o distócico
- `inicioTrabajoParto` (InicioTrabajoParto?) - Cómo inició
- `conduccionOxitocica` (Boolean?) - Conducción con oxitocina
- `libertadMovimiento` (Boolean?) - Libertad de movimiento
- `regimenHidricoAmplio` (Boolean?) - Régimen hídrico amplio
- `manejoDolorNoFarmacologico` (Boolean?) - Manejo de dolor no farmacológico
- `manejoDolorFarmacologico` (Boolean?) - Manejo de dolor farmacológico
- `posicionExpulsivo` (PosicionExpulsivo?) - Posición durante expulsivo
- `episiotomia` (Boolean?) - Episiotomía realizada

**Campos de Anestesia/Analgesia**:
- `anestesiaNeuroaxial` (Boolean?)
- `oxidoNitroso` (Boolean?)
- `analgesiaEndovenosa` (Boolean?)
- `anestesiaGeneral` (Boolean?)
- `anestesiaLocal` (Boolean?)
- `medidasNoFarmacologicasAnestesia` (Boolean?)

**Campos de Acompañamiento**:
- `acompananteDuranteTrabajo` (Boolean?)
- `acompananteSoloExpulsivo` (Boolean?)

**Campos de Buenas Prácticas**:
- `oxitocinaProfilactica` (Boolean?)
- `ligaduraTardiaCordon` (Boolean?)
- `atencionPertinenciaCultural` (Boolean?)
- `contactoPielPielMadre30min` (Boolean?)
- `contactoPielPielAcomp30min` (Boolean?)
- `lactancia60minAlMenosUnRn` (Boolean?)

**Campos Adicionales REM**:
- `planDeParto` (Boolean?)
- `entregaPlacentaSolicitud` (Boolean?)
- `embarazoNoControlado` (Boolean?)

**Relaciones**:
- `madre` (Madre) - Madre del parto
- `matronas` (PartoMatrona[]) - Matronas asignadas
- `medicos` (PartoMedico[]) - Médicos asignados
- `enfermeras` (PartoEnfermera[]) - Enfermeras asignadas
- `recienNacidos` (RecienNacido[]) - Recién nacidos del parto
- `informesAlta` (InformeAlta[]) - Informes de alta asociados
- `complicaciones` (ComplicacionObstetrica[]) - Complicaciones registradas
- `esterilizacionesVinculadas` (EsterilizacionQuirurgica[]) - Esterilizaciones vinculadas
- `createdBy` (User?) - Usuario que creó
- `updatedBy` (User?) - Usuario que actualizó

**Índices**:
- `madreId` - Búsqueda por madre
- `fechaHora` - Ordenamiento temporal
- `tipo` - Filtrado por tipo
- `lugar` - Filtrado por lugar

### Modelo: RecienNacido

Información del recién nacido.

**Campos Básicos**:
- `id` (String, UUID, PK)
- `partoId` (String, FK → Parto) - Parto del que nació
- `sexo` (SexoRN) - Sexo del recién nacido
- `pesoNacimientoGramos` (Int?) - Peso al nacer en gramos
- `tallaCm` (Int?) - Talla en centímetros
- `apgar1Min` (Int?) - Apgar al minuto (0-10)
- `apgar5Min` (Int?) - Apgar a los 5 minutos (0-10)
- `observaciones` (String?) - Observaciones clínicas

**Campos REM**:
- `esNacidoVivo` (Boolean, default: true) - Si es nacido vivo
- `categoriaPeso` (CategoriaPeso?) - Categoría de peso

**Campos de Anomalías**:
- `anomaliaCongenita` (Boolean?) - Si tiene anomalía congénita
- `anomaliaCongenitaDescripcion` (String?) - Descripción de anomalía

**Campos de Reanimación**:
- `reanimacionBasica` (Boolean?) - Reanimación básica
- `reanimacionAvanzada` (Boolean?) - Reanimación avanzada
- `ehiGradoII_III` (Boolean?) - Encefalopatía hipóxico-isquémica grado II-III

**Campos de Profilaxis**:
- `profilaxisOcularGonorrea` (Boolean?)
- `profilaxisHepatitisB` (Boolean?)
- `profilaxisCompletaHepatitisB` (Boolean?)

**Campos Adicionales**:
- `hijoMadreHepatitisBPositiva` (Boolean?)
- `lactancia60Min` (Boolean?)
- `alojamientoConjuntoInmediato` (Boolean?)
- `contactoPielPielInmediato` (Boolean?)
- `esPuebloOriginario` (Boolean?)
- `esMigrante` (Boolean?)

**Relaciones**:
- `parto` (Parto) - Parto del que nació
- `episodios` (EpisodioURNI[]) - Episodios URNI
- `controles` (ControlNeonatal[]) - Controles neonatales
- `atenciones` (AtencionURNI[]) - Atenciones médicas
- `createdBy` (User?) - Usuario que creó
- `updatedBy` (User?) - Usuario que actualizó

**Índices**:
- `partoId` - Búsqueda por parto
- `sexo` - Filtrado por sexo

### Modelo: EpisodioMadre

Episodio de ingreso/alta de una madre.

**Campos**:
- `id` (String, UUID, PK)
- `madreId` (String, FK → Madre) - Madre del episodio
- `estado` (EstadoEpisodio, default: INGRESADO) - Estado del episodio
- `fechaIngreso` (DateTime) - Fecha de ingreso
- `motivoIngreso` (String?) - Motivo del ingreso
- `hospitalAnterior` (String?) - Hospital anterior (si es transferencia)
- `fechaAlta` (DateTime?) - Fecha de alta
- `condicionEgreso` (String?) - Condición de egreso

**Relaciones**:
- `madre` (Madre) - Madre del episodio
- `informeAlta` (InformeAlta?) - Informe de alta asociado (one-to-one)
- `createdBy` (User?) - Usuario que creó
- `updatedBy` (User?) - Usuario que actualizó

**Índices**:
- `madreId` - Búsqueda por madre
- `estado` - Filtrado por estado
- `fechaIngreso` - Ordenamiento temporal

### Modelo: EpisodioURNI

Episodio de ingreso a Unidad de Recién Nacidos.

**Campos**:
- `id` (String, UUID, PK)
- `rnId` (String, FK → RecienNacido) - Recién nacido
- `estado` (EstadoEpisodio, default: INGRESADO) - Estado del episodio
- `fechaHoraIngreso` (DateTime) - Fecha y hora de ingreso
- `motivoIngreso` (String?) - Motivo del ingreso
- `servicioUnidad` (ServicioUnidad?) - Servicio/unidad específica
- `responsableClinicoId` (String?, FK → User) - Médico responsable
- `fechaHoraAlta` (DateTime?) - Fecha y hora de alta
- `condicionEgreso` (String?) - Condición de egreso

**Relaciones**:
- `rn` (RecienNacido) - Recién nacido del episodio
- `responsableClinico` (User?) - Médico responsable
- `atenciones` (AtencionURNI[]) - Atenciones médicas del episodio
- `controles` (ControlNeonatal[]) - Controles neonatales del episodio
- `createdBy` (User?) - Usuario que creó
- `updatedBy` (User?) - Usuario que actualizó

**Índices**:
- `rnId` - Búsqueda por recién nacido
- `estado` - Filtrado por estado
- `fechaHoraIngreso` - Ordenamiento temporal
- `responsableClinicoId` - Búsqueda por responsable

### Modelo: AtencionURNI

Atención médica a recién nacido en URNI.

**Campos**:
- `id` (String, UUID, PK)
- `rnId` (String, FK → RecienNacido) - Recién nacido
- `episodioId` (String?, FK → EpisodioURNI) - Episodio URNI (opcional)
- `fechaHora` (DateTime, default: now()) - Fecha y hora de la atención
- `diagnostico` (String?) - Diagnóstico
- `indicaciones` (String?) - Indicaciones médicas
- `evolucion` (String?) - Evolución clínica

**Relaciones**:
- `rn` (RecienNacido) - Recién nacido
- `episodio` (EpisodioURNI?) - Episodio URNI asociado
- `medico` (User?) - Médico que registró la atención

**Índices**:
- `rnId` - Búsqueda por recién nacido
- `episodioId` - Búsqueda por episodio
- `fechaHora` - Ordenamiento temporal

### Modelo: ControlNeonatal

Control neonatal realizado por enfermería.

**Campos**:
- `id` (String, UUID, PK)
- `rnId` (String, FK → RecienNacido) - Recién nacido
- `episodioUrniId` (String?, FK → EpisodioURNI) - Episodio URNI (opcional)
- `fechaHora` (DateTime, default: now()) - Fecha y hora del control
- `tipo` (TipoControlNeonatal, default: SIGNOS_VITALES) - Tipo de control
- `datos` (Json?) - Datos del control en formato JSON flexible
- `observaciones` (String?) - Observaciones de la enfermera

**Relaciones**:
- `rn` (RecienNacido) - Recién nacido
- `episodioUrni` (EpisodioURNI?) - Episodio URNI asociado
- `enfermera` (User?) - Enfermera que registró el control

**Índices**:
- `rnId` - Búsqueda por recién nacido
- `episodioUrniId` - Búsqueda por episodio
- `fechaHora` - Ordenamiento temporal
- `tipo` - Filtrado por tipo

**Ejemplo de datos JSON**:
```json
{
  "temperatura": 36.5,
  "frecuenciaCardiaca": 120,
  "frecuenciaRespiratoria": 40,
  "saturacionOxigeno": 98
}
```

### Modelo: InformeAlta

Informe de alta generado por matrona.

**Campos**:
- `id` (String, UUID, PK)
- `partoId` (String, FK → Parto) - Parto asociado
- `episodioId` (String, Unique, FK → EpisodioMadre) - Episodio asociado (one-to-one)
- `fechaGeneracion` (DateTime, default: now()) - Fecha de generación
- `formato` (String) - Formato del informe (PDF, DOCX, HTML)
- `contenido` (Json) - Contenido completo del informe en JSON
- `generadoPorId` (String?, FK → User) - Usuario que generó el informe

**Relaciones**:
- `parto` (Parto) - Parto asociado
- `episodio` (EpisodioMadre) - Episodio asociado
- `generadoPor` (User?) - Usuario que generó

**Índices**:
- `partoId` - Búsqueda por parto
- `episodioId` - Búsqueda por episodio (unique)
- `fechaGeneracion` - Ordenamiento temporal
- `generadoPorId` - Búsqueda por generador

### Modelo: ReporteREM

Reporte REM (Registro Estadístico de Maternidad).

**Campos**:
- `id` (String, UUID, PK)
- `periodo` (String) - Período del reporte (formato: YYYY-MM)
- `jsonFuente` (Json) - Snapshot de datos fuente
- `totales` (Json) - Totales agregados listos para hoja REM
- `generadoPorId` (String?, FK → User) - Usuario que generó
- `generadoAt` (DateTime, default: now()) - Fecha de generación

**Relaciones**:
- `generadoPor` (User?) - Usuario que generó

**Índices**:
- `periodo` - Búsqueda por período

### Modelo: Auditoria

Registro de auditoría de todas las acciones.

**Campos**:
- `id` (String, UUID, PK)
- `fechaHora` (DateTime, default: now()) - Fecha y hora de la acción
- `usuarioId` (String?, FK → User) - Usuario que realizó la acción
- `rol` (String?) - Rol del usuario al momento de la acción
- `entidad` (String) - Entidad afectada (Madre, Parto, etc.)
- `entidadId` (String?) - ID de la entidad afectada
- `accion` (AuditAction) - Tipo de acción
- `detalleBefore` (Json?) - Estado antes de la modificación
- `detalleAfter` (Json?) - Estado después de la modificación
- `ip` (String?) - Dirección IP del usuario
- `userAgent` (String?) - User Agent del navegador

**Relaciones**:
- `usuario` (User?) - Usuario que realizó la acción

**Índices**:
- `fechaHora` - Ordenamiento temporal
- `entidad, entidadId` - Búsqueda por entidad
- `usuarioId` - Búsqueda por usuario

### Modelos de Relación Many-to-Many

#### PartoMatrona
Relación entre Parto y User (matronas).

**Campos**:
- `partoId` (String, FK → Parto)
- `userId` (String, FK → User)
- `createdAt` (DateTime)

**Clave Primaria Compuesta**: `[partoId, userId]`

#### PartoMedico
Relación entre Parto y User (médicos).

**Campos**:
- `partoId` (String, FK → Parto)
- `userId` (String, FK → User)
- `createdAt` (DateTime)

**Clave Primaria Compuesta**: `[partoId, userId]`

#### PartoEnfermera
Relación entre Parto y User (enfermeras).

**Campos**:
- `partoId` (String, FK → Parto)
- `userId` (String, FK → User)
- `createdAt` (DateTime)

**Clave Primaria Compuesta**: `[partoId, userId]`

#### UserRole
Relación entre User y Role.

**Campos**:
- `userId` (String, FK → User)
- `roleId` (String, FK → Role)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Clave Primaria Compuesta**: `[userId, roleId]`

#### RolePermission
Relación entre Role y Permission.

**Campos**:
- `roleId` (String, FK → Role)
- `permissionId` (String, FK → Permission)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Clave Primaria Compuesta**: `[roleId, permissionId]`

#### UserPermission
Relación directa entre User y Permission (sobreescribe roles).

**Campos**:
- `userId` (String, FK → User)
- `permissionId` (String, FK → Permission)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Clave Primaria Compuesta**: `[userId, permissionId]`

### Modelos Adicionales

#### ComplicacionObstetrica
Complicación obstétrica asociada a un parto.

**Campos**:
- `id` (String, UUID, PK)
- `partoId` (String, FK → Parto)
- `tipo` (TipoComplicacion)
- `contexto` (ContextoComplicacion?)
- `requiereTransfusion` (Boolean?)
- `fechaComplicacion` (DateTime?)

**Relaciones**:
- `parto` (Parto)

**Índices**:
- `partoId` - Búsqueda por parto
- `tipo` - Filtrado por tipo
- `fechaComplicacion` - Ordenamiento temporal

#### EsterilizacionQuirurgica
Esterilización quirúrgica (puede estar vinculada a un parto).

**Campos**:
- `id` (String, UUID, PK)
- `fecha` (DateTime)
- `sexo` (Sexo)
- `edadAnos` (Int)
- `tipo` (TipoEsterilizacion?)
- `condicionTrans` (Boolean?)
- `esPuebloOriginario` (Boolean?)
- `esMigrante` (Boolean?)
- `vinculoConParto` (Boolean?)
- `partoId` (String?, FK → Parto)

**Relaciones**:
- `parto` (Parto?)

**Índices**:
- `partoId` - Búsqueda por parto
- `fecha` - Ordenamiento temporal
- `sexo` - Filtrado por sexo
- `tipo` - Filtrado por tipo

## Relaciones Principales

### Relaciones One-to-Many

- `Madre` → `Parto` (una madre puede tener múltiples partos)
- `Madre` → `EpisodioMadre` (una madre puede tener múltiples episodios)
- `Parto` → `RecienNacido` (un parto puede tener múltiples recién nacidos)
- `Parto` → `ComplicacionObstetrica` (un parto puede tener múltiples complicaciones)
- `RecienNacido` → `EpisodioURNI` (un RN puede tener múltiples episodios URNI)
- `RecienNacido` → `ControlNeonatal` (un RN puede tener múltiples controles)
- `RecienNacido` → `AtencionURNI` (un RN puede tener múltiples atenciones)
- `EpisodioURNI` → `AtencionURNI` (un episodio puede tener múltiples atenciones)
- `EpisodioURNI` → `ControlNeonatal` (un episodio puede tener múltiples controles)

### Relaciones One-to-One

- `EpisodioMadre` → `InformeAlta` (un episodio tiene un único informe de alta)

### Relaciones Many-to-Many

- `Parto` ↔ `User` (matronas) - Un parto puede tener múltiples matronas, una matrona puede estar en múltiples partos
- `Parto` ↔ `User` (médicos) - Un parto puede tener múltiples médicos, un médico puede estar en múltiples partos
- `Parto` ↔ `User` (enfermeras) - Un parto puede tener múltiples enfermeras, una enfermera puede estar en múltiples partos
- `User` ↔ `Role` - Un usuario puede tener múltiples roles, un rol puede estar asignado a múltiples usuarios
- `Role` ↔ `Permission` - Un rol puede tener múltiples permisos, un permiso puede estar en múltiples roles
- `User` ↔ `Permission` - Un usuario puede tener permisos directos (sobreescriben roles)

## Índices y Optimizaciones

### Índices Principales

Los siguientes campos tienen índices para optimizar consultas:

**User**:
- `email` - Búsquedas de login

**Madre**:
- `rut` - Búsqueda por RUT
- `fichaClinica` - Búsqueda por ficha clínica
- `apellidos, nombres` - Búsqueda por nombre completo

**Parto**:
- `madreId` - Búsqueda por madre
- `fechaHora` - Ordenamiento temporal
- `tipo` - Filtrado por tipo
- `lugar` - Filtrado por lugar

**RecienNacido**:
- `partoId` - Búsqueda por parto
- `sexo` - Filtrado por sexo

**EpisodioMadre**:
- `madreId` - Búsqueda por madre
- `estado` - Filtrado por estado
- `fechaIngreso` - Ordenamiento temporal

**EpisodioURNI**:
- `rnId` - Búsqueda por recién nacido
- `estado` - Filtrado por estado
- `fechaHoraIngreso` - Ordenamiento temporal
- `responsableClinicoId` - Búsqueda por responsable

**Auditoria**:
- `fechaHora` - Ordenamiento temporal
- `entidad, entidadId` - Búsqueda por entidad
- `usuarioId` - Búsqueda por usuario

### Optimizaciones de Consultas

1. **Select Específico**: Las consultas usan `select` para traer solo campos necesarios
2. **Include Selectivo**: Las relaciones se incluyen solo cuando son necesarias
3. **Paginación**: Listas grandes se paginan (default 20 items)
4. **Índices Compuestos**: Para búsquedas frecuentes (ej: apellidos, nombres)

## Migraciones

Las migraciones se encuentran en `prisma/migrations/` y documentan los cambios históricos del esquema:

- `20251102152406_init` - Migración inicial
- `20251102152537_add_rbac_indexes_and_audit` - Índices RBAC y auditoría
- `20251102160129_fullschema` - Esquema completo
- `20251102164153_arrays` - Campos de arrays
- `20251102213523_add_episodio_madre` - Episodios de madre
- `20251102221631_add_informe_alta` - Informes de alta
- `20251108214018_add_urni_fields` - Campos URNI adicionales

## Consideraciones de Diseño

### Trazabilidad

Todos los modelos principales tienen campos `createdById` y `updatedById` para mantener trazabilidad completa de quién creó y modificó cada registro.

### Flexibilidad

Campos JSON se usan para datos flexibles:
- `ControlNeonatal.datos` - Diferentes tipos de controles
- `InformeAlta.contenido` - Contenido completo del informe
- `ReporteREM.jsonFuente` y `totales` - Datos de reportes
- `Auditoria.detalleBefore` y `detalleAfter` - Estados antes/después

### Integridad Referencial

- Foreign keys con `onDelete: Restrict` para prevenir eliminaciones accidentales
- Foreign keys con `onDelete: SetNull` para campos opcionales de trazabilidad
- Foreign keys con `onDelete: Cascade` para relaciones de dependencia (ej: UserRole)

### Normalización

El esquema está normalizado siguiendo las mejores prácticas:
- Tablas separadas para entidades principales
- Tablas de relación para many-to-many
- Evita redundancia de datos

---

**Anterior**: [Instalación](03-instalacion.md) | **Siguiente**: [Autenticación y RBAC](05-autenticacion-rbac.md)

