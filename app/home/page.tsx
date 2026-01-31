"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { ModernCourseCard } from "@/components/courses/modern-course-card"
import { MobileCourseCard } from "@/components/courses/mobile-course-card"
import { coursesService, type Course } from "@/services/courses-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Clock,
  GraduationCap,
  Search,
} from "lucide-react"
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

      const userId = user!.id

      const [allCoursesData, enrollmentsData] = await Promise.all([
        coursesService.getCoursesByRole(user!.tipo || user!.rol),
        coursesService.getEnrolledCourses(userId).catch((err) => {
          console.error("Error obteniendo cursos inscritos:", err)
          return []
        }),
      ])

      setAllCourses(allCoursesData)

      if (enrollmentsData.length > 0) {
        const enrolledCoursesDetails = enrollmentsData.map((enrollment) => ({
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
          fechaPublicacion: enrollment.fechaInscripcion,
        } as Course))
        setEnrolledCourses(enrolledCoursesDetails)

        const progressMap = new Map<string, number>()
        const examStatusMap = new Map<string, ExamStatus>()

        await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            try {
              const [progressData, examResult] = await Promise.all([
                coursesService.getCourseProgress(userId, enrollment.curso.id),
                coursesService.verificarExamenAprobado(userId, enrollment.curso.id),
              ])

              if (progressData) {
                let progressPercentage = 0

                if (
                  progressData.inscripcion &&
                  progressData.inscripcion.progresoPorcentaje !== undefined
                ) {
                  progressPercentage = progressData.inscripcion.progresoPorcentaje
                } else if (progressData.progresosVideos && progressData.resumen) {
                  const totalLessons = progressData.resumen.totalLecciones || 0
                  const completedLessons = progressData.progresosVideos.filter(
                    (v) => v.completado
                  ).length
                  progressPercentage =
                    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
                }

                progressMap.set(enrollment.curso.id, progressPercentage)
              } else {
                progressMap.set(enrollment.curso.id, 0)
              }

              if (examResult && examResult.aprobado) {
                examStatusMap.set(enrollment.curso.id, {
                  aprobado: true,
                  puntaje: examResult.puntaje,
                })
              } else {
                examStatusMap.set(enrollment.curso.id, { aprobado: false })
              }
            } catch (error) {
              console.error(
                `Error obteniendo datos para curso ${enrollment.curso.id}:`,
                error
              )
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
      setError(
        error instanceof Error ? error.message : "Error desconocido al cargar los cursos"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const coursesToShow = courseFilter === "enrolled" ? enrolledCourses : allCourses

  const filteredCourses = coursesToShow.filter((course) => {
    const matchesLevel = selectedLevel === "all" || course.nivel === selectedLevel
    return matchesLevel
  })

  const levels = ["all", ...Array.from(new Set(coursesToShow.map((c) => c.nivel)))]

  const stats = {
    totalCourses: allCourses.length,
    enrolledCourses: enrolledCourses.length,
    completedCourses: Array.from(examStatus.values()).filter((e) => e.aprobado).length,
    totalHours: Math.round(
      allCourses.reduce((acc, c) => acc + c.duracionVideoMinutos, 0) / 60
    ),
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#DDA92C]" />
          <p className="text-gray-400 text-sm">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ModernHeader />

      <main className="pb-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 pt-6 pb-12 md:pt-10 md:pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Text */}
            <div className="mb-6 md:mb-8">
              <p className="text-[#DDA92C] text-sm font-medium mb-1">Bienvenido de nuevo</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                Hola, {user.nombre}
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                Continúa tu desarrollo profesional
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <BookOpen className="h-5 w-5 text-[#DDA92C] mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalCourses}</div>
                <div className="text-xs text-gray-500">Cursos disponibles</div>
              </div>
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <GraduationCap className="h-5 w-5 text-[#DDA92C] mb-2" />
                <div className="text-2xl font-bold text-white">{stats.enrolledCourses}</div>
                <div className="text-xs text-gray-500">Inscritos</div>
              </div>
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <Award className="h-5 w-5 text-[#DDA92C] mb-2" />
                <div className="text-2xl font-bold text-white">{stats.completedCourses}</div>
                <div className="text-xs text-gray-500">Completados</div>
              </div>
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <Clock className="h-5 w-5 text-[#DDA92C] mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalHours}h</div>
                <div className="text-xs text-gray-500">Contenido</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 -mt-4">
          <div className="max-w-6xl mx-auto">
            {/* Tabs & Filters Card */}
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-3 md:p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Tabs */}
                <div className="flex bg-gray-900/50 p-1 rounded-xl">
                  <button
                    onClick={() => setCourseFilter("all")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      courseFilter === "all"
                        ? "bg-gray-700 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Todos</span>
                    <Badge className="bg-gray-600 text-gray-300 border-0 text-xs ml-1">
                      {allCourses.length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setCourseFilter("enrolled")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      courseFilter === "enrolled"
                        ? "bg-[#DDA92C] text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Award className="h-4 w-4" />
                    <span>Mis cursos</span>
                    {enrolledCourses.length > 0 && (
                      <Badge
                        className={`border-0 text-xs ml-1 ${
                          courseFilter === "enrolled"
                            ? "bg-gray-900/20 text-gray-900"
                            : "bg-[#DDA92C]/20 text-[#DDA92C]"
                        }`}
                      >
                        {enrolledCourses.length}
                      </Badge>
                    )}
                  </button>
                </div>

                {/* Level Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden md:inline">
                    Nivel:
                  </span>
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                        selectedLevel === level
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-transparent text-gray-400 border-gray-700/50 hover:border-gray-600 hover:text-gray-300"
                      }`}
                    >
                      {level === "all" ? "Todos" : level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-base md:text-lg font-medium text-white">
                {courseFilter === "all" ? "Catálogo de cursos" : "Mis inscripciones"}
              </h2>
              <span className="text-sm text-gray-500">
                {filteredCourses.length} {filteredCourses.length === 1 ? "curso" : "cursos"}
              </span>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 bg-red-900/10 border-red-900/20 rounded-xl"
              >
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
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourses.some((ec) => ec.id === course.id)
                  const examData = examStatus.get(course.id)
                  return (
                    <div key={course.id}>
                      {/* Mobile Card */}
                      <div className="md:hidden">
                        <MobileCourseCard
                          course={course}
                          isEnrolled={isEnrolled}
                          progress={courseProgress.get(course.id) || 0}
                          examAprobado={examData?.aprobado || false}
                          puntajeExamen={examData?.puntaje}
                          onEnrollmentChange={loadCourses}
                        />
                      </div>
                      {/* Desktop Card */}
                      <div className="hidden md:block">
                        <ModernCourseCard
                          course={course}
                          isEnrolled={isEnrolled}
                          progress={courseProgress.get(course.id) || 0}
                          examAprobado={examData?.aprobado || false}
                          puntajeExamen={examData?.puntaje}
                          onEnrollmentChange={loadCourses}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16 md:py-24">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 border border-gray-700/30">
                  {courseFilter === "enrolled" ? (
                    <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-gray-600" />
                  ) : (
                    <Search className="h-8 w-8 md:h-10 md:w-10 text-gray-600" />
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-medium text-white mb-2">
                  {courseFilter === "enrolled"
                    ? "Aún no tienes cursos"
                    : selectedLevel !== "all"
                    ? "No se encontraron cursos"
                    : "No hay cursos disponibles"}
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  {courseFilter === "enrolled"
                    ? "Explora el catálogo e inscríbete en un curso para comenzar"
                    : selectedLevel !== "all"
                    ? "Intenta ajustar el filtro de nivel para ver más resultados"
                    : "El catálogo de cursos se actualizará pronto"}
                </p>
                {courseFilter === "enrolled" ? (
                  <Button
                    onClick={() => setCourseFilter("all")}
                    className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver catálogo
                  </Button>
                ) : selectedLevel !== "all" ? (
                  <Button
                    onClick={() => setSelectedLevel("all")}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Limpiar filtros
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
