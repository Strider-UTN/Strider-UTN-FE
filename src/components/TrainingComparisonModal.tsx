import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Target, Activity, Clock, Zap, Heart, TrendingUp, TrendingDown, Minus, MessageCircle, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlannedSession {
  id: string;
  date: string;
  name: string;
  type: string;
  plannedDuration: number;
  plannedDistance: number;
  plannedPace: string;
  targetHR: string;
  intervals?: Array<{
    type: 'work' | 'rest';
    duration: number;
    pace: string;
    intensity: string;
    distance?: number;
  }>;
}

interface CompletedTraining {
  id: string;
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
  };
}

interface TrainingComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedSession: PlannedSession;
  completedTraining: CompletedTraining;
}

export function TrainingComparisonModal({
  isOpen,
  onClose,
  plannedSession,
  completedTraining
}: TrainingComparisonModalProps) {
  // Convertir pace strings a segundos para comparación
  const convertPaceToSeconds = (pace: string): number => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const plannedPaceSeconds = convertPaceToSeconds(plannedSession.plannedPace);
  const actualPaceSeconds = convertPaceToSeconds(completedTraining.avgPace);

  // Calcular desviaciones
  const durationDeviation = ((completedTraining.duration - plannedSession.plannedDuration) / plannedSession.plannedDuration) * 100;
  const distanceDeviation = ((completedTraining.distance - plannedSession.plannedDistance) / plannedSession.plannedDistance) * 100;
  const paceDeviation = ((actualPaceSeconds - plannedPaceSeconds) / plannedPaceSeconds) * 100;

  // Calcular score de cumplimiento
  const complianceScore = (
    Math.max(0, 100 - Math.abs(durationDeviation)) * 0.3 +
    Math.max(0, 100 - Math.abs(distanceDeviation)) * 0.4 +
    Math.max(0, 100 - Math.abs(paceDeviation)) * 0.3
  );

  const formatDeviation = (deviation: number): string => {
    const sign = deviation > 0 ? '+' : '';
    return `${sign}${deviation.toFixed(1)}%`;
  };

  const getDeviationColor = (deviation: number): string => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation <= 5) return 'bg-green-100 text-green-800 border-green-200';
    if (absDeviation <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getDeviationIcon = (deviation: number) => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation <= 5) return <Target className="w-3 h-3 text-green-600" />;
    if (deviation > 0) return <TrendingUp className="w-3 h-3 text-red-600" />;
    if (deviation < 0) return <TrendingDown className="w-3 h-3 text-blue-600" />;
    return <Minus className="w-3 h-3 text-gray-600" />;
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressValue = (planned: number, actual: number): number => {
    return Math.min(100, (actual / planned) * 100);
  };

  const getCompletionPercentage = (planned: number, actual: number): number => {
    return Math.round((actual / planned) * 100);
  };

  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 95 && percentage <= 105) return 'text-green-600';
    if (percentage >= 85 && percentage <= 115) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionColorRaw = (percentage: number): string => {
    if (percentage >= 95 && percentage <= 105) return 'stroke-green-500';
    if (percentage >= 85 && percentage <= 115) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const renderCompletionCircle = (percentage: number, label: string, value: string, target: string) => {
    const normalizedPercentage = Math.min(100, percentage);
    const circumference = 2 * Math.PI * 45; // radio 45
    const strokeDasharray = `${(normalizedPercentage / 100) * circumference} ${circumference}`;
    
    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="relative w-24 h-24">
          {/* Círculo de fondo */}
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted-foreground/20"
            />
            {/* Círculo de progreso */}
            <circle
              cx="50" cy="50" r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className={getCompletionColorRaw(percentage)}
            />
            {/* Línea de referencia en 100% */}
            {percentage !== 100 && (
              <line
                x1="50" y1="5" x2="50" y2="15"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/40"
              />
            )}
          </svg>
          {/* Porcentaje en el centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${getCompletionColor(percentage)}`}>
              {percentage}%
            </span>
            <span className="text-xs text-muted-foreground">
              {percentage >= 100 ? 'Superado' : 'Cumplido'}
            </span>
          </div>
        </div>
        
        {/* Información adicional */}
        <div className="text-center space-y-1">
          <p className="font-medium text-sm">{label}</p>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Objetivo:</span>
              <span className="font-medium">{target}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Real:</span>
              <span className={`font-medium ${getCompletionColor(percentage)}`}>
                {value}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Comparación: Planificado vs Realizado
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(plannedSession.date), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
              <Badge variant="outline" className="text-xs">
                {plannedSession.type}
              </Badge>
              <span className="font-medium">{plannedSession.name}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Comparación de métricas principales con gráficos circulares */}
          <Card className="border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Cumplimiento de Objetivos
              </CardTitle>
              <CardDescription>
                Porcentaje de cumplimiento de cada métrica planificada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Duración con gráfico circular */}
                {renderCompletionCircle(
                  getCompletionPercentage(plannedSession.plannedDuration, completedTraining.duration),
                  'Duración',
                  `${completedTraining.duration} min`,
                  `${plannedSession.plannedDuration} min`
                )}

                {/* Distancia con gráfico circular */}
                {renderCompletionCircle(
                  getCompletionPercentage(plannedSession.plannedDistance, completedTraining.distance),
                  'Distancia',
                  `${completedTraining.distance / 1000} km`,
                  `${plannedSession.plannedDistance} km`
                )}

                {/* Ritmo - especial porque menor es mejor */}
                {renderCompletionCircle(
                  Math.round((plannedPaceSeconds / actualPaceSeconds) * 100),
                  'Eficiencia de Ritmo',
                  `${completedTraining.avgPace}/km`,
                  `${plannedSession.plannedPace}/km`
                )}
              </div>
              
              {/* Explicación del sistema de colores */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Guía de Colores de Cumplimiento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span><strong>Verde:</strong> 95-105% (Excelente)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span><strong>Amarillo:</strong> 85-115% (Aceptable)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span><strong>Rojo:</strong> &lt;85% o &gt;115% (Revisar)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles adicionales con barras de progreso mejoradas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Análisis Detallado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Duración detallada */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Duración</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDeviationIcon(durationDeviation)}
                      <Badge className={`text-xs ${getDeviationColor(durationDeviation)}`}>
                        {formatDeviation(durationDeviation)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Objetivo:</span>
                      <span className="font-medium">{plannedSession.plannedDuration} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Realizado:</span>
                      <span className={`font-medium ${getCompletionColor(getCompletionPercentage(plannedSession.plannedDuration, completedTraining.duration))}`}>
                        {completedTraining.duration} min
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={getProgressValue(plannedSession.plannedDuration, completedTraining.duration)} 
                        className="h-3"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {getCompletionPercentage(plannedSession.plannedDuration, completedTraining.duration)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distancia detallada */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Distancia</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDeviationIcon(distanceDeviation)}
                      <Badge className={`text-xs ${getDeviationColor(distanceDeviation)}`}>
                        {formatDeviation(distanceDeviation)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Objetivo:</span>
                      <span className="font-medium">{plannedSession.plannedDistance} km</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Realizado:</span>
                      <span className={`font-medium ${getCompletionColor(getCompletionPercentage(plannedSession.plannedDistance, completedTraining.distance))}`}>
                        {completedTraining.distance} km
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={getProgressValue(plannedSession.plannedDistance, completedTraining.distance)} 
                        className="h-3"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {getCompletionPercentage(plannedSession.plannedDistance, completedTraining.distance)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ritmo detallado */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Ritmo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDeviationIcon(paceDeviation)}
                      <Badge className={`text-xs ${getDeviationColor(paceDeviation)}`}>
                        {formatDeviation(paceDeviation)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Objetivo:</span>
                      <span className="font-medium">{plannedSession.plannedPace}/km</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Realizado:</span>
                      <span className="font-medium">{completedTraining.avgPace}/km</span>
                    </div>
                    <div className="text-center text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {paceDeviation > 0 ? 'Más lento que lo planeado' : 
                       paceDeviation < 0 ? 'Más rápido que lo planeado' : 'Ritmo exacto'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos adicionales del entrenamiento realizado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Frecuencia Cardíaca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{completedTraining.maxHR}</p>
                    <p className="text-xs text-muted-foreground">FC Máxima</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{completedTraining.avgHR}</p>
                    <p className="text-xs text-muted-foreground">FC Promedio</p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Objetivo: {plannedSession.targetHR}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Datos Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-500">{completedTraining.calories}</p>
                    <p className="text-xs text-muted-foreground">Calorías</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{completedTraining.elevation}m</p>
                    <p className="text-xs text-muted-foreground">Elevación</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sensaciones del atleta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Sensaciones del Atleta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(completedTraining.sensations.effort / 10) * 175.929} 175.929`}
                        className="text-blue-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{completedTraining.sensations.effort}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">Esfuerzo</p>
                  <p className="text-xs text-muted-foreground">de 10</p>
                </div>

                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(completedTraining.sensations.fatigue / 10) * 175.929} 175.929`}
                        className="text-orange-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{completedTraining.sensations.fatigue}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">Fatiga</p>
                  <p className="text-xs text-muted-foreground">de 10</p>
                </div>

                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(completedTraining.sensations.motivation / 10) * 175.929} 175.929`}
                        className="text-green-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{completedTraining.sensations.motivation}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">Motivación</p>
                  <p className="text-xs text-muted-foreground">de 10</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comentarios del Atleta
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {completedTraining.comments}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intervalos planificados vs realizados */}
          {plannedSession.intervals && plannedSession.intervals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estructura de Intervalos Planificada</CardTitle>
                <CardDescription>
                  Comparación de la estructura planificada vs el entrenamiento continuo realizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plannedSession.intervals.map((interval, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={interval.type === 'work' ? 'default' : 'secondary'}>
                          {interval.type === 'work' ? 'Trabajo' : 'Descanso'}
                        </Badge>
                        <span className="text-sm">
                          {interval.duration} min • {interval.pace} • {interval.intensity}
                        </span>
                      </div>
                      {interval.distance && (
                        <span className="text-sm text-muted-foreground">
                          {interval.distance} km
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> El atleta realizó un entrenamiento continuo en lugar de la estructura de intervalos planificada.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumen de cumplimiento mejorado */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Resumen de Cumplimiento General
              </CardTitle>
              <CardDescription>
                Análisis integral del cumplimiento de la sesión de entrenamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                {/* Score principal con gráfico circular grande */}
                <div className="relative">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60" cy="60" r="54"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="60" cy="60" r="54"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(complianceScore / 100) * 339.292} 339.292`}
                        strokeLinecap="round"
                        className={getCompletionColorRaw(complianceScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getComplianceColor(complianceScore)}`}>
                        {Math.round(complianceScore)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Cumplimiento
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas detalladas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  <div className="text-center p-4 bg-background/50 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-muted-foreground mr-2" />
                      <span className="font-medium">Duración</span>
                    </div>
                    <div className={`text-2xl font-bold ${getCompletionColor(getCompletionPercentage(plannedSession.plannedDuration, completedTraining.duration))}`}>
                      {getCompletionPercentage(plannedSession.plannedDuration, completedTraining.duration)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDeviation(durationDeviation)} desviación
                    </div>
                  </div>

                  <div className="text-center p-4 bg-background/50 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-muted-foreground mr-2" />
                      <span className="font-medium">Distancia</span>
                    </div>
                    <div className={`text-2xl font-bold ${getCompletionColor(getCompletionPercentage(plannedSession.plannedDistance, completedTraining.distance))}`}>
                      {getCompletionPercentage(plannedSession.plannedDistance, completedTraining.distance)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDeviation(distanceDeviation)} desviación
                    </div>
                  </div>

                  <div className="text-center p-4 bg-background/50 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="w-5 h-5 text-muted-foreground mr-2" />
                      <span className="font-medium">Eficiencia</span>
                    </div>
                    <div className={`text-2xl font-bold ${getCompletionColor(Math.round((plannedPaceSeconds / actualPaceSeconds) * 100))}`}>
                      {Math.round((plannedPaceSeconds / actualPaceSeconds) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDeviation(paceDeviation)} en ritmo
                    </div>
                  </div>
                </div>

                {/* Interpretación del resultado */}
                <div className={`w-full p-4 rounded-lg border-2 ${
                  complianceScore >= 90 ? 'bg-green-50 border-green-200' :
                  complianceScore >= 70 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="text-center">
                    <h4 className={`font-semibold mb-2 ${
                      complianceScore >= 90 ? 'text-green-800' :
                      complianceScore >= 70 ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {complianceScore >= 90 ? '✅ Excelente Cumplimiento' :
                       complianceScore >= 70 ? '⚠️ Cumplimiento Aceptable' :
                       '❌ Requiere Revisión'}
                    </h4>
                    <p className={`text-sm ${
                      complianceScore >= 90 ? 'text-green-700' :
                      complianceScore >= 70 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {complianceScore >= 90 ? 
                        'El atleta cumplió excelentemente con la planificación. Continuar con este enfoque.' :
                       complianceScore >= 70 ? 
                        'El cumplimiento fue aceptable pero hay áreas de mejora. Revisar aspectos específicos.' :
                        'El cumplimiento fue bajo. Es necesario analizar las causas y ajustar la planificación.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              Generar Reporte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}