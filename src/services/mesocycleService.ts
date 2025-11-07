import { apiClient } from './apiClient';
import { toast } from 'sonner';

/**
 * DTOs para mesociclos
 */
export interface MesocycleResponseDto {
  id: number;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  objective?: string;
  status: 'planning' | 'active' | 'completed';
  planningId: number;
  periodId: number;
  // Estadísticas calculadas
  sessionsCount?: number;
  totalVolume?: number;
  weeksCount?: number;
}

/**
 * DTO para crear un mesociclo
 */
export interface CreateMesocycleDto {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  weeksCount: number; // Cantidad de semanas del mesociclo
  objective?: string;
  status: 'planning' | 'active' | 'completed';
}

/**
 * DTO para actualizar un mesociclo
 */
export interface UpdateMesocycleDto {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  weeksCount: number; // Cantidad de semanas del mesociclo
  objective?: string;
  status: 'planning' | 'active' | 'completed';
  periodId?: number; // ID del período (opcional, puede ser null si no requiere período)
}

/**
 * Servicio para gestionar mesociclos
 */
export class MesocycleService {
  /**
   * Obtiene todos los mesociclos de una planificación
   */
  static async getMesocyclesByPlanningId(planningId: number): Promise<MesocycleResponseDto[]> {
    try {
      const { data } = await apiClient.get<MesocycleResponseDto[]>(`/api/Mesocycle/planning/${planningId}`);
      return data;
    } catch (error) {
      console.error('Error al obtener mesociclos:', error);
      return [];
    }
  }

  /**
   * Obtiene un mesociclo por su ID
   */
  static async getMesocycleById(mesocycleId: number): Promise<MesocycleResponseDto> {
    try {
      const { data } = await apiClient.get<MesocycleResponseDto>(`/api/Mesocycle/${mesocycleId}`);
      return data;
    } catch (error) {
      console.error('Error al obtener mesociclo:', error);
      throw error;
    }
  }

  /**
   * Crea un mesociclo y genera automáticamente los microciclos
   * El mesociclo no requiere un período asociado
   * @param planningId ID de la planificación
   * @param dto Datos del mesociclo a crear
   */
  static async createMesocycleWithAutoMicrocycles(
    planningId: number,
    dto: CreateMesocycleDto
  ): Promise<MesocycleResponseDto> {
    try {
      const { data } = await apiClient.post<MesocycleResponseDto>(
        `/api/Mesocycle/planning/${planningId}`,
        dto
      );
      
      toast.success('Mesociclo creado exitosamente', {
        description: `El mesociclo "${dto.name}" ha sido creado y sus microciclos generados automáticamente.`
      });

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Actualiza un mesociclo existente
   * El backend actualizará automáticamente los microciclos si cambia la cantidad de semanas
   */
  static async updateMesocycle(mesocycleId: number, dto: UpdateMesocycleDto): Promise<MesocycleResponseDto> {
    try {
      const { data } = await apiClient.put<MesocycleResponseDto>(`/api/Mesocycle/${mesocycleId}`, dto);
      
      toast.success('Mesociclo actualizado exitosamente', {
        description: 'Los cambios se han guardado correctamente y los microciclos se han actualizado.'
      });

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Elimina un mesociclo
   */
  static async deleteMesocycle(mesocycleId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Mesocycle/${mesocycleId}`);
      
      toast.success('Mesociclo eliminado exitosamente', {
        description: 'El mesociclo ha sido eliminado correctamente.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }
}

