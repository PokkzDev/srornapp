# Manual de Usuario
## Sistema SRORN
### Sistema de Registro de Obstetricia y Recién Nacidos

---

**Versión del Documento:** 1.0  
**Versión del Sistema:** 0.1.0  
**Fecha de Elaboración:** Noviembre 2025  
**Última Actualización:** Noviembre 2025

---

## Portada

**Título:** Manual de Usuario - Sistema SRORN  
**Sistema:** Sistema de Registro de Obstetricia y Recién Nacidos  
**Versión del Sistema:** 0.1.0  
**Fecha:** Noviembre 2025

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
   1.1. [Propósito del Manual](#11-propósito-del-manual)
   1.2. [Alcance del Sistema](#12-alcance-del-sistema)
   1.3. [Convenciones Utilizadas](#13-convenciones-utilizadas)
   1.4. [Requisitos del Sistema](#14-requisitos-del-sistema)

2. [Acceso al Sistema](#2-acceso-al-sistema)
   2.1. [Iniciar Sesión](#21-iniciar-sesión)
   2.2. [Cerrar Sesión](#22-cerrar-sesión)

3. [Guía por Roles](#3-guía-por-roles)
   3.1. [Matrona](#31-matrona)
   3.2. [Médico](#32-médico)
   3.3. [Enfermera](#33-enfermera)
   3.4. [Administrativo](#34-administrativo)
   3.5. [Jefatura](#35-jefatura)
   3.6. [Administrador TI](#36-administrador-ti)

4. [Preguntas Frecuentes](#4-preguntas-frecuentes)

5. [Glosario de Términos](#5-glosario-de-términos)

6. [Apéndices](#6-apéndices)
   6.1. [Contacto y Soporte](#61-contacto-y-soporte)
   6.2. [Historial de Versiones](#62-historial-de-versiones)

---

## 1. Introducción

### 1.1. Propósito del Manual

Este manual está diseñado para ayudar a los usuarios del sistema SRORN a utilizar todas las funcionalidades disponibles según su rol profesional. El documento proporciona instrucciones detalladas paso a paso, acompañadas de capturas de pantalla, para facilitar el uso efectivo del sistema.

**Audiencia:**  
Este manual está dirigido a todos los usuarios del sistema SRORN, incluyendo:
- Matronas
- Médicos
- Enfermeras
- Personal Administrativo
- Jefatura
- Administradores TI

### 1.2. Alcance del Sistema

El Sistema SRORN (Sistema de Registro de Obstetricia y Recién Nacidos) es una aplicación web diseñada para gestionar de manera integral todo el proceso de atención obstétrica y neonatal en un hospital. Permite registrar, monitorear y administrar la información completa desde que una madre embarazada ingresa al hospital hasta que tanto la madre como el recién nacido reciben el alta.

**Funcionalidades Principales:**
- Gestión de información de madres embarazadas
- Registro de partos con detalles completos
- Gestión de recién nacidos
- Episodios de ingreso y alta
- Atención en URNI (Unidad de Recién Nacidos)
- Control neonatal
- Generación de informes de alta
- Aprobación médica de altas
- Indicadores y estadísticas
- Auditoría de actividades
- Reportes REM (Registro Estadístico Mensual)

### 1.3. Convenciones Utilizadas

En este manual se utilizan las siguientes convenciones:

**Tipografía:**
- **Texto en negrita**: Indica nombres de botones, opciones de menú, o elementos de interfaz que debe hacer clic.
- `Texto en código`: Indica valores específicos que debe ingresar (ej: `matrona@srorn.cl`).
- *Texto en cursiva*: Indica información importante o notas adicionales.

**Símbolos y Notaciones:**
- ➡️ Indica el siguiente paso en un proceso
- ⚠️ Indica una advertencia o precaución importante
- ℹ️ Indica información adicional o útil
- [INSERTA SCREENSHOT AQUI]: Indica dónde se debe insertar una captura de pantalla

**Estructura de Instrucciones:**
Las instrucciones se presentan en formato numerado paso a paso:
1. Primer paso
2. Segundo paso
   - Subpaso (si aplica)
   - Otro subpaso

### 1.4. Requisitos del Sistema

Para utilizar el sistema SRORN, su computador debe cumplir con los siguientes requisitos:

**Requisitos Mínimos:**
- **Navegador Web:** 
  - Google Chrome (versión 90 o superior)
  - Mozilla Firefox (versión 88 o superior)
  - Microsoft Edge (versión 90 o superior)
  - Safari (versión 14 o superior)
- **Conexión a Internet:** Requerida para acceder al sistema
- **Resolución de Pantalla:** Mínimo 1024x768 píxeles (recomendado 1920x1080)
- **JavaScript:** Debe estar habilitado en el navegador
- **Cookies:** Deben estar habilitadas para mantener la sesión

**Requisitos Recomendados:**
- Navegador actualizado a la última versión disponible
- Conexión a Internet estable
- Resolución de pantalla de 1920x1080 o superior para mejor experiencia visual

**Nota:** El sistema es responsivo y se adapta a diferentes tamaños de pantalla, pero para una experiencia óptima se recomienda usar un monitor de tamaño estándar o superior.

---

## 2. Acceso al Sistema

### 2.1. Iniciar Sesión

Para acceder al sistema SRORN, siga estos pasos:

1. Abra su navegador web preferido (Chrome, Firefox, Edge o Safari).

2. Ingrese la URL del sistema SRORN en la barra de direcciones del navegador.

3. Se mostrará la pantalla de inicio de sesión del sistema.

[INSERTA SCREENSHOT AQUI - Pantalla de login completa]

4. En el formulario de inicio de sesión, ingrese sus credenciales:
   - **Campo "Correo electrónico o RUT"**: 
     - Puede usar su correo electrónico (ejemplo: `matrona@srorn.cl`)
     - O puede usar su RUT chileno (ejemplo: `12345678-9`)
     - El sistema detecta automáticamente si ingresó un email o un RUT
   - **Campo "Contraseña"**: Ingrese la contraseña que le fue asignada

[INSERTA SCREENSHOT AQUI - Formulario de login con campos destacados]

5. Haga clic en el botón **"Iniciar sesión"**.

6. Si las credenciales son correctas:
   - Será redirigido automáticamente al dashboard principal
   - Verá el menú lateral con los módulos disponibles según su rol
   - Su sesión quedará activa durante 7 días (a menos que cierre sesión manualmente)

7. Si las credenciales son incorrectas:
   - Verá un mensaje de error indicando que el correo/RUT o contraseña son incorrectos
   - Verifique que escribió correctamente sus credenciales
   - Si el problema persiste, contacte al Administrador TI

**Notas Importantes:**
- ⚠️ El sistema distingue entre mayúsculas y minúsculas en las contraseñas
- ⚠️ Si ingresa un RUT, debe usar el formato sin puntos y con guion (ej: `12345678-9`)
- ℹ️ Su sesión permanecerá activa durante 7 días si no cierra sesión manualmente

### 2.2. Cerrar Sesión

Para cerrar su sesión en el sistema:

1. En la parte inferior del menú lateral, encontrará su información de usuario.

2. Haga clic en su nombre o en el menú de usuario.

3. Seleccione la opción **"Cerrar sesión"**.

4. Será redirigido a la pantalla de inicio de sesión y su sesión quedará cerrada.

[INSERTA SCREENSHOT AQUI - Menú de usuario con opción de cerrar sesión]

**Nota:** Se recomienda cerrar sesión siempre que termine de usar el sistema, especialmente si está usando una computadora compartida.

---

## 3. Guía por Roles

El sistema SRORN utiliza un modelo de control de acceso basado en roles (RBAC). Cada usuario tiene asignado uno o más roles que determinan qué funcionalidades puede utilizar. Las siguientes secciones detallan el uso del sistema para cada rol profesional.

---

### 3.1. Matrona

#### 3.1.1. Introducción

Las matronas tienen acceso completo a los módulos clínicos principales del sistema. Pueden gestionar información de madres, registrar partos, gestionar recién nacidos, crear episodios URNI y generar informes de alta.

**Funcionalidades Disponibles:**
- Gestión completa de madres (crear, editar, visualizar, eliminar)
- Gestión completa de partos (crear, editar, visualizar, eliminar)
- Gestión completa de recién nacidos (crear, editar, visualizar, eliminar)
- Creación de episodios URNI
- Visualización de episodios de ingreso/alta
- Generación de informes de alta

#### 3.1.2. Dashboard Principal

Después de iniciar sesión, las matronas acceden al dashboard principal que muestra el menú lateral con los módulos disponibles.

[INSERTA SCREENSHOT AQUI - Dashboard principal de Matrona con menú lateral]

#### 3.1.3. Módulo Madres

El módulo de madres permite gestionar toda la información de las madres embarazadas que ingresan al hospital.

##### 3.1.3.1. Ver Listado de Madres

1. En el menú lateral, haga clic en **"Modulo Madres"**.
2. Se mostrará un listado con todas las madres registradas en el sistema.
3. Puede buscar una madre específica usando:
   - RUT de la madre
   - Nombre o apellido
   - Ficha clínica

[INSERTA SCREENSHOT AQUI - Listado de madres con barra de búsqueda]

#### Crear Nueva Madre

1. En el listado de madres, haga clic en el botón **"Nueva Madre"**.
2. Complete el formulario con la siguiente información:

   **Datos de Identificación:**
   - RUT (sin puntos, con guion, ej: `12345678-9`)
   - Nombres
   - Apellidos

   **Datos Demográficos:**
   - Edad (en años)
   - Fecha de nacimiento
   - Dirección
   - Teléfono
   - Ficha clínica (opcional)

   **Campos REM (si aplica):**
   - Pertenencia a pueblo originario
   - Condición migrante
   - Condición de discapacidad
   - Condición privada de libertad
   - Identidad trans
   - Hepatitis B positiva
   - Control prenatal

[INSERTA SCREENSHOT AQUI - Formulario de creación de madre]

3. Haga clic en **"Guardar"** para registrar la madre.
4. Verá un mensaje de confirmación y será redirigido al listado de madres.

##### 3.1.3.3. Editar Información de una Madre

1. En el listado de madres, busque la madre que desea editar.
2. Haga clic en el nombre de la madre o en el botón **"Ver detalles"**.
3. En la página de detalles, haga clic en el botón **"Editar"**.
4. Modifique los campos necesarios.
5. Haga clic en **"Guardar cambios"**.

[INSERTA SCREENSHOT AQUI - Formulario de edición de madre]

##### 3.1.3.4. Ver Historial de una Madre

1. En el listado de madres, haga clic en una madre para ver sus detalles.
2. En la página de detalles podrá ver:
   - Información completa de la madre
   - Historial de partos asociados
   - Episodios de ingreso y alta
   - Información de recién nacidos vinculados

[INSERTA SCREENSHOT AQUI - Página de detalles de madre con historial]

#### 3.1.4. Módulo Partos

El módulo de partos permite registrar todos los detalles de los eventos de parto.

##### 3.1.4.1. Ver Listado de Partos

1. En el menú lateral, haga clic en **"Modulo Partos"**.
2. Se mostrará un listado con todos los partos registrados.
3. Puede filtrar y buscar partos por:
   - Madre asociada
   - Tipo de parto
   - Fecha
   - Lugar

[INSERTA SCREENSHOT AQUI - Listado de partos]

##### 3.1.4.2. Registrar un Nuevo Parto

1. En el listado de partos, haga clic en el botón **"Nuevo Parto"**.
2. Seleccione la madre asociada al parto (puede buscar por RUT o nombre).
3. Complete el formulario con la siguiente información:

   **Datos del Evento:**
   - Fecha y hora del parto
   - Tipo de parto (Vaginal, Instrumental, Cesárea Electiva, Cesárea Urgencia, etc.)
   - Lugar del parto (Sala de parto, Pabellón, Domicilio, Otro)
   - Detalle del lugar (si aplica)

   **Profesionales Involucrados:**
   - Matronas (mínimo 1)
   - Médicos (requerido si es cesárea)
   - Enfermeras (mínimo 1)

   **Información Adicional:**
   - Curso del parto (Eutócico o Distócico)
   - Inicio del trabajo de parto
   - Modelo de atención (conducción oxitócica, manejo del dolor, etc.)
   - Buenas prácticas implementadas
   - Complicaciones (si las hubo)
   - Observaciones

[INSERTA SCREENSHOT AQUI - Formulario de registro de parto]

4. Haga clic en **"Guardar"** para registrar el parto.
5. Después de guardar, podrá registrar los recién nacidos asociados a este parto.

##### 3.1.4.3. Editar un Parto

1. En el listado de partos, haga clic en el parto que desea editar.
2. En la página de detalles, haga clic en el botón **"Editar"**.
3. Modifique los campos necesarios.
4. Haga clic en **"Guardar cambios"**.

[INSERTA SCREENSHOT AQUI - Formulario de edición de parto]

#### 3.1.5. Módulo Recién Nacidos

El módulo de recién nacidos permite gestionar toda la información de los bebés desde su nacimiento.

##### 3.1.5.1. Ver Listado de Recién Nacidos

1. En el menú lateral, haga clic en **"Modulo Recién Nacidos"**.
2. Se mostrará un listado con todos los recién nacidos registrados.
3. Puede buscar por:
   - RUT de la madre
   - Nombre de la madre
   - Datos del recién nacido

[INSERTA SCREENSHOT AQUI - Listado de recién nacidos]

##### 3.1.5.2. Registrar un Nuevo Recién Nacido

1. En el listado de recién nacidos, haga clic en el botón **"Nuevo Recién Nacido"**.
2. Seleccione el parto asociado (debe haber registrado el parto previamente).
3. Complete el formulario con la siguiente información:

   **Datos Básicos:**
   - Sexo (M, F, I)
   - Peso al nacer (en gramos)
   - Talla (en centímetros)
   - Apgar al minuto (0-10)
   - Apgar a los 5 minutos (0-10)

   **Información REM:**
   - Categoría de peso
   - Anomalías congénitas (si aplica)
   - Reanimación (básica o avanzada)
   - Profilaxis (ocular, hepatitis B)
   - Lactancia y contacto piel a piel

[INSERTA SCREENSHOT AQUI - Formulario de registro de recién nacido]

4. Haga clic en **"Guardar"** para registrar el recién nacido.

##### 3.1.5.3. Ver Detalles y Historial de un Recién Nacido

1. En el listado de recién nacidos, haga clic en el recién nacido que desea ver.
2. En la página de detalles podrá ver:
   - Información completa del recién nacido
   - Información del parto asociado
   - Episodios URNI (si los hay)
   - Controles neonatales registrados
   - Atenciones médicas recibidas

[INSERTA SCREENSHOT AQUI - Página de detalles de recién nacido con historial completo]

#### 3.1.6. Episodios URNI

Las matronas pueden crear episodios de ingreso a la Unidad de Recién Nacidos cuando un bebé requiere atención especializada.

##### 3.1.6.1. Ver Listado de Episodios URNI

1. En el menú lateral, haga clic en **"Episodios URNI"**.
2. Se mostrará un listado con todos los episodios URNI registrados.
3. Puede filtrar por:
   - Estado (Ingresado o Alta)
   - Recién nacido asociado
   - Fecha de ingreso

[INSERTA SCREENSHOT AQUI - Listado de episodios URNI]

##### 3.1.6.2. Crear un Nuevo Episodio URNI

1. En el listado de episodios URNI, haga clic en el botón **"Nuevo Episodio"**.
2. Complete el formulario con la siguiente información:
   - Recién nacido asociado (buscar por RUT de la madre)
   - Fecha y hora de ingreso
   - Motivo de ingreso
   - Servicio/Unidad (URNI, UCIN, Neonatología)
   - Médico responsable clínico (seleccionar de la lista)

[INSERTA SCREENSHOT AQUI - Formulario de creación de episodio URNI]

3. Haga clic en **"Guardar"** para crear el episodio.
4. El episodio quedará en estado "INGRESADO" y los médicos podrán registrar atenciones.

#### 3.1.7. Ingreso/Alta

Este módulo permite visualizar y gestionar los episodios de ingreso y alta de madres.

##### 3.1.7.1. Ver Listado de Episodios de Ingreso/Alta

1. En el menú lateral, haga clic en **"Ingreso/Alta"**.
2. Se mostrará un listado con todos los episodios de ingreso de madres.
3. Puede ver el estado de cada episodio (INGRESADO o ALTA).

[INSERTA SCREENSHOT AQUI - Listado de episodios de ingreso/alta]

#### Ver Detalles de un Episodio

1. En el listado, haga clic en un episodio para ver sus detalles.
2. Podrá ver:
   - Información de la madre
   - Fecha de ingreso y motivo
   - Estado del episodio
   - Información del alta (si ya fue dado)
   - Días de estadía calculados automáticamente

[INSERTA SCREENSHOT AQUI - Página de detalles de episodio de ingreso/alta]

#### 3.1.8. Generar Informe y Solicitud de Alta

Las matronas pueden generar informes completos de alta que serán revisados por los médicos antes de proceder con el alta.

##### 3.1.8.1. Generar un Informe de Alta

1. En el menú lateral, en la sección **"Informes"**, haga clic en **"Generar Informe y Solicitud de alta"**.
2. Se mostrará un listado de episodios en estado INGRESADO que aún no tienen informe generado.
3. Seleccione el episodio para el cual desea generar el informe.
4. Seleccione el parto asociado al episodio (si hay múltiples partos).
5. El sistema mostrará un resumen de la información que se incluirá en el informe:
   - Datos de la madre
   - Información del parto
   - Datos de los recién nacidos
   - Información del episodio

[INSERTA SCREENSHOT AQUI - Selección de episodio y parto para informe]

6. Seleccione el formato de exportación:
   - PDF
   - DOCX
   - HTML

7. Haga clic en **"Generar Informe"**.
8. El informe se generará y podrá descargarlo. El informe también quedará almacenado en el sistema para que el médico lo revise.

[INSERTA SCREENSHOT AQUI - Informe generado con opción de descarga]

---

### 3.2. Médico

#### 3.2.1. Introducción

Los médicos tienen acceso a módulos de atención especializada y aprobación de altas. Pueden registrar atenciones médicas en URNI, gestionar episodios URNI, aprobar altas médicas y visualizar información de recién nacidos.

**Funcionalidades Disponibles:**
- Registrar atenciones médicas en URNI
- Visualizar y gestionar episodios URNI
- Procesar altas de episodios URNI
- Revisar y aprobar informes de alta de madres
- Visualizar información de recién nacidos

#### 3.2.2. Dashboard Principal

Después de iniciar sesión, los médicos acceden al dashboard principal que muestra el menú lateral con los módulos disponibles.

[INSERTA SCREENSHOT AQUI - Dashboard principal de Médico con menú lateral]

#### 3.2.3. Atención URN

Este módulo permite a los médicos registrar evaluaciones y atenciones médicas a recién nacidos en la Unidad de Recién Nacidos.

##### 3.2.3.1. Registrar una Atención Médica

1. En el menú lateral, haga clic en **"Atención URN"**.
2. Se mostrará un formulario para registrar una nueva atención.
3. Complete el formulario con la siguiente información:
   - **Recién nacido**: Busque por RUT de la madre o seleccione de la lista
   - **Episodio URNI**: Seleccione el episodio URNI activo asociado (opcional)
   - **Fecha y hora**: Se establece automáticamente, pero puede modificarla
   - **Diagnóstico**: Ingrese el diagnóstico médico
   - **Indicaciones**: Ingrese las indicaciones de tratamiento
   - **Evolución**: Registre la evolución clínica del paciente

[INSERTA SCREENSHOT AQUI - Formulario de registro de atención URN]

4. Haga clic en **"Guardar"** para registrar la atención.
5. La atención quedará vinculada al recién nacido y al episodio URNI (si se seleccionó uno).

#### 3.2.4. Episodios URNI

Los médicos pueden visualizar y gestionar episodios de ingreso a URNI, incluyendo el procesamiento de altas.

##### 3.2.4.1. Ver Listado de Episodios URNI

1. En el menú lateral, haga clic en **"Episodios URNI"**.
2. Se mostrará un listado con todos los episodios URNI.
3. Puede filtrar por:
   - Estado (Ingresado o Alta)
   - Recién nacido asociado
   - Responsable clínico

[INSERTA SCREENSHOT AQUI - Listado de episodios URNI]

##### 3.2.4.2. Ver Detalles de un Episodio URNI

1. En el listado, haga clic en un episodio para ver sus detalles.
2. En la página de detalles podrá ver:
   - Información del recién nacido
   - Fecha y hora de ingreso
   - Motivo de ingreso
   - Responsable clínico asignado
   - Estado del episodio
   - Todas las atenciones médicas registradas
   - Todos los controles neonatales realizados
   - Información del alta (si ya fue dado)

[INSERTA SCREENSHOT AQUI - Página de detalles de episodio URNI con atenciones y controles]

##### 3.2.4.3. Procesar Alta de un Episodio URNI

1. En la página de detalles de un episodio en estado INGRESADO, haga clic en el botón **"Dar Alta"**.
2. Complete el formulario de alta:
   - Fecha y hora de alta
   - Condición de egreso

[INSERTA SCREENSHOT AQUI - Formulario de alta de episodio URNI]

3. Haga clic en **"Procesar Alta"**.
4. El sistema calculará automáticamente los días de estadía y cambiará el estado del episodio a "ALTA".

#### 3.2.5. Módulo de Alta

Este módulo permite a los médicos revisar y aprobar los informes de alta generados por las matronas antes de proceder con el alta de la madre.

##### 3.2.5.1. Ver Listado de Episodios Pendientes de Aprobación

1. En el menú lateral, haga clic en **"Modulo de Alta"**.
2. Se mostrará un listado de episodios de ingreso de madres que tienen informes de alta generados y están pendientes de aprobación médica.

[INSERTA SCREENSHOT AQUI - Listado de episodios pendientes de aprobación]

##### 3.2.5.2. Revisar y Aprobar un Alta

1. En el listado, haga clic en un episodio para revisar su información completa.
2. En la página de detalles podrá ver:
   - Informe de alta generado por la matrona
   - Información completa de la madre
   - Información del parto asociado
   - Datos de los recién nacidos
   - Información del episodio de ingreso

[INSERTA SCREENSHOT AQUI - Vista de revisión de informe de alta con toda la información]

3. Revise toda la información del caso.
4. Si está de acuerdo con el alta, haga clic en el botón **"Aprobar Alta"**.
5. Complete el formulario de aprobación:
   - Fecha de alta
   - Condición de egreso

[INSERTA SCREENSHOT AQUI - Formulario de aprobación de alta]

6. Haga clic en **"Confirmar Aprobación"**.
7. El episodio será aprobado y el sistema calculará automáticamente los días de estadía.

#### 3.2.6. Visualización de Recién Nacidos

Los médicos pueden visualizar información de recién nacidos para consulta, aunque no pueden editarla directamente.

##### 3.2.6.1. Acceder a Información de Recién Nacidos

1. La información de recién nacidos está disponible a través de:
   - Los episodios URNI (donde se muestra información del RN asociado)
   - Las atenciones médicas registradas
   - Los detalles de partos (donde se muestran los RN asociados)

2. En cualquier vista donde aparezca un recién nacido, puede hacer clic para ver sus detalles completos.

---

### 3.3. Enfermera

#### 3.3.1. Introducción

Las enfermeras tienen acceso a módulos de control y seguimiento neonatal. Pueden registrar controles neonatales periódicos y visualizar información de episodios URNI.

**Funcionalidades Disponibles:**
- Registrar controles neonatales (signos vitales, glucemia, alimentación, medicación)
- Editar y eliminar controles neonatales
- Visualizar historial de controles
- Visualizar información de episodios URNI

#### 3.3.2. Dashboard Principal

Después de iniciar sesión, las enfermeras acceden al dashboard principal que muestra el menú lateral con los módulos disponibles.

[INSERTA SCREENSHOT AQUI - Dashboard principal de Enfermera con menú lateral]

#### 3.3.3. Control Neonatal

Este módulo permite a las enfermeras registrar controles periódicos de los recién nacidos.

##### 3.3.3.1. Ver Listado de Controles

1. En el menú lateral, haga clic en **"Control Neonatal"**.
2. Se mostrará un listado con todos los controles neonatales registrados.
3. Puede filtrar por:
   - Recién nacido
   - Tipo de control
   - Fecha
   - Episodio URNI

[INSERTA SCREENSHOT AQUI - Listado de controles neonatales]

##### 3.3.3.2. Registrar un Nuevo Control Neonatal

1. En el listado de controles, haga clic en el botón **"Nuevo Control"**.
2. Complete el formulario con la siguiente información:

   **Datos Básicos:**
   - **Recién nacido**: Busque por RUT de la madre o seleccione de la lista
   - **Episodio URNI**: Seleccione el episodio URNI asociado (opcional, solo si el RN está en URNI)
   - **Fecha y hora**: Se establece automáticamente, pero puede modificarla
   - **Tipo de control**: Seleccione el tipo:
     - Signos Vitales
     - Glucemia
     - Alimentación
     - Medicación
     - Otro

   **Datos Específicos según Tipo:**

   **Si selecciona "Signos Vitales":**
   - Temperatura (°C)
   - Frecuencia cardíaca (lpm)
   - Frecuencia respiratoria (rpm)
   - Saturación de oxígeno (%)

   **Si selecciona "Glucemia":**
   - Nivel de glucosa en sangre (mg/dL)

   **Si selecciona "Alimentación":**
   - Tipo de alimentación
   - Cantidad
   - Unidad (ml, etc.)

   **Si selecciona "Medicación":**
   - Medicamento administrado
   - Dosis
   - Vía de administración

   **Si selecciona "Otro":**
   - Ingrese los datos en formato JSON o texto libre

   - **Observaciones**: Ingrese cualquier observación adicional

[INSERTA SCREENSHOT AQUI - Formulario de registro de control neonatal - Signos Vitales]

[INSERTA SCREENSHOT AQUI - Formulario de registro de control neonatal - Glucemia]

[INSERTA SCREENSHOT AQUI - Formulario de registro de control neonatal - Alimentación]

3. Haga clic en **"Guardar"** para registrar el control.
4. El control quedará registrado con su nombre como enfermera responsable y la fecha/hora indicada.

##### 3.3.3.3. Editar un Control Neonatal

1. En el listado de controles, haga clic en el control que desea editar.
2. En la página de detalles, haga clic en el botón **"Editar"**.
3. Modifique los campos necesarios.
4. Haga clic en **"Guardar cambios"**.

[INSERTA SCREENSHOT AQUI - Formulario de edición de control neonatal]

##### 3.3.3.4. Ver Historial de Controles de un Recién Nacido

1. En el listado de controles, puede filtrar por un recién nacido específico.
2. También puede acceder al historial desde:
   - La página de detalles de un recién nacido (si tiene acceso)
   - La página de detalles de un episodio URNI

3. El historial mostrará todos los controles registrados para ese recién nacido, ordenados por fecha y hora.

[INSERTA SCREENSHOT AQUI - Historial de controles de un recién nacido]

#### 3.3.4. Visualización de Episodios URNI

Las enfermeras pueden visualizar información de episodios URNI para conocer el contexto de los controles que registran.

##### 3.3.4.1. Ver Episodios URNI

1. En el menú lateral, haga clic en **"Episodios URNI"**.
2. Se mostrará un listado con todos los episodios URNI.
3. Puede hacer clic en un episodio para ver sus detalles:
   - Información del recién nacido
   - Motivo de ingreso
   - Responsable clínico
   - Estado del episodio
   - Controles neonatales asociados (incluyendo los que usted registró)

[INSERTA SCREENSHOT AQUI - Vista de episodio URNI con controles asociados]

---

### 3.4. Administrativo

#### 3.4.1. Introducción

El personal administrativo gestiona los procesos de ingreso y alta, puede registrar información básica de madres y generar reportes REM para cumplimiento normativo.

**Funcionalidades Disponibles:**
- Gestión limitada de madres (solo datos básicos)
- Crear y gestionar episodios de ingreso/alta
- Procesar altas de madres
- Generar reportes REM

#### 3.4.2. Dashboard Principal

Después de iniciar sesión, el personal administrativo accede al dashboard principal que muestra el menú lateral con los módulos disponibles.

[INSERTA SCREENSHOT AQUI - Dashboard principal de Administrativo con menú lateral]

#### 3.4.3. Módulo Madres (Datos Básicos)

El personal administrativo puede registrar y gestionar información básica de madres, con acceso limitado a campos clínicos sensibles.

##### 3.4.3.1. Ver Listado de Madres

1. En el menú lateral, haga clic en **"Modulo Madres"**.
2. Se mostrará un listado con todas las madres registradas.
3. Puede buscar por RUT, nombre o apellido.

[INSERTA SCREENSHOT AQUI - Listado de madres para administrativo]

##### 3.4.3.2. Crear Nueva Madre (Datos Básicos)

1. En el listado de madres, haga clic en el botón **"Nueva Madre"**.
2. Complete el formulario con información básica:
   - RUT
   - Nombres
   - Apellidos
   - Edad
   - Fecha de nacimiento
   - Dirección
   - Teléfono
   - Ficha clínica (opcional)

[INSERTA SCREENSHOT AQUI - Formulario de creación de madre - vista administrativo]

3. Haga clic en **"Guardar"** para registrar la madre.

#### 3.4.4. Ingreso/Alta

Este módulo permite gestionar los episodios de ingreso y alta de madres.

##### 3.4.4.1. Ver Listado de Episodios

1. En el menú lateral, haga clic en **"Ingreso/Alta"**.
2. Se mostrará un listado con todos los episodios de ingreso de madres.

[INSERTA SCREENSHOT AQUI - Listado de episodios de ingreso/alta]

##### 3.4.4.2. Crear un Nuevo Episodio de Ingreso

1. En el listado de episodios, haga clic en el botón **"Nuevo Ingreso"**.
2. Complete el formulario:
   - **Madre**: Busque por RUT o nombre
   - **Fecha de ingreso**: Seleccione la fecha y hora
   - **Motivo de ingreso**: Ingrese el motivo
   - **Hospital anterior**: Si la madre viene de otro hospital, ingrese el nombre

[INSERTA SCREENSHOT AQUI - Formulario de creación de episodio de ingreso]

3. Haga clic en **"Guardar"** para crear el episodio.
4. El episodio quedará en estado "INGRESADO".

##### 3.4.4.3. Procesar un Alta

1. En el listado de episodios, busque un episodio en estado "INGRESADO".
2. Haga clic en el episodio para ver sus detalles.
3. Verifique que el episodio tenga:
   - Un parto registrado
   - Al menos un recién nacido asociado
   - Informe de alta generado (si es requerido)
   - Aprobación médica (si es requerida)

[INSERTA SCREENSHOT AQUI - Vista de detalles de episodio antes del alta]

4. Si todo está completo, haga clic en el botón **"Dar Alta"**.
5. Complete el formulario de alta:
   - Fecha de alta
   - Condición de egreso

[INSERTA SCREENSHOT AQUI - Formulario de alta]

6. Haga clic en **"Procesar Alta"**.
7. El sistema calculará automáticamente los días de estadía y cambiará el estado a "ALTA".

#### 3.4.5. Reporte REM

Este módulo permite generar reportes REM (Registro Estadístico Mensual) para cumplimiento normativo.

##### 3.4.5.1. Generar un Reporte REM

1. En el menú lateral, en la sección **"Informes"**, haga clic en **"Reporte REM"**.
2. Se mostrará un formulario para generar el reporte.
3. Seleccione el período del reporte:
   - **Mes**: Seleccione el mes
   - **Año**: Seleccione el año

[INSERTA SCREENSHOT AQUI - Formulario de generación de reporte REM]

4. Haga clic en **"Generar Reporte"**.
5. El sistema procesará todos los partos del período seleccionado y generará:
   - Totales agregados por sección REM
   - Desgloses por tipo de parto
   - Información de recién nacidos
   - Complicaciones obstétricas
   - Esterilizaciones quirúrgicas
   - Y otros datos requeridos para el reporte REM

[INSERTA SCREENSHOT AQUI - Vista del reporte REM generado]

6. Puede exportar el reporte en el formato requerido.
7. El reporte quedará almacenado en el sistema con un snapshot de los datos fuente.

---

### 3.5. Jefatura

#### 3.5.1. Introducción

La jefatura tiene acceso a módulos de análisis y supervisión. Pueden consultar indicadores y estadísticas, revisar la auditoría de actividades y visualizar atenciones URNI.

**Funcionalidades Disponibles:**
- Consultar indicadores y estadísticas del sistema
- Revisar registros de auditoría
- Visualizar atenciones URNI
- Exportar datos para análisis

#### 3.5.2. Dashboard Principal

Después de iniciar sesión, la jefatura accede al dashboard principal que muestra el menú lateral con los módulos disponibles.

[INSERTA SCREENSHOT AQUI - Dashboard principal de Jefatura con menú lateral]

#### 3.5.3. Indicadores

Este módulo proporciona visualizaciones y estadísticas sobre la actividad del hospital.

##### 3.5.3.1. Consultar Indicadores

1. En el menú lateral, haga clic en **"Indicadores"**.
2. Se mostrará el panel de indicadores con múltiples métricas.

##### 3.5.3.2. Filtrar Indicadores por Fecha

1. En la parte superior del panel de indicadores, seleccione:
   - **Fecha de inicio**: Seleccione la fecha inicial del período
   - **Fecha de fin**: Seleccione la fecha final del período
   - **Agrupación temporal**: Seleccione cómo agrupar los datos (Día, Semana, Mes)

[INSERTA SCREENSHOT AQUI - Panel de filtros de indicadores]

2. Los indicadores se actualizarán automáticamente según los filtros seleccionados.

##### 3.5.3.3. Visualizar Indicadores de Partos

1. En la sección de **Partos**, podrá ver:
   - Total de partos en el período
   - Distribución por tipo de parto (gráfico de barras o torta)
   - Distribución por lugar
   - Evolución temporal (gráfico de línea)

[INSERTA SCREENSHOT AQUI - Indicadores de partos con gráficos]

##### 3.5.3.4. Visualizar Indicadores de Recién Nacidos

1. En la sección de **Recién Nacidos**, podrá ver:
   - Total de recién nacidos
   - Distribución por sexo
   - Promedios de peso y talla
   - Distribución de Apgar
   - Rangos de peso

[INSERTA SCREENSHOT AQUI - Indicadores de recién nacidos]

##### 3.5.3.5. Visualizar Indicadores de Episodios URNI

1. En la sección de **Episodios URNI**, podrá ver:
   - Total de episodios
   - Episodios activos vs altas
   - Días de estadía promedio
   - Distribución por servicio/unidad
   - Evolución temporal

[INSERTA SCREENSHOT AQUI - Indicadores de episodios URNI]

##### 3.5.3.6. Visualizar Indicadores de Controles y Atenciones

1. En las secciones correspondientes, podrá ver:
   - Total de controles neonatales
   - Distribución por tipo de control
   - Total de atenciones médicas
   - Promedios por episodio

[INSERTA SCREENSHOT AQUI - Indicadores de controles y atenciones]

##### 3.5.3.7. Exportar Datos

1. En cualquier sección de indicadores, puede hacer clic en el botón **"Exportar"** para descargar los datos en formato CSV o Excel.
2. Los datos exportados incluirán toda la información mostrada en los gráficos.

#### 3.5.4. Auditoría

Este módulo permite revisar el historial completo de actividades realizadas en el sistema.

##### 3.5.4.1. Consultar Registros de Auditoría

1. En el menú lateral, haga clic en **"Auditoría"**.
2. Se mostrará un listado con todos los registros de auditoría.
3. Cada registro muestra:
   - Fecha y hora de la acción
   - Usuario que realizó la acción
   - Rol del usuario
   - Entidad afectada (Madre, Parto, RecienNacido, etc.)
   - Acción realizada (CREATE, UPDATE, DELETE, LOGIN, EXPORT, PERMISSION_DENIED)
   - Detalles de los cambios (si aplica)

[INSERTA SCREENSHOT AQUI - Listado de registros de auditoría]

##### 3.5.4.2. Filtrar Registros de Auditoría

1. En la parte superior del listado, puede aplicar filtros:
   - **Usuario**: Filtrar por usuario específico
   - **Entidad**: Filtrar por tipo de entidad (Madre, Parto, etc.)
   - **Acción**: Filtrar por tipo de acción
   - **Fecha desde**: Fecha inicial del período
   - **Fecha hasta**: Fecha final del período

[INSERTA SCREENSHOT AQUI - Panel de filtros de auditoría]

2. Haga clic en **"Aplicar Filtros"** para actualizar el listado.

##### 3.5.4.3. Ver Detalles de un Registro de Auditoría

1. En el listado, haga clic en un registro para ver sus detalles completos.
2. Podrá ver:
   - Información completa del usuario
   - Estado antes del cambio (si es una actualización)
   - Estado después del cambio (si es una actualización)
   - Dirección IP desde la cual se realizó la acción
   - User Agent del navegador

[INSERTA SCREENSHOT AQUI - Detalles de un registro de auditoría]

##### 3.5.4.4. Buscar Registros Específicos

1. Use la barra de búsqueda para buscar por:
   - Nombre de usuario
   - ID de entidad
   - Descripción de la acción

2. Los resultados se filtrarán automáticamente mientras escribe.

#### 3.5.5. Visualización de Atenciones URNI

La jefatura puede visualizar información de atenciones URNI para supervisión.

##### 3.5.5.1. Ver Atenciones URNI

1. La información de atenciones URNI está disponible a través de:
   - Los episodios URNI (donde se muestran todas las atenciones asociadas)
   - Los indicadores (donde se muestran estadísticas agregadas)

2. Puede acceder a los episodios URNI desde el menú lateral si tiene permisos de lectura.

---

### 3.6. Administrador TI

#### 3.6.1. Introducción

El administrador TI tiene acceso exclusivo a la gestión de usuarios del sistema. Puede crear, editar, activar y desactivar usuarios, así como asignar roles y permisos.

**Funcionalidades Disponibles:**
- Crear nuevos usuarios
- Editar usuarios existentes
- Activar y desactivar cuentas de usuario
- Asignar y modificar roles
- Buscar usuarios

#### 3.6.2. Dashboard Principal

Después de iniciar sesión, el administrador TI accede al dashboard principal que muestra el menú lateral con los módulos disponibles.

[INSERTA SCREENSHOT AQUI - Dashboard principal de Administrador TI con menú lateral]

#### 3.6.3. Gestión de Usuarios

Este módulo permite gestionar todos los usuarios del sistema.

##### 3.6.3.1. Ver Listado de Usuarios

1. En el menú lateral, haga clic en **"Gestión de Usuarios"**.
2. Se mostrará un listado con todos los usuarios registrados en el sistema.
3. Para cada usuario podrá ver:
   - Nombre completo
   - Email
   - RUT
   - Roles asignados
   - Estado (Activo/Inactivo)

[INSERTA SCREENSHOT AQUI - Listado de usuarios]

##### 3.6.3.2. Crear un Nuevo Usuario

1. En el listado de usuarios, haga clic en el botón **"Nuevo Usuario"**.
2. Complete el formulario con la siguiente información:
   - **RUT**: RUT chileno válido (sin puntos, con guion, ej: `12345678-9`)
   - **Nombre**: Nombre completo del usuario
   - **Email**: Correo electrónico único
   - **Contraseña**: Contraseña que cumpla con los requisitos:
     - Mínimo 8 caracteres
     - Al menos una letra mayúscula
     - Al menos una letra minúscula
     - Al menos un número
   - **Roles**: Seleccione uno o más roles del usuario (Matrona, Médico, Enfermera, Administrativo, Jefatura, Administrador TI)
   - **Estado**: Active o desactive la cuenta (por defecto: Activo)

[INSERTA SCREENSHOT AQUI - Formulario de creación de usuario]

3. Haga clic en **"Guardar"** para crear el usuario.
4. El usuario podrá iniciar sesión inmediatamente si el estado es "Activo".

##### 3.6.3.3. Editar un Usuario Existente

1. En el listado de usuarios, haga clic en el usuario que desea editar.
2. En la página de detalles, haga clic en el botón **"Editar"**.
3. Puede modificar:
   - Nombre
   - Email (debe ser único)
   - Contraseña (si desea cambiarla)
   - Roles (agregar o quitar roles)
   - Estado (activar o desactivar cuenta)

[INSERTA SCREENSHOT AQUI - Formulario de edición de usuario]

4. Haga clic en **"Guardar cambios"** para actualizar el usuario.

##### 3.6.3.4. Activar o Desactivar un Usuario

1. En el listado de usuarios, localice el usuario.
2. Puede cambiar el estado de dos formas:
   - **Desde el listado**: Use el interruptor de estado si está disponible
   - **Desde la edición**: Acceda a editar el usuario y cambie el estado

3. **Usuario Activo**: Puede iniciar sesión y usar el sistema normalmente.
4. **Usuario Inactivo**: No puede iniciar sesión, pero sus registros creados se mantienen en el sistema.

[INSERTA SCREENSHOT AQUI - Cambio de estado de usuario]

##### 3.6.3.5. Ver Detalles de un Usuario

1. En el listado de usuarios, haga clic en un usuario para ver sus detalles.
2. En la página de detalles podrá ver:
   - Información completa del usuario
   - Roles asignados
   - Estado de la cuenta
   - Fecha de creación
   - Última actualización

[INSERTA SCREENSHOT AQUI - Página de detalles de usuario]

##### 3.6.3.6. Buscar Usuarios

1. En el listado de usuarios, use la barra de búsqueda para buscar por:
   - Nombre
   - Email
   - RUT

2. Los resultados se filtrarán automáticamente mientras escribe.

---

## 4. Preguntas Frecuentes

### 4.1. Autenticación y Acceso

**P: ¿Cómo cambio mi contraseña?**  
R: Actualmente, el cambio de contraseña debe ser gestionado por un Administrador TI. Contacte al administrador del sistema si necesita cambiar su contraseña.

**P: ¿Qué hago si olvidé mi contraseña?**  
R: Contacte al Administrador TI del sistema para que pueda restablecer su contraseña.

**P: ¿Puedo iniciar sesión con mi RUT en lugar de mi correo electrónico?**  
R: Sí, el sistema acepta tanto correo electrónico como RUT para iniciar sesión. Si usa RUT, debe ingresarlo sin puntos y con guion (ejemplo: `12345678-9`).

**P: ¿Cuánto tiempo permanece activa mi sesión?**  
R: Su sesión permanece activa durante 7 días si no cierra sesión manualmente. Se recomienda cerrar sesión al terminar de usar el sistema, especialmente en computadoras compartidas.

### 4.2. Permisos y Roles

**P: ¿Puedo tener múltiples roles asignados?**  
R: Sí, un usuario puede tener múltiples roles asignados. Esto le dará acceso a todas las funcionalidades de los roles asignados.

**P: ¿Qué pasa si intento acceder a una funcionalidad sin permisos?**  
R: El sistema le mostrará un mensaje indicando que no tiene permisos para realizar esa acción. El intento quedará registrado en la auditoría para revisión.

**P: ¿Por qué no veo algunos módulos en mi menú lateral?**  
R: Los módulos visibles dependen de los roles y permisos asignados a su cuenta. Si cree que debería tener acceso a un módulo específico, contacte al Administrador TI.

### 4.3. Gestión de Datos

**P: ¿Los datos se guardan automáticamente?**  
R: No, debe hacer clic en el botón **"Guardar"** o **"Guardar cambios"** para que los datos se guarden en el sistema. Se recomienda guardar frecuentemente para evitar pérdida de información.

**P: ¿Puedo editar un registro después de guardarlo?**  
R: Sí, siempre que tenga permisos de edición para ese tipo de registro. Acceda al registro desde el listado y haga clic en **"Editar"**.

**P: ¿Puedo eliminar un registro después de crearlo?**  
R: Depende de sus permisos y del tipo de registro. Algunos registros pueden tener restricciones para mantener la integridad de los datos. Si necesita eliminar un registro, contacte al Administrador TI o a su supervisor.

**P: ¿Cómo puedo ver quién modificó un registro?**  
R: Los usuarios con acceso a Auditoría pueden consultar el historial completo de modificaciones en el módulo de Auditoría. Allí podrá ver quién hizo qué cambios y cuándo.

### 4.4. Informes y Exportación

**P: ¿Qué formatos de exportación están disponibles para los informes?**  
R: Los informes de alta pueden exportarse en formato PDF, DOCX o HTML. Los reportes REM pueden exportarse en formato requerido por las autoridades.

**P: ¿Puedo exportar datos de los indicadores?**  
R: Sí, desde el módulo de Indicadores puede exportar los datos en formato CSV o Excel para análisis externo.

### 4.5. Problemas Técnicos

**P: El sistema está lento o no responde, ¿qué debo hacer?**  
R: Intente refrescar la página (F5). Si el problema persiste, verifique su conexión a internet y contacte al Administrador TI.

**P: No puedo ver las imágenes o gráficos correctamente**  
R: Verifique que JavaScript esté habilitado en su navegador y que esté usando una versión compatible del navegador (ver Requisitos del Sistema en la sección 1.4).

**P: Recibo un mensaje de error al intentar guardar**  
R: Verifique que todos los campos requeridos estén completos y que los datos ingresados sean válidos. Si el problema persiste, contacte al Administrador TI e incluya el mensaje de error completo.

---

## 5. Glosario de Términos

**Apgar:** Escala de evaluación del estado de salud del recién nacido al minuto y a los 5 minutos después del nacimiento. Valores de 0 a 10.

**Dashboard:** Panel principal de control del sistema que muestra el menú de navegación y módulos disponibles.

**Episodio:** Registro de un período de atención de una madre o recién nacido en el hospital, desde el ingreso hasta el alta.

**Episodio URNI:** Episodio de ingreso de un recién nacido a la Unidad de Recién Nacidos para atención especializada.

**Informe de Alta:** Documento generado por la matrona que contiene toda la información relevante del caso para revisión médica antes del alta.

**RBAC:** Control de Acceso Basado en Roles (Role-Based Access Control). Sistema que determina qué funcionalidades puede usar cada usuario según sus roles asignados.

**REM:** Registro Estadístico Mensual. Reporte normativo que consolida información estadística de partos y recién nacidos.

**RUT:** Rol Único Tributario. Identificador único utilizado en Chile para personas y empresas. Formato: números sin puntos seguidos de guion y dígito verificador (ej: `12345678-9`).

**URNI:** Unidad de Recién Nacidos. Área especializada del hospital para atención de recién nacidos que requieren cuidados especiales.

**UCIN:** Unidad de Cuidados Intensivos Neonatales. Área de cuidados intensivos para recién nacidos.

**Usuario Activo/Inactivo:** Estado de una cuenta de usuario. Los usuarios inactivos no pueden iniciar sesión pero sus registros creados se mantienen en el sistema.

---

## 6. Apéndices

### 6.1. Contacto y Soporte

Para problemas técnicos, consultas sobre el uso del sistema, o solicitudes de cambios, contacte:

**Administrador TI del Sistema SRORN**

- **Email:** [INSERTAR EMAIL]
- **Teléfono:** [INSERTAR TELÉFONO]
- **Horario de Atención:** [INSERTAR HORARIO]

**Equipo de Soporte**

- **Email:** [INSERTAR EMAIL]
- **Teléfono:** [INSERTAR TELÉFONO]

**Nota:** Para problemas urgentes durante horario de atención, contacte directamente al Administrador TI.

### 6.2. Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Noviembre 2025 | Versión inicial del manual de usuario |

### 6.3. Información Adicional

**Recursos Adicionales:**
- Documentación técnica del sistema: Disponible en la carpeta `documentacion/` del proyecto
- Guía de instalación: Ver `documentacion/03-instalacion.md`
- Referencia de API: Ver `documentacion/06-api-reference.md`

**Actualizaciones del Manual:**
Este manual se actualiza cuando se agregan nuevas funcionalidades o se realizan cambios significativos en el sistema. La versión actual del manual se indica en la portada.

---

**Fin del Manual**

---

*Manual de Usuario - Sistema SRORN v1.0*  
*Última actualización: Noviembre 2025*

