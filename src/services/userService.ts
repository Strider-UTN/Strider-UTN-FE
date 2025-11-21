import { apiClient } from './apiClient';
import { toast } from 'sonner';

export interface UpdateThemeDto {
  theme: 'light' | 'dark';
}

export interface UpdateUserProfileDto {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  profilePictureUrl?: string;
  birthDate?: string; // Formato: YYYY-MM-DD (ISO date string)
  bio?: string;
  // Campos específicos para atletas
  height?: number;
  weight?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  country?: string;
  vo2Max?: string; // Velocidad máxima por km en formato mm:ss (ejemplo: "03:30")
  trainingStartDate?: string; // Formato: YYYY-MM (ejemplo: 2020-03)
  trainingVolumeType?: 'Weekly' | 'Monthly';
  trainingVolumeKm?: number;
}

export interface UserProfileResponseDto {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
  address?: string;
  gender?: string | number;
  profilePictureUrl?: string;
  userType: number | string; // 0/1 o 'athlete'|'coach'
  preferredTheme: number | string; // 0/1 o 'light'|'dark'
  bio?: string;
  // Campos específicos para atletas
  height?: number;
  weight?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  country?: string;
  vO2Max?: string; // Velocidad máxima por km en formato mm:ss (ejemplo: "03:30") - Backend retorna vO2Max
  yearsOfExperience: number;
  trainingStartDate?: string; // Formato: YYYY-MM
  trainingVolumeType: number | string; // 0/1 o 'weekly'|'monthly'
  trainingVolumeKm: number;
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

  /**
   * Obtiene el perfil del usuario actual
   */
  static async getProfile(): Promise<UserProfileResponseDto> {
    try {
      const { data } = await apiClient.get<UserProfileResponseDto>('/api/User/profile');
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario actual
   */
  static async updateProfile(dto: UpdateUserProfileDto): Promise<void> {
    try {
      await apiClient.put('/api/User/profile', dto);
      
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }
}

