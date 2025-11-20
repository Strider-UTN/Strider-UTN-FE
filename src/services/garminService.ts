import { apiClient } from './apiClient';
import { toast } from 'sonner';

/**
 * DTO para un lap (vuelta) de Garmin
 */
export interface GarminLapResponseDto {
  index: number;
  distance: number;
  duration: number;
  averageHR: number;
  speed: number;
  startTime: Date;
}

/**
 * DTO para un entrenamiento de Garmin
 */
export interface GarminWorkoutResponseDto {
  id: string;
  name: string;
  distance: number;
  date: string;
  duration: number;
  averageHR: number;
  laps: GarminLapResponseDto[];
}

export interface GarminWorkoutRequestDto {
  startDate: Date;
  endDate: Date;
}

/**
 * DTO para conectar cuenta de Garmin
 */
export interface ConnectGarminAccountDto {
  garminUsername: string;
  garminPassword: string;
}

/**
 * DTO de respuesta al conectar cuenta de Garmin
 */
export interface GarminAccountResponseDto {
  connectedSince: string;
}


/**
 * Servicio para gestionar la integración con Garmin Connect
 */
export class GarminService {
  /**
   * Conecta una cuenta de Garmin Connect
   */
  static async connectAccount(userId: string, credentials: ConnectGarminAccountDto): Promise<GarminAccountResponseDto> {
    try {
      const { data } = await apiClient.post<GarminAccountResponseDto>(`/api/Garmin/users/${userId}/login`, credentials);
      toast.success('¡Conectado exitosamente con Garmin Connect!');
      return data;
    } catch (error: any) {
      console.error('Error al conectar con Garmin Connect:', error);
      const errorMessage = error.response?.data?.message || 'Error al conectar con Garmin Connect';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Sincroniza entrenamientos desde Garmin Connect
   */
  static async syncWorkouts(userId: string, request?: GarminWorkoutRequestDto): Promise<GarminWorkoutResponseDto[]> {
    try {
      const { data } = await apiClient.post<GarminWorkoutResponseDto[]>(`/api/Garmin/users/${userId}/workouts`, request);
      const workouts = data;
      toast.success(`Sincronización completada. ${workouts.length} ${workouts.length === 1 ? 'nuevo entrenamiento' : 'nuevos entrenamientos'} importado${workouts.length === 1 ? '' : 's'}.`);
      return workouts;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al sincronizar con Garmin Connect';
      toast.error(errorMessage);
      throw error;
    }
  }
}

