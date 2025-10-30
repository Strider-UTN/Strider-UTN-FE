import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Zap, Clock, MapPin, Target, Calendar, Settings, Heart } from 'lucide-react';

type TimePeriod = '7d' | '30d' | '3m' | '6m' | '1y';
type Units = 'metric' | 'imperial';

interface PerformanceData {
  date: string;
  distance: number;
  pace: number; // in minutes per km
  heartRate: number;
  maxHeartRate: number;
  elevation: number;
  duration: number; // in minutes
  load: number;
}

// Datos simulados de Garmin
const generateMockData = (period: TimePeriod): PerformanceData[] => {
  const days = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365
  }[period];

  const data: PerformanceData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simular datos realistas con variación
    const baseDistance = period === '7d' || period === '30d' ? 
      (Math.random() > 0.3 ? 5 + Math.random() * 15 : 0) : // Algunos días sin entrenar
      (i % 7 === 0 ? 0 : 3 + Math.random() * 12); // Patrones semanales para períodos largos
    
    const basePace = 4.0 + Math.random() * 2.0; // 4:00 - 6:00 min/km
    const duration = baseDistance > 0 ? baseDistance * basePace : 0;
    const avgHR = baseDistance > 0 ? 140 + Math.random() * 40 : 0;
    const maxHR = avgHR > 0 ? avgHR + 15 + Math.random() * 15 : 0;
    
    // Calcular carga: distancia × factor de intensidad (basado en FC)
    const intensityFactor = avgHR > 0 ? (avgHR - 120) / 80 : 0;
    const load = baseDistance > 0 ? baseDistance * (0.5 + intensityFactor) : 0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      distance: Math.round(baseDistance * 100) / 100,
      pace: Math.round(basePace * 100) / 100,
      heartRate: Math.round(avgHR),
      maxHeartRate: Math.round(maxHR),
      elevation: Math.random() * 500, // 0-500m
      duration: Math.round(duration),
      load: Math.round(load * 10) / 10
    });
  }
  
  return data;
};

interface PerformanceViewProps {
  units: Units;
  onUnitsChange: (units: Units) => void;
}

export function PerformanceView({ units, onUnitsChange }: PerformanceViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  const data = generateMockData(timePeriod);
  
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="load">Carga</TabsTrigger>
          <TabsTrigger value="distance">Distancia</TabsTrigger>
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: number) => [value.toFixed(1), 'Carga']}
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis tickFormatter={(value) => formatDistance(value).split(' ')[0]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: number) => [formatDistance(value), 'Distancia']}
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis tickFormatter={(value) => `${value} bpm`} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: number) => [`${value.toFixed(0)} bpm`, 'FC Máxima']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxHeartRate" 
                    stroke="var(--accent)" 
                    strokeWidth={2}
                    name="FC Máxima"
                    dot={{ fill: 'var(--accent)', strokeWidth: 2, r: 3 }}
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