import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Calendar as CalendarIcon,
  Filter,
  CheckCircle,
  AlertCircle,
  Search,
  Send,
  Eye,
  Target,
  Activity,
  Heart,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Timer,
  BarChart3,
  MessageCircle,
  Plus,
  X,
  Users,
  FilterX
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Team {
  id: string;
  name: string;
  coachId: string;
}

interface Interval {
  id: string;
  number: number;
  type: 'active' | 'recovery';
  plannedDuration: number; // en segundos
  actualDuration: number;
  plannedDistance?: number; // en metros
  actualDistance?: number;
  plannedPace: string;
  actualPace: string;
  plannedHR?: number;
  actualHR?: number;
  maxHR?: number;
  notes?: string;
  coachFeedback?: string;
  compliance: number; // porcentaje de cumplimiento
}

interface TrainingSession {
  id: string;
  athleteId: string;
  athleteName: string;
  teamId: string;
  teamName: string;
  date: string;
  name: string;
  type: string;
  duration: number;
  distance: number;
  avgPace: string;
  avgHR: number;
  maxHR: number;
  status: 'pending' | 'reviewed' | 'commented';
  intervals: Interval[];
  plannedVsActual: {
    plannedDistance: number;
    actualDistance: number;
    plannedPace: string;
    actualPace: string;
    plannedAvgHR: number;
    actualAvgHR: number;
    intervalsPlanned: number;
    intervalsCompleted: number;
    timeInTargetZone: number;
    overallCompliance: number;
    coachNotes?: string;
    deviations?: string[];
  };

  environmentalFactors?: {
    temperature?: number;
    humidity?: number;
    wind?: string;
    weather?: string;
  };
  surfaceType?: string;
  elevation?: string;
  location?: string;
  terrainType?: string;
  injuryDuringTraining?: string;
  equipmentIssues?: string;
  nutritionHydration?: string;
  sleepQuality?: number;
  sleepHours?: string;
  athleteNotes?: string;
  comments?: string;
}

interface FeedbackData {
  id: string;
  sessionId: string;
  coachId: string;
  athleteId: string;
  date: string;
  ratings: {
    progress: number;
  };
  comments: string;
  recommendations: string;
  nextFocus: string[];
  isRead: boolean;
}

// Datos mock de equipos
const mockTeams: Team[] = [
  { id: 'team_1', name: 'Velocistas Elite', coachId: 'coach_1' },
  { id: 'team_2', name: 'Medio Fondo', coachId: 'coach_1' },
  { id: 'team_3', name: 'Fondo Avanzado', coachId: 'coach_1' },
  { id: 'team_4', name: 'Juvenil Mixto', coachId: 'coach_1' },
];

