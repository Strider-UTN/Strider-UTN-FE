import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Activity,
  User,
  Users,
  Eye,
  Zap,
  Heart,
  Timer,
  Route,
  XCircle,
  Minus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface PlannedSession {
  id: string;
  name: string;
  date: string;
  type: 'Intervalos' | 'Fondo' | 'Tempo' | 'Recuperación' | 'Test';
  plannedDistance: number; // km
  plannedDuration: number; // minutos
  plannedPace: string; // min:seg/km
  plannedIntensity: number; // 1-10
  intervals: any[];
  notes?: string;
}

interface ActualSession {
  id: string;
  sessionId: string;
  actualDistance: number; // km
  actualDuration: number; // minutos
  actualPace: string; // min:seg/km
  perceivedExertion: number; // 1-10 RPE
  heartRate?: {
    avg: number;
    max: number;
  };
  splits: Array<{
    km: number;
    time: string;
    pace: string;
  }>;
  notes?: string;
  completed: boolean;
  completedAt: string;
}

interface SessionComparison {
  plan: PlannedSession;
  actual: ActualSession | null;
}

interface MicrocycleFeedbackProps {
  weekNumber: number;
  startDate: string;
  endDate: string;
  athlete: {
    id: string;
    name: string;
    vo2max: number;
  };
  sessions: SessionComparison[];
  onSessionDetail: (planned: PlannedSession, actual?: ActualSession) => void;
}

