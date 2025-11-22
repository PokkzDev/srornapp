# Visión General del Sistema SRORN

## ¿Qué es SRORN?

SRORN es un sistema diseñado para gestionar de manera integral todo el proceso de atención obstétrica y neonatal en un hospital. Permite registrar, monitorear y administrar la información completa desde que una madre embarazada ingresa al hospital hasta que tanto la madre como el recién nacido reciben el alta.

El sistema facilita la coordinación entre diferentes profesionales de la salud (matronas, médicos, enfermeras y personal administrativo), asegurando que toda la información relevante esté disponible cuando se necesita y que cada profesional pueda realizar su trabajo de manera eficiente.

## Funcionalidades Principales

### Gestión de Madres

El sistema permite registrar toda la información de las madres embarazadas que ingresan al hospital. Se puede registrar datos de identificación, información demográfica, historial clínico y mantener un registro completo de todos sus partos y episodios de atención. Cada madre tiene un historial completo que se va construyendo a lo largo del tiempo, permitiendo ver todos sus partos anteriores y episodios de atención.

### Registro de Partos

Cuando ocurre un parto, el sistema permite registrar todos los detalles del evento: fecha y hora, tipo de parto, lugar donde ocurrió, complicaciones si las hubo, y asignar a todos los profesionales que participaron (matronas, médicos, enfermeras). Esto refleja la realidad de los equipos multidisciplinarios que trabajan juntos en la atención obstétrica.

### Gestión de Recién Nacidos

Desde el momento del nacimiento, se registran todos los datos del bebé: medidas como peso y talla, evaluación de su estado de salud (Apgar), observaciones clínicas importantes, y cualquier información relevante. El sistema mantiene un historial completo de cada recién nacido, incluyendo todos los controles y atenciones que recibe durante su estadía en el hospital.

### Episodios de Ingreso y Alta

El sistema gestiona los episodios de ingreso tanto de madres como de recién nacidos. Para cada ingreso se registra el motivo, la fecha y hora, y cualquier información relevante como si viene de otro hospital. Cuando corresponde dar el alta, se registra la condición de egreso y el sistema calcula automáticamente cuántos días estuvo ingresado.

### Atención en URNI (Unidad de Recién Nacidos)

Cuando un recién nacido requiere atención especializada, se crea un episodio de ingreso a la Unidad de Recién Nacidos. Los médicos pueden registrar evaluaciones periódicas, diagnósticos, indicaciones de tratamiento y la evolución del paciente. Cada atención queda vinculada al episodio correspondiente y se mantiene un historial completo de todas las evaluaciones médicas.

### Control Neonatal

Las enfermeras registran controles periódicos de los recién nacidos, como signos vitales (temperatura, frecuencia cardíaca, respiración), niveles de azúcar en sangre, alimentación, medicación administrada y otros controles necesarios. Todos estos controles quedan registrados con la fecha, hora y la enfermera responsable, permitiendo un seguimiento detallado de la evolución del bebé.

### Informes de Alta

Las matronas pueden generar informes completos de alta que incluyen toda la información relevante del caso: datos de la madre, información del parto, datos de los recién nacidos y detalles del episodio de ingreso. Estos informes se pueden exportar en diferentes formatos y quedan almacenados en el sistema para su revisión.

### Aprobación Médica de Altas

Antes de proceder con un alta, los médicos revisan los informes generados por las matronas. El sistema permite ver toda la información del caso de manera completa, facilitando la toma de decisiones. Solo después de la aprobación médica se procede con el alta del paciente.

### Indicadores y Estadísticas

El sistema proporciona visualizaciones y estadísticas sobre la actividad del hospital. Se pueden ver métricas sobre partos, recién nacidos, episodios de ingreso, controles realizados y otros indicadores relevantes. Esta información ayuda a la dirección del hospital a tomar decisiones basadas en datos y a entender las tendencias de atención.

### Auditoría

Todas las acciones realizadas en el sistema quedan registradas. Se puede ver quién hizo qué, cuándo lo hizo y qué cambios realizó. Esto garantiza la trazabilidad completa y permite revisar el historial de cualquier registro si es necesario.

### Reportes REM

El sistema permite generar reportes estadísticos para el Registro Estadístico de Maternidad, consolidando información de períodos específicos para reportes oficiales.

## Flujos de Trabajo Principales

### Flujo Completo: Desde el Ingreso hasta el Alta

1. **Registro de la Madre**: Cuando una madre embarazada ingresa al hospital, se registra su información en el sistema.

2. **Episodio de Ingreso**: Se crea un registro del ingreso con el motivo y la fecha, y si viene de otro hospital, esa información también se registra.

3. **Registro del Parto**: Cuando ocurre el parto, se registra toda la información del evento: tipo de parto, lugar, profesionales que participaron, y cualquier detalle relevante.

4. **Registro de Recién Nacidos**: Se registran los datos de cada bebé nacido: peso, talla, evaluación de salud inicial y observaciones.

5. **Episodio URNI (si es necesario)**: Si el recién nacido requiere atención especializada, se crea un episodio de ingreso a la Unidad de Recién Nacidos con el motivo y se asigna un médico responsable.