const mockSessions: TrainingSession[] = [
  {
    id: 'session_1',
    athleteId: 'athlete_1',
    athleteName: 'Carlos Mendoza',
    teamId: 'team_1',
    teamName: 'Velocistas Elite',
    date: '2024-01-20',
    name: 'Tempo Run 10K',
    type: 'Tempo',
    duration: 48,
    distance: 10.5,
    avgPace: '4:37',
    avgHR: 165,
    maxHR: 178,
    status: 'pending',
    intervals: [
      {
        id: 'int_1_1',
        number: 1,
        type: 'active',
        plannedDuration: 600,
        actualDuration: 595,
        plannedDistance: 2000,
        actualDistance: 2100,
        plannedPace: '4:45',
        actualPace: '4:32',
        plannedHR: 160,
        actualHR: 165,
        maxHR: 170,
        compliance: 92
      },
      {
        id: 'int_1_2',
        number: 2,
        type: 'recovery',
        plannedDuration: 120,
        actualDuration: 125,
        plannedDistance: 400,
        actualDistance: 380,
        plannedPace: '5:30',
        actualPace: '5:45',
        plannedHR: 130,
        actualHR: 135,
        compliance: 88
      },
      {
        id: 'int_1_3',
        number: 3,
        type: 'active',
        plannedDuration: 600,
        actualDuration: 580,
        plannedDistance: 2000,
        actualDistance: 2050,
        plannedPace: '4:45',
        actualPace: '4:38',
        plannedHR: 160,
        actualHR: 162,
        maxHR: 168,
        compliance: 95
      }
    ],
    plannedVsActual: {
      plannedDistance: 10.0,
      actualDistance: 10.5,
      plannedPace: '4:45',
      actualPace: '4:37',
      plannedAvgHR: 160,
      actualAvgHR: 165,
      intervalsPlanned: 8,
      intervalsCompleted: 8,
      timeInTargetZone: 92,
      overallCompliance: 88,
      coachNotes: 'Mantener ritmo constante en los primeros 6km, luego acelerar progresivamente.',
      deviations: ['Ritmo ligeramente más rápido en los primeros 3km']
    },
    environmentalFactors: {
      temperature: 22,
      humidity: 65,
      wind: 'Viento ligero del norte (5 km/h)',
      weather: 'Parcialmente nublado'
    },
    surfaceType: 'Asfalto',
    elevation: '650m sobre el nivel del mar',
    location: 'Parque Central - Circuito Norte',
    terrainType: 'Plano con ligeras ondulaciones',
    nutritionHydration: 'Hidratación cada 20 minutos, gel energético en km 6',
    sleepQuality: 7,
    sleepHours: '7.5 horas',
    athleteNotes: 'Me sentí bien durante todo el entrenamiento. Las piernas respondieron bien en los últimos kilómetros.'
  },
  {
    id: 'session_2',
    athleteId: 'athlete_2',
    athleteName: 'Ana Rodríguez',
    teamId: 'team_2',
    teamName: 'Medio Fondo',
    date: '2024-01-19',
    name: 'Intervalos 5x1000m',
    type: 'Intervalos',
    duration: 35,
    distance: 6.8,
    avgPace: '4:12',
    avgHR: 178,
    maxHR: 188,
    status: 'pending',
    intervals: [
      {
        id: 'int_2_1',
        number: 1,
        type: 'active',
        plannedDuration: 240,
        actualDuration: 238,
        plannedDistance: 1000,
        actualDistance: 1000,
        plannedPace: '4:00',
        actualPace: '3:58',
        plannedHR: 180,
        actualHR: 182,
        maxHR: 185,
        compliance: 98
      },
      {
        id: 'int_2_2',
        number: 2,
        type: 'recovery',
        plannedDuration: 120,
        actualDuration: 118,
        plannedDistance: 200,
        actualDistance: 180,
        plannedPace: '6:00',
        actualPace: '6:30',
        plannedHR: 140,
        actualHR: 145,
        compliance: 85
      },
      {
        id: 'int_2_3',
        number: 3,
        type: 'active',
        plannedDuration: 240,
        actualDuration: 245,
        plannedDistance: 1000,
        actualDistance: 1000,
        plannedPace: '4:00',
        actualPace: '4:05',
        plannedHR: 180,
        actualHR: 178,
        maxHR: 183,
        compliance: 94
      },
      {
        id: 'int_2_4',
        number: 4,
        type: 'recovery',
        plannedDuration: 120,
        actualDuration: 125,
        plannedDistance: 200,
        actualDistance: 200,
        plannedPace: '6:00',
        actualPace: '6:15',
        plannedHR: 140,
        actualHR: 142,
        compliance: 92
      },
      {
        id: 'int_2_5',
        number: 5,
        type: 'active',
        plannedDuration: 240,
        actualDuration: 235,
        plannedDistance: 1000,
        actualDistance: 1000,
        plannedPace: '4:00',
        actualPace: '3:55',
        plannedHR: 180,
        actualHR: 185,
        maxHR: 188,
        compliance: 96
      }
    ],
    plannedVsActual: {
      plannedDistance: 6.5,
      actualDistance: 6.8,
      plannedPace: '4:30',
      actualPace: '4:12',
      plannedAvgHR: 175,
      actualAvgHR: 178,
      intervalsPlanned: 5,
      intervalsCompleted: 5,
      timeInTargetZone: 85,
      overallCompliance: 95,
      coachNotes: 'Intervalos de 1000m con 2 minutos de descanso. Mantener zona 4-5 de FC.',
      deviations: []
    },
    environmentalFactors: {
      temperature: 18,
      humidity: 72,
      wind: 'Viento moderado del oeste (12 km/h)',
      weather: 'Lluvia ligera intermitente'
    },
    surfaceType: 'Pista de atletismo',
    elevation: 'Nivel del mar',
    location: 'Estadio Municipal - Pista 400m',
    terrainType: 'Superficie sintética plana',
    equipmentIssues: 'Zapatillas de clavos resbaladizas por la humedad',
    nutritionHydration: 'Solo hidratación ligera antes del entrenamiento',
    sleepQuality: 6,
    sleepHours: '6.5 horas',
    athleteNotes: 'La lluvia me dificultó mantener el ritmo en los últimos dos intervalos. Me sentí menos segura con los clavos.'
  },
  {
    id: 'session_3',
    athleteId: 'athlete_3',
    athleteName: 'Miguel Torres',
    teamId: 'team_3',
    teamName: 'Fondo Avanzado',
    date: '2024-01-18',
    name: 'Carrera Larga',
    type: 'Continuo',
    duration: 92,
    distance: 18.5,
    avgPace: '5:01',
    avgHR: 152,
    maxHR: 168,
    status: 'reviewed',
    intervals: [],
    plannedVsActual: {
      plannedDistance: 18.0,
      actualDistance: 18.5,
      plannedPace: '5:10',
      actualPace: '5:01',
      plannedAvgHR: 150,
      actualAvgHR: 152,
      intervalsPlanned: 1,
      intervalsCompleted: 1,
      timeInTargetZone: 90,
      overallCompliance: 94,
      coachNotes: 'Carrera continua en zona aeróbica.',
      deviations: ['Ritmo ligeramente más rápido en los últimos 5km']
    },
    environmentalFactors: {
      temperature: 25,
      humidity: 45,
      wind: 'Sin viento',
      weather: 'Soleado y despejado'
    },
    surfaceType: 'Sendero de tierra compactada',
    elevation: '1200m sobre el nivel del mar',
    location: 'Sendero de Montaña - Ruta Las Cumbres',
    terrainType: 'Ondulado con subidas y bajadas moderadas',
    injuryDuringTraining: 'Molestia leve en rodilla izquierda km 12-14, se resolvió con ritmo más conservador',
    nutritionHydration: 'Hidratación cada 30 min, gel en km 10, plátano en km 15',
    sleepQuality: 8,
    sleepHours: '8 horas',
    athleteNotes: 'Excelente entrenamiento en general. La altitud se sintió en los primeros kilómetros pero me adapté bien. La molestia en la rodilla fue muy leve.',
    comments: 'Excelente ritmo mantenido. La progresión fue muy buena.'
  },
  {
    id: 'session_4',
    athleteId: 'athlete_4',
    athleteName: 'Laura García',
    teamId: 'team_4',
    teamName: 'Juvenil Mixto',
    date: '2024-01-15',
    name: 'Series 400m',
    type: 'Intervalos',
    duration: 25,
    distance: 4.2,
    avgPace: '3:45',
    avgHR: 185,
    maxHR: 195,
    status: 'pending',
    intervals: [],
    plannedVsActual: {
      plannedDistance: 4.0,
      actualDistance: 4.2,
      plannedPace: '3:50',
      actualPace: '3:45',
      plannedAvgHR: 180,
      actualAvgHR: 185,
      intervalsPlanned: 6,
      intervalsCompleted: 6,
      timeInTargetZone: 88,
      overallCompliance: 92,
      coachNotes: 'Series de 400m con recuperación completa.',
      deviations: []
    },
    environmentalFactors: {
      temperature: 28,
      humidity: 80,
      wind: 'Viento fuerte del sur (18 km/h)',
      weather: 'Caluroso y húmedo'
    },
    surfaceType: 'Pista de atletismo sintética',
    elevation: 'Nivel del mar',
    location: 'Centro Deportivo Nacional - Pista Principal',
    terrainType: 'Superficie sintética perfectamente plana',
    equipmentIssues: 'Cronómetro del entrenador falló en la serie 4, usamos cronómetro manual',
    nutritionHydration: 'Hidratación abundante por calor, bebida isotónica cada serie',
    sleepQuality: 9,
    sleepHours: '8.5 horas',
    athleteNotes: 'El calor y la humedad me afectaron bastante en las últimas series. Me costó mantener la técnica por el cansancio.'
  }
];

