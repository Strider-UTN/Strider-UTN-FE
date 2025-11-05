import { apiClient } from './apiClient';
import { toast } from 'sonner';

export interface UpdateThemeDto {
  theme: 'light' | 'dark';
}

/**
 * Servicio para gestionar las preferencias del usuario
 */
export class UserService {
  /**
   * Actualiza el tema preferido del usuario actual
   */
  static async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await apiClient.patch('/api/User/theme', { theme });
      
      toast.success('Tema actualizado exitosamente');
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }
}

