import { apiClient } from './apiClient';
import { toast } from 'sonner';

/**
 * DTOs para microciclos
 * Nota: En el backend, los microciclos se obtienen desde /api/Microcycle/
 */
export interface MicrocycleResponseDto {
  id: number;
  name: string; // ✅ NUEVO - Nombre del microciclo (puede venir vacío "")
  description?: string | null; // ✅ NUEVO - Descripción del microciclo (opcional, puede ser null)
  weekNumber: number;
  startDate: string; // ISO date string (ej: "2025-12-01T00:00:00Z")
  endDate: string; // ISO date string (ej: "2025-12-07T00:00:00Z")
  sessions: number; // Calculado automáticamente desde TrainingSessions
  volume: number; // Calculado automáticamente desde TrainingSessions
  intensity: string; // Backend envía "low" | "medium" | "high" (en inglés)
  focus?: number | string | null; // Backend envía el enum MicrocycleFocus como número (0-8), string camelCase (ej: "aerobicEndurance"), o null
  mesocycleId: number; // ID del mesociclo
  trainingSessionsCount: number; // Cantidad real de sesiones asignadas
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para actualizar un microciclo
 * Nota: 
 * - El backend espera intensity en inglés ("low" | "medium" | "high")
 * - El backend espera focus como enum MicrocycleFocus (número 0-8) o null
 *   Valores del enum:
 *   0 = AerobicEndurance (Resistencia Aeróbica)
 *   1 = Speed (Velocidad)
 *   2 = Strength (Fuerza)
 *   3 = Recovery (Recuperación)
 *   4 = AnaerobicWork (Trabajo Anaeróbico)
 *   5 = RunningTechnique (Técnica de Carrera)
 *   6 = Competition (Competición)
 *   7 = Transition (Transición)
 *   8 = ActiveRest (Descanso Activo)
 */
export interface UpdateMicrocycleDto {
  name: string; // ✅ NUEVO - Nombre del microciclo (requerido)
  description?: string | null; // ✅ NUEVO - Descripción del microciclo (opcional, puede ser null)
  // Sessions y Volume NO deben estar aquí - se calculan automáticamente desde las sesiones
  intensity: string; // Backend espera "low" | "medium" | "high" (en inglés)
  focus?: number | null; // Backend espera enum MicrocycleFocus como número (0-8) o null
}

/**
 * DTO para crear un microciclo
 */
export interface CreateMicrocycleDto {
  weekNumber: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  focus?: string;
}

/**
 * Servicio para gestionar microciclos
 * Nota: Los microciclos pertenecen a un mesociclo (que en el backend se llama "Period")
 */
export class MicrocycleService {
  /**
   * Obtiene todos los microciclos de un mesociclo
   * @param mesocycleId ID del mesociclo
   */
  static async getMicrocyclesByMesocycleId(mesocycleId: number): Promise<MicrocycleResponseDto[]> {
    try {
      // GET: api/Microcycle/mesocycle/{mesocycleId}
      const { data } = await apiClient.get<MicrocycleResponseDto[]>(`/api/Microcycle/mesocycle/${mesocycleId}`);
      return data;
    } catch (error) {
      console.error(`Error al obtener microciclos del mesociclo ${mesocycleId}:`, error);
      return [];
    }
  }

  /**
   * Crea un microciclo para un mesociclo
   * @param mesocycleId ID del mesociclo (en el backend se usa como periodId)
   */
  static async createMicrocycle(mesocycleId: number, dto: CreateMicrocycleDto): Promise<MicrocycleResponseDto> {
    try {
      // En el backend, los mesociclos se llaman "Period", por eso la ruta usa /api/Period/
      const { data } = await apiClient.post<MicrocycleResponseDto>(`/api/Period/${mesocycleId}/microcycles`, dto);
      return data;
    } catch (error) {
      console.error(`Error al crear microciclo para el mesociclo ${mesocycleId}:`, error);
      throw error;
    }
  }

  /**
   * Crea múltiples microciclos para un mesociclo (uno por cada semana)
   * @param mesocycleId ID del mesociclo (en el backend se usa como periodId)
   * @param startDate Fecha de inicio del mesociclo
   * @param weeksCount Cantidad de semanas del mesociclo
   */
  static async createMicrocyclesForMesocycle(
    mesocycleId: number,
    startDate: string,
    weeksCount: number
  ): Promise<MicrocycleResponseDto[]> {
    const microcycles: MicrocycleResponseDto[] = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    try {
      // Crear un microciclo por cada semana
      for (let weekNumber = 1; weekNumber <= weeksCount; weekNumber++) {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // 6 días después para completar la semana (7 días total)

        const createDto: CreateMicrocycleDto = {
          weekNumber,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          focus: `Semana ${weekNumber}`
        };

        const microcycle = await this.createMicrocycle(mesocycleId, createDto);
        microcycles.push(microcycle);
      }

      return microcycles;
    } catch (error) {
      console.error(`Error al crear microciclos para el mesociclo ${mesocycleId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un microciclo por su ID
   * @param microcycleId ID del microciclo
   */
  static async getMicrocycleById(microcycleId: number): Promise<MicrocycleResponseDto> {
    try {
      // GET: api/Microcycle/{id}
      const { data } = await apiClient.get<MicrocycleResponseDto>(`/api/Microcycle/${microcycleId}`);
      return data;
    } catch (error) {
      console.error(`Error al obtener microciclo ${microcycleId}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un microciclo
   * @param microcycleId ID del microciclo
   * @param dto Datos para actualizar el microciclo
   */
  static async updateMicrocycle(microcycleId: number, dto: UpdateMicrocycleDto): Promise<MicrocycleResponseDto> {
    try {
      // PUT: api/Microcycle/{id}
      const { data } = await apiClient.put<MicrocycleResponseDto>(`/api/Microcycle/${microcycleId}`, dto);
      
      toast.success('Microciclo actualizado exitosamente', {
        description: 'Los cambios se han guardado correctamente.'
      });
      
      return data;
    } catch (error) {
      console.error(`Error al actualizar microciclo ${microcycleId}:`, error);
      toast.error('Error al actualizar el microciclo', {
        description: 'No se pudieron guardar los cambios.'
      });
      throw error;
    }
  }

  /**
   * Elimina un microciclo
   * NOTA: Los microciclos NO se pueden eliminar desde el menú
   * Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo
   * @param microcycleId ID del microciclo a eliminar
   * @deprecated Los microciclos no se pueden eliminar manualmente
   */
  static async deleteMicrocycle(microcycleId: number): Promise<void> {
    try {
      // DELETE: api/Microcycle/{id}
      // NOTA: Este endpoint está deshabilitado en el backend
      await apiClient.delete(`/api/Microcycle/${microcycleId}`);
      
      toast.success('Microciclo eliminado exitosamente');
    } catch (error) {
      console.error(`Error al eliminar microciclo ${microcycleId}:`, error);
      toast.error('Error al eliminar el microciclo', {
        description: 'Los microciclos solo se pueden eliminar ajustando la cantidad de semanas en el mesociclo.'
      });
      throw error;
    }
  }
}

