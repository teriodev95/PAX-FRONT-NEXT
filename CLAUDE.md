# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PAX Frontend is a corporate LMS (Learning Management System) built with Next.js 15 and deployed to Cloudflare Pages. It provides course management, video playback, quizzes, and certificate generation.

## Commands

```bash
pnpm dev      # Start dev server (localhost:3000)
pnpm build    # Next.js build
```

Para deployment ver `DEPLOY.md`.

## Environment

- **Development:** `.env.local` → API at `localhost:3099`
- **Production:** API at `https://pax-back.xpress1.cc`

## Backend

El backend está en `/Users/teriodev/Documents/Cursor Proyects/pax-back-elysia/` (solo disponible en la laptop de teriodev).

- Corre en el puerto `3099`
- Stack: Bun + Elysia
- Documentación de cursos: `docs/GUIA-CREAR-CURSOS.md`

Cuando se desarrolla una feature en el frontend que requiere cambios en el backend, se pueden hacer ajustes en ambos proyectos simultáneamente.

## Architecture

### Tech Stack
- Next.js 15 (App Router) with Edge Runtime for dynamic routes
- Tailwind CSS + shadcn/ui components
- Cloudflare Pages deployment via `@cloudflare/next-on-pages`

### Key Directories

```
/app                    # Next.js App Router pages
  /login               # Authentication
  /home                # Course listing
  /course/[id]         # Course player with video lessons
  /quiz/[id]           # SurveyJS-based assessments
  /certificate/[id]    # Certificate viewing
  /preview/[id]        # Admin course preview (PIN protected)
  /verify/[userId]/[courseId]  # Certificate verification
  /profile             # User profile with certificates

/services              # API client layer
  auth-service.ts      # Login, token validation
  courses-service.ts   # Course CRUD, enrollments, progress, exams

/lib
  auth-context.tsx     # React context for authentication state

/components
  /ui                  # shadcn/ui components
  /video               # HTML5 video player
  /courses             # Course cards (mobile + desktop variants)
  /certificate         # PDF certificate generator (jsPDF)
  /quiz                # SurveyJS quiz components
```

### Authentication Flow
- Login via PIN + username → receives `sessionToken`
- Token stored in localStorage (`lms_session_token`, `lms_user`)
- `AuthProvider` wraps app, validates token on mount
- Protected routes redirect to `/login` if unauthenticated

### API Integration
- All API calls go through `services/courses-service.ts`
- Base URL from `NEXT_PUBLIC_API_URL` env var
- Backend is a separate Elysia project (`pax-back-elysia`)

### Edge Runtime
Dynamic routes use `export const runtime = "edge"` for Cloudflare compatibility:
- `/course/[id]`
- `/quiz/[id]`
- `/preview/[id]`
- `/certificate/[id]`
- `/verify/[userId]/[courseId]`

## Course Data Structure

```typescript
interface Course {
  id: string
  titulo: string
  descripcion: string
  nivel: "Básico" | "Intermedio" | "Avanzado"
  roles: string[]           // Allowed roles: Agente, Gerente, Sistemas, etc.
  asociacion: string        // Organization name
  cupoLimite: number        // Enrollment limit
  validezDias: number       // Certificate validity in days
  modulos: Module[]
}

interface Module {
  modulo_titulo: string
  lecciones: Lesson[]
}

interface Lesson {
  id: string
  titulo: string
  url_video: string
  duracion_minutos: number
}
```
