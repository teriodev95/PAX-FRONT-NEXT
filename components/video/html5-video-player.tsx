"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";

interface HTML5VideoPlayerProps {
  src: string;
  title?: string;
  description?: string;
  autoPlay?: boolean;
  showHeader?: boolean;
  onEnded?: () => void;
  onComplete?: () => void;
  onProgress?: (currentTime: number, duration: number, percentage: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function HTML5VideoPlayer({
  src,
  autoPlay = false,
  onEnded,
  onComplete,
  onProgress,
}: HTML5VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const callbacksRef = useRef({ onEnded, onComplete, onProgress });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onEnded, onComplete, onProgress };
  }, [onEnded, onComplete, onProgress]);

  // Reset on src change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    completedRef.current = false;
    setHasError(false);
    setErrorMessage("");
    setCurrentTime(0);
    setDuration(0);
    setBufferedEnd(0);
    video.load();
  }, [src]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlay && video.paused) video.play().catch(() => undefined);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      callbacksRef.current.onEnded?.();
      if (!completedRef.current) {
        completedRef.current = true;
        callbacksRef.current.onComplete?.();
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration > 0) {
        const pct = (video.currentTime / video.duration) * 100;
        callbacksRef.current.onProgress?.(video.currentTime, video.duration, pct);
        if (pct >= 90 && !completedRef.current) {
          completedRef.current = true;
          callbacksRef.current.onComplete?.();
        }
      }
    };
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const handleRateChange = () => setPlaybackRate(video.playbackRate);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
      const e = video.error;
      let message = "Error desconocido en el reproductor";
      if (e) {
        switch (e.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = "Reproducción abortada por el usuario";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = "Error de red: no se pudo cargar el video";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = "Error al decodificar el video";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = "Formato no soportado";
            break;
          default:
            message = `Error: ${e.message || "desconocido"}`;
        }
      }
      setErrorMessage(message);
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ratechange", handleRateChange);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ratechange", handleRateChange);
      video.removeEventListener("error", handleError);
    };
  }, [src, autoPlay]);

  // Fullscreen state sync
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Auto-hide controls on idle while playing
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !showSpeedMenu) {
        setControlsVisible(false);
      }
    }, 2500);
  }, [showSpeedMenu]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (!isPlaying) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setControlsVisible(true);
    } else {
      scheduleHide();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, scheduleHide]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        if (video.paused) video.play().catch(() => undefined);
        else video.pause();
      } else if (e.key === "ArrowLeft" || e.key === "j") {
        video.currentTime = Math.max(0, video.currentTime - 15);
        showControls();
      } else if (e.key === "ArrowRight" || e.key === "l") {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 15);
        showControls();
      } else if (e.key === "m") {
        video.muted = !video.muted;
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  };

  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    showControls();
  };

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const value = Number(e.target.value);
    v.currentTime = (value / 100) * duration;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const onVolumeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const value = Number(e.target.value) / 100;
    v.volume = value;
    v.muted = value === 0;
  };

  const setSpeed = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage("");
    setIsLoading(true);
    videoRef.current?.load();
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-gray-900/80 border border-gray-700 p-8 text-center aspect-video">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div>
          <p className="font-semibold text-white">Error en el reproductor</p>
          <p className="mt-1 text-sm text-gray-400">{errorMessage}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-accent px-4 py-2 text-sm font-medium text-gray-900 hover:opacity-90"
          >
            <Play className="h-4 w-4" /> Reintentar
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            <ExternalLink className="h-4 w-4" /> Abrir en pestaña
          </a>
        </div>
      </div>
    );
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="group relative w-full overflow-hidden bg-black md:rounded-2xl aspect-video select-none"
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      onTouchStart={showControls}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full"
        autoPlay={autoPlay}
        preload="metadata"
        controlsList="nodownload"
        playsInline
        onClick={togglePlay}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {/* Center play overlay when paused */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200"
          aria-label="Reproducir"
        >
          <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary-accent text-gray-900 shadow-2xl transition-transform hover:scale-105">
            <Play className="h-7 w-7 md:h-9 md:w-9 ml-1" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 transition-opacity duration-200 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pt-12 pb-3 md:px-5 md:pb-4">
          {/* Scrubber */}
          <div className="relative h-1.5 mb-3 group/seek">
            <div className="absolute inset-0 rounded-full bg-white/15" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary-accent"
              style={{ width: `${progressPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPct}
              onChange={onScrub}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-accent [&::-webkit-slider-thumb]:opacity-0 group-hover/seek:[&::-webkit-slider-thumb]:opacity-100 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-accent"
              aria-label="Progreso del video"
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-2 md:gap-3 text-white">
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition"
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
            </button>

            <button
              onClick={() => seek(-15)}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition"
              aria-label="Retroceder 15 segundos"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => seek(15)}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition"
              aria-label="Avanzar 15 segundos"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume (desktop) */}
            <div className="hidden md:flex items-center gap-1 group/vol">
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition"
                aria-label={muted ? "Activar sonido" : "Silenciar"}
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume * 100}
                onChange={onVolumeInput}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 h-1 cursor-pointer appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                aria-label="Volumen"
              />
            </div>

            {/* Time */}
            <div className="text-xs md:text-sm tabular-nums text-white/80 ml-1">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
            </div>

            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((s) => !s)}
                className="flex h-9 min-w-[44px] items-center justify-center rounded-full px-2 text-xs font-medium hover:bg-white/10 transition"
                aria-label="Velocidad"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 min-w-[88px] rounded-lg border border-white/10 bg-gray-900/95 p-1 text-sm shadow-xl backdrop-blur"
                  onMouseLeave={() => setShowSpeedMenu(false)}
                >
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`block w-full rounded-md px-3 py-1.5 text-left transition ${
                        s === playbackRate
                          ? "bg-primary-accent/20 text-primary-accent"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mute toggle (mobile only — without slider) */}
            <button
              onClick={toggleMute}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
            >
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition"
              aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
