import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Upload, Calendar as CalendarIcon, Plus, ShieldAlert, Timer, Heart, Zap, Target, User, ArrowRight, ArrowLeft, CheckCircle, Watch, Download, Link2, AlertCircle, Eye, EyeOff, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { format, addDays, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingSessionService, TrainingSessionResponseDto } from '../services/trainingSessionService';
import { CompletedWorkoutService, CreateCompletedWorkoutDto } from '../services/completedWorkoutService';

interface InjuryReport {
  bodyPart: string;
  severity: number; // 1-10 scale
  description: string;
  affectedPerformance: boolean;
  type: 'Molestia' | 'Dolor';
}

// Interfaz para Lap basada en APILap del backend
interface Lap {
  index: number;
  distance: number; // km
  duration: number; // segundos
  averageHR: number; // bpm
  speed: number; // m/s (se puede calcular de distance/duration)
  startTime: string; // ISO string
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  type: string;
  duration: number;
  distance: number;
  avgPace: string;
  maxHR: number;
  avgHR: number;
  calories: number;
  elevation: number;
  comments: string;
  sensations: {
    effort: number;
    fatigue: number;
    motivation: number;
    muscularLoad: number;
    overallFeeling: number;
  };
  conditions: {
    temperature: number;
    weather: string;
    surface: string;
    humidity?: number;
    wind?: string;
  };
  splits: Array<{
    km: number;
    pace: string;
    hr: number;
    elevation: number;
    cadence?: number;
  }>;
  hrZones: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  advancedMetrics: {
    vo2MaxPercentage?: number;
    trainingLoad?: number;
    recoveryTime?: number;
    cadence?: number;
    strideLength?: number;
    verticalOscillation?: number;
    groundContactTime?: number;
  };
  route?: {
    startLocation: string;
    endLocation: string;
    routeType: string;
  };
  injuries?: InjuryReport[];
  associatedSessionId?: string;
  linkedSessionId?: string;
  status: 'Pendiente' | 'Completado' | 'Incompleto' | 'Parcialmente Incompleto';
  uploadSource: 'manual' | 'garmin';
}

interface Athlete {
  id: string;
  name: string;
  specialty: string;
}

interface PlannedSession {
  id: string;
  date: string;
  name: string;
  type: string;
  plannedDuration: number;
  plannedDistance: number;
  plannedPace: string;
  targetHR: string;
  athleteId: string;
  planningName: string;
  trainingSessionAthleteId?: number; // ID de la relación TrainingSessionAthlete
  intervals?: Array<{
    type: 'work' | 'rest';
    duration: number;
    pace: string;
    intensity: string;
    distance?: number;
    repetitions?: number;
  }>;
  series?: Array<{
    name: string;
    repetitions: number;
    recoveryBetweenSets: string;
    intervals: Array<{
      type: 'work' | 'rest';
      duration: number;
      pace: string;
      intensity: string;
      distance?: number;
      repetitions?: number;
    }>;
  }>;
}

interface GarminActivity {
  id: string;
  activityName: string;
  activityType: string;
  startTime: string;
  duration: number; // in minutes
  distance: number; // in km
  averagePace: string; // min/km format
  averageHR: number;
  maxHR: number;
  calories: number;
  elevation: number;
  cadence?: number;
  trainingEffect?: number;
}

interface TrainingUploadProps {
  initialDate?: Date;
  initialSessionId?: string;
}

