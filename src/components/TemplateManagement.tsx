import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CreateTemplateModal } from './CreateTemplateModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Target, 
  Zap, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Star,
  StarOff,
  Timer,
  Activity,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { TrainingTemplateService, CreateTrainingTemplateDto, TrainingTemplateResponseDto } from '../services/trainingTemplateService';
import { mapTrainingTypeFromBackend, mapTrainingTypeToBackend } from '../utils/trainingTypeMapper';
import { mapDifficultyFromBackend } from '../utils/difficultyMapper';
import { mapIntervalIntensityToBackend, mapIntervalIntensityFromBackend } from '../utils/intervalIntensityMapper';
import { mapTrainingCategoryFromBackend, mapTrainingCategoryToBackend } from '../utils/trainingCategoryMapper';
import { translateCategory, translateType } from '../utils/templateTranslations';

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
  paceType: 'fixed' | 'vo2max_percentage'; // Tipo de velocidad
  targetSpeed?: string; // ritmo en min/km - solo para fixed
  vo2maxPercentage?: number; // Porcentaje de VO2Max - solo para vo2max_percentage
  description?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
}

interface SeriesSet {
  id: string;
  name: string;
  repetitions: number;
  intervals: IntervalInSeries[];
  recoveryBetweenSets: string;
  notes?: string;
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
  intervals: TrainingInterval[];
  warmUp?: {
    duration: number;
    pace: string;
    description: string;
  };
  coolDown?: {
    duration: number;
    pace: string;
    description: string;
  };
  notes: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
  tags: string[];
  structureType: 'simple' | 'advanced';
}


// Función helper para convertir del backend al frontend
function convertBackendToFrontend(backendTemplate: TrainingTemplateResponseDto): TrainingTemplate {
  const series: SeriesSet[] = (backendTemplate.series || []).map((series, seriesIndex) => ({
    id: series.id?.toString() || `series-${seriesIndex}-${Date.now()}`,
    name: series.name,
    repetitions: series.repetitions,
    recoveryBetweenSets: series.recoveryBetweenSets,
    notes: series.notes || undefined,
    intervals: (series.intervals || []).map((interval, intervalIndex) => {
      const intervalAny = interval as any; // Para acceder a vo2MaxPercentage del backend
      const paceTypeStr = String(interval.paceType || '');
      const isVo2MaxPercentage = paceTypeStr.toLowerCase() === 'vo2maxpercentage' || paceTypeStr === 'vo2MaxPercentage';
      return {
        id: interval.id?.toString() || `interval-${seriesIndex}-${intervalIndex}-${Date.now()}`,
        trainingMode: (interval.trainingMode?.toLowerCase() as 'distance' | 'time') || (interval.duration ? 'time' : 'distance'),
        repetitions: interval.repetitions,
        distance: interval.distance || undefined,
        duration: interval.duration || interval.targetTime || undefined,
        targetTime: interval.targetTime || undefined,
        paceType: (isVo2MaxPercentage ? 'vo2max_percentage' : 'fixed') as 'fixed' | 'vo2max_percentage',
        targetSpeed: isVo2MaxPercentage ? undefined : (interval.targetSpeed || ''),
        vo2maxPercentage: isVo2MaxPercentage ? (intervalAny.vo2MaxPercentage ?? intervalAny.vo2maxPercentage) : undefined,
        description: interval.description || '',
        intensity: mapIntervalIntensityFromBackend(interval.intensity) || 'moderate',
        recoveryTime: interval.recoveryTime || '00:00'
      };
    })
  }));

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
    series,
    intervals: flattenSeries(series),
    warmUp: backendTemplate.warmUpDuration && backendTemplate.warmUpPace ? {
      duration: backendTemplate.warmUpDuration,
      pace: backendTemplate.warmUpPace,
      description: backendTemplate.warmUpDescription || ''
    } : undefined,
    coolDown: backendTemplate.coolDownDuration && backendTemplate.coolDownPace ? {
      duration: backendTemplate.coolDownDuration,
      pace: backendTemplate.coolDownPace,
      description: backendTemplate.coolDownDescription || ''
    } : undefined,
    notes: backendTemplate.notes,
    difficulty: mapDifficultyFromBackend(backendTemplate.difficulty),
    isFavorite: backendTemplate.isFavorite,
    createdAt: new Date(backendTemplate.createdAt).toISOString().split('T')[0],
    lastUsed: backendTemplate.lastUsed ? new Date(backendTemplate.lastUsed).toISOString().split('T')[0] : undefined,
    useCount: backendTemplate.useCount,
    tags: backendTemplate.tags || [],
    structureType: backendTemplate.structureType ?? 'simple'
  };
}

