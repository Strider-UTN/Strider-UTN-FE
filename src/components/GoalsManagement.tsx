import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Target, 
  TrendingUp, 
  Clock, 
  Award, 
  Edit, 
  Trash2, 
  CheckCircle2,
  Timer,
  Ruler,
  Heart,
  Scale,
  Trophy,
  Star,
  AlertCircle,
  Zap,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'Tiempo' | 'Distancia' | 'VO2Max' | 'Peso' | 'Velocidad' | 'Resistencia' | 'Técnica' | 'Otro';
  priority: 'Baja' | 'Media' | 'Alta';
  timeframe: 'Corto Plazo' | 'Medio Plazo' | 'Largo Plazo';
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: 'En Progreso' | 'Completado' | 'Pausado' | 'Vencido';
  reminderEnabled: boolean;
  reminderDays: number;
  notes: string;
  createdAt: Date;
  completedAt?: Date;
}

const GOAL_CATEGORIES = [
  { value: 'Tiempo', label: 'Tiempo', icon: Timer, unit: 'min' },
  { value: 'Distancia', label: 'Distancia', icon: Ruler, unit: 'km' },
  { value: 'VO2Max', label: 'VO₂ Max', icon: Heart, unit: 'ml/kg/min' },
  { value: 'Peso', label: 'Peso Corporal', icon: Scale, unit: 'kg' },
  { value: 'Velocidad', label: 'Velocidad', icon: Zap, unit: 'km/h' },
  { value: 'Resistencia', label: 'Resistencia', icon: BarChart3, unit: 'min' },
  { value: 'Técnica', label: 'Técnica', icon: Star, unit: 'puntos' },
  { value: 'Otro', label: 'Personalizado', icon: Target, unit: '' }
];

const GOAL_TEMPLATES = [
  {
    title: 'Mejorar 5K',
    description: 'Reducir tiempo en 5 kilómetros',
    category: 'Tiempo' as const,
    targetValue: 20,
    unit: 'min',
    timeframe: 'Medio Plazo' as const
  },
  {
    title: 'Aumentar VO₂ Max',
    description: 'Mejorar capacidad aeróbica máxima',
    category: 'VO2Max' as const,
    targetValue: 55,
    unit: 'ml/kg/min',
    timeframe: 'Largo Plazo' as const
  },
  {
    title: 'Correr Maratón',
    description: 'Completar 42.195 km en menos de 4 horas',
    category: 'Tiempo' as const,
    targetValue: 240,
    unit: 'min',
    timeframe: 'Largo Plazo' as const
  },
  {
    title: 'Perder Peso',
    description: 'Alcanzar peso objetivo para competición',
    category: 'Peso' as const,
    targetValue: 70,
    unit: 'kg',
    timeframe: 'Medio Plazo' as const
  }
];

