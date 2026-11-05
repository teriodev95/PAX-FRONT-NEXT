"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ENLACE_SIN_CONEXION } from "@/services/auth-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, Link2Off, Loader2 } from "lucide-react"

const MENSAJE_INVALIDO = "Este enlace ya no es válido. Pide uno nuevo a tu gerente."
const MENSAJE_SIN_CONEXION = "No pudimos validar el enlace. Revisa tu conexión y vuelve a abrirlo."

// Acceso directo sin PIN con el enlace de MOX: /acceso#t=pax1.…
export default function AccesoPage() {
  const { loginWithLink, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const iniciado = useRef(false)

  useEffect(() => {
    // Espera a que AuthProvider termine de restaurar una sesión previa.
    if (isLoading || iniciado.current) return
    iniciado.current = true

    const token = new URLSearchParams(window.location.hash.slice(1)).get("t")
    // El token no se queda en la barra de direcciones ni en el historial.
    window.history.replaceState(null, "", window.location.pathname)

    if (!token) {
      setError(MENSAJE_INVALIDO)
      return
    }

    loginWithLink(token)
      .then(() => router.replace("/home"))
      .catch((e: Error) => setError(e?.message === ENLACE_SIN_CONEXION ? MENSAJE_SIN_CONEXION : MENSAJE_INVALIDO))
  }, [isLoading, loginWithLink, router])

  return (
    <div className="min-h-dvh bg-gray-950 px-5 py-8 text-white">
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[380px] flex-col justify-center">
        <section className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <GraduationCap className="h-7 w-7 text-gray-100" />
          </div>
          <h1 className="text-[28px] font-bold leading-none tracking-tight">PAX LMS</h1>
        </section>

        <Card className="rounded-3xl border-gray-800 bg-gray-900 shadow-2xl shadow-black/20">
          <CardContent className="p-5 text-center sm:p-6">
            {error ? (
              <div className="space-y-5" role="alert">
                <Link2Off className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-balance text-base leading-6 text-gray-100">{error}</p>
                <Button
                  onClick={() => router.replace("/login")}
                  className="h-12 w-full rounded-xl bg-gray-100 font-semibold text-gray-950 hover:bg-white"
                >
                  Ir a iniciar sesión
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2 text-gray-300" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Validando tu enlace…</span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