const mockFeedbacks: FeedbackData[] = [
  {
    id: 'feedback_1',
    sessionId: 'session_3',
    coachId: 'coach_1',
    athleteId: 'athlete_3',
    date: '2024-01-18',
    ratings: {
      progress: 8
    },
    comments: 'Excelente progresión en el ritmo. Mantuvo consistencia durante toda la sesión.',
    recommendations: 'Continúa con este ritmo de progresión.',
    nextFocus: ['Cadencia', 'Economía de carrera'],
    isRead: true
  }
];

export function CoachFeedbackView() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [athleteFilter, setAthleteFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
  const [isDateCalendarOpen, setIsDateCalendarOpen] = useState(false);
  const [isFromDateOpen, setIsFromDateOpen] = useState(false);
  const [isToDateOpen, setIsToDateOpen] = useState(false);
  const [expandedIntervals, setExpandedIntervals] = useState<string[]>([]);
  const [intervalFeedbacks, setIntervalFeedbacks] = useState<{[key: string]: string}>({});
  
  // Estado para controlar qué sesiones están expandidas
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);

  // Estado del formulario de feedback
  const [ratings, setRatings] = useState({
    progress: 5
  });
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextFocus, setNextFocus] = useState<string[]>([]);
  const [newFocusArea, setNewFocusArea] = useState('');

  // Función para alternar expansión de sesiones
  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  // Función para filtrar por fecha
  const filterByDate = (sessionDate: string) => {
    const sessionDateObj = startOfDay(new Date(sessionDate));
    
    switch (dateFilter) {
      case 'all':
        return true;
      case 'specific':
        if (!selectedDate) return true;
        return isEqual(sessionDateObj, startOfDay(selectedDate));
      case 'today':
        return isEqual(sessionDateObj, startOfDay(new Date()));
      case 'yesterday':
        return isEqual(sessionDateObj, startOfDay(subDays(new Date(), 1)));
      case 'last7days':
        return isAfter(sessionDateObj, startOfDay(subDays(new Date(), 7)));
      case 'last30days':
        return isAfter(sessionDateObj, startOfDay(subDays(new Date(), 30)));
      case 'thisweek':
        return isAfter(sessionDateObj, startOfDay(subWeeks(new Date(), 1)));
      case 'thismonth':
        return isAfter(sessionDateObj, startOfDay(subMonths(new Date(), 1)));
      case 'custom':
        if (!customDateFrom && !customDateTo) return true;
        if (customDateFrom && !customDateTo) {
          return isAfter(sessionDateObj, startOfDay(customDateFrom)) || isEqual(sessionDateObj, startOfDay(customDateFrom));
        }
        if (!customDateFrom && customDateTo) {
          return isBefore(sessionDateObj, endOfDay(customDateTo)) || isEqual(sessionDateObj, startOfDay(customDateTo));
        }
        if (customDateFrom && customDateTo) {
          return (isAfter(sessionDateObj, startOfDay(customDateFrom)) || isEqual(sessionDateObj, startOfDay(customDateFrom))) &&
                 (isBefore(sessionDateObj, endOfDay(customDateTo)) || isEqual(sessionDateObj, startOfDay(customDateTo)));
        }
        return true;
      default:
        return true;
    }
  };

  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesAthlete = athleteFilter === 'all' || session.athleteName === athleteFilter;
    const matchesTeam = teamFilter === 'all' || session.teamId === teamFilter;
    const matchesDate = filterByDate(session.date);
    
    return matchesSearch && matchesStatus && matchesAthlete && matchesTeam && matchesDate;
  });

  const pendingSessions = filteredSessions.filter(s => s.status === 'pending');
  const reviewedSessions = filteredSessions.filter(s => s.status === 'reviewed');

  const handleOpenFeedbackDialog = (session: TrainingSession) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
    // Reset form
    setRatings({
      progress: 5
    });
    setComments('');
    setRecommendations('');
    setNextFocus([]);
    setIntervalFeedbacks({});
  };

  const toggleIntervalExpansion = (intervalId: string) => {
    setExpandedIntervals(prev => 
      prev.includes(intervalId) 
        ? prev.filter(id => id !== intervalId)
        : [...prev, intervalId]
    );
  };

  const handleIntervalFeedbackChange = (intervalId: string, feedback: string) => {
    setIntervalFeedbacks(prev => ({
      ...prev,
      [intervalId]: feedback
    }));
  };

  const handleAddFocusArea = () => {
    if (newFocusArea.trim() && !nextFocus.includes(newFocusArea.trim())) {
      setNextFocus(prev => [...prev, newFocusArea.trim()]);
      setNewFocusArea('');
    }
  };

  const handleRemoveFocusArea = (area: string) => {
    setNextFocus(prev => prev.filter(f => f !== area));
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAthleteFilter('all');
    setTeamFilter('all');
    setDateFilter('all');
    setSelectedDate(undefined);
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
    toast.success('Todos los filtros han sido limpiados');
  };

  const handleSubmitFeedback = () => {
    if (!selectedSession) return;

    if (!comments.trim()) {
      toast.error('Por favor agrega comentarios sobre la sesión');
      return;
    }

    // Simular envío de feedback
    toast.success('Retroalimentación enviada correctamente');
    
    // Actualizar estado de la sesión
    const sessionIndex = mockSessions.findIndex(s => s.id === selectedSession.id);
    if (sessionIndex !== -1) {
      mockSessions[sessionIndex].status = 'reviewed';
      mockSessions[sessionIndex].comments = comments;
      
      // Guardar feedback de intervalos
      mockSessions[sessionIndex].intervals.forEach(interval => {
        if (intervalFeedbacks[interval.id]) {
          interval.coachFeedback = intervalFeedbacks[interval.id];
        }
      });
    }

    setIsDialogOpen(false);
    setSelectedSession(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return 'text-green-600 bg-green-100';
    if (compliance >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'commented': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'reviewed': return 'Revisado';
      case 'commented': return 'Comentado';
      default: return 'Desconocido';
    }
  };

  const uniqueAthletes = [...new Set(mockSessions.map(s => s.athleteName))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Retroalimentación de Entrenamientos</h2>
          <p className="text-muted-foreground">
            Revisa y proporciona retroalimentación detallada a los entrenamientos de tus atletas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{pendingSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Esperando retroalimentación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{reviewedSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Con retroalimentación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {mockSessions.filter(s => filterByDate(s.date) && dateFilter === 'thisweek').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sesiones totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mockTeams.length}</div>
            <p className="text-xs text-muted-foreground">
              Con entrenamientos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              Filtros Avanzados
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs"
            >
              <FilterX className="w-4 h-4 mr-1" />
              Limpiar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filtros Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Atleta o sesión..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filtro por Equipo */}
              <div className="space-y-2">
                <Label>Equipo</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los equipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los equipos</SelectItem>
                    {mockTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro por Atleta */}
              <div className="space-y-2">
                <Label>Atleta</Label>
                <Select value={athleteFilter} onValueChange={setAthleteFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los atletas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los atletas</SelectItem>
                    {uniqueAthletes.map(athlete => (
                      <SelectItem key={athlete} value={athlete}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {athlete}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro por Estado */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pendientes
                      </div>
                    </SelectItem>
                    <SelectItem value="reviewed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Revisados
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros de Fecha */}
            <div className="space-y-4">
              <Label>Filtrar por Fecha</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <Button
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('all')}
                  className="text-xs"
                >
                  Todas
                </Button>
                <Button
                  variant={dateFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('today')}
                  className="text-xs"
                >
                  Hoy
                </Button>
                <Button
                  variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('yesterday')}
                  className="text-xs"
                >
                  Ayer
                </Button>
                <Button
                  variant={dateFilter === 'last7days' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('last7days')}
                  className="text-xs"
                >
                  Últimos 7 días
                </Button>
                <Button
                  variant={dateFilter === 'thisweek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('thisweek')}
                  className="text-xs"
                >
                  Esta semana
                </Button>
                <Button
                  variant={dateFilter === 'thismonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('thismonth')}
                  className="text-xs"
                >
                  Este mes
                </Button>
              </div>

              {/* Selector de fecha específica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Fecha Específica</Label>
                  <Popover open={isDateCalendarOpen} onOpenChange={setIsDateCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateFilter('specific');
                          setIsDateCalendarOpen(true);
                        }}
                        className="text-xs justify-start"
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {selectedDate ? format(selectedDate, 'PP', { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setIsDateCalendarOpen(false);
                        }}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Desde</Label>
                  <Popover open={isFromDateOpen} onOpenChange={setIsFromDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateFilter('custom');
                          setIsFromDateOpen(true);
                        }}
                        className="text-xs justify-start"
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {customDateFrom ? format(customDateFrom, 'PP', { locale: es }) : 'Fecha inicio'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateFrom}
                        onSelect={(date) => {
                          setCustomDateFrom(date);
                          setIsFromDateOpen(false);
                        }}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Hasta</Label>
                  <Popover open={isToDateOpen} onOpenChange={setIsToDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateFilter('custom');
                          setIsToDateOpen(true);
                        }}
                        className="text-xs justify-start"
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {customDateTo ? format(customDateTo, 'PP', { locale: es }) : 'Fecha fin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateTo}
                        onSelect={(date) => {
                          setCustomDateTo(date);
                          setIsToDateOpen(false);
                        }}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Sessions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendientes ({pendingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Revisados ({reviewedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay sesiones pendientes</h3>
                <p className="text-muted-foreground text-center">
                  No hay entrenamientos esperando retroalimentación en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingSessions.map((session) => {
              const isExpanded = expandedSessions.includes(session.id);
              return (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4 flex-1">
                        {/* Vista Comprimida - Siempre visible */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{session.athleteName}</h4>
                              <p className="text-sm text-muted-foreground">{session.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {session.teamName}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(session.status)}>
                              {getStatusText(session.status)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSessionExpansion(session.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Métricas básicas - Siempre visibles */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(session.date).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <span>{session.distance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                            <span>{session.avgPace}/km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                            <span>{session.avgHR} bpm</span>
                          </div>
                        </div>

                        {/* Vista Expandida - Solo visible si está expandida */}
                        {isExpanded && (
                          <>
                            {/* Análisis de Intervalos Detallado */}
                            {session.intervals.length > 0 && (
                              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Análisis Detallado de Intervalos
                                  </h5>
                                  <Badge variant="outline" className={`${
                                    session.plannedVsActual.overallCompliance >= 80 ? 'bg-green-100 text-green-800' :
                                    session.plannedVsActual.overallCompliance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {session.plannedVsActual.overallCompliance}% Cumplimiento General
                                  </Badge>
                                </div>

                                {/* Resumen de Intervalos */}
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="font-semibold text-blue-700">{session.intervals.length}</div>
                                    <div className="text-blue-600">Intervalos</div>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="font-semibold text-green-700">
                                      {session.intervals.filter(i => i.type === 'active').length}
                                    </div>
                                    <div className="text-green-600">Activos</div>
                                  </div>
                                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <div className="font-semibold text-purple-700">
                                      {Math.round(session.intervals.reduce((sum, i) => sum + i.compliance, 0) / session.intervals.length)}%
                                    </div>
                                    <div className="text-purple-600">Cumplimiento Promedio</div>
                                  </div>
                                </div>

                                {/* Lista de Intervalos */}
                                <div className="space-y-2">
                                  {session.intervals.map((interval, index) => (
                                    <Collapsible key={interval.id}>
                                      <CollapsibleTrigger 
                                        className="w-full"
                                        onClick={() => toggleIntervalExpansion(interval.id)}
                                      >
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                              interval.type === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                              {interval.number}
                                            </div>
                                            <div className="text-left">
                                              <div className="font-medium">
                                                {interval.type === 'active' ? 'Intervalo Activo' : 'Recuperación'}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                {formatDuration(interval.actualDuration)} • {interval.actualPace}/km • {interval.actualHR} bpm
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge className={getComplianceColor(interval.compliance)}>
                                              {interval.compliance}%
                                            </Badge>
                                            {expandedIntervals.includes(interval.id) ? 
                                              <ChevronUp className="w-4 h-4" /> : 
                                              <ChevronDown className="w-4 h-4" />
                                            }
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        {expandedIntervals.includes(interval.id) && (
                                          <div className="mt-2 ml-11 p-4 bg-gray-50 rounded-lg space-y-3">
                                            {/* Métricas Detalladas */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <h6 className="font-medium text-sm text-blue-700">Planificado</h6>
                                                <div className="space-y-1 text-sm">
                                                  <div className="flex justify-between">
                                                    <span>Duración:</span>
                                                    <span>{formatDuration(interval.plannedDuration)}</span>
                                                  </div>
                                                  {interval.plannedDistance && (
                                                    <div className="flex justify-between">
                                                      <span>Distancia:</span>
                                                      <span>{interval.plannedDistance}m</span>
                                                    </div>
                                                  )}
                                                  <div className="flex justify-between">
                                                    <span>Ritmo:</span>
                                                    <span>{interval.plannedPace}/km</span>
                                                  </div>
                                                  {interval.plannedHR && (
                                                    <div className="flex justify-between">
                                                      <span>FC:</span>
                                                      <span>{interval.plannedHR} bpm</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-2">
                                                <h6 className="font-medium text-sm text-green-700">Real</h6>
                                                <div className="space-y-1 text-sm">
                                                  <div className="flex justify-between">
                                                    <span>Duración:</span>
                                                    <span className={
                                                      Math.abs(interval.actualDuration - interval.plannedDuration) <= 10 ? 
                                                      'text-green-600' : 'text-orange-600'
                                                    }>
                                                      {formatDuration(interval.actualDuration)}
                                                    </span>
                                                  </div>
                                                  {interval.actualDistance && (
                                                    <div className="flex justify-between">
                                                      <span>Distancia:</span>
                                                      <span className={
                                                        interval.actualDistance >= (interval.plannedDistance || 0) * 0.95 ? 
                                                        'text-green-600' : 'text-orange-600'
                                                      }>
                                                        {interval.actualDistance}m
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="flex justify-between">
                                                    <span>Ritmo:</span>
                                                    <span>{interval.actualPace}/km</span>
                                                  </div>
                                                  {interval.actualHR && (
                                                    <div className="flex justify-between">
                                                      <span>FC:</span>
                                                      <span className={
                                                        Math.abs(interval.actualHR - (interval.plannedHR || 0)) <= 10 ? 
                                                        'text-green-600' : 'text-orange-600'
                                                      }>
                                                        {interval.actualHR} bpm
                                                      </span>
                                                    </div>
                                                  )}
                                                  {interval.maxHR && (
                                                    <div className="flex justify-between">
                                                      <span>FC Máx:</span>
                                                      <span>{interval.maxHR} bpm</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Feedback específico del intervalo */}
                                            {interval.coachFeedback ? (
                                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                  <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                                  <div>
                                                    <div className="text-sm font-medium text-blue-800">Feedback del Entrenador</div>
                                                    <div className="text-sm text-blue-700 mt-1">{interval.coachFeedback}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="mt-3">
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => handleOpenFeedbackDialog(session)}
                                                  className="text-xs"
                                                >
                                                  <MessageCircle className="w-3 h-3 mr-1" />
                                                  Agregar Feedback a este Intervalo
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detalles del Entrenamiento */}
                            <div className="bg-green-50 rounded-lg p-4">
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Detalles del Entrenamiento
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Condiciones Climáticas */}
                                <div className="space-y-2">
                                  <h6 className="text-sm font-medium text-green-700">Condiciones Climáticas</h6>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Temperatura:</span>
                                      <span>{session.environmentalFactors?.temperature || 'No registrada'}°C</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Humedad:</span>
                                      <span>{session.environmentalFactors?.humidity || 'No registrada'}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Viento:</span>
                                      <span>{session.environmentalFactors?.wind || 'No registrado'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Clima:</span>
                                      <span>{session.environmentalFactors?.weather || 'No registrado'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Superficie y Ubicación */}
                                <div className="space-y-2">
                                  <h6 className="text-sm font-medium text-green-700">Superficie y Ubicación</h6>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Superficie:</span>
                                      <span>{session.surfaceType || 'Asfalto'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Elevación:</span>
                                      <span>{session.elevation || 'Nivel del mar'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Ubicación:</span>
                                      <span>{session.location || 'No especificada'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Terreno:</span>
                                      <span>{session.terrainType || 'Plano'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Incidencias y Observaciones */}
                              {(session.injuryDuringTraining || session.equipmentIssues || session.nutritionHydration || session.sleepQuality) && (
                                <div className="mt-4 pt-4 border-t border-green-200">
                                  <h6 className="text-sm font-medium text-green-700 mb-2">Incidencias y Factores</h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    {session.injuryDuringTraining && (
                                      <div className="bg-red-100 border border-red-200 rounded-lg p-2">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <div className="font-medium text-red-800">Incidencia de Lesión</div>
                                            <div className="text-red-700">{session.injuryDuringTraining}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {session.equipmentIssues && (
                                      <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-2">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <div className="font-medium text-yellow-800">Problemas de Equipamiento</div>
                                            <div className="text-yellow-700">{session.equipmentIssues}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {session.nutritionHydration && (
                                      <div className="bg-blue-100 border border-blue-200 rounded-lg p-2">
                                        <div className="flex items-start gap-2">
                                          <Heart className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <div className="font-medium text-blue-800">Nutrición e Hidratación</div>
                                            <div className="text-blue-700">{session.nutritionHydration}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {session.sleepQuality && (
                                      <div className="bg-purple-100 border border-purple-200 rounded-lg p-2">
                                        <div className="flex items-start gap-2">
                                          <Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <div className="font-medium text-purple-800">Calidad del Sueño</div>
                                            <div className="text-purple-700">{session.sleepQuality}/10 - {session.sleepHours || 'No especificadas'} horas</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Notas Adicionales del Atleta */}
                              {session.athleteNotes && (
                                <div className="mt-4 pt-4 border-t border-green-200">
                                  <h6 className="text-sm font-medium text-green-700 mb-2">Notas del Atleta</h6>
                                  <div className="bg-white border border-green-200 rounded-lg p-3">
                                    <p className="text-sm text-green-800">{session.athleteNotes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Botones de Acción - Siempre visibles */}
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleOpenFeedbackDialog(session)}
                            className="bg-accent hover:bg-accent/90"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Dar Retroalimentación
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              const sessionIndex = mockSessions.findIndex(s => s.id === session.id);
                              if (sessionIndex !== -1) {
                                mockSessions[sessionIndex].status = 'reviewed';
                              }
                              setActiveTab('reviewed');
                              toast.success('Sesión marcada como revisada');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Marcar como Revisado
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay sesiones revisadas</h3>
                <p className="text-muted-foreground text-center">
                  Las sesiones con retroalimentación aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            reviewedSessions.map((session) => {
              const isExpanded = expandedSessions.includes(session.id);
              return (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4 flex-1">
                        {/* Vista Comprimida - Siempre visible */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{session.athleteName}</h4>
                              <p className="text-sm text-muted-foreground">{session.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {session.teamName}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(session.status)}>
                              {getStatusText(session.status)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSessionExpansion(session.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Métricas básicas - Siempre visibles */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(session.date).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <span>{session.distance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                            <span>{session.avgPace}/km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                            <span>{session.avgHR} bpm</span>
                          </div>
                        </div>

                        {/* Comentarios del entrenador - Siempre visibles en revisadas */}
                        {session.comments && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-blue-800">Retroalimentación del Entrenador</div>
                                <div className="text-sm text-blue-700 mt-1">{session.comments}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vista Expandida - Solo si está expandida */}
                        {isExpanded && (
                          <>
                            {/* Todo el contenido detallado aquí (mismo que arriba) */}
                            {session.intervals.length > 0 && (
                              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Análisis Detallado de Intervalos
                                  </h5>
                                  <Badge variant="outline" className={`${
                                    session.plannedVsActual.overallCompliance >= 80 ? 'bg-green-100 text-green-800' :
                                    session.plannedVsActual.overallCompliance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {session.plannedVsActual.overallCompliance}% Cumplimiento General
                                  </Badge>
                                </div>
                                {/* Resto del contenido de intervalos... */}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Retroalimentación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Retroalimentación para {selectedSession?.athleteName}</DialogTitle>
            <DialogDescription>
              Proporciona feedback detallado sobre la sesión: {selectedSession?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              {/* Resumen de la sesión */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{selectedSession.distance.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">km</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{selectedSession.avgPace}</div>
                  <div className="text-sm text-muted-foreground">min/km</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{selectedSession.avgHR}</div>
                  <div className="text-sm text-muted-foreground">bpm promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{selectedSession.duration}</div>
                  <div className="text-sm text-muted-foreground">minutos</div>
                </div>
              </div>

              {/* Feedback de Intervalos */}
              {selectedSession.intervals.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Feedback por Intervalo</h4>
                  {selectedSession.intervals.map((interval) => (
                    <div key={interval.id} className="space-y-2">
                      <Label>
                        Intervalo {interval.number} ({interval.type === 'active' ? 'Activo' : 'Recuperación'})
                      </Label>
                      <Textarea
                        placeholder={`Feedback para el intervalo ${interval.number}...`}
                        value={intervalFeedbacks[interval.id] || ''}
                        onChange={(e) => handleIntervalFeedbackChange(interval.id, e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Evaluación General */}
              <div className="space-y-4">
                <h4 className="font-semibold">Evaluación General</h4>
                
                <div className="space-y-2">
                  <Label>Progreso del Atleta</Label>
                  <Slider
                    value={[ratings.progress]}
                    onValueChange={(value) => setRatings({...ratings, progress: value[0]})}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Necesita mejorar</span>
                    <span className="font-medium">{ratings.progress}/10</span>
                    <span>Excelente</span>
                  </div>
                </div>
              </div>

              {/* Comentarios */}
              <div className="space-y-2">
                <Label>Comentarios sobre la Sesión</Label>
                <Textarea
                  placeholder="Describe el rendimiento general, puntos fuertes, áreas de mejora..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              {/* Recomendaciones */}
              <div className="space-y-2">
                <Label>Recomendaciones</Label>
                <Textarea
                  placeholder="Recomendaciones específicas para futuras sesiones..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Áreas de Enfoque */}
              <div className="space-y-4">
                <Label>Áreas de Enfoque para Próximas Sesiones</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: Cadencia, Técnica, Resistencia..."
                    value={newFocusArea}
                    onChange={(e) => setNewFocusArea(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddFocusArea();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddFocusArea}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {nextFocus.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nextFocus.map((area, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {area}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFocusArea(area)}
                          className="h-auto p-0 w-4 h-4 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitFeedback}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Retroalimentación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}