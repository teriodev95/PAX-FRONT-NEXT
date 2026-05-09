"use client";

export const runtime = 'edge';

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { HTML5VideoPlayer } from "@/components/video/html5-video-player";
import { LessonTransition } from "@/components/video/lesson-transition";
import { LessonContent } from "@/components/video/lesson-content";
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
  Layers,
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
  const completedLessonsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    completedLessonsRef.current = completedLessons;
  }, [completedLessons]);

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
        coursesService.getExamByCourseId(courseId).catch(() => {
          return null;
        }),
      ]);

      if (!course) {
        throw new Error("No se pudo cargar la información del curso");
      }

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
      setAllLessons(lessons);

      // Aplicar progreso guardado si existe
      if (progressData && progressData.progresosVideos) {
        const completedLessonIds = new Set(
          progressData.progresosVideos
            .filter((video) => video.completado)
            .map((video) => video.leccionId)
        );

        setCompletedLessons(completedLessonIds);
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
      if (completedLessonsRef.current.has(lessonId)) {
        return;
      }

      const newCompleted = new Set(completedLessonsRef.current);
      newCompleted.add(lessonId);
      completedLessonsRef.current = newCompleted;
      setCompletedLessons(newCompleted);

      // Marcar la lección como completada en el backend
      if (currentLesson && user) {
        try {
          await progressService.markLessonCompleted(
            user.id,
            params.id as string,
            currentLesson.id, // ID de la lección
            currentLesson.duration_minutes
              ? Number(currentLesson.duration_minutes) * 60
              : 0
          );
        } catch (error) {
          console.error("Error marcando lección como completada:", error);
        }
      }
    },
    [currentLesson, user, params.id]
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

  const handleQuizComplete = async (results: any) => {
    setQuizCompleted(true);
    setQuizResults(results);

    const passingScore = quizData?.minScore ?? 70;
    const passed = results.score >= passingScore;
    let examAttemptSaved = false;

    if (user && quizData?.id) {
      try {
        const { score, ...answers } = results;
        await coursesService.submitExamAttempt(
          user.id,
          quizData.id,
          answers,
          score,
          passed
        );
        examAttemptSaved = true;
      } catch (error) {
        console.error("Error al registrar intento de examen:", error);
      }
    }

    if (passed && examAttemptSaved) {
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
      setCurrentLessonIndex(newIndex);
      setCurrentLesson(previousLesson);
      setShowQuiz(false);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const newIndex = currentLessonIndex + 1;
      const nextLesson = allLessons[newIndex];
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
      setShowQuiz(true);
      setShowTransition(false);
    }
  };

  const selectLesson = (lesson: LessonCompat, index: number) => {
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
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
        return;
      }

      // Guardar progreso del video cada 10 segundos
      const currentTimeInt = Math.floor(currentTime);
      const durationInt = Math.max(1, Math.floor(duration));

      if (
        currentTimeInt > 0 &&
        currentTimeInt - lastProgressSave.current >= 15 &&
        currentLesson &&
        user &&
        !completedLessonsRef.current.has(currentLesson.id)
      ) {
        lastProgressSave.current = currentTimeInt;

        try {
          await coursesService.saveVideoProgress(
            user.id, // UUID del usuario
            params.id as string, // ID del curso
            currentLesson.id, // ID de la lección
            currentTimeInt,
            durationInt
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

    return (
      <HTML5VideoPlayer
        key={`video-${currentLesson.id}-${currentLessonIndex}`}
        src={currentLesson.video_url || ""}
        title={currentLesson.title}
        showHeader={false}
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
  const isQuizMode = showQuiz && !courseCompleted && Boolean(quiz);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      {!isQuizMode && <div className="block md:hidden">
        <div className="bg-gray-900/95 border-b border-gray-800 sticky top-0 z-50 backdrop-blur">
          <div className="px-4 py-3 flex items-center gap-3 min-h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/home")}
              className="h-9 w-9 shrink-0 rounded-full text-gray-300 hover:text-white hover:bg-gray-800"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                Lección {currentLessonIndex + 1} de {allLessons.length}
              </div>
              <div className="font-semibold text-sm leading-5 truncate text-white">
                {currentLesson?.title || "Cargando..."}
              </div>
            </div>
            <div className="shrink-0 text-xs font-medium text-primary-accent tabular-nums">
              {Math.round(calculateProgress())}%
            </div>
          </div>
          <Progress value={calculateProgress()} className="h-0.5 bg-gray-800 rounded-none" />
        </div>
      </div>}

      {/* Quiz Prompt Modal */}
      <Dialog open={showQuizPrompt} onOpenChange={setShowQuizPrompt}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[440px] rounded-2xl border border-gray-700 bg-gray-800 p-6 text-white shadow-xl sm:rounded-2xl">
          <DialogHeader className="items-center space-y-0 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-accent/15">
              <Trophy className="h-7 w-7 text-primary-accent" />
            </div>
            <DialogTitle className="text-2xl font-bold leading-7 text-white">
              ¡Felicidades!
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-[340px] text-base leading-6 text-gray-300">
              Completaste todas las lecciones. Continúa con el examen final cuando estés listo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-col sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setShowQuizPrompt(false)}
              className="h-12 w-full rounded-xl border-gray-600 bg-transparent font-semibold text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Repasar lecciones
            </Button>
            <Button
              onClick={handleStartQuiz}
              className="h-12 w-full rounded-xl bg-primary-accent font-semibold text-gray-900 hover:bg-primary-accent"
            >
              Comenzar examen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop Header */}
      {!isQuizMode && <div className="hidden md:block bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/home")}
                className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full shrink-0"
                aria-label="Volver al inicio"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-8 w-px bg-gray-800 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                  Lección {currentLessonIndex + 1} de {allLessons.length} · {course.title}
                </div>
                <h1 className="font-semibold text-white text-[15px] leading-5 tracking-tight truncate max-w-[60vw]">
                  {currentLesson?.title || "Cargando..."}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden lg:inline-flex items-center gap-2 mr-2 text-xs text-gray-500 font-medium tabular-nums">
                <span className="h-1 w-16 rounded-full bg-gray-800 overflow-hidden">
                  <span
                    className="block h-full bg-primary-accent transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </span>
                {Math.round(calculateProgress())}%
              </span>

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

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`text-sm font-medium px-3 ${showSidebar
                  ? "text-primary-accent bg-primary-accent/10 hover:bg-primary-accent/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
              >
                <List className="h-4 w-4 mr-2" />
                Temario
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={goToNextLesson}
                disabled={
                  currentLessonIndex === allLessons.length - 1 && !showQuiz
                }
                className="bg-primary-accent hover:bg-primary-accent text-gray-900 text-sm font-medium px-4 ml-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>}

      <div className="flex relative">
        {/* Main Content */}
        <div
          className={`flex-1 ${!isQuizMode && showSidebar ? "md:mr-80" : ""
            } transition-all duration-300`}
        >
          <div className={isQuizMode ? "w-full" : "mx-auto w-full max-w-[920px] pb-24 md:px-6 md:py-8 md:pb-12"}>
            {currentLesson && !showQuiz && (
              <div className="space-y-5 md:space-y-6">
                {/* Title block (desktop only — el header móvil ya muestra el título) */}
                <div className="hidden md:block">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-primary-accent">
                    Lección {currentLessonIndex + 1} de {allLessons.length}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white">
                    {currentLesson.title}
                  </h1>
                </div>

                {/* Player — full-bleed en mobile, rounded en desktop */}
                <div className="md:block">
                  {renderVideoPlayer()}
                </div>

                <div className="px-4 md:px-0">
                  <LessonContent description={currentLesson.description} />
                </div>
              </div>
            )}

            {/* Quiz - Using new Typeform component */}
            {showQuiz && !courseCompleted && quiz && (
              <TypeformQuizComponent
                quiz={quiz}
                onComplete={handleQuizComplete}
                onExit={() => setShowQuiz(false)}
              />
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
            {!showQuiz && <div className="block md:hidden px-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={goToPreviousLesson}
                  disabled={currentLessonIndex === 0}
                  className="h-12 rounded-xl border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mr-1.5" />
                  Anterior
                </Button>
                <Button
                  variant="default"
                  onClick={goToNextLesson}
                  disabled={
                    currentLessonIndex === allLessons.length - 1 && !showQuiz
                  }
                  className="h-12 rounded-xl bg-primary-accent hover:bg-primary-accent text-gray-900 disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>}

            {currentLesson &&
              !showQuiz &&
              currentModule?.description &&
              currentModule.description.trim() !==
                (currentLesson.description ?? "").trim() && (
                <section
                  aria-label="Resumen del módulo"
                  className="mx-4 md:mx-0 mt-6 rounded-2xl border border-gray-700/80 bg-gray-800/60 p-5 md:p-6"
                >
                  <header className="mb-3 flex items-center gap-2 text-gray-400">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider">
                      Resumen del módulo
                    </h2>
                  </header>
                  <p className="text-[15px] leading-relaxed text-gray-300">
                    {currentModule.description}
                  </p>
                </section>
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
        {!isQuizMode && <div className="fixed bottom-6 right-5 z-40 md:hidden">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            className="h-14 w-14 rounded-full bg-primary-accent hover:bg-primary-accent text-gray-900 shadow-lg flex items-center justify-center"
            aria-label="Abrir temario"
          >
            <List className="h-6 w-6" />
          </Button>
        </div>}

        {/* Sidebar - Mobile Overlay */}
        {!isQuizMode && <div
          className={`
            fixed inset-y-0 right-0 w-[min(88vw,360px)]
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
                <span className="text-primary-accent font-medium">
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
                                className={`w-full p-3 text-left transition-all ${isActive
                                  ? "bg-primary-accent/10"
                                  : "hover:bg-gray-700/30"
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-primary-accent" />
                                    ) : isActive ? (
                                      <div className="h-4 w-4 rounded-full border-2 border-primary-accent flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary-accent" />
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
                                        ? "text-primary-accent"
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
                      ? "bg-primary-accent/10"
                      : "hover:bg-gray-700/30"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${quizCompleted
                          ? "bg-primary-accent text-gray-900"
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
                          className={`font-medium text-sm ${showQuiz ? "text-primary-accent" : "text-white"
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
        </div>}

        {/* Backdrop for mobile */}
        {!isQuizMode && showSidebar && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
}
