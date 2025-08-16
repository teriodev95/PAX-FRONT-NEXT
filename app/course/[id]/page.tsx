"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/layout/header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { HTML5VideoPlayer } from "@/components/video/html5-video-player"
import { LessonTransition } from "@/components/video/lesson-transition"
import { TypeformQuizComponent } from "@/components/quiz/typeform-quiz-component"
import { CertificateGenerator } from "@/components/certificate/certificate-generator"
import { progressService } from "@/services/progress-service"
import { coursesService, type SingleCourseResponse, type LessonCompat } from "@/services/courses-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Play,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  List,
  X,
  AlertCircle,
  FileText,
  ArrowLeft,
  Menu,
} from "lucide-react"



export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [courseData, setCourseData] = useState<SingleCourseResponse | null>(null)
  const [quizData, setQuizData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLesson, setCurrentLesson] = useState<LessonCompat | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [courseCompleted, setCourseCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)

  const [showSidebar, setShowSidebar] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [allLessons, setAllLessons] = useState<LessonCompat[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0) // Declare currentQuestionIndex
  
  // Referencias para el guardado de progreso
  const lastProgressSave = useRef<number>(0)
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user && params.id) {
      loadCourse()
    }
    
    // Limpiar al desmontar
    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current)
      }
    }
  }, [user, authLoading, params.id, router])

  const loadCourse = async () => {
    try {
      setError(null)
      const courseId = params.id as string
      
      // Cargar curso, progreso y examen en paralelo
      const [course, progressData, examData] = await Promise.all([
        coursesService.getCourseById(courseId),
        user ? coursesService.getCourseProgress(user.id, courseId) : Promise.resolve(null),
        coursesService.getExamByCourseId(courseId).catch(err => {
          console.log("No hay examen disponible para este curso")
          return null
        })
      ])

      if (!course) {
        throw new Error("No se pudo cargar la información del curso")
      }

      // Crear estructura compatible con el componente
      console.log('📚 Curso cargado del backend:', {
        id: course.id,
        titulo: course.titulo,
        totalModulos: course.modulos?.length || 0,
        modulos: course.modulos?.map((m, idx) => ({
          indice: idx,
          titulo: m.modulo_titulo,
          totalLecciones: m.lecciones?.length || 0,
          lecciones: m.lecciones?.map(l => ({
            id: l.id,
            titulo: l.titulo,
            url_video: l.url_video
          }))
        }))
      })

      const courseDataWrapper = {
        success: true,
        message: {
          curso: {
            course: {
              id: course.id,
              title: course.titulo,
              modules: course.modulos?.map(modulo => ({
                module_title: modulo.modulo_titulo,
                description: modulo.descripcion,
                lessons: modulo.lecciones?.map(leccion => ({
                  id: leccion.id,
                  title: leccion.titulo,
                  description: leccion.descripcion,
                  video_url: leccion.url_video,
                  duration_minutes: leccion.duracion_minutos,
                  type: leccion.tipo
                })) || []
              })) || []
            }
          },
          quiz: examData // Asignar el examen cargado
        }
      }

      setCourseData(courseDataWrapper)
      setQuizData(examData)

      // Crear lista plana de todas las lecciones
      const lessons = courseDataWrapper.message.curso.course.modules.flatMap((module) => module.lessons)
      console.log('📋 Lista plana de lecciones creada:', lessons.map((l, idx) => ({
        indice: idx,
        id: l.id,
        titulo: l.title,
        url_video: l.video_url
      })))
      setAllLessons(lessons)

      // Aplicar progreso guardado si existe
      if (progressData && progressData.progresosVideos) {
        const completedLessonIds = new Set(
          progressData.progresosVideos
            .filter(video => video.completado)
            .map(video => video.leccionId)
        )
        
        setCompletedLessons(completedLessonIds)
        
        console.log(`Progreso cargado: ${completedLessonIds.size} lecciones completadas de ${lessons.length}`)
        console.log(`Progreso del curso: ${progressData.inscripcion.progresoPorcentaje}%`)
        console.log(`Tiempo total visto: ${Math.round(progressData.resumen.tiempoTotalVisto / 60)} minutos`)
      }

      // Seleccionar la primera lección no completada o la primera si todas están completadas
      const firstIncompleteIndex = progressData && progressData.progresosVideos
        ? lessons.findIndex(lesson => 
            !progressData.progresosVideos.find(v => v.leccionId === lesson.id && v.completado)
          )
        : 0
      
      const startIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0
      if (lessons.length > 0) {
        setCurrentLesson(lessons[startIndex])
        setCurrentLessonIndex(startIndex)
      }
    } catch (error) {
      console.error("Error cargando curso:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar el curso")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLessonComplete = async (lessonId: string) => {
    const newCompleted = new Set(completedLessons)
    newCompleted.add(lessonId)
    setCompletedLessons(newCompleted)
    
    // Marcar la lección como completada en el backend
    if (currentLesson && user) {
      try {
        await progressService.markLessonCompleted(
          user.id,
          params.id as string,
          currentLesson.id, // ID de la lección
          currentLesson.duration_minutes ? parseInt(currentLesson.duration_minutes) * 60 : 0
        )
        console.log(`Lección completada: ${currentLesson.title} (ID: ${currentLesson.id})`)
      } catch (error) {
        console.error("Error marcando lección como completada:", error)
      }
    }
  }

  const handleVideoEnded = () => {
    // Solo mostrar transición cuando el video termina completamente
    if (currentLessonIndex < allLessons.length - 1) {
      setShowTransition(true)
    } else if (currentLessonIndex === allLessons.length - 1) {
      // Si es la última lección y todas están completadas, mostrar el quiz
      if (completedLessons.size === allLessons.length - 1) {
        // Marcar la última lección como completada
        if (currentLesson) {
          handleLessonComplete(currentLesson.id)
        }
        setTimeout(() => {
          setShowQuiz(true)
        }, 1500)
      }
    }
  }

  const handleQuizComplete = (results: any) => {
    setQuizCompleted(true)
    setQuizResults(results)
    if (results.score >= 70) {
      setCourseCompleted(true)
    }
  }

  const calculateProgress = () => {
    if (allLessons.length === 0) return 0
    return (completedLessons.size / allLessons.length) * 100
  }

  const goToPreviousLesson = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentLessonIndex - 1
      const previousLesson = allLessons[newIndex]
      console.log('⏪ Navegando a lección anterior:', {
        indiceAnterior: currentLessonIndex,
        nuevoIndice: newIndex,
        leccionAnterior: currentLesson ? {
          id: currentLesson.id,
          titulo: currentLesson.title,
          url: currentLesson.video_url
        } : null,
        nuevaLeccion: {
          id: previousLesson.id,
          titulo: previousLesson.title,
          url: previousLesson.video_url
        }
      })
      setCurrentLessonIndex(newIndex)
      setCurrentLesson(previousLesson)
      setShowQuiz(false)
      setShowSidebar(false)
    }
  }

  const goToNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const newIndex = currentLessonIndex + 1
      const nextLesson = allLessons[newIndex]
      console.log('⏩ Navegando a siguiente lección:', {
        indiceAnterior: currentLessonIndex,
        nuevoIndice: newIndex,
        leccionAnterior: currentLesson ? {
          id: currentLesson.id,
          titulo: currentLesson.title,
          url: currentLesson.video_url
        } : null,
        nuevaLeccion: {
          id: nextLesson.id,
          titulo: nextLesson.title,
          url: nextLesson.video_url
        },
        totalLecciones: allLessons.length
      })
      setCurrentLessonIndex(newIndex)
      setCurrentLesson(nextLesson)
      setShowQuiz(false)
      setShowSidebar(false)
      setShowTransition(false)
      // Resetear el contador de progreso para la nueva lección
      lastProgressSave.current = 0
    } else if (currentLessonIndex === allLessons.length - 1 && completedLessons.size === allLessons.length) {
      console.log('🎯 Todas las lecciones completadas, mostrando quiz')
      setShowQuiz(true)
      setShowSidebar(false)
      setShowTransition(false)
    }
  }

  const selectLesson = (lesson: LessonCompat, index: number) => {
    console.log('🎯 Selección manual de lección:', {
      indiceAnterior: currentLessonIndex,
      nuevoIndice: index,
      leccionAnterior: currentLesson ? {
        id: currentLesson.id,
        titulo: currentLesson.title,
        url: currentLesson.video_url
      } : null,
      nuevaLeccion: {
        id: lesson.id,
        titulo: lesson.title,
        url: lesson.video_url
      }
    })
    setCurrentLesson(lesson)
    setCurrentLessonIndex(index)
    setShowQuiz(false)
    setShowSidebar(false)
    // Resetear el contador de progreso para la nueva lección
    lastProgressSave.current = 0
  }

  const getCurrentModuleInfo = () => {
    if (!courseData || !currentLesson) return null

    for (const module of courseData.message.curso.course.modules) {
      if (module.lessons.some((lesson) => lesson.id === currentLesson.id)) {
        return module
      }
    }
    return null
  }

  const handleVideoProgress = async (currentTime: number, duration: number, percentage: number) => {
    // Guardar progreso del video cada 10 segundos
    const currentTimeInt = Math.floor(currentTime)
    
    if (currentTimeInt > 0 && currentTimeInt - lastProgressSave.current >= 10 && currentLesson && user) {
      lastProgressSave.current = currentTimeInt
      
      try {
        await coursesService.saveVideoProgress(
          user.id, // UUID del usuario
          params.id as string, // ID del curso
          currentLesson.id, // ID de la lección
          currentTimeInt,
          Math.floor(duration)
        )
        console.log(`Progreso guardado: Lección ${currentLesson.id} - ${currentTimeInt}s de ${Math.floor(duration)}s (${Math.round(percentage)}%)`)
      } catch (error) {
        console.error("Error guardando progreso:", error)
      }
    }
  }

  const renderVideoPlayer = () => {
    if (!currentLesson) return null

    console.log('🎥 Renderizando reproductor de video:', {
      leccionActual: {
        id: currentLesson.id,
        titulo: currentLesson.title,
        url: currentLesson.video_url,
        indice: currentLessonIndex
      },
      timestamp: new Date().toISOString()
    })

    return (
      <HTML5VideoPlayer
        key={`video-${currentLesson.id}-${currentLessonIndex}`}
        src={currentLesson.video_url}
        title={currentLesson.title}
        description={currentLesson.description}
        autoPlay={true}
        onComplete={() => handleLessonComplete(currentLesson.id)}
        onEnded={handleVideoEnded}
        onProgress={handleVideoProgress}
      />
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-400">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="block md:hidden">
          <MobileHeader />
        </div>
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error al cargar el curso:</strong> {error}
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button onClick={() => router.push("/home")} variant="outline" className="flex-1 sm:flex-none">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
            <Button onClick={loadCourse} className="flex-1 sm:flex-none">
              Intentar nuevamente
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!courseData) return null

  const course = courseData.message.curso.course
  const quiz = quizData || courseData.message.quiz
  const currentModule = getCurrentModuleInfo()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <div className="block md:hidden">
        <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/home")}
                className="text-gray-300 hover:text-white hover:bg-gray-700 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="text-xs text-gray-400">
                  {currentLessonIndex + 1}/{allLessons.length}
                </div>
                <div className="font-semibold text-sm truncate max-w-[200px]">
                  {currentLesson?.title || "Cargando..."}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-gray-300 hover:text-white hover:bg-gray-700 p-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="px-4 pb-2">
            <Progress value={calculateProgress()} className="h-1 bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#DDA92C] rounded-lg flex items-center justify-center">
              <Play className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <div className="text-sm text-gray-400">
                Clase {currentLessonIndex + 1} de {allLessons.length} • {course.title}
              </div>
              <div className="font-semibold text-lg">{currentLesson?.title || "Cargando..."}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousLesson}
              disabled={currentLessonIndex === 0}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Clase anterior
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <List className="h-4 w-4 mr-1" />
              Ver clases
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={goToNextLesson}
              disabled={currentLessonIndex === allLessons.length - 1 && !showQuiz}
              className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
            >
              Siguiente clase
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Main Content */}
        <div className={`flex-1 ${showSidebar ? "md:mr-80" : ""} transition-all duration-300`}>
          <div className="p-4 md:p-6">
            {/* Video Player */}
            {currentLesson && !showQuiz && <div className="mb-4 md:mb-6">{renderVideoPlayer()}</div>}

            {/* Quiz - Using new Typeform component */}
            {showQuiz && !courseCompleted && quiz && (
              <div className="mb-4 md:mb-6">
                <TypeformQuizComponent quiz={quiz} onComplete={handleQuizComplete} />
              </div>
            )}

            {/* Certificate */}
            {courseCompleted && (
              <div className="mb-4 md:mb-6">
                <CertificateGenerator courseTitle={course.title} courseId={course.id} score={quizResults?.score} />
              </div>
            )}

            {/* Mobile Navigation */}
            <div className="block md:hidden mb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousLesson}
                  disabled={currentLessonIndex === 0}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <div className="text-center">
                  <div className="text-xs text-gray-400">Progreso</div>
                  <div className="text-sm font-medium text-[#DDA92C]">{Math.round(calculateProgress())}%</div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={goToNextLesson}
                  disabled={currentLessonIndex === allLessons.length - 1 && !showQuiz}
                  className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Lesson Content */}
            {currentLesson && !showQuiz && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="mb-4">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-2">{currentLesson.title}</h2>
                    <p className="text-gray-400 mb-4 text-sm md:text-base">{currentLesson.description}</p>
                  </div>

                  {/* Module Summary */}
                  {currentModule && (
                    <div className="mt-4 p-3 md:p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 mr-2 text-[#DDA92C]" />
                        <h3 className="font-medium text-white text-sm md:text-base">Resumen</h3>
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm">{currentModule.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Lesson Transition Modal */}
        {showTransition && currentLesson && currentLessonIndex < allLessons.length - 1 && (
          <LessonTransition
            currentLessonTitle={currentLesson.title}
            nextLessonTitle={allLessons[currentLessonIndex + 1].title}
            onContinue={goToNextLesson}
            onCancel={() => setShowTransition(false)}
            autoPlayDelay={5}
          />
        )}

        {/* Sidebar - Mobile Overlay */}
        {showSidebar && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />

            {/* Sidebar */}
            <div
              className={`
              fixed md:fixed 
              ${showSidebar ? "right-0" : "-right-80"} 
              top-0 h-full w-80 
              bg-gray-800 border-l border-gray-700 
              overflow-y-auto z-50 
              transition-all duration-300
            `}
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm md:text-base">Progreso del curso</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-[#DDA92C] font-medium">{Math.round(calculateProgress())}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2 bg-gray-700" />
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-1">
                  {courseData.message.curso.course.modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="mb-6">
                      <h4 className="text-xs md:text-sm font-medium text-gray-300 mb-3 px-2">{module.module_title}</h4>
                      {module.lessons.map((lesson) => {
                        const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id)
                        const isActive = currentLesson?.id === lesson.id
                        const isCompleted = completedLessons.has(lesson.id)

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson, lessonIndex)}
                            className={`w-full p-3 rounded-lg text-left transition-colors ${
                              isActive ? "bg-[#DDA92C] text-gray-900" : "hover:bg-gray-700 text-gray-300"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  isCompleted
                                    ? "bg-[#DDA92C] text-gray-900"
                                    : isActive
                                      ? "bg-gray-900 text-[#DDA92C]"
                                      : "bg-gray-600 text-gray-300"
                                }`}
                              >
                                {isCompleted ? <CheckCircle className="h-3 w-3" /> : lessonIndex + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-medium text-xs md:text-sm truncate ${
                                    isActive ? "text-gray-900" : "text-white"
                                  }`}
                                >
                                  {lesson.title}
                                </div>
                                <div
                                  className={`text-xs flex items-center space-x-2 ${
                                    isActive ? "text-gray-700" : "text-gray-400"
                                  }`}
                                >
                                  <span>{lesson.duration_minutes}</span>
                                  {isCompleted && (
                                    <span className="flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1 text-[#DDA92C]" />
                                      <span className="hidden md:inline">Clase vista</span>
                                      <span className="md:hidden">Vista</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))}

                  {/* Quiz Section */}
                  {completedLessons.size === allLessons.length && (
                    <button
                      onClick={() => setShowQuiz(true)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        showQuiz ? "bg-[#DDA92C] text-gray-900" : "hover:bg-gray-700 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            quizCompleted
                              ? "bg-[#DDA92C] text-gray-900"
                              : showQuiz
                                ? "bg-gray-900 text-[#DDA92C]"
                                : "bg-gray-600 text-gray-300"
                          }`}
                        >
                          {quizCompleted ? <CheckCircle className="h-3 w-3" /> : "Q"}
                        </div>

                        <div className="flex-1">
                          <div
                            className={`font-medium text-xs md:text-sm ${showQuiz ? "text-gray-900" : "text-white"}`}
                          >
                            Quiz: {quiz?.title}
                          </div>
                          <div className={`text-xs ${showQuiz ? "text-gray-700" : "text-gray-400"}`}>
                            Evaluación final
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
