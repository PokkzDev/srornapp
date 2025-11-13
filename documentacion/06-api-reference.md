# Referencia de API

Documentación completa de todos los endpoints REST disponibles en el sistema SRORN.

## Base URL

```
http://localhost:3005/api  (desarrollo)
https://tu-dominio.com/api (producción)
```

## Autenticación

Todos los endpoints (excepto login) requieren autenticación mediante cookies de sesión.

## Formato de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional"
}
```

### Respuesta de Error

```json
{
  "error": "Mensaje de error descriptivo"
}
```

### Códigos de Estado HTTP

- `200` - OK (operación exitosa)
- `201` - Created (recurso creado)
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (recurso ya existe)
- `500` - Internal Server Error (error del servidor)

## Endpoints de Autenticación

### POST /api/auth/login

Inicia sesión en el sistema.

**Body**:
```json
{
  "email": "usuario@srorn.cl",  // o "rut": "12345678-9"
  "password": "contraseña"
}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@srorn.cl",
    "nombre": "Nombre Usuario",
    "roles": ["matrona"]
  }
}
```

**Errores**:
- `400` - Email/RUT y contraseña son requeridos
- `401` - Credenciales inválidas
- `403` - Cuenta desactivada

### POST /api/auth/logout

Cierra la sesión del usuario.

**Respuesta** (200):
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

## Endpoints de Madres

### GET /api/madres

Lista madres con paginación y búsqueda.

**Query Parameters**:
- `search` (string, opcional) - Búsqueda por RUT, nombres, apellidos o ficha clínica
- `page` (number, default: 1) - Número de página
- `limit` (number, default: 20) - Items por página

**Permisos Requeridos**: `madre:view` o `madre:view_limited`

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rut": "12345678-9",
      "nombres": "María",
      "apellidos": "González",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### POST /api/madres

Crea una nueva madre.

**Body**:
```json
{
  "rut": "12345678-9",
  "nombres": "María",
  "apellidos": "González",
  "edad": 28,
  "fechaNacimiento": "1995-01-15",
  "direccion": "Calle 123",
  "telefono": "+56912345678",
  "fichaClinica": "FC12345",
  "pertenenciaPuebloOriginario": false,
  "condicionMigrante": false,
  ...
}
```

**Permisos Requeridos**: `madre:create` o `madre:create_limited`

**Respuesta Exitosa** (201):
```json
{
  "success": true,
  "message": "Madre registrada exitosamente",
  "data": { ... }
}
```

**Errores**:
- `400` - RUT inválido o campos requeridos faltantes
- `409` - RUT o ficha clínica ya existe

### GET /api/madres/[id]

Obtiene una madre específica con sus relaciones.

**Permisos Requeridos**: `madre:view` o `madre:view_limited`

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rut": "12345678-9",
    "partos": [ ... ],
    "episodios": [ ... ]
  }
}
```

### PUT /api/madres/[id]

Actualiza una madre.

**Permisos Requeridos**: `madre:update` o `madre:update_limited`

**Body**: Campos a actualizar (mismo formato que POST)

**Respuesta** (200):
```json
{
  "success": true,
  "message": "Madre actualizada exitosamente",
  "data": { ... }
}
```

### DELETE /api/madres/[id]

Elimina una madre.

**Permisos Requeridos**: `madre:delete` o `madre:delete_limited`

**Validaciones**:
- No se puede eliminar si tiene partos asociados (permiso limitado)

**Respuesta** (200):
```json
{
  "success": true,
  "message": "Madre eliminada exitosamente"
}
```

## Endpoints de Partos

### GET /api/partos

Lista partos con paginación y búsqueda.

**Query Parameters**:
- `search` (string) - Búsqueda por RUT madre, nombres, tipo, lugar
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `parto:view`

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fechaHora": "2025-01-15T10:30:00Z",
      "tipo": "VAGINAL",
      "lugar": "SALA_PARTO",
      "madre": { ... },
      "matronas": [ ... ],
      "medicos": [ ... ],
      "enfermeras": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

### POST /api/partos

Crea un nuevo parto.

