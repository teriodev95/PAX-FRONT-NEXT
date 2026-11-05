"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  authService,
  DEMASIADOS_INTENTOS,
  ENLACE_INVALIDO,
  PIN_INCORRECTO,
  type EnlaceError,
} from "@/services/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Link2Off, Loader2, Lock } from "lucide-react"

const TOKEN_KEY = "pax_enlace_token"
const MENSAJE_INVALIDO = "Este enlace ya no es válido. Pide uno nuevo a tu gerente."
const MENSAJE_SIN_CONEXION = "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."
const MENSAJE_DEMASIADOS = "Demasiados intentos. Espera 15 minutos."

const mensajePinIncorrecto = (restantes?: number) => {
  if (restantes === undefined) return "PIN incorrecto."
  if (restantes <= 0) return "PIN incorrecto. Ya no te quedan intentos; espera 15 minutos."
  return restantes === 1 ? "PIN incorrecto. Te queda 1 intento." : `PIN incorrecto. Te quedan ${restantes} intentos.`
}

// El token viaja en el hash; se guarda en sessionStorage para sobrevivir a una recarga
// y se quita de la barra de direcciones y del historial.
const leerToken = (): string | null => {
  const delHash = new URLSearchParams(window.location.hash.slice(1)).get("t")
  window.history.replaceState(null, "", window.location.pathname)
  try {
    if (delHash) sessionStorage.setItem(TOKEN_KEY, delHash)
    return delHash || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return delHash
  }
}

const olvidarToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {}
}

type Fallo = { mensaje: string; reintentable: boolean }

// Acceso con el enlace de MOX (/acceso#t=pax1.…) + PIN del usuario.
export default function AccesoPage() {
  const { loginWithLink, isLoading } = useAuth()
  const router = useRouter()
  const [nombre, setNombre] = useState<string | null>(null)
  const [fallo, setFallo] = useState<Fallo | null>(null)
  const [pin, setPin] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState("")
  const token = useRef<string | null>(null)
  const iniciado = useRef(false)
  const pinRef = useRef<HTMLInputElement>(null)

  const enlaceInvalido = () => {
    olvidarToken()
    setFallo({ mensaje: MENSAJE_INVALIDO, reintentable: false })
  }

  const cargarInfo = useCallback(() => {
    if (!token.current) {
      setFallo({ mensaje: MENSAJE_INVALIDO, reintentable: false })
      return
    }
    setFallo(null)
    authService
      .getLinkInfo(token.current)
      .then((info) => setNombre(info.nombre || info.usuario))
      .catch((e: EnlaceError) => {
        if (e.message === ENLACE_INVALIDO) {
          olvidarToken()
          setFallo({ mensaje: MENSAJE_INVALIDO, reintentable: false })
        } else {
          setFallo({ mensaje: e.message === DEMASIADOS_INTENTOS ? MENSAJE_DEMASIADOS : MENSAJE_SIN_CONEXION, reintentable: true })
        }
      })
  }, [])

  useEffect(() => {
    // Espera a que AuthProvider termine de restaurar una sesión previa.
    if (isLoading || iniciado.current) return
    iniciado.current = true
    token.current = leerToken()
    cargarInfo()
  }, [isLoading, cargarInfo])

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.current || pin.length !== 5 || enviando) return
    setEnviando(true)
    setAviso("")
    try {
      await loginWithLink(token.current, pin)
      olvidarToken()
      router.replace("/home")
    } catch (err) {
      const { message, intentosRestantes } = err as EnlaceError
      setEnviando(false)
      if (message === ENLACE_INVALIDO) return enlaceInvalido()
      if (message === PIN_INCORRECTO) {
        setPin("")
        pinRef.current?.focus()
      }
      setAviso(
        message === PIN_INCORRECTO
          ? mensajePinIncorrecto(intentosRestantes)
          : message === DEMASIADOS_INTENTOS
            ? MENSAJE_DEMASIADOS
            : MENSAJE_SIN_CONEXION
      )
    }
  }

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
          <CardContent className="p-5 sm:p-6">
            {fallo ? (
              <div className="space-y-5 text-center" role="alert">
                <Link2Off className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-balance text-base leading-6 text-gray-100">{fallo.mensaje}</p>
                <Button
                  onClick={() => (fallo.reintentable ? cargarInfo() : router.replace("/login"))}
                  className="h-12 w-full rounded-xl bg-gray-100 font-semibold text-gray-950 hover:bg-white"
                >
                  {fallo.reintentable ? "Reintentar" : "Ir a iniciar sesión"}
                </Button>
              </div>
            ) : nombre === null ? (
              <div className="flex items-center justify-center gap-3 py-2 text-gray-300" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Validando tu enlace…</span>
              </div>
            ) : (
              <form onSubmit={entrar} className="space-y-5">
                <div className="space-y-1 text-center">
                  <h2 className="break-words text-xl font-semibold leading-7">
                    {nombre ? `Hola, ${nombre}` : "Hola"}
                  </h2>
                  <label htmlFor="pin" className="block text-sm leading-6 text-gray-400">
                    Escribe tu PIN para entrar
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="pin"
                    ref={pinRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    maxLength={5}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    readOnly={enviando}
                    className="h-12 rounded-xl border-gray-700 bg-gray-800 pl-11 text-base text-white placeholder-gray-500 focus:border-gray-400"
                    placeholder="PIN de 5 dígitos"
                  />
                </div>
                {aviso && (
                  <Alert variant="destructive" className="border-red-700 bg-red-900">
                    <AlertDescription className="text-red-300">{aviso}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  disabled={pin.length !== 5 || enviando}
                  className="h-12 w-full rounded-xl bg-gray-100 font-semibold text-gray-950 hover:bg-white"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