function flattenSeries(series: SeriesSet[]): TrainingInterval[] {
  const flattened: TrainingInterval[] = [];

  series.forEach(set => {
    set.intervals.forEach((interval, intervalIndex) => {
      flattened.push({
        id: `${set.id}-${interval.id}`,
        type: 'interval',
        repetitions: interval.repetitions,
        distance: interval.trainingMode === 'distance' ? interval.distance || 0 : 0,
        targetTime: interval.trainingMode === 'time' ? interval.duration : undefined,
        recoveryTime: interval.recoveryTime || '00:00',
        paceType: 'fixed',
        pace: interval.targetSpeed ? parseSpeedValue(interval.targetSpeed) : undefined,
        vo2maxPercentage: undefined,
        description: interval.description,
        intensity: mapIntervalIntensityFromBackend(interval.intensity) || 'moderate',
        trainingMode: interval.trainingMode,
        duration: interval.duration,
        targetSpeed: interval.targetSpeed
      });
    });
  });

  return flattened;
}

const parseSpeedValue = (speedStr: string): number | undefined => {
  if (!speedStr) return undefined;
  const parts = speedStr.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (Number.isFinite(mins) && Number.isFinite(secs)) {
      return mins + secs / 60;
    }
  }
  const value = parseFloat(speedStr);
  return Number.isFinite(value) ? value : undefined;
};

