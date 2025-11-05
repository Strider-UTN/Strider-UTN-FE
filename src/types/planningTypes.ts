/**
 * Tipos e interfaces para planificaciones
 */

export interface Planning {
  id: number;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string o null
  status: 'active' | 'completed' | 'draft';
  coachId: number;
  createdAt: string;
  updatedAt?: string;
  athleteIds?: number[]; // IDs de atletas asignados
  groupIds?: number[]; // IDs de grupos (solo para UI, siempre se crean relaciones individuales)
}

export interface CreatePlanningDto {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string o null
  status: 'active' | 'completed' | 'draft';
  athleteIds?: number[]; // IDs de atletas a asignar individualmente
  groupIds?: number[]; // IDs de grupos (opcional, para asignar todos los atletas del grupo)
}

export interface UpdatePlanningDto {
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string o null
  status: 'active' | 'completed' | 'draft';
}

/**
 * Respuesta del backend (DTO)
 */
export interface PlanningResponseDto {
  id: number;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string o null
  status: 'active' | 'completed' | 'draft';
  coachId: number;
  coachName?: string;
  createdAt: string;
  updatedAt?: string;
  athleteIds?: number[]; // IDs de atletas asignados
  // Estadísticas opcionales
  athletesCount?: number; // ✅ Conteo de atletas asignados
  periodsCount?: number;
  mesocyclesCount?: number;
  microcyclesCount?: number;
  sessionsCount?: number;
}

/**
 * DTOs para asignar atletas
 */
export interface AssignAthletesDto {
  athleteIds: number[];
}

/**
 * DTO de respuesta para un atleta asignado a una planificación
 */
export interface PlanningAthleteResponseDto {
  id: number; // ID de PlanningAthlete
  athleteId: number;
  athleteName: string;
  athleteEmail: string;
  planningId: number;
  assignedAt: string;
}

