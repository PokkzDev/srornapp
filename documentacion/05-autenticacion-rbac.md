# Autenticación y Control de Acceso (RBAC)

Este documento describe el sistema de autenticación y el modelo de control de acceso basado en roles (RBAC) implementado en SRORN.

## Sistema de Autenticación

### Método de Autenticación

SRORN utiliza un sistema de autenticación basado en **cookies HTTP-only** para mantener la sesión del usuario.

### Flujo de Login

1. **Usuario ingresa credenciales**: Email o RUT + contraseña
2. **Frontend envía POST** a `/api/auth/login`
3. **Backend valida credenciales**:
   - Busca usuario por email o RUT
   - Compara contraseña con hash almacenado usando bcryptjs
   - Verifica que el usuario esté activo
4. **Backend crea cookies de sesión**:
   - Cookie `session`: Token de sesión (HTTP-only, secure en producción)
   - Cookie `user`: Información del usuario (no HTTP-only para acceso desde JS)
5. **Frontend redirige** a `/dashboard`

### Login con Email o RUT

El sistema permite iniciar sesión usando:
- **Email**: Formato estándar de email (ej: `usuario@srorn.cl`)
- **RUT**: RUT chileno con formato `12345678-9` (sin puntos, con guion)

El sistema detecta automáticamente si el input es email o RUT y busca en la base de datos correspondiente.

### Validación de RUT

El sistema valida el RUT chileno:
- Formato: 7-8 dígitos seguidos de guion y dígito verificador
- Cálculo del dígito verificador usando algoritmo estándar chileno
- Acepta 'K' como dígito verificador válido

### Seguridad de Contraseñas

- **Hash**: Contraseñas se almacenan con hash bcryptjs (10 rounds)
- **Validación**: Se valida complejidad mínima al crear usuarios:
  - Mínimo 8 caracteres
  - Al menos una letra mayúscula
  - Al menos una letra minúscula
  - Al menos un número
- **Nunca se exponen**: Las contraseñas nunca se envían al frontend

### Cookies de Sesión

**Cookie `session`**:
- HTTP-only: No accesible desde JavaScript
- Secure: Solo se envía sobre HTTPS en producción
- SameSite: Lax (protección CSRF)
- MaxAge: 7 días

**Cookie `user`**:
- No HTTP-only: Accesible desde JavaScript para mostrar información del usuario
- Secure: Solo se envía sobre HTTPS en producción
- SameSite: Lax
- MaxAge: 7 días
- Contiene: `{ id, email, nombre, roles }`

### Logout

El endpoint `/api/auth/logout`:
1. Elimina las cookies de sesión
2. Redirige al usuario a la página de login

## Sistema RBAC (Role-Based Access Control)

### Modelo RBAC

SRORN implementa un modelo RBAC completo con tres niveles:

1. **Roles**: Grupos de permisos predefinidos
2. **Permisos**: Acciones específicas que se pueden realizar
3. **Usuarios**: Pueden tener múltiples roles y permisos directos

### Componentes del Sistema

#### Roles

Los roles son grupos lógicos de permisos. Roles disponibles:

- **matrona**: Profesional especializado en atención materno-infantil
- **medico**: Profesional médico
- **enfermera**: Profesional de enfermería
- **administrativo**: Personal administrativo
- **jefatura**: Personal de dirección y supervisión
- **administrador_ti**: Administrador del sistema

#### Permisos

Los permisos siguen el formato: `recurso:accion`

**Ejemplos**:
- `madre:view` - Visualizar madres
- `madre:create` - Crear madre
- `madre:update` - Actualizar madre
- `madre:delete` - Eliminar madre
- `parto:view` - Visualizar partos
- `urni:episodio:create` - Crear episodio URNI
- `control_neonatal:create` - Crear control neonatal
- `informe_alta:generate` - Generar informe de alta
- `modulo_alta:aprobar` - Aprobar alta médica
- `auditoria:review` - Revisar auditoría
- `indicadores:consult` - Consultar indicadores

#### Asignación de Permisos

Los permisos se asignan de dos formas:

1. **A través de Roles**: Los roles tienen permisos predefinidos
2. **Directamente al Usuario**: Permisos específicos que sobreescriben los roles

### Estructura de Datos

#### Tabla: Role

```sql
- id (UUID)
- name (String, Unique) - Nombre del rol
- description (String) - Descripción
- isSystem (Boolean) - Si es rol del sistema
```

#### Tabla: Permission

```sql
- id (UUID)
- code (String, Unique) - Código del permiso
- description (String) - Descripción
```

#### Tabla: UserRole

```sql
- userId (FK → User)
- roleId (FK → Role)
- createdAt, updatedAt
```

#### Tabla: RolePermission

