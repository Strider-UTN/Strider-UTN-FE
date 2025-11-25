import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { CoachRetroalimentacionSystem } from './CoachFeedbackSystem';
import { SessionRetroalimentacionModal } from './SessionFeedbackModal';
import { SessionComparisonView } from './SessionComparisonView';
import { 
  MessageSquare, 
  Users, 
  Filter,
  Eye,
  Edit3,
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { CompletedWorkoutService, CompletedWorkoutsGroupedByAthleteDto, CompletedWorkoutResponseDto } from '../services/completedWorkoutService';
import { CoachAthleteRelationshipService } from '../services/coachAthleteRelationshipService';
import { TrainingSessionService } from '../services/trainingSessionService';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Función helper para parsear fechas correctamente evitando problemas de zona horaria
// Si la fecha viene como string ISO (ej: "2025-10-15T00:00:00Z"), extraer solo la parte de fecha
const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  // Extraer solo la parte de fecha (YYYY-MM-DD) de strings ISO
  const dateOnly = dateString.split('T')[0];
  const [yearStr, monthStr, dayStr] = dateOnly.split('-');
  const year = Number(yearStr) || 0;
  const month = Number(monthStr) || 1;
  const day = Number(dayStr) || 1;
  // Crear fecha en zona horaria local para evitar problemas de conversión
  return new Date(year, month - 1, day);
};

// Tipos de datos mock
interface SessionPlan {
  id: string;
  name: string;
  date: string;
  type: 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series';
  plannedDistance: number;
  plannedDuration: number;
  plannedIntensity: number;
  plannedPace: string;
  intervals: Array<{
    type: 'work' | 'rest';
    distance?: number;
    duration?: number;
    intensity: number;
    description: string;
  }>;
  objectives?: string[];
  notes?: string;
}

interface SessionActual {
  id: string;
  sessionId: string;
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  heartRate?: {
    avg: number;
    max: number;
  };
  perceivedExertion: number;
  weather?: {
    temperature: number;
    condition: string;
  };
  route?: string;
  comments?: string;
  sensations?: string; // Comentarios sobre cómo se sintió durante el entrenamiento
  completed: boolean;
  injuries?: Array<{
    type: 'Molestia' | 'Dolor';
    location: string;
    severity: number;
    description?: string;
  }>;
  intervals?: Array<{
    intervalNumber: number;
    actualDistance?: number;
    actualDuration?: number;
    actualPace: string;
    avgHeartRate?: number;
    maxHeartRate?: number;
    perceivedExertion?: number;
    comments?: string;
  }>;
}

interface AthleteWeekData {
  athleteId: string;
  athleteName: string;
  sede: string;
  sessions: Array<{
    plan: SessionPlan;
    actual?: SessionActual;
  }>;
  weeklyStats: {
    plannedVolume: number;
    actualVolume: number;
    completionRate: number;
    avgIntensityCompliance: number;
    avgPerceivedExertion: number;
    injuryCount: number;
  };
}

