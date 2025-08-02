"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Trophy, Target, Zap } from "lucide-react"
import type { Quiz } from "@/services/courses-service"

interface TypeformQuizComponentProps {
  quiz: Quiz
  onComplete: (results: any) => void
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

export function TypeformQuizComponent({ quiz, onComplete }: TypeformQuizComponentProps) {
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
    if (score >= 90) return <Trophy className="h-16 w-16 text-[#DDA92C]" />
    if (score >= 70) return <Target className="h-16 w-16 text-[#DDA92C]" />
    return <Zap className="h-16 w-16 text-red-400" />
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { title: "¡Excelente!", message: "Dominas completamente el tema" }
    if (score >= 70) return { title: "¡Bien hecho!", message: "Has aprobado satisfactoriamente" }
    return { title: "Sigue intentando", message: "Necesitas repasar algunos conceptos" }
  }

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-[#DDA92C] rounded-full flex items-center justify-center mx-auto">
              <Target className="h-10 w-10 text-gray-900" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">{quiz.title}</h1>
            <p className="text-xl text-gray-300 leading-relaxed">{quiz.description}</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-[#DDA92C]">{totalQuestions}</div>
                <div className="text-sm text-gray-400">Preguntas</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-[#DDA92C]">70%</div>
                <div className="text-sm text-gray-400">Para aprobar</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-[#DDA92C]">∞</div>
                <div className="text-sm text-gray-400">Sin límite</div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowWelcome(false)}
            size="lg"
            className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-semibold px-12 py-4 text-lg rounded-xl"
          >
            Comenzar Quiz
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  // Completion Screen
  if (isCompleted) {
    const scoreData = getScoreMessage(score)
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8 p-8">
          <div className="space-y-6">
            {getScoreIcon(score)}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">{scoreData.title}</h1>
              <p className="text-xl text-gray-300">{scoreData.message}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-[#DDA92C] mb-2">{score}%</div>
              <div className="text-gray-400">Tu puntuación final</div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                <div className="text-sm text-gray-400">Preguntas respondidas</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{Math.round((score / 100) * totalQuestions)}</div>
                <div className="text-sm text-gray-400">Respuestas correctas</div>
              </div>
            </div>

            {score >= 70 ? (
              <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-green-300 font-medium">¡Aprobado!</span>
                </div>
              </div>
            ) : (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-2">
                  <XCircle className="h-6 w-6 text-red-400" />
                  <span className="text-red-300 font-medium">No aprobado</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Question Screen
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Progress Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 md:p-6 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <div className="text-sm text-gray-400">
              {currentQuestionIndex + 1} de {totalQuestions}
            </div>
          </div>
          <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-2 bg-gray-700" />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div
          className={`max-w-3xl mx-auto w-full transition-all duration-200 ${isAnimating ? "opacity-0 transform translate-x-4" : "opacity-100 transform translate-x-0"}`}
        >
          <Card className="bg-gray-800 border-gray-700 shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <div className="space-y-8">
                {/* Question Header */}
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-[#DDA92C] rounded-xl flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-lg">{currentQuestionIndex + 1}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{currentQuestion?.title}</h2>
                  {currentQuestion?.description && (
                    <p className="text-lg text-gray-400 leading-relaxed">{currentQuestion.description}</p>
                  )}
                </div>

                {/* Question Input */}
                <div className="space-y-6">
                  {currentQuestion?.type === "radiogroup" && (
                    <RadioGroup
                      value={answers[currentQuestion.name] || ""}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.name, value)}
                      className="space-y-4"
                    >
                      {currentQuestion.choices?.map((choice, index) => (
                        <div key={index} className="relative group">
                          <div className="flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-600 hover:border-[#DDA92C] transition-all duration-200 cursor-pointer group-hover:bg-gray-700">
                            <RadioGroupItem
                              value={choice}
                              id={`${currentQuestion.name}-${index}`}
                              className="border-gray-500 text-[#DDA92C] focus:ring-[#DDA92C] w-5 h-5"
                            />
                            <Label
                              htmlFor={`${currentQuestion.name}-${index}`}
                              className="text-lg text-white cursor-pointer flex-1 font-medium"
                            >
                              {choice}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion?.type === "comment" && (
                    <div className="space-y-4">
                      <Textarea
                        value={answers[currentQuestion.name] || ""}
                        onChange={(e) => handleAnswerChange(currentQuestion.name, e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        className="min-h-[120px] bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#DDA92C] text-lg p-4 rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    size="lg"
                    className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-semibold px-8 py-3 text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? "Finalizar Quiz" : "Siguiente"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
