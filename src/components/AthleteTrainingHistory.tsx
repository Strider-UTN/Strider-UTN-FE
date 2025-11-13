import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  FilterX,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  BookOpen,
  CalendarDays,
  Timer,
  Play,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { CompletedWorkoutService, CompletedWorkoutResponseDto } from '../services/completedWorkoutService';

interface IndividualAthlete {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

// Interfaces para la estructura jerárquica de planificación (igual que AthleteTrainingPlan)
interface Macrocycle {
  id: string;
  name: string;
  description: string;
  coach: string;
  athlete: string;
  startDate: string;
  endDate: string;
  objective: string;
  totalWeeks: number;
  status: 'active' | 'completed' | 'planned' | 'paused';
  mesocycles: Mesocycle[];
}

interface Mesocycle {
  id: string;
  macrocycleId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  phase: 'base' | 'build' | 'peak' | 'recovery' | 'competition';
  objectives: string[];
  weekCount: number;
  microcycles: Microcycle[];
}

interface Microcycle {
  id: string;
  mesocycleId: string;
  weekNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  focus: string;
  totalLoad: number;
  sessions: TrainingSession[];
}

interface TrainingSession {
  id: string;
  microcycleId: string;
  date: string;
  time: string;
  name: string;
  type: 'training' | 'prep_competition' | 'main_competition' | 'recovery';
  duration: number; // minutos
  intensity: 'low' | 'medium' | 'high' | 'recovery';
  location: string;
  status: 'pending' | 'completed' | 'missed';
  coach: string;
  description: string;
  intervals?: {
    work: string;
    rest: string;
    repetitions: number;
  }[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
  objectives?: string[];
  equipment?: string[];
  targetZones?: {
    heartRate?: string;
    pace?: string;
    effort?: string;
  };
  // Datos de entrenamiento realizado
  actualMetrics?: {
    distance?: number;
    avgPace?: string;
    maxHR?: number;
    avgHR?: number;
    calories?: number;
    elevation?: number;
    weather?: {
      temperature: number;
      condition: string;
    };
    coachRating?: 'excellent' | 'good' | 'needs_improvement' | 'concerning'; // Calificación del entrenador
    athleteNotes?: string;
    coachNotes?: string;
    compliance?: number; // porcentaje de cumplimiento
  };
}

interface AthleteTrainingHistoryProps {
  athlete: IndividualAthlete;
  onBack: () => void;
  showFeedbackInitially?: boolean;
}

// Datos mock del histórico - usando la misma estructura que AthleteTrainingPlan pero con entrenamientos completados
const mockHistoryData: Macrocycle[] = [
  {
    id: 'macro1',
    name: 'Temporada 2024 - Desarrollo de Medio Fondo',
    description: 'Planificación anual completada enfocada en competencias de 5K y 10K',
    coach: 'María González',
    athlete: 'Ana Martínez', 
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    objective: 'Mejorar marcas personales en 5K y 10K - COMPLETADO',
    totalWeeks: 52,
    status: 'completed',
    mesocycles: [
      {
        id: 'meso1',
        macrocycleId: 'macro1',
        name: 'Mesociclo 1: Base Aeróbica',
        description: 'Desarrollo de la capacidad aeróbica - COMPLETADO',
        startDate: '2024-01-01',
        endDate: '2024-01-28',
        phase: 'base',
        objectives: [
          'Desarrollar base aeróbica sólida ✓',
          'Aumentar volumen de entrenamiento gradualmente ✓',
          'Establecer rutinas de entrenamiento ✓',
          'Prevenir lesiones con trabajo de fuerza ✓'
        ],
        weekCount: 4,
        microcycles: [
          {
            id: 'micro1',
            mesocycleId: 'meso1',
            weekNumber: 1,
            name: 'Semana 1: Adaptación Inicial',
            startDate: '2024-01-01',
            endDate: '2024-01-07',
            focus: 'Adaptación progresiva al volumen de entrenamiento',
            totalLoad: 85,
            sessions: [
              {
                id: 'session1',
                microcycleId: 'micro1',
                date: '2024-01-02',
                time: '07:00',
                name: 'Carrera Continua Base',
                type: 'training',
                duration: 45,
                intensity: 'low',
                location: 'Parque Central',
                status: 'completed',
                coach: 'María González',
                description: 'Carrera continua a ritmo aeróbico para establecer base cardiovascular',
                warmup: '10 min trote suave + movilidad articular',
                cooldown: '10 min caminata + estiramientos',
                objectives: [
                  'Establecer ritmo aeróbico base',
                  'Adaptación cardiovascular gradual',
                  'Técnica de carrera relajada'
                ],
                equipment: ['Zapatillas running', 'Hidratación'],
                targetZones: {
                  heartRate: '130-145 bpm',
                  pace: '5:30-6:00 min/km',
                  effort: '5-6/10'
                },
                actualMetrics: {
                  distance: 8.2,
                  avgPace: '5:42',
                  maxHR: 148,
                  avgHR: 138,
                  calories: 425,
                  elevation: 45,
                  weather: {
                    temperature: 18,
                    condition: 'Despejado'
                  },
                  rating: 4,
                  athleteNotes: 'Me sentí muy bien, ritmo cómodo durante toda la carrera',
                  coachNotes: 'Excelente adaptación inicial, mantener este rango de FC',
                  compliance: 95
                }
              },
              {
                id: 'session2',
                microcycleId: 'micro1',
                date: '2024-01-03',
                time: '18:30',
                name: 'Técnica + Fuerza',
                type: 'training',
                duration: 60,
                intensity: 'low',
                location: 'Gimnasio Municipal',
                status: 'completed',
                coach: 'María González',
                description: 'Trabajo técnico de carrera y fortalecimiento general',
                warmup: '15 min calentamiento dinámico',
                cooldown: '15 min estiramientos específicos',
                objectives: [
                  'Mejorar técnica de carrera',
                  'Fortalecimiento core y tren inferior',
                  'Prevención de lesiones'
                ],
                equipment: ['Conos', 'Bandas elásticas', 'Colchonetas'],
                targetZones: {
                  heartRate: '120-140 bpm',
                  pace: 'Variable según ejercicio',
                  effort: '4-5/10'
                },
                actualMetrics: {
                  distance: 3.5,
                  avgHR: 125,
                  maxHR: 142,
                  calories: 285,
                  weather: {
                    temperature: 16,
                    condition: 'Cubierto'
                  },
                  rating: 5,
                  athleteNotes: 'Ejercicios de técnica muy útiles, me siento más eficiente',
                  coachNotes: 'Gran progreso en la técnica de braceo y cadencia',
                  compliance: 100
                }
              },
              {
                id: 'session3',
                microcycleId: 'micro1',
                date: '2024-01-04',
                time: '07:00',
                name: 'Carrera Larga Suave',
                type: 'training',
                duration: 70,
                intensity: 'medium',
                location: 'Ruta Costera',
                status: 'completed',
                coach: 'María González',
                description: 'Primera carrera larga de la temporada, énfasis en resistencia aeróbica',
                warmup: '10 min trote muy suave',
                cooldown: '10 min caminata + hidratación',
                notes: 'Mantener ritmo conversacional durante toda la carrera',
                objectives: [
                  'Desarrollar resistencia aeróbica',
                  'Adaptación a volumen sostenido',
                  'Economía de carrera'
                ],
                equipment: ['Zapatillas trail', 'Hidratación', 'Gels energéticos'],
                targetZones: {
                  heartRate: '140-155 bpm',
                  pace: '5:15-5:45 min/km',
                  effort: '6-7/10'
                },
                actualMetrics: {
                  distance: 12.8,
                  avgPace: '5:28',
                  maxHR: 159,
                  avgHR: 147,
                  calories: 685,
                  elevation: 125,
                  weather: {
                    temperature: 14,
                    condition: 'Soleado'
                  },
                  rating: 4,
                  athleteNotes: 'Carrera larga exitosa, me sentí fuerte hasta el final',
                  coachNotes: 'Muy buena progresión, excelente control del ritmo',
                  compliance: 92
                }
              },
              {
                id: 'session4',
                microcycleId: 'micro1',
                date: '2024-01-06',
                time: '17:00',
                name: 'Recuperación Activa',
                type: 'recovery',
                duration: 30,
                intensity: 'recovery',
                location: 'Parque Central',
                status: 'completed',
                coach: 'María González',
                description: 'Carrera suave de recuperación activa',
                warmup: '5 min caminata dinámica',
                cooldown: '15 min estiramientos profundos',
                objectives: [
                  'Recuperación muscular activa',
                  'Mantener movilidad',
                  'Relajación mental'
                ],
                equipment: ['Zapatillas suaves'],
                targetZones: {
                  heartRate: '110-130 bpm',
                  pace: '6:30-7:00 min/km',
                  effort: '3-4/10'
                },
                actualMetrics: {
                  distance: 5.2,
                  avgPace: '6:45',
                  maxHR: 128,
                  avgHR: 118,
                  calories: 185,
                  elevation: 12,
                  weather: {
                    temperature: 20,
                    condition: 'Parcialmente nublado'
                  },
                  rating: 5,
                  athleteNotes: 'Perfecto para recuperar, piernas muy frescas después',
                  coachNotes: 'Excelente recuperación, FC muy controlada',
                  compliance: 98
                }
              }
            ]
          },
          {
            id: 'micro2',
            mesocycleId: 'meso1',
            weekNumber: 2,
            name: 'Semana 2: Incremento Volumen',
            startDate: '2024-01-08',
            endDate: '2024-01-14',
            focus: 'Incremento del 10% en volumen semanal',
            totalLoad: 93,
            sessions: [
              {
                id: 'session5',
                microcycleId: 'micro2',
                date: '2024-01-09',
                time: '07:00',
                name: 'Carrera Tempo',
                type: 'training',
                duration: 50,
                intensity: 'medium',
                location: 'Pista de Atletismo',
                status: 'completed',
                coach: 'María González',
                description: 'Carrera tempo con progresión gradual de intensidad',
                intervals: [
                  { work: '20 min a 70% VO₂ Max', rest: '5 min recuperación', repetitions: 1 },
                  { work: '15 min a 75% VO₂ Max', rest: '', repetitions: 1 }
                ],
                warmup: '15 min calentamiento progresivo',
                cooldown: '10 min enfriamiento suave',
                objectives: [
                  'Desarrollo del umbral aeróbico',
                  'Adaptación a ritmos sostenidos',
                  'Mejora de la economía de carrera'
                ],
                equipment: ['Reloj deportivo', 'Cronómetro'],
                targetZones: {
                  heartRate: '150-165 bpm',
                  pace: '4:45-5:15 min/km',
                  effort: '7-8/10'
                },
                actualMetrics: {
                  distance: 10.5,
                  avgPace: '4:58',
                  maxHR: 168,
                  avgHR: 157,
                  calories: 565,
                  elevation: 22,
                  weather: {
                    temperature: 15,
                    condition: 'Nublado'
                  },
                  rating: 4,
                  athleteNotes: 'Tempo exigente pero controlado, buenas sensaciones',
                  coachNotes: 'Progresión perfecta, muy buena adaptación al tempo',
                  compliance: 96
                }
              },
              {
                id: 'session6',
                microcycleId: 'micro2',
                date: '2024-01-11',
                time: '07:30',
                name: 'Intervalos Aeróbicos',
                type: 'training',
                duration: 65,
                intensity: 'high',
                location: 'Pista de Atletismo',
                status: 'completed',
                coach: 'María González',
                description: 'Primera sesión de intervalos para desarrollar potencia aeróbica',
                intervals: [
                  { work: '6 min a 85% VO₂ Max', rest: '3 min recuperación activa', repetitions: 4 }
                ],
                warmup: '20 min calentamiento + progresivos',
                cooldown: '15 min enfriamiento',
                objectives: [
                  'Desarrollo de potencia aeróbica',
                  'Mejora del VO₂ máximo',
                  'Adaptación a intensidades altas'
                ],
                equipment: ['Reloj deportivo', 'Cronómetro', 'Hidratación'],
                targetZones: {
                  heartRate: '170-180 bpm',
                  pace: '4:00-4:30 min/km',
                  effort: '8-9/10'
                },
                actualMetrics: {
                  distance: 8.8,
                  avgPace: '4:18',
                  maxHR: 182,
                  avgHR: 164,
                  calories: 485,
                  elevation: 15,
                  weather: {
                    temperature: 12,
                    condition: 'Despejado'
                  },
                  rating: 5,
                  athleteNotes: 'Intervalos duros pero completados con éxito, me siento más rápida',
                  coachNotes: 'Excelente progresión en los intervalos, muy buena recuperación',
                  compliance: 94
                }
              }
            ]
          }
        ]
      },
      {
        id: 'meso2',
        macrocycleId: 'macro1',
        name: 'Mesociclo 2: Desarrollo de Velocidad',
        description: 'Introducción de trabajos de velocidad y mejora de VO2 máximo - COMPLETADO',
        startDate: '2024-01-29',
        endDate: '2024-02-25',
        phase: 'build',
        objectives: [
          'Desarrollar velocidad aeróbica máxima ✓',
          'Mejorar economía de carrera ✓',
          'Introducir trabajos de umbral anaeróbico ✓',
          'Mantener base aeróbica desarrollada ✓'
        ],
        weekCount: 4,
        microcycles: [
          {
            id: 'micro5',
            mesocycleId: 'meso2',
            weekNumber: 5,
            name: 'Semana 5: Introducción Velocidad',
            startDate: '2024-01-29',
            endDate: '2024-02-04',
            focus: 'Primera semana con intervalos de velocidad',
            totalLoad: 105,
            sessions: [
              {
                id: 'session20',
                microcycleId: 'micro5',
                date: '2024-01-30',
                time: '07:00',
                name: 'Intervalos VO₂ Max',
                type: 'training',
                duration: 60,
                intensity: 'high',
                location: 'Pista de Atletismo',
                status: 'completed',
                coach: 'María González',
                description: 'Intervalos específicos para desarrollar velocidad aeróbica máxima',
                intervals: [
                  { work: '4 min a 95% VO₂ Max', rest: '3 min recuperación activa', repetitions: 5 }
                ],
                warmup: '20 min calentamiento + aceleraciones',
                cooldown: '15 min enfriamiento suave',
                objectives: [
                  'Desarrollo VO₂ máximo',
                  'Tolerancia al lactato',
                  'Velocidad aeróbica máxima'
                ],
                equipment: ['Reloj deportivo', 'Cronómetro'],
                targetZones: {
                  heartRate: '175-185 bpm',
                  pace: '3:45-4:15 min/km',
                  effort: '9/10'
                },
                actualMetrics: {
                  distance: 7.2,
                  avgPace: '4:02',
                  maxHR: 187,
                  avgHR: 172,
                  calories: 425,
                  elevation: 8,
                  weather: {
                    temperature: 10,
                    condition: 'Frío y despejado'
                  },
                  rating: 5,
                  athleteNotes: '¡Intervalos increíbles! Me sentí muy rápida y fuerte',
                  coachNotes: 'Progreso extraordinario, excelente adaptación a la velocidad',
                  compliance: 98
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

export function AthleteTrainingHistory({ athlete, onBack, showFeedbackInitially = false }: AthleteTrainingHistoryProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [expandedMesocycles, setExpandedMesocycles] = useState<Set<string>>(new Set());
  const [expandedMicrocycles, setExpandedMicrocycles] = useState<Set<string>>(new Set());
  const [selectedMacrocycle, setSelectedMacrocycle] = useState<string>('macro1');
  const [selectedMesocycle, setSelectedMesocycle] = useState<string | null>(null);
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'history' | 'feedback'>('history');
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 0, 1)); // Enero 2024
  const [workoutsWithFeedback, setWorkoutsWithFeedback] = useState<CompletedWorkoutResponseDto[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // Validar que el atleta existe
  if (!athlete || !athlete.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2>Error</h2>
            <p className="text-muted-foreground">No se pudo cargar la información del atleta</p>
          </div>
        </div>
      </div>
    );
  }

  // Obtener macrociclo actual
  const currentMacrocycle = mockHistoryData.find(m => m.id === selectedMacrocycle);

  // Obtener todas las sesiones completadas del macrociclo
  const getAllCompletedSessions = (): TrainingSession[] => {
    if (!currentMacrocycle) return [];
    
    const sessions: TrainingSession[] = [];
    currentMacrocycle.mesocycles.forEach(mesocycle => {
      mesocycle.microcycles.forEach(microcycle => {
        sessions.push(...microcycle.sessions.filter(s => s.status === 'completed'));
      });
    });
    
    return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Funciones para manejar expansión/colapso
  const toggleMesocycle = (mesocycleId: string) => {
    const newExpanded = new Set(expandedMesocycles);
    if (newExpanded.has(mesocycleId)) {
      newExpanded.delete(mesocycleId);
    } else {
      newExpanded.add(mesocycleId);
    }
    setExpandedMesocycles(newExpanded);
  };

  const toggleMicrocycle = (microcycleId: string) => {
    const newExpanded = new Set(expandedMicrocycles);
    if (newExpanded.has(microcycleId)) {
      newExpanded.delete(microcycleId);
    } else {
      newExpanded.add(microcycleId);
    }
    setExpandedMicrocycles(newExpanded);
  };

  // Funciones para el calendario
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getSessionsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const allSessions = getAllCompletedSessions();
    
    return allSessions.filter(session => {
      return session.date === dateString;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'base': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'build': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'peak': return 'bg-red-100 text-red-800 border-red-200';
      case 'recovery': return 'bg-green-100 text-green-800 border-green-200';
      case 'competition': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'recovery': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prep_competition': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'main_competition': return 'bg-red-100 text-red-800 border-red-200';
      case 'recovery': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const end = new Date(endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${start} - ${end}`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleSessionDetail = (session: TrainingSession) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSession(null);
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return <Star className="w-4 h-4 text-green-600" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4 text-blue-600" />;
      case 'needs_improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'concerning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'concerning': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'needs_improvement': return 'Necesita Mejora';
      case 'concerning': return 'No Cumple los Objetivos';
      default: return 'Sin Evaluar';
    }
  };

  const renderCoachRating = (rating?: string) => {
    if (!rating) return null;
    return (
      <Badge className={`${getRatingColor(rating)} flex items-center gap-1 px-2 py-1 break-words whitespace-normal`}>
        {getRatingIcon(rating)}
        <span className="text-xs break-words whitespace-normal">{getRatingLabel(rating)}</span>
      </Badge>
    );
  };

  // Si debe mostrar la vista de retroalimentación
  if (currentView === 'feedback') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Atletas
            </Button>
            <div>
              <h2>Retroalimentación - {athlete.name}</h2>
              <p className="text-muted-foreground">
                La retroalimentación se gestiona desde la sección principal de Retroalimentación en el menú del entrenador
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setCurrentView('history')}>
            <Activity className="w-4 h-4 mr-2" />
            Ver Histórico
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Vista de Retroalimentación</h3>
            <p className="text-muted-foreground text-center">
              Para proporcionar retroalimentación a los entrenamientos, ve a la sección "Retroalimentación" en el menú principal del entrenador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1>Histórico de Entrenamientos - {athlete.name}</h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de entrenamientos realizados organizados por planificación
            </p>
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {currentMacrocycle?.status === 'completed' ? 'Completado' : 'Activo'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentMacrocycle && formatDateRange(currentMacrocycle.startDate, currentMacrocycle.endDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Temporada</div>
          <div className="text-sm font-medium max-w-xs">
            {currentMacrocycle?.name}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl min-w-fit">
            <TabsTrigger value="calendar" className="whitespace-nowrap">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="macrocycle" className="whitespace-nowrap">
              <CalendarDays className="w-4 h-4 mr-2" />
              Macrociclo
            </TabsTrigger>
            <TabsTrigger value="mesocycles" className="whitespace-nowrap">
              <BookOpen className="w-4 h-4 mr-2" />
              Mesociclos
            </TabsTrigger>
            <TabsTrigger value="microcycles" className="whitespace-nowrap">
              <Target className="w-4 h-4 mr-2" />
              Microciclos
            </TabsTrigger>
            <TabsTrigger value="sessions" className="whitespace-nowrap">
              <Eye className="w-4 h-4 mr-2" />
              Sesiones
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Vista del Calendario */}
        <TabsContent value="calendar" className="w-full space-y-6">
          <Card className="w-full">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Calendario de Entrenamientos Realizados</CardTitle>
                  <CardDescription>
                    Vista mensual de tus entrenamientos completados • {getAllCompletedSessions().length} sesiones realizadas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => navigateMonth('prev')}
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-2 text-sm font-medium min-w-[140px] text-center">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </div>
                  <button 
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => navigateMonth('next')}
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Encabezados de días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date, index) => {
                  const sessions = getSessionsForDay(date);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border rounded-lg ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isToday ? 'ring-2 ring-primary/50' : ''}`}
                    >
                      <div className={`text-sm mb-2 ${
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      } ${isToday ? 'font-semibold text-primary' : ''}`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {sessions.slice(0, 3).map((session) => (
                          <div
                            key={session.id}
                            className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: getIntensityColor(session.intensity) + '20' }}
                            onClick={() => handleSessionDetail(session)}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                              <span className="font-medium truncate">{session.time}</span>
                              <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
                            </div>
                            <div className="truncate text-muted-foreground">
                              {session.name}
                            </div>
                            {session.actualMetrics?.coachRating && (
                              <div className="mt-1">
                                {renderCoachRating(session.actualMetrics.coachRating)}
                              </div>
                            )}
                          </div>
                        ))}
                        {sessions.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{sessions.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Recuperación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Baja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Media</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Alta</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-sm">Completado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista del Macrociclo */}
        <TabsContent value="macrocycle" className="w-full space-y-6">
          {currentMacrocycle && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {currentMacrocycle.name}
                  </CardTitle>
                  <CardDescription>
                    {currentMacrocycle.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Duración</div>
                      <div className="text-2xl font-bold text-primary">{currentMacrocycle.totalWeeks} semanas</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateRange(currentMacrocycle.startDate, currentMacrocycle.endDate)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Mesociclos</div>
                      <div className="text-2xl font-bold text-primary">{currentMacrocycle.mesocycles.length}</div>
                      <div className="text-xs text-muted-foreground">Fases completadas</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Entrenamientos</div>
                      <div className="text-2xl font-bold text-primary">{getAllCompletedSessions().length}</div>
                      <div className="text-xs text-muted-foreground">Sesiones realizadas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de Mesociclos Completados */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Mesociclos Completados</CardTitle>
                  <CardDescription>
                    Progresión de las fases de entrenamiento realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentMacrocycle.mesocycles.map((mesocycle, index) => (
                      <div key={mesocycle.id} className="relative">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <Card className="flex-1">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{mesocycle.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {mesocycle.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="outline" className={getPhaseColor(mesocycle.phase)}>
                                      {mesocycle.phase === 'base' ? 'Base' : 
                                       mesocycle.phase === 'build' ? 'Desarrollo' :
                                       mesocycle.phase === 'peak' ? 'Pico' :
                                       mesocycle.phase === 'recovery' ? 'Recuperación' : 'Competencia'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {formatDateRange(mesocycle.startDate, mesocycle.endDate)}
                                    </span>
                                    <Badge className="bg-green-100 text-green-800">
                                      Completado
                                    </Badge>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMesocycle(mesocycle.id);
                                    setActiveTab('mesocycles');
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalles
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        {index < currentMacrocycle.mesocycles.length - 1 && (
                          <div className="absolute left-4 top-12 w-0.5 h-4 bg-border"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Vista de Mesociclos */}
        <TabsContent value="mesocycles" className="w-full space-y-6">
          {currentMacrocycle?.mesocycles.map((mesocycle) => (
            <Card key={mesocycle.id} className={selectedMesocycle === mesocycle.id ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMesocycle(mesocycle.id)}
                    >
                      {expandedMesocycles.has(mesocycle.id) ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </Button>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {mesocycle.name}
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </CardTitle>
                      <CardDescription>{mesocycle.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPhaseColor(mesocycle.phase)}>
                      {mesocycle.phase === 'base' ? 'Base' : 
                       mesocycle.phase === 'build' ? 'Desarrollo' :
                       mesocycle.phase === 'peak' ? 'Pico' :
                       mesocycle.phase === 'recovery' ? 'Recuperación' : 'Competencia'}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      Completado
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {expandedMesocycles.has(mesocycle.id) && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Objetivos Completados:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {mesocycle.objectives.map((objective, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Microciclos Completados ({mesocycle.microcycles.length} semanas):</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mesocycle.microcycles.map((microcycle) => {
                          const completedSessions = microcycle.sessions.filter(s => s.status === 'completed').length;
                          return (
                            <Card key={microcycle.id} className="bg-muted/50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h5 className="font-medium text-sm flex items-center gap-2">
                                      {microcycle.name}
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    </h5>
                                    <p className="text-xs text-muted-foreground">
                                      Semana {microcycle.weekNumber}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {completedSessions}/{microcycle.sessions.length} sesiones
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {microcycle.focus}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                  {formatDateRange(microcycle.startDate, microcycle.endDate)}
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-3"
                                  onClick={() => {
                                    setSelectedMicrocycle(microcycle.id);
                                    setActiveTab('microcycles');
                                  }}
                                >
                                  <CalendarDays className="w-4 h-4 mr-2" />
                                  Ver Microciclo
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Vista de Microciclos */}
        <TabsContent value="microcycles" className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3>Microciclos Completados</h3>
              <p className="text-muted-foreground">Vista semanal detallada de entrenamientos realizados</p>
            </div>
          </div>

          {currentMacrocycle?.mesocycles.map((mesocycle) => (
            <div key={mesocycle.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h4 className="font-medium">{mesocycle.name}</h4>
                <Badge variant="outline" className={getPhaseColor(mesocycle.phase)}>
                  {mesocycle.phase === 'base' ? 'Base' : 
                   mesocycle.phase === 'build' ? 'Desarrollo' :
                   mesocycle.phase === 'peak' ? 'Pico' :
                   mesocycle.phase === 'recovery' ? 'Recuperación' : 'Competencia'}
                </Badge>
                <Badge className="bg-green-100 text-green-800">Completado</Badge>
              </div>

              <div className="grid gap-4">
                {mesocycle.microcycles.map((microcycle) => {
                  const completedSessions = microcycle.sessions.filter(s => s.status === 'completed');
                  
                  return (
                    <Card key={microcycle.id} className={selectedMicrocycle === microcycle.id ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMicrocycle(microcycle.id)}
                            >
                              {expandedMicrocycles.has(microcycle.id) ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                              }
                            </Button>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {microcycle.name}
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </CardTitle>
                              <CardDescription>
                                Semana {microcycle.weekNumber} • {formatDateRange(microcycle.startDate, microcycle.endDate)}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              {completedSessions.length}/{microcycle.sessions.length} completadas
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedMicrocycles.has(microcycle.id) && (
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium mb-2">Enfoque de la Semana:</h5>
                              <p className="text-sm text-muted-foreground">{microcycle.focus}</p>
                            </div>

                            {completedSessions.length > 0 ? (
                              <div>
                                <h5 className="font-medium mb-3">Entrenamientos Realizados:</h5>
                                <div className="space-y-2">
                                  {completedSessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                                        <div>
                                          <div className="text-sm font-medium flex items-center gap-2">
                                            {session.name}
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {formatSessionDate(session.date)} • {session.time}
                                          </div>
                                          {session.actualMetrics && (
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs text-muted-foreground">
                                                {session.actualMetrics.distance}km en {formatTime(session.duration)} | 
                                                Ritmo: {session.actualMetrics.avgPace}/km
                                              </span>
                                              {session.actualMetrics.coachRating && renderCoachRating(session.actualMetrics.coachRating)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm" onClick={() => handleSessionDetail(session)}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No hay entrenamientos completados para esta semana</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Vista de Sesiones */}
        <TabsContent value="sessions" className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3>Todas las Sesiones Completadas</h3>
              <p className="text-muted-foreground">Vista completa de tus entrenamientos realizados</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {getAllCompletedSessions().length} entrenamientos completados
            </div>
          </div>

          {getAllCompletedSessions().length > 0 ? (
            <div className="space-y-4">
              {getAllCompletedSessions().map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow bg-green-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className={`w-3 h-3 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{session.name}</h4>
                              <p className="text-sm text-muted-foreground">{session.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getSessionTypeColor(session.type)}>
                                {session.type === 'training' ? 'Entrenamiento' :
                                 session.type === 'prep_competition' ? 'Competencia Prep.' :
                                 session.type === 'main_competition' ? 'Competencia Principal' :
                                 'Recuperación'}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              <span>{formatSessionDate(session.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{session.time} • {formatTime(session.duration)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{session.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Timer className="w-4 h-4 text-muted-foreground" />
                              <span className="capitalize">{session.intensity}</span>
                            </div>
                          </div>

                          {session.actualMetrics && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white/50 p-3 rounded-lg">
                              <div>
                                <span className="text-muted-foreground">Distancia:</span>
                                <span className="font-medium ml-1">{session.actualMetrics.distance} km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ritmo Promedio:</span>
                                <span className="font-medium ml-1">{session.actualMetrics.avgPace}/km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">FC Promedio:</span>
                                <span className="font-medium ml-1">{session.actualMetrics.avgHR} bpm</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Valoración del Entrenador:</span>
                                {session.actualMetrics.coachRating && renderCoachRating(session.actualMetrics.coachRating)}
                              </div>
                            </div>
                          )}

                          {session.actualMetrics?.athleteNotes && (
                            <div className="bg-blue-50/50 p-3 rounded-lg">
                              <h5 className="text-sm font-medium mb-1">Notas del Atleta:</h5>
                              <p className="text-sm text-muted-foreground">{session.actualMetrics.athleteNotes}</p>
                            </div>
                          )}

                          {session.actualMetrics?.coachNotes && (
                            <div className="bg-accent/10 p-3 rounded-lg">
                              <h5 className="text-sm font-medium mb-1">Feedback del Entrenador:</h5>
                              <p className="text-sm text-muted-foreground">{session.actualMetrics.coachNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleSessionDetail(session)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-muted-foreground space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-medium">No hay entrenamientos completados</p>
                    <p className="text-sm">Los entrenamientos realizados aparecerán aquí organizados por planificación</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalle de Sesión */}
      {selectedSession && isDetailModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getIntensityColor(selectedSession.intensity)}`}></div>
                    {selectedSession.name}
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </h3>
                  <p className="text-muted-foreground">
                    {formatSessionDate(selectedSession.date)} • {selectedSession.time} • {selectedSession.location}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información planificada vs realizada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-muted-foreground">Entrenamiento Planificado</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Duración:</span>
                      <span className="ml-1">{formatTime(selectedSession.duration)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Intensidad:</span>
                      <span className="ml-1 capitalize">{selectedSession.intensity}</span>
                    </div>
                    {selectedSession.targetZones && (
                      <div className="space-y-1">
                        <div><span className="font-medium">FC Objetivo:</span> {selectedSession.targetZones.heartRate}</div>
                        <div><span className="font-medium">Ritmo Objetivo:</span> {selectedSession.targetZones.pace}</div>
                        <div><span className="font-medium">Esfuerzo:</span> {selectedSession.targetZones.effort}</div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSession.actualMetrics && (
                  <div>
                    <h4 className="font-medium mb-3 text-green-700">Entrenamiento Realizado</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Distancia:</span>
                        <span className="ml-1">{selectedSession.actualMetrics.distance} km</span>
                      </div>
                      <div>
                        <span className="font-medium">Ritmo Promedio:</span>
                        <span className="ml-1">{selectedSession.actualMetrics.avgPace}/km</span>
                      </div>
                      <div>
                        <span className="font-medium">FC Promedio:</span>
                        <span className="ml-1">{selectedSession.actualMetrics.avgHR} bpm</span>
                      </div>
                      <div>
                        <span className="font-medium">FC Máxima:</span>
                        <span className="ml-1">{selectedSession.actualMetrics.maxHR} bpm</span>
                      </div>
                      <div>
                        <span className="font-medium">Calorías:</span>
                        <span className="ml-1">{selectedSession.actualMetrics.calories} kcal</span>
                      </div>
                      {selectedSession.actualMetrics.compliance && (
                        <div>
                          <span className="font-medium">Cumplimiento:</span>
                          <span className="ml-1">{selectedSession.actualMetrics.compliance}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción y objetivos */}
              <div>
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
              </div>

              {selectedSession.objectives && (
                <div>
                  <h4 className="font-medium mb-2">Objetivos</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedSession.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Intervalos */}
              {selectedSession.intervals && (
                <div>
                  <h4 className="font-medium mb-2">Intervalos</h4>
                  <div className="space-y-2">
                    {selectedSession.intervals.map((interval, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{interval.repetitions}x</span> {interval.work}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Descanso: {interval.rest}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas y feedback */}
              {selectedSession.actualMetrics?.athleteNotes && (
                <div>
                  <h4 className="font-medium mb-2">Notas del Atleta</h4>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">{selectedSession.actualMetrics.athleteNotes}</p>
                  </div>
                </div>
              )}

              {selectedSession.actualMetrics?.coachNotes && (
                <div>
                  <h4 className="font-medium mb-2">Feedback del Entrenador</h4>
                  <div className="p-3 bg-accent/10 rounded-lg space-y-3">
                    {selectedSession.actualMetrics.coachRating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Valoración:</span>
                        {renderCoachRating(selectedSession.actualMetrics.coachRating)}
                      </div>
                    )}
                    <p className="text-sm">{selectedSession.actualMetrics.coachNotes}</p>
                  </div>
                </div>
              )}

              {/* Condiciones climáticas */}
              {selectedSession.actualMetrics?.weather && (
                <div>
                  <h4 className="font-medium mb-2">Condiciones</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSession.actualMetrics.weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSession.actualMetrics.weather.condition}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end">
              <Button onClick={handleCloseModal}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}