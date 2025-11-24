import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Save, Users, Clock, Target, FileText, Check, Search, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { AthleteIntervalBuilder } from './AthleteIntervalBuilder';
import { SeriesBuilder } from './SeriesBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { TrainingTemplateService, TrainingTemplateResponseDto, TrainingSeriesResponseDto } from '../services/trainingTemplateService';
import { TrainingSessionService, CreateTrainingSessionDto, CreateTrainingSeriesDto, UpdateTrainingSessionDto, TrainingSessionResponseDto } from '../services/trainingSessionService';
import { MesocycleService, MesocycleResponseDto } from '../services/mesocycleService';
import { MicrocycleService, MicrocycleResponseDto } from '../services/microcycleService';
import { mapTrainingTypeFromBackend } from '../utils/trainingTypeMapper';
import { mapDifficultyFromBackend } from '../utils/difficultyMapper';
import { mapTrainingCategoryFromBackend, mapTrainingCategoryToBackend } from '../utils/trainingCategoryMapper';
import { mapIntervalIntensityToBackend, mapIntervalIntensityFromBackend } from '../utils/intervalIntensityMapper';
import { CoachInjuryService, type CoachRecentInjury } from '../services/coachInjuryService';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface Group {
  id: string;
  name: string;
  athleteIds: string[];
}

interface TrainingInterval {
  id: string;
  type: 'interval' | 'continuous' | 'recovery';
  repetitions: number;
  distance: number;
  targetTime?: string;
  recoveryTime: string;
  paceType: 'fixed' | 'vo2max_percentage';
  pace?: number;
  vo2maxPercentage?: number;
  description?: string;
  intensity?: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
  trainingMode?: 'distance' | 'time';
  duration?: string;
  targetSpeed?: string;
  orderIndex?: number;
}

interface IntervalInSeries {
  id: string;
  trainingMode: 'distance' | 'time';
  repetitions: number;
  distance?: number;
  duration?: string;
  targetTime?: string;
  paceType: 'fixed' | 'vo2max_percentage'; // Tipo de velocidad
  targetSpeed?: string; // ritmo en min/km - solo para fixed
  vo2maxPercentage?: number; // Porcentaje de VO2Max - solo para vo2max_percentage
  description?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
  recoveryTime?: string;
}

interface SeriesSet {
  id: string;
  name: string;
  repetitions: number;
  intervals: IntervalInSeries[];
  recoveryBetweenSets: string;
  notes?: string;
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athletes: string[];
  series: SeriesSet[];
  intervals?: TrainingInterval[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  structureType?: 'simple' | 'advanced';
}

interface TrainingTemplate {
  id: string;
  name: string;
  description: string;
  type: 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series';
  category: 'training' | 'prep_competition' | 'main_competition';
  duration: number;
  distance?: number;
  targetPace?: string;
  targetHR?: string;
  series: SeriesSet[];
  intervals?: TrainingInterval[];
  notes: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
  tags: string[];
  structureType: 'simple' | 'advanced';
}

interface CreateTrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  athletes: Athlete[];
  selectedDate: string;
  existingSessions?: TrainingSession[];
  onSessionCreated?: () => void; // Callback opcional cuando se crea exitosamente en el backend
  planningId?: number; // ID de la planificación para validar fechas
  editingSession?: TrainingSession | null; // Sesión a editar (si existe)
  onSessionUpdated?: () => void; // Callback opcional cuando se actualiza exitosamente en el backend
}

