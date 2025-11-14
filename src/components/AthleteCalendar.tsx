import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronRight, ChevronLeft, ChevronDown, CheckCircle, Info, Loader2, Eye, ShieldAlert, Upload } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { TrainingSessionService, TrainingSessionResponseDto, TrainingIntervalResponseDto } from '../services/trainingSessionService';
import { mapTrainingCategoryFromBackend } from '../utils/trainingCategoryMapper';
import { mapIntervalIntensityFromBackend } from '../utils/intervalIntensityMapper';
import { CompletedWorkoutService } from '../services/completedWorkoutService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para convertir InjuryLocation (enum en inglés) a español
const mapInjuryLocationToSpanish = (location: string): string => {
  // Normalizar el valor (puede venir con diferentes capitalizaciones)
  const normalized = location.trim();
  
  const mapping: Record<string, string> = {
    'Head': 'Cabeza',
    'head': 'Cabeza',
    'Neck': 'Cuello',
    'neck': 'Cuello',
    'RightShoulder': 'Hombro Derecho',
    'rightShoulder': 'Hombro Derecho',
    'rightshoulder': 'Hombro Derecho',
    'LeftShoulder': 'Hombro Izquierdo',
    'leftShoulder': 'Hombro Izquierdo',
    'leftshoulder': 'Hombro Izquierdo',
    'RightArm': 'Brazo Derecho',
    'rightArm': 'Brazo Derecho',
    'rightarm': 'Brazo Derecho',
    'LeftArm': 'Brazo Izquierdo',
    'leftArm': 'Brazo Izquierdo',
    'leftarm': 'Brazo Izquierdo',
    'RightElbow': 'Codo Derecho',
    'rightElbow': 'Codo Derecho',
    'rightelbow': 'Codo Derecho',
    'LeftElbow': 'Codo Izquierdo',
    'leftElbow': 'Codo Izquierdo',
    'leftelbow': 'Codo Izquierdo',
    'RightWrist': 'Muñeca Derecha',
    'rightWrist': 'Muñeca Derecha',
    'rightwrist': 'Muñeca Derecha',
    'LeftWrist': 'Muñeca Izquierda',
    'leftWrist': 'Muñeca Izquierda',
    'leftwrist': 'Muñeca Izquierda',
    'RightHand': 'Mano Derecha',
    'rightHand': 'Mano Derecha',
    'righthand': 'Mano Derecha',
    'LeftHand': 'Mano Izquierda',
    'leftHand': 'Mano Izquierda',
    'lefthand': 'Mano Izquierda',
    'Chest': 'Pecho',
    'chest': 'Pecho',
    'UpperBack': 'Espalda Alta',
    'upperBack': 'Espalda Alta',
    'upperback': 'Espalda Alta',
    'LowerBack': 'Espalda Baja',
    'lowerBack': 'Espalda Baja',
    'lowerback': 'Espalda Baja',
    'Abdomen': 'Abdomen',
    'abdomen': 'Abdomen',
    'Hip': 'Cadera',
    'hip': 'Cadera',
    'RightThigh': 'Muslo Derecho',
    'rightThigh': 'Muslo Derecho',
    'rightthigh': 'Muslo Derecho',
    'LeftThigh': 'Muslo Izquierdo',
    'leftThigh': 'Muslo Izquierdo',
    'leftthigh': 'Muslo Izquierdo',
    'RightKnee': 'Rodilla Derecha',
    'rightKnee': 'Rodilla Derecha',
    'rightknee': 'Rodilla Derecha',
    'LeftKnee': 'Rodilla Izquierda',
    'leftKnee': 'Rodilla Izquierda',
    'leftknee': 'Rodilla Izquierda',
    'RightCalf': 'Pantorrilla Derecha',
    'rightCalf': 'Pantorrilla Derecha',
    'rightcalf': 'Pantorrilla Derecha',
    'LeftCalf': 'Pantorrilla Izquierda',
    'leftCalf': 'Pantorrilla Izquierda',
    'leftcalf': 'Pantorrilla Izquierda',
    'RightAnkle': 'Tobillo Derecho',
    'rightAnkle': 'Tobillo Derecho',
    'rightankle': 'Tobillo Derecho',
    'LeftAnkle': 'Tobillo Izquierdo',
    'leftAnkle': 'Tobillo Izquierdo',
    'leftankle': 'Tobillo Izquierdo',
    'RightFoot': 'Pie Derecho',
    'rightFoot': 'Pie Derecho',
    'rightfoot': 'Pie Derecho',
    'LeftFoot': 'Pie Izquierdo',
    'leftFoot': 'Pie Izquierdo',
    'leftfoot': 'Pie Izquierdo',
    'RightAchilles': 'Aquiles Derecho',
    'rightAchilles': 'Aquiles Derecho',
    'rightachilles': 'Aquiles Derecho',
    'LeftAchilles': 'Aquiles Izquierdo',
    'leftAchilles': 'Aquiles Izquierdo',
    'leftachilles': 'Aquiles Izquierdo'
  };
  return mapping[normalized] || location;
};

