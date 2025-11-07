import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Target, TrendingUp, Plus, Activity, Edit, Trash2, ArrowLeft, CalendarDays, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CreateMesocycleModal } from './CreateMesocycleModal';
import { EditMicrocycleModal } from './EditMicrocycleModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PlanningCalendar } from './PlanningCalendar';
import { Mesocycle, Microcycle } from './types/microcycleTypes';
import { MesocycleService, type MesocycleResponseDto, type UpdateMesocycleDto } from '../services/mesocycleService';
import { MicrocycleService, type MicrocycleResponseDto } from '../services/microcycleService';
import { toast } from 'sonner';

interface MacrocycleViewProps {
  planningId: string;
  year: number;
  planningStartDate?: string; // Fecha de inicio de la planificación para calcular semanas
  planningEndDate?: string | null; // Fecha de fin de la planificación
  athletes: Array<{
    id: string;
    name: string;
    groupName: string;
  }>;
  onViewWeeklyPlanning?: (microcycle: Microcycle, mesocycle: Mesocycle) => void;
  onViewWeeklyCalendar?: (microcycle: Microcycle, mesocycle: Mesocycle) => void;
  onViewMesocycleCalendar?: (mesocycle: Mesocycle) => void;
  onViewMicrocycleCalendar?: (microcycle: Microcycle) => void;
}



