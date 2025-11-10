import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Target, 
  Clock, 
  Activity, 
  Heart, 
  Zap, 
  Route, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Timer,
  MapPin,
  Thermometer
} from 'lucide-react';

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
  warmUp?: {
    duration: number;
    description: string;
  };
  coolDown?: {
    duration: number;
    description: string;
  };
  objectives?: string[];
  notes?: string;
}

interface SessionActual {
  id: string;
  sessionId: string;
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  perceivedExertion: number;
  weather?: {
    temperature: number;
    condition: string;
  };
  route?: string;
  comments?: string;
  completed: boolean;
  injuries?: Array<{
    type: 'Molestia' | 'Dolor';
    location: string;
    severity: number;
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

interface SessionComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  sessionPlan: SessionPlan;
  sessionActual?: SessionActual;
  athleteName: string;
}

export function SessionComparisonView({
  isOpen,
  onClose,
  sessionPlan,
  sessionActual,
  athleteName
}: SessionComparisonViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}min`;
    }
    return `${mins}min`;
  };

  const calculateCompliance = (actual: number, planned: number) => {
    return (actual / planned) * 100;
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90 && compliance <= 110) return 'text-green-600';
    if (compliance >= 75 && compliance <= 125) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (compliance: number) => {
    if (compliance >= 90 && compliance <= 110) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (compliance >= 75 && compliance <= 125) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getIntensityZone = (heartRate?: number) => {
    if (!heartRate) return 'N/A';
    if (heartRate < 120) return 'Zona 1 - Recuperación';
    if (heartRate < 140) return 'Zona 2 - Aeróbico';
    if (heartRate < 160) return 'Zona 3 - Tempo';
    if (heartRate < 180) return 'Zona 4 - Umbral';
    return 'Zona 5 - VO₂ Max';
  };

  const distanceCompliance = sessionActual ? calculateCompliance(sessionActual.actualDistance, sessionPlan.plannedDistance) : 0;
  const durationCompliance = sessionActual ? calculateCompliance(sessionActual.actualDuration, sessionPlan.plannedDuration) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Comparación Detallada: {sessionPlan.name}
          </DialogTitle>
          <DialogDescription>
            {athleteName} • {formatDate(sessionPlan.date)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="intervals">Intervalos Detallados</TabsTrigger>
            <TabsTrigger value="analysis">Análisis Técnico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estado de la sesión */}
            <Card className={`border-l-4 ${sessionActual?.completed ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  {sessionActual?.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  Estado de la Sesión
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionActual?.completed ? (
                  <p className="text-green-700">Sesión completada exitosamente</p>
                ) : (
                  <p className="text-red-700">
                    {sessionActual ? 'Sesión incompleta o con dificultades' : 'Sesión no realizada'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comparación principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Planificado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Planificado</CardTitle>
                  <CardDescription>Objetivos y métricas programadas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Distancia</span>
                      </div>
                      <p className="text-xl font-medium">{sessionPlan.plannedDistance.toFixed(1)} km</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Duración</span>
                      </div>
                      <p className="text-xl font-medium">{formatTime(sessionPlan.plannedDuration)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Ritmo</span>
                      </div>
                      <p className="text-xl font-medium">{sessionPlan.plannedPace}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Intensidad</span>
                      </div>
                      <p className="text-xl font-medium">{sessionPlan.plannedIntensity}% VO₂</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge variant="outline" className="mb-2">{sessionPlan.type}</Badge>
                    {sessionPlan.objectives && sessionPlan.objectives.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Objetivos:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {sessionPlan.objectives.map((objective, idx) => (
                            <li key={idx}>• {objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Realizado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-accent">Realizado</CardTitle>
                  <CardDescription>Métricas y datos reales de la sesión</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionActual ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Distancia</span>
                            {getComplianceIcon(distanceCompliance)}
                          </div>
                          <p className={`text-xl font-medium ${getComplianceColor(distanceCompliance)}`}>
                            {sessionActual.actualDistance.toFixed(1)} km
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {distanceCompliance.toFixed(0)}% del objetivo
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Duración</span>
                            {getComplianceIcon(durationCompliance)}
                          </div>
                          <p className={`text-xl font-medium ${getComplianceColor(durationCompliance)}`}>
                            {formatTime(sessionActual.actualDuration)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {durationCompliance.toFixed(0)}% del objetivo
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Ritmo</span>
                          </div>
                          <p className="text-xl font-medium">{sessionActual.actualPace}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">FC Promedio</span>
                          </div>
                          <p className="text-xl font-medium">
                            {sessionActual.avgHeartRate ? `${sessionActual.avgHeartRate} bpm` : 'N/A'}
                          </p>
                          {sessionActual.avgHeartRate && (
                            <p className="text-xs text-muted-foreground">
                              {getIntensityZone(sessionActual.avgHeartRate)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Esfuerzo Percibido (RPE)</span>
                          <span className="font-medium">{sessionActual.perceivedExertion}/10</span>
                        </div>
                        <Progress value={sessionActual.perceivedExertion * 10} className="h-2" />

                        {sessionActual.weather && (
                          <div className="flex items-center gap-2 text-sm">
                            <Thermometer className="w-4 h-4" />
                            <span>{sessionActual.weather.temperature}°C - {sessionActual.weather.condition}</span>
                          </div>
                        )}

                        {sessionActual.route && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{sessionActual.route}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">Esta sesión no fue realizada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comentarios y observaciones */}
            {sessionActual?.comments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comentarios del Atleta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{sessionActual.comments}</p>
                </CardContent>
              </Card>
            )}

            {/* Molestias/Dolores */}
            {sessionActual?.injuries && sessionActual.injuries.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Molestias/Dolores Reportados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sessionActual.injuries.map((injury, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span>{injury.type} en {injury.location}</span>
                        <Badge variant="destructive">Severidad: {injury.severity}/5</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notas del entrenador */}
            {sessionPlan.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas del Entrenador</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{sessionPlan.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="intervals" className="space-y-4">
            {sessionPlan.intervals.length > 0 ? (
              <div className="space-y-4">
                <h3>Comparación de Intervalos</h3>
                
                {sessionPlan.intervals.map((plannedInterval, idx) => {
                  const actualInterval = sessionActual?.intervals?.find(
                    (interval) => interval.intervalNumber === idx + 1
                  );

                  return (
                    <Card key={idx} className="border-l-4 border-l-accent">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Intervalo {idx + 1} - {plannedInterval.type === 'work' ? 'Trabajo' : 'Recuperación'}
                        </CardTitle>
                        <CardDescription>{plannedInterval.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Planificado */}
                          <div>
                            <h5 className="font-medium text-primary mb-2">Planificado</h5>
                            <div className="space-y-2 text-sm">
                              {plannedInterval.distance && (
                                <div className="flex justify-between">
                                  <span>Distancia:</span>
                                  <span>{plannedInterval.distance.toFixed(1)} km</span>
                                </div>
                              )}
                              {plannedInterval.duration && (
                                <div className="flex justify-between">
                                  <span>Duración:</span>
                                  <span>{formatTime(plannedInterval.duration)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Intensidad:</span>
                                <span>{plannedInterval.intensity}% VO₂</span>
                              </div>
                            </div>
                          </div>

                          {/* Realizado */}
                          <div>
                            <h5 className="font-medium text-accent mb-2">Realizado</h5>
                            {actualInterval ? (
                              <div className="space-y-2 text-sm">
                                {actualInterval.actualDistance && (
                                  <div className="flex justify-between">
                                    <span>Distancia:</span>
                                    <span>{actualInterval.actualDistance.toFixed(1)} km</span>
                                  </div>
                                )}
                                {actualInterval.actualDuration && (
                                  <div className="flex justify-between">
                                    <span>Duración:</span>
                                    <span>{formatTime(actualInterval.actualDuration)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Ritmo:</span>
                                  <span>{actualInterval.actualPace}</span>
                                </div>
                                {actualInterval.avgHeartRate && (
                                  <div className="flex justify-between">
                                    <span>FC Promedio:</span>
                                    <span>{actualInterval.avgHeartRate} bpm</span>
                                  </div>
                                )}
                                {actualInterval.perceivedExertion && (
                                  <div className="flex justify-between">
                                    <span>RPE:</span>
                                    <span>{actualInterval.perceivedExertion}/10</span>
                                  </div>
                                )}
                                {actualInterval.comments && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded">
                                    <p className="text-xs">{actualInterval.comments}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No realizado</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Esta sesión no incluye intervalos específicos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Análisis de cumplimiento */}
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Cumplimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionActual ? (
                    <>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Distancia</span>
                            <span className="text-sm font-medium">{distanceCompliance.toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(distanceCompliance, 150)} />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Duración</span>
                            <span className="text-sm font-medium">{durationCompliance.toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(durationCompliance, 150)} />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Esfuerzo Percibido</span>
                            <span className="text-sm font-medium">{sessionActual.perceivedExertion}/10</span>
                          </div>
                          <Progress value={sessionActual.perceivedExertion * 10} />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h5 className="font-medium mb-2">Evaluación General</h5>
                        {distanceCompliance >= 90 && durationCompliance >= 90 ? (
                          <p className="text-green-700 text-sm">✓ Sesión completada según planificación</p>
                        ) : distanceCompliance >= 75 && durationCompliance >= 75 ? (
                          <p className="text-yellow-700 text-sm">⚠ Sesión parcialmente completada</p>
                        ) : (
                          <p className="text-red-700 text-sm">✗ Sesión significativamente modificada</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No hay datos para analizar</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionActual ? (
                    <div className="space-y-3 text-sm">
                      {sessionActual.perceivedExertion >= 8 && (
                        <div className="p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded">
                          <p className="text-yellow-800">
                            ⚠ RPE alto ({sessionActual.perceivedExertion}/10). Considerar recuperación adicional.
                          </p>
                        </div>
                      )}
                      
                      {distanceCompliance < 80 && (
                        <div className="p-2 bg-red-50 border-l-2 border-red-400 rounded">
                          <p className="text-red-800">
                            ⚠ Volumen significativamente menor al planificado. Revisar causas.
                          </p>
                        </div>
                      )}

                      {sessionActual.injuries && sessionActual.injuries.length > 0 && (
                        <div className="p-2 bg-red-50 border-l-2 border-red-400 rounded">
                          <p className="text-red-800">
                            ⚠ Molestias reportadas. Seguimiento médico recomendado.
                          </p>
                        </div>
                      )}

                      {distanceCompliance >= 90 && durationCompliance >= 90 && sessionActual.perceivedExertion <= 6 && (
                        <div className="p-2 bg-green-50 border-l-2 border-green-400 rounded">
                          <p className="text-green-800">
                            ✓ Excelente ejecución. Atleta listo para progresión.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="p-2 bg-red-50 border-l-2 border-red-400 rounded">
                        <p className="text-red-800">
                          ⚠ Sesión no realizada. Investigar causas y ajustar planificación.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}