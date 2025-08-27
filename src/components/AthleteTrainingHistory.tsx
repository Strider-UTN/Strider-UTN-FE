import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Clock,
  Activity,
  Heart,
  Zap,
  TrendingUp,
  Target,
  Eye,
  MessageSquare,
  BarChart3,
  Trophy,
  MapPin,
  Thermometer,
  Wind,
  CheckCircle,
  AlertCircle,
  Star,
  X,
  FilterX
} from 'lucide-react';
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { CoachFeedbackView } from './CoachFeedbackView';

interface IndividualAthlete {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface TrainingSession {
  id: string;
  athleteId: string;
  date: string;
  name: string;
  type: string;
  duration: number; // en minutos
  distance: number; // en km
  avgPace: string;
  avgHR?: number;
  maxHR?: number;
  calories?: number;
  elevationGain?: number;
  weather?: {
    temperature: number;
    condition: string;
  };
  location?: string;
  status: 'completed' | 'partial' | 'skipped';
  rating?: number; // 1-5 estrellas
  notes?: string;
  coachNotes?: string;
  plannedDistance?: number;
  plannedDuration?: number;
  compliance?: number; // porcentaje de cumplimiento
  intervals?: {
    id: string;
    type: 'active' | 'recovery';
    duration: number;
    distance?: number;
    pace: string;
    avgHR?: number;
  }[];
  zones?: {
    zone1: number; // porcentajes de tiempo en cada zona
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

interface AthleteTrainingHistoryProps {
  athlete: IndividualAthlete;
  onBack: () => void;
  showFeedbackInitially?: boolean;
}

// Datos mock de entrenamientos - ahora incluye entrenamientos para el atleta con ID '1'
const mockTrainingData: TrainingSession[] = [
  {
    id: 'training_1',
    athleteId: '1',
    date: '2024-01-20',
    name: 'Tempo Run 10K',
    type: 'Tempo',
    duration: 48,
    distance: 10.5,
    avgPace: '4:37',
    avgHR: 165,
    maxHR: 178,
    calories: 525,
    elevationGain: 85,
    weather: {
      temperature: 18,
      condition: 'Despejado'
    },
    location: 'Parque del Retiro',
    status: 'completed',
    rating: 4,
    notes: 'Me sentí muy bien, especialmente en los últimos kilómetros',
    plannedDistance: 10.0,
    plannedDuration: 50,
    compliance: 92,
    zones: {
      zone1: 15,
      zone2: 25,
      zone3: 35,
      zone4: 20,
      zone5: 5
    }
  },
  {
    id: 'training_2',
    athleteId: '1',
    date: '2024-01-18',
    name: 'Intervalos 5x1000m',
    type: 'Intervalos',
    duration: 35,
    distance: 6.8,
    avgPace: '4:12',
    avgHR: 178,
    maxHR: 188,
    calories: 385,
    elevationGain: 45,
    weather: {
      temperature: 15,
      condition: 'Nublado'
    },
    location: 'Pista de atletismo',
    status: 'completed',
    rating: 5,
    coachNotes: 'Excelente progresión en los intervalos. Mantener este ritmo.',
    plannedDistance: 7.0,
    plannedDuration: 40,
    compliance: 88,
    intervals: [
      {
        id: 'int_1',
        type: 'active',
        duration: 4,
        distance: 1.0,
        pace: '3:58',
        avgHR: 182
      },
      {
        id: 'int_2',
        type: 'recovery',
        duration: 2,
        distance: 0.2,
        pace: '6:30',
        avgHR: 145
      }
    ],
    zones: {
      zone1: 10,
      zone2: 15,
      zone3: 25,
      zone4: 35,
      zone5: 15
    }
  },
  {
    id: 'training_3',
    athleteId: '1',
    date: '2024-01-16',
    name: 'Carrera Larga',
    type: 'Continuo',
    duration: 92,
    distance: 18.5,
    avgPace: '5:01',
    avgHR: 152,
    maxHR: 168,
    calories: 925,
    elevationGain: 235,
    weather: {
      temperature: 12,
      condition: 'Lluvia ligera'
    },
    location: 'Sendero montañoso',
    status: 'completed',
    rating: 3,
    notes: 'Lluvia durante los últimos 8km, pero logré mantener el ritmo',
    plannedDistance: 18.0,
    plannedDuration: 95,
    compliance: 96,
    zones: {
      zone1: 30,
      zone2: 45,
      zone3: 20,
      zone4: 5,
      zone5: 0
    }
  },
  {
    id: 'training_4',
    athleteId: '1',
    date: '2024-01-14',
    name: 'Recuperación Activa',
    type: 'Recuperación',
    duration: 30,
    distance: 5.2,
    avgPace: '5:45',
    avgHR: 138,
    maxHR: 152,
    calories: 245,
    elevationGain: 15,
    weather: {
      temperature: 20,
      condition: 'Soleado'
    },
    location: 'Parque local',
    status: 'completed',
    rating: 4,
    notes: 'Perfecto para recuperar después del entrenamiento intenso',
    plannedDistance: 5.0,
    plannedDuration: 30,
    compliance: 98,
    zones: {
      zone1: 60,
      zone2: 35,
      zone3: 5,
      zone4: 0,
      zone5: 0
    }
  },
  {
    id: 'training_5',
    athleteId: '1',
    date: '2024-01-12',
    name: 'Fartlek 8x2min',
    type: 'Fartlek',
    duration: 45,
    distance: 8.2,
    avgPace: '4:28',
    avgHR: 168,
    maxHR: 185,
    calories: 445,
    elevationGain: 65,
    status: 'partial',
    rating: 2,
    notes: 'Solo completé 6 repeticiones, me sentí muy fatigado',
    plannedDistance: 9.0,
    plannedDuration: 50,
    compliance: 75
  },
  {
    id: 'training_6',
    athleteId: '1',
    date: '2024-01-10',
    name: 'Test 5K',
    type: 'Test',
    duration: 22,
    distance: 5.0,
    avgPace: '4:24',
    avgHR: 175,
    maxHR: 189,
    calories: 285,
    status: 'completed',
    rating: 5,
    notes: '¡Nuevo récord personal! Me sentí increíble',
    coachNotes: 'Excelente marca. Preparado para objetivos más ambiciosos.',
    plannedDistance: 5.0,
    plannedDuration: 25,
    compliance: 100
  },
  // Entrenamientos adicionales para otros atletas para tener variedad
  {
    id: 'training_7',
    athleteId: '2',
    date: '2024-01-19',
    name: 'Intervalos 4x800m',
    type: 'Intervalos',
    duration: 28,
    distance: 5.5,
    avgPace: '4:05',
    avgHR: 182,
    maxHR: 190,
    status: 'completed',
    rating: 4,
    compliance: 94
  },
  {
    id: 'training_8',
    athleteId: '3',
    date: '2024-01-17',
    name: 'Carrera Base',
    type: 'Continuo',
    duration: 60,
    distance: 12.0,
    avgPace: '5:15',
    avgHR: 145,
    maxHR: 162,
    status: 'completed',
    rating: 4,
    compliance: 98
  }
];

export function AthleteTrainingHistory({ athlete, onBack, showFeedbackInitially = false }: AthleteTrainingHistoryProps) {
  const [selectedTraining, setSelectedTraining] = useState<TrainingSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateCalendarOpen, setIsDateCalendarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'history' | 'feedback'>('history');

  // Filtrar entrenamientos del atleta específico
  const athleteTrainings = mockTrainingData.filter(training => training.athleteId === athlete.id);

  // Efecto para mostrar retroalimentación automáticamente si hay entrenamientos
  useEffect(() => {
    if (showFeedbackInitially && athleteTrainings.length > 0) {
      setCurrentView('feedback');
    }
  }, [showFeedbackInitially, athleteTrainings.length]);

  // Si debe mostrar la vista de retroalimentación
  if (currentView === 'feedback') {
    return (
      <div className="space-y-6">
        {/* Header con botón de regreso y navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Atletas
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Retroalimentación - {athlete.name}
              </h2>
              <p className="text-muted-foreground">
                Proporciona feedback detallado para los entrenamientos
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentView('history')}
          >
            <Activity className="w-4 h-4 mr-2" />
            Ver Historial
          </Button>
        </div>

        {/* Componente de retroalimentación filtrado por atleta */}
        <div className="border rounded-lg">
          <CoachFeedbackView />
        </div>
      </div>
    );
  }

  // Aplicar filtros
  const filteredTrainings = athleteTrainings.filter(training => {
    const matchesSearch = training.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || training.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || training.status === statusFilter;
    const matchesDate = filterByDate(training.date);
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  function filterByDate(trainingDate: string) {
    const trainingDateObj = startOfDay(new Date(trainingDate));
    
    switch (dateFilter) {
      case 'all':
        return true;
      case 'specific':
        if (!selectedDate) return true;
        return isEqual(trainingDateObj, startOfDay(selectedDate));
      case 'last7days':
        return isAfter(trainingDateObj, startOfDay(subDays(new Date(), 7)));
      case 'last30days':
        return isAfter(trainingDateObj, startOfDay(subDays(new Date(), 30)));
      case 'thisweek':
        return isAfter(trainingDateObj, startOfDay(subWeeks(new Date(), 1)));
      case 'thismonth':
        return isAfter(trainingDateObj, startOfDay(subMonths(new Date(), 1)));
      default:
        return true;
    }
  }

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSelectedDate(undefined);
    toast.success('Todos los filtros han sido limpiados');
  };

  const handleViewDetails = (training: TrainingSession) => {
    setSelectedTraining(training);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Parcial</Badge>;
      case 'skipped':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Omitido</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      'Tempo': 'bg-blue-100 text-blue-800',
      'Intervalos': 'bg-red-100 text-red-800',
      'Continuo': 'bg-green-100 text-green-800',
      'Recuperación': 'bg-purple-100 text-purple-800',
      'Fartlek': 'bg-orange-100 text-orange-800',
      'Test': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <Badge className={`${typeColors[type] || 'bg-gray-100 text-gray-800'} hover:bg-current`}>
        {type}
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Estadísticas generales
  const totalDistance = athleteTrainings.reduce((sum, t) => sum + t.distance, 0);
  const totalDuration = athleteTrainings.reduce((sum, t) => sum + t.duration, 0);
  const avgPace = athleteTrainings.length > 0 
    ? athleteTrainings.reduce((sum, t) => {
        const [mins, secs] = t.avgPace.split(':').map(Number);
        return sum + (mins * 60 + secs);
      }, 0) / athleteTrainings.length
    : 0;
  const completedTrainings = athleteTrainings.filter(t => t.status === 'completed').length;

  const formatAvgPace = (avgSeconds: number) => {
    const mins = Math.floor(avgSeconds / 60);
    const secs = Math.round(avgSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uniqueTypes = [...new Set(athleteTrainings.map(t => t.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Entrenamientos de {athlete.name}
            </h2>
            <p className="text-muted-foreground">
              Historial completo de entrenamientos y análisis de rendimiento
            </p>
          </div>
        </div>
        {athleteTrainings.length > 0 && (
          <Button
            onClick={() => setCurrentView('feedback')}
            className="bg-accent hover:bg-accent/90"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Retroalimentación
          </Button>
        )}
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entrenamientos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{athleteTrainings.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTrainings} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalDistance.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">
              Acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatDuration(totalDuration)}</div>
            <p className="text-xs text-muted-foreground">
              En movimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ritmo Promedio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatAvgPace(avgPace)}/km</div>
            <p className="text-xs text-muted-foreground">
              General
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              Filtros de Entrenamientos
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs"
            >
              <FilterX className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tipo de Entrenamiento */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="partial">Parciales</SelectItem>
                  <SelectItem value="skipped">Omitidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Específica */}
            <div className="space-y-2">
              <Label>Fecha Específica</Label>
              <Popover open={isDateCalendarOpen} onOpenChange={setIsDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDateFilter(date ? 'specific' : 'all');
                      setIsDateCalendarOpen(false);
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Rango de Fechas */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateFilter} onValueChange={(value) => {
                setDateFilter(value);
                if (value !== 'specific') {
                  setSelectedDate(undefined);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="last7days">Últimos 7 días</SelectItem>
                  <SelectItem value="thisweek">Esta semana</SelectItem>
                  <SelectItem value="last30days">Últimos 30 días</SelectItem>
                  <SelectItem value="thismonth">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros activos */}
          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || selectedDate) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Búsqueda: "{searchTerm}"
                  </Badge>
                )}
                {typeFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Tipo: {typeFilter}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Estado: {statusFilter === 'completed' ? 'Completados' : 
                             statusFilter === 'partial' ? 'Parciales' : 'Omitidos'}
                  </Badge>
                )}
                {(dateFilter !== 'all' || selectedDate) && (
                  <Badge variant="secondary" className="text-xs">
                    Fecha: {selectedDate ? 
                      format(selectedDate, "dd/MM/yyyy", { locale: es }) :
                      dateFilter === 'last7days' ? 'Últimos 7 días' :
                      dateFilter === 'thisweek' ? 'Esta semana' :
                      dateFilter === 'last30days' ? 'Últimos 30 días' :
                      dateFilter === 'thismonth' ? 'Este mes' : dateFilter
                    }
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  ({filteredTrainings.length} entrenamiento{filteredTrainings.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Entrenamientos */}
      {filteredTrainings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {athleteTrainings.length === 0 ? 'Sin entrenamientos registrados' : 'Sin resultados'}
            </h3>
            <p className="text-muted-foreground">
              {athleteTrainings.length === 0 
                ? 'Este atleta aún no tiene entrenamientos registrados'
                : 'No hay entrenamientos que coincidan con los filtros seleccionados'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTrainings.map((training) => (
            <Card key={training.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{training.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {getTypeBadge(training.type)}
                            {getStatusBadge(training.status)}
                            {training.rating && renderStars(training.rating)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(training.date), "dd 'de' MMM, yyyy", { locale: es })}
                        </p>
                        {training.compliance && (
                          <Badge variant="outline" className={`mt-1 ${
                            training.compliance >= 90 ? 'text-green-600' :
                            training.compliance >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {training.compliance}% cumplimiento
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{training.distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDuration(training.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span>{training.avgPace}/km</span>
                      </div>
                      {training.avgHR && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-muted-foreground" />
                          <span>{training.avgHR} bpm</span>
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {training.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{training.location}</span>
                        </div>
                      )}
                      {training.weather && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-muted-foreground" />
                          <span>{training.weather.temperature}°C - {training.weather.condition}</span>
                        </div>
                      )}
                      {training.calories && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-muted-foreground" />
                          <span>{training.calories} kcal</span>
                        </div>
                      )}
                      {training.elevationGain && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span>{training.elevationGain}m desnivel</span>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {(training.notes || training.coachNotes) && (
                      <div className="space-y-2">
                        {training.notes && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-800">Notas del atleta:</p>
                            <p className="text-sm text-blue-700 mt-1">{training.notes}</p>
                          </div>
                        )}
                        {training.coachNotes && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-800">Notas del entrenador:</p>
                            <p className="text-sm text-green-700 mt-1">{training.coachNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleViewDetails(training)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      {!training.coachNotes && (
                        <Button 
                          size="sm"
                          className="bg-accent hover:bg-accent/90"
                          onClick={() => setCurrentView('feedback')}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Agregar Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalles (placeholder para futura implementación) */}
      {selectedTraining && (
        <div className="hidden">
          {/* Aquí se implementaría el modal de detalles del entrenamiento */}
          {/* Podría reutilizar TrainingDetailModal existente */}
        </div>
      )}
    </div>
  );
}