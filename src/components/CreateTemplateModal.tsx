import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Save, Clock, FileText, Check, ChevronLeft, ChevronRight, AlertCircle, X, Tag } from 'lucide-react';
import { AthleteIntervalBuilder } from './AthleteIntervalBuilder';
import { SeriesBuilder } from './SeriesBuilder';
import { toast } from 'sonner';
import { TrainingTemplateService, CreateTrainingTemplateDto, CreateTrainingSeriesDto } from '../services/trainingTemplateService';
import { translateCategory } from '../utils/templateTranslations';
import { mapIntervalIntensityToBackend, mapIntervalIntensityFromBackend } from '../utils/intervalIntensityMapper';
import { mapTrainingCategoryToBackend } from '../utils/trainingCategoryMapper';
import { mapDifficultyFromBackend } from '../utils/difficultyMapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TrainingSeriesResponseDto } from '../services/trainingTemplateService';

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
  difficulty: 1 | 2 | 3 | 4 | 5 | string | number; // Backend puede enviar string o número
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
  tags: string[];
  structureType: 'simple' | 'advanced';
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (template: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  template?: TrainingTemplate | null;
  mode: 'create' | 'edit';
  onTemplateCreated?: () => void; // Callback después de crear exitosamente
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
  recoveryBetweenSets: string;
  notes?: string;
  intervals: IntervalInSeries[];
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
  mode,
  onTemplateCreated
}: CreateTemplateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: (template?.category || 'training') as 'training' | 'prep_competition' | 'main_competition',
    notes: template?.notes || '',
    difficulty: (template?.difficulty || 3) as 1 | 2 | 3 | 4 | 5
  });
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [intervals, setIntervals] = useState<TrainingInterval[]>([]);
  const [series, setSeries] = useState<SeriesSet[]>([]);
  const [seriesBuilderMode, setSeriesBuilderMode] = useState<'simple' | 'advanced'>(
    template?.series && template.series.length > 0 ? 'advanced' : 'simple'
  );

  const createUniqueId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const normalizeSeriesFromTemplate = (seriesList?: SeriesSet[]): SeriesSet[] => {
    if (!seriesList) return [];

    return seriesList.map((seriesItem, seriesIndex) => ({
      id: seriesItem.id || createUniqueId(`series-${seriesIndex}`),
      name: seriesItem.name,
      repetitions: seriesItem.repetitions,
      recoveryBetweenSets: seriesItem.recoveryBetweenSets || '00:00',
      notes: seriesItem.notes,
        intervals: (seriesItem.intervals || []).map((intervalItem, intervalIndex) => {
          const intervalAny = intervalItem as any; // Para acceder a propiedades que pueden venir del backend
          const paceTypeStr = String(intervalItem.paceType || '');
          // Verificar tanto el formato del frontend (vo2max_percentage) como del backend (vo2MaxPercentage, Vo2MaxPercentage)
          const isVo2MaxPercentage = paceTypeStr === 'vo2max_percentage' || 
                                     paceTypeStr.toLowerCase() === 'vo2maxpercentage' || 
                                     paceTypeStr === 'vo2MaxPercentage' ||
                                     paceTypeStr === 'Vo2MaxPercentage';
          const vo2MaxValue = intervalItem.vo2maxPercentage ?? intervalAny.vo2MaxPercentage;
          
        
        return {
          id: intervalItem.id || createUniqueId(`interval-${seriesIndex}-${intervalIndex}`),
          trainingMode: intervalItem.trainingMode || (intervalItem.duration || intervalItem.targetTime ? 'time' : 'distance'),
          repetitions: intervalItem.repetitions || 1,
          distance: intervalItem.distance,
          duration: intervalItem.duration,
          targetTime: intervalItem.targetTime,
          paceType: (isVo2MaxPercentage ? 'vo2max_percentage' : 'fixed') as 'fixed' | 'vo2max_percentage',
          targetSpeed: isVo2MaxPercentage ? undefined : (intervalItem.targetSpeed || ''),
          vo2maxPercentage: isVo2MaxPercentage ? vo2MaxValue : undefined,
          description: intervalItem.description,
          intensity: intervalItem.intensity || 'moderate',
          recoveryTime: intervalItem.recoveryTime || '00:00'
        };
      })
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
    const value = parseFloat(speedStr);
    return Number.isNaN(value) ? undefined : value;
  };

  const convertSeriesIntervalToTrainingInterval = (
    seriesId: string,
    interval: IntervalInSeries,
    index: number
  ): TrainingInterval => ({
    id: interval.id || createUniqueId(`flat-interval-${seriesId}-${index}`),
    type: 'interval',
    repetitions: interval.repetitions || 1,
    distance: interval.trainingMode === 'distance' ? interval.distance || 0 : 0,
    targetTime: interval.trainingMode === 'time' ? interval.duration : undefined,
    recoveryTime: interval.recoveryTime || '00:00',
    paceType: interval.paceType || 'fixed',
    pace: interval.paceType === 'fixed' && interval.targetSpeed ? parseSpeed(interval.targetSpeed) : undefined,
    vo2maxPercentage: interval.paceType === 'vo2max_percentage' ? interval.vo2maxPercentage : undefined,
    description: interval.description,
    intensity: mapIntervalIntensityFromBackend(interval.intensity) || 'moderate',
    trainingMode: interval.trainingMode,
    duration: interval.duration,
    targetSpeed: interval.paceType === 'fixed' ? interval.targetSpeed : undefined
  });

  const flattenSeriesToTrainingIntervals = (seriesSets: SeriesSet[]): TrainingInterval[] => {
    const flattened: TrainingInterval[] = [];

    seriesSets.forEach(seriesItem => {
      seriesItem.intervals.forEach((intervalItem, intervalIndex) => {
        const converted = convertSeriesIntervalToTrainingInterval(seriesItem.id, intervalItem, intervalIndex);
        converted.recoveryTime = intervalItem.recoveryTime || converted.recoveryTime;
        converted.intensity = mapIntervalIntensityFromBackend(intervalItem.intensity) || converted.intensity;
        flattened.push(converted);
      });
    });

    return flattened;
  };

  const formatMinutesToPace = (minutes?: number): string => {
    if (minutes === undefined || Number.isNaN(minutes)) return '';
    const totalSeconds = Math.round(minutes * 60);
    const paceMinutes = Math.floor(totalSeconds / 60);
    const paceSeconds = totalSeconds % 60;
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
  };

  const convertTrainingIntervalToSeriesInterval = (interval: TrainingInterval): IntervalInSeries => ({
    id: interval.id || createUniqueId('series-interval'),
    trainingMode: interval.trainingMode || (interval.duration || interval.targetTime ? 'time' : 'distance'),
    repetitions: interval.repetitions || 1,
    distance: interval.trainingMode === 'distance' ? interval.distance : interval.distance ?? 0,
    duration: interval.duration || interval.targetTime,
    paceType: interval.paceType || 'fixed',
    targetSpeed: interval.paceType === 'fixed' ? (interval.targetSpeed || (interval.pace ? formatMinutesToPace(interval.pace) : '')) : undefined,
    vo2maxPercentage: interval.paceType === 'vo2max_percentage' ? interval.vo2maxPercentage : undefined,
    description: interval.description,
    intensity: interval.intensity || 'moderate'
  });

  const buildSeriesPreview = (): SeriesSet[] => {
    if (series.length > 0) {
      return series;
    }

    if (intervals.length === 0) {
      return [];
    }

    return [
      {
        id: 'simple-series-preview',
        name: 'Intervalos Simples',
        repetitions: 1,
        recoveryBetweenSets: '00:00',
        notes: undefined,
        intervals: intervals.map(convertTrainingIntervalToSeriesInterval)
      }
    ];
  };

  const mapTrainingModeToBackend = (mode?: 'distance' | 'time'): 'Distance' | 'Time' | undefined => {
    if (!mode) return undefined;
    return mode === 'time' ? 'Time' : 'Distance';
  };

  const mapIntervalTypeToBackend = (type?: string): 'Interval' | 'Continuous' | 'Recovery' => {
    switch (type) {
      case 'continuous':
        return 'Continuous';
      case 'recovery':
        return 'Recovery';
      default:
        return 'Interval';
    }
  };

  const buildSeriesPayload = (): CreateTrainingSeriesDto[] => {
    if (series.length > 0) {
      return series.map((seriesItem, index) => ({
        name: seriesItem.name.trim() || `Serie ${index + 1}`,
        repetitions: seriesItem.repetitions,
        recoveryBetweenSets: seriesItem.recoveryBetweenSets || '00:00',
        orderIndex: index,
        notes: seriesItem.notes,
        intervals: seriesItem.intervals.map((interval, idx) => ({
          type: 'Interval',
          repetitions: interval.repetitions,
          distance: interval.trainingMode === 'distance' ? interval.distance || 0 : 0,
          targetTime: interval.trainingMode === 'time' ? interval.duration : undefined,
          recoveryTime: interval.recoveryTime || '00:00',
          paceType: interval.paceType === 'fixed' ? 'Fixed' : 'Vo2MaxPercentage',
          pace: interval.paceType === 'fixed' && interval.targetSpeed ? parseSpeed(interval.targetSpeed) : undefined,
          vo2MaxPercentage: interval.paceType === 'vo2max_percentage' ? interval.vo2maxPercentage : undefined,
          description: interval.description,
          intensity: mapIntervalIntensityToBackend(interval.intensity),
          trainingMode: mapTrainingModeToBackend(interval.trainingMode),
          duration: interval.trainingMode === 'time' ? interval.duration : undefined,
          targetSpeed: interval.paceType === 'fixed' ? interval.targetSpeed : undefined,
          orderIndex: idx
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
            distance: interval.trainingMode === 'time' ? 0 : interval.distance,
            targetTime: interval.trainingMode === 'time' ? interval.duration || interval.targetTime : interval.targetTime,
            recoveryTime: interval.recoveryTime || '00:00',
            paceType: interval.paceType === 'fixed' ? 'Fixed' : 'Vo2MaxPercentage',
            pace: interval.pace,
            vo2MaxPercentage: interval.vo2maxPercentage,
            description: interval.description,
            intensity: mapIntervalIntensityToBackend(interval.intensity),
            trainingMode: mapTrainingModeToBackend(interval.trainingMode),
            duration: interval.duration,
            targetSpeed: interval.targetSpeed,
            orderIndex: idx
          }))
        }
      ];
    }

    return [];
  };
  const [currentStep, setCurrentStep] = useState(1);

  // Actualizar el estado cuando cambia el template (modo edición)
  useEffect(() => {
    if (template) {
      const mappedDifficulty = mapDifficultyFromBackend(template.difficulty as any);
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        notes: template.notes,
        difficulty: mappedDifficulty
      });
      setTags(template.tags || []);

      const normalizedSeries = normalizeSeriesFromTemplate(template.series);

      if (template.structureType === 'advanced')
      {
        setSeries(normalizedSeries);
        setIntervals([]);
        setSeriesBuilderMode('advanced');
      }
      else
      {
        setSeries([]);
        // Para structureType "simple", siempre generar los intervalos desde las series normalizadas
        // para asegurar que el paceType esté correctamente mapeado
        const simpleIntervals = flattenSeriesToTrainingIntervals(normalizedSeries);
        setIntervals(simpleIntervals);
        setSeriesBuilderMode('simple');
      }
    } else {
      // Reset solo cuando no hay template (modo creación)
      setFormData({
        name: '',
        description: '',
        category: 'training',
        notes: '',
        difficulty: 3
      });
      setTags([]);
      setTagInput('');
      setIntervals([]);
      setSeries([]);
      setSeriesBuilderMode('simple');
      setCurrentStep(1);
    }
  }, [template]);

  // Usar la función de traducción
  const categoryLabels = {
    'training': translateCategory('training'),
    'prep_competition': translateCategory('prep_competition'),
    'main_competition': translateCategory('main_competition')
  };

  // Función para convertir tiempo en formato "mm:ss" o "HH:mm:ss" a minutos
  const parseTimeToMinutes = (timeString?: string): number => {
    if (!timeString) return 0;
    
    try {
      const parts = timeString.split(':').map(Number);
      if (parts.length === 2) {
        // Formato "mm:ss"
        return parts[0] + parts[1] / 60;
      } else if (parts.length === 3) {
        // Formato "HH:mm:ss"
        return parts[0] * 60 + parts[1] + parts[2] / 60;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  };

  const getAllIntervalsForDuration = (): TrainingInterval[] => {
    if (series.length > 0) {
      return flattenSeriesToTrainingIntervals(series);
    }
    return intervals;
  };

  // Función para calcular la duración total en minutos basada en los intervalos
  const calculateTotalDuration = (): number => {
    const intervalsForDuration = getAllIntervalsForDuration();
    if (intervalsForDuration.length === 0) return 0;

    let totalMinutes = 0;

    intervalsForDuration.forEach((interval) => {
      const repetitions = interval.repetitions || 1;
      
      // Calcular tiempo de trabajo por repetición
      let workTimePerRep = 0;
      if (interval.targetTime) {
        // Usar targetTime si está disponible
        workTimePerRep = parseTimeToMinutes(interval.targetTime);
      } else if (interval.duration) {
        // Usar duration si está disponible
        workTimePerRep = parseTimeToMinutes(interval.duration);
      } else if (interval.distance && interval.pace) {
        // Estimar basado en distancia y ritmo
        // pace está en min/km, distance está en metros
        const paceMinutes = interval.pace;
        const distanceKm = interval.distance / 1000;
        workTimePerRep = paceMinutes * distanceKm;
      }

      // Tiempo total de trabajo (todas las repeticiones)
      const totalWorkTime = workTimePerRep * repetitions;

      // Calcular tiempo de recuperación
      // recoveryTime se aplica entre repeticiones, no después de la última
      const recoveryTimeMinutes = parseTimeToMinutes(interval.recoveryTime || '0:00');
      const totalRecoveryTime = recoveryTimeMinutes * Math.max(0, repetitions - 1);

      totalMinutes += totalWorkTime + totalRecoveryTime;
    });

    // Redondear a minutos enteros, mínimo 1 minuto
    return Math.max(1, Math.round(totalMinutes));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la plantilla es requerido');
      return;
    }

    const seriesPayload = buildSeriesPayload();
    if (seriesPayload.length === 0) {
      toast.error('Debes agregar al menos un intervalo simple o una serie con intervalos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular duración total desde los intervalos
      const calculatedDuration = calculateTotalDuration();

      const previewSeries = buildSeriesPreview();
      const previewIntervals = getAllIntervalsForDuration();

      const dto: CreateTrainingTemplateDto = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: 'Intervalos' as const,
        category: mapTrainingCategoryToBackend(formData.category),
        duration: calculatedDuration,
        notes: formData.notes.trim() || '',
        difficulty: formData.difficulty,
        tags: tags,
        series: seriesPayload
      };

      if (mode === 'create') {
        await TrainingTemplateService.createTrainingTemplate(dto);

        if (onSave) {
          const templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'> = {
            name: dto.name,
            description: dto.description,
            type: dto.type as any,
            category: dto.category as any,
            duration: dto.duration,
            series: previewSeries,
            intervals: previewIntervals,
            notes: dto.notes,
            difficulty: dto.difficulty as any,
            isFavorite: false,
            tags: dto.tags,
            structureType: series.length > 0 ? 'advanced' : 'simple'
          };
          onSave(templateData);
        }

        if (onTemplateCreated) {
          onTemplateCreated();
        }
      } else if (mode === 'edit' && template) {
        await TrainingTemplateService.updateTrainingTemplate(parseInt(template.id), dto);

        if (onSave) {
          const templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'> = {
            name: dto.name,
            description: dto.description,
            type: dto.type as any,
            category: dto.category as any,
            duration: dto.duration,
            series: previewSeries,
            intervals: previewIntervals,
            notes: dto.notes,
            difficulty: dto.difficulty as any,
            isFavorite: template.isFavorite,
            tags: dto.tags,
            lastUsed: template.lastUsed,
            structureType: series.length > 0 ? 'advanced' : 'simple'
          };
          onSave(templateData);
        }

        if (onTemplateCreated) {
          onTemplateCreated();
        }
      }

      handleReset();
      onClose();
    } catch (error) {
      // El error ya se maneja automáticamente en el servicio
      console.error('Error al guardar la plantilla:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: 'training',
      notes: '',
      difficulty: 3
    });
    setTags([]);
    setTagInput('');
    setIntervals([]);
    setSeries([]);
    setSeriesBuilderMode('simple');
    setCurrentStep(1);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    } else if (tags.includes(trimmedTag)) {
      toast.error('Este tag ya existe');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAddInterval = (interval: Omit<TrainingInterval, 'id'>) => {
    if (series.length > 0) {
      toast.error('Esta plantilla ya usa series avanzadas. Elimina las series para volver a utilizar intervalos simples.');
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
      toast.error('Esta plantilla usa intervalos simples. Elimina los intervalos para crear series avanzadas.');
      setSeriesBuilderMode('simple');
      return;
    }

    const seriesWithId: SeriesSet = {
      ...newSeries,
      id: createUniqueId('series')
    };
    setSeries(prev => [...prev, seriesWithId]);
    setSeriesBuilderMode('advanced');
  };

  const handleUpdateSeries = (seriesId: string, updatedSeries: Omit<SeriesSet, 'id'>) => {
    setSeries(prev =>
      prev.map(seriesItem =>
        seriesItem.id === seriesId ? { ...updatedSeries, id: seriesId } : seriesItem
      )
    );
  };

  const handleDeleteSeries = (seriesId: string) => {
    setSeries(prev => {
      const updated = prev.filter(seriesItem => seriesItem.id !== seriesId);
      if (updated.length === 0) {
        setSeriesBuilderMode('simple');
      }
      return updated;
    });
  };

  const canGoToNextStep = () => {
    if (currentStep === 1) {
      return formData.name.trim() !== '';
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast.error('Por favor completa el nombre de la plantilla');
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const hasSeriesContent = intervals.length > 0 || series.length > 0;
  const isFormValid = !!formData.name.trim() && hasSeriesContent;

  const mapBackendSeriesToSeriesSets = (backendSeries: TrainingSeriesResponseDto[] | undefined): SeriesSet[] => {
    if (!backendSeries) return [];

    return backendSeries.map((series, seriesIndex) => ({
      id: series.id?.toString() || `series-${seriesIndex}-${Date.now()}`,
      name: series.name,
      repetitions: series.repetitions,
      recoveryBetweenSets: series.recoveryBetweenSets,
      notes: series.notes || undefined,
      intervals: (series.intervals || []).map((interval, intervalIndex) => {
        const intervalAny = interval as any; // Para acceder a vo2MaxPercentage del backend
        const paceTypeStr = String(interval.paceType || '');
        // Verificar tanto el formato del frontend (vo2max_percentage) como del backend (vo2MaxPercentage, Vo2MaxPercentage)
        const isVo2MaxPercentage = paceTypeStr === 'vo2max_percentage' || 
                                   paceTypeStr.toLowerCase() === 'vo2maxpercentage' || 
                                   paceTypeStr === 'vo2MaxPercentage' ||
                                   paceTypeStr === 'Vo2MaxPercentage';
        const vo2MaxValue = intervalAny.vo2MaxPercentage ?? intervalAny.vo2maxPercentage;
        return {
          id: interval.id?.toString() || `interval-${seriesIndex}-${intervalIndex}-${Date.now()}`,
          trainingMode: (interval.trainingMode?.toLowerCase() as 'distance' | 'time') || (interval.duration ? 'time' : 'distance'),
          repetitions: interval.repetitions,
          distance: interval.distance || undefined,
          duration: interval.duration || interval.targetTime || undefined,
          targetTime: interval.targetTime || undefined,
          paceType: (isVo2MaxPercentage ? 'vo2max_percentage' : 'fixed') as 'fixed' | 'vo2max_percentage',
          targetSpeed: isVo2MaxPercentage ? undefined : (interval.targetSpeed || ''),
          vo2maxPercentage: isVo2MaxPercentage ? vo2MaxValue : undefined,
          description: interval.description || '',
          intensity: mapIntervalIntensityFromBackend(interval.intensity) || 'moderate',
          recoveryTime: interval.recoveryTime || '00:00'
        };
      })
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            {mode === 'create' ? 'Nueva Plantilla de Entrenamiento' : 'Editar Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crea una plantilla reutilizable para futuras sesiones'
              : 'Modifica los detalles de tu plantilla'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Pasos */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Datos Básicos', icon: FileText },
              { step: 2, label: 'Series', icon: Clock }
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
                {index < 1 && (
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
              <div>
                <h3 className="text-lg font-medium mb-2">Paso 1: Información Básica</h3>
                <p className="text-sm text-muted-foreground">
                  Completa los datos fundamentales de la plantilla de entrenamiento
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">
                    Nombre de la Plantilla <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Intervalos 8x400m"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-category">
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
                    <Label htmlFor="template-difficulty">
                      Dificultad
                    </Label>
                    <Select 
                      value={formData.difficulty.toString()} 
                      onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, difficulty: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Muy Fácil
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            Fácil
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            Moderado
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            Difícil
                          </div>
                        </SelectItem>
                        <SelectItem value="5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Muy Difícil
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-description">Descripción</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción detallada del entrenamiento..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template-notes">Notas Adicionales</Label>
                  <Textarea
                    id="template-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones especiales, consideraciones..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template-tags">
                    Tags
                  </Label>
                  <div className="mt-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="template-tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Escribe un tag y presiona Enter"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                        disabled={!tagInput.trim()}
                        className="flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        Agregar
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                        {tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                              aria-label={`Eliminar tag ${tag}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega tags para categorizar y facilitar la búsqueda de la plantilla
                  </p>
                </div>
              </div>

              {!formData.name.trim() && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Nombre requerido</p>
                    <p className="text-sm text-amber-700">Debes completar el nombre de la plantilla para continuar</p>
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
                    Define las series que compondrán esta plantilla
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {intervals.length} intervalo{intervals.length !== 1 ? 's' : ''} simple{intervals.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {series.length} serie{series.length !== 1 ? 's' : ''} avanzada{series.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <Separator />

              <Tabs
                value={seriesBuilderMode}
                onValueChange={(value: 'simple' | 'advanced') => setSeriesBuilderMode(value)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simple" disabled={series.length > 0}>
                    Intervalos Simples
                  </TabsTrigger>
                  <TabsTrigger value="advanced" disabled={intervals.length > 0}>
                    Series con Intervalos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="simple" className="mt-6 space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Intervalos Simples:</strong> Ideal para estructuras homogéneas como &quot;10x400m&quot;.
                    </p>
                  </div>

                  <AthleteIntervalBuilder
                    intervals={intervals}
                    onAddInterval={handleAddInterval}
                    onUpdateInterval={handleUpdateInterval}
                    onDeleteInterval={handleDeleteInterval}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="mt-6 space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-900">
                      <strong>Series con Intervalos:</strong> Diseña bloques complejos con múltiples intervalos combinados.
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Cada serie puede contener diferentes tipos de intervalos que se repiten juntos.
                    </p>
                  </div>

                  <SeriesBuilder
                    series={series}
                    onAddSeries={handleAddSeries}
                    onUpdateSeries={handleUpdateSeries}
                    onDeleteSeries={handleDeleteSeries}
                  />
                </TabsContent>
              </Tabs>

              {intervals.length === 0 && series.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Series o intervalos requeridos</p>
                    <p className="text-sm text-amber-700">
                      Agrega al menos un intervalo simple o una serie avanzada para poder guardar la plantilla.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            
            {currentStep < 2 ? (
              <Button
                onClick={handleNextStep}
                disabled={!canGoToNextStep()}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting 
                  ? (mode === 'create' ? 'Creando...' : 'Guardando...') 
                  : (mode === 'create' ? 'Crear Plantilla' : 'Guardar Cambios')
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
