"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { authService, normalizeEmpresa, transformAuthUser, type User } from "@/services/auth-service"
import { applyBrandToDocument, getBrandByEmpresa } from "@/lib/brand-config"
import { sessionsService } from "@/services/sessions-service"

interface AuthContextType {
  user: User | null
  token: string | null
  sessionToken: string | null
  login: (usuario: string, pin: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const clearAuthStorage = () => {
  localStorage.removeItem("lms_token")
  localStorage.removeItem("lms_session_token")
  localStorage.removeItem("lms_auth_token")
  localStorage.removeItem("lms_user")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    applyBrandToDocument(getBrandByEmpresa(user?.empresa))
  }, [user?.empresa])

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedToken = localStorage.getItem("lms_token")
    const savedSessionToken = localStorage.getItem("lms_session_token")
    const savedAuthToken = localStorage.getItem("lms_auth_token")
    const savedUser = localStorage.getItem("lms_user")

    if (savedSessionToken && savedAuthToken && savedUser) {
      // Validar la sesión PAX y el token de Elysia antes de restaurar.
      Promise.all([
        sessionsService.getSessionValidation(savedSessionToken),
        authService.getPaxAuthUser(savedAuthToken),
      ])
        .then(async ([sessionValidation, authUser]) => {
          if (sessionValidation?.valid && authUser) {
            const parsedUser = JSON.parse(savedUser) as User
            
            // Migrar usuario antiguo si es necesario
            if (!parsedUser.UsuarioID && parsedUser.id) {
              // Si el usuario no tiene UsuarioID, intentar extraerlo del id
              // El id es un UUID que contiene el UsuarioID original
              const match = parsedUser.id.match(/(\d+)/)
              if (match) {
                parsedUser.UsuarioID = parseInt(match[1])
              }
            }

            const refreshedUser = {
              ...parsedUser,
              ...transformAuthUser(authUser),
              empresa: normalizeEmpresa(authUser.empresa || parsedUser.empresa),
            }

            let activeSessionToken = savedSessionToken
            const sessionEmpresa = normalizeEmpresa(sessionValidation.datosSesion?.empresa)
            const sessionUsuarioId = sessionValidation.usuarioId

            if (sessionEmpresa !== refreshedUser.empresa || sessionUsuarioId !== refreshedUser.id) {
              await authService.logout(savedSessionToken).catch(() => undefined)
              const newSession = await sessionsService.createSession(refreshedUser.id, {
                dispositivo: "web",
                navegador: sessionsService.getBrowserInfo(),
                sistemaOperativo: sessionsService.getOS(),
                empresa: refreshedUser.empresa,
                ip: "unknown",
                ubicacion: "Unknown",
              })
              activeSessionToken = newSession.sessionToken
            }
            
            localStorage.setItem("lms_user", JSON.stringify(refreshedUser))
            localStorage.setItem("lms_token", activeSessionToken)
            localStorage.setItem("lms_session_token", activeSessionToken)
            setToken(activeSessionToken)
            setSessionToken(activeSessionToken)
            setUser(refreshedUser)
          } else {
            clearAuthStorage()
          }
        })
        .catch(() => {
          clearAuthStorage()
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      clearAuthStorage()
      setIsLoading(false)
    }
  }, [])

  const login = async (usuario: string, pin: string): Promise<boolean> => {
    try {
      const response = await authService.login(usuario, pin)
      if (response.success) {
        setToken(response.token)
        setSessionToken(response.sessionToken)
        setUser(response.user)
        localStorage.setItem("lms_token", response.token)
        localStorage.setItem("lms_session_token", response.sessionToken)
        localStorage.setItem("lms_auth_token", response.authToken)
        localStorage.setItem("lms_user", JSON.stringify(response.user))
        return true
      }
      return false
    } catch (error) {
      console.error("Error en login:", error)
      return false
    }
  }

  const logout = async () => {
    // Cerrar sesión en el backend si hay un sessionToken
    if (sessionToken) {
      await authService.logout(sessionToken)
    }
    
    setUser(null)
    setToken(null)
    setSessionToken(null)
    clearAuthStorage()
  }

  return (
    <AuthContext.Provider value={{ user, token, sessionToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
