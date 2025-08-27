import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingInterval {
  id: string;
  type: 'work' | 'rest';
  duration: number;
  durationUnit: 'time' | 'distance';
  pace: string;
  intensity: string;
  description: string;
  distance?: number;
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

export function TemplateManagement() {
  const [templates, setTemplates] = useState<TrainingTemplate[]>([
    {
      id: '1',
      name: 'Intervalos 5x1000m',
      description: 'Sesión de velocidad con 5 repeticiones de 1000m a ritmo de 5K',
      type: 'Intervalos',
      category: 'Velocidad',
      duration: 45,
      distance: 8,
      targetPace: '4:30',
      targetHR: '85-90% FCMax',
      intervals: [
        {
          id: '1',
          type: 'work',
          duration: 4,
          durationUnit: 'time',
          pace: '4:30',
          intensity: '85-90% FCMax',
          description: '1000m a ritmo de 5K',
          distance: 1
        },
        {
          id: '2',
          type: 'rest',
          duration: 2,
          durationUnit: 'time',
          pace: '6:00',
          intensity: '60-70% FCMax',
          description: 'Trote suave de recuperación'
        }
      ],
      warmUp: {
        duration: 15,
        pace: '5:30',
        description: 'Trote suave + ejercicios de activación'
      },
      coolDown: {
        duration: 10,
        pace: '6:00',
        description: 'Trote suave + estiramientos'
      },
      notes: 'Mantener ritmo constante en las series. Si no puedes completar todas las series al ritmo objetivo, reduce la intensidad.',
      difficulty: 4,
      isFavorite: true,
      createdAt: '2024-01-10',
      lastUsed: '2024-01-20',
      useCount: 15,
      tags: ['Velocidad', '5K', 'Pista']
    },
    {
      id: '2',
      name: 'Trote Base 45min',
      description: 'Carrera continua a ritmo aeróbico para desarrollar resistencia base',
      type: 'Continuo',
      category: 'Resistencia',
      duration: 45,
      distance: 8,
      targetPace: '5:30',
      targetHR: '70-80% FCMax',
      intervals: [],
      warmUp: {
        duration: 5,
        pace: '6:00',
        description: 'Inicio progresivo'
      },
      coolDown: {
        duration: 5,
        pace: '6:00',
        description: 'Finalización progresiva'
      },
      notes: 'Ritmo conversacional durante toda la sesión. Debe sentirse cómodo y controlado.',
      difficulty: 2,
      isFavorite: false,
      createdAt: '2024-01-05',
      lastUsed: '2024-01-18',
      useCount: 8,
      tags: ['Base', 'Aeróbico', 'Fácil']
    },
    {
      id: '3',
      name: 'Tempo 20min',
      description: 'Carrera a ritmo de umbral anaeróbico durante 20 minutos',
      type: 'Tempo',
      category: 'Resistencia',
      duration: 40,
      distance: 7,
      targetPace: '4:45',
      targetHR: '80-85% FCMax',
      intervals: [
        {
          id: '1',
          type: 'work',
          duration: 20,
          durationUnit: 'time',
          pace: '4:45',
          intensity: '80-85% FCMax',
          description: 'Bloque tempo a ritmo de media maratón',
          distance: 4.2
        }
      ],
      warmUp: {
        duration: 15,
        pace: '5:30',
        description: 'Trote progresivo'
      },
      coolDown: {
        duration: 10,
        pace: '6:00',
        description: 'Trote de vuelta a la calma'
      },
      notes: 'Ritmo sostenido pero controlado. Debe ser un esfuerzo cómodamente duro.',
      difficulty: 3,
      isFavorite: true,
      createdAt: '2024-01-08',
      lastUsed: '2024-01-19',
      useCount: 12,
      tags: ['Tempo', 'Umbral', 'Media']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);

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
    const newTemplate: TrainingTemplate = {
      ...templateData,
      id: `template_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      useCount: 0,
      isFavorite: false
    };

    setTemplates(prev => [newTemplate, ...prev]);
    toast.success('Plantilla creada exitosamente', {
      description: `"${templateData.name}" está lista para usar`
    });
  };

  const handleEditTemplate = (templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'>) => {
    if (!editingTemplate) return;

    const updatedTemplate: TrainingTemplate = {
      ...templateData,
      id: editingTemplate.id,
      createdAt: editingTemplate.createdAt,
      useCount: editingTemplate.useCount
    };

    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    setEditingTemplate(null);
    toast.success('Plantilla actualizada exitosamente');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Plantilla eliminada', {
      description: `"${template?.name}" ha sido eliminada`
    });
  };

  const handleDuplicateTemplate = (template: TrainingTemplate) => {
    const duplicatedTemplate: TrainingTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copia)`,
      createdAt: new Date().toISOString().split('T')[0],
      useCount: 0,
      isFavorite: false,
      lastUsed: undefined
    };

    setTemplates(prev => [duplicatedTemplate, ...prev]);
    toast.success('Plantilla duplicada exitosamente');
  };

  const handleToggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    ));
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
                  <SelectItem value="Resistencia">Resistencia</SelectItem>
                  <SelectItem value="Velocidad">Velocidad</SelectItem>
                  <SelectItem value="Fuerza">Fuerza</SelectItem>
                  <SelectItem value="Recuperación">Recuperación</SelectItem>
                  <SelectItem value="Técnica">Técnica</SelectItem>
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
                    <Badge variant="outline">{template.type}</Badge>
                    <Badge variant="outline">{template.category}</Badge>
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
                    <Badge variant="outline">{template.type}</Badge>
                    <Badge variant="outline">{template.category}</Badge>
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
      />
    </div>
  );
}