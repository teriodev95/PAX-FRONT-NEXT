"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { HTML5VideoPlayer } from "@/components/video/html5-video-player";
import { LessonTransition } from "@/components/video/lesson-transition";
import { TypeformQuizComponent } from "@/components/quiz/typeform-quiz-component";
import { CertificateGenerator } from "@/components/certificate/certificate-generator";
import { progressService } from "@/services/progress-service";
import {
  coursesService,
  type SingleCourseResponse,
  type LessonCompat,
} from "@/services/courses-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ChevronDown,
  Trophy,
} from "lucide-react";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [courseData, setCourseData] = useState<SingleCourseResponse | null>(
    null
  );
  const [quizData, setQuizData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonCompat | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set()
  );
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [allLessons, setAllLessons] = useState<LessonCompat[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([0])
  );
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  // Referencias para el guardado de progreso
  const lastProgressSave = useRef<number>(0);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && params.id) {
      loadCourse();
    }

    // Limpiar al desmontar
    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [user, authLoading, params.id, router]);

  const loadCourse = async () => {
    try {
      setError(null);
      const courseId = params.id as string;

      // Cargar curso, progreso y examen en paralelo
      const [course, progressData, examData] = await Promise.all([
        coursesService.getCourseById(courseId),
        user
          ? coursesService.getCourseProgress(user.id, courseId)
          : Promise.resolve(null),
        coursesService.getExamByCourseId(courseId).catch((err) => {
          console.log("No hay examen disponible para este curso");
          return null;
        }),
      ]);

      if (!course) {
        throw new Error("No se pudo cargar la información del curso");
      }

      // Crear estructura compatible con el componente
      console.log("📚 Curso cargado del backend:", {
        id: course.id,
        titulo: course.titulo,
        totalModulos: course.modulos?.length || 0,
        modulos: course.modulos?.map((m, idx) => ({
          indice: idx,
          titulo: m.modulo_titulo,
          totalLecciones: m.lecciones?.length || 0,
          lecciones: m.lecciones?.map((l) => ({
            id: l.id,
            titulo: l.titulo,
            url_video: l.url_video,
          })),
        })),
      });

      const courseDataWrapper = {
        success: true,
        message: {
          curso: {
            course: {
              id: course.id,
              title: course.titulo,
              modules:
                course.modulos?.map((modulo) => ({
                  module_title: modulo.modulo_titulo,
                  description: modulo.descripcion,
                  lessons:
                    modulo.lecciones?.map((leccion) => ({
                      id: leccion.id,
                      title: leccion.titulo,
                      description: leccion.descripcion,
                      video_url: leccion.url_video || "",
                      duration_minutes: String(leccion.duracion_minutos || 0),
                      type: leccion.tipo,
                    })) || [],
                })) || [],
            },
          },
          quiz: examData, // Asignar el examen cargado
        },
      };

      setCourseData(courseDataWrapper);
      setQuizData(examData);

      // Crear lista plana de todas las lecciones
      const lessons = courseDataWrapper.message.curso.course.modules.flatMap(
        (module) => module.lessons
      );
      console.log(
        "📋 Lista plana de lecciones creada:",
        lessons.map((l, idx) => ({
          indice: idx,
          id: l.id,
          titulo: l.title,
          url_video: l.video_url,
        }))
      );
      setAllLessons(lessons);

      // Aplicar progreso guardado si existe
      if (progressData && progressData.progresosVideos) {
        const completedLessonIds = new Set(
          progressData.progresosVideos
            .filter((video) => video.completado)
            .map((video) => video.leccionId)
        );

        setCompletedLessons(completedLessonIds);

        console.log(
          `Progreso cargado: ${completedLessonIds.size} lecciones completadas de ${lessons.length}`
        );
        console.log(
          `Progreso del curso: ${progressData.inscripcion.progresoPorcentaje}%`
        );
        console.log(
          `Tiempo total visto: ${Math.round(
            progressData.resumen.tiempoTotalVisto / 60
          )} minutos`
        );
      }

      // Seleccionar la primera lección no completada o la primera si todas están completadas
      const firstIncompleteIndex =
        progressData && progressData.progresosVideos
          ? lessons.findIndex(
            (lesson) =>
              !progressData.progresosVideos.find(
                (v) => v.leccionId === lesson.id && v.completado
              )
          )
          : 0;

      const startIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
      if (lessons.length > 0) {
        setCurrentLesson(lessons[startIndex]);
        setCurrentLessonIndex(startIndex);
      }
    } catch (error) {
      console.error("Error cargando curso:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error desconocido al cargar el curso"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonComplete = useCallback(
    async (lessonId: string) => {
      const newCompleted = new Set(completedLessons);
      newCompleted.add(lessonId);
      setCompletedLessons(newCompleted);

      // Marcar la lección como completada en el backend
      if (currentLesson && user) {
        try {
          await progressService.markLessonCompleted(
            user.id,
            params.id as string,
            currentLesson.id, // ID de la lección
            currentLesson.duration_minutes
              ? parseInt(currentLesson.duration_minutes) * 60
              : 0
          );
          console.log(
            `Lección completada: ${currentLesson.title} (ID: ${currentLesson.id})`
          );
        } catch (error) {
          console.error("Error marcando lección como completada:", error);
        }
      }
    },
    [completedLessons, currentLesson, user, params.id]
  );

  const handleVideoEnded = useCallback(() => {
    // Solo mostrar transición cuando el video termina completamente
    if (currentLessonIndex < allLessons.length - 1) {
      setShowTransition(true);
    } else if (currentLessonIndex === allLessons.length - 1) {
      // Si es la última lección y todas están completadas, mostrar el modal del quiz
      // Verificamos si ya tenemos todas las lecciones menos la actual completadas
      const isLastLesson = completedLessons.size >= allLessons.length - 1;

      if (isLastLesson) {
        // Marcar la última lección como completada
        if (currentLesson) {
          handleLessonComplete(currentLesson.id);
        }
        // Mostrar el modal de confirmación en lugar de ir directo al quiz
        setTimeout(() => {
          setShowQuizPrompt(true);
        }, 1000);
      }
    }
  }, [
    currentLessonIndex,
    allLessons.length,
    completedLessons.size,
    currentLesson,
    handleLessonComplete,
  ]);

  const handleQuizComplete = (results: any) => {
    setQuizCompleted(true);
    setQuizResults(results);
    if (results.score >= 70) {
      setCourseCompleted(true);
    }
  };

  const handleStartQuiz = () => {
    setShowQuizPrompt(false);
    setShowQuiz(true);
  };

  const calculateProgress = () => {
    if (allLessons.length === 0) return 0;
    return (completedLessons.size / allLessons.length) * 100;
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const newIndex = currentLessonIndex - 1;
      const previousLesson = allLessons[newIndex];
      console.log("⏪ Navegando a lección anterior:", {
        indiceAnterior: currentLessonIndex,
        nuevoIndice: newIndex,
        leccionAnterior: currentLesson
          ? {
            id: currentLesson.id,
            titulo: currentLesson.title,
            url: currentLesson.video_url,
          }
          : null,
        nuevaLeccion: {
          id: previousLesson.id,
          titulo: previousLesson.title,
          url: previousLesson.video_url,
        },
      });
      setCurrentLessonIndex(newIndex);
      setCurrentLesson(previousLesson);
      setShowQuiz(false);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const newIndex = currentLessonIndex + 1;
      const nextLesson = allLessons[newIndex];
      console.log("⏩ Navegando a siguiente lección:", {
        indiceAnterior: currentLessonIndex,
        nuevoIndice: newIndex,
        leccionAnterior: currentLesson
          ? {
            id: currentLesson.id,
            titulo: currentLesson.title,
            url: currentLesson.video_url,
          }
          : null,
        nuevaLeccion: {
          id: nextLesson.id,
          titulo: nextLesson.title,
          url: nextLesson.video_url,
        },
        totalLecciones: allLessons.length,
      });
      setCurrentLessonIndex(newIndex);
      setCurrentLesson(nextLesson);
      setShowQuiz(false);
      setShowTransition(false);
      // Resetear el contador de progreso para la nueva lección
      lastProgressSave.current = 0;
    } else if (
      currentLessonIndex === allLessons.length - 1 &&
      completedLessons.size === allLessons.length
    ) {
      console.log("🎯 Todas las lecciones completadas, mostrando quiz");
      setShowQuiz(true);
      setShowTransition(false);
    }
  };

  const selectLesson = (lesson: LessonCompat, index: number) => {
    console.log("🎯 Selección manual de lección:", {
      indiceAnterior: currentLessonIndex,
      nuevoIndice: index,
      leccionAnterior: currentLesson
        ? {
          id: currentLesson.id,
          titulo: currentLesson.title,
          url: currentLesson.video_url,
        }
        : null,
      nuevaLeccion: {
        id: lesson.id,
        titulo: lesson.title,
        url: lesson.video_url,
      },
    });
    setCurrentLesson(lesson);
    setCurrentLessonIndex(index);
    setShowQuiz(false);
    // Resetear el contador de progreso para la nueva lección
    lastProgressSave.current = 0;
  };

  const getCurrentModuleInfo = () => {
    if (!courseData || !currentLesson) return null;

    for (const module of courseData.message.curso.course.modules) {
      if (module.lessons.some((lesson) => lesson.id === currentLesson.id)) {
        return module;
      }
    }
    return null;
  };

  const handleVideoProgress = useCallback(
    async (currentTime: number, duration: number, percentage: number) => {
      // Guardar progreso del video cada 10 segundos
      const currentTimeInt = Math.floor(currentTime);

      if (
        currentTimeInt > 0 &&
        currentTimeInt - lastProgressSave.current >= 10 &&
        currentLesson &&
        user
      ) {
        lastProgressSave.current = currentTimeInt;

        try {
          await coursesService.saveVideoProgress(
            user.id, // UUID del usuario
            params.id as string, // ID del curso
            currentLesson.id, // ID de la lección
            currentTimeInt,
            Math.floor(duration)
          );
          console.log(
            `Progreso guardado: Lección ${currentLesson.id
            } - ${currentTimeInt}s de ${Math.floor(duration)}s (${Math.round(
              percentage
            )}%)`
          );
        } catch (error) {
          console.error("Error guardando progreso:", error);
        }
      }
    },
    [currentLesson, user, params.id]
  );

  const renderVideoPlayer = () => {
    if (!currentLesson) return null;

    console.log("🎥 Renderizando reproductor de video:", {
      leccionActual: {
        id: currentLesson.id,
        titulo: currentLesson.title,
        url: currentLesson.video_url,
        indice: currentLessonIndex,
      },
      timestamp: new Date().toISOString(),
    });

    return (
      <HTML5VideoPlayer
        key={`video-${currentLesson.id}-${currentLessonIndex}`}
        src={currentLesson.video_url}
        title={currentLesson.title}
        autoPlay={true}
        onComplete={() => handleLessonComplete(currentLesson.id)}
        onEnded={handleVideoEnded}
        onProgress={handleVideoProgress}
      />
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-400">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

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
            <Button
              onClick={() => router.push("/home")}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
            <Button onClick={loadCourse} className="flex-1 sm:flex-none">
              Intentar nuevamente
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!courseData) return null;

  const course = courseData.message.curso.course;
  const quiz = quizData || courseData.message.quiz;
  const currentModule = getCurrentModuleInfo();

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

      {/* Quiz Prompt Modal */}
      <Dialog open={showQuizPrompt} onOpenChange={setShowQuizPrompt}>
        <DialogContent className="bg-gray-800 border-gray-700 sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="h-16 w-16 bg-[#DDA92C]/20 rounded-full flex items-center justify-center mb-2">
              <Trophy className="h-8 w-8 text-[#DDA92C]" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              ¡Felicidades!
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-base">
              Has completado todas las lecciones del curso. <br />
              ¿Estás listo para demostrar tus conocimientos en el examen final?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowQuizPrompt(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white sm:flex-1"
            >
              Repasar lecciones
            </Button>
            <Button
              onClick={handleStartQuiz}
              className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-semibold sm:flex-1"
            >
              Comenzar Examen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/home")}
                className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-8 w-px bg-gray-800" />
              <div>
                <h1 className="font-medium text-white text-base tracking-tight">
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 font-medium">
                    Progreso del curso
                  </span>
                  <div className="h-1 w-1 rounded-full bg-gray-700" />
                  <span className="text-xs text-[#DDA92C] font-medium">
                    Clase {currentLessonIndex + 1} de {allLessons.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousLesson}
                disabled={currentLessonIndex === 0}
                className="text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1.5" />
                Anterior
              </Button>

              <div className="h-4 w-px bg-gray-800 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`text-sm font-medium px-3 ${showSidebar
                  ? "text-[#DDA92C] bg-[#DDA92C]/10 hover:bg-[#DDA92C]/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
              >
                <List className="h-4 w-4 mr-2" />
                Temario
              </Button>

              <div className="h-4 w-px bg-gray-800 mx-1" />

              <Button
                variant="default"
                size="sm"
                onClick={goToNextLesson}
                disabled={
                  currentLessonIndex === allLessons.length - 1 && !showQuiz
                }
                className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 text-sm font-medium px-4 ml-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Main Content */}
        <div
          className={`flex-1 ${showSidebar ? "md:mr-80" : ""
            } transition-all duration-300`}
        >
          <div className="p-4 md:p-6">
            {/* Video Player */}
            {currentLesson && !showQuiz && (
              <div className="mb-4 md:mb-6">{renderVideoPlayer()}</div>
            )}

            {/* Quiz - Using new Typeform component */}
            {showQuiz && !courseCompleted && quiz && (
              <div className="mb-4 md:mb-6">
                <TypeformQuizComponent
                  quiz={quiz}
                  onComplete={handleQuizComplete}
                />
              </div>
            )}

            {/* Certificate */}
            {courseCompleted && (
              <div className="mb-4 md:mb-6">
                <CertificateGenerator
                  courseTitle={course.title}
                  courseId={course.id}
                  score={quizResults?.score}
                />
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
                  <div className="text-sm font-medium text-[#DDA92C]">
                    {Math.round(calculateProgress())}%
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={goToNextLesson}
                  disabled={
                    currentLessonIndex === allLessons.length - 1 && !showQuiz
                  }
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
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                      {currentLesson.title}
                    </h2>
                    <p className="text-gray-400 mb-4 text-sm md:text-base">
                      {currentLesson.description}
                    </p>
                  </div>

                  {/* Module Summary */}
                  {currentModule && (
                    <div className="mt-4 p-3 md:p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 mr-2 text-[#DDA92C]" />
                        <h3 className="font-medium text-white text-sm md:text-base">
                          Resumen
                        </h3>
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm">
                        {currentModule.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Lesson Transition Modal */}
        {showTransition &&
          currentLesson &&
          currentLessonIndex < allLessons.length - 1 && (
            <LessonTransition
              currentLessonTitle={currentLesson.title}
              nextLessonTitle={allLessons[currentLessonIndex + 1].title}
              onContinue={goToNextLesson}
              onCancel={() => setShowTransition(false)}
              autoPlayDelay={5}
            />
          )}

        {/* FAB for Mobile/Tablet Sidebar Toggle */}
        <div className="fixed bottom-6 right-6 z-40 md:hidden">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            className="h-14 w-14 rounded-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 shadow-lg flex items-center justify-center"
          >
            <List className="h-6 w-6" />
          </Button>
        </div>

        {/* Sidebar - Mobile Overlay */}
        <div
          className={`
            fixed inset-y-0 right-0 w-80
            bg-gray-800 border-l border-gray-700
            transform transition-transform duration-300 ease-in-out z-50
            ${showSidebar ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
              <h3 className="font-semibold text-white text-base">
                Contenido del curso
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Tu progreso</span>
                <span className="text-[#DDA92C] font-medium">
                  {Math.round(calculateProgress())}%
                </span>
              </div>
              <Progress
                value={calculateProgress()}
                className="h-2 bg-gray-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {courseData.message.curso.course.modules.map(
                (module, moduleIndex) => {
                  const isExpanded = expandedModules.has(moduleIndex);
                  // Check if this module contains the current lesson
                  const hasActiveLesson = module.lessons.some(
                    (l) => l.id === currentLesson?.id
                  );

                  return (
                    <div
                      key={moduleIndex}
                      className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/30"
                    >
                      <button
                        onClick={() => toggleModule(moduleIndex)}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors ${hasActiveLesson
                          ? "bg-gray-700/50 text-white"
                          : "hover:bg-gray-700/30 text-gray-300"
                          }`}
                      >
                        <span className="font-medium text-sm pr-2">
                          {module.module_title}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-700/50">
                          {module.lessons.map((lesson) => {
                            const lessonIndex = allLessons.findIndex(
                              (l) => l.id === lesson.id
                            );
                            const isActive = currentLesson?.id === lesson.id;
                            const isCompleted = completedLessons.has(lesson.id);

                            return (
                              <button
                                key={lesson.id}
                                onClick={() =>
                                  selectLesson(lesson, lessonIndex)
                                }
                                className={`w-full p-3 text-left transition-all border-l-2 ${isActive
                                  ? "bg-[#DDA92C]/10 border-[#DDA92C]"
                                  : "border-transparent hover:bg-gray-700/30"
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-[#DDA92C]" />
                                    ) : isActive ? (
                                      <div className="h-4 w-4 rounded-full border-2 border-[#DDA92C] flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#DDA92C]" />
                                      </div>
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-gray-600 flex items-center justify-center">
                                        <span className="text-[10px] text-gray-400 font-medium">
                                          {lessonIndex + 1}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-sm font-medium leading-snug ${isActive
                                        ? "text-[#DDA92C]"
                                        : isCompleted
                                          ? "text-gray-300"
                                          : "text-gray-400"
                                        }`}
                                    >
                                      {lesson.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500 flex items-center">
                                        <Play className="h-3 w-3 mr-1" />
                                        {lesson.duration_minutes} min
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
              )}

              {/* Quiz Section */}
              {completedLessons.size === allLessons.length && (
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/30 mt-4">
                  <button
                    onClick={() => setShowQuiz(true)}
                    className={`w-full p-4 text-left transition-colors ${showQuiz
                      ? "bg-[#DDA92C]/10 border-l-2 border-[#DDA92C]"
                      : "hover:bg-gray-700/30 border-l-2 border-transparent"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${quizCompleted
                          ? "bg-[#DDA92C] text-gray-900"
                          : "bg-gray-700 text-gray-300"
                          }`}
                      >
                        {quizCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-medium text-sm ${showQuiz ? "text-[#DDA92C]" : "text-white"
                            }`}
                        >
                          Examen Final
                        </div>
                        <div className="text-xs text-gray-500">
                          {quiz?.title || "Evaluación de conocimientos"}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop for mobile */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
}
