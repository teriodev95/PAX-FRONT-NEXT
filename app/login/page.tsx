"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock } from "lucide-react"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(usuario, pin)

    if (success) {
      router.push("/home")
    } else {
      setError("Credenciales incorrectas. Verifica tu usuario y PIN.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#DDA92C] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-900 font-bold text-2xl">L</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">LMS Interno</h1>
          <p className="text-gray-400">Plataforma de Aprendizaje Corporativo</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-white">Iniciar Sesión</CardTitle>
            <CardDescription className="text-gray-400">
              Ingresa tus credenciales para acceder a la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-gray-300">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#DDA92C]"
                    placeholder="Ingresa tu usuario"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-gray-300">
                  PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#DDA92C]"
                    placeholder="Ingresa tu PIN"
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="bg-red-900 border-red-700">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 LMS Interno. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
