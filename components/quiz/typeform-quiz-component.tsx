"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Trophy, Target, Zap } from "lucide-react"
import type { Quiz } from "@/services/courses-service"

interface TypeformQuizComponentProps {
  quiz: Quiz
  onComplete: (results: any) => void
  onExit?: () => void
}

interface QuizQuestion {
  type: string
  name: string
  title: string
  description?: string
  isRequired?: boolean
  choices?: string[]
  correctAnswer?: string
}

export function TypeformQuizComponent({ quiz, onComplete, onExit }: TypeformQuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  // Extraer todas las preguntas de todas las páginas
  const allQuestions: QuizQuestion[] = quiz.pages.flatMap((page) => page.elements || [])
  const currentQuestion = allQuestions[currentQuestionIndex]
  const totalQuestions = allQuestions.length

  const handleAnswerChange = (questionName: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionName]: value,
    }))
  }

  const calculateScore = () => {
    let correct = 0
    let total = 0

    allQuestions.forEach((question) => {
      if (question.correctAnswer !== undefined) {
        total++
        if (answers[question.name] === question.correctAnswer) {
          correct++
        }
      }
    })

    return total > 0 ? Math.round((correct / total) * 100) : 0
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setIsAnimating(false)
      }, 200)
    } else {
      // Completar quiz
      const finalScore = calculateScore()
      setScore(finalScore)
      setIsCompleted(true)
      onComplete({ ...answers, score: finalScore })
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const canProceed = () => {
    if (!currentQuestion) return false
    if (currentQuestion.isRequired) {
      return answers[currentQuestion.name] !== undefined && answers[currentQuestion.name] !== ""
    }
    return true
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="h-8 w-8 text-gray-900" />
    if (score >= 70) return <Target className="h-8 w-8 text-gray-900" />
    return <Zap className="h-8 w-8 text-white" />
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { title: "¡Excelente!", message: "Dominas completamente el tema" }
    if (score >= 70) return { title: "¡Bien hecho!", message: "Has aprobado satisfactoriamente" }
    return { title: "Sigue intentando", message: "Necesitas repasar algunos conceptos" }
  }

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="flex min-h-dvh flex-col bg-gray-900 text-white">
        <header className="shrink-0 border-b border-gray-800 px-4 py-4">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="h-10 rounded-full px-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Salir
            </Button>
            <span className="text-sm font-medium text-gray-400">Examen final</span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="mx-auto w-full max-w-[440px] text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-accent">
              <Target className="h-8 w-8 text-gray-900" />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-primary-accent">Listo para comenzar</p>
              <h1 className="text-3xl font-bold leading-9 text-white md:text-4xl">{quiz.title}</h1>
              {quiz.description && <p className="text-base leading-7 text-gray-300">{quiz.description}</p>}
            </div>

            <div className="mt-8 rounded-2xl border border-gray-700 bg-gray-800/80 p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-accent">{totalQuestions}</div>
                  <div className="mt-1 text-xs text-gray-400">Preguntas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-accent">70%</div>
                  <div className="mt-1 text-xs text-gray-400">Para aprobar</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-accent">∞</div>
                  <div className="mt-1 text-xs text-gray-400">Sin límite</div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowWelcome(false)}
              className="mt-8 h-12 w-full rounded-xl bg-primary-accent text-base font-semibold text-gray-900 hover:bg-primary-accent"
            >
              Comenzar examen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Completion Screen
  if (isCompleted) {
    const scoreData = getScoreMessage(score)
    return (
      <div className="flex min-h-dvh flex-col bg-gray-900 text-white">
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="mx-auto w-full max-w-[480px] text-center">
            <div
              className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${score >= 70 ? "bg-primary-accent" : "bg-red-500"
                }`}
            >
              {getScoreIcon(score)}
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-9 text-white">{scoreData.title}</h1>
              <p className="text-base leading-7 text-gray-300">{scoreData.message}</p>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-700 bg-gray-800/80 p-5">
              <div className="mb-5">
                <div className="text-5xl font-bold text-primary-accent">{score}%</div>
                <div className="mt-1 text-sm text-gray-400">Puntuación final</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-gray-700/60 p-4">
                  <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                  <div className="mt-1 text-xs text-gray-400">Respondidas</div>
                </div>
                <div className="rounded-xl bg-gray-700/60 p-4">
                  <div className="text-2xl font-bold text-white">{Math.round((score / 100) * totalQuestions)}</div>
                  <div className="mt-1 text-xs text-gray-400">Correctas</div>
                </div>
              </div>

              {score >= 70 ? (
                <div className="mt-5 rounded-xl border border-green-700 bg-green-900/30 p-4">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="font-medium text-green-300">Aprobado</span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-red-700 bg-red-900/30 p-4">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="font-medium text-red-300">No aprobado</span>
                  </div>
                </div>
              )}
            </div>

            {onExit && (
              <Button
                onClick={onExit}
                className="mt-8 h-12 w-full rounded-xl bg-primary-accent text-base font-semibold text-gray-900 hover:bg-primary-accent"
              >
                Volver al curso
              </Button>
            )}
          </div>
        </main>
      </div>
    )
  }

  // Question Screen
  return (
    <div className="flex min-h-dvh flex-col bg-gray-900 text-white">
      <header className="shrink-0 border-b border-gray-800 px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={currentQuestionIndex === 0 ? onExit : handlePrevious}
              className="h-10 rounded-full px-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentQuestionIndex === 0 ? "Salir" : "Anterior"}
            </Button>
            <div className="text-sm font-medium text-gray-400">
              {currentQuestionIndex + 1} de {totalQuestions}
            </div>
          </div>
          <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-1.5 bg-gray-700" />
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-6 md:py-10">
        <div
          className={`mx-auto w-full max-w-2xl transition-all duration-200 ${isAnimating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-5 md:p-8">
            <div className="space-y-7">
              <div className="space-y-3">
                <p className="text-sm font-medium text-primary-accent">
                  Pregunta {currentQuestionIndex + 1}
                </p>
                <h1 className="text-2xl font-bold leading-8 text-white md:text-3xl md:leading-10">
                  {currentQuestion?.title}
                </h1>
                {currentQuestion?.description && (
                  <p className="text-base leading-7 text-gray-300">{currentQuestion.description}</p>
                )}
              </div>

              <div className="space-y-5">
                {currentQuestion?.type === "radiogroup" && (
                  <RadioGroup
                    value={answers[currentQuestion.name] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.name, value)}
                    className="space-y-3"
                  >
                    {currentQuestion.choices?.map((choice, index) => {
                      const isSelected = answers[currentQuestion.name] === choice
                      return (
                        <div
                          key={choice}
                          onClick={() => handleAnswerChange(currentQuestion.name, choice)}
                          className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border p-4 text-base font-semibold leading-6 transition-colors md:min-h-[4.5rem] md:text-lg ${isSelected
                            ? "border-primary-accent bg-primary-accent/10 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-100 hover:border-gray-500 hover:bg-gray-700/70"
                            }`}
                        >
                          <RadioGroupItem
                            value={choice}
                            id={`${currentQuestion.name}-${index}`}
                            className="h-5 w-5 shrink-0 border-gray-500 text-primary-accent focus:ring-[var(--brand-accent)]"
                          />
                          <Label
                            htmlFor={`${currentQuestion.name}-${index}`}
                            className="flex-1 cursor-pointer"
                          >
                            {choice}
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                )}

                {currentQuestion?.type === "comment" && (
                  <Textarea
                    value={answers[currentQuestion.name] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.name, e.target.value)}
                    placeholder="Escribe tu respuesta"
                    className="min-h-[140px] resize-none rounded-xl border-gray-600 bg-gray-700 p-4 text-base text-white placeholder-gray-400 focus:border-primary-accent md:text-lg"
                  />
                )}
              </div>

              <div className="flex pt-2 md:justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                  className="h-12 w-full rounded-xl bg-primary-accent px-8 text-base font-semibold text-gray-900 hover:bg-primary-accent disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? "Finalizar examen" : "Siguiente"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
