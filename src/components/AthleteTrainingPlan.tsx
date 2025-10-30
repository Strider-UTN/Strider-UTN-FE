import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Calendar, Clock, Target, ChevronRight, ChevronDown, BookOpen, CalendarDays, Eye, MapPin, Timer, Play, CheckCircle, ChevronLeft, Home, Info } from 'lucide-react';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

// Interfaces para la estructura jerárquica de planificación
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
  totalLoad: number; // Carga de entrenamiento semanal
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
}

type NavigationLevel = 'macrocycle' | 'mesocycle' | 'microcycle' | 'session';

export function AthleteTrainingPlan() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [navigationLevel, setNavigationLevel] = useState<NavigationLevel>('macrocycle');
  const [selectedMacrocycle, setSelectedMacrocycle] = useState<string | null>(null);
  const [selectedMesocycle, setSelectedMesocycle] = useState<string | null>(null);
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set(['session1', 'session4']));
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0, 1)); // Enero 2025
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Macrociclos disponibles del atleta
  const macrocycles: Macrocycle[] = [
    {
      id: 'macro1',
      name: 'Temporada 2025 - Desarrollo de Medio Fondo',
      description: 'Planificación anual enfocada en competencias de 5K y 10K con picos competitivos en primavera y otoño',
      coach: 'María González',
      athlete: 'Ana Martínez',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      objective: 'Mejorar marcas personales en 5K (objetivo: sub 20:00) y 10K (objetivo: sub 42:00)',
      totalWeeks: 52,
      status: 'active',
      mesocycles: [
        {
          id: 'meso1',
          macrocycleId: 'macro1',
          name: 'Mesociclo 1: Base Aeróbica',
          description: 'Desarrollo de la capacidad aeróbica y construcción de base de entrenamiento',
          startDate: '2025-01-01',
          endDate: '2025-01-28',
          phase: 'base',
          objectives: [
            'Desarrollar base aeróbica sólida',
            'Aumentar volumen de entrenamiento gradualmente',
            'Establecer rutinas de entrenamiento',
            'Prevenir lesiones con trabajo de fuerza'
          ],
          weekCount: 4,
          microcycles: [
            {
              id: 'micro1',
              mesocycleId: 'meso1',
              weekNumber: 1,
              name: 'Semana 1: Adaptación Inicial',
              startDate: '2025-01-01',
              endDate: '2025-01-07',
              focus: 'Adaptación progresiva al volumen de entrenamiento',
              totalLoad: 85,
              sessions: [
                {
                  id: 'session1',
                  microcycleId: 'micro1',
                  date: '2025-01-02',
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
                  }
                },
                {
                  id: 'session2',
                  microcycleId: 'micro1',
                  date: '2025-01-03',
                  time: '18:30',
                  name: 'Técnica + Fuerza',
                  type: 'training',
                  duration: 60,
                  intensity: 'low',
                  location: 'Gimnasio Municipal',
                  status: 'pending',
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
                  }
                },
                {
                  id: 'session3',
                  microcycleId: 'micro1',
                  date: '2025-01-04',
                  time: '07:00',
                  name: 'Carrera Larga Suave',
                  type: 'training',
                  duration: 70,
                  intensity: 'medium',
                  location: 'Ruta Costera',
                  status: 'pending',
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
                  }
                },
                {
                  id: 'session4',
                  microcycleId: 'micro1',
                  date: '2025-01-06',
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
                  }
                }
              ]
            },
            {
              id: 'micro2',
              mesocycleId: 'meso1',
              weekNumber: 2,
              name: 'Semana 2: Incremento de Volumen',
              startDate: '2025-01-08',
              endDate: '2025-01-14',
              focus: 'Incremento gradual del volumen semanal',
              totalLoad: 95,
              sessions: [
                {
                  id: 'session5',
                  microcycleId: 'micro2',
                  date: '2025-01-09',
                  time: '07:00',
                  name: 'Fartlek Suave',
                  type: 'training',
                  duration: 50,
                  intensity: 'medium',
                  location: 'Parque del Este',
                  status: 'pending',
                  coach: 'María González',
                  description: 'Trabajo de velocidad variable para desarrollo aeróbico',
                  intervals: [
                    { work: '5 min ritmo base', rest: '2 min suave', repetitions: 6 }
                  ],
                  warmup: '15 min calentamiento progresivo',
                  cooldown: '10 min trote suave',
                  objectives: [
                    'Adaptación a cambios de ritmo',
                    'Desarrollo aeróbico con estímulos variados',
                    'Economía de carrera'
                  ],
                  equipment: ['Zapatillas running', 'Reloj GPS'],
                  targetZones: {
                    heartRate: 'Base: 140-150 / Rápido: 160-170 bpm',
                    pace: 'Base: 5:30 / Rápido: 4:50 min/km',
                    effort: '6-8/10'
                  }
                }
              ]
            },
            {
              id: 'micro3',
              mesocycleId: 'meso1',
              weekNumber: 3,
              name: 'Semana 3: Consolidación',
              startDate: '2025-01-15',
              endDate: '2025-01-21',
              focus: 'Consolidación de adaptaciones',
              totalLoad: 100,
              sessions: []
            },
            {
              id: 'micro4',
              mesocycleId: 'meso1',
              weekNumber: 4,
              name: 'Semana 4: Descarga',
              startDate: '2025-01-22',
              endDate: '2025-01-28',
              focus: 'Semana de descarga y recuperación',
              totalLoad: 65,
              sessions: []
            }
          ]
        },
        {
          id: 'meso2',
          macrocycleId: 'macro1',
          name: 'Mesociclo 2: Desarrollo de Velocidad',
          description: 'Desarrollo de velocidad aeróbica y trabajo de umbral',
          startDate: '2025-01-29',
          endDate: '2025-02-25',
          phase: 'build',
          objectives: [
            'Desarrollar velocidad aeróbica',
            'Mejorar umbral anaeróbico',
            'Introducir trabajo de intervalos',
            'Mantener base aeróbica'
          ],
          weekCount: 4,
          microcycles: [
            {
              id: 'micro5',
              mesocycleId: 'meso2',
              weekNumber: 5,
              name: 'Semana 5: Introducción a Intervalos',
              startDate: '2025-01-29',
              endDate: '2025-02-04',
              focus: 'Primera semana con trabajo estructurado de intervalos',
              totalLoad: 100,
              sessions: [
                {
                  id: 'session6',
                  microcycleId: 'micro5',
                  date: '2025-01-30',
                  time: '07:00',
                  name: 'Intervalos 1000m',
                  type: 'training',
                  duration: 55,
                  intensity: 'high',
                  location: 'Pista de Atletismo',
                  status: 'pending',
                  coach: 'María González',
                  description: 'Trabajo tempo con progresivos finales',
                  intervals: [
                    { work: '1000m', rest: '400m trote', repetitions: 5 }
                  ],
                  warmup: '20 min calentamiento + drills',
                  cooldown: '15 min enfriamiento',
                  objectives: [
                    'Desarrollo de velocidad aeróbica',
                    'Adaptación al trabajo de intervalos',
                    'Economía de carrera a ritmo objetivo'
                  ],
                  equipment: ['Zapatillas pista', 'Cronómetro'],
                  targetZones: {
                    heartRate: '170-180 bpm',
                    pace: '4:20-4:30 min/km',
                    effort: '8-9/10'
                  }
                }
              ]
            },
            {
              id: 'micro6',
              mesocycleId: 'meso2',
              weekNumber: 6,
              name: 'Semana 6: Intensificación',
              startDate: '2025-02-05',
              endDate: '2025-02-11',
              focus: 'Aumento de intensidad en intervalos',
              totalLoad: 105,
              sessions: []
            },
            {
              id: 'micro7',
              mesocycleId: 'meso2',
              weekNumber: 7,
              name: 'Semana 7: Trabajo Umbral',
              startDate: '2025-02-12',
              endDate: '2025-02-18',
              focus: 'Desarrollo del umbral anaeróbico',
              totalLoad: 110,
              sessions: []
            },
            {
              id: 'micro8',
              mesocycleId: 'meso2',
              weekNumber: 8,
              name: 'Semana 8: Test y Evaluación',
              startDate: '2025-02-19',
              endDate: '2025-02-25',
              focus: 'Evaluación de progreso con test específico',
              totalLoad: 85,
              sessions: []
            }
          ]
        },
        {
          id: 'meso3',
          macrocycleId: 'macro1',
          name: 'Mesociclo 3: Preparación Competitiva',
          description: 'Puesta a punto para primera competencia importante de la temporada',
          startDate: '2025-02-26',
          endDate: '2025-03-25',
          phase: 'peak',
          objectives: [
            'Afinamiento para competencia objetivo',
            'Desarrollar velocidad específica de carrera',
            'Optimizar estrategias de carrera',
            'Maximizar economía de carrera'
          ],
          weekCount: 4,
          microcycles: [
            {
              id: 'micro9',
              mesocycleId: 'meso3',
              weekNumber: 9,
              name: 'Semana 9: Puesta a Punto',
              startDate: '2025-02-26',
              endDate: '2025-03-04',
              focus: 'Afinamiento específico para competencia',
              totalLoad: 90,
              sessions: []
            },
            {
              id: 'micro10',
              mesocycleId: 'meso3',
              weekNumber: 10,
              name: 'Semana 10: Velocidad Específica',
              startDate: '2025-03-05',
              endDate: '2025-03-11',
              focus: 'Trabajo específico al ritmo de competencia',
              totalLoad: 85,
              sessions: []
            },
            {
              id: 'micro11',
              mesocycleId: 'meso3',
              weekNumber: 11,
              name: 'Semana 11: Pre-Competencia',
              startDate: '2025-03-12',
              endDate: '2025-03-18',
              focus: 'Preparación final y descanso activo',
              totalLoad: 60,
              sessions: []
            },
            {
              id: 'micro12',
              mesocycleId: 'meso3',
              weekNumber: 12,
              name: 'Semana 12: Competencia',
              startDate: '2025-03-19',
              endDate: '2025-03-25',
              focus: 'Semana de competencia principal',
              totalLoad: 40,
              sessions: []
            }
          ]
        }
      ]
    }
  ];

  // Obtener macrociclo, mesociclo y microciclo actual
  const currentMacrocycle = macrocycles.find(m => m.id === selectedMacrocycle);
  const currentMesocycle = currentMacrocycle?.mesocycles.find(m => m.id === selectedMesocycle);
  const currentMicrocycle = currentMesocycle?.microcycles.find(m => m.id === selectedMicrocycle);

  // Obtener todas las sesiones según el contexto de navegación
  const getAllSessions = (): TrainingSession[] => {
    if (selectedMicrocycle && currentMicrocycle) {
      // Si hay un microciclo seleccionado, mostrar solo sus sesiones
      return currentMicrocycle.sessions;
    } else if (selectedMesocycle && currentMesocycle) {
      // Si hay un mesociclo seleccionado, mostrar sesiones de todos sus microciclos
      const sessions: TrainingSession[] = [];
      currentMesocycle.microcycles.forEach(microcycle => {
        sessions.push(...microcycle.sessions);
      });
      return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (selectedMacrocycle && currentMacrocycle) {
      // Si solo hay un macrociclo seleccionado, mostrar todas sus sesiones
      const sessions: TrainingSession[] = [];
      currentMacrocycle.mesocycles.forEach(mesocycle => {
        mesocycle.microcycles.forEach(microcycle => {
          sessions.push(...microcycle.sessions);
        });
      });
      return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return [];
  };

  // Funciones para el calendario
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

  const getSessionsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const allSessions = getAllSessions();
    return allSessions.filter(session => session.date === dateString);
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

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return 'Entrenamiento';
      case 'prep_competition': return 'Competencia Prep.';
      case 'main_competition': return 'Competencia Principal';
      case 'recovery': return 'Recuperación';
      default: return 'Sesión';
    }
  };

  const getStatusIcon = (status: string, sessionId: string) => {
    if (completedSessions.has(sessionId)) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missed': return <Clock className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
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
    setIsSessionDetailOpen(true);
  };

  const handleToggleCompleted = (sessionId: string) => {
    if (completedSessions.has(sessionId)) {
      setCompletedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      toast.info('Sesión desmarcada como completada');
    } else {
      setCompletedSessions(prev => new Set([...prev, sessionId]));
      toast.success('Sesión marcada como completada', {
        description: 'Recuerda: para registrar tu rendimiento, ve a "Subir Entrenamientos"'
      });
    }
    setIsSessionDetailOpen(false);
  };

  // Funciones de navegación jerárquica
  const handleSelectMacrocycle = (macrocycleId: string) => {
    setSelectedMacrocycle(macrocycleId);
    setSelectedMesocycle(null);
    setSelectedMicrocycle(null);
    setNavigationLevel('mesocycle');
  };

  const handleSelectMesocycle = (mesocycleId: string) => {
    setSelectedMesocycle(mesocycleId);
    setSelectedMicrocycle(null);
    setNavigationLevel('microcycle');
  };

  const handleSelectMicrocycle = (microcycleId: string) => {
    setSelectedMicrocycle(microcycleId);
    setNavigationLevel('session');
  };

  const handleBackToMacrocycles = () => {
    setSelectedMacrocycle(null);
    setSelectedMesocycle(null);
    setSelectedMicrocycle(null);
    setNavigationLevel('macrocycle');
  };

  const handleBackToMesocycles = () => {
    setSelectedMesocycle(null);
    setSelectedMicrocycle(null);
    setNavigationLevel('mesocycle');
  };

  const handleBackToMicrocycles = () => {
    setSelectedMicrocycle(null);
    setNavigationLevel('microcycle');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb de navegación */}
      {selectedMacrocycle && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBackToMacrocycles} className="cursor-pointer flex items-center gap-1">
                <Home className="w-4 h-4" />
                Macrociclos
              </BreadcrumbLink>
            </BreadcrumbItem>
            {selectedMacrocycle && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {selectedMesocycle ? (
                    <BreadcrumbLink onClick={handleBackToMesocycles} className="cursor-pointer">
                      {currentMacrocycle?.name}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{currentMacrocycle?.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {selectedMesocycle && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {selectedMicrocycle ? (
                    <BreadcrumbLink onClick={handleBackToMicrocycles} className="cursor-pointer">
                      {currentMesocycle?.name}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{currentMesocycle?.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {selectedMicrocycle && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentMicrocycle?.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Vista de selección de Macrociclo */}
      {navigationLevel === 'macrocycle' && (
        <div className="space-y-6">
          <div>
            <h1>Mi Planificación de Entrenamiento</h1>
            <p className="text-muted-foreground mt-1">
              Selecciona un macrociclo para ver su planificación detallada
            </p>
          </div>

          <div className="grid gap-6">
            {macrocycles.map((macrocycle) => (
              <Card key={macrocycle.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectMacrocycle(macrocycle.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {macrocycle.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {macrocycle.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={macrocycle.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : ''}>
                      {macrocycle.status === 'active' ? 'Activo' : macrocycle.status === 'completed' ? 'Completado' : 'Planificado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Entrenador</div>
                      <div className="font-medium">{macrocycle.coach}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Duración</div>
                      <div className="font-medium">{macrocycle.totalWeeks} semanas</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Período</div>
                      <div className="font-medium">{formatDateRange(macrocycle.startDate, macrocycle.endDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Mesociclos</div>
                      <div className="font-medium">{macrocycle.mesocycles.length} fases</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">Objetivo Principal</div>
                    <p className="text-sm">{macrocycle.objective}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      Ver Detalles
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Vista de Mesociclos del macrociclo seleccionado */}
      {navigationLevel === 'mesocycle' && currentMacrocycle && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1>{currentMacrocycle.name}</h1>
              <p className="text-muted-foreground mt-1">
                Selecciona un mesociclo para ver sus microciclos
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {currentMacrocycle.status === 'active' ? 'Activo' : 'Completado'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDateRange(currentMacrocycle.startDate, currentMacrocycle.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen del Macrociclo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Macrociclo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Duración Total</div>
                  <div className="text-2xl font-bold text-primary">{currentMacrocycle.totalWeeks} semanas</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Mesociclos Planificados</div>
                  <div className="text-2xl font-bold text-primary">{currentMacrocycle.mesocycles.length}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Progreso</div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((new Date().getTime() - new Date(currentMacrocycle.startDate).getTime()) / 
                    (new Date(currentMacrocycle.endDate).getTime() - new Date(currentMacrocycle.startDate).getTime()) * 100)}%
                  </div>
                  <Progress value={Math.round((new Date().getTime() - new Date(currentMacrocycle.startDate).getTime()) / 
                    (new Date(currentMacrocycle.endDate).getTime() - new Date(currentMacrocycle.startDate).getTime()) * 100)} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Mesociclos */}
          <div className="space-y-4">
            {currentMacrocycle.mesocycles.map((mesocycle, index) => (
              <Card key={mesocycle.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectMesocycle(mesocycle.id)}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3>{mesocycle.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mesocycle.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline" className={getPhaseColor(mesocycle.phase)}>
                              {mesocycle.phase === 'base' ? 'Base' : 
                               mesocycle.phase === 'build' ? 'Desarrollo' :
                               mesocycle.phase === 'peak' ? 'Pico' :
                               mesocycle.phase === 'recovery' ? 'Recuperación' : 'Competencia'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDateRange(mesocycle.startDate, mesocycle.endDate)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {mesocycle.weekCount} semanas • {mesocycle.microcycles.length} microciclos
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Vista de Microciclos del mesociclo seleccionado */}
      {navigationLevel === 'microcycle' && currentMesocycle && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1>{currentMesocycle.name}</h1>
              <p className="text-muted-foreground mt-1">
                Selecciona un microciclo para ver sus sesiones
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className={getPhaseColor(currentMesocycle.phase)}>
                  {currentMesocycle.phase === 'base' ? 'Base' : 
                   currentMesocycle.phase === 'build' ? 'Desarrollo' :
                   currentMesocycle.phase === 'peak' ? 'Pico' :
                   currentMesocycle.phase === 'recovery' ? 'Recuperación' : 'Competencia'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDateRange(currentMesocycle.startDate, currentMesocycle.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen del Mesociclo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Mesociclo</CardTitle>
              <CardDescription>{currentMesocycle.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Objetivos</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {currentMesocycle.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">Duración</div>
                    <div className="text-lg font-bold text-primary">{currentMesocycle.weekCount} semanas</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Microciclos</div>
                    <div className="text-lg font-bold text-primary">{currentMesocycle.microcycles.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Microciclos */}
          <div className="grid gap-4">
            {currentMesocycle.microcycles.map((microcycle) => (
              <Card key={microcycle.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectMicrocycle(microcycle.id)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">Semana {microcycle.weekNumber}</Badge>
                        <h3>{microcycle.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {microcycle.focus}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {formatDateRange(microcycle.startDate, microcycle.endDate)}
                        </span>
                        <span className="text-muted-foreground">
                          <Target className="w-4 h-4 inline mr-1" />
                          Carga: {microcycle.totalLoad}
                        </span>
                        <span className="text-muted-foreground">
                          <BookOpen className="w-4 h-4 inline mr-1" />
                          {microcycle.sessions.length} sesiones
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Vista de Sesiones del microciclo seleccionado */}
      {navigationLevel === 'session' && currentMicrocycle && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1>{currentMicrocycle.name}</h1>
              <p className="text-muted-foreground mt-1">
                {currentMicrocycle.focus}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline">Semana {currentMicrocycle.weekNumber}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDateRange(currentMicrocycle.startDate, currentMicrocycle.endDate)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Carga: {currentMicrocycle.totalLoad}
                </span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Eye className="w-4 h-4 mr-2" />
                Lista de Sesiones
              </TabsTrigger>
            </TabsList>

            {/* Vista del Calendario */}
            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Calendario de Entrenamientos</CardTitle>
                      <CardDescription>
                        Sesiones programadas para esta semana • {currentMicrocycle.sessions.length} sesiones totales
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="px-4 py-2 text-sm font-medium">
                            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <CalendarComponent
                            mode="single"
                            selected={currentMonth}
                            onSelect={(date) => {
                              if (date) {
                                setCurrentMonth(date);
                                setIsDatePickerOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
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
                                  {completedSessions.has(session.id) && (
                                    <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
                                  )}
                                </div>
                                <div className="truncate text-muted-foreground">
                                  {session.name}
                                </div>
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

                  {/* Leyenda de intensidades */}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vista de Lista de Sesiones */}
            <TabsContent value="sessions" className="space-y-4">
              {currentMicrocycle.sessions.length > 0 ? (
                currentMicrocycle.sessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full mt-1 ${getIntensityColor(session.intensity)}`}></div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="flex items-center gap-2">
                                {session.name}
                                {completedSessions.has(session.id) && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span><Clock className="w-4 h-4 inline mr-1" />{formatSessionDate(session.date)}</span>
                                <span><Timer className="w-4 h-4 inline mr-1" />{session.time}</span>
                                <span><MapPin className="w-4 h-4 inline mr-1" />{session.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getSessionTypeColor(session.type)}>
                                {getSessionTypeLabel(session.type)}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {session.intensity === 'low' ? 'Baja' :
                                 session.intensity === 'medium' ? 'Media' :
                                 session.intensity === 'high' ? 'Alta' : 'Recuperación'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {session.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Duración: {formatTime(session.duration)}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => handleSessionDetail(session)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-muted-foreground space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Target className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-medium">No hay sesiones programadas</p>
                        <p className="text-sm">Las sesiones aparecerán aquí una vez que tu entrenador complete la planificación</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal de Detalle de Sesión */}
      {selectedSession && (
        <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getIntensityColor(selectedSession.intensity)}`}></div>
                {selectedSession.name}
              </DialogTitle>
              <DialogDescription>
                {formatSessionDate(selectedSession.date)} • {selectedSession.time} • {selectedSession.location}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Duración</h4>
                  <p className="text-sm text-muted-foreground">{formatTime(selectedSession.duration)}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Intensidad</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedSession.intensity === 'low' ? 'Baja' :
                     selectedSession.intensity === 'medium' ? 'Media' :
                     selectedSession.intensity === 'high' ? 'Alta' : 'Recuperación'}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
              </div>

              {/* Calentamiento */}
              {selectedSession.warmup && (
                <div>
                  <h4 className="font-medium mb-2">Calentamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.warmup}</p>
                </div>
              )}

              {/* Intervalos */}
              {selectedSession.intervals && selectedSession.intervals.length > 0 && (
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

              {/* Enfriamiento */}
              {selectedSession.cooldown && (
                <div>
                  <h4 className="font-medium mb-2">Enfriamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.cooldown}</p>
                </div>
              )}

              {/* Objetivos */}
              {selectedSession.objectives && selectedSession.objectives.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Objetivos</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedSession.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Zonas objetivo */}
              {selectedSession.targetZones && (
                <div>
                  <h4 className="font-medium mb-2">Zonas Objetivo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedSession.targetZones.heartRate && (
                      <div>
                        <span className="text-sm font-medium">Frecuencia Cardíaca:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.heartRate}</p>
                      </div>
                    )}
                    {selectedSession.targetZones.pace && (
                      <div>
                        <span className="text-sm font-medium">Ritmo:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.pace}</p>
                      </div>
                    )}
                    {selectedSession.targetZones.effort && (
                      <div>
                        <span className="text-sm font-medium">Esfuerzo:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.effort}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Equipamiento */}
              {selectedSession.equipment && selectedSession.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Equipamiento Necesario</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.equipment.map((item, index) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedSession.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notas Adicionales</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-4">
              {selectedSession.status === 'pending' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>Nota importante:</strong> Marcar una sesión como completada registrará que la realizaste, pero{' '}
                    <strong>no subirá datos de rendimiento</strong>. Para registrar métricas y rendimiento, ve a{' '}
                    <strong>"Subir Entrenamientos"</strong> y asocia la sesión al momento de subir los datos.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSessionDetailOpen(false)}>
                  Cerrar
                </Button>
                {selectedSession.status === 'pending' && (
                  <Button onClick={() => handleToggleCompleted(selectedSession.id)}>
                    {completedSessions.has(selectedSession.id) ? 'Desmarcar Completa' : 'Marcar Completa'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
