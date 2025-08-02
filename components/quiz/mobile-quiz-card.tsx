"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, Award, Users } from "lucide-react"
import Link from "next/link"
import type { Course } from "@/services/courses-service"

interface MobileQuizCardProps {
  course: Course
  className?: string
}

export function MobileQuizCard({ course, className }: MobileQuizCardProps) {
  return (
    <Card className={`bg-gray-800 border-gray-700 hover:border-[#DDA92C] transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center text-white text-sm">
            <FileText className="mr-2 h-4 w-4 text-[#DDA92C]" />
            <span className="line-clamp-2">{course.title}</span>
          </CardTitle>
          <Badge className="bg-[#DDA92C] text-gray-900 text-xs ml-2 shrink-0">Examen</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-gray-400 text-xs line-clamp-2">{course.description}</p>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Sin límite</span>
          </div>
          <div className="flex items-center">
            <Award className="h-3 w-3 mr-1" />
            <span>70%</span>
          </div>
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            <span>{course.ratings.total_reviews}</span>
          </div>
        </div>

        <Link href={`/quiz/${course.id}`} className="block">
          <Button size="sm" className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium text-xs">
            <FileText className="mr-2 h-3 w-3" />
            Tomar Examen
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
