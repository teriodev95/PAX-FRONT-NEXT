# Guía de Despliegue - Cloudflare Pages

## Requisitos previos

- Node.js 18+
- pnpm instalado
- Wrangler autenticado (`npx wrangler login`)

## Despliegue rápido

### 1. Commit de cambios (Conventional Commits)

```bash
# Ver cambios pendientes
git status

# Agregar archivos
git add .

# Commit con mensaje descriptivo
git commit -m "tipo: descripción breve"
```

**Tipos de commit:**
| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Refactorización de código |
| `style` | Cambios de formato/estilos |
| `docs` | Documentación |
| `chore` | Tareas de mantenimiento |

**Ejemplos:**
```bash
git commit -m "feat: agregar página de certificados"
git commit -m "fix: corregir error en login"
git commit -m "refactor: optimizar carga de cursos"
git commit -m "style: mejorar diseño del header"
```

### 2. Push al repositorio

```bash
git push origin main
```

### 3. Desplegar a Cloudflare Pages

```bash
pnpm pages:deploy
```

## Comando todo-en-uno

```bash
git add . && git commit -m "feat: descripción del cambio" && git push origin main && pnpm pages:deploy
```

## URLs del proyecto

- **Producción:** https://pax-frontend.pages.dev
- **Dashboard:** https://dash.cloudflare.com → Pages → pax-frontend

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Desarrollo local |
| `pnpm build` | Build de Next.js |
| `pnpm pages:build` | Build para Cloudflare |
| `pnpm pages:preview` | Vista previa local |
| `pnpm pages:deploy` | Desplegar a producción |

## Variables de entorno

- **Desarrollo:** `.env.local` → `localhost:3099`
- **Producción:** Se configura en el script `pages:build` → `https://pax-back.xpress1.cc`

## Solución de problemas

**Error de autenticación:**
```bash
npx wrangler login
```

**Limpiar cache de build:**
```bash
rm -rf .vercel .next node_modules/.cache
pnpm pages:deploy
```
