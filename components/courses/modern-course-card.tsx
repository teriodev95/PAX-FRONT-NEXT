"use client"

import type { Course } from "@/services/courses-service"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Play, BookOpen, FileText, Lock, Award } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useBrand } from "@/lib/use-brand"

interface ModernCourseCardProps {
  course: Course
  isEnrolled?: boolean
  progress?: number
  examAprobado?: boolean
  puntajeExamen?: string
  onEnrollmentChange?: () => void
}

export function ModernCourseCard({ course, isEnrolled = false, progress = 0, examAprobado = false, puntajeExamen, onEnrollmentChange }: ModernCourseCardProps) {
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
      className="bg-gray-800/80 border border-gray-700/60 hover:border-gray-600 transition-all duration-200 group overflow-hidden cursor-pointer"
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
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />

        {/* Play button overlay */}
        {enrolled && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300"
              style={{ backgroundColor: brand.accent }}
            >
              <Play className="h-6 w-6 ml-0.5" style={{ color: brand.onAccent }} />
            </div>
          </div>
        )}

        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getLevelColor(course.nivel)} border text-xs px-2.5 py-1 shadow-sm`}>
            {course.nivel || "Sin nivel"}
          </Badge>
        </div>

        {/* Enrolled/Completed indicator */}
        {enrolled && (
          <div className="absolute top-3 right-3">
            {examAprobado ? (
              <Badge
                className="border-0 text-xs px-2.5 py-1 shadow-sm font-semibold"
                style={{ backgroundColor: brand.accent, color: brand.onAccent }}
              >
                <Award className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            ) : (
              <Badge className="bg-green-600/90 text-white border-0 text-xs px-2.5 py-1 shadow-sm">
                Inscrito
              </Badge>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2 group-hover:text-[var(--brand-accent)] transition-colors leading-snug">
              {course.titulo || "Título no disponible"}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
              {course.descripcion || "Descripción no disponible"}
            </p>
          </div>

          {/* Course stats */}
          <div className="flex items-center gap-5 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{course.duracionVideoMinutos || 0} min</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{course.modulos?.length || 0} módulos</span>
            </div>
          </div>

          {/* Progress bar */}
          {isEnrolled && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500">Progreso</span>
                <span className="text-primary-accent">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    backgroundColor: brand.accent,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2">
            {enrolled ? (
              <div className={progress >= 100 ? "grid grid-cols-2 gap-3" : ""}>
                <Button
                  className="w-full font-semibold h-10 shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: brand.accent, color: brand.onAccent }}
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/course/${course.id}`)
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {examAprobado ? "Revisar" : "Continuar"}
                </Button>
                {progress >= 100 && (
                  examAprobado ? (
                    <Button
                      variant="outline"
                      className="w-full bg-transparent h-10"
                      style={{ borderColor: brand.accent, color: brand.accent }}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/certificate/${course.id}`)
                      }}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Certificado
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent h-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/quiz/${course.id}`)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Examen
                    </Button>
                  )
                )}
              </div>
            ) : (
              <Button
                className="w-full bg-gray-700/50 hover:bg-gray-700 text-white font-medium border border-gray-600/50 hover:border-gray-500 h-10 transition-all"
                onClick={(e) => e.stopPropagation()}
                disabled
              >
                <Lock className="mr-2 h-4 w-4" />
                Requiere asignación
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
