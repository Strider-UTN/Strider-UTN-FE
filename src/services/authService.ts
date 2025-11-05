import { CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { userTypeToEnum } from '../utils/userTypeUtils';
import { apiClient, setAuthToken, getAuthToken as getStoredAuthToken, clearAuthToken as clearStoredAuthToken } from './apiClient';

export interface GoogleLoginResponse {
  token: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
  userType: number; // 0 para Athlete, 1 para Coach
}

export interface EmailLoginResponse {
  token: string;
  user?: User; // Opcional: puede venir el usuario en la respuesta
}

export interface CreateCoachDto {
  Username: string;
  FullName: string;
  Email: string;
  Password: string;
  BirthDate: string; // ISO date string
  Address: string;
  Gender: number; // 0 = Masculino, 1 = Femenino, etc.
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  userType: 'athlete' | 'coach';
  realName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  profileImage?: string;
}

/**
 * Servicio para manejar autenticación con Google
 */
export class AuthService {
  /**
   * Realiza login con Google enviando el ID token al backend
   * @param credentialResponse - Respuesta de Google OAuth
   * @param userType - Tipo de usuario ('athlete' | 'coach')
   * @returns Token JWT del backend
   */
  static async loginWithGoogle(
    credentialResponse: CredentialResponse,
    userType: 'athlete' | 'coach'
  ): Promise<GoogleLoginResponse> {
    const token = credentialResponse.credential;
    if (!token) {
      throw new Error('No se recibió el token de Google');
    }

    const userTypeEnum = userTypeToEnum(userType);

    const { data } = await apiClient.post<GoogleLoginResponse>(
      '/api/Auth/Google-Login',
      { IdToken: token, UserType: userTypeEnum }
    );
    
    // Guardar el token JWT de forma segura
    // Nota: Se guarda en localStorage (común en SPAs)
    // Para mayor seguridad, considera usar httpOnly cookies configuradas en el backend
    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  }

  /**
   * Decodifica el JWT de Google para obtener información del usuario
   * @param token - ID token de Google
   * @returns Información del usuario decodificada
   */
  static decodeGoogleToken(token: string): GoogleUserInfo {
    try {
      return jwtDecode<GoogleUserInfo>(token);
    } catch (error) {
      throw new Error('Error al decodificar el token de Google');
    }
  }

  /**
   * Maneja el flujo completo de login con Google
   * @param credentialResponse - Respuesta de Google OAuth
   * @param userType - Tipo de usuario ('athlete' | 'coach')
   * @returns Objeto con el token del backend y la información del usuario
   */
  static async handleGoogleLogin(
    credentialResponse: CredentialResponse,
    userType: 'athlete' | 'coach'
  ): Promise<{ token: string; userInfo: GoogleUserInfo }> {
    try {
      // Login en el backend
      const { token } = await this.loginWithGoogle(credentialResponse, userType);
      
      // Decodificar token de Google para obtener info del usuario
      const userInfo = this.decodeGoogleToken(credentialResponse.credential!);

      toast.success('Sesión iniciada con Google');
      
      return { token, userInfo };
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene el token de autenticación almacenado
   */
  static getAuthToken(): string | null {
    return getStoredAuthToken();
  }

  /**
   * Elimina el token de autenticación (logout)
   */
  static clearAuthToken(): void {
    clearStoredAuthToken();
  }

  /**
   * Construye un objeto User a partir de la información de Google
   * @param userInfo - Información del usuario de Google
   * @param userType - Tipo de usuario ('athlete' | 'coach')
   * @returns Objeto User completo
   */
  static buildUserFromGoogleInfo(
    userInfo: GoogleUserInfo,
    userType: 'athlete' | 'coach',
    backendToken?: string
  ): User {
    // Si tenemos el token del backend, extraer el tema de ahí
    let theme: 'light' | 'dark' = 'light';
    if (backendToken) {
      try {
        const decoded: any = jwtDecode(backendToken);
        const themeFromToken = decoded.theme || decoded.Theme || 'light';
        theme = (themeFromToken === 'dark' || themeFromToken === 'Dark') ? 'dark' : 'light';
      } catch (error) {
        console.error('Error al decodificar el token del backend para obtener el tema:', error);
      }
    }

    return {
      id: userInfo.sub || Date.now().toString(),
      username: userInfo.given_name 
        ? userInfo.given_name.toLowerCase() 
        : (userInfo.email?.split('@')[0] || 'google_user'),
      email: userInfo.email,
      userType: userType,
      realName: userInfo.name || 'Usuario Google',
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      profileImage: userInfo.picture,
      location: undefined,
      preferences: {
        theme: theme,
        units: 'metric',
        notifications: {
          email: true
        }
      }
    };
  }

  /**
   * Realiza login con email y contraseña
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @param userType - Tipo de usuario ('athlete' | 'coach')
   * @returns Token JWT del backend y opcionalmente información del usuario
   */
  static async loginWithEmail(
    email: string,
    password: string,
    userType: 'athlete' | 'coach'
  ): Promise<EmailLoginResponse> {
    const userTypeEnum = userTypeToEnum(userType);

    const { data } = await apiClient.post<EmailLoginResponse>(
      '/api/Auth/Login',
      { 
        email, 
        password, 
        userType: userTypeEnum 
      } as EmailLoginRequest
    );
    
    // Guardar el token JWT
    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  }

  /**
   * Construye un objeto User a partir del JWT del backend
   * @param token - JWT token del backend
   * @param userType - Tipo de usuario ('athlete' | 'coach')
   * @returns Objeto User completo
   */
  static buildUserFromBackendToken(
    token: string,
    userType: 'athlete' | 'coach'
  ): User {
    try {
      const decoded: any = jwtDecode(token);
      // El backend retorna: Name, Role, y un identificador
      const id = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || Date.now().toString();
      const name = decoded.Name || decoded.name || 'Usuario';
      const role = decoded.Role || decoded.role || '';
      
      // Separar nombre y apellido si está en el formato "Nombre Apellido"
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Obtener email del token si está disponible, sino usar el email del formulario
      const email = decoded.email || decoded.Email || '';
      
      // Obtener el tema preferido del token (claim "theme")
      const themeFromToken = decoded.theme || decoded.Theme || 'light';
      const preferredTheme = (themeFromToken === 'dark' || themeFromToken === 'Dark') ? 'dark' : 'light';
      
      return {
        id: id.toString(),
        username: email.split('@')[0] || firstName.toLowerCase() || 'usuario',
        email: email,
        userType: userType,
        realName: name,
        firstName: firstName,
        lastName: lastName,
        location: undefined,
        preferences: {
          theme: preferredTheme,
          units: 'metric',
          notifications: {
            email: true
          }
        }
      };
    } catch (error) {
      console.error('Error al decodificar el token del backend:', error);
      throw new Error('Error al procesar la información del usuario');
    }
  }

  /**
   * Maneja el flujo completo de login con email y contraseña
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @param userType - Tipo de usuario ('athlete' | 'coach')
   * @returns Token JWT del backend y objeto User
   */
  static async handleEmailLogin(
    email: string,
    password: string,
    userType: 'athlete' | 'coach'
  ): Promise<{ token: string; user: User }> {
    try {
      const { token, user: responseUser } = await this.loginWithEmail(email, password, userType);
      
      // Si el backend retorna el usuario, usarlo; sino construirlo desde el token
      let user: User;
      if (responseUser) {
        user = responseUser;
      } else {
        user = this.buildUserFromBackendToken(token, userType);
        // Asegurar que el email esté presente
        if (!user.email) {
          user.email = email;
        }
      }
      
      toast.success('Sesión iniciada exitosamente');
      
      return { token, user };
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Registra un nuevo coach en el backend
   * @param coachData - Datos del coach a registrar
   * @returns Promise que se resuelve cuando el coach es creado exitosamente
   */
  static async createCoach(coachData: {
    username: string;
    fullName: string;
    email: string;
    password: string;
    birthDate: Date;
    address: string;
    gender: 'masculino' | 'femenino' | 'no-especifica';
  }): Promise<void> {
    try {
      // Mapear gender a número según el enum del backend
      // Asumiendo: 0 = Masculino, 1 = Femenino, 2 = No especifica
      const genderMap: Record<string, number> = {
        'masculino': 0,
        'femenino': 1,
        'no-especifica': 2
      };
      
      const dto: CreateCoachDto = {
        Username: coachData.username,
        FullName: coachData.fullName,
        Email: coachData.email,
        Password: coachData.password,
        BirthDate: coachData.birthDate.toISOString(),
        Address: coachData.address,
        Gender: genderMap[coachData.gender] ?? 2
      };

      await apiClient.post('/api/User/Coach', dto);
      
      toast.success('Coach registrado exitosamente');
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }
}

