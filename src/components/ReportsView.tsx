import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Calendar as CalendarIcon, 
  User, 
  Users, 
  TrendingUp, 
  Activity, 
  Timer, 
  Zap,
  Target,
  BarChart3,
  LineChart,
  Download
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface TrainingSession {
  id: string;
  date: string;
  athleteId: string;
  name: string;
  type: string;
  distance: number;
  duration: number; // minutos
  avgPace: string;
  avgHR?: number;
  maxHR?: number;
  plannedDistance?: number;
  plannedDuration?: number;
  status: 'completed' | 'planned' | 'partial';
}

interface ReportsViewProps {
  planningId: string;
  athletes: Athlete[];
}

type PeriodType = 'week' | 'month' | 'custom' | 'last4weeks' | 'last3months';

// Mock data de sesiones de entrenamiento
const mockTrainingSessions: TrainingSession[] = [
  {
    id: 'session1',
    date: '2025-01-20',
    athleteId: 'athlete1',
    name: 'Carrera Continua',
    type: 'Continuo',
    distance: 12.5,
    duration: 68,
    avgPace: '5:26',
    avgHR: 145,
    maxHR: 162,
    plannedDistance: 12,
    plannedDuration: 65,
    status: 'completed'
  },
  {
    id: 'session2',
    date: '2025-01-22',
    athleteId: 'athlete1',
    name: 'Intervalos 1000m',
    type: 'Intervalos',
    distance: 10.2,
    duration: 55,
    avgPace: '5:23',
    avgHR: 165,
    maxHR: 182,
    plannedDistance: 10,
    plannedDuration: 55,
    status: 'completed'
  },
  {
    id: 'session3',
    date: '2025-01-24',
    athleteId: 'athlete1',
    name: 'Tempo Run',
    type: 'Tempo',
    distance: 8.5,
    duration: 45,
    avgPace: '5:17',
    avgHR: 158,
    maxHR: 172,
    plannedDistance: 8,
    plannedDuration: 45,
    status: 'completed'
  },
  {
    id: 'session4',
    date: '2025-01-26',
    athleteId: 'athlete1',
    name: 'Carrera Larga',
    type: 'Continuo',
    distance: 18.2,
    duration: 105,
    avgPace: '5:46',
    avgHR: 142,
    maxHR: 158,
    plannedDistance: 18,
    plannedDuration: 105,
    status: 'completed'
  },
  {
    id: 'session5',
    date: '2025-01-15',
    athleteId: 'athlete2',
    name: 'Intervalos en Pista',
    type: 'Intervalos',
    distance: 8.5,
    duration: 48,
    avgPace: '5:38',
    avgHR: 168,
    maxHR: 185,
    plannedDistance: 8,
    plannedDuration: 50,
    status: 'completed'
  },
  {
    id: 'session6',
    date: '2025-01-17',
    athleteId: 'athlete2',
    name: 'Rodaje Suave',
    type: 'Recuperación',
    distance: 6.3,
    duration: 38,
    avgPace: '6:02',
    avgHR: 132,
    maxHR: 145,
    plannedDistance: 6,
    plannedDuration: 40,
    status: 'completed'
  },
  {
    id: 'session7',
    date: '2025-01-19',
    athleteId: 'athlete2',
    name: 'Fartlek',
    type: 'Fartlek',
    distance: 9.8,
    duration: 58,
    avgPace: '5:55',
    avgHR: 155,
    maxHR: 175,
    plannedDistance: 10,
    plannedDuration: 60,
    status: 'partial'
  },
  {
    id: 'session8',
    date: '2025-01-21',
    athleteId: 'athlete2',
    name: 'Tempo 10K',
    type: 'Tempo',
    distance: 10.0,
    duration: 55,
    avgPace: '5:30',
    avgHR: 162,
    maxHR: 178,
    plannedDistance: 10,
    plannedDuration: 55,
    status: 'completed'
  },
  {
    id: 'session9',
    date: '2025-01-13',
    athleteId: 'athlete3',
    name: 'Carrera Base',
    type: 'Continuo',
    distance: 10.5,
    duration: 62,
    avgPace: '5:54',
    avgHR: 148,
    maxHR: 165,
    plannedDistance: 10,
    plannedDuration: 60,
    status: 'completed'
  },
  {
    id: 'session10',
    date: '2025-01-16',
    athleteId: 'athlete3',
    name: 'Series Cortas',
    type: 'Intervalos',
    distance: 7.2,
    duration: 42,
    avgPace: '5:50',
    avgHR: 170,
    maxHR: 188,
    plannedDistance: 7,
    plannedDuration: 42,
    status: 'completed'
  },
  {
    id: 'session11',
    date: '2025-01-18',
    athleteId: 'athlete3',
    name: 'Rodaje Medio',
    type: 'Continuo',
    distance: 12.0,
    duration: 72,
    avgPace: '6:00',
    avgHR: 145,
    maxHR: 160,
    plannedDistance: 12,
    plannedDuration: 72,
    status: 'completed'
  },
  {
    id: 'session12',
    date: '2025-01-23',
    athleteId: 'athlete3',
    name: 'Cuestas',
    type: 'Cuestas',
    distance: 8.5,
    duration: 50,
    avgPace: '5:52',
    avgHR: 165,
    maxHR: 180,
    plannedDistance: 8.5,
    plannedDuration: 50,
    status: 'completed'
  }
];

