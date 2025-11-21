import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrainingSessionService, TrainingSessionResponseDto, TrainingIntervalResponseDto } from '../services/trainingSessionService';
import { CompletedWorkoutService, CompletedWorkoutResponseDto, WorkoutLapResponseDto } from '../services/completedWorkoutService';
import { CoachAthleteRelationshipService } from '../services/coachAthleteRelationshipService';
import { UserService } from '../services/userService';
import { 
  MessageSquare,
  Send,
  Star,
  ThumbsUp,
  AlertTriangle,
  AlertCircle,
  Activity,
  ShieldAlert,
  Target,
  Loader2,
  Clock,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlannedSession {
  id: string;
  name: string;
  date: string;
  type: 'Intervalos' | 'Fondo' | 'Tempo' | 'Recuperación' | 'Test';
  plannedDistance: number;
  plannedDuration: number;
  plannedPace: string;
  plannedIntensity: number;
  notes?: string;
}

interface ActualSession {
  id: string;
  sessionId: string;
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  perceivedExertion: number;
  heartRate?: {
    avg: number;
    max: number;
  };
  notes?: string;
  sensations?: string; // Comentarios sobre cómo se sintió durante el entrenamiento
  completed: boolean;
  completedAt: string;
  injuries?: Array<{
    type: 'Molestia' | 'Dolor';
    location: string;
    severity: number; // 1-10 scale
    description?: string;
  }>;
}

interface CoachFeedback {
  id: string;
  sessionId: string;
  microcycleId: string;
  feedbackText: string;
  rating: 'excellent' | 'good' | 'needs_improvement' | 'concerning';
  recommendations?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SessionRetroalimentacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedSession: PlannedSession;
  actualSession?: ActualSession;
  existingFeedback?: CoachFeedback;
  athleteName: string;
  onSaveFeedback: (feedback: CoachFeedback) => void;
  readOnly?: boolean;
  completedWorkoutId?: number; // ID del CompletedWorkout para cargar datos del backend
  trainingSessionId?: number; // ID de la sesión planificada para cargar desde el backend
}

export function SessionRetroalimentacionModal({
  isOpen,
  onClose,
  plannedSession,
  actualSession,
  existingFeedback,
  athleteName,
  onSaveFeedback,
  readOnly = false,
  completedWorkoutId,
  trainingSessionId
}: SessionRetroalimentacionModalProps) {
  const [rating, setRating] = useState<CoachFeedback['rating']>('good');
  const [retroalimentacionText, setRetroalimentacionText] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [plannedSessionData, setPlannedSessionData] = useState<TrainingSessionResponseDto | null>(null);
  const [isLoadingPlannedSession, setIsLoadingPlannedSession] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState<CompletedWorkoutResponseDto | null>(null);
  const [isLoadingCompletedWorkout, setIsLoadingCompletedWorkout] = useState(false);
  const [lapFeedbacks, setLapFeedbacks] = useState<Record<number, string>>({});
  const [athleteVO2Max, setAthleteVO2Max] = useState<string | undefined>(undefined);

  // Cargar sesión planificada desde el backend cuando se abre el modal
  useEffect(() => {
    if (isOpen && trainingSessionId) {
      setIsLoadingPlannedSession(true);
      TrainingSessionService.getTrainingSessionById(trainingSessionId)
        .then(session => {
          setPlannedSessionData(session);
        })
        .catch(error => {
          console.error('Error al cargar sesión planificada:', error);
          setPlannedSessionData(null);
        })
        .finally(() => {
          setIsLoadingPlannedSession(false);
        });
    } else {
      setPlannedSessionData(null);
    }
  }, [isOpen, trainingSessionId]);

  // Cargar CompletedWorkout completo desde el backend cuando se abre el modal
  useEffect(() => {
    if (isOpen && completedWorkoutId) {
      setIsLoadingCompletedWorkout(true);
      CompletedWorkoutService.getCompletedWorkoutById(completedWorkoutId)
        .then(workout => {
          setCompletedWorkoutData(workout);
          // Cargar feedbacks de laps existentes si hay feedback
          if (workout?.feedback?.lapFeedbacks) {
            const lapFeedbacksMap: Record<number, string> = {};
            workout.feedback.lapFeedbacks.forEach(lf => {
              lapFeedbacksMap[lf.workoutLapId] = lf.feedback;
            });
            setLapFeedbacks(lapFeedbacksMap);
          } else {
            setLapFeedbacks({});
          }
        })
        .catch(error => {
          console.error('Error al cargar completed workout:', error);
          setCompletedWorkoutData(null);
        })
        .finally(() => {
          setIsLoadingCompletedWorkout(false);
        });
    } else {
      setCompletedWorkoutData(null);
      setLapFeedbacks({});
    }
  }, [isOpen, completedWorkoutId]);

  // Cargar VO2Max del atleta
  useEffect(() => {
    let isMounted = true;

    const fetchAthleteVO2Max = async () => {
      try {
        // Primero, verificar si el usuario actual es un atleta
        // Si es atleta, obtener el VO2Max de su propio perfil
        let currentUserProfile;
        try {
          currentUserProfile = await UserService.getProfile();
        } catch (error) {
          console.error('Error al obtener perfil del usuario:', error);
        }

        const isAthlete = currentUserProfile && (
          currentUserProfile.userType === 'athlete' || 
          currentUserProfile.userType === 0 ||
          (typeof currentUserProfile.userType === 'string' && currentUserProfile.userType.toLowerCase() === 'athlete')
        );

        // Si el usuario es un atleta, usar su propio perfil
        if (isAthlete && currentUserProfile) {
          const vo2Max = (currentUserProfile as any)?.VO2Max || currentUserProfile.vO2Max || currentUserProfile.vo2Max;
          if (!isMounted) return;
          
          if (vo2Max) {
            console.log('VO2Max obtenido del perfil del atleta:', vo2Max);
            setAthleteVO2Max(vo2Max);
          } else {
            setAthleteVO2Max(undefined);
          }
          return;
        }

        // Si es entrenador, obtener athleteId y buscar en la lista de atletas
        let athleteId: number | undefined;
        
        if (completedWorkoutData?.athleteId) {
          athleteId = completedWorkoutData.athleteId;
        } else if (plannedSessionData?.athletes && plannedSessionData.athletes.length > 0) {
          athleteId = plannedSessionData.athletes[0].athleteId;
        } else if (plannedSessionData?.athleteIds && plannedSessionData.athleteIds.length > 0) {
          athleteId = plannedSessionData.athleteIds[0];
        }

        if (!athleteId) {
          setAthleteVO2Max(undefined);
          return;
        }

        // Obtener la lista de atletas del entrenador
        const athletesData = await CoachAthleteRelationshipService.getMyAthletes('Accepted');
        // El DTO del frontend tiene 'id', no 'athleteId'
        const athlete = athletesData.find(a => a.id === athleteId);
        
        if (!isMounted) return;
        
        if (!athlete) {
          console.log('Atleta no encontrado en la lista del entrenador. athleteId:', athleteId, 'Total atletas:', athletesData.length);
          setAthleteVO2Max(undefined);
          return;
        }
        
        // El backend retorna VO2Max (mayúsculas) pero el frontend puede tener vO2Max o vo2Max
        const vo2Max = (athlete as any)?.VO2Max || athlete?.vO2Max || athlete?.vo2Max;
        
        if (vo2Max) {
          console.log('VO2Max encontrado para atleta:', athleteId, 'VO2Max:', vo2Max);
          setAthleteVO2Max(vo2Max);
        } else {
          console.log('VO2Max no encontrado para atleta:', athleteId, 'Athlete data:', athlete);
          setAthleteVO2Max(undefined);
        }
      } catch (error) {
        console.error('Error al cargar VO2Max del atleta:', error);
        if (isMounted) {
          setAthleteVO2Max(undefined);
        }
      }
    };

    if (isOpen && (completedWorkoutData || plannedSessionData)) {
      fetchAthleteVO2Max();
    } else {
      setAthleteVO2Max(undefined);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, completedWorkoutData, plannedSessionData]);

  // Inicializar formulario con datos existentes
  useEffect(() => {
    if (existingFeedback) {
      setRating(existingFeedback.rating);
      setRetroalimentacionText(existingFeedback.feedbackText);
      setRecommendations(existingFeedback.recommendations || '');
    } else if (completedWorkoutData?.feedback) {
      // Si tenemos datos del backend, usar esos
      const ratingToUse = completedWorkoutData.feedback.rating || completedWorkoutData.rating;
      // Normalizar a minúsculas para comparación case-insensitive
      const normalizedRating = typeof ratingToUse === 'string' ? ratingToUse.toLowerCase() : '';
      const backendRating = normalizedRating === 'excellent' ? 'excellent' :
                            normalizedRating === 'good' ? 'good' :
                            normalizedRating === 'needsimprovement' ? 'needs_improvement' : 'concerning';
      setRating(backendRating as CoachFeedback['rating']);
      setRetroalimentacionText(completedWorkoutData.feedback.feedback);
      setRecommendations(completedWorkoutData.feedback.recommendations || '');
    } else {
      setRating('good');
      setRetroalimentacionText('');
      setRecommendations('');
    }
  }, [existingFeedback, completedWorkoutData, isOpen]);



  // Función helper para parsear fechas correctamente evitando problemas de zona horaria
  const parseDate = (dateString: string): Date => {
    // Si la fecha viene solo como "YYYY-MM-DD", tratarla como fecha local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Si viene con hora, usar parseISO y luego ajustar a fecha local
    try {
      const parsed = parseISO(dateString);
      // Si la fecha tiene hora UTC (termina en Z), extraer solo la parte de fecha
      if (dateString.includes('T') && dateString.endsWith('Z')) {
        const dateOnly = dateString.split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return parsed;
    } catch {
      return new Date(dateString);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseDate(dateString);
    return format(date, 'EEEE, d MMM', { locale: es });
  };

  // Función helper para calcular el ritmo en formato mm:ss/km
  const calculatePace = (distance: number, durationSeconds: number): string => {
    if (distance === 0 || durationSeconds === 0) return '00:00/km';
    const secondsPerKm = durationSeconds  / (distance / 1000);
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  // Función helper para formatear duración de segundos a mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Funciones para calcular ritmo desde VO2Max
  const paceToMinutes = (paceStr: string): number => {
    const parts = paceStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!Number.isNaN(minutes) && !Number.isNaN(seconds)) {
        return minutes + seconds / 60;
      }
    }
    return 0;
  };

  const minutesToPace = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePaceFromVO2Max = (vo2MaxPaceStr: string, percentage: number): string => {
    const vo2MaxMinutes = paceToMinutes(vo2MaxPaceStr);
    if (vo2MaxMinutes <= 0) return '';
    
    // Calcular velocidad del VO2Max (km/h)
    const vo2MaxVelocity = 60 / vo2MaxMinutes;
    
    // Aplicar porcentaje
    const targetVelocity = vo2MaxVelocity * (percentage / 100);
    
    // Convertir de vuelta a ritmo (min/km)
    const targetPaceMinutes = 60 / targetVelocity;
    
    return minutesToPace(targetPaceMinutes);
  };

  const determineTargetPace = (interval: TrainingIntervalResponseDto, athleteVO2Max?: string): string | undefined => {
    if (interval.targetSpeed) {
      return interval.targetSpeed;
    }

    // Si es VO2Max percentage, calcular el ritmo
    const intervalAny = interval as any;
    const paceTypeStr = String(interval.paceType || '');
    const isVo2MaxPercentage = paceTypeStr === 'vo2max_percentage' || 
                               paceTypeStr.toLowerCase() === 'vo2maxpercentage' || 
                               paceTypeStr === 'vo2MaxPercentage';
    
    if (isVo2MaxPercentage && intervalAny.vo2MaxPercentage && athleteVO2Max) {
      const calculatedPace = calculatePaceFromVO2Max(athleteVO2Max, intervalAny.vo2MaxPercentage);
      if (calculatedPace) {
        return calculatedPace;
      }
    }

    if (interval.paceType && interval.pace !== undefined && interval.pace !== null) {
      return `${interval.pace} ${interval.paceType}`;
    }

    if (interval.targetTime) {
      // Formatear targetTime si es necesario
      return interval.targetTime;
    }

    return undefined;
  };

  // Calcular duración real del workout: usar laps si están disponibles, sino usar el valor del workout
  const calculateActualDuration = (): number => {
    // Si tenemos datos del completedWorkout, usar esos
    if (completedWorkoutData) {
      // Si hay laps, calcular la duración total de las laps
      if (completedWorkoutData.laps && completedWorkoutData.laps.length > 0) {
        const totalDurationSeconds = completedWorkoutData.laps.reduce((sum, lap) => sum + lap.duration, 0);
        return totalDurationSeconds / 60; // Convertir a minutos
      }
      // Si no hay laps, usar la duración del workout (ya está en segundos)
      return completedWorkoutData.duration / 60; // Convertir a minutos
    }
    
    // Fallback: usar actualSession si está disponible
    if (actualSession) {
      // Si actualSession.actualDuration es 0 o no existe, intentar calcular de intervals
      if (actualSession.actualDuration > 0) {
        return actualSession.actualDuration; // Ya está en minutos según el código
      }
      // Si hay intervals, calcular de ahí
      if (actualSession.intervals && actualSession.intervals.length > 0) {
        const totalDurationSeconds = actualSession.intervals.reduce((sum, interval) => 
          sum + (interval.actualDuration || 0), 0);
        return totalDurationSeconds / 60; // Convertir a minutos
      }
    }
    
    return 0;
  };

  // Calcular distancia real del workout: usar laps si están disponibles
  const calculateActualDistance = (): number => {
    if (completedWorkoutData) {
      // Si hay laps, calcular la distancia total de las laps
      if (completedWorkoutData.laps && completedWorkoutData.laps.length > 0) {
        return completedWorkoutData.laps.reduce((sum, lap) => sum + lap.distance, 0);
      }
      return completedWorkoutData.distance;
    }
    return actualSession?.actualDistance || 0;
  };

  // Obtener laps para mostrar
  const getLapsToDisplay = (): WorkoutLapResponseDto[] => {
    if (completedWorkoutData?.laps && completedWorkoutData.laps.length > 0) {
      return completedWorkoutData.laps.sort((a, b) => a.index - b.index);
    }
    // Fallback: convertir intervals a formato de laps si están disponibles
    if (actualSession?.intervals && actualSession.intervals.length > 0) {
      return actualSession.intervals.map((interval, idx) => ({
        id: idx + 1,
        index: interval.intervalNumber || idx + 1,
        distance: interval.actualDistance || 0,
        duration: (interval.actualDuration || 0) * 60, // Convertir minutos a segundos
        averageHR: interval.avgHeartRate || 0,
        speed: 0, // Calcular si es necesario
        startTime: new Date().toISOString()
      }));
    }
    return [];
  };



  const getRatingIcon = (ratingType: string) => {
    switch (ratingType) {
      case 'excellent':
        return <Star className="w-4 h-4 text-green-600" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4 text-blue-600" />;
      case 'needs_improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'concerning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRatingColor = (ratingType: string) => {
    switch (ratingType) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'concerning': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingLabel = (ratingType: string) => {
    switch (ratingType) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'needs_improvement': return 'Necesita Mejora';
      case 'concerning': return 'No Cumple los Objetivos';
      default: return 'Sin Evaluar';
    }
  };

  // Función para traducir nombres de partes del cuerpo del inglés al español
  const mapInjuryLocationToSpanish = (location: string): string => {
    if (!location) return location;
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



  const handleSave = async () => {
    if (!retroalimentacionText.trim()) {
      toast.error('Por favor, escribe un comentario antes de guardar');
      return;
    }

    // Si tenemos un completedWorkoutId, guardar en el backend
    if (completedWorkoutId) {
      try {
        // Mapear el rating del formato antiguo al nuevo formato del backend
        const backendRating = rating === 'excellent' ? 'Excellent' :
                             rating === 'good' ? 'Good' :
                             rating === 'needs_improvement' ? 'NeedsImprovement' : 'DoesNotMeetObjectives';

        // Preparar feedbacks de laps
        const lapsToDisplay = getLapsToDisplay();
        const lapFeedbacksArray = lapsToDisplay
          .map(lap => {
            const lapFeedback = lapFeedbacks[lap.id];
            if (lapFeedback && lapFeedback.trim()) {
              return {
                workoutLapId: lap.id,
                feedback: lapFeedback.trim()
              };
            }
            return null;
          })
          .filter((fb): fb is { workoutLapId: number; feedback: string } => fb !== null);

        const feedbackData = {
          rating: backendRating as 'Excellent' | 'Good' | 'NeedsImprovement' | 'DoesNotMeetObjectives',
          feedback: retroalimentacionText.trim(),
          recommendations: recommendations.trim() || undefined,
          lapFeedbacks: lapFeedbacksArray
        };

        if (existingFeedback) {
          // Actualizar feedback existente
          await CompletedWorkoutService.updateWorkoutFeedback(completedWorkoutId, feedbackData);
          toast.success('Retroalimentación actualizada exitosamente');
        } else {
          // Crear nuevo feedback
          await CompletedWorkoutService.submitWorkoutFeedback(completedWorkoutId, feedbackData);
          toast.success('Retroalimentación guardada exitosamente');
        }

        // También llamar al callback para actualizar el estado local si es necesario
        const feedback: CoachFeedback = {
          id: existingFeedback?.id || `retroalimentacion-${Date.now()}`,
          sessionId: plannedSession.id,
          microcycleId: 'current-microcycle',
          feedbackText: retroalimentacionText.trim(),
          rating,
          recommendations: recommendations.trim() || undefined,
          createdAt: existingFeedback?.createdAt || new Date().toISOString(),
          updatedAt: existingFeedback ? new Date().toISOString() : undefined
        };
        onSaveFeedback(feedback);
        onClose();
      } catch (error: any) {
        console.error('Error al guardar feedback:', error);
        toast.error(error?.response?.data?.message || 'Error al guardar la retroalimentación');
      }
    } else {
      // Fallback al comportamiento anterior si no hay completedWorkoutId
      const feedback: CoachFeedback = {
        id: existingFeedback?.id || `retroalimentacion-${Date.now()}`,
        sessionId: plannedSession.id,
        microcycleId: 'current-microcycle',
        feedbackText: retroalimentacionText.trim(),
        rating,
        recommendations: recommendations.trim() || undefined,
        createdAt: existingFeedback?.createdAt || new Date().toISOString(),
        updatedAt: existingFeedback ? new Date().toISOString() : undefined
      };
      onSaveFeedback(feedback);
      toast.success('Retroalimentación guardada exitosamente');
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {readOnly || existingFeedback ? 'Retroalimentación de Sesión' : 'Dar Retroalimentación de Sesión'} - {athleteName}
          </DialogTitle>
          <DialogDescription>
            {readOnly || existingFeedback 
              ? 'Visualiza la retroalimentación proporcionada para esta sesión'
              : 'Proporciona retroalimentación específica sobre el rendimiento del atleta en esta sesión'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header de la sesión */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-medium">{plannedSession.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(plannedSession.date)} • {plannedSession.type}
                  </p>
                </div>
              </div>
              {existingFeedback && (
                <Badge className={`${getRatingColor(existingFeedback.rating)} flex items-center gap-1 break-words whitespace-normal`}>
                  {getRatingIcon(existingFeedback.rating)}
                  <span className="break-words whitespace-normal">{getRatingLabel(existingFeedback.rating)}</span>
                </Badge>
              )}
            </div>
            
            {/* Información de planificación */}
            {(plannedSession as any).planningName || (plannedSession as any).mesocycleName || (plannedSession as any).microcycleName ? (
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground px-4">
                {(plannedSession as any).planningName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Planificación:</span>
                    <span>{(plannedSession as any).planningName}</span>
                  </div>
                )}
                {(plannedSession as any).mesocycleName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Mesociclo:</span>
                    <span>{(plannedSession as any).mesocycleName}</span>
                  </div>
                )}
                {(plannedSession as any).microcycleName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Microciclo:</span>
                    <span>{(plannedSession as any).microcycleName}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Comparación Planificado vs Realizado */}
          {isLoadingPlannedSession ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando sesión planificada...</span>
            </div>
          ) : (
            plannedSessionData && actualSession && (
              <div className="space-y-4">
                <h4 className="font-semibold text-base">Comparación: Planificado vs Realizado</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Columna Planificado */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Planificado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Distancia:</span>
                          <p className="font-medium">
                            {plannedSessionData.volume ? `${plannedSessionData.volume.toFixed(1)} km` : plannedSession.plannedDistance ? `${plannedSession.plannedDistance} km` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duración:</span>
                          <p className="font-medium">
                            {plannedSessionData.estimatedWorkSeconds 
                              ? `${Math.floor(plannedSessionData.estimatedWorkSeconds / 60)} min`
                              : plannedSession.plannedDuration 
                              ? `${plannedSession.plannedDuration} min`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {plannedSessionData.description && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Descripción:</span>
                          <p className="mt-1">{plannedSessionData.description}</p>
                        </div>
                      )}
                      
                      {/* Series e Intervalos */}
                      {plannedSessionData.series && plannedSessionData.series.length > 0 && (
                        <div className="text-sm space-y-2">
                          <span className="text-muted-foreground font-medium">Series e Intervalos:</span>
                          <div className="space-y-2 mt-2">
                            {plannedSessionData.series.map((series, seriesIdx) => (
                              <div key={series.id || seriesIdx} className="bg-muted/50 rounded-lg p-2">
                                {series.name && (
                                  <p className="font-medium text-xs mb-1">{series.name}</p>
                                )}
                                {series.intervals && series.intervals.length > 0 && (
                                  <div className="space-y-1">
                                    {series.intervals.map((interval, intervalIdx) => {
                                      const targetPace = determineTargetPace(interval, athleteVO2Max);
                                      return (
                                        <div key={interval.id || intervalIdx} className="text-xs">
                                          <span className="font-medium">
                                            {interval.repetitions}x
                                          </span>
                                          {' '}
                                          {interval.distance > 0 && (
                                            <span>
                                              {interval.distance >= 1000 
                                                ? `${(interval.distance / 1000).toFixed(1)} km`
                                                : `${interval.distance} m`}
                                            </span>
                                          )}
                                          {interval.duration && (
                                            <span>{interval.duration}</span>
                                          )}
                                          {interval.targetTime && (
                                            <span>{interval.targetTime}</span>
                                          )}
                                          {targetPace && (
                                            <span className="text-muted-foreground">
                                              {' '}· Ritmo: {targetPace}/km
                                            </span>
                                          )}
                                          {interval.description && (
                                            <span className="text-muted-foreground block mt-0.5">
                                              {interval.description}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {series.repetitions > 1 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {series.repetitions} series · Recuperación entre series: {series.recoveryBetweenSets}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Intervalos directos (si no hay series) */}
                      {(!plannedSessionData.series || plannedSessionData.series.length === 0) && 
                       plannedSessionData.intervals && plannedSessionData.intervals.length > 0 && (
                        <div className="text-sm space-y-2">
                          <span className="text-muted-foreground font-medium">Intervalos:</span>
                          <div className="space-y-1">
                            {plannedSessionData.intervals.map((interval, idx) => {
                              const targetPace = determineTargetPace(interval, athleteVO2Max);
                              return (
                                <div key={interval.id || idx} className="text-xs bg-muted/50 rounded-lg p-2">
                                  <span className="font-medium">
                                    {interval.repetitions}x
                                  </span>
                                  {' '}
                                  {interval.distance > 0 && (
                                    <span>
                                      {interval.distance >= 1000 
                                        ? `${(interval.distance / 1000).toFixed(1)} km`
                                        : `${interval.distance} m`}
                                    </span>
                                  )}
                                  {interval.duration && (
                                    <span>{interval.duration}</span>
                                  )}
                                  {interval.targetTime && (
                                    <span>{interval.targetTime}</span>
                                  )}
                                  {targetPace && (
                                    <span className="text-muted-foreground">
                                      {' '}· Ritmo: {targetPace}/km
                                    </span>
                                  )}
                                  {interval.recoveryTime && interval.recoveryTime !== '00:00' && (
                                    <span className="text-muted-foreground">
                                      {' '}· Recuperación: {interval.recoveryTime}
                                    </span>
                                  )}
                                  {interval.description && (
                                    <span className="text-muted-foreground block mt-0.5">
                                      {interval.description}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {plannedSessionData.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notas:</span>
                          <p className="mt-1">{plannedSessionData.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Columna Realizado */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-600" />
                        Realizado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Distancia:</span>
                          <p className="font-medium">{(actualSession.actualDistance / 1000).toFixed(1)} km</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duración:</span>
                          <p className="font-medium">{Math.floor(actualSession.actualDuration)} min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ritmo:</span>
                          <p className="font-medium">{calculatePace(actualSession.actualDistance, actualSession.actualDuration * 60)}</p>
                        </div>
                        {actualSession.heartRate && (
                          <div>
                            <span className="text-muted-foreground">FC Promedio:</span>
                            <p className="font-medium">{actualSession.heartRate.avg} bpm</p>
                          </div>
                        )}
                      </div>
                      {actualSession.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Comentarios:</span>
                          <p className="mt-1">{actualSession.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          )}

          {/* Información reportada por el atleta */}
          {(actualSession || completedWorkoutData) && (
            <div className="border rounded-lg p-6 space-y-4 bg-muted/30 border-border">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Información Reportada por el Atleta
              </h4>

              {isLoadingCompletedWorkout ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando datos del entrenamiento...</span>
                </div>
              ) : (
                <>
                  {/* Métricas de la sesión */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Distancia</p>
                      <p className="font-medium">{(calculateActualDistance() / 1000).toFixed(2)} km</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Ritmo</p>
                      <p className="font-medium">
                        {completedWorkoutData 
                          ? calculatePace(completedWorkoutData.distance, completedWorkoutData.duration)
                          : actualSession?.actualPace || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Duración</p>
                      <p className="font-medium">{Math.floor(calculateActualDuration())} min</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Esfuerzo Percibido</p>
                      <p className="font-medium">
                        {completedWorkoutData?.sensations?.effort || actualSession?.perceivedExertion || 'N/A'}/10
                      </p>
                    </div>
                  </div>

                  {/* Frecuencia cardíaca si está disponible */}
                  {(completedWorkoutData?.averageHR || actualSession?.heartRate) && (
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-2">Frecuencia Cardíaca</p>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Promedio</p>
                          <p className="font-medium">
                            {completedWorkoutData?.averageHR || actualSession?.heartRate?.avg || 'N/A'} bpm
                          </p>
                        </div>
                        {actualSession?.heartRate?.max && (
                          <div>
                            <p className="text-xs text-muted-foreground">Máxima</p>
                            <p className="font-medium">{actualSession.heartRate.max} bpm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Molestias o dolencias */}
                  {((completedWorkoutData?.injuries && completedWorkoutData.injuries.length > 0) || 
                    (actualSession?.injuries && actualSession.injuries.length > 0)) && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <h5 className="font-medium flex items-center gap-2 mb-3 text-destructive">
                        <ShieldAlert className="w-4 h-4" />
                        Molestias o Dolencias Reportadas
                      </h5>
                      <div className="space-y-3">
                        {(completedWorkoutData?.injuries || actualSession?.injuries || []).map((injury: any, index: number) => (
                          <div key={index} className="bg-card rounded-lg p-3 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={
                                  injury.type === 'Dolor' 
                                    ? 'bg-destructive/20 text-destructive border-destructive/30'
                                    : 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
                                }>
                                  {injury.type}
                                </Badge>
                                <span className="font-medium">{mapInjuryLocationToSpanish(injury.location || injury.bodyPart)}</span>
                              </div>
                              <Badge variant="outline" className="bg-muted">
                                Severidad: {injury.severity}/10
                              </Badge>
                            </div>
                            {injury.description && (
                              <p className="text-sm text-muted-foreground">
                                {injury.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sensaciones del atleta */}
                  {(completedWorkoutData?.sensations || actualSession?.sensations) && (
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h5 className="font-medium flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4" />
                        Sensaciones durante el entrenamiento
                      </h5>
                      {completedWorkoutData?.sensations ? (
                        <TooltipProvider>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">Esfuerzo</span>
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
                              <Badge variant="outline" className="ml-2">
                                {completedWorkoutData.sensations.effort}/10
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">Fatiga</span>
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
                              <Badge variant="outline" className="ml-2">
                                {completedWorkoutData.sensations.fatigue}/10
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">Motivación</span>
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
                              <Badge variant="outline" className="ml-2">
                                {completedWorkoutData.sensations.motivation}/10
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">Carga muscular</span>
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
                              <Badge variant="outline" className="ml-2">
                                {completedWorkoutData.sensations.muscularLoad}/10
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted rounded border border-border col-span-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">Sensación general</span>
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
                              <Badge variant="outline" className="ml-2">
                                {completedWorkoutData.sensations.overallFeeling}/10
                              </Badge>
                            </div>
                          </div>
                        </TooltipProvider>
                      ) : (
                        <p className="text-sm">{actualSession?.sensations}</p>
                      )}
                    </div>
                  )}

                  {/* Comentarios del atleta */}
                  {(completedWorkoutData?.comments || actualSession?.notes) && (
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h5 className="font-medium flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Comentarios del Atleta
                      </h5>
                      <p className="text-sm text-foreground">{completedWorkoutData?.comments || actualSession?.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Formulario de Retroalimentación */}
          {(!readOnly || existingFeedback || completedWorkoutData?.feedback) && (
            <div className="border rounded-lg p-6 space-y-6">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {existingFeedback || completedWorkoutData?.feedback 
                  ? `Evaluación del Entrenador ${completedWorkoutData?.feedback?.coachName ? completedWorkoutData.feedback.coachName : ''}`
                  : 'Dar Retroalimentación de Sesión'}
              </h4>
            
            {/* Selector de calificación */}
            <div>
              <label className="block text-sm font-medium mb-3">Calificación General</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['excellent', 'good', 'needs_improvement', 'concerning'] as const).map((ratingOption) => (
                  <Button
                    key={ratingOption}
                    variant={rating === ratingOption ? "default" : "outline"}
                    size="sm"
                    onClick={() => !readOnly && !existingFeedback && !completedWorkoutData?.feedback && setRating(ratingOption)}
                    disabled={readOnly || !!existingFeedback || !!completedWorkoutData?.feedback}
                    className={`justify-start h-auto p-3 ${rating === ratingOption ? getRatingColor(ratingOption) : ''}`}
                  >
                    <div className="flex flex-col items-center gap-1 w-full">
                      {getRatingIcon(ratingOption)}
                      <span className="text-xs text-center break-words whitespace-normal">{getRatingLabel(ratingOption)}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Comentarios sobre la Sesión {!readOnly && !existingFeedback && !completedWorkoutData?.feedback && '*'}
              </label>
              <Textarea
                placeholder="Evalúa el rendimiento del atleta en esta sesión específica. Menciona aspectos positivos, áreas de mejora, cumplimiento de objetivos, técnica, actitud, etc."
                value={retroalimentacionText}
                onChange={(e) => setRetroalimentacionText(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={readOnly || !!existingFeedback || !!completedWorkoutData?.feedback}
              />
              {!readOnly && !existingFeedback && !completedWorkoutData?.feedback && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sé específico y constructivo en tu retroalimentación
                </p>
              )}
            </div>

            {/* Recomendaciones */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Recomendaciones para Próximas Sesiones
              </label>
              <Textarea
                placeholder="Sugerencias específicas para las próximas sesiones de entrenamiento..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={readOnly || !!existingFeedback || !!completedWorkoutData?.feedback}
              />
            </div>

            {/* Feedback por Laps */}
            {getLapsToDisplay().length > 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">Feedback por Lap</label>
                <div className="space-y-3">
                  {getLapsToDisplay().map((lap) => (
                    <Card key={lap.id} className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Lap {lap.index}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Distancia:</span>
                            <p className="font-medium">{(lap.distance / 1000).toFixed(2)} km</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duración:</span>
                            <p className="font-medium">{formatDuration(lap.duration)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ritmo:</span>
                            <p className="font-medium">{calculatePace(lap.distance, lap.duration)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">FC Promedio:</span>
                            <p className="font-medium">{lap.averageHR} bpm</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Feedback para este lap (opcional)</Label>
                          <Textarea
                            placeholder={`Comentarios específicos sobre el lap ${lap.index}...`}
                            value={lapFeedbacks[lap.id] || ''}
                            onChange={(e) => setLapFeedbacks(prev => ({ ...prev, [lap.id]: e.target.value }))}
                            rows={2}
                            className="resize-none text-sm"
                            disabled={readOnly || !!existingFeedback || !!completedWorkoutData?.feedback}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            </div>
          )}
        </div>

        <DialogFooter>
          {readOnly || existingFeedback || completedWorkoutData?.feedback ? (
            <Button onClick={handleCancel}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!retroalimentacionText.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Guardar Retroalimentación
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}