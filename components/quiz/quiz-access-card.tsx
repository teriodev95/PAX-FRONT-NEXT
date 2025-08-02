"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, Award, Users } from "lucide-react"
import Link from "next/link"
import type { Course } from "@/services/courses-service"

interface QuizAccessCardProps {
  course: Course
  className?: string
}

export function QuizAccessCard({ course, className }: QuizAccessCardProps) {
  return (
    <Card className={`bg-gray-800 border-gray-700 hover:border-[#DDA92C] transition-all duration-300 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-white">
            <FileText className="mr-2 h-5 w-5 text-[#DDA92C]" />
            Examen: {course.title}
          </CardTitle>
          <Badge className="bg-[#DDA92C] text-gray-900">Evaluación</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-400 text-sm line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Sin límite</span>
          </div>
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1" />
            <span>70% para aprobar</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{course.ratings.total_reviews} intentos</span>
          </div>
        </div>

        <Link href={`/quiz/${course.id}`} className="block">
          <Button className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium">
            <FileText className="mr-2 h-4 w-4" />
            Tomar Examen
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
