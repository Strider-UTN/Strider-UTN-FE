import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { X, Save, Plus, Users, Clock, Target, Zap, Play, Pause, Copy, Lightbulb, UserCheck, FileText, Timer, Edit, Check, Search } from 'lucide-react';
import { AthleteIntervalBuilder } from './AthleteIntervalBuilder';
import { toast } from 'sonner';
import { TrainingInterval } from './utils/athleteIntervalUtils';

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

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athletes: string[]; // IDs de atletas
  intervals: TrainingInterval[];
  volume?: string;
  intensity?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionTemplate {
  id: string;
  name: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  description: string;
  intervals: Omit<TrainingInterval, 'id'>[];
  volume?: string;
  intensity?: string;
}

interface TrainingTemplate {
  id: string;
  name: string;
  description: string;
  type: 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series';
  category: 'Resistencia' | 'Velocidad' | 'Fuerza' | 'Recuperación' | 'Técnica';
  duration: number;
  distance?: number;
  targetPace?: string;
  targetHR?: string;
  intervals: Array<{
    id: string;
    type: 'work' | 'rest';
    duration: number;
    durationUnit: 'time' | 'distance';
    pace: string;
    intensity: string;
    description: string;
    distance?: number;
  }>;
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
}

interface CreateTrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  athletes: Athlete[];
  selectedDate: string;
  existingSessions?: TrainingSession[];
  availableTemplates?: TrainingTemplate[];
  userType?: 'athlete' | 'coach';
}

