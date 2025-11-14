import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

const AUTH_TOKEN_KEY = 'authToken';

/**
 * Extrae el mensaje de error del backend desde una respuesta de axios
 * Busca exhaustivamente en la respuesta para encontrar el mensaje del backend
 * @param error - Error de axios
 * @returns Mensaje de error del backend o null si no se encuentra
 */
function extractErrorMessage(error: AxiosError): string | null {
  const data = error.response?.data as any;
  
  if (!data) {
    // Si no hay data, intentar obtener el mensaje del error de red
    if (error.message) {
      return error.message;
    }
    return null;
  }
  
  // Si la respuesta es un string directo, usarlo
  if (typeof data === 'string') {
    return data.trim() || null;
  }
  
  // Si es un objeto, buscar en diferentes propiedades comunes
  if (typeof data === 'object') {
    // Prioridad 1: Propiedades directas comunes
    const directMessages = [
      data.message,
      data.error,
      data.Message,
      data.Error,
      data.title, // C# ProblemDetails.Title
      data.detail, // C# ProblemDetails.Detail
      data.Detail,
    ].filter(msg => msg && typeof msg === 'string' && msg.trim());
    
    if (directMessages.length > 0) {
      return directMessages[0];
    }
    
    // Prioridad 2: Estructura de validación de C# (ModelState errors)
    // Formato: { "errors": { "field": ["error1", "error2"], ... } }
    if (data.errors && typeof data.errors === 'object') {
      const validationMessages: string[] = [];
      
      // Recorrer todas las propiedades del objeto errors
      for (const key in data.errors) {
        const fieldErrors = data.errors[key];
        if (Array.isArray(fieldErrors)) {
          validationMessages.push(...fieldErrors.filter(msg => typeof msg === 'string'));
        } else if (typeof fieldErrors === 'string') {
          validationMessages.push(fieldErrors);
        }
      }
      
      if (validationMessages.length > 0) {
        return validationMessages.join(', ');
      }
    }
    
    // Prioridad 3: Si errors es un array directo
    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .filter((msg: any) => typeof msg === 'string' && msg.trim())
        .map((msg: any) => String(msg).trim());
      if (messages.length > 0) {
        return messages.join(', ');
      }
    }
    
    // Prioridad 4: Buscar recursivamente cualquier string en el objeto
    const recursiveMessages: string[] = [];
    const extractStrings = (obj: any, depth: number = 0): void => {
      // Limitar profundidad para evitar bucles infinitos
      if (depth > 5) return;
      
      if (typeof obj === 'string' && obj.trim()) {
        recursiveMessages.push(obj.trim());
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => extractStrings(item, depth + 1));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(value => extractStrings(value, depth + 1));
      }
    };
    
    // Excluir propiedades que sabemos que no son mensajes de error
    const excludeKeys = ['traceId', 'type', 'status', 'timestamp', 'path'];
    const filteredData = Object.keys(data)
      .filter(key => !excludeKeys.includes(key.toLowerCase()))
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {} as any);
    
    extractStrings(filteredData, 0);
    
    if (recursiveMessages.length > 0) {
      // Filtrar mensajes que parecen ser mensajes de error (no URLs, no IDs, etc.)
      const validMessages = recursiveMessages.filter(msg => {
        const lowerMsg = msg.toLowerCase();
        return !lowerMsg.startsWith('http') &&
               !lowerMsg.match(/^[a-f0-9-]{20,}$/i) && // No UUIDs o hashes
               msg.length < 500 && // No respuestas muy largas
               !msg.match(/^\d+$/); // No solo números
      });
      
      if (validMessages.length > 0) {
        return validMessages[0]; // Retornar el primer mensaje válido
      }
    }
  }
  
  // Si llegamos aquí, no se encontró mensaje del backend
  // Retornar null en lugar de mensaje genérico para que el código que llama
  // pueda decidir qué hacer (aunque actualmente siempre se muestra un toast)
  return null;
}

/**
 * Almacena el token de autenticación en localStorage de forma segura
 */
export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error al guardar el token:', error);
    // Si localStorage no está disponible (modo privado en algunos navegadores),
    // podrías usar sessionStorage como fallback
    try {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (fallbackError) {
      console.error('Error al usar sessionStorage como fallback:', fallbackError);
    }
  }
}

/**
 * Obtiene el token de autenticación del localStorage
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error al leer el token:', error);
    return null;
  }
}

/**
 * Elimina el token de autenticación del localStorage y sessionStorage
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error al eliminar el token:', error);
  }
}

/**
 * Cliente axios configurado con la base URL y interceptores para el token JWT
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const rawBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (!rawBase) {
      throw new Error('VITE_API_BASE_URL no está definida. Configúrala en .env.local');
    }
    const apiBase = rawBase.replace(/\/$/, '');

    this.client = axios.create({
      baseURL: apiBase,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token JWT a todas las requests
    this.client.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de respuesta
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Si recibimos 401, el token es inválido o expiró
        if (error.response?.status === 401) {
          const tokenBeforeClear = getAuthToken();
          clearAuthToken();
          
          // Solo redirigir si había un token antes (evitar loops)
          if (tokenBeforeClear) {
            // Mostrar mensaje informativo
            toast.error('Tu sesión ha expirado o no tienes autorización', {
              description: 'Serás redirigido al login...',
              duration: 3000
            });
            
            // Redirigir al login después de un breve delay
            setTimeout(() => {
              // Verificar que el token sigue sin estar (evitar múltiples redirecciones)
              if (!getAuthToken()) {
                // Redirigir a la raíz (donde está el login)
                // El token ya fue limpiado arriba, así que la app mostrará el login
                window.location.href = '/';
              }
            }, 1500);
          }
        }
        
        // Extraer y mostrar el mensaje de error del backend automáticamente
        // Solo si no es un 401 (ya manejado arriba) ni un 404 (manejado por servicios específicos)
        if (error.response?.status !== 401 && error.response?.status !== 404) {
          const errorMessage = extractErrorMessage(error);
          if (errorMessage) {
            toast.error(errorMessage);
          } else if (error.message && !error.response) {
            // Solo mostrar error.message si es un error de red (sin respuesta del servidor)
            // Si hay respuesta del servidor pero no mensaje, no mostramos nada
            // para evitar mensajes genéricos cuando el backend no devuelve mensaje
            toast.error(error.message);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene la instancia de axios configurada
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Exportar una instancia singleton
export const apiClient = new ApiClient().getInstance();