**Body**:
```json
{
  "madreId": "uuid",
  "fechaHora": "2025-01-15T10:30:00Z",
  "tipo": "VAGINAL",
  "lugar": "SALA_PARTO",
  "matronasIds": ["uuid1", "uuid2"],
  "medicosIds": ["uuid3"],
  "enfermerasIds": ["uuid4"],
  "complicacionesTexto": "...",
  "observaciones": "...",
  ...
}
```

**Permisos Requeridos**: `parto:create`

**Validaciones**:
- Debe tener al menos una matrona
- Debe tener al menos una enfermera
- Si es cesárea, debe tener al menos un médico

**Respuesta Exitosa** (201):
```json
{
  "success": true,
  "message": "Parto registrado exitosamente",
  "data": { ... }
}
```

### GET /api/partos/[id]

Obtiene un parto específico.

**Permisos Requeridos**: `parto:view`

### PUT /api/partos/[id]

Actualiza un parto.

**Permisos Requeridos**: `parto:update`

### DELETE /api/partos/[id]

Elimina un parto.

**Permisos Requeridos**: `parto:delete`

### GET /api/partos/profesionales

Obtiene profesionales disponibles para asignar a partos.

**Query Parameters**:
- `role` (string) - "matrona", "medico" o "enfermera"

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Dr. Juan Pérez",
      "email": "juan@srorn.cl"
    }
  ]
}
```

## Endpoints de Recién Nacidos

### GET /api/recien-nacidos

Lista recién nacidos con paginación.

**Query Parameters**:
- `search` (string) - Búsqueda por RUT madre, nombres madre
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `recien-nacido:view` o `control_neonatal:create`

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sexo": "M",
      "pesoNacimientoGramos": 3200,
      "tallaCm": 50,
      "apgar1Min": 8,
      "apgar5Min": 9,
      "parto": { ... }
    }
  ],
  "pagination": { ... }
}
```

### POST /api/recien-nacidos

Crea un nuevo recién nacido.

**Body**:
```json
{
  "partoId": "uuid",
  "sexo": "M",
  "pesoNacimientoGramos": 3200,
  "tallaCm": 50,
  "apgar1Min": 8,
  "apgar5Min": 9,
  "observaciones": "..."
}
```

**Permisos Requeridos**: `recien-nacido:create`

### GET /api/recien-nacidos/[id]

Obtiene un recién nacido específico.

**Permisos Requeridos**: `recien-nacido:view`

### PUT /api/recien-nacidos/[id]

Actualiza un recién nacido.

**Permisos Requeridos**: `recien-nacido:update`

### DELETE /api/recien-nacidos/[id]

Elimina un recién nacido.

**Permisos Requeridos**: `recien-nacido:delete`

## Endpoints de Episodios Madre

### GET /api/ingreso-alta

Lista episodios de ingreso/alta de madres.

**Query Parameters**:
- `estado` (string) - "INGRESADO" o "ALTA"
- `search` (string) - Búsqueda por RUT madre
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `ingreso_alta:view` o `ingreso_alta:manage`

### POST /api/ingreso-alta

Crea un nuevo episodio de ingreso.

**Body**:
```json
{
  "madreId": "uuid",
  "fechaIngreso": "2025-01-15T08:00:00Z",
  "motivoIngreso": "Trabajo de parto",
  "hospitalAnterior": null
}
```

**Permisos Requeridos**: `ingreso_alta:create`

### GET /api/ingreso-alta/[id]

Obtiene un episodio específico con validación de completitud.

