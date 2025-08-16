import type { Course } from "@/services/courses-service"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Star, Users, Play, BookOpen, FileText, UserPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { coursesService } from "@/services/courses-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface MobileCourseCardProps {
  course: Course
  isEnrolled?: boolean
  progress?: number
  onEnrollmentChange?: () => void
}

export function MobileCourseCard({ course, isEnrolled = false, progress = 0, onEnrollmentChange }: MobileCourseCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
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

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para inscribirte",
        variant: "destructive"
      })
      return
    }

    setIsEnrolling(true)
    try {
      const userAny = user as any
      // Para inscripciones, usar el campo 'id' que es el UUID
      const userId = userAny.id // UUID: "000001ce-0000-4000-8000-000000000000"
      
      if (!userId) {
        throw new Error("No se encontró el ID del usuario")
      }
      
      await coursesService.enrollUserToCourse(userId, course.id)
      
      setEnrolled(true)
      toast({
        title: "¡Inscripción exitosa!",
        description: `Te has inscrito en el curso "${course.titulo}"`,
      })
      
      // Notificar al componente padre para actualizar la lista
      if (onEnrollmentChange) {
        onEnrollmentChange()
      }
    } catch (error) {
      console.error("Error al inscribirse:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la inscripción. Intenta de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <Card 
      className="bg-gray-800 border-gray-700 hover:border-[#DDA92C] transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => router.push(`/course/${course.id}`)}
    >
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

          {/* Progress bar - solo mostrar si está inscrito y hay progreso */}
          {isEnrolled && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[10px]">Progreso</span>
                <span className="text-[#DDA92C] font-medium text-xs">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-[#DDA92C] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 gap-2">
            {enrolled ? (
              <>
                <Button 
                  size="sm" 
                  className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/course/${course.id}`)
                  }}
                >
                  <Play className="mr-1 h-3 w-3" />
                  Comenzar curso
                </Button>
                {progress >= 100 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/quiz/${course.id}`)
                    }}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Tomar examen
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  size="sm"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium text-xs border border-gray-600"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <>
                      <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Inscribiendo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1 h-3 w-3" />
                      Inscribirse
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
