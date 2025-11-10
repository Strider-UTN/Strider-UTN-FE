/**
 * Tipos compartidos para el manejo de Sedes/Grupos de entrenamiento
 */

export interface TrainingGroup {
  id: string;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  memberCount: number;
  description?: string;
  // Campos adicionales para configuración
  maxMembers?: number;
  isPublic?: boolean;
  allowSelfJoin?: boolean;
  requireApproval?: boolean;
  // Configuración de notificaciones
  notifications?: {
    newMembers: boolean;
    completedWorkouts: boolean;
    injuries: boolean;
    missedSessions: boolean;
  };
}

export interface CreateTrainingGroupDto {
  name: string;
  trainingPoints: string[];
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
  allowSelfJoin?: boolean;
  requireApproval?: boolean;
}

export interface UpdateTrainingGroupDto {
  name?: string;
  trainingPoints?: string[];
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
  allowSelfJoin?: boolean;
  requireApproval?: boolean;
  notifications?: {
    newMembers?: boolean;
    completedWorkouts?: boolean;
    injuries?: boolean;
    missedSessions?: boolean;
  };
}

export interface TrainingGroupMember {
  id: string;
  userId: number; // ID del usuario (atleta) en el grupo
  name: string;
  email: string;
  role: 'athlete' | 'coach';
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  profileImage?: string;
}

export interface InviteGroupMemberDto {
  email: string;
  role: 'athlete' | 'coach';
  message?: string;
}

export interface TrainingGroupStats {
  totalWorkouts: number;
  completedWorkouts: number;
  plannedWorkouts: number;
  activeMembers: number;
}

