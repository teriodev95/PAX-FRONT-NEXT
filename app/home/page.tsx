"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { ModernCourseCard } from "@/components/courses/modern-course-card"
import { MobileCourseCard } from "@/components/courses/mobile-course-card"
import { coursesService, type Course } from "@/services/courses-service"
import { progressService } from "@/services/progress-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Filter, BookOpen, Clock, TrendingUp, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [courseProgress, setCourseProgress] = useState<Map<string, number>>(new Map())
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
        
        // Obtener el progreso de cada curso inscrito
        const progressMap = new Map<string, number>()
        await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            try {
              // Usar el mismo método que en la página del curso individual
              const progressData = await coursesService.getCourseProgress(userId, enrollment.curso.id)
              
              if (progressData) {
                // Calcular el progreso basado en lecciones completadas
                let progressPercentage = 0
                
                if (progressData.inscripcion && progressData.inscripcion.progresoPorcentaje !== undefined) {
                  progressPercentage = progressData.inscripcion.progresoPorcentaje
                } else if (progressData.progresosVideos && progressData.resumen) {
                  // Calcular manualmente si no está disponible
                  const totalLessons = progressData.resumen.totalLecciones || 0
                  const completedLessons = progressData.progresosVideos.filter(v => v.completado).length
                  progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
                }
                
                progressMap.set(enrollment.curso.id, progressPercentage)
                console.log(`Progreso del curso ${enrollment.curso.titulo}: ${progressPercentage}%`)
              } else {
                progressMap.set(enrollment.curso.id, 0)
              }
            } catch (error) {
              console.error(`Error obteniendo progreso para curso ${enrollment.curso.id}:`, error)
              progressMap.set(enrollment.curso.id, 0)
            }
          })
        )
        setCourseProgress(progressMap)
      } else {
        setEnrolledCourses([])
        setCourseProgress(new Map())
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

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Welcome Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight">Bienvenido, {user.nombre}</h1>
              <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-2 leading-relaxed">Continúa tu desarrollo profesional</p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Rol: {user.rol} • {user.gerencia}
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
              <div className="text-center md:text-right">
                <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider mb-2">Cursos inscritos</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#DDA92C]">
                  {stats.enrolledCourses} / {stats.totalCourses}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <div className="flex flex-col md:flex-row md:items-center">
            {/* Mobile Filter */}
            <div className="flex items-center gap-3 md:hidden">
              <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                    className={`text-xs sm:text-sm whitespace-nowrap px-4 py-2.5 rounded-lg transition-all font-medium ${
                      selectedLevel === level
                        ? "bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 shadow-lg shadow-[#DDA92C]/20"
                        : "bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    {level === "all" ? "Todos" : level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Desktop Filter */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Nivel:</span>
              </div>
              <div className="flex gap-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg transition-all font-medium ${
                      selectedLevel === level
                        ? "bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 shadow-lg shadow-[#DDA92C]/20"
                        : "bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    {level === "all" ? "Todos" : level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8 sm:mb-10 lg:mb-12 bg-red-900/20 border-red-700/50 backdrop-blur-sm rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
              <Button
                onClick={loadCourses}
                variant="outline"
                size="sm"
                className="ml-4 bg-transparent border-red-600 text-red-300 hover:bg-red-800"
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Courses Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 lg:mb-12 gap-4 sm:gap-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Cursos Disponibles</h2>
            
            <Badge variant="secondary" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 self-start sm:self-auto text-sm px-4 py-2 rounded-lg">
              {filteredCourses.length} curso{filteredCourses.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
              {/* Course Filter Tabs */}
              <div className="flex flex-col space-y-8 lg:space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Button
                      variant={courseFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCourseFilter("all")}
                      className={`flex-1 sm:flex-initial h-12 sm:h-14 px-6 rounded-xl font-medium transition-all transform hover:scale-105 ${
                        courseFilter === "all"
                          ? "bg-gradient-to-r from-[#DDA92C] to-[#c49625] hover:from-[#c49625] hover:to-[#b38920] text-gray-900 shadow-xl shadow-[#DDA92C]/25"
                          : "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 hover:bg-gray-800/70 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Todos los Cursos ({stats.totalCourses})
                    </Button>
                    <Button
                      variant={courseFilter === "enrolled" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCourseFilter("enrolled")}
                      className={`flex-1 sm:flex-initial h-12 sm:h-14 px-6 rounded-xl font-medium transition-all transform hover:scale-105 ${
                        courseFilter === "enrolled"
                          ? "bg-gradient-to-r from-[#DDA92C] to-[#c49625] hover:from-[#c49625] hover:to-[#b38920] text-gray-900 shadow-xl shadow-[#DDA92C]/25"
                          : "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 hover:bg-gray-800/70 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Mis Cursos ({stats.enrolledCourses})
                    </Button>
                  </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10 xl:gap-12">
                  {filteredCourses.map((course) => {
                    const isEnrolled = enrolledCourses.some(ec => ec.id === course.id)
                    return (
                      <div key={course.id} className="relative">
                        {isEnrolled && (
                          <div className="absolute -top-3 -right-3 z-10">
                            <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 px-4 py-2 shadow-xl shadow-green-600/30 rounded-lg">
                              <Award className="mr-1.5 h-4 w-4" />
                              Inscrito
                            </Badge>
                          </div>
                        )}
                        <ModernCourseCard 
                          course={course} 
                          isEnrolled={isEnrolled}
                          progress={courseProgress.get(course.id) || 0}
                          onEnrollmentChange={loadCourses}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Mobile Grid */}
                <div className="grid md:hidden grid-cols-1 gap-8 sm:gap-10">
                  {filteredCourses.map((course) => {
                    const isEnrolled = enrolledCourses.some(ec => ec.id === course.id)
                    return (
                      <div key={course.id} className="relative">
                        {isEnrolled && (
                          <div className="absolute -top-3 -right-3 z-10">
                            <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 text-xs px-3 py-1.5 shadow-xl shadow-green-600/30 rounded-lg">
                              <Award className="mr-1 h-3 w-3" />
                              Inscrito
                            </Badge>
                          </div>
                        )}
                        <MobileCourseCard 
                          course={course} 
                          isEnrolled={isEnrolled}
                          progress={courseProgress.get(course.id) || 0}
                          onEnrollmentChange={loadCourses}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

            {filteredCourses.length === 0 && !error && (
              <div className="text-center py-16 sm:py-20 lg:py-24">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-gray-700/50">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-4 sm:mb-6">
                  {selectedLevel !== "all"
                    ? "No se encontraron cursos"
                    : "No hay cursos disponibles"}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg px-6 sm:px-8 lg:px-0 max-w-md mx-auto leading-relaxed">
                  {selectedLevel !== "all"
                    ? "Intenta ajustar el filtro de nivel"
                    : "Los cursos estarán disponibles próximamente"}
                </p>
                {selectedLevel !== "all" && (
                  <Button
                    onClick={() => {
                      setSelectedLevel("all")
                    }}
                    variant="outline"
                    className="mt-6 sm:mt-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 hover:bg-gray-800/70 hover:text-white hover:border-gray-600 px-6 py-3 rounded-xl transition-all font-medium transform hover:scale-105"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
