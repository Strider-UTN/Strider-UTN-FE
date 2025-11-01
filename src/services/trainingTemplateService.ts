import { apiClient } from './apiClient';
import { toast } from 'sonner';

// Tipos/interfaces para los DTOs
export interface CreateTrainingTemplateDto {
  name: string;
  description: string;
  type: string; // 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series'
  category: string; // 'training' | 'prep_competition' | 'main_competition'
  duration: number;
  distance?: number;
  targetPace?: string;
  targetHR?: string;
  notes: string;
  difficulty: number | string; // 1-5 o enum como string
  tags: string[];
  warmUpDuration?: number;
  warmUpPace?: string;
  warmUpDescription?: string;
  coolDownDuration?: number;
  coolDownPace?: string;
  coolDownDescription?: string;
  intervals: CreateTrainingIntervalDto[];
}

export interface CreateTrainingIntervalDto {
  type: string; // 'interval' | 'continuous' | 'recovery'
  repetitions: number;
  distance: number;
  targetTime?: string;
  recoveryTime: string;
  paceType: string; // 'fixed' | 'vo2max_percentage'
  pace?: number;
  vo2maxPercentage?: number;
  description?: string;
  intensity?: string; // 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max'
  trainingMode?: string; // 'distance' | 'time'
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
  difficulty: number | string; // Puede venir como número o string enum
  isFavorite: boolean;
  useCount: number;
  createdAt: string;
  lastUsed?: string;
  tags: string[];
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
  vo2maxPercentage?: number;
  description?: string;
  intensity?: string;
  trainingMode?: string;
  duration?: string;
  targetSpeed?: string;
  orderIndex: number;
}

/**
 * Servicio para gestionar plantillas de entrenamiento
 */
export class TrainingTemplateService {
  /**
   * Crea una nueva plantilla de entrenamiento
   */
  static async createTrainingTemplate(
    dto: CreateTrainingTemplateDto
  ): Promise<TrainingTemplateResponseDto> {
    try {
      const { data } = await apiClient.post<TrainingTemplateResponseDto>(
        '/api/TrainingTemplates', // Ruta plural (TrainingTemplatesController)
        dto
      );

      toast.success('Plantilla creada exitosamente', {
        description: `"${dto.name}" está lista para usar`
      });

      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene todas las plantillas del usuario autenticado
   */
  static async getAllTrainingTemplates(): Promise<TrainingTemplateResponseDto[]> {
    try {
      const { data } = await apiClient.get<TrainingTemplateResponseDto[]>(
        '/api/TrainingTemplates'
      );
      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Obtiene una plantilla por su ID
   */
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
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Actualiza una plantilla existente
   */
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
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Elimina una plantilla
   * 
   * Nota: El endpoint DELETE normalmente retorna 204 (No Content) sin body.
   * Si el backend retorna información útil (como el ID eliminado o un mensaje),
   * podemos capturarla aquí, pero por defecto retorna void ya que es el estándar REST.
   */
  static async deleteTrainingTemplate(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingTemplates/${id}`);

      toast.success('Plantilla eliminada exitosamente');
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }

  /**
   * Marca o desmarca una plantilla como favorita
   * El backend hace el toggle automáticamente, no requiere enviar el estado
   */
  static async toggleFavoriteTemplate(
    id: number,
    currentFavoriteStatus: boolean
  ): Promise<TrainingTemplateResponseDto> {
    try {
      // El backend hace el toggle automáticamente, no enviamos body
      const { data } = await apiClient.patch<TrainingTemplateResponseDto>(
        `/api/TrainingTemplates/${id}/favorite`
      );

      // Usar el estado opuesto para el mensaje (el backend hizo el toggle)
      const newStatus = !currentFavoriteStatus;
      toast.success(
        newStatus 
          ? 'Plantilla agregada a favoritos' 
          : 'Plantilla removida de favoritos'
      );

      return data;
    } catch (error) {
      // El error ya se maneja automáticamente en apiClient.ts
      throw error;
    }
  }
}