```sql
- roleId (FK → Role)
- permissionId (FK → Permission)
- createdAt, updatedAt
```

#### Tabla: UserPermission

```sql
- userId (FK → User)
- permissionId (FK → Permission)
- createdAt, updatedAt
```

### Permisos por Rol

#### Matrona

**Permisos principales**:
- `madre:view`, `madre:create`, `madre:update`, `madre:delete`
- `parto:view`, `parto:create`, `parto:update`, `parto:delete`
- `recien-nacido:view`, `recien-nacido:create`, `recien-nacido:update`, `recien-nacido:delete`
- `registro_clinico:edit`
- `fichas:view`
- `informe_alta:generate`
- `urni:episodio:create`
- `urni:read`

**Acceso**: Gestión completa de madres, partos y recién nacidos. Puede generar informes de alta y crear episodios URNI.

#### Médico

**Permisos principales**:
- `registro_clinico:edit`
- `fichas:view`
- `atencion_urn:create`
- `modulo_alta:aprobar`
- `urni:atencion:create`, `urni:atencion:view`
- `urni:read`
- `alta:manage`
- `recien-nacido:view`

**Acceso**: Puede crear atenciones URNI, aprobar altas médicas, gestionar altas URNI y visualizar recién nacidos.

#### Enfermera

**Permisos principales**:
- `fichas:view`
- `control_neonatal:create`, `control_neonatal:view`, `control_neonatal:update`, `control_neonatal:delete`
- `urni:read`

**Acceso**: Puede crear, visualizar, editar y eliminar controles neonatales. Acceso de lectura a información URNI.

#### Administrativo

**Permisos principales**:
- `reporte_rem:generate`
- `madre:view_limited`, `madre:create_limited`, `madre:update_limited`, `madre:delete_limited`
- `alta:manage`

**Acceso**: Gestión limitada de madres (solo datos básicos), puede generar reportes REM y gestionar altas.

**Nota**: Los permisos `_limited` restringen el acceso a solo campos básicos de madres.

#### Jefatura

**Permisos principales**:
- `auditoria:review`
- `indicadores:consult`
- `urni:atencion:view`

**Acceso**: Puede revisar auditoría, consultar indicadores y visualizar atenciones URNI.

#### Administrador TI

**Permisos principales**:
- `user:create`, `user:view`, `user:update`, `user:delete`, `user:manage`

**Acceso**: Gestión completa de usuarios del sistema.

### Verificación de Permisos

#### En Backend (API Routes)

Cada endpoint verifica permisos antes de ejecutar la acción:

```javascript
// 1. Verificar autenticación
const user = await getCurrentUser()
if (!user) {
  return Response.json({ error: 'No autenticado' }, { status: 401 })
}

// 2. Obtener permisos del usuario
const permissions = await getUserPermissions()

// 3. Verificar permiso específico
if (!permissions.includes('madre:view')) {
  // Registrar intento de acceso sin permisos
  await prisma.auditoria.create({
    data: {
      usuarioId: user.id,
      rol: user.roles.join(', '),
      entidad: 'Madre',
      accion: 'PERMISSION_DENIED',
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    },
  })
  
  return Response.json(
    { error: 'No tiene permisos para visualizar madres' },
    { status: 403 }
  )
}

// 4. Continuar con la operación si tiene permiso
```

#### En Frontend

El sidebar y las páginas verifican permisos para mostrar/ocultar elementos:

```javascript
const permissions = await getUserPermissions()

// Mostrar módulo solo si tiene permiso
if (permissions.includes('madre:view')) {
  modulos.push({
    icon: 'fa-user-injured',
    label: 'Módulo Madres',
    href: '/dashboard/madres',
  })
}
```

### Función: getUserPermissions()

Esta función obtiene todos los permisos de un usuario:

1. Obtiene los roles del usuario desde la cookie
2. Consulta la base de datos para obtener los permisos de esos roles
3. Consulta permisos directos del usuario (si los hay)
4. Combina y retorna un array único de códigos de permisos

```javascript
export async function getUserPermissions() {
  const user = await getCurrentUser()
  if (!user || !user.roles) {
    return []
  }

  const { prisma } = await import('@/lib/prisma')
  
  const roles = await prisma.role.findMany({
    where: {
      name: { in: user.roles },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  const permissions = new Set()
  roles.forEach(role => {
    role.permissions.forEach(rp => {
      permissions.add(rp.permission.code)
    })
  })

  return Array.from(permissions)
}
```

### Permisos Limitados

Algunos roles tienen permisos "limitados" que restringen el acceso:

**Ejemplo: Administrativo con `madre:view_limited`**:
- Solo puede ver campos básicos de madres
- No puede ver información clínica sensible
- El backend filtra los campos retornados según el permiso

