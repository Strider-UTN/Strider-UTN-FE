import { apiClient } from './apiClient';
import { toast } from 'sonner';
import { mapTrainingCategoryToBackend, mapTrainingCategoryFromBackend } from '../utils/trainingCategoryMapper';

// Tipos/interfaces para los DTOs
export interface CreateTrainingSessionDto {
  name: string;
  description?: string;
  date: string; // ISO string format
  category: string; // 'Training' | 'PrepCompetition' | 'MainCompetition' (PascalCase para el backend)
  notes?: string;
  templateId?: number;
  planningId: number; // ID de la planificación (requerido)
  athleteIds: number[]; // IDs de los atletas
  intervals: CreateTrainingIntervalDto[];
}

export interface UpdateTrainingSessionDto {
  name: string;
  description?: string;
  date: string; // ISO string format
  category: string; // 'Training' | 'PrepCompetition' | 'MainCompetition' (PascalCase para el backend)
  notes?: string;
  athleteIds: number[]; // IDs de los atletas
  intervals: CreateTrainingIntervalDto[];
}

export interface CreateTrainingIntervalDto {
  type: string; // 'Interval' | 'Continuous' | 'Recovery'
  repetitions: number;
  distance: number;
  targetTime?: string;
  recoveryTime: string;
  paceType: string; // 'Fixed' | 'Vo2MaxPercentage'
  pace?: number;
  vo2MaxPercentage?: number;
  description?: string;
  intensity?: string; // 'Easy' | 'Moderate' | 'Hard' | 'VeryHard' | 'Max'
  trainingMode?: string; // 'Distance' | 'Time'
  duration?: string;
  targetSpeed?: string;
  orderIndex: number;
}

export interface TrainingSessionResponseDto {
  id: number;
  name: string;
  description?: string;
  date: string; // ISO string format
  category: string; // 'Training' | 'PrepCompetition' | 'MainCompetition' (del backend)
  notes?: string;
  createdByUserId?: number;
  createdByName?: string;
  templateId?: number;
  templateName?: string;
  createdAt: string;
  updatedAt?: string;
  athleteIds?: number[]; // Array de IDs de atletas (formato simplificado)
  athletes?: TrainingSessionAthleteResponseDto[]; // Array de objetos con información completa (formato completo)
  intervals: TrainingIntervalResponseDto[];
  planningId?: number;
  microcycleId?: number;
  volume?: number;
}

export interface TrainingSessionAthleteResponseDto {
  id: number;
  athleteId: number;
  athleteName: string;
  status: string; // 'Pending' | 'Completed' | 'Missed' | 'Cancelled'
  completedAt?: string;
  assignedAt: string;
}

export interface TrainingIntervalResponseDto {
  id: number;
  type: string;
  repetitions: number;
  distance: number;
  targetTime?: string;
  recoveryTime: string;
  paceType: string;
  pace?: number;
  vo2MaxPercentage?: number;
  description?: string;
  intensity?: string;
  trainingMode?: string;
  duration?: string;
  targetSpeed?: string;
  orderIndex: number;
}

/**
 * Servicio para gestionar sesiones de entrenamiento
 */
export class TrainingSessionService {
  /**
   * Crea una nueva sesión de entrenamiento
   */
  static async createTrainingSession(
    dto: CreateTrainingSessionDto
  ): Promise<TrainingSessionResponseDto> {
    try {
      const { data } = await apiClient.post<TrainingSessionResponseDto>(
        '/api/TrainingSession',
        dto
      );

      toast.success('Sesión creada exitosamente', {
        description: `"${dto.name}" está lista para usar`
      });

      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene todas las sesiones del usuario autenticado
   */
  static async getAllTrainingSessions(): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        '/api/TrainingSession'
      );
      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene una sesión por su ID
   */
  static async getTrainingSessionById(id: number): Promise<TrainingSessionResponseDto | null> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto>(
        `/api/TrainingSession/${id}`
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene todas las sesiones de una planificación
   * @param planningId ID de la planificación
   */
  static async getTrainingSessionsByPlanningId(planningId: number): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        `/api/TrainingSession/planning/${planningId}`
      );
      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene todas las sesiones de un microciclo
   * @param microcycleId ID del microciclo
   */
  static async getTrainingSessionsByMicrocycleId(microcycleId: number): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        `/api/TrainingSession/microcycle/${microcycleId}`
      );
      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Actualiza una sesión de entrenamiento existente
   * @param id ID de la sesión a actualizar
   * @param dto Datos actualizados de la sesión
   */
  static async updateTrainingSession(
    id: number,
    dto: UpdateTrainingSessionDto
  ): Promise<TrainingSessionResponseDto> {
    try {
      const { data } = await apiClient.put<TrainingSessionResponseDto>(
        `/api/TrainingSession/${id}`,
        dto
      );

      toast.success('Sesión actualizada exitosamente', {
        description: `"${dto.name}" ha sido actualizada correctamente`
      });

      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Elimina una sesión de entrenamiento
   * @param id ID de la sesión a eliminar
   */
  static async deleteTrainingSession(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingSession/${id}`);
      
      toast.success('Sesión eliminada exitosamente', {
        description: 'La sesión ha sido eliminada correctamente'
      });
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }
}

