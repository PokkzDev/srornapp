# Solución de Problemas

Guía de solución de problemas comunes en el sistema SRORN.

## Problemas de Instalación

### Error: Cannot connect to database

**Síntomas**: Error al ejecutar migraciones o iniciar la aplicación.

**Causas Posibles**:
- MySQL no está corriendo
- URL de conexión incorrecta
- Usuario o contraseña incorrectos
- Base de datos no existe

**Soluciones**:
1. Verificar que MySQL esté corriendo:
```bash
# Linux/Mac
sudo systemctl status mysql
# o
sudo service mysql status

# Windows
# Verificar en Servicios
```

2. Verificar URL en `.env`:
```bash
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/srorn_db"
```

3. Probar conexión manualmente:
```bash
mysql -u usuario -p -h localhost srorn_db
```

4. Crear base de datos si no existe:
```sql
CREATE DATABASE srorn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: Prisma Client not generated

**Síntomas**: Error "PrismaClient is not generated" o tipos no encontrados.

**Solución**:
```bash
npm run db:generate
```

Si persiste:
```bash
rm -rf node_modules/.prisma
npm run db:generate
```

### Error: Migration failed

**Síntomas**: Error al ejecutar `npm run db:migrate`.

**Causas Posibles**:
- Migraciones conflictivas
- Esquema desactualizado
- Base de datos en estado inconsistente

**Soluciones**:
1. En desarrollo, usar `db:push` en lugar de `db:migrate`:
```bash
npm run db:push
```

2. Revisar migraciones en `prisma/migrations/`

3. Si es necesario, resetear base de datos (¡CUIDADO: elimina datos!):
```bash
npm run db:push -- --force-reset
```

### Error: Port 3005 already in use

**Síntomas**: Error al iniciar servidor de desarrollo.

**Solución**:
1. Encontrar proceso usando el puerto:
```bash
# Linux/Mac
lsof -i :3005