export function MicrocycleFeedback({ 
  weekNumber, 
  startDate, 
  endDate, 
  athlete, 
  sessions = [], // Valor por defecto para evitar undefined
  onSessionDetail 
}: MicrocycleFeedbackProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Validar que sessions sea un array válido
  const validSessions = Array.isArray(sessions) ? sessions : [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0m';
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

  const parseTime = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const [min, sec] = parts.map(Number);
    return (min || 0) * 60 + (sec || 0);
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

  // Calcular estadísticas del microciclo con validaciones
  const weekStats = {
    totalPlanned: validSessions.reduce((sum, s) => sum + (s?.plan?.plannedDistance || 0), 0),
    totalActual: validSessions.reduce((sum, s) => sum + (s?.actual?.actualDistance || 0), 0),
    completedSessions: validSessions.filter(s => s?.actual?.completed).length,
    totalSessions: validSessions.length,
    avgRPE: (() => {
      const completedSessions = validSessions.filter(s => s?.actual?.completed);
      if (completedSessions.length === 0) return 0;
      const totalRPE = completedSessions.reduce((sum, s) => sum + (s?.actual?.perceivedExertion || 0), 0);
      return totalRPE / completedSessions.length;
    })()
  };

  const weekCompliance = getCompliancePercentage(weekStats.totalPlanned, weekStats.totalActual);

  // Si no hay atleta, mostrar estado de error
  if (!athlete) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-medium text-destructive mb-2">Error de Datos</h3>
          <p className="text-muted-foreground">No se pudo cargar la información del atleta.</p>
        </CardContent>
      </Card>
    );
  }

  // Si no hay sesiones, mostrar estado vacío
  if (validSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Semana {weekNumber} - {athlete.name}
          </CardTitle>
          <CardDescription>
            {formatDate(startDate)} - {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No hay sesiones programadas</h3>
          <p className="text-muted-foreground">
            Esta semana no tiene sesiones de entrenamiento asignadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del microciclo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Semana {weekNumber} - {athlete.name}
              </CardTitle>
              <CardDescription>
                {formatDate(startDate)} - {formatDate(endDate)}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              VO₂ Max: {athlete.vo2max || 'N/A'} ml/kg/min
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas generales de la semana */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className={`text-2xl font-bold ${getComplianceColor(weekCompliance)}`}>
                {weekCompliance >= 90 ? 'Excelente' : weekCompliance >= 75 ? 'Bueno' : 'Mejorable'}
              </div>
              <div className="text-sm text-muted-foreground">Evaluación General</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de sesiones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comparación Sesión por Sesión</h3>
        
        {validSessions.map((session) => {
          if (!session?.plan) return null;
          
          return (
            <Card key={session.plan.id} className="border-l-4 border-l-accent">
              <CardContent className="p-0">
                <Collapsible>
                  <CollapsibleTrigger 
                    className="w-full p-6 hover:bg-muted/30 transition-colors"
                    onClick={() => toggleSessionExpansion(session.plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSessionStatusIcon(session.plan, session.actual)}
                        <div className="text-left">
                          <p className="font-medium">{session.plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.plan.date)} • {session.plan.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {session.actual ? (
                          <>
                            {/* Distancia */}
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Distancia</div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">
                                  {session.actual.actualDistance.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">/ {session.plan.plannedDistance.toFixed(1)} km</span>
                                {getVariationIndicator(session.plan.plannedDistance, session.actual.actualDistance)}
                              </div>
                              <Progress 
                                value={getCompliancePercentage(session.plan.plannedDistance, session.actual.actualDistance)} 
                                className="mt-1 h-1 w-20" 
                              />
                            </div>

                            {/* Ritmo */}
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Ritmo</div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{session.actual.actualPace}</span>
                                <span className="text-muted-foreground">vs {session.plan.plannedPace}</span>
                                {getVariationIndicator(
                                  parseTime(session.plan.plannedPace), 
                                  parseTime(session.actual.actualPace)
                                )}
                              </div>
                            </div>

                            {/* Intensidad/RPE */}
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Intensidad</div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{session.actual.perceivedExertion}</span>
                                <span className="text-muted-foreground">/ {session.plan.plannedIntensity}</span>
                                {getVariationIndicator(session.plan.plannedIntensity, session.actual.perceivedExertion)}
                              </div>
                              <div className="text-xs text-muted-foreground">RPE</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <div className="text-sm font-medium text-red-600">Sesión no realizada</div>
                            <div className="text-xs text-muted-foreground">
                              Planificada: {session.plan.plannedDistance.toFixed(1)} km • {session.plan.plannedPace}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSessionDetail?.(session.plan, session.actual || undefined);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Analizar
                          </Button>
                          
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform ${
                              expandedSessions.has(session.plan.id) ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t bg-muted/20">
                      <div className="pt-4 space-y-4">
                        {/* Comparación detallada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Plan original */}
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
                                <div className="mt-3 p-2 bg-background rounded text-xs">
                                  <span className="text-muted-foreground">Notas: </span>
                                  {session.plan.notes}
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
                                  <span className={`font-medium ${
                                    Math.abs(session.actual.perceivedExertion - session.plan.plannedIntensity) <= 1
                                      ? 'text-green-600' : 'text-yellow-600'
                                  }`}>
                                    {session.actual.perceivedExertion}/10
                                  </span>
                                </div>
                                {session.actual.heartRate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">FC promedio:</span>
                                    <span className="font-medium">{session.actual.heartRate.avg} bpm</span>
                                  </div>
                                )}
                                {session.actual.notes && (
                                  <div className="mt-3 p-2 bg-background rounded text-xs">
                                    <span className="text-muted-foreground">Notas del atleta: </span>
                                    {session.actual.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                                <p className="font-medium">Sesión no completada</p>
                                <p className="text-sm">El atleta no registró esta sesión</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Análisis de cumplimiento */}
                        {session.actual && (
                          <div className="mt-4 p-4 bg-background rounded-lg">
                            <h5 className="font-medium mb-3 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Análisis de Cumplimiento
                            </h5>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className={`text-lg font-bold ${getComplianceColor(
                                  getCompliancePercentage(session.plan.plannedDistance, session.actual.actualDistance)
                                )}`}>
                                  {getCompliancePercentage(session.plan.plannedDistance, session.actual.actualDistance).toFixed(0)}%
                                </div>
                                <div className="text-muted-foreground">Cumplimiento de Distancia</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${
                                  Math.abs(session.actual.perceivedExertion - session.plan.plannedIntensity) <= 1
                                    ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {Math.abs(session.actual.perceivedExertion - session.plan.plannedIntensity) <= 1 ? 'Correcto' : 'Desviado'}
                                </div>
                                <div className="text-muted-foreground">Intensidad</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${
                                  Math.abs(parseTime(session.actual.actualPace) - parseTime(session.plan.plannedPace)) <= 30
                                    ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {Math.abs(parseTime(session.actual.actualPace) - parseTime(session.plan.plannedPace)) <= 30 ? 'Preciso' : 'Desviado'}
                                </div>
                                <div className="text-muted-foreground">Ritmo</div>
                              </div>
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