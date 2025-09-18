"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
      <Card className="bg-gray-800 border-gray-700 max-w-md w-full animate-in fade-in-up duration-700 ease-out shadow-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Success Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-10"></div>
              <div className="relative bg-gradient-to-br from-green-600 to-green-700 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">¡Lección completada!</h3>
            <p className="text-gray-400 text-xs">
              Has completado: <span className="font-medium text-gray-300">{currentLessonTitle}</span>
            </p>
          </div>

          {/* Next Lesson Info */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3 space-y-2">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Siguiente lección</p>
              <p className="text-white text-sm font-medium">{nextLessonTitle}</p>
            </div>

            {/* Countdown Progress */}
            {!isPaused && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Reproducción automática</span>
                  <span className="text-[#DDA92C] font-bold">{countdown}s</span>
                </div>
                <div className="w-full bg-gray-600 bg-opacity-50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#DDA92C] to-[#c49625] h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${(countdown / autoPlayDelay) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isPaused ? (
              <>
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleContinue}
                  size="sm"
                  className="flex-1 bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium text-xs"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Continuar ahora
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent text-xs"
                >
                  Quedarse aquí
                </Button>
                <Button
                  onClick={handleContinue}
                  size="sm"
                  className="flex-1 bg-[#DDA92C] hover:bg-[#c49625] text-gray-900 font-medium text-xs"
                >
                  <ArrowRight className="mr-1 h-3 w-3" />
                  Ir a siguiente
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}