"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  coursesService,
  type Course,
  type Quiz,
  type Lesson,
} from "@/services/courses-service";
import { HTML5VideoPlayer } from "@/components/video/html5-video-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Lock,
  Eye,
  BookOpen,
  Clock,
  BarChart,
  Play,
  FileText,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Shield,
  AlertCircle,
  X,
  Video,
} from "lucide-react";

const PREVIEW_PIN = "147258";

export default function CoursePreviewPage() {
  const params = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([0])
  );
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PREVIEW_PIN) {
      setIsAuthenticated(true);
      setPinError("");
    } else {
      setPinError("PIN incorrecto. Intenta nuevamente.");
    }
  };

  useEffect(() => {
    if (isAuthenticated && params.id) {
      loadCourseData();
    }
  }, [isAuthenticated, params.id]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const courseId = params.id as string;

      // Cargar curso y examen en paralelo
      const [courseData, examData] = await Promise.all([
        coursesService.getCourseById(courseId),
        coursesService.getExamByCourseId(courseId).catch(() => null),
      ]);

      if (!courseData) {
        throw new Error("No se pudo cargar la información del curso");
      }

      setCourse(courseData);
      setQuiz(examData);

      // Debug: mostrar estructura del quiz en consola
      if (examData) {
        console.log("=== QUIZ DATA DEBUG ===");
        console.log("Quiz completo:", JSON.stringify(examData, null, 2));
        if (examData.pages?.[0]?.elements?.[0]) {
          console.log("Primera pregunta:", examData.pages[0].elements[0]);
          console.log("Choices de la primera pregunta:", examData.pages[0].elements[0].choices);
        }
      }
    } catch (err) {
      console.error("Error cargando datos del curso:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar el curso"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  const handlePlayLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowVideoPlayer(true);
  };

  const handleCloseVideo = () => {
    setShowVideoPlayer(false);
    setSelectedLesson(null);
  };

  const getLevelColor = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case "principiante":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermedio":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "avanzado":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTotalLessons = () => {
    if (!course?.modulos) return 0;
    return course.modulos.reduce(
      (total, modulo) => total + (modulo.lecciones?.length || 0),
      0
    );
  };

  // PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#DDA92C]/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-[#DDA92C]" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Vista Previa del Curso
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Ingresa el PIN de acceso para visualizar el curso y su examen
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="Ingresa el PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-[#DDA92C] focus:ring-[#DDA92C]"
                    maxLength={6}
                  />
                </div>
                {pinError && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {pinError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-semibold"
              >
                <Eye className="mr-2 h-4 w-4" />
                Acceder a Vista Previa
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#DDA92C]" />
          <p className="text-gray-400">Cargando vista previa del curso...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#DDA92C]/20 rounded-full flex items-center justify-center">
                <Eye className="h-5 w-5 text-[#DDA92C]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Vista Previa
                </h1>
                <p className="text-xs text-gray-400">
                  Modo de previsualización del curso
                </p>
              </div>
            </div>
            <Badge className="bg-[#DDA92C]/20 text-[#DDA92C] border-[#DDA92C]/30">
              <Lock className="h-3 w-3 mr-1" />
              Acceso Restringido
            </Badge>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedLesson && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Modal Header */}
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#DDA92C]/20 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-[#DDA92C]" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm md:text-base">
                  {selectedLesson.titulo}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedLesson.duracion_minutos} minutos
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseVideo}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              {selectedLesson.url_video ? (
                <HTML5VideoPlayer
                  key={`preview-video-${selectedLesson.id}`}
                  src={selectedLesson.url_video}
                  title={selectedLesson.titulo}
                  autoPlay={true}
                />
              ) : (
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Video no disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Description */}
          {selectedLesson.descripcion && (
            <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
              <p className="text-sm text-gray-400 max-w-5xl mx-auto">
                {selectedLesson.descripcion}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Course Header Card */}
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <div className="md:flex md:min-h-[280px]">
            {/* Course Image */}
            {course.portada && (
              <div className="md:w-2/5 h-56 md:h-auto relative">
                <img
                  src={course.portada}
                  alt={course.titulo}
                  className="w-full h-full object-cover absolute inset-0"
                />
              </div>
            )}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <div className="mb-4">
                <Badge className={`${getLevelColor(course.nivel)} mb-3`}>
                  {course.nivel}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {course.titulo}
                </h2>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">{course.descripcion}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <BookOpen className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm">
                    {getTotalLessons()} lecciones
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm">
                    {course.duracionVideoMinutos} min
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <BarChart className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm">{course.modulos?.length || 0} módulos</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <GraduationCap className="h-4 w-4 text-[#DDA92C]" />
                  <span className="text-sm">
                    {course.calificacionPromedio || "N/A"} rating
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Course Content */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#DDA92C]" />
              Contenido del Curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {course.modulos?.map((modulo, moduleIndex) => {
              const isExpanded = expandedModules.has(moduleIndex);
              return (
                <div
                  key={moduleIndex}
                  className="border border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="w-full p-4 flex items-center justify-between bg-gray-700/50 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#DDA92C]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#DDA92C] font-semibold text-sm">
                          {moduleIndex + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">
                          {modulo.modulo_titulo}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {modulo.lecciones?.length || 0} lecciones
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-700">
                      {modulo.descripcion && (
                        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
                          <p className="text-sm text-gray-400">
                            {modulo.descripcion}
                          </p>
                        </div>
                      )}
                      {modulo.lecciones?.map((leccion, lessonIndex) => (
                        <button
                          key={leccion.id}
                          onClick={() => leccion.url_video && handlePlayLesson(leccion)}
                          className={`w-full px-4 py-3 flex items-center gap-3 border-b border-gray-700/50 last:border-b-0 transition-colors text-left ${
                            leccion.url_video
                              ? "hover:bg-[#DDA92C]/10 cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          disabled={!leccion.url_video}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            leccion.url_video
                              ? "bg-[#DDA92C]/20 group-hover:bg-[#DDA92C]/30"
                              : "bg-gray-700"
                          }`}>
                            <Play className={`h-4 w-4 ${leccion.url_video ? "text-[#DDA92C]" : "text-gray-500"}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${leccion.url_video ? "text-gray-200" : "text-gray-500"}`}>
                              {leccion.titulo}
                            </p>
                            {leccion.descripcion && (
                              <p className="text-xs text-gray-500 mt-1">
                                {leccion.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {leccion.duracion_minutos} min
                            </div>
                            {leccion.url_video && (
                              <Badge className="bg-[#DDA92C]/20 text-[#DDA92C] border-[#DDA92C]/30 text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                Ver
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quiz Section */}
        {quiz && (
          <Card className="bg-gray-800/50 border-gray-700/50 overflow-hidden">
            {/* Quiz Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-800/80 border-b border-gray-700/50">
              <div className="p-6 md:p-8">
                {/* Top row: Icon + Title + Button */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#DDA92C]/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#DDA92C]/20">
                      <FileText className="h-6 w-6 text-[#DDA92C]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#DDA92C] uppercase tracking-wider">
                        Evaluación Final
                      </p>
                      <h2 className="text-xl md:text-2xl font-semibold text-white leading-tight">
                        {quiz.title || quiz.titulo}
                      </h2>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={`self-start transition-all duration-200 ${
                      showAnswers
                        ? "bg-[#DDA92C]/10 border-[#DDA92C]/30 text-[#DDA92C] hover:bg-[#DDA92C]/20"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {showAnswers ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Respuestas Visibles
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Mostrar Respuestas
                      </>
                    )}
                  </Button>
                </div>

                {/* Description */}
                {quiz.description && (
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-2xl">
                    {quiz.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg">
                  {quiz.minScore && (
                    <div className="bg-gray-900/50 rounded-lg p-3 text-center border border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-1">Aprobación</p>
                      <p className="text-lg font-semibold text-emerald-400">{quiz.minScore}%</p>
                    </div>
                  )}
                  {quiz.maxAttempts && (
                    <div className="bg-gray-900/50 rounded-lg p-3 text-center border border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-1">Intentos</p>
                      <p className="text-lg font-semibold text-blue-400">{quiz.maxAttempts}</p>
                    </div>
                  )}
                  {quiz.durationMinutes && (
                    <div className="bg-gray-900/50 rounded-lg p-3 text-center border border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-1">Duración</p>
                      <p className="text-lg font-semibold text-purple-400">{quiz.durationMinutes} min</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Questions Section */}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Preguntas del examen
                </h3>
                <span className="text-xs text-gray-500">
                  {quiz.pages?.[0]?.elements?.length || 0} preguntas
                </span>
              </div>

              <div className="space-y-6">
                {/* Questions */}
                {quiz.pages?.[0]?.elements?.map((question: any, qIndex: number) => (
                  <div
                    key={question.name || qIndex}
                    className="bg-gray-900/30 border border-gray-700/50 rounded-xl p-5 md:p-6"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-700/50">
                        <span className="text-[#DDA92C] font-semibold">
                          {qIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-white text-base leading-relaxed">
                          {question.title}
                        </h4>
                        {question.description && (
                          <p className="text-sm text-gray-500 mt-2">
                            {question.description}
                          </p>
                        )}
                        {question.isRequired && (
                          <span className="inline-block mt-3 text-xs text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded">
                            Obligatoria
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    {question.choices && (
                      <div className="space-y-2 pl-14">
                        {question.choices.map((choice: any, cIndex: number) => {
                          const choiceValue = typeof choice === 'string' ? choice : (choice.valor || choice.value || '');
                          const choiceText = typeof choice === 'string' ? choice : (choice.texto || choice.text || choice.label || choiceValue);
                          const isCorrect =
                            choiceValue === question.correctAnswer ||
                            choiceText === question.correctAnswer;
                          return (
                            <div
                              key={cIndex}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                                showAnswers && isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  showAnswers && isCorrect
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-gray-600"
                                }`}
                              >
                                {showAnswers && isCorrect && (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span
                                className={`text-sm flex-1 ${
                                  showAnswers && isCorrect
                                    ? "text-emerald-300 font-medium"
                                    : "text-gray-300"
                                }`}
                              >
                                {choiceText}
                              </span>
                              {showAnswers && isCorrect && (
                                <span className="text-xs text-emerald-400 font-medium">
                                  Correcta
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* For text/comment questions */}
                    {question.type === "comment" && (
                      <div className="pl-14">
                        <div className="px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50 border-dashed">
                          <p className="text-sm text-gray-500 italic">
                            Campo de respuesta abierta
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Fallback for preguntas structure */}
                {!quiz.pages && quiz.preguntas?.map((pregunta: any, qIndex: number) => (
                  <div
                    key={pregunta.nombre || qIndex}
                    className="bg-gray-900/30 border border-gray-700/50 rounded-xl p-5 md:p-6"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-700/50">
                        <span className="text-[#DDA92C] font-semibold">
                          {qIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-white text-base leading-relaxed">
                          {pregunta.titulo}
                        </h4>
                        {pregunta.requerida && (
                          <span className="inline-block mt-3 text-xs text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded">
                            Obligatoria
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    {pregunta.opciones && (
                      <div className="space-y-2 pl-14">
                        {pregunta.opciones.map((opcion: any, oIndex: number) => {
                          const opcionValue = typeof opcion === 'string' ? opcion : (opcion.valor || opcion.value || '');
                          const opcionText = typeof opcion === 'string' ? opcion : (opcion.texto || opcion.text || opcion.label || opcionValue);
                          const isCorrect =
                            opcionValue === pregunta.respuesta_correcta ||
                            opcionText === pregunta.respuesta_correcta;
                          return (
                            <div
                              key={oIndex}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                                showAnswers && isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  showAnswers && isCorrect
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-gray-600"
                                }`}
                              >
                                {showAnswers && isCorrect && (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span
                                className={`text-sm flex-1 ${
                                  showAnswers && isCorrect
                                    ? "text-emerald-300 font-medium"
                                    : "text-gray-300"
                                }`}
                              >
                                {opcionText}
                              </span>
                              {showAnswers && isCorrect && (
                                <span className="text-xs text-emerald-400 font-medium">
                                  Correcta
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {!quiz.pages && !quiz.preguntas && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No hay preguntas disponibles para este examen</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* No Quiz Message */}
        {!quiz && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">
                Este curso no tiene examen configurado
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-700">
          <p className="text-sm text-gray-500">
            Vista previa del curso - Solo para uso administrativo
          </p>
        </div>
      </div>
    </div>
  );
}
