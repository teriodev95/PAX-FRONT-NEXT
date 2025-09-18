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
  duracionPracticaHoras?: number
  roles?: string[]
  modulos?: Module[]
  activo: boolean
  cupoLimite?: number
  asociacion?: string
  validezDias?: number
  fechaCreacion?: string
  fechaPublicacion?: string | null
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
  url_video?: string
  duracion_minutos: number
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
  id: string
  usuarioId: string
  cursoId: string
  leccionId: string
  segundoActual: number
  duracionTotal: number
  porcentajeVisto: string
  completado: boolean
}

export interface CourseProgress {
  inscripcion: {
    id: string
    usuarioId: string
    cursoId: string
    fechaInscripcion: string
    progresoPorcentaje: string
    activo: boolean
  }
  progresosVideos: VideoProgress[]
  resumen: {
    totalVideos: number
    videosCompletados: number
    tiempoTotalVisto: number
  }
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

// Interface para la nueva estructura de respuesta del API
export interface CourseApiResponse {
  success: boolean
  data: Course
}

export interface CourseEnrollment {
  id: string
  usuarioId: string
  cursoId: string
  fechaInscripcion: string
  progresoPorcentaje: string
  activo: boolean
  curso: {
    id: string
    titulo: string
    descripcion: string
    nivel: string
    portada: string
    calificacionPromedio: string
    totalClases: number
    duracionVideoMinutos: number
  }
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

  // Función auxiliar para mezclar un array (algoritmo Fisher-Yates)
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array] // Crear copia para no mutar el original
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },

  // Obtener examen de un curso
  async getExamByCourseId(courseId: string): Promise<Quiz> {
    try {
      console.log("Obteniendo examen para el curso:", courseId)
      const url = `${API_BASE_URL}/api/examenes/curso/${courseId}`
      console.log("URL del endpoint:", url)
      
      const response = await axios.get(url, {
        headers: getHeaders(),
      })
      
      console.log("Respuesta del backend:", response.data)

      const exams = response.data.data || []
      if (exams.length === 0) {
        throw new Error("Examen no encontrado para este curso")
      }

      // Tomar el primer examen del curso y transformar a la estructura esperada
      const examData = exams[0]
      console.log("Datos del examen a transformar:", examData)
      
      // Mezclar las preguntas para que aparezcan en orden aleatorio
      const shuffledQuestions = this.shuffleArray(examData.preguntas)
      
      // Transformar la estructura del backend a la estructura que espera el componente
      const transformedQuiz: Quiz = {
        id: examData.id,
        title: examData.titulo,
        description: examData.descripcion,
        pages: [
          {
            name: "page1",
            elements: shuffledQuestions.map((pregunta: any) => {
              // Mezclar también las opciones de respuesta para cada pregunta
              const shuffledChoices = pregunta.opciones ? this.shuffleArray(pregunta.opciones) : []
              
              return {
                type: pregunta.tipo,
                name: pregunta.nombre,
                title: pregunta.titulo,
                description: pregunta.descripcion,
                isRequired: pregunta.es_requerida,
                choices: shuffledChoices,
                correctAnswer: pregunta.respuesta_correcta
              }
            })
          }
        ],
        minScore: parseFloat(examData.puntajeMinimoAprobacion),
        maxAttempts: examData.intentosMaximos,
        durationMinutes: examData.duracionMinutos
      }
      
      console.log("Quiz transformado con preguntas mezcladas:", transformedQuiz)
      return transformedQuiz
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

  // Obtener progreso completo de un curso
  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/progreso/usuario/${userId}/curso/${courseId}`,
        {
          headers: getHeaders(),
        }
      )
      
      if (response.data.success) {
        return response.data.data
      }
      return null
    } catch (error) {
      console.error("Error obteniendo progreso del curso:", error)
      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", error.response?.data)
      }
      return null
    }
  },

  // Obtener progreso de videos del usuario (deprecado - usar getCourseProgress)
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
    lessonId: string,
    currentSecond: number,
    totalDuration: number,
  ): Promise<void> {
    try {
      const payload = {
        usuarioId: userId,
        cursoId: courseId,
        leccionId: lessonId,
        segundoActual: currentSecond,
        duracionTotal: totalDuration,
      }
      
      console.log("Guardando progreso:", payload)
      
      await axios.put(
        `${API_BASE_URL}/api/progreso/video`,
        payload,
        {
          headers: getHeaders(),
        }
      )
    } catch (error) {
      console.error("Error guardando progreso de video:", error)
      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", error.response?.data)
      }
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
    answers: Record<string, string>, // Objeto con las respuestas { preguntaNombre: respuesta }
    score: number,
    passed: boolean,
  ): Promise<void> {
    try {
      // Transformar las respuestas al formato esperado por el backend
      const formattedAnswers = Object.entries(answers).map(([preguntaNombre, respuesta]) => ({
        preguntaId: preguntaNombre, // Usamos el nombre como ID ya que no tenemos el ID real de la pregunta
        respuesta: respuesta
      }))

      console.log("Enviando intento de examen:", {
        examId,
        userId,
        score,
        passed,
        respuestas: formattedAnswers
      })

      await axios.post(
        `${API_BASE_URL}/api/examenes/${examId}/responder`,
        {
          usuarioId: userId,
          puntaje: score,
          aprobado: passed,
          completado: true,
          respuestas: formattedAnswers,
        },
        {
          headers: getHeaders(),
        }
      )
      
      console.log("Intento de examen registrado exitosamente")
    } catch (error) {
      console.error("Error enviando intento de examen:", error)
      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", error.response?.data)
      }
      throw error
    }
  },

  // Inscribir usuario a curso
  async enrollUserToCourse(userId: string, courseId: string): Promise<void> {
    try {
      const payload = {
        usuarioId: userId,
        cursoId: courseId,
      }
      
      console.log("Enviando inscripción con payload:", payload)
      
      const response = await axios.post(
        `${API_BASE_URL}/api/inscripciones`,
        payload,
        {
          headers: getHeaders(),
        }
      )
      
      console.log("Respuesta de inscripción:", response.data)
      
      if (!response.data.success && response.data.message) {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error("Error inscribiendo usuario al curso:", error)
      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", error.response?.data)
        throw new Error(error.response?.data?.message || "Error al inscribirse al curso")
      }
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

  // Validar certificado (endpoint público, no requiere autenticación)
  async validateCertificate(userId: string, courseId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/progreso/validacion/usuario/${userId}/curso/${courseId}`,
        {
          headers: getHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error("Error validando certificado:", error)
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Error al validar el certificado"
        }
      }
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