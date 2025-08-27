import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  AlertTriangle,
  Activity,
  MessageSquare,
  Send,
  Edit3,
  Eye,
  Heart,
  Timer,
  Route,
  XCircle,
  Minus,
  ArrowUp,
  ArrowDown,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

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
    severity: number;
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

interface SessionComparison {
  plan: PlannedSession;
  actual: ActualSession | null;
  coachFeedback?: CoachFeedback;
}

interface Microcycle {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  focus: string;
  intensity: 'baja' | 'media' | 'alta';
  volume: number;
  sessions: SessionComparison[];
  microcycleFeedback?: {
    overallRating: 'excellent' | 'good' | 'needs_improvement' | 'concerning';
    summary: string;
    recommendations: string;
    createdAt: string;
  };
}

interface CoachRetroalimentacionSystemProps {
  athlete: {
    id: string;
    name: string;
    vo2max: number;
    sede?: string;
  };
  microcycle: Microcycle;
  onSaveFeedback: (feedback: CoachFeedback | Microcycle['microcycleFeedback'], type: 'session' | 'microcycle', id: string) => void;
  onOpenSessionFeedback?: (planned: PlannedSession, actual?: ActualSession) => void;
}

export function CoachRetroalimentacionSystem({
  athlete,
  microcycle,
  onSaveFeedback,
  onOpenSessionFeedback
}: CoachRetroalimentacionSystemProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [expandedInjuries, setExpandedInjuries] = useState<Record<string, boolean>>({});
  const [editingSessionRetroalimentacion, setEditingSessionRetroalimentacion] = useState<string | null>(null);
  const [editingMicrocycleRetroalimentacion, setEditingMicrocycleRetroalimentacion] = useState(false);
  
  // Estados para formularios de retroalimentación
  const [sessionRetroalimentaciones, setSessionRetroalimentaciones] = useState<{[sessionId: string]: Partial<CoachFeedback>}>({});
  const [microcycleRetroalimentacionForm, setMicrocycleRetroalimentacionForm] = useState<Partial<Microcycle['microcycleFeedback']>>({
    overallRating: microcycle.microcycleFeedback?.overallRating || 'good',
    summary: microcycle.microcycleFeedback?.summary || '',
    recommendations: microcycle.microcycleFeedback?.recommendations || ''
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getSessionStatusIcon = (planned: PlannedSession, actual: ActualSession | null) => {
    if (!actual) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    
    const distanceVariation = planned.plannedDistance > 0 
      ? Math.abs(actual.actualDistance - planned.plannedDistance) / planned.plannedDistance 
      : 0;
    const intensityVariation = Math.abs(actual.perceivedExertion - planned.plannedIntensity);
    
    if (distanceVariation <= 0.1 && intensityVariation <= 1) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (distanceVariation <= 0.2 && intensityVariation <= 2) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getCompliancePercentage = (planned: number, actual: number) => {
    if (!planned || planned <= 0 || !actual) return 0;
    return Math.min(100, (actual / planned) * 100);
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVariationIndicator = (planned: number, actual: number) => {
    if (!planned || planned <= 0 || !actual) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    
    const variation = ((actual - planned) / planned) * 100;
    
    if (Math.abs(variation) < 5) {
      return <Minus className="w-4 h-4 text-green-500" />;
    } else if (variation > 0) {
      return <ArrowUp className="w-4 h-4 text-blue-500" />;
    } else {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
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

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'concerning': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'needs_improvement': return 'Necesita Mejora';
      case 'concerning': return 'Preocupante';
      default: return 'Sin Evaluar';
    }
  };

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleSessionRetroalimentacionChange = (sessionId: string, field: string, value: string) => {
    setSessionRetroalimentaciones(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: value
      }
    }));
  };

  const handleSaveSessionRetroalimentacion = (sessionId: string) => {
    const feedbackData = sessionRetroalimentaciones[sessionId];
    if (!feedbackData?.feedbackText?.trim()) {
      toast.error('Por favor, escribe un comentario antes de guardar');
      return;
    }

    const feedback: CoachFeedback = {
      id: `retroalimentacion-${Date.now()}`,
      sessionId,
      microcycleId: microcycle.id,
      feedbackText: feedbackData.feedbackText!,
      rating: feedbackData.rating as CoachFeedback['rating'] || 'good',
      recommendations: feedbackData.recommendations,
      createdAt: new Date().toISOString()
    };

    onSaveFeedback(feedback, 'session', sessionId);
    setEditingSessionRetroalimentacion(null);
    toast.success('Retroalimentación guardada exitosamente');
  };

  const handleSaveMicrocycleRetroalimentacion = () => {
    if (!microcycleRetroalimentacionForm?.summary?.trim()) {
      toast.error('Por favor, escribe un resumen antes de guardar');
      return;
    }

    const feedback: Microcycle['microcycleFeedback'] = {
      overallRating: microcycleRetroalimentacionForm.overallRating!,
      summary: microcycleRetroalimentacionForm.summary!,
      recommendations: microcycleRetroalimentacionForm.recommendations || '',
      createdAt: new Date().toISOString()
    };

    onSaveFeedback(feedback, 'microcycle', microcycle.id);
    setEditingMicrocycleRetroalimentacion(false);
    toast.success('Retroalimentación del microciclo guardada exitosamente');
  };

  // Calcular estadísticas del microciclo
  const weekStats = {
    totalPlanned: microcycle.sessions.reduce((sum, s) => sum + (s?.plan?.plannedDistance || 0), 0),
    totalActual: microcycle.sessions.reduce((sum, s) => sum + (s?.actual?.actualDistance || 0), 0),
    completedSessions: microcycle.sessions.filter(s => s?.actual?.completed).length,
    totalSessions: microcycle.sessions.length,
    avgRPE: (() => {
      const completedSessions = microcycle.sessions.filter(s => s?.actual?.completed);
      if (completedSessions.length === 0) return 0;
      const totalRPE = completedSessions.reduce((sum, s) => sum + (s?.actual?.perceivedExertion || 0), 0);
      return totalRPE / completedSessions.length;
    })()
  };

  const weekCompliance = getCompliancePercentage(weekStats.totalPlanned, weekStats.totalActual);

  return (
    <div className="space-y-6">
      {/* Header del microciclo con feedback general */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Semana {microcycle.weekNumber} - {athlete.name}
              </CardTitle>
              <CardDescription>
                {formatDate(microcycle.startDate)} - {formatDate(microcycle.endDate)} • {microcycle.focus}
                {athlete.sede && ` • ${athlete.sede}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {microcycle.microcycleFeedback && (
                <Badge className={`${getRatingColor(microcycle.microcycleFeedback.overallRating)} flex items-center gap-1`}>
                  {getRatingIcon(microcycle.microcycleFeedback.overallRating)}
                  {getRatingLabel(microcycle.microcycleFeedback.overallRating)}
                </Badge>
              )}
              <Button
                variant={editingMicrocycleRetroalimentacion ? "secondary" : "outline"}
                size="sm"
                onClick={() => setEditingMicrocycleRetroalimentacion(!editingMicrocycleRetroalimentacion)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {microcycle.microcycleFeedback ? 'Editar Retroalimentación' : 'Agregar Retroalimentación'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weekStats.completedSessions}/{weekStats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Sesiones Completadas</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-primary">{weekStats.totalActual.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">/ {weekStats.totalPlanned.toFixed(1)} km</span>
              </div>
              <div className="text-sm text-muted-foreground">Volumen Semanal</div>
              <Progress value={weekCompliance} className="mt-1 h-2" />
              <div className={`text-xs mt-1 ${getComplianceColor(weekCompliance)}`}>
                {weekCompliance.toFixed(0)}% cumplimiento
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weekStats.avgRPE.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">RPE Promedio</div>
            </div>
            
            <div className="text-center">
              <Badge className={`text-base px-3 py-1 ${getRatingColor(microcycle.microcycleFeedback?.overallRating || 'good')}`}>
                {microcycle.microcycleFeedback ? getRatingLabel(microcycle.microcycleFeedback.overallRating) : 'Sin Evaluar'}
              </Badge>
              <div className="text-sm text-muted-foreground">Evaluación</div>
            </div>
          </div>

          {/* Retroalimentación del microciclo */}
          {editingMicrocycleRetroalimentacion && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Retroalimentación General del Microciclo
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {(['excellent', 'good', 'needs_improvement', 'concerning'] as const).map((rating) => (
                  <Button
                    key={rating}
                    variant={microcycleRetroalimentacionForm?.overallRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMicrocycleRetroalimentacionForm(prev => ({ ...prev, overallRating: rating }))}
                    className={microcycleRetroalimentacionForm?.overallRating === rating ? getRatingColor(rating) : ''}
                  >
                    {getRatingIcon(rating)}
                    <span className="ml-2">{getRatingLabel(rating)}</span>
                  </Button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Resumen del Rendimiento</label>
                <Textarea
                  placeholder="Evalúa el rendimiento general del atleta durante esta semana..."
                  value={microcycleRetroalimentacionForm?.summary || ''}
                  onChange={(e) => setMicrocycleRetroalimentacionForm(prev => ({ ...prev, summary: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Recomendaciones para la Próxima Semana</label>
                <Textarea
                  placeholder="Ajustes sugeridos, aspectos a mejorar, felicitaciones..."
                  value={microcycleRetroalimentacionForm?.recommendations || ''}
                  onChange={(e) => setMicrocycleRetroalimentacionForm(prev => ({ ...prev, recommendations: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMicrocycleRetroalimentacion(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveMicrocycleRetroalimentacion}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Guardar Retroalimentación
                </Button>
              </div>
            </div>
          )}

          {/* Mostrar retroalimentación existente del microciclo */}
          {microcycle.microcycleFeedback && !editingMicrocycleRetroalimentacion && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" />
                Retroalimentación del Entrenador
              </h4>
              <div className="space-y-2">
                <p className="text-sm">{microcycle.microcycleFeedback.summary}</p>
                {microcycle.microcycleFeedback.recommendations && (
                  <div className="p-2 bg-accent/10 rounded text-sm">
                    <strong>Recomendaciones:</strong> {microcycle.microcycleFeedback.recommendations}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Evaluación realizada el {new Date(microcycle.microcycleFeedback.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de sesiones con retroalimentación individual */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sesiones del Microciclo</h3>
        
        {microcycle.sessions.map((session) => {
          const isExpanded = expandedSessions.has(session.plan.id);
          const isEditingRetroalimentacion = editingSessionRetroalimentacion === session.plan.id;
          const existingFeedback = session.coachFeedback;
          
          return (
            <Card key={session.plan.id} className="border-l-4 border-l-accent">
              <CardContent className="p-0">
                <Collapsible>
                  <div className="w-full">
                    <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {getSessionStatusIcon(session.plan, session.actual)}
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.plan.name}</p>
                            {session.actual?.injuries && session.actual.injuries.length > 0 && (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                {session.actual.injuries.length} {session.actual.injuries.length === 1 ? 'molestia' : 'molestias'}
                              </Badge>
                            )}
                            {existingFeedback && (
                              <Badge className={`${getRatingColor(existingFeedback.rating)} text-xs flex items-center gap-1`}>
                                {getRatingIcon(existingFeedback.rating)}
                                {getRatingLabel(existingFeedback.rating)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.plan.date)} • {session.plan.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {session.actual ? (
                          <>
                            {/* Resumen compacto */}
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Distancia</div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">
                                  {session.actual.actualDistance.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">/ {session.plan.plannedDistance.toFixed(1)} km</span>
                                {getVariationIndicator(session.plan.plannedDistance, session.actual.actualDistance)}
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">RPE</div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{session.actual.perceivedExertion}</span>
                                <span className="text-muted-foreground">/ {session.plan.plannedIntensity}</span>
                              </div>
                            </div>

                            {session.actual.heartRate && (
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">FC Promedio</div>
                                <div className="flex items-center gap-2 justify-center">
                                  <Heart className="w-3 h-3 text-red-500" />
                                  <span className="font-bold text-primary">{session.actual.heartRate.avg}</span>
                                  <span className="text-muted-foreground text-xs">bpm</span>
                                </div>
                              </div>
                            )}

                            {/* Indicador de molestias */}
                            {session.actual.injuries && session.actual.injuries.length > 0 && (
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">Molestias</div>
                                <div className="flex items-center gap-1 justify-center">
                                  <ShieldAlert className="w-3 h-3 text-red-500" />
                                  <span className="font-bold text-red-600">{session.actual.injuries.length}</span>
                                  <span className="text-red-500 text-xs">
                                    {session.actual.injuries.some(i => i.severity >= 7) ? 'Alta' :
                                     session.actual.injuries.some(i => i.severity >= 4) ? 'Media' : 'Baja'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-2">
                            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                            <div className="text-sm font-medium text-red-600">No realizada</div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {!isEditingRetroalimentacion && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  if (onOpenSessionFeedback) {
                                    onOpenSessionFeedback(session.plan, session.actual || undefined);
                                  } else {
                                    setEditingSessionRetroalimentacion(session.plan.id);
                                    if (!sessionRetroalimentaciones[session.plan.id] && existingFeedback) {
                                      setSessionRetroalimentaciones(prev => ({
                                        ...prev,
                                        [session.plan.id]: {
                                          rating: existingFeedback.rating,
                                          feedbackText: existingFeedback.feedbackText,
                                          recommendations: existingFeedback.recommendations
                                        }
                                      }));
                                    }
                                  }
                                }}
                                size="sm"
                                variant="outline"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {existingFeedback ? 'Editar' : 'Retroalimentación'}
                              </Button>
                            </div>
                          )}
                          
                          <CollapsibleTrigger 
                            className="flex items-center p-2 hover:bg-muted/50 rounded transition-colors"
                            onClick={() => toggleSessionExpansion(session.plan.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t bg-muted/20">
                      <div className="pt-4 space-y-4">
                        
                        {/* Formulario de retroalimentación de sesión */}
                        {isEditingRetroalimentacion && (
                          <div className="border rounded-lg p-4 bg-background space-y-4">
                            <h5 className="font-medium flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Retroalimentación de la Sesión
                            </h5>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['excellent', 'good', 'needs_improvement', 'concerning'] as const).map((rating) => (
                                <Button
                                  key={rating}
                                  variant={sessionRetroalimentaciones[session.plan.id]?.rating === rating ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSessionRetroalimentacionChange(session.plan.id, 'rating', rating)}
                                  className={sessionRetroalimentaciones[session.plan.id]?.rating === rating ? getRatingColor(rating) : ''}
                                >
                                  {getRatingIcon(rating)}
                                  <span className="ml-2">{getRatingLabel(rating)}</span>
                                </Button>
                              ))}
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Comentarios sobre la Sesión</label>
                              <Textarea
                                placeholder="Evalúa el rendimiento del atleta en esta sesión específica..."
                                value={sessionRetroalimentaciones[session.plan.id]?.feedbackText || ''}
                                onChange={(e) => handleSessionRetroalimentacionChange(session.plan.id, 'feedbackText', e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Recomendaciones (Opcional)</label>
                              <Textarea
                                placeholder="Aspectos específicos a mejorar o mantener..."
                                value={sessionRetroalimentaciones[session.plan.id]?.recommendations || ''}
                                onChange={(e) => handleSessionRetroalimentacionChange(session.plan.id, 'recommendations', e.target.value)}
                                rows={2}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingSessionRetroalimentacion(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveSessionRetroalimentacion(session.plan.id)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Guardar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Mostrar feedback existente */}
                        {existingFeedback && !isEditingRetroalimentacion && (
                          <div className="border rounded-lg p-4 bg-primary/5">
                            <h5 className="font-medium flex items-center gap-2 mb-2">
                              {getRatingIcon(existingFeedback.rating)}
                              Feedback del Entrenador - {getRatingLabel(existingFeedback.rating)}
                            </h5>
                            <p className="text-sm mb-2">{existingFeedback.feedbackText}</p>
                            {existingFeedback.recommendations && (
                              <div className="p-2 bg-accent/10 rounded text-sm">
                                <strong>Recomendaciones:</strong> {existingFeedback.recommendations}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Comparación detallada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Plan */}
                          <div>
                            <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Plan del Entrenador
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Distancia:</span>
                                <span className="font-medium">{session.plan.plannedDistance.toFixed(1)} km</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ritmo objetivo:</span>
                                <span className="font-medium">{session.plan.plannedPace}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Duración estimada:</span>
                                <span className="font-medium">{formatDuration(session.plan.plannedDuration)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Intensidad objetivo:</span>
                                <span className="font-medium">{session.plan.plannedIntensity}/10</span>
                              </div>
                              {session.plan.notes && (
                                <div className="mt-3 p-2 bg-primary/5 rounded text-xs">
                                  <span className="text-muted-foreground">Notas del plan: </span>
                                  <span className="text-foreground">{session.plan.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Resultado real */}
                          <div>
                            <h4 className="font-medium text-accent mb-3 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Resultado Real
                            </h4>
                            {session.actual ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Distancia real:</span>
                                  <span className={`font-medium ${
                                    Math.abs(session.actual.actualDistance - session.plan.plannedDistance) <= 0.5 
                                      ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {session.actual.actualDistance.toFixed(1)} km
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ritmo real:</span>
                                  <span className="font-medium">{session.actual.actualPace}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duración real:</span>
                                  <span className="font-medium">{formatDuration(session.actual.actualDuration)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">RPE:</span>
                                  <span className="font-medium">{session.actual.perceivedExertion}/10</span>
                                </div>
                                {session.actual.heartRate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">FC promedio:</span>
                                    <span className="font-medium">{session.actual.heartRate.avg} bpm</span>
                                  </div>
                                )}
                                
                                {/* Comentarios de sensaciones del atleta */}
                                {session.actual.sensations && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-800">Sensaciones del Atleta</span>
                                    </div>
                                    <p className="text-sm text-blue-900 italic">{session.actual.sensations}</p>
                                  </div>
                                )}
                                
                                {session.actual.notes && (
                                  <div className="mt-3 p-2 bg-accent/5 rounded text-xs">
                                    <span className="text-muted-foreground">Notas técnicas: </span>
                                    <span className="text-foreground">{session.actual.notes}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                                <p className="font-medium">Sesión no completada</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sección de molestias/dolores reportadas - Opcional y minimalista */}
                        {session.actual?.injuries && session.actual.injuries.length > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Molestias reportadas:</span>
                              <Collapsible 
                                open={expandedInjuries[session.plan.id] || false} 
                                onOpenChange={(open) => setExpandedInjuries(prev => ({ ...prev, [session.plan.id]: open }))}
                              >
                                <CollapsibleTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    {expandedInjuries[session.plan.id] ? 'Ocultar' : 'Ver detalles'}
                                    {expandedInjuries[session.plan.id] ? (
                                      <ChevronUp className="w-3 h-3 ml-1" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 ml-1" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent>
                                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                                    <div className="mb-4">
                                      <h5 className="font-semibold flex items-center gap-2">
                                        <ShieldAlert className={`w-5 h-5 ${
                                          session.actual.injuries.some(i => i.severity >= 7) ? 'text-red-600' :
                                          session.actual.injuries.some(i => i.severity >= 4) ? 'text-orange-600' :
                                          'text-yellow-600'
                                        }`} />
                                        Molestias y Dolores Reportados ({session.actual.injuries.length})
                                      </h5>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {session.actual.injuries.map((injury, index) => (
                                      <div key={index} className="border rounded-lg p-4 bg-background">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Badge 
                                                className={`text-xs px-2 py-1 ${
                                                  injury.type === 'Dolor' 
                                                    ? 'bg-red-100 text-red-800 border-red-300' 
                                                    : 'bg-orange-100 text-orange-800 border-orange-300'
                                                }`}
                                              >
                                                {injury.type}
                                              </Badge>
                                              <span className="font-medium">{injury.location}</span>
                                            </div>
                                            {injury.description && (
                                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                {injury.description}
                                              </p>
                                            )}
                                          </div>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-sm font-mono ml-4 px-2 py-1 ${
                                              injury.severity >= 7 ? 'border-red-500 text-red-700 bg-red-50' :
                                              injury.severity >= 4 ? 'border-orange-500 text-orange-700 bg-orange-50' :
                                              'border-yellow-500 text-yellow-700 bg-yellow-50'
                                            }`}
                                          >
                                            {injury.severity}/10
                                          </Badge>
                                        </div>
                                        
                                        {/* Barra de severidad visual */}
                                        <div className="flex items-center gap-3 mt-3">
                                          <span className="text-xs text-muted-foreground min-w-fit">Intensidad:</span>
                                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full transition-all ${
                                                injury.severity >= 7 ? 'bg-red-500' :
                                                injury.severity >= 4 ? 'bg-orange-500' :
                                                'bg-yellow-500'
                                              }`}
                                              style={{ width: (injury.severity * 10) + '%' }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    </div>
                                    
                                    {/* Resumen compacto */}
                                    <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">
                                          Total: {session.actual.injuries.length} {session.actual.injuries.length === 1 ? 'molestia' : 'molestias'}
                                        </span>
                                        <span className="text-muted-foreground">
                                          Severidad máxima: {Math.max(...session.actual.injuries.map(i => i.severity))}/10
                                        </span>
                                      </div>
                                      {session.actual.injuries.some(i => i.severity >= 7) && (
                                        <span className="text-red-600 font-medium flex items-center gap-1">
                                          ⚠️ Requiere atención médica
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}