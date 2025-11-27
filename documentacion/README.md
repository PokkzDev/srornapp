# Documentación del Sistema SRORN

**Sistema de Registro de Obstetricia y Recién Nacidos**

Bienvenido a la documentación completa del sistema SRORN. Esta documentación proporciona información detallada sobre la arquitectura, instalación, uso y desarrollo del sistema.

## Índice de Documentación

### Documentos Principales

1. **[Introducción](01-introduccion.md)** - Descripción general del sistema, objetivos y alcance
2. **[Arquitectura](02-arquitectura.md)** - Arquitectura del sistema, stack tecnológico y patrones de diseño
3. **[Instalación](03-instalacion.md)** - Guía completa de instalación y configuración
4. **[Base de Datos](04-base-de-datos.md)** - Esquema completo de base de datos y modelos Prisma
5. **[Autenticación y RBAC](05-autenticacion-rbac.md)** - Sistema de autenticación y control de acceso basado en roles
6. **[Referencia de API](06-api-reference.md)** - Documentación completa de todos los endpoints REST
7. **[Módulos](07-modulos.md)** - Documentación detallada de cada módulo del sistema
8. **[Componentes](08-componentes.md)** - Documentación de componentes React reutilizables
9. **[Desarrollo](09-desarrollo.md)** - Guía para desarrolladores y convenciones de código
10. **[Despliegue](10-despliegue.md)** - Guía de despliegue y configuración de producción
11. **[Solución de Problemas](11-troubleshooting.md)** - Problemas comunes y soluciones

## Guía de Inicio Rápido

### Para Nuevos Usuarios

Si eres nuevo en el sistema SRORN, te recomendamos seguir este orden de lectura:

1. Lee la [Introducción](01-introduccion.md) para entender qué es SRORN y qué hace
2. Revisa la [Arquitectura](02-arquitectura.md) para entender cómo está construido
3. Sigue la guía de [Instalación](03-instalacion.md) para configurar tu entorno de desarrollo
4. Consulta los [Módulos](07-modulos.md) para entender las funcionalidades disponibles

### Para Desarrolladores

Si vas a desarrollar o mantener el sistema:

1. Lee [Desarrollo](09-desarrollo.md) para entender las convenciones y estructura
2. Consulta [Base de Datos](04-base-de-datos.md) para entender el esquema de datos
3. Revisa [Referencia de API](06-api-reference.md) para entender los endpoints disponibles
4. Consulta [Componentes](08-componentes.md) para componentes reutilizables

### Para Administradores

Si vas a desplegar o administrar el sistema:

1. Lee [Instalación](03-instalacion.md) para configuración inicial
2. Revisa [Despliegue](10-despliegue.md) para producción
3. Consulta [Autenticación y RBAC](05-autenticacion-rbac.md) para gestión de usuarios y permisos
4. Revisa [Solución de Problemas](11-troubleshooting.md) para resolver problemas comunes

## Enlaces Rápidos

### Conceptos Clave

- [Sistema RBAC](05-autenticacion-rbac.md#sistema-rbac) - Control de acceso basado en roles
- [Modelo de Datos](04-base-de-datos.md#modelos-principales) - Estructura de la base de datos
- [Flujos de Trabajo](01-introduccion.md#flujos-de-trabajo-principales) - Procesos del sistema

### Referencias Técnicas

- [Endpoints API](06-api-reference.md) - Todos los endpoints disponibles
- [Modelos Prisma](04-base-de-datos.md#modelos-detallados) - Esquema completo de base de datos
- [Componentes React](08-componentes.md) - Componentes reutilizables

### Guías Operativas

- [Instalación Local](03-instalacion.md#instalación-local) - Configurar entorno de desarrollo
- [Despliegue Producción](10-despliegue.md#despliegue-en-producción) - Configurar servidor de producción
- [Gestión de Usuarios](05-autenticacion-rbac.md#gestión-de-usuarios) - Crear y gestionar usuarios

## Estructura del Proyecto

```
srornapp/
├── prisma/              # Esquema de base de datos y migraciones
├── src/
│   ├── app/            # Rutas de Next.js (App Router)
│   │   ├── api/        # Endpoints de la API REST
│   │   └── dashboard/  # Páginas del dashboard
│   ├── components/     # Componentes React reutilizables
│   └── lib/            # Utilidades y helpers
├── public/             # Archivos estáticos
└── documentacion/      # Esta documentación
```

## Tecnologías Principales

- **Frontend**: Next.js 16.0.1 con React 19.2.0
- **Backend**: Next.js API Routes (RESTful)
- **Base de Datos**: MySQL con Prisma ORM
- **Autenticación**: Cookies con bcryptjs
- **Visualización**: Recharts para gráficos

## Contacto y Soporte

Para preguntas o problemas:

1. Consulta la sección [Solución de Problemas](11-troubleshooting.md)
2. Revisa los logs del sistema
3. Consulta la documentación específica del módulo en [Módulos](07-modulos.md)

---

**Última actualización**: Noviembre 2025

**Versión del Sistema**: 0.1.0

