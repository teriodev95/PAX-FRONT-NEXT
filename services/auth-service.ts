import axios from "axios"
import { sessionsService } from "./sessions-service"

const API_BASE_URL = "https://pax-back.xpress1.cc"
const AUTH_BASE_URL = "https://elysia.xpress1.cc"

interface LoginResponse {
  success: boolean
  token: string
  user: {
    UsuarioID: number
    Nombre: string
    Apellido_Paterno: string
    Apellido_Materno: string
    Tipo: string
    Usuario: string
    Gerencia: string
    Agencia: string
    sucursales: string[]
  }
}

export interface User {
  id: string // Convertiremos el UsuarioID a string UUID
  usuario: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  tipo: string
  gerencia: string
  agencia: string
  sucursales: string[]
  activo: boolean
}

export const authService = {
  async login(usuario: string, pin: string): Promise<{ success: boolean; token: string; user: User; sessionToken: string }> {
    try {
      // Paso 1: Autenticar con el servicio de auth
      const response = await axios.post<LoginResponse>(
        `${AUTH_BASE_URL}/api/auth/login`,
        {
          usuario,
          pin,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        },
      )

      const { success, token, user } = response.data
      
      if (!success || !token) {
        throw new Error("Error en la autenticación")
      }

      // Generar un UUID para el usuario basado en su ID numérico
      // Esto es temporal hasta que el backend devuelva UUIDs
      const userUuid = this.generateUuidFromId(user.UsuarioID)

      // Transformar la respuesta al formato esperado por el frontend
      const transformedUser: User = {
        id: userUuid,
        usuario: user.Usuario.toLowerCase(),
        nombre: user.Nombre,
        apellido_paterno: user.Apellido_Paterno,
        apellido_materno: user.Apellido_Materno,
        tipo: user.Tipo,
        gerencia: user.Gerencia,
        agencia: user.Agencia,
        sucursales: user.sucursales,
        activo: true,
      }

      // Paso 2: Crear sesión en el backend PAX
      const datosSesion = {
        dispositivo: "web",
        navegador: sessionsService.getBrowserInfo(),
        sistemaOperativo: sessionsService.getOS(),
        ip: "unknown", // El backend puede determinar la IP real
        ubicacion: "Unknown" // El backend puede determinar la ubicación
      }

      const session = await sessionsService.createSession(userUuid, datosSesion)

      return {
        success,
        token: session.sessionToken, // Usar el sessionToken del backend PAX
        sessionToken: session.sessionToken,
        user: transformedUser,
      }
    } catch (error) {
      console.error("Error en login:", error)
      
      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        })
        
        if (error.response?.status === 401) {
          throw new Error("Credenciales incorrectas")
        } else if (error.response?.status === 403) {
          throw new Error("Acceso denegado")
        }
      }
      
      throw new Error("Error de conexión con el servidor")
    }
  },

  async validateToken(sessionToken: string): Promise<boolean> {
    try {
      return await sessionsService.validateSession(sessionToken)
    } catch (error) {
      return false
    }
  },

  async logout(sessionToken: string): Promise<void> {
    try {
      await sessionsService.closeSession(sessionToken)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Helper temporal para generar UUID desde ID numérico
  generateUuidFromId(id: number): string {
    // Generar un UUID v4 determinístico basado en el ID
    const pad = (num: number, size: number): string => {
      let s = num.toString(16)
      while (s.length < size) s = "0" + s
      return s
    }

    const hexId = pad(id, 8)
    return `${hexId}-0000-4000-8000-000000000000`
  }
}