import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, User, Calendar, MapPin, Heart, CheckCircle, AlertTriangle, Info, Loader2, TrendingUp } from 'lucide-react';
import { AthleteAnalysisService, AthleteHealthStatusResponseDto, AthleteHealthStatusMessageType } from '../services/athleteAnalysisService';
import { CompletedWorkoutService, CompletedWorkoutResponseDto } from '../services/completedWorkoutService';
import { VO2MaxSuggestionService } from '../services/vo2MaxSuggestionService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';

type TimePeriod = '7d' | '30d' | '3m' | '6m' | '1y';

interface AthleteData {
  id: string;
  name: string;
  email: string;
  age: number;
  groupName: string;
  joinDate: string;
  vo2Max?: string; // VO2Max actual del atleta en formato mm:ss
}

interface PerformanceData {
  date: string;
  distance: number;
  pace: number;
  heartRate: number;
  maxHeartRate: number;
  elevation: number;
  duration: number;
  load: number;
}




interface AthletePerformanceViewProps {
  athlete: AthleteData;
  onBack: () => void;
}

// Función auxiliar para extraer solo la fecha (YYYY-MM-DD) sin conversión de zona horaria
const extractDateOnly = (dateString: string | Date): string => {
  if (typeof dateString === 'string') {
    // Si ya es formato YYYY-MM-DD, devolverlo directamente
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return dateString.split('T')[0];
    }
    // Si es ISO string, extraer solo la parte de fecha
    return new Date(dateString).toISOString().split('T')[0];
  }
  return dateString.toISOString().split('T')[0];
};

// Función helper para formatear fecha desde string YYYY-MM-DD sin conversión de zona horaria
const formatDateFromString = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  if (!dateString) return '';
  // Extraer la fecha si viene con hora
  const dateOnly = extractDateOnly(dateString);
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  if (format === 'short') {
    // Formato corto: DD/MM
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
  } else {
    // Formato largo: DD/MM/YYYY
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }
};

// Transformar CompletedWorkoutResponseDto a PerformanceData
const transformWorkoutToPerformanceData = (workout: CompletedWorkoutResponseDto): PerformanceData => {
  // El backend entrega la distancia en metros → convertir a kilómetros
  const distanceKm = workout.distance / 1000;
  // Calcular pace: duration (segundos) / distance (km) = segundos/km, luego convertir a min/km
  const durationMinutes = workout.duration / 60;
  const pace = distanceKm > 0 ? durationMinutes / distanceKm : 0;
  
  // Calcular maxHeartRate desde los laps o usar una estimación
  let maxHeartRate = workout.averageHR;
  if (workout.laps && workout.laps.length > 0) {
    const maxHRFromLaps = Math.max(...workout.laps.map(lap => lap.averageHR));
    maxHeartRate = Math.max(maxHeartRate, maxHRFromLaps);
  } else {
    // Estimación conservadora: averageHR + 15
    maxHeartRate = workout.averageHR + 15;
  }
  
  // Calcular carga: distancia × factor de intensidad (basado en FC promedio)
  // Factor de intensidad va de 0.5 a 1.5 aproximadamente basado en FC
  const intensityFactor = workout.averageHR > 0 ? (workout.averageHR - 120) / 80 : 0;
  const load = distanceKm > 0 ? distanceKm * (0.5 + intensityFactor) : 0;
  
  return {
    date: extractDateOnly(workout.date),
    distance: distanceKm,
    pace: Math.round(pace * 100) / 100,
    heartRate: workout.averageHR,
    maxHeartRate: Math.round(maxHeartRate),
    elevation: 0, // No se usa
    duration: Math.round(durationMinutes),
    load: Math.round(load * 10) / 10
  };
};

