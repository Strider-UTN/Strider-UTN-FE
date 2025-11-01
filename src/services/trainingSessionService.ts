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
  createdByUserId: number;
  createdByName: string;
  templateId?: number;
  templateName?: string;
  createdAt: string;
  updatedAt?: string;
  athletes: TrainingSessionAthleteResponseDto[];
  intervals: TrainingIntervalResponseDto[];
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
        '/api/TrainingSessions',
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
        '/api/TrainingSessions'
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
        `/api/TrainingSessions/${id}`
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
   * Obtiene todas las sesiones de una fecha específica
   */
  static async getTrainingSessionsByDate(date: string): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        `/api/TrainingSessions/date/${date}`
      );
      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }
}