export function CreateTrainingSessionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  athletes, 
  selectedDate,
  existingSessions = [],
  onSessionCreated,
  planningId,
  editingSession = null,
  onSessionUpdated
}: CreateTrainingSessionModalProps) {
  // Inicializar fecha en formato YYYY-MM-DD para el input
  const getInitialDate = (): string => {
    if (!selectedDate) return '';
    // Si ya está en formato YYYY-MM-DD, usarlo directamente
    if (!selectedDate.includes('T')) return selectedDate;
    // Si tiene 'T', extraer solo la parte de la fecha
    return selectedDate.split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'training' as 'training' | 'prep_competition' | 'main_competition',
    notes: '',
    date: getInitialDate() // Agregar fecha al estado del formulario en formato YYYY-MM-DD
  });
  
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [intervals, setIntervals] = useState<TrainingInterval[]>([]);
  const [series, setSeries] = useState<SeriesSet[]>([]);
  const [seriesBuilderMode, setSeriesBuilderMode] = useState<'simple' | 'advanced'>('simple');
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeInjuries, setActiveInjuries] = useState<Map<string, CoachRecentInjury>>(new Map());
  const [isLoadingInjuries, setIsLoadingInjuries] = useState(false);
  const [pendingInjurySelection, setPendingInjurySelection] = useState<{ athleteId: string; injury: CoachRecentInjury } | null>(null);

  const handleCancelInjurySelection = () => {
    setPendingInjurySelection(null);
  };

  const handleConfirmInjurySelection = () => {
    if (!pendingInjurySelection) {
      return;
    }

    const { athleteId } = pendingInjurySelection;
    setSelectedAthletes(prev => (prev.includes(athleteId) ? prev : [...prev, athleteId]));
    setPendingInjurySelection(null);
  };
  
  // Estado para plantillas desde el backend
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  
  // Estados para validación de fechas
  const [mesocycles, setMesocycles] = useState<MesocycleResponseDto[]>([]);
  const [microcycles, setMicrocycles] = useState<MicrocycleResponseDto[]>([]);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<string>('');
  const [isHydratingSession, setIsHydratingSession] = useState(false);
  const [showNoAthletesConfirmDialog, setShowNoAthletesConfirmDialog] = useState(false);
  
  // Estado para controlar la carga inicial del modal (evita el "pantalleo")
  const isInitializing = isLoadingCycles || isLoadingInjuries || isHydratingSession;
  
  // Obtener fecha mínima (hoy)
  const getMinDate = (): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  
  // Cargar mesociclos y microciclos para validar fechas
  useEffect(() => {
    if (isOpen && planningId) {
      loadCycles();
    }
    if (isOpen) {
      loadActiveInjuries();
    }
  }, [isOpen, planningId]);
  
  // Actualizar fecha del formulario cuando cambia selectedDate
  useEffect(() => {
    if (isOpen && selectedDate) {
      // Asegurar que la fecha esté en formato YYYY-MM-DD para el input
      const dateStr = selectedDate.includes('T') 
        ? selectedDate.split('T')[0] 
        : selectedDate;
      setFormData(prev => ({ ...prev, date: dateStr }));
      // No validar inmediatamente si los ciclos aún se están cargando
      // La validación se hará cuando los ciclos terminen de cargar
      if (!isLoadingCycles && microcycles.length > 0) {
        validateDate(dateStr);
      }
    }
  }, [isOpen, selectedDate]);

  // Validar fecha después de que los ciclos se hayan cargado
  useEffect(() => {
    if (isOpen && formData.date && !isLoadingCycles && planningId) {
      // Solo validar si hay microciclos cargados o si no hay planningId
      if (microcycles.length > 0 || !planningId) {
        validateDate(formData.date);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoadingCycles, microcycles.length]);

  // Cargar datos de la sesión cuando se está editando
  useEffect(() => {
    if (isOpen && editingSession) {
      let isCancelled = false;

      const hydrateSession = async () => {
        setIsHydratingSession(true);
        try {
          const detailedSession = await TrainingSessionService.getTrainingSessionById(Number(editingSession.id));
          if (isCancelled) return;

          if (detailedSession) {
            populateSessionFromData(detailedSession);
          } else {
            populateSessionFromData(editingSession);
          }
        } catch (error) {
          console.error('Error al obtener la sesión para editar', error);
          if (!isCancelled) {
            populateSessionFromData(editingSession);
          }
        } finally {
          if (!isCancelled) {
            setIsHydratingSession(false);
          }
        }
      };

      hydrateSession();

      return () => {
        isCancelled = true;
      };
    } else if (isOpen && !editingSession) {
      handleReset();
    }
  }, [isOpen, editingSession]);
  
  const loadCycles = async () => {
    if (!planningId) return;
    
    setIsLoadingCycles(true);
    try {
      // OPTIMIZADO: Cargar mesociclos y microciclos en paralelo
      // Usar getMicrocyclesByPlanningId para obtener todos los microciclos en un solo llamado
      const [mesocyclesData, allMicrocycles] = await Promise.all([
        MesocycleService.getMesocyclesByPlanningId(planningId),
        MicrocycleService.getMicrocyclesByPlanningId(planningId)
      ]);
      
      setMesocycles(mesocyclesData);
      setMicrocycles(allMicrocycles);
    } catch (error) {
      console.error('Error al cargar ciclos:', error);
      toast.error('Error al cargar información de ciclos');
    } finally {
      setIsLoadingCycles(false);
    }
  };

  const loadActiveInjuries = async () => {
    setIsLoadingInjuries(true);
    try {
      const injuries = await CoachInjuryService.getRecentInjuries();
      const map = new Map<string, CoachRecentInjury>();
      injuries.forEach(injury => {
        map.set(injury.athleteId.toString(), injury);
      });
      setActiveInjuries(map);
    } catch (error) {
      console.error('Error al cargar lesiones activas', error);
      toast.error('No se pudieron obtener las lesiones activas de tus atletas');
      setActiveInjuries(new Map());
    } finally {
      setIsLoadingInjuries(false);
    }
  };
  
  // Validar que la fecha esté dentro de un microciclo existente
  const validateDate = (dateString: string): boolean => {
    setDateValidationError('');
    
    if (!dateString) {
      setDateValidationError('La fecha es requerida');
      return false;
    }
    
    // Validar que la fecha no sea en el pasado
    const dateStr = dateString.split('T')[0]; // Asegurar formato YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // Crear fecha local
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setDateValidationError('No se puede crear una sesión para una fecha en el pasado');
      return false;
    }
    
    // Si no hay planningId, no validar contra microciclos (compatibilidad con otros usos)
    if (!planningId) {
      return true;
    }
    
    // Si aún no se han cargado los microciclos, no validar (pero no mostrar error)
    if (microcycles.length === 0) {
      // Si está cargando, no validar aún (permitir continuar sin error)
      if (isLoadingCycles) {
        return true;
      }
      // Si ya terminó de cargar y no hay microciclos, mostrar error solo si hay planningId
      if (planningId) {
        setDateValidationError('No hay microciclos disponibles para esta planificación. Configurá al menos uno para poder crear sesiones.');
        return false;
      }
      // Si no hay planningId, no validar contra microciclos
      return true;
    }
    
    // Validar que la fecha esté dentro de un microciclo existente
    const isInMicrocycle = microcycles.some(microcycle => {
      const startDate = microcycle.startDate.includes('T') 
        ? microcycle.startDate.split('T')[0] 
        : microcycle.startDate;
      const endDate = microcycle.endDate.includes('T') 
        ? microcycle.endDate.split('T')[0] 
        : microcycle.endDate;
      
      return dateStr >= startDate && dateStr <= endDate;
    });
    
    if (!isInMicrocycle) {
      setDateValidationError('No hay un microciclo configurado que cubra esta fecha. Seleccioná otra fecha o actualizá la planificación.');
      return false;
    }
    
    return true;
  };
  
  // Manejar cambio de fecha
  const handleDateChange = (newDate: string) => {
    setFormData(prev => ({ ...prev, date: newDate }));
    validateDate(newDate);
  };

  // Función para convertir plantillas del backend al formato del frontend
  const convertBackendTemplateToFrontend = (backendTemplate: TrainingTemplateResponseDto): TrainingTemplate => {
    const mappedSeries = mapBackendSeriesToSeriesSets(backendTemplate.series);

    return {
      id: backendTemplate.id.toString(),
      name: backendTemplate.name,
      description: backendTemplate.description,
      type: mapTrainingTypeFromBackend(backendTemplate.type) as any,
      category: mapTrainingCategoryFromBackend(backendTemplate.category) as 'training' | 'prep_competition' | 'main_competition',
      duration: backendTemplate.duration,
      distance: backendTemplate.distance,
      targetPace: backendTemplate.targetPace,
      targetHR: backendTemplate.targetHR,
      series: mappedSeries,
      intervals: flattenSeriesToIntervals(mappedSeries),
      notes: backendTemplate.notes,
      difficulty: mapDifficultyFromBackend(backendTemplate.difficulty),
      isFavorite: backendTemplate.isFavorite,
      createdAt: backendTemplate.createdAt,
      lastUsed: backendTemplate.lastUsed,
      useCount: backendTemplate.useCount,
      tags: backendTemplate.tags || [],
      structureType: backendTemplate.structureType ?? 'simple'
    };
  };

  // Cargar plantillas desde el backend
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const backendTemplates = await TrainingTemplateService.getAllTrainingTemplates();
      const frontendTemplates = backendTemplates.map(convertBackendTemplateToFrontend);
      setTemplates(frontendTemplates);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      setTemplates([]);
      toast.error('Error al cargar plantillas disponibles');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Cargar plantillas cuando se abre el selector o el modal
  useEffect(() => {
    if (isOpen && showTemplateSelector) {
      if (templates.length === 0) {
        loadTemplates();
      }
    }
  }, [isOpen, showTemplateSelector]);

  // Resetear búsqueda cuando se cierra el selector
  useEffect(() => {
    if (!showTemplateSelector) {
      setTemplateSearchTerm('');
      setSelectedTemplateId('');
    }
  }, [showTemplateSelector]);

  // Filtrar plantillas según búsqueda
  const filteredTemplates = templates.filter(template => {
    if (!templateSearchTerm.trim()) return true;
    const search = templateSearchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(search) ||
      template.description.toLowerCase().includes(search) ||
      template.type.toLowerCase().includes(search) ||
      template.notes.toLowerCase().includes(search)
    );
  });

  const categoryLabels = {
    'training': 'Entrenamiento',
    'prep_competition': 'Competencia Preparatoria',
    'main_competition': 'Competencia Principal'
  };

  // Obtener grupos únicos de los atletas
  const getGroups = (): Group[] => {
    if (!athletes || !Array.isArray(athletes)) {
      return [];
    }
    
    const groupMap = new Map<string, Group>();
    
    athletes.forEach(athlete => {
      if (!groupMap.has(athlete.groupId)) {
        groupMap.set(athlete.groupId, {
          id: athlete.groupId,
          name: athlete.groupName,
          athleteIds: []
        });
      }
      groupMap.get(athlete.groupId)!.athleteIds.push(athlete.id);
    });
    
    return Array.from(groupMap.values());
  };

  const groups = getGroups();

  // Filtrar atletas y grupos basado en el término de búsqueda
  const filteredAthletes = (athletes || []).filter(athlete => 
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.athleteIds.some(athleteId => {
      const athlete = athletes?.find(a => a.id === athleteId);
      return athlete && athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitSession = async () => {
    setIsSubmitting(true);

    try {
      const seriesPayload = buildSeriesPayload();
      const sessionDateIso = formData.date.includes('T')
        ? formData.date
        : `${formData.date}T00:00:00.000Z`;

      if (editingSession) {
        // Para actualizar, usar UpdateTrainingSessionDto (sin planningId)
        const updatePayload: UpdateTrainingSessionDto = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          date: sessionDateIso,
          category: mapTrainingCategoryToBackend(formData.category),
          notes: formData.notes?.trim() || undefined,
          athleteIds: selectedAthletes.map(id => Number(id)),
          series: seriesPayload
        };
        
        console.log('Actualizando sesión:', {
          sessionId: editingSession.id,
          payload: updatePayload,
          athleteIds: updatePayload.athleteIds
        });
        
        await TrainingSessionService.updateTrainingSession(Number(editingSession.id), updatePayload);
        toast.success('Sesión actualizada');
        if (onSessionUpdated) onSessionUpdated();
      } else {
        // Para crear, usar CreateTrainingSessionDto (con planningId)
        const createPayload: CreateTrainingSessionDto = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          date: sessionDateIso,
          category: mapTrainingCategoryToBackend(formData.category),
          notes: formData.notes?.trim() || undefined,
          planningId: planningId ? Number(planningId) : 0,
          athleteIds: selectedAthletes.map(id => Number(id)),
          series: seriesPayload
        };

        if (!createPayload.planningId) {
          toast.error('No se puede crear la sesión sin una planificación asociada');
          return;
        }

        await TrainingSessionService.createTrainingSession(createPayload);
        toast.success('Sesión creada');
        if (onSessionCreated) onSessionCreated();
      }

      setShowNoAthletesConfirmDialog(false);
      handleReset();
      onClose();
    } catch (error) {
      console.error('Error al guardar la sesión', error);
      toast.error('Ocurrió un error al guardar la sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la sesión es requerido');
      return;
    }

    const seriesPayload = buildSeriesPayload();
    if (seriesPayload.length === 0) {
      toast.error('Debes agregar al menos una serie con intervalos');
      return;
    }

    if (!validateDate(formData.date)) {
      toast.error('Por favor corrige la fecha antes de crear la sesión');
      return;
    }

    // Si no hay atletas seleccionados, mostrar modal de confirmación
    if (selectedAthletes.length === 0) {
      setShowNoAthletesConfirmDialog(true);
      return;
    }

    // Si hay atletas, proceder directamente
    await submitSession();
  };

  const mapPaceTypeToBackend = (paceType?: string) => {
    if (paceType === 'vo2max_percentage') return 'Vo2MaxPercentage';
    return 'Fixed';
  };

  const mapTrainingModeToBackend = (mode?: string) => {
    if (!mode) return undefined;
    return mode === 'time' ? 'Time' : 'Distance';
  };

  const mapIntervalTypeToBackend = (type?: string) => {
    if (!type) return 'Interval';
    switch (type) {
      case 'continuous': return 'Continuous';
      case 'recovery': return 'Recovery';
      default: return 'Interval';
    }
  };

  const buildSeriesPayload = (): CreateTrainingSeriesDto[] => {
    if (series.length > 0) {
      return series.map((seriesSet, seriesIdx) => ({
        name: seriesSet.name.trim() || `Serie ${seriesIdx + 1}`,
        repetitions: seriesSet.repetitions,
        recoveryBetweenSets: seriesSet.recoveryBetweenSets || '00:00',
        orderIndex: seriesIdx,
        notes: seriesSet.notes?.trim(),
        intervals: seriesSet.intervals.map((interval, intervalIdx) => ({
          type: 'Interval',
          repetitions: interval.repetitions,
          distance: interval.trainingMode === 'distance' ? interval.distance || 0 : 0,
          targetTime: interval.trainingMode === 'time' ? interval.duration : undefined,
          recoveryTime: interval.recoveryTime || '00:00',
          paceType: interval.paceType === 'fixed' ? 'Fixed' : 'Vo2MaxPercentage',
          pace: interval.paceType === 'fixed' && interval.targetSpeed ? parseSpeed(interval.targetSpeed) : (interval.pace || undefined),
          vo2MaxPercentage: interval.paceType === 'vo2max_percentage' ? interval.vo2maxPercentage : undefined,
          description: interval.description,
          intensity: mapIntervalIntensityToBackend(interval.intensity),
          trainingMode: mapTrainingModeToBackend(interval.trainingMode),
          duration: interval.trainingMode === 'time' ? interval.duration : undefined,
          targetSpeed: interval.paceType === 'fixed' ? interval.targetSpeed : undefined,
          orderIndex: intervalIdx
        }))
      }));
    }

    if (intervals.length > 0) {
      return [
        {
          name: 'Intervalos Simples',
          repetitions: 1,
          recoveryBetweenSets: '00:00',
          orderIndex: 0,
          intervals: intervals.map((interval, idx) => ({
            type: mapIntervalTypeToBackend(interval.type),
            repetitions: interval.repetitions,
            distance: interval.trainingMode === 'time' ? 0 : interval.distance || 0,
            targetTime: interval.trainingMode === 'time' ? interval.duration || interval.targetTime : interval.targetTime,
            recoveryTime: interval.recoveryTime || '00:00',
            paceType: mapPaceTypeToBackend(interval.paceType),
            pace: interval.pace ?? (interval.targetSpeed ? parseSpeed(interval.targetSpeed) : undefined),
            vo2MaxPercentage: interval.vo2maxPercentage,
            description: interval.description,
            intensity: mapIntervalIntensityToBackend(interval.intensity),
            trainingMode: mapTrainingModeToBackend(interval.trainingMode),
            duration: interval.trainingMode === 'time' ? interval.duration || interval.targetTime : interval.duration,
            targetSpeed: interval.paceType === 'fixed' ? interval.targetSpeed : undefined,
            orderIndex: idx
          }))
        }
      ];
    }

    return [];
  };

  const handleReset = () => {
    // Resetear fecha al formato YYYY-MM-DD
    const resetDate = selectedDate.includes('T') 
      ? selectedDate.split('T')[0] 
      : selectedDate;
    
    setFormData({
      name: '',
      description: '',
      category: 'training',
      notes: '',
      date: resetDate
    });
    setSelectedAthletes([]);
    setIntervals([]);
    setSeries([]);
    setSeriesBuilderMode('simple');
    setCurrentStep(1);
    setSearchTerm('');
    setDateValidationError('');
    setIsHydratingSession(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAthleteToggle = (athleteId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    setSelectedAthletes(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      }

      const injury = getAthleteInjury(athleteId);
      const sessionDate = getSessionDateValue(formData.date);

      if (!canAssignInjury(injury, sessionDate)) {
        if (!silent) {
          toast.error(`No puedes asignar a ${injury?.athleteName ?? 'el atleta'} porque su lesión tiene impacto completo.`);
        }
        return prev;
      }

      if (injury && !silent) {
        setPendingInjurySelection({ athleteId, injury });
        return prev;
      }

      return [...prev, athleteId];
    });
  };

  const handleGroupToggle = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const sessionDate = getSessionDateValue(formData.date);
    const assignableAthletes = group.athleteIds.filter(id => canAssignInjury(getAthleteInjury(id), sessionDate));
    const allGroupAthletesSelected = assignableAthletes.every(id => selectedAthletes.includes(id));
    
    if (allGroupAthletesSelected) {
      setSelectedAthletes(prev => prev.filter(id => !group.athleteIds.includes(id)));
    } else {
      assignableAthletes.forEach(id => {
        if (!selectedAthletes.includes(id)) {
          handleAthleteToggle(id, { silent: true });
        }
      });
    }
  };

  const handleSelectAllAthletes = () => {
    if (!athletes || !Array.isArray(athletes) || visibleAthleteIds.length === 0) {
      return;
    }
    const sessionDate = getSessionDateValue(formData.date);
    const visibleAthletes = visibleAthleteIds
      .map(id => athletes.find(athlete => athlete.id === id))
      .filter((athlete): athlete is Athlete => Boolean(athlete));

    const selectableAthletes = visibleAthletes.filter(athlete => canAssignInjury(getAthleteInjury(athlete.id), sessionDate));
    const allVisibleSelected = visibleAthleteIds.every(id => selectedAthletes.includes(id));

    if (allVisibleSelected) {
      setSelectedAthletes(prev => prev.filter(id => !visibleAthleteIds.includes(id)));
    } else {
      selectableAthletes.forEach(athlete => {
        if (!selectedAthletes.includes(athlete.id)) {
          handleAthleteToggle(athlete.id, { silent: true });
        }
      });

      const blockedAthletes = visibleAthletes.filter(athlete => !canAssignInjury(getAthleteInjury(athlete.id), sessionDate));
      if (blockedAthletes.length > 0) {
        toast.info(`Se omitieron ${blockedAthletes.length} atleta(s) con impacto completo.`);
      }
    }
  };

  const handleUseTemplate = () => {
    if (!selectedTemplateId) {
      toast.error('Por favor selecciona una plantilla');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      toast.error('Plantilla no encontrada');
      return;
    }

    // Llenar todos los campos excepto atletas (mantener la fecha actual)
    setFormData(prev => {
      const updatedData = {
        ...prev,
        name: template.name,
        description: template.description,
        category: template.category,
        notes: template.notes
        // La fecha se mantiene del estado anterior
      };
      
      // Validar la fecha después de actualizar el estado
      setTimeout(() => {
        if (updatedData.date) {
          validateDate(updatedData.date);
        }
      }, 0);
      
      return updatedData;
    });

    if (template.structureType === 'advanced') {
      setSeries(template.series);
      setIntervals([]);
      setSeriesBuilderMode('advanced');
    } else {
      setSeries([]);
      setIntervals(flattenSeriesToIntervals(template.series));
      setSeriesBuilderMode('simple');
    }

    // Cerrar selector de plantilla
    setShowTemplateSelector(false);
    
    toast.success('Plantilla aplicada correctamente', {
      description: 'Todos los campos excepto atletas han sido llenados. Revisa y ajusta según necesites.'
    });
  };

  const handleAddInterval = (interval: Omit<TrainingInterval, 'id'>) => {
    if (series.length > 0) {
      toast.error('La sesión ya usa series avanzadas. Elimina las series para volver a utilizar intervalos simples.');
      setSeriesBuilderMode('advanced');
      return;
    }

    const newInterval: TrainingInterval = {
      ...interval,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setIntervals(prev => [...prev, newInterval]);
  };

  const handleUpdateInterval = (intervalId: string, updatedInterval: Omit<TrainingInterval, 'id'>) => {
    setIntervals(prev => prev.map(interval => 
      interval.id === intervalId 
        ? { ...updatedInterval, id: intervalId }
        : interval
    ));
  };

  const handleDeleteInterval = (intervalId: string) => {
    setIntervals(prev => prev.filter(interval => interval.id !== intervalId));
  };

  const handleAddSeries = (newSeries: Omit<SeriesSet, 'id'>) => {
    if (intervals.length > 0) {
      toast.error('La sesión usa intervalos simples. Elimina los intervalos para crear series avanzadas.');
      setSeriesBuilderMode('simple');
      return;
    }

    const seriesWithId: SeriesSet = {
      ...newSeries,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setSeries(prev => [...prev, seriesWithId]);
    setSeriesBuilderMode('advanced');
  };

  const handleUpdateSeries = (seriesId: string, updatedSeries: Omit<SeriesSet, 'id'>) => {
    setSeries(prev => prev.map(s => 
      s.id === seriesId ? { ...updatedSeries, id: seriesId } : s
    ));
  };

  const handleDeleteSeries = (seriesId: string) => {
    setSeries(prev => {
      const updated = prev.filter(s => s.id !== seriesId);
      if (updated.length === 0) {
        setSeriesBuilderMode('simple');
      }
      return updated;
    });
  };

  const formatDate = (dateString: string) => {
    // Parsear la fecha como fecha local para evitar problemas de zona horaria
    const dateStr = dateString.split('T')[0]; // Asegurar formato YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Crear fecha local (mes es 0-indexed)
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canGoToNextStep = () => {
    // No permitir avanzar si se están cargando los ciclos o hidratando la sesión
    if (isLoadingCycles || isHydratingSession) {
      return false;
    }

    if (currentStep === 1) {
      return formData.name.trim() !== '';
    }
    if (currentStep === 2) {
      return intervals.length > 0 || series.length > 0;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast.error('Por favor completa el nombre de la sesión');
      return;
    }
    if (currentStep === 2 && intervals.length === 0 && series.length === 0) {
      toast.error('Debes agregar al menos una serie o intervalo');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isFormValid = formData.name.trim() && 
    formData.date && 
    !dateValidationError && 
    planningId !== undefined && // Validar que haya planningId
    (intervals.length > 0 || series.length > 0) && 
    !isHydratingSession;

  const mapBackendSeriesToSeriesSets = (backendSeries: TrainingSeriesResponseDto[] | undefined): SeriesSet[] => {
    if (!backendSeries) return [];

    return backendSeries.map((series, seriesIndex) => ({
      id: series.id?.toString() || `series-${seriesIndex}-${Date.now()}`,
      name: series.name,
      repetitions: series.repetitions,
      recoveryBetweenSets: series.recoveryBetweenSets,
      notes: series.notes || undefined,
      intervals: (series.intervals || []).map((interval, intervalIndex) => ({
        id: interval.id?.toString() || `interval-${seriesIndex}-${intervalIndex}-${Date.now()}`,
        trainingMode: (interval.trainingMode?.toLowerCase() as 'distance' | 'time') || (interval.duration ? 'time' : 'distance'),
        repetitions: interval.repetitions,
        distance: interval.distance || undefined,
        duration: interval.duration || interval.targetTime || undefined,
        targetTime: interval.targetTime || undefined,
        paceType: (interval.paceType?.toLowerCase() === 'vo2maxpercentage' ? 'vo2max_percentage' : 'fixed') as 'fixed' | 'vo2max_percentage',
        targetSpeed: interval.paceType?.toLowerCase() === 'vo2maxpercentage' ? undefined : (interval.targetSpeed || ''),
        vo2maxPercentage: interval.paceType?.toLowerCase() === 'vo2maxpercentage' ? interval.vo2MaxPercentage : undefined,
        description: interval.description || '',
        intensity: mapIntervalIntensityFromBackend(interval.intensity) || 'moderate',
        recoveryTime: interval.recoveryTime || '00:00'
      }))
    }));
  };

  const parseSpeed = (speedStr?: string): number | undefined => {
    if (!speedStr) return undefined;
    const parts = speedStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!Number.isNaN(mins) && !Number.isNaN(secs)) {
        return mins + secs / 60;
      }
    }
    const numeric = parseFloat(speedStr);
    return Number.isNaN(numeric) ? undefined : numeric;
  };

  const flattenSeriesToIntervals = (seriesSets: SeriesSet[]): TrainingInterval[] => {
    const flattened: TrainingInterval[] = [];

    seriesSets.forEach(series => {
      series.intervals.forEach((interval, intervalIndex) => {
        flattened.push({
          id: `${series.id}-${interval.id}`,
          type: 'interval',
          repetitions: interval.repetitions,
          distance: interval.trainingMode === 'distance' ? interval.distance || 0 : 0,
          targetTime: interval.trainingMode === 'time' ? interval.duration || interval.targetTime : interval.targetTime,
          recoveryTime: interval.recoveryTime || '00:00',
          paceType: interval.paceType || 'fixed',
          pace: interval.paceType === 'fixed' && interval.targetSpeed ? parseSpeed(interval.targetSpeed) : undefined,
          vo2maxPercentage: interval.paceType === 'vo2max_percentage' ? interval.vo2maxPercentage : undefined,
          description: interval.description,
          intensity: interval.intensity,
          trainingMode: interval.trainingMode,
          duration: interval.duration,
          targetSpeed: interval.paceType === 'fixed' ? interval.targetSpeed : undefined,
          orderIndex: intervalIndex
        });
      });
    });

    return flattened;
  };

  const formatMinutesToPace = (minutes: number): string => {
    if (!minutes || Number.isNaN(minutes)) return '';
    const totalSeconds = Math.round(minutes * 60);
    const paceMinutes = Math.floor(totalSeconds / 60);
    const paceSeconds = totalSeconds % 60;
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
  };

  const severityBadgeClass = (severity?: string): string => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderate':
        return 'bg-orange-100 text-orange-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const severityLabel = (severity?: string): string => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'Leve';
      case 'moderate':
        return 'Moderada';
      case 'severe':
        return 'Grave';
      default:
        return severity ?? 'Desconocida';
    }
  };

  const impactLabel = (impact?: string | null): string => {
    switch (impact?.toLowerCase()) {
      case 'none':
        return 'Ninguno';
      case 'low':
        return 'Bajo';
      case 'moderate':
        return 'Moderado';
      case 'high':
        return 'Alto';
      case 'full':
        return 'Completo';
      default:
        return impact ?? 'No informado';
    }
  };

  const mapImpactLabel = (impact?: string | null): string => {
    switch (impact?.toLowerCase()) {
      case 'none':
        return 'Ninguno';
      case 'low':
        return 'Bajo';
      case 'moderate':
        return 'Moderado';
      case 'high':
        return 'Alto';
      case 'full':
        return 'Completo';
      default:
        return impact ?? 'No informado';
    }
  };

  const getSessionDateValue = (dateString?: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    const result = new Date(year, month - 1, day);
    if (Number.isNaN(result.getTime())) return null;
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const isInjurySelectionBlocked = (injury: CoachRecentInjury | undefined, sessionDate: Date | null): boolean => {
    if (!injury) return false;
    if (injury.impactOnTraining?.toLowerCase() !== 'full') return false;
    if (!sessionDate) return true;
    if (!injury.recoveryEstimateDate) return true;
    const recovery = new Date(injury.recoveryEstimateDate);
    if (Number.isNaN(recovery.getTime())) return true;
    recovery.setHours(0, 0, 0, 0);
    return !(recovery < sessionDate);
  };

  const canAssignInjury = (injury: CoachRecentInjury | undefined, sessionDate: Date | null): boolean => {
    if (!injury) return true;
    if (injury.impactOnTraining?.toLowerCase() !== 'full') return true;
    return !isInjurySelectionBlocked(injury, sessionDate);
  };

  const populateSessionFromData = (sessionData: TrainingSessionResponseDto | TrainingSession) => {
    const rawDate = sessionData.date || '';
    const dateStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;

    setFormData({
      name: sessionData.name || '',
      description: sessionData.description || '',
      category: mapTrainingCategoryFromBackend(sessionData.category || 'training') as 'training' | 'prep_competition' | 'main_competition',
      notes: sessionData.notes || '',
      date: dateStr
    });

    const athleteIds = 'athleteIds' in sessionData && sessionData.athleteIds
      ? sessionData.athleteIds.map(id => id.toString())
      : (
          'athletes' in sessionData && Array.isArray((sessionData as any).athletes)
            ? (sessionData as any).athletes
                .map((athlete: any) => {
                  if (typeof athlete === 'string') return athlete;
                  if (athlete && typeof athlete === 'object') {
                    if ('athleteId' in athlete && athlete.athleteId !== undefined) {
                      return athlete.athleteId.toString();
                    }
                    if ('id' in athlete && athlete.id !== undefined) {
                      return athlete.id.toString();
                    }
                  }
                  return null;
                })
                .filter((value: string | null): value is string => Boolean(value))
            : (sessionData as TrainingSession).athletes || []
        );

    setSelectedAthletes(athleteIds);

    const rawSeries = Array.isArray((sessionData as any).series) ? (sessionData as any).series : [];
    const normalizedSeries = mapBackendSeriesToSeriesSets(rawSeries as TrainingSeriesResponseDto[]);

    const resolvedStructureType = sessionData.structureType
      ?? (normalizedSeries.length > 1 ? 'advanced' : 'simple');

    if (resolvedStructureType === 'advanced') {
      setSeries(normalizedSeries);
      setIntervals([]);
      setSeriesBuilderMode('advanced');
    } else {
      const simpleIntervals = flattenSeriesToIntervals(normalizedSeries);
      setSeries([]);
      setIntervals(simpleIntervals);
      setSeriesBuilderMode('simple');
    }

    setTimeout(() => {
      if (!isLoadingCycles && (microcycles.length > 0 || !planningId)) {
        validateDate(dateStr);
      }
    }, 100);
  };

  const getAthleteInjury = (athleteId: string): CoachRecentInjury | undefined => {
    return activeInjuries.get(athleteId);
  };

  const sessionDate = getSessionDateValue(formData.date);
  const visibleAthleteIds = useMemo(() => {
    if (!athletes || athletes.length === 0) {
      return [] as string[];
    }

    if (!searchTerm.trim()) {
      return athletes.map(athlete => athlete.id);
    }

    const ids = new Set<string>();
    filteredAthletes.forEach(athlete => ids.add(athlete.id));
    return Array.from(ids);
  }, [athletes, filteredAthletes, searchTerm]);

  const visibleInjuries = visibleAthleteIds
    .map(athleteId => activeInjuries.get(athleteId))
    .filter((injury): injury is CoachRecentInjury => Boolean(injury));

  const blockedInjuriesCount = visibleInjuries.filter(injury => isInjurySelectionBlocked(injury, sessionDate)).length;
  const hasBlockedInjuries = blockedInjuriesCount > 0;
  const hasAnyInjuries = visibleInjuries.length > 0;

  if (isHydratingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-4">Cargando sesión...</p>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            {editingSession ? 'Editar Sesión de Entrenamiento' : 'Nueva Sesión de Entrenamiento'}
          </DialogTitle>
          <DialogDescription>
            {editingSession ? 'Editar sesión de entrenamiento' : 'Crear sesión de entrenamiento'}
            {existingSessions.length > 0 && (
              <span className="ml-2">
                • {existingSessions.length} sesión(es) existente(s) en esta fecha
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Pasos */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Datos Básicos', icon: FileText },
              { step: 2, label: 'Series', icon: Clock },
              { step: 3, label: 'Atletas', icon: Users }
            ].map(({ step, label, icon: Icon }, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep === step 
                        ? 'bg-accent border-accent text-white' 
                        : currentStep > step
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm ${currentStep === step ? 'font-medium text-accent' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-0.5 mx-4 mb-8 transition-all ${
                    currentStep > step + 1 ? 'bg-green-500' : currentStep > step ? 'bg-accent' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contenido del Paso Actual */}
        <div className="min-h-[400px]">
          {/* Paso 1: Datos Básicos */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">Paso 1: Información Básica</h3>
                  <p className="text-sm text-muted-foreground">
                    Completa los datos fundamentales de la sesión de entrenamiento
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {showTemplateSelector ? 'Crear Manual' : 'Usar Plantilla'}
                </Button>
              </div>

              <Separator />

              {/* Input de Fecha */}
              <div>
                <Label htmlFor="session-date">
                  Fecha de la Sesión <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="session-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  required
                  className={`mt-1 ${dateValidationError ? 'border-red-500' : ''}`}
                  disabled={isLoadingCycles}
                />
                {dateValidationError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {dateValidationError}
                  </p>
                )}
                {isLoadingCycles && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Cargando información de ciclos...
                  </p>
                )}
                {!dateValidationError && formData.date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Sesión programada para el {formatDate(formData.date)}
                  </p>
                )}
              </div>

              {/* Selector de Plantilla */}
              {showTemplateSelector && (
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-5 h-5 text-accent" />
                          Seleccionar Plantilla
                        </CardTitle>
                        <CardDescription>
                          Elige una plantilla para llenar automáticamente todos los campos (excepto atletas)
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadTemplates}
                        disabled={isLoadingTemplates}
                        className="flex items-center gap-2"
                        title="Recargar plantillas"
                      >
                        {isLoadingTemplates ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Búsqueda de plantillas */}
                    <div>
                      <Label htmlFor="template-search">Buscar Plantilla</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="template-search"
                          value={templateSearchTerm}
                          onChange={(e) => setTemplateSearchTerm(e.target.value)}
                          placeholder="Buscar por nombre, tipo o descripción..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="template-select">Plantilla</Label>
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger id="template-select" className="mt-1">
                          <SelectValue placeholder="Selecciona una plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTemplates ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                              Cargando plantillas...
                            </div>
                          ) : filteredTemplates.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {templateSearchTerm 
                                ? 'No se encontraron plantillas con ese criterio'
                                : templates.length === 0
                                ? 'No hay plantillas disponibles. Crea una en la sección de Plantillas.'
                                : 'No hay plantillas que coincidan con la búsqueda'}
                            </div>
                          ) : (
                            filteredTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} - {template.type}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {filteredTemplates.length > 0 && templateSearchTerm && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''} encontrada{filteredTemplates.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {selectedTemplateId && (() => {
                      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                      if (!selectedTemplate) return null;
                      
                      return (
                        <div className="p-4 bg-white border border-accent/20 rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{selectedTemplate.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedTemplate.description}
                              </p>
                            </div>
                            <Badge variant="secondary">{selectedTemplate.type}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Duración:</span>
                              <span className="ml-1 font-medium">{selectedTemplate.duration} min</span>
                            </div>
                            {selectedTemplate.distance && (
                              <div>
                                <span className="text-muted-foreground">Distancia:</span>
                                <span className="ml-1 font-medium">{selectedTemplate.distance} km</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Dificultad:</span>
                              <span className="ml-1 font-medium">
                                {'⭐'.repeat(selectedTemplate.difficulty)}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Series:</span>
                            <span className="ml-1 font-medium">{selectedTemplate.series.length}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUseTemplate}
                        disabled={!selectedTemplateId}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Usar Plantilla Completa
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTemplateSelector(false);
                          setSelectedTemplateId('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-name">
                    Nombre de la Sesión <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="session-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Intervalos 8x400m"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="session-category">
                    Categoría <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: 'training' | 'prep_competition' | 'main_competition') => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Entrenamiento</SelectItem>
                      <SelectItem value="prep_competition">Competencia Preparatoria</SelectItem>
                      <SelectItem value="main_competition">Competencia Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="session-description">Descripción</Label>
                  <Textarea
                    id="session-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción detallada del entrenamiento..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="session-notes">Notas Adicionales</Label>
                  <Textarea
                    id="session-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones especiales, consideraciones..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              {!formData.name.trim() && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Nombre requerido</p>
                    <p className="text-sm text-amber-700">Debes completar el nombre de la sesión para continuar</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Series/Intervalos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">Paso 2: Constructor de Series</h3>
                  <p className="text-sm text-muted-foreground">
                    Define los intervalos y estructura de la sesión
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {intervals.length} intervalo{intervals.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {series.length} serie{series.length !== 1 ? 's' : ''} compleja{series.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <Separator />

              <Tabs value={seriesBuilderMode} onValueChange={(value: any) => setSeriesBuilderMode(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simple" disabled={series.length > 0}>Intervalos Simples</TabsTrigger>
                  <TabsTrigger value="advanced" disabled={intervals.length > 0}>Series con Intervalos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="simple" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Intervalos Simples:</strong> Agrega series homogéneas como "10x400m" o "5x1000m"
                      </p>
                    </div>
                    
                    <AthleteIntervalBuilder
                      intervals={intervals}
                      onAddInterval={handleAddInterval}
                      onUpdateInterval={handleUpdateInterval}
                      onDeleteInterval={handleDeleteInterval}
                      athletes={athletes?.filter(athlete => selectedAthletes.includes(athlete.id)) || []}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-900">
                        <strong>Series con Intervalos:</strong> Crea series heterogéneas como "3 series de 4x200m + 6x500m"
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Cada serie puede contener múltiples tipos de intervalos que se repiten juntos
                      </p>
                    </div>
                    
                    <SeriesBuilder
                      series={series}
                      onAddSeries={handleAddSeries}
                      onUpdateSeries={handleUpdateSeries}
                      onDeleteSeries={handleDeleteSeries}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {intervals.length === 0 && series.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Series o intervalos requeridos</p>
                    <p className="text-sm text-amber-700">Debes agregar al menos un intervalo simple o una serie con intervalos para continuar</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Atletas */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">Paso 3: Selección de Atletas</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige los atletas que realizarán esta sesión
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasAnyInjuries ? (
                     <TooltipProvider delayDuration={200}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <span className="inline-flex">
                             <Button
                               onClick={handleSelectAllAthletes}
                               variant="outline"
                               size="sm"
                               disabled
                             >
                               {visibleAthleteIds.every(id => selectedAthletes.includes(id)) ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
                             </Button>
                           </span>
                         </TooltipTrigger>
                         <TooltipContent>
                           {blockedInjuriesCount > 0
                             ? blockedInjuriesCount === 1
                               ? 'No puedes seleccionar todos porque hay un atleta con lesión que requiere revisión individual.'
                               : `No puedes seleccionar todos porque hay ${blockedInjuriesCount} atletas con lesiones que requieren revisión individual.`
                             : 'No puedes seleccionar todos porque hay atletas lesionados. Revisá cada caso y seleccioná individualmente.'}
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   ) : (
                    <Button
                      onClick={handleSelectAllAthletes}
                      variant="outline"
                      size="sm"
                    >
                      {selectedAthletes.length === athletes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                  )}
                  <Badge variant="secondary">
                    {selectedAthletes.length} seleccionado{selectedAthletes.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atletas o sedes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de grupos */}
              {filteredGroups.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Por Sedes</h4>
                  {filteredGroups.map(group => {
                    const groupAthletes = athletes?.filter(athlete => athlete.groupId === group.id) || [];
                    const sessionDateForGroup = sessionDate;
                    const assignableAthletes = group.athleteIds.filter(id => canAssignInjury(getAthleteInjury(id), sessionDateForGroup));
                    const allGroupAthletesSelected = assignableAthletes.every(id => selectedAthletes.includes(id));
                    const someGroupAthletesSelected = group.athleteIds.some(id => selectedAthletes.includes(id));

                    return (
                      <Card key={group.id} className="overflow-hidden">
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleGroupToggle(group.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={allGroupAthletesSelected}
                                ref={(el: HTMLButtonElement | null) => {
                                  if (el) {
                                    (el as any).indeterminate = someGroupAthletesSelected && !allGroupAthletesSelected;
                                  }
                                }}
                                onChange={() => handleGroupToggle(group.id)}
                              />
                              <div>
                                <CardTitle className="text-base">{group.name}</CardTitle>
                                <CardDescription>
                                  {groupAthletes.length} atleta{groupAthletes.length !== 1 ? 's' : ''}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={allGroupAthletesSelected ? 'default' : 'outline'}>
                              {group.athleteIds.filter(id => selectedAthletes.includes(id)).length}/{group.athleteIds.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {groupAthletes.map(athlete => {
                              const injury = getAthleteInjury(athlete.id);
                              const blocked = isInjurySelectionBlocked(injury, sessionDateForGroup);
                              const assignableInjury = injury && !blocked;

                              return (
                                <div
                                  key={athlete.id}
                                  className={`flex items-center gap-3 p-2 rounded hover:bg-muted/30 ${blocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={() => {
                                    if (blocked) {
                                      toast.error(`No puedes asignar a ${injury?.athleteName ?? athlete.name} hasta que supere su lesión.`);
                                      return;
                                    }
                                    handleAthleteToggle(athlete.id);
                                  }}
                                >
                                  <Checkbox 
                                    checked={selectedAthletes.includes(athlete.id)}
                                    onChange={() => handleAthleteToggle(athlete.id)}
                                    disabled={blocked}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{athlete.name}</p>
                                    <p className="text-xs text-muted-foreground">{athlete.groupName}</p>
                                    {athlete.vo2max && (
                                      <p className="text-xs text-muted-foreground">
                                        VO₂ Max: {athlete.vo2max} ml/kg/min
                                      </p>
                                    )}
                                    {injury && (
                                      <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge className={severityBadgeClass(injury.severity)}>
                                            {severityLabel(injury.severity)}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            Impacto: {impactLabel(injury.impactOnTraining)}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            Est. recuperación: {injury.recoveryEstimateDate ? new Date(injury.recoveryEstimateDate).toLocaleDateString('es-ES') : 'No informada'}
                                          </span>
                                        </div>
                                        {blocked && (
                                          <span className="text-xs text-red-600">
                                            No disponible hasta que supere la lesión.
                                          </span>
                                        )}
                                        {assignableInjury && injury.impactOnTraining?.toLowerCase() === 'full' && (
                                          <span className="text-xs text-amber-600">
                                            Impacto completo, pero la recuperación estimada es anterior a la sesión.
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Lista individual de atletas filtrados */}
              {filteredAthletes.length > 0 && searchTerm && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Resultados de Búsqueda</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAthletes.map(athlete => {
                      const injury = getAthleteInjury(athlete.id);
                      const blocked = isInjurySelectionBlocked(injury, sessionDate);
                      const assignableInjury = injury && !blocked;

                      return (
                        <Card 
                          key={athlete.id}
                          className={`cursor-pointer hover:shadow-md transition-all ${
                            selectedAthletes.includes(athlete.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                          } ${blocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (blocked) {
                              toast.error(`No puedes asignar a ${injury?.athleteName ?? athlete.name} porque su lesión tiene impacto completo.`);
                              return;
                            }
                            handleAthleteToggle(athlete.id);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={selectedAthletes.includes(athlete.id)}
                                onChange={() => handleAthleteToggle(athlete.id)}
                                disabled={blocked}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{athlete.name}</p>
                                <p className="text-sm text-muted-foreground">{athlete.groupName}</p>
                                {athlete.vo2max && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    VO₂ Max: {athlete.vo2max} ml/kg/min
                                  </p>
                                )}
                                {injury && (
                                  <div className="flex flex-col gap-1 mt-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className={severityBadgeClass(injury.severity)}>
                                        {severityLabel(injury.severity)}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Impacto: {impactLabel(injury.impactOnTraining)}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Est. recuperación: {injury.recoveryEstimateDate ? new Date(injury.recoveryEstimateDate).toLocaleDateString('es-ES') : 'No informada'}
                                      </span>
                                    </div>
                                    {blocked && (
                                      <span className="text-xs text-red-600">
                                        No disponible hasta que supere la lesión.
                                      </span>
                                    )}
                                    {assignableInjury && injury.impactOnTraining?.toLowerCase() === 'full' && (
                                      <span className="text-xs text-amber-600">
                                        Impacto completo, pero la recuperación estimada es anterior a la sesión.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!athletes || athletes.length === 0) && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No hay atletas disponibles</h3>
                  <p className="text-muted-foreground">
                    Primero debes agregar atletas a tu sede para poder crear sesiones.
                  </p>
                </div>
              )}

              {selectedAthletes.length === 0 && athletes.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Atletas opcionales</p>
                    <p className="text-sm text-blue-700">Puedes crear la sesión sin atletas asignados y agregarlos más adelante</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de Navegación */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {intervals.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {intervals.length} serie{intervals.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {selectedAthletes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedAthletes.length} atleta{selectedAthletes.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            
            {currentStep > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePreviousStep}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={handleNextStep}
                disabled={!canGoToNextStep()}
                className="min-w-32"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="min-w-32 bg-accent hover:bg-accent/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingSession ? 'Actualizar Sesión' : 'Crear Sesión'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={pendingInjurySelection !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelInjurySelection();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Asignar atleta lesionado</AlertDialogTitle>
            <AlertDialogDescription>
              El atleta seleccionado está lesionado. Confirmá que deseas incluirlo en esta sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingInjurySelection && (
            <div className="space-y-3 text-sm">
              {(() => {
                const injury = pendingInjurySelection.injury;
                const blocked = isInjurySelectionBlocked(injury, sessionDate);
                const assignableFullImpact = injury.impactOnTraining?.toLowerCase() === 'full' && !blocked;

                return (
                  <>
                    <div>
                      <p className="font-medium text-foreground">{pendingInjurySelection.injury.athleteName}</p>
                      <p className="text-muted-foreground text-sm">{pendingInjurySelection.injury.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={severityBadgeClass(pendingInjurySelection.injury.severity)}>
                        {severityLabel(pendingInjurySelection.injury.severity)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Impacto en entrenamiento: {impactLabel(pendingInjurySelection.injury.impactOnTraining)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-sm space-y-1">
                      <p>
                        Estimación de recuperación:{' '}
                        {pendingInjurySelection.injury.recoveryEstimateDate
                          ? new Date(pendingInjurySelection.injury.recoveryEstimateDate).toLocaleDateString('es-ES')
                          : 'No informada'}
                      </p>
                      <p>
                        Fecha de la sesión:{' '}
                        {sessionDate ? sessionDate.toLocaleDateString('es-ES') : 'No definida'}
                      </p>
                    </div>
                    {assignableFullImpact && (
                      <p className="text-amber-600 text-sm">
                        El impacto es completo, pero la fecha estimada de recuperación es anterior a la sesión. Confirmá si continúa siendo apto.
                      </p>
                    )}
                  </>
                );
              })()}
              <p className="text-muted-foreground text-sm">
                Si decidís continuar, considerá adaptar la carga de trabajo para este atleta.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelInjurySelection}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInjurySelection}>Asignar atleta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmación para crear sin atletas */}
      <AlertDialog open={showNoAthletesConfirmDialog} onOpenChange={setShowNoAthletesConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Crear sesión sin atletas asignados</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por crear una sesión de entrenamiento sin atletas asignados. 
              Podrás asignar atletas a esta sesión más adelante desde el calendario de planificación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={submitSession} disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Continuar sin atletas'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
