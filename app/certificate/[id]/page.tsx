"use client"

export const runtime = 'edge'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { coursesService } from "@/services/courses-service"
import { CertificateGenerator } from "@/components/certificate/certificate-generator"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Award, Loader2 } from "lucide-react"

interface CertificateData {
  courseTitle: string
  courseId: string
  puntaje: string
  fechaAprobacion: string
}

export default function CertificatePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const courseId = params.id as string

  useEffect(() => {
    const fetchCertificateData = async () => {
      if (authLoading) return

      if (!user) {
        router.push("/login")
        return
      }

      try {
        setIsLoading(true)
        const userId = (user as any).id

        // Verificar si el usuario aprobó el examen
        const examResult = await coursesService.verificarExamenAprobado(userId, courseId)

        if (!examResult || !examResult.aprobado) {
          setError("No tienes un certificado disponible para este curso. Debes completar y aprobar el examen primero.")
          return
        }

        // Obtener información del curso
        const courseData = await coursesService.getCourseById(courseId)

        if (!courseData) {
          setError("No se encontró el curso solicitado.")
          return
        }

        setCertificateData({
          courseTitle: courseData.titulo,
          courseId: courseId,
          puntaje: examResult.puntaje || "0",
          fechaAprobacion: examResult.fechaAprobacion || new Date().toISOString()
        })
      } catch (err) {
        console.error("Error fetching certificate data:", err)
        setError("Ocurrió un error al cargar el certificado.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCertificateData()
  }, [user, authLoading, courseId, router])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#DDA92C] mx-auto mb-4" />
          <p className="text-gray-400">Cargando certificado...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Certificado no disponible</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  if (!certificateData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/home")}
            variant="ghost"
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Award className="h-8 w-8 text-[#DDA92C]" />
            <h1 className="text-2xl font-bold text-white">Tu Certificado</h1>
          </div>
          <p className="text-gray-400">
            Completaste exitosamente el curso <span className="text-white font-medium">{certificateData.courseTitle}</span>
          </p>
        </div>

        {/* Certificate Info Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Puntaje obtenido</p>
              <p className="text-2xl font-bold text-[#DDA92C]">{parseFloat(certificateData.puntaje).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha de aprobación</p>
              <p className="text-lg text-white">
                {new Date(certificateData.fechaAprobacion).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <CertificateGenerator
              courseTitle={certificateData.courseTitle}
              courseId={certificateData.courseId}
              score={parseFloat(certificateData.puntaje)}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500">
          <p>El certificado incluye un código QR de verificación que permite validar su autenticidad.</p>
        </div>
      </div>
    </div>
  )
}
