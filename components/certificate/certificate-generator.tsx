"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { coursesService } from "@/services/courses-service"
import { useAuth } from "@/lib/auth-context"
import { downloadCertificateFromTemplate } from "./download-certificate"

interface CertificateGeneratorProps {
  courseTitle: string
  courseId: string
}

export function CertificateGenerator({ courseTitle, courseId }: CertificateGeneratorProps) {
  const { user } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)

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
      
      // Crear URL con parámetros codificados
      const queryParams = new URLSearchParams({
        userName: fullName || "Nombre del Participante",
        courseName: courseTitle
      }).toString()
      
      await downloadCertificateFromTemplate({
        recipientName: fullName || "Nombre del Participante",
        courseName: courseTitle,
        completionDate: currentDate,
        coordinatorName: config.issued_by || "PAX Learning",
        coordinatorTitle: "Coordinador",
        certificateType: "CERTIFICADO DE RECONOCIMIENTO",
        certificateId: certificateId,
        verificationUrl: `${window.location.origin}/verify/${userId}/${courseId}?${queryParams}`,
        fileName: `certificado-${courseId}-${user.Usuario}.pdf`
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
      <p className="text-gray-300 mb-4">Has completado exitosamente el curso. Descarga tu certificado.</p>
      <Button onClick={generateCertificate} disabled={isGenerating} className="bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium">
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? "Generando..." : "Descargar Certificado"}
      </Button>
    </div>
  )
}
