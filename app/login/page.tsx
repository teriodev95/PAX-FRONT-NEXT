"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Loader2, Lock, User } from "lucide-react"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()
  const currentYear = new Date().getFullYear()

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
    <div className="min-h-dvh bg-gray-950 px-5 py-8 text-white">
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[380px] flex-col justify-center">
        <section className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <GraduationCap className="h-7 w-7 text-gray-100" />
          </div>
          <h1 className="mb-2 text-[28px] font-bold leading-none tracking-tight">PAX LMS</h1>
          <p className="text-balance text-sm leading-6 text-gray-400">
            Plataforma de aprendizaje para financieras
          </p>
        </section>

        <Card className="rounded-3xl border-gray-800 bg-gray-900 shadow-2xl shadow-black/20">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold leading-7">Iniciar sesión</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-sm font-semibold text-gray-200">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="username"
                    className="h-12 rounded-xl border-gray-700 bg-gray-800 pl-11 text-base text-white placeholder-gray-500 focus:border-gray-400"
                    placeholder="Tu usuario"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-semibold text-gray-200">
                  PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    inputMode="numeric"
                    className="h-12 rounded-xl border-gray-700 bg-gray-800 pl-11 text-base text-white placeholder-gray-500 focus:border-gray-400"
                    placeholder="Tu PIN"
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
                className="h-12 w-full rounded-xl bg-gray-100 font-semibold text-gray-950 hover:bg-white"
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

        <footer className="mt-7 text-center text-xs leading-5 text-gray-600">
          <p>© {currentYear} PAX LMS. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  )
}
