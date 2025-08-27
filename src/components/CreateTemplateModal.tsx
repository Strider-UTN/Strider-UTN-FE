import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { IntervalBuilder, TrainingInterval } from './IntervalBuilder';
import { 
  Plus, 
  X, 
  Clock, 
  Target, 
  Zap, 
  Timer,
  Activity,
  Star,
  Tag,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

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
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  template?: TrainingTemplate | null;
  mode: 'create' | 'edit';
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
  mode
}: CreateTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Continuo' as TrainingTemplate['type'],
    category: 'Resistencia' as TrainingTemplate['category'],
    duration: 45,
    distance: 0,
    targetPace: '',
    targetHR: '',
    notes: '',
    difficulty: 3 as TrainingTemplate['difficulty'],
    isFavorite: false
  });

  const [intervals, setIntervals] = useState<TrainingInterval[]>([]);
  const [warmUp, setWarmUp] = useState<TrainingTemplate['warmUp']>();
  const [coolDown, setCoolDown] = useState<TrainingTemplate['coolDown']>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [includeWarmUp, setIncludeWarmUp] = useState(false);
  const [includeCoolDown, setIncludeCoolDown] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Popular tags para sugerencias
  const popularTags = [
    'Velocidad', 'Resistencia', 'Fuerza', 'Técnica', 'Recuperación',
    '5K', '10K', 'Media', 'Maratón', 'Pista', 'Ruta', 'Sendero',
    'Base', 'Tempo', 'Umbral', 'VO2Max', 'Aeróbico', 'Anaeróbico'
  ];

  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        name: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        duration: template.duration,
        distance: template.distance || 0,
        targetPace: template.targetPace || '',
        targetHR: template.targetHR || '',
        notes: template.notes,
        difficulty: template.difficulty,
        isFavorite: template.isFavorite
      });
      setIntervals(template.intervals);
      setWarmUp(template.warmUp);
      setCoolDown(template.coolDown);
      setTags(template.tags);
      setIncludeWarmUp(!!template.warmUp);
      setIncludeCoolDown(!!template.coolDown);
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        type: 'Continuo',
        category: 'Resistencia',
        duration: 45,
        distance: 0,
        targetPace: '',
        targetHR: '',
        notes: '',
        difficulty: 3,
        isFavorite: false
      });
      setIntervals([]);
      setWarmUp(undefined);
      setCoolDown(undefined);
      setTags([]);
      setNewTag('');
      setIncludeWarmUp(false);
      setIncludeCoolDown(false);
      setActiveTab('basic');
    }
  }, [template, mode, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
      toast.success(`Etiqueta "${tag}" agregada`);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la plantilla es requerido');
      return false;
    }
    
    if (!formData.description.trim()) {
      toast.error('La descripción de la plantilla es requerida');
      return false;
    }
    
    if (formData.duration <= 0) {
      toast.error('La duración debe ser mayor a 0');
      return false;
    }

    // Validate intervals for interval-based workouts
    if (['Intervalos', 'Fartlek', 'Series'].includes(formData.type) && intervals.length === 0) {
      toast.error('Los entrenamientos de intervalos requieren al menos un intervalo');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      category: formData.category,
      duration: formData.duration,
      distance: formData.distance > 0 ? formData.distance : undefined,
      targetPace: formData.targetPace.trim() || undefined,
      targetHR: formData.targetHR.trim() || undefined,
      intervals,
      warmUp: includeWarmUp ? warmUp : undefined,
      coolDown: includeCoolDown ? coolDown : undefined,
      notes: formData.notes.trim(),
      difficulty: formData.difficulty,
      isFavorite: formData.isFavorite,
      tags,
      lastUsed: template?.lastUsed
    };

    onSave(templateData);
    onClose();
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-600';
      case 2: return 'text-blue-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-orange-600';
      case 5: return 'text-red-600';
      default: return 'text-gray-600';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="w-5 h-5" />
                Crear Nueva Plantilla
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Editar Plantilla
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crea una plantilla de entrenamiento que podrás reutilizar en futuras sesiones'
              : 'Modifica los detalles de tu plantilla de entrenamiento'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="intervals">Intervalos</TabsTrigger>
            <TabsTrigger value="phases">Fases</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          </TabsList>

          {/* Información Básica */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Plantilla *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Intervalos 5x1000m"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Entrenamiento *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Continuo">Continuo</SelectItem>
                    <SelectItem value="Intervalos">Intervalos</SelectItem>
                    <SelectItem value="Tempo">Tempo</SelectItem>
                    <SelectItem value="Fartlek">Fartlek</SelectItem>
                    <SelectItem value="Recuperación">Recuperación</SelectItem>
                    <SelectItem value="Cuestas">Cuestas</SelectItem>
                    <SelectItem value="Series">Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe el objetivo y características de este entrenamiento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resistencia">Resistencia</SelectItem>
                    <SelectItem value="Velocidad">Velocidad</SelectItem>
                    <SelectItem value="Fuerza">Fuerza</SelectItem>
                    <SelectItem value="Recuperación">Recuperación</SelectItem>
                    <SelectItem value="Técnica">Técnica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificultad</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <Badge className={`${getDifficultyColor(formData.difficulty)} bg-transparent border`}>
                    {getDifficultyLabel(formData.difficulty)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distance">Distancia (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetPace">Ritmo Objetivo</Label>
                <Input
                  id="targetPace"
                  value={formData.targetPace}
                  onChange={(e) => handleInputChange('targetPace', e.target.value)}
                  placeholder="4:30/km"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetHR">Frecuencia Cardíaca Objetivo</Label>
              <Input
                id="targetHR"
                value={formData.targetHR}
                onChange={(e) => handleInputChange('targetHR', e.target.value)}
                placeholder="80-85% FCMax o 150-160 bpm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="favorite"
                checked={formData.isFavorite}
                onCheckedChange={(checked) => handleInputChange('isFavorite', checked)}
              />
              <Label htmlFor="favorite" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Marcar como favorita
              </Label>
            </div>
          </TabsContent>

          {/* Intervalos */}
          <TabsContent value="intervals" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Configuración de Intervalos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Define los intervalos de trabajo y descanso para tu entrenamiento
                </p>
              </div>
            </div>

            {['Intervalos', 'Fartlek', 'Series'].includes(formData.type) ? (
              <IntervalBuilder
                existingIntervals={intervals}
                onIntervalsChange={setIntervals}
                trainingType={formData.type}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Los intervalos solo están disponibles para entrenamientos de tipo: 
                    Intervalos, Fartlek o Series
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cambia el tipo de entrenamiento en la pestaña "Básico" para configurar intervalos
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calentamiento y Enfriamiento */}
          <TabsContent value="phases" className="space-y-4">
            <div>
              <h3 className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5" />
                Fases del Entrenamiento
              </h3>
              <p className="text-sm text-muted-foreground">
                Configura el calentamiento y enfriamiento para tu entrenamiento
              </p>
            </div>

            {/* Calentamiento */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Calentamiento</CardTitle>
                  <Switch
                    checked={includeWarmUp}
                    onCheckedChange={setIncludeWarmUp}
                  />
                </div>
                <CardDescription>
                  Fase preparatoria antes del entrenamiento principal
                </CardDescription>
              </CardHeader>
              {includeWarmUp && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={warmUp?.duration || 10}
                        onChange={(e) => setWarmUp(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value) || 10,
                          pace: prev?.pace || '6:00',
                          description: prev?.description || ''
                        }))}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ritmo</Label>
                      <Input
                        value={warmUp?.pace || '6:00'}
                        onChange={(e) => setWarmUp(prev => ({
                          ...prev,
                          duration: prev?.duration || 10,
                          pace: e.target.value,
                          description: prev?.description || ''
                        }))}
                        placeholder="6:00/km"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={warmUp?.description || ''}
                      onChange={(e) => setWarmUp(prev => ({
                        ...prev,
                        duration: prev?.duration || 10,
                        pace: prev?.pace || '6:00',
                        description: e.target.value
                      }))}
                      placeholder="Trote suave progresivo + ejercicios de activación"
                      rows={2}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Enfriamiento */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Enfriamiento</CardTitle>
                  <Switch
                    checked={includeCoolDown}
                    onCheckedChange={setIncludeCoolDown}
                  />
                </div>
                <CardDescription>
                  Fase de recuperación después del entrenamiento principal
                </CardDescription>
              </CardHeader>
              {includeCoolDown && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={coolDown?.duration || 10}
                        onChange={(e) => setCoolDown(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value) || 10,
                          pace: prev?.pace || '6:30',
                          description: prev?.description || ''
                        }))}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ritmo</Label>
                      <Input
                        value={coolDown?.pace || '6:30'}
                        onChange={(e) => setCoolDown(prev => ({
                          ...prev,
                          duration: prev?.duration || 10,
                          pace: e.target.value,
                          description: prev?.description || ''
                        }))}
                        placeholder="6:30/km"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={coolDown?.description || ''}
                      onChange={(e) => setCoolDown(prev => ({
                        ...prev,
                        duration: prev?.duration || 10,
                        pace: prev?.pace || '6:30',
                        description: e.target.value
                      }))}
                      placeholder="Trote suave + estiramientos estáticos"
                      rows={2}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Avanzado */}
          <TabsContent value="advanced" className="space-y-4">
            <div>
              <h3 className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5" />
                Configuración Avanzada
              </h3>
              <p className="text-sm text-muted-foreground">
                Etiquetas, notas y configuraciones adicionales
              </p>
            </div>

            {/* Etiquetas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Etiquetas</CardTitle>
                <CardDescription>
                  Agrega etiquetas para organizar y buscar tus plantillas más fácilmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nueva etiqueta..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={() => handleAddTag()} disabled={!newTag.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Etiquetas populares:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularTags
                      .filter(tag => !tags.includes(tag))
                      .slice(0, 8)
                      .map((tag, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTag(tag)}
                          className="text-xs"
                        >
                          + {tag}
                        </Button>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas del Entrenador</CardTitle>
                <CardDescription>
                  Instrucciones, consejos o consideraciones especiales para este entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Ej: Mantener ritmo constante durante todas las series. Si no se puede completar al ritmo objetivo, reducir la intensidad..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Crear Plantilla' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}