import { apiClient } from './apiClient';
import { toast } from 'sonner';

// DTOs
export interface CreateVO2MaxSuggestionDto {
  athleteId: number;
  suggestedVO2Max: string; // Formato mm:ss (ejemplo: "03:30")
  message?: string;
}

export interface RespondToVO2MaxSuggestionDto {
  suggestionId: number;
  accept: boolean;
}

export interface VO2MaxSuggestionResponseDto {
  id: number;
  coachId: number;
  coachName: string;
  coachEmail: string;
  athleteId: number;
  athleteName: string;
  athleteEmail: string;
  suggestedVO2Max: string;
  message?: string;
  status: string;
  suggestedAt: string;
  respondedAt?: string;
}

/**
 * Servicio para gestionar sugerencias de VO2Max
 */
export class VO2MaxSuggestionService {
  /**
   * Crea una sugerencia de actualización de VO2Max (solo coaches)
   */
  static async createSuggestion(dto: CreateVO2MaxSuggestionDto): Promise<VO2MaxSuggestionResponseDto> {
    try {
      const { data } = await apiClient.post<VO2MaxSuggestionResponseDto>(
        '/api/VO2MaxSuggestion',
        dto
      );

      toast.success('Sugerencia de VO2Max creada exitosamente', {
        description: `La sugerencia ha sido enviada al atleta.`
      });

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Responde a una sugerencia de VO2Max (aceptar/rechazar) (solo atletas)
   */
  static async respondToSuggestion(
    suggestionId: number,
    accept: boolean
  ): Promise<VO2MaxSuggestionResponseDto> {
    try {
      const { data } = await apiClient.post<VO2MaxSuggestionResponseDto>(
        '/api/VO2MaxSuggestion/respond',
        {
          suggestionId,
          accept
        }
      );

      toast.success(
        accept 
          ? 'Sugerencia aceptada exitosamente' 
          : 'Sugerencia rechazada'
      );

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las sugerencias pendientes del atleta actual (solo atletas)
   */
  static async getPendingSuggestions(): Promise<VO2MaxSuggestionResponseDto[]> {
    try {
      const { data } = await apiClient.get<VO2MaxSuggestionResponseDto[]>(
        '/api/VO2MaxSuggestion/pending'
      );
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las sugerencias de VO2Max para un atleta específico (solo coaches)
   */
  static async getSuggestionsByAthlete(athleteId: number): Promise<VO2MaxSuggestionResponseDto[]> {
    try {
      const { data } = await apiClient.get<VO2MaxSuggestionResponseDto[]>(
        `/api/VO2MaxSuggestion/athlete/${athleteId}`
      );
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }
}

