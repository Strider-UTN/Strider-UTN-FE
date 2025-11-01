import React, { useState, useEffect } from 'react';
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
import { TrainingTemplateService, TrainingTemplateResponseDto } from '../services/trainingTemplateService';
import { TrainingSessionService, CreateTrainingSessionDto, CreateTrainingIntervalDto } from '../services/trainingSessionService';
import { mapTrainingTypeFromBackend } from '../utils/trainingTypeMapper';
import { mapDifficultyFromBackend } from '../utils/difficultyMapper';
import { mapTrainingCategoryToBackend } from '../utils/trainingCategoryMapper';

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
}

interface IntervalInSeries {
  id: string;
  trainingMode: 'distance' | 'time';
  repetitions: number;
  distance?: number;
  duration?: string;
  targetSpeed: string;
  description?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
}

interface SeriesSet {
  id: string;
  name: string;
  repetitions: number;
  intervals: IntervalInSeries[];
  recoveryBetweenSets: string;
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athletes: string[];
  intervals: TrainingInterval[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  intervals: TrainingInterval[];
  notes: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

interface CreateTrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  athletes: Athlete[];
  selectedDate: string;
  existingSessions?: TrainingSession[];
  onSessionCreated?: () => void; // Callback opcional cuando se crea exitosamente en el backend
}

export function CreateTrainingSessionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  athletes, 
  selectedDate,
  existingSessions = [],
  onSessionCreated
}: CreateTrainingSessionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'training' as 'training' | 'prep_competition' | 'main_competition',
    notes: ''
  });
  
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [intervals, setIntervals] = useState<TrainingInterval[]>([]);
  const [series, setSeries] = useState<SeriesSet[]>([]);
  const [seriesBuilderMode, setSeriesBuilderMode] = useState<'simple' | 'advanced'>('simple');
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Estado para plantillas desde el backend
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');

  // Función para convertir plantillas del backend al formato del frontend
  const convertBackendTemplateToFrontend = (backendTemplate: TrainingTemplateResponseDto): TrainingTemplate => {
    return {
      id: backendTemplate.id.toString(),
      name: backendTemplate.name,
      description: backendTemplate.description,
      type: mapTrainingTypeFromBackend(backendTemplate.type) as any,
      category: (backendTemplate.category === 'Training'
        ? 'training'
        : backendTemplate.category === 'PrepCompetition'
        ? 'prep_competition'
        : 'main_competition') as 'training' | 'prep_competition' | 'main_competition',
      duration: backendTemplate.duration,
      distance: backendTemplate.distance,
      targetPace: backendTemplate.targetPace,
      targetHR: backendTemplate.targetHR,
      intervals: backendTemplate.intervals.map((interval) => ({
        id: interval.id.toString(),
        type: (interval.type === 'Interval' 
          ? 'interval' 
          : interval.type === 'Continuous' 
          ? 'continuous' 
          : 'recovery') as 'interval' | 'continuous' | 'recovery',
        repetitions: interval.repetitions,
        distance: interval.distance,
        targetTime: interval.targetTime,
        recoveryTime: interval.recoveryTime,
        paceType: (interval.paceType === 'Fixed' ? 'fixed' : 'vo2max_percentage') as 'fixed' | 'vo2max_percentage',
        pace: interval.pace,
        vo2maxPercentage: interval.vo2maxPercentage,
        description: interval.description,
        intensity: interval.intensity 
          ? (interval.intensity.toLowerCase() as 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max')
          : undefined,
        trainingMode: interval.trainingMode 
          ? (interval.trainingMode.toLowerCase() as 'distance' | 'time')
          : undefined,
        duration: interval.duration,
        targetSpeed: interval.targetSpeed
      })),
      notes: backendTemplate.notes,
      difficulty: mapDifficultyFromBackend(backendTemplate.difficulty)
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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la sesión es requerido');
      return;
    }

    if (intervals.length === 0 && series.length === 0) {
      toast.error('Debe agregar al menos una serie o intervalo');
      return;
    }

    if (selectedAthletes.length === 0) {
      toast.error('Debe seleccionar al menos un atleta');
      return;
    }

    // Convertir series a intervalos si es necesario
    let allIntervals = [...intervals];
    
    // Agregar los intervalos de las series complejas
    series.forEach(s => {
      // Repetir toda la serie s.repetitions veces
      for (let seriesRep = 0; seriesRep < s.repetitions; seriesRep++) {
        // Agregar cada intervalo de la serie
        s.intervals.forEach((interval, intervalIndex) => {
          const convertedInterval: TrainingInterval = {
            id: `${s.id}-rep${seriesRep}-${interval.id}`,
            type: 'interval',
            repetitions: interval.repetitions,
            distance: interval.trainingMode === 'distance' ? (interval.distance || 0) : 0,
            targetTime: interval.trainingMode === 'time' ? interval.duration : undefined,
            recoveryTime: '0:00', // La recuperación entre intervalos dentro de la serie
            paceType: 'fixed',
            pace: parseSpeed(interval.targetSpeed),
            description: `${s.name} (Serie ${seriesRep + 1}/${s.repetitions}) - ${interval.description || ''}`,
            intensity: interval.intensity,
            trainingMode: interval.trainingMode,
            duration: interval.trainingMode === 'time' ? interval.duration : undefined,
            targetSpeed: interval.targetSpeed
          };
          allIntervals.push(convertedInterval);
        });
        
        // Agregar intervalo de recuperación entre series (excepto después de la última)
        if (seriesRep < s.repetitions - 1) {
          const recoveryInterval: TrainingInterval = {
            id: `${s.id}-recovery-${seriesRep}`,
            type: 'recovery',
            repetitions: 1,
            distance: 0,
            recoveryTime: s.recoveryBetweenSets,
            paceType: 'fixed',
            pace: 0,
            description: `Recuperación entre series de ${s.name}`,
            intensity: 'easy',
            trainingMode: 'time',
            duration: s.recoveryBetweenSets,
            targetSpeed: '0:00'
          };
          allIntervals.push(recoveryInterval);
        }
      }
    });

    // Convertir intervalos al formato del backend
    const backendIntervals: CreateTrainingIntervalDto[] = allIntervals.map((interval, index) => {
      // Mapear el tipo del frontend al backend
      const typeMapping: Record<string, string> = {
        'interval': 'Interval',
        'continuous': 'Continuous',
        'recovery': 'Recovery'
      };

      // Mapear el tipo de pace del frontend al backend
      const paceTypeMapping: Record<string, string> = {
        'fixed': 'Fixed',
        'vo2max_percentage': 'Vo2MaxPercentage'
      };

      // Mapear la intensidad del frontend al backend
      const intensityMapping: Record<string, string> = {
        'easy': 'Easy',
        'moderate': 'Moderate',
        'hard': 'Hard',
        'very_hard': 'VeryHard',
        'max': 'Max'
      };

      // Mapear el modo de entrenamiento del frontend al backend
      const trainingModeMapping: Record<string, string> = {
        'distance': 'Distance',
        'time': 'Time'
      };

      return {
        type: typeMapping[interval.type] || 'Interval',
        repetitions: interval.repetitions,
        distance: interval.distance,
        targetTime: interval.targetTime,
        recoveryTime: interval.recoveryTime,
        paceType: paceTypeMapping[interval.paceType] || 'Fixed',
        pace: interval.pace,
        vo2MaxPercentage: interval.vo2maxPercentage,
        description: interval.description,
        intensity: interval.intensity ? intensityMapping[interval.intensity] : undefined,
        trainingMode: interval.trainingMode ? trainingModeMapping[interval.trainingMode] : undefined,
        duration: interval.duration,
        targetSpeed: interval.targetSpeed,
        orderIndex: index
      };
    });

    // Crear el DTO para el backend
    const backendDto: CreateTrainingSessionDto = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      date: selectedDate, // ISO string format
      category: mapTrainingCategoryToBackend(formData.category), // Convertir a PascalCase
      notes: formData.notes.trim() || undefined,
      athleteIds: selectedAthletes.map(id => parseInt(id)), // Convertir strings a números
      intervals: backendIntervals
    };

    // Enviar al backend
    try {
      const createdSession = await TrainingSessionService.createTrainingSession(backendDto);
      
      // Llamar callback cuando se crea exitosamente (para refrescar listas)
      if (onSessionCreated) {
        onSessionCreated();
      }
      
      // También llamar al callback del componente padre si es necesario (para compatibilidad)
      if (onSubmit) {
        const session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'> = {
          date: selectedDate,
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          athletes: selectedAthletes,
          intervals: allIntervals,
          notes: formData.notes.trim() || undefined
        };
        onSubmit(session);
      }
      
      handleReset();
    } catch (error) {
      // El error ya se maneja automáticamente en el servicio
      console.error('Error al crear sesión:', error);
    }
  };

  const parseSpeed = (speedStr: string): number => {
    // Convertir "4:30" a 4.5 minutos
    const parts = speedStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0]);
      const secs = parseInt(parts[1]);
      return mins + (secs / 60);
    }
    return parseFloat(speedStr) || 0;
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: 'training',
      notes: ''
    });
    setSelectedAthletes([]);
    setIntervals([]);
    setSeries([]);
    setSeriesBuilderMode('simple');
    setCurrentStep(1);
    setSearchTerm('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAthleteToggle = (athleteId: string) => {
    setSelectedAthletes(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  const handleGroupToggle = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const allGroupAthletesSelected = group.athleteIds.every(id => selectedAthletes.includes(id));
    
    if (allGroupAthletesSelected) {
      setSelectedAthletes(prev => prev.filter(id => !group.athleteIds.includes(id)));
    } else {
      setSelectedAthletes(prev => {
        const newSelection = [...prev];
        group.athleteIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleSelectAllAthletes = () => {
    if (!athletes || !Array.isArray(athletes)) {
      return;
    }
    const allSelected = selectedAthletes.length === athletes.length;
    setSelectedAthletes(allSelected ? [] : athletes.map(a => a.id));
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

    // Llenar todos los campos excepto atletas
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      notes: template.notes
    });

    // Copiar intervalos de la plantilla
    setIntervals(template.intervals.map(interval => ({
      ...interval,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    })));

    // Cerrar selector de plantilla
    setShowTemplateSelector(false);
    
    toast.success('Plantilla aplicada correctamente', {
      description: 'Todos los campos excepto atletas han sido llenados. Revisa y ajusta según necesites.'
    });
  };

  const handleAddInterval = (interval: Omit<TrainingInterval, 'id'>) => {
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
    const seriesWithId: SeriesSet = {
      ...newSeries,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setSeries(prev => [...prev, seriesWithId]);
  };

  const handleUpdateSeries = (seriesId: string, updatedSeries: Omit<SeriesSet, 'id'>) => {
    setSeries(prev => prev.map(s => 
      s.id === seriesId ? { ...updatedSeries, id: seriesId } : s
    ));
  };

  const handleDeleteSeries = (seriesId: string) => {
    setSeries(prev => prev.filter(s => s.id !== seriesId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canGoToNextStep = () => {
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

  const isFormValid = formData.name.trim() && selectedAthletes.length > 0 && (intervals.length > 0 || series.length > 0) && athletes && athletes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Nueva Sesión de Entrenamiento
          </DialogTitle>
          <DialogDescription>
            Crear sesión para el {formatDate(selectedDate)}
            {existingSessions.length > 0 && (
              <span className="ml-2">
                • {existingSessions.length} sesión(es) existente(s)
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
                            <span className="ml-1 font-medium">{selectedTemplate.intervals.length}</span>
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
                  <TabsTrigger value="simple">Intervalos Simples</TabsTrigger>
                  <TabsTrigger value="advanced">Series con Intervalos</TabsTrigger>
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
                  <Button
                    onClick={handleSelectAllAthletes}
                    variant="outline"
                    size="sm"
                  >
                    {selectedAthletes.length === athletes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
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
                    const allGroupAthletesSelected = group.athleteIds.every(id => selectedAthletes.includes(id));
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
                            {groupAthletes.map(athlete => (
                              <div
                                key={athlete.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer"
                                onClick={() => handleAthleteToggle(athlete.id)}
                              >
                                <Checkbox 
                                  checked={selectedAthletes.includes(athlete.id)}
                                  onChange={() => handleAthleteToggle(athlete.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{athlete.name}</p>
                                  {athlete.vo2max && (
                                    <p className="text-xs text-muted-foreground">
                                      VO₂ Max: {athlete.vo2max} ml/kg/min
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
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
                    {filteredAthletes.map(athlete => (
                      <Card 
                        key={athlete.id}
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          selectedAthletes.includes(athlete.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleAthleteToggle(athlete.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={selectedAthletes.includes(athlete.id)}
                              onChange={() => handleAthleteToggle(athlete.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{athlete.name}</p>
                              <p className="text-sm text-muted-foreground">{athlete.groupName}</p>
                              {athlete.vo2max && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  VO₂ Max: {athlete.vo2max} ml/kg/min
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Atletas requeridos</p>
                    <p className="text-sm text-amber-700">Debes seleccionar al menos un atleta para crear la sesión</p>
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
                disabled={!isFormValid}
                className="min-w-32 bg-accent hover:bg-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Sesión
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