export function MacrocycleView({ planningId, year, planningStartDate, planningEndDate, athletes, onViewWeeklyPlanning, onViewWeeklyCalendar, onViewMesocycleCalendar, onViewMicrocycleCalendar }: MacrocycleViewProps) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [isCreateMesocycleModalOpen, setIsCreateMesocycleModalOpen] = useState(false);
  const [editingMesocycle, setEditingMesocycle] = useState<Mesocycle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingMesocycleCalendar, setViewingMesocycleCalendar] = useState<Mesocycle | null>(null);
  const [viewingMicrocycleCalendar, setViewingMicrocycleCalendar] = useState<{microcycle: Microcycle, mesocycle: Mesocycle} | null>(null);
  const [expandedMesocycles, setExpandedMesocycles] = useState<Set<string>>(new Set());
  const [editingMicrocycle, setEditingMicrocycle] = useState<{microcycle: Microcycle, mesocycle: Mesocycle} | null>(null);
  const [mesocycles, setMesocycles] = useState<MesocycleResponseDto[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadedMicrocycles, setLoadedMicrocycles] = useState<Map<string, Microcycle[]>>(new Map());
  const [loadingMicrocycles, setLoadingMicrocycles] = useState<Set<string>>(new Set());

  // Convertir mesociclo del backend a mesociclo del frontend
  // Calcula las semanas relativas al inicio de la planificación
  const convertMesocycleToFrontend = (mesocycle: MesocycleResponseDto, planningStartDate: string): Mesocycle => {
    const startDate = new Date(mesocycle.startDate);
    const endDate = new Date(mesocycle.endDate);
    const planningStart = new Date(planningStartDate);

    // Calcular semanas relativas al inicio de la planificación
    // Diferencia en milisegundos dividida por milisegundos en una semana
    const startWeek = Math.floor((startDate.getTime() - planningStart.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
    const endWeek = Math.floor((endDate.getTime() - planningStart.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;

    // Calcular número de semanas del mesociclo
    const weeksCount = mesocycle.weeksCount || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;

    return {
      id: mesocycle.id.toString(),
      name: mesocycle.name,
      startWeek: Math.max(1, startWeek),
      endWeek: Math.max(1, endWeek),
      startDate: mesocycle.startDate, // Incluir fecha de inicio para el modal de edición
      endDate: mesocycle.endDate, // Incluir fecha de fin para el modal de edición
      weeksCount: weeksCount, // Incluir weeksCount para el modal de edición
      objective: mesocycle.objective || mesocycle.description || '',
      sessions: mesocycle.sessionsCount || 0,
      totalVolume: mesocycle.totalVolume || 0,
      status: mesocycle.status,
      microcycles: []
    };
  };

  // Cargar mesociclos del backend
  const loadPeriods = async () => {
    setIsLoadingPeriods(true);
    try {
      const loadedMesocycles = await MesocycleService.getMesocyclesByPlanningId(Number(planningId));
      setMesocycles(loadedMesocycles);

      // Extraer años únicos de las fechas de los mesociclos
      const years = new Set<number>();
      loadedMesocycles.forEach(mesocycle => {
        const startYear = new Date(mesocycle.startDate).getFullYear();
        const endYear = new Date(mesocycle.endDate).getFullYear();
        years.add(startYear);
        years.add(endYear);
      });

      // Agregar todos los años que estén dentro del rango de la planificación
      // Esto permite seleccionar años futuros para planificar por adelantado
      if (planningStartDate) {
        const planningStart = new Date(planningStartDate);
        const planningStartYear = planningStart.getFullYear();
        years.add(planningStartYear);
        
        // Si hay fecha de fin de planificación, incluir todos los años hasta ese año
        if (planningEndDate) {
          const planningEnd = new Date(planningEndDate);
          const planningEndYear = planningEnd.getFullYear();
          
          // Agregar todos los años desde el inicio hasta el fin de la planificación
          for (let y = planningStartYear; y <= planningEndYear; y++) {
            years.add(y);
          }
        } else {
          // Si no hay fecha de fin, incluir el año siguiente al inicio por defecto
          years.add(planningStartYear + 1);
        }
      }

      // Si no hay mesociclos ni planificación, usar el año actual y el año siguiente
      if (years.size === 0) {
        const currentYear = new Date().getFullYear();
        years.add(currentYear);
        years.add(currentYear + 1);
      }

      const sortedYears = Array.from(years).sort((a, b) => a - b);
      setAvailableYears(sortedYears);

      // Si el año seleccionado no está en la lista, usar el primero disponible
      // O mantener el año si está dentro del rango de la planificación
      if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
        // Verificar si el año seleccionado está dentro del rango de la planificación
        let isValidYear = false;
        if (planningStartDate) {
          const planningStart = new Date(planningStartDate);
          const planningStartYear = planningStart.getFullYear();
          
          if (planningEndDate) {
            const planningEnd = new Date(planningEndDate);
            const planningEndYear = planningEnd.getFullYear();
            isValidYear = selectedYear >= planningStartYear && selectedYear <= planningEndYear;
          } else {
            // Sin fecha de fin, permitir el año siguiente
            isValidYear = selectedYear >= planningStartYear && selectedYear <= planningStartYear + 1;
          }
        }
        
        // Si no es un año válido, cambiar al primero disponible
        if (!isValidYear) {
          setSelectedYear(sortedYears[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar mesociclos:', error);
      toast.error('Error al cargar los mesociclos de la planificación');
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  // Cargar mesociclos cuando cambia el planningId
  useEffect(() => {
    if (planningId) {
      loadPeriods();
    }
  }, [planningId]);

  // Obtener fecha de inicio de la planificación (necesario para calcular semanas)
  const getPlanningStartDate = (): string => {
    if (planningStartDate) {
      return planningStartDate;
    }
    // Si no se proporciona, usar el primer día del año seleccionado como referencia
    return `${selectedYear}-01-01T00:00:00Z`;
  };

  // Filtrar mesociclos por año basándonos en sus fechas de inicio
  // Un macrociclo es simplemente una vista organizada por año
  // Si un mesociclo cruza años, aparecerá en ambos años
  const getMesocyclesForYear = (): Mesocycle[] => {
    const planningStart = getPlanningStartDate();
    
    // Calcular el rango del año seleccionado
    const yearStart = new Date(selectedYear, 0, 1, 0, 0, 0, 0); // 1 de enero del año seleccionado
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999); // 31 de diciembre del año seleccionado
    
    // Filtrar mesociclos que se solapan con el año seleccionado
    // Un mesociclo se muestra en un año si:
    // 1. Comienza en ese año
    // 2. Termina en ese año
    // 3. Abarca ese año (comienza antes y termina después)
    const filteredMesocycles = mesocycles.filter(mesocycle => {
      const startDate = new Date(mesocycle.startDate);
      const endDate = new Date(mesocycle.endDate);
      
      // Verificar si hay solapamiento entre el mesociclo y el año seleccionado
      // Hay solapamiento si:
      // - El mesociclo comienza antes o durante el año Y termina después o durante el año
      return (startDate <= yearEnd && endDate >= yearStart);
    });

    // Convertir mesociclos del backend a mesociclos del frontend y calcular semanas relativas
    return filteredMesocycles.map(mesocycle => convertMesocycleToFrontend(mesocycle, planningStart))
      .sort((a, b) => {
        // Ordenar por fecha de inicio (no por semana, ya que las semanas pueden ser relativas)
        const mesocycleA = mesocycles.find(m => m.id.toString() === a.id);
        const mesocycleB = mesocycles.find(m => m.id.toString() === b.id);
        if (mesocycleA && mesocycleB) {
          return new Date(mesocycleA.startDate).getTime() - new Date(mesocycleB.startDate).getTime();
        }
        return 0;
      });
  };

  const mesocyclesForYear = getMesocyclesForYear();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'planning': return 'En Planificación';
      default: return 'Desconocido';
    }
  };

  const handleCreateMesocycle = async (mesocycleData: Omit<Mesocycle, 'id'>) => {
    // El mesociclo ya fue creado en CreateMesocycleModal
    // Solo recargamos la lista
    loadPeriods();
    setIsCreateMesocycleModalOpen(false);
    // Limpiar microciclos cargados porque puede haber nuevos mesociclos
    setLoadedMicrocycles(new Map());
  };

  const handleUpdateMesocycle = async (mesocycleData: Omit<Mesocycle, 'id'>) => {
    if (!editingMesocycle) return;

    try {
      // Convertir datos del frontend al formato del backend
      const startDateISO = new Date(mesocycleData.startDate + 'T00:00:00Z').toISOString();
      const endDateISO = new Date(mesocycleData.endDate + 'T23:59:59Z').toISOString();

      const updateDto: UpdateMesocycleDto = {
        name: mesocycleData.name.trim(),
        description: mesocycleData.objective.trim(),
        startDate: startDateISO,
        endDate: endDateISO,
        weeksCount: mesocycleData.weeksCount,
        objective: mesocycleData.objective.trim(),
        status: mesocycleData.status
      };

      await MesocycleService.updateMesocycle(Number(editingMesocycle.id), updateDto);

      // Recargar mesociclos después de actualizar
      loadPeriods();
      
      // Si el mesociclo estaba expandido, recargar sus microciclos
      const wasExpanded = expandedMesocycles.has(editingMesocycle.id);
      if (wasExpanded) {
        // Limpiar microciclos cargados para forzar la recarga
        setLoadedMicrocycles(prev => {
          const newMap = new Map(prev);
          newMap.delete(editingMesocycle.id);
          return newMap;
        });
        // Recargar microciclos automáticamente
        await loadMicrocyclesForMesocycle(editingMesocycle.id);
      } else {
        // Solo limpiar de la caché si no estaba expandido
        setLoadedMicrocycles(prev => {
          const newMap = new Map(prev);
          newMap.delete(editingMesocycle.id);
          return newMap;
        });
      }
      
      setIsCreateMesocycleModalOpen(false);
      setEditingMesocycle(null);
    } catch (error) {
      // El error ya fue manejado por el servicio
      console.error('Error al actualizar mesociclo:', error);
    }
  };

  const handleDeleteMesocycle = async (mesocycleId: string) => {
    try {
      await MesocycleService.deleteMesocycle(Number(mesocycleId));
      
      // Recargar mesociclos después de eliminar
      loadPeriods();
      setDeleteConfirmId(null);
      // Limpiar microciclos cargados del mesociclo eliminado
      setLoadedMicrocycles(prev => {
        const newMap = new Map(prev);
        newMap.delete(mesocycleId);
        return newMap;
      });
    } catch (error) {
      // El error ya fue manejado por el servicio
      console.error('Error al eliminar mesociclo:', error);
      setDeleteConfirmId(null);
    }
  };

  const handleEditMesocycle = (mesocycle: Mesocycle) => {
    setEditingMesocycle(mesocycle);
    setIsCreateMesocycleModalOpen(true);
  };

  const handleViewCalendar = (mesocycle: Mesocycle) => {
    // Si hay un callback para navegar al calendario de la pestaña, usarlo
    if (onViewMesocycleCalendar) {
      onViewMesocycleCalendar(mesocycle);
      toast.success(`Navegando al calendario del ${mesocycle.name}`);
    } else {
      // Fallback al comportamiento anterior (vista de calendario del mesociclo)
      setViewingMesocycleCalendar(mesocycle);
      setIsCreateMesocycleModalOpen(false);
      toast.success(`Navegando al calendario del ${mesocycle.name}`);
    }
  };

  const handleViewMicrocycleCalendar = (microcycle: Microcycle, mesocycle: Mesocycle) => {
    setViewingMicrocycleCalendar({ microcycle, mesocycle });
    toast.success(`Navegando al calendario de la Semana ${microcycle.weekNumber}`);
  };

  const handleEditMicrocycle = (microcycle: Microcycle, mesocycle: Mesocycle) => {
    setEditingMicrocycle({ microcycle, mesocycle });
  };

  const handleSaveMicrocycle = async (updatedMicrocycle: Microcycle) => {
    if (!editingMicrocycle) return;
    
    try {
      // Mapear intensidad del frontend (español) al backend (inglés)
      const mapIntensityToBackend = (intensity: 'baja' | 'media' | 'alta'): string => {
        switch (intensity) {
          case 'baja':
            return 'low';
          case 'media':
            return 'medium';
          case 'alta':
            return 'high';
          default:
            return 'medium';
        }
      };

      // Mapear focus del frontend (string) al backend (número enum)
      // El backend espera el enum MicrocycleFocus como número (0-8) o null
      const mapFocusToBackend = (focus: string): number | null => {
        if (!focus || !focus.trim()) return null;
        
        // Mapear strings del frontend a valores numéricos del enum MicrocycleFocus
        const focusMap: Record<string, number> = {
          'Resistencia Aeróbica': 0,      // AerobicEndurance
          'Velocidad': 1,                 // Speed
          'Fuerza': 2,                    // Strength
          'Recuperación': 3,              // Recovery
          'Trabajo Anaeróbico': 4,        // AnaerobicWork
          'Técnica de Carrera': 5,        // RunningTechnique
          'Competición': 6,               // Competition
          'Transición': 7,                // Transition
          'Descanso Activo': 8            // ActiveRest
        };
        
        const trimmedFocus = focus.trim();
        return focusMap[trimmedFocus] ?? null;
      };

      // Convertir datos del frontend al formato del backend
      // IMPORTANTE: focus debe ser null si está vacío, no undefined ni string vacío
      // El backend espera un enum MicrocycleFocus como número (0-8) o null
      const focusValue = updatedMicrocycle.focus?.trim();
      const updateDto = {
        name: updatedMicrocycle.name.trim(),
        description: updatedMicrocycle.description?.trim() || null,
        intensity: mapIntensityToBackend(updatedMicrocycle.intensity),
        // Mapear focus del frontend (string) al backend (número enum)
        focus: mapFocusToBackend(focusValue || '')
      };

      // Debug: verificar qué se está enviando
      console.log('Sending update DTO:', updateDto);

      // Actualizar en el backend
      await MicrocycleService.updateMicrocycle(Number(updatedMicrocycle.id), updateDto);

      // Recargar microciclos del mesociclo para obtener los datos actualizados desde el backend
      const mesocycleId = editingMicrocycle.mesocycle.id;
      
      // Limpiar el cache de microciclos para forzar la recarga
      setLoadedMicrocycles(prev => {
        const newMap = new Map(prev);
        newMap.delete(mesocycleId);
        return newMap;
      });
      
      // Recargar microciclos desde el backend si el mesociclo está expandido
      // Forzar la recarga para obtener los datos actualizados
      if (expandedMesocycles.has(mesocycleId)) {
        // Limpiar también el estado de carga para forzar la recarga
        setLoadingMicrocycles(prev => {
          const newSet = new Set(prev);
          newSet.delete(mesocycleId);
          return newSet;
        });
        await loadMicrocyclesForMesocycle(mesocycleId, true);
      }

      setEditingMicrocycle(null);
      toast.success('Microciclo actualizado correctamente');
    } catch (error) {
      // El error ya fue manejado por el servicio
      console.error('Error al actualizar microciclo:', error);
    }
  };


  // Función helper para parsear fechas ISO como fechas locales (sin conversión de timezone)
  const parseLocalDate = (dateString: string): Date => {
    // Si la fecha viene en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ)
    // la parseamos como fecha local para evitar problemas de timezone
    if (dateString.includes('T')) {
      const [datePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    } else {
      // Si viene solo como YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  };

  // Función helper para formatear fechas sin problemas de timezone
  const formatLocalDate = (dateString: string, options: Intl.DateTimeFormatOptions = {}): string => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('es-ES', options);
  };

  // Convertir microciclo del backend al formato del frontend
  const convertMicrocycleToFrontend = (microcycle: MicrocycleResponseDto): Microcycle => {
    // Mapear intensidad del backend (inglés) al frontend (español)
    const mapIntensity = (intensity: string): 'baja' | 'media' | 'alta' => {
      switch (intensity?.toLowerCase()) {
        case 'low':
        case 'baja':
          return 'baja';
        case 'medium':
        case 'media':
          return 'media';
        case 'high':
        case 'alta':
          return 'alta';
        default:
          return 'media';
      }
    };

    // Mapear focus del backend (número enum o string camelCase) al frontend (string)
    // El backend puede enviar el enum como número, string camelCase (ej: "aerobicEndurance"), o null
    const mapFocusFromBackend = (focus: number | string | null | undefined): string => {
      if (focus === null || focus === undefined) return '';
      
      // Si es un string (camelCase), mapearlo primero
      if (typeof focus === 'string') {
        const stringToNumberMap: Record<string, number> = {
          'aerobicendurance': 0,
          'aerobicEndurance': 0,
          'speed': 1,
          'strength': 2,
          'recovery': 3,
          'anaerobicwork': 4,
          'anaerobicWork': 4,
          'runningtechnique': 5,
          'runningTechnique': 5,
          'competition': 6,
          'transition': 7,
          'activerest': 8,
          'activeRest': 8
        };
        
        // Intentar mapear directamente primero (camelCase)
        let numberValue = stringToNumberMap[focus];
        
        // Si no se encuentra, intentar con lowercase
        if (numberValue === undefined) {
          numberValue = stringToNumberMap[focus.toLowerCase()];
        }
        
        if (numberValue !== undefined) {
          focus = numberValue;
        } else {
          return '';
        }
      }
      
      // Mapear valores numéricos del enum MicrocycleFocus a strings del frontend
      const focusMap: Record<number, string> = {
        0: 'Resistencia Aeróbica',      // AerobicEndurance
        1: 'Velocidad',                 // Speed
        2: 'Fuerza',                    // Strength
        3: 'Recuperación',              // Recovery
        4: 'Trabajo Anaeróbico',        // AnaerobicWork
        5: 'Técnica de Carrera',        // RunningTechnique
        6: 'Competición',               // Competition
        7: 'Transición',                // Transition
        8: 'Descanso Activo'            // ActiveRest
      };
      
      return focusMap[focus as number] || '';
    };

    return {
      id: microcycle.id.toString(),
      name: microcycle.name || `Semana ${microcycle.weekNumber}`, // Si viene vacío, usar nombre por defecto
      description: microcycle.description || undefined, // Convertir null a undefined
      weekNumber: microcycle.weekNumber,
      startDate: microcycle.startDate,
      endDate: microcycle.endDate,
      sessions: microcycle.sessions, // Calculado automáticamente desde TrainingSessions
      volume: microcycle.volume, // Calculado automáticamente desde TrainingSessions
      intensity: mapIntensity(microcycle.intensity), // Mapear intensidad del backend
      focus: mapFocusFromBackend(microcycle.focus as number | string | null) // Mapear focus del backend (enum numérico o string camelCase) al frontend (string)
    };
  };

  // Cargar microciclos del backend para un mesociclo
  const loadMicrocyclesForMesocycle = async (mesocycleId: string, forceReload: boolean = false) => {
    // Si ya están cargados y no se fuerza la recarga, no volver a cargar
    if (!forceReload && loadedMicrocycles.has(mesocycleId)) {
      return;
    }

    // Si ya se está cargando, no hacer otra petición
    if (loadingMicrocycles.has(mesocycleId)) {
      return;
    }

    setLoadingMicrocycles(prev => new Set(prev).add(mesocycleId));

    try {
      const microcyclesDto = await MicrocycleService.getMicrocyclesByMesocycleId(Number(mesocycleId));
      const convertedMicrocycles = microcyclesDto.map(convertMicrocycleToFrontend);
      
      setLoadedMicrocycles(prev => {
        const newMap = new Map(prev);
        newMap.set(mesocycleId, convertedMicrocycles);
        return newMap;
      });
    } catch (error) {
      console.error(`Error al cargar microciclos del mesociclo ${mesocycleId}:`, error);
      toast.error('Error al cargar los microciclos');
    } finally {
      setLoadingMicrocycles(prev => {
        const newSet = new Set(prev);
        newSet.delete(mesocycleId);
        return newSet;
      });
    }
  };

  const handleToggleMicrocycles = async (mesocycleId: string) => {
    setExpandedMesocycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mesocycleId)) {
        newSet.delete(mesocycleId);
      } else {
        newSet.add(mesocycleId);
        // Cargar microciclos del backend cuando se expande
        loadMicrocyclesForMesocycle(mesocycleId);
      }
      return newSet;
    });
  };

  const generateMockMicrocycles = (mesocycle: Mesocycle): Microcycle[] => {
    const weekCount = mesocycle.endWeek - mesocycle.startWeek + 1;
    const microcycles: Microcycle[] = [];
    
    for (let i = 0; i < weekCount; i++) {
      const weekNumber = mesocycle.startWeek + i;
      microcycles.push({
        id: `micro_${mesocycle.id}_${weekNumber}`,
        weekNumber,
        startDate: getWeekStartDate(weekNumber, year),
        endDate: getWeekEndDate(weekNumber, year),
        sessions: Math.floor(mesocycle.sessions / weekCount),
        volume: Math.floor(mesocycle.totalVolume / weekCount),
        intensity: i < weekCount - 1 ? 'media' : 'baja' as const,
        focus: i === 0 ? 'Adaptación' : i === weekCount - 1 ? 'Recuperación' : 'Desarrollo'
      });
    }
    
    return microcycles;
  };

  const getWeekStartDate = (weekNumber: number, year: number) => {
    const startOfYear = new Date(year, 0, 1);
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7);
    return startOfWeek.toISOString().split('T')[0];
  };

  const getWeekEndDate = (weekNumber: number, year: number) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfWeek = new Date(startOfYear);
    endOfWeek.setDate(endOfWeek.getDate() + (weekNumber - 1) * 7 + 6);
    return endOfWeek.toISOString().split('T')[0];
  };

  // Calcular estadísticas reales
  const calculateTotalSessions = () => {
    return mesocyclesForYear.reduce((total, meso) => total + meso.sessions, 0);
  };

  const calculateTotalVolume = () => {
    return mesocyclesForYear.reduce((total, meso) => total + meso.totalVolume, 0);
  };

  const getOccupiedWeeks = () => {
    return mesocyclesForYear.flatMap(meso => {
      const weeks: number[] = [];
      for (let week = meso.startWeek; week <= meso.endWeek; week++) {
        weeks.push(week);
      }
      return weeks;
    });
  };

  const calculateTotalWeeks = () => {
    const occupiedWeeks = getOccupiedWeeks();
    const uniqueWeeks = new Set(occupiedWeeks);
    return uniqueWeeks.size;
  };

  const getTotalMesocycles = () => {
    return mesocyclesForYear.length;
  };



  // Si hay un microciclo seleccionado para ver su calendario, mostrar la vista de calendario
  if (viewingMicrocycleCalendar) {
    return (
      <div className="space-y-6">
        {/* Header del calendario del microciclo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setViewingMicrocycleCalendar(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Macrociclo
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Semana {viewingMicrocycleCalendar.microcycle.weekNumber} - {viewingMicrocycleCalendar.mesocycle.name}
              </h2>
              <p className="text-muted-foreground">
                {viewingMicrocycleCalendar.microcycle.focus}
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>
                  {formatLocalDate(viewingMicrocycleCalendar.microcycle.startDate, { 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })} - {formatLocalDate(viewingMicrocycleCalendar.microcycle.endDate, { 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <Badge 
                  variant="outline" 
                  className={
                    viewingMicrocycleCalendar.microcycle.intensity === 'alta' ? 'border-red-200 text-red-700 bg-red-50' :
                    viewingMicrocycleCalendar.microcycle.intensity === 'media' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                    'border-green-200 text-green-700 bg-green-50'
                  }
                >
                  Intensidad {viewingMicrocycleCalendar.microcycle.intensity}
                </Badge>
              </div>
            </div>
          </div>
        </div>



        {/* Calendario del microciclo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendario Semanal - Semana {viewingMicrocycleCalendar.microcycle.weekNumber}
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las sesiones programadas para esta semana de entrenamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PlanningCalendar
              planningId={planningId}
              userType="coach"
              athletes={athletes}
              microcycleFilter={{
                id: viewingMicrocycleCalendar.microcycle.id,
                weekNumber: viewingMicrocycleCalendar.microcycle.weekNumber,
                startDate: viewingMicrocycleCalendar.microcycle.startDate,
                endDate: viewingMicrocycleCalendar.microcycle.endDate,
                mesocycleName: viewingMicrocycleCalendar.mesocycle.name
              }}
              onSessionCreate={(session) => {
                console.log('Nueva sesión creada para microciclo:', session);
                toast.success(`Sesión creada en Semana ${viewingMicrocycleCalendar.microcycle.weekNumber}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay un mesociclo seleccionado para ver su calendario, mostrar la vista de calendario
  if (viewingMesocycleCalendar) {
    return (
      <div className="space-y-6">
        {/* Header del calendario del mesociclo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setViewingMesocycleCalendar(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Macrociclo
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                {viewingMesocycleCalendar.name}
              </h2>
              <p className="text-muted-foreground">
                {viewingMesocycleCalendar.objective}
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Semanas {viewingMesocycleCalendar.startWeek}-{viewingMesocycleCalendar.endWeek}</span>
                <Badge className={getStatusColor(viewingMesocycleCalendar.status)}>
                  {getStatusText(viewingMesocycleCalendar.status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario del mesociclo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendario del Mesociclo
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las sesiones programadas para este período de entrenamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PlanningCalendar
              planningId={planningId}
              userType="coach"
              athletes={athletes}
              mesocycleFilter={{
                id: viewingMesocycleCalendar.id,
                name: viewingMesocycleCalendar.name,
                startWeek: viewingMesocycleCalendar.startWeek,
                endWeek: viewingMesocycleCalendar.endWeek
              }}
              onSessionCreate={(session) => {
                console.log('Nueva sesión creada para mesociclo:', session);
                toast.success(`Sesión creada en ${viewingMesocycleCalendar.name}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Macrociclo {selectedYear}
            </h2>
            <p className="text-muted-foreground">
              Planificación anual estructurada en mesociclos flexibles
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isLoadingPeriods ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Cargando...</span>
              </div>
            ) : (
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Estadísticas del Macrociclo */}
        {isLoadingPeriods ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Cargando estadísticas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Semanas Totales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{calculateTotalWeeks()}</div>
                <p className="text-xs text-muted-foreground">
                  {getOccupiedWeeks().length} semanas ocupadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mesociclos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{getTotalMesocycles()}</div>
                <p className="text-xs text-muted-foreground">
                  Programados en {selectedYear}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sesiones Totales</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold text-primary">{calculateTotalSessions()}</div>
              <p className="text-xs text-muted-foreground">
                En todos los mesociclos
              </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volumen Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{calculateTotalVolume()}km</div>
                <p className="text-xs text-muted-foreground">
                  Kilómetros programados
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mesociclos del Macrociclo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Mesociclos</h3>
            <Button
              onClick={() => setIsCreateMesocycleModalOpen(true)}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Mesociclo
            </Button>
          </div>

          {isLoadingPeriods ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                  <h3 className="font-medium mb-1">Cargando mesociclos...</h3>
                </div>
              </CardContent>
            </Card>
          ) : mesocyclesForYear.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium mb-1">No hay mesociclos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Agrega tu primer mesociclo para comenzar la planificación
                  </p>
                  <Button 
                    onClick={() => setIsCreateMesocycleModalOpen(true)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Mesociclo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            mesocyclesForYear.map((mesocycle) => {
              const isExpanded = expandedMesocycles.has(mesocycle.id);
              const isLoadingMicros = loadingMicrocycles.has(mesocycle.id);
              const loadedMicros = loadedMicrocycles.get(mesocycle.id);
              
              // Usar microciclos cargados del backend si están disponibles, 
              // o generar mock solo si no están cargados y no se está cargando
              const microcyclesToUse = loadedMicros || 
                (isExpanded && isLoadingMicros ? [] : 
                (mesocycle.microcycles.length > 0 ? mesocycle.microcycles : generateMockMicrocycles(mesocycle)));
              
              const mesocycleWithMicrocycles = { ...mesocycle, microcycles: microcyclesToUse };
              
              return (
                <Card key={mesocycle.id} className="border-l-4 border-l-accent">
                  <Collapsible open={isExpanded}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-accent/5 transition-colors"
                      onClick={() => handleToggleMicrocycles(mesocycle.id)}
                    >
                        <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{mesocycle.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {mesocycle.objective}
                          </CardDescription>
                          {/* Fechas del mesociclo */}
                          {mesocycle.startDate && mesocycle.endDate && (
                            <CardDescription className="text-xs mt-1">
                              {formatLocalDate(mesocycle.startDate, { 
                                day: '2-digit', 
                                month: 'short' 
                              })} - {formatLocalDate(mesocycle.endDate, { 
                                day: '2-digit', 
                                month: 'short' 
                              })}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Semanas {mesocycle.startWeek}-{mesocycle.endWeek}
                          </Badge>
                          <Badge className={getStatusColor(mesocycle.status)}>
                            {getStatusText(mesocycle.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {mesocycle.sessions} sesiones
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {mesocycle.totalVolume}km
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title={isExpanded ? 'Ocultar microciclos' : 'Ver microciclos'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMicrocycles(mesocycle.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title="Ver calendario del mesociclo"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCalendar(mesocycle);
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title="Editar mesociclo"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMesocycle(mesocycle);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/20 text-destructive"
                              title="Eliminar mesociclo"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(mesocycle.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="border-t border-border pt-4">
                          {isLoadingMicros ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground">Cargando microciclos...</span>
                            </div>
                          ) : mesocycleWithMicrocycles.microcycles.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              No hay microciclos para este mesociclo
                            </div>
                          ) : (
                          <div className="space-y-2">
                            {mesocycleWithMicrocycles.microcycles.map((microcycle, index) => (
                              <div 
                                key={microcycle.id} 
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                                  index !== mesocycleWithMicrocycles.microcycles.length - 1 ? 'border-b border-border' : ''
                                }`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="min-w-0 flex-1">
                                    {/* ✅ NUEVO - Nombre del microciclo (más grande y con más peso) */}
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-base">
                                        {microcycle.name || `Semana ${microcycle.weekNumber}`}
                                      </span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          microcycle.intensity === 'alta' ? 'border-red-200 text-red-700 bg-red-50' :
                                          microcycle.intensity === 'media' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                          'border-green-200 text-green-700 bg-green-50'
                                        }`}
                                      >
                                        {microcycle.intensity}
                                      </Badge>
                                    </div>
                                    {/* ✅ NUEVO - Descripción (gris más tenue, alineada a la izquierda) */}
                                    {microcycle.description && (
                                      <p className="text-sm text-muted-foreground/70 mt-1 text-left">
                                        {microcycle.description}
                                      </p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {formatLocalDate(microcycle.startDate, { 
                                        day: '2-digit', 
                                        month: 'short' 
                                      })} - {formatLocalDate(microcycle.endDate, { 
                                        day: '2-digit', 
                                        month: 'short' 
                                      })}
                                    </p>
                                  </div>
                                  
                                  <div className="text-sm text-muted-foreground flex-1 min-w-0">
                                    <span className="truncate block">{microcycle.focus}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="text-foreground font-medium">{microcycle.sessions}</div>
                                      <div className="text-xs text-muted-foreground">sesiones</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-foreground font-medium">{microcycle.volume} km</div>
                                      <div className="text-xs text-muted-foreground">volumen</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-accent/20"
                                    title="Ver calendario de la semana"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Si hay callback para navegar al calendario de la pestaña, usarlo
                                      if (onViewMicrocycleCalendar) {
                                        onViewMicrocycleCalendar(microcycle);
                                      } else {
                                        // Fallback al comportamiento anterior
                                        onViewWeeklyCalendar?.(microcycle, mesocycle);
                                      }
                                    }}
                                  >
                                    <Calendar className="h-3 w-3" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-accent/20"
                                    title="Editar microciclo"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditMicrocycle(microcycle, mesocycle);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>

                                  {/* ❌ REMOVIDO - Los microciclos NO se pueden eliminar desde el menú */}
                                  {/* Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo */}
                                </div>
                              </div>
                            ))}
                          </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal para crear/editar mesociclo */}
        <CreateMesocycleModal
          isOpen={isCreateMesocycleModalOpen}
          onClose={() => {
            setIsCreateMesocycleModalOpen(false);
            setEditingMesocycle(null);
          }}
          onSubmit={editingMesocycle ? handleUpdateMesocycle : handleCreateMesocycle}
          editingMesocycle={editingMesocycle}
          existingMesocycles={mesocycles.map(m => convertMesocycleToFrontend(m, getPlanningStartDate()))}
          year={selectedYear}
          planningId={planningId}
          planningStartDate={planningStartDate || new Date(selectedYear, 0, 1).toISOString()}
          planningEndDate={planningEndDate}
        />

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar mesociclo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el mesociclo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirmId && handleDeleteMesocycle(deleteConfirmId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de edición de microciclo */}
        {editingMicrocycle && (
          <EditMicrocycleModal
            isOpen={!!editingMicrocycle}
            onClose={() => setEditingMicrocycle(null)}
            microcycle={editingMicrocycle.microcycle}
            mesocycleName={editingMicrocycle.mesocycle.name}
            onSave={handleSaveMicrocycle}
          />
        )}

        {/* ❌ REMOVIDO - Diálogo de confirmación de eliminación de microciclo */}
        {/* Los microciclos NO se pueden eliminar desde el menú */}
        {/* Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo */}
      </div>
    </TooltipProvider>
  );
}