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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Search, Filter, BookOpen, Clock, TrendingUp, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { QuizAccessCard } from "@/components/quiz/quiz-access-card"
import { MobileQuizCard } from "@/components/quiz/mobile-quiz-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [courseProgress, setCourseProgress] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"courses" | "exams">("courses")
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
    const matchesSearch =
      course.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevel === "all" || course.nivel === selectedLevel
    return matchesSearch && matchesLevel
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

      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Bienvenido, {user.nombre}</h1>
              <p className="text-gray-400 text-sm md:text-lg">Continúa tu desarrollo profesional</p>
              <p className="text-xs text-gray-500 mt-1">
                Rol: {user.rol} • {user.gerencia}
              </p>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right">
                <div className="text-xs md:text-sm text-gray-400">Cursos inscritos</div>
                <div className="text-lg md:text-2xl font-bold text-[#DDA92C]">
                  {stats.enrolledCourses} / {stats.totalCourses}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Search and Filters */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:gap-4 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#DDA92C] text-sm"
              />
            </div>

            {/* Mobile Filter */}
            <div className="flex items-center space-x-2 md:hidden">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex space-x-1 overflow-x-auto">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                    className={`text-xs whitespace-nowrap ${
                      selectedLevel === level
                        ? "bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {level === "all" ? "Todos" : level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Desktop Filter */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Nivel:</span>
              </div>
              <div className="flex space-x-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                    className={
                      selectedLevel === level
                        ? "bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    }
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
          <Alert variant="destructive" className="mb-6 bg-red-900 border-red-700">
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

        {/* Courses and Exams Tabs */}
        <div className="mb-6 md:mb-8">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "courses" | "exams")}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
              <TabsList className="bg-gray-800 border-gray-700 w-full md:w-auto">
                <TabsTrigger
                  value="courses"
                  className="data-[state=active]:bg-[#DDA92C] data-[state=active]:text-gray-900 flex-1 md:flex-none text-sm"
                >
                  Cursos
                </TabsTrigger>
                <TabsTrigger
                  value="exams"
                  className="data-[state=active]:bg-[#DDA92C] data-[state=active]:text-gray-900 flex-1 md:flex-none text-sm"
                >
                  Exámenes
                </TabsTrigger>
              </TabsList>

              <Badge variant="secondary" className="bg-gray-700 text-gray-300 mt-2 md:mt-0 self-start md:self-auto">
                {filteredCourses.length} {viewMode === "courses" ? "curso" : "examen"}
                {filteredCourses.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <TabsContent value="courses" className="space-y-6">
              {/* Course Filter Tabs */}
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant={courseFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCourseFilter("all")}
                      className={
                        courseFilter === "all"
                          ? "bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                      }
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Todos los Cursos ({stats.totalCourses})
                    </Button>
                    <Button
                      variant={courseFilter === "enrolled" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCourseFilter("enrolled")}
                      className={
                        courseFilter === "enrolled"
                          ? "bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                      }
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Mis Cursos ({stats.enrolledCourses})
                    </Button>
                  </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => {
                    const isEnrolled = enrolledCourses.some(ec => ec.id === course.id)
                    return (
                      <div key={course.id} className="relative">
                        {isEnrolled && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-green-600 text-white border-green-500">
                              <Award className="mr-1 h-3 w-3" />
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
                <div className="grid md:hidden grid-cols-1 gap-4">
                  {filteredCourses.map((course) => {
                    const isEnrolled = enrolledCourses.some(ec => ec.id === course.id)
                    return (
                      <div key={course.id} className="relative">
                        {isEnrolled && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-green-600 text-white border-green-500 text-xs">
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
            </TabsContent>

            <TabsContent value="exams" className="space-y-6">
              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <QuizAccessCard key={`quiz-${course.id}`} course={course} />
                ))}
              </div>

              {/* Mobile Grid */}
              <div className="grid md:hidden grid-cols-1 gap-4">
                {filteredCourses.map((course) => (
                  <MobileQuizCard key={`quiz-${course.id}`} course={course} />
                ))}
              </div>
            </TabsContent>

            {filteredCourses.length === 0 && !error && (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-white mb-2">
                  {searchTerm || selectedLevel !== "all"
                    ? `No se encontraron ${viewMode === "courses" ? "cursos" : "exámenes"}`
                    : `No hay ${viewMode === "courses" ? "cursos" : "exámenes"} disponibles`}
                </h3>
                <p className="text-gray-400 text-sm md:text-base">
                  {searchTerm || selectedLevel !== "all"
                    ? "Intenta ajustar tus filtros de búsqueda"
                    : `Los ${viewMode === "courses" ? "cursos" : "exámenes"} estarán disponibles próximamente`}
                </p>
                {(searchTerm || selectedLevel !== "all") && (
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedLevel("all")
                    }}
                    variant="outline"
                    className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}