export function TemplateManagement() {
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);

  // Cargar plantillas desde el backend
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const backendTemplates = await TrainingTemplateService.getAllTrainingTemplates();
      const frontendTemplates = backendTemplates.map(convertBackendToFrontend);
      setTemplates(frontendTemplates);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      // Mantener templates vacío en caso de error
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const favoriteTemplates = filteredTemplates.filter(t => t.isFavorite);
  const regularTemplates = filteredTemplates.filter(t => !t.isFavorite);

  const handleCreateTemplate = (templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount' | 'isFavorite'>) => {
    // Este método ya no se usa directamente, el servicio maneja la creación
    // Se mantiene para compatibilidad con el callback
    // Recargar las plantillas después de crear
    loadTemplates();
  };

  const handleEditTemplate = async (templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'>) => {
    if (!editingTemplate) return;

    // El servicio ya maneja la actualización, solo recargamos las plantillas
    // Este callback se mantiene para compatibilidad pero ya no es necesario
    // porque el servicio maneja todo
    await loadTemplates();
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      await TrainingTemplateService.deleteTrainingTemplate(parseInt(templateId));
      // Recargar las plantillas después de eliminar
      await loadTemplates();
    } catch (error) {
      // El error ya se maneja automáticamente en el servicio
      console.error('Error al eliminar plantilla:', error);
    }
  };

  const handleDuplicateTemplate = async (template: TrainingTemplate) => {
    try {
      const dto: CreateTrainingTemplateDto = {
        name: `${template.name} (Copia)` ,
        description: template.description,
        type: mapTrainingTypeToBackend(template.type) as any,
        category: mapTrainingCategoryToBackend(template.category),
        duration: template.duration,
        distance: template.distance,
        targetPace: template.targetPace,
        targetHR: template.targetHR,
        notes: template.notes || '',
        difficulty: template.difficulty,
        tags: template.tags || [],
        warmUpDuration: template.warmUp?.duration,
        warmUpPace: template.warmUp?.pace,
        warmUpDescription: template.warmUp?.description,
        coolDownDuration: template.coolDown?.duration,
        coolDownPace: template.coolDown?.pace,
        coolDownDescription: template.coolDown?.description,
        series: template.series.map((series, seriesIndex) => ({
          name: series.name,
          repetitions: series.repetitions,
          recoveryBetweenSets: series.recoveryBetweenSets,
          orderIndex: seriesIndex,
          notes: series.notes,
          intervals: series.intervals.map((interval, intervalIndex) => ({
            type: 'Interval',
            repetitions: interval.repetitions,
            distance: interval.trainingMode === 'distance' ? interval.distance || 0 : 0,
            targetTime: interval.trainingMode === 'time' ? interval.duration : undefined,
            recoveryTime: '00:00',
            paceType: 'Fixed',
            pace: interval.targetSpeed ? parseSpeedValue(interval.targetSpeed) : undefined,
            vo2MaxPercentage: undefined,
            description: interval.description,
            intensity: mapIntervalIntensityFromBackend(interval.intensity),
            trainingMode: interval.trainingMode === 'time' ? 'Time' : 'Distance',
            duration: interval.duration,
            targetSpeed: interval.targetSpeed,
            orderIndex: intervalIndex
          }))
        }))
      };

      await TrainingTemplateService.createTrainingTemplate(dto);
      await loadTemplates();
    } catch (error) {
      console.error('Error al duplicar plantilla:', error);
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      // Llamar al servicio para actualizar el estado de favorito en el backend
      // El backend hace el toggle automáticamente
      const updatedTemplate = await TrainingTemplateService.toggleFavoriteTemplate(
        parseInt(templateId),
        template.isFavorite
      );

      // Actualizar el estado local con la respuesta del backend
      // Convertir la respuesta del backend al formato del frontend
      const frontendTemplate = convertBackendToFrontend(updatedTemplate);
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? frontendTemplate : t
      ));
    } catch (error) {
      // El error ya se maneja automáticamente en el servicio
      console.error('Error al cambiar estado de favorito:', error);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 4: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 5: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Muy Fácil';
      case 2: return 'Fácil';
      case 3: return 'Moderado';
      case 4: return 'Difícil';
      case 5: return 'Muy Difícil';
      default: return 'Sin definir';
    }
  };

  // Mostrar loading solo al inicio
  if (isLoading && templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Cargando plantillas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Plantillas de Entrenamientos</h2>
          <p className="text-muted-foreground">
            Crea y gestiona plantillas reutilizables para tus sesiones de entrenamiento
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Tipos</SelectItem>
                  <SelectItem value="Continuo">Continuo</SelectItem>
                  <SelectItem value="Intervalos">Intervalos</SelectItem>
                  <SelectItem value="Tempo">Tempo</SelectItem>
                  <SelectItem value="Fartlek">Fartlek</SelectItem>
                  <SelectItem value="Recuperación">Recuperación</SelectItem>
                  <SelectItem value="Cuestas">Cuestas</SelectItem>
                  <SelectItem value="Series">Series</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  <SelectItem value="training">Entrenamiento</SelectItem>
                  <SelectItem value="prep_competition">Competencia Preparatoria</SelectItem>
                  <SelectItem value="main_competition">Competencia Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Total Plantillas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favoriteTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Favoritas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {templates.reduce((acc, t) => acc + t.useCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Usos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        

      </div>

      {/* Lista de plantillas favoritas */}
      {favoriteTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3>Plantillas Favoritas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteTemplates.map((template) => (
              <Card key={template.id} className="border-2 border-yellow-200 bg-yellow-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFavorite(template.id)}>
                          <StarOff className="w-4 h-4 mr-2" />
                          Quitar de Favoritos
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{translateType(template.type)}</Badge>
                    <Badge variant="outline">{translateCategory(template.category)}</Badge>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {getDifficultyLabel(template.difficulty)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{template.duration} min</span>
                    </div>
                    {template.distance && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span>{template.distance} km</span>
                      </div>
                    )}
                    {template.targetPace && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        <span>{template.targetPace}/km</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                      <span>{template.useCount} usos</span>
                    </div>
                  </div>
                  
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lista de plantillas regulares */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3>Todas las Plantillas</h3>
          <span className="text-sm text-muted-foreground">
            {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {templates.length === 0 
                  ? 'No tienes plantillas creadas aún'
                  : 'No se encontraron plantillas con los filtros aplicados'
                }
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {templates.length === 0 
                  ? 'Crea tu primera plantilla para reutilizar configuraciones de entrenamientos'
                  : 'Intenta cambiar los filtros o el término de búsqueda'
                }
              </p>
              {templates.length === 0 && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Plantilla
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFavorite(template.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          Agregar a Favoritos
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{translateType(template.type)}</Badge>
                    <Badge variant="outline">{translateCategory(template.category)}</Badge>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {getDifficultyLabel(template.difficulty)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{template.duration} min</span>
                    </div>
                    {template.distance && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span>{template.distance} km</span>
                      </div>
                    )}
                    {template.targetPace && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        <span>{template.targetPace}/km</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                      <span>{template.useCount} usos</span>
                    </div>
                  </div>
                  
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar plantilla */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen || editingTemplate !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleEditTemplate : handleCreateTemplate}
        template={editingTemplate}
        mode={editingTemplate ? 'edit' : 'create'}
        onTemplateCreated={loadTemplates}
      />
    </div>
  );
}