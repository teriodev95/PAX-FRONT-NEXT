import { coursesService } from "./courses-service"

export interface LessonProgress {
  lessonTitle: string
  currentSecond: number
  totalDuration: number
  percentageWatched: number
  completed: boolean
  lastUpdated: string
}

export interface CourseProgress {
  courseId: string
  courseTitle: string
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  lessons: LessonProgress[]
}

export const progressService = {
  // Guardar progreso de video cada 10 segundos
  async saveVideoProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    currentSecond: number,
    totalDuration: number,
  ): Promise<void> {
    try {
      await coursesService.saveVideoProgress(userId, courseId, lessonId, currentSecond, totalDuration)
    } catch (error) {
      console.error("Error guardando progreso:", error)
      // No lanzar error para no interrumpir la reproducción
    }
  },

  // Obtener progreso completo del usuario
  async getUserProgress(userId: string): Promise<CourseProgress[]> {
    try {
      const videoProgress = await coursesService.getVideoProgress(userId)

      // Agrupar por curso
      const courseProgressMap = new Map<string, CourseProgress>()

      videoProgress.forEach((progress) => {
        if (!courseProgressMap.has(progress.curso)) {
          courseProgressMap.set(progress.curso, {
            courseId: progress.curso,
            courseTitle: progress.curso,
            totalLessons: 0,
            completedLessons: 0,
            progressPercentage: 0,
            lessons: [],
          })
        }

        const courseProgress = courseProgressMap.get(progress.curso)!
        courseProgress.totalLessons++

        if (progress.completado) {
          courseProgress.completedLessons++
        }

        courseProgress.lessons.push({
          lessonTitle: progress.leccion_titulo,
          currentSecond: progress.segundo_actual,
          totalDuration: progress.duracion_total,
          percentageWatched: progress.porcentaje_visto,
          completed: progress.completado,
          lastUpdated: new Date().toISOString(),
        })
      })

      // Calcular porcentaje de progreso por curso
      courseProgressMap.forEach((courseProgress) => {
        courseProgress.progressPercentage =
          courseProgress.totalLessons > 0 ? (courseProgress.completedLessons / courseProgress.totalLessons) * 100 : 0
      })

      return Array.from(courseProgressMap.values())
    } catch (error) {
      console.error("Error obteniendo progreso del usuario:", error)
      return []
    }
  },

  // Obtener progreso de un curso específico
  async getCourseProgress(userId: string, courseId: string): Promise<any> {
    try {
      // Obtener inscripciones del usuario
      const enrollments = await coursesService.getEnrolledCourses(userId)
      const enrollment = enrollments.find(e => e.cursoId === courseId)
      
      if (enrollment && enrollment.id) {
        // Obtener progreso detallado de la inscripción
        return await coursesService.getEnrollmentProgress(enrollment.id)
      }
      
      return null
    } catch (error) {
      console.error("Error obteniendo progreso del curso:", error)
      return null
    }
  },

  // Marcar lección como completada
  async markLessonCompleted(
    userId: string,
    courseId: string,
    lessonId: string,
    totalDuration: number,
  ): Promise<void> {
    try {
      // Enviar el tiempo total como segundoActual para indicar que se completó
      await coursesService.saveVideoProgress(userId, courseId, lessonId, totalDuration, totalDuration)
    } catch (error) {
      console.error("Error marcando lección como completada:", error)
      throw error
    }
  },
}