### Auditoría de Accesos Denegados

Cada intento de acceso sin permisos se registra en la tabla `Auditoria`:
- Usuario que intentó acceder
- Rol del usuario
- Entidad a la que intentó acceder
- Acción: `PERMISSION_DENIED`
- IP y User Agent

Esto permite:
- Detectar intentos de acceso no autorizados
- Auditar el uso del sistema
- Identificar problemas de configuración de permisos

## Gestión de Usuarios

### Crear Usuario

Solo usuarios con permiso `user:create` pueden crear usuarios.

**Campos requeridos**:
- `rut` (String, Unique) - RUT chileno válido
- `nombre` (String) - Nombre completo
- `email` (String, Unique) - Email válido
- `password` (String) - Contraseña (se valida complejidad)
- `roles` (Array de IDs de roles) - Roles a asignar

**Validaciones**:
- RUT único y válido
- Email único y válido
- Contraseña con complejidad mínima
- Roles deben existir en la base de datos

### Actualizar Usuario

Solo usuarios con permiso `user:update` pueden actualizar usuarios.

**Campos actualizables**:
- `nombre`
- `email` (debe ser único)
- `password` (se valida complejidad)
- `activo` (activar/desactivar cuenta)
- `roles` (agregar/remover roles)

### Eliminar Usuario

Solo usuarios con permiso `user:delete` pueden eliminar usuarios.

**Consideraciones**:
- No se puede eliminar el propio usuario
- La eliminación es lógica (marcar como inactivo) o física según configuración

### Activar/Desactivar Usuario

Solo usuarios con permiso `user:manage` pueden activar/desactivar usuarios.

**Comportamiento**:
- Usuario inactivo no puede iniciar sesión
- Los registros creados por el usuario se mantienen (con `onDelete: SetNull`)

## Gestión de Roles y Permisos

### Crear Rol

Los roles del sistema se crean mediante el seed inicial. Roles personalizados pueden crearse directamente en la base de datos.

### Asignar Permisos a Rol

Los permisos se asignan a roles mediante la tabla `RolePermission`. Esto se hace típicamente:
- En el seed inicial
- Mediante scripts de migración
- Directamente en la base de datos

### Permisos Directos a Usuario

Los permisos directos sobreescriben los permisos de roles. Se asignan mediante la tabla `UserPermission`.

**Uso típico**:
- Permisos temporales
- Permisos específicos que no justifican un rol completo
- Permisos de prueba

## Mejores Prácticas

### Seguridad

1. **Nunca exponer contraseñas**: Solo hashes en la base de datos
2. **Validar siempre en backend**: No confiar solo en validación frontend
3. **Registrar accesos denegados**: Para auditoría y seguridad
4. **Usar HTTPS en producción**: Para proteger cookies y datos
5. **Rotar contraseñas**: Implementar política de rotación si es necesario

### Gestión de Permisos

1. **Principio de menor privilegio**: Asignar solo permisos necesarios
2. **Usar roles cuando sea posible**: Más fácil de gestionar que permisos individuales
3. **Documentar permisos**: Mantener documentación actualizada
4. **Revisar permisos regularmente**: Auditar asignaciones periódicamente

### Desarrollo

1. **Verificar permisos en cada endpoint**: No asumir que el frontend es seguro
2. **Probar con diferentes roles**: Asegurar que los permisos funcionan correctamente
3. **Mensajes de error claros**: Indicar qué permiso falta cuando se deniega acceso
4. **Logs de auditoría**: Registrar todas las acciones importantes

## Troubleshooting

### Usuario no puede iniciar sesión

**Posibles causas**:
- Usuario inactivo (`activo: false`)
- Contraseña incorrecta
- Email/RUT incorrecto
- Problemas con cookies (dominio, HTTPS)

**Solución**:
1. Verificar estado del usuario en base de datos
2. Verificar hash de contraseña
3. Verificar configuración de cookies

### Usuario no ve módulos en el sidebar

**Posibles causas**:
- No tiene permisos asignados
- Roles no tienen permisos asociados
- Cookie de usuario desactualizada

**Solución**:
1. Verificar roles del usuario
2. Verificar permisos de los roles
3. Cerrar sesión y volver a iniciar

### Error 403 en endpoint

**Posibles causas**:
- Usuario no tiene el permiso requerido
- Permiso mal escrito en el código
- Roles no asignados correctamente

**Solución**:
1. Verificar permisos del usuario con `getUserPermissions()`
2. Verificar código del permiso en el endpoint
3. Verificar asignación de roles y permisos en BD

---

**Anterior**: [Base de Datos](04-base-de-datos.md) | **Siguiente**: [Referencia de API](06-api-reference.md)

