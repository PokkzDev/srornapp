# Introducción al Sistema SRORN

## ¿Qué es SRORN?

**SRORN** (Sistema de Registro de Obstetricia y Recién Nacidos) es una plataforma web integral diseñada para gestionar de manera completa y coordinada todo el proceso de atención obstétrica y neonatal en un entorno hospitalario.

El sistema permite registrar, monitorear y administrar la información de:
- Madres embarazadas
- Partos y eventos obstétricos
- Recién nacidos
- Episodios de ingreso y alta
- Atenciones médicas especializadas
- Controles neonatales
- Informes de alta

## Objetivos del Sistema

### Objetivo Principal

Proporcionar una solución tecnológica integral que facilite la gestión coordinada de la atención obstétrica y neonatal, mejorando la calidad de la atención, la trazabilidad de la información y la eficiencia operativa.

### Objetivos Específicos

1. **Centralización de Información**: Unificar toda la información obstétrica y neonatal en un solo sistema
2. **Trazabilidad Completa**: Registrar quién, cuándo y qué cambios se realizaron en cada registro
3. **Control de Acceso**: Garantizar que cada profesional acceda únicamente a las funcionalidades correspondientes a su perfil
4. **Coordinación Multidisciplinaria**: Facilitar la colaboración entre diferentes profesionales (matronas, médicos, enfermeras, administrativos)
5. **Generación de Reportes**: Proporcionar herramientas para análisis y toma de decisiones basadas en datos
6. **Cumplimiento Normativo**: Apoyar el cumplimiento de normativas y estándares de salud (REM - Registro Estadístico de Maternidad)

## Alcance Funcional

### Módulos Principales

#### 1. Gestión de Madres
- Registro completo de información de identificación y demográfica
- Historial de partos y episodios
- Campos específicos para reportes REM

#### 2. Gestión de Partos
- Registro detallado de eventos de parto
- Asignación de equipos multidisciplinarios
- Registro de complicaciones y observaciones
- Campos para buenas prácticas obstétricas

#### 3. Gestión de Recién Nacidos
- Registro de datos neonatales iniciales
- Medidas antropométricas y evaluación Apgar
- Seguimiento de episodios URNI
- Historial de controles y atenciones

#### 4. Episodios de Ingreso/Alta
- Gestión de episodios de madres
- Gestión de episodios URNI (Unidad de Recién Nacidos)
- Cálculo automático de días de estadía
- Condiciones de egreso

#### 5. Atención URNI
- Registro de evaluaciones médicas
- Diagnósticos e indicaciones
- Evolución clínica
- Asignación de responsable clínico

#### 6. Control Neonatal
- Registro de controles periódicos (signos vitales, glucemia, alimentación, medicación)
- Datos flexibles en formato JSON
- Trazabilidad de enfermera responsable

#### 7. Informes de Alta
- Generación de informes completos por episodio
- Exportación en múltiples formatos (PDF, DOCX, HTML)
- Vinculación con partos y recién nacidos

#### 8. Módulo de Alta (Aprobación Médica)
- Revisión de informes generados por matronas
- Proceso de aprobación médica antes del alta
- Visualización completa del caso

#### 9. Indicadores y Métricas
- Visualizaciones gráficas de actividad
- Métricas operacionales
- Filtrado por rangos de fechas
- Exportación de datos

#### 10. Auditoría
- Registro completo de todas las acciones
- Trazabilidad de modificaciones
- Filtrado y búsqueda avanzada

#### 11. Reportes REM
- Generación de reportes estadísticos
- Snapshots de datos fuente
- Totales agregados

#### 12. Gestión de Usuarios y Roles
- Sistema RBAC completo
- Gestión de usuarios, roles y permisos
- Asignación granular de permisos

## Casos de Uso Principales

### Caso de Uso 1: Registro Completo de Atención Obstétrica

**Actor**: Matrona

**Flujo**:
1. Registrar información de la madre embarazada
2. Crear episodio de ingreso
3. Registrar evento de parto con profesionales involucrados
4. Registrar datos de recién nacidos
5. Generar informe de alta

**Resultado**: Información completa y trazable del proceso obstétrico

### Caso de Uso 2: Atención Especializada Neonatal

**Actor**: Médico

**Flujo**:
1. Crear episodio URNI para recién nacido
2. Registrar evaluaciones médicas periódicas
3. Registrar diagnósticos e indicaciones
4. Aprobar alta médica cuando corresponda

**Resultado**: Seguimiento completo de la atención neonatal especializada

### Caso de Uso 3: Control Neonatal Continuo

**Actor**: Enfermera

**Flujo**:
1. Buscar recién nacido por RUT de la madre
2. Registrar controles periódicos (signos vitales, glucemia, etc.)
3. Vincular controles con episodio URNI si aplica
4. Registrar observaciones

