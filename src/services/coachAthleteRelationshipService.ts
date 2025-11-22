import { apiClient } from './apiClient';
import { toast } from 'sonner';

// DTOs
export interface InviteAthleteDto {
  athleteEmail: string;
  message?: string;
}

export interface RespondToInvitationDto {
  relationshipId: number;
  accept: boolean;
}

export interface CoachAthleteRelationshipResponseDto {
  id: number;
  coachId: number;
  coachName: string;
  coachEmail: string;
  athleteId: number;
  athleteName: string;
  athleteEmail: string;
  status: string;
  invitationMessage?: string;
  invitedAt: string;
  respondedAt?: string;
  linkedSince?: string;
}

export interface AthleteResponseDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  linkedSince: string;
  lastActivity?: string;
  daysSinceLastWorkout?: number; // Días desde el último entrenamiento completado
  trainingStartDate?: string; // Fecha de inicio de entrenamiento (formato: YYYY-MM)
  vo2Max?: string; // Velocidad máxima por km en formato mm:ss (ejemplo: "03:30")
  vO2Max?: string; // Alias para compatibilidad con backend (camelCase)
  birthDate?: string; // Fecha de nacimiento completa (formato ISO)
  height?: number;
  weight?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  hasHealthInsurance?: boolean;
  healthInsuranceProvider?: string;
  healthInsuranceMemberNumber?: string;
  lastCheckupDate?: string;
  medicalClearanceExpiryDate?: string;
  medicalConditions?: string[];
}

export interface CoachResponseDto {
  id: number;
  relationshipId?: number; // ID de la relación (para poder eliminar la relación)
  name: string;
  email: string;
  phone?: string;
  status: string;
  linkedSince: string;
}

/**
 * Servicio para gestionar relaciones entre coaches y atletas
 */
export class CoachAthleteRelationshipService {
  /**
   * Invita a un atleta por email (solo coaches)
   */
  static async inviteAthlete(dto: InviteAthleteDto): Promise<CoachAthleteRelationshipResponseDto> {
    try {
      const { data } = await apiClient.post<CoachAthleteRelationshipResponseDto>(
        '/api/CoachAthleteRelationships/invite',
        dto
      );

      toast.success('Invitación creada exitosamente', {
        description: `La invitación ha sido creada para ${dto.athleteEmail}. El atleta la verá en su panel de invitaciones.`
      });

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Responde a una invitación (aceptar/rechazar)
   */
  static async respondToInvitation(
    relationshipId: number,
    accept: boolean
  ): Promise<CoachAthleteRelationshipResponseDto> {
    try {
      const { data } = await apiClient.post<CoachAthleteRelationshipResponseDto>(
        '/api/CoachAthleteRelationships/respond',
        {
          relationshipId,
          accept
        }
      );

      toast.success(
        accept 
          ? 'Invitación aceptada exitosamente' 
          : 'Invitación rechazada'
      );

      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las invitaciones pendientes del atleta actual
   */
  static async getPendingInvitations(): Promise<CoachAthleteRelationshipResponseDto[]> {
    try {
      const { data } = await apiClient.get<CoachAthleteRelationshipResponseDto[]>(
        '/api/CoachAthleteRelationships/pending-invitations'
      );
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene los coaches del atleta actual
   */
  static async getMyCoaches(status?: string): Promise<CoachResponseDto[]> {
    try {
      const url = status 
        ? `/api/CoachAthleteRelationships/my-coaches?status=${status}`
        : '/api/CoachAthleteRelationships/my-coaches';
      
      const { data } = await apiClient.get<CoachResponseDto[]>(url);
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene los atletas del coach actual
   */
  static async getMyAthletes(status?: string): Promise<AthleteResponseDto[]> {
    try {
      const url = status 
        ? `/api/CoachAthleteRelationships/my-athletes?status=${status}`
        : '/api/CoachAthleteRelationships/my-athletes';
      
      const { data } = await apiClient.get<AthleteResponseDto[]>(url);
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Elimina una relación
   */
  static async removeRelationship(relationshipId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/CoachAthleteRelationships/${relationshipId}`);
      toast.success('Relación eliminada exitosamente');
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }
}

