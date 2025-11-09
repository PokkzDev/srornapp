# Sistema SRORN

**Sistema de Registro de Obstetricia y Recién Nacidos**

Plataforma integral de gestión hospitalaria especializada en la atención del ciclo completo obstétrico y neonatal, desde el ingreso de la madre embarazada hasta el alta del recién nacido.

## Descripción General

SRORN es un sistema web diseñado para gestionar de manera integral y coordinada todo el proceso de atención obstétrica y neonatal en un entorno hospitalario. El sistema permite registrar, monitorear y administrar la información de madres embarazadas, partos, recién nacidos y sus respectivos episodios de ingreso y alta, facilitando la coordinación entre diferentes profesionales de la salud (matronas, médicos, enfermeras y personal administrativo).

El sistema está construido con tecnologías modernas (Next.js, React, Prisma, MySQL) y cuenta con un robusto sistema de control de acceso basado en roles (RBAC) que garantiza que cada profesional acceda únicamente a las funcionalidades correspondientes a su perfil.

## Módulos del Sistema

### Módulo de Madres

Gestión completa del registro de madres embarazadas que ingresan al sistema. Permite registrar información de identificación (RUT, nombres, apellidos), datos demográficos (edad, fecha de nacimiento, dirección, teléfono), ficha clínica hospitalaria, y mantener un historial completo de todos los partos y episodios de ingreso/alta asociados.

**Funcionalidades principales:**
- Registro y edición de información de madres
- Consulta de historial completo de atención
- Vinculación automática con partos y episodios
- Búsqueda y filtrado por múltiples criterios

### Módulo de Partos

Registro detallado de eventos de parto con información completa del proceso obstétrico. Cada parto registra fecha y hora, tipo (eutócico, distócico, cesárea electiva o cesárea de emergencia), lugar (sala de parto, pabellón, domicilio u otro), complicaciones y observaciones relevantes.

**Características especiales:**
- Asignación de múltiples profesionales (matronas, médicos, enfermeras) reflejando equipos multidisciplinarios
- Vinculación con uno o más recién nacidos
- Registro completo de eventos durante el parto
- Trazabilidad de profesionales involucrados

### Módulo de Recién Nacidos

Gestión completa de la información de los bebés desde su nacimiento. Incluye datos básicos (sexo: Masculino, Femenino, Intersexual), medidas antropométricas (peso en gramos, talla en centímetros), evaluación Apgar (al minuto y a los 5 minutos), observaciones clínicas, y seguimiento de episodios URNI, controles neonatales y atenciones médicas.

**Funcionalidades:**
- Registro de datos neonatales iniciales
- Historial completo de atención en URNI
- Seguimiento de controles neonatales
- Asignación opcional de pulsera NFC para identificación
- Vinculación con episodios de ingreso a unidades especializadas

### Módulo de Ingreso/Alta

Módulo administrativo para gestionar los episodios de ingreso y alta tanto de madres como de recién nacidos.

**Episodios de Madre:**
- Registro de ingreso con motivo y fecha
- Información de hospital anterior si aplica (transferencias)
- Gestión de alta con condición de egreso
- Vinculación con informes de alta generados

**Episodios URNI (Unidad de Recién Nacidos):**
- Ingreso de recién nacidos a la unidad especializada
- Motivo de ingreso y fecha/hora
- Asignación de responsable clínico
- Seguimiento del estado (Ingresado/Alta)
- Registro de condición de egreso al momento del alta
- Cálculo automático de días de estadía

### Módulo de Atención URNI

Módulo médico para registrar evaluaciones y atenciones a recién nacidos en la Unidad de Recién Nacidos. Permite a los médicos registrar diagnósticos, indicaciones médicas, evolución clínica y evaluaciones periódicas.

**Características:**
- Registro de evaluaciones médicas con fecha y hora
- Diagnósticos y evaluaciones clínicas
- Indicaciones de tratamiento y recomendaciones
- Evolución del paciente
- Vinculación con episodio de ingreso correspondiente
- Trazabilidad completa del médico responsable

