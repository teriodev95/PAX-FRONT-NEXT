import axios from "axios"

const API_BASE_URL = "https://pax-back.xpress1.cc"

export interface SessionData {
  dispositivo: string
  navegador?: string
  ip?: string
  ubicacion?: string
  sistemaOperativo?: string
}

export interface Session {
  id: string
  usuarioId: string
  sessionToken: string
  datosSesion: SessionData
  fechaExpiracion: string
  activa: boolean
}

export const sessionsService = {
  // Crear una nueva sesión
  async createSession(usuarioId: string, datosSesion?: SessionData): Promise<Session> {
    try {
      const sessionData: SessionData = datosSesion || {
        dispositivo: "web",
        navegador: sessionsService.getBrowserInfo(),
        ip: "unknown",
        sistemaOperativo: sessionsService.getOS(),
        ubicacion: "Unknown"
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/sesiones/`,
        {
          usuarioId,
          datosSesion: sessionData,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      return response.data.data
    } catch (error) {
      console.error("Error creando sesión:", error)
      throw error
    }
  },

  // Validar si una sesión está activa
  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/sesiones/validate/${sessionToken}`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      )

      return response.data.success === true
    } catch (error) {
      console.error("Error validando sesión:", error)
      return false
    }
  },

  // Cerrar sesión
  async closeSession(sessionToken: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/sesiones/${sessionToken}`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      )
    } catch (error) {
      console.error("Error cerrando sesión:", error)
      throw error
    }
  },

  // Obtener sesiones activas del usuario
  async getUserSessions(usuarioId: string, sessionToken: string): Promise<Session[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/sesiones/usuario/${usuarioId}`,
        {
          headers: {
            "Authorization": `Bearer ${sessionToken}`,
            "Accept": "application/json",
          },
        }
      )

      return response.data.data || []
    } catch (error) {
      console.error("Error obteniendo sesiones del usuario:", error)
      return []
    }
  },

  // Helper para detectar el sistema operativo
  getOS(): string {
    const userAgent = window.navigator.userAgent
    const platform = window.navigator.platform
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
    const iosPlatforms = ['iPhone', 'iPad', 'iPod']

    if (macosPlatforms.indexOf(platform) !== -1) {
      return 'macOS'
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      return 'iOS'
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      return 'Windows'
    } else if (/Android/.test(userAgent)) {
      return 'Android'
    } else if (/Linux/.test(platform)) {
      return 'Linux'
    }

    return 'Unknown OS'
  },

  // Helper para obtener información del navegador
  getBrowserInfo(): string {
    const userAgent = navigator.userAgent
    let browserName = 'Unknown'
    let browserVersion = 'Unknown'

    if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Firefox"
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Internet"
      browserVersion = userAgent.match(/SamsungBrowser\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
      browserName = "Opera"
      browserVersion = userAgent.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf("Trident") > -1) {
      browserName = "Internet Explorer"
      browserVersion = userAgent.match(/rv:(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Edge"
      browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Chrome"
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari"
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown'
    }

    return `${browserName} ${browserVersion}`
  }
}