**Resultado**: Historial completo de controles neonatales

### Caso de Uso 4: Gestión Administrativa

**Actor**: Administrativo

**Flujo**:
1. Registrar ingreso de madre
2. Gestionar alta de episodios
3. Generar reportes REM
4. Consultar información básica de madres

**Resultado**: Gestión eficiente de procesos administrativos

### Caso de Uso 5: Análisis y Toma de Decisiones

**Actor**: Jefatura

**Flujo**:
1. Consultar indicadores del sistema
2. Filtrar por rangos de fechas
3. Analizar tendencias y métricas
4. Revisar auditoría de actividades
5. Exportar datos para análisis externo

**Resultado**: Información para toma de decisiones basada en datos

## Flujos de Trabajo Principales

### Flujo Completo: Desde Ingreso hasta Alta

```
1. Registro de Madre
   ↓
2. Episodio de Ingreso (Madre)
   ↓
3. Registro de Parto
   ↓
4. Registro de Recién Nacidos
   ↓
5. Episodio URNI (si aplica)
   ↓
6. Atenciones Médicas (URNI)
   ↓
7. Controles Neonatales
   ↓
8. Generación de Informe de Alta
   ↓
9. Aprobación Médica
   ↓
10. Alta del Episodio
```

### Flujo de Informes de Alta

```
1. Matrona selecciona episodio y parto
   ↓
2. Sistema genera informe con toda la información
   ↓
3. Informe se almacena en el sistema
   ↓
4. Médico revisa informe en módulo de alta
   ↓
5. Médico aprueba o solicita modificaciones
   ↓
6. Se procede con el alta
```

### Flujo de Atención URNI

```
1. Crear episodio de ingreso URNI
   ↓
2. Asignar responsable clínico
   ↓
3. Registrar atenciones médicas periódicas
   ↓
4. Registrar controles neonatales
   ↓
5. Registrar alta con condición de egreso
   ↓
6. Sistema calcula días de estadía
```

## Características Especiales

### Trazabilidad Completa

Cada registro en el sistema mantiene información sobre:
- **Usuario creador**: Quién registró inicialmente la información
- **Usuario modificador**: Quién realizó la última actualización
- **Fechas**: Timestamps de creación y última modificación
- **Auditoría**: Registro completo de todas las acciones realizadas

### Equipos Multidisciplinarios

El sistema permite asignar múltiples profesionales a un mismo parto:
- Una o más matronas
- Múltiples médicos
- Varias enfermeras

Esto refleja la realidad de los equipos multidisciplinarios que participan en la atención obstétrica.

### Control de Acceso Granular

Sistema RBAC que permite:
- Asignar múltiples roles a un usuario
- Permisos específicos por acción (crear, leer, actualizar, eliminar)
- Permisos limitados para ciertos roles (ej: administrativo solo datos básicos)
- Auditoría de intentos de acceso denegados

### Datos Flexibles

El sistema utiliza almacenamiento flexible (JSON) para:
- Datos de controles neonatales (adaptándose a diferentes tipos de control)
- Contenido de informes de alta
- Snapshots de reportes REM
- Detalles de auditoría (estados antes/después)

### Validaciones Inteligentes

- Validación de RUT chileno con dígito verificador
- Validación de fechas (no futuras, consistencia temporal)
- Validación de relaciones (ej: parto debe pertenecer a la madre del episodio)
- Validación de estados (ej: solo episodios INGRESADO pueden tener alta)

## Beneficios del Sistema

### Para Profesionales de la Salud

- **Eficiencia**: Acceso rápido a información completa del paciente
- **Coordinación**: Mejor comunicación entre diferentes profesionales
- **Trazabilidad**: Registro claro de quién hizo qué y cuándo
- **Historial Completo**: Acceso a toda la información histórica

### Para la Institución

- **Cumplimiento**: Apoyo para cumplir normativas y estándares
- **Análisis**: Herramientas para análisis y toma de decisiones
- **Auditoría**: Registro completo de actividades para cumplimiento
- **Eficiencia Operativa**: Reducción de tiempo en procesos administrativos

### Para los Pacientes

- **Calidad de Atención**: Mejor coordinación entre profesionales
- **Seguridad**: Validaciones y controles que previenen errores
- **Historial Completo**: Información completa y accesible

## Próximos Pasos

Después de leer esta introducción, te recomendamos:

1. Revisar la [Arquitectura del Sistema](02-arquitectura.md) para entender cómo está construido
2. Seguir la guía de [Instalación](03-instalacion.md) para configurar tu entorno
3. Consultar los [Módulos](07-modulos.md) para entender las funcionalidades en detalle
4. Revisar la [Referencia de API](06-api-reference.md) si vas a integrar con otros sistemas

---

**Siguiente**: [Arquitectura del Sistema](02-arquitectura.md)