export function ReportsView({ planningId, athletes }: ReportsViewProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');
  const [periodType, setPeriodType] = useState<PeriodType>('last4weeks');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [reportView, setReportView] = useState<'overview' | 'detailed'>('overview');

  // Calcular rango de fechas según el tipo de periodo
  const dateRange = useMemo(() => {
    const today = new Date();
    
    switch (periodType) {
      case 'week':
        return {
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          from: startOfMonth(today),
          to: endOfMonth(today)
        };
      case 'last4weeks':
        return {
          from: subWeeks(today, 4),
          to: today
        };
      case 'last3months':
        return {
          from: subMonths(today, 3),
          to: today
        };
      case 'custom':
        return {
          from: customDateFrom,
          to: customDateTo
        };
      default:
        return { from: undefined, to: undefined };
    }
  }, [periodType, customDateFrom, customDateTo]);

  // Filtrar sesiones según atleta y rango de fechas
  const filteredSessions = useMemo(() => {
    let sessions = mockTrainingSessions;

    // Filtrar por atleta
    if (selectedAthleteId !== 'all') {
      sessions = sessions.filter(s => s.athleteId === selectedAthleteId);
    }

    // Filtrar por rango de fechas
    if (dateRange.from && dateRange.to) {
      sessions = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return isWithinInterval(sessionDate, { start: dateRange.from!, end: dateRange.to! });
      });
    }

    return sessions;
  }, [selectedAthleteId, dateRange]);

  // Calcular métricas agregadas
  const metrics = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.status === 'completed').length;
    const totalDistance = filteredSessions.reduce((sum, s) => sum + s.distance, 0);
    const totalDuration = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const plannedDistance = filteredSessions.reduce((sum, s) => sum + (s.plannedDistance || 0), 0);
    
    // Calcular ritmo promedio (convertir de "min:seg" a segundos)
    const avgPaceSeconds = filteredSessions.length > 0
      ? filteredSessions.reduce((sum, s) => {
          const [min, sec] = s.avgPace.split(':').map(Number);
          return sum + (min * 60 + sec);
        }, 0) / filteredSessions.length
      : 0;
    
    const avgPaceMin = Math.floor(avgPaceSeconds / 60);
    const avgPaceSec = Math.round(avgPaceSeconds % 60);
    const avgPace = `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')}`;

    // Calcular FC promedio
    const sessionsWithHR = filteredSessions.filter(s => s.avgHR);
    const avgHR = sessionsWithHR.length > 0
      ? Math.round(sessionsWithHR.reduce((sum, s) => sum + (s.avgHR || 0), 0) / sessionsWithHR.length)
      : 0;

    // Cumplimiento de distancia planificada
    const completionRate = plannedDistance > 0
      ? Math.round((totalDistance / plannedDistance) * 100)
      : 100;

    // Distribución por tipo de entrenamiento
    const typeDistribution: Record<string, number> = {};
    filteredSessions.forEach(s => {
      typeDistribution[s.type] = (typeDistribution[s.type] || 0) + 1;
    });

    return {
      totalSessions,
      completedSessions,
      totalDistance,
      totalDuration,
      avgPace,
      avgHR,
      completionRate,
      typeDistribution
    };
  }, [filteredSessions]);

  // Datos para gráfico de volumen semanal
  const weeklyVolumeData = useMemo(() => {
    const weekMap: Record<string, { week: string; distance: number; sessions: number }> = {};
    
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const weekStart = startOfWeek(sessionDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const weekLabel = format(weekStart, 'dd MMM', { locale: es });
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { week: weekLabel, distance: 0, sessions: 0 };
      }
      
      weekMap[weekKey].distance += session.distance;
      weekMap[weekKey].sessions += 1;
    });

    return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredSessions]);

  // Datos para gráfico de distribución por tipo
  const typeDistributionData = useMemo(() => {
    return Object.entries(metrics.typeDistribution).map(([type, count]) => ({
      name: type,
      value: count
    }));
  }, [metrics.typeDistribution]);

  // Colores para el gráfico de distribución
  const COLORS = ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#1e293b'];

  const selectedAthlete = selectedAthleteId === 'all' 
    ? null 
    : athletes.find(a => a.id === selectedAthleteId);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Reporte</CardTitle>
          <CardDescription>
            Selecciona el atleta y periodo para generar el reporte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Atleta */}
            <div className="space-y-2">
              <Label>Atleta</Label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un atleta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Todos los atletas
                    </div>
                  </SelectItem>
                  {athletes.map(athlete => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {athlete.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Periodo */}
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={periodType} onValueChange={(value) => setPeriodType(value as PeriodType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="last4weeks">Últimas 4 semanas</SelectItem>
                  <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selector de fechas personalizado */}
          {periodType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      locale={es}
                      disabled={(date) => customDateFrom ? date < customDateFrom : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {dateRange.from && dateRange.to && (
                <>
                  Mostrando datos desde {format(dateRange.from, 'PPP', { locale: es })} hasta {format(dateRange.to, 'PPP', { locale: es })}
                </>
              )}
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">{metrics.totalSessions}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.completedSessions} completadas
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Volumen Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">{metrics.totalDistance.toFixed(1)} km</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {(metrics.totalDuration / 60).toFixed(1)} horas
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ritmo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">{metrics.avgPace}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  min/km
                </p>
              </div>
              <Timer className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FC Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">{metrics.avgHR || '--'}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.avgHR ? 'bpm' : 'Sin datos'}
                </p>
              </div>
              <Zap className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cumplimiento de planificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Cumplimiento de Planificación
          </CardTitle>
          <CardDescription>
            Porcentaje de cumplimiento respecto a lo planificado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Distancia planificada vs. ejecutada</span>
                <span className="text-2xl font-bold text-primary">{metrics.completionRate}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes vistas de reportes */}
      <Tabs value={reportView} onValueChange={(value) => setReportView(value as 'overview' | 'detailed')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-2">
            <LineChart className="w-4 h-4" />
            Detallado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de volumen semanal */}
            <Card>
              <CardHeader>
                <CardTitle>Volumen Semanal</CardTitle>
                <CardDescription>
                  Kilometraje acumulado por semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis label={{ value: 'km', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="distance" fill="#06b6d4" name="Distancia (km)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de distribución por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
                <CardDescription>
                  Sesiones según tipo de entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4 mt-4">
          {/* Tabla detallada de sesiones */}
          <Card>
            <CardHeader>
              <CardTitle>Sesiones Detalladas</CardTitle>
              <CardDescription>
                Todas las sesiones del periodo seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left">Fecha</th>
                      {selectedAthleteId === 'all' && <th className="p-3 text-left">Atleta</th>}
                      <th className="p-3 text-left">Sesión</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-right">Distancia</th>
                      <th className="p-3 text-right">Duración</th>
                      <th className="p-3 text-right">Ritmo</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.length > 0 ? (
                      filteredSessions.map((session) => {
                        const athlete = athletes.find(a => a.id === session.athleteId);
                        return (
                          <tr key={session.id} className="border-b">
                            <td className="p-3">
                              {format(new Date(session.date), 'dd MMM yyyy', { locale: es })}
                            </td>
                            {selectedAthleteId === 'all' && (
                              <td className="p-3">{athlete?.name}</td>
                            )}
                            <td className="p-3 font-medium">{session.name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{session.type}</Badge>
                            </td>
                            <td className="p-3 text-right">{session.distance.toFixed(1)} km</td>
                            <td className="p-3 text-right">{session.duration} min</td>
                            <td className="p-3 text-right">{session.avgPace}</td>
                            <td className="p-3 text-center">
                              <Badge 
                                variant={
                                  session.status === 'completed' ? 'default' : 
                                  session.status === 'partial' ? 'secondary' : 
                                  'outline'
                                }
                              >
                                {session.status === 'completed' ? 'Completada' :
                                 session.status === 'partial' ? 'Parcial' : 
                                 'Planificada'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={selectedAthleteId === 'all' ? 8 : 7} className="p-8 text-center text-muted-foreground">
                          No hay sesiones en el periodo seleccionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
