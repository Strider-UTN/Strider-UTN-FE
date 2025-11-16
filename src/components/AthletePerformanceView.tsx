import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, User, Calendar, MapPin, Heart, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { AthleteAnalysisService, AthleteHealthStatusResponseDto, AthleteHealthStatusMessageType } from '../services/athleteAnalysisService';

type TimePeriod = '7d' | '30d' | '3m' | '6m' | '1y';
type Units = 'metric' | 'imperial';

interface AthleteData {
  id: string;
  name: string;
  email: string;
  age: number;
  groupName: string;
  joinDate: string;
}

interface PerformanceData {
  date: string;
  distance: number;
  pace: number;
  heartRate: number;
  maxHeartRate: number;
  duration: number;
  load: number;
}



// Generar datos simulados para un atleta específico
const generateAthleteData = (athleteId: string, period: TimePeriod): PerformanceData[] => {
  const days = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365
  }[period];

  const data: PerformanceData[] = [];
  const today = new Date();
  
  // Crear patrones únicos por atleta
  const basePace = 4.0 + (parseInt(athleteId) % 3) * 0.5 + Math.random() * 0.5;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseDistance = period === '7d' || period === '30d' ? 
      (Math.random() > 0.4 ? 3 + Math.random() * 12 : 0) :
      (i % 7 === 0 ? 0 : 2 + Math.random() * 10);
    
    const pace = basePace + Math.random() * 1.0 - 0.5;
    const duration = baseDistance > 0 ? baseDistance * pace : 0;
    const avgHR = baseDistance > 0 ? 135 + Math.random() * 45 : 0;
    const maxHR = avgHR > 0 ? avgHR + 15 + Math.random() * 15 : 0;
    
    // Calcular carga: distancia × factor de intensidad (basado en FC)
    // Factor de intensidad va de 0.5 a 1.5 aproximadamente
    const intensityFactor = avgHR > 0 ? (avgHR - 120) / 80 : 0;
    const load = baseDistance > 0 ? baseDistance * (0.5 + intensityFactor) : 0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      distance: Math.round(baseDistance * 100) / 100,
      pace: Math.round(pace * 100) / 100,
      heartRate: Math.round(avgHR),
      maxHeartRate: Math.round(maxHR),
      duration: Math.round(duration),
      load: Math.round(load * 10) / 10
    });
  }
  
  return data;
};

interface AthletePerformanceViewProps {
  athlete: AthleteData;
  units: Units;
  onBack: () => void;
}

export function AthletePerformanceView({ athlete, units, onBack }: AthletePerformanceViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [analysisResults, setAnalysisResults] = useState<AthleteHealthStatusResponseDto[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

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

  const data = generateAthleteData(athlete.id, timePeriod);
  
  // Calcular métricas agregadas
  const validData = data.filter(d => d.distance > 0);
  const totalDistance = data.reduce((sum, d) => sum + d.distance, 0);
  const trainingDays = validData.length;
  const avgLoad = validData.length > 0 ? validData.reduce((sum, d) => sum + d.load, 0) / validData.length : 0;
  const avgMaxHeartRate = validData.length > 0 ? validData.reduce((sum, d) => sum + d.maxHeartRate, 0) / validData.length : 0;

  const convertDistance = (km: number) => {
    return units === 'metric' ? km : km * 0.621371;
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

      {/* Gráficos */}
      <Tabs defaultValue="load" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="load">Carga</TabsTrigger>
          <TabsTrigger value="distance">Distancia</TabsTrigger>
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value} bpm`}
                  />
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