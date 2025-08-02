# LMS Interno

Plataforma de aprendizaje interno para cursos corporativos.

## Características

- **Autenticación**: Login seguro con token
- **Cursos**: Visualización y navegación de contenido
- **Videos**: Reproductor HTML5 nativo
- **Quizzes**: Evaluaciones con SurveyJS
- **Certificados**: Generación automática con jsPDF
- **Responsive**: Optimizado para desktop y móvil

## Estructura

\`\`\`
/app
  /login - Autenticación
  /home - Lista de cursos
  /course/[id] - Detalle del curso
  /profile - Perfil del usuario
/components
  /layout - Header y navegación
  /courses - Componentes de cursos
  /video - Reproductor de video
  /quiz - Sistema de evaluación
  /certificate - Generador de certificados
/services
  auth-service.ts - Autenticación
  courses-service.ts - Gestión de cursos
/lib
  auth-context.tsx - Contexto de autenticación
\`\`\`

## Tecnologías

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Axios (HTTP requests)
- HTML5 Video (Video player nativo)
- SurveyJS (Quizzes)
- jsPDF (Certificates)

## Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

## API Endpoints

- `POST /api/auth/login` - Autenticación
- `GET /api/cursos-pax/` - Lista de cursos
- `GET /api/cursos-pax/one` - Detalle de curso
- `GET /api/cursos-pax/diploma/config` - Configuración de certificados
