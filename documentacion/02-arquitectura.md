# Arquitectura del Sistema SRORN

## Visión General

SRORN está construido como una aplicación web moderna siguiendo el patrón de arquitectura de Next.js con App Router, utilizando React para el frontend y Next.js API Routes para el backend.

## Stack Tecnológico

### Frontend

- **Next.js 16.0.1**: Framework React con App Router
- **React 19.2.0**: Biblioteca de UI
- **CSS Modules**: Estilos modulares y encapsulados
- **Font Awesome 6.5.1**: Iconografía
- **Recharts 2.12.7**: Visualización de gráficos e indicadores

### Backend

- **Next.js API Routes**: Endpoints RESTful integrados en Next.js
- **Prisma 6.18.0**: ORM para gestión de base de datos
- **bcryptjs 3.0.2**: Hash de contraseñas
- **jsPDF 2.5.2**: Generación de documentos PDF

### Base de Datos

- **MySQL**: Base de datos relacional
- **Prisma Client**: Cliente generado para acceso type-safe a la base de datos

### Herramientas de Desarrollo

- **ESLint**: Linter para JavaScript/TypeScript
- **Babel React Compiler**: Compilador experimental de React
- **Prisma Studio**: Herramienta visual para explorar la base de datos

## Arquitectura de la Aplicación

### Patrón Arquitectónico

SRORN sigue una arquitectura de **aplicación web monolítica** con separación clara entre:

1. **Capa de Presentación**: Componentes React y páginas
2. **Capa de API**: Endpoints RESTful
3. **Capa de Datos**: Prisma ORM y MySQL

### Next.js App Router

El sistema utiliza el App Router de Next.js, que proporciona:

- **Rutas basadas en archivos**: La estructura de carpetas define las rutas
- **Server Components por defecto**: Renderizado en servidor para mejor rendimiento
- **Client Components cuando es necesario**: Para interactividad del lado del cliente
- **API Routes integradas**: Endpoints RESTful en la misma aplicación

### Estructura de Carpetas

```
srornapp/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.js                # Datos iniciales
│   └── migrations/            # Migraciones de base de datos
├── src/
│   ├── app/
│   │   ├── api/               # API Routes (Backend)
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── madres/        # CRUD de madres
│   │   │   ├── partos/        # CRUD de partos
│   │   │   ├── recien-nacidos/# CRUD de recién nacidos
│   │   │   ├── urni/          # Episodios y atenciones URNI
│   │   │   ├── control-neonatal/# Controles neonatales
│   │   │   ├── informe-alta/  # Informes de alta
│   │   │   ├── modulo-alta/   # Aprobación médica
│   │   │   ├── indicadores/   # Métricas e indicadores
│   │   │   ├── auditoria/     # Registros de auditoría
│   │   │   ├── reportes/      # Reportes REM
│   │   │   ├── users/         # Gestión de usuarios
│   │   │   └── roles/         # Gestión de roles
│   │   ├── dashboard/          # Páginas del dashboard
│   │   │   ├── madres/         # Módulo de madres
│   │   │   ├── partos/         # Módulo de partos
│   │   │   ├── recien-nacidos/ # Módulo de recién nacidos
│   │   │   ├── urni/           # Módulo URNI
│   │   │   ├── control-neonatal/# Módulo control neonatal
│   │   │   ├── informe-alta/   # Módulo informe alta
│   │   │   ├── modulo-alta/    # Módulo aprobación alta
│   │   │   ├── indicadores/    # Módulo indicadores
│   │   │   ├── auditoria/      # Módulo auditoría
│   │   │   ├── reportes/       # Módulo reportes
│   │   │   └── usuarios/       # Módulo usuarios
│   │   ├── layout.js           # Layout principal
│   │   ├── page.js             # Página de login
│   │   └── globals.css         # Estilos globales
│   ├── components/             # Componentes React reutilizables
│   │   ├── DashboardLayout.js  # Layout del dashboard
│   │   ├── Sidebar.js          # Barra lateral de navegación
│   │   ├── UserMenu.js         # Menú de usuario
│   │   ├── Modal.js            # Componente modal
│   │   ├── MadreForm.js        # Formulario de madre
│   │   ├── PartoForm.js        # Formulario de parto
│   │   └── RecienNacidoForm.js # Formulario de recién nacido
│   └── lib/                     # Utilidades y helpers
│       ├── auth.js              # Funciones de autenticación
│       ├── prisma.js            # Cliente Prisma
│       └── rut.js               # Utilidades para RUT chileno
├── public/                      # Archivos estáticos
├── documentacion/               # Documentación
├── package.json                 # Dependencias y scripts
├── next.config.mjs             # Configuración de Next.js
└── eslint.config.mjs           # Configuración de ESLint
```

## Flujo de Datos

### Flujo de Autenticación

```
1. Usuario ingresa credenciales (email o RUT + password)
   ↓
2. Frontend envía POST a /api/auth/login
   ↓
3. Backend valida credenciales con bcryptjs
   ↓
4. Backend crea cookies de sesión
   ↓
5. Frontend redirige a /dashboard
   ↓
6. Cada request verifica cookies para autenticación
```

### Flujo de Autorización (RBAC)