6. **Atención Médica**: Los médicos registran evaluaciones periódicas, diagnósticos e indicaciones para los recién nacidos que están en URNI.

7. **Controles Neonatales**: Las enfermeras registran controles periódicos de signos vitales, alimentación, medicación y otros aspectos del cuidado del bebé.

8. **Generación del Informe de Alta**: La matrona genera un informe completo con toda la información del caso.

9. **Aprobación Médica**: El médico revisa el informe y aprueba el alta cuando corresponde.

10. **Alta**: Se registra el alta con la fecha y la condición de egreso. El sistema calcula automáticamente los días de estadía.

### Flujo de Atención en URNI

Cuando un recién nacido ingresa a la Unidad de Recién Nacidos:

1. Se crea el episodio de ingreso con motivo y médico responsable asignado.
2. Los médicos registran atenciones periódicas con diagnósticos y evolución.
3. Las enfermeras registran controles de rutina vinculados al episodio.
4. Se mantiene un historial completo de todas las atenciones y controles.
5. Al momento del alta, se registra la condición de egreso y el sistema calcula los días de estadía.

## Tipos de Usuarios y sus Funcionalidades

### Matrona

Las matronas tienen acceso completo a los módulos clínicos principales. Pueden:

- Registrar y gestionar información de madres
- Registrar partos con todos sus detalles
- Registrar información de recién nacidos
- Generar informes de alta
- Crear episodios de ingreso a URNI
- Ver y editar registros clínicos

### Médico

Los médicos se enfocan en la atención especializada y la aprobación de altas. Pueden:

- Registrar evaluaciones y atenciones médicas en URNI
- Ver diagnósticos e indicaciones de tratamiento
- Registrar la evolución de los pacientes
- Revisar y aprobar altas médicas
- Ver información completa de recién nacidos y sus historiales

### Enfermera

Las enfermeras se encargan del registro de controles periódicos. Pueden:

- Registrar controles neonatales (signos vitales, glucemia, alimentación, medicación)
- Ver información de los recién nacidos bajo su cuidado
- Mantener un registro detallado de todos los controles realizados
- Ver información general de episodios URNI

### Personal Administrativo

El personal administrativo gestiona los procesos de ingreso y alta. Pueden:

- Registrar información básica de madres
- Gestionar episodios de ingreso y alta
- Generar reportes REM
- Consultar información básica de pacientes

### Jefatura

La jefatura tiene acceso a módulos de análisis y supervisión. Pueden:

- Consultar indicadores y estadísticas del sistema
- Revisar la auditoría de actividades
- Ver visualizaciones de tendencias y métricas
- Analizar información para toma de decisiones

## Características Especiales

### Trazabilidad Completa

Cada registro en el sistema mantiene información sobre quién lo creó, quién lo modificó por última vez y cuándo ocurrieron estos eventos. Esto garantiza que siempre se pueda rastrear el origen de la información y quién fue responsable de cada acción.

### Equipos Multidisciplinarios

El sistema refleja la realidad de la atención hospitalaria donde múltiples profesionales trabajan juntos. En un mismo parto se pueden asignar varias matronas, múltiples médicos y varias enfermeras, reconociendo el trabajo en equipo que caracteriza la atención obstétrica moderna.

### Control de Acceso por Roles

Cada profesional solo puede acceder a las funcionalidades que corresponden a su rol. Esto garantiza la seguridad de la información y asegura que cada persona trabaje dentro de su ámbito de competencia.

### Información Interconectada

Todos los registros están relacionados entre sí. Un parto está vinculado a una madre, los recién nacidos están vinculados a un parto, los episodios URNI están vinculados a recién nacidos, y así sucesivamente. Esto permite ver la información completa de un caso desde cualquier punto de entrada y entender el contexto completo de cada situación.

### Cálculos Automáticos

El sistema realiza cálculos automáticos cuando corresponde, como los días de estadía de un episodio, evitando errores manuales y ahorrando tiempo a los profesionales.

### Historial Completo

Cada paciente, ya sea madre o recién nacido, tiene un historial completo que se va construyendo a lo largo del tiempo. Esto permite ver todos los partos anteriores de una madre, todos los controles de un recién nacido, y toda la información relevante en un solo lugar.

## Propósito del Sistema

SRORN busca mejorar la calidad de la atención obstétrica y neonatal mediante:

- **Organización**: Centralizar toda la información en un solo lugar, evitando registros dispersos y facilitando el acceso cuando se necesita.

- **Coordinación**: Permitir que diferentes profesionales trabajen de manera coordinada, cada uno registrando su parte del proceso y teniendo acceso a la información relevante.

- **Trazabilidad**: Mantener un registro completo de quién hizo qué y cuándo, garantizando la responsabilidad y permitiendo revisar historiales cuando sea necesario.

- **Eficiencia**: Reducir el tiempo dedicado a tareas administrativas y permitir que los profesionales se enfoquen en la atención directa a los pacientes.

- **Análisis**: Proporcionar información y estadísticas que ayuden a la dirección del hospital a tomar decisiones basadas en datos y a mejorar continuamente los procesos de atención.

---

*Sistema SRORN - Gestión integral de atención obstétrica y neonatal*

