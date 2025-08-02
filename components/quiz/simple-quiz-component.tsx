"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle } from "lucide-react"
import type { Quiz } from "@/services/courses-service"

interface SimpleQuizComponentProps {
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

export function SimpleQuizComponent({ quiz, onComplete }: SimpleQuizComponentProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)

  // Extraer todas las preguntas de todas las páginas
  const allQuestions: QuizQuestion[] = quiz.pages.flatMap((page) => page.elements || [])
  const questionsPerPage = Math.ceil(allQuestions.length / quiz.pages.length)
  const currentQuestions = allQuestions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage)

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
    if (currentPage < quiz.pages.length - 1) {
      setCurrentPage(currentPage + 1)
    } else {
      // Completar quiz
      const finalScore = calculateScore()
      setScore(finalScore)
      setIsCompleted(true)
      onComplete({ ...answers, score: finalScore })
    }
  }

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const canProceed = () => {
    return currentQuestions.every((question) => {
      if (question.isRequired) {
        return answers[question.name] !== undefined && answers[question.name] !== ""
      }
      return true
    })
  }

  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case "radiogroup":
        return (
          <div key={question.name} className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{question.title}</h3>
              {question.description && <p className="text-sm text-muted-foreground mb-4">{question.description}</p>}
            </div>
            <RadioGroup
              value={answers[question.name] || ""}
              onValueChange={(value) => handleAnswerChange(question.name, value)}
            >
              {question.choices?.map((choice, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={choice} id={`${question.name}-${index}`} />
                  <Label htmlFor={`${question.name}-${index}`} className="text-sm">
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "comment":
        return (
          <div key={question.name} className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{question.title}</h3>
              {question.description && <p className="text-sm text-muted-foreground mb-4">{question.description}</p>}
            </div>
            <Textarea
              value={answers[question.name] || ""}
              onChange={(e) => handleAnswerChange(question.name, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              className="min-h-[100px]"
            />
          </div>
        )

      default:
        return null
    }
  }

  if (isCompleted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {score >= 70 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold mb-2">¡Quiz Completado!</h2>
            <p className="text-lg mb-4">Tu puntuación: {score}%</p>
            {score >= 70 ? (
              <p className="text-green-600">¡Felicitaciones! Has aprobado el quiz.</p>
            ) : (
              <p className="text-red-600">Necesitas al menos 70% para aprobar. Intenta nuevamente.</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
        <p className="text-muted-foreground mb-4">{quiz.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>
              {currentPage + 1} de {quiz.pages.length}
            </span>
          </div>
          <Progress value={((currentPage + 1) / quiz.pages.length) * 100} className="w-full" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Página {currentPage + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.map((question) => renderQuestion(question))}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentPage === 0}>
              Anterior
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()}>
              {currentPage === quiz.pages.length - 1 ? "Finalizar Quiz" : "Siguiente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
