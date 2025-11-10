import { apiClient } from './apiClient';
import { toast } from 'sonner';
import { mapTrainingCategoryToBackend, mapTrainingCategoryFromBackend } from '../utils/trainingCategoryMapper';
import { AuthService } from './authService';

export interface CreateTrainingSessionDto {
  name: string;
  description?: string;
  date: string;
  category: string;
  notes?: string;
  templateId?: number;
  planningId: number;
  athleteIds: number[];
  series: CreateTrainingSeriesDto[];
}

export interface UpdateTrainingSessionDto {
  name: string;
  description?: string;
  date: string;
  category: string;
  notes?: string;
  athleteIds: number[];
  series: CreateTrainingSeriesDto[];
}

export interface CreateTrainingSeriesDto {
  name: string;
  repetitions: number;
  recoveryBetweenSets: string;
  orderIndex: number;
  notes?: string;
  intervals: CreateTrainingIntervalDto[];
}

export interface CreateTrainingIntervalDto {
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

export interface TrainingSessionResponseDto {
  id: number;
  name: string;
  description?: string;
  date: string;
  category: string;
  notes?: string;
  createdByUserId?: number;
  createdByName?: string;
  templateId?: number;
  templateName?: string;
  createdAt: string;
  updatedAt?: string;
  athleteIds?: number[];
  athletes?: TrainingSessionAthleteResponseDto[];
  series: TrainingSeriesResponseDto[];
  intervals: TrainingIntervalResponseDto[];
  structureType?: 'simple' | 'advanced';
  planningId?: number;
  microcycleId?: number;
  volume?: number;
  estimatedWorkSeconds?: number;
  estimatedRecoverySeconds?: number;
}

export interface TrainingSessionAthleteResponseDto {
  id: number;
  athleteId: number;
  athleteName: string;
  status: string;
  completedAt?: string;
  assignedAt: string;
}

export interface TrainingSeriesResponseDto {
  id: number;
  name: string;
  repetitions: number;
  recoveryBetweenSets: string;
  orderIndex: number;
  notes?: string;
  intervals: TrainingIntervalResponseDto[];
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

export class TrainingSessionService {
  static async createTrainingSession(
    dto: CreateTrainingSessionDto
  ): Promise<TrainingSessionResponseDto> {
    try {
      const payload = {
        ...dto,
        category: mapTrainingCategoryToBackend(dto.category),
        series: dto.series
      };

      const { data } = await apiClient.post<TrainingSessionResponseDto>(
        '/api/TrainingSession',
        payload
      );

      toast.success('Sesión creada exitosamente', {
        description: `"${dto.name}" está lista para usar`
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getAllTrainingSessions(): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        '/api/TrainingSession'
      );
      return data.map(normalizeSessionCategory);
    } catch (error) {
      throw error;
    }
  }

  static async getTrainingSessionById(id: number): Promise<TrainingSessionResponseDto | null> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto>(
        `/api/TrainingSession/${id}`
      );
      return normalizeSessionCategory(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getTrainingSessionsByPlanningId(planningId: number): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        `/api/TrainingSession/planning/${planningId}`
      );
      return data.map(normalizeSessionCategory);
    } catch (error) {
      throw error;
    }
  }

  static async getTrainingSessionsByAthleteId(athleteId: number, planningId?: number): Promise<TrainingSessionResponseDto[]> {
    try {
      const query = planningId ? `?planningId=${planningId}` : '';
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        `/api/TrainingSession/athlete/${athleteId}${query}`
      );
      return data.map(normalizeSessionCategory);
    } catch (error) {
      throw error;
    }
  }

  static async getTrainingSessionsByMicrocycleId(microcycleId: number): Promise<TrainingSessionResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
        `/api/TrainingSession/microcycle/${microcycleId}`
      );
      return data.map(normalizeSessionCategory);
    } catch (error) {
      throw error;
    }
  }

  static async getMyTrainingSessionsByDate(date: string): Promise<TrainingSessionResponseDto[]> {
    try {
      // Formatear fecha a YYYY-MM-DD si viene en otro formato
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      
      // Obtener el ID del atleta actual desde el token como fallback
      const athleteId = AuthService.getCurrentUserId();
      
      // Intentar usar el endpoint "mine" primero (más seguro y conveniente)
      try {
        const { data } = await apiClient.get<TrainingSessionResponseDto[]>(
          `/api/TrainingSession/athlete/mine?date=${dateStr}`
        );
        return data.map(normalizeSessionCategory);
      } catch (error: any) {
        // Si el endpoint "mine" no existe (404), usar el endpoint con ID del atleta y filtrar por fecha
        if ((error.response?.status === 404 || error.response?.status === 400) && athleteId) {
          // Obtener todas las sesiones del atleta actual y filtrar por fecha
          const allSessions = await this.getTrainingSessionsByAthleteId(athleteId);
          const filtered = allSessions.filter(session => {
            const sessionDate = session.date.includes('T') ? session.date.split('T')[0] : session.date;
            return sessionDate === dateStr;
          });
          return filtered;
        }
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateTrainingSession(
    id: number,
    dto: UpdateTrainingSessionDto
  ): Promise<TrainingSessionResponseDto> {
    try {
      const payload = {
        ...dto,
        category: mapTrainingCategoryToBackend(dto.category)
      };

      const { data } = await apiClient.put<TrainingSessionResponseDto>(
        `/api/TrainingSession/${id}`,
        payload
      );

      toast.success('Sesión actualizada exitosamente', {
        description: `"${dto.name}" ha sido actualizada correctamente`
      });

      return normalizeSessionCategory(data);
    } catch (error) {
      throw error;
    }
  }

  static async deleteTrainingSession(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingSession/${id}`);

      toast.success('Sesión eliminada exitosamente', {
        description: 'La sesión ha sido eliminada correctamente'
      });
    } catch (error) {
      throw error;
    }
  }
}

function normalizeSessionCategory(session: TrainingSessionResponseDto): TrainingSessionResponseDto {
  return {
    ...session,
    category: mapTrainingCategoryFromBackend(session.category)
  };
}

