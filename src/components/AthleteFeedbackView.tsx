import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { CompletedWorkoutService, CompletedWorkoutResponseDto } from '../services/completedWorkoutService';
import { SessionRetroalimentacionModal } from './SessionFeedbackModal';

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

export function AthleteFeedbackView() {
  const [workoutsWithFeedback, setWorkoutsWithFeedback] = useState<CompletedWorkoutResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkoutResponseDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadWorkoutsWithFeedback();
  }, []);

  const loadWorkoutsWithFeedback = async () => {
    setIsLoading(true);
    try {
      // Cargar todos los workouts del atleta que tengan feedback
      const workouts = await CompletedWorkoutService.getMyCompletedWorkouts();
      // Filtrar solo los que tienen feedback
      const workoutsWithFeedbackData = workouts.filter(w => w.feedback != null);
      // Ordenar por fecha descendente (más recientes primero)
      workoutsWithFeedbackData.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      setWorkoutsWithFeedback(workoutsWithFeedbackData);
    } catch (error: any) {
      console.error('Error al cargar retroalimentaciones:', error);
      if (error?.response?.status !== 401) {
        toast.error('Error al cargar las retroalimentaciones');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingLabel = (rating?: string) => {
    if (!rating) return 'Sin calificación';
    const normalized = rating.toLowerCase();
    switch (normalized) {
      case 'excellent':
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
    if (!rating) return 'bg-muted text-muted-foreground';
    const normalized = rating.toLowerCase();
    switch (normalized) {
      case 'excellent':
      case 'excellent':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'good':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'needsimprovement':
      case 'needs_improvement':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      case 'doesnotmeetobjectives':
      case 'concerning':
        return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRatingIcon = (rating?: string) => {
    if (!rating) return <AlertCircle className="w-4 h-4" />;
    const normalized = rating.toLowerCase();
    switch (normalized) {
      case 'excellent':
      case 'excellent':
        return <Star className="w-4 h-4 fill-green-600 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'needsimprovement':
      case 'needs_improvement':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'doesnotmeetobjectives':
      case 'concerning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleViewFeedback = (workout: CompletedWorkoutResponseDto) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return format(parseDate(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = (distance: number, duration: number) => {
    if (distance === 0 || duration === 0) return '0:00/km';
    const paceSeconds = duration / distance;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Retroalimentaciones del Entrenador</h1>
        <p className="text-muted-foreground mt-1">
          Revisa las retroalimentaciones y evaluaciones de tus entrenamientos
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando retroalimentaciones...</span>
          </CardContent>
        </Card>
      ) : workoutsWithFeedback.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium">No hay retroalimentaciones aún</p>
                <p className="text-sm">Las retroalimentaciones de tu entrenador aparecerán aquí una vez que evalúe tus entrenamientos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Lista de Retroalimentaciones */
        <div className="space-y-4">
          {workoutsWithFeedback.map((workout) => (
            <Card key={workout.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{workout.name || workout.trainingSessionName}</CardTitle>
                      {workout.feedback?.rating && (
                        <Badge className={`${getRatingColor(workout.feedback.rating)} flex items-center gap-1`}>
                          {getRatingIcon(workout.feedback.rating)}
                          <span className="break-words whitespace-normal">{getRatingLabel(workout.feedback.rating)}</span>
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(workout.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(workout.duration)}
                      </span>
                      {workout.distance > 0 && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {workout.distance.toFixed(2)} km
                        </span>
                      )}
                      {workout.averageHR > 0 && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          FC: {workout.averageHR} bpm
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Información de Planificación */}
                  {(workout.planningName || workout.mesocycleName || workout.microcycleName) && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {workout.planningName && (
                        <Badge variant="outline">{workout.planningName}</Badge>
                      )}
                      {workout.mesocycleName && (
                        <Badge variant="outline">{workout.mesocycleName}</Badge>
                      )}
                      {workout.microcycleName && (
                        <Badge variant="outline">{workout.microcycleName}</Badge>
                      )}
                    </div>
                  )}

                  {/* Feedback del Entrenador */}
                  {workout.feedback && (
                    <div className="space-y-3">
                      <div className="bg-accent/10 p-4 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">Retroalimentación del Entrenador</h4>
                          {workout.feedback.coachName && (
                            <span className="text-sm text-muted-foreground">
                              por {workout.feedback.coachName}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm whitespace-pre-wrap">{workout.feedback.feedback}</p>
                        </div>

                        {workout.feedback.recommendations && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium mb-2">Recomendaciones:</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {workout.feedback.recommendations}
                            </p>
                          </div>
                        )}

                        {workout.feedback.lapFeedbacks && workout.feedback.lapFeedbacks.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium mb-2">Feedback por Intervalos:</h5>
                            <div className="space-y-2">
                              {workout.feedback.lapFeedbacks.map((lapFeedback, index) => (
                                <div key={lapFeedback.id} className="bg-background p-2 rounded text-sm">
                                  <span className="font-medium">Intervalo {index + 1}:</span>{' '}
                                  {lapFeedback.feedback}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-2">
                          {format(parseDate(workout.feedback.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón para ver detalles completos */}
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewFeedback(workout)}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ver Detalles Completos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
            type: 'training' as const,
            plannedDistance: selectedWorkout.distance,
            plannedDuration: selectedWorkout.duration / 60,
            plannedIntensity: 70,
            plannedPace: calculatePace(selectedWorkout.distance, selectedWorkout.duration),
            notes: selectedWorkout.comments,
            intervals: []
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
            injuries: selectedWorkout.injuries.map(inj => ({
              type: inj.type === 'Molestia' ? 'Molestia' as const : 'Dolor' as const,
              location: inj.bodyPart,
              severity: inj.severity,
              description: inj.description
            }))
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

