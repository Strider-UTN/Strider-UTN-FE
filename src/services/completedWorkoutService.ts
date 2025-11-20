import { apiClient } from './apiClient';
import { toast } from 'sonner';

export interface CreateCompletedWorkoutDto {
  trainingSessionAthleteId: number;
  name: string;
  distance: number; // meters
  date: string; // Formato YYYY-MM-DD
  duration: number; // seconds
  averageHR: number; // bpm
  comments?: string;
  source: 'Manual' | 'Garmin'; // Origen del entrenamiento
  sensations?: CreateWorkoutSensationsDto;
  laps?: CreateWorkoutLapDto[];
  injuries?: CreateWorkoutInjuryDto[];
}

export interface CreateWorkoutSensationsDto {
  effort: number; // 1-10
  fatigue: number; // 1-10
  motivation: number; // 1-10
  muscularLoad: number; // 1-10
  overallFeeling: number; // 1-10
}

export interface CreateWorkoutLapDto {
  index: number;
  distance: number; // meters
  duration: number; // seconds
  averageHR: number; // bpm
  speed: number; // m/s
  startTime: string; // ISO string
}

export interface CreateWorkoutInjuryDto {
  bodyPart: string; // InjuryLocation enum value
  severity: number; // 1-10
  description: string;
  affectedPerformance: boolean;
  type: 'Molestia' | 'Dolor';
}

export interface CompletedWorkoutResponseDto {
  id: number;
  name: string;
  distance: number;
  date: string;
  duration: number; // segundos
  averageHR: number;
  comments?: string;
  source: string;
  trainingSessionAthleteId: number;
  trainingSessionId: number;
  trainingSessionName: string;
  athleteId: number;
  athleteName: string;
  // Información de planificación
  planningId?: number;
  planningName?: string;
  mesocycleId?: number;
  mesocycleName?: string;
  microcycleId?: number;
  microcycleName?: string;
  category?: 'Training' | 'PrepCompetition' | 'MainCompetition' | 'training' | 'prepCompetition' | 'mainCompetition';
  sensations?: WorkoutSensationsResponseDto;
  laps: WorkoutLapResponseDto[];
  injuries: WorkoutInjuryResponseDto[];
  feedback?: WorkoutFeedbackResponseDto;
  rating?: 'Excellent' | 'Good' | 'NeedsImprovement' | 'DoesNotMeetObjectives';
  createdAt: string;
  updatedAt?: string;
}

