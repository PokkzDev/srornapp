# Sistema SRORN

Sistema de Registro de Obstetricia y Recién Nacidos - Plataforma de gestión hospitalaria especializada en la atención de madres y recién nacidos.

## Descripción General

SRORN es un sistema integral diseñado para gestionar todo el ciclo de atención obstétrica y neonatal en un entorno hospitalario. El sistema permite registrar, monitorear y administrar la información de madres embarazadas, partos, recién nacidos y sus respectivos episodios de ingreso y alta, facilitando la coordinación entre diferentes profesionales de la salud.

## Módulos Principales

### Módulo de Madres

Gestión completa del registro de madres embarazadas que ingresan al sistema. Permite registrar:

- **Información de identificación**: RUT, nombres, apellidos
- **Datos demográficos**: Edad, fecha de nacimiento, dirección, teléfono
- **Ficha clínica**: Número único de identificación hospitalaria
- **Historial de partos**: Relación con todos los partos asociados
- **Episodios de ingreso/alta**: Registro de ingresos y altas hospitalarias

El módulo permite crear, editar y consultar la información de las madres, manteniendo un historial completo de su atención en el sistema.

### Módulo de Partos

Registro detallado de eventos de parto con información completa del proceso:

- **Datos del evento**: Fecha y hora del parto
- **Tipo de parto**: Eutócico, distócico, cesárea electiva o cesárea de emergencia
- **Lugar del parto**: Sala de parto, pabellón, domicilio u otro
- **Complicaciones y observaciones**: Registro de eventos relevantes durante el parto
- **Profesionales involucrados**: Asignación de matronas, médicos y enfermeras que participaron
- **Recién nacidos asociados**: Relación con los bebés nacidos en el parto

Cada parto está vinculado a una madre y puede tener múltiples recién nacidos asociados.

### Módulo de Recién Nacidos

Gestión de la información de los bebés desde su nacimiento:

- **Datos básicos**: Sexo (Masculino, Femenino, Intersexual)
- **Medidas antropométricas**: Peso en gramos, talla en centímetros
- **Evaluación Apgar**: Puntuación al minuto y a los 5 minutos
- **Observaciones clínicas**: Notas adicionales sobre el estado del recién nacido
- **Episodios URNI**: Registro de ingresos a la Unidad de Recién Nacidos
- **Controles neonatales**: Historial de controles realizados
- **Atenciones médicas**: Evaluaciones y tratamientos recibidos
- **Pulsera NFC**: Asignación de pulsera de identificación (opcional)

### Ingreso/Alta

Módulo administrativo para gestionar los episodios de ingreso y alta tanto de madres como de recién nacidos:

**Episodios de Madre:**
- Registro de ingreso con motivo y fecha
- Información de hospital anterior si aplica
- Gestión de alta con condición de egreso
- Vinculación con informes de alta

**Episodios URNI (Unidad de Recién Nacidos):**
- Ingreso de recién nacidos a la unidad
- Motivo de ingreso y fecha
- Seguimiento del estado (Ingresado/Alta)
- Condición de egreso al momento del alta

### Atención URNI

Módulo médico para registrar evaluaciones y atenciones a recién nacidos en la Unidad de Recién Nacidos:

- **Evaluaciones médicas**: Diagnósticos y evaluaciones clínicas
- **Indicaciones**: Tratamientos y recomendaciones médicas
- **Fecha y hora**: Registro temporal de cada atención
- **Vinculación con episodio**: Asociación con el episodio de ingreso correspondiente

Cada atención queda registrada con el médico responsable, permitiendo trazabilidad completa.

### Control Neonatal

Módulo de enfermería para registrar controles periódicos de recién nacidos:

- **Tipos de control**: 
  - Signos vitales
  - Glucemia
  - Alimentación
  - Medicación
  - Otros controles personalizados
- **Datos estructurados**: Información almacenada en formato flexible (JSON) para adaptarse a diferentes tipos de control
- **Observaciones**: Notas adicionales del profesional
- **Trazabilidad**: Registro de la enfermera responsable y fecha/hora del control

### Informe de Alta

Módulo para la generación de informes de alta por parte de las matronas:

- **Selección de episodio y parto**: Elección del caso específico para generar el informe
- **Formato de exportación**: Generación en PDF, DOCX o HTML
- **Contenido del informe**: Incluye información completa de:
  - Datos de la madre
  - Información del parto
  - Datos de recién nacidos asociados
  - Información del episodio de ingreso/alta
- **Almacenamiento**: Los informes se guardan en el sistema con metadatos completos

Los informes generados quedan disponibles para revisión y aprobación médica.

### Módulo de Alta

Módulo médico para revisar y aprobar altas basadas en informes generados:

- **Listado de episodios**: Visualización de episodios con informes de alta generados
- **Revisión de informes**: Acceso a la información completa del caso
- **Aprobación de alta**: Proceso de validación médica antes de proceder con el alta
- **Filtros y búsqueda**: Herramientas para localizar casos específicos por RUT, nombre o estado