### Módulo de Control Neonatal

Módulo de enfermería para registrar controles periódicos de recién nacidos. Permite registrar diferentes tipos de controles con datos estructurados en formato flexible.

**Tipos de control:**
- Signos vitales (temperatura, frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno)
- Glucemia
- Alimentación
- Medicación
- Otros controles personalizados

**Características:**
- Datos almacenados en formato JSON flexible para adaptarse a diferentes tipos de control
- Observaciones adicionales del profesional
- Trazabilidad de la enfermera responsable y fecha/hora
- Vinculación con episodio URNI cuando aplica
- Historial completo de controles por recién nacido

### Módulo de Informe de Alta

Módulo para la generación de informes de alta por parte de las matronas. Permite generar informes completos con toda la información relevante del caso para revisión médica.

**Funcionalidades:**
- Selección de episodio y parto específico
- Generación de informe con información completa:
  - Datos de la madre
  - Información del parto
  - Datos de recién nacidos asociados
  - Información del episodio de ingreso/alta
- Exportación en múltiples formatos (PDF, DOCX, HTML)
- Almacenamiento en el sistema con metadatos completos
- Disponibilidad para revisión y aprobación médica

### Módulo de Alta (Aprobación Médica)

Módulo médico para revisar y aprobar altas basadas en informes generados por matronas. Asegura que todas las altas sean revisadas y aprobadas por personal médico autorizado antes de proceder.

**Funcionalidades:**
- Listado de episodios con informes de alta generados
- Revisión completa de información del caso
- Proceso de aprobación médica antes del alta
- Filtros y búsqueda por RUT, nombre o estado
- Visualización de informes generados

### Módulo de Indicadores

Sistema de indicadores y métricas para análisis y toma de decisiones. Proporciona visualizaciones y estadísticas sobre la actividad del sistema.

**Indicadores incluidos:**
- **Partos**: Total, distribución por tipo y lugar, evolución temporal
- **Recién Nacidos**: Total, distribución por sexo, promedios de peso y talla, distribución de Apgar, rangos de peso
- **Episodios URNI**: Total, activos, altas, días de estadía promedio, distribución por servicio, evolución temporal
- **Episodios Madre**: Total, activos, altas, días de estadía promedio, evolución temporal
- **Controles Neonatales**: Total, distribución por tipo, promedio por episodio, evolución temporal
- **Atenciones URNI**: Total, distribución por médico, promedio por episodio
- **Informes de Alta**: Total generados, evolución temporal
- **Métricas Operacionales**: Totales globales, actividad reciente (últimos 30 días)

**Características:**
- Filtrado por rangos de fechas
- Agrupación temporal (día, semana, mes)
- Visualizaciones gráficas con Recharts
- Exportación de datos

### Módulo de Auditoría

Sistema completo de auditoría que registra todas las acciones realizadas en el sistema para garantizar trazabilidad y cumplimiento.

**Acciones registradas:**
- Creación de registros (CREATE)
- Actualización de registros (UPDATE)
- Eliminación de registros (DELETE)
- Inicios de sesión (LOGIN)
- Exportación de documentos (EXPORT)
- Intentos de acceso denegados (PERMISSION_DENIED)

**Información capturada:**
- Usuario que realizó la acción
- Rol del usuario
- Entidad afectada (Madre, Parto, RecienNacido, etc.)
- ID de la entidad afectada
- Fecha y hora de la acción
- Estado antes y después de modificaciones (cuando aplica)
- Dirección IP
- User Agent del navegador

**Funcionalidades:**
- Consulta de historial completo de actividades
- Filtrado por usuario, entidad, acción, fecha
- Visualización de cambios realizados
- Trazabilidad completa de modificaciones

### Módulo de Reporte REM

Módulo para generar reportes REM (Registro Estadístico de Maternidad). Actualmente en desarrollo, con estructura preparada para almacenar snapshots de datos origen y totales agregados listos para hojas REM.

