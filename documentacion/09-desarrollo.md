# Guía de Desarrollo

Guía para desarrolladores que trabajan en el sistema SRORN.

## Estructura del Proyecto

```
srornapp/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.js                # Datos iniciales
│   └── migrations/            # Migraciones históricas
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes (Backend)
│   │   ├── dashboard/         # Páginas del dashboard
│   │   ├── layout.js          # Layout principal
│   │   ├── page.js            # Página de login
│   │   └── globals.css        # Estilos globales
│   ├── components/            # Componentes React reutilizables
│   └── lib/                   # Utilidades y helpers
├── public/                    # Archivos estáticos
├── documentacion/              # Documentación
├── package.json               # Dependencias
├── next.config.mjs           # Configuración Next.js
└── eslint.config.mjs         # Configuración ESLint
```

## Convenciones de Código

### Nombres de Archivos

- **Componentes**: PascalCase (ej: `MadreForm.js`, `DashboardLayout.js`)
- **Utilidades**: camelCase (ej: `auth.js`, `rut.js`)
- **Páginas**: `page.js` (convención de Next.js)
- **Rutas API**: `route.js` (convención de Next.js)
- **Estilos**: `ComponentName.module.css` (CSS Modules)

### Nombres de Variables y Funciones

- **Variables**: camelCase (ej: `userName`, `fechaHora`)
- **Funciones**: camelCase (ej: `getCurrentUser`, `validarRUT`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `DEFAULT_PASSWORD`)
- **Componentes**: PascalCase (ej: `UserMenu`, `Sidebar`)

### Nombres de Dominio

- **Español**: Para nombres de dominio del negocio (Madre, Parto, RecienNacido)
- **Inglés**: Para código técnico (user, auth, permissions)

## Estructura de API Routes

Cada API Route sigue esta estructura:

```javascript
import { getCurrentUser, getUserPermissions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    // 1. Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // 2. Verificar permisos
    const permissions = await getUserPermissions()
    if (!permissions.includes('required:permission')) {
      // Registrar intento de acceso sin permisos
      await prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          rol: user.roles.join(', '),
          entidad: 'EntityName',
          accion: 'PERMISSION_DENIED',
          ip: request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
        },
      })
      
      return Response.json(
        { error: 'No tiene permisos' },
        { status: 403 }
      )
    }

    // 3. Obtener parámetros
    const { searchParams } = new URL(request.url)
    const param = searchParams.get('param')

    // 4. Ejecutar lógica de negocio
    const data = await prisma.model.findMany({ ... })

    // 5. Retornar respuesta
    return Response.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

## Estructura de Componentes

### Server Components (por defecto)

```javascript
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function Page() {
  const user = await getCurrentUser()
  const data = await prisma.model.findMany()
  
  return (
    <div>
      <h1>Título</h1>
      {/* Renderizar datos */}
    </div>
  )
}
```

### Client Components

```javascript
'use client'

import { useState, useEffect } from 'react'

export default function ClientComponent() {
  const [state, setState] = useState(null)
  
  useEffect(() => {
    // Lógica del lado del cliente
  }, [])
  
  return <div>Contenido interactivo</div>
}
```

## Manejo de Errores

### En API Routes

```javascript
try {
  // Operación
} catch (error) {
  console.error('Error descriptivo:', error)
  
  // Manejar errores específicos de Prisma
  if (error.code === 'P2002') {
    return Response.json(
      { error: 'Recurso ya existe' },
      { status: 409 }
    )
  }
  
  if (error.code === 'P2003') {
    return Response.json(
      { error: 'Referencia inválida' },
      { status: 400 }
    )
  }
  
  // Error genérico
  return Response.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  )
}
```

### En Componentes

```javascript
const [error, setError] = useState(null)

try {
  const response = await fetch('/api/endpoint')
  const data = await response.json()
  
  if (!response.ok) {
    setError(data.error || 'Error desconocido')
    return
  }
  
  // Procesar datos exitosos
} catch (err) {
  setError('Error de conexión')
}
```

## Validaciones

### Validación de RUT

```javascript
import { validarRUT, formatearRUT } from '@/lib/rut'

// Validar RUT
if (!validarRUT(rut)) {
  return Response.json(
    { error: 'RUT inválido' },
    { status: 400 }
  )
}

// Formatear RUT mientras se escribe
const formatted = formatearRUT(inputValue)
```

### Validación de Fechas

```javascript
const fecha = new Date(data.fechaHora)
if (isNaN(fecha.getTime())) {
  return Response.json(
    { error: 'Fecha inválida' },
    { status: 400 }
  )
}

// Validar que no sea futura
if (fecha > new Date()) {
  return Response.json(
    { error: 'La fecha no puede ser futura' },
    { status: 400 }
  )
}
```

### Validación de Relaciones

```javascript
// Verificar que existe
const madre = await prisma.madre.findUnique({
  where: { id: madreId },
})