**Permisos Requeridos**: `ingreso_alta:view` o `ingreso_alta:manage`

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "estado": "INGRESADO",
    "madre": { ... },
    "validation": {
      "isValid": true,
      "errors": []
    }
  }
}
```

### PUT /api/ingreso-alta/[id]

Actualiza un episodio (solo antes del alta).

**Permisos Requeridos**: `ingreso_alta:update` o `ingreso_alta:manage`

### POST /api/ingreso-alta/[id]/alta

Procesa el alta de un episodio.

**Body**:
```json
{
  "fechaAlta": "2025-01-20T14:00:00Z",
  "condicionEgreso": "Alta médica"
}
```

**Permisos Requeridos**: `ingreso_alta:alta` o `ingreso_alta:manage`

**Validaciones**:
- Episodio debe estar en estado INGRESADO
- Debe tener parto y recién nacidos registrados

## Endpoints de Episodios URNI

### GET /api/urni/episodio

Lista episodios URNI.

**Query Parameters**:
- `estado` (string) - "INGRESADO" o "ALTA"
- `rnId` (string) - Filtrar por recién nacido
- `responsableId` (string) - Filtrar por responsable clínico
- `search` (string) - Búsqueda por RUT madre
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `urni:read` o `urni:episodio:view`

### POST /api/urni/episodio

Crea un nuevo episodio URNI.

**Body**:
```json
{
  "rnId": "uuid",
  "fechaHoraIngreso": "2025-01-15T10:00:00Z",
  "motivoIngreso": "Prematuridad",
  "servicioUnidad": "URNI",
  "responsableClinicoId": "uuid"
}
```

**Permisos Requeridos**: `urni:episodio:create`

**Validaciones**:
- RN no debe tener episodio activo

### GET /api/urni/episodio/[id]

Obtiene un episodio URNI específico.

**Permisos Requeridos**: `urni:episodio:view` o `urni:read`

### POST /api/urni/episodio/[id]/alta

Procesa el alta de un episodio URNI.

**Body**:
```json
{
  "fechaHoraAlta": "2025-01-20T14:00:00Z",
  "condicionEgreso": "Alta médica"
}
```

**Permisos Requeridos**: `alta:manage`

## Endpoints de Atención URNI

### GET /api/urni/atencion

Lista atenciones médicas URNI.

**Query Parameters**:
- `rnId` (string) - Filtrar por recién nacido
- `episodioId` (string) - Filtrar por episodio
- `medicoId` (string) - Filtrar por médico
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `urni:atencion:view` o `urni:read`

### POST /api/urni/atencion

Crea una nueva atención médica.

**Body**:
```json
{
  "rnId": "uuid",
  "episodioId": "uuid",
  "fechaHora": "2025-01-15T10:00:00Z",
  "diagnostico": "Prematuridad",
  "indicaciones": "Monitoreo continuo",
  "evolucion": "Estable"
}
```

**Permisos Requeridos**: `urni:atencion:create`

## Endpoints de Control Neonatal

### GET /api/control-neonatal

Lista controles neonatales.

**Query Parameters**:
- `rnId` (string) - Filtrar por recién nacido
- `episodioUrniId` (string) - Filtrar por episodio URNI
- `tipo` (string) - Tipo de control
- `enfermeraId` (string) - Filtrar por enfermera
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `control_neonatal:view`

### POST /api/control-neonatal

Crea un nuevo control neonatal.

**Body**:
```json
{
  "rnId": "uuid",
  "episodioUrniId": "uuid",
  "fechaHora": "2025-01-15T10:00:00Z",
  "tipo": "SIGNOS_VITALES",
  "datos": {
    "temperatura": 36.5,
    "frecuenciaCardiaca": 120,
    "frecuenciaRespiratoria": 40,
    "saturacionOxigeno": 98
  },
  "observaciones": "..."
}
```

**Permisos Requeridos**: `control_neonatal:create`

### GET /api/control-neonatal/[id]

Obtiene un control específico.

**Permisos Requeridos**: `control_neonatal:view`

### PUT /api/control-neonatal/[id]

Actualiza un control.

**Permisos Requeridos**: `control_neonatal:update`

### DELETE /api/control-neonatal/[id]

Elimina un control.

**Permisos Requeridos**: `control_neonatal:delete`

## Endpoints de Informes de Alta

### GET /api/informe-alta

Lista episodios disponibles para generar informes.

**Permisos Requeridos**: `informe_alta:generate`

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "madre": { ... },
      "partos": [ ... ]
    }
  ]
}
```

### POST /api/informe-alta

Genera un informe de alta.

**Body**:
```json
{
  "partoId": "uuid",
  "episodioId": "uuid",
  "formato": "PDF"  // PDF, DOCX, HTML
}
```

**Permisos Requeridos**: `informe_alta:generate`

