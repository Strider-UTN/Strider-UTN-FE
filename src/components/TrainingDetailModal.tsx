import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  MapPin, 
  Clock, 
  Target, 
  Activity, 
  Heart, 
  Zap, 
  TrendingUp, 
  Thermometer,
  Eye,
  MessageCircle,
  Calendar,
  Route,
  Timer,
  Gauge,
  Mountain,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InjuryReport {
  bodyPart: string;
  severity: number;
  description: string;
  affectedPerformance: boolean;
  type: 'Molestia' | 'Dolor' | 'Lesión';
}

interface TrainingDetail {
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
  };
  conditions: {
    temperature: number;
    weather: string;
    surface: string;
  };
  splits: Array<{
    km: number;
    pace: string;
    hr: number;
    elevation: number;
  }>;
  hrZones: {
    zone1: number; // % tiempo en zona 1
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  route?: {
    startLocation: string;
    endLocation: string;
    routeType: string;
  };
  injuries?: InjuryReport[];
}

interface TrainingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: TrainingDetail;
}

export function TrainingDetailModal({
  isOpen,
  onClose,
  training
}: TrainingDetailModalProps) {
  const convertPaceToSeconds = (pace: string): number => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const formatPace = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getZoneColor = (zone: number): string => {
    switch (zone) {
      case 1: return 'bg-gray-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getZoneName = (zone: number): string => {
    switch (zone) {
      case 1: return 'Recuperación';
      case 2: return 'Aeróbico';
      case 3: return 'Tempo';
      case 4: return 'Umbral';
      case 5: return 'VO2 Max';
      default: return 'Zona';
    }
  };

  const getSeverityColor = (severity: number): string => {
    if (severity <= 3) return 'text-green-600 bg-green-50 border-green-200';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity <= 3) return 'Leve';
    if (severity <= 6) return 'Moderado';
    return 'Severo';
  };

  const getInjuryTypeColor = (type: string): string => {
    switch (type) {
      case 'Molestia': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Dolor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Lesión': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderSensationMeter = (value: number, label: string, color: string) => {
    return (
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
              strokeDasharray={`${(value / 10) * 175.929} 175.929`}
              className={color}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{value}</span>
          </div>
        </div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">de 10</p>
      </div>
    );
  };

  const fastestSplit = training.splits.reduce((fastest, split) => 
    convertPaceToSeconds(split.pace) < convertPaceToSeconds(fastest.pace) ? split : fastest
  );

  const slowestSplit = training.splits.reduce((slowest, split) => 
    convertPaceToSeconds(split.pace) > convertPaceToSeconds(slowest.pace) ? split : slowest
  );

  const hasInjuries = training.injuries && training.injuries.length > 0;
  const severeInjuries = training.injuries?.filter(injury => injury.severity > 6) || [];
  const performanceAffectedInjuries = training.injuries?.filter(injury => injury.affectedPerformance) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Detalles del Entrenamiento
            {hasInjuries && (
              <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 ml-2">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {training.injuries!.length} molestia{training.injuries!.length > 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(training.date), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
              <Badge variant="outline" className="text-xs">
                {training.type}
              </Badge>
              <span className="font-medium">{training.name}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Métricas principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alertas de lesiones si existen */}
            {severeInjuries.length > 0 && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    Atención Requerida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {severeInjuries.map((injury, index) => (
                      <div key={index} className="p-2 bg-white border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getInjuryTypeColor(injury.type)}>{injury.type}</Badge>
                          <Badge className={getSeverityColor(injury.severity)}>
                            {getSeverityLabel(injury.severity)} ({injury.severity}/10)
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-red-800">{injury.bodyPart}</p>
                        <p className="text-xs text-red-600">{injury.description}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-700 mt-3 font-medium">
                    Se recomienda evaluación médica para lesiones severas (7+/10)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Resumen general */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Resumen General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-blue-500 mr-2" />
                    </div>
                    <p className="text-2xl font-bold text-blue-500">{training.duration}</p>
                    <p className="text-xs text-muted-foreground">Minutos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-green-500 mr-2" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">{training.distance}</p>
                    <p className="text-xs text-muted-foreground">Kilómetros</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Timer className="w-5 h-5 text-purple-500 mr-2" />
                    </div>
                    <p className="text-2xl font-bold text-purple-500">{training.avgPace}</p>
                    <p className="text-xs text-muted-foreground">Ritmo/km</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Mountain className="w-5 h-5 text-orange-500 mr-2" />
                    </div>
                    <p className="text-2xl font-bold text-orange-500">{training.elevation}</p>
                    <p className="text-xs text-muted-foreground">Metros</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Frecuencia cardíaca y calorías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Frecuencia Cardíaca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-500">{training.maxHR}</p>
                      <p className="text-xs text-muted-foreground">FC Máxima</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-orange-500">{training.avgHR}</p>
                      <p className="text-xs text-muted-foreground">FC Promedio</p>
                    </div>
                  </div>
                  
                  {/* Zonas de FC */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Distribución por Zonas</h4>
                    {Object.entries(training.hrZones).map(([zone, percentage], index) => (
                      <div key={zone} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getZoneColor(index + 1)}`}></div>
                        <span className="text-xs flex-1">{getZoneName(index + 1)}</span>
                        <span className="text-xs font-medium">{percentage}%</span>
                        <div className="w-16">
                          <Progress value={percentage} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{training.calories}</p>
                    <p className="text-xs text-muted-foreground">Calorías Quemadas</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Split más rápido:</span>
                      <span className="font-medium">{fastestSplit.pace} (km {fastestSplit.km})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Split más lento:</span>
                      <span className="font-medium">{slowestSplit.pace} (km {slowestSplit.km})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Splits por kilómetro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Splits por Kilómetro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {training.splits.map((split, index) => {
                    const avgPaceSeconds = convertPaceToSeconds(training.avgPace);
                    const splitPaceSeconds = convertPaceToSeconds(split.pace);
                    const deviation = ((splitPaceSeconds - avgPaceSeconds) / avgPaceSeconds) * 100;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-12 justify-center">
                            KM {split.km}
                          </Badge>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Timer className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium">{split.pace}/km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span className="text-sm">{split.hr} bpm</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mountain className="w-3 h-3 text-orange-500" />
                              <span className="text-sm">{split.elevation}m</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {deviation > 5 ? (
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              +{deviation.toFixed(1)}%
                            </Badge>
                          ) : deviation < -5 ? (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              {deviation.toFixed(1)}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 border-gray-200">
                              {deviation.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Información adicional */}
          <div className="space-y-6">
            {/* Molestias y Lesiones */}
            {hasInjuries && (
              <Card className="border-2 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    Molestias y Lesiones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {training.injuries!.map((injury, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getInjuryTypeColor(injury.type)}>{injury.type}</Badge>
                        <Badge className={getSeverityColor(injury.severity)}>
                          {getSeverityLabel(injury.severity)}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-orange-800 mb-1">{injury.bodyPart}</h4>
                      <p className="text-sm text-orange-700 mb-2">{injury.description}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-orange-600">Intensidad: {injury.severity}/10</span>
                        {injury.affectedPerformance && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Activity className="w-3 h-3" />
                            <span>Afectó rendimiento</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {performanceAffectedInjuries.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Impacto:</strong> {performanceAffectedInjuries.length} molestia{performanceAffectedInjuries.length > 1 ? 's' : ''} afectó el rendimiento durante este entrenamiento.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Condiciones del entrenamiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Condiciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Temperatura:</span>
                  <span className="text-sm font-medium">{training.conditions.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Clima:</span>
                  <span className="text-sm font-medium">{training.conditions.weather}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Superficie:</span>
                  <span className="text-sm font-medium">{training.conditions.surface}</span>
                </div>
              </CardContent>
            </Card>

            {/* Ruta */}
            {training.route && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Ruta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Inicio:</span>
                    <span className="text-sm font-medium">{training.route.startLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fin:</span>
                    <span className="text-sm font-medium">{training.route.endLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="text-sm font-medium">{training.route.routeType}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sensaciones del atleta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Sensaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {renderSensationMeter(training.sensations.effort, 'Esfuerzo', 'text-blue-500')}
                  {renderSensationMeter(training.sensations.fatigue, 'Fatiga', 'text-orange-500')}
                  {renderSensationMeter(training.sensations.motivation, 'Motivación', 'text-green-500')}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Comentarios
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {training.comments}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Análisis rápido */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Análisis Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Consistencia:</strong> Ritmo muy estable durante todo el entrenamiento
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>FC:</strong> Entrenamiento principalmente en zona aeróbica
                  </p>
                </div>
                {hasInjuries ? (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Atención:</strong> Monitorear evolución de molestias reportadas
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Sugerencia:</strong> Considerar aumentar intensidad en próximas sesiones
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Exportar Datos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}