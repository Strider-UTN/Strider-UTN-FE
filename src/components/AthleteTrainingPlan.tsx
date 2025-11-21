import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Calendar, Clock, Target, ChevronRight, ChevronDown, BookOpen, CalendarDays, Eye, MapPin, Timer, Play, CheckCircle, ChevronLeft, Home, Info, Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { PlanningService } from '../services/planningService';
import { MesocycleService, MesocycleResponseDto } from '../services/mesocycleService';
import { MicrocycleService, MicrocycleResponseDto } from '../services/microcycleService';
import { TrainingSessionService, TrainingSessionResponseDto, TrainingIntervalResponseDto } from '../services/trainingSessionService';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { mapTrainingCategoryFromBackend } from '../utils/trainingCategoryMapper';
import { mapIntervalIntensityFromBackend } from '../utils/intervalIntensityMapper';
import { CompletedWorkoutService } from '../services/completedWorkoutService';

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
  _planningData?: {
    mesocyclesCount?: number;
    hasEndDate: boolean;
  };
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
  sessionsCount: number; // Número de sesiones del backend
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
  const [selectedSessionFull, setSelectedSessionFull] = useState<any | null>(null); // Sesión completa del backend
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);
  const [hasCompletedWorkout, setHasCompletedWorkout] = useState<boolean>(false);
  const [completedWorkout, setCompletedWorkout] = useState<any>(null);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Estados para datos del backend
  const [plannings, setPlannings] = useState<any[]>([]);
  const [isLoadingPlannings, setIsLoadingPlannings] = useState(true);

  // Estados para caché (Map)
  const [mesocyclesCache, setMesocyclesCache] = useState<Map<number, Mesocycle[]>>(new Map());
  const [microcyclesCache, setMicrocyclesCache] = useState<Map<number, Microcycle[]>>(new Map());
  const [sessionsCache, setSessionsCache] = useState<Map<number, TrainingSession[]>>(new Map());

  // Estados para tracking de carga (evitar llamadas duplicadas)
  const [loadingMesocycles, setLoadingMesocycles] = useState<Set<number>>(new Set());
  const [loadingMicrocycles, setLoadingMicrocycles] = useState<Set<number>>(new Set());
  const [loadingSessions, setLoadingSessions] = useState<Set<number>>(new Set());

  // Obtener ID del atleta logueado
  const athleteId = AuthService.getCurrentUserId();
  const [athleteVO2Max, setAthleteVO2Max] = useState<string | undefined>(undefined);

  // Cargar VO2Max del atleta
  useEffect(() => {
    if (!athleteId) {
      setAthleteVO2Max(undefined);
      return;
    }

    let isMounted = true;

    const fetchAthleteVO2Max = async () => {
      try {
        const profile = await UserService.getProfile();
        if (!isMounted) return;
        
        const vo2Max = (profile as any).vO2Max || profile.vo2Max;
        if (vo2Max) {
          setAthleteVO2Max(vo2Max);
        }
      } catch (error) {
        console.error('Error al cargar VO2Max del atleta:', error);
      }
    };

    fetchAthleteVO2Max();

    return () => {
      isMounted = false;
    };
  }, [athleteId]);

  // Función helper para extraer fecha sin timezone
  const extractDateOnly = (dateString: string): string => {
    if (!dateString) return '';
    // Si viene como "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss.sssZ", extraer solo la parte de fecha
    return dateString.split('T')[0];
  };

  // Función helper para calcular semanas entre dos fechas
  const calculateWeeks = (startDate: string, endDate: string): number => {
    // Usar extractDateOnly para evitar problemas de timezone
    const startDateOnly = extractDateOnly(startDate);
    const endDateOnly = extractDateOnly(endDate);
    
    // Parsear como fecha local (YYYY-MM-DD)
    const [startYear, startMonth, startDay] = startDateOnly.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateOnly.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  // Función para mapear Planning a Macrocycle
  const mapPlanningToMacrocycle = (planning: any): Macrocycle => {
    const startDate = extractDateOnly(planning.startDate);
    const endDate = planning.endDate ? extractDateOnly(planning.endDate) : null;
    // Calcular semanas solo si hay fecha fin, usando las fechas ya extraídas
    const totalWeeks = endDate ? calculateWeeks(startDate, endDate) : 0;

    return {
      id: `planning-${planning.id}`,
      name: planning.name,
      description: planning.description || '',
      coach: planning.coachName || 'Entrenador', // El backend siempre debería enviar coachName
      athlete: 'Yo', // El atleta logueado
      startDate,
      endDate: endDate || startDate, // Si no hay fecha fin, usar la de inicio como fallback
      objective: planning.description || 'Sin objetivo específico',
      totalWeeks,
      status: planning.status === 'active' ? 'active' : 
              planning.status === 'completed' ? 'completed' : 
              planning.status === 'draft' ? 'planned' : 'planned',
      mesocycles: [], // Se cargarán lazy
      // Guardar datos adicionales del planning para uso posterior
      _planningData: {
        mesocyclesCount: planning.mesocyclesCount ?? 0, // El backend siempre debería enviar mesocyclesCount
        hasEndDate: !!planning.endDate
      }
    };
  };

  // Función para mapear MesocycleResponseDto a Mesocycle
  const mapMesocycleDtoToMesocycle = (mesocycleDto: MesocycleResponseDto, planningId: number): Mesocycle => {
    const startDate = extractDateOnly(mesocycleDto.startDate);
    const endDate = extractDateOnly(mesocycleDto.endDate);
    
    // Mapear status a phase (simplificado)
    let phase: 'base' | 'build' | 'peak' | 'recovery' | 'competition' = 'base';
    if (mesocycleDto.status === 'active') phase = 'build';
    if (mesocycleDto.status === 'completed') phase = 'peak';

    return {
      id: `mesocycle-${mesocycleDto.id}`,
      macrocycleId: `planning-${planningId}`,
      name: mesocycleDto.name,
      description: mesocycleDto.description || '',
      startDate,
      endDate,
      phase,
      objectives: mesocycleDto.objective ? [mesocycleDto.objective] : [],
      weekCount: mesocycleDto.weeksCount || calculateWeeks(mesocycleDto.startDate, mesocycleDto.endDate),
      microcycles: [] // Se cargarán lazy
    };
  };

  // Función para mapear MicrocycleResponseDto a Microcycle
  const mapMicrocycleDtoToMicrocycle = (microcycleDto: MicrocycleResponseDto, mesocycleId: number): Microcycle => {
    const startDate = extractDateOnly(microcycleDto.startDate);
    const endDate = extractDateOnly(microcycleDto.endDate);

    // Mapear focus (puede ser número, string o null)
    let focusText = 'Sin enfoque específico';
    if (microcycleDto.focus !== null && microcycleDto.focus !== undefined) {
      if (typeof microcycleDto.focus === 'string') {
        focusText = microcycleDto.focus;
      } else if (typeof microcycleDto.focus === 'number') {
        // Mapear números a texto (simplificado)
        const focusMap: { [key: number]: string } = {
          0: 'Resistencia Aeróbica',
          1: 'Velocidad',
          2: 'Fuerza',
          3: 'Recuperación',
          4: 'Trabajo Anaeróbico',
          5: 'Técnica de Carrera',
          6: 'Competición',
          7: 'Transición',
          8: 'Descanso Activo'
        };
        focusText = focusMap[microcycleDto.focus] || `Semana ${microcycleDto.weekNumber}`;
      }
    } else {
      focusText = microcycleDto.name || `Semana ${microcycleDto.weekNumber}`;
    }

    // Calcular sessionsCount: usar trainingSessionsCount si existe y es válido, sino sessions, sino 0
    const sessionsCount = (microcycleDto.trainingSessionsCount != null && microcycleDto.trainingSessionsCount >= 0) 
      ? microcycleDto.trainingSessionsCount 
      : (microcycleDto.sessions != null && microcycleDto.sessions >= 0)
        ? microcycleDto.sessions
        : 0;

    return {
      id: `microcycle-${microcycleDto.id}`,
      mesocycleId: `mesocycle-${mesocycleId}`,
      weekNumber: microcycleDto.weekNumber,
      name: microcycleDto.name || `Semana ${microcycleDto.weekNumber}`,
      startDate,
      endDate,
      focus: focusText,
      totalLoad: microcycleDto.volume || 0,
      sessions: [], // Se cargarán lazy
      sessionsCount // Número de sesiones del backend
    };
  };

  // Función para mapear TrainingSessionResponseDto a TrainingSession
  const mapSessionDtoToTrainingSession = (sessionDto: TrainingSessionResponseDto, microcycleId: number): TrainingSession => {
    const dateStr = extractDateOnly(sessionDto.date);
    const dateObj = new Date(sessionDto.date);
    const time = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Mapear category a type
    let type: 'training' | 'prep_competition' | 'main_competition' | 'recovery' = 'training';
    const categoryLower = (sessionDto.category || '').toLowerCase();
    if (categoryLower.includes('competition') || categoryLower.includes('competencia')) {
      type = categoryLower.includes('main') || categoryLower.includes('principal') ? 'main_competition' : 'prep_competition';
    } else if (categoryLower.includes('recovery') || categoryLower.includes('recuperación')) {
      type = 'recovery';
    }

    // Mapear intensity (del microciclo o calcular desde series)
    let intensity: 'low' | 'medium' | 'high' | 'recovery' = 'medium';
    if (type === 'recovery') {
      intensity = 'recovery';
    } else {
      // Intentar inferir desde las series/intervals
      const hasHighIntensity = sessionDto.series?.some(s => 
        s.intervals?.some(i => 
          i.intensity === 'high' || 
          (i.vo2MaxPercentage && i.vo2MaxPercentage > 85)
        )
      );
      if (hasHighIntensity) intensity = 'high';
    }

    // Construir intervals desde series
    const intervals: { work: string; rest: string; repetitions: number }[] = [];
    sessionDto.series?.forEach(series => {
      series.intervals?.forEach(interval => {
        const work = interval.distance 
          ? `${interval.distance}m` 
          : interval.duration || interval.targetTime || 'N/A';
        const rest = interval.recoveryTime || 'N/A';
        intervals.push({
          work,
          rest,
          repetitions: interval.repetitions || series.repetitions || 1
        });
      });
    });

    // Calcular duración estimada
    let duration = 0;
    if (sessionDto.estimatedWorkSeconds) {
      duration = Math.ceil(sessionDto.estimatedWorkSeconds / 60);
    } else if (sessionDto.series && sessionDto.series.length > 0) {
      // Calcular desde intervals
      duration = 60; // Default
    } else {
      duration = 60; // Default
    }

    return {
      id: `session-${sessionDto.id}`,
      microcycleId: `microcycle-${microcycleId}`,
      date: dateStr,
      time,
      name: sessionDto.name,
      type,
      duration,
      intensity,
      location: 'No especificada',
      status: sessionDto.hasCompletedWorkout ? 'completed' : 'pending',
      coach: sessionDto.createdByName || 'Entrenador',
      description: sessionDto.description || '',
      intervals: intervals.length > 0 ? intervals : undefined,
      notes: sessionDto.notes,
      objectives: sessionDto.description ? [sessionDto.description] : undefined
    };
  };

  // Cargar planificaciones al montar el componente
  useEffect(() => {
    const loadPlannings = async () => {
      if (!athleteId) {
        setIsLoadingPlannings(false);
        return;
      }

      try {
        setIsLoadingPlannings(true);
        const planningsData = await PlanningService.getPlanningsByAthleteId(athleteId);
        const mappedPlannings = planningsData.map(mapPlanningToMacrocycle);
        setPlannings(mappedPlannings);
      } catch (error) {
        console.error('Error al cargar planificaciones:', error);
        toast.error('Error al cargar planificaciones');
      } finally {
        setIsLoadingPlannings(false);
      }
    };

    loadPlannings();
  }, [athleteId]);

  // Función helper para calcular fecha de fin basada en fecha de inicio y cantidad de semanas
  const calculateEndDateFromWeeks = (startDate: string, weeksCount: number): string => {
    const [year, month, day] = startDate.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    // Sumar semanas: semanas * 7 días - 1 día (porque el primer día cuenta)
    const end = new Date(start);
    end.setDate(end.getDate() + (weeksCount * 7 - 1));
    
    // Formatear como YYYY-MM-DD
    const endYear = end.getFullYear();
    const endMonth = String(end.getMonth() + 1).padStart(2, '0');
    const endDay = String(end.getDate()).padStart(2, '0');
    return `${endYear}-${endMonth}-${endDay}`;
  };

  // Función para cargar mesociclos de una planificación (lazy con caché)
  const loadMesocycles = async (planningId: number) => {
    // Verificar caché
    if (mesocyclesCache.has(planningId)) {
      return mesocyclesCache.get(planningId)!;
    }

    // Verificar si ya se está cargando
    if (loadingMesocycles.has(planningId)) {
      return [];
    }

    try {
      setLoadingMesocycles(prev => new Set(prev).add(planningId));
      const mesocyclesData = await MesocycleService.getMesocyclesByPlanningId(planningId);
      const mappedMesocycles = mesocyclesData.map(dto => mapMesocycleDtoToMesocycle(dto, planningId));
      
      // Ordenar por fecha de inicio (usando parseo correcto de fechas)
      mappedMesocycles.sort((a, b) => {
        const [yearA, monthA, dayA] = a.startDate.split('-').map(Number);
        const [yearB, monthB, dayB] = b.startDate.split('-').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Guardar en caché
      setMesocyclesCache(prev => new Map(prev).set(planningId, mappedMesocycles));
      return mappedMesocycles;
    } catch (error) {
      console.error(`Error al cargar mesociclos de planificación ${planningId}:`, error);
      toast.error('Error al cargar mesociclos');
      return [];
    } finally {
      setLoadingMesocycles(prev => {
        const newSet = new Set(prev);
        newSet.delete(planningId);
        return newSet;
      });
    }
  };

  // Función para cargar microciclos de un mesociclo (lazy con caché)
  const loadMicrocycles = async (mesocycleId: number) => {
    // Verificar caché
    if (microcyclesCache.has(mesocycleId)) {
      return microcyclesCache.get(mesocycleId)!;
    }

    // Verificar si ya se está cargando
    if (loadingMicrocycles.has(mesocycleId)) {
      return [];
    }

    try {
      setLoadingMicrocycles(prev => new Set(prev).add(mesocycleId));
      const microcyclesData = await MicrocycleService.getMicrocyclesByMesocycleId(mesocycleId);
      const mappedMicrocycles = microcyclesData.map(dto => mapMicrocycleDtoToMicrocycle(dto, mesocycleId));
      
      // Ordenar microciclos por weekNumber
      mappedMicrocycles.sort((a, b) => a.weekNumber - b.weekNumber);
      
      // Guardar en caché
      setMicrocyclesCache(prev => new Map(prev).set(mesocycleId, mappedMicrocycles));
      
      // Recalcular fecha de fin del mesociclo basándose en la cantidad de microciclos
      if (mappedMicrocycles.length > 0) {
        // Buscar el mesociclo en el caché para obtener el planningId y actualizar fecha de fin
        setMesocyclesCache(prev => {
          const updated = new Map(prev);
          // Buscar en todos los plannings
          for (const [planningId, mesocycles] of updated.entries()) {
            const mesocycle = mesocycles.find(m => m.id === `mesocycle-${mesocycleId}`);
            if (mesocycle) {
              // Calcular fecha de fin basada en cantidad de microciclos
              const calculatedEndDate = calculateEndDateFromWeeks(mesocycle.startDate, mappedMicrocycles.length);
              const updatedMesocycles = mesocycles.map(m => {
                if (m.id === `mesocycle-${mesocycleId}`) {
                  return {
                    ...m,
                    endDate: calculatedEndDate,
                    weekCount: mappedMicrocycles.length
                  };
                }
                return m;
              });
              
              // Reordenar por fecha de inicio después de actualizar
              updatedMesocycles.sort((a, b) => {
                const [yearA, monthA, dayA] = a.startDate.split('-').map(Number);
                const [yearB, monthB, dayB] = b.startDate.split('-').map(Number);
                const dateA = new Date(yearA, monthA - 1, dayA);
                const dateB = new Date(yearB, monthB - 1, dayB);
                return dateA.getTime() - dateB.getTime();
              });
              
              updated.set(planningId, updatedMesocycles);
              break;
            }
          }
          return updated;
        });
      }
      
      return mappedMicrocycles;
    } catch (error) {
      console.error(`Error al cargar microciclos del mesociclo ${mesocycleId}:`, error);
      toast.error('Error al cargar microciclos');
      return [];
    } finally {
      setLoadingMicrocycles(prev => {
        const newSet = new Set(prev);
        newSet.delete(mesocycleId);
        return newSet;
      });
    }
  };

  // Función para cargar sesiones de un microciclo (lazy con caché)
  const loadSessions = async (microcycleId: number, planningId: number) => {
    // Verificar caché
    if (sessionsCache.has(microcycleId)) {
      return sessionsCache.get(microcycleId)!;
    }

    // Verificar si ya se está cargando
    if (loadingSessions.has(microcycleId)) {
      return [];
    }

    try {
      setLoadingSessions(prev => new Set(prev).add(microcycleId));
      
      // Cargar todas las sesiones del atleta para esta planificación
      if (!athleteId) return [];
      
      const sessionsData = await TrainingSessionService.getTrainingSessionsByAthleteId(athleteId, planningId);
      
      // Filtrar sesiones que pertenecen a este microciclo
      const filteredSessions = sessionsData.filter(s => s.microcycleId === microcycleId);
      const mappedSessions = filteredSessions.map(dto => mapSessionDtoToTrainingSession(dto, microcycleId));
      
      // Guardar en caché
      setSessionsCache(prev => new Map(prev).set(microcycleId, mappedSessions));
      return mappedSessions;
    } catch (error) {
      console.error(`Error al cargar sesiones del microciclo ${microcycleId}:`, error);
      toast.error('Error al cargar sesiones');
      return [];
    } finally {
      setLoadingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(microcycleId);
        return newSet;
      });
    }
  };

  // Macrociclos disponibles del atleta (desde backend)
  const macrocycles: Macrocycle[] = useMemo(() => {
    return plannings.map(planning => {
      // Si la planificación está seleccionada y tiene mesociclos en caché, incluirlos
      const planningId = parseInt(planning.id.replace('planning-', ''));
      let cachedMesocycles = mesocyclesCache.get(planningId);
      
      // Asegurar que los mesociclos estén ordenados por fecha de inicio
      if (cachedMesocycles && cachedMesocycles.length > 0) {
        cachedMesocycles = [...cachedMesocycles].sort((a, b) => {
          const [yearA, monthA, dayA] = a.startDate.split('-').map(Number);
          const [yearB, monthB, dayB] = b.startDate.split('-').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateA.getTime() - dateB.getTime();
        });
      }
      
      return {
        ...planning,
        mesocycles: cachedMesocycles || [],
        // Preservar _planningData si existe
        _planningData: planning._planningData || {
          mesocyclesCount: 0,
          hasEndDate: !!planning.endDate
        }
      };
    });
  }, [plannings, mesocyclesCache]);

  // Obtener macrociclo, mesociclo y microciclo actual con datos del backend
  const currentMacrocycle = useMemo(() => {
    return macrocycles.find(m => m.id === selectedMacrocycle);
  }, [macrocycles, selectedMacrocycle]);

  const currentMesocycle = useMemo(() => {
    if (!currentMacrocycle || !selectedMesocycle) return null;
    return currentMacrocycle.mesocycles.find(m => m.id === selectedMesocycle);
  }, [currentMacrocycle, selectedMesocycle]);

  const currentMicrocycle = useMemo(() => {
    if (!currentMesocycle || !selectedMicrocycle) return null;
    return currentMesocycle.microcycles.find(m => m.id === selectedMicrocycle);
  }, [currentMesocycle, selectedMicrocycle]);

  // Cargar mesociclos cuando se selecciona una planificación
  useEffect(() => {
    if (selectedMacrocycle) {
      const planningId = parseInt(selectedMacrocycle.replace('planning-', ''));
      if (planningId && !mesocyclesCache.has(planningId) && !loadingMesocycles.has(planningId)) {
        loadMesocycles(planningId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMacrocycle]);

  // Cargar microciclos cuando se selecciona un mesociclo
  useEffect(() => {
    if (selectedMesocycle && currentMesocycle) {
      const mesocycleId = parseInt(selectedMesocycle.replace('mesocycle-', ''));
      if (mesocycleId && !microcyclesCache.has(mesocycleId) && !loadingMicrocycles.has(mesocycleId)) {
        loadMicrocycles(mesocycleId).then(microcycles => {
          // Actualizar el mesociclo en el caché con sus microciclos y fecha de fin recalculada
          if (currentMacrocycle) {
            const planningId = parseInt(currentMacrocycle.id.replace('planning-', ''));
            setMesocyclesCache(prev => {
              const updated = new Map(prev);
              const mesocycles = updated.get(planningId) || [];
              const updatedMesocycles = mesocycles.map(m => {
                if (m.id === selectedMesocycle) {
                  // Recalcular fecha de fin basada en cantidad de microciclos
                  const calculatedEndDate = calculateEndDateFromWeeks(m.startDate, microcycles.length);
                  return {
                    ...m,
                    microcycles,
                    endDate: calculatedEndDate,
                    weekCount: microcycles.length
                  };
                }
                return m;
              });
              
              // Reordenar por fecha de inicio después de actualizar
              updatedMesocycles.sort((a, b) => {
                const [yearA, monthA, dayA] = a.startDate.split('-').map(Number);
                const [yearB, monthB, dayB] = b.startDate.split('-').map(Number);
                const dateA = new Date(yearA, monthA - 1, dayA);
                const dateB = new Date(yearB, monthB - 1, dayB);
                return dateA.getTime() - dateB.getTime();
              });
              
              updated.set(planningId, updatedMesocycles);
              return updated;
            });
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMesocycle]);

  // Cargar sesiones cuando se selecciona un microciclo y posicionar calendario en la semana del microciclo
  useEffect(() => {
    if (selectedMicrocycle && currentMicrocycle && currentMacrocycle) {
      const microcycleId = parseInt(selectedMicrocycle.replace('microcycle-', ''));
      const planningId = parseInt(currentMacrocycle.id.replace('planning-', ''));
      
      // Posicionar el calendario en la fecha de inicio del microciclo
      const startDateOnly = extractDateOnly(currentMicrocycle.startDate);
      const [year, month, day] = startDateOnly.split('-').map(Number);
      const microcycleStartDate = new Date(year, month - 1, day);
      setCurrentMonth(microcycleStartDate);
      
      if (microcycleId && planningId && !sessionsCache.has(microcycleId) && !loadingSessions.has(microcycleId)) {
        loadSessions(microcycleId, planningId).then(sessions => {
          // Actualizar el microciclo en el caché con sus sesiones
          if (currentMesocycle) {
            const mesocycleId = parseInt(currentMesocycle.id.replace('mesocycle-', ''));
            setMicrocyclesCache(prev => {
              const updated = new Map(prev);
              const microcycles = updated.get(mesocycleId) || [];
              const updatedMicrocycles = microcycles.map(m => 
                m.id === selectedMicrocycle ? { 
                  ...m, 
                  sessions,
                  // Preservar sessionsCount si ya existe, o usar la longitud de las sesiones cargadas como fallback
                  sessionsCount: m.sessionsCount ?? sessions.length
                } : m
              );
              updated.set(mesocycleId, updatedMicrocycles);
              return updated;
            });
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMicrocycle]);

  // Obtener todas las sesiones según el contexto de navegación (actualizado para usar datos del backend)
  const getAllSessions = (): TrainingSession[] => {
    if (selectedMicrocycle && currentMicrocycle) {
      // Si hay un microciclo seleccionado, mostrar solo sus sesiones
      const microcycleId = parseInt(selectedMicrocycle.replace('microcycle-', ''));
      return sessionsCache.get(microcycleId) || currentMicrocycle.sessions || [];
    } else if (selectedMesocycle && currentMesocycle) {
      // Si hay un mesociclo seleccionado, mostrar sesiones de todos sus microciclos
      const sessions: TrainingSession[] = [];
      currentMesocycle.microcycles.forEach(microcycle => {
        const microcycleId = parseInt(microcycle.id.replace('microcycle-', ''));
        const cachedSessions = sessionsCache.get(microcycleId);
        if (cachedSessions) {
          sessions.push(...cachedSessions);
        } else {
          sessions.push(...(microcycle.sessions || []));
        }
      });
      return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (selectedMacrocycle && currentMacrocycle) {
      // Si solo hay un macrociclo seleccionado, mostrar todas sus sesiones
      const sessions: TrainingSession[] = [];
      currentMacrocycle.mesocycles.forEach(mesocycle => {
        mesocycle.microcycles.forEach(microcycle => {
          const microcycleId = parseInt(microcycle.id.replace('microcycle-', ''));
          const cachedSessions = sessionsCache.get(microcycleId);
          if (cachedSessions) {
            sessions.push(...cachedSessions);
          } else {
            sessions.push(...(microcycle.sessions || []));
          }
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
    
    // Si estamos en la vista del microciclo, solo mostrar sesiones de ese microciclo
    if (selectedMicrocycle && currentMicrocycle) {
      const microcycleId = parseInt(selectedMicrocycle.replace('microcycle-', ''));
      const cachedSessions = sessionsCache.get(microcycleId) || currentMicrocycle.sessions || [];
      return cachedSessions.filter(session => session.date === dateString);
    }
    
    // Si estamos en otra vista, usar getAllSessions()
    const allSessions = getAllSessions();
    return allSessions.filter(session => session.date === dateString);
  };
  
  // Función para verificar si una fecha está dentro del rango del microciclo
  const isDateInMicrocycleRange = (date: Date): boolean => {
    if (!currentMicrocycle) return false;
    
    const dateString = date.toISOString().split('T')[0];
    const startDateOnly = extractDateOnly(currentMicrocycle.startDate);
    const endDateOnly = extractDateOnly(currentMicrocycle.endDate);
    
    return dateString >= startDateOnly && dateString <= endDateOnly;
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

  // Función para formatear fecha inicio y fin de microciclo (semana)
  const formatMicrocycleDateRange = (startDate: string, endDate: string) => {
    const startDateOnly = extractDateOnly(startDate);
    const endDateOnly = extractDateOnly(endDate);
    
    const [startYear, startMonth, startDay] = startDateOnly.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateOnly.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    const startFormatted = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endFormatted = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatDateRange = (startDate: string, endDate: string, hasEndDate?: boolean) => {
    // Usar extractDateOnly para evitar problemas de timezone
    const startDateOnly = extractDateOnly(startDate);
    const endDateOnly = endDate ? extractDateOnly(endDate) : null;
    
    // Parsear como fecha local (YYYY-MM-DD) para evitar problemas de timezone
    const [startYear, startMonth, startDay] = startDateOnly.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Si no hay fecha fin o es la misma que la de inicio, mostrar solo inicio
    if (!hasEndDate || !endDateOnly || endDateOnly === startDateOnly) {
      return start;
    }
    
    const [endYear, endMonth, endDay] = endDateOnly.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Función para formatear solo la fecha de inicio
  const formatStartDate = (startDate: string) => {
    const startDateOnly = extractDateOnly(startDate);
    const [year, month, day] = startDateOnly.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatSessionDate = (dateString: string) => {
    // Usar extractDateOnly para evitar problemas de timezone
    const dateOnly = extractDateOnly(dateString);
    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexed
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Funciones helper para formatear datos del modal (igual que AthleteCalendar)
  const parseDurationToSeconds = (value?: string | null): number | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^PT/i.test(trimmed)) {
      const match = trimmed.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
      if (match) {
        const hours = Number(match[1] ?? 0);
        const minutes = Number(match[2] ?? 0);
        const seconds = Number(match[3] ?? 0);
        return hours * 3600 + minutes * 60 + seconds;
      }
      return null;
    }

    if (trimmed.includes(':')) {
      const segments = trimmed.split(':');
      const numbers = segments.map(segment => Number(segment));
      if (numbers.some(num => Number.isNaN(num))) {
        return null;
      }

      if (segments.length === 2) {
        const [minutes, seconds] = numbers;
        return minutes * 60 + seconds;
      }

      if (segments.length === 3) {
        const [hours, minutes, seconds] = numbers;
        return hours * 3600 + minutes * 60 + seconds;
      }

      return null;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric * 60;
    }

    return null;
  };

  const formatSecondsAsClock = (seconds?: number | null): string => {
    if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
      return '—';
    }

    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDurationLabel = (value?: string | null): string => {
    const seconds = parseDurationToSeconds(value);
    if (seconds === null) {
      return value?.trim() || '—';
    }

    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDistanceMeters = (meters?: number): string => {
    if (meters === undefined || meters === null || Number.isNaN(meters)) return '—';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDistanceKm = (kilometers?: number): string => {
    if (kilometers === undefined || kilometers === null || Number.isNaN(kilometers)) {
      return '—';
    }
    return `${kilometers.toFixed(2)} km`;
  };

  const formatIntervalIntensityLabel = (intensity?: string): string | undefined => {
    switch (intensity) {
      case 'easy':
        return 'Suave';
      case 'moderate':
        return 'Moderada';
      case 'hard':
        return 'Alta';
      case 'very_hard':
        return 'Muy alta';
      case 'max':
        return 'Máxima';
      default:
        return undefined;
    }
  };

  const summarizeIntervalWork = (interval: TrainingIntervalResponseDto): string => {
    if (interval.duration) {
      return formatDurationLabel(interval.duration);
    }

    if (interval.targetTime) {
      return formatDurationLabel(interval.targetTime);
    }

    if (interval.distance) {
      return `${interval.distance} m`;
    }

    if (interval.pace && interval.paceType) {
      return `${interval.paceType} ${interval.pace}`;
    }

    if (interval.description) {
      return interval.description;
    }

    return 'Intervalo';
  };

  // Función para convertir ritmo en formato mm:ss a minutos decimales
  const paceToMinutes = (paceStr: string): number => {
    const parts = paceStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!Number.isNaN(minutes) && !Number.isNaN(seconds)) {
        return minutes + seconds / 60;
      }
    }
    return 0;
  };

  // Función para convertir minutos decimales a formato mm:ss
  const minutesToPace = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para calcular el ritmo basado en VO2Max y porcentaje
  const calculatePaceFromVO2Max = (vo2MaxPaceStr: string, percentage: number): string => {
    const vo2MaxMinutes = paceToMinutes(vo2MaxPaceStr);
    if (vo2MaxMinutes <= 0) return '';
    
    // Calcular velocidad del VO2Max (km/h)
    const vo2MaxVelocity = 60 / vo2MaxMinutes;
    
    // Aplicar porcentaje
    const targetVelocity = vo2MaxVelocity * (percentage / 100);
    
    // Convertir de vuelta a ritmo (min/km)
    const targetPaceMinutes = 60 / targetVelocity;
    
    return minutesToPace(targetPaceMinutes);
  };

  const determineTargetPace = (interval: TrainingIntervalResponseDto, athleteVO2Max?: string): string | undefined => {
    if (interval.targetSpeed) {
      return interval.targetSpeed;
    }

    // Si es VO2Max percentage, calcular el ritmo
    const intervalAny = interval as any;
    const paceTypeStr = String(interval.paceType || '');
    const isVo2MaxPercentage = paceTypeStr === 'vo2max_percentage' || 
                               paceTypeStr.toLowerCase() === 'vo2maxpercentage' || 
                               paceTypeStr === 'vo2MaxPercentage';
    
    if (isVo2MaxPercentage && intervalAny.vo2MaxPercentage && athleteVO2Max) {
      const calculatedPace = calculatePaceFromVO2Max(athleteVO2Max, intervalAny.vo2MaxPercentage);
      if (calculatedPace) {
        return calculatedPace;
      }
    }

    if (interval.paceType && interval.pace !== undefined && interval.pace !== null) {
      return `${interval.pace} ${interval.paceType}`;
    }

    if (interval.targetTime) {
      return formatDurationLabel(interval.targetTime);
    }

    return undefined;
  };

  const mapIntervalToCalendarInterval = (interval: TrainingIntervalResponseDto, athleteVO2Max?: string) => {
    const repetitions = interval.repetitions && interval.repetitions > 0 ? interval.repetitions : 1;
    const distancePerRepMeters = typeof interval.distance === 'number' ? interval.distance : undefined;
    const totalDistanceMeters = distancePerRepMeters ? distancePerRepMeters * repetitions : undefined;

    return {
      id: interval.id?.toString() ?? `interval-${Math.random().toString(36).slice(2, 10)}`,
      workSummary: summarizeIntervalWork(interval),
      repetitions,
      distancePerRepMeters,
      totalDistanceMeters,
      targetPace: determineTargetPace(interval, athleteVO2Max),
      recoveryTime: interval.recoveryTime,
      intensity: mapIntervalIntensityFromBackend(interval.intensity),
      notes: interval.description,
      work: summarizeIntervalWork(interval),
      rest: interval.recoveryTime || '00:00'
    };
  };

  const buildSeriesStructure = (session: TrainingSessionResponseDto, athleteVO2Max?: string) => {
    const isSimpleStructure = session.structureType?.toLowerCase() === 'simple';
    const fallbackIntervals = session.intervals ?? [];
    const hasBackendSeries = Array.isArray(session.series) && session.series.length > 0;

    const backendSeries = hasBackendSeries
      ? session.series!
      : [{
          id: 0,
          name: 'Intervalos Simples',
          repetitions: 1,
          recoveryBetweenSets: '00:00',
          orderIndex: 0,
          notes: undefined,
          intervals: fallbackIntervals
        } as TrainingSessionResponseDto['series'][number]];

    if (isSimpleStructure) {
      return [];
    }

    return backendSeries.map((series, index) => {
      const mappedIntervals = (series.intervals ?? []).map(interval => mapIntervalToCalendarInterval(interval, athleteVO2Max));
      const seriesRepetitions = series.repetitions && series.repetitions > 0 ? series.repetitions : 1;
      const baseDistance = mappedIntervals.reduce((sum, interval) => sum + (interval.totalDistanceMeters ?? 0), 0);
      const totalDistanceMeters = baseDistance * seriesRepetitions;

      return {
        id: series.id?.toString() ?? `series-${index}`,
        name: series.name?.trim() || `Serie ${index + 1}`,
        repetitions: seriesRepetitions,
        recoveryBetweenSets: series.recoveryBetweenSets,
        intervals: mappedIntervals,
        totalDistanceMeters
      };
    });
  };

  const calculateSessionDistanceKm = (
    series: any[],
    simpleIntervals?: any[],
    fallbackVolume?: number
  ): number | undefined => {
    const seriesMeters = series.reduce((sum, serie) => sum + (serie.totalDistanceMeters ?? 0), 0);
    const intervalsMeters = (simpleIntervals ?? []).reduce((sum, interval) => sum + (interval.totalDistanceMeters ?? 0), 0);
    const totalMeters = seriesMeters + intervalsMeters;
    if (totalMeters > 0) {
      return totalMeters / 1000;
    }

    if (fallbackVolume && !Number.isNaN(Number(fallbackVolume))) {
      return Number(fallbackVolume);
    }

    return undefined;
  };

  const getIntervalsFromSession = (session: TrainingSessionResponseDto): TrainingIntervalResponseDto[] => {
    const structure = session.structureType?.toLowerCase();
    if ((structure === 'simple' || structure === 'intervals') && session.intervals && session.intervals.length > 0) {
      return session.intervals;
    }

    if (session.series && session.series.length > 0) {
      return session.series.flatMap(serie => serie.intervals ?? []);
    }

    return session.intervals ?? [];
  };

  const mapBackendSessionToCalendar = (session: TrainingSessionResponseDto, athleteVO2Max?: string) => {
    const rawDate = session.date?.toString() ?? '';
    const dateString = rawDate
      ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate)
      : extractDateOnly(new Date().toISOString());
    const intervals = getIntervalsFromSession(session);
    const series = buildSeriesStructure(session, athleteVO2Max);
    const simpleIntervalDetails = session.structureType?.toLowerCase() === 'simple'
      ? intervals.map(interval => mapIntervalToCalendarInterval(interval, athleteVO2Max))
      : undefined;
    const totalDistanceKm = calculateSessionDistanceKm(
      series,
      simpleIntervalDetails,
      session.volume ? Number(session.volume) : undefined
    );

    return {
      id: session.id.toString(),
      microcycleId: session.microcycleId ? session.microcycleId.toString() : undefined,
      date: dateString,
      name: session.name || 'Sesión sin nombre',
      type: mapTrainingCategoryFromBackend(session.category) as 'training' | 'prep_competition' | 'main_competition' | 'recovery',
      intensity: 'medium' as const,
      description: session.description ?? undefined,
      intervals: session.structureType?.toLowerCase() === 'simple' && simpleIntervalDetails && simpleIntervalDetails.length > 0
        ? simpleIntervalDetails.map(detail => ({
            id: detail.id,
            work: detail.workSummary,
            rest: detail.recoveryTime || '00:00',
            recoveryTime: detail.recoveryTime,
            repetitions: detail.repetitions ?? 1,
            distancePerRepMeters: detail.distancePerRepMeters,
            totalDistanceMeters: detail.totalDistanceMeters,
            targetPace: detail.targetPace,
            intensity: detail.intensity,
            notes: detail.notes
          }))
        : undefined,
      series,
      warmup: undefined,
      cooldown: undefined,
      notes: session.notes ?? undefined,
      objectives: undefined,
      equipment: undefined,
      targetZones: undefined,
      structureType: (session.structureType as 'simple' | 'advanced') ?? undefined,
      volume: session.volume ? Number(session.volume) : undefined,
      totalDistanceKm,
      estimatedWorkSeconds: session.estimatedWorkSeconds ?? undefined,
      estimatedRecoverySeconds: session.estimatedRecoverySeconds ?? undefined,
      trainingSessionAthleteId: session.trainingSessionAthleteId,
      hasCompletedWorkout: session.hasCompletedWorkout ?? false
    };
  };

  const handleSessionDetail = async (session: TrainingSession) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
    setIsLoadingSessionDetail(true);
    
    try {
      // Extraer el ID numérico de la sesión (formato: "session-123")
      const sessionId = parseInt(session.id.replace('session-', ''));
      if (!sessionId) {
        console.error('No se pudo extraer el ID de la sesión');
        setIsLoadingSessionDetail(false);
        return;
      }

      // Cargar la sesión completa del backend
      const fullSession = await TrainingSessionService.getTrainingSessionById(sessionId);
      if (!fullSession) {
        toast.error('No se pudo cargar la sesión');
        setIsLoadingSessionDetail(false);
        return;
      }
      
      const mappedSession = mapBackendSessionToCalendar(fullSession, athleteVO2Max);
      setSelectedSessionFull(mappedSession);
      
      // Verificar si hay workout completado
      const hasResults = mappedSession.hasCompletedWorkout ?? false;
      setHasCompletedWorkout(hasResults);
      
      // Si hay resultados, cargar los detalles del workout
      if (hasResults && mappedSession.trainingSessionAthleteId) {
        try {
          const workout = await CompletedWorkoutService.getCompletedWorkoutByTrainingSessionAthleteIdAndDate(
            mappedSession.trainingSessionAthleteId,
            mappedSession.date
          );
          setCompletedWorkout(workout);
        } catch (error) {
          console.error('Error al cargar detalles del workout:', error);
          setCompletedWorkout(null);
        }
      } else {
        setCompletedWorkout(null);
      }
    } catch (error) {
      console.error('Error al cargar la sesión completa:', error);
      toast.error('Error al cargar los detalles de la sesión');
    } finally {
      setIsLoadingSessionDetail(false);
    }
  };

  // Recargar sesión cuando cambie athleteVO2Max y haya una sesión abierta
  useEffect(() => {
    if (selectedSession && athleteVO2Max && isSessionDetailOpen) {
      handleSessionDetail(selectedSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteVO2Max]);

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

          {isLoadingPlannings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando planificaciones...</span>
            </div>
          ) : macrocycles.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No tienes planificaciones asignadas. Contacta a tu entrenador para que te asigne una planificación.
              </AlertDescription>
            </Alert>
          ) : (
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
                        <div className="font-medium">
                          {macrocycle.totalWeeks > 0 
                            ? `${macrocycle.totalWeeks} semanas` 
                            : macrocycle._planningData?.hasEndDate === false 
                              ? 'Sin fecha fin' 
                              : 'Calculando...'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Período</div>
                        <div className="font-medium">
                          {formatDateRange(
                            macrocycle.startDate, 
                            macrocycle.endDate, 
                            macrocycle._planningData?.hasEndDate
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Mesociclos</div>
                        <div className="font-medium">
                          {macrocycle.mesocycles.length > 0 
                            ? `${macrocycle.mesocycles.length} fases`
                            : macrocycle._planningData?.mesocyclesCount !== undefined
                              ? `${macrocycle._planningData.mesocyclesCount} fases`
                              : 'Cargando...'}
                        </div>
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
          )}
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
                  {formatDateRange(
                    currentMacrocycle.startDate, 
                    currentMacrocycle.endDate,
                    currentMacrocycle._planningData?.hasEndDate
                  )}
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
                  <div className="text-2xl font-bold text-primary">
                    {currentMacrocycle.totalWeeks > 0 
                      ? `${currentMacrocycle.totalWeeks} semanas` 
                      : currentMacrocycle._planningData?.hasEndDate === false 
                        ? 'Sin fecha fin' 
                        : 'Calculando...'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Mesociclos Planificados</div>
                  <div className="text-2xl font-bold text-primary">
                    {currentMacrocycle.mesocycles.length > 0 
                      ? currentMacrocycle.mesocycles.length
                      : currentMacrocycle._planningData?.mesocyclesCount !== undefined
                        ? currentMacrocycle._planningData.mesocyclesCount
                        : 0}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Progreso</div>
                  {currentMacrocycle._planningData?.hasEndDate === false ? (
                    <>
                      <div className="text-2xl font-bold text-primary">En curso</div>
                      <Progress value={50} className="h-2" />
                    </>
                  ) : currentMacrocycle.endDate && currentMacrocycle.endDate !== currentMacrocycle.startDate ? (
                    <>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round((new Date().getTime() - new Date(currentMacrocycle.startDate).getTime()) / 
                        (new Date(currentMacrocycle.endDate).getTime() - new Date(currentMacrocycle.startDate).getTime()) * 100)}%
                      </div>
                      <Progress value={Math.round((new Date().getTime() - new Date(currentMacrocycle.startDate).getTime()) / 
                        (new Date(currentMacrocycle.endDate).getTime() - new Date(currentMacrocycle.startDate).getTime()) * 100)} 
                        className="h-2" 
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-primary">N/A</div>
                      <Progress value={0} className="h-2" />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Mesociclos */}
          <div className="space-y-4">
            {(() => {
              const planningId = parseInt(currentMacrocycle.id.replace('planning-', ''));
              const isLoading = loadingMesocycles.has(planningId);
              const hasMesocycles = currentMacrocycle.mesocycles.length > 0;
              
              if (isLoading && !hasMesocycles) {
                return (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Cargando mesociclos...</span>
                  </div>
                );
              }
              
              if (!hasMesocycles) {
                return (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Este macrociclo no tiene mesociclos asignados aún.
                    </AlertDescription>
                  </Alert>
                );
              }
              
              return currentMacrocycle.mesocycles.map((mesocycle, index) => (
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
                              {formatStartDate(mesocycle.startDate)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {mesocycle.microcycles.length > 0 
                                ? `${mesocycle.microcycles.length} microciclos`
                                : mesocycle.weekCount > 0
                                  ? `${mesocycle.weekCount} microciclos`
                                  : 'Cargando...'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ));
            })()}
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
                  {formatStartDate(currentMesocycle.startDate)}
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
                    <div className="text-sm text-muted-foreground">Fecha de Inicio</div>
                    <div className="text-lg font-bold text-primary">{formatStartDate(currentMesocycle.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Microciclos</div>
                    <div className="text-lg font-bold text-primary">
                      {currentMesocycle.microcycles.length > 0 
                        ? currentMesocycle.microcycles.length
                        : currentMesocycle.weekCount > 0
                          ? currentMesocycle.weekCount
                          : 0}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Microciclos */}
          <div className="grid gap-4">
            {(() => {
              const mesocycleId = parseInt(currentMesocycle.id.replace('mesocycle-', ''));
              const isLoading = loadingMicrocycles.has(mesocycleId);
              const hasMicrocycles = currentMesocycle.microcycles.length > 0;
              
              if (isLoading && !hasMicrocycles) {
                return (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Cargando microciclos...</span>
                  </div>
                );
              }
              
              if (!hasMicrocycles) {
                return (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Este mesociclo no tiene microciclos asignados aún.
                    </AlertDescription>
                  </Alert>
                );
              }
              
              return currentMesocycle.microcycles.map((microcycle) => (
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
                          {formatMicrocycleDateRange(microcycle.startDate, microcycle.endDate)}
                        </span>
                        <span className="text-muted-foreground">
                          <Target className="w-4 h-4 inline mr-1" />
                          Carga: {microcycle.totalLoad}
                        </span>
                        <span className="text-muted-foreground">
                          <BookOpen className="w-4 h-4 inline mr-1" />
                          {microcycle.sessionsCount} sesiones
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
              ));
            })()}
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
                        Sesiones programadas para esta semana • {currentMicrocycle.sessionsCount} sesiones totales
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
                      const isInMicrocycleWeek = isDateInMicrocycleRange(date);
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border rounded-lg ${
                            isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                          } ${isToday ? 'ring-2 ring-primary/50' : ''} ${
                            isInMicrocycleWeek && isCurrentMonth ? 'bg-primary/5 border-primary/30' : ''
                          }`}
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
                                className="p-1 rounded text-xs"
                                style={{ backgroundColor: getIntensityColor(session.intensity) + '20' }}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <div className={`w-2 h-2 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                                  <span className="font-medium truncate flex-1">{session.name}</span>
                                  {completedSessions.has(session.id) && (
                                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                  )}
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
              {(() => {
                // Obtener sesiones del caché o del microciclo
                const microcycleId = parseInt(selectedMicrocycle.replace('microcycle-', ''));
                const sessionsToShow = sessionsCache.get(microcycleId) || currentMicrocycle.sessions || [];
                
                return sessionsToShow.length > 0 ? (
                  sessionsToShow.map((session) => (
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
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal de Detalle de Sesión */}
      {selectedSession && (
        <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {isLoadingSessionDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando detalles de la sesión...</span>
              </div>
            ) : selectedSessionFull ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getIntensityColor(selectedSessionFull.intensity)}`}></div>
                    {selectedSessionFull.name}
                  </DialogTitle>
                  <DialogDescription>
                    {formatSessionDate(selectedSessionFull.date)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Información básica */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Distancia estimada</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceKm(selectedSessionFull.totalDistanceKm ?? selectedSessionFull.volume)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Intensidad</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedSessionFull.intensity === 'low' ? 'Baja' :
                         selectedSessionFull.intensity === 'medium' ? 'Media' :
                         selectedSessionFull.intensity === 'high' ? 'Alta' : 'Recuperación'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Estructura</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedSessionFull.structureType === 'advanced' ? 'Series con intervalos' : 'Intervalos simples'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Categoría</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {getSessionTypeLabel(selectedSessionFull.type)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Trabajo estimado</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatSecondsAsClock(selectedSessionFull.estimatedWorkSeconds)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recuperación estimada</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatSecondsAsClock(selectedSessionFull.estimatedRecoverySeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <h4 className="font-medium mb-2">Descripción</h4>
                    <p className="text-sm text-muted-foreground">{selectedSessionFull.description || 'Sin descripción disponible.'}</p>
                  </div>

                  {/* Calentamiento */}
                  {selectedSessionFull.warmup && (
                    <div>
                      <h4 className="font-medium mb-2">Calentamiento</h4>
                      <p className="text-sm text-muted-foreground">{selectedSessionFull.warmup}</p>
                    </div>
                  )}

                  {/* Series e intervalos */}
                  {selectedSessionFull.structureType === 'advanced' && selectedSessionFull.series && selectedSessionFull.series.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3">Series e intervalos</h4>
                      <Accordion
                        type="multiple"
                        defaultValue={selectedSessionFull.series.map((series: any, index: number) => series.id || `series-${index}`)}
                        className="space-y-2"
                      >
                        {selectedSessionFull.series.map((series: any, index: number) => (
                          <AccordionItem key={series.id || `series-${index}`} value={series.id || `series-${index}`}>
                            <AccordionTrigger className="w-full">
                              <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-left">
                                <div>
                                  <p className="font-medium">{series.name}</p>
                                  <p className="text-sm text-muted-foreground">Serie {index + 1}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Reps: {series.repetitions}</Badge>
                                  <Badge variant="secondary">Dist: {formatDistanceMeters(series.totalDistanceMeters)}</Badge>
                                  {series.recoveryBetweenSets && (
                                    <Badge variant="outline">
                                      Recup. series: {formatDurationLabel(series.recoveryBetweenSets)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                {series.intervals.length === 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    Esta serie no contiene intervalos configurados.
                                  </p>
                                )}
                                {series.intervals.map((interval: any, intervalIndex: number) => (
                                  <div key={interval.id || `interval-${intervalIndex}`} className="rounded-lg border p-4 space-y-2">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="font-medium">Intervalo {intervalIndex + 1}: {interval.workSummary}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Repeticiones: {interval.repetitions}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {interval.targetPace && (
                                          <Badge variant="outline">Ritmo: {interval.targetPace}</Badge>
                                        )}
                                        {interval.intensity && (
                                          <Badge variant="outline">
                                            Intensidad: {formatIntervalIntensityLabel(interval.intensity)}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                      <div>
                                        Distancia por rep.: {formatDistanceMeters(interval.distancePerRepMeters)}
                                      </div>
                                      <div>
                                        Distancia total: {formatDistanceMeters(interval.totalDistanceMeters)}
                                      </div>
                                      {interval.recoveryTime && interval.recoveryTime !== '00:00' && (
                                        <div>
                                          Recuperación: {formatDurationLabel(interval.recoveryTime)}
                                        </div>
                                      )}
                                    </div>
                                    {interval.notes && (
                                      <p className="text-sm text-muted-foreground">
                                        Notas: {interval.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ) : selectedSessionFull.structureType !== 'advanced' && selectedSessionFull.intervals && selectedSessionFull.intervals.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3">Intervalos</h4>
                      <div className="space-y-3">
                        {selectedSessionFull.intervals.map((interval: any, index: number) => (
                          <div key={interval.id || `simple-interval-${index}`} className="border rounded-lg p-4 space-y-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium">Intervalo {index + 1}: {interval.work}</p>
                                <p className="text-sm text-muted-foreground">
                                  Repeticiones: {interval.repetitions}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {interval.targetPace && (
                                  <Badge variant="outline">Ritmo: {interval.targetPace}</Badge>
                                )}
                                {interval.intensity && (
                                  <Badge variant="outline">
                                    Intensidad: {formatIntervalIntensityLabel(interval.intensity)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div>
                                Distancia por rep.: {formatDistanceMeters(interval.distancePerRepMeters)}
                              </div>
                              <div>
                                Distancia total: {formatDistanceMeters(interval.totalDistanceMeters)}
                              </div>
                              {interval.recoveryTime && interval.recoveryTime !== '00:00' && (
                                <div>
                                  Recuperación: {formatDurationLabel(interval.recoveryTime)}
                                </div>
                              )}
                            </div>
                            {interval.notes && (
                              <p className="text-sm text-muted-foreground">Notas: {interval.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    selectedSessionFull.intervals && selectedSessionFull.intervals.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Intervalos</h4>
                      <div className="space-y-2">
                        {selectedSessionFull.intervals.map((interval: any, index: number) => (
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
                    )
                  )}

                  {/* Enfriamiento */}
                  {selectedSessionFull.cooldown && (
                    <div>
                      <h4 className="font-medium mb-2">Enfriamiento</h4>
                      <p className="text-sm text-muted-foreground">{selectedSessionFull.cooldown}</p>
                    </div>
                  )}

                  {/* Objetivos */}
                  {selectedSessionFull.objectives && selectedSessionFull.objectives.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Objetivos</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedSessionFull.objectives.map((objective: string, index: number) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Zonas objetivo */}
                  {selectedSessionFull.targetZones && (
                    <div>
                      <h4 className="font-medium mb-2">Zonas Objetivo</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedSessionFull.targetZones.heartRate && (
                          <div>
                            <span className="text-sm font-medium">Frecuencia Cardíaca:</span>
                            <p className="text-sm text-muted-foreground">{selectedSessionFull.targetZones.heartRate}</p>
                          </div>
                        )}
                        {selectedSessionFull.targetZones.pace && (
                          <div>
                            <span className="text-sm font-medium">Ritmo:</span>
                            <p className="text-sm text-muted-foreground">{selectedSessionFull.targetZones.pace}</p>
                          </div>
                        )}
                        {selectedSessionFull.targetZones.effort && (
                          <div>
                            <span className="text-sm font-medium">Esfuerzo:</span>
                            <p className="text-sm text-muted-foreground">{selectedSessionFull.targetZones.effort}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Equipamiento */}
                  {selectedSessionFull.equipment && selectedSessionFull.equipment.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Equipamiento Necesario</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSessionFull.equipment.map((item: string, index: number) => (
                          <Badge key={index} variant="outline">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {selectedSessionFull.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notas Adicionales</h4>
                      <p className="text-sm text-muted-foreground">{selectedSessionFull.notes}</p>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-4">
                  {(() => {
                    // Verificar si la fecha es futura
                    const [year, month, day] = selectedSessionFull.date.split('-').map(Number);
                    const sessionDate = new Date(year, month - 1, day);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    sessionDate.setHours(0, 0, 0, 0);
                    const isFutureDate = sessionDate > today;
                    
                    return (
                      <>
                        {!hasCompletedWorkout && selectedSessionFull.trainingSessionAthleteId && !isFutureDate && (
                          <Alert className="bg-accent/10 border-accent/20">
                            <Info className="h-4 w-4 text-accent" />
                            <AlertDescription className="text-sm">
                              No se han cargado los resultados de este entrenamiento aún. Puedes cargarlos ahora.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {hasCompletedWorkout && (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-sm text-green-900">
                              Los resultados de este entrenamiento ya han sido cargados.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    );
                  })()}

                  <div className="flex w-full justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsSessionDetailOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                </DialogFooter>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se pudieron cargar los detalles de la sesión</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
