import { apiClient } from './apiClient';
import { toast } from 'sonner';
import type { 
  TrainingGroup, 
  CreateTrainingGroupDto, 
  UpdateTrainingGroupDto,
  TrainingGroupMember,
  InviteGroupMemberDto,
  TrainingGroupStats
} from '../types/groupTypes';

// Interfaces para invitaciones y sedes del atleta
export interface GroupInvitationResponseDto {
  id: number;
  trainingGroupId: number;
  trainingGroupName: string;
  coachId: number;
  coachName: string;
  coachEmail: string;
  athleteId: number;
  athleteName: string;
  athleteEmail: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected' | 'cancelled';
  invitationMessage?: string;
  joinedDate: string;
  respondedAt?: string;
}

export interface MyTrainingGroupResponseDto {
  id: number;
  trainingGroupId: number;
  trainingGroupName: string;
  description?: string;
  coachId: number;
  coachName: string;
  coachEmail: string;
  trainingPoints: string[];
  memberCount: number;
  joinedDate: string;
}

/**
 * Servicio para gestionar sedes/grupos de entrenamiento
 */
export class GroupService {
  /**
   * Obtiene todas las sedes del coach actual
   */
  static async getAllGroups(): Promise<TrainingGroup[]> {
    try {
      const { data } = await apiClient.get<TrainingGroupBackend[]>('/api/TrainingGroups');
      return data.map(mapBackendToFrontend);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      // Si hay un error y no hay datos, retornar array vacío para evitar crashes
      console.error('Error al obtener sedes:', error);
      return [];
    }
  }

