import type { Course } from "@/services/courses-service"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Star, Users, Play, BookOpen, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MobileCourseCardProps {
  course: Course
}

export function MobileCourseCard({ course }: MobileCourseCardProps) {
  const getLevelColor = (level: string | undefined) => {
    if (!level) return "bg-gray-700 text-gray-300 border-gray-600"
    
    switch (level.toLowerCase()) {
      case "principiante":
        return "bg-green-900 text-green-300 border-green-700"
      case "intermedio":
        return "bg-yellow-900 text-yellow-300 border-yellow-700"
      case "avanzado":
        return "bg-red-900 text-red-300 border-red-700"
      default:
        return "bg-gray-700 text-gray-300 border-gray-600"
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-[#DDA92C] transition-all duration-300 overflow-hidden">
      <div className="relative h-32 w-full overflow-hidden">
        <Image
          src={course.portada || course.cover || "/placeholder.svg?height=128&width=400"}
          alt={course.titulo || course.title || "Imagen del curso"}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

        {/* Level badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`${getLevelColor(course.nivel || course.level)} border text-xs px-2 py-1`}>
            {course.nivel || course.level || "Sin nivel"}
          </Badge>
        </div>

        {/* Rating */}
        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-80 rounded-md px-2 py-1">
          <div className="flex items-center text-xs">
            <Star className="h-3 w-3 mr-1 fill-[#DDA92C] text-[#DDA92C]" />
            <span className="text-white font-medium">
              {course.calificacionPromedio || "4.0"}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base text-white mb-1 line-clamp-2 leading-tight">
              {course.titulo || course.title || "Título no disponible"}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {course.descripcion || course.description || "Descripción no disponible"}
            </p>
          </div>

          {/* Course stats */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{course.duracionVideoMinutos || 0}min</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-3 w-3 mr-1" />
                <span>{course.totalClases || 0}</span>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>0</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Link href={`/course/${course.id}`} className="flex-1">
              <Button size="sm" className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium text-xs">
                <Play className="mr-1 h-3 w-3" />
                Ver curso
              </Button>
            </Link>
            <Link href={`/quiz/${course.id}`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent text-xs"
              >
                <FileText className="mr-1 h-3 w-3" />
                Examen
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
