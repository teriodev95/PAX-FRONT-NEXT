"use client"

import { useEffect, useRef } from "react"
import { SurveyModel } from "survey-core"
import { Survey } from "survey-react-ui"
import "survey-core/defaultV2.min.css"
import type { Quiz } from "@/services/courses-service"

interface QuizComponentProps {
  quiz: Quiz
  onComplete: (results: any) => void
}

export function QuizComponent({ quiz, onComplete }: QuizComponentProps) {
  const surveyRef = useRef<SurveyModel | null>(null)

  useEffect(() => {
    const surveyModel = new SurveyModel(quiz)

    surveyModel.onComplete.add((sender) => {
      const results = sender.data
      const score = calculateScore(sender)
      onComplete({ ...results, score })
    })

    surveyRef.current = surveyModel
  }, [quiz, onComplete])

  const calculateScore = (survey: SurveyModel) => {
    let correct = 0
    let total = 0

    survey.getAllQuestions().forEach((question: any) => {
      if (question.correctAnswer !== undefined) {
        total++
        if (question.value === question.correctAnswer) {
          correct++
        }
      }
    })

    return total > 0 ? Math.round((correct / total) * 100) : 0
  }

  if (!surveyRef.current) return null

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
        <p className="text-muted-foreground">{quiz.description}</p>
      </div>
      <Survey model={surveyRef.current} />
    </div>
  )
}