export function FeedbackManagement() {
  // Filtros simplificados: solo fecha y atleta
  // Por defecto: última semana (hace 7 días hasta hoy)
  const defaultDateTo = new Date();
  const defaultDateFrom = subDays(defaultDateTo, 7);
  
  const [selectedAthlete, setSelectedAthlete] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultDateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(defaultDateTo);
  const [isFromDateOpen, setIsFromDateOpen] = useState(false);
  const [isToDateOpen, setIsToDateOpen] = useState(false);
  
  const [viewingEvaluation, setViewingEvaluation] = useState<string | null>(null);
  const [workoutsForEvaluation, setWorkoutsForEvaluation] = useState<CompletedWorkoutsGroupedByAthleteDto[]>([]);
  const [pendingEvaluationAthleteId, setPendingEvaluationAthleteId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'pending' | 'evaluated'>('pending');
  const [evaluatingAthlete, setEvaluatingAthlete] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{
    plan: SessionPlan;
    actual?: SessionActual;
    athleteName: string;
  } | null>(null);
  const [feedbackSession, setFeedbackSession] = useState<{
    plan: SessionPlan;
    actual?: SessionActual;
    athleteName: string;
    existingFeedback?: any;
    completedWorkoutId?: number;
    trainingSessionId?: number;
  } | null>(null);

  // Estados para datos del backend
  const [workoutsGrouped, setWorkoutsGrouped] = useState<CompletedWorkoutsGroupedByAthleteDto[]>([]);
  const [workoutsPending, setWorkoutsPending] = useState<CompletedWorkoutsGroupedByAthleteDto[]>([]);
  const [workoutsEvaluated, setWorkoutsEvaluated] = useState<CompletedWorkoutsGroupedByAthleteDto[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [availableAthletes, setAvailableAthletes] = useState<Array<{id: number, name: string}>>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);
  const [totalSessionsByAthlete, setTotalSessionsByAthlete] = useState<Record<number, number>>({});
  const [totalSessionsEvaluatedByAthlete, setTotalSessionsEvaluatedByAthlete] = useState<Record<number, number>>({});
  const [trainingSessionsMap, setTrainingSessionsMap] = useState<Map<number, number>>(new Map());

  // Cargar volúmenes planificados de las sesiones de entrenamiento
  useEffect(() => {
    const loadTrainingSessions = async () => {
      const sessionIds = new Set<number>();
      workoutsGrouped.forEach(group => {
        group.workouts.forEach(workout => {
          if (workout.trainingSessionId) {
            sessionIds.add(workout.trainingSessionId);
          }
        });
      });

      if (sessionIds.size === 0) return;

      const volumesMap = new Map<number, number>();
      // Cargar sesiones en paralelo
      const promises = Array.from(sessionIds).map(async (sessionId) => {
        try {
          const session = await TrainingSessionService.getTrainingSessionById(sessionId);
          if (session && session.volume !== undefined) {
            volumesMap.set(sessionId, session.volume);
          }
        } catch (error) {
          console.error(`Error loading training session ${sessionId}:`, error);
        }
      });

      await Promise.all(promises);
      setTrainingSessionsMap(volumesMap);
    };

    if (workoutsGrouped.length > 0) {
      loadTrainingSessions();
    }
  }, [workoutsGrouped]);

  // Cargar atletas al montar
  useEffect(() => {
    const loadAthletes = async () => {
      setIsLoadingAthletes(true);
      try {
        const athletesData = await CoachAthleteRelationshipService.getMyAthletes('Accepted');
        setAvailableAthletes(athletesData
          .filter(a => a.id)
          .map(a => ({
            id: a.id,
            name: a.name
          })));
      } catch (error) {
        console.error('Error al cargar atletas:', error);
        toast.error('Error al cargar atletas');
      } finally {
        setIsLoadingAthletes(false);
      }
    };
    loadAthletes();
  }, []);

  // Función para cargar workouts pendientes
  const loadPendingWorkouts = async () => {
    setIsLoadingWorkouts(true);
    try {
      const filters: {
        athleteId?: number;
        startDate?: string;
        endDate?: string;
        hasFeedback?: boolean;
      } = {
        hasFeedback: false // Solo pendientes (sin feedback)
      };

      if (selectedAthlete !== 'all') {
        filters.athleteId = Number(selectedAthlete);
      }

      if (dateFrom) {
        filters.startDate = format(startOfDay(dateFrom), 'yyyy-MM-dd');
      }

      if (dateTo) {
        filters.endDate = format(endOfDay(dateTo), 'yyyy-MM-dd');
      }

      const data = await CompletedWorkoutService.getForCoachWithFiltersGroupedByAthlete(filters);
      
      // Ya vienen filtrados del backend, no necesitamos filtrar de nuevo
      setWorkoutsPending(data);
      setWorkoutsGrouped(data); // Mantener para compatibilidad
    } catch (error: any) {
      console.error('Error al cargar workouts pendientes:', error);
      if (error?.response?.status === 403) {
        toast.error('No tienes permisos para acceder a esta información', {
          description: 'Asegúrate de estar autenticado como entrenador'
        });
      } else if (error?.response?.status !== 401) {
        toast.error('Error al cargar entrenamientos pendientes');
      }
      setWorkoutsPending([]);
      setWorkoutsGrouped([]);
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  // Función para cargar workouts evaluados
  const loadEvaluatedWorkouts = async () => {
    setIsLoadingWorkouts(true);
    try {
      const filters: {
        athleteId?: number;
        startDate?: string;
        endDate?: string;
        hasFeedback?: boolean;
      } = {
        hasFeedback: true // Solo evaluados (con feedback)
      };

      if (selectedAthlete !== 'all') {
        // Remover el prefijo "evaluated-" si existe
        const athleteIdStr = selectedAthlete.replace('evaluated-', '');
        filters.athleteId = Number(athleteIdStr);
      }

      // Por defecto, traer solo la última semana si no hay filtros de fecha
      if (!dateFrom && !dateTo) {
        const today = new Date();
        const weekAgo = subDays(today, 7);
        filters.startDate = format(startOfDay(weekAgo), 'yyyy-MM-dd');
        filters.endDate = format(endOfDay(today), 'yyyy-MM-dd');
      } else {
        if (dateFrom) {
          filters.startDate = format(startOfDay(dateFrom), 'yyyy-MM-dd');
        }

        if (dateTo) {
          filters.endDate = format(endOfDay(dateTo), 'yyyy-MM-dd');
        }
      }

      const data = await CompletedWorkoutService.getForCoachWithFiltersGroupedByAthlete(filters);
      
      // Ya vienen filtrados del backend, no necesitamos filtrar de nuevo
      setWorkoutsEvaluated(data);
    } catch (error: any) {
      console.error('Error al cargar workouts evaluados:', error);
      if (error?.response?.status === 403) {
        toast.error('No tienes permisos para acceder a esta información', {
          description: 'Asegúrate de estar autenticado como entrenador'
        });
      } else if (error?.response?.status !== 401) {
        toast.error('Error al cargar entrenamientos evaluados');
      }
      setWorkoutsEvaluated([]);
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  // Cargar workouts según la vista activa
  useEffect(() => {
    if (activeView === 'pending') {
      loadPendingWorkouts();
    } else {
      loadEvaluatedWorkouts();
    }
  }, [selectedAthlete, dateFrom, dateTo, activeView]);

  // Cargar total de sesiones asignadas para cada atleta cuando cambian los workouts
  // useEffect para establecer viewingEvaluation cuando workoutsForEvaluation tenga datos
  useEffect(() => {
    console.log('useEffect for pendingEvaluationAthleteId triggered:', {
      pendingEvaluationAthleteId,
      workoutsForEvaluationLength: workoutsForEvaluation.length,
      workoutsForEvaluation
    });
    
    if (pendingEvaluationAthleteId && workoutsForEvaluation.length > 0) {
      const athleteIdNum = Number(pendingEvaluationAthleteId);
      console.log('Looking for athlete group:', athleteIdNum);
      const athleteGroup = workoutsForEvaluation.find(g => g.athleteId === athleteIdNum);
      console.log('Found athleteGroup:', athleteGroup);
      
      if (athleteGroup && athleteGroup.workouts.length > 0) {
        console.log('Setting viewingEvaluation now that data is ready');
        setViewingEvaluation(pendingEvaluationAthleteId);
        setPendingEvaluationAthleteId(null);
      } else {
        console.log('Athlete group not found or has no workouts:', { athleteGroup, workoutsLength: athleteGroup?.workouts.length });
      }
    } else {
      console.log('Conditions not met:', { 
        hasPendingId: !!pendingEvaluationAthleteId, 
        hasWorkouts: workoutsForEvaluation.length > 0 
      });
    }
  }, [pendingEvaluationAthleteId, workoutsForEvaluation]);

  useEffect(() => {
    const loadTotalSessions = async () => {
      const currentWorkouts = activeView === 'pending' ? workoutsPending : workoutsEvaluated;
      if (currentWorkouts.length === 0) {
        setTotalSessionsByAthlete({});
        return;
      }

      const totals: Record<number, number> = {};
      
      // Para cada grupo de atleta, obtener el total de sesiones asignadas en el rango de fechas
      for (const group of currentWorkouts) {
        try {
          // Obtener todas las sesiones asignadas al atleta
          const allSessions = await TrainingSessionService.getTrainingSessionsByAthleteId(group.athleteId);
          
          // Determinar el rango de fechas a usar
          let filterStartDate: Date | undefined = dateFrom;
          let filterEndDate: Date | undefined = dateTo;
          
          // Si no hay filtros de fecha, usar el rango de los workouts
          if (!filterStartDate || !filterEndDate) {
            const sortedWorkouts = [...group.workouts].sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return dateA - dateB;
            });
            
            if (sortedWorkouts.length > 0) {
              filterStartDate = startOfDay(new Date(sortedWorkouts[0].date));
              filterEndDate = endOfDay(new Date(sortedWorkouts[sortedWorkouts.length - 1].date));
            }
          }
          
          // Filtrar por rango de fechas
          let filteredSessions = allSessions;
          if (filterStartDate && filterEndDate) {
            filteredSessions = allSessions.filter(session => {
              const sessionDate = new Date(session.date);
              return sessionDate >= filterStartDate! && sessionDate <= filterEndDate!;
            });
          }
          
          totals[group.athleteId] = filteredSessions.length;
        } catch (error) {
          console.error(`Error al cargar sesiones para atleta ${group.athleteId}:`, error);
          // Si falla, usar el número de completed workouts como fallback
          totals[group.athleteId] = group.workouts.length;
        }
      }
      
      setTotalSessionsByAthlete(totals);
    };

    loadTotalSessions();
  }, [workoutsPending, workoutsEvaluated, activeView, dateFrom, dateTo]);

  // Función helper para calcular el ritmo
  const calculatePace = (distanceKm: number, durationSeconds: number): string => {
    if (distanceKm === 0 || durationSeconds === 0) return '00:00/km';
    const secondsPerKm = durationSeconds / distanceKm;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  // Convertir datos del backend a la estructura esperada por el componente
  const athleteDataFromBackend = useMemo(() => {
    const currentWorkouts = activeView === 'pending' ? workoutsPending : workoutsEvaluated;
    return currentWorkouts.map(group => {
      const sessions = group.workouts.map(workout => {
        // Obtener volumen planificado de la sesión de entrenamiento (en km)
        const plannedVolumeKm = trainingSessionsMap.get(workout.trainingSessionId) || 0;
        
        return {
        workoutId: workout.id, // Guardar el ID del CompletedWorkout
        trainingSessionId: workout.trainingSessionId, // Guardar el ID de la sesión planificada
        plan: {
          id: workout.trainingSessionId.toString(),
          name: workout.trainingSessionName,
          date: workout.date,
          type: workout.name.includes('Intervalo') ? 'Intervalos' as const : 
                workout.name.includes('Tempo') ? 'Tempo' as const :
                workout.name.includes('Fondo') ? 'Continuo' as const : 'Continuo' as const,
          plannedDistance: plannedVolumeKm, // Usar volumen planificado de la sesión (ya en km)
          plannedDuration: workout.duration / 60, // Convertir segundos a minutos
          plannedIntensity: workout.averageHR > 170 ? 90 : workout.averageHR > 150 ? 75 : 60,
          plannedPace: plannedVolumeKm > 0 ? calculatePace(plannedVolumeKm, workout.duration) : 'N/A', // calculatePace espera km
          intervals: workout.laps.map((lap, idx) => ({
            type: 'work' as const,
            distance: lap.distance,
            duration: lap.duration,
            intensity: lap.averageHR > 170 ? 90 : lap.averageHR > 150 ? 75 : 60,
            description: `Lap ${lap.index}`
          })),
          // Información de planificación
          planningName: workout.planningName,
          mesocycleName: workout.mesocycleName,
          microcycleName: workout.microcycleName
        },
        actual: {
          id: workout.id.toString(),
          sessionId: workout.trainingSessionId.toString(),
          actualDistance: workout.distance, // En metros
          actualDuration: workout.duration / 60,
          actualPace: calculatePace(workout.distance / 1000, workout.duration), // calculatePace espera km
          heartRate: {
            avg: workout.averageHR,
            max: workout.averageHR + 10 // Aproximación
          },
          perceivedExertion: workout.sensations?.effort || 5,
          comments: workout.comments,
          sensations: workout.comments,
          completed: true,
          injuries: workout.injuries.map(inj => ({
            type: inj.type === 'Molestia' ? 'Molestia' as const : 'Dolor' as const,
            location: inj.bodyPart,
            severity: inj.severity,
            description: inj.description
          })),
          intervals: workout.laps.map(lap => ({
            intervalNumber: lap.index,
            actualDistance: lap.distance,
            actualDuration: lap.duration,
            actualPace: calculatePace(lap.distance, lap.duration),
            avgHeartRate: lap.averageHR,
            maxHeartRate: lap.averageHR + 10
          }))
        },
        // Feedback existente si existe
        coachFeedback: workout.feedback ? {
          id: workout.feedback.id.toString(),
          sessionId: workout.trainingSessionId.toString(),
          microcycleId: workout.microcycleId?.toString() || 'current-microcycle',
          feedbackText: workout.feedback.feedback,
          rating: (() => {
            const ratingValue = workout.feedback.rating || workout.rating;
            const normalized = typeof ratingValue === 'string' ? ratingValue.toLowerCase() : '';
            return normalized === 'excellent' ? 'excellent' :
                   normalized === 'good' ? 'good' :
                   normalized === 'needsimprovement' ? 'needs_improvement' : 'concerning';
          })(),
          recommendations: workout.feedback.recommendations,
          createdAt: workout.feedback.createdAt,
          updatedAt: workout.feedback.updatedAt
        } : undefined
      };
      });

      return {
        athleteId: group.athleteId.toString(),
        athleteName: group.athleteName,
        sede: group.trainingGroupName || 'Sin sede',
        sessions,
        weeklyStats: {
          plannedVolume: sessions.reduce((sum, s) => sum + (s.plan.plannedDistance || 0), 0),
          actualVolume: sessions.reduce((sum, s) => sum + ((s.actual?.actualDistance || 0) / 1000), 0), // Convertir de metros a km
          completionRate: 100,
          avgIntensityCompliance: 85,
          avgPerceivedExertion: sessions.reduce((sum, s) => sum + (s.actual?.perceivedExertion || 0), 0) / sessions.length || 0,
          injuryCount: sessions.reduce((sum, s) => sum + (s.actual?.injuries?.length || 0), 0)
        }
      };
    });
  }, [workoutsPending, workoutsEvaluated, activeView, trainingSessionsMap]);

  // Datos mock eliminados - ahora se usan datos del backend
  const mockAthleteData: AthleteWeekData[] = athleteDataFromBackend;
  
  // Datos mock para demostración (mantenidos temporalmente para compatibilidad)
  const mockAthleteDataOld: AthleteWeekData[] = [
    {
      athleteId: '1',
      athleteName: 'Juan Pérez',
      sede: 'Sede Madrid Centro',
      sessions: [
        {
          plan: {
            id: 'session-1',
            name: 'Carrera Tempo 8km',
            date: '2024-01-15',
            type: 'Tempo',
            plannedDistance: 8.0,
            plannedDuration: 35,
            plannedIntensity: 85,
            plannedPace: '4:22',
            intervals: [
              {
                type: 'work',
                duration: 25,
                intensity: 85,
                description: 'Ritmo tempo sostenido'
              }
            ],
            objectives: ['Mejorar umbral anaeróbico', 'Mantener ritmo constante'],
            notes: 'Enfocarse en respiración controlada'
          },
          actual: {
            id: 'actual-1',
            sessionId: 'session-1',
            actualDistance: 8.2,
            actualDuration: 36,
            actualPace: '4:23',
            heartRate: {
              avg: 165,
              max: 175
            },
            perceivedExertion: 7,
            weather: {
              temperature: 18,
              condition: 'Nublado'
            },
            route: 'Parque del Retiro - Circuito Principal',
            comments: 'Me sentí muy bien durante toda la sesión. Ritmo controlado.',
            sensations: 'Excelente día de entrenamiento. Las piernas respondían muy bien, respiración controlada durante todo el tempo. Sentí que podría haber mantenido ese ritmo por más tiempo.',
            completed: true,
            injuries: [
              {
                type: 'Molestia',
                location: 'Talón izquierdo',
                severity: 3,
                description: 'Molestia leve al final, probablemente por las zapatillas nuevas'
              }
            ],
            intervals: [
              {
                intervalNumber: 1,
                actualDuration: 25,
                actualPace: '4:20',
                avgHeartRate: 168,
                perceivedExertion: 7
              }
            ]
          }
        },
        {
          plan: {
            id: 'session-2',
            name: 'Intervalos 5x1000m',
            date: '2024-01-17',
            type: 'Intervalos',
            plannedDistance: 7.0,
            plannedDuration: 30,
            plannedIntensity: 95,
            plannedPace: '3:45',
            intervals: [
              {
                type: 'work',
                distance: 1.0,
                intensity: 95,
                description: '1000m a ritmo VO₂ Max'
              },
              {
                type: 'rest',
                duration: 3,
                intensity: 60,
                description: 'Recuperación activa'
              }
            ]
          },
          actual: {
            id: 'actual-2',
            sessionId: 'session-2',
            actualDistance: 6.5,
            actualDuration: 28,
            actualPace: '3:48',
            heartRate: {
              avg: 180,
              max: 190
            },
            perceivedExertion: 9,
            comments: 'Último intervalo muy duro. Tuve que parar 30 segundos en el 4to.',
            sensations: 'Los primeros 3 intervalos se sintieron bien, pero a partir del 4to las piernas empezaron a fallar. Notaba como si no llegara oxígeno suficiente a los músculos.',
            completed: false,
            injuries: [
              {
                type: 'Molestia',
                location: 'Pantorrilla izquierda',
                severity: 2,
                description: 'Molestia leve al final del entrenamiento'
              }
            ]
          }
        }
      ],
      weeklyStats: {
        plannedVolume: 45.0,
        actualVolume: 42.3,
        completionRate: 85,
        avgIntensityCompliance: 88,
        avgPerceivedExertion: 7.2,
        injuryCount: 1
      }
    },
    {
      athleteId: '2',
      athleteName: 'María García',
      sede: 'Sede Madrid Norte',
      sessions: [
        {
          plan: {
            id: 'session-3',
            name: 'Carrera Larga 15km',
            date: '2024-01-16',
            type: 'Continuo',
            plannedDistance: 15.0,
            plannedDuration: 75,
            plannedIntensity: 70,
            plannedPace: '5:00',
            intervals: []
          },
          actual: {
            id: 'actual-3',
            sessionId: 'session-3',
            actualDistance: 15.1,
            actualDuration: 74,
            actualPace: '4:54',
            heartRate: {
              avg: 145,
              max: 155
            },
            perceivedExertion: 6,
            comments: 'Excelente sesión. Me sentí muy cómoda todo el tiempo.',
            sensations: 'Me sentí como flotando durante todo el recorrido. Ritmo muy cómodo, piernas ligeras, y pude mantener una conversación mental fluida. Terminé con ganas de seguir corriendo.',
            completed: true,
            injuries: [] // Ninguna molestia reportada
          }
        }
      ],
      weeklyStats: {
        plannedVolume: 55.0,
        actualVolume: 56.2,
        completionRate: 100,
        avgIntensityCompliance: 95,
        avgPerceivedExertion: 6.8,
        injuryCount: 0
      }
    },
    {
      athleteId: '3',
      athleteName: 'Carlos Ruiz',
      sede: 'Sede Madrid Sur',
      sessions: [
        {
          plan: {
            id: 'session-4',
            name: 'Intervalos 8x400m',
            date: '2024-01-14',
            type: 'Intervalos',
            plannedDistance: 6.0,
            plannedDuration: 25,
            plannedIntensity: 90,
            plannedPace: '3:30',
            intervals: [
              {
                type: 'work',
                distance: 0.4,
                intensity: 90,
                description: '400m a ritmo de 1500m'
              },
              {
                type: 'rest',
                duration: 2,
                intensity: 50,
                description: 'Recuperación caminando'
              }
            ],
            objectives: ['Mejorar velocidad anaeróbica', 'Técnica de carrera'],
            notes: 'Concentrarse en mantener la forma en las últimas repeticiones'
          },
          actual: {
            id: 'actual-4',
            sessionId: 'session-4',
            actualDistance: 5.2,
            actualDuration: 23,
            actualPace: '3:35',
            heartRate: {
              avg: 185,
              max: 195
            },
            perceivedExertion: 8,
            comments: 'Paré en la repetición 6. Me dolía mucho la rodilla derecha.',
            sensations: 'Al principio me sentía bien, con buena potencia en las piernas. Pero después de la 4ta repetición empecé a sentir una molestia en la rodilla que se fue intensificando hasta convertirse en dolor punzante.',
            completed: false,
            injuries: [
              {
                type: 'Dolor',
                location: 'Rodilla derecha',
                severity: 6,
                description: 'Dolor punzante durante los intervalos rápidos'
              }
            ]
          }
        },
        {
          plan: {
            id: 'session-5',
            name: 'Carrera Recuperación 5km',
            date: '2024-01-16',
            type: 'Recuperación',
            plannedDistance: 5.0,
            plannedDuration: 30,
            plannedIntensity: 60,
            plannedPace: '6:00',
            intervals: [],
            notes: 'Muy suave, enfoque en recuperación'
          }
          // No actual - sesión no realizada
        }
      ],
      weeklyStats: {
        plannedVolume: 35.0,
        actualVolume: 18.7,
        completionRate: 50,
        avgIntensityCompliance: 75,
        avgPerceivedExertion: 8.0,
        injuryCount: 1
      }
    }
  ];

  const handleSessionDetail = (sessionPlan: SessionPlan, sessionActual?: SessionActual) => {
    const athlete = mockAthleteData.find(a => 
      a.sessions.some(s => s.plan.id === sessionPlan.id)
    );
    
    if (athlete) {
      setSelectedSession({
        plan: sessionPlan,
        actual: sessionActual,
        athleteName: athlete.athleteName
      });
    }
  };

  const handleViewEvaluation = async (athleteId: string) => {
    // Remover el prefijo "evaluated-" si existe
    const cleanAthleteId = athleteId.replace('evaluated-', '');
    const athleteIdNum = Number(cleanAthleteId);
    
    console.log('handleViewEvaluation called:', { athleteId, cleanAthleteId, athleteIdNum });
    
    // Cargar workouts evaluados para este atleta aplicando los filtros de fecha seleccionados
    try {
      const filters: {
        athleteId?: number;
        hasFeedback?: boolean;
        startDate?: string;
        endDate?: string;
      } = {
        athleteId: athleteIdNum,
        hasFeedback: true // Solo evaluados
      };

      // Aplicar filtros de fecha si están seleccionados
      if (dateFrom) {
        filters.startDate = format(startOfDay(dateFrom), 'yyyy-MM-dd');
      }

      if (dateTo) {
        filters.endDate = format(endOfDay(dateTo), 'yyyy-MM-dd');
      }

      const data = await CompletedWorkoutService.getForCoachWithFiltersGroupedByAthlete(filters);
      console.log('Loaded workouts for evaluation:', data);
      console.log('Data length:', data.length);
      if (data.length > 0) {
        console.log('First group:', data[0]);
        console.log('Workouts in first group:', data[0].workouts.length);
        console.log('Athlete ID in first group:', data[0].athleteId);
      } else {
        console.warn('No workouts found for athlete:', athleteIdNum);
        toast.warning('No se encontraron entrenamientos evaluados para este atleta');
        return;
      }
      // Guardar el athleteId pendiente para que el useEffect lo establezca cuando los datos estén listos
      setWorkoutsForEvaluation(data);
      setPendingEvaluationAthleteId(cleanAthleteId);
    } catch (error) {
      console.error('Error loading workouts for evaluation:', error);
      toast.error('Error al cargar los datos de evaluación');
    }
  };

  const handleEvaluateAthlete = (athleteId: string, editMode: boolean = false) => {
    setEvaluatingAthlete(athleteId);
    setIsEditMode(editMode);
  };

  // Datos mock para evaluaciones históricas con microciclos completos
  const getHistoricalEvaluationData = (athleteId: string) => {
    const evaluationData = {
      'evaluated-1': {
        athlete: {
          id: 'evaluated-1',
          name: 'María González',
          vo2max: 58,
          sede: 'Club Atletismo Madrid'
        },
        microcycle: {
          id: 'micro-maria-week3',
          weekNumber: 3,
          startDate: '2024-01-15',
          endDate: '2024-01-21',
          focus: 'Resistencia aeróbica',
          intensity: 'media' as const,
          volume: 45,
          microcycleFeedback: {
            overallRating: 'excellent' as const,
            summary: 'Excelente semana de entrenamiento. María mostró gran consistencia en todas las sesiones y mantuvo un alto nivel de intensidad cuando era requerido. Su capacidad de recuperación ha mejorado notablemente.',
            recommendations: 'Continuar con el volumen actual. En la próxima semana podemos introducir intervalos más largos a ritmo umbral.',
            createdAt: '2024-01-22T10:30:00.000Z'
          },
          sessions: [
            {
              plan: {
                id: 'session-maria-1',
                name: 'Resistencia Base',
                date: '2024-01-15',
                type: 'Fondo' as const,
                plannedDistance: 12.0,
                plannedDuration: 65,
                plannedIntensity: 6.5,
                plannedPace: '5:25',
                notes: 'Trote continuo en zona aeróbica'
              },
              actual: {
                id: 'actual-maria-1',
                sessionId: 'session-maria-1',
                actualDistance: 12.2,
                actualDuration: 64,
                actualPace: '5:15',
                perceivedExertion: 6,
                heartRate: { avg: 152, max: 168 },
                sensations: 'Excelente sensación durante todo el entrenamiento',
                notes: 'Me sentí muy bien, las piernas respondieron bien',
                completed: true,
                completedAt: '2024-01-15T08:30:00.000Z',
                injuries: []
              },
              coachFeedback: {
                id: 'feedback-session-maria-1',
                sessionId: 'session-maria-1',
                microcycleId: 'micro-maria-week3',
                rating: 'excellent' as const,
                feedbackText: 'Excelente ejecución. Ritmo perfecto para el objetivo aeróbico.',
                recommendations: 'Mantener esta consistencia',
                createdAt: '2024-01-16T09:00:00.000Z'
              }
            },
            {
              plan: {
                id: 'session-maria-2',
                name: 'Intervalos 4x1000m',
                date: '2024-01-17',
                type: 'Intervalos' as const,
                plannedDistance: 8.0,
                plannedDuration: 45,
                plannedIntensity: 8.5,
                plannedPace: '4:30',
                notes: '4x1000m a ritmo 5K con 2min recuperación'
              },
              actual: {
                id: 'actual-maria-2',
                sessionId: 'session-maria-2',
                actualDistance: 8.1,
                actualDuration: 46,
                actualPace: '4:28',
                perceivedExertion: 8,
                heartRate: { avg: 175, max: 188 },
                sensations: 'Los intervalos fueron exigentes pero los completé todos bien',
                notes: 'Intervalos ejecutados perfectamente, recuperaciones respetadas',
                completed: true,
                completedAt: '2024-01-17T07:30:00.000Z',
                injuries: []
              },
              coachFeedback: {
                id: 'feedback-session-maria-2',
                sessionId: 'session-maria-2',
                microcycleId: 'micro-maria-week3',
                rating: 'excellent' as const,
                feedbackText: 'Intervalos ejecutados con precisión. Ritmos consistentes.',
                recommendations: 'Preparada para intervalos más largos',
                createdAt: '2024-01-18T08:30:00.000Z'
              }
            }
          ]
        }
      }
    };

    return evaluationData[athleteId as keyof typeof evaluationData] || null;
  };

  // Convertir datos del backend a atletas pendientes
  const mockPendingAthletes = useMemo(() => {
    return workoutsPending.map(group => {
        const pendingWorkouts = group.workouts; // Ya vienen filtrados sin feedback
        
        // Contar sesiones únicas con completed workout (por trainingSessionId)
        const uniqueSessionIds = new Set<number>();
        pendingWorkouts.forEach(workout => {
          if (workout.trainingSessionId) {
            uniqueSessionIds.add(workout.trainingSessionId);
          }
        });
        const completedSessionsCount = uniqueSessionIds.size;
        
        // Ordenar por fecha y obtener el rango correcto
        const sortedWorkouts = [...pendingWorkouts].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        
        const startDate = sortedWorkouts[0]?.date 
          ? format(new Date(sortedWorkouts[0].date), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
        
        const endDate = sortedWorkouts[sortedWorkouts.length - 1]?.date
          ? format(new Date(sortedWorkouts[sortedWorkouts.length - 1].date), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
        
        return {
          id: group.athleteId.toString(),
          name: group.athleteName,
          sede: group.trainingGroupName || 'Sin sede',
          weekNumber: 1, // Placeholder
          startDate,
          endDate,
          completedSessions: completedSessionsCount, // Sesiones únicas con completed workout
          totalSessions: totalSessionsByAthlete[group.athleteId] ?? completedSessionsCount,
          injuryCount: pendingWorkouts.reduce((sum, w) => sum + (w.injuries?.length || 0), 0)
        };
      });
  }, [workoutsPending, totalSessionsByAthlete]);

  // Cargar totales de sesiones para atletas evaluados (última semana)
  useEffect(() => {
    const loadTotalSessionsForEvaluated = async () => {
      if (workoutsEvaluated.length === 0) {
        setTotalSessionsEvaluatedByAthlete({});
        return;
      }

      const totals: Record<number, number> = {};
      
      for (const group of workoutsEvaluated) {
        try {
          const reviewedWorkouts = group.workouts;
          if (reviewedWorkouts.length === 0) continue;
          
          // Ordenar por fecha descendente
          const sortedWorkouts = [...reviewedWorkouts].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });
          
          // Obtener la fecha más reciente y calcular rango de última semana
          const mostRecentDate = new Date(sortedWorkouts[0].date);
          const weekStart = new Date(mostRecentDate);
          weekStart.setDate(weekStart.getDate() - 6); // Últimos 7 días
          
          // Obtener todas las sesiones asignadas al atleta
          const allSessions = await TrainingSessionService.getTrainingSessionsByAthleteId(group.athleteId);
          
          // Filtrar por rango de fechas de la última semana
          const filteredSessions = allSessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= weekStart && sessionDate <= mostRecentDate;
          });
          
          totals[group.athleteId] = filteredSessions.length;
        } catch (error) {
          console.error(`Error al cargar sesiones para atleta ${group.athleteId}:`, error);
          // Si falla, usar el número de workouts como fallback
          totals[group.athleteId] = group.workouts.length;
        }
      }
      
      setTotalSessionsEvaluatedByAthlete(totals);
    };

    loadTotalSessionsForEvaluated();
  }, [workoutsEvaluated]);

  const mockEvaluatedAthletes = useMemo(() => {
    return workoutsEvaluated.map(group => {
        const reviewedWorkouts = group.workouts; // Ya vienen filtrados con feedback
        
        // Filtrar workouts por el rango de fechas seleccionado (igual que en handleViewEvaluation)
        let filteredWorkouts = reviewedWorkouts;
        if (dateFrom || dateTo) {
          filteredWorkouts = reviewedWorkouts.filter(w => {
            const workoutDate = new Date(w.date);
            if (dateFrom && workoutDate < startOfDay(dateFrom)) return false;
            if (dateTo && workoutDate > endOfDay(dateTo)) return false;
            return true;
          });
        }
        
        if (filteredWorkouts.length === 0) return null;
        
        // Contar sesiones únicas con feedback (por trainingSessionId) - esto corresponde con "Ver Evaluación"
        const uniqueSessionIds = new Set<number>();
        filteredWorkouts.forEach(workout => {
          if (workout.trainingSessionId) {
            uniqueSessionIds.add(workout.trainingSessionId);
          }
        });
        const evaluatedSessionsCount = uniqueSessionIds.size;
        
        // Calcular promedio de calificación
        const ratings: number[] = [];
        filteredWorkouts.forEach(w => {
          const rating = w.feedback?.rating || w.rating;
          if (!rating) return;
          const normalized = typeof rating === 'string' ? rating.toLowerCase() : '';
          // Mapear a valores numéricos para calcular promedio
          if (normalized === 'excellent') ratings.push(4);
          else if (normalized === 'good') ratings.push(3);
          else if (normalized === 'needsimprovement' || normalized === 'needs_improvement') ratings.push(2);
          else if (normalized === 'concerning' || normalized === 'doesnotmeetobjectives') ratings.push(1);
        });
        
        const averageRating = ratings.length > 0 
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : null;
        
        // Ordenar por fecha para obtener la más reciente
        const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        
        const startDate = sortedWorkouts[sortedWorkouts.length - 1]?.date 
          ? format(new Date(sortedWorkouts[sortedWorkouts.length - 1].date), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
        
        const endDate = sortedWorkouts[0]?.date
          ? format(new Date(sortedWorkouts[0].date), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
        
        return {
          id: `evaluated-${group.athleteId}`,
          name: group.athleteName,
          sede: group.trainingGroupName || 'Sin sede',
          weekNumber: 1, // Placeholder
          startDate,
          endDate,
          evaluatedSessions: evaluatedSessionsCount, // Sesiones evaluadas (corresponde con "Ver Evaluación")
          averageRating, // Promedio de calificación
          injuryCount: filteredWorkouts.reduce((sum, w) => sum + (w.injuries?.length || 0), 0),
          evaluationDate: sortedWorkouts[0]?.feedback?.createdAt || new Date().toISOString()
        };
      })
      .filter(athlete => athlete !== null) as Array<{
        id: string;
        name: string;
        sede: string;
        weekNumber: number;
        startDate: string;
        endDate: string;
        evaluatedSessions: number;
        averageRating: string | null;
        injuryCount: number;
        evaluationDate: string;
      }>;
  }, [workoutsEvaluated, dateFrom, dateTo]);

  // Datos mock antiguos (mantenidos temporalmente para compatibilidad)
  const mockPendingAthletesOld = [
    {
      id: '1',
      name: 'Juan Pérez',
      sede: 'Sede Madrid Centro',
      weekNumber: 4,
      startDate: '2024-01-22',
      endDate: '2024-01-28',
      completedSessions: 5,
      totalSessions: 6,
      injuryCount: 1
    },
    {
      id: '2',
      name: 'María García',
      sede: 'Sede Madrid Norte',
      weekNumber: 4,
      startDate: '2024-01-22',
      endDate: '2024-01-28',
      completedSessions: 6,
      totalSessions: 6,
      injuryCount: 0
    },
    {
      id: '3',
      name: 'Carlos Ruiz',
      sede: 'Sede Madrid Sur',
      weekNumber: 4,
      startDate: '2024-01-22',
      endDate: '2024-01-28',
      completedSessions: 3,
      totalSessions: 6,
      injuryCount: 1
    }
  ];

  // Datos mock antiguos eliminados - ahora se usan datos del backend

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    } else if (direction === 'next' && selectedWeek < 52) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const handleSaveFeedback = (feedback: any, type: 'session' | 'microcycle', id: string) => {
    // Aquí implementarías la lógica para guardar el feedback
    console.log('Saving feedback:', { feedback, type, id });
    // toast.success('Feedback guardado exitosamente');
  };

  const handleOpenSessionFeedback = (sessionPlan: any, sessionActual?: any) => {
    console.log('Opening session feedback for:', sessionPlan.id, 'Viewing evaluation:', viewingEvaluation, 'Evaluating athlete:', evaluatingAthlete);
    console.log('Session plan:', sessionPlan);
    console.log('Session actual:', sessionActual);
    
    // Si estamos viendo una evaluación, usar los datos del backend
    if (viewingEvaluation && evaluationDataFromBackend) {
      // Buscar la sesión en los datos de evaluación para obtener el feedback existente
      const sessionWithFeedback = evaluationDataFromBackend.microcycle.sessions.find(
        s => String(s.plan.id) === String(sessionPlan.id)
      );
      
      // Buscar el workout completo para obtener los IDs
      const athleteIdNum = Number(viewingEvaluation);
      const athleteGroup = workoutsForEvaluation.find(g => g.athleteId === athleteIdNum);
      const workout = athleteGroup?.workouts.find(w => 
        w.trainingSessionId.toString() === String(sessionPlan.id)
      );
      
      setFeedbackSession({
        plan: sessionPlan,
        actual: sessionActual,
        athleteName: evaluationDataFromBackend.athlete.name,
        existingFeedback: sessionWithFeedback?.coachFeedback,
        completedWorkoutId: workout?.id,
        trainingSessionId: workout?.trainingSessionId
      });
      return;
    }
    
    // Intentar encontrar el atleta en mockAthleteData
    let athlete = mockAthleteData.find(a => 
      a.sessions.some(s => {
        const planId = String(s.plan.id);
        const sessionPlanId = String(sessionPlan.id);
        return planId === sessionPlanId;
      })
    );
    
    // Si no se encuentra y estamos evaluando un atleta, usar esos datos
    if (!athlete && evaluatingAthlete) {
      const athleteData = mockAthleteData.find(a => a.athleteId === evaluatingAthlete);
      if (athleteData) {
        athlete = athleteData;
      }
    }
    
    console.log('Found athlete:', athlete?.athleteName, 'Sessions count:', athlete?.sessions.length);
    
    if (athlete) {
      // Buscar la sesión completa en athleteDataFromBackend para obtener los IDs
      // Intentar buscar por ID de sesión planificada (puede venir como string o number)
      const sessionData = athlete.sessions.find(s => {
        const planId = String(s.plan.id);
        const sessionPlanId = String(sessionPlan.id);
        return planId === sessionPlanId;
      });
      
      console.log('Found session data:', sessionData);
      
      if (sessionData) {
        setFeedbackSession({
          plan: sessionPlan,
          actual: sessionActual || sessionData.actual,
          athleteName: athlete.athleteName,
          existingFeedback: (sessionData as any)?.coachFeedback,
          completedWorkoutId: (sessionData as any)?.workoutId,
          trainingSessionId: (sessionData as any)?.trainingSessionId || (typeof sessionPlan.id === 'number' ? sessionPlan.id : parseInt(sessionPlan.id))
        });
        console.log('Feedback session set with:', {
          completedWorkoutId: (sessionData as any)?.workoutId,
          trainingSessionId: (sessionData as any)?.trainingSessionId
        });
      } else {
        console.log('Session data not found for plan id:', sessionPlan.id, 'Available sessions:', athlete.sessions.map(s => ({ id: s.plan.id, name: s.plan.name })));
        // Fallback: intentar usar el ID directamente si viene como número
        const trainingSessionId = typeof sessionPlan.id === 'number' ? sessionPlan.id : parseInt(sessionPlan.id);
        if (!isNaN(trainingSessionId)) {
          console.log('Using fallback trainingSessionId:', trainingSessionId);
          setFeedbackSession({
            plan: sessionPlan,
            actual: sessionActual,
            athleteName: athlete.athleteName,
            existingFeedback: undefined,
            completedWorkoutId: undefined,
            trainingSessionId: trainingSessionId
          });
        }
      }
    } else {
      console.log('No athlete found for session:', sessionPlan.id, 'Available athletes:', mockAthleteData.map(a => ({ id: a.athleteId, name: a.athleteName })));
    }
  };

  const handleSaveSessionFeedback = async (feedback: any) => {
    // El feedback ya se guardó en el backend desde SessionRetroalimentacionModal
    // Recargar ambas vistas para reflejar los cambios
    try {
      await Promise.all([
        loadPendingWorkouts(),
        loadEvaluatedWorkouts()
      ]);
      toast.success('Retroalimentación guardada exitosamente');
    } catch (error) {
      console.error('Error al recargar workouts:', error);
      toast.error('Error al recargar los datos');
    }
    setFeedbackSession(null);
  };

  // Los datos ya vienen filtrados del backend (solo pendientes)
  const filteredPendingAthletes = useMemo(() => {
    return mockPendingAthletes.filter(athlete => {
      const matchesAthlete = selectedAthlete === 'all' || athlete.id === selectedAthlete;
      return matchesAthlete;
    });
  }, [mockPendingAthletes, selectedAthlete]);

  // Los datos ya vienen filtrados del backend
  const filteredEvaluatedAthletes = useMemo(() => {
    return mockEvaluatedAthletes.filter(athlete => {
      if (selectedAthlete === 'all') return true;
      // Comparar tanto con el ID con prefijo como sin prefijo
      const athleteIdStr = String(athlete.id);
      const selectedIdStr = String(selectedAthlete);
      return athleteIdStr === selectedIdStr || 
             athleteIdStr === `evaluated-${selectedIdStr}` ||
             athleteIdStr.replace('evaluated-', '') === selectedIdStr.replace('evaluated-', '');
    });
  }, [mockEvaluatedAthletes, selectedAthlete]);

  // Lista completa de atletas para el selector
  const allAthletes = useMemo(() => {
    const combined = [...mockPendingAthletes, ...mockEvaluatedAthletes];
    return Array.from(new Map(combined.map(a => [a.id, a])).values());
  }, [mockPendingAthletes, mockEvaluatedAthletes]);

  // Log al inicio del render para debugging
  console.log('Component render:', { 
    evaluatingAthlete, 
    viewingEvaluation, 
    workoutsForEvaluationLength: workoutsForEvaluation.length 
  });

  // Construir datos de evaluación desde el backend (debe estar antes de cualquier return temprano)
  const evaluationDataFromBackend = useMemo(() => {
    console.log('useMemo evaluationDataFromBackend executing:', { viewingEvaluation, workoutsForEvaluationLength: workoutsForEvaluation.length });
    if (!viewingEvaluation) {
      console.log('No viewingEvaluation, returning null');
      return null;
    }

    const athleteIdNum = Number(viewingEvaluation);
    console.log('Building evaluationDataFromBackend:', { 
      viewingEvaluation, 
      athleteIdNum, 
      workoutsForEvaluationLength: workoutsForEvaluation.length,
      workoutsForEvaluation 
    });
    // Usar workoutsForEvaluation que tiene todos los workouts del atleta, no solo la última semana
    const athleteGroup = workoutsForEvaluation.find(g => g.athleteId === athleteIdNum);
    
    console.log('Found athleteGroup:', athleteGroup);
    console.log('Athlete IDs in workoutsForEvaluation:', workoutsForEvaluation.map(g => ({ id: g.athleteId, name: g.athleteName })));
    if (!athleteGroup || athleteGroup.workouts.length === 0) {
      console.log('No athleteGroup or no workouts', { athleteGroup, workoutsLength: athleteGroup?.workouts.length });
      return null;
    }

    // Ordenar workouts por fecha
    const sortedWorkouts = [...athleteGroup.workouts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Obtener rango de fechas
    const startDate = sortedWorkouts[0]?.date 
      ? format(new Date(sortedWorkouts[0].date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    
    const endDate = sortedWorkouts[sortedWorkouts.length - 1]?.date
      ? format(new Date(sortedWorkouts[sortedWorkouts.length - 1].date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    // Construir sesiones con feedback
    const sessions = sortedWorkouts.map(workout => {
      // Obtener volumen planificado de la sesión de entrenamiento (en km)
      const plannedVolumeKm = trainingSessionsMap.get(workout.trainingSessionId) || 0;
      
      return {
      plan: {
        id: workout.trainingSessionId.toString(),
        name: workout.trainingSessionName,
        date: workout.date,
        type: workout.name.includes('Intervalo') ? 'Intervalos' as const : 
              workout.name.includes('Tempo') ? 'Tempo' as const :
              workout.name.includes('Fondo') ? 'Fondo' as const : 'Fondo' as const,
        plannedDistance: plannedVolumeKm, // Usar volumen planificado de la sesión (ya en km)
        plannedDuration: workout.duration / 60,
        plannedIntensity: workout.averageHR > 170 ? 90 : workout.averageHR > 150 ? 75 : 60,
        plannedPace: plannedVolumeKm > 0 ? calculatePace(plannedVolumeKm, workout.duration) : 'N/A', // calculatePace espera km
        notes: workout.comments || undefined
      },
      actual: {
        id: workout.id.toString(),
        sessionId: workout.trainingSessionId.toString(),
        actualDistance: workout.distance, // En metros
        actualDuration: workout.duration / 60,
        actualPace: calculatePace(workout.distance / 1000, workout.duration), // calculatePace espera km
        perceivedExertion: workout.sensations?.effort || 5,
        heartRate: {
          avg: workout.averageHR,
          max: workout.averageHR + 10
        },
        notes: workout.comments,
        sensations: workout.comments,
        completed: true,
        completedAt: workout.date,
        injuries: workout.injuries.map(inj => ({
          type: inj.type === 'Molestia' ? 'Molestia' as const : 'Dolor' as const,
          location: inj.bodyPart,
          severity: inj.severity,
          description: inj.description
        }))
      },
      coachFeedback: workout.feedback ? {
        id: workout.feedback.id.toString(),
        sessionId: workout.trainingSessionId.toString(),
        microcycleId: workout.microcycleId?.toString() || 'current-microcycle',
        feedbackText: workout.feedback.feedback,
        rating: (() => {
          const ratingValue = workout.feedback.rating || workout.rating;
          const normalized = typeof ratingValue === 'string' ? ratingValue.toLowerCase() : '';
          return normalized === 'excellent' ? 'excellent' :
                 normalized === 'good' ? 'good' :
                 normalized === 'needsimprovement' ? 'needs_improvement' : 'concerning';
        })(),
        recommendations: workout.feedback.recommendations,
        createdAt: workout.feedback.createdAt,
        updatedAt: workout.feedback.updatedAt
      } : undefined
    };
    });

    return {
      athlete: {
        id: athleteGroup.athleteId.toString(),
        name: athleteGroup.athleteName,
        vo2max: 50, // Valor por defecto, no viene del backend
        sede: athleteGroup.trainingGroupName
      },
      microcycle: {
        id: `microcycle-${athleteGroup.athleteId}`,
        weekNumber: 1,
        startDate,
        endDate,
        focus: 'Evaluación de sesiones completadas',
        intensity: 'media' as const,
        volume: sessions.reduce((sum, s) => sum + ((s.actual?.actualDistance || 0) / 1000), 0), // Convertir de metros a km
        sessions
      }
    };
  }, [viewingEvaluation, workoutsForEvaluation, trainingSessionsMap]);

  // Si estamos viendo una evaluación, mostrar el componente de retroalimentación con datos del backend
  if (viewingEvaluation && evaluationDataFromBackend) {
    console.log('Rendering evaluation view with data:', evaluationDataFromBackend);
    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingEvaluation(null)}
              className="flex items-center gap-2"
            >
              ← Volver a Atletas Evaluados
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              Evaluación - <span className="text-primary">{evaluationDataFromBackend.athlete.name}</span>
            </h1>
          </div>

          <CoachRetroalimentacionSystem
            athlete={evaluationDataFromBackend.athlete}
            microcycle={evaluationDataFromBackend.microcycle}
            onSaveFeedback={handleSaveFeedback}
            onOpenSessionFeedback={handleOpenSessionFeedback}
            isEditMode={false}
          />
        </div>

        {/* Modal de feedback de sesión en modo readonly */}
        {feedbackSession && (
          <SessionRetroalimentacionModal
            isOpen={!!feedbackSession}
            onClose={() => setFeedbackSession(null)}
            plannedSession={feedbackSession.plan}
            actualSession={feedbackSession.actual}
            existingFeedback={feedbackSession.existingFeedback}
            athleteName={feedbackSession.athleteName}
            onSaveFeedback={handleSaveSessionFeedback}
            readOnly={true}
            completedWorkoutId={feedbackSession.completedWorkoutId}
            trainingSessionId={feedbackSession.trainingSessionId}
          />
        )}

          {/* Modal de comparación detallada */}
          {selectedSession && (
            <SessionComparisonView
              isOpen={!!selectedSession}
              onClose={() => setSelectedSession(null)}
              sessionPlan={selectedSession.plan}
              sessionActual={selectedSession.actual}
              athleteName={selectedSession.athleteName}
            />
          )}
        </>
      );
    }

  // Si estamos evaluando un atleta (pendiente o editando evaluado), mostrar el componente de retroalimentación
  if (evaluatingAthlete) {
    // Primero intentar buscar en atletas pendientes
    let athleteData = mockAthleteData.find(a => a.athleteId === evaluatingAthlete);
    let pendingAthlete = mockPendingAthletes.find(a => a.id === evaluatingAthlete);
    
    // Si no está en pendientes y estamos en modo edición, buscar en evaluados
    let existingEvaluationData = null;
    if (isEditMode && !pendingAthlete) {
      existingEvaluationData = getHistoricalEvaluationData(evaluatingAthlete);
      if (existingEvaluationData) {
        // Usar los datos de la evaluación existente
        athleteData = {
          athleteId: existingEvaluationData.athlete.id,
          athleteName: existingEvaluationData.athlete.name,
          sede: existingEvaluationData.athlete.sede || '',
          sessions: existingEvaluationData.microcycle.sessions.map(s => ({
            plan: s.plan,
            actual: s.actual || undefined
          })),
          weeklyStats: {
            plannedVolume: existingEvaluationData.microcycle.volume,
            actualVolume: existingEvaluationData.microcycle.volume,
            completionRate: 80,
            avgIntensityCompliance: 85,
            avgPerceivedExertion: 7.5,
            injuryCount: 0
          }
        };
        pendingAthlete = {
          id: existingEvaluationData.athlete.id,
          name: existingEvaluationData.athlete.name,
          startDate: existingEvaluationData.microcycle.startDate,
          endDate: existingEvaluationData.microcycle.endDate,
          weekNumber: existingEvaluationData.microcycle.weekNumber,
          completedSessions: 5,
          totalSessions: 6,
          injuryCount: 0,
          sede: existingEvaluationData.athlete.sede || ''
        };
      }
    }
    
    if (athleteData && pendingAthlete) {
      const microcycleData = existingEvaluationData ? existingEvaluationData.microcycle : {
        id: `microcycle-${pendingAthlete.weekNumber}`,
        weekNumber: pendingAthlete.weekNumber,
        startDate: pendingAthlete.startDate,
        endDate: pendingAthlete.endDate,
        focus: 'Desarrollo Aeróbico',
        intensity: 'media' as const,
        volume: athleteData.weeklyStats.plannedVolume,
        sessions: athleteData.sessions.map(session => ({
          plan: {
            ...session.plan,
            plannedIntensity: session.plan.plannedIntensity / 10
          },
          actual: session.actual ? {
            ...session.actual,
            notes: session.actual.comments,
            completedAt: session.actual.completed ? new Date().toISOString() : ''
          } : null,
          coachFeedback: undefined
        }))
      };

      return (
        <>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEvaluatingAthlete(null);
                  setIsEditMode(false);
                }}
                className="flex items-center gap-2"
              >
                ← Volver a Atletas {isEditMode ? 'Evaluados' : 'Pendientes'}
              </Button>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary">
                {isEditMode ? 'Editar Evaluación' : 'Evaluación'} - <span className="text-primary">{athleteData.athleteName}</span>
              </h1>
            </div>

            <CoachRetroalimentacionSystem
              athlete={{
                id: athleteData.athleteId,
                name: athleteData.athleteName,
                vo2max: 65,
                sede: athleteData.sede
              }}
              microcycle={microcycleData}
              onSaveFeedback={handleSaveFeedback}
              onOpenSessionFeedback={handleOpenSessionFeedback}
              isEditMode={isEditMode}
            />
          </div>

          {/* Modal de feedback de sesión */}
          {feedbackSession && (
            <SessionRetroalimentacionModal
              isOpen={!!feedbackSession}
              onClose={() => setFeedbackSession(null)}
              plannedSession={feedbackSession.plan}
              actualSession={feedbackSession.actual}
              existingFeedback={feedbackSession.existingFeedback}
              athleteName={feedbackSession.athleteName}
              onSaveFeedback={handleSaveSessionFeedback}
              completedWorkoutId={feedbackSession.completedWorkoutId}
              trainingSessionId={feedbackSession.trainingSessionId}
            />
          )}

          {/* Modal de comparación detallada */}
          {selectedSession && (
            <SessionComparisonView
              isOpen={!!selectedSession}
              onClose={() => setSelectedSession(null)}
              sessionPlan={selectedSession.plan}
              sessionActual={selectedSession.actual}
              athleteName={selectedSession.athleteName}
            />
          )}
        </>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Retroalimentación de Entrenamientos</h1>
        <p className="text-muted-foreground">
          Análisis comparativo entre entrenamientos planificados y realizados
        </p>
      </div>

      {/* Controles de filtrado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Atleta</Label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete} disabled={isLoadingAthletes}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAthletes ? "Cargando..." : "Todos los atletas"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los atletas</SelectItem>
                  {availableAthletes.filter(a => a.id).map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id.toString()}>
                      {athlete.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Popover open={isFromDateOpen} onOpenChange={setIsFromDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => {
                      setDateFrom(date);
                      setIsFromDateOpen(false);
                    }}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Popover open={isToDateOpen} onOpenChange={setIsToDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => {
                      setDateTo(date);
                      setIsToDateOpen(false);
                    }}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector de vista: Pendientes vs Evaluados */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveView('pending')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                activeView === 'pending'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-6 h-6 ${activeView === 'pending' ? 'text-accent' : 'text-gray-500'}`} />
                  <h3 className={`font-semibold ${activeView === 'pending' ? 'text-accent' : 'text-gray-700'}`}>
                    Atletas Pendientes de Evaluación
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Atletas que requieren retroalimentación y evaluación entre fecha inicio y fecha fin
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Pendientes
                  </Badge>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveView('evaluated')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                activeView === 'evaluated'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className={`w-6 h-6 ${activeView === 'evaluated' ? 'text-accent' : 'text-gray-500'}`} />
                  <h3 className={`font-semibold ${activeView === 'evaluated' ? 'text-accent' : 'text-gray-700'}`}>
                    Atletas Evaluados
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Atletas con retroalimentación y evaluación completa entre fecha inicio y fecha fin
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completados
                  </Badge>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal de retroalimentación */}
      <div className="space-y-6">
        {/* Vista de Atletas Pendientes */}
        {activeView === 'pending' && (
          <div className="space-y-4">
            {isLoadingWorkouts ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Cargando entrenamientos...</p>
                </CardContent>
              </Card>
            ) : filteredPendingAthletes.length > 0 ? (
              filteredPendingAthletes.map((athlete) => (
                <Card key={athlete.id} className="bg-orange-50/30 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{athlete.name}</h4>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            Pendiente de Evaluación
                          </Badge>
                          {athlete.injuryCount > 0 && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              {athlete.injuryCount} {athlete.injuryCount === 1 ? 'Molestia' : 'Molestias'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sesiones completas / Sesiones totales:</span>
                            <p className="font-medium">{athlete.completedSessions}/{athlete.totalSessions}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sesiones pendientes de evaluación:</span>
                            <p className="font-medium">{athlete.completedSessions}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tasa de cumplimiento:</span>
                            <p className="font-medium">{athlete.totalSessions > 0 ? Math.round((athlete.completedSessions / athlete.totalSessions) * 100) : 0}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lesiones reportadas:</span>
                            <p className="font-medium">{athlete.injuryCount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleEvaluateAthlete(athlete.id)}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Evaluar Atleta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No hay atletas pendientes</h3>
                  <p className="text-muted-foreground">
                    No se encontraron atletas pendientes de evaluación con los filtros seleccionados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Vista de Atletas Evaluados */}
        {activeView === 'evaluated' && (
          <div className="space-y-4">
            {isLoadingWorkouts ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Cargando entrenamientos...</p>
                </CardContent>
              </Card>
            ) : filteredEvaluatedAthletes.length > 0 ? (
              filteredEvaluatedAthletes.map((athlete) => (
                <Card key={athlete.id} className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{athlete.name}</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sesiones evaluadas:</span>
                            <p className="font-medium">{athlete.evaluatedSessions}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Calificación promedio:</span>
                            <p className="font-medium">
                              {athlete.averageRating 
                                ? `${athlete.averageRating}/4.0` 
                                : 'Sin calificación'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Última evaluación:</span>
                            <p className="font-medium">
                              {athlete.evaluationDate && !isNaN(parseDate(athlete.evaluationDate).getTime())
                                ? format(parseDate(athlete.evaluationDate), 'dd/MM/yyyy', { locale: es })
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Molestias reportadas:</span>
                            <p className="font-medium">{athlete.injuryCount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewEvaluation(athlete.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Evaluación
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No hay atletas evaluados</h3>
                  <p className="text-muted-foreground">
                    No se encontraron atletas evaluados con los filtros seleccionados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal de feedback de sesión */}
      {feedbackSession && (
        <SessionRetroalimentacionModal
          isOpen={!!feedbackSession}
          onClose={() => setFeedbackSession(null)}
          plannedSession={feedbackSession.plan}
          actualSession={feedbackSession.actual}
          existingFeedback={feedbackSession.existingFeedback}
          athleteName={feedbackSession.athleteName}
          onSaveFeedback={handleSaveSessionFeedback}
        />
      )}

      {/* Modal de comparación detallada */}
      {selectedSession && (
        <SessionComparisonView
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          sessionPlan={selectedSession.plan}
          sessionActual={selectedSession.actual}
          athleteName={selectedSession.athleteName}
        />
      )}
    </div>
  );
}