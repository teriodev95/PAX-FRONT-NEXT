import axios from "axios"

const API_BASE_URL = "https://pax-back.xpress1.cc"

export interface Course {
  id: string
  titulo: string
  descripcion: string
  portada: string
  nivel: string
  totalClases: number
  duracionVideoMinutos: number
  calificacionPromedio?: string
  roles?: string[]
  modulos?: Module[]
  activo: boolean
  fechaCreacion?: string
  fechaPublicacion?: string
}

export interface Module {
  modulo_titulo: string
  descripcion?: string
  lecciones: Lesson[]
}

export interface Lesson {
  id: string
  titulo: string
  descripcion?: string
  url_video: string
  duracion_minutos: string
  tipo: string
}

// Interfaces para compatibilidad con el componente de curso individual
export interface LessonCompat {
  id: string
  title: string
  description?: string
  video_url: string
  duration_minutes: string
  type: string
}

export interface ModuleCompat {
  module_title: string
  description?: string
  lessons: LessonCompat[]
}

export interface CourseCompat {
  id: string
  title: string
  modules: ModuleCompat[]
}

export interface SingleCourseResponse {
  success: boolean
  message: {
    curso: {
      course: CourseCompat
    }
    quiz?: Quiz | null
  }
}

export interface Quiz {
  id: string
  titulo: string
  descripcion: string
  preguntas: QuizQuestion[]
}

export interface QuizQuestion {
  nombre: string
  titulo: string
  tipo: string
  opciones?: QuizOption[]
  respuesta_correcta?: string
  requerida?: boolean
}

export interface QuizOption {
  valor: string
  texto: string
}

export interface VideoProgress {
  usuario: string
  curso: string
  modulo_titulo: string
  leccion_titulo: string
  segundo_actual: number
  duracion_total: number
  porcentaje_visto: number
  completado: boolean
}

export interface ExamAttempt {
  numero_intento: number
  puntaje: number
  aprobado: boolean
  fecha_inicio: string
  fecha_fin: string
  completado: boolean
  respuestas?: any[]
}

export interface CourseEnrollment {
  id: string
  curso_id: string
  curso: string
  descripcion: string
  activa: boolean
  completado: boolean
  certificado_emitido: boolean
  fecha_inscripcion: string
}

// Función helper para obtener el token del localStorage
const getAuthToken = (): string | null => {
  // Priorizar el sessionToken del backend PAX
  const sessionToken = localStorage.getItem("lms_session_token")
  if (sessionToken) {
    return sessionToken
  }
  
  // Fallback al token antiguo si existe
  const token = localStorage.getItem("lms_token")
  return token
}

// Función helper para configurar headers comunes (sin autenticación requerida)
const getHeaders = () => {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
}

// Función helper para configurar headers con autenticación
const getAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Token de autenticación no encontrado")
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
}

