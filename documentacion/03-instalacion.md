# Guía de Instalación del Sistema SRORN

Esta guía te ayudará a instalar y configurar el sistema SRORN en tu entorno local o de producción.

## Requisitos del Sistema

### Requisitos Mínimos

- **Node.js**: Versión 18.0.0 o superior
- **npm**: Versión 9.0.0 o superior (incluido con Node.js)
- **MySQL**: Versión 8.0 o superior
- **Sistema Operativo**: Windows, macOS o Linux

### Requisitos Recomendados

- **Node.js**: Versión 20.x LTS
- **MySQL**: Versión 8.0 o superior
- **RAM**: Mínimo 4GB (8GB recomendado)
- **Espacio en Disco**: Mínimo 2GB libres

## Instalación Local

### Paso 1: Clonar o Descargar el Proyecto

Si tienes acceso al repositorio:
```bash
git clone <url-del-repositorio>
cd srornapp
```

O descarga y extrae el código fuente en una carpeta llamada `srornapp`.

### Paso 2: Instalar Dependencias

Navega al directorio del proyecto e instala las dependencias:

```bash
cd srornapp
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- Next.js y React
- Prisma y Prisma Client
- bcryptjs
- jsPDF
- Recharts
- Y otras dependencias necesarias

### Paso 3: Configurar Base de Datos MySQL

#### 3.1. Crear Base de Datos

Conecta a MySQL y crea una base de datos:

```sql
CREATE DATABASE srorn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3.2. Crear Usuario (Opcional pero Recomendado)

```sql
CREATE USER 'srorn_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON srorn_db.* TO 'srorn_user'@'localhost';
FLUSH PRIVILEGES;
```

### Paso 4: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Base de Datos
DATABASE_URL="mysql://srorn_user:tu_contraseña_segura@localhost:3306/srorn_db"

# Entorno
NODE_ENV=development
ENVIRONMENT=development

# Opcional: Logs de Prisma (desarrollo)
PRISMA_LOG=query,error,warn
```

**Nota**: Reemplaza `tu_contraseña_segura` con la contraseña que configuraste para el usuario de MySQL.

**Formato de DATABASE_URL**:
```
mysql://usuario:contraseña@host:puerto/nombre_base_datos
```

### Paso 5: Generar Cliente de Prisma

Genera el cliente de Prisma basado en el esquema:

```bash
npm run db:generate
```

Este comando lee `prisma/schema.prisma` y genera el cliente de Prisma en `node_modules/.prisma/client`.

### Paso 6: Ejecutar Migraciones

Aplica las migraciones para crear las tablas en la base de datos:

```bash
npm run db:migrate
```

O si prefieres hacer push directo del esquema (útil en desarrollo):

```bash
npm run db:push
```

**Nota**: `db:push` sincroniza el esquema directamente sin crear archivos de migración. `db:migrate` crea archivos de migración que son mejores para producción.

### Paso 7: Seed de Datos Iniciales

Ejecuta el script de seed para crear datos iniciales (roles, permisos, usuarios de prueba):

```bash
npm run db:seed
```

Esto creará:
- Roles del sistema (Matrona, Médico, Enfermera, Administrativo, Jefatura, Admin TI)
- Permisos asociados a cada rol
- Usuarios de prueba (ver sección de usuarios de prueba)

### Paso 8: Iniciar Servidor de Desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3005` (puerto configurado en `package.json`).

### Paso 9: Verificar Instalación

1. Abre tu navegador y navega a `http://localhost:3005`
2. Deberías ver la página de login
3. Prueba iniciar sesión con uno de los usuarios de prueba (ver sección siguiente)

## Usuarios de Prueba

Después de ejecutar el seed, tendrás los siguientes usuarios disponibles:

| Email | RUT | Contraseña | Rol |
|-------|-----|------------|-----|
| matrona@srorn.cl | 12345678-9 | Asdf1234 | Matrona |
| medico@srorn.cl | 23456789-0 | Asdf1234 | Médico |
| enfermera@srorn.cl | 34567890-1 | Asdf1234 | Enfermera |
| administrativo@srorn.cl | 45678901-2 | Asdf1234 | Administrativo |
| jefatura@srorn.cl | 56789012-3 | Asdf1234 | Jefatura |
| ti@srorn.cl | 99999999-9 | Asdf1234 | Administrador TI |

**⚠️ IMPORTANTE**: Cambia estas contraseñas en producción.

## Scripts Disponibles

El proyecto incluye los siguientes scripts npm:

### Desarrollo

```bash
npm run dev              # Inicia servidor de desarrollo en puerto 3005
npm run dev:tunnel       # Muestra instrucciones para usar ngrok
```

### Build y Producción

```bash
npm run build            # Crea build de producción
npm start                # Inicia servidor de producción (puerto 3005)
```

### Base de Datos

