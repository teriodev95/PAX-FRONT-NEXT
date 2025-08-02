"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { coursesService } from "@/services/courses-service"
import { useAuth } from "@/lib/auth-context"
import jsPDF from "jspdf"

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

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // Configurar fuentes y colores
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, 297, 210, "F")

      // Borde decorativo
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(2)
      pdf.rect(10, 10, 277, 190)
      pdf.setLineWidth(1)
      pdf.rect(15, 15, 267, 180)

      // Título principal
      pdf.setFontSize(32)
      pdf.setFont("helvetica", "bold")
      pdf.text("CERTIFICADO DE FINALIZACIÓN", 148.5, 50, { align: "center" })

      // Subtítulo
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "normal")
      pdf.text("Se certifica que", 148.5, 70, { align: "center" })

      // Nombre del usuario
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      const fullName = `${user.nombre || ""} ${user.apellido_paterno || ""} ${user.apellido_materno || ""}`.trim()
      pdf.text(fullName, 148.5, 90, { align: "center" })

      // Texto del curso
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "normal")
      pdf.text("ha completado satisfactoriamente el curso", 148.5, 110, { align: "center" })

      // Nombre del curso
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text(courseTitle, 148.5, 130, { align: "center" })

      // Fecha
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "normal")
      const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      pdf.text(`Fecha de emisión: ${currentDate}`, 148.5, 150, { align: "center" })

      // Información de emisión
      pdf.setFontSize(12)
      pdf.text(config.issued_by, 60, 175, { align: "center" })
      pdf.text("Organización", 60, 185, { align: "center" })

      // ID del certificado
      pdf.text(`ID: ${config.id}`, 237, 175, { align: "center" })
      pdf.text("Verificación", 237, 185, { align: "center" })

      // Descargar el PDF
      pdf.save(`certificado-${courseId}-${user.Usuario}.pdf`)
    } catch (error) {
      console.error("Error generando certificado:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-xl font-bold text-green-800 mb-2">¡Felicitaciones!</h3>
      <p className="text-green-700 mb-4">Has completado exitosamente el curso. Descarga tu certificado.</p>
      <Button onClick={generateCertificate} disabled={isGenerating} className="bg-green-600 hover:bg-green-700">
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? "Generando..." : "Descargar Certificado"}
      </Button>
    </div>
  )
}
