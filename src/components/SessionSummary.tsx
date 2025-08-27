import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Clock, MapPin, Users, Target, Zap, Activity, Play, Pause, RotateCcw, TrendingUp } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface TrainingInterval {
  id: string;
  type: 'work' | 'rest';
  paceType: 'fixed' | 'vo2max_percentage';
  pace?: number;
  vo2maxPercentage?: number;
  durationType: 'time' | 'distance';
  duration: number;
  description?: string;
  repetitions?: number;
}

interface SessionData {
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  date: string;
  athletes: string[];
  intervals: TrainingInterval[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
}

interface SessionSummaryProps {
  session: SessionData;
  athletes: Athlete[];
}

export function SessionSummary({ session, athletes }: SessionSummaryProps) {
  const categoryLabels = {
    'training': 'Entrenamiento',
    'prep_competition': 'Competencia Preparatoria',
    'main_competition': 'Competencia Principal'
  };

  const categoryColors = {
    'training': 'bg-blue-100 text-blue-800',
    'prep_competition': 'bg-orange-100 text-orange-800',
    'main_competition': 'bg-red-100 text-red-800'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPace = (pace: number) => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fórmula mejorada para calcular el ritmo basado en VO2 Max
  const calculatePaceFromVO2Max = (vo2max: number, percentage: number): number => {
    // Fórmula de Jack Daniels para calcular velocidad basada en VO2 Max
    const vVO2max = (vo2max * 15.3) / 3.5; // m/min
    const velocityAtPercentage = vVO2max * (percentage / 100);
    const velocityInKmH = (velocityAtPercentage * 60) / 1000; // km/h
    const paceInMinPerKm = 60 / velocityInKmH; // min/km
    
    return Math.max(paceInMinPerKm, 3.0); // No menos de 3:00/km
  };

  // Calcular estadísticas de la sesión con repeticiones
  const calculateSessionStats = () => {
    let totalDistance = 0;
    let totalDuration = 0;
    let workTime = 0;
    let restTime = 0;
    let totalRepetitions = 0;
    let highIntensityTime = 0;
    let mediumIntensityTime = 0;
    let lowIntensityTime = 0;
    let totalWorkIntervals = 0;
    let totalRestIntervals = 0;

    const avgVO2Max = athletes.length > 0 ? 
      athletes.reduce((sum, athlete) => sum + (athlete.vo2max || 45), 0) / athletes.length : 45;

    session.intervals.forEach(interval => {
      const repetitions = interval.repetitions || 1;
      totalRepetitions += repetitions;

      if (interval.type === 'work') {
        totalWorkIntervals += repetitions;
        
        // Calcular duración por repetición
        let singleDuration = 0;
        if (interval.durationType === 'time') {
          singleDuration = interval.duration;
        } else {
          // Estimar duración basada en ritmo
          let estimatedPace = 5.5;
          if (interval.pace) {
            estimatedPace = interval.pace;
          } else if (interval.vo2maxPercentage) {
            estimatedPace = calculatePaceFromVO2Max(avgVO2Max, interval.vo2maxPercentage);
          }
          singleDuration = interval.duration * estimatedPace;
        }
        
        // Calcular distancia por repetición
        let singleDistance = 0;
        if (interval.durationType === 'distance') {
          singleDistance = interval.duration;
        } else {
          // Estimar distancia basada en ritmo
          let estimatedPace = 5.5;
          if (interval.pace) {
            estimatedPace = interval.pace;
          } else if (interval.vo2maxPercentage) {
            estimatedPace = calculatePaceFromVO2Max(avgVO2Max, interval.vo2maxPercentage);
          }
          singleDistance = interval.duration / estimatedPace;
        }
        
        const totalIntervalDuration = singleDuration * repetitions;
        const totalIntervalDistance = singleDistance * repetitions;
        
        totalDistance += totalIntervalDistance;
        totalDuration += totalIntervalDuration;
        workTime += totalIntervalDuration;
        
        // Clasificar intensidad
        if (interval.paceType === 'vo2max_percentage' && interval.vo2maxPercentage) {
          if (interval.vo2maxPercentage >= 85) {
            highIntensityTime += totalIntervalDuration;
          } else if (interval.vo2maxPercentage >= 70) {
            mediumIntensityTime += totalIntervalDuration;
          } else {
            lowIntensityTime += totalIntervalDuration;
          }
        } else if (interval.pace) {
          if (interval.pace <= 4.0) {
            highIntensityTime += totalIntervalDuration;
          } else if (interval.pace <= 5.0) {
            mediumIntensityTime += totalIntervalDuration;
          } else {
            lowIntensityTime += totalIntervalDuration;
          }
        } else {
          mediumIntensityTime += totalIntervalDuration;
        }
      } else {
        totalRestIntervals += repetitions;
        
        if (interval.durationType === 'time') {
          const totalRestDuration = interval.duration * repetitions;
          totalDuration += totalRestDuration;
          restTime += totalRestDuration;
        }
      }
    });

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration: Math.round(totalDuration),
      workTime: Math.round(workTime),
      restTime: Math.round(restTime),
      totalWorkIntervals,
      totalRestIntervals,
      totalRepetitions,
      intensityDistribution: {
        high: Math.round((highIntensityTime / (workTime || 1)) * 100),
        medium: Math.round((mediumIntensityTime / (workTime || 1)) * 100),
        low: Math.round((lowIntensityTime / (workTime || 1)) * 100)
      },
      workRestRatio: workTime > 0 ? Math.round((workTime / (restTime || 1)) * 10) / 10 : 0
    };
  };

  // Calcular ritmos personalizados por atleta para intervalos con % VO2 Max
  const calculatePersonalizedPaces = () => {
    return athletes.map(athlete => {
      const personalizedIntervals = session.intervals
        .filter(interval => interval.type === 'work' && interval.paceType === 'vo2max_percentage')
        .map(interval => {
          if (!athlete.vo2max || !interval.vo2maxPercentage) return null;
          
          const estimatedPace = calculatePaceFromVO2Max(athlete.vo2max, interval.vo2maxPercentage);
          
          return {
            interval,
            estimatedPace: Math.round(estimatedPace * 10) / 10
          };
        })
        .filter(Boolean);

      return {
        athlete,
        personalizedIntervals
      };
    });
  };

  // Calcular carga de entrenamiento (Training Load)
  const calculateTrainingLoad = () => {
    if (athletes.length === 0) return 0;
    
    const avgVO2Max = athletes.reduce((sum, athlete) => sum + (athlete.vo2max || 45), 0) / athletes.length;
    
    return session.intervals.reduce((load, interval) => {
      if (interval.type !== 'work') return load;
      
      const repetitions = interval.repetitions || 1;
      let duration = 0;
      
      if (interval.durationType === 'time') {
        duration = interval.duration * repetitions;
      } else {
        // Estimar duración para intervalos de distancia
        let estimatedPace = 5.5;
        if (interval.pace) {
          estimatedPace = interval.pace;
        } else if (interval.vo2maxPercentage) {
          estimatedPace = calculatePaceFromVO2Max(avgVO2Max, interval.vo2maxPercentage);
        }
        duration = (interval.duration * estimatedPace) * repetitions;
      }
      
      // Factor de intensidad basado en el tipo de ritmo
      let intensityFactor = 1;
      if (interval.paceType === 'vo2max_percentage' && interval.vo2maxPercentage) {
        intensityFactor = interval.vo2maxPercentage / 100;
      } else if (interval.pace) {
        // Cuanto más rápido el ritmo, mayor la intensidad
        intensityFactor = Math.max(0.5, 6.0 / interval.pace);
      }
      
      return load + (duration * intensityFactor);
    }, 0);
  };

  const sessionStats = calculateSessionStats();
  const personalizedPaces = calculatePersonalizedPaces();
  const trainingLoad = Math.round(calculateTrainingLoad());

  if (session.intervals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Información general */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{session.name}</CardTitle>
              <CardDescription className="mt-1">
                {formatDate(session.date)}
              </CardDescription>
            </div>
            <Badge className={categoryColors[session.category]}>
              {categoryLabels[session.category]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {session.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {session.description}
            </p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{athletes.length} atletas</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span>{session.intervals.length} intervalos</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <span>{sessionStats.totalRepetitions} repeticiones</span>
            </div>
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-green-600" />
              <span>{sessionStats.totalWorkIntervals} trabajo</span>
            </div>
            <div className="flex items-center space-x-2">
              <Pause className="w-4 h-4 text-orange-600" />
              <span>{sessionStats.totalRestIntervals} descanso</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {sessionStats.totalDistance} km
            </div>
            <p className="text-xs text-muted-foreground">
              Estimada por atleta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {sessionStats.totalDuration} min
            </div>
            <p className="text-xs text-muted-foreground">
              Trabajo: {sessionStats.workTime}min • Descanso: {sessionStats.restTime}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratio Trabajo/Descanso</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {sessionStats.workRestRatio}:1
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((sessionStats.workTime / sessionStats.totalDuration) * 100)}% trabajo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carga de Entrenamiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {trainingLoad}
            </div>
            <p className="text-xs text-muted-foreground">
              Unidades de carga
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de intensidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Distribución de Intensidad
          </CardTitle>
          <CardDescription>
            Porcentaje del tiempo de trabajo en cada zona de intensidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Alta Intensidad (&gt;85% VO₂ Max)</span>
              </div>
              <span className="text-sm font-medium">{sessionStats.intensityDistribution.high}%</span>
            </div>
            <Progress value={sessionStats.intensityDistribution.high} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Media Intensidad (70-85% VO₂ Max)</span>
              </div>
              <span className="text-sm font-medium">{sessionStats.intensityDistribution.medium}%</span>
            </div>
            <Progress value={sessionStats.intensityDistribution.medium} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Baja Intensidad (&lt;70% VO₂ Max)</span>
              </div>
              <span className="text-sm font-medium">{sessionStats.intensityDistribution.low}%</span>
            </div>
            <Progress value={sessionStats.intensityDistribution.low} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Ritmos personalizados */}
      {personalizedPaces.some(p => p.personalizedIntervals.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Ritmos Personalizados por Atleta
            </CardTitle>
            <CardDescription>
              Ritmos calculados basados en % VO₂ Max individual usando la fórmula de Jack Daniels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {personalizedPaces.map(({ athlete, personalizedIntervals }) => {
                if (personalizedIntervals.length === 0) return null;
                
                return (
                  <div key={athlete.id} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{athlete.name}</h4>
                      <Badge variant="outline">
                        VO₂ Max: {athlete.vo2max} ml/kg/min
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {personalizedIntervals.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.interval.vo2maxPercentage}% VO₂ Max:</span>
                          <span className="font-medium">
                            {formatPace(item.estimatedPace)}/km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estructura de la sesión con repeticiones */}
      <Card>
        <CardHeader>
          <CardTitle>Estructura de la Sesión</CardTitle>
          <CardDescription>
            Secuencia completa de intervalos incluyendo repeticiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.warmup && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-800 mb-1">Calentamiento</h5>
                <p className="text-sm text-blue-600">{session.warmup}</p>
              </div>
            )}

            {session.intervals.map((interval, index) => (
              <div key={interval.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground w-8">
                  #{index + 1}
                </span>
                
                <Badge className={interval.type === 'work' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {interval.type === 'work' ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                  {interval.type === 'work' ? 'Trabajo' : 'Descanso'}
                </Badge>

                <div className="flex-1">
                  <div className="flex items-center space-x-4 text-sm">
                    {interval.type === 'work' && (
                      <span className="font-medium">
                        {interval.paceType === 'fixed' && interval.pace
                          ? `${formatPace(interval.pace)}/km`
                          : `${interval.vo2maxPercentage}% VO₂ Max`
                        }
                      </span>
                    )}
                    <span>
                      {interval.durationType === 'time' 
                        ? `${interval.duration} min`
                        : `${interval.duration} km`
                      }
                    </span>
                    {interval.repetitions && interval.repetitions > 1 && (
                      <Badge variant="outline" className="text-xs">
                        x{interval.repetitions}
                      </Badge>
                    )}
                  </div>
                  {interval.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {interval.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {session.cooldown && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-green-800 mb-1">Enfriamiento</h5>
                <p className="text-sm text-green-600">{session.cooldown}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notas adicionales */}
      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{session.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}