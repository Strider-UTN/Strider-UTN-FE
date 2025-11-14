import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Zap, Clock, MapPin, Target, Calendar, Settings, Heart, Loader2 } from 'lucide-react';
import { CompletedWorkoutService, CompletedWorkoutResponseDto } from '../services/completedWorkoutService';
import { toast } from 'sonner';

type TimePeriod = '7d' | '30d' | '3m' | '6m' | '1y';
type Units = 'metric' | 'imperial';

interface PerformanceData {
  date: string;
  distance: number;
  pace: number; // in minutes per km
  heartRate: number;
  maxHeartRate: number;
  elevation: number; // No se usa, siempre 0
  duration: number; // in minutes
  load: number;
}

// Función helper para extraer solo la parte de fecha (YYYY-MM-DD) de un string de fecha
// Evita problemas de zona horaria extrayendo directamente la fecha sin convertir
const extractDateOnly = (dateString: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  // Si la fecha viene solo como "YYYY-MM-DD", retornarla directamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Si viene con hora (tiene T), extraer solo la parte de fecha
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  // Si viene en otro formato, intentar parsear y extraer la fecha
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
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
  // Calcular pace: duration (segundos) / distance (km) = segundos/km, luego convertir a min/km
  const durationMinutes = workout.duration / 60;
  const pace = workout.distance > 0 ? durationMinutes / workout.distance : 0;
  
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
  const load = workout.distance > 0 ? workout.distance * (0.5 + intensityFactor) : 0;
  
  return {
    date: extractDateOnly(workout.date), // Usar solo la parte de fecha sin zona horaria
    distance: workout.distance,
    pace: Math.round(pace * 100) / 100,
    heartRate: workout.averageHR,
    maxHeartRate: Math.round(maxHeartRate),
    elevation: 0, // No se usa
    duration: Math.round(durationMinutes),
    load: Math.round(load * 10) / 10
  };
};

interface PerformanceViewProps {
  units: Units;
  onUnitsChange: (units: Units) => void;
}

export function PerformanceView({ units, onUnitsChange }: PerformanceViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [activeTab, setActiveTab] = useState('load');
  const [workouts, setWorkouts] = useState<CompletedWorkoutResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calcular fechas según el período seleccionado
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    }[timePeriod];
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const range = {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
    
    console.log('📅 Rango de fechas calculado:', range, 'para período:', timePeriod, 'días:', days);
    
    return range;
  }, [timePeriod]);
  
  // Cargar workouts cuando cambie el período
  useEffect(() => {
    const loadWorkouts = async () => {
      setIsLoading(true);
      console.log('🔄 Cargando workouts del backend...', { startDate: dateRange.start, endDate: dateRange.end });
      try {
        const data = await CompletedWorkoutService.getMyCompletedWorkoutsByDateRange(
          dateRange.start,
          dateRange.end
        );
        console.log('✅ Workouts cargados del backend:', data.length, 'workouts');
        console.log('📊 Datos recibidos:', data);
        setWorkouts(data);
      } catch (error: any) {
        console.error('❌ Error al cargar workouts:', error);
        console.error('Error details:', error?.response?.data || error?.message);
        if (error?.response?.status !== 401) {
          toast.error('Error al cargar los datos de rendimiento');
        }
        setWorkouts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkouts();
  }, [dateRange.start, dateRange.end]);
  
  // Transformar workouts a PerformanceData y crear un array con todos los días del período
  const data = useMemo(() => {
    console.log('🔄 Transformando workouts a PerformanceData. Workouts recibidos:', workouts.length);
    
    const days = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    }[timePeriod];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Crear un mapa de workouts por fecha
    const workoutsByDate = new Map<string, PerformanceData>();
    workouts.forEach(workout => {
      // Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria
      const dateKey = extractDateOnly(workout.date);
      workoutsByDate.set(dateKey, transformWorkoutToPerformanceData(workout));
    });
    
    console.log('📅 Workouts mapeados por fecha:', workoutsByDate.size, 'días con entrenamientos');
    
    // Crear array con todos los días del período
    const performanceData: PerformanceData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Si hay workout para este día, usar esos datos, sino crear entrada vacía
      if (workoutsByDate.has(dateKey)) {
        performanceData.push(workoutsByDate.get(dateKey)!);
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
    
    const validDays = performanceData.filter(d => d.distance > 0).length;
    console.log('📊 PerformanceData generado:', performanceData.length, 'días totales,', validDays, 'días con entrenamientos');
    
    return performanceData;
  }, [workouts, timePeriod]);
  
  // Calcular métricas agregadas
  const validData = data.filter(d => d.distance > 0);
  const totalDistance = data.reduce((sum, d) => sum + d.distance, 0);
  const trainingDays = validData.length;
  const avgLoad = validData.length > 0 ? validData.reduce((sum, d) => sum + d.load, 0) / validData.length : 0;
  const avgMaxHeartRate = validData.length > 0 ? validData.reduce((sum, d) => sum + d.maxHeartRate, 0) / validData.length : 0;
  
  // Conversiones de unidades
  const convertDistance = (km: number) => {
    return units === 'metric' ? km : km * 0.621371; // km to miles
  };
  
  const formatDistance = (distance: number) => {
    const converted = convertDistance(distance);
    const unit = units === 'metric' ? 'km' : 'mi';
    return `${converted.toFixed(1)} ${unit}`;
  };
  
  const formatPace = (paceMinPerKm: number) => {
    if (units === 'imperial') {
      const paceMinPerMile = paceMinPerKm * 1.60934;
      const mins = Math.floor(paceMinPerMile);
      const secs = Math.floor((paceMinPerMile - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
    } else {
      const mins = Math.floor(paceMinPerKm);
      const secs = Math.floor((paceMinPerKm - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}/km`;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Rendimiento Deportivo</h2>
          <p className="text-muted-foreground">
            Análisis detallado de tus métricas de entrenamiento
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={units} onValueChange={(value: Units) => onUnitsChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Métrico</SelectItem>
              <SelectItem value="imperial">Imperial</SelectItem>
            </SelectContent>
          </Select>
          
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

      {/* Estado de carga */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando datos de rendimiento...</span>
          </CardContent>
        </Card>
      )}

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
              {periodLabels[timePeriod]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días de Entrenamiento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {trainingDays}
            </div>
            <p className="text-xs text-muted-foreground">
              Sesiones completadas
            </p>
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

      {/* Tabs para diferentes vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="load">Carga</TabsTrigger>
          <TabsTrigger value="distance">Distancia</TabsTrigger>
          <TabsTrigger value="pace">Ritmo Promedio</TabsTrigger>
          <TabsTrigger value="heartrate">Frecuencia Cardíaca</TabsTrigger>
        </TabsList>

        <TabsContent value="load" className="space-y-6">
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

        <TabsContent value="distance" className="space-y-6">
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

        <TabsContent value="heartrate" className="space-y-6">
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
                  <YAxis tickFormatter={(value) => `${value} bpm`} />
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
    </div>
  );
}