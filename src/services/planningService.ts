import { apiClient } from './apiClient';
import { toast } from 'sonner';
import type { 
  Planning, 
  CreatePlanningDto, 
  UpdatePlanningDto,
  PlanningResponseDto,
  AssignAthletesDto,
  PlanningAthleteResponseDto
} from '../types/planningTypes';

/**
 * Servicio para gestionar planificaciones
 */
export class PlanningService {
  /**
   * Obtiene todas las planificaciones del coach actual
   */
  static async getAllPlannings(): Promise<Planning[]> {
    try {
      const { data } = await apiClient.get<PlanningResponseDto[]>('/api/Planning');
      return data.map(mapBackendToFrontend);
    } catch (error) {
      console.error('Error al obtener planificaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene una planificación por su ID
   */
  static async getPlanningById(id: number): Promise<Planning> {
    try {
      const { data } = await apiClient.get<PlanningResponseDto>(`/api/Planning/${id}`);
      return mapBackendToFrontend(data);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene los atletas asignados a una planificación
   */
  static async getAssignedAthletes(planningId: number): Promise<PlanningAthleteResponseDto[]> {
    try {
      const { data } = await apiClient.get<PlanningAthleteResponseDto[]>(`/api/Planning/${planningId}/athletes`);
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Crea una nueva planificación
   */
  static async createPlanning(dto: CreatePlanningDto): Promise<Planning> {
    try {
      const { data } = await apiClient.post<PlanningResponseDto>('/api/Planning', dto);
      
      toast.success('Planificación creada exitosamente', {
        description: `La planificación "${dto.name}" ha sido creada correctamente.`
      });

      // Si hay atletas individuales, asignarlos
      if (dto.athleteIds && dto.athleteIds.length > 0) {
        try {
          await apiClient.post(`/api/Planning/${data.id}/athletes`, {
            athleteIds: dto.athleteIds
          } as AssignAthletesDto);
        } catch (assignError) {
          console.error('Error al asignar atletas individuales:', assignError);
          // No lanzamos el error, solo lo registramos, ya que la planificación se creó correctamente
        }
      }

      // Si hay grupos, asignar todos los atletas de cada grupo
      if (dto.groupIds && dto.groupIds.length > 0) {
        for (const groupId of dto.groupIds) {
          try {
            await apiClient.post(`/api/Planning/${data.id}/athletes/from-group/${groupId}`);
          } catch (groupError) {
            console.error(`Error al asignar atletas del grupo ${groupId}:`, groupError);
            // No lanzamos el error, solo lo registramos
          }
        }
      }

      return mapBackendToFrontend(data);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Actualiza una planificación existente
   */
  static async updatePlanning(id: number, dto: UpdatePlanningDto): Promise<Planning> {
    try {
      const { data } = await apiClient.put<PlanningResponseDto>(`/api/Planning/${id}`, dto);
      
      toast.success('Planificación actualizada exitosamente', {
        description: 'Los cambios se han guardado correctamente.'
      });

      return mapBackendToFrontend(data);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Elimina una planificación
   */
  static async deletePlanning(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Planning/${id}`);
      
      toast.success('Planificación eliminada exitosamente', {
        description: 'La planificación ha sido eliminada correctamente.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Asigna atletas individuales a una planificación
   */
  static async assignAthletes(planningId: number, athleteIds: number[]): Promise<void> {
    try {
      await apiClient.post(`/api/Planning/${planningId}/athletes`, {
        athleteIds
      } as AssignAthletesDto);
      
      toast.success('Atletas asignados exitosamente', {
        description: `${athleteIds.length} atleta(s) asignado(s) a la planificación.`
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Asigna todos los atletas de un grupo a una planificación
   */
  static async assignAthletesFromGroup(planningId: number, groupId: number): Promise<void> {
    try {
      await apiClient.post(`/api/Planning/${planningId}/athletes/from-group/${groupId}`);
      
      toast.success('Atletas del grupo asignados exitosamente', {
        description: 'Todos los atletas del grupo han sido asignados a la planificación.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Remueve un atleta de una planificación
   */
  static async removeAthlete(planningId: number, athleteId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Planning/${planningId}/athletes/${athleteId}`);
      
      toast.success('Atleta removido exitosamente', {
        description: 'El atleta ha sido removido de la planificación.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las planificaciones de un atleta específico
   */
  static async getPlanningsByAthleteId(athleteId: number): Promise<Planning[]> {
    try {
      const { data } = await apiClient.get<PlanningResponseDto[]>(`/api/Planning/athlete/${athleteId}`);
      return data.map(mapBackendToFrontend);
    } catch (error) {
      console.error('Error al obtener planificaciones del atleta:', error);
      return [];
    }
  }
}

/**
 * Mapea la respuesta del backend al formato del frontend
 * Nota: El tipo Planning del servicio no incluye períodosCount, pero lo agregamos desde el DTO
 */
function mapBackendToFrontend(backend: PlanningResponseDto): Planning & { 
  periodsCount?: number; 
  athletesCount?: number;
  coachName?: string;
  mesocyclesCount?: number;
} {
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    startDate: backend.startDate,
    endDate: backend.endDate,
    status: backend.status,
    coachId: backend.coachId,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    athleteIds: backend.athleteIds || [],
    periodsCount: backend.periodsCount, // Incluir períodosCount del DTO
    athletesCount: backend.athletesCount, // ✅ Incluir athletesCount del DTO
    coachName: backend.coachName, // ✅ Incluir coachName del DTO
    mesocyclesCount: backend.mesocyclesCount // ✅ Incluir mesocyclesCount del DTO
  };
}