```bash
npm run db:generate      # Genera cliente de Prisma
npm run db:push          # Sincroniza esquema con BD (desarrollo)
npm run db:migrate       # Ejecuta migraciones
npm run db:studio        # Abre Prisma Studio (interfaz visual)
npm run db:seed          # Ejecuta seed de datos iniciales
```

### Linting

```bash
npm run lint             # Ejecuta ESLint
```

## Configuración Adicional

### Prisma Studio

Prisma Studio es una interfaz visual para explorar y editar datos:

```bash
npm run db:studio
```

Se abrirá en `http://localhost:5555` por defecto.

### Variables de Entorno Adicionales

Puedes agregar estas variables opcionales al `.env`:

```bash
# Puerto del servidor (si quieres cambiar el default 3005)
PORT=3005

# URL base de la aplicación (para producción)
NEXT_PUBLIC_BASE_URL=http://localhost:3005

# Ambiente (development, staging, production)
ENVIRONMENT=development
NODE_ENV=development

# Logs de Prisma
# Opciones: query, error, warn, info
# En desarrollo: query,error,warn
# En producción: error
PRISMA_LOG=query,error,warn
```

## Verificación de Instalación

### Checklist de Verificación

- [ ] Node.js instalado (versión 18+)
- [ ] MySQL instalado y corriendo
- [ ] Base de datos creada
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Cliente Prisma generado (`npm run db:generate`)
- [ ] Migraciones ejecutadas (`npm run db:migrate` o `db:push`)
- [ ] Seed ejecutado (`npm run db:seed`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Página de login accesible en `http://localhost:3005`
- [ ] Login exitoso con usuario de prueba

### Pruebas Básicas

1. **Login**: Intenta iniciar sesión con `matrona@srorn.cl` / `Asdf1234`
2. **Navegación**: Verifica que el sidebar muestre los módulos según el rol
3. **Crear Registro**: Intenta crear una madre nueva
4. **Base de Datos**: Abre Prisma Studio y verifica que los datos se guarden

## Solución de Problemas Comunes

### Error: Cannot connect to database

**Causa**: MySQL no está corriendo o la URL de conexión es incorrecta.

**Solución**:
1. Verifica que MySQL esté corriendo: `mysql -u root -p`
2. Verifica la URL en `.env`: `DATABASE_URL`
3. Verifica que el usuario y contraseña sean correctos
4. Verifica que la base de datos exista

### Error: Prisma Client not generated

**Causa**: El cliente de Prisma no se ha generado.

**Solución**:
```bash
npm run db:generate
```

### Error: Migration failed

**Causa**: Puede haber conflictos con migraciones existentes o esquema desactualizado.

**Solución**:
1. Si es desarrollo inicial, puedes usar `db:push` en lugar de `db:migrate`
2. Si hay migraciones conflictivas, revisa `prisma/migrations/`
3. Verifica que el esquema en `schema.prisma` sea correcto

### Error: Port 3005 already in use

**Causa**: Otro proceso está usando el puerto 3005.

**Solución**:
1. Encuentra el proceso: `lsof -i :3005` (macOS/Linux) o `netstat -ano | findstr :3005` (Windows)
2. Mata el proceso o cambia el puerto en `package.json`

### Error: Module not found

**Causa**: Dependencias no instaladas correctamente.

**Solución**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Instalación en Producción

### Preparación

1. **Servidor**: Asegúrate de tener un servidor con Node.js 18+ y MySQL 8+
2. **Dominio**: Configura un dominio o subdominio
3. **SSL**: Configura certificado SSL (Let's Encrypt recomendado)
4. **Variables de Entorno**: Configura `.env` con valores de producción

### Variables de Entorno de Producción

```bash
# Base de Datos (producción)
DATABASE_URL="mysql://usuario:contraseña_segura@host:3306/srorn_db"

# Entorno
NODE_ENV=production
ENVIRONMENT=production

# URL base
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com

# Logs (solo errores en producción)
PRISMA_LOG=error
```

### Build de Producción

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Crear build
npm run build

# Iniciar servidor
npm start
```

### Consideraciones de Producción

1. **Base de Datos**: Usa un servidor MySQL dedicado, no localhost
2. **Seguridad**: Cambia todas las contraseñas por defecto
3. **Backups**: Configura backups regulares de la base de datos
4. **Monitoreo**: Configura monitoreo y alertas
5. **Logs**: Configura rotación de logs
6. **HTTPS**: Usa HTTPS siempre en producción
7. **Firewall**: Configura firewall para proteger el servidor

## Próximos Pasos

Después de instalar el sistema:

1. Lee la [Documentación de Base de Datos](04-base-de-datos.md) para entender el esquema
2. Revisa la [Documentación de Autenticación y RBAC](05-autenticacion-rbac.md) para gestionar usuarios
3. Consulta los [Módulos](07-modulos.md) para entender las funcionalidades
4. Revisa la [Referencia de API](06-api-reference.md) si vas a integrar con otros sistemas

---

**Anterior**: [Arquitectura](02-arquitectura.md) | **Siguiente**: [Base de Datos](04-base-de-datos.md)