export function CreateTrainingSessionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  athletes, 
  selectedDate,
  existingSessions = [],
  availableTemplates = [],
  userType = 'coach'
}: CreateTrainingSessionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'training' as 'training' | 'prep_competition' | 'main_competition',
    volume: '',
    intensity: '',
    notes: '',
    intensityPercentage: ''
  });
  
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [intervals, setIntervals] = useState<TrainingInterval[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Plantillas predefinidas
  const sessionTemplates: SessionTemplate[] = [
    {
      id: 'speed-400m',
      name: '8 x 400m',
      category: 'training',
      description: 'Series de 400 metros para mejorar velocidad',
      volume: '6-8 km',
      intensity: 'Alta',
      intervals: [
        {
          type: 'interval',
          repetitions: 8,
          distance: 400,
          targetTime: '1:30',
          recoveryTime: '2:00',
          paceType: 'vo2max_percentage',
          vo2maxPercentage: 95,
          description: '400m a ritmo de 1500m',
          intensity: 'hard'
        }
      ]
    },
    {
      id: 'tempo-2000m',
      name: '4 x 2000m',
      category: 'training',
      description: 'Series de 2000 metros a ritmo tempo',
      volume: '10-12 km',
      intensity: 'Moderada-Alta',
      intervals: [
        {
          type: 'interval',
          repetitions: 4,
          distance: 2000,
          targetTime: '7:30',
          recoveryTime: '3:00',
          paceType: 'vo2max_percentage',
          vo2maxPercentage: 85,
          description: '2000m a ritmo de 10K',
          intensity: 'moderate'
        }
      ]
    },
    {
      id: 'vo2max-1000m',
      name: '6 x 1000m',
      category: 'training',
      description: 'Intervalos de 1000m para VO₂ máximo',
      volume: '8-10 km',
      intensity: 'Muy Alta',
      intervals: [
        {
          type: 'interval',
          repetitions: 6,
          distance: 1000,
          targetTime: '3:45',
          recoveryTime: '2:30',
          paceType: 'vo2max_percentage',
          vo2maxPercentage: 95,
          description: '1000m a ritmo de 3K-5K',
          intensity: 'very_hard'
        }
      ]
    },
    {
      id: 'long-continuous',
      name: 'Carrera Continua Larga',
      category: 'training',
      description: 'Entrenamiento aeróbico continuo',
      volume: '15-20 km',
      intensity: 'Baja',
      intervals: [
        {
          type: 'continuous',
          repetitions: 1,
          distance: 15000,
          recoveryTime: '0:00',
          paceType: 'vo2max_percentage',
          vo2maxPercentage: 70,
          description: 'Ritmo aeróbico confortable',
          intensity: 'easy'
        }
      ]
    }
  ];

  const categoryLabels = {
    'training': 'Entrenamiento',
    'prep_competition': 'Competencia\nPreparatoria',
    'main_competition': 'Competencia Principal'
  };

  const categoryColors = {
    'training': 'bg-blue-100 text-blue-800',
    'prep_competition': 'bg-orange-100 text-orange-800',
    'main_competition': 'bg-red-100 text-red-800'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la sesión es requerido');
      return;
    }

    if (selectedAthletes.length === 0) {
      toast.error('Debe seleccionar al menos un atleta');
      return;
    }

    if (intervals.length === 0) {
      toast.error('Debe agregar al menos un intervalo');
      return;
    }

    const session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'> = {
      date: selectedDate,
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      athletes: selectedAthletes,
      intervals: intervals,
      volume: formData.volume.trim() || undefined,
      intensity: formData.intensity.trim() || undefined,
      notes: formData.notes.trim() || undefined
    };

    onSubmit(session);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: 'training',
      volume: '',
      intensity: '',
      notes: '',
      intensityPercentage: ''
    });
    setSelectedAthletes([]);
    setIntervals([]);
    setActiveTab('basic');
    setTemplateFilter('all');
    setSearchTerm('');
    setShowTemplates(false);
  };

  const handleApplyAdvancedTemplate = (template: TrainingTemplate) => {
    const mappedCategory = template.category === 'Velocidad' ? 'prep_competition' : 'training';
    
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      category: mappedCategory,
      volume: `${template.distance || 0} km`,
      intensity: getDifficultyLabel(template.difficulty),
      notes: template.notes
    }));

    // Convertir intervalos de plantilla avanzada a formato de sesión
    const convertedIntervals: TrainingInterval[] = template.intervals.map((interval, index) => {
      // Manejar el parsing del pace de manera segura
      let paceValue = 4.0; // valor por defecto
      if (interval.pace && interval.pace.includes(':')) {
        try {
          const [mins, secs] = interval.pace.split(':').map(Number);
          paceValue = mins + (secs || 0) / 60;
        } catch (e) {
          console.warn('Error parsing pace:', interval.pace);
        }
      }

      return {
        id: `advanced-template-${Date.now()}-${index}`,
        type: interval.type === 'work' ? 'interval' : 'recovery',
        repetitions: 1,
        distance: interval.distance || (interval.durationUnit === 'distance' ? interval.duration * 1000 : 400),
        targetTime: interval.pace || '4:00',
        recoveryTime: interval.type === 'rest' ? '2:00' : '0:00',
        paceType: 'fixed',
        pace: paceValue,
        description: interval.description,
        intensity: 'moderate'
      };
    });

    setIntervals(convertedIntervals);
    toast.success(`Plantilla avanzada \"${template.name}\" aplicada`);
    setActiveTab('intervals');
    setShowTemplates(false);
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
      // Deseleccionar todos los atletas del grupo
      setSelectedAthletes(prev => prev.filter(id => !group.athleteIds.includes(id)));
    } else {
      // Seleccionar todos los atletas del grupo
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

  const handleApplyTemplate = (template: SessionTemplate) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      category: template.category,
      volume: template.volume || '5-10 km',
      intensity: template.intensity || 'Moderada'
    }));

    // Crear intervalos con IDs únicos
    const templateIntervals: TrainingInterval[] = template.intervals.map((interval, index) => ({
      ...interval,
      id: `template-${Date.now()}-${index}`
    }));

    setIntervals(templateIntervals);
    toast.success(`Plantilla \"${template.name}\" aplicada`);
    setActiveTab('intervals');
    setShowTemplates(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isFormValid = formData.name.trim() && selectedAthletes.length > 0 && intervals.length > 0 && athletes && athletes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-accent" />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="athletes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Atletas
            </TabsTrigger>
            <TabsTrigger value="intervals" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Intervalos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Información Básica</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Completa los datos básicos de la sesión de entrenamiento
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-name">Nombre de la Sesión</Label>
                  <Input
                    id="session-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Intervalos 8x400m"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="session-description">Descripción</Label>
                  <Textarea
                    id="session-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción detallada del entrenamiento..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="session-category">Categoría</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: 'training' | 'prep_competition' | 'main_competition') => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Entrenamiento</SelectItem>
                      <SelectItem value="prep_competition">Competencia Preparatoria</SelectItem>
                      <SelectItem value="main_competition">Competencia Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-volume">Volumen Estimado</Label>
                  <Input
                    id="session-volume"
                    value={formData.volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                    placeholder="Ej: 8-10 km"
                  />
                </div>

                <div>
                  <Label htmlFor="session-intensity">Intensidad</Label>
                  <Input
                    id="session-intensity"
                    value={formData.intensity}
                    onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                    placeholder="Ej: Alta, Moderada, Baja"
                  />
                </div>

                <div>
                  <Label htmlFor="session-notes">Notas Adicionales</Label>
                  <Textarea
                    id="session-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones especiales, consideraciones..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Sección de plantillas dentro de básico */}
            <div className="space-y-4">
              {!showTemplates ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">¿Necesitas inspiración?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comienza rápidamente con plantillas predefinidas o personalizadas
                  </p>
                  <Button 
                    onClick={() => setShowTemplates(true)}
                    variant="outline"
                    className="mx-auto"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    O puedes usar plantillas
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Plantillas Disponibles</h4>
                      <p className="text-sm text-muted-foreground">
                        Selecciona una plantilla para comenzar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={templateFilter} onValueChange={setTemplateFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="predefined">Predefinidas</SelectItem>
                          <SelectItem value="custom">Personalizadas</SelectItem>
                          <SelectItem value="favorites">Favoritas</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => setShowTemplates(false)}
                        variant="ghost" 
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Plantillas personalizadas */}
                  {availableTemplates.length > 0 && (templateFilter === 'all' || templateFilter === 'custom' || templateFilter === 'favorites') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          Plantillas Personalizadas
                        </CardTitle>
                        <CardDescription>
                          Plantillas creadas por ti y tu equipo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availableTemplates
                            .filter(template => {
                              if (templateFilter === 'favorites') return template.isFavorite;
                              return true;
                            })
                            .map(template => (
                              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/10">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{template.name}</h4>
                                        {template.isFavorite && (
                                          <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
                                            ⭐ Favorita
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {template.description}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline" className="text-xs">{template.type}</Badge>
                                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                    <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                                      {getDifficultyLabel(template.difficulty)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm text-muted-foreground mb-3">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {template.duration} min
                                      </span>
                                      {template.distance && (
                                        <span className="flex items-center">
                                          <Target className="w-3 h-3 mr-1" />
                                          {template.distance} km
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center">
                                      <Zap className="w-3 h-3 mr-1" />
                                      {template.intervals.length} intervalos
                                    </div>
                                  </div>

                                  <Button 
                                    onClick={() => handleApplyAdvancedTemplate(template)}
                                    className="w-full"
                                    variant="outline"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Usar Plantilla
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Plantillas predefinidas */}
                  {(templateFilter === 'all' || templateFilter === 'predefined') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2" />
                          Plantillas Predefinidas
                        </CardTitle>
                        <CardDescription>
                          Plantillas básicas para diferentes tipos de entrenamiento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sessionTemplates.map(template => (
                            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium">{template.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {template.description}
                                    </p>
                                  </div>
                                  <Badge className={`${categoryColors[template.category]} whitespace-pre-line text-center text-xs`}>
                                    {categoryLabels[template.category]}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Target className="w-3 h-3 mr-1" />
                                    {template.intervals.length} intervalos
                                  </div>
                                  {template.volume && (
                                    <div className="flex items-center">
                                      <Target className="w-3 h-3 mr-1" />
                                      Volumen: {template.volume}
                                    </div>
                                  )}
                                  {template.intensity && (
                                    <div className="flex items-center">
                                      <Zap className="w-3 h-3 mr-1" />
                                      Intensidad: {template.intensity}
                                    </div>
                                  )}
                                </div>

                                <Button 
                                  onClick={() => handleApplyTemplate(template)}
                                  className="w-full mt-4"
                                  variant="outline"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Usar Plantilla
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="athletes" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Selección de Atletas</h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona los atletas que participarán en esta sesión
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleSelectAllAthletes}
                  variant="outline"
                  size="sm"
                >
                  {selectedAthletes.length === athletes?.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </Button>
                <Badge variant="secondary">
                  {selectedAthletes.length} seleccionado{selectedAthletes.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

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
                              checked={
                                allGroupAthletesSelected
                                  ? true
                                  : (someGroupAthletesSelected ? 'indeterminate' : false)
                              }
                              onCheckedChange={() => handleGroupToggle(group.id)}
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
                                onCheckedChange={() => handleAthleteToggle(athlete.id)}
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
                            <h4 className="font-medium">{athlete.name}</h4>
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

            {/* Estado vacío */}
            {(!athletes || athletes.length === 0) && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No hay atletas disponibles</h3>
                <p className="text-muted-foreground">
                  Primero debes agregar atletas a tu sede para poder crear sesiones.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="intervals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Constructor de Intervalos</h3>
                <p className="text-sm text-muted-foreground">
                  Define los intervalos y estructura de la sesión
                </p>
              </div>
              <Badge variant="secondary">
                {intervals.length} intervalo{intervals.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <AthleteIntervalBuilder
              intervals={intervals}
              onAddInterval={handleAddInterval}
              onUpdateInterval={handleUpdateInterval}
              onDeleteInterval={handleDeleteInterval}
              //athletes={athletes?.filter(athlete => selectedAthletes.includes(athlete.id)) || []}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {intervals.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {intervals.length} intervalo{intervals.length !== 1 ? 's' : ''} definido{intervals.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {selectedAthletes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedAthletes.length} atleta{selectedAthletes.length !== 1 ? 's' : ''} seleccionado{selectedAthletes.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="min-w-32"
            >
              <Save className="w-4 h-4 mr-2" />
              Crear Sesión
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}