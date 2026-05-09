"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Play, X } from "lucide-react"

interface LessonTransitionProps {
  currentLessonTitle: string
  nextLessonTitle: string
  onContinue: () => void
  onCancel: () => void
  autoPlayDelay?: number // en segundos
}

export function LessonTransition({ 
  currentLessonTitle, 
  nextLessonTitle, 
  onContinue, 
  onCancel,
  autoPlayDelay = 5 
}: LessonTransitionProps) {
  const [countdown, setCountdown] = useState(autoPlayDelay)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused, countdown])

  useEffect(() => {
    if (countdown === 0 && !isPaused) {
      onContinue()
    }
  }, [countdown, isPaused, onContinue])

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleContinue = () => {
    onContinue()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <section className="w-full max-w-[440px] rounded-2xl border border-gray-700 bg-gray-800 p-6 text-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-accent/15">
              <CheckCircle className="h-7 w-7 text-primary-accent" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold leading-7 text-white">Lección completada</h3>
            <p className="text-sm leading-5 text-gray-400">
              Completaste <span className="font-semibold text-gray-200">{currentLessonTitle}</span>.
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-700/40 p-4">
            <div className="text-center">
              <p className="mb-1 text-xs text-gray-400">Siguiente lección</p>
              <p className="text-base font-semibold leading-6 text-white">{nextLessonTitle}</p>
            </div>

            {!isPaused && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Reproducción automática</span>
                  <span className="font-semibold text-primary-accent">{countdown}s</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-600/70">
                  <div 
                    className="h-full rounded-full bg-primary-accent transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${(countdown / autoPlayDelay) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {!isPaused ? (
              <>
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="h-12 rounded-xl border-gray-600 bg-transparent font-semibold text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleContinue}
                  className="h-12 rounded-xl bg-primary-accent font-semibold text-gray-900 hover:bg-primary-accent"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="h-12 rounded-xl border-gray-600 bg-transparent font-semibold text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Quedarse aquí
                </Button>
                <Button
                  onClick={handleContinue}
                  className="h-12 rounded-xl bg-primary-accent font-semibold text-gray-900 hover:bg-primary-accent"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Ir a siguiente
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