// Función para convertir InjuryType a español (ya viene en español pero por si acaso)
const mapInjuryTypeToSpanish = (type: string): string => {
  const mapping: Record<string, string> = {
    'Molestia': 'Molestia',
    'Dolor': 'Dolor',
    'molestia': 'Molestia',
    'dolor': 'Dolor'
  };
  return mapping[type] || type;
};

// Interfaces para las sesiones
interface AthleteCalendarProps {
  athleteId: number;
  planningId?: number;
  onNavigateToUpload?: (date: Date, sessionId: string) => void; // Callback para navegar a TrainingUpload
}

interface CalendarIntervalSummary {
  id?: string;
  work: string;
  rest: string;
  repetitions: number;
  recoveryTime?: string;
  distancePerRepMeters?: number;
  totalDistanceMeters?: number;
  targetPace?: string;
  intensity?: string;
  notes?: string;
}

interface TrainingSession {
  id: string;
  microcycleId?: string;
  date: string; // YYYY-MM-DD en zona local
  time: string;
  name: string;
  type: 'training' | 'prep_competition' | 'main_competition';
  duration: number; // minutos
  intensity: 'low' | 'medium' | 'high' | 'recovery';
  location?: string;
  status: 'pending' | 'completed' | 'missed';
  coach?: string;
  description?: string;
  intervals?: CalendarIntervalSummary[];
  series?: CalendarSeries[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
  objectives?: string[];
  equipment?: string[];
  targetZones?: {
    heartRate?: string;
    pace?: string;
    effort?: string;
  };
  structureType?: 'simple' | 'advanced';
  volume?: number;
  totalDistanceKm?: number;
  estimatedWorkSeconds?: number;
  estimatedRecoverySeconds?: number;
  trainingSessionAthleteId?: number; // Para verificar si hay workout completado
}

interface CalendarSeriesInterval {
  id: string;
  workSummary: string;
  repetitions: number;
  distancePerRepMeters?: number;
  totalDistanceMeters?: number;
  targetPace?: string;
  recoveryTime?: string;
  intensity?: string;
  notes?: string;
}

interface CalendarSeries {
  id: string;
  name: string;
  repetitions: number;
  recoveryBetweenSets?: string;
  intervals: CalendarSeriesInterval[];
  totalDistanceMeters: number;
}

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDateString = (value: string): Date => {
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr) || 0;
  const month = Number(monthStr) || 1;
  const day = Number(dayStr) || 1;
  return new Date(year, month - 1, day);
};

