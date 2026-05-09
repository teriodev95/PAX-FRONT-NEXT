"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, ExternalLink, Play } from "lucide-react"

interface HTML5VideoPlayerProps {
  src: string
  title: string
  description?: string
  autoPlay?: boolean
  showHeader?: boolean
  onEnded?: () => void
  onComplete?: () => void
  onProgress?: (currentTime: number, duration: number, percentage: number) => void
}

export function HTML5VideoPlayer({ src, title, description, autoPlay = false, showHeader = true, onEnded, onComplete, onProgress }: HTML5VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const completedRef = useRef(false)
  const callbacksRef = useRef({ onEnded, onComplete, onProgress })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const [watchedPercentage, setWatchedPercentage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    callbacksRef.current = { onEnded, onComplete, onProgress }
  }, [onEnded, onComplete, onProgress])

  // useEffect para recargar el video SOLO cuando cambia el src
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    // Resetear estado cuando cambia el video
    completedRef.current = false
    setIsCompleted(false)
    setWatchedPercentage(0)
    setHasError(false)
    setErrorMessage("")
    
    // Forzar la carga del nuevo video cuando cambia el src
    video.load()
  }, [src]) // Solo depende de src

  // useEffect separado para los event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      // Auto reproducir si está habilitado
      if (autoPlay && video.paused) {
        video.play().catch(() => undefined)
      }
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      callbacksRef.current.onEnded?.()

      if (!completedRef.current) {
        completedRef.current = true
        setIsCompleted(true)
        setWatchedPercentage(100)
        callbacksRef.current.onComplete?.()
      }
    }

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        const percentage = (video.currentTime / video.duration) * 100
        setWatchedPercentage(Math.round(percentage))
        
        // Llamar callback de progreso
        callbacksRef.current.onProgress?.(video.currentTime, video.duration, percentage)
        
        // Marcar como completado si vio 90% o más
        if (percentage >= 90 && !completedRef.current) {
          completedRef.current = true
          setIsCompleted(true)
          callbacksRef.current.onComplete?.()
        }
      }
    }

    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
      setIsPlaying(false)
      
      const error = video.error
      let message = "Error desconocido en el reproductor"
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = "Reproducción abortada por el usuario"
            break
          case MediaError.MEDIA_ERR_NETWORK:
            message = "Error de red: No se pudo cargar el video"
            break
          case MediaError.MEDIA_ERR_DECODE:
            message = "Error de decodificación: No se pudo decodificar el video"
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = "Formato no soportado: La fuente de video no es válida"
            break
          default:
            message = `Error del reproductor: ${error.message || 'Error desconocido'}`
        }
      }
      
      setErrorMessage(message)
    }

    // Event listeners
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('error', handleError)

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('error', handleError)
    }
  }, [src, autoPlay])

  const handleRetry = () => {
    setHasError(false)
    setErrorMessage("")
    setIsLoading(true)
    
    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  const handleOpenExternally = () => {
    window.open(src, '_blank')
  }

  if (hasError) {
    return (
      <Card className="rounded-2xl bg-gray-800 border-gray-700">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-white flex items-center text-lg">
            <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
            Error en el reproductor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-2">
          <Alert variant="destructive" className="bg-red-900 border-red-700">
            <AlertDescription className="text-red-300">
              <strong>Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRetry}
              className="flex-1 bg-primary-accent hover:bg-primary-accent text-gray-900"
            >
              <Play className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button 
              onClick={handleOpenExternally}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir en nueva pestaña
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const playerContent = (
    <div className={showHeader ? "p-5 pt-0" : ""}>
        <div className="relative">
          {/* Spinner de carga */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-950/75 flex items-center justify-center z-10 rounded-xl">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-accent" />
                <p className="text-gray-300 text-sm">Cargando video...</p>
              </div>
            </div>
          )}
          
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full h-auto rounded-xl bg-black"
            controls
            autoPlay={autoPlay}
            preload="metadata"
            controlsList="nodownload"
            style={{
              maxHeight: '70vh',
              aspectRatio: '16/9'
            }}
          >
            <source src={src} type="video/mp4" />
            <p className="text-gray-300 p-4">
              Tu navegador no soporta el elemento video. 
              <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary-accent underline ml-1">
                Haz clic aquí para ver el video directamente.
              </a>
            </p>
          </video>
        </div>
        
        {/* Progress indicator */}
        {watchedPercentage > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progreso</span>
              <span>{watchedPercentage}% visto</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-primary-accent h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${watchedPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Video status indicator */}
        {isPlaying && (
          <div className="mt-3 flex items-center text-sm text-primary-accent">
            <div className="w-2 h-2 bg-primary-accent rounded-full mr-2 animate-pulse" />
            Reproduciendo...
          </div>
        )}
      </div>
  )

  if (!showHeader) {
    return playerContent
  }

  return (
    <Card className="rounded-2xl bg-gray-800 border-gray-700">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-white flex items-start justify-between gap-3 text-xl leading-7">
          <span className="min-w-0">{title}</span>
          {isCompleted && (
            <div className="flex items-center text-primary-accent shrink-0 pt-1">
              <CheckCircle className="mr-1 h-4 w-4" />
              <span className="text-xs font-medium">Completado</span>
            </div>
          )}
        </CardTitle>
        {description && (
          <p className="text-gray-400 text-sm leading-6">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {playerContent}
      </CardContent>
    </Card>
  )
}