**Estructura preparada:**
- Almacenamiento por período (formato YYYY-MM)
- Snapshot de datos fuente (JSON)
- Totales agregados A/D listos para hoja REM
- Trazabilidad del usuario que generó el reporte

## Sistema de Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles (RBAC) que garantiza que cada profesional acceda únicamente a las funcionalidades correspondientes a su perfil. El sistema verifica permisos en cada solicitud, asegurando la seguridad y confidencialidad de la información.

### Roles Disponibles

#### Matrona
Profesional especializado en atención materno-infantil con acceso completo a los módulos clínicos principales.

**Permisos principales:**
- Gestión completa de madres (crear, editar, visualizar, eliminar)
- Gestión completa de partos (crear, editar, visualizar, eliminar)
- Gestión completa de recién nacidos (crear, editar, visualizar, eliminar)
- Generación de informes de alta
- Creación de episodios URNI
- Edición de registros clínicos
- Visualización de fichas

#### Médico
Profesional médico con acceso a módulos de atención especializada y aprobación de altas.

**Permisos principales:**
- Crear y visualizar atenciones URNI
- Aprobar altas médicas en módulo de alta
- Visualizar recién nacidos
- Gestionar altas URNI
- Edición de registros clínicos
- Visualización de fichas
- Lectura general de información URNI

#### Enfermera
Profesional de enfermería con acceso a módulos de control y seguimiento neonatal.

**Permisos principales:**
- Crear, editar, visualizar y eliminar controles neonatales
- Visualización de fichas
- Lectura general de información URNI

#### Administrativo
Personal administrativo con acceso a módulos de gestión de ingresos y altas.

**Permisos principales:**
- Gestión limitada de madres (solo datos básicos, sin eliminar si tiene partos/RN)
- Generación de reportes REM
- Gestión de altas (ingreso/alta de episodios)

#### Jefatura
Personal de dirección y supervisión con acceso a módulos de análisis y auditoría.

**Permisos principales:**
- Revisión de auditoría
- Consulta de indicadores
- Visualización de atenciones URNI

### Control de Acceso

El sistema implementa un modelo de permisos granular donde:
- Los permisos se asignan a roles
- Los usuarios pueden tener múltiples roles
- Los usuarios pueden tener permisos directos adicionales (sobreescribiendo roles)
- Cada acción en el sistema verifica permisos específicos
- Los intentos de acceso sin permisos se registran en auditoría

## Flujos de Trabajo Principales

### Flujo Completo: Desde Ingreso hasta Alta

1. **Registro de Madre**: El personal administrativo o matrona registra la información de la madre embarazada que ingresa al sistema.

2. **Episodio de Ingreso**: Se crea un episodio de ingreso para la madre con motivo, fecha y cualquier información relevante (hospital anterior si aplica).

3. **Registro de Parto**: Cuando ocurre el parto, la matrona registra la información completa del evento, incluyendo tipo, lugar, complicaciones y asigna los profesionales involucrados (matronas, médicos, enfermeras).

4. **Registro de Recién Nacidos**: Se registran los datos de cada recién nacido asociado al parto, incluyendo medidas antropométricas, Apgar y observaciones clínicas.

5. **Episodio URNI (si aplica)**: Si el recién nacido requiere atención especializada, se crea un episodio de ingreso a la Unidad de Recién Nacidos con motivo, fecha/hora y responsable clínico asignado.

6. **Atención Médica**: Los médicos registran evaluaciones, diagnósticos e indicaciones para los recién nacidos en URNI, vinculadas al episodio correspondiente.

7. **Controles Neonatales**: Las enfermeras registran controles periódicos (signos vitales, glucemia, alimentación, medicación, etc.) vinculados al recién nacido y opcionalmente al episodio URNI.

8. **Generación de Informe de Alta**: La matrona genera el informe de alta seleccionando el episodio y parto correspondiente. El informe incluye toda la información relevante del caso.

9. **Aprobación Médica**: El médico revisa el informe en el módulo de alta, accede a toda la información del caso y aprueba o solicita modificaciones antes de proceder con el alta.