const formatTimeFromIso = (isoString?: string): string => {
  if (!isoString) return '--:--';
  const parsed = new Date(isoString);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  const [, timePartRaw] = isoString.split('T');
  if (!timePartRaw) return '--:--';
  const withoutTimezone = timePartRaw.replace('Z', '').split(/[+-]/)[0];
  const [hour = '00', minute = '00'] = withoutTimezone.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const parseISODurationToMinutes = (value: string): number => {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 60 + minutes + seconds / 60;
};

const parseTimeStringToMinutes = (value?: string | null): number => {
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (/^PT/i.test(trimmed)) {
    return parseISODurationToMinutes(trimmed);
  }

  const parts = trimmed.split(':').map(part => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  const numbers = parts.map(part => Number(part));
  if (numbers.some(n => Number.isNaN(n))) {
    return 0;
  }

  if (numbers.length === 3) {
    const [hours, minutes, seconds] = numbers;
    return hours * 60 + minutes + seconds / 60;
  }

  if (numbers.length === 2) {
    const [minutes, seconds] = numbers;
    return minutes + seconds / 60;
  }

  return numbers[0];
};

const parseDurationToSeconds = (value?: string | null): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^PT/i.test(trimmed)) {
    const match = trimmed.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (match) {
      const hours = Number(match[1] ?? 0);
      const minutes = Number(match[2] ?? 0);
      const seconds = Number(match[3] ?? 0);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return null;
  }

  if (trimmed.includes(':')) {
    const segments = trimmed.split(':');
    const numbers = segments.map(segment => Number(segment));
    if (numbers.some(num => Number.isNaN(num))) {
      return null;
    }

    if (segments.length === 2) {
      const [minutes, seconds] = numbers;
      return minutes * 60 + seconds;
    }

    if (segments.length === 3) {
      const [hours, minutes, seconds] = numbers;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return null;
  }

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return numeric * 60;
  }

  return null;
};

const formatSecondsAsClock = (seconds?: number | null): string => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '—';
  }

  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDurationLabel = (value?: string | null): string => {
  const seconds = parseDurationToSeconds(value);
  if (seconds === null) {
    return value?.trim() || '—';
  }

  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDistanceMeters = (meters?: number): string => {
  if (meters === undefined || meters === null || Number.isNaN(meters)) return '—';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

const formatDistanceKm = (kilometers?: number): string => {
  if (kilometers === undefined || kilometers === null || Number.isNaN(kilometers)) {
    return '—';
  }
  return `${kilometers.toFixed(2)} km`;
};

const determineTargetPace = (interval: TrainingIntervalResponseDto): string | undefined => {
  if (interval.targetSpeed) {
    return interval.targetSpeed;
  }

  if (interval.paceType && interval.pace !== undefined && interval.pace !== null) {
    return `${interval.pace} ${interval.paceType}`;
  }

  if (interval.targetTime) {
    return formatDurationLabel(interval.targetTime);
  }

  return undefined;
};

const formatIntervalIntensityLabel = (intensity?: string): string | undefined => {
  switch (intensity) {
    case 'easy':
      return 'Suave';
    case 'moderate':
      return 'Moderada';
    case 'hard':
      return 'Alta';
    case 'very_hard':
      return 'Muy alta';
    case 'max':
      return 'Máxima';
    default:
      return undefined;
  }
};

const mapIntervalToCalendarInterval = (interval: TrainingIntervalResponseDto): CalendarSeriesInterval => {
  const repetitions = interval.repetitions && interval.repetitions > 0 ? interval.repetitions : 1;
  const distancePerRepMeters = typeof interval.distance === 'number' ? interval.distance : undefined;
  const totalDistanceMeters = distancePerRepMeters ? distancePerRepMeters * repetitions : undefined;

  return {
    id: interval.id?.toString() ?? `interval-${Math.random().toString(36).slice(2, 10)}`,
    workSummary: summarizeIntervalWork(interval),
    repetitions,
    distancePerRepMeters,
    totalDistanceMeters,
    targetPace: determineTargetPace(interval),
    recoveryTime: interval.recoveryTime,
    intensity: mapIntervalIntensityFromBackend(interval.intensity),
    notes: interval.description
  };
};

const buildSeriesStructure = (session: TrainingSessionResponseDto): CalendarSeries[] => {
  const isSimpleStructure = session.structureType?.toLowerCase() === 'simple';
  const fallbackIntervals = session.intervals ?? [];
  const hasBackendSeries = Array.isArray(session.series) && session.series.length > 0;

  const backendSeries = hasBackendSeries
    ? session.series!
    : [{
        id: 0,
        name: 'Intervalos Simples',
        repetitions: 1,
        recoveryBetweenSets: '00:00',
        orderIndex: 0,
        notes: undefined,
        intervals: fallbackIntervals
      } as TrainingSessionResponseDto['series'][number]];

  if (isSimpleStructure) {
    return [];
  }

  return backendSeries.map((series, index) => {
    const mappedIntervals = (series.intervals ?? []).map(mapIntervalToCalendarInterval);
    const seriesRepetitions = series.repetitions && series.repetitions > 0 ? series.repetitions : 1;
    const baseDistance = mappedIntervals.reduce((sum, interval) => sum + (interval.totalDistanceMeters ?? 0), 0);
    const totalDistanceMeters = baseDistance * seriesRepetitions;

    return {
      id: series.id?.toString() ?? `series-${index}`,
      name: series.name?.trim() || `Serie ${index + 1}`,
      repetitions: seriesRepetitions,
      recoveryBetweenSets: series.recoveryBetweenSets,
      intervals: mappedIntervals,
      totalDistanceMeters
    };
  });
};

const calculateEstimatedTimes = (session: TrainingSessionResponseDto): { workSeconds: number; recoverySeconds: number } => {
  let workSeconds = 0;
  let recoverySeconds = 0;
  const structure = session.structureType?.toLowerCase();

  if (structure === 'simple' || structure === 'intervals') {
    const intervals = session.intervals ?? [];
    intervals.forEach(interval => {
      const reps = interval.repetitions && interval.repetitions > 0 ? interval.repetitions : 1;
      const work = parseDurationToSeconds(interval.duration ?? interval.targetTime) ?? 0;
      const recovery = parseDurationToSeconds(interval.recoveryTime) ?? 0;
      workSeconds += work * reps;
      recoverySeconds += recovery * Math.max(reps - 1, 0);
    });
  } else {
    const seriesList = session.series ?? [];
    seriesList.forEach(series => {
      const seriesRepetitions = series.repetitions && series.repetitions > 0 ? series.repetitions : 1;
      const betweenSetsRecovery = parseDurationToSeconds(series.recoveryBetweenSets) ?? 0;
      (series.intervals ?? []).forEach(interval => {
        const reps = interval.repetitions && interval.repetitions > 0 ? interval.repetitions : 1;
        const work = parseDurationToSeconds(interval.duration ?? interval.targetTime) ?? 0;
        const recovery = parseDurationToSeconds(interval.recoveryTime) ?? 0;
        workSeconds += work * reps * seriesRepetitions;
        recoverySeconds += recovery * Math.max(reps - 1, 0) * seriesRepetitions;
      });
      recoverySeconds += betweenSetsRecovery * Math.max(seriesRepetitions - 1, 0);
    });
  }

  return { workSeconds, recoverySeconds };
};

const calculateSessionDistanceKm = (
  series: CalendarSeries[],
  simpleIntervals?: CalendarSeriesInterval[],
  fallbackVolume?: number
): number | undefined => {
  const seriesMeters = series.reduce((sum, serie) => sum + serie.totalDistanceMeters, 0);
  const intervalsMeters = (simpleIntervals ?? []).reduce((sum, interval) => sum + (interval.totalDistanceMeters ?? 0), 0);
  const totalMeters = seriesMeters + intervalsMeters;
  if (totalMeters > 0) {
    return totalMeters / 1000;
  }

  if (fallbackVolume && !Number.isNaN(Number(fallbackVolume))) {
    return Number(fallbackVolume);
  }

  return undefined;
};

const summarizeIntervalWork = (interval: TrainingIntervalResponseDto): string => {
  if (interval.duration) {
    return formatDurationLabel(interval.duration);
  }

  if (interval.targetTime) {
    return formatDurationLabel(interval.targetTime);
  }

  if (interval.distance) {
    return `${interval.distance} m`;
  }

  if (interval.pace && interval.paceType) {
    return `${interval.paceType} ${interval.pace}`;
  }

  if (interval.description) {
    return interval.description;
  }

  return 'Intervalo';
};

const deriveSessionIntensity = (intervals: TrainingIntervalResponseDto[]): 'low' | 'medium' | 'high' | 'recovery' => {
  const intensities = intervals
    .map(interval => mapIntervalIntensityFromBackend(interval.intensity))
    .filter(Boolean) as Array<'easy' | 'moderate' | 'hard' | 'very_hard' | 'max'>;

  if (intensities.some(intensity => intensity === 'max' || intensity === 'very_hard' || intensity === 'hard')) {
    return 'high';
  }

  if (intensities.some(intensity => intensity === 'moderate')) {
    return 'medium';
  }

  if (intensities.some(intensity => intensity === 'easy')) {
    return 'low';
  }

  return 'medium';
};

const calculateSessionDuration = (intervals: TrainingIntervalResponseDto[]): number => {
  return intervals.reduce((total, interval) => {
    const repetitions = interval.repetitions && interval.repetitions > 0 ? interval.repetitions : 1;
    const workMinutes = parseTimeStringToMinutes(interval.duration ?? interval.targetTime) * repetitions;
    const recoveryMinutes = parseTimeStringToMinutes(interval.recoveryTime) * Math.max(repetitions - 1, 0);
    return total + workMinutes + recoveryMinutes;
  }, 0);
};

const getIntervalsFromSession = (session: TrainingSessionResponseDto): TrainingIntervalResponseDto[] => {
  const structure = session.structureType?.toLowerCase();
  if ((structure === 'simple' || structure === 'intervals') && session.intervals && session.intervals.length > 0) {
    return session.intervals;
  }

  if (session.series && session.series.length > 0) {
    return session.series.flatMap(serie => serie.intervals ?? []);
  }

  return session.intervals ?? [];
};

const mapBackendSessionToCalendar = (session: TrainingSessionResponseDto): TrainingSession => {
  const rawDate = session.date?.toString() ?? '';
  const dateString = rawDate
    ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate)
    : formatLocalDate(new Date());
  const intervals = getIntervalsFromSession(session);
  const duration = calculateSessionDuration(intervals);
  const intensity = deriveSessionIntensity(intervals);
  const series = buildSeriesStructure(session);
  const simpleIntervalDetails = session.structureType?.toLowerCase() === 'simple'
    ? intervals.map(mapIntervalToCalendarInterval)
    : undefined;
  const totalDistanceKm = calculateSessionDistanceKm(
    series,
    simpleIntervalDetails,
    session.volume ? Number(session.volume) : undefined
  );
  const needsFallbackTimes = session.estimatedWorkSeconds == null || session.estimatedRecoverySeconds == null;
  const fallbackTimes = needsFallbackTimes ? calculateEstimatedTimes(session) : null;
  const workSeconds = session.estimatedWorkSeconds ?? fallbackTimes?.workSeconds ?? 0;
  const recoverySeconds = session.estimatedRecoverySeconds ?? fallbackTimes?.recoverySeconds ?? 0;

  return {
    id: session.id.toString(),
    microcycleId: session.microcycleId ? session.microcycleId.toString() : undefined,
    date: dateString,
    time: formatTimeFromIso(rawDate),
    name: session.name || 'Sesión sin nombre',
    type: mapTrainingCategoryFromBackend(session.category) as TrainingSession['type'],
    duration,
    intensity,
    location: undefined,
      status: 'pending',
    coach: undefined,
    description: session.description ?? undefined,
    intervals: session.structureType?.toLowerCase() === 'simple' && simpleIntervalDetails && simpleIntervalDetails.length > 0
      ? simpleIntervalDetails.map(detail => ({
          id: detail.id,
          work: detail.workSummary,
          rest: detail.recoveryTime || '00:00',
          recoveryTime: detail.recoveryTime,
          repetitions: detail.repetitions ?? 1,
          distancePerRepMeters: detail.distancePerRepMeters,
          totalDistanceMeters: detail.totalDistanceMeters,
          targetPace: detail.targetPace,
          intensity: detail.intensity,
          notes: detail.notes
        }))
      : undefined,
    series,
    warmup: undefined,
    cooldown: undefined,
    notes: session.notes ?? undefined,
    objectives: undefined,
    equipment: undefined,
    targetZones: undefined,
    structureType: (session.structureType as 'simple' | 'advanced') ?? undefined,
    volume: session.volume ? Number(session.volume) : undefined,
    totalDistanceKm,
    estimatedWorkSeconds: workSeconds,
    estimatedRecoverySeconds: recoverySeconds,
    trainingSessionAthleteId: session.trainingSessionAthleteId,
    hasCompletedWorkout: session.hasCompletedWorkout ?? false
  };
};

export function AthleteCalendar({ athleteId, planningId, onNavigateToUpload }: AthleteCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasCompletedWorkout, setHasCompletedWorkout] = useState<boolean>(false);
  const [completedWorkout, setCompletedWorkout] = useState<any>(null);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);

  useEffect(() => {
    if (!athleteId) {
      setTrainingSessions([]);
      return;
    }

    let isMounted = true;

    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const sessions = await TrainingSessionService.getTrainingSessionsByAthleteId(athleteId, planningId);
        if (!isMounted) return;

        const mappedSessions = sessions.map(mapBackendSessionToCalendar);
        setTrainingSessions(mappedSessions);
        setLoadError(null);
      } catch (error) {
        if (!isMounted) return;
        setLoadError('No se pudieron cargar las sesiones del atleta.');
        setTrainingSessions([]);
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [athleteId, planningId]);

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const startDate = new Date(firstDay);
    const firstWeekday = firstDay.getDay();
    startDate.setDate(firstDay.getDate() - firstWeekday);
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  // Funciones para el calendario
  const getSessionsForDay = (date: Date) => {
    const dateKey = formatLocalDate(date);
    return trainingSessions.filter(session => session.date === dateKey);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
    if (direction === 'prev') {
        next.setMonth(prev.getMonth() - 1);
    } else {
        next.setMonth(prev.getMonth() + 1);
    }
      return startOfMonth(next);
    });
  };

  const goToToday = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'recovery': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prep_competition': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'main_competition': return 'bg-red-100 text-red-800 border-red-200';
      case 'recovery': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return 'Entrenamiento';
      case 'prep_competition': return 'Competencia Prep.';
      case 'main_competition': return 'Competencia Principal';
      case 'recovery': return 'Recuperación';
      default: return 'Sesión';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatSessionDate = (dateString: string) => {
    const date = parseLocalDateString(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleSessionDetail = async (session: TrainingSession) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
    // Usar el valor del backend directamente
    const hasResults = session.hasCompletedWorkout ?? false;
    setHasCompletedWorkout(hasResults);
    
    // Si hay resultados, cargar los detalles del workout
    if (hasResults && session.trainingSessionAthleteId) {
      try {
        const workout = await CompletedWorkoutService.getCompletedWorkoutByTrainingSessionAthleteIdAndDate(
          session.trainingSessionAthleteId,
          session.date
        );
        setCompletedWorkout(workout);
      } catch (error) {
        console.error('Error al cargar detalles del workout:', error);
        setCompletedWorkout(null);
      }
    } else {
      setCompletedWorkout(null);
    }
  };

  const handleViewWorkoutResults = () => {
    setShowWorkoutDetails(true);
  };

  const handleNavigateToUpload = () => {
    if (!selectedSession) return;
    
    // Parsear la fecha como fecha local (sin conversión UTC)
    // selectedSession.date está en formato "YYYY-MM-DD"
    const [year, month, day] = selectedSession.date.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day); // month es 0-indexed
    setIsSessionDetailOpen(false);
    
    if (onNavigateToUpload) {
      onNavigateToUpload(sessionDate, selectedSession.id);
    }
  };

  // Estadísticas rápidas
  const totalSessions = trainingSessions.length;
  const completedCount = trainingSessions.filter(s => s.hasCompletedWorkout === true).length;
  const pendingCount = totalSessions - completedCount;
  const thisMonthSessions = trainingSessions.filter(s => {
    if (!s.date) return false;
    const sessionDate = parseLocalDateString(s.date);
    return sessionDate.getMonth() === currentMonth.getMonth() && 
           sessionDate.getFullYear() === currentMonth.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Calendario de Entrenamientos</h1>
        <p className="text-muted-foreground mt-1">
          Vista completa de todas tus sesiones programadas
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalSessions}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Sesiones</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Completadas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{thisMonthSessions}</div>
              <div className="text-sm text-muted-foreground mt-1">Este Mes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendario Mensual</CardTitle>
              <CardDescription>
                Todas tus sesiones organizadas por fecha
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="px-4 py-2 text-sm font-medium">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={currentMonth}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentMonth(startOfMonth(date));
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSessions && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando sesiones...</span>
            </div>
          )}

          {/* Encabezados de días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const sessions = getSessionsForDay(date);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                  } ${isToday ? 'ring-2 ring-primary/50' : ''}`}
                >
                  <div className={`text-sm mb-2 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  } ${isToday ? 'font-semibold text-primary' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {sessions.slice(0, 3).map((session) => {
                      const hasResults = session.hasCompletedWorkout ?? false;
                      return (
                        <div
                          key={session.id}
                          className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: getIntensityColor(session.intensity) + '20' }}
                          onClick={() => handleSessionDetail(session)}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                            {hasResults && (
                              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" title="Resultados cargados" />
                            )}
                            <span className="font-medium truncate flex-1">{session.name}</span>
                          </div>
                        </div>
                      );
                    })}
                    {sessions.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{sessions.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoadingSessions && trainingSessions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No hay sesiones asignadas para mostrar.
            </div>
          )}

          {/* Leyenda de intensidades */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Recuperación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Baja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Alta</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalle de Sesión */}
      {selectedSession && (
        <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getIntensityColor(selectedSession.intensity)}`}></div>
                {selectedSession.name}
              </DialogTitle>
              <DialogDescription>
                {formatSessionDate(selectedSession.date)} • {selectedSession.time || '--:--'}
                {selectedSession.location ? ` • ${selectedSession.location}` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Distancia estimada</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceKm(selectedSession.totalDistanceKm ?? selectedSession.volume)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Intensidad</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedSession.intensity === 'low' ? 'Baja' :
                     selectedSession.intensity === 'medium' ? 'Media' :
                     selectedSession.intensity === 'high' ? 'Alta' : 'Recuperación'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estructura</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedSession.structureType === 'advanced' ? 'Series con intervalos' : 'Intervalos simples'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Categoría</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {getSessionTypeLabel(selectedSession.type)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Trabajo estimado</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatSecondsAsClock(selectedSession.estimatedWorkSeconds)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Recuperación estimada</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatSecondsAsClock(selectedSession.estimatedRecoverySeconds)}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{selectedSession.description || 'Sin descripción disponible.'}</p>
              </div>

              {/* Calentamiento */}
              {selectedSession.warmup && (
                <div>
                  <h4 className="font-medium mb-2">Calentamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.warmup}</p>
                </div>
              )}

              {/* Series e intervalos */}
              {selectedSession.structureType === 'advanced' && selectedSession.series && selectedSession.series.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-3">Series e intervalos</h4>
                  <Accordion
                    type="multiple"
                    defaultValue={selectedSession.series.map((series, index) => series.id || `series-${index}`)}
                    className="space-y-2"
                  >
                    {selectedSession.series.map((series, index) => (
                      <AccordionItem key={series.id || `series-${index}`} value={series.id || `series-${index}`}>
                        <AccordionTrigger className="w-full">
                          <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-left">
                            <div>
                              <p className="font-medium">{series.name}</p>
                              <p className="text-sm text-muted-foreground">Serie {index + 1}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">Reps: {series.repetitions}</Badge>
                              <Badge variant="secondary">Dist: {formatDistanceMeters(series.totalDistanceMeters)}</Badge>
                              {series.recoveryBetweenSets && (
                                <Badge variant="outline">
                                  Recup. series: {formatDurationLabel(series.recoveryBetweenSets)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {series.intervals.length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                Esta serie no contiene intervalos configurados.
                              </p>
                            )}
                            {series.intervals.map((interval, intervalIndex) => (
                              <div key={interval.id || `interval-${intervalIndex}`} className="rounded-lg border p-4 space-y-2">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-medium">Intervalo {intervalIndex + 1}: {interval.workSummary}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Repeticiones: {interval.repetitions}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {interval.targetPace && (
                                      <Badge variant="outline">Ritmo: {interval.targetPace}</Badge>
                                    )}
                                    {interval.intensity && (
                                      <Badge variant="outline">
                                        Intensidad: {formatIntervalIntensityLabel(interval.intensity)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    Distancia por rep.: {formatDistanceMeters(interval.distancePerRepMeters)}
                                  </div>
                                  <div>
                                    Distancia total: {formatDistanceMeters(interval.totalDistanceMeters)}
                                  </div>
                                  {interval.recoveryTime && (
                                    <div>
                                      Recuperación: {formatDurationLabel(interval.recoveryTime)}
                                    </div>
                                  )}
                                </div>
                                {interval.notes && (
                                  <p className="text-sm text-muted-foreground">
                                    Notas: {interval.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : selectedSession.structureType !== 'advanced' && selectedSession.intervals && selectedSession.intervals.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-3">Intervalos</h4>
                  <div className="space-y-3">
                    {selectedSession.intervals.map((interval, index) => (
                      <div key={interval.id || `simple-interval-${index}`} className="border rounded-lg p-4 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium">Intervalo {index + 1}: {interval.work}</p>
                            <p className="text-sm text-muted-foreground">
                              Repeticiones: {interval.repetitions}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {interval.targetPace && (
                              <Badge variant="outline">Ritmo: {interval.targetPace}</Badge>
                            )}
                            {interval.intensity && (
                              <Badge variant="outline">
                                Intensidad: {formatIntervalIntensityLabel(interval.intensity)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            Distancia por rep.: {formatDistanceMeters(interval.distancePerRepMeters)}
                          </div>
                          <div>
                            Distancia total: {formatDistanceMeters(interval.totalDistanceMeters)}
                          </div>
                          {interval.recoveryTime && (
                            <div>
                              Recuperación: {formatDurationLabel(interval.recoveryTime)}
                            </div>
                          )}
                        </div>
                        {interval.notes && (
                          <p className="text-sm text-muted-foreground">Notas: {interval.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                selectedSession.intervals && selectedSession.intervals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Intervalos</h4>
                  <div className="space-y-2">
                    {selectedSession.intervals.map((interval, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{interval.repetitions}x</span> {interval.work}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Descanso: {interval.rest}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )
              )}

              {/* Enfriamiento */}
              {selectedSession.cooldown && (
                <div>
                  <h4 className="font-medium mb-2">Enfriamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.cooldown}</p>
                </div>
              )}

              {/* Objetivos */}
              {selectedSession.objectives && selectedSession.objectives.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Objetivos</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedSession.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Zonas objetivo */}
              {selectedSession.targetZones && (
                <div>
                  <h4 className="font-medium mb-2">Zonas Objetivo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedSession.targetZones.heartRate && (
                      <div>
                        <span className="text-sm font-medium">Frecuencia Cardíaca:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.heartRate}</p>
                      </div>
                    )}
                    {selectedSession.targetZones.pace && (
                      <div>
                        <span className="text-sm font-medium">Ritmo:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.pace}</p>
                      </div>
                    )}
                    {selectedSession.targetZones.effort && (
                      <div>
                        <span className="text-sm font-medium">Esfuerzo:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.effort}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Equipamiento */}
              {selectedSession.equipment && selectedSession.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Equipamiento Necesario</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.equipment.map((item, index) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedSession.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notas Adicionales</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-4">
              {(() => {
                // Verificar si la fecha es futura
                const [year, month, day] = selectedSession.date.split('-').map(Number);
                const sessionDate = new Date(year, month - 1, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                sessionDate.setHours(0, 0, 0, 0);
                const isFutureDate = sessionDate > today;
                
                return (
                  <>
                    {!hasCompletedWorkout && selectedSession.trainingSessionAthleteId && !isFutureDate && (
                      <Alert className="bg-accent/10 border-accent/20">
                        <Info className="h-4 w-4 text-accent" />
                        <AlertDescription className="text-sm">
                          No se han cargado los resultados de este entrenamiento aún. Puedes cargarlos ahora.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {hasCompletedWorkout && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-sm text-green-900">
                          Los resultados de este entrenamiento ya han sido cargados.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                );
              })()}

              <div className="flex w-full justify-end gap-2">
                {hasCompletedWorkout && (
                  <Button 
                    onClick={handleViewWorkoutResults}
                    variant="outline"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Resultados
                  </Button>
                )}
                {!hasCompletedWorkout && selectedSession.trainingSessionAthleteId && onNavigateToUpload && (() => {
                  // Verificar si la fecha es futura
                  const [year, month, day] = selectedSession.date.split('-').map(Number);
                  const sessionDate = new Date(year, month - 1, day);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  sessionDate.setHours(0, 0, 0, 0);
                  const isFutureDate = sessionDate > today;
                  
                  if (isFutureDate) {
                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button 
                                onClick={handleNavigateToUpload}
                                className="gap-2"
                                disabled={true}
                              >
                                <Upload className="w-4 h-4" />
                                Cargar Resultados
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>No se pueden cargar resultados para entrenamientos futuros</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }
                  
                  return (
                    <Button 
                      onClick={handleNavigateToUpload}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Cargar Resultados
                    </Button>
                  );
                })()}
                <Button variant="outline" onClick={() => setIsSessionDetailOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para mostrar detalles del workout completado */}
      {showWorkoutDetails && completedWorkout && (
        <Dialog open={showWorkoutDetails} onOpenChange={setShowWorkoutDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resultados del Entrenamiento
              </DialogTitle>
              <DialogDescription>
                {completedWorkout.name} - {format(new Date(completedWorkout.date), "PPP", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Métricas principales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métricas Principales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Distancia</p>
                      <p className="text-lg font-semibold">{completedWorkout.distance} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duración</p>
                      <p className="text-lg font-semibold">
                        {(() => {
                          const minutes = Math.floor(completedWorkout.duration / 60);
                          const seconds = completedWorkout.duration % 60;
                          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">FC Promedio</p>
                      <p className="text-lg font-semibold">{completedWorkout.averageHR} bpm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ritmo Promedio</p>
                      <p className="text-lg font-semibold">
                        {(() => {
                          if (completedWorkout.distance > 0 && completedWorkout.duration > 0) {
                            const paceSecondsPerKm = completedWorkout.duration / completedWorkout.distance;
                            const mins = Math.floor(paceSecondsPerKm / 60);
                            const secs = Math.round(paceSecondsPerKm % 60);
                            return `${mins}:${secs.toString().padStart(2, '0')}/km`;
                          }
                          return 'N/A';
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sensaciones */}
              {completedWorkout.sensations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sensaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="flex flex-col items-center justify-start text-center min-h-[60px]">
                        <p className="text-xs text-muted-foreground mb-2 h-8 flex items-center justify-center">Esfuerzo</p>
                        <p className="text-lg font-semibold">{completedWorkout.sensations.effort}/10</p>
                      </div>
                      <div className="flex flex-col items-center justify-start text-center min-h-[60px]">
                        <p className="text-xs text-muted-foreground mb-2 h-8 flex items-center justify-center">Fatiga</p>
                        <p className="text-lg font-semibold">{completedWorkout.sensations.fatigue}/10</p>
                      </div>
                      <div className="flex flex-col items-center justify-start text-center min-h-[60px]">
                        <p className="text-xs text-muted-foreground mb-2 h-8 flex items-center justify-center">Motivación</p>
                        <p className="text-lg font-semibold">{completedWorkout.sensations.motivation}/10</p>
                      </div>
                      <div className="flex flex-col items-center justify-start text-center min-h-[60px]">
                        <p className="text-xs text-muted-foreground mb-2 h-8 flex items-center justify-center leading-tight">Carga<br />Muscular</p>
                        <p className="text-lg font-semibold">{completedWorkout.sensations.muscularLoad}/10</p>
                      </div>
                      <div className="flex flex-col items-center justify-start text-center min-h-[60px]">
                        <p className="text-xs text-muted-foreground mb-2 h-8 flex items-center justify-center leading-tight">Sensación<br />General</p>
                        <p className="text-lg font-semibold">{completedWorkout.sensations.overallFeeling}/10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vueltas/Intervalos */}
              {completedWorkout.laps && completedWorkout.laps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vueltas/Intervalos ({completedWorkout.laps.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {completedWorkout.laps.map((lap: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Vuelta #{lap.index}</p>
                              <p className="font-medium">{lap.distance} km</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Duración</p>
                              <p className="font-medium">
                                {(() => {
                                  const mins = Math.floor(lap.duration / 60);
                                  const secs = Math.round(lap.duration % 60);
                                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">FC Prom</p>
                              <p className="font-medium">{lap.averageHR} bpm</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Velocidad</p>
                              <p className="font-medium">{lap.speed.toFixed(2)} m/s</p>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  if (lap.speed > 0) {
                                    const paceSecondsPerKm = 1000 / lap.speed;
                                    const mins = Math.floor(paceSecondsPerKm / 60);
                                    const secs = Math.round(paceSecondsPerKm % 60);
                                    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
                                  }
                                  return 'N/A';
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Inicio</p>
                              <p className="font-medium text-xs">
                                {format(new Date(lap.startTime), 'HH:mm', { locale: es })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Molestias/Lesiones */}
              {completedWorkout.injuries && completedWorkout.injuries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Molestias/Lesiones ({completedWorkout.injuries.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {completedWorkout.injuries.map((injury: any, index: number) => (
                        <Alert key={index} variant="destructive" className="bg-destructive/10">
                          <ShieldAlert className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{mapInjuryLocationToSpanish(injury.bodyPart)}</p>
                                <p className="text-sm">{injury.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  Severidad: {injury.severity}/10 - {mapInjuryTypeToSpanish(injury.type)}
                                  {injury.affectedPerformance && ' - Afectó el rendimiento'}
                                </p>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comentarios */}
              {completedWorkout.comments && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comentarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{completedWorkout.comments}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWorkoutDetails(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
