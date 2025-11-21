import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft,
  MessageSquare, 
  Calendar, 
  Clock, 
  Activity,
  Eye,
  Loader2,
  CheckCircle,
  Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { CompletedWorkoutService, CompletedWorkoutResponseDto } from '../services/completedWorkoutService';
import { SessionRetroalimentacionModal } from './SessionFeedbackModal';

interface IndividualAthlete {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AthleteTrainingHistoryProps {
  athlete: IndividualAthlete;
  onBack: () => void;
  showFeedbackInitially?: boolean;
}

type TimePeriod = '7d' | '30d' | '3m' | 'all';

// Función helper para parsear fechas correctamente evitando problemas de zona horaria
const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  // Si la fecha viene solo como "YYYY-MM-DD", tratarla como fecha local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Si viene con hora, usar parseISO y luego ajustar a fecha local
  try {
    // Si la fecha tiene hora UTC (termina en Z o tiene T), extraer solo la parte de fecha
    if (dateString.includes('T')) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const parsed = parseISO(dateString);
    return parsed;
  } catch {
    return new Date(dateString);
  }
};

export function AthleteTrainingHistory({ athlete, onBack, showFeedbackInitially = false }: AthleteTrainingHistoryProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');
  const [workouts, setWorkouts] = useState<CompletedWorkoutResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkoutResponseDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calcular fechas según el período seleccionado
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (timePeriod === 'all') {
      return {
        start: null as string | null,
        end: today.toISOString().split('T')[0]
      };
    }
    
    const days = {
      '7d': 7,
      '30d': 30,
      '3m': 90
    }[timePeriod];
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  }, [timePeriod]);

  // Cargar workouts cuando cambie el período
  useEffect(() => {
    const loadWorkouts = async () => {
      setIsLoading(true);
      try {
        let data: CompletedWorkoutResponseDto[];
        
        if (timePeriod === 'all') {
          // Cargar todos los workouts sin filtro de fecha
          data = await CompletedWorkoutService.getMyCompletedWorkouts();
        } else {
          // Cargar workouts con filtro de fecha
          data = await CompletedWorkoutService.getMyCompletedWorkoutsByDateRange(
            dateRange.start!,
            dateRange.end!
          );
        }
        
        // Ordenar por fecha descendente (más recientes primero)
        data.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        
        setWorkouts(data);
      } catch (error: any) {
        console.error('Error al cargar entrenamientos:', error);
        if (error?.response?.status !== 401) {
          toast.error('Error al cargar el histórico de entrenamientos');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkouts();
  }, [timePeriod, dateRange]);

  const formatDate = (dateString: string) => {
    const date = parseDate(dateString);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  const formatDateShort = (dateString: string) => {
    const date = parseDate(dateString);
    return format(date, "dd/MM/yyyy", { locale: es });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDurationWithSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = (distance: number, duration: number): string => {
    if (distance === 0 || duration === 0) return '—';
    const paceSecondsPerKm = duration / (distance / 1000);
    const mins = Math.floor(paceSecondsPerKm / 60);
    const secs = Math.round(paceSecondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  };

  const getIntensityLabel = (intensity?: string) => {
    if (!intensity) return 'Media';
    const normalized = intensity.toLowerCase();
    switch (normalized) {
      case 'low':
        return 'Baja';
      case 'medium':
        return 'Media';
      case 'high':
        return 'Alta';
      case 'recovery':
        return 'Recuperación';
      default:
        return 'Media';
    }
  };

  const getIntensityColor = (intensity?: string) => {
    if (!intensity) return 'bg-blue-100 text-blue-800 border-blue-200';
    const normalized = intensity.toLowerCase();
    switch (normalized) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'recovery':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRatingLabel = (rating?: string) => {
    if (!rating) return 'Sin calificación';
    const normalized = rating.toLowerCase();
    switch (normalized) {
      case 'excellent':
        return 'Excelente';
      case 'good':
        return 'Bueno';
      case 'needsimprovement':
      case 'needs_improvement':
        return 'Necesita Mejora';
      case 'doesnotmeetobjectives':
      case 'concerning':
        return 'No Cumple los Objetivos';
      default:
        return 'Sin calificación';
    }
  };

  const getRatingColor = (rating?: string) => {
    if (!rating) return 'bg-gray-100 text-gray-800 border-gray-200';
    const normalized = rating.toLowerCase();
    switch (normalized) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'needsimprovement':
      case 'needs_improvement':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'doesnotmeetobjectives':
      case 'concerning':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRatingIcon = (rating?: string) => {
    if (!rating) return null;
    const normalized = rating.toLowerCase();
    switch (normalized) {
      case 'excellent':
        return <Activity className="w-3 h-3" />;
      case 'good':
        return <Activity className="w-3 h-3" />;
      case 'needsimprovement':
      case 'needs_improvement':
        return <Activity className="w-3 h-3" />;
      case 'doesnotmeetobjectives':
      case 'concerning':
        return <Activity className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleViewFeedback = (workout: CompletedWorkoutResponseDto) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1>Histórico de Entrenamientos</h1>
            <p className="text-muted-foreground mt-1">
              Sesiones completadas organizadas por fecha
            </p>
          </div>
        </div>
      </div>

      {/* Filtro de tiempo */}
      <div className="flex items-center justify-end">
        <Select value={timePeriod} onValueChange={(value: string) => setTimePeriod(value as TimePeriod)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de sesiones */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Cargando entrenamientos...</span>
          </CardContent>
        </Card>
      ) : workouts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium">No hay entrenamientos completados</p>
                <p className="text-sm">Los entrenamientos completados aparecerán aquí</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Sesiones con feedback */}
          {workouts.filter(w => w.feedback).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Con Retroalimentación del Entrenador</h2>
                <Badge variant="secondary" className="ml-2">
                  {workouts.filter(w => w.feedback).length}
                </Badge>
              </div>
              {workouts
                .filter(w => w.feedback)
                .map((workout) => (
                  <Card key={workout.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Título con checkmark */}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <CardTitle className="text-xl font-bold">{workout.name || workout.trainingSessionName}</CardTitle>
                    </div>
                    
                  </div>

                  {/* Botones en la esquina superior derecha */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Entrenamiento
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewFeedback(workout)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-0">
                {/* Primera fila: Fecha, Duración, Intensidad */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(workout.date)}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {formatDuration(workout.duration)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className={getIntensityColor('medium')}>
                      {getIntensityLabel('medium')}
                    </Badge>
                  </span>
                </div>

                {/* Segunda fila: Distancia, Ritmo, FC, Valoración */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {workout.distance > 0 && (
                    <span>
                      <span className="text-muted-foreground">Distancia: </span>
                      <span className="font-semibold">{(workout.distance / 1000).toFixed(1)} km</span>
                    </span>
                  )}
                  {workout.distance > 0 && workout.duration > 0 && (
                    <span>
                      <span className="text-muted-foreground">Ritmo Promedio: </span>
                      <span className="font-semibold">{calculatePace(workout.distance, workout.duration)}</span>
                    </span>
                  )}
                  {workout.averageHR > 0 && (
                    <span>
                      <span className="text-muted-foreground">FC Promedio: </span>
                      <span className="font-semibold">{workout.averageHR} bpm</span>
                    </span>
                  )}
                  {workout.feedback?.rating && (
                    <span>
                      <span className="text-muted-foreground">Valoración del Entrenador: </span>
                      <Badge className={`${getRatingColor(workout.feedback.rating)} flex items-center gap-1 inline-flex`}>
                        {getRatingIcon(workout.feedback.rating)}
                        <span className="break-words whitespace-normal">{getRatingLabel(workout.feedback.rating)}</span>
                      </Badge>
                    </span>
                  )}
                </div>

                {/* Notas del Atleta */}
                {workout.comments && (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">Notas del Atleta:</div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{workout.comments}</p>
                  </div>
                )}

                {/* Feedback del Entrenador */}
                {workout.feedback?.feedback && (
                  <div className="bg-blue-100/50 dark:bg-blue-900/20 border border-blue-300/50 dark:border-blue-700/30 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">Feedback del Entrenador:</div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{workout.feedback.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
                ))}
            </div>
          )}

          {/* Sesiones sin feedback */}
          {workouts.filter(w => !w.feedback).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Sin Retroalimentación</h2>
                <Badge variant="secondary" className="ml-2">
                  {workouts.filter(w => !w.feedback).length}
                </Badge>
              </div>
              {workouts
                .filter(w => !w.feedback)
                .map((workout) => (
                  <Card key={workout.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Título con checkmark */}
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <CardTitle className="text-xl font-bold">{workout.name || workout.trainingSessionName}</CardTitle>
                          </div>
                        </div>

                        {/* Botones en la esquina superior derecha */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            Entrenamiento
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewFeedback(workout)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-0">
                      {/* Primera fila: Fecha, Duración, Intensidad */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(workout.date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDuration(workout.duration)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline" className={getIntensityColor('medium')}>
                            {getIntensityLabel('medium')}
                          </Badge>
                        </span>
                      </div>

                      {/* Segunda fila: Distancia, Ritmo, FC */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {workout.distance > 0 && (
                          <span>
                            <span className="text-muted-foreground">Distancia: </span>
                            <span className="font-semibold">{(workout.distance / 1000).toFixed(1)} km</span>
                          </span>
                        )}
                        {workout.distance > 0 && workout.duration > 0 && (
                          <span>
                            <span className="text-muted-foreground">Ritmo Promedio: </span>
                            <span className="font-semibold">{calculatePace(workout.distance, workout.duration)}</span>
                          </span>
                        )}
                        {workout.averageHR > 0 && (
                          <span>
                            <span className="text-muted-foreground">FC Promedio: </span>
                            <span className="font-semibold">{workout.averageHR} bpm</span>
                          </span>
                        )}
                      </div>

                      {/* Notas del Atleta */}
                      {workout.comments && (
                        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-4">
                          <div className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">Notas del Atleta:</div>
                          <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{workout.comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedWorkout && (
        <SessionRetroalimentacionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedWorkout(null);
          }}
          plannedSession={{
            id: selectedWorkout.trainingSessionId.toString(),
            name: selectedWorkout.trainingSessionName,
            date: selectedWorkout.date,
            type: 'Fondo' as const,
            plannedDistance: selectedWorkout.distance,
            plannedDuration: selectedWorkout.duration / 60,
            plannedIntensity: 70,
            plannedPace: calculatePace(selectedWorkout.distance, selectedWorkout.duration),
            notes: selectedWorkout.comments
          }}
          actualSession={{
            id: selectedWorkout.id.toString(),
            sessionId: selectedWorkout.trainingSessionId.toString(),
            actualDistance: selectedWorkout.distance,
            actualDuration: selectedWorkout.duration / 60,
            actualPace: calculatePace(selectedWorkout.distance, selectedWorkout.duration),
            perceivedExertion: selectedWorkout.sensations?.effort || 5,
            heartRate: {
              avg: selectedWorkout.averageHR,
              max: selectedWorkout.averageHR + 10
            },
            notes: selectedWorkout.comments,
            sensations: selectedWorkout.comments,
            completed: true,
            completedAt: selectedWorkout.date,
            injuries: selectedWorkout.injuries?.map(inj => ({
              type: inj.type === 'Molestia' ? 'Molestia' as const : 'Dolor' as const,
              location: inj.bodyPart,
              severity: inj.severity,
              description: inj.description
            })) || []
          }}
          existingFeedback={selectedWorkout.feedback ? {
            id: selectedWorkout.feedback.id.toString(),
            sessionId: selectedWorkout.trainingSessionId.toString(),
            microcycleId: selectedWorkout.microcycleId?.toString() || 'current-microcycle',
            feedbackText: selectedWorkout.feedback.feedback,
            rating: (() => {
              const ratingValue = selectedWorkout.feedback?.rating || selectedWorkout.rating;
              const normalized = typeof ratingValue === 'string' ? ratingValue.toLowerCase() : '';
              return normalized === 'excellent' ? 'excellent' :
                     normalized === 'good' ? 'good' :
                     normalized === 'needsimprovement' ? 'needs_improvement' : 'concerning';
            })() as 'excellent' | 'good' | 'needs_improvement' | 'concerning',
            recommendations: selectedWorkout.feedback.recommendations,
            createdAt: selectedWorkout.feedback.createdAt,
            updatedAt: selectedWorkout.feedback.updatedAt
          } : undefined}
          athleteName=""
          onSaveFeedback={() => {}}
          readOnly={true}
          completedWorkoutId={selectedWorkout.id}
          trainingSessionId={selectedWorkout.trainingSessionId}
        />
      )}
    </div>
  );
}
