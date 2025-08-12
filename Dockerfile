# Etapa 1: Dependencias
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Etapa 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependencias desde la etapa anterior
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Variables de entorno para el build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build de la aplicación
RUN npm run build

# Etapa 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copiar archivos necesarios desde el builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Cambiar al usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno para runtime
ENV PORT 3000
ENV NODE_ENV production
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]