export const coursesService = {
  // Obtener todos los cursos con paginación
  async getAllCourses(page: number = 1, limit: number = 10): Promise<Course[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cursos`, {
        params: { page, limit },
        headers: getHeaders(),
      })
      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo cursos:", error)
      throw error
    }
  },

  // Obtener cursos por rol del usuario
  async getCoursesByRole(userRole: string): Promise<Course[]> {
    try {
      // Usar el endpoint de cursos con filtro de rol (sin autenticación requerida)
      const response = await axios.get(`${API_BASE_URL}/api/cursos`, {
        params: { rol: userRole },
        headers: getHeaders(),
      })
      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo cursos por rol:", error)
      throw error
    }
  },

  // Obtener cursos asignados al usuario
  async getEnrolledCourses(userId: string): Promise<CourseEnrollment[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/inscripciones/usuario/${userId}`, {
        headers: getAuthHeaders(),
      })
      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo cursos asignados:", error)
      throw error
    }
  },

  // Obtener detalles de un curso específico
  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cursos/${courseId}`, {
        headers: getHeaders(),
      })

      if (!response.data.success) {
        throw new Error("Curso no encontrado")
      }

      return response.data.data
    } catch (error) {
      console.error("Error obteniendo curso:", error)
      throw error
    }
  },

  // Obtener módulos de un curso
  async getCourseModules(courseId: string): Promise<Module[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cursos/${courseId}/modulos`, {
        headers: getHeaders(),
      })
      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo módulos:", error)
      throw error
    }
  },

  // Obtener examen de un curso
  async getExamByCourseId(courseId: string): Promise<Quiz> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/examenes/curso/${courseId}`, {
        headers: getHeaders(),
      })

      const exams = response.data.data || []
      if (exams.length === 0) {
        throw new Error("Examen no encontrado para este curso")
      }

      // Tomar el primer examen del curso
      return exams[0]
    } catch (error) {
      console.error("Error obteniendo examen:", error)
      throw error
    }
  },

  // Obtener examen específico
  async getExamById(examId: string): Promise<Quiz> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/examenes/${examId}`, {
        headers: getHeaders(),
      })

      if (!response.data.success) {
        throw new Error("Examen no encontrado")
      }

      return response.data.data
    } catch (error) {
      console.error("Error obteniendo examen:", error)
      throw error
    }
  },

  // Obtener progreso de videos del usuario
  async getVideoProgress(userId: string): Promise<VideoProgress[]> {
    try {
      // Este endpoint podría no estar en la documentación, pero lo mantenemos para compatibilidad
      const response = await axios.get(`${API_BASE_URL}/api/progreso/usuario/${userId}`, {
        headers: getHeaders(),
      })
      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo progreso de videos:", error)
      return []
    }
  },

  // Guardar progreso de video
  async saveVideoProgress(
    userId: string,
    courseId: string,
    moduleTitle: string,
    lessonTitle: string,
    currentSecond: number,
    totalDuration: number,
  ): Promise<void> {
    try {
      await axios.put(
        `${API_BASE_URL}/api/progreso/video`,
        {
          usuarioId: userId,
          cursoId: courseId,
          leccionId: lessonTitle, // Usar el título como ID por ahora
          segundoActual: currentSecond,
          duracionTotal: totalDuration,
        },
        {
          headers: getHeaders(),
        }
      )
    } catch (error) {
      console.error("Error guardando progreso de video:", error)
      throw error
    }
  },

  // Obtener intentos de examen del usuario
  async getExamAttempts(userId: string, examId: string): Promise<ExamAttempt[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/examenes/${examId}/resultados`, {
        params: { usuarioId: userId },
        headers: getHeaders(),
      })
      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo intentos de examen:", error)
      return []
    }
  },

  // Enviar intento de examen
  async submitExamAttempt(
    userId: string,
    examId: string,
    courseId: string,
    attemptNumber: number,
    answers: any[],
    score: number,
    passed: boolean,
  ): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/examenes/${examId}/responder`,
        {
          usuarioId: userId,
          puntaje: score,
          aprobado: passed,
          completado: true,
          respuestas: answers,
        },
        {
          headers: getHeaders(),
        }
      )
    } catch (error) {
      console.error("Error enviando intento de examen:", error)
      throw error
    }
  },

  // Inscribir usuario a curso
  async enrollUserToCourse(userId: string, courseId: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/inscripciones`,
        {
          usuarioId: userId,
          cursoId: courseId,
        },
        {
          headers: getHeaders(),
        }
      )
    } catch (error) {
      console.error("Error inscribiendo usuario al curso:", error)
      throw error
    }
  },

  // Obtener progreso de inscripción
  async getEnrollmentProgress(enrollmentId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/inscripciones/${enrollmentId}/progreso`, {
        headers: getHeaders(),
      })
      return response.data.data
    } catch (error) {
      console.error("Error obteniendo progreso de inscripción:", error)
      throw error
    }
  },

  // Marcar curso como completado
  async markCourseCompleted(userId: string, courseId: string, finalGrade: number): Promise<void> {
    try {
      // Este endpoint podría necesitar ajuste según la API real
      await axios.put(
        `${API_BASE_URL}/api/inscripciones/${userId}/${courseId}/completar`,
        {
          nota_final: finalGrade,
        },
        {
          headers: getHeaders(),
        }
      )
    } catch (error) {
      console.error("Error marcando curso como completado:", error)
      throw error
    }
  },

  // Obtener configuración de certificado (mantenemos para compatibilidad)
  async getCertificateConfig(): Promise<any> {
    return {
      success: true,
      message: {
        certificate: {
          id: "cert_001",
          course_id: "",
          title: "Certificado de Finalización",
          recipient: {
            name: "",
            email: "",
          },
          issued_by: "LMS Interno - Plataforma de Aprendizaje",
          issue_date: new Date().toISOString(),
          verification_link: "",
          signatures: [
            {
              name: "Director Académico",
              title: "Director de Formación",
              signature_image_url: "",
            },
          ],
        },
      },
    }
  },
}