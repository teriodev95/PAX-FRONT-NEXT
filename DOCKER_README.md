# PAX Frontend - Docker Setup

## Configuración con Docker

### Prerrequisitos
- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)

### Configuración de Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus valores:
```env
NEXT_PUBLIC_API_URL=https://pax-back.xpress1.cc
PORT=3000
```

### Construcción y Ejecución

#### Opción 1: Usar Docker Compose (Recomendado)

1. Construir y ejecutar:
```bash
docker-compose up -d --build
```

2. Ver logs:
```bash
docker-compose logs -f
```

3. Detener:
```bash
docker-compose down
```

#### Opción 2: Usar Docker directamente

1. Construir la imagen:
```bash
docker build -t pax-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://pax-back.xpress1.cc \
  .
```

2. Ejecutar el contenedor:
```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://pax-back.xpress1.cc \
  --name pax-frontend \
  pax-frontend:latest
```

3. Ver logs:
```bash
docker logs -f pax-frontend
```

4. Detener y eliminar:
```bash
docker stop pax-frontend
docker rm pax-frontend
```

### Verificar que está funcionando

Abre tu navegador en: http://localhost:3000

### Comandos Útiles

#### Docker Compose
- Reconstruir sin caché: `docker-compose build --no-cache`
- Ver estado: `docker-compose ps`
- Reiniciar: `docker-compose restart`
- Ver logs de un servicio: `docker-compose logs pax-frontend`

#### Docker
- Ver contenedores activos: `docker ps`
- Ver todas las imágenes: `docker images`
- Eliminar imagen: `docker rmi pax-frontend:latest`
- Entrar al contenedor: `docker exec -it pax-frontend sh`

### Solución de Problemas

1. **Puerto 3000 ya está en uso:**
   - Cambia el puerto en el archivo `.env`: `PORT=3001`
   - O en docker-compose: `-p 3001:3000`

2. **Error de conexión con el backend:**
   - Verifica que `NEXT_PUBLIC_API_URL` sea correcto
   - Asegúrate de que el backend esté accesible

3. **Contenedor se reinicia constantemente:**
   - Revisa los logs: `docker logs pax-frontend`
   - Verifica que todas las dependencias estén instaladas

### Producción

Para producción, considera:

1. Usar un registry de Docker (Docker Hub, AWS ECR, etc.)
2. Configurar un reverse proxy (Nginx, Traefik)
3. Implementar HTTPS con certificados SSL
4. Configurar límites de recursos:

```yaml
# En docker-compose.yml
services:
  pax-frontend:
    # ... otras configuraciones
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Desarrollo con Docker

Para desarrollo, puedes montar el código como volumen:

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  pax-frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    command: npm run dev
```

### Notas Importantes

- La imagen usa Node.js 18 Alpine para menor tamaño
- Se ejecuta con usuario no-root por seguridad
- El build es multi-stage para optimizar el tamaño final
- La configuración `output: 'standalone'` en Next.js reduce el tamaño del bundle