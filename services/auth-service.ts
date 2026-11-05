import axios from "axios";
import { sessionsService } from "./sessions-service";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://elysia.xpress1.cc";

/** Errores de `loginWithLink` que la pantalla /acceso distingue. */
export const ENLACE_INVALIDO = "ENLACE_INVALIDO";
export const ENLACE_SIN_CONEXION = "ENLACE_SIN_CONEXION";

type Empresa = "xpress" | "gocash";

interface LoginUserResponse {
  UsuarioID: number;
  Nombre: string;
  Apellido_Paterno: string;
  Apellido_Materno: string;
  Tipo: string;
  Usuario: string;
  Gerencia: string;
  Agencia: string;
  sucursales: string[];
  empresa?: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: LoginUserResponse;
}

interface PaxMeResponse {
  success: boolean;
  user: LoginUserResponse;
}

export interface User {
  id: string; // UUID generado
  UsuarioID: number; // ID numérico original del backend
  Usuario: string; // Usuario en mayúsculas original
  usuario: string; // Usuario en minúsculas
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  tipo: string;
  rol: string; // Alias de tipo para compatibilidad
  gerencia: string;
  Gerencia: string; // Mantener formato original también
  agencia: string;
  Agencia: string; // Mantener formato original también
  sucursales: string[];
  empresa: Empresa;
  activo: boolean;
}

export const normalizeEmpresa = (empresa?: string | null): Empresa => {
  return empresa?.trim().toLowerCase() === "gocash" ? "gocash" : "xpress";
};

export const transformAuthUser = (user: LoginUserResponse): User => {
  const userUuid = authService.generateUuidFromId(user.UsuarioID);

  return {
    id: userUuid,
    UsuarioID: user.UsuarioID,
    Usuario: user.Usuario,
    usuario: user.Usuario.toLowerCase(),
    nombre: user.Nombre,
    apellido_paterno: user.Apellido_Paterno,
    apellido_materno: user.Apellido_Materno,
    tipo: user.Tipo,
    rol: user.Tipo,
    gerencia: user.Gerencia,
    Gerencia: user.Gerencia,
    agencia: user.Agencia,
    Agencia: user.Agencia,
    sucursales: user.sucursales,
    empresa: normalizeEmpresa(user.empresa),
    activo: true,
  };
};

type PaxLoginResult = {
  success: boolean;
  token: string;
  user: User;
  sessionToken: string;
  authToken: string;
};

// Crea la sesión PAX a partir de la respuesta de Elysia (PIN o enlace).
const crearSesionPax = async ({ success, token, user }: LoginResponse): Promise<PaxLoginResult> => {
  if (!success || !token) {
    throw new Error("Error en la autenticación");
  }

  const transformedUser = transformAuthUser(user);
  const session = await sessionsService.createSession(transformedUser.id, {
    dispositivo: "web",
    navegador: sessionsService.getBrowserInfo(),
    sistemaOperativo: sessionsService.getOS(),
    empresa: transformedUser.empresa,
    ip: "unknown",
    ubicacion: "Unknown",
  });

  return {
    success,
    token: session.sessionToken,
    sessionToken: session.sessionToken,
    authToken: token, // pax1.* o token de Elysia: pax-me lo revalida (baja/cambio de PIN)
    user: transformedUser,
  };
};

export const authService = {
  // Acceso sin PIN con el enlace que genera MOX (#t=pax1.…).
  async loginWithLink(linkToken: string): Promise<PaxLoginResult> {
    let data: LoginResponse;
    try {
      const response = await axios.post<LoginResponse>(
        `${AUTH_BASE_URL}/api/auth/pax-enlace`,
        { token: linkToken },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      data = response.data;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      throw new Error(status && status >= 400 && status < 500 ? ENLACE_INVALIDO : ENLACE_SIN_CONEXION);
    }

    if (!data?.success || !data.token) {
      throw new Error(ENLACE_INVALIDO);
    }

    try {
      return await crearSesionPax(data);
    } catch {
      throw new Error(ENLACE_SIN_CONEXION);
    }
  },

  async login(
    usuario: string,
    pin: string
  ): Promise<{
    success: boolean;
    token: string;
    user: User;
    sessionToken: string;
    authToken: string;
  }> {
    try {
      // Paso 1: Autenticar con el servicio de auth
      const response = await axios.post<LoginResponse>(
        `${AUTH_BASE_URL}/api/auth/pax-login`,
        {
          usuario,
          pin: pin,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
        }
      );

      // Paso 2: Crear sesión en el backend PAX
      return await crearSesionPax(response.data);
    } catch (error) {
      console.error("Error en login:", error);

      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        if (error.response?.status === 401) {
          throw new Error("Credenciales incorrectas");
        } else if (error.response?.status === 403) {
          throw new Error("Acceso denegado");
        }
      }

      throw new Error("Error de conexión con el servidor");
    }
  },

  async validateToken(sessionToken: string): Promise<boolean> {
    try {
      return await sessionsService.validateSession(sessionToken);
    } catch (error) {
      return false;
    }
  },

  async validatePaxAuthToken(authToken: string): Promise<boolean> {
    return (await this.getPaxAuthUser(authToken)) !== null;
  },

  async getPaxAuthUser(authToken: string): Promise<LoginUserResponse | null> {
    try {
      const response = await axios.get<PaxMeResponse>(
        `${AUTH_BASE_URL}/api/auth/pax-me`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );

      return response.data.success === true ? response.data.user : null;
    } catch (error) {
      return null;
    }
  },

  async logout(sessionToken: string): Promise<void> {
    try {
      await sessionsService.closeSession(sessionToken);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  },

  // Helper temporal para generar UUID desde ID numérico
  generateUuidFromId(id: number): string {
    // Generar un UUID v4 determinístico basado en el ID
    const pad = (num: number, size: number): string => {
      let s = num.toString(16);
      while (s.length < size) s = "0" + s;
      return s;
    };

    const hexId = pad(id, 8);
    return `${hexId}-0000-4000-8000-000000000000`;
  },
};