  /**
   * Obtiene una sede por su ID
   */
  static async getGroupById(groupId: string): Promise<TrainingGroup> {
    try {
      const { data } = await apiClient.get<TrainingGroupBackend>(`/api/TrainingGroups/${groupId}`);
      return mapBackendToFrontend(data);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Crea una nueva sede
   */
  static async createGroup(dto: CreateTrainingGroupDto): Promise<TrainingGroup> {
    try {
      const { data } = await apiClient.post<TrainingGroupBackend>('/api/TrainingGroups', dto);
      
      toast.success('Sede creada exitosamente', {
        description: `La sede "${dto.name}" ha sido creada correctamente.`
      });

      return mapBackendToFrontend(data);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Actualiza una sede existente
   */
  static async updateGroup(groupId: string, dto: UpdateTrainingGroupDto): Promise<TrainingGroup> {
    try {
      const { data } = await apiClient.put<TrainingGroupBackend>(`/api/TrainingGroups/${groupId}`, dto);
      
      toast.success('Sede actualizada exitosamente', {
        description: 'Los cambios se han guardado correctamente.'
      });

      return mapBackendToFrontend(data);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Elimina una sede
   */
  static async deleteGroup(groupId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingGroups/${groupId}`);
      
      toast.success('Sede eliminada exitosamente', {
        description: 'La sede y todos sus datos asociados han sido eliminados.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene los miembros de una sede
   */
  static async getGroupMembers(groupId: string): Promise<TrainingGroupMember[]> {
    try {
      const { data } = await apiClient.get<TrainingGroupMemberBackend[]>(`/api/TrainingGroups/${groupId}/members`);
      // Filtrar nulls (miembros rejected o cancelled) y mapear
      return data
        .map(mapMemberBackendToFrontend)
        .filter((member): member is TrainingGroupMember => member !== null);
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      console.error('Error al obtener miembros de la sede:', error);
      return [];
    }
  }

  /**
   * Invita a un atleta a una sede (por ID del atleta)
   */
  static async inviteAthleteToGroup(
    groupId: string, 
    athleteId: number, 
    message?: string
  ): Promise<void> {
    try {
      await apiClient.post(
        `/api/TrainingGroups/${groupId}/invite`,
        {
          athleteId,
          message
        }
      );

      toast.success('Invitación enviada exitosamente');
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Invita a un miembro a una sede (por email - deprecated, usar inviteAthleteToGroup)
   * TODO: Implementar cuando se agreguen los endpoints de invitaciones
   */
  static async inviteMember(groupId: string, dto: InviteGroupMemberDto): Promise<TrainingGroupMember> {
    try {
      // TODO: Descomentar cuando el endpoint esté listo
      // const { data } = await apiClient.post<TrainingGroupMember>(
      //   `/api/TrainingGroups/${groupId}/invite`,
      //   dto
      // );
      // return mapMemberBackendToFrontend(data);

      throw new Error('Endpoint de invitaciones no implementado aún');
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Elimina un miembro de una sede
   */
  static async removeMember(groupId: string, memberId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingGroups/${groupId}/members/${memberId}`);
      
      toast.success('Miembro eliminado exitosamente', {
        description: 'El miembro ha sido removido de la sede.'
      });
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las invitaciones pendientes del atleta actual
   */
  static async getPendingInvitations(): Promise<GroupInvitationResponseDto[]> {
    try {
      const { data } = await apiClient.get<GroupInvitationResponseDto[]>('/api/TrainingGroups/my-invitations');
      return data;
    } catch (error) {
      console.error('Error al obtener invitaciones pendientes:', error);
      return [];
    }
  }

  /**
   * Responde a una invitación de sede
   */
  static async respondToInvitation(invitationId: number, accept: boolean): Promise<void> {
    try {
      await apiClient.post(
        `/api/TrainingGroups/invitations/${invitationId}/respond`,
        { accept }
      );

      toast.success(
        accept ? 'Invitación aceptada' : 'Invitación rechazada'
      );
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las sedes del atleta actual
   */
  static async getMyGroups(): Promise<MyTrainingGroupResponseDto[]> {
    try {
      const { data } = await apiClient.get<MyTrainingGroupResponseDto[]>('/api/TrainingGroups/my-groups');
      return data;
    } catch (error) {
      console.error('Error al obtener mis sedes:', error);
      return [];
    }
  }

  /**
   * Abandona una sede (el atleta se desvincula)
   */
  static async leaveGroup(groupId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/TrainingGroups/${groupId}/leave`);
      
      toast.success('Te has desvinculado de la sede exitosamente');
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas de una sede
   */
  static async getGroupStats(groupId: string): Promise<TrainingGroupStats> {
    try {
      const { data } = await apiClient.get<TrainingGroupStats>(`/api/TrainingGroups/${groupId}/stats`);
      return data;
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient
      console.error('Error al obtener estadísticas de la sede:', error);
      // Retornar estadísticas vacías como fallback
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        plannedWorkouts: 0,
        activeMembers: 0
      };
    }
  }
}

// Interfaces para los datos que vienen del backend (difieren ligeramente del frontend)
interface TrainingGroupBackend {
  id: number;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  memberCount: number;
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
  allowSelfJoin?: boolean;
  requireApproval?: boolean;
  notifications?: {
    newMembers: boolean;
    completedWorkouts: boolean;
    injuries: boolean;
    missedSessions: boolean;
  };
}

interface TrainingGroupMemberBackend {
  id: number;
  trainingGroupId: number;
  trainingGroupName: string;
  userId: number;
  name: string;
  email: string;
  profileImage?: string | null;
  joinedDate: string;
  status: number | string; // TrainingGroupMemberStatusEnum - puede venir como número o string desde el backend
}

/**
 * Mapea los datos del backend al formato esperado por el frontend
 */
function mapBackendToFrontend(backend: TrainingGroupBackend): TrainingGroup {
  return {
    id: backend.id.toString(),
    name: backend.name,
    trainingPoints: backend.trainingPoints,
    createdDate: backend.createdDate,
    memberCount: backend.memberCount,
    description: backend.description,
    maxMembers: backend.maxMembers,
    isPublic: backend.isPublic,
    allowSelfJoin: backend.allowSelfJoin,
    requireApproval: backend.requireApproval,
    notifications: backend.notifications
  };
}

/**
 * Mapea los datos de miembros del backend al formato esperado por el frontend
 */
function mapMemberBackendToFrontend(backend: TrainingGroupMemberBackend): TrainingGroupMember | null {
  // Mapear el status del backend (puede venir como string o número)
  // TrainingGroupMemberStatusEnum: 0=Pending, 1=Active, 2=Inactive, 3=Rejected, 4=Cancelled
  let status: 'active' | 'pending' | 'inactive' = 'pending';
  let shouldInclude = true;
  
  // El backend puede devolver el status como string ("active", "rejected", etc.) o como número
  if (typeof backend.status === 'string') {
    // Si viene como string, mapear directamente (ya viene en camelCase desde el backend)
    const statusLower = backend.status.toLowerCase();
    if (statusLower === 'active') {
      status = 'active';
    } else if (statusLower === 'inactive') {
      status = 'inactive';
    } else if (statusLower === 'pending') {
      status = 'pending';
    } else if (statusLower === 'rejected' || statusLower === 'cancelled') {
      // No incluir miembros rechazados o cancelados
      shouldInclude = false;
      status = 'pending'; // Valor por defecto, aunque no se usará
    } else {
      status = 'pending';
    }
  } else {
    // Si viene como número
    switch (backend.status) {
      case 1: // Active
        status = 'active';
        break;
      case 2: // Inactive
        status = 'inactive';
        break;
      case 0: // Pending
        status = 'pending';
        break;
      case 3: // Rejected
      case 4: // Cancelled
      default:
        // No incluir miembros rechazados o cancelados
        shouldInclude = false;
        status = 'pending'; // Valor por defecto
        break;
    }
  }

  // Si no debe incluirse, retornar null para que el filtro lo excluya
  if (!shouldInclude) {
    return null;
  }

  return {
    id: backend.id.toString(),
    userId: backend.userId,
    name: backend.name,
    email: backend.email,
    role: 'athlete', // Siempre son atletas
    status: status,
    joinedDate: backend.joinedDate,
    profileImage: backend.profileImage || undefined
  };
}

