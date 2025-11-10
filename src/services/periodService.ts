import { apiClient } from './apiClient';
import { toast } from 'sonner';

/**
 * DTOs para períodos (mesociclos)
 */
export interface PeriodResponseDto {
  id: number;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  objective?: string;
  status: 'planning' | 'active' | 'completed';
  planningId: number;
  // Estadísticas calculadas
  sessionsCount?: number;
  totalVolume?: number; // Volumen total en km
  weeksCount?: number; // Número de semanas
}

/**
 * DTO para crear un período
 */
export interface CreatePeriodDto {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  objective?: string;
  status: 'planning' | 'active' | 'completed';
}

/**
 * DTO para actualizar un período
 */
export interface UpdatePeriodDto {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  objective?: string;
  status: 'planning' | 'active' | 'completed';
}

/**
 * Servicio para gestionar períodos (mesociclos) de planificaciones
 */
export class PeriodService {
  /**
   * Obtiene todos los períodos de una planificación
   */
  static async getPeriodsByPlanningId(planningId: number): Promise<PeriodResponseDto[]> {
    try {
      const { data } = await apiClient.get<PeriodResponseDto[]>(`/api/Period/planning/${planningId}`);
      return data;
    } catch (error) {
      console.error('Error al obtener períodos:', error);
      return [];
    }
  }

  /**
   * Obtiene un período por su ID
   */
  static async getPeriodById(periodId: number): Promise<PeriodResponseDto> {
    try {
      const { data } = await apiClient.get<PeriodResponseDto>(`/api/Period/${periodId}`);
      return data;
    } catch (error) {
      console.error('Error al obtener período:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo período para una planificación
   */
  static async createPeriod(planningId: number, dto: CreatePeriodDto, suppressToast: boolean = false): Promise<PeriodResponseDto> {
    try {
      const { data } = await apiClient.post<PeriodResponseDto>(`/api/Period/planning/${planningId}`, dto);
      
      if (!suppressToast) {
        toast.success('Período creado exitosamente', {
          description: `El período "${dto.name}" ha sido creado correctamente.`
        });
      }

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Actualiza un período existente
   */
  static async updatePeriod(periodId: number, dto: UpdatePeriodDto): Promise<PeriodResponseDto> {
    try {
      const { data } = await apiClient.put<PeriodResponseDto>(`/api/Period/${periodId}`, dto);
      
      toast.success('Período actualizado exitosamente', {
        description: 'Los cambios se han guardado correctamente.'
      });

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Elimina un período
   */
  static async deletePeriod(periodId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Period/${periodId}`);
      
      toast.success('Período eliminado exitosamente', {
        description: 'El período ha sido eliminado correctamente.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }
}

