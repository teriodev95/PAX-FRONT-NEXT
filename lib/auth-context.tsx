"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { authService, type User } from "@/services/auth-service"

interface AuthContextType {
  user: User | null
  token: string | null
  sessionToken: string | null
  login: (usuario: string, pin: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedToken = localStorage.getItem("lms_token")
    const savedSessionToken = localStorage.getItem("lms_session_token")
    const savedUser = localStorage.getItem("lms_user")

    if (savedSessionToken && savedUser) {
      // Validar sessionToken antes de restaurar sesión
      authService
        .validateToken(savedSessionToken)
        .then((isValid) => {
          if (isValid) {
            setToken(savedToken || savedSessionToken)
            setSessionToken(savedSessionToken)
            setUser(JSON.parse(savedUser))
          } else {
            // Token inválido, limpiar storage
            localStorage.removeItem("lms_token")
            localStorage.removeItem("lms_session_token")
            localStorage.removeItem("lms_user")
          }
        })
        .catch(() => {
          // Error validando token, limpiar storage
          localStorage.removeItem("lms_token")
          localStorage.removeItem("lms_session_token")
          localStorage.removeItem("lms_user")
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
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
    localStorage.removeItem("lms_token")
    localStorage.removeItem("lms_session_token")
    localStorage.removeItem("lms_user")
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