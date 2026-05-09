"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { ModernCourseCard } from "@/components/courses/modern-course-card"
import { MobileCourseCard } from "@/components/courses/mobile-course-card"
import { coursesService, type Course } from "@/services/courses-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Clock,
  GraduationCap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useBrand } from "@/lib/use-brand"

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
  const brand = useBrand()

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

      const myCoursesData = await coursesService.getMyCourses()

      setAllCourses(myCoursesData)
      setEnrolledCourses(myCoursesData)

      if (myCoursesData.length > 0) {
        const progressMap = new Map<string, number>()
        const examStatusMap = new Map<string, ExamStatus>()

        await Promise.all(
          myCoursesData.map(async (course) => {
            try {
              const [progressData, examResult] = await Promise.all([
                coursesService.getCourseProgress(userId, course.id),
                coursesService.verificarExamenAprobado(userId, course.id),
              ])

              if (progressData) {
                let progressPercentage = 0

                if (
                  progressData.inscripcion &&
                  progressData.inscripcion.progresoPorcentaje !== undefined
                ) {
                  progressPercentage = Number(progressData.inscripcion.progresoPorcentaje)
                } else if (progressData.progresosVideos && progressData.resumen) {
                  const totalLessons = progressData.resumen.totalVideos || 0
                  const completedLessons = progressData.progresosVideos.filter(
                    (v) => v.completado
                  ).length
                  progressPercentage =
                    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
                }

                progressMap.set(course.id, progressPercentage)
              } else {
                progressMap.set(course.id, 0)
              }

              if (examResult && examResult.aprobado) {
                examStatusMap.set(course.id, {
                  aprobado: true,
                  puntaje: examResult.puntaje,
                })
              } else {
                examStatusMap.set(course.id, { aprobado: false })
              }
            } catch (error) {
              console.error(
                `Error obteniendo datos para curso ${course.id}:`,
                error
              )
              progressMap.set(course.id, 0)
              examStatusMap.set(course.id, { aprobado: false })
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

  const coursesToShow = enrolledCourses

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
      enrolledCourses.reduce((acc, c) => acc + c.duracionVideoMinutos, 0) / 60
    ),
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-accent" />
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
              <p className="text-primary-accent text-sm font-medium mb-1">Bienvenido de nuevo</p>
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
                <BookOpen className="h-5 w-5 text-primary-accent mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalCourses}</div>
                <div className="text-xs text-gray-500">Cursos asignados</div>
              </div>
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <GraduationCap className="h-5 w-5 text-primary-accent mb-2" />
                <div className="text-2xl font-bold text-white">{stats.enrolledCourses}</div>
                <div className="text-xs text-gray-500">Inscritos</div>
              </div>
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <Award className="h-5 w-5 text-primary-accent mb-2" />
                <div className="text-2xl font-bold text-white">{stats.completedCourses}</div>
                <div className="text-xs text-gray-500">Completados</div>
              </div>
              <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                <Clock className="h-5 w-5 text-primary-accent mb-2" />
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
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm"
                  style={{ backgroundColor: brand.accent, color: brand.onAccent }}
                >
                  <Award className="h-4 w-4" />
                  <span>Mis cursos</span>
                  <span className="rounded-full bg-gray-900/15 px-2 py-0.5 text-xs">
                    {enrolledCourses.length}
                  </span>
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
                Mis cursos asignados
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
                  const examData = examStatus.get(course.id)
                  return (
                    <div key={course.id}>
                      {/* Mobile Card */}
                      <div className="md:hidden">
                        <MobileCourseCard
                          course={course}
                          isEnrolled
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
                          isEnrolled
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
                  <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-gray-600" />
                </div>
                <h3 className="text-lg md:text-xl font-medium text-white mb-2">
                  {selectedLevel !== "all"
                    ? "No se encontraron cursos"
                    : "Aún no tienes cursos asignados"}
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  {selectedLevel !== "all"
                    ? "Intenta ajustar el filtro de nivel para ver más resultados"
                    : "Cuando tu empresa te asigne cursos aparecerán aquí."}
                </p>
                {selectedLevel !== "all" ? (
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
