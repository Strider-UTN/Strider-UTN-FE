import React, { useState, useMemo, useEffect } from 'react';
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
  Download,
  Loader2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CompletedWorkoutService, CompletedWorkoutResponseDto, CompletedWorkoutsGroupedByAthleteDto } from '../services/completedWorkoutService';
import { CoachAthleteRelationshipService, AthleteResponseDto } from '../services/coachAthleteRelationshipService';
import { toast } from 'sonner';

interface TrainingSession {
  id: string;
  date: string;
  athleteId: string;
  name: string;
  type: string;
  category?: 'Training' | 'PrepCompetition' | 'MainCompetition' | 'training' | 'prepCompetition' | 'mainCompetition';
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
  planningId?: string;
}

type PeriodType = 'week' | 'month' | 'custom' | 'last4weeks' | 'last3months';

// Función para calcular el ritmo promedio en formato mm:ss
// El backend devuelve distance en km y duration en segundos
const calculatePace = (distanceKm: number, durationSeconds: number): string => {
  if (distanceKm === 0 || durationSeconds === 0) return '0:00';
  const paceSecondsPerKm = durationSeconds / distanceKm;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.round(paceSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Función para obtener el tipo de entrenamiento desde el nombre
const getTrainingType = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('intervalo') || lowerName.includes('serie')) return 'Intervalos';
  if (lowerName.includes('tempo')) return 'Tempo';
  if (lowerName.includes('fartlek')) return 'Fartlek';
  if (lowerName.includes('cuesta')) return 'Cuestas';
  if (lowerName.includes('recuperación') || lowerName.includes('rodaje')) return 'Recuperación';
  return 'Continuo';
};

// Función para formatear la categoría a texto legible
const formatCategory = (category?: string): string => {
  if (!category) return 'Entrenamiento';
  const normalized = category.toLowerCase();
  if (normalized === 'training') return 'Entrenamiento';
  if (normalized === 'prepcompetition') return 'Competición Preparatoria';
  if (normalized === 'maincompetition') return 'Competencia';
  return 'Entrenamiento'; // Default
};

// Función para parsear fechas sin problemas de timezone
// Si la fecha viene como string ISO (ej: "2025-10-15T00:00:00Z"), extraer solo la parte de fecha
const parseDateString = (dateString: string): Date => {
  // Si la fecha viene como string ISO, extraer solo la parte de fecha (YYYY-MM-DD)
  const dateOnly = dateString.split('T')[0];
  const [yearStr, monthStr, dayStr] = dateOnly.split('-');
  const year = Number(yearStr) || 0;
  const month = Number(monthStr) || 1;
  const day = Number(dayStr) || 1;
  // Crear fecha en zona horaria local para evitar problemas de conversión
  return new Date(year, month - 1, day);
};

// Función para transformar workouts del backend al formato esperado
// Siguiendo el mismo patrón que AthletePerformanceView
const transformWorkoutToSession = (workout: CompletedWorkoutResponseDto, athleteId: string): TrainingSession => {
  // El backend entrega la distancia en metros → convertir a kilómetros (igual que en AthletePerformanceView)
  const distanceKm = workout.distance / 1000;
  
  // Calcular maxHR desde los laps si están disponibles (igual que en PerformanceView)
  let maxHR = workout.averageHR;
  if (workout.laps && workout.laps.length > 0) {
    const maxHRFromLaps = Math.max(...workout.laps.map(lap => lap.averageHR));
    maxHR = Math.max(maxHR, maxHRFromLaps);
  } else {
    // Estimación conservadora: averageHR + 15 (igual que en PerformanceView)
    maxHR = workout.averageHR + 15;
  }

  // Duration viene en segundos según el DTO
  const durationMinutes = workout.duration / 60;

  return {
    id: workout.id.toString(),
    date: workout.date,
    athleteId: athleteId,
    name: workout.name || workout.trainingSessionName,
    type: getTrainingType(workout.name || workout.trainingSessionName),
    category: workout.category,
    distance: distanceKm, // En km
    duration: Math.round(durationMinutes), // En minutos
    avgPace: calculatePace(distanceKm, workout.duration), // distance en km, duration en segundos
    avgHR: workout.averageHR,
    maxHR: Math.round(maxHR),
    plannedDistance: undefined, // No disponible en el DTO actual
    plannedDuration: undefined, // No disponible en el DTO actual
    status: workout.feedback ? 'completed' : 'completed' // Todos los workouts son completados
  };
};