export function GoalsManagement() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Mejorar VO₂ Max',
      description: 'Alcanzar 55 ml/kg/min para mejorar rendimiento aeróbico',
      category: 'VO2Max',
      priority: 'Alta',
      timeframe: 'Medio Plazo',
      targetValue: 55,
      currentValue: 52,
      unit: 'ml/kg/min',
      startDate: new Date('2024-01-01'),
      targetDate: new Date('2024-04-01'),
      status: 'En Progreso',
      reminderEnabled: true,
      reminderDays: 7,
      notes: 'Enfoque en entrenamientos intervalados de alta intensidad',
      createdAt: new Date('2024-01-01')
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tiempo' as Goal['category'],
    priority: 'Media' as Goal['priority'],
    timeframe: 'Medio Plazo' as Goal['timeframe'],
    targetValue: 0,
    currentValue: 0,
    unit: 'min',
    startDate: new Date(),
    targetDate: new Date(),
    reminderEnabled: true,
    reminderDays: 7,
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Tiempo',
      priority: 'Media',
      timeframe: 'Medio Plazo',
      targetValue: 0,
      currentValue: 0,
      unit: 'min',
      startDate: new Date(),
      targetDate: new Date(),
      reminderEnabled: true,
      reminderDays: 7,
      notes: ''
    });
  };

  const handleCreateGoal = () => {
    if (!formData.title || !formData.description || formData.targetValue <= 0) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      timeframe: formData.timeframe,
      targetValue: formData.targetValue,
      currentValue: formData.currentValue,
      unit: formData.unit,
      startDate: formData.startDate,
      targetDate: formData.targetDate,
      status: 'En Progreso',
      reminderEnabled: formData.reminderEnabled,
      reminderDays: formData.reminderDays,
      notes: formData.notes,
      createdAt: new Date()
    };

    setGoals(prev => [...prev, newGoal]);
    setIsCreateModalOpen(false);
    resetForm();
    toast.success('Objetivo creado exitosamente');
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      timeframe: goal.timeframe,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      startDate: goal.startDate,
      targetDate: goal.targetDate,
      reminderEnabled: goal.reminderEnabled,
      reminderDays: goal.reminderDays,
      notes: goal.notes
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGoal = () => {
    if (!selectedGoal) return;

    const updatedGoal: Goal = {
      ...selectedGoal,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      timeframe: formData.timeframe,
      targetValue: formData.targetValue,
      currentValue: formData.currentValue,
      unit: formData.unit,
      startDate: formData.startDate,
      targetDate: formData.targetDate,
      reminderEnabled: formData.reminderEnabled,
      reminderDays: formData.reminderDays,
      notes: formData.notes
    };

    // Check if goal is completed
    if (formData.currentValue >= formData.targetValue && selectedGoal.status !== 'Completado') {
      updatedGoal.status = 'Completado';
      updatedGoal.completedAt = new Date();
    }

    setGoals(prev => prev.map(goal => 
      goal.id === selectedGoal.id ? updatedGoal : goal
    ));
    setIsEditModalOpen(false);
    setSelectedGoal(null);
    resetForm();
    toast.success('Objetivo actualizado exitosamente');
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este objetivo?')) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast.success('Objetivo eliminado');
    }
  };

  const handleUseTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      category: template.category,
      targetValue: template.targetValue,
      unit: template.unit,
      timeframe: template.timeframe,
      targetDate: new Date(Date.now() + (template.timeframe === 'Corto Plazo' ? 30 : template.timeframe === 'Medio Plazo' ? 90 : 365) * 24 * 60 * 60 * 1000)
    }));
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.targetValue === 0) return 0;
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  const getDaysRemaining = (goal: Goal) => {
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Media': return 'bg-yellow-100 text-yellow-800';
      case 'Baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'En Progreso': return 'bg-blue-100 text-blue-800';
      case 'Pausado': return 'bg-yellow-100 text-yellow-800';
      case 'Vencido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'Corto Plazo': return 'bg-orange-100 text-orange-800';
      case 'Medio Plazo': return 'bg-blue-100 text-blue-800';
      case 'Largo Plazo': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGoals = goals.filter(goal => {
    switch (activeTab) {
      case 'active': return goal.status === 'En Progreso';
      case 'completed': return goal.status === 'Completado';
      default: return true;
    }
  });

  const getCategoryIcon = (category: string) => {
    const categoryData = GOAL_CATEGORIES.find(cat => cat.value === category);
    return categoryData?.icon || Target;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-lg">{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="font-bold text-lg">{goals.filter(g => g.status === 'Completado').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="font-bold text-lg">{goals.filter(g => g.status === 'En Progreso').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progreso Promedio</p>
                <p className="font-bold text-lg">
                  {goals.length > 0 ? Math.round(goals.reduce((acc, goal) => acc + calculateProgress(goal), 0) / goals.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">
            Mis Objetivos Deportivos
          </h2>
          <p className="text-muted-foreground">
            Define, personaliza y sigue tus metas atléticas
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Objetivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
              <DialogDescription>
                Define un objetivo personalizado para mejorar tu rendimiento deportivo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Templates */}
              <div>
                <Label>Plantillas Predefinidas (Opcional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {GOAL_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-3 text-left justify-start"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div>
                        <p className="font-medium">{template.title}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del Objetivo *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Mejorar tiempo en 10K"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select value={formData.category} onValueChange={(value: Goal['category']) => {
                    const categoryData = GOAL_CATEGORIES.find(cat => cat.value === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      category: value,
                      unit: categoryData?.unit || prev.unit
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map(category => {
                        const Icon = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu objetivo y cómo planeas alcanzarlo..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              {/* Priority and Timeframe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(value: Goal['priority']) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baja">Baja</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Plazo</Label>
                  <Select value={formData.timeframe} onValueChange={(value: Goal['timeframe']) => setFormData(prev => ({ ...prev, timeframe: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corto Plazo">Corto Plazo (1-3 meses)</SelectItem>
                      <SelectItem value="Medio Plazo">Medio Plazo (3-6 meses)</SelectItem>
                      <SelectItem value="Largo Plazo">Largo Plazo (6+ meses)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="target-value">Valor Objetivo *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="target-value"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.targetValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                    />
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-20"
                      placeholder="unidad"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="current-value">Valor Actual</Label>
                  <Input
                    id="current-value"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.currentValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label>Progreso Inicial</Label>
                  <div className="mt-2">
                    <Progress value={formData.targetValue > 0 ? (formData.currentValue / formData.targetValue) * 100 : 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.targetValue > 0 ? Math.round((formData.currentValue / formData.targetValue) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate.toLocaleDateString('es-ES')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Fecha Objetivo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.targetDate.toLocaleDateString('es-ES')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.targetDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, targetDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recordatorios</Label>
                    <p className="text-sm text-muted-foreground">Recibe notificaciones sobre tu progreso</p>
                  </div>
                  <Switch
                    checked={formData.reminderEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminderEnabled: checked }))}
                  />
                </div>
                
                {formData.reminderEnabled && (
                  <div>
                    <Label>Frecuencia de Recordatorios</Label>
                    <Select value={formData.reminderDays.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, reminderDays: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Diario</SelectItem>
                        <SelectItem value="3">Cada 3 días</SelectItem>
                        <SelectItem value="7">Semanal</SelectItem>
                        <SelectItem value="14">Quincenal</SelectItem>
                        <SelectItem value="30">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Estrategias, consejos, motivación personal..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateGoal}>
                  Crear Objetivo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Goals List */}
      {filteredGoals.length > 0 ? (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const Icon = getCategoryIcon(goal.category);
            const progress = calculateProgress(goal);
            const daysRemaining = getDaysRemaining(goal);
            
            return (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{goal.title}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                      <Badge className={getTimeframeColor(goal.timeframe)}>
                        {goal.timeframe}
                      </Badge>
                      {daysRemaining < 7 && goal.status === 'En Progreso' && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {daysRemaining} días restantes
                        </Badge>
                      )}
                    </div>
                    
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Inicio: {goal.startDate.toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>Objetivo: {goal.targetDate.toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    
                    {goal.notes && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{goal.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {activeTab === 'all' ? 'No tienes objetivos aún' : 'No hay objetivos en esta categoría'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'all' 
                ? 'Crea tu primer objetivo deportivo personalizado'
                : 'Prueba con otra categoría o crea un nuevo objetivo'
              }
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Objetivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Objetivo</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de tu objetivo deportivo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título del Objetivo</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-current">Valor Actual</Label>
                <Input
                  id="edit-current"
                  type="number"
                  step="0.1"
                  value={formData.currentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-target">Valor Objetivo</Label>
                <Input
                  id="edit-target"
                  type="number"
                  step="0.1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Progreso Actualizado</Label>
              <div className="mt-2">
                <Progress value={formData.targetValue > 0 ? (formData.currentValue / formData.targetValue) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.targetValue > 0 ? Math.round((formData.currentValue / formData.targetValue) * 100) : 0}%
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedGoal(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateGoal}>
                Actualizar Objetivo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}