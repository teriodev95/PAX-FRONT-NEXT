"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { ModernCourseCard } from "@/components/courses/modern-course-card"
import { MobileCourseCard } from "@/components/courses/mobile-course-card"
import { coursesService, type Course } from "@/services/courses-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, BookOpen, Award, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface ExamStatus {
  aprobado: boolean
  puntaje?: string
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [courseProgress, setCourseProgress] = useState<Map<string, number>>(new Map())
  const [examStatus, setExamStatus] = useState<Map<string, ExamStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const router = useRouter()
  const [courseFilter, setCourseFilter] = useState<"all" | "enrolled">("all")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadCourses()
    }
  }, [user, authLoading, router])

  const loadCourses = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Usar el campo 'id' que es el UUID para todas las operaciones
      const userId = user!.id // UUID del usuario

      // Cargar todos los cursos y cursos inscritos en paralelo
      const [allCoursesData, enrollmentsData] = await Promise.all([
        coursesService.getCoursesByRole(user!.tipo || user!.rol),
        coursesService.getEnrolledCourses(userId).catch((err) => {
          console.error("Error obteniendo cursos inscritos:", err)
          return []
        })
      ])

      setAllCourses(allCoursesData)

      // Si hay inscripciones, extraer los cursos del objeto de inscripción
      if (enrollmentsData.length > 0) {
        // Convertir los cursos de las inscripciones al formato Course
        const enrolledCoursesDetails = enrollmentsData.map(enrollment => ({
          id: enrollment.curso.id,
          titulo: enrollment.curso.titulo,
          descripcion: enrollment.curso.descripcion,
          portada: enrollment.curso.portada,
          nivel: enrollment.curso.nivel,
          totalClases: enrollment.curso.totalClases,
          duracionVideoMinutos: enrollment.curso.duracionVideoMinutos,
          calificacionPromedio: enrollment.curso.calificacionPromedio,
          roles: [],
          modulos: [],
          activo: true,
          fechaCreacion: enrollment.fechaInscripcion,
          fechaPublicacion: enrollment.fechaInscripcion
        } as Course))
        setEnrolledCourses(enrolledCoursesDetails)

        // Obtener el progreso y estado de examen de cada curso inscrito
        const progressMap = new Map<string, number>()
        const examStatusMap = new Map<string, ExamStatus>()

        await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            try {
              // Obtener progreso y estado del examen en paralelo
              const [progressData, examResult] = await Promise.all([
                coursesService.getCourseProgress(userId, enrollment.curso.id),
                coursesService.verificarExamenAprobado(userId, enrollment.curso.id)
              ])

              // Procesar progreso
              if (progressData) {
                let progressPercentage = 0

                if (progressData.inscripcion && progressData.inscripcion.progresoPorcentaje !== undefined) {
                  progressPercentage = progressData.inscripcion.progresoPorcentaje
                } else if (progressData.progresosVideos && progressData.resumen) {
                  const totalLessons = progressData.resumen.totalLecciones || 0
                  const completedLessons = progressData.progresosVideos.filter(v => v.completado).length
                  progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
                }

                progressMap.set(enrollment.curso.id, progressPercentage)
                console.log(`Progreso del curso ${enrollment.curso.titulo}: ${progressPercentage}%`)
              } else {
                progressMap.set(enrollment.curso.id, 0)
              }

              // Procesar estado del examen
              if (examResult && examResult.aprobado) {
                examStatusMap.set(enrollment.curso.id, {
                  aprobado: true,
                  puntaje: examResult.puntaje
                })
                console.log(`Examen aprobado para curso ${enrollment.curso.titulo}: ${examResult.puntaje}%`)
              } else {
                examStatusMap.set(enrollment.curso.id, { aprobado: false })
              }
            } catch (error) {
              console.error(`Error obteniendo datos para curso ${enrollment.curso.id}:`, error)
              progressMap.set(enrollment.curso.id, 0)
              examStatusMap.set(enrollment.curso.id, { aprobado: false })
            }
          })
        )
        setCourseProgress(progressMap)
        setExamStatus(examStatusMap)
      } else {
        setEnrolledCourses([])
        setCourseProgress(new Map())
        setExamStatus(new Map())
      }
    } catch (error) {
      console.error("Error cargando cursos:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar los cursos")
    } finally {
      setIsLoading(false)
    }
  }

  // Determinar qué cursos mostrar según el filtro
  const coursesToShow = courseFilter === "enrolled" ? enrolledCourses : allCourses

  const filteredCourses = coursesToShow.filter((course) => {
    const matchesLevel = selectedLevel === "all" || course.nivel === selectedLevel
    return matchesLevel
  })

  const levels = ["all", ...Array.from(new Set(coursesToShow.map((c) => c.nivel)))]

  const stats = {
    totalCourses: allCourses.length,
    enrolledCourses: enrolledCourses.length,
    totalHours: allCourses.reduce((acc, c) => acc + c.duracionVideoMinutos, 0),
    avgRating: allCourses.length > 0 ? 4.5 : 0, // Valor por defecto hasta implementar ratings
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-400">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <ModernHeader />
      </div>

      {/* Mobile Header */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-16">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Bienvenido, {user.nombre}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400">
                <p className="text-lg">
                  Continúa tu desarrollo profesional
                </p>
                <span className="hidden sm:inline text-gray-600">•</span>
                <p className="text-sm text-gray-500 font-medium">
                  {user.rol} · {user.gerencia}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gray-800/50 rounded-xl px-6 py-3 border border-gray-700/50 backdrop-blur-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Cursos inscritos</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-[#DDA92C]">{stats.enrolledCourses}</span>
                  <span className="text-lg text-gray-600 font-medium">/ {stats.totalCourses}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Tabs */}
            <div className="flex items-center bg-gray-800/50 p-1.5 rounded-xl border border-gray-700/50 backdrop-blur-sm w-full md:w-auto">
              <button
                onClick={() => setCourseFilter("all")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${courseFilter === "all"
                    ? "bg-gray-700/80 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
                  }`}
              >
                <BookOpen className="h-4 w-4" />
                Todos
              </button>
              <button
                onClick={() => setCourseFilter("enrolled")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${courseFilter === "enrolled"
                    ? "bg-[#DDA92C] text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
                  }`}
              >
                <Award className="h-4 w-4" />
                Mis cursos
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap px-2">Nivel:</span>
              <div className="flex gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${selectedLevel === level
                        ? "bg-gray-700 text-white border-gray-600 shadow-sm"
                        : "bg-gray-800/30 text-gray-400 border-gray-700/50 hover:border-gray-600 hover:text-gray-300 hover:bg-gray-800/50"
                      }`}
                  >
                    {level === "all" ? "Todos" : level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 px-1">
            <h2 className="text-lg font-medium text-white tracking-tight">
              {courseFilter === "all" ? "Catálogo de cursos" : "Mis inscripciones"}
            </h2>
            <span className="text-sm text-gray-500 font-medium">
              {filteredCourses.length} {filteredCourses.length === 1 ? "curso" : "cursos"}
            </span>
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-900/10 border-red-900/20 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="flex items-center justify-between text-red-200">
              <span>{error}</span>
              <Button
                onClick={loadCourses}
                variant="ghost"
                size="sm"
                className="ml-4 text-red-300 hover:text-red-100 hover:bg-red-900/20"
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Courses Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourses.some(ec => ec.id === course.id)
              const examData = examStatus.get(course.id)
              return (
                <div key={course.id} className="hidden md:block">
                  <ModernCourseCard
                    course={course}
                    isEnrolled={isEnrolled}
                    progress={courseProgress.get(course.id) || 0}
                    examAprobado={examData?.aprobado || false}
                    puntajeExamen={examData?.puntaje}
                    onEnrollmentChange={loadCourses}
                  />
                </div>
              )
            })}
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourses.some(ec => ec.id === course.id)
              const examData = examStatus.get(course.id)
              return (
                <div key={course.id} className="md:hidden">
                  <MobileCourseCard
                    course={course}
                    isEnrolled={isEnrolled}
                    progress={courseProgress.get(course.id) || 0}
                    examAprobado={examData?.aprobado || false}
                    puntajeExamen={examData?.puntaje}
                    onEnrollmentChange={loadCourses}
                  />
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {filteredCourses.length === 0 && !error && (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-gray-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700/30">
                <BookOpen className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {selectedLevel !== "all"
                  ? "No se encontraron cursos"
                  : "No hay cursos disponibles"}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                {selectedLevel !== "all"
                  ? "Intenta ajustar el filtro de nivel para ver más resultados"
                  : "El catálogo de cursos se actualizará pronto"}
              </p>
              {selectedLevel !== "all" && (
                <Button
                  onClick={() => setSelectedLevel("all")}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
