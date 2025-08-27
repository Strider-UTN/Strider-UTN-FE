import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Calendar, Clock, Target, TrendingUp, MapPin, Users, Play, CheckCircle, AlertCircle, Trophy, Zap, Pause, MessageSquare, Bell, CalendarDays, Filter, Search, ChevronRight, X, Info, Activity, MapPinIcon, UserCheck, Star, Timer, FolderOpen, BookOpen, Award, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';

interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  coach: string;
  startDate: string;
  endDate: string;
  objective: string;
  phase: 'base' | 'build' | 'peak' | 'recovery' | 'competition';
  totalSessions: number;
  completedSessions: number;
  category: '5K' | '10K' | 'Half Marathon' | 'Marathon' | 'Cross Training' | 'Recovery';
  status: 'active' | 'completed' | 'paused';
}

interface TrainingSession {
  id: string;
  planId: string; // Referencia al plan de entrenamiento
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
  hasNewFeedback?: boolean;
  objectives?: string[];
  equipment?: string[];
  targetZones?: {
    heartRate?: string;
    pace?: string;
    effort?: string;
  };
}

interface WeeklyStats {
  totalSessions: number;
  completedSessions: number;
  totalDuration: number; // minutos
  weeklyGoal: number; // minutos
  improvementScore: number; // porcentaje
}