10. **Alta**: Una vez aprobado, se procede con el alta del episodio, registrando fecha y condición de egreso. El sistema calcula automáticamente los días de estadía.

### Flujo de Informes de Alta

- Las matronas generan informes de alta con toda la información relevante del caso (madre, parto, recién nacidos, episodio)
- Los informes se almacenan en el sistema con formato seleccionado (PDF, DOCX, HTML) y metadatos completos
- Los médicos pueden revisar estos informes en el módulo de alta antes de proceder con la aprobación
- El sistema mantiene un registro completo de quién generó cada informe y cuándo
- Cada episodio puede tener un único informe de alta asociado

### Flujo de Atención URNI

- Se crea un episodio de ingreso URNI para un recién nacido con motivo y responsable clínico
- Los médicos registran atenciones periódicas con diagnósticos, indicaciones y evolución
- Las enfermeras registran controles neonatales vinculados al episodio
- El sistema mantiene un historial completo de todas las atenciones y controles
- Al momento del alta, se registra la condición de egreso y el sistema calcula los días de estadía

## Características Especiales

### Trazabilidad Completa

Cada registro en el sistema mantiene información sobre:
- **Usuario creador**: Quién registró inicialmente la información
- **Usuario modificador**: Quién realizó la última actualización
- **Fechas**: Timestamps de creación y última modificación
- **Relaciones**: Vinculación con profesionales responsables (médicos, enfermeras, matronas) en cada acción

### Gestión de Equipos Multidisciplinarios

El sistema permite asignar múltiples profesionales a un mismo parto:
- Una o más matronas pueden ser asignadas
- Múltiples médicos pueden participar
- Varias enfermeras pueden ser asignadas

Esta funcionalidad refleja la realidad de los equipos multidisciplinarios que participan en la atención obstétrica.

### Pulseras NFC (Opcional)

Soporte para identificación de recién nacidos mediante pulseras NFC:
- Asignación de pulsera NFC única con recién nacido
- Estados: Activa, Reemplazada o Baja
- Trazabilidad de cuándo fue asignada y si fue reemplazada
- Vinculación uno a uno con recién nacido

### Datos Flexibles

El sistema utiliza almacenamiento flexible (JSON) para:
- Datos de controles neonatales (adaptándose a diferentes tipos de control)
- Contenido de informes de alta
- Snapshots de reportes REM
- Detalles de auditoría (estados antes/después)

### Visualización de Indicadores

Sistema completo de indicadores con:
- Gráficos y visualizaciones interactivas
- Filtrado por rangos de fechas
- Agrupación temporal (día, semana, mes)
- Métricas operacionales y de actividad reciente
- Exportación de datos

## Stack Tecnológico

- **Frontend**: Next.js 16.0.1 con React 19.2.0
- **Backend**: Next.js API Routes (RESTful)
- **Base de Datos**: MySQL con Prisma ORM
- **Autenticación**: Sistema basado en cookies con bcryptjs
- **Visualización**: Recharts para gráficos e indicadores
- **Iconos**: Font Awesome 6.5.1
- **Estilos**: CSS Modules

## Seguridad

- Autenticación segura con hash de contraseñas (bcryptjs)
- Control de acceso basado en permisos en cada endpoint
- Auditoría completa de todas las acciones
- Registro de intentos de acceso denegados
- Validación de permisos en frontend y backend
- Sesiones con cookies HTTP-only en producción

## Arquitectura

El sistema sigue una arquitectura de aplicación web moderna:
- **App Router de Next.js**: Rutas basadas en estructura de carpetas
- **Server Components**: Renderizado en servidor para mejor rendimiento
- **Client Components**: Interactividad del lado del cliente cuando es necesario
- **API Routes**: Endpoints RESTful para operaciones CRUD
- **Prisma ORM**: Abstracción de base de datos con tipado fuerte
- **Componentes Reutilizables**: DashboardLayout, Sidebar, Forms, Modals

---

*Sistema SRORN - Gestión integral de atención obstétrica y neonatal*