export function ReportsView({ planningId }: ReportsViewProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');
  const [periodType, setPeriodType] = useState<PeriodType>('last4weeks');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [reportView, setReportView] = useState<'overview' | 'detailed'>('overview');
  const [athletes, setAthletes] = useState<AthleteResponseDto[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);

  // Cargar atletas del coach
  useEffect(() => {
    const loadAthletes = async () => {
      setIsLoadingAthletes(true);
      try {
        const athletesList = await CoachAthleteRelationshipService.getMyAthletes();
        setAthletes(athletesList);
      } catch (error) {
        console.error('Error al cargar atletas:', error);
        toast.error('Error al cargar la lista de atletas');
      } finally {
        setIsLoadingAthletes(false);
      }
    };
    loadAthletes();
  }, []);

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

  // Cargar workouts del backend cuando cambian los filtros
  useEffect(() => {
    const loadWorkouts = async () => {
      if (!dateRange.from || !dateRange.to) {
        // Si no hay rango de fechas válido, limpiar las sesiones
        setTrainingSessions([]);
        return;
      }

      setIsLoading(true);
      // Limpiar sesiones anteriores mientras se cargan las nuevas para evitar mostrar datos incorrectos
      setTrainingSessions([]);
      
      try {
        // Formatear fechas correctamente: startDate a las 00:00, endDate a las 23:59
        const startDateObj = new Date(dateRange.from);
        startDateObj.setHours(0, 0, 0, 0);
        const startDate = format(startDateObj, 'yyyy-MM-dd');
        
        const endDateObj = new Date(dateRange.to);
        endDateObj.setHours(23, 59, 59, 999);
        const endDate = format(endDateObj, 'yyyy-MM-dd');

        const filters: {
          planningId?: number;
          athleteId?: number;
          startDate: string;
          endDate: string;
        } = {
          startDate,
          endDate
        };

        if (planningId && planningId !== 'all') {
          filters.planningId = parseInt(planningId);
        }

        if (selectedAthleteId !== 'all') {
          filters.athleteId = parseInt(selectedAthleteId);
        }

        const groupedWorkouts = await CompletedWorkoutService.getForCoachWithFiltersGroupedByAthlete(filters);
        
        // Transformar workouts agrupados a sesiones planas
        const sessions: TrainingSession[] = [];
        groupedWorkouts.forEach(group => {
          group.workouts.forEach(workout => {
            sessions.push(transformWorkoutToSession(workout, group.athleteId.toString()));
          });
        });

        setTrainingSessions(sessions);
      } catch (error) {
        console.error('Error al cargar workouts:', error);
        toast.error('Error al cargar los entrenamientos');
        // En caso de error, asegurarse de que las sesiones estén vacías
        setTrainingSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkouts();
  }, [dateRange.from, dateRange.to, selectedAthleteId, planningId]);

  // Las sesiones ya vienen filtradas del backend por atleta y rango de fechas
  // No necesitamos filtrar nuevamente en el frontend
  const filteredSessions = useMemo(() => {
    return trainingSessions;
  }, [trainingSessions]);

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

    // Distribución por categoría (Entrenamientos, Competiciones Preparatorias, Competencias)
    const categoryDistribution: Record<string, number> = {
      'Entrenamientos': 0,
      'Competiciones Preparatorias': 0,
      'Competencias': 0
    };
    filteredSessions.forEach(s => {
      // Normalizar la categoría: el backend devuelve en camelCase (training, prepCompetition, mainCompetition)
      // Convertimos a minúsculas para normalizar la comparación
      const category = s.category?.toLowerCase() || 'training';
      if (category === 'training') {
        categoryDistribution['Entrenamientos']++;
      } else if (category === 'prepcompetition') {
        categoryDistribution['Competiciones Preparatorias']++;
      } else if (category === 'maincompetition') {
        categoryDistribution['Competencias']++;
      }
    });

    return {
      totalSessions,
      completedSessions,
      totalDistance,
      totalDuration,
      avgPace,
      avgHR,
      completionRate,
      categoryDistribution
    };
  }, [filteredSessions]);

  // Datos para gráfico de volumen semanal
  const weeklyVolumeData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return [];
    }

    const weekMap: Record<string, { weekKey: string; week: string; distance: number; sessions: number }> = {};
    
    // Primero, generar todas las semanas del rango de fechas
    const startWeek = startOfWeek(dateRange.from, { weekStartsOn: 1 });
    const endWeek = startOfWeek(dateRange.to, { weekStartsOn: 1 });
    
    let currentWeek = new Date(startWeek);
    while (currentWeek <= endWeek) {
      const weekKey = format(currentWeek, 'yyyy-MM-dd');
      const weekLabel = format(currentWeek, 'dd MMM', { locale: es });
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { weekKey, week: weekLabel, distance: 0, sessions: 0 };
      }
      
      // Avanzar a la siguiente semana
      currentWeek = new Date(currentWeek);
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    
    // Luego, agregar los datos de las sesiones
    filteredSessions.forEach(session => {
      const sessionDate = parseDateString(session.date);
      const weekStart = startOfWeek(sessionDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (weekMap[weekKey]) {
        weekMap[weekKey].distance += session.distance;
        weekMap[weekKey].sessions += 1;
      }
    });

    // Redondear distancia a 2 decimales y ordenar por weekKey (fecha)
    return Object.values(weekMap)
      .map(week => ({
        ...week,
        distance: Math.round(week.distance * 100) / 100
      }))
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  }, [filteredSessions, dateRange.from, dateRange.to]);

  // Datos para gráfico de distribución por categoría
  const categoryDistributionData = useMemo(() => {
    return Object.entries(metrics.categoryDistribution)
      .filter(([_, count]) => count > 0) // Solo mostrar categorías con datos
      .map(([category, count]) => ({
        name: category,
        value: count
      }));
  }, [metrics.categoryDistribution]);

  // Colores para el gráfico de distribución
  const COLORS = ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#1e293b'];

  const selectedAthlete = selectedAthleteId === 'all' 
    ? null 
    : athletes.find(a => a.id.toString() === selectedAthleteId);

  // Función para exportar datos a CSV
  const handleExportToCSV = () => {
    if (filteredSessions.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Crear encabezados del CSV
    const headers = [
      'Fecha',
      ...(selectedAthleteId === 'all' ? ['Atleta'] : []),
      'Sesión',
      'Categoría',
      'Distancia (km)',
      'Duración (min)',
      'Ritmo (min/km)',
      'FC Promedio (bpm)',
      'FC Máxima (bpm)',
      'Estado'
    ];

    // Crear filas de datos
    const rows = filteredSessions.map(session => {
      const athlete = athletes.find(a => a.id.toString() === session.athleteId);
      const row = [
        format(parseDateString(session.date), 'yyyy-MM-dd'),
        ...(selectedAthleteId === 'all' ? [athlete?.name || 'Desconocido'] : []),
        session.name,
        formatCategory(session.category),
        session.distance.toFixed(2),
        session.duration.toString(),
        session.avgPace,
        session.avgHR?.toString() || 'N/A',
        session.maxHR?.toString() || 'N/A',
        session.status === 'completed' ? 'Completada' :
        session.status === 'partial' ? 'Parcial' : 'Planificada'
      ];
      return row;
    });

    // Función para escapar valores CSV (manejar comas y comillas)
    const escapeCSVValue = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Construir el contenido CSV
    let csvContent = '';

    // Agregar información del reporte al inicio
    csvContent += 'REPORTE DE ENTRENAMIENTOS\n';
    csvContent += `Periodo: ${dateRange.from ? format(dateRange.from, 'dd/MM/yyyy', { locale: es }) : 'N/A'} - ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy', { locale: es }) : 'N/A'}\n`;
    if (selectedAthlete) {
      csvContent += `Atleta: ${selectedAthlete.name}\n`;
    } else {
      csvContent += 'Atleta: Todos los atletas\n';
    }
    csvContent += '\n';

    // Agregar métricas resumidas
    csvContent += 'MÉTRICAS RESUMIDAS\n';
    csvContent += `Total Sesiones,${metrics.totalSessions}\n`;
    csvContent += `Sesiones Completadas,${metrics.completedSessions}\n`;
    csvContent += `Distancia Total (km),${metrics.totalDistance.toFixed(2)}\n`;
    csvContent += `Duración Total (horas),${(metrics.totalDuration / 60).toFixed(2)}\n`;
    csvContent += `Ritmo Promedio (min/km),${metrics.avgPace}\n`;
    csvContent += `FC Promedio (bpm),${metrics.avgHR || 'N/A'}\n`;
    csvContent += `Cumplimiento,${metrics.completionRate}%\n`;
    csvContent += '\n';

    // Agregar distribución por categoría
    csvContent += 'DISTRIBUCIÓN POR CATEGORÍA\n';
    Object.entries(metrics.categoryDistribution).forEach(([category, count]) => {
      csvContent += `${category},${count}\n`;
    });
    csvContent += '\n';

    // Agregar encabezados de la tabla
    csvContent += headers.map(escapeCSVValue).join(',') + '\n';

    // Agregar filas de datos
    rows.forEach(row => {
      csvContent += row.map(escapeCSVValue).join(',') + '\n';
    });

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generar nombre de archivo con fecha y atleta
    const fileName = `reporte_entrenamientos_${
      dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : 'all'
    }_${
      dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : 'all'
    }${
      selectedAthlete ? `_${selectedAthlete.name.replace(/\s+/g, '_')}` : '_todos'
    }.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Reporte exportado correctamente');
  };

  return (
    <div className="space-y-6">
      {/* Loader mientras se cargan las sesiones */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Cargando sesiones...</p>
            <p className="text-sm text-muted-foreground">Por favor espera mientras se obtienen los datos</p>
          </div>
        </div>
      )}

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
                    <SelectItem key={athlete.id} value={athlete.id.toString()}>
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
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportToCSV}
              disabled={filteredSessions.length === 0 || isLoading}
            >
              <Download className="w-4 h-4" />
              Exportar CSV
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Cargando datos del resumen...</p>
            </div>
          ) : (
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
                      <Tooltip formatter={(value: number) => `${value.toFixed(2)} km`} />
                      <Legend />
                      <Bar dataKey="distance" fill="#06b6d4" name="Distancia (km)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de distribución por categoría */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Categoría</CardTitle>
                  <CardDescription>
                    Sesiones según categoría: Entrenamientos, Competiciones Preparatorias y Competencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
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
                      <th className="p-3 text-left">Categoría</th>
                      <th className="p-3 text-right">Distancia</th>
                      <th className="p-3 text-right">Duración</th>
                      <th className="p-3 text-right">Ritmo</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.length > 0 ? (
                      filteredSessions.map((session) => {
                        const athlete = athletes.find(a => a.id.toString() === session.athleteId);
                        return (
                          <tr key={session.id} className="border-b">
                            <td className="p-3">
                              {format(parseDateString(session.date), 'dd MMM yyyy', { locale: es })}
                            </td>
                            {selectedAthleteId === 'all' && (
                              <td className="p-3">{athlete?.name || 'Desconocido'}</td>
                            )}
                            <td className="p-3 font-medium">{session.name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{formatCategory(session.category)}</Badge>
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
