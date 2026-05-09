"use client"

import type { Course } from "@/services/courses-service"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Play, BookOpen, FileText, Lock, Award } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useBrand } from "@/lib/use-brand"

interface MobileCourseCardProps {
  course: Course
  isEnrolled?: boolean
  progress?: number
  examAprobado?: boolean
  puntajeExamen?: string
  onEnrollmentChange?: () => void
}

export function MobileCourseCard({ course, isEnrolled = false, progress = 0, examAprobado = false, puntajeExamen, onEnrollmentChange }: MobileCourseCardProps) {
  const router = useRouter()
  const brand = useBrand()
  const enrolled = isEnrolled
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
    <Card
      className="bg-gray-800/80 border border-gray-700/60 hover:border-gray-600 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={(e) => {
        if (enrolled) {
          router.push(`/course/${course.id}`)
        } else {
          e.preventDefault()
        }
      }}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1/1" }}>
        <Image
          src={course.portada || "/placeholder.svg?height=400&width=400"}
          alt={course.titulo || "Imagen del curso"}
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />

        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getLevelColor(course.nivel)} border text-xs px-2 py-0.5`}>
            {course.nivel || "Sin nivel"}
          </Badge>
        </div>

        {/* Enrolled/Completed indicator */}
        {enrolled && (
          <div className="absolute top-3 right-3">
            {examAprobado ? (
              <Badge
                className="border-0 text-xs px-2 py-0.5 font-semibold"
                style={{ backgroundColor: brand.accent, color: brand.onAccent }}
              >
                <Award className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            ) : (
              <Badge className="bg-green-600/90 text-white border-0 text-xs px-2 py-0.5">
                Inscrito
              </Badge>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-base text-white mb-1.5 line-clamp-2 leading-snug">
              {course.titulo || "Título no disponible"}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {course.descripcion || "Descripción no disponible"}
            </p>
          </div>

          {/* Course stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.duracionVideoMinutos || 0} min</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{course.totalClases || 0} clases</span>
            </div>
          </div>

          {/* Progress bar */}
          {isEnrolled && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progreso</span>
                <span className="text-primary-accent font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    backgroundColor: brand.accent,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-1">
            {enrolled ? (
              <div className={progress >= 100 ? "grid grid-cols-2 gap-2" : ""}>
                <Button
                  size="sm"
                  className="w-full font-medium text-xs h-8"
                  style={{ backgroundColor: brand.accent, color: brand.onAccent }}
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/course/${course.id}`)
                  }}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  {examAprobado ? "Revisar" : "Continuar"}
                </Button>
                {progress >= 100 && (
                  examAprobado ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent text-xs h-8"
                      style={{ borderColor: brand.accent, color: brand.accent }}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/certificate/${course.id}`)
                      }}
                    >
                      <Award className="mr-1.5 h-3.5 w-3.5" />
                      Certificado
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/quiz/${course.id}`)
                      }}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Examen
                    </Button>
                  )
                )}
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full bg-transparent hover:bg-gray-700 text-white font-medium text-xs border border-gray-600 h-8"
                onClick={(e) => e.stopPropagation()}
                disabled
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Requiere asignación
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