export function AthletePerformanceView({ athlete, onBack }: AthletePerformanceViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [analysisResults, setAnalysisResults] = useState<AthleteHealthStatusResponseDto[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [workouts, setWorkouts] = useState<CompletedWorkoutResponseDto[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [isVO2MaxModalOpen, setIsVO2MaxModalOpen] = useState(false);
  const [suggestedVO2Max, setSuggestedVO2Max] = useState('');
  const [vo2MaxMessage, setVo2MaxMessage] = useState('');
  const [isSubmittingVO2Max, setIsSubmittingVO2Max] = useState(false);

  // Calcular rango de fechas basado en el período seleccionado
  const getDateRange = (period: TimePeriod): { start: string; end: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endDate = format(today, 'yyyy-MM-dd');
    
    const days = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    }[period];
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);
    
    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: endDate
    };
  };

  // Fetch workouts when athlete or time period changes
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!athlete?.id) return;
      
      setIsLoadingWorkouts(true);
      try {
        const dateRange = getDateRange(timePeriod);
        const athleteId = parseInt(athlete.id, 10);
        
        if (isNaN(athleteId)) {
          console.error('Invalid athlete ID:', athlete.id);
          setWorkouts([]);
          return;
        }
        
        // Usar el endpoint del entrenador para obtener workouts del atleta específico
        const groupedData = await CompletedWorkoutService.getForCoachWithFiltersGroupedByAthlete({
          athleteId: athleteId,
          startDate: dateRange.start,
          endDate: dateRange.end
        });
        
        // Extraer los workouts del atleta (debería haber solo un grupo para este atleta)
        const athleteGroup = groupedData.find(group => group.athleteId === athleteId);
        const workouts = athleteGroup?.workouts || [];
        
        setWorkouts(workouts);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        toast.error('Error al cargar los datos de rendimiento del atleta');
        setWorkouts([]);
      } finally {
        setIsLoadingWorkouts(false);
      }
    };

    fetchWorkouts();
  }, [athlete?.id, timePeriod]);

  // Fetch analysis results when athlete changes
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!athlete?.id) return;
      
      setIsLoadingAnalysis(true);
      try {
        const athleteId = parseInt(athlete.id, 10);
        if (!isNaN(athleteId)) {
          const results = await AthleteAnalysisService.getAthleteAnalysis(athleteId);
          setAnalysisResults(results);
        }
      } catch (error) {
        console.error('Error fetching athlete analysis:', error);
        setAnalysisResults([]);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [athlete?.id]);

  // Validación defensiva para evitar crashes si athlete es undefined
  if (!athlete || !athlete.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se pudo cargar la información del atleta.</p>
              <p className="text-sm mt-2">Por favor, vuelve e intenta nuevamente.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transformar workouts a PerformanceData y crear un array con todos los días del período
  const data = useMemo(() => {
    const days = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    }[timePeriod];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Crear un mapa de workouts por fecha, agrupando múltiples sesiones del mismo día
    const workoutsByDate = new Map<string, PerformanceData[]>();
    workouts.forEach(workout => {
      const dateKey = extractDateOnly(workout.date);
      const performanceData = transformWorkoutToPerformanceData(workout);
      
      if (!workoutsByDate.has(dateKey)) {
        workoutsByDate.set(dateKey, []);
      }
      workoutsByDate.get(dateKey)!.push(performanceData);
    });
    
    // Consolidar múltiples workouts del mismo día
    const consolidatedWorkoutsByDate = new Map<string, PerformanceData>();
    workoutsByDate.forEach((dayWorkouts, dateKey) => {
      if (dayWorkouts.length === 1) {
        consolidatedWorkoutsByDate.set(dateKey, dayWorkouts[0]);
      } else {
        // Si hay múltiples workouts, consolidar las métricas
        const totalDistance = dayWorkouts.reduce((sum, w) => sum + w.distance, 0);
        const totalDuration = dayWorkouts.reduce((sum, w) => sum + w.duration, 0);
        const totalLoad = dayWorkouts.reduce((sum, w) => sum + w.load, 0);
        
        // Calcular ritmo promedio ponderado por distancia
        const totalPaceMinutes = dayWorkouts.reduce((sum, w) => sum + (w.pace * w.distance), 0);
        const avgPace = totalDistance > 0 ? totalPaceMinutes / totalDistance : 0;
        
        // Calcular frecuencia cardíaca promedio ponderada por duración
        const totalHRMinutes = dayWorkouts.reduce((sum, w) => sum + (w.heartRate * w.duration), 0);
        const avgHeartRate = totalDuration > 0 ? totalHRMinutes / totalDuration : 0;
        
        // Tomar el máximo de maxHeartRate
        const maxHeartRate = Math.max(...dayWorkouts.map(w => w.maxHeartRate));
        
        consolidatedWorkoutsByDate.set(dateKey, {
          date: dateKey,
          distance: Math.round(totalDistance * 100) / 100,
          pace: Math.round(avgPace * 100) / 100,
          heartRate: Math.round(avgHeartRate),
          maxHeartRate: Math.round(maxHeartRate),
          elevation: 0, // No se usa
          duration: Math.round(totalDuration),
          load: Math.round(totalLoad * 10) / 10
        });
      }
    });
    
    // Crear array con todos los días del período
    const performanceData: PerformanceData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (consolidatedWorkoutsByDate.has(dateKey)) {
        performanceData.push(consolidatedWorkoutsByDate.get(dateKey)!);
      } else {
        performanceData.push({
          date: dateKey,
          distance: 0,
          pace: 0,
          heartRate: 0,
          maxHeartRate: 0,
          elevation: 0,
          duration: 0,
          load: 0
        });
      }
    }
    
    return performanceData;
  }, [workouts, timePeriod]);
  
  // Calcular métricas agregadas
  const validData = data.filter(d => d.distance > 0);
  const totalDistance = data.reduce((sum, d) => sum + d.distance, 0);
  const trainingDays = validData.length; // Días únicos con entrenamiento
  const totalSessions = workouts.length; // Total de sesiones (puede haber múltiples por día)
  const avgLoad = validData.length > 0 ? validData.reduce((sum, d) => sum + d.load, 0) / validData.length : 0;
  const avgMaxHeartRate = validData.length > 0 ? validData.reduce((sum, d) => sum + d.maxHeartRate, 0) / validData.length : 0;

  // Formateo de unidades (solo sistema métrico)
  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };
  
  const formatPace = (paceMinPerKm: number) => {
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.floor((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  };



  const periodLabels = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días', 
    '3m': 'Últimos 3 meses',
    '6m': 'Últimos 6 meses',
    '1y': 'Último año'
  };
  
  const getDaysCount = (period: TimePeriod): number => {
    return {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    }[period];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-primary">{athlete.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {athlete.age} años
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Miembro desde {new Date(athlete.joinDate).toLocaleDateString('es-ES')}
              </span>
              <Badge variant="outline">
                {athlete.groupName}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsVO2MaxModalOpen(true)}
            className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary"
          >
            <TrendingUp className="w-4 h-4" />
            Sugerir VO2Max
          </Button>
          <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modal para sugerir VO2Max */}
      <Dialog open={isVO2MaxModalOpen} onOpenChange={setIsVO2MaxModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugerir Actualización de VO2Max</DialogTitle>
            <DialogDescription>
              Sugiere una actualización del VO2Max para {athlete.name}. El atleta podrá aceptar o rechazar esta sugerencia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {athlete.vo2Max && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>VO2Max actual:</strong>
                </p>
                <p className="text-sm font-medium">{athlete.vo2Max}/km</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="vo2max" className="text-sm font-medium">VO2Max sugerido (mm:ss)</Label>
              <Input
                id="vo2max"
                type="text"
                placeholder="03:30"
                value={suggestedVO2Max}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d:]/g, '');
                  if (value === '' || /^\d{0,2}(:\d{0,2})?$/.test(value)) {
                    setSuggestedVO2Max(value);
                  }
                }}
                onBlur={() => {
                  // Validar y formatear el valor
                  const parts = suggestedVO2Max.split(':');
                  if (parts.length === 2 && parts[0] !== '' && parts[1] !== '') {
                    const minutes = Math.min(59, Math.max(0, parseInt(parts[0], 10) || 0));
                    const seconds = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
                    setSuggestedVO2Max(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                  } else if (parts.length === 1 && parts[0] !== '') {
                    const minutes = Math.min(59, Math.max(0, parseInt(parts[0], 10) || 0));
                    setSuggestedVO2Max(`${minutes.toString().padStart(2, '0')}:00`);
                  }
                }}
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: mm:ss (ejemplo: 03:30 para 3 minutos y 30 segundos por km)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vo2max-message" className="text-sm font-medium">Mensaje (opcional)</Label>
              <Textarea
                id="vo2max-message"
                placeholder="Agrega un comentario o explicación sobre esta sugerencia..."
                value={vo2MaxMessage}
                onChange={(e) => setVo2MaxMessage(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {vo2MaxMessage.length}/500 caracteres
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsVO2MaxModalOpen(false);
                  setSuggestedVO2Max('');
                  setVo2MaxMessage('');
                }}
                disabled={isSubmittingVO2Max}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!suggestedVO2Max || !/^\d{2}:\d{2}$/.test(suggestedVO2Max)) {
                    toast.error('Por favor, ingresa un VO2Max válido en formato mm:ss');
                    return;
                  }

                  setIsSubmittingVO2Max(true);
                  try {
                    const athleteId = parseInt(athlete.id, 10);
                    if (isNaN(athleteId)) {
                      toast.error('ID de atleta inválido');
                      return;
                    }

                    await VO2MaxSuggestionService.createSuggestion({
                      athleteId,
                      suggestedVO2Max,
                      message: vo2MaxMessage || undefined
                    });

                    setIsVO2MaxModalOpen(false);
                    setSuggestedVO2Max('');
                    setVo2MaxMessage('');
                  } catch (error: any) {
                    console.error('Error al crear sugerencia:', error);
                    // El error ya fue manejado por el servicio
                  } finally {
                    setIsSubmittingVO2Max(false);
                  }
                }}
                disabled={isSubmittingVO2Max || !suggestedVO2Max}
              >
                {isSubmittingVO2Max ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Sugerencia'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatDistance(totalDistance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de distancias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones y Días</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {totalSessions}
              </div>
              <p className="text-xs text-muted-foreground">
                Sesiones completadas
              </p>
              <div className="text-xl font-semibold text-primary/80 pt-1">
                {trainingDays}
              </div>
              <p className="text-xs text-muted-foreground">
                Días entrenados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carga Promedio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {avgLoad ? avgLoad.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de carga
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frecuencia Cardíaca</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {avgMaxHeartRate ? `${avgMaxHeartRate.toFixed(0)} bpm` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de FC máxima
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="load" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="load">Carga</TabsTrigger>
          <TabsTrigger value="distance">Distancia</TabsTrigger>
          <TabsTrigger value="pace">Ritmo</TabsTrigger>
          <TabsTrigger value="heartrate">Frecuencia Cardíaca</TabsTrigger>
        </TabsList>

        <TabsContent value="load">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Carga</CardTitle>
              <CardDescription>
                Análisis de carga en los últimos {getDaysCount(timePeriod)} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => formatDateFromString(value, 'short')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDateFromString(value, 'long')}
                    formatter={(value: number) => [value.toFixed(1), 'Carga']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    labelStyle={{
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="load" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    name="Carga"
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distance">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Distancia</CardTitle>
              <CardDescription>
                Análisis de distancia en los últimos {getDaysCount(timePeriod)} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => formatDateFromString(value, 'short')}
                  />
                  <YAxis tickFormatter={(value) => formatDistance(value).split(' ')[0]} />
                  <Tooltip 
                    labelFormatter={(value) => formatDateFromString(value, 'long')}
                    formatter={(value: number) => [formatDistance(value), 'Distancia']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    labelStyle={{
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    name="Distancia"
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Ritmo Promedio</CardTitle>
              <CardDescription>
                Análisis de ritmo promedio en los últimos {getDaysCount(timePeriod)} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {(() => {
                  const paceData = data.filter(d => d.pace > 0);
                  const paceValues = paceData.map(d => d.pace);
                  
                  let minPace = paceValues.length > 0 ? Math.min(...paceValues) : 0;
                  let maxPace = paceValues.length > 0 ? Math.max(...paceValues) : 10;
                  
                  // Si hay muy pocos datos o todos tienen el mismo ritmo, usar un rango más amplio
                  const range = maxPace - minPace;
                  if (range < 0.5 || paceValues.length < 2) {
                    // Si el rango es muy pequeño o hay menos de 2 puntos, usar un rango por defecto
                    const avgPace = paceValues.length > 0 
                      ? paceValues.reduce((sum, p) => sum + p, 0) / paceValues.length 
                      : 5;
                    minPace = Math.max(0, avgPace - 2); // 2 min/km por debajo del promedio
                    maxPace = avgPace + 2; // 2 min/km por encima del promedio
                  }
                  
                  // Agregar un margen del 15% arriba y abajo para dar más rango visual
                  const margin = Math.max(range * 0.15, 0.5); // Mínimo 0.5 min/km de margen
                  const domainMin = Math.max(0, minPace - margin);
                  const domainMax = maxPace + margin;
                  
                  return (
                    <LineChart 
                      data={paceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => formatDateFromString(value, 'short')}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatPace(value)}
                        reversed={true}
                        domain={[domainMin, domainMax]}
                      />
                      <Tooltip 
                        labelFormatter={(value) => formatDateFromString(value, 'long')}
                        formatter={(value: number) => [formatPace(value), 'Ritmo']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'calc(var(--radius) - 2px)',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                        labelStyle={{
                          color: 'hsl(var(--popover-foreground))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pace" 
                        stroke="var(--primary)" 
                        strokeWidth={2}
                        name="Ritmo"
                        dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  );
                })()}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heartrate">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Frecuencia Cardíaca Máxima</CardTitle>
              <CardDescription>
                Análisis de frecuencia cardíaca en los últimos {getDaysCount(timePeriod)} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => formatDateFromString(value, 'short')}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value} bpm`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatDateFromString(value, 'long')}
                    formatter={(value: number) => [`${value.toFixed(0)} bpm`, 'FC Máxima']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    labelStyle={{
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxHeartRate" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    name="FC Máxima"
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Análisis de Salud */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">Análisis del Atleta</h3>
          <p className="text-sm text-muted-foreground">
            Resultados del análisis del atleta
          </p>
        </div>

        {isLoadingAnalysis ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Cargando análisis...</p>
              </div>
            </CardContent>
          </Card>
        ) : analysisResults.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay análisis disponibles</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisResults.map((analysis, index) => {
              const isWarning = analysis.type === AthleteHealthStatusMessageType.Warning;
              const isOk = analysis.type === AthleteHealthStatusMessageType.Ok;
              const isNoData = analysis.type === AthleteHealthStatusMessageType.NoData;
              
              return (
                <Card
                  key={index}
                  className={
                    isWarning
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                      : isOk
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : isNoData
                      ? 'border-gray-400 bg-gray-50 dark:bg-gray-950/20'
                      : ''
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {isWarning ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                        ) : isOk ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                        ) : isNoData ? (
                          <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        ) : null}
                        <CardTitle
                          className={
                            isWarning
                              ? 'text-yellow-900 dark:text-yellow-100'
                              : isOk
                              ? 'text-green-900 dark:text-green-100'
                              : isNoData
                              ? 'text-gray-900 dark:text-gray-100'
                              : ''
                          }
                        >
                          {analysis.title}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          isWarning
                            ? 'border-yellow-600 text-yellow-700 dark:text-yellow-400'
                            : isOk
                            ? 'border-green-600 text-green-700 dark:text-green-400'
                            : isNoData
                            ? 'border-gray-600 text-gray-700 dark:text-gray-400'
                            : ''
                        }
                      >
                        {isWarning ? 'Advertencia' : isOk ? 'OK' : isNoData ? 'Sin Datos' : analysis.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={
                        isWarning
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : isOk
                          ? 'text-green-800 dark:text-green-200'
                          : isNoData
                          ? 'text-gray-800 dark:text-gray-200'
                          : 'text-muted-foreground'
                      }
                    >
                      {analysis.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}