export function AthleteTrainingPlan() {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = semana actual
  const [activeTab, setActiveTab] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [intensityFilter, setIntensityFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | 'all'>('all');
  const [showMonthlyView, setShowMonthlyView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [completedSessions, setCompletedSessions] = useState(new Set<string>());
  const [planCompletedSessions, setPlanCompletedSessions] = useState<{[planId: string]: number}>({
    'plan1': 3,
    'plan2': 1,
    'plan3': 15
  });

  // Planes de entrenamiento de ejemplo
  const trainingPlans: TrainingPlan[] = [
    {
      id: 'plan1',
      name: 'Programa de Resistencia 10K - Enero 2025',
      description: 'Plan integral para mejorar resistencia aeróbica y preparación para competencia de 10K',
      coach: 'María González',
      startDate: '2025-01-20',
      endDate: '2025-02-20',
      objective: 'Mejorar tiempo personal en 10K - Objetivo: Sub 40:00',
      phase: 'build',
      totalSessions: 12,
      completedSessions: 3,
      category: '10K',
      status: 'active'
    },
    {
      id: 'plan2',
      name: 'Preparación Competencia 5K - Febrero 2025',
      description: 'Fase de puesta a punto para competencia regional de 5K',
      coach: 'María González',
      startDate: '2025-02-01',
      endDate: '2025-02-15',
      objective: 'Optimización velocidad específica para 5K - Meta: Sub 20:00',
      phase: 'peak',
      totalSessions: 8,
      completedSessions: 1,
      category: '5K',
      status: 'active'
    },
    {
      id: 'plan3',
      name: 'Recuperación Activa - Diciembre 2024',
      description: 'Período de recuperación y mantenimiento base después de temporada',
      coach: 'María González',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      objective: 'Mantener base aeróbica y recuperación completa',
      phase: 'recovery',
      totalSessions: 15,
      completedSessions: 15,
      category: 'Recovery',
      status: 'completed'
    }
  ];

  // Datos de ejemplo expandidos para múltiples semanas
  const trainingSessions: TrainingSession[] = [
    {
      id: '1',
      planId: 'plan1',
      date: '2025-01-27',
      time: '07:00',
      name: 'Carrera Tempo Matutina',
      type: 'training',
      duration: 45,
      intensity: 'medium',
      location: 'Parque Central',
      status: 'pending',
      coach: 'María González',
      description: 'Entrenamiento de resistencia aeróbica con ritmo sostenido',
      intervals: [
        { work: '20 min a 75% VO₂ Max', rest: '5 min recuperación', repetitions: 1 }
      ],
      warmup: '10 min trote suave + ejercicios de movilidad',
      cooldown: '10 min trote suave + estiramientos',
      objectives: [
        'Mejorar resistencia aeróbica',
        'Mantener ritmo tempo sostenido',
        'Preparar base para intervalos de la semana'
      ],
      equipment: ['Reloj deportivo', 'Botella de agua'],
      targetZones: {
        heartRate: '150-165 bpm',
        pace: '4:45-5:00 min/km',
        effort: '7/10'
      }
    },
    {
      id: '2',
      planId: 'plan1',
      date: '2025-01-27',
      time: '18:30',
      name: 'Técnica de Carrera',
      type: 'training',
      duration: 30,
      intensity: 'low',
      location: 'Pista de Atletismo',
      status: 'pending',
      coach: 'María González',
      description: 'Trabajo técnico y de coordinación',
      warmup: '15 min calentamiento dinámico',
      cooldown: '15 min estiramientos específicos',
      notes: 'Enfocarse en la cadencia y postura',
      objectives: [
        'Mejorar técnica de carrera',
        'Aumentar cadencia a 180 pasos/min',
        'Optimizar economía de carrera'
      ],
      equipment: ['Conos', 'Escalera de agilidad'],
      targetZones: {
        heartRate: '130-150 bpm',
        pace: 'Variable según ejercicio',
        effort: '5-6/10'
      }
    },
    {
      id: '3',
      planId: 'plan1',
      date: '2025-01-28',
      time: '07:30',
      name: 'Intervalos VO₂ Max',
      type: 'training',
      duration: 60,
      intensity: 'high',
      location: 'Pista de Atletismo',
      status: 'pending',
      coach: 'María González',
      description: 'Intervalos de alta intensidad para mejorar capacidad aeróbica máxima',
      intervals: [
        { work: '4 min a 95% VO₂ Max', rest: '3 min recuperación activa', repetitions: 5 }
      ],
      warmup: '20 min calentamiento progresivo',
      cooldown: '15 min enfriamiento suave',
      objectives: [
        'Aumentar VO₂ máximo',
        'Mejorar tolerancia al lactato',
        'Desarrollar velocidad aeróbica máxima'
      ],
      equipment: ['Reloj deportivo', 'Cronómetro'],
      targetZones: {
        heartRate: '175-185 bpm',
        pace: '3:45-4:00 min/km',
        effort: '9/10'
      }
    },
    {
      id: '4',
      planId: 'plan1',
      date: '2025-01-29',
      time: '17:00',
      name: 'Carrera de Recuperación',
      type: 'recovery',
      duration: 30,
      intensity: 'recovery',
      location: 'Sendero Natural',
      status: 'pending',
      coach: 'María González',
      description: 'Carrera suave para recuperación activa',
      warmup: '5 min caminata + movilidad',
      cooldown: '10 min estiramientos profundos'
    },
    {
      id: '5',
      planId: 'plan1',
      date: '2025-01-30',
      time: '07:00',
      name: 'Fartlek en Colinas',
      type: 'training',
      duration: 50,
      intensity: 'high',
      location: 'Parque Metropolitano',
      status: 'pending',
      coach: 'María González',
      description: 'Entrenamiento de velocidad variable en terreno montañoso',
      intervals: [
        { work: '2 min fuerte', rest: '1 min suave', repetitions: 8 },
        { work: '30 seg sprint', rest: '30 seg recuperación', repetitions: 6 }
      ],
      warmup: '15 min trote de calentamiento',
      cooldown: '10 min trote suave'
    },
    {
      id: '6',
      planId: 'plan1',
      date: '2025-01-31',
      time: '08:00',
      name: 'Carrera Larga Base',
      type: 'training',
      duration: 75,
      intensity: 'medium',
      location: 'Ruta Costera',
      status: 'pending',
      coach: 'María González',
      description: 'Carrera larga para desarrollar resistencia aeróbica',
      warmup: '10 min trote muy suave',
      cooldown: '10 min caminata + hidratación',
      notes: 'Mantener ritmo conversacional, hidratarse cada 20 min'
    },
    {
      id: '7',
      planId: 'plan2',
      date: '2025-02-01',
      time: '09:00',
      name: 'Competencia Preparatoria - 5K',
      type: 'prep_competition',
      duration: 25,
      intensity: 'high',
      location: 'Circuito Atlético Municipal',
      status: 'pending',
      coach: 'María González',
      description: 'Carrera de preparación para evaluar progreso',
      warmup: '25 min calentamiento específico + progresivos',
      cooldown: '20 min enfriamiento + análisis',
      notes: 'Objetivo: Sub 20:00 min - Estrategia: salida controlada, acelerar últimos 1500m'
    },
    {
      id: '8',
      planId: 'plan2',
      date: '2025-02-02',
      time: '10:00',
      name: 'Recuperación Activa',
      type: 'recovery',
      duration: 40,
      intensity: 'recovery',
      location: 'Piscina Municipal',
      status: 'pending',
      coach: 'María González',
      description: 'Sesión de aqua-running y estiramientos',
      warmup: '10 min movilidad en agua',
      cooldown: '15 min relajación + sauna',
      notes: 'Enfoque en recuperación muscular post-competencia',
      objectives: [
        'Recuperación muscular completa',
        'Mantener movilidad articular',
        'Relajación mental post-competencia'
      ],
      equipment: ['Traje de baño', 'Gafas de natación', 'Toalla'],
      targetZones: {
        heartRate: '120-140 bpm',
        pace: 'Conversacional muy suave',
        effort: '3-4/10'
      }
    },
    // Semana siguiente
    {
      id: '9',
      planId: 'plan2',
      date: '2025-02-03',
      time: '07:00',
      name: 'Carrera Tempo Progresiva',
      type: 'training',
      duration: 50,
      intensity: 'medium',
      location: 'Parque Central',
      status: 'pending',
      coach: 'María González',
      description: 'Tempo run con progresión gradual de ritmo',
      intervals: [
        { work: '15 min tempo', rest: '3 min', repetitions: 2 },
        { work: '10 min progresión', rest: '', repetitions: 1 }
      ],
      warmup: '15 min calentamiento dinámico',
      cooldown: '10 min enfriamiento'
    },
    {
      id: '10',
      planId: 'plan1',
      date: '2025-02-04',
      time: '18:00',
      name: 'Entrenamiento de Fuerza',
      type: 'training',
      duration: 45,
      intensity: 'medium',
      location: 'Gimnasio Municipal',
      status: 'pending',
      coach: 'Carlos Martínez',
      description: 'Trabajo de fuerza específica para corredores',
      warmup: '10 min calentamiento general',
      cooldown: '10 min estiramientos',
      notes: 'Enfoque en core y piernas, peso moderado'
    },
    {
      id: '11',
      planId: 'plan1',
      date: '2025-02-05',
      time: '07:30',
      name: 'Series de Velocidad',
      type: 'training',
      duration: 55,
      intensity: 'high',
      location: 'Pista de Atletismo',
      status: 'pending',
      coach: 'María González',
      description: 'Trabajo de velocidad pura en pista',
      intervals: [
        { work: '200m a máx', rest: '3 min', repetitions: 6 },
        { work: '100m a máx', rest: '2 min', repetitions: 4 }
      ],
      warmup: '20 min calentamiento + aceleraciones',
      cooldown: '15 min enfriamiento'
    },
    {
      id: '12',
      planId: 'plan1',
      date: '2025-02-06',
      time: '17:30',
      name: 'Carrera de Recuperación',
      type: 'recovery',
      duration: 35,
      intensity: 'recovery',
      location: 'Sendero Natural',
      status: 'pending',
      coach: 'María González',
      description: 'Recuperación activa en terreno suave',
      warmup: '5 min caminata',
      cooldown: '10 min estiramientos'
    },
    {
      id: '13',
      planId: 'plan1',
      date: '2025-02-07',
      time: '08:00',
      name: 'Carrera Larga Aeróbica',
      type: 'training',
      duration: 80,
      intensity: 'medium',
      location: 'Ruta Costera',
      status: 'pending',
      coach: 'María González',
      description: 'Carrera larga para base aeróbica',
      warmup: '10 min trote suave',
      cooldown: '10 min caminata',
      notes: 'Mantener conversación, hidratación cada 15 min'
    },
    {
      id: '14',
      planId: 'plan1',
      date: '2025-02-08',
      time: '09:00',
      name: 'Cross Training - Ciclismo',
      type: 'training',
      duration: 60,
      intensity: 'medium',
      location: 'Ciclovía Municipal',
      status: 'pending',
      coach: 'Ana Ruiz',
      description: 'Entrenamiento cruzado en bicicleta',
      warmup: '10 min pedaleo suave',
      cooldown: '10 min estiramientos',
      notes: 'Alternar intensidades cada 10 minutos'
    },
    {
      id: '15',
      planId: 'plan2',
      date: '2025-02-09',
      time: '10:00',
      name: 'Descanso Activo',
      type: 'recovery',
      duration: 30,
      intensity: 'recovery',
      location: 'Centro de Yoga',
      status: 'pending',
      coach: 'Lucía Fernández',
      description: 'Sesión de yoga y relajación',
      warmup: '5 min respiración',
      cooldown: '10 min meditación'
    }
  ];

  const weeklyStats: WeeklyStats = {
    totalSessions: 8,
    completedSessions: 6,
    totalDuration: 355, // minutos
    weeklyGoal: 300, // minutos
    improvementScore: 12.5
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

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'recovery': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string, sessionId?: string) => {
    // Verificar si la sesión fue marcada como completada localmente
    if (sessionId && completedSessions.has(sessionId)) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getCurrentWeekSessions = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (selectedWeek * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return trainingSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });
  };

  const weekSessions = getCurrentWeekSessions();

  // Simulación de feedback nuevo disponible
  const hasNewFeedback = true;
  const newFeedbackCount = 2;

  // Función para filtrar entrenamientos para la vista completa
  const getFilteredSessions = () => {
    return trainingSessions.filter(session => {
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || session.type === typeFilter;
      const matchesIntensity = intensityFilter === 'all' || session.intensity === intensityFilter;
      const matchesPlan = selectedPlanId === 'all' || session.planId === selectedPlanId;
      
      return matchesSearch && matchesType && matchesIntensity && matchesPlan;
    });
  };

  // Agrupar entrenamientos por semanas
  const getSessionsByWeek = () => {
    const sessionsByWeek: { [key: string]: TrainingSession[] } = {};
    
    trainingSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!sessionsByWeek[weekKey]) {
        sessionsByWeek[weekKey] = [];
      }
      sessionsByWeek[weekKey].push(session);
    });
    
    return sessionsByWeek;
  };

  const filteredSessions = getFilteredSessions();
  const sessionsByWeek = getSessionsByWeek();

  // Función para obtener sesiones por planificación
  const getSessionsByPlan = () => {
    const sessionsByPlan: { [key: string]: TrainingSession[] } = {};
    
    filteredSessions.forEach(session => {
      if (!sessionsByPlan[session.planId]) {
        sessionsByPlan[session.planId] = [];
      }
      sessionsByPlan[session.planId].push(session);
    });
    
    return sessionsByPlan;
  };

  const sessionsByPlan = getSessionsByPlan();

  // Función para obtener plan por ID
  const getPlanById = (planId: string) => {
    return trainingPlans.find(plan => plan.id === planId);
  };

  // Función para obtener color de fase del plan
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

  // Función para obtener color de estado del plan
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSessionDetail = (session: TrainingSession) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
  };

  const handleToggleCompleted = (sessionId: string) => {
    if (!selectedSession) return;
    
    const isCurrentlyCompleted = completedSessions.has(sessionId);
    const planId = selectedSession.planId;
    
    if (isCurrentlyCompleted) {
      // Desmarcar como completada
      setCompletedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      
      // Decrementar estadísticas de la planificación
      setPlanCompletedSessions(prev => ({
        ...prev,
        [planId]: Math.max(0, (prev[planId] || 0) - 1)
      }));
      
      // Actualizar datos locales
      const updatedSession = { ...selectedSession, status: 'pending' as const };
      setSelectedSession(updatedSession);
      
      console.log(`Sesión "${selectedSession.name}" desmarcada como completada`);
    } else {
      // Marcar como completada
      setCompletedSessions(prev => new Set([...prev, sessionId]));
      
      // Incrementar estadísticas de la planificación
      setPlanCompletedSessions(prev => ({
        ...prev,
        [planId]: (prev[planId] || 0) + 1
      }));
      
      // Actualizar datos locales
      const updatedSession = { ...selectedSession, status: 'completed' as const };
      setSelectedSession(updatedSession);
      
      console.log(`Sesión "${selectedSession.name}" marcada como completada`);
    }
    
    // Cerrar modal
    setIsSessionDetailOpen(false);
  };

  const handleReportIssue = (sessionId: string) => {
    // Aquí se implementaría la lógica para reportar problema
    console.log(`Reporting issue for session ${sessionId}`);
    setIsSessionDetailOpen(false);
  };

  // Función legacy para compatibilidad
  const handleMarkCompleted = (sessionId: string) => {
    handleToggleCompleted(sessionId);
  };

  // Función para ver calendario con filtro de planificación
  const handleViewPlanCalendar = (planId: string) => {
    setSelectedPlanId(planId);
    setShowMonthlyView(true);
    setActiveTab('calendar');
  };

  // Función para generar días del calendario mensual
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    // Primer día de la semana que contiene el primer día del mes
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generar 42 días (6 semanas x 7 días)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Función para obtener sesiones de un día específico
  const getSessionsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return trainingSessions.filter(session => {
      const sessionDate = session.date;
      const matchesPlan = selectedPlanId === 'all' || session.planId === selectedPlanId;
      return sessionDate === dateString && matchesPlan;
    });
  };

  // Función para navegar meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="space-y-6">
      {/* Notificación de nuevo feedback */}
      {hasNewFeedback && (
        <Alert className="border-accent/50 bg-accent/10">
          <Bell className="h-4 w-4 text-accent" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>¡Tienes {newFeedbackCount} retroalimentaciones nuevas!</strong> Tu entrenador ha revisado tus entrenamientos recientes.
              </span>
              <Button size="sm" className="bg-accent hover:bg-accent/90 ml-4">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ver Feedback
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header con estadísticas de la semana */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {weeklyStats.completedSessions}/{weeklyStats.totalSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((weeklyStats.completedSessions / weeklyStats.totalSessions) * 100)}% completado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatTime(weeklyStats.totalDuration)}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: {formatTime(weeklyStats.weeklyGoal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso Semanal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round((weeklyStats.totalDuration / weeklyStats.weeklyGoal) * 100)}%
            </div>
            <Progress 
              value={(weeklyStats.totalDuration / weeklyStats.weeklyGoal) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejora</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{weeklyStats.improvementScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs. semana anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navegación de semanas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Mi Plan de Entrenamientos</h2>
          <p className="text-muted-foreground">
            Planificado por María González • Programa de Resistencia 10K
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            disabled={selectedWeek <= -2}
          >
            ← Anterior
          </Button>
          <Badge variant="outline" className="px-3">
            {selectedWeek === 0 ? 'Esta Semana' : 
             selectedWeek === 1 ? 'Próxima Semana' : 
             selectedWeek === -1 ? 'Semana Pasada' : 
             `Semana ${selectedWeek > 0 ? '+' : ''}${selectedWeek}`}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            disabled={selectedWeek >= 2}
          >
            Siguiente →
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="details">
            <Target className="w-4 h-4 mr-2" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="planning">
            <CalendarDays className="w-4 h-4 mr-2" />
            Sesiones
          </TabsTrigger>
          <TabsTrigger value="planifications">
            <FolderOpen className="w-4 h-4 mr-2" />
            Planificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {/* Filtro de planificación en vista calendario */}
          {selectedPlanId !== 'all' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Filtrando por: {getPlanById(selectedPlanId)?.name}
                      </h4>
                      <p className="text-sm text-blue-700">
                        Mostrando solo las sesiones de esta planificación
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMonthlyView(!showMonthlyView)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      {showMonthlyView ? 'Vista Semanal' : 'Vista Mensual'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPlanId('all');
                        setShowMonthlyView(false);
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Mostrar Todas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showMonthlyView ? (
            /* Vista de calendario mensual */
            <div className="space-y-4">
              {/* Header del calendario */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                      >
                        ← Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                      >
                        Siguiente →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Calendario mensual */}
              <Card>
                <CardContent className="p-0">
                  {/* Días de la semana */}
                  <div className="grid grid-cols-7 border-b">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                      <div key={day} className="p-3 text-center font-medium text-sm bg-muted/30 border-r last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7">
                    {generateCalendarDays().map((date, index) => {
                      const daysSessions = getSessionsForDay(date);
                      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                            !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
                          } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                          {/* Número del día */}
                          <div className={`text-sm mb-1 ${
                            isToday ? 'font-semibold text-blue-600' : 
                            isCurrentMonth ? 'font-medium' : 'font-normal'
                          }`}>
                            {date.getDate()}
                          </div>

                          {/* Sesiones del día */}
                          <div className="space-y-1">
                            {daysSessions.slice(0, 3).map((session) => (
                              <div
                                key={session.id}
                                onClick={() => handleSessionDetail(session)}
                                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                                  getSessionTypeColor(session.type)
                                }`}
                              >
                                <div className="font-medium truncate">{session.time}</div>
                                <div className="truncate">{session.name}</div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-1 h-1 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                                  <span className="truncate">{session.location}</span>
                                </div>
                              </div>
                            ))}
                            {daysSessions.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{daysSessions.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Leyenda de colores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Leyenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                      <span className="text-sm">Entrenamiento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
                      <span className="text-sm">Comp. Preparatoria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                      <span className="text-sm">Competencia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                      <span className="text-sm">Recuperación</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm">Alta intensidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Media intensidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Baja intensidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">Recuperación</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Vista de calendario semanal */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekSessions.filter(session => selectedPlanId === 'all' || session.planId === selectedPlanId).map((session) => (
                <Card 
                  key={session.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSessionDetail(session)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <CardTitle className="text-base">{session.name}</CardTitle>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getSessionTypeColor(session.type)}
                      >
                        {session.type === 'training' ? 'Entrenamiento' :
                         session.type === 'prep_competition' ? 'Comp. Prep.' :
                         session.type === 'main_competition' ? 'Competencia' : 'Recuperación'}
                      </Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(session.date)} • {session.time}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {session.location}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm">{session.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="text-sm">{formatTime(session.duration)}</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${getIntensityColor(session.intensity)}`}></div>
                            <span className="text-sm capitalize">{session.intensity}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{session.coach}</span>
                        </div>
                      </div>

                      {session.hasNewFeedback && (
                        <div className="flex items-center space-x-2 p-2 bg-accent/10 rounded-md border border-accent/20">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <span className="text-sm text-accent font-medium">Nuevo feedback disponible</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {weekSessions.filter(session => selectedPlanId === 'all' || session.planId === selectedPlanId).length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay entrenamientos programados</h3>
                    <p className="text-muted-foreground">
                      Esta semana no tienes sesiones programadas. Revisa otras semanas o contacta a tu entrenador.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Controles de filtro */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Entrenamientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar entrenamientos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="training">Entrenamiento</SelectItem>
                      <SelectItem value="prep_competition">Comp. Preparatoria</SelectItem>
                      <SelectItem value="main_competition">Competencia</SelectItem>
                      <SelectItem value="recovery">Recuperación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Intensidad</label>
                  <Select value={intensityFilter} onValueChange={setIntensityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las intensidades</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="recovery">Recuperación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Planificación</label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las planificaciones</SelectItem>
                      {trainingPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Indicador de resultados */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredSessions.length} de {trainingSessions.length} entrenamientos
                </p>
                {(searchTerm || typeFilter !== 'all' || intensityFilter !== 'all' || selectedPlanId !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setIntensityFilter('all');
                      setSelectedPlanId('all');
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de entrenamientos filtrados */}
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card 
                key={session.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSessionDetail(session)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(session.status)}
                        <h3 className="font-semibold">{session.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={getSessionTypeColor(session.type)}
                        >
                          {session.type === 'training' ? 'Entrenamiento' :
                           session.type === 'prep_competition' ? 'Comp. Prep.' :
                           session.type === 'main_competition' ? 'Competencia' : 'Recuperación'}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground">{session.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatDate(session.date)}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          {session.time} • {formatTime(session.duration)}
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          {session.location}
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          {session.coach}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getIntensityColor(session.intensity)}`}></div>
                          <span className="text-sm capitalize">Intensidad {session.intensity}</span>
                        </div>
                        <Badge variant="outline" className={getPhaseColor(getPlanById(session.planId)?.phase || 'base')}>
                          {getPlanById(session.planId)?.name}
                        </Badge>
                      </div>

                      {session.hasNewFeedback && (
                        <div className="flex items-center space-x-2 p-2 bg-accent/10 rounded-md border border-accent/20">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <span className="text-sm text-accent font-medium">Nuevo feedback disponible</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredSessions.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron entrenamientos</h3>
                  <p className="text-muted-foreground">
                    Intenta ajustar los filtros para encontrar lo que buscas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entrenamientos por Semana</CardTitle>
              <CardDescription>
                Vista organizada de todas tus sesiones de entrenamiento agrupadas por semanas
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            {Object.entries(sessionsByWeek)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([weekStart, sessions]) => {
                const weekDate = new Date(weekStart);
                const weekEnd = new Date(weekDate);
                weekEnd.setDate(weekDate.getDate() + 6);
                
                const filteredWeekSessions = sessions.filter(session => {
                  const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       session.location.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesType = typeFilter === 'all' || session.type === typeFilter;
                  const matchesIntensity = intensityFilter === 'all' || session.intensity === intensityFilter;
                  const matchesPlan = selectedPlanId === 'all' || session.planId === selectedPlanId;
                  
                  return matchesSearch && matchesType && matchesIntensity && matchesPlan;
                });

                if (filteredWeekSessions.length === 0) return null;

                return (
                  <Card key={weekStart}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Semana del {weekDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                          </CardTitle>
                          <CardDescription>
                            {filteredWeekSessions.length} sesiones programadas
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {filteredWeekSessions.filter(s => s.status === 'completed').length}/{filteredWeekSessions.length} completadas
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {filteredWeekSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => handleSessionDetail(session)}
                          >
                            <div className="flex items-center space-x-4">
                              {getStatusIcon(session.status, session.id)}
                              <div>
                                <h4 className="font-medium">{session.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{formatDate(session.date)} • {session.time}</span>
                                  <span>{session.location}</span>
                                  <span>{formatTime(session.duration)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={getSessionTypeColor(session.type)}
                              >
                                {session.type === 'training' ? 'Entrenamiento' :
                                 session.type === 'prep_competition' ? 'Comp. Prep.' :
                                 session.type === 'main_competition' ? 'Competencia' : 'Recuperación'}
                              </Badge>
                              <div className={`w-3 h-3 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="planifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Planificaciones de Entrenamiento</CardTitle>
              <CardDescription>
                Todos los programas de entrenamiento creados por tu entrenador
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-6">
            {trainingPlans.map((plan) => {
              const planSessions = sessionsByPlan[plan.id] || [];
              // Contar sesiones completadas incluyendo las marcadas localmente
              const localCompletedCount = planSessions.filter(s => 
                s.status === 'completed' || completedSessions.has(s.id)
              ).length;
              const totalCompleted = Math.max(planCompletedSessions[plan.id] || 0, localCompletedCount);
              const progressPercentage = plan.totalSessions > 0 ? (totalCompleted / plan.totalSessions) * 100 : 0;
              
              return (
                <Card key={plan.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <Badge className={getStatusColor(plan.status)}>
                            {plan.status === 'active' ? 'Activo' : 
                             plan.status === 'completed' ? 'Completado' : 'Pausado'}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {plan.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(plan.startDate).toLocaleDateString('es-ES')} - {new Date(plan.endDate).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Entrenador: {plan.coach}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getPhaseColor(plan.phase)}>
                        {plan.phase === 'base' ? 'Base' :
                         plan.phase === 'build' ? 'Construcción' :
                         plan.phase === 'peak' ? 'Pico' :
                         plan.phase === 'recovery' ? 'Recuperación' : 'Competencia'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Objetivo del plan */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <h4 className="font-medium">Objetivo</h4>
                      </div>
                      <p className="text-muted-foreground pl-6">{plan.objective}</p>
                    </div>

                    {/* Estadísticas del plan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-muted">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary">{totalCompleted}/{plan.totalSessions}</div>
                          <p className="text-sm text-muted-foreground">Sesiones Completadas</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-muted">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                          <p className="text-sm text-muted-foreground">Progreso</p>
                          <Progress value={progressPercentage} className="mt-2" />
                        </CardContent>
                      </Card>
                      
                      <Card className="border-muted">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary">{planSessions.length}</div>
                          <p className="text-sm text-muted-foreground">Total Sesiones</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Vista previa de sesiones */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Próximas Sesiones
                        </h4>
                        {planSessions.length > 3 && (
                          <span className="text-sm text-muted-foreground">
                            Mostrando 3 de {planSessions.length} sesiones
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {planSessions.slice(0, 3).map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleSessionDetail(session)}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(session.status, session.id)}
                              <div>
                                <p className="font-medium text-sm">{session.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(session.date)} • {session.time} • {session.location}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getSessionTypeColor(session.type)}`}
                              >
                                {session.type === 'training' ? 'Entrenamiento' :
                                 session.type === 'prep_competition' ? 'Comp. Prep.' :
                                 session.type === 'main_competition' ? 'Competencia' : 'Recuperación'}
                              </Badge>
                              <div className={`w-2 h-2 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acciones del plan */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleViewPlanCalendar(plan.id)}
                        className="w-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Ver en Calendario
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalle de sesión */}
      <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedSession.name}</DialogTitle>
                  <Badge 
                    variant="outline" 
                    className={getSessionTypeColor(selectedSession.type)}
                  >
                    {selectedSession.type === 'training' ? 'Entrenamiento' :
                     selectedSession.type === 'prep_competition' ? 'Comp. Prep.' :
                     selectedSession.type === 'main_competition' ? 'Competencia' : 'Recuperación'}
                  </Badge>
                </div>
                <DialogDescription>
                  Detalles completos de la sesión de entrenamiento incluyendo objetivos, intervalos, zonas objetivo y equipamiento necesario.
                </DialogDescription>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(selectedSession.date)} • {selectedSession.time}
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedSession.location}
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2" />
                    Entrenador: {selectedSession.coach}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Duración</p>
                    <p className="text-2xl font-bold text-primary">{formatTime(selectedSession.duration)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Intensidad</p>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${getIntensityColor(selectedSession.intensity)}`}></div>
                      <span className="capitalize font-medium">{selectedSession.intensity}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Estado</p>
                    <div className="flex items-center">
                      {getStatusIcon(
                        completedSessions.has(selectedSession.id) ? 'completed' : selectedSession.status, 
                        selectedSession.id
                      )}
                      <span className="ml-2 capitalize">
                        {completedSessions.has(selectedSession.id) ? 'Completado' : 
                         selectedSession.status === 'pending' ? 'Pendiente' : 
                         selectedSession.status === 'completed' ? 'Completado' : 'Perdido'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Planificación</p>
                    <Badge variant="outline" className={getPhaseColor(getPlanById(selectedSession.planId)?.phase || 'base')}>
                      {getPlanById(selectedSession.planId)?.category}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Descripción */}
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{selectedSession.description}</p>
                </div>

                {/* Zonas objetivo */}
                {selectedSession.targetZones && (
                  <div>
                    <h4 className="font-medium mb-3">Zonas Objetivo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedSession.targetZones.heartRate && (
                        <Card className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <Activity className="w-4 h-4 mr-2 text-red-500" />
                              <span className="font-medium">Frecuencia Cardíaca</span>
                            </div>
                            <p className="text-lg font-bold">{selectedSession.targetZones.heartRate}</p>
                          </CardContent>
                        </Card>
                      )}
                      {selectedSession.targetZones.pace && (
                        <Card className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <Zap className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="font-medium">Ritmo</span>
                            </div>
                            <p className="text-lg font-bold">{selectedSession.targetZones.pace}</p>
                          </CardContent>
                        </Card>
                      )}
                      {selectedSession.targetZones.effort && (
                        <Card className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <Target className="w-4 h-4 mr-2 text-green-500" />
                              <span className="font-medium">Esfuerzo Percibido</span>
                            </div>
                            <p className="text-lg font-bold">{selectedSession.targetZones.effort}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Calentamiento */}
                {selectedSession.warmup && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Play className="w-4 h-4 mr-2 text-green-600" />
                      Calentamiento
                    </h4>
                    <p className="text-muted-foreground bg-green-50 p-3 rounded-lg border border-green-200">
                      {selectedSession.warmup}
                    </p>
                  </div>
                )}

                {/* Intervalos */}
                {selectedSession.intervals && selectedSession.intervals.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Timer className="w-4 h-4 mr-2 text-blue-600" />
                      Intervalos
                    </h4>
                    <div className="space-y-3">
                      {selectedSession.intervals.map((interval, index) => (
                        <Card key={index} className="border-blue-200 bg-blue-50">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-blue-900">Trabajo</p>
                                <p className="font-bold text-blue-700">{interval.work}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">Descanso</p>
                                <p className="font-bold text-blue-700">{interval.rest}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">Repeticiones</p>
                                <p className="font-bold text-blue-700">{interval.repetitions}x</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enfriamiento */}
                {selectedSession.cooldown && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Pause className="w-4 h-4 mr-2 text-purple-600" />
                      Enfriamiento
                    </h4>
                    <p className="text-muted-foreground bg-purple-50 p-3 rounded-lg border border-purple-200">
                      {selectedSession.cooldown}
                    </p>
                  </div>
                )}

                {/* Objetivos */}
                {selectedSession.objectives && selectedSession.objectives.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-accent" />
                      Objetivos de la Sesión
                    </h4>
                    <ul className="space-y-2">
                      {selectedSession.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Equipamiento */}
                {selectedSession.equipment && selectedSession.equipment.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Equipamiento Necesario</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.equipment.map((item, index) => (
                        <Badge key={index} variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas adicionales */}
                {selectedSession.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notas Adicionales</h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                      {selectedSession.notes}
                    </p>
                  </div>
                )}

                {/* Feedback nuevo disponible */}
                {selectedSession.hasNewFeedback && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="w-5 h-5 mr-2 text-accent" />
                      <h4 className="font-medium text-accent">Feedback del Entrenador</h4>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Tu entrenador ha dejado comentarios sobre esta sesión.
                    </p>
                    <Button size="sm" className="bg-accent hover:bg-accent/90">
                      Ver Feedback Completo
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                {selectedSession.status === 'pending' || completedSessions.has(selectedSession.id) ? (
                  <>
                    <Button 
                      onClick={() => handleToggleCompleted(selectedSession.id)}
                      className="w-full sm:w-auto"
                      variant={completedSessions.has(selectedSession.id) ? "outline" : "default"}
                    >
                      {completedSessions.has(selectedSession.id) ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Desmarcar Completado
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como Completado
                        </>
                      )}
                    </Button>
                    {!completedSessions.has(selectedSession.id) && (
                      <Button 
                        variant="outline"
                        onClick={() => handleReportIssue(selectedSession.id)}
                        className="w-full sm:w-auto"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Reportar Problema
                      </Button>
                    )}
                  </>
                ) : null}
                <Button 
                  variant="outline" 
                  onClick={() => setIsSessionDetailOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}