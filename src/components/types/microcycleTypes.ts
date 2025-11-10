export interface TrainingSession {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athletes: string[];
  intervals: any[];
  volume?: string;
  intensity?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Microcycle {
  id: string;
  name: string; // ✅ NUEVO - Nombre del microciclo
  description?: string; // ✅ NUEVO - Descripción del microciclo (opcional)
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: number; // Calculado automáticamente desde TrainingSessions
  volume: number; // Calculado automáticamente desde TrainingSessions
  intensity: 'baja' | 'media' | 'alta';
  focus: string;
  trainingSessions?: TrainingSession[];
  completedSessions?: number;
  actualVolume?: number;
}

export interface Mesocycle {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  startDate?: string; // Fecha de inicio (ISO string) - necesario para edición
  endDate?: string; // Fecha de fin (ISO string) - necesario para edición
  weeksCount?: number; // Cantidad de semanas - necesario para edición
  objective: string;
  sessions: number;
  totalVolume: number;
  microcycles: Microcycle[];
  status: 'planning' | 'active' | 'completed';
}

export interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

export interface MicrocycleViewProps {
  mesocycle: Mesocycle;
  athletes: Athlete[];
  onBack: () => void;
  onCreateSession?: (microcycleId: string, date: string) => void;
  onEditMicrocycle?: (microcycle: Microcycle) => void;
  onDeleteMicrocycle?: (microcycleId: string) => void;
  onViewCalendar?: (microcycle: Microcycle) => void;
}