```
1. Usuario autenticado hace request
   ↓
2. Middleware obtiene usuario de cookies
   ↓
3. Sistema consulta roles del usuario en BD
   ↓
4. Sistema obtiene permisos asociados a los roles
   ↓
5. Sistema verifica si el permiso requerido está presente
   ↓
6. Si tiene permiso: permite acceso
   Si no: registra en auditoría y retorna 403
```

### Flujo de Operaciones CRUD

```
1. Usuario interactúa con UI (Client Component)
   ↓
2. Client Component hace fetch a API Route
   ↓
3. API Route (Server Component):
   a. Verifica autenticación
   b. Verifica permisos
   c. Valida datos
   d. Ejecuta operación en BD con Prisma
   e. Registra en auditoría
   f. Retorna respuesta
   ↓
4. Client Component actualiza UI
```

## Patrones de Diseño Utilizados

### 1. Server Components vs Client Components

**Server Components** (por defecto):
- Renderizado en servidor
- Acceso directo a base de datos
- Sin JavaScript en el cliente
- Mejor rendimiento inicial

**Client Components** (`'use client'`):
- Interactividad del lado del cliente
- Hooks de React (useState, useEffect)
- Eventos del usuario
- Formularios dinámicos

### 2. API Routes Pattern

Cada recurso tiene su propia ruta API:
- `/api/madres` - CRUD de madres
- `/api/madres/[id]` - Operaciones específicas por ID
- `/api/partos` - CRUD de partos
- etc.

### 3. Component Composition

Componentes reutilizables compuestos:
- `DashboardLayout` envuelve todas las páginas
- `Sidebar` se integra en el layout
- `Modal` se usa en múltiples contextos
- Forms compartidos entre crear/editar

### 4. Middleware Pattern

Verificación de autenticación y permisos en cada API Route:
```javascript
const user = await getCurrentUser()
if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

const permissions = await getUserPermissions()
if (!permissions.includes('required:permission')) {
  return Response.json({ error: 'Sin permisos' }, { status: 403 })
}
```

### 5. Transaction Pattern

Operaciones críticas usan transacciones de Prisma:
```javascript
await prisma.$transaction(async (tx) => {
  const nuevoRegistro = await tx.modelo.create({ data })
  await tx.auditoria.create({ data: auditData })
  return nuevoRegistro
})
```

## Gestión de Estado

### Estado del Servidor

- **Base de Datos**: Fuente única de verdad
- **Cookies**: Estado de sesión del usuario
- **Server Components**: Datos frescos en cada request

### Estado del Cliente

- **React State**: Estado local de componentes (formularios, modales)
- **URL State**: Filtros y paginación en query params
- **No hay estado global**: No se usa Redux o Context API global

## Seguridad

### Autenticación

- Cookies HTTP-only para sesiones
- Hash de contraseñas con bcryptjs (10 rounds)
- Validación de RUT chileno con dígito verificador
- Login con email o RUT

### Autorización

- RBAC granular (roles y permisos)
- Verificación en cada endpoint
- Auditoría de accesos denegados
- Permisos limitados para ciertos roles

### Validación

- Validación en frontend (UX)
- Validación en backend (seguridad)
- Validación de tipos con Prisma
- Validación de relaciones (foreign keys)

### Protección de Datos

- No se exponen contraseñas (solo hash)
- No se exponen datos sensibles en respuestas
- Logs de auditoría para trazabilidad
- Validación de entrada para prevenir inyección SQL

## Rendimiento

### Optimizaciones Implementadas

1. **Server Components**: Renderizado en servidor reduce JavaScript inicial
2. **Paginación**: Listas grandes se paginan (default 20 items)
3. **Índices de BD**: Campos frecuentemente consultados tienen índices
4. **Queries Optimizadas**: Uso de `select` para traer solo campos necesarios
5. **Transacciones**: Operaciones relacionadas se agrupan

### Consideraciones de Escalabilidad

- Base de datos MySQL puede escalar horizontalmente
- Next.js puede escalar con múltiples instancias
- Stateless API permite load balancing
- Cookies permiten sticky sessions si es necesario

## Integraciones

### Actuales

- **Prisma**: Integración con MySQL
- **bcryptjs**: Hash de contraseñas
- **jsPDF**: Generación de PDFs
- **Recharts**: Gráficos e indicadores

### Futuras Posibles

- Integración con sistemas hospitalarios externos
- APIs de terceros para validación de datos
- Sistemas de notificaciones
- Exportación a formatos adicionales

## Monitoreo y Logs

### Logging

- Console.log para desarrollo
- Prisma logs configurables (query, error, warn)
- Auditoría completa en base de datos

### Métricas

- Indicadores del sistema disponibles en módulo de indicadores
- Auditoría de acciones para análisis
- Reportes REM para estadísticas

## Consideraciones de Desarrollo

### Convenciones

- Nombres en español para dominio del negocio
- Nombres en inglés para código técnico
- Componentes en PascalCase
- Archivos en camelCase
- Rutas API siguen estructura RESTful

### Testing

- Actualmente sin tests automatizados
- Validación manual mediante UI
- Prisma Studio para verificación de datos

### Deployment

- Build estático de Next.js
- Variables de entorno para configuración
- Migraciones de Prisma antes del deploy
- Seed de datos iniciales

---

**Anterior**: [Introducción](01-introduccion.md) | **Siguiente**: [Instalación](03-instalacion.md)

