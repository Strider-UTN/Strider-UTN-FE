import { apiClient } from './apiClient';
import { toast } from 'sonner';

export interface CreateTrainingTemplateDto {
  name: string;
  description: string;
  type: string;
  category: string;
  duration: number;
  distance?: number;
  targetPace?: string;
  targetHR?: string;
  notes: string;
  difficulty: number | string;
  tags: string[];
  warmUpDuration?: number;
  warmUpPace?: string;
  warmUpDescription?: string;
  coolDownDuration?: number;
  coolDownPace?: string;
  coolDownDescription?: string;
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

export interface TrainingTemplateResponseDto {
  id: number;
  name: string;
  description: string;
  type: string;
  category: string;
  duration: number;
  distance?: number;
  targetPace?: string;
  targetHR?: string;
  notes: string;
  difficulty: number | string;
  isFavorite: boolean;
  useCount: number;
  createdAt: string;
  lastUsed?: string;
  tags: string[];
  series: TrainingSeriesResponseDto[];
  intervals: TrainingIntervalResponseDto[];
  structureType: 'simple' | 'advanced';
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

export class TrainingTemplateService {
  static async createTrainingTemplate(
    dto: CreateTrainingTemplateDto
  ): Promise<TrainingTemplateResponseDto> {
    try {
      const { data } = await apiClient.post<TrainingTemplateResponseDto>(
        '/api/TrainingTemplates',
        dto
      );

      toast.success('Plantilla creada exitosamente', {
        description: `"${dto.name}" está lista para usar`
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getAllTrainingTemplates(): Promise<TrainingTemplateResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingTemplateResponseDto[]>(
        '/api/TrainingTemplates'
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getTrainingTemplateById(id: number): Promise<TrainingTemplateResponseDto | null> {
    try {
      const { data } = await apiClient.get<TrainingTemplateResponseDto>(
        `/api/TrainingTemplates/${id}`
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async updateTrainingTemplate(
    id: number,
    dto: CreateTrainingTemplateDto
  ): Promise<TrainingTemplateResponseDto> {
    try {
      const { data } = await apiClient.put<TrainingTemplateResponseDto>(
        `/api/TrainingTemplates/${id}`,
        dto
      );

      toast.success('Plantilla actualizada exitosamente');
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteTrainingTemplate(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingTemplates/${id}`);

      toast.success('Plantilla eliminada exitosamente');
    } catch (error) {
      throw error;
    }
  }

  static async toggleFavoriteTemplate(
    id: number,
    currentFavoriteStatus: boolean
  ): Promise<TrainingTemplateResponseDto> {
    try {
      const { data } = await apiClient.patch<TrainingTemplateResponseDto>(
        `/api/TrainingTemplates/${id}/favorite`
      );

      const newStatus = !currentFavoriteStatus;
      toast.success(
        newStatus
          ? 'Plantilla agregada a favoritos'
          : 'Plantilla removida de favoritos'
      );

      return data;
    } catch (error) {
      throw error;
    }
  }
}

