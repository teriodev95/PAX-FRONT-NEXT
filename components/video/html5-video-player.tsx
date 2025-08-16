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
  onEnded?: () => void
  onComplete?: () => void
  onProgress?: (currentTime: number, duration: number, percentage: number) => void
}

export function HTML5VideoPlayer({ src, title, description, autoPlay = false, onEnded, onComplete, onProgress }: HTML5VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const [watchedPercentage, setWatchedPercentage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  console.log('🎬 HTML5VideoPlayer renderizado:', {
    src,
    title,
    autoPlay,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    console.log('🔄 useEffect del video ejecutado - src cambió:', src)
    const video = videoRef.current
    if (!video) {
      console.log('⚠️ Referencia al video no disponible')
      return
    }

    // Forzar la carga del nuevo video cuando cambia el src
    console.log('🔄 Recargando video con nueva URL:', src)
    video.load()

    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }

    const handleCanPlay = () => {
      console.log('✅ Video listo para reproducir:', src)
      setIsLoading(false)
      // Auto reproducir si está habilitado
      if (autoPlay && video.paused) {
        console.log('🎬 Intentando autoplay...')
        video.play().catch(err => {
          console.log('Autoplay bloqueado:', err)
        })
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
      setIsCompleted(true)
      setWatchedPercentage(100)
      setIsPlaying(false)
      onEnded?.()
      onComplete?.()
    }

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        const percentage = (video.currentTime / video.duration) * 100
        setWatchedPercentage(Math.round(percentage))
        
        // Llamar callback de progreso
        onProgress?.(video.currentTime, video.duration, percentage)
        
        // Marcar como completado si vio 90% o más
        if (percentage >= 90 && !isCompleted) {
          setIsCompleted(true)
          onComplete?.()
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
      console.log('🧹 Limpiando event listeners del video')
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('error', handleError)
    }
  }, [src, onEnded, onComplete, onProgress, isCompleted])

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
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
            Error en el reproductor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="bg-red-900 border-red-700">
            <AlertDescription className="text-red-300">
              <strong>Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRetry}
              className="flex-1 bg-[#DDA92C] hover:bg-[#c49625] text-gray-900"
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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>{title}</span>
          {isCompleted && (
            <div className="flex items-center text-[#DDA92C]">
              <CheckCircle className="mr-1 h-5 w-5" />
              <span className="text-sm">Completado</span>
            </div>
          )}
        </CardTitle>
        {description && (
          <p className="text-gray-400 text-sm">{description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Spinner de carga */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#DDA92C]" />
                <p className="text-gray-300 text-sm">Cargando video...</p>
              </div>
            </div>
          )}
          
          {/* Video element */}
          <video
            key={src}
            ref={videoRef}
            className="w-full h-auto rounded-lg bg-black"
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
              <a href={src} target="_blank" rel="noopener noreferrer" className="text-[#DDA92C] underline ml-1">
                Haz clic aquí para ver el video directamente.
              </a>
            </p>
          </video>
        </div>
        
        {/* Progress indicator */}
        {watchedPercentage > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progreso</span>
              <span>{watchedPercentage}% visto</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#DDA92C] h-2 rounded-full transition-all duration-300"
                style={{ width: `${watchedPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Video status indicator */}
        {isPlaying && (
          <div className="mt-2 flex items-center text-sm text-[#DDA92C]">
            <div className="w-2 h-2 bg-[#DDA92C] rounded-full mr-2 animate-pulse" />
            Reproduciendo...
          </div>
        )}
      </CardContent>
    </Card>
  )
}