export interface WorkoutFeedbackResponseDto {
  id: number;
  coachId: number;
  coachName: string;
  feedback: string;
  recommendations?: string;
  rating?: 'Excellent' | 'Good' | 'NeedsImprovement' | 'DoesNotMeetObjectives';
  lapFeedbacks: LapFeedbackResponseDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface LapFeedbackResponseDto {
  id: number;
  workoutLapId: number;
  feedback: string;
  createdAt: string;
}

export interface CompletedWorkoutsGroupedByAthleteDto {
  athleteId: number;
  athleteName: string;
  trainingGroupId?: number;
  trainingGroupName?: string;
  workouts: CompletedWorkoutResponseDto[];
}

export interface WorkoutSensationsResponseDto {
  id: number;
  effort: number;
  fatigue: number;
  motivation: number;
  muscularLoad: number;
  overallFeeling: number;
}

export interface WorkoutLapResponseDto {
  id: number;
  index: number;
  distance: number;
  duration: number;
  averageHR: number;
  speed: number;
  startTime: string;
}

export interface WorkoutInjuryResponseDto {
  id: number;
  bodyPart: string;
  severity: number;
  description: string;
  affectedPerformance: boolean;
  type: string;
}

export class CompletedWorkoutService {
  static async createCompletedWorkout(
    dto: CreateCompletedWorkoutDto
  ): Promise<CompletedWorkoutResponseDto> {
    try {
      const { data } = await apiClient.post<CompletedWorkoutResponseDto>(
        '/api/CompletedWorkout',
        dto
      );

      toast.success('Entrenamiento registrado correctamente', {
        description: `"${dto.name}" ha sido guardado exitosamente`
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getMyCompletedWorkouts(date?: string): Promise<CompletedWorkoutResponseDto[]> {
    try {
      const query = date ? `?date=${date}` : '';
      const { data } = await apiClient.get<CompletedWorkoutResponseDto[]>(
        `/api/CompletedWorkout/athlete/mine${query}`
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getMyCompletedWorkoutsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<CompletedWorkoutResponseDto[]> {
    try {
      const { data } = await apiClient.get<CompletedWorkoutResponseDto[]>(
        `/api/CompletedWorkout/athlete/mine/range?startDate=${startDate}&endDate=${endDate}`
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getCompletedWorkoutById(id: number): Promise<CompletedWorkoutResponseDto | null> {
    try {
      const { data } = await apiClient.get<CompletedWorkoutResponseDto>(
        `/api/CompletedWorkout/${id}`
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async updateCompletedWorkout(
    id: number,
    dto: CreateCompletedWorkoutDto
  ): Promise<CompletedWorkoutResponseDto> {
    try {
      const { data } = await apiClient.put<CompletedWorkoutResponseDto>(
        `/api/CompletedWorkout/${id}`,
        dto
      );

      toast.success('Entrenamiento actualizado correctamente', {
        description: `"${dto.name}" ha sido actualizado exitosamente`
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteCompletedWorkout(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/CompletedWorkout/${id}`);

      toast.success('Entrenamiento eliminado correctamente', {
        description: 'El entrenamiento ha sido eliminado exitosamente'
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCompletedWorkoutByTrainingSessionAthleteIdAndDate(
    trainingSessionAthleteId: number,
    date: string
  ): Promise<CompletedWorkoutResponseDto | null> {
    try {
      // El endpoint ahora retorna 200 con null en lugar de 404 cuando no hay workout
      const { data } = await apiClient.get<CompletedWorkoutResponseDto | null>(
        `/api/CompletedWorkout/training-session-athlete/${trainingSessionAthleteId}/date?date=${date}`
      );
      
      // Retornar null si no hay datos
      return data || null;
    } catch (error: any) {
      // Solo loggear errores que no sean esperados
      console.error('Error al verificar workout existente:', error);
      return null;
    }
  }

  static async getForCoachWithFiltersGroupedByAthlete(
    filters: {
      planningId?: number;
      trainingGroupId?: number;
      athleteId?: number;
      startDate?: string;
      endDate?: string;
      hasFeedback?: boolean; // true = solo evaluados, false = solo pendientes, undefined = todos
    }
  ): Promise<CompletedWorkoutsGroupedByAthleteDto[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.planningId !== undefined) {
        queryParams.append('planningId', filters.planningId.toString());
      }
      if (filters.trainingGroupId !== undefined) {
        queryParams.append('trainingGroupId', filters.trainingGroupId.toString());
      }
      if (filters.athleteId !== undefined) {
        queryParams.append('athleteId', filters.athleteId.toString());
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      if (filters.hasFeedback !== undefined) {
        queryParams.append('hasFeedback', filters.hasFeedback.toString());
      }

      const queryString = queryParams.toString();
      const url = `/api/CompletedWorkout/coach/filtered${queryString ? `?${queryString}` : ''}`;
      
      const { data } = await apiClient.get<CompletedWorkoutsGroupedByAthleteDto[]>(url);
      return data;
    } catch (error) {
      console.error('Error al obtener workouts filtrados:', error);
      throw error;
    }
  }

  static async submitWorkoutFeedback(
    completedWorkoutId: number,
    feedback: {
      rating: 'Excellent' | 'Good' | 'NeedsImprovement' | 'DoesNotMeetObjectives';
      feedback: string;
      recommendations?: string;
      lapFeedbacks?: Array<{
        workoutLapId: number;
        feedback: string;
      }>;
    }
  ): Promise<WorkoutFeedbackResponseDto> {
    try {
      const { data } = await apiClient.post<WorkoutFeedbackResponseDto>(
        `/api/CompletedWorkout/${completedWorkoutId}/feedback`,
        feedback
      );
      return data;
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      throw error;
    }
  }

  static async updateWorkoutFeedback(
    completedWorkoutId: number,
    feedback: {
      rating?: 'Excellent' | 'Good' | 'NeedsImprovement' | 'DoesNotMeetObjectives';
      feedback?: string;
      recommendations?: string;
      lapFeedbacks?: Array<{
        workoutLapId: number;
        feedback: string;
      }>;
    }
  ): Promise<WorkoutFeedbackResponseDto> {
    try {
      const { data } = await apiClient.put<WorkoutFeedbackResponseDto>(
        `/api/CompletedWorkout/${completedWorkoutId}/feedback`,
        feedback
      );
      return data;
    } catch (error) {
      console.error('Error al actualizar feedback:', error);
      throw error;
    }
  }
}

