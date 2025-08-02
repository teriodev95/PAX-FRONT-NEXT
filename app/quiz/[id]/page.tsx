"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ModernHeader } from "@/components/layout/modern-header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { TypeformQuizComponent } from "@/components/quiz/typeform-quiz-component"
import { CertificateGenerator } from "@/components/certificate/certificate-generator"
import { coursesService, type SingleCourseResponse } from "@/services/courses-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, AlertCircle, XCircle } from "lucide-react"

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [courseData, setCourseData] = useState<SingleCourseResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [showCertificate, setShowCertificate] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user && params.id) {
      loadCourse()
    }
  }, [user, authLoading, params.id, router])

  const loadCourse = async () => {
    try {
      setError(null)
      const response = await coursesService.getCourseById(params.id as string)

      if (!response?.success || !response.message?.curso?.course) {
        throw new Error("No se pudo cargar la información del curso")
      }

      setCourseData(response)
    } catch (error) {
      console.error("Error cargando curso:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar el curso")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuizComplete = (results: any) => {
    setQuizResults(results)
    setQuizCompleted(true)

    // Si aprobó el quiz, mostrar opción de certificado
    if (results.score >= 70) {
      setShowCertificate(true)
    }
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleRetakeQuiz = () => {
    setQuizStarted(false)
    setQuizCompleted(false)
    setQuizResults(null)
    setShowCertificate(false)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-400">Cargando examen...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="hidden md:block">
          <ModernHeader />
        </div>
        <div className="block md:hidden">
          <MobileHeader />
        </div>
        <main className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          <Alert variant="destructive" className="bg-red-900 border-red-700 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              <strong>Error al cargar el examen:</strong> {error}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => router.push("/home")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
            <Button onClick={loadCourse} className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900">
              Intentar nuevamente
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!courseData) return null

  const course = courseData.message.curso.course
  const quiz = courseData.message.quiz

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="hidden md:block">
        <ModernHeader />
      </div>
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <main className="relative">
        {/* Back Button - Fixed Position */}
        <div className="fixed top-20 md:top-24 left-4 md:left-6 z-50">
          <Button
            onClick={() => router.push("/home")}
            variant="ghost"
            size="sm"
            className="bg-gray-800 bg-opacity-90 backdrop-blur-sm border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
        </div>

        {/* Quiz Content */}
        {!quizStarted && !quizCompleted && quiz && (
          <TypeformQuizComponent quiz={quiz} onComplete={handleQuizComplete} />
        )}

        {/* Quiz in progress */}
        {quizStarted && !quizCompleted && quiz && <TypeformQuizComponent quiz={quiz} onComplete={handleQuizComplete} />}

        {/* Quiz completed - Certificate */}
        {quizCompleted && showCertificate && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">¡Felicitaciones!</h2>
                <p className="text-gray-300">Has completado exitosamente el examen. Descarga tu certificado.</p>
              </div>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <CertificateGenerator courseTitle={course.title} courseId={course.id} />
                </CardContent>
              </Card>
              <div className="text-center mt-6">
                <Button
                  onClick={handleRetakeQuiz}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
                  Tomar examen nuevamente
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz completed - No certificate */}
        {quizCompleted && !showCertificate && quizResults && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">Intenta nuevamente</h2>
                <p className="text-gray-300 mb-6">
                  Obtuviste {quizResults.score}%. Necesitas al menos 70% para aprobar.
                </p>
              </div>
              <div className="space-y-4">
                <Button
                  onClick={handleRetakeQuiz}
                  className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-semibold px-8"
                >
                  Repetir examen
                </Button>
                <div>
                  <Button
                    onClick={() => router.push(`/course/${course.id}`)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    Revisar curso
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