Este módulo asegura que todas las altas sean revisadas y aprobadas por personal médico autorizado.

## Sistema de Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles (RBAC) con los siguientes perfiles:

### Roles Disponibles

- **Matrona**: Profesional especializado en atención materno-infantil
  - Acceso a módulos de madres, partos, recién nacidos
  - Generación de informes de alta
  - Registro de información obstétrica

- **Médico**: Profesional médico
  - Atención URNI (evaluaciones y diagnósticos)
  - Aprobación de altas en módulo de alta
  - Revisión de casos clínicos

- **Enfermera**: Profesional de enfermería
  - Control neonatal (registro de controles)
  - Participación en partos
  - Seguimiento de recién nacidos

- **Administrativo**: Personal administrativo
  - Gestión de ingresos y altas
  - Registro inicial de madres
  - Administración de episodios

- **Jefatura**: Personal de dirección y supervisión
  - Acceso a auditoría
  - Consulta de indicadores
  - Revisión de reportes

### Control de Acceso

Cada módulo y acción requiere permisos específicos, garantizando que solo el personal autorizado pueda realizar determinadas operaciones. El sistema verifica permisos en cada solicitud, asegurando la seguridad y confidencialidad de la información.

## Características Adicionales

### Sistema de Auditoría

Registro completo de todas las acciones realizadas en el sistema:

- **Acciones registradas**: Creación, actualización, eliminación, login, exportación, denegación de permisos
- **Información capturada**: Usuario, rol, entidad afectada, fecha/hora, IP, user agent
- **Trazabilidad**: Registro de estados antes y después de modificaciones (cuando aplica)
- **Consultas**: Acceso a historial completo de actividades del sistema

### Trazabilidad de Cambios

Cada registro en el sistema mantiene información sobre:

- **Usuario creador**: Quién registró inicialmente la información
- **Usuario modificador**: Quién realizó la última actualización
- **Fechas**: Timestamps de creación y última modificación
- **Relaciones**: Vinculación con profesionales responsables (médicos, enfermeras, matronas)

### Gestión de Profesionales

El sistema permite asignar múltiples profesionales a un mismo parto:

- **Matronas**: Una o más matronas pueden ser asignadas
- **Médicos**: Registro de médicos participantes
- **Enfermeras**: Asignación de personal de enfermería

Esta funcionalidad permite reflejar la realidad de los equipos multidisciplinarios que participan en la atención.

### Pulseras NFC (Opcional)

Soporte para identificación de recién nacidos mediante pulseras NFC:

- **Asignación de pulsera**: Vinculación de pulsera NFC única con recién nacido
- **Estados**: Activa, reemplazada o baja
- **Trazabilidad**: Registro de cuándo fue asignada y si fue reemplazada

## Flujo de Trabajo

### Flujo Principal: Desde Ingreso hasta Alta

1. **Registro de Madre**: El personal administrativo registra la información de la madre embarazada que ingresa al sistema.

2. **Episodio de Ingreso**: Se crea un episodio de ingreso para la madre con motivo y fecha.

3. **Registro de Parto**: Cuando ocurre el parto, la matrona registra la información completa del evento, incluyendo tipo, lugar, complicaciones y profesionales involucrados.

4. **Registro de Recién Nacidos**: Se registran los datos de cada recién nacido, incluyendo medidas, Apgar y observaciones.

5. **Episodio URNI (si aplica)**: Si el recién nacido requiere atención especializada, se crea un episodio de ingreso a la Unidad de Recién Nacidos.

6. **Atención Médica**: Los médicos registran evaluaciones, diagnósticos e indicaciones para los recién nacidos en URNI.

7. **Controles Neonatales**: Las enfermeras registran controles periódicos (signos vitales, alimentación, medicación, etc.).

8. **Generación de Informe de Alta**: La matrona genera el informe de alta seleccionando el episodio y parto correspondiente.

9. **Aprobación Médica**: El médico revisa el informe en el módulo de alta y aprueba o solicita modificaciones.

10. **Alta**: Una vez aprobado, se procede con el alta del episodio, registrando fecha y condición de egreso.

### Proceso de Informes

- Las matronas generan informes de alta con toda la información relevante del caso
- Los informes se almacenan en el sistema con formato seleccionado (PDF, DOCX, HTML)
- Los médicos pueden revisar y aprobar estos informes antes de proceder con el alta
- El sistema mantiene un registro completo de quién generó cada informe y cuándo

## Integración y Tecnología

El sistema está construido con tecnologías modernas que garantizan:

- **Interfaz web responsive**: Acceso desde cualquier dispositivo
- **Base de datos relacional**: Almacenamiento seguro y estructurado de la información
- **API RESTful**: Comunicación estándar entre componentes
- **Autenticación segura**: Sistema de login con hash de contraseñas
- **Rendimiento optimizado**: Consultas eficientes con índices en campos clave

---

*Sistema SRORN - Gestión integral de atención obstétrica y neonatal*