**Validaciones**:
- Episodio debe estar en estado INGRESADO
- Episodio no debe tener informe previo
- Parto debe pertenecer a la madre del episodio

### GET /api/informe-alta/episodio/[id]

Obtiene el informe de un episodio específico.

**Permisos Requeridos**: `informe_alta:generate`

### GET /api/informe-alta/[id]/export

Exporta un informe en el formato especificado.

**Permisos Requeridos**: `informe_alta:generate`

## Endpoints de Módulo Alta

### GET /api/modulo-alta

Lista episodios con informes generados para aprobación.

**Permisos Requeridos**: `modulo_alta:aprobar`

### POST /api/modulo-alta/[id]/aprobar

Aprueba un alta médica.

**Body**:
```json
{
  "fechaAlta": "2025-01-20T14:00:00Z",
  "condicionEgreso": "Alta médica"
}
```

**Permisos Requeridos**: `modulo_alta:aprobar`

## Endpoints de Indicadores

### GET /api/indicadores

Obtiene indicadores y métricas del sistema.

**Query Parameters**:
- `fechaInicio` (string, ISO date) - Fecha inicio del rango
- `fechaFin` (string, ISO date) - Fecha fin del rango
- `agrupacion` (string) - "dia", "semana" o "mes" (default: "mes")

**Permisos Requeridos**: `indicadores:consult`

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "partos": { ... },
    "recienNacidos": { ... },
    "episodiosURNI": { ... },
    "episodiosMadre": { ... },
    "controlesNeonatales": { ... },
    "atencionesURNI": { ... },
    "informesAlta": { ... },
    "metricasOperacionales": { ... }
  }
}
```

## Endpoints de Auditoría

### GET /api/auditoria

Lista registros de auditoría.

**Query Parameters**:
- `usuarioId` (string) - Filtrar por usuario
- `entidad` (string) - Filtrar por entidad
- `accion` (string) - Filtrar por acción
- `fechaInicio` (string, ISO date)
- `fechaFin` (string, ISO date)
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Permisos Requeridos**: `auditoria:review`

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fechaHora": "2025-01-15T10:00:00Z",
      "usuario": { ... },
      "entidad": "Madre",
      "accion": "CREATE",
      "detalleAfter": { ... }
    }
  ],
  "pagination": { ... }
}
```

## Endpoints de Reportes REM

### GET /api/reportes/rem

Genera un reporte REM para un período específico.

**Query Parameters**:
- `mes` (number, 1-12) - Mes del reporte
- `anio` (number) - Año del reporte

**Permisos Requeridos**: `reporte_rem:generate`

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "seccionD1": { ... },
    "seccionD2": { ... },
    "caracteristicasParto": { ... },
    "modeloAtencion": { ... },
    ...
  }
}
```

### GET /api/reportes/rem/export

Exporta un reporte REM en formato específico.

**Permisos Requeridos**: `reporte_rem:generate`

## Endpoints de Usuarios

### GET /api/users

Lista usuarios del sistema.

**Query Parameters**:
- `role` (string) - Filtrar por rol
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Permisos Requeridos**: `user:view` o permisos URNI cuando `role=medico`

### POST /api/users

Crea un nuevo usuario.

**Body**:
```json
{
  "rut": "12345678-9",
  "nombre": "Juan Pérez",
  "email": "juan@srorn.cl",
  "password": "Contraseña123",
  "roles": ["uuid-rol-1", "uuid-rol-2"]
}
```

**Permisos Requeridos**: `user:create`

### GET /api/users/[id]

Obtiene un usuario específico.

**Permisos Requeridos**: `user:view`

### PUT /api/users/[id]

Actualiza un usuario.

**Permisos Requeridos**: `user:update`

### DELETE /api/users/[id]

Elimina un usuario.

**Permisos Requeridos**: `user:delete`

## Endpoints de Roles

### GET /api/roles

Lista todos los roles disponibles.

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "matrona",
      "description": "Matrona - Profesional..."
    }
  ]
}
```

---

**Anterior**: [Autenticación y RBAC](05-autenticacion-rbac.md) | **Siguiente**: [Módulos](07-modulos.md)