export function TrainingUpload({ initialDate, initialSessionId }: TrainingUploadProps = {}) {
  // Obtener parámetros de sessionStorage si existen (para navegación desde calendario)
  const getInitialDate = () => {
    if (initialDate) return initialDate;
    const storedDate = sessionStorage.getItem('trainingUpload_initialDate');
    if (storedDate) {
      sessionStorage.removeItem('trainingUpload_initialDate');
      // Si es formato YYYY-MM-DD, parsear como fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(storedDate)) {
        const [year, month, day] = storedDate.split('-').map(Number);
        return new Date(year, month - 1, day); // month es 0-indexed
      }
      // Si es ISO string, usar directamente
      return new Date(storedDate);
    }
    return undefined;
  };

  const getInitialSessionId = () => {
    if (initialSessionId) return initialSessionId;
    const storedSessionId = sessionStorage.getItem('trainingUpload_initialSessionId');
    if (storedSessionId) {
      sessionStorage.removeItem('trainingUpload_initialSessionId');
      return storedSessionId;
    }
    return '';
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getInitialDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingWorkout, setExistingWorkout] = useState<any>(null);
  const [isCheckingExistingWorkout, setIsCheckingExistingWorkout] = useState(false);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  const hasAutoAdvancedRef = useRef(false); // Ref para rastrear si ya se ejecutó el auto-avance inicial
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateInputValue, setDateInputValue] = useState('');

  const [currentInjury, setCurrentInjury] = useState<Partial<InjuryReport>>({
    bodyPart: 'none',
    severity: 1,
    description: '',
    affectedPerformance: false,
    type: 'Molestia'
  });

  const [sessionId, setSessionId] = useState(getInitialSessionId());
  const [completedTraining, setCompletedTraining] = useState<TrainingSession | null>(null);
  const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsWithWorkouts, setSessionsWithWorkouts] = useState<Set<string>>(new Set()); // IDs de sesiones que ya tienen workouts cargados
  
  // Garmin states
  const [isGarminConnected, setIsGarminConnected] = useState(false);
  const [isConnectingGarmin, setIsConnectingGarmin] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'garmin' | 'manual'>('garmin');
  const [garminDateRange, setGarminDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedGarminActivity, setSelectedGarminActivity] = useState<string>('');
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [garminDateInputFrom, setGarminDateInputFrom] = useState('');
  const [garminDateInputTo, setGarminDateInputTo] = useState('');
  
  // Garmin login modal states
  const [showGarminModal, setShowGarminModal] = useState(false);
  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [garminFormErrors, setGarminFormErrors] = useState<{ email?: string; password?: string }>({});

  // Estado para Laps (vueltas/intervalos)
  const [laps, setLaps] = useState<Lap[]>([]);
  const [showLapForm, setShowLapForm] = useState(false);
  const [currentLap, setCurrentLap] = useState<Partial<Lap> & { durationString?: string }>({
    index: 0,
    distance: 0,
    duration: 0,
    durationString: '', // Formato mm:ss para el input
    averageHR: 0,
    speed: 0,
    startTime: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    distance: '', // km
    duration: '', // formato mm:ss (se convertirá a segundos para el backend)
    averageHR: '', // bpm
    // Sensaciones (siempre se cargan manualmente)
    effort: 5,
    fatigue: 5,
    motivation: 5,
    muscularLoad: 5,
    overallFeeling: 5,
    // Comentarios opcionales
    comments: ''
  });

  // Autocompletar nombre cuando se selecciona una sesión
  useEffect(() => {
    if (sessionId && plannedSessions.length > 0) {
      const selectedSession = plannedSessions.find(s => s.id === sessionId);
      if (selectedSession) {
        setFormData(prev => ({
          ...prev,
          name: selectedSession.name
        }));
      }
    }
  }, [sessionId, plannedSessions]);

  // Avanzar automáticamente al paso 2 solo cuando se inicializa con fecha y sesión
  // Este efecto solo se ejecuta una vez al montar el componente si hay initialDate e initialSessionId
  useEffect(() => {
    // Solo avanzar si tenemos los valores iniciales, no hemos avanzado automáticamente antes,
    // estamos en el paso 1, y ya tenemos las sesiones cargadas
    // Usar ref para evitar que se ejecute cuando el usuario navega manualmente hacia atrás
    if (initialDate && initialSessionId && !hasAutoAdvancedRef.current && currentStep === 1 && plannedSessions.length > 0) {
      const selectedSession = plannedSessions.find(s => s.id === initialSessionId);
      if (selectedSession) {
        setCurrentStep(2);
        setHasAutoAdvanced(true);
        hasAutoAdvancedRef.current = true; // Marcar como ejecutado usando ref
      }
    }
  }, [initialDate, initialSessionId, plannedSessions.length]); // No incluir currentStep ni hasAutoAdvanced para evitar re-ejecuciones

  // Calcular automáticamente distancia, duración y FC promedio desde los laps
  useEffect(() => {
    if (laps.length > 0) {
      // Calcular distancia total (suma de todas las distancias)
      const totalDistance = laps.reduce((sum, lap) => sum + (lap.distance || 0), 0);
      
      // Calcular duración total (suma de todas las duraciones en segundos)
      const totalDurationSeconds = laps.reduce((sum, lap) => sum + (lap.duration || 0), 0);
      const totalDurationMMSS = formatSecondsToMMSS(totalDurationSeconds);
      
      // Calcular FC promedio ponderada por duración
      let totalHRWeighted = 0;
      let totalDuration = 0;
      laps.forEach(lap => {
        const lapDuration = lap.duration || 0;
        const lapHR = lap.averageHR || 0;
        if (lapDuration > 0 && lapHR > 0) {
          totalHRWeighted += lapHR * lapDuration;
          totalDuration += lapDuration;
        }
      });
      const averageHR = totalDuration > 0 ? Math.round(totalHRWeighted / totalDuration) : 0;
      
      // Actualizar los campos del formulario
      setFormData(prev => ({
        ...prev,
        distance: totalDistance > 0 ? totalDistance.toFixed(2) : prev.distance,
        duration: totalDurationMMSS !== '00:00' ? totalDurationMMSS : prev.duration,
        averageHR: averageHR > 0 ? averageHR.toString() : prev.averageHR
      }));
    }
  }, [laps]);

  // Lista de partes del cuerpo para el selector
  const bodyParts = [
    'Rodilla izquierda', 'Rodilla derecha',
    'Tobillo izquierdo', 'Tobillo derecho',
    'Pantorrilla izquierda', 'Pantorrilla derecha',
    'Cuádriceps izquierdo', 'Cuádriceps derecho',
    'Isquiotibiales izquierdos', 'Isquiotibiales derechos',
    'Gemelo izquierdo', 'Gemelo derecho',
    'Pie izquierdo', 'Pie derecho',
    'Cadera izquierda', 'Cadera derecha',
    'Espalda baja', 'Espalda media', 'Espalda alta',
    'Hombro izquierdo', 'Hombro derecho',
    'Otra zona'
  ];

  // Mock data de actividades de Garmin (se mostrarían según el rango de fechas)
  const mockGarminActivities: GarminActivity[] = [
    {
      id: 'garmin_001',
      activityName: 'Carrera matutina',
      activityType: 'Carrera',
      startTime: '2025-01-02T07:30:00',
      duration: 47,
      distance: 8.2,
      averagePace: '5:44',
      averageHR: 142,
      maxHR: 165,
      calories: 612,
      elevation: 85,
      cadence: 172,
      trainingEffect: 3.2
    },
    {
      id: 'garmin_002',
      activityName: 'Entrenamiento de técnica',
      activityType: 'Carrera',
      startTime: '2025-01-03T18:00:00',
      duration: 58,
      distance: 5.1,
      averagePace: '6:02',
      averageHR: 135,
      maxHR: 152,
      calories: 423,
      elevation: 42,
      cadence: 168,
      trainingEffect: 2.5
    },
    {
      id: 'garmin_003',
      activityName: 'Carrera larga fin de semana',
      activityType: 'Carrera',
      startTime: '2025-01-04T08:00:00',
      duration: 72,
      distance: 12.4,
      averagePace: '5:48',
      averageHR: 148,
      maxHR: 170,
      calories: 894,
      elevation: 156,
      cadence: 170,
      trainingEffect: 3.8
    },
    {
      id: 'garmin_004',
      activityName: 'Tempo run',
      activityType: 'Carrera',
      startTime: '2025-01-09T17:30:00',
      duration: 52,
      distance: 9.3,
      averagePace: '5:35',
      averageHR: 158,
      maxHR: 175,
      calories: 748,
      elevation: 98,
      cadence: 174,
      trainingEffect: 3.5
    },
    {
      id: 'garmin_005',
      activityName: 'Intervalos en pista',
      activityType: 'Carrera',
      startTime: '2025-01-16T18:15:00',
      duration: 63,
      distance: 10.2,
      averagePace: '6:10',
      averageHR: 165,
      maxHR: 184,
      calories: 821,
      elevation: 12,
      cadence: 176,
      trainingEffect: 4.2
    }
  ];

  // Mock data para atletas disponibles
  const availableAthletes: Athlete[] = [
    {
      id: 'athlete1',
      name: 'Carlos Mendoza',
      specialty: 'Fondo'
    },
    {
      id: 'athlete2',
      name: 'Ana López',
      specialty: 'Medio-fondo'
    },
    {
      id: 'athlete3',
      name: 'Pedro Ramírez',
      specialty: 'Fondo'
    }
  ];


  // Cargar sesiones planificadas cuando cambia la fecha seleccionada
  useEffect(() => {
    const loadSessionsForDate = async () => {
      if (!selectedDate) {
        setPlannedSessions([]);
        setExistingWorkout(null);
        return;
      }

      // Validar que la fecha no sea futura
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly > today) {
        toast.error('No se pueden cargar resultados para entrenamientos futuros');
        setPlannedSessions([]);
        setExistingWorkout(null);
        return;
      }

      setIsLoadingSessions(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const backendSessions = await TrainingSessionService.getMyTrainingSessionsByDate(dateStr);
        
        // Mapear sesiones del backend al formato PlannedSession
        const mappedSessions: PlannedSession[] = backendSessions.map(session => {
          // Usar el volumen calculado del backend si está disponible (ya está en km)
          let estimatedDistance = session.volume || 0;
          
          // Si no hay volumen calculado, calcularlo desde los intervalos
          if (estimatedDistance === 0 && session.series && session.series.length > 0) {
            let totalDistanceMeters = 0;
            session.series.forEach(series => {
              if (series.intervals && series.intervals.length > 0) {
                series.intervals.forEach(interval => {
                  if (interval.distance) {
                    // interval.distance está en metros, convertir a km
                    totalDistanceMeters += interval.distance * (interval.repetitions || 1);
                  }
                });
              }
            });
            estimatedDistance = totalDistanceMeters / 1000; // Convertir metros a km
          }

          // Usar la duración estimada del backend si está disponible
          let estimatedDuration = 0;
          if (session.estimatedWorkSeconds && session.estimatedRecoverySeconds) {
            // Sumar trabajo y recuperación (ya están en segundos)
            estimatedDuration = session.estimatedWorkSeconds + session.estimatedRecoverySeconds;
          } else if (session.estimatedWorkSeconds) {
            // Solo trabajo si no hay recuperación calculada
            estimatedDuration = session.estimatedWorkSeconds;
          } else {
            // Fallback: calcular manualmente desde los intervalos
            if (session.series && session.series.length > 0) {
              session.series.forEach(series => {
                if (series.intervals && series.intervals.length > 0) {
                  series.intervals.forEach(interval => {
                    if (interval.duration) {
                      // Parsear duración en formato HH:mm:ss o mm:ss
                      const parts = interval.duration.split(':').map(Number);
                      let seconds = 0;
                      if (parts.length === 3) {
                        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                      } else if (parts.length === 2) {
                        seconds = parts[0] * 60 + parts[1];
                      }
                      estimatedDuration += seconds * (interval.repetitions || 1);
                    }
                  });
                }
              });
              
              // También considerar el tiempo de recuperación entre series
              session.series.forEach((series, index) => {
                if (series.recoveryBetweenSets && index < session.series.length - 1) {
                  // Parsear tiempo de recuperación (formato MM:SS)
                  const recoveryParts = series.recoveryBetweenSets.split(':').map(Number);
                  if (recoveryParts.length === 2) {
                    const recoverySeconds = recoveryParts[0] * 60 + recoveryParts[1];
                    estimatedDuration += recoverySeconds;
                  }
                }
              });
            }
          }

          // Formatear ritmo objetivo si existe
          let plannedPace = 'N/A';
          if (session.series && session.series.length > 0) {
            const firstInterval = session.series[0]?.intervals?.[0];
            if (firstInterval?.targetSpeed) {
              // targetSpeed ya viene en formato mm:ss/km
              plannedPace = firstInterval.targetSpeed;
            } else if (firstInterval?.pace) {
              // pace viene como número decimal (min/km)
              const minutes = Math.floor(firstInterval.pace);
              const seconds = Math.round((firstInterval.pace - minutes) * 60);
              plannedPace = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
          }

          return {
            id: session.id.toString(),
            date: dateStr,
            name: session.name,
            type: session.category === 'training' ? 'Entrenamiento' : 
                  session.category === 'prep_competition' ? 'Prep. Competencia' : 
                  'Competencia',
            plannedDuration: Math.round(estimatedDuration / 60), // Convertir a minutos
            plannedDistance: Math.round(estimatedDistance * 100) / 100, // Redondear a 2 decimales (ya en km)
            plannedPace: plannedPace,
            targetHR: 'N/A', // No viene del backend actualmente
            athleteId: 'current', // El atleta actual
            planningName: session.planningId ? `Planificación ${session.planningId}` : 'Sin planificación',
            trainingSessionAthleteId: session.trainingSessionAthleteId, // ID de la relación TrainingSessionAthlete
            intervals: session.structureType === 'simple' ? (session.series?.flatMap(series => 
              series.intervals?.map(interval => ({
                type: interval.type === 'Recovery' ? 'rest' : 'work' as 'work' | 'rest',
                duration: interval.duration ? (() => {
                  const parts = interval.duration.split(':').map(Number);
                  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
                  if (parts.length === 2) return parts[0] + parts[1] / 60;
                  return 0;
                })() : 0,
                pace: interval.targetSpeed || (interval.pace ? `${Math.floor(interval.pace)}:${Math.round((interval.pace % 1) * 60).toString().padStart(2, '0')}` : 'N/A'),
                intensity: interval.intensity || 'Moderada',
                distance: interval.distance / 1000, // Convertir metros a km
                repetitions: interval.repetitions || 1
              })) || []
            ) || []) : undefined,
            series: session.structureType === 'advanced' ? (session.series?.map(series => ({
              name: series.name || 'Serie sin nombre',
              repetitions: series.repetitions || 1,
              recoveryBetweenSets: series.recoveryBetweenSets || '00:00',
              intervals: series.intervals?.map(interval => ({
                type: interval.type === 'Recovery' ? 'rest' : 'work' as 'work' | 'rest',
                duration: interval.duration ? (() => {
                  const parts = interval.duration.split(':').map(Number);
                  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
                  if (parts.length === 2) return parts[0] + parts[1] / 60;
                  return 0;
                })() : 0,
                pace: interval.targetSpeed || (interval.pace ? `${Math.floor(interval.pace)}:${Math.round((interval.pace % 1) * 60).toString().padStart(2, '0')}` : 'N/A'),
                intensity: interval.intensity || 'Moderada',
                distance: interval.distance / 1000, // Convertir metros a km
                repetitions: interval.repetitions || 1
              })) || []
            })) || []) : undefined
          };
        });

        setPlannedSessions(mappedSessions);

        // Usar hasCompletedWorkout del backend para filtrar sesiones
        const sessionsWithWorkoutsSet = new Set<string>();
        mappedSessions.forEach(session => {
          // Buscar la sesión original del backend para obtener hasCompletedWorkout
          const backendSession = backendSessions.find(bs => bs.id.toString() === session.id);
          if (backendSession?.hasCompletedWorkout) {
            sessionsWithWorkoutsSet.add(session.id);
          }
        });

        setSessionsWithWorkouts(sessionsWithWorkoutsSet);

        // Si hay una sesión seleccionada y tiene workout, obtener los detalles para mostrar
        if (sessionId) {
          const selectedSession = mappedSessions.find(s => s.id === sessionId);
          const backendSelectedSession = backendSessions.find(bs => bs.id.toString() === sessionId);
          
          if (selectedSession?.trainingSessionAthleteId && backendSelectedSession?.hasCompletedWorkout) {
            setIsCheckingExistingWorkout(true);
            try {
              const workout = await CompletedWorkoutService.getCompletedWorkoutByTrainingSessionAthleteIdAndDate(
                selectedSession.trainingSessionAthleteId,
                dateStr
              );
              setExistingWorkout(workout);
            } catch (error: any) {
              // El servicio ya maneja el 404 y retorna null
              if (error.response?.status !== 404) {
                console.error('Error al obtener detalles del workout:', error);
              }
              setExistingWorkout(null);
            } finally {
              setIsCheckingExistingWorkout(false);
            }
          } else {
            setExistingWorkout(null);
          }
        } else {
          setExistingWorkout(null);
        }
      } catch (error) {
        console.error('Error al cargar sesiones:', error);
        toast.error('Error al cargar las sesiones planificadas');
        setPlannedSessions([]);
        setExistingWorkout(null);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessionsForDate();
  }, [selectedDate, sessionId]);

  // Función para obtener las sesiones planificadas para la fecha seleccionada
  // Filtra las sesiones que ya tienen workouts cargados
  const getSessionsByDate = (date: Date | undefined) => {
    if (!date) return [];
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    return plannedSessions.filter(session => 
      session.date === selectedDateStr && !sessionsWithWorkouts.has(session.id)
    );
  };

  // Función para obtener todas las sesiones para una fecha (incluyendo las que tienen workouts)
  const getAllSessionsByDate = (date: Date | undefined) => {
    if (!date) return [];
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    return plannedSessions.filter(session => session.date === selectedDateStr);
  };

  // Función para formateo automático de fechas con "/" fijos
  const formatDateInput = (value: string): string => {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '');
    
    // Limitar a 8 dígitos (ddmmyyyy)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Formatear con "/" automáticamente
    let formatted = '';
    for (let i = 0; i < limitedNumbers.length; i++) {
      if (i === 2 || i === 4) {
        formatted += '/';
      }
      formatted += limitedNumbers[i];
    }
    
    return formatted;
  };

  // Funciones para manejar input manual de fechas
  const handleDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setDateInputValue(formatted);
    
    // Intentar parsear la fecha cuando tenga el formato completo
    if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsed) && parsed <= new Date()) {
        setSelectedDate(parsed);
        setSessionId('');
      }
    } else {
      // Si se borra o está incompleto, limpiar la fecha seleccionada
      setSelectedDate(undefined);
    }
  };

  // Funciones para manejar molestias/lesiones
  const addInjury = () => {
    if (!currentInjury.bodyPart || currentInjury.bodyPart === 'none' || !currentInjury.description) {
      toast.error('Por favor completa la zona corporal y descripción');
      return;
    }

    const newInjury: InjuryReport = {
      bodyPart: currentInjury.bodyPart!,
      severity: currentInjury.severity || 1,
      description: currentInjury.description!,
      affectedPerformance: currentInjury.affectedPerformance || false,
      type: currentInjury.type || 'Molestia'
    };

    setInjuries(prev => [...prev, newInjury]);
    setCurrentInjury({
      bodyPart: 'none',
      severity: 1,
      description: '',
      affectedPerformance: false,
      type: 'Molestia'
    });
    setShowInjuryForm(false);
    toast.success('Molestia/dolor agregado correctamente');
  };

  const removeInjury = (index: number) => {
    setInjuries(prev => prev.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-50';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 3) return 'Leve';
    if (severity <= 6) return 'Moderado';
    return 'Severo';
  };

  // Funciones auxiliares para generar datos automáticamente
  const generateSplits = (distance: number, avgPace: string, avgHR: number, maxHR: number, elevation: number, type: string) => {
    const splits = [];
    const kmCount = Math.floor(distance);
    const [avgMin, avgSec] = avgPace.split(':').map(Number);
    const avgPaceSeconds = avgMin * 60 + avgSec;
    
    for (let km = 1; km <= kmCount; km++) {
      let variation = 0;
      if (type === 'Intervalos') {
        variation = (km % 2 === 1) ? -15 : 10;
      } else if (type === 'Fartlek') {
        variation = Math.random() * 30 - 15;
      } else {
        variation = Math.random() * 10 - 5;
      }
      
      const splitPaceSeconds = avgPaceSeconds + variation;
      const splitMinutes = Math.floor(splitPaceSeconds / 60);
      const splitSeconds = Math.round(splitPaceSeconds % 60);
      const splitPace = `${splitMinutes}:${splitSeconds.toString().padStart(2, '0')}`;
      
      const hrVariation = variation > 0 ? -5 : 5;
      const splitHR = Math.max(avgHR - 20, Math.min(maxHR, avgHR + hrVariation + Math.random() * 10 - 5));
      
      const splitElevation = Math.max(0, elevation / kmCount + Math.random() * 20 - 10);
      const cadence = 170 + Math.random() * 20;
      
      splits.push({
        km,
        pace: splitPace,
        hr: Math.round(splitHR),
        elevation: Math.round(splitElevation),
        cadence: Math.round(cadence)
      });
    }
    
    return splits;
  };

  const generateHRZones = (type: string, avgHR: number, maxHR: number) => {
    switch (type) {
      case 'Intervalos':
        return { zone1: 5, zone2: 15, zone3: 25, zone4: 35, zone5: 20 };
      case 'Tempo':
        return { zone1: 10, zone2: 25, zone3: 45, zone4: 20, zone5: 0 };
      case 'Recuperación':
        return { zone1: 60, zone2: 35, zone3: 5, zone4: 0, zone5: 0 };
      case 'Fartlek':
        return { zone1: 15, zone2: 30, zone3: 30, zone4: 20, zone5: 5 };
      default:
        return { zone1: 20, zone2: 50, zone3: 25, zone4: 5, zone5: 0 };
    }
  };

  const calculateVO2MaxPercentage = (pace: string, type: string) => {
    const [min, sec] = pace.split(':').map(Number);
    const paceSeconds = min * 60 + sec;
    
    let basePercentage = Math.max(50, Math.min(100, 400 - paceSeconds));
    
    if (type === 'Intervalos') basePercentage += 10;
    else if (type === 'Tempo') basePercentage += 5;
    else if (type === 'Recuperación') basePercentage -= 15;
    
    return Math.round(Math.max(50, Math.min(100, basePercentage)));
  };

  const calculateTrainingLoad = (duration: number, avgHR: number, type: string) => {
    const baseLoad = duration * (avgHR / 10);
    const typeMultiplier = type === 'Intervalos' ? 1.8 : type === 'Tempo' ? 1.4 : type === 'Fartlek' ? 1.6 : 1.0;
    return Math.round(baseLoad * typeMultiplier);
  };

  const generateAdvancedMetrics = (pace: string, type: string, duration: number, avgHR: number) => {
    return {
      vo2MaxPercentage: calculateVO2MaxPercentage(pace, type),
      trainingLoad: calculateTrainingLoad(duration, avgHR, type),
      recoveryTime: type === 'Intervalos' ? 24 + Math.random() * 12 : type === 'Tempo' ? 18 + Math.random() * 8 : 12 + Math.random() * 6,
      cadence: 170 + Math.random() * 20,
      strideLength: 1.20 + Math.random() * 0.25,
      verticalOscillation: 7.5 + Math.random() * 3,
      groundContactTime: 240 + Math.random() * 20
    };
  };

  const validateStep1 = () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona la fecha del entrenamiento');
      return false;
    }

    const availableSessions = getSessionsByDate(selectedDate);
    if (availableSessions.length === 0) {
      toast.error('No hay sesiones planificadas por el entrenador en esta fecha. Por favor selecciona otra fecha.');
      return false;
    }
    
    if (!sessionId) {
      toast.error('Por favor selecciona una sesión planificada para asociar');
      return false;
    }
    
    return true;
  };

  // Función para convertir mm:ss a minutos (double)
  const parseDurationToMinutes = (durationStr: string): number => {
    if (!durationStr || !durationStr.includes(':')) {
      return 0;
    }
    const [minutes, seconds] = durationStr.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
      return 0;
    }
    return minutes + (seconds / 60);
  };

  // Función para convertir mm:ss a segundos
  const parseDurationToSeconds = (durationStr: string): number => {
    if (!durationStr || !durationStr.includes(':')) {
      return 0;
    }
    const [minutes, seconds] = durationStr.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
      return 0;
    }
    return minutes * 60 + seconds;
  };

  // Función para convertir segundos a mm:ss
  const formatSecondsToMMSS = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '00:00';
    const totalSeconds = Math.round(seconds); // Redondear a entero
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para convertir velocidad en m/s a ritmo en mm:ss/km
  const convertSpeedToPace = (speedMs: number): string => {
    if (!speedMs || speedMs <= 0) return 'N/A';
    // Ritmo en segundos por km = 1000 / velocidad_m_s
    const paceSecondsPerKm = 1000 / speedMs;
    return formatSecondsToMMSS(paceSecondsPerKm);
  };

  // Función para mapear bodyPart (string en español) a InjuryLocation (enum en inglés)
  const mapBodyPartToInjuryLocation = (bodyPart: string): string => {
    const mapping: Record<string, string> = {
      'Rodilla izquierda': 'LeftKnee',
      'Rodilla derecha': 'RightKnee',
      'Tobillo izquierdo': 'LeftAnkle',
      'Tobillo derecho': 'RightAnkle',
      'Pantorrilla izquierda': 'LeftCalf',
      'Pantorrilla derecha': 'RightCalf',
      'Cuádriceps izquierdo': 'LeftThigh',
      'Cuádriceps derecho': 'RightThigh',
      'Isquiotibiales izquierdos': 'LeftThigh',
      'Isquiotibiales derechos': 'RightThigh',
      'Gemelo izquierdo': 'LeftCalf',
      'Gemelo derecho': 'RightCalf',
      'Pie izquierdo': 'LeftFoot',
      'Pie derecho': 'RightFoot',
      'Cadera izquierda': 'Hip',
      'Cadera derecha': 'Hip',
      'Espalda baja': 'LowerBack',
      'Espalda media': 'UpperBack',
      'Espalda alta': 'UpperBack',
      'Hombro izquierdo': 'LeftShoulder',
      'Hombro derecho': 'RightShoulder',
      'Otra zona': 'Head'
    };
    return mapping[bodyPart] || 'Head';
  };

  const validateForm = () => {
    // Campos requeridos según APIWorkout
    const required = ['name', 'distance', 'duration', 'averageHR'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (missing.length > 0) {
      toast.error(`Por favor completa los campos requeridos: ${missing.join(', ')}`);
      return false;
    }
    
    // Validar formato de duración (mm:ss)
    const durationPattern = /^\d{1,2}:\d{2}$/;
    if (!durationPattern.test(formData.duration)) {
      toast.error('La duración debe estar en formato mm:ss (ej: 45:30)');
      return false;
    }
    
    const durationMinutes = parseDurationToMinutes(formData.duration);
    const distance = parseFloat(formData.distance);
    const avgHR = parseFloat(formData.averageHR);
    
    if (durationMinutes <= 0) {
      toast.error('La duración debe ser mayor a 0');
      return false;
    }
    
    if (isNaN(distance) || distance <= 0) {
      toast.error('La distancia debe ser un número mayor a 0');
      return false;
    }
    
    if (isNaN(avgHR) || avgHR <= 0 || avgHR > 250) {
      toast.error('La frecuencia cardíaca promedio debe ser un número válido entre 1 y 250');
      return false;
    }
    
    return true;
  };

  // Funciones para manejar Laps
  const handleAddLap = () => {
    // Usar la fecha del entrenamiento seleccionado y hora actual
    const baseDate = selectedDate || new Date();
    const now = new Date();
    const startTime = new Date(baseDate);
    startTime.setHours(now.getHours(), now.getMinutes(), 0, 0);
    
    setCurrentLap({
      index: laps.length + 1,
      distance: 0,
      duration: 0,
      durationString: '', // Formato mm:ss para el input
      averageHR: 0,
      speed: 0,
      startTime: startTime.toISOString()
    });
    setShowLapForm(true);
  };

  const handleLapChange = (field: keyof Lap | 'durationString', value: string | number) => {
    setCurrentLap(prev => {
      const updated: any = { ...prev };
      
      if (field === 'durationString') {
        // Manejar formato mm:ss
        let formattedValue = value as string;
        // Remover caracteres no numéricos excepto :
        formattedValue = formattedValue.replace(/[^\d:]/g, '');
        // Limitar a formato mm:ss
        if (formattedValue.length > 5) {
          formattedValue = formattedValue.substring(0, 5);
        }
        // Agregar : automáticamente después de 2 dígitos
        if (formattedValue.length === 2 && !formattedValue.includes(':')) {
          formattedValue = formattedValue + ':';
        }
        updated.durationString = formattedValue;
        
        // Convertir a segundos para calcular velocidad
        const durationSeconds = parseDurationToSeconds(formattedValue);
        updated.duration = durationSeconds;
        
        // Calcular velocidad si tenemos distancia y duración
        const distance = prev.distance || 0;
        if (distance > 0 && durationSeconds > 0) {
          updated.speed = (distance * 1000) / durationSeconds;
        }
      } else {
        updated[field] = value;
        
        // Calcular velocidad automáticamente si tenemos distancia y duración
        if (field === 'distance' || field === 'duration') {
          const distance = field === 'distance' ? Number(value) : (prev.distance || 0);
          const duration = field === 'duration' ? Number(value) : (prev.duration || 0);
          if (distance > 0 && duration > 0) {
            // Velocidad en m/s = (distancia en km * 1000) / (duración en segundos)
            updated.speed = (distance * 1000) / duration;
          }
        }
      }
      
      return updated;
    });
  };

  const handleSaveLap = () => {
    // Validar campos requeridos
    if (!currentLap.distance || !currentLap.durationString || !currentLap.averageHR) {
      toast.error('Por favor completa todos los campos de la vuelta');
      return;
    }
    
    // Validar formato de duración
    const durationPattern = /^\d{1,2}:\d{2}$/;
    if (!durationPattern.test(currentLap.durationString || '')) {
      toast.error('La duración debe estar en formato mm:ss (ej: 05:30)');
      return;
    }
    
    // Convertir duración de mm:ss a segundos
    const durationSeconds = parseDurationToSeconds(currentLap.durationString || '');
    if (durationSeconds <= 0) {
      toast.error('La duración debe ser mayor a 0');
      return;
    }
    
    const newLap: Lap = {
      index: currentLap.index || laps.length + 1,
      distance: currentLap.distance || 0,
      duration: durationSeconds,
      averageHR: currentLap.averageHR || 0,
      speed: currentLap.speed || 0,
      startTime: currentLap.startTime || new Date().toISOString()
    };
    
    setLaps([...laps, newLap]);
    setShowLapForm(false);
    setCurrentLap({
      index: 0,
      distance: 0,
      duration: 0,
      durationString: '',
      averageHR: 0,
      speed: 0,
      startTime: ''
    });
    toast.success('Vuelta agregada correctamente');
  };

  const handleRemoveLap = (index: number) => {
    setLaps(laps.filter((_, i) => i !== index));
    toast.success('Vuelta eliminada');
  };

  const handleCancelLap = () => {
    setShowLapForm(false);
    setCurrentLap({
      index: 0,
      distance: 0,
      duration: 0,
      durationString: '',
      averageHR: 0,
      speed: 0,
      startTime: ''
    });
  };

  const handleContinueToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      toast.success('Sesión vinculada correctamente', {
        description: 'Ahora puedes importar desde Garmin o registrar manualmente los datos del entrenamiento.'
      });
    }
  };

  const handleBackToStep1 = () => {
    // No resetear hasAutoAdvancedRef porque queremos que el auto-avance solo ocurra una vez
    setCurrentStep(1);
  };

  // Funciones de Garmin
  const handleConnectGarmin = () => {
    setShowGarminModal(true);
    setGarminFormErrors({});
  };

  const validateGarminForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!garminEmail.trim()) {
      errors.email = 'El email o usuario es requerido';
    }
    
    if (!garminPassword) {
      errors.password = 'La contraseña es requerida';
    }
    
    setGarminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGarminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGarminForm()) {
      return;
    }

    setIsConnectingGarmin(true);
    try {
      // Simular autenticación con Garmin
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsGarminConnected(true);
      setShowGarminModal(false);
      setGarminEmail('');
      setGarminPassword('');
      toast.success('Cuenta de Garmin conectada exitosamente', {
        description: 'Ahora puedes importar entrenamientos desde tu cuenta de Garmin Connect'
      });
    } catch (error) {
      toast.error('Error al conectar con Garmin', {
        description: 'Por favor intenta nuevamente'
      });
    } finally {
      setIsConnectingGarmin(false);
    }
  };

  const handleCancelGarminLogin = () => {
    setShowGarminModal(false);
    setGarminEmail('');
    setGarminPassword('');
    setGarminFormErrors({});
  };

  const handleDisconnectGarmin = () => {
    setIsGarminConnected(false);
    setGarminDateRange({});
    setSelectedGarminActivity('');
    toast.info('Cuenta de Garmin desconectada');
  };

  const getFilteredGarminActivities = (): GarminActivity[] => {
    if (!garminDateRange.from) return [];
    
    const fromDate = garminDateRange.from;
    const toDate = garminDateRange.to || garminDateRange.from;
    
    return mockGarminActivities.filter(activity => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= fromDate && activityDate <= toDate;
    });
  };

  const handleSearchGarminActivities = async () => {
    if (!garminDateRange.from) {
      toast.error('Por favor selecciona un rango de fechas');
      return;
    }
    
    setIsLoadingActivities(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const activities = getFilteredGarminActivities();
      
      if (activities.length === 0) {
        toast.info('No se encontraron entrenamientos en el rango de fechas seleccionado');
      } else {
        toast.success(`Se encontraron ${activities.length} entrenamiento${activities.length > 1 ? 's' : ''}`);
      }
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleSelectGarminActivity = (activityId: string) => {
    setSelectedGarminActivity(activityId);
  };

  const handleGarminDateInputFrom = (value: string) => {
    const formatted = formatDateInput(value);
    setGarminDateInputFrom(formatted);
    
    // Intentar parsear la fecha cuando tenga el formato completo
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        setGarminDateRange({ ...garminDateRange, from: parsedDate });
      }
    } else {
      // Si se borra o está incompleto, limpiar la fecha
      setGarminDateRange({ ...garminDateRange, from: undefined });
    }
  };

  const handleGarminDateInputTo = (value: string) => {
    const formatted = formatDateInput(value);
    setGarminDateInputTo(formatted);
    
    // Intentar parsear la fecha cuando tenga el formato completo
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        setGarminDateRange({ ...garminDateRange, to: parsedDate });
      }
    } else {
      // Si se borra o está incompleto, limpiar la fecha
      setGarminDateRange({ ...garminDateRange, to: undefined });
    }
  };

  const handleLinkGarminActivity = () => {
    const activity = mockGarminActivities.find(a => a.id === selectedGarminActivity);
    if (!activity) return;

    if (!selectedDate || !sessionId) {
      toast.error('Debe seleccionar una fecha y sesión planificada');
      return;
    }

    // Crear el entrenamiento directamente con los datos de Garmin
    const advancedMetrics = generateAdvancedMetrics(activity.averagePace, 'Continuo', activity.duration, activity.averageHR);
    
    const newTraining: TrainingSession = {
      id: `training-${Date.now()}`,
      date: format(selectedDate, 'yyyy-MM-dd'),
      name: activity.activityName,
      type: 'Continuo',
      duration: activity.duration,
      distance: activity.distance,
      avgPace: activity.averagePace,
      maxHR: activity.maxHR,
      avgHR: activity.averageHR,
      calories: activity.calories,
      elevation: activity.elevation,
      comments: 'Importado desde Garmin Connect',
      sensations: {
        effort: 5,
        fatigue: 5,
        motivation: 5,
        muscularLoad: 5,
        overallFeeling: 5
      },
      conditions: {
        temperature: 20,
        weather: 'No especificado',
        surface: 'No especificado',
        humidity: 50,
        wind: 'No especificado'
      },
      splits: generateSplits(activity.distance, activity.averagePace, activity.averageHR, activity.maxHR, activity.elevation, 'Continuo'),
      hrZones: generateHRZones('Continuo', activity.averageHR, activity.maxHR),
      advancedMetrics: {
        ...advancedMetrics,
        cadence: activity.cadence || advancedMetrics.cadence,
        strideLength: advancedMetrics.strideLength,
        verticalOscillation: advancedMetrics.verticalOscillation,
        groundContactTime: advancedMetrics.groundContactTime
      },
      injuries: injuries.length > 0 ? injuries : undefined,
      associatedSessionId: sessionId,
      linkedSessionId: sessionId,
      status: 'Completado',
      uploadSource: 'garmin'
    };

    if (activity.distance > 10) {
      newTraining.route = {
        startLocation: 'Punto de Inicio (Garmin)',
        endLocation: activity.distance > 15 ? 'Punto Final (Garmin)' : 'Punto de Inicio (Garmin)',
        routeType: activity.distance > 15 ? 'Punto a Punto' : 'Circuito'
      };
    }

    // Guardar el entrenamiento completado y pasar al Paso 3
    setCompletedTraining(newTraining);
    setCurrentStep(3);
    
    toast.success('Entrenamiento importado desde Garmin', {
      description: 'Los datos han sido vinculados con la sesión planificada.'
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      duration: '',
      distance: '',
      avgPace: '',
      maxHR: '',
      avgHR: '',
      calories: '',
      elevation: '',
      comments: '',
      effort: 5,
      fatigue: 5,
      motivation: 5,
      muscularLoad: 5,
      overallFeeling: 5,
      temperature: '',
      weather: '',
      surface: '',
      humidity: '',
      wind: '',
      vo2MaxPercentage: '',
      cadence: '',
      strideLength: '',
      verticalOscillation: '',
      groundContactTime: '',
    });
    setSelectedDate(undefined);
    setDateInputValue('');
    setSessionId('');
    setInjuries([]);
    setSelectedGarminActivity('');
    setGarminDateRange({});
    setGarminDateInputFrom('');
    setGarminDateInputTo('');
    setUploadMethod('garmin');
    setCompletedTraining(null);
    setCurrentStep(1);
    setCurrentInjury({
      bodyPart: 'none',
      severity: 1,
      description: '',
      affectedPerformance: false,
      type: 'Molestia'
    });
    setShowInjuryForm(false);
    setCurrentStep(1);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInjuryChange = (field: string, value: string | number | boolean) => {
    setCurrentInjury(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que no haya un workout existente
    if (existingWorkout) {
      toast.error('Ya existe un resultado cargado para esta sesión. No se puede cargar más de uno.');
      return;
    }

    // Validar que la fecha no sea futura
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly > today) {
        toast.error('No se pueden cargar resultados para entrenamientos futuros');
        return;
      }
    }
    
    if (!validateForm()) return;
    
    // Validar que tenemos el TrainingSessionAthleteId
    const selectedSession = plannedSessions.find(s => s.id === sessionId);
    if (!selectedSession?.trainingSessionAthleteId) {
      toast.error('No se pudo determinar la sesión de entrenamiento. Por favor selecciona una sesión válida.');
      return;
    }
    
    // Convertir duración de mm:ss a formato mm:ss (el backend lo convertirá a segundos)
    const distance = parseFloat(formData.distance);
    const averageHR = parseFloat(formData.averageHR);
    
    // Crear objeto temporal para el frontend (compatibilidad con el paso 3)
    // Este objeto se usa solo para mostrar en el paso 3, no se guarda aún
    const tempTraining: TrainingSession = {
      id: 'temp', // Temporal hasta que se confirme
      date: format(selectedDate!, 'yyyy-MM-dd'),
      name: formData.name,
      type: 'Manual',
      duration: parseDurationToMinutes(formData.duration), // Convertir mm:ss a minutos
      distance,
      avgPace: '',
      maxHR: 0,
      avgHR: averageHR,
      calories: 0,
      elevation: 0,
      comments: formData.comments || '',
      sensations: {
        effort: formData.effort,
        fatigue: formData.fatigue,
        motivation: formData.motivation,
        muscularLoad: formData.muscularLoad,
        overallFeeling: formData.overallFeeling
      },
      conditions: {
        temperature: 0,
        weather: '',
        surface: '',
        humidity: 0,
        wind: ''
      },
      splits: [],
      hrZones: {
        zone1: 0,
        zone2: 0,
        zone3: 0,
        zone4: 0,
        zone5: 0
      },
      advancedMetrics: {},
      injuries: injuries.map(injury => ({
        bodyPart: injury.bodyPart,
        severity: injury.severity,
        description: injury.description,
        affectedPerformance: injury.affectedPerformance,
        type: injury.type
      })),
      associatedSessionId: sessionId,
      linkedSessionId: sessionId,
      status: 'Pendiente', // Pendiente hasta confirmar
      uploadSource: 'manual'
    };
    
    // Guardar el entrenamiento temporal y pasar al Paso 3
    setCompletedTraining(tempTraining);
    setCurrentStep(3);
  };

  const handleConfirmLink = async () => {
    // Validar que no haya un workout existente
    if (existingWorkout) {
      toast.error('Ya existe un resultado cargado para esta sesión. No se puede cargar más de uno.');
      return;
    }

    // Validar que la fecha no sea futura
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly > today) {
        toast.error('No se pueden cargar resultados para entrenamientos futuros');
        return;
      }
    }

    // Validar que tenemos el TrainingSessionAthleteId
    const selectedSession = plannedSessions.find(s => s.id === sessionId);
    if (!selectedSession?.trainingSessionAthleteId) {
      toast.error('No se pudo determinar la sesión de entrenamiento. Por favor selecciona una sesión válida.');
      return;
    }

    if (!completedTraining) {
      toast.error('No hay datos de entrenamiento para confirmar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convertir duración de mm:ss a formato mm:ss (el backend lo convertirá a segundos)
      const distance = parseFloat(formData.distance);
      const averageHR = parseFloat(formData.averageHR);
      
      // Construir el DTO para el backend con TODOS los datos (laps, injuries, etc.)
      const createDto: CreateCompletedWorkoutDto = {
        trainingSessionAthleteId: selectedSession.trainingSessionAthleteId,
        name: formData.name,
        distance,
        date: format(selectedDate!, 'yyyy-MM-dd'), // Formato YYYY-MM-DD para el backend
        duration: formData.duration, // Formato mm:ss
        averageHR,
        comments: formData.comments || undefined,
        source: 'Manual' as 'Manual' | 'Garmin',
        sensations: {
          effort: formData.effort,
          fatigue: formData.fatigue,
          motivation: formData.motivation,
          muscularLoad: formData.muscularLoad,
          overallFeeling: formData.overallFeeling
        },
        laps: laps.length > 0 ? laps.map(lap => ({
          index: lap.index,
          distance: lap.distance,
          duration: lap.duration, // Ya está en segundos
          averageHR: lap.averageHR,
          startTime: lap.startTime // ISO string
        })) : undefined,
        injuries: injuries.length > 0 ? injuries.map(injury => ({
          bodyPart: mapBodyPartToInjuryLocation(injury.bodyPart) as any, // Mapear a enum
          severity: injury.severity,
          description: injury.description,
          affectedPerformance: injury.affectedPerformance,
          type: injury.type === 'Molestia' ? 'Molestia' : 'Dolor' as 'Molestia' | 'Dolor'
        })) : undefined
      };
      
      // Llamar al backend para crear el workout completo
      const createdWorkout = await CompletedWorkoutService.createCompletedWorkout(createDto);
      
      const associatedSession = plannedSessions.find(s => s.id === sessionId);
      const selectedAthlete = associatedSession ? availableAthletes.find(a => a.id === associatedSession.athleteId) : null;
      
      let toastDescription = '';
      if (associatedSession && selectedAthlete) {
        toastDescription = `Atleta: ${selectedAthlete.name}\nVinculado a: ${associatedSession.name}`;
      }
      if (laps.length > 0) {
        toastDescription += `\n${laps.length} vuelta${laps.length !== 1 ? 's' : ''} registrada${laps.length !== 1 ? 's' : ''}`;
      }
      if (injuries.length > 0) {
        toastDescription += `\n${injuries.length} molestia${injuries.length > 1 ? 's' : ''}/dolor${injuries.length > 1 ? 'es' : ''} registrada${injuries.length > 1 ? 's' : ''}`;
      }

      toast.success('¡Entrenamiento vinculado exitosamente!', {
        description: toastDescription
      });

      // Reiniciar el formulario
      resetForm();
    } catch (error) {
      // El error ya se maneja en el servicio con toast
      console.error('Error al crear el entrenamiento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2>Subir Entrenamientos</h2>
          <p className="text-muted-foreground">
            {currentStep === 1 
              ? 'Paso 1: Vincula el entrenamiento con una sesión planificada' 
              : currentStep === 2 
              ? 'Paso 2: Importa desde Garmin o registra manualmente'
              : 'Paso 3: Confirma la vinculación del entrenamiento'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(currentStep === 2 || currentStep === 3) && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (currentStep === 2) {
                    handleBackToStep1();
                  } else if (currentStep === 3) {
                    // Volver al paso 2 y limpiar entrenamiento completado
                    setCompletedTraining(null);
                    setCurrentStep(2);
                  }
                }}
                disabled={isSubmitting}
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <Badge variant={currentStep === 1 ? "default" : "outline"} className="gap-1">
            {currentStep === 1 ? <div className="w-2 h-2 rounded-full bg-white" /> : <CheckCircle className="w-3 h-3" />}
            Paso 1
          </Badge>
          <div className="w-8 h-px bg-border" />
          <Badge variant={currentStep === 2 ? "default" : "outline"} className="gap-1">
            {currentStep === 2 ? <div className="w-2 h-2 rounded-full bg-white" /> : currentStep === 3 ? <CheckCircle className="w-3 h-3" /> : null}
            Paso 2
          </Badge>
          <div className="w-8 h-px bg-border" />
          <Badge variant={currentStep === 3 ? "default" : "outline"} className="gap-1">
            {currentStep === 3 && <div className="w-2 h-2 rounded-full bg-white" />}
            Paso 3
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {/* PASO 1: Vincular Entrenamiento */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Vincular Entrenamiento</CardTitle>
              <CardDescription>Selecciona la fecha del entrenamiento para ver las sesiones planificadas por el entrenador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fecha del Entrenamiento */}
              <div className="space-y-2">
                <Label htmlFor="training-date">Fecha del Entrenamiento *</Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="training-date"
                    placeholder="dd/mm/yyyy"
                    value={dateInputValue}
                    onChange={(e) => handleDateInput(e.target.value)}
                    maxLength={10}
                    className="w-[160px]"
                  />
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setDateInputValue(date ? format(date, 'dd/MM/yyyy') : '');
                          setSessionId('');
                          setIsDatePickerOpen(false);
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {selectedDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "PPPP", { locale: es })}
                  </p>
                )}
              </div>

              {selectedDate && <Separator />}

              {/* Asociación con Sesión Planificada por el Entrenador */}
              {selectedDate && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent" />
                    <Label className="font-medium">Asociar con Sesión Planificada *</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selecciona la sesión planificada por el entrenador para esta fecha
                  </p>
                  
                  {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando sesiones planificadas...</span>
                    </div>
                  ) : (() => {
                    const availableSessions = getSessionsByDate(selectedDate);
                    const allSessions = getAllSessionsByDate(selectedDate);
                    
                    // Si hay sesiones pero todas tienen workouts cargados
                    if (allSessions.length > 0 && availableSessions.length === 0) {
                      return (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-900">
                            <p className="font-medium">Ya has cargado los resultados para todas las sesiones de este día</p>
                            <p className="text-sm mt-1">
                              Todas las sesiones planificadas para {format(selectedDate, "d 'de' MMMM", { locale: es })} ya tienen resultados cargados.
                              Puedes visualizarlos desde el calendario.
                            </p>
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    
                    // Si hay sesiones disponibles
                    if (availableSessions.length > 0) {
                      return (
                    <div className="space-y-2">
                      <Label htmlFor="session">Sesiones Planificadas para {format(selectedDate, "d 'de' MMMM", { locale: es })} *</Label>
                      <Select 
                        onValueChange={(value) => setSessionId(value)} 
                        value={sessionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sesión...">
                            {sessionId && (() => {
                              const selectedSession = getSessionsByDate(selectedDate).find(s => s.id === sessionId);
                              return selectedSession ? selectedSession.name : "Seleccionar sesión...";
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-w-md">
                          {getSessionsByDate(selectedDate).map(session => {
                            return (
                              <SelectItem key={session.id} value={session.id} className="py-3">
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="text-sm font-medium text-foreground">{session.name}</div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">{session.type}</Badge>
                                    <span>•</span>
                                    <span>{session.plannedDistance}km</span>
                                    <span>•</span>
                                    <span>{session.plannedDuration}min</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Plan: {session.planningName}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      {/* Mostrar detalles de la sesión seleccionada */}
                      {sessionId && (() => {
                        const selectedSession = getSessionsByDate(selectedDate).find(s => s.id === sessionId);
                        
                        return selectedSession ? (
                          <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-2">
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-muted-foreground">Distancia planeada:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedDistance}km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duración planeada:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedDuration}min</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ritmo objetivo:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedPace}/km</span>
                              </div>
                              {selectedSession.targetHR !== 'N/A' && (
                                <div>
                                  <span className="text-muted-foreground">FC objetivo:</span>
                                  <span className="ml-1 font-medium">{selectedSession.targetHR}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    );
                    }
                    
                    // Si no hay sesiones para esta fecha
                    return (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No se encontraron sesiones planificadas para {format(selectedDate, "d 'de' MMMM", { locale: es })}.
                        </AlertDescription>
                      </Alert>
                    );
                  })()}
                </div>
              )}

              {/* Botón Continuar */}
              {selectedDate && !isLoadingSessions && getSessionsByDate(selectedDate).length > 0 && (
                <>
                  <Separator className="mt-6" />
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleContinueToStep2} 
                      className="gap-2"
                      disabled={!sessionId}
                    >
                      Continuar al Paso 2
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* PASO 2: Importar desde Garmin o Registro Manual */}
        {currentStep === 2 && (
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Registro de Entrenamiento</CardTitle>
              <CardDescription>Importa desde Garmin Connect o ingresa manualmente los datos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'garmin' | 'manual')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="garmin" className="gap-2">
                    <Watch className="w-4 h-4" />
                    Importar desde Garmin
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Registro Manual
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Importar desde Garmin */}
                <TabsContent value="garmin" className="flex-1 space-y-4 mt-0">
                  {!isGarminConnected ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="rounded-full bg-accent/10 p-6">
                        <Watch className="w-12 h-12 text-accent" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3>Conecta tu cuenta de Garmin</h3>
                        <p className="text-muted-foreground max-w-md">
                          Vincula tu cuenta de Garmin Connect para importar automáticamente tus entrenamientos realizados
                        </p>
                      </div>
                      <Button 
                        onClick={handleConnectGarmin} 
                        disabled={isConnectingGarmin}
                        className="gap-2"
                        size="lg"
                      >
                        <Link2 className="w-4 h-4" />
                        {isConnectingGarmin ? 'Conectando...' : 'Conectar con Garmin'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Estado de conexión */}
                      <Alert className="border-accent/50 bg-accent/5">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>Cuenta de Garmin conectada</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleDisconnectGarmin}
                            className="h-auto p-1"
                          >
                            Desconectar
                          </Button>
                        </AlertDescription>
                      </Alert>

                      {/* Selector de rango de fechas */}
                      <div className="space-y-3">
                        <Label>Rango de fechas para buscar entrenamientos *</Label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Desde</Label>
                            <Input
                              placeholder="dd/mm/yyyy"
                              value={garminDateInputFrom}
                              onChange={(e) => handleGarminDateInputFrom(e.target.value)}
                              maxLength={10}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Hasta</Label>
                            <Input
                              placeholder="dd/mm/yyyy"
                              value={garminDateInputTo}
                              onChange={(e) => handleGarminDateInputTo(e.target.value)}
                              maxLength={10}
                              disabled={!garminDateRange.from}
                            />
                          </div>
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal gap-2"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {garminDateRange.from ? (
                                garminDateRange.to ? (
                                  <>
                                    {format(garminDateRange.from, "PPP", { locale: es })} - {format(garminDateRange.to, "PPP", { locale: es })}
                                  </>
                                ) : (
                                  format(garminDateRange.from, "PPP", { locale: es })
                                )
                              ) : (
                                "O seleccionar desde el calendario"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={garminDateRange}
                              onSelect={(range) => {
                                setGarminDateRange(range || {});
                                if (range?.from) setGarminDateInputFrom(format(range.from, 'dd/MM/yyyy'));
                                if (range?.to) setGarminDateInputTo(format(range.to, 'dd/MM/yyyy'));
                              }}
                              disabled={(date) => date > new Date()}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>

                        <Button 
                          onClick={handleSearchGarminActivities}
                          disabled={!garminDateRange.from || isLoadingActivities}
                          className="w-full gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {isLoadingActivities ? 'Buscando...' : 'Buscar Entrenamientos'}
                        </Button>
                      </div>

                      {/* Lista de actividades de Garmin */}
                      {garminDateRange.from && getFilteredGarminActivities().length > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          <div>
                            <Label>Entrenamientos disponibles ({getFilteredGarminActivities().length})</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Selecciona el entrenamiento que quieres vincular con la sesión planificada
                            </p>
                          </div>
                          
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {getFilteredGarminActivities().map((activity) => (
                              <Card 
                                key={activity.id}
                                className={`cursor-pointer transition-all hover:border-accent ${
                                  selectedGarminActivity === activity.id ? 'border-accent bg-accent/5' : ''
                                }`}
                                onClick={() => handleSelectGarminActivity(activity.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium">{activity.activityName}</h4>
                                        <Badge variant="outline" className="text-xs">
                                          {activity.activityType}
                                        </Badge>
                                        {selectedGarminActivity === activity.id && (
                                          <CheckCircle className="w-4 h-4 text-accent" />
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {format(new Date(activity.startTime), "PPP 'a las' HH:mm", { locale: es })}
                                      </p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Distancia:</span>
                                          <p className="font-medium">{activity.distance} km</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Duración:</span>
                                          <p className="font-medium">{activity.duration} min</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Ritmo:</span>
                                          <p className="font-medium">{activity.averagePace}/km</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">FC Prom:</span>
                                          <p className="font-medium">{activity.averageHR} bpm</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {selectedGarminActivity && (
                            <>
                              <Separator />
                              <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-accent/5">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-accent/10 p-2">
                                    <CheckCircle className="w-5 h-5 text-accent" />
                                  </div>
                                  <div>
                                    <p className="font-medium">Entrenamiento seleccionado</p>
                                    <p className="text-sm text-muted-foreground">
                                      {mockGarminActivities.find(a => a.id === selectedGarminActivity)?.activityName}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={handleLinkGarminActivity}
                                  className="gap-2"
                                >
                                  <Link2 className="w-4 h-4" />
                                  Vincular con la Planificación
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {garminDateRange.from && getFilteredGarminActivities().length === 0 && !isLoadingActivities && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No se encontraron entrenamientos en el rango de fechas seleccionado
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* TAB: Registro Manual */}
                <TabsContent value="manual" className="flex-1 mt-0">
                  <div className="h-full">
                    {existingWorkout ? (
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-6">
                          <Alert className="bg-yellow-50 border-yellow-200">
                            <Info className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-900">
                              <p className="font-medium mb-2">Ya existe un resultado cargado para esta sesión</p>
                              <p className="text-sm mb-4">
                                No se puede cargar más de un resultado por sesión. Puedes visualizar el resultado existente desde el calendario.
                              </p>
                              <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium">Resultado existente:</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Distancia</p>
                                    <p className="font-medium">{existingWorkout.distance} km</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Duración</p>
                                    <p className="font-medium">
                                      {(() => {
                                        const minutes = Math.floor(existingWorkout.duration / 60);
                                        const seconds = Math.round(existingWorkout.duration % 60);
                                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                      })()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">FC Promedio</p>
                                    <p className="font-medium">{existingWorkout.averageHR} bpm</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Fecha</p>
                                    <p className="font-medium">
                                      {existingWorkout.date && !isNaN(new Date(existingWorkout.date).getTime()) 
                                        ? format(new Date(existingWorkout.date), 'dd/MM/yyyy', { locale: es }) 
                                        : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6 h-full flex flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto">
                  {/* Datos Básicos - Campos de APIWorkout */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Entrenamiento *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        placeholder="Se seleccionará automáticamente de la sesión planificada"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        El nombre se completa automáticamente desde la sesión seleccionada en el paso 1
                      </p>
                    </div>

                    {/* Métricas Principales según APIWorkout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="distance" className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Distancia (km) *
                          {laps.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Calculado automáticamente desde las vueltas</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </Label>
                        <Input
                          id="distance"
                          type="number"
                          step="0.1"
                          value={formData.distance}
                          onChange={(e) => handleInputChange('distance', e.target.value)}
                          placeholder="8.5"
                          readOnly={laps.length > 0}
                          className={laps.length > 0 ? "bg-muted cursor-not-allowed" : ""}
                          required
                        />
                        {laps.length > 0 && (
                          <p className="text-xs text-muted-foreground">Calculado automáticamente desde las vueltas</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration" className="flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          Duración (mm:ss) *
                          {laps.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Calculado automáticamente desde las vueltas</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </Label>
                        <Input
                          id="duration"
                          type="text"
                          value={formData.duration}
                          onChange={(e) => {
                            if (laps.length > 0) return; // No permitir edición si hay laps
                            // Formato mm:ss, solo permitir números y : 
                            const value = e.target.value.replace(/[^\d:]/g, '');
                            // Validar formato básico
                            if (value === '' || /^\d{0,2}(:\d{0,2})?$/.test(value)) {
                              handleInputChange('duration', value);
                            }
                          }}
                          placeholder="45:00"
                          maxLength={5}
                          readOnly={laps.length > 0}
                          className={laps.length > 0 ? "bg-muted cursor-not-allowed" : ""}
                          required
                        />
                        {laps.length > 0 ? (
                          <p className="text-xs text-muted-foreground">Calculado automáticamente desde las vueltas</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Formato: mm:ss (ej: 45:30)</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="averageHR" className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          FC Promedio (bpm) *
                          {laps.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Calculado automáticamente (promedio ponderado por duración)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </Label>
                        <Input
                          id="averageHR"
                          type="number"
                          value={formData.averageHR}
                          onChange={(e) => handleInputChange('averageHR', e.target.value)}
                          placeholder="155"
                          readOnly={laps.length > 0}
                          className={laps.length > 0 ? "bg-muted cursor-not-allowed" : ""}
                          required
                        />
                        {laps.length > 0 && (
                          <p className="text-xs text-muted-foreground">Promedio ponderado por duración desde las vueltas</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Laps (Vueltas/Intervalos) - Basado en APILap */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        <Label className="font-medium">Vueltas/Intervalos (Opcional)</Label>
                      </div>
                      {!showLapForm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddLap}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Vuelta
                        </Button>
                      )}
                    </div>

                    {laps.length > 0 && (
                      <div className="space-y-2">
                        {laps.map((lap, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Vuelta #{lap.index}</p>
                                    <p className="font-medium">{lap.distance} km</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Duración</p>
                                    <p className="font-medium">{formatSecondsToMMSS(lap.duration)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">FC Prom</p>
                                    <p className="font-medium">{lap.averageHR} bpm</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Velocidad</p>
                                    <p className="font-medium">{lap.speed.toFixed(2)} m/s</p>
                                    <p className="text-xs text-muted-foreground">{convertSpeedToPace(lap.speed)}/km</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Inicio</p>
                                    <p className="font-medium text-xs">{format(new Date(lap.startTime), 'HH:mm', { locale: es })}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveLap(index)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {showLapForm && (
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="lapDistance">Distancia (km) *</Label>
                              <Input
                                id="lapDistance"
                                type="number"
                                step="0.1"
                                value={currentLap.distance || ''}
                                onChange={(e) => handleLapChange('distance', parseFloat(e.target.value) || 0)}
                                placeholder="1.0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lapDuration">Duración (mm:ss) *</Label>
                              <Input
                                id="lapDuration"
                                type="text"
                                value={currentLap.durationString || ''}
                                onChange={(e) => handleLapChange('durationString', e.target.value)}
                                placeholder="05:30"
                                maxLength={5}
                              />
                              <p className="text-xs text-muted-foreground">Formato: mm:ss (ej: 05:30)</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lapHR">FC Promedio (bpm) *</Label>
                              <Input
                                id="lapHR"
                                type="number"
                                value={currentLap.averageHR || ''}
                                onChange={(e) => handleLapChange('averageHR', parseInt(e.target.value) || 0)}
                                placeholder="155"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lapStartTime">Hora de Inicio (HH:mm)</Label>
                              <Input
                                id="lapStartTime"
                                type="time"
                                value={currentLap.startTime ? format(new Date(currentLap.startTime), "HH:mm") : ''}
                                onChange={(e) => {
                                  // Combinar la fecha del entrenamiento con la hora seleccionada
                                  const baseDate = selectedDate || new Date();
                                  const [hours, minutes] = e.target.value.split(':');
                                  const newDateTime = new Date(baseDate);
                                  newDateTime.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);
                                  handleLapChange('startTime', newDateTime.toISOString());
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                La fecha será la misma del entrenamiento ({selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: es }) : 'fecha seleccionada'})
                              </p>
                            </div>
                          </div>
                          {currentLap.speed && currentLap.speed > 0 && (
                            <div className="p-2 bg-muted rounded-md">
                              <p className="text-sm text-muted-foreground">
                                Velocidad calculada: <span className="font-medium">{currentLap.speed.toFixed(2)} m/s</span>
                                {' '}(<span className="font-medium">{convertSpeedToPace(currentLap.speed)}/km</span>)
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleSaveLap}
                              className="flex-1"
                            >
                              Guardar Vuelta
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelLap}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Separator />

                  {/* Sensaciones */}
                  <div className="space-y-4">
                    <Label className="font-medium">Sensaciones Durante el Entrenamiento</Label>
                    
                    <TooltipProvider>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="effort">Esfuerzo Percibido</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    <span className="font-medium">1</span> = Muy fácil<br />
                                    <span className="font-medium">10</span> = Máximo esfuerzo
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-sm text-muted-foreground">{formData.effort}/10</span>
                          </div>
                          <Input
                            id="effort"
                            type="range"
                            min="1"
                            max="10"
                            value={formData.effort}
                            onChange={(e) => handleInputChange('effort', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="fatigue">Fatiga</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    <span className="font-medium">1</span> = Sin fatiga<br />
                                    <span className="font-medium">10</span> = Fatiga extrema
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-sm text-muted-foreground">{formData.fatigue}/10</span>
                          </div>
                          <Input
                            id="fatigue"
                            type="range"
                            min="1"
                            max="10"
                            value={formData.fatigue}
                            onChange={(e) => handleInputChange('fatigue', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="motivation">Motivación</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    <span className="font-medium">1</span> = Sin motivación<br />
                                    <span className="font-medium">10</span> = Muy motivado
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-sm text-muted-foreground">{formData.motivation}/10</span>
                          </div>
                          <Input
                            id="motivation"
                            type="range"
                            min="1"
                            max="10"
                            value={formData.motivation}
                            onChange={(e) => handleInputChange('motivation', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="muscularLoad">Carga Muscular</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    <span className="font-medium">1</span> = Sin carga<br />
                                    <span className="font-medium">10</span> = Carga máxima
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-sm text-muted-foreground">{formData.muscularLoad}/10</span>
                          </div>
                          <Input
                            id="muscularLoad"
                            type="range"
                            min="1"
                            max="10"
                            value={formData.muscularLoad}
                            onChange={(e) => handleInputChange('muscularLoad', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="overallFeeling">Sensación General</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">
                                    <span className="font-medium">1</span> = Me sentí muy mal<br />
                                    <span className="font-medium">10</span> = Me sentí excelente
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-sm text-muted-foreground">{formData.overallFeeling}/10</span>
                          </div>
                          <Input
                            id="overallFeeling"
                            type="range"
                            min="1"
                            max="10"
                            value={formData.overallFeeling}
                            onChange={(e) => handleInputChange('overallFeeling', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </TooltipProvider>
                  </div>

                  <Separator />

                  {/* Molestias/Lesiones */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Molestias o Dolores</Label>
                      {!showInjuryForm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInjuryForm(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      )}
                    </div>

                    {injuries.length > 0 && (
                      <div className="space-y-2">
                        {injuries.map((injury, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(injury.severity)}>
                                  {injury.type} - {getSeverityLabel(injury.severity)}
                                </Badge>
                                <span className="font-medium">{injury.bodyPart}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{injury.description}</p>
                              {injury.affectedPerformance && (
                                <p className="text-xs text-orange-600 mt-1">Afectó el rendimiento</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInjury(index)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showInjuryForm && (
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="injuryType">Tipo</Label>
                            <Select 
                              onValueChange={(value) => handleInjuryChange('type', value)} 
                              value={currentInjury.type}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Molestia">Molestia</SelectItem>
                                <SelectItem value="Dolor">Dolor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bodyPart">Zona Corporal</Label>
                            <Select 
                              onValueChange={(value) => handleInjuryChange('bodyPart', value)} 
                              value={currentInjury.bodyPart}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar zona" />
                              </SelectTrigger>
                              <SelectContent>
                                {bodyParts.map((part) => (
                                  <SelectItem key={part} value={part}>
                                    {part}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="severity">Severidad</Label>
                              <span className="text-sm text-muted-foreground">{currentInjury.severity}/10</span>
                            </div>
                            <Input
                              id="severity"
                              type="range"
                              min="1"
                              max="10"
                              value={currentInjury.severity}
                              onChange={(e) => handleInjuryChange('severity', parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="injuryDescription">Descripción</Label>
                            <Textarea
                              id="injuryDescription"
                              value={currentInjury.description}
                              onChange={(e) => handleInjuryChange('description', e.target.value)}
                              placeholder="Describe la molestia o dolor..."
                              rows={3}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="affectedPerformance"
                              checked={currentInjury.affectedPerformance}
                              onChange={(e) => handleInjuryChange('affectedPerformance', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="affectedPerformance" className="cursor-pointer">
                              Esta molestia/dolor afectó mi rendimiento
                            </Label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={addInjury}
                              size="sm"
                            >
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowInjuryForm(false);
                                setCurrentInjury({
                                  bodyPart: 'none',
                                  severity: 1,
                                  description: '',
                                  affectedPerformance: false,
                                  type: 'Molestia'
                                });
                              }}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Separator />

                  {/* Comentarios */}
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comentarios Adicionales</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      placeholder="Agrega comentarios sobre el entrenamiento..."
                      rows={4}
                    />
                  </div>
                </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? 'Subiendo...' : 'Subir Entrenamiento'}
                      </Button>
                    </div>
                  </form>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* PASO 3: Confirmación de Vinculación */}
        {currentStep === 3 && completedTraining && (
          <div className="space-y-4">
            {/* Mensaje de éxito */}
            <Card className="border-accent/50 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-accent/10 p-3">
                    <CheckCircle className="w-8 h-8 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2">Vinculación Exitosa</h3>
                    <p className="text-muted-foreground">
                      El entrenamiento realizado ha sido vinculado correctamente con la sesión planificada. 
                      Revisa los detalles a continuación antes de confirmar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparación Planificado vs Realizado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sesión Planificada */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <CardTitle>Sesión Planificada</CardTitle>
                  </div>
                  <CardDescription>Objetivos establecidos por el entrenador</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const plannedSession = plannedSessions.find(s => s.id === sessionId);
                    const athlete = plannedSession ? availableAthletes.find(a => a.id === plannedSession.athleteId) : null;
                    
                    return plannedSession ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{athlete?.name}</span>
                            <Badge variant="outline" className="text-xs">{athlete?.specialty}</Badge>
                          </div>
                          <div>
                            <h4 className="font-medium">{plannedSession.name}</h4>
                            <p className="text-sm text-muted-foreground">{plannedSession.planningName}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipo</span>
                            <Badge variant="outline">{plannedSession.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Distancia</span>
                            <span className="font-medium">{plannedSession.plannedDistance} km</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Duración</span>
                            <span className="font-medium">{plannedSession.plannedDuration} min</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Ritmo objetivo</span>
                            <span className="font-medium">{plannedSession.plannedPace}/km</span>
                          </div>
                        </div>

                      </>
                    ) : null;
                  })()}
                </CardContent>
              </Card>

              {/* Entrenamiento Realizado */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <CardTitle>Entrenamiento Realizado</CardTitle>
                  </div>
                  <CardDescription>
                    {completedTraining.uploadSource === 'garmin' 
                      ? 'Importado desde Garmin Connect'
                      : 'Registrado manualmente'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{completedTraining.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(completedTraining.date), "PPP", { locale: es })}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tipo</span>
                      <Badge variant="outline">{completedTraining.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Distancia</span>
                      <span className="font-medium">{completedTraining.distance} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duración</span>
                      <span className="font-medium">{completedTraining.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ritmo promedio</span>
                      <span className="font-medium">
                        {(() => {
                          // Calcular ritmo promedio desde distancia y duración
                          if (completedTraining.distance > 0 && completedTraining.duration > 0) {
                            const durationSeconds = completedTraining.duration * 60; // convertir minutos a segundos
                            const paceSecondsPerKm = durationSeconds / completedTraining.distance;
                            return formatSecondsToMMSS(paceSecondsPerKm);
                          }
                          return completedTraining.avgPace || 'N/A';
                        })()}/km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">FC promedio</span>
                      <span className="font-medium">{completedTraining.avgHR} bpm</span>
                    </div>
                  </div>

                  {injuries.length > 0 && (
                    <>
                      <Separator />
                      <Alert variant="destructive" className="bg-destructive/10">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertDescription>
                          {injuries.length} molestia{injuries.length > 1 ? 's' : ''}/dolor{injuries.length > 1 ? 'es' : ''} registrada{injuries.length > 1 ? 's' : ''}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Métricas adicionales y sensaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Datos Adicionales del Entrenamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sensaciones */}
                  <div>
                    <h4 className="font-medium mb-3">Sensaciones</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Esfuerzo</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.effort / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.effort}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fatiga</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.fatigue / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.fatigue}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Motivación</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.motivation / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.motivation}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Carga Muscular</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.muscularLoad / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.muscularLoad}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sensación General</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.overallFeeling / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.overallFeeling}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparación Planificado vs Realizado */}
                  {plannedSessions.find(s => s.id === sessionId) && (
                    <div>
                      <h4 className="font-medium mb-3">Comparación Planificado vs Realizado</h4>
                      <div className="space-y-3">
                        {/* Mostrar series complejas si existen */}
                        {plannedSessions.find(s => s.id === sessionId)?.series && plannedSessions.find(s => s.id === sessionId)!.series!.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Series Planificadas:</p>
                            {plannedSessions.find(s => s.id === sessionId)!.series!.slice(0, 3).map((series, seriesIdx) => (
                              <div key={seriesIdx} className="text-xs p-2 bg-muted rounded space-y-1">
                                <div className="font-medium text-sm mb-1">
                                  {series.name} {series.repetitions > 1 ? `(${series.repetitions}x)` : ''}
                                  {series.recoveryBetweenSets && series.recoveryBetweenSets !== '00:00' && (
                                    <span className="text-muted-foreground ml-2">Rec: {series.recoveryBetweenSets}</span>
                                  )}
                                </div>
                                {series.intervals.slice(0, 3).map((interval, intervalIdx) => (
                                  <div key={intervalIdx} className="pl-3 text-xs">
                                    <span className={interval.type === 'work' ? 'text-blue-600' : 'text-gray-500'}>
                                      {interval.type === 'work' ? '●' : '○'} {interval.type === 'work' ? 'Trabajo' : 'Recuperación'}
                                    </span>
                                    {interval.repetitions && interval.repetitions > 1 ? ` (${interval.repetitions}x)` : ''}
                                    {' - '}
                                    {interval.distance ? `${interval.distance.toFixed(2)} km` : ''}
                                    {interval.duration ? ` - ${formatSecondsToMMSS(interval.duration * 60)}` : ''}
                                    {interval.pace && interval.pace !== 'N/A' ? ` - ${interval.pace}/km` : ''}
                                  </div>
                                ))}
                                {series.intervals.length > 3 && (
                                  <div className="pl-3 text-xs text-muted-foreground">
                                    +{series.intervals.length - 3} intervalos más en esta serie
                                  </div>
                                )}
                              </div>
                            ))}
                            {plannedSessions.find(s => s.id === sessionId)!.series!.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{plannedSessions.find(s => s.id === sessionId)!.series!.length - 3} series más
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Mostrar intervalos simples si existen y no hay series */}
                        {!plannedSessions.find(s => s.id === sessionId)?.series && plannedSessions.find(s => s.id === sessionId)?.intervals && plannedSessions.find(s => s.id === sessionId)!.intervals!.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Intervalos Planificados:</p>
                            {plannedSessions.find(s => s.id === sessionId)!.intervals!.slice(0, 5).map((interval, idx) => (
                              <div key={idx} className="text-xs p-2 bg-muted rounded">
                                <span className="font-medium">{interval.type === 'work' ? 'Trabajo' : 'Recuperación'}</span>
                                {interval.repetitions && interval.repetitions > 1 ? ` (${interval.repetitions}x)` : ''}
                                {' - '}
                                {interval.distance ? `${interval.distance.toFixed(2)} km` : ''}
                                {interval.duration ? ` - ${formatSecondsToMMSS(interval.duration * 60)}` : ''}
                                {interval.pace && interval.pace !== 'N/A' ? ` - ${interval.pace}/km` : ''}
                              </div>
                            ))}
                            {plannedSessions.find(s => s.id === sessionId)!.intervals!.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                +{plannedSessions.find(s => s.id === sessionId)!.intervals!.length - 5} intervalos más
                              </p>
                            )}
                          </div>
                        )}
                        {laps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Vueltas Completadas:</p>
                            {laps.slice(0, 5).map((lap, idx) => (
                              <div key={idx} className="text-xs p-2 bg-accent/10 rounded">
                                <span className="font-medium">Vuelta #{lap.index}</span>
                                {' - '}
                                {lap.distance.toFixed(2)} km
                                {' - '}
                                {formatSecondsToMMSS(lap.duration)}
                                {' - '}
                                {convertSpeedToPace(lap.speed)}/km
                                {' - '}
                                {lap.averageHR} bpm
                              </div>
                            ))}
                            {laps.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                +{laps.length - 5} vueltas más
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {completedTraining.comments && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-medium mb-2">Comentarios</h4>
                      <p className="text-sm text-muted-foreground">{completedTraining.comments}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botón de confirmación */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium mb-1">¿Confirmar vinculación?</h4>
                    <p className="text-sm text-muted-foreground">
                      El entrenamiento quedará asociado a la sesión planificada
                    </p>
                  </div>
                  <Button 
                    onClick={handleConfirmLink}
                    size="lg"
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Vinculación
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de conexión con Garmin */}
      <Dialog open={showGarminModal} onOpenChange={setShowGarminModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <motion.div 
                className="p-2 bg-cyan-600 rounded-lg"
                animate={isConnectingGarmin ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: isConnectingGarmin ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Watch className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <DialogTitle>Conectar con Garmin Connect</DialogTitle>
                <DialogDescription>
                  {isConnectingGarmin ? 'Autenticando con Garmin...' : 'Ingresa tus credenciales de Garmin'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleGarminLogin} className="space-y-4">
            <motion.div 
              className="space-y-2"
              animate={isConnectingGarmin ? { opacity: 0.5 } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Label htmlFor="garmin-email">
                Email o nombre de usuario
              </Label>
              <Input
                id="garmin-email"
                type="text"
                placeholder="tu-email@ejemplo.com"
                value={garminEmail}
                onChange={(e) => {
                  setGarminEmail(e.target.value);
                  if (garminFormErrors.email) {
                    setGarminFormErrors({ ...garminFormErrors, email: undefined });
                  }
                }}
                className={garminFormErrors.email ? 'border-red-500' : ''}
                disabled={isConnectingGarmin}
              />
              <AnimatePresence>
                {garminFormErrors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-600"
                  >
                    {garminFormErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div 
              className="space-y-2"
              animate={isConnectingGarmin ? { opacity: 0.5 } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Label htmlFor="garmin-password">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="garmin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={garminPassword}
                  onChange={(e) => {
                    setGarminPassword(e.target.value);
                    if (garminFormErrors.password) {
                      setGarminFormErrors({ ...garminFormErrors, password: undefined });
                    }
                  }}
                  className={`pr-10 ${garminFormErrors.password ? 'border-red-500' : ''}`}
                  disabled={isConnectingGarmin}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isConnectingGarmin}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {garminFormErrors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-600"
                  >
                    {garminFormErrors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Indicador de progreso durante la conexión */}
            <AnimatePresence>
              {isConnectingGarmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-5 w-5 text-cyan-600" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-900">Conectando con Garmin Connect</p>
                        <p className="text-xs text-cyan-700">Verificando credenciales...</p>
                      </div>
                    </div>
                    <div className="w-full bg-cyan-200 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Alert className="bg-cyan-50 border-cyan-200">
              <AlertCircle className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-cyan-800">
                Tus credenciales son enviadas de forma segura a Garmin Connect y no son almacenadas por Strider.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelGarminLogin}
                disabled={isConnectingGarmin}
              >
                Cancelar
              </Button>
              <motion.div
                whileTap={!isConnectingGarmin ? { scale: 0.95 } : {}}
              >
                <Button
                  type="submit"
                  disabled={isConnectingGarmin}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {isConnectingGarmin ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Conectar
                    </>
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