if (!madre) {
  return Response.json(
    { error: 'La madre no existe' },
    { status: 404 }
  )
}
```

## Transacciones

Usar transacciones para operaciones relacionadas:

```javascript
const result = await prisma.$transaction(async (tx) => {
  // Crear registro principal
  const nuevoRegistro = await tx.model.create({
    data: { ... },
  })
  
  // Registrar auditoría
  await tx.auditoria.create({
    data: {
      usuarioId: user.id,
      entidad: 'Model',
      entidadId: nuevoRegistro.id,
      accion: 'CREATE',
      detalleAfter: nuevoRegistro,
    },
  })
  
  return nuevoRegistro
})
```

## Auditoría

Siempre registrar acciones importantes:

```javascript
await prisma.auditoria.create({
  data: {
    usuarioId: user.id,
    rol: Array.isArray(user.roles) ? user.roles.join(', ') : null,
    entidad: 'EntityName',
    entidadId: entityId,
    accion: 'CREATE', // CREATE, UPDATE, DELETE, LOGIN, EXPORT
    detalleBefore: estadoAnterior, // Para UPDATE
    detalleAfter: estadoNuevo,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  },
})
```

## Prisma

### Consultas Optimizadas

```javascript
// Usar select para traer solo campos necesarios
const users = await prisma.user.findMany({
  select: {
    id: true,
    nombre: true,
    email: true,
    // No incluir passwordHash
  },
})

// Usar include selectivo
const parto = await prisma.parto.findUnique({
  where: { id },
  include: {
    madre: {
      select: {
        id: true,
        rut: true,
        nombres: true,
      },
    },
    recienNacidos: true,
  },
})
```

### Paginación

```javascript
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '20')
const skip = (page - 1) * limit

const [data, total] = await Promise.all([
  prisma.model.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.model.count(),
])

return Response.json({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
})
```

## Testing

Actualmente el proyecto no tiene tests automatizados. Para testing manual:

1. **Prisma Studio**: `npm run db:studio` para explorar datos
2. **Logs**: Revisar `console.log` en desarrollo
3. **Postman/Thunder Client**: Probar endpoints API
4. **Navegador**: Probar flujos completos en UI

## Git Workflow

### Commits

Usar mensajes descriptivos:
```
feat: agregar validación de RUT en formulario de madre
fix: corregir cálculo de días de estadía
docs: actualizar documentación de API
refactor: reorganizar estructura de componentes
```

### Branches

- `main` - Producción
- `dev` - Desarrollo
- `feature/nombre-feature` - Nuevas funcionalidades
- `fix/nombre-fix` - Correcciones

## Debugging

### Logs de Prisma

Configurar en `.env`:
```bash
PRISMA_LOG=query,error,warn
```

Esto mostrará todas las queries SQL ejecutadas.

### Console Logs

```javascript
console.log('Debug:', { variable1, variable2 })
console.error('Error:', error)
```

### Prisma Studio

```bash
npm run db:studio
```

Abre interfaz visual para explorar y editar datos directamente.

## Variables de Entorno

Crear `.env` con:
```bash
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/srorn_db"
NODE_ENV=development
ENVIRONMENT=development
PRISMA_LOG=query,error,warn
```

**Nunca commitear** `.env` con datos sensibles.

## Dependencias

### Agregar Nueva Dependencia

```bash
npm install nombre-paquete
```

### Actualizar Dependencias

```bash
npm update
```

### Revisar Vulnerabilidades

```bash
npm audit
npm audit fix
```

## Migraciones de Base de Datos

### Crear Nueva Migración

```bash
npm run db:migrate
```

Esto crea un archivo en `prisma/migrations/` con los cambios.

### Aplicar Migraciones

```bash
npm run db:migrate
```

### Revertir Migración

Revisar archivos en `prisma/migrations/` y aplicar manualmente si es necesario.

### Push Directo (Solo Desarrollo)

```bash
npm run db:push
```

**No usar en producción** - no crea archivos de migración.

## Generar Cliente Prisma

Después de cambiar `schema.prisma`:

```bash
npm run db:generate
```

Esto regenera el cliente de Prisma con los nuevos tipos.

## Estructura de Formularios

Los formularios siguen este patrón:

```javascript
'use client'

import { useState } from 'react'

export default function MyForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }
  
  const validate = () => {
    const newErrors = {}
    if (!formData.campoRequerido) {
      newErrors.campoRequerido = 'Campo requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      if (response.ok) {
        onSubmit(data)
      } else {
        setErrors({ submit: data.error })
      }
    } catch (error) {
      setErrors({ submit: 'Error de conexión' })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar
      </button>
    </form>
  )
}
```

## Recursos Útiles

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **MySQL Docs**: https://dev.mysql.com/doc/

---

**Anterior**: [Componentes](08-componentes.md) | **Siguiente**: [Despliegue](10-despliegue.md)

