# Guía de Despliegue

Guía para desplegar el sistema SRORN en producción.

## Preparación

### Requisitos del Servidor

- **Sistema Operativo**: Linux (Ubuntu 20.04+ recomendado) o Windows Server
- **Node.js**: Versión 18.x LTS o superior
- **MySQL**: Versión 8.0 o superior
- **Memoria RAM**: Mínimo 4GB (8GB recomendado)
- **Espacio en Disco**: Mínimo 10GB libres
- **Dominio**: Dominio o subdominio configurado
- **SSL**: Certificado SSL (Let's Encrypt recomendado)

### Configuración del Servidor

1. **Actualizar sistema**:
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Instalar Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instalar MySQL**:
```bash
sudo apt install mysql-server
sudo mysql_secure_installation
```

4. **Instalar Nginx** (opcional, para reverse proxy):
```bash
sudo apt install nginx
```

5. **Instalar Certbot** (para SSL):
```bash
sudo apt install certbot python3-certbot-nginx
```

## Configuración de Base de Datos

### Crear Base de Datos

```sql
CREATE DATABASE srorn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Crear Usuario

```sql
CREATE USER 'srorn_user'@'localhost' IDENTIFIED BY 'contraseña_segura_fuerte';
GRANT ALL PRIVILEGES ON srorn_db.* TO 'srorn_user'@'localhost';
FLUSH PRIVILEGES;
```

### Configurar MySQL para Producción

Editar `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
```

Reiniciar MySQL:
```bash
sudo systemctl restart mysql
```

## Configuración de la Aplicación

### Clonar o Subir Código

```bash
cd /var/www
git clone <repositorio> srornapp
cd srornapp
```

O subir código mediante FTP/SFTP.

### Instalar Dependencias

```bash
npm install --production
```

### Variables de Entorno

Crear `.env` en la raíz:

```bash
# Base de Datos
DATABASE_URL="mysql://srorn_user:contraseña_segura@localhost:3306/srorn_db"

# Entorno
NODE_ENV=production
ENVIRONMENT=production

# URL Base
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com

# Logs (solo errores en producción)
PRISMA_LOG=error

# Opcional: Puerto personalizado
PORT=3005
```

**⚠️ IMPORTANTE**: 
- No commitear `.env` con datos sensibles
- Usar contraseñas fuertes
- Cambiar todas las contraseñas por defecto

### Generar Cliente Prisma

```bash
npm run db:generate
```

### Ejecutar Migraciones

```bash
npm run db:migrate
```

### Seed de Datos Iniciales (Opcional)

```bash
npm run db:seed
```

**Nota**: Solo ejecutar seed si es primera instalación. No ejecutar en producción con datos existentes.

## Build de Producción

### Crear Build

```bash
npm run build
```

Esto crea una carpeta `.next` con el build optimizado.

### Verificar Build

```bash
npm start
```

Verificar que la aplicación funciona correctamente.

## Configuración de Nginx (Reverse Proxy)

Crear archivo de configuración `/etc/nginx/sites-available/srorn`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/srorn_access.log;
    error_log /var/log/nginx/srorn_error.log;

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Tamaño máximo de upload
    client_max_body_size 10M;
}
```

Habilitar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/srorn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Configurar SSL con Let's Encrypt

```bash
sudo certbot --nginx -d tu-dominio.com
```

Certbot configurará automáticamente SSL y renovación.

## Configurar PM2 (Process Manager)

### Instalar PM2

```bash
npm install -g pm2
```

### Crear Archivo de Configuración

Crear `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'srorn',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/srornapp',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3005,
    },
    error_file: '/var/log/pm2/srorn-error.log',
    out_file: '/var/log/pm2/srorn-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
  }],
}
```

### Iniciar con PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Comandos PM2 Útiles

```bash
pm2 status          # Ver estado
pm2 logs srorn      # Ver logs
pm2 restart srorn   # Reiniciar
pm2 stop srorn      # Detener
pm2 delete srorn    # Eliminar
```

## Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activar firewall
sudo ufw enable
```

## Backups

### Script de Backup de Base de Datos

Crear `/usr/local/bin/backup-srorn.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/srorn"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u srorn_user -p'contraseña' srorn_db > $BACKUP_DIR/db_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/db_$DATE.sql

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completado: db_$DATE.sql.gz"
```

Hacer ejecutable:
```bash
chmod +x /usr/local/bin/backup-srorn.sh
```

### Configurar Cron para Backups Diarios

```bash
crontab -e
```

Agregar:
```
0 2 * * * /usr/local/bin/backup-srorn.sh >> /var/log/backup-srorn.log 2>&1
```

Esto ejecuta backup diario a las 2 AM.

## Monitoreo

### Logs de la Aplicación

```bash
# Logs de PM2
pm2 logs srorn

# Logs de Nginx
sudo tail -f /var/log/nginx/srorn_access.log
sudo tail -f /var/log/nginx/srorn_error.log
```

### Monitoreo de Recursos

```bash
# CPU y Memoria
htop

# Espacio en disco
df -h

# Procesos Node
ps aux | grep node
```

## Actualizaciones

### Proceso de Actualización

1. **Backup de base de datos**:
```bash
/usr/local/bin/backup-srorn.sh
```

2. **Pull de código**:
```bash
cd /var/www/srornapp
git pull origin main
```

3. **Instalar dependencias**:
```bash
npm install --production
```

4. **Ejecutar migraciones**:
```bash
npm run db:migrate
```

5. **Generar cliente Prisma**:
```bash
npm run db:generate
```

6. **Crear build**:
```bash
npm run build
```

7. **Reiniciar aplicación**:
```bash
pm2 restart srorn
```

8. **Verificar**:
```bash
pm2 logs srorn
```

## Seguridad

### Checklist de Seguridad

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Configurar HTTPS con certificado válido
- [ ] Configurar firewall
- [ ] Usar contraseñas fuertes para base de datos
- [ ] No exponer `.env` públicamente
- [ ] Configurar backups regulares
- [ ] Mantener sistema y dependencias actualizadas
- [ ] Configurar logs de seguridad
- [ ] Revisar permisos de archivos
- [ ] Configurar rate limiting si es necesario

### Permisos de Archivos

```bash
# Propietario correcto
sudo chown -R www-data:www-data /var/www/srornapp

# Permisos correctos
chmod 755 /var/www/srornapp
chmod 600 /var/www/srornapp/.env
```

## Troubleshooting

### La aplicación no inicia

1. Verificar logs: `pm2 logs srorn`
2. Verificar variables de entorno
3. Verificar que el puerto no esté en uso
4. Verificar permisos de archivos

### Error de conexión a base de datos

1. Verificar que MySQL esté corriendo: `sudo systemctl status mysql`
2. Verificar `DATABASE_URL` en `.env`
3. Verificar que el usuario tenga permisos
4. Verificar firewall

### Error 502 Bad Gateway

1. Verificar que la aplicación esté corriendo: `pm2 status`
2. Verificar logs de Nginx: `sudo tail -f /var/log/nginx/srorn_error.log`
3. Verificar que el puerto sea correcto en configuración de Nginx

### SSL no funciona

1. Verificar certificados: `sudo certbot certificates`
2. Verificar configuración de Nginx
3. Renovar certificado si es necesario: `sudo certbot renew`

## Consideraciones Adicionales

### Escalabilidad

Para escalar horizontalmente:
- Usar múltiples instancias de PM2
- Configurar load balancer
- Usar base de datos MySQL replicada
- Considerar Redis para sesiones compartidas

### Performance

- Habilitar compresión en Nginx
- Configurar cache de Nginx para assets estáticos
- Optimizar queries de base de datos
- Usar CDN para assets estáticos si es necesario

### Mantenimiento

- Revisar logs regularmente
- Monitorear uso de recursos
- Ejecutar backups y verificar que funcionen
- Mantener dependencias actualizadas
- Revisar seguridad periódicamente

---

**Anterior**: [Desarrollo](09-desarrollo.md) | **Siguiente**: [Solución de Problemas](11-troubleshooting.md)

