"use client"

export const runtime = 'edge'

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Award, Calendar, User, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { coursesService } from "@/services/courses-service"

interface VerificationResponse {
  success: boolean
  data?: {
    cursoCompleto: boolean
    message: string
    usuarioId: string
    inscripcion: {
      id: string
      usuarioId: string
      cursoId: string
      fechaInscripcion: string
      progresoPorcentaje: string
      activo: boolean
    }
  }
}

export default function VerifyCertificate() {
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params.userId as string
  const courseId = params.courseId as string
  
  // Obtener datos del QR desde los query params
  const userName = searchParams.get('userName') || ''
  const courseName = searchParams.get('courseName') || ''
  const score = searchParams.get('score') || ''
  
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        // Validar certificado usando el servicio
        const response = await coursesService.validateCertificate(userId, courseId)
        
        setVerification(response)
        
        // Si el certificado es válido, obtener información adicional
        if (response.success && response.data?.cursoCompleto) {
          try {
            // Obtener información del curso
            const courseData = await coursesService.getCourseById(courseId)
            setCourseInfo(courseData)
          } catch (err) {
            console.error("Error obteniendo información del curso:", err)
          }
        }
      } catch (err: any) {
        console.error("Error verificando certificado:", err)
        setError(err.message || "Error al verificar el certificado")
      } finally {
        setLoading(false)
      }
    }

    if (userId && courseId) {
      verifyCertificate()
    }
  }, [userId, courseId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-[#DDA92C] animate-spin mb-4" />
            <p className="text-gray-300 text-lg">Verificando certificado...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isValid = verification?.success && verification?.data?.cursoCompleto

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            {isValid ? (
              <div className="relative">
                <div className="absolute inset-0 bg-[#DDA92C] blur-xl opacity-50"></div>
                <Award className="h-20 w-20 text-[#DDA92C] relative" />
              </div>
            ) : (
              <XCircle className="h-20 w-20 text-red-500" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Verificación de Certificado
          </CardTitle>
          <Badge 
            className={`text-lg px-4 py-2 ${
              isValid 
                ? "bg-green-900/50 text-green-300 border-green-700" 
                : "bg-red-900/50 text-red-300 border-red-700"
            }`}
          >
            {isValid ? "CERTIFICADO VÁLIDO" : "CERTIFICADO NO VÁLIDO"}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isValid && verification?.data ? (
            <>
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <h3 className="text-xl font-semibold text-white">
                    {verification.data.message}
                  </h3>
                </div>
                
                <div className="grid gap-4 mt-6">
                  {/* Información del estudiante del QR */}
                  {userName && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-[#DDA92C] mt-1" />
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm">Estudiante</p>
                        <p className="text-white font-medium">{userName}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Información del curso del QR o del servicio */}
                  <div className="flex items-start space-x-3">
                    <BookOpen className="h-5 w-5 text-[#DDA92C] mt-1" />
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm">Curso completado</p>
                      <p className="text-white font-medium">
                        {courseName || (courseInfo && courseInfo.titulo) || "Curso"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Fecha de inscripción */}
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-[#DDA92C] mt-1" />
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm">Fecha de inscripción</p>
                      <p className="text-white font-medium">
                        {formatDate(verification.data.inscripcion.fechaInscripcion)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Calificación del examen si está disponible */}
                  {score && (
                    <div className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-[#DDA92C] mt-1" />
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm">Calificación del examen</p>
                        <p className="text-white font-medium text-lg">
                          <span className="text-[#DDA92C] font-bold">{score}%</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Progreso */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Progreso completado</span>
                      <span className="text-[#DDA92C] font-bold text-lg">
                        {verification.data.inscripcion.progresoPorcentaje}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#DDA92C] to-[#c49625] h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${parseFloat(verification.data.inscripcion.progresoPorcentaje)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
            </>
          ) : (
            <div className="bg-red-900/20 rounded-lg p-6 border border-red-900/50">
              <div className="flex items-center">
                <XCircle className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-300">
                    Certificado no encontrado
                  </h3>
                  <p className="text-gray-400 mt-1">
                    {error || "No se pudo verificar la validez de este certificado."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            Verificación realizada por PAX Learning
          </p>
        </div>
      </Card>
    </div>
  )
}