"use client"

import React from "react"
import { createRoot } from "react-dom/client"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import CertificateTemplate from "@/components/certificate/template-certificate"

export interface DownloadCertificateParams {
  recipientName: string
  courseName: string
  completionDate: string
  coordinatorName: string
  coordinatorTitle?: string
  certificateType?: string
  certificateId?: string
  verificationUrl?: string
  fileName?: string
}

export async function downloadCertificateFromTemplate(params: DownloadCertificateParams): Promise<void> {
  const container = document.createElement("div")
  // A4 landscape aspect ratio: 297mm x 210mm (1.414:1)
  // Set width to match A4 landscape proportions in pixels at 96 DPI
  const width = 2970 // Increased for better quality
  const height = 2100 // Maintains A4 landscape ratio
  
  container.style.position = "fixed"
  container.style.left = "-99999px"
  container.style.top = "0"
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.pointerEvents = "none"
  container.style.backgroundColor = "white"
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(
    <div style={{ 
      width: `${width}px`, 
      height: `${height}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "white"
    }}>
      <div style={{ width: "100%", height: "100%" }}>
        <CertificateTemplate {...params} />
      </div>
    </div>
  )

  // Wait longer for fonts and images to load
  await new Promise((r) => setTimeout(r, 500))

  const canvas = await html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 1, // Reduced scale since we're using larger dimensions
    logging: false,
    useCORS: true,
    width: width,
    height: height,
    windowWidth: width,
    windowHeight: height
  })

  const imgData = canvas.toDataURL("image/png", 1.0)
  
  // A4 landscape: 297 x 210 mm
  const pdf = new jsPDF({ 
    orientation: "landscape", 
    unit: "mm", 
    format: "a4" 
  })
  
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Add image to fill entire PDF page
  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "SLOW")
  pdf.save(params.fileName || `certificado-${Date.now()}.pdf`)

  root.unmount()
  container.remove()
}


