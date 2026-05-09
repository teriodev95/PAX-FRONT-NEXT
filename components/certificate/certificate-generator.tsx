"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { coursesService } from "@/services/courses-service"
import { useAuth } from "@/lib/auth-context"
import { downloadCertificateFromTemplate } from "./download-certificate"
import { useBrand } from "@/lib/use-brand"

interface CertificateGeneratorProps {
  courseTitle: string
  courseId: string
  score?: number
}

export function CertificateGenerator({ courseTitle, courseId, score }: CertificateGeneratorProps) {
  const { user } = useAuth()
  const brand = useBrand()
  const [isGenerating, setIsGenerating] = useState(false)
  const scoreLabel = typeof score === "number" && Number.isFinite(score)
    ? `${Math.round(score)}%`
    : null

  const generateCertificate = async () => {
    if (!user) return

    setIsGenerating(true)
    try {
      const configResponse = await coursesService.getCertificateConfig()
      const config = configResponse.message.certificate
      
      // Prepare certificate data
      const fullName = `${user.nombre || ""} ${user.apellido_paterno || ""} ${user.apellido_materno || ""}`.trim()
      const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      
      // Generate certificate using the template
      const userId = (user as any).id
      const certificateId = `CERT-${userId?.slice(0, 8)}-${courseId.slice(0, 8)}`
      
      // URL de producción para verificación de certificados (siempre apunta a producción)
      const PRODUCTION_URL = "https://pax-front.xpress1.cc"

      // Crear URL con parámetros codificados
      const queryParams = new URLSearchParams({
        userName: fullName || "Nombre del Participante",
        courseName: courseTitle,
        ...(score !== undefined && { score: score.toString() })
      }).toString()

      await downloadCertificateFromTemplate({
        recipientName: fullName || "Nombre del Participante",
        courseName: courseTitle,
        completionDate: currentDate,
        coordinatorName: config.issued_by || "PAX Learning",
        coordinatorTitle: "Coordinador",
        certificateType: "CERTIFICADO DE RECONOCIMIENTO",
        certificateId: certificateId,
        verificationUrl: `${PRODUCTION_URL}/verify/${userId}/${courseId}?${queryParams}`,
        fileName: `certificado-${courseId}-${user.Usuario}.pdf`,
        score: score,
        brand,
      })
    } catch (error) {
      console.error("Error generando certificado:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-2">¡Felicitaciones!</h3>
      <p className="text-gray-300 mb-4">
        Has completado exitosamente el curso
        {scoreLabel ? ` con una calificación de ${scoreLabel}` : ""}. Descarga tu certificado.
      </p>
      <Button
        onClick={generateCertificate}
        disabled={isGenerating}
        className="font-medium"
        style={{ backgroundColor: brand.accent, color: brand.onAccent }}
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? "Generando..." : "Descargar Certificado"}
      </Button>
    </div>
  )
}