# Windows
netstat -ano | findstr :3005
```

2. Matar el proceso o cambiar puerto en `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3006"
  }
}
```

### Error: Module not found

**Síntomas**: Error "Cannot find module" al ejecutar la aplicación.

**Solución**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Problemas de Autenticación

### No puedo iniciar sesión

**Síntomas**: Error "Credenciales inválidas" con credenciales correctas.

**Soluciones**:
1. Verificar que el usuario exista en la base de datos:
```bash
npm run db:studio
```

2. Verificar que el usuario esté activo (`activo: true`)

3. Verificar formato de email/RUT:
   - Email: debe ser formato válido
   - RUT: debe ser formato `12345678-9` (sin puntos, con guion)

4. Verificar hash de contraseña (si es necesario, resetear contraseña)

### Sesión se cierra automáticamente

**Síntomas**: Usuario es redirigido al login frecuentemente.

**Causas Posibles**:
- Cookies no se están guardando
- Dominio de cookies incorrecto
- HTTPS requerido pero usando HTTP

**Soluciones**:
1. Verificar configuración de cookies en `src/app/api/auth/login/route.js`

2. En desarrollo, verificar que `NODE_ENV` no sea `production`

3. Verificar configuración de dominio en producción

### Error 401 en todas las peticiones

**Síntomas**: Todas las peticiones API retornan 401.

**Soluciones**:
1. Verificar que las cookies se estén enviando:
   - Abrir DevTools → Application → Cookies
   - Verificar que existan cookies `session` y `user`

2. Verificar que el dominio sea correcto

3. En producción, verificar configuración HTTPS

## Problemas de Permisos

### No veo módulos en el sidebar

**Síntomas**: Sidebar vacío o faltan módulos esperados.

**Soluciones**:
1. Verificar permisos del usuario:
```bash
npm run db:studio
# Revisar tabla UserRole y RolePermission
```

2. Verificar que los roles tengan permisos asignados

3. Cerrar sesión y volver a iniciar (para refrescar permisos en cookie)

4. Verificar código del permiso en `src/components/Sidebar.js`

### Error 403 en endpoint

**Síntomas**: Error "No tiene permisos" al acceder a endpoint.

**Soluciones**:
1. Verificar permisos requeridos en el endpoint

2. Verificar permisos del usuario:
```javascript
// Agregar temporalmente en el endpoint
console.log('Permisos del usuario:', permissions)
```

3. Verificar asignación de roles y permisos en base de datos

4. Verificar que el permiso esté escrito correctamente (case-sensitive)

## Problemas de Base de Datos

### Error: Foreign key constraint failed

**Síntomas**: Error al eliminar o actualizar registro relacionado.

**Causas**:
- Intento de eliminar registro que tiene relaciones
- Referencia a registro que no existe

**Soluciones**:
1. Verificar relaciones antes de eliminar

2. Eliminar relaciones primero o usar `onDelete: Cascade` si es apropiado

3. Verificar que los IDs referenciados existan

### Error: Unique constraint failed

**Síntomas**: Error al crear registro con valor único duplicado.

**Soluciones**:
1. Verificar que el valor no exista ya:
```javascript
const existente = await prisma.model.findUnique({
  where: { campo: valor },
})
```

2. Manejar error apropiadamente:
```javascript
if (error.code === 'P2002') {
  return Response.json(
    { error: 'El valor ya existe' },
    { status: 409 }
  )
}
```

### Consultas lentas

**Síntomas**: Endpoints tardan mucho en responder.

**Soluciones**:
1. Verificar índices en campos frecuentemente consultados

2. Usar `select` para traer solo campos necesarios

3. Revisar queries con Prisma logs:
```bash
PRISMA_LOG=query npm run dev
```

4. Optimizar queries complejas

5. Considerar paginación para listas grandes

## Problemas de Validación

### RUT inválido

**Síntomas**: Error "RUT inválido" con RUT que parece correcto.

**Soluciones**:
1. Verificar formato: debe ser `12345678-9` (sin puntos, con guion)

2. Verificar dígito verificador:
   - Usar calculadora de RUT online para verificar

3. Verificar función de validación en `src/lib/rut.js`

### Fecha inválida

**Síntomas**: Error al guardar fecha.

**Soluciones**:
1. Verificar formato: debe ser ISO string o Date object válido

2. Verificar que la fecha no sea futura (si aplica)

3. Verificar zona horaria

## Problemas de Frontend

### Componente no se renderiza

**Síntomas**: Componente no aparece o muestra error.

**Soluciones**:
1. Verificar que sea Client Component si usa hooks:
```javascript
'use client'
```

2. Verificar imports correctos

3. Revisar consola del navegador para errores

4. Verificar que los datos necesarios estén disponibles

### Estilos no se aplican

**Síntomas**: CSS no se carga o no se aplica.

**Soluciones**:
1. Verificar que el archivo CSS Module exista

2. Verificar import:
```javascript
import styles from './Component.module.css'
```

3. Verificar nombres de clases

4. Limpiar cache del navegador

### Error de hidratación

**Síntomas**: Warning de hidratación en consola.

**Causas**:
- HTML generado en servidor no coincide con cliente
- Uso de `Date.now()` o valores aleatorios en render

**Soluciones**:
1. Evitar valores dinámicos en render inicial

2. Usar `useEffect` para valores que cambian

3. Verificar que Server y Client Components sean consistentes

## Problemas de Producción

### Build falla

**Síntomas**: Error al ejecutar `npm run build`.

**Soluciones**:
1. Verificar errores de TypeScript/ESLint

2. Verificar variables de entorno requeridas

3. Verificar que todas las dependencias estén instaladas

4. Revisar logs de build para errores específicos

### Aplicación no responde

**Síntomas**: Timeout o error 502.

**Soluciones**:
1. Verificar que la aplicación esté corriendo:
```bash
pm2 status
```

2. Verificar logs:
```bash
pm2 logs srorn
```

3. Verificar recursos del servidor (memoria, CPU)

4. Verificar configuración de Nginx

5. Reiniciar aplicación:
```bash
pm2 restart srorn
```

### SSL no funciona

**Síntomas**: Error de certificado o conexión no segura.

**Soluciones**:
1. Verificar certificados:
```bash
sudo certbot certificates
```

2. Renovar si es necesario:
```bash
sudo certbot renew
```

3. Verificar configuración de Nginx

4. Verificar que el dominio apunte correctamente

## FAQ

### ¿Cómo resetear la base de datos?

**Desarrollo**:
```bash
npm run db:push -- --force-reset
npm run db:seed
```

**Producción**: 
⚠️ **NO hacer reset en producción**. Usar migraciones para cambios.

### ¿Cómo cambiar la contraseña de un usuario?

1. Abrir Prisma Studio: `npm run db:studio`
2. Buscar usuario en tabla User
3. Editar `passwordHash` con nuevo hash bcrypt

O crear script temporal para generar hash:
```javascript
const bcrypt = require('bcryptjs')
const hash = await bcrypt.hash('nueva_contraseña', 10)
console.log(hash)
```

### ¿Cómo agregar un nuevo permiso?

1. Agregar permiso en `prisma/seed.js`
2. Ejecutar seed: `npm run db:seed`
3. Asignar permiso a roles necesarios
4. Usar permiso en código: `permissions.includes('nuevo:permiso')`

### ¿Cómo ver logs de Prisma?

Agregar en `.env`:
```bash
PRISMA_LOG=query,error,warn
```

### ¿Cómo hacer backup de la base de datos?

```bash
mysqldump -u usuario -p srorn_db > backup.sql
```

### ¿Cómo restaurar backup?

```bash
mysql -u usuario -p srorn_db < backup.sql
```

## Obtener Ayuda

Si el problema persiste:

1. **Revisar logs**: Revisar logs de aplicación, base de datos y servidor
2. **Documentación**: Consultar documentación específica del módulo
3. **Código**: Revisar código fuente del componente/endpoint afectado
4. **Base de datos**: Verificar estado de la base de datos con Prisma Studio
5. **Comunidad**: Consultar con el equipo de desarrollo

---

**Anterior**: [Despliegue](10-despliegue.md) | **Volver al inicio**: [README](README.md)

