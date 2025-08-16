import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LMS Interno - Plataforma de Cursos",
  description: "Plataforma de aprendizaje interno para cursos corporativos",
  generator: 'HotDevs Sofftware Company',
  icons: {
    icon: '/dep_logo.svg',
    shortcut: '/dep_logo.svg',
    apple: '/dep_logo.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>

      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
