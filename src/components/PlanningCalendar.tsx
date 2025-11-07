import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateTrainingSessionModal } from './CreateTrainingSessionModal';
import { MicrocycleService, MicrocycleResponseDto } from '../services/microcycleService';
import { MesocycleService, MesocycleResponseDto } from '../services/mesocycleService';
import { TrainingSessionService, TrainingSessionResponseDto } from '../services/trainingSessionService';
import { mapTrainingCategoryFromBackend } from '../utils/trainingCategoryMapper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface PeriodGroup {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'year' | 'month' | 'week' | 'custom';
  parentId?: string;
  children: PeriodGroup[];
  sessions: TrainingSession[];
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athletes: string[];
  intervals: any[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface MesocycleFilter {
  id: string;
  name: string;
  startWeek?: number; // Opcional - para compatibilidad
  endWeek?: number; // Opcional - para compatibilidad
  startDate?: string; // Fecha de inicio (ISO string) - preferido
  endDate?: string; // Fecha de fin (ISO string) - preferido
}

interface MicrocycleFilter {
  id: string;
  name: string;
  startDate: string; // Fecha de inicio (ISO string)
  endDate: string; // Fecha de fin (ISO string)
}

interface PlanningCalendarProps {
  planningId?: string;
  userType?: 'athlete' | 'coach';
  year?: number;
  periodGroups?: PeriodGroup[];
  athletes?: Athlete[];
  mesocycleFilter?: MesocycleFilter;
  microcycleFilter?: MicrocycleFilter;
  planningStartDate?: string; // Fecha de inicio de la planificación (ISO string)
  planningEndDate?: string | null; // Fecha de fin de la planificación (ISO string) o null
  onPeriodSelect?: (periodId: string) => void;
  onSessionCreate?: (session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dayNames = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'training': return 'bg-blue-500';
    case 'prep_competition': return 'bg-orange-500';
    case 'main_competition': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'training': return 'Entrenamiento';
    case 'prep_competition': return 'Prep. Competencia';
    case 'main_competition': return 'Competencia';
    default: return 'Otro';
  }
};

export function PlanningCalendar({ 
  planningId, 
  userType = 'coach', 
  year = new Date().getFullYear(), 
  periodGroups = [], 
  athletes = [], 
  mesocycleFilter,
  microcycleFilter,
  planningStartDate,
  planningEndDate,
  onPeriodSelect = () => {}, 
  onSessionCreate 
}: PlanningCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'month'>('overview');
  const [currentYear, setCurrentYear] = useState<number>(year);

  // Sincronizar currentYear cuando cambie el prop year o el filtro de microciclo
  useEffect(() => {
    if (microcycleFilter) {
      // Si hay filtro de microciclo, usar el año de su fecha de inicio
      const startDateStr = microcycleFilter.startDate.includes('T') 
        ? microcycleFilter.startDate.split('T')[0] 
        : microcycleFilter.startDate;
      const [startYear] = startDateStr.split('-').map(Number);
      setCurrentYear(startYear);
    } else {
      setCurrentYear(year);
    }
  }, [year, microcycleFilter]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [mesocycleSessionsCount, setMesocycleSessionsCount] = useState<number>(0);
  const [isLoadingMesocycleSessions, setIsLoadingMesocycleSessions] = useState<boolean>(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [availableMicrocycles, setAvailableMicrocycles] = useState<MicrocycleResponseDto[]>([]);
  const [isLoadingMicrocycles, setIsLoadingMicrocycles] = useState(false);

  // Atletas por defecto con VO2 Max
  const defaultAthletes: Athlete[] = athletes.length > 0 ? athletes : [
    { id: '1', name: 'María González', groupId: '1', groupName: 'Grupo Élite', vo2max: 55 },
    { id: '2', name: 'Carlos Ruiz', groupId: '2', groupName: 'Grupo Juvenil', vo2max: 62 },
    { id: '3', name: 'Ana López', groupId: '1', groupName: 'Grupo Élite', vo2max: 58 },
    { id: '4', name: 'Pedro Martín', groupId: '3', groupName: 'Grupo Principiantes', vo2max: 48 },
    { id: '5', name: 'Sofia Chen', groupId: '2', groupName: 'Grupo Juvenil', vo2max: 60 },
    { id: '6', name: 'Diego Morales', groupId: '1', groupName: 'Grupo Élite', vo2max: 61 },
    { id: '7', name: 'Laura Fernández', groupId: '3', groupName: 'Grupo Principiantes', vo2max: 45 },
    { id: '8', name: 'Roberto Silva', groupId: '2', groupName: 'Grupo Juvenil', vo2max: 59 }
  ];

  // Agregar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (userType === 'coach' && (event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        handleCreateSession(dateString);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userType]);

  // Cargar sesiones desde el backend
  const loadTrainingSessions = async () => {
    if (!planningId) return;
    
    setIsLoadingSessions(true);
    try {
      const sessions = await TrainingSessionService.getTrainingSessionsByPlanningId(Number(planningId));
      
      // Validar que sessions sea un array antes de procesar
      if (!sessions || !Array.isArray(sessions)) {
        console.warn('No se recibieron sesiones válidas del backend');
        setTrainingSessions([]);
        return;
      }
      
      // Convertir sesiones del backend al formato del frontend
      const convertedSessions: TrainingSession[] = sessions.map(session => {
        // Manejar tanto athleteIds (array de números) como athletes (array de objetos)
        let athleteIds: string[] = [];
        if (session.athleteIds && Array.isArray(session.athleteIds)) {
          // Si viene athleteIds directamente (array de números)
          athleteIds = session.athleteIds.map(id => id.toString());
        } else if (session.athletes && Array.isArray(session.athletes)) {
          // Si viene athletes (array de objetos con athleteId)
          athleteIds = session.athletes.map(a => a.athleteId.toString());
        }
        
        return {
        id: session.id.toString(),
        date: session.date && session.date.includes('T') ? session.date.split('T')[0] : (session.date || ''), // Solo la fecha (YYYY-MM-DD)
        name: session.name || '',
        description: session.description,
        category: mapTrainingCategoryFromBackend(session.category) as 'training' | 'prep_competition' | 'main_competition',
        athletes: athleteIds,
        intervals: (session.intervals && Array.isArray(session.intervals)) ? session.intervals.map(interval => ({
          id: interval.id.toString(),
          type: interval.type?.toLowerCase() as 'work' | 'rest' | 'interval' || 'interval',
          paceType: interval.paceType?.toLowerCase() as 'fixed' | 'vo2max_percentage' || 'fixed',
          pace: interval.pace,
          vo2maxPercentage: interval.vo2MaxPercentage,
          durationType: interval.trainingMode?.toLowerCase() as 'time' | 'distance' | undefined,
          duration: interval.duration ? parseFloat(interval.duration) : undefined,
          distance: interval.distance || 0,
          description: interval.description,
          repetitions: interval.repetitions || 1
        })) : [],
        notes: session.notes,
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: session.updatedAt
        };
      });
      
      setTrainingSessions(convertedSessions);
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
      setTrainingSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Calcular atletas únicos de todas las sesiones
  const getUniqueAthletesFromSessions = (): number => {
    const uniqueAthleteIds = new Set<string>();
    trainingSessions.forEach(session => {
      if (session.athletes && Array.isArray(session.athletes)) {
        session.athletes.forEach(athleteId => uniqueAthleteIds.add(athleteId));
      }
    });
    return uniqueAthleteIds.size;
  };

  // Usar atletas de la planificación si están disponibles, sino calcular de las sesiones
  const totalAthletes = athletes.length > 0 ? athletes.length : getUniqueAthletesFromSessions();

  // Cargar microciclos disponibles para validar fechas
  const loadAvailableMicrocycles = async () => {
    if (!planningId) return;
    
    setIsLoadingMicrocycles(true);
    try {
      // Cargar mesociclos de la planificación
      const mesocyclesData = await MesocycleService.getMesocyclesByPlanningId(Number(planningId));
      
      // Cargar microciclos de todos los mesociclos
      const allMicrocycles: MicrocycleResponseDto[] = [];
      for (const mesocycle of mesocyclesData) {
        const microcyclesData = await MicrocycleService.getMicrocyclesByMesocycleId(mesocycle.id);
        allMicrocycles.push(...microcyclesData);
      }
      
      setAvailableMicrocycles(allMicrocycles);
    } catch (error) {
      console.error('Error al cargar microciclos:', error);
      setAvailableMicrocycles([]);
    } finally {
      setIsLoadingMicrocycles(false);
    }
  };

  // Cargar sesiones cuando cambia el planningId
  useEffect(() => {
    if (planningId) {
      loadTrainingSessions();
      loadAvailableMicrocycles();
    } else {
      setTrainingSessions([]);
      setAvailableMicrocycles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningId]);

  // Cargar sesiones del mesociclo cuando hay un filtro activo
  useEffect(() => {
    const loadMesocycleSessions = async () => {
      if (!mesocycleFilter?.id) {
        setMesocycleSessionsCount(0);
        return;
      }

      setIsLoadingMesocycleSessions(true);
      try {
        const mesocycleId = parseInt(mesocycleFilter.id, 10);
        if (isNaN(mesocycleId)) {
          setMesocycleSessionsCount(0);
          return;
        }

        const microcycles = await MicrocycleService.getMicrocyclesByMesocycleId(mesocycleId);
        const totalSessions = microcycles.reduce((sum, microcycle) => sum + (microcycle.trainingSessionsCount || 0), 0);
        setMesocycleSessionsCount(totalSessions);
      } catch (error) {
        console.error('Error al cargar sesiones del mesociclo:', error);
        setMesocycleSessionsCount(0);
      } finally {
        setIsLoadingMesocycleSessions(false);
      }
    };

    loadMesocycleSessions();
  }, [mesocycleFilter?.id]);

  // Obtener sesiones existentes para una fecha específica
  const getSessionsForDate = (date: string): TrainingSession[] => {
    return trainingSessions.filter(session => session.date === date);
  };

  const handleCreateSession = (date: string) => {
    console.log('🚀 Abriendo modal para crear sesión en fecha:', date);
    setSelectedDate(date);
    setIsSessionModalOpen(true);
    
    // Mensaje de confirmación visual
    if (viewMode === 'month') {
      toast.success(`Creando sesión para ${formatSessionDate(date)}`, {
        duration: 2000
      });
    }
  };

  const handleSessionSubmit = (sessionData: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('📝 Datos de sesión recibidos:', sessionData);
    
    const newSession: TrainingSession = {
      ...sessionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTrainingSessions(prev => [...prev, newSession]);
    setIsSessionModalOpen(false);
    
    // Mostrar mensaje de éxito con detalles
    toast.success(`Sesión "${sessionData.name}" creada exitosamente`, {
      description: `${sessionData.intervals.length} intervalos • ${sessionData.athletes.length} atletas asignados`,
      duration: 4000
    });
    
    if (onSessionCreate) {
      onSessionCreate(sessionData);
    }
  };

  const handleCloseModal = () => {
    console.log('❌ Cerrando modal de creación de sesión');
    setIsSessionModalOpen(false);
    setSelectedDate('');
    setEditingSession(null);
  };

  // Verificar si una fecha es pasada
  const isDateInPast = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Encontrar la fecha más cercana válida (no pasada y dentro de un microciclo)
  const findNearestValidDate = (): string | null => {
    if (!planningId || availableMicrocycles.length === 0) {
      // Si no hay planningId o microciclos, usar la fecha de hoy
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Recopilar todas las fechas válidas de los microciclos
    const validDates: Date[] = [];
    
    for (const microcycle of availableMicrocycles) {
      const startDateStr = microcycle.startDate.includes('T') 
        ? microcycle.startDate.split('T')[0] 
        : microcycle.startDate;
      const endDateStr = microcycle.endDate.includes('T') 
        ? microcycle.endDate.split('T')[0] 
        : microcycle.endDate;
      
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      // Agregar todas las fechas del microciclo que no sean pasadas
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate >= today) {
          validDates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Ordenar fechas y encontrar la más cercana
    if (validDates.length === 0) {
      return null; // No hay fechas válidas
    }

    validDates.sort((a, b) => a.getTime() - b.getTime());
    const nearestDate = validDates[0];
    
    return `${nearestDate.getFullYear()}-${String(nearestDate.getMonth() + 1).padStart(2, '0')}-${String(nearestDate.getDate()).padStart(2, '0')}`;
  };

  // Formatear fecha para mostrar
  const formatSessionDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // Parsear la fecha como fecha local (sin conversión de timezone)
    // Si viene en formato YYYY-MM-DD, extraer los componentes directamente
    let date: Date;
    if (dateString.includes('T')) {
      // Si tiene 'T', es una fecha ISO con hora
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Si es solo YYYY-MM-DD, parsear directamente
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    
    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();
    const monthName = monthNames[date.getMonth()].toLowerCase();
    const yearNum = date.getFullYear();
    return `${dayName} ${dayNum} de ${monthName} de ${yearNum}`;
  };

  // Manejar edición de sesión
  const handleEditSession = (session: TrainingSession) => {
    // Validar que la sesión no sea pasada
    if (isDateInPast(session.date)) {
      toast.error('No se puede editar una sesión pasada');
      return;
    }
    
    setEditingSession(session);
    setSelectedDate(session.date);
    setIsSessionModalOpen(true);
  };

  // Manejar solicitud de eliminación de sesión (abre el modal)
  const handleDeleteSession = (sessionId: string) => {
    const session = trainingSessions.find(s => s.id === sessionId);
    if (!session) {
      console.log('❌ Sesión no encontrada:', sessionId);
      return;
    }

    // Validar que la sesión no sea pasada
    if (isDateInPast(session.date)) {
      toast.error('No se puede eliminar una sesión pasada');
      return;
    }

    // Abrir el modal de confirmación
    console.log('🗑️ Abriendo modal de confirmación para eliminar sesión:', session.name);
    setSessionToDelete(session);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar eliminación de sesión
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;

    setDeletingSessionId(sessionToDelete.id);
    setIsDeleteDialogOpen(false);
    
    try {
      await TrainingSessionService.deleteTrainingSession(Number(sessionToDelete.id));
      // Recargar sesiones después de eliminar
      if (planningId) {
        await loadTrainingSessions();
      }
      setSessionToDelete(null);
      setDeletingSessionId(null);
    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      setSessionToDelete(null);
      setDeletingSessionId(null);
    }
  };

  const yearGroup = periodGroups.find(group => group.type === 'year');
  const months = yearGroup ? yearGroup.children : [];

  // Si no tenemos periodGroups, crear meses por defecto para el año actual
  const defaultMonths = months.length === 0 ? monthNames.map((name, index) => ({
    id: `month-${index}`,
    name,
    startDate: `${year}-${String(index + 1).padStart(2, '0')}-01`,
    endDate: `${year}-${String(index + 1).padStart(2, '0')}-${new Date(year, index + 1, 0).getDate()}`,
    type: 'month' as const,
    parentId: 'year-1',
    children: [],
    sessions: []
  })) : months;

  const handleMonthClick = (monthIndex: number) => {
    console.log('📅 Seleccionando mes:', monthIndex);
    setSelectedMonth(monthIndex);
    setViewMode('month');
    const monthPeriod = defaultMonths.find(m => {
      const periodDate = new Date(m.startDate);
      return periodDate.getMonth() === monthIndex && periodDate.getFullYear() === currentYear;
    });
    if (monthPeriod) {
      onPeriodSelect(monthPeriod.id);
      // Actualizar el año actual si el período está en un año diferente
      const periodDate = new Date(monthPeriod.startDate);
      if (periodDate.getFullYear() !== currentYear) {
        setCurrentYear(periodDate.getFullYear());
      }
    }
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedMonth(null);
    onPeriodSelect('all');
  };

  // Función helper para verificar si una fecha está dentro del rango del microciclo
  const isDateInMicrocycleRange = (dateString: string): boolean => {
    if (!microcycleFilter) {
      return true;
    }
    
    // Parsear las fechas del microciclo
    const startDateStr = microcycleFilter.startDate.includes('T') 
      ? microcycleFilter.startDate.split('T')[0] 
      : microcycleFilter.startDate;
    const endDateStr = microcycleFilter.endDate.includes('T') 
      ? microcycleFilter.endDate.split('T')[0] 
      : microcycleFilter.endDate;
    
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
    
    // Parsear la fecha a verificar (formato: YYYY-MM-DD)
    const [checkYear, checkMonth, checkDay] = dateString.split('-').map(Number);
    
    // Comparar año, mes y día directamente
    // Primero verificar si el año es válido
    if (checkYear < startYear || checkYear > endYear) {
      return false;
    }
    
    // Si el año es igual al año de inicio, verificar mes y día
    if (checkYear === startYear) {
      if (checkMonth < startMonth) return false;
      if (checkMonth === startMonth && checkDay < startDay) return false;
    }
    
    // Si el año es igual al año de fin, verificar mes y día
    if (checkYear === endYear) {
      if (checkMonth > endMonth) return false;
      if (checkMonth === endMonth && checkDay > endDay) return false;
    }
    
    // Si llegamos aquí, la fecha está en el rango
    return true;
  };

  // Función helper para verificar si una fecha está dentro del rango del mesociclo o planificación
  const isDateInMesocycleRange = (dateString: string): boolean => {
    let startDate: Date;
    let endDate: Date;
    
    if (mesocycleFilter) {
      // Si hay filtro de mesociclo, usar sus fechas
      if (mesocycleFilter.startDate && mesocycleFilter.endDate) {
        // Usar fechas reales del mesociclo
        const startDateStr = mesocycleFilter.startDate.split('T')[0];
        const endDateStr = mesocycleFilter.endDate.split('T')[0];
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        
        startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      } else if (mesocycleFilter.startWeek && mesocycleFilter.endWeek) {
        // Fallback: calcular fecha aproximada de semanas del mesociclo
        startDate = new Date(year, 0, 1 + (mesocycleFilter.startWeek - 1) * 7, 0, 0, 0, 0);
        endDate = new Date(year, 0, 1 + mesocycleFilter.endWeek * 7, 23, 59, 59, 999);
      } else {
        return true; // Si no hay fechas ni semanas, mostrar todos los días
      }
    } else if (planningStartDate) {
      // Si no hay filtro de mesociclo pero hay fechas de planificación, usar esas
      const startDateStr = planningStartDate.split('T')[0];
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      
      if (planningEndDate) {
        const endDateStr = planningEndDate.split('T')[0];
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      } else {
        // Si no hay fecha de fin, permitir todos los días desde la fecha de inicio
        endDate = new Date(9999, 11, 31, 23, 59, 59, 999);
      }
    } else {
      // Si no hay filtro ni fechas de planificación, mostrar todos los días
      return true;
    }
    
    // Parsear la fecha a verificar (formato: YYYY-MM-DD)
    const [checkYear, checkMonth, checkDay] = dateString.split('-').map(Number);
    const checkDate = new Date(checkYear, checkMonth - 1, checkDay, 0, 0, 0, 0);
    
    // Comparar fechas
    return checkDate >= startDate && checkDate <= endDate;
  };

  // Función para navegar al mes anterior/siguiente
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (selectedMonth === null) return;
    
    let newMonth = selectedMonth;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      if (newMonth === 0) {
        newMonth = 11;
        newYear--;
      } else {
        newMonth--;
      }
    } else {
      if (newMonth === 11) {
        newMonth = 0;
        newYear++;
      } else {
        newMonth++;
      }
    }
    
    setSelectedMonth(newMonth);
    setCurrentYear(newYear);
    
    // Actualizar el período seleccionado si existe
    const monthPeriod = defaultMonths.find(m => {
      const periodDate = new Date(m.startDate);
      return periodDate.getFullYear() === newYear && periodDate.getMonth() === newMonth;
    });
    if (monthPeriod) {
      onPeriodSelect(monthPeriod.id);
    }
  };

  // Calcular si hay meses anteriores/siguientes disponibles dentro del rango del mesociclo
  // Si no hay filtro, permitir navegación libre
  const canNavigatePrev = () => {
    if (selectedMonth === null) return false;
    
    let startDate: Date | null = null;
    
    if (microcycleFilter) {
      // Si hay filtro de microciclo, usar sus fechas (prioridad más alta)
      const startDateStr = microcycleFilter.startDate.split('T')[0];
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay);
    } else if (mesocycleFilter) {
      // Si hay filtro de mesociclo, usar sus fechas
      if (mesocycleFilter.startDate) {
        const startDateStr = mesocycleFilter.startDate.split('T')[0];
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        startDate = new Date(startYear, startMonth - 1, startDay);
      } else if (mesocycleFilter.startWeek) {
        startDate = new Date(currentYear, 0, 1 + (mesocycleFilter.startWeek - 1) * 7);
      }
    } else if (planningStartDate) {
      // Si no hay filtro de mesociclo/microciclo pero hay fechas de planificación, usar esas
      const startDateStr = planningStartDate.split('T')[0];
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay);
    }
    
    // Si no hay fecha de inicio definida, permitir navegación libre
    if (!startDate) return true;
    
    const currentMonthStart = new Date(currentYear, selectedMonth, 1);
    return currentMonthStart > startDate;
  };

  const canNavigateNext = () => {
    if (selectedMonth === null) return false;
    
    let endDate: Date | null = null;
    
    if (microcycleFilter) {
      // Si hay filtro de microciclo, usar sus fechas (prioridad más alta)
      const endDateStr = microcycleFilter.endDate.split('T')[0];
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    } else if (mesocycleFilter) {
      // Si hay filtro de mesociclo, usar sus fechas
      if (mesocycleFilter.endDate) {
        const endDateStr = mesocycleFilter.endDate.split('T')[0];
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      } else if (mesocycleFilter.endWeek) {
        endDate = new Date(currentYear, 0, 1 + mesocycleFilter.endWeek * 7);
      }
    } else if (planningEndDate) {
      // Si no hay filtro de mesociclo/microciclo pero hay fecha de fin de planificación, usar esa
      const endDateStr = planningEndDate.split('T')[0];
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    }
    
    // Si no hay fecha de fin definida, permitir navegación libre
    if (!endDate) return true;
    
    const currentMonthEnd = new Date(currentYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    return currentMonthEnd < endDate;
  };

  if (viewMode === 'month' && selectedMonth !== null) {
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, selectedMonth, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lunes = 0

    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayString = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = getSessionsForDate(dayString);
      // Si hay filtro de microciclo, usar su función específica; si no, usar la de mesociclo/planificación
      const isInRange = microcycleFilter 
        ? isDateInMicrocycleRange(dayString)
        : isDateInMesocycleRange(dayString);
      days.push({ day, sessions: daySessions, date: dayString, isInRange });
    }

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleBackToOverview}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            {/* Botón de navegación al mes anterior */}
            {canNavigatePrev() && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateMonth('prev')}
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <h3 className="text-xl font-semibold text-primary">
              {monthNames[selectedMonth]} {currentYear}
            </h3>
            {/* Botón de navegación al mes siguiente */}
            {canNavigateNext() && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateMonth('next')}
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <Button 
            onClick={() => {
              const validDate = findNearestValidDate();
              if (!validDate) {
                toast.error('No hay fechas válidas disponibles para crear sesiones');
                return;
              }
              console.log('🎯 Botón "Agregar Sesión" clickeado. Fecha:', validDate);
              handleCreateSession(validDate);
            }}
            className="bg-accent hover:bg-accent/90 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            disabled={userType === 'athlete'}
            title={userType === 'athlete' ? 'Solo los entrenadores pueden crear sesiones' : 'Crear nueva sesión de entrenamiento (Ctrl+N)'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Sesión
          </Button>
        </div>

        {/* Calendario mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Vista Mensual
            </CardTitle>
            <CardDescription>
              {totalAthletes} atletas • {trainingSessions.filter(s => s.date.startsWith(`${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`)).length} sesiones programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Encabezados de días */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((dayData, index) => {
                // Si hay un filtro de mesociclo y el día no está en el rango, deshabilitarlo visualmente
                const isDayInRange = dayData ? (dayData.isInRange !== false) : true;
                const isDayDisabled = (mesocycleFilter || microcycleFilter) && dayData && !dayData.isInRange;
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-32 p-2 border rounded-lg transition-all duration-200 ${
                      !dayData 
                        ? 'bg-muted/20'
                        : isDayDisabled
                          ? 'bg-muted/30 opacity-40 cursor-not-allowed'
                          : dayData && userType === 'coach' 
                            ? 'bg-background hover:bg-accent/5 hover:border-accent/30 cursor-pointer hover:shadow-sm' 
                            : 'bg-background cursor-default'
                    } ${dayData && dayData.isInRange && (mesocycleFilter || microcycleFilter) ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => {
                      if (dayData && userType === 'coach' && isDayInRange) {
                        console.log('🖱️ Click en día del calendario:', dayData.date);
                        handleCreateSession(dayData.date);
                      }
                    }}
                    title={
                      dayData 
                        ? isDayDisabled 
                          ? microcycleFilter
                            ? `Este día está fuera del rango del microciclo "${microcycleFilter.name}"`
                            : mesocycleFilter
                              ? `Este día está fuera del rango del mesociclo "${mesocycleFilter.name}"`
                              : undefined
                          : userType === 'coach' 
                            ? `Hacer clic para agregar sesión el ${dayData.date}`
                            : undefined
                        : undefined
                    }
                  >
                    {dayData && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`font-medium ${isDayDisabled ? 'text-muted-foreground' : 'text-primary'}`}>
                            {dayData.day}
                          </div>
                          {dayData.sessions.length === 0 && userType === 'coach' && isDayInRange && (
                            <Plus className="w-4 h-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayData.sessions.slice(0, 3).map(session => {
                            const isSessionPast = isDateInPast(session.date);
                            return (
                              <div
                                key={session.id}
                                className={`text-xs p-2 rounded-md flex items-center space-x-2 group ${
                                  isDayDisabled ? 'opacity-50' : ''
                                }`}
                                style={{ backgroundColor: `${getCategoryColor(session.category)}20` }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div 
                                  className={`w-2 h-2 rounded-full ${getCategoryColor(session.category)}`}
                                />
                                <span className={`truncate flex-1 font-medium ${isDayDisabled ? 'text-muted-foreground' : ''}`}>
                                  {session.name}
                                </span>
                                {userType === 'coach' && !isSessionPast && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 hover:bg-accent"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSession(session);
                                      }}
                                      title="Editar sesión"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(session.id);
                                      }}
                                      disabled={deletingSessionId === session.id}
                                      title="Eliminar sesión"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {dayData.sessions.length > 3 && (
                            <div className="text-xs text-muted-foreground font-medium">
                              +{dayData.sessions.length - 3} más
                            </div>
                          )}
                          {dayData.sessions.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {dayData.sessions.reduce((total, session) => total + session.athletes.length, 0)} atletas
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leyenda de categorías de sesión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorías de Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { category: 'training', name: 'Entrenamiento' },
                { category: 'prep_competition', name: 'Competencia Preparatoria' },
                { category: 'main_competition', name: 'Competencia Principal' }
              ].map(({ category, name }) => (
                <div key={category} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getCategoryColor(category)}`} />
                  <span className="font-medium">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal para crear sesiones */}
        <CreateTrainingSessionModal
          isOpen={isSessionModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSessionSubmit}
          athletes={athletes}
          selectedDate={selectedDate}
          existingSessions={getSessionsForDate(selectedDate)}
          planningId={planningId ? Number(planningId) : undefined}
          editingSession={editingSession}
          onSessionCreated={() => {
            // Recargar sesiones después de crear
            if (planningId) {
              loadTrainingSessions();
            }
          }}
          onSessionUpdated={() => {
            // Recargar sesiones después de actualizar
            if (planningId) {
              loadTrainingSessions();
            }
        }}
      />

      {/* Modal de confirmación para eliminar sesión */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          console.log('🔄 onOpenChange del AlertDialog:', open);
          setIsDeleteDialogOpen(open);
          if (!open) {
            // Si se cierra el modal, limpiar la sesión a eliminar
            setSessionToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Esta acción eliminará permanentemente la sesión <strong>"{sessionToDelete?.name}"</strong>.
              </div>
              {sessionToDelete?.date && (
                <div className="text-muted-foreground">
                  Fecha: {formatSessionDate(sessionToDelete.date)}
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                Esta acción no se puede deshacer.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              disabled={deletingSessionId !== null}
            >
              {deletingSessionId ? 'Eliminando...' : 'Sí, eliminar sesión'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  }

  // Vista general del año
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary">
          {microcycleFilter 
            ? `${microcycleFilter.name} - ${year}` 
            : mesocycleFilter 
              ? `${mesocycleFilter.name} - ${year}` 
              : `Vista General - ${year}`}
        </h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              const validDate = findNearestValidDate();
              if (!validDate) {
                toast.error('No hay fechas válidas disponibles para crear sesiones');
                return;
              }
              console.log('🎯 Botón "Crear Sesión" de vista general clickeado. Fecha:', validDate);
              handleCreateSession(validDate);
            }}
            className="bg-accent hover:bg-accent/90 transition-all duration-200 hover:scale-105"
            disabled={userType === 'athlete'}
            title={userType === 'athlete' ? 'Solo los entrenadores pueden crear sesiones' : 'Crear sesión de entrenamiento'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Sesión
          </Button>
        </div>
      </div>

      {/* Grid de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {monthNames.map((monthName, index) => {
          const monthPeriod = defaultMonths.find(m => new Date(m.startDate).getMonth() === index);
          
          // Verificar si el mes está dentro del rango (mesociclo, microciclo o planificación)
          let isActive = monthPeriod !== undefined;
          let isInMesocycleRange = true;
          
          let startDate: Date | null = null;
          let endDate: Date | null = null;
          const isMicrocycleFilter = !!microcycleFilter;
          
          if (microcycleFilter) {
            // Si hay filtro de microciclo, usar sus fechas (prioridad más alta)
            const startDateStr = microcycleFilter.startDate.split('T')[0];
            const endDateStr = microcycleFilter.endDate.split('T')[0];
            const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
            
            startDate = new Date(startYear, startMonth - 1, startDay);
            endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
          } else if (mesocycleFilter) {
            // Si hay filtro de mesociclo, usar sus fechas
            if (mesocycleFilter.startDate && mesocycleFilter.endDate) {
              // Usar fechas reales del mesociclo
              const startDateStr = mesocycleFilter.startDate.split('T')[0];
              const endDateStr = mesocycleFilter.endDate.split('T')[0];
              const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
              const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
              
              startDate = new Date(startYear, startMonth - 1, startDay);
              endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            } else if (mesocycleFilter.startWeek && mesocycleFilter.endWeek) {
              // Fallback: calcular fecha aproximada de semanas del mesociclo
              startDate = new Date(year, 0, 1 + (mesocycleFilter.startWeek - 1) * 7);
              endDate = new Date(year, 0, 1 + mesocycleFilter.endWeek * 7);
            } else {
              // Si no hay fechas ni semanas, no resaltar
              isInMesocycleRange = false;
              isActive = false;
            }
          } else if (planningStartDate) {
            // Si no hay filtro de mesociclo/microciclo pero hay fechas de planificación, usar esas
            const startDateStr = planningStartDate.split('T')[0];
            const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
            startDate = new Date(startYear, startMonth - 1, startDay);
            
            if (planningEndDate) {
              const endDateStr = planningEndDate.split('T')[0];
              const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
              endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            } else {
              // Si no hay fecha de fin, permitir todos los meses desde la fecha de inicio
              endDate = new Date(9999, 11, 31, 23, 59, 59, 999);
            }
          }
          
          if (startDate && endDate) {
            const monthStart = new Date(year, index, 1);
            const monthEnd = new Date(year, index + 1, 0, 23, 59, 59, 999);
            
            if (isMicrocycleFilter) {
              // Para microciclos, solo habilitar meses que realmente contienen días del microciclo
              // El mes debe contener al menos un día del rango del microciclo
              // Y el mes debe estar en el mismo año que el filtro
              const filterYear = startDate.getFullYear();
              const monthYear = monthStart.getFullYear();
              
              if (filterYear !== monthYear) {
                // Si el mes está en un año diferente, no está en el rango
                isInMesocycleRange = false;
              } else {
                // Verificar si el mes se solapa con el rango del microciclo
                isInMesocycleRange = monthStart <= endDate && monthEnd >= startDate;
              }
            } else {
              // Para mesociclos y planificación, verificar si el mes se solapa con el rango
              isInMesocycleRange = monthStart <= endDate && monthEnd >= startDate;
            }
            isActive = isActive && isInMesocycleRange;
          }
          
          const monthSessions = trainingSessions.filter(s => s.date.startsWith(`${year}-${String(index + 1).padStart(2, '0')}`));
          
          return (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isActive ? 'border-primary/20' : 'opacity-60'
              }`}
              onClick={() => isActive && handleMonthClick(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-primary">{monthName}</CardTitle>
                  {isActive && (
                    <Badge variant="outline" className="text-xs">
                      {monthSessions.length} sesiones
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-col min-h-[180px]">
                {!isActive ? (
                  <p className="text-sm text-muted-foreground">
                    {mesocycleFilter && !isInMesocycleRange 
                      ? 'Mes fuera del rango del mesociclo' 
                      : 'Mes no incluido en la planificación'
                    }
                  </p>
                ) : (
                  <div className="flex flex-col flex-1 space-y-3">
                    <div className="flex-1">
                      {monthSessions.length > 0 ? (
                        <>
                          {/* Distribución por categoría */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Distribución de sesiones:</p>
                            <div className="space-y-1">
                              {['training', 'prep_competition', 'main_competition'].map(category => {
                                const count = monthSessions.filter(s => s.category === category).length;
                                if (count === 0) return null;
                                
                                return (
                                  <div key={category} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`} />
                                      <span>{getCategoryName(category)}</span>
                                    </div>
                                    <span className="font-medium">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay sesiones programadas
                        </p>
                      )}
                    </div>

                    {/* Botón de edición - siempre al final */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMonthClick(index);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {microcycleFilter 
              ? `Resumen del ${microcycleFilter.name}` 
              : mesocycleFilter 
                ? `Resumen del ${mesocycleFilter.name}` 
                : 'Resumen de Atletas'}
          </CardTitle>
          {(microcycleFilter || mesocycleFilter) && (() => {
            // Obtener fechas de inicio y fin (microciclo tiene prioridad)
            let startDate: Date;
            let endDate: Date;
            
            if (microcycleFilter) {
              // Usar fechas del microciclo
              const startDateStr = microcycleFilter.startDate.includes('T') 
                ? microcycleFilter.startDate.split('T')[0] 
                : microcycleFilter.startDate;
              const endDateStr = microcycleFilter.endDate.includes('T') 
                ? microcycleFilter.endDate.split('T')[0] 
                : microcycleFilter.endDate;
              const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
              const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
              
              startDate = new Date(startYear, startMonth - 1, startDay);
              endDate = new Date(endYear, endMonth - 1, endDay);
            } else if (mesocycleFilter) {
              // Usar fechas del mesociclo
              if (mesocycleFilter.startDate && mesocycleFilter.endDate) {
                // Usar fechas reales del mesociclo
                const startDateStr = mesocycleFilter.startDate.split('T')[0];
                const endDateStr = mesocycleFilter.endDate.split('T')[0];
                const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
                const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
                
                startDate = new Date(startYear, startMonth - 1, startDay);
                endDate = new Date(endYear, endMonth - 1, endDay);
              } else if (mesocycleFilter.startWeek && mesocycleFilter.endWeek) {
                // Fallback: calcular fecha aproximada de semanas del mesociclo
                startDate = new Date(year, 0, 1 + (mesocycleFilter.startWeek - 1) * 7);
                endDate = new Date(year, 0, 1 + mesocycleFilter.endWeek * 7);
              } else {
                return null;
              }
            } else {
              return null;
            }
            
            // Formatear fechas en español
            const formatDateRange = (start: Date, end: Date): string => {
              const startDayName = dayNames[start.getDay()];
              const startDay = start.getDate();
              const startMonthName = monthNames[start.getMonth()].toLowerCase();
              const startYear = start.getFullYear();
              
              const endDayName = dayNames[end.getDay()];
              const endDay = end.getDate();
              const endMonthName = monthNames[end.getMonth()].toLowerCase();
              const endYear = end.getFullYear();
              
              // Si es el mismo año, solo mostrar el año al final
              if (startYear === endYear) {
                return `Del ${startDayName} ${startDay} de ${startMonthName} al ${endDayName} ${endDay} de ${endMonthName} de ${startYear}`;
              } else {
                return `Del ${startDayName} ${startDay} de ${startMonthName} de ${startYear} al ${endDayName} ${endDay} de ${endMonthName} de ${endYear}`;
              }
            };
            
            return (
              <CardDescription>
                {formatDateRange(startDate, endDate)}
              </CardDescription>
            );
          })()}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total atletas:</span>
              <div className="font-medium text-primary">{totalAthletes}</div>
            </div>
            <div>
              <span className="text-muted-foreground">
                {mesocycleFilter ? 'Sesiones del mesociclo:' : 'Sesiones totales:'}
              </span>
              <div className="font-medium text-primary">
                {isLoadingMesocycleSessions ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : (
                  mesocycleFilter ? mesocycleSessionsCount : trainingSessions.length
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal para crear sesiones - también disponible en vista general */}
      <CreateTrainingSessionModal
        isOpen={isSessionModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSessionSubmit}
        athletes={athletes}
        selectedDate={selectedDate}
        existingSessions={getSessionsForDate(selectedDate)}
        planningId={planningId ? Number(planningId) : undefined}
        editingSession={editingSession}
        onSessionCreated={() => {
          // Recargar sesiones después de crear
          if (planningId) {
            loadTrainingSessions();
          }
        }}
        onSessionUpdated={() => {
          // Recargar sesiones después de actualizar
          if (planningId) {
            loadTrainingSessions();
          }
        }}
      />

      {/* Modal de confirmación para eliminar sesión */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          console.log('🔄 onOpenChange del AlertDialog:', open);
          setIsDeleteDialogOpen(open);
          if (!open) {
            // Si se cierra el modal, limpiar la sesión a eliminar
            setSessionToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Esta acción eliminará permanentemente la sesión <strong>"{sessionToDelete?.name}"</strong>.
              </div>
              {sessionToDelete?.date && (
                <div className="text-muted-foreground">
                  Fecha: {formatSessionDate(sessionToDelete.date)}
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                Esta acción no se puede deshacer.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              disabled={deletingSessionId !== null}
            >
              {deletingSessionId ? 'Eliminando...' : 'Sí, eliminar sesión'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}