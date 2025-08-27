import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, X, Save, Target, Clock, Activity, Plus, Minus, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface Microcycle {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: number;
  volume: number;
  intensity: 'baja' | 'media' | 'alta';
  focus: string;
}

interface Mesocycle {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  objective: string;
  sessions: number;
  totalVolume: number;
  microcycles: Microcycle[];
  status: 'planning' | 'active' | 'completed';
}

interface Macrocycle {
  year: number;
  totalWeeks: number;
  mesocycles: Mesocycle[];
}

interface CreateMesocycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mesocycle: Omit<Mesocycle, 'id'> | Mesocycle) => void;
  onUpdate?: (mesocycle: Mesocycle) => void;
  macrocycle: Macrocycle;
  existingMesocycles: Mesocycle[];
  editingMesocycle?: Mesocycle | null;
  year: number;
  onViewCalendar?: (mesocycle: Mesocycle) => void;
}

export function CreateMesocycleModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onUpdate,
  macrocycle,
  existingMesocycles,
  editingMesocycle,
  year,
  onViewCalendar
}: CreateMesocycleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startWeek: 1,
    endWeek: 4,
    startDate: '',
    endDate: '',
    objective: '',
    sessions: 16,
    totalVolume: 120,
    status: 'planning' as 'planning' | 'active' | 'completed'
  });

  const [microcycles, setMicrocycles] = useState<Omit<Microcycle, 'id'>[]>([]);

  // Poblar formulario si se está editando
  useEffect(() => {
    if (editingMesocycle) {
      const startDate = getWeekStartDate(editingMesocycle.startWeek);
      const endDate = getWeekEndDate(editingMesocycle.endWeek);
      
      setFormData({
        name: editingMesocycle.name,
        startWeek: editingMesocycle.startWeek,
        endWeek: editingMesocycle.endWeek,
        startDate,
        endDate,
        objective: editingMesocycle.objective,
        sessions: editingMesocycle.sessions,
        totalVolume: editingMesocycle.totalVolume,
        status: editingMesocycle.status
      });
      setMicrocycles(editingMesocycle.microcycles.map(({ id, ...rest }) => rest));
    } else {
      // Para creación nueva, solo configurar fechas iniciales por defecto
      const startDate = getWeekStartDate(1);
      const endDate = getWeekEndDate(4);
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }));
      setMicrocycles([]); // No generar microciclos para creación
    }
  }, [editingMesocycle]);

  const generateDefaultMicrocycles = (startWeek: number, endWeek: number) => {
    const weekCount = endWeek - startWeek + 1;
    const newMicrocycles: Omit<Microcycle, 'id'>[] = [];

    for (let i = 0; i < weekCount; i++) {
      const weekNumber = startWeek + i;
      const startDate = getWeekStartDate(weekNumber);
      const endDate = getWeekEndDate(weekNumber);
      
      newMicrocycles.push({
        weekNumber,
        startDate,
        endDate,
        sessions: 4,
        volume: Math.round(formData.totalVolume / weekCount),
        intensity: i < weekCount - 1 ? 'media' : 'baja', // Última semana más suave
        focus: i === 0 ? 'Adaptación' : i === weekCount - 1 ? 'Recuperación' : 'Desarrollo'
      });
    }

    setMicrocycles(newMicrocycles);
  };

  const getWeekStartDate = (weekNumber: number) => {
    const startOfYear = new Date(year, 0, 1);
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7);
    return startOfWeek.toISOString().split('T')[0];
  };

  const getWeekEndDate = (weekNumber: number) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfWeek = new Date(startOfYear);
    endOfWeek.setDate(endOfWeek.getDate() + (weekNumber - 1) * 7 + 6);
    return endOfWeek.toISOString().split('T')[0];
  };

  const handleReset = () => {
    setFormData({
      name: '',
      startWeek: 1,
      endWeek: 4,
      startDate: '',
      endDate: '',
      objective: '',
      sessions: 16,
      totalVolume: 120,
      status: 'planning'
    });
    setMicrocycles([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.objective.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!editingMesocycle && (formData.sessions <= 0 || formData.totalVolume <= 0)) {
      toast.error('La cantidad de sesiones y el volumen deben ser mayores a 0');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    // Calcular semanas basadas en fechas
    const startWeek = getWeekFromDate(formData.startDate) || 1;
    const endWeek = getWeekFromDate(formData.endDate) || 4;

    if (startWeek >= endWeek) {
      toast.error('El período seleccionado es demasiado corto');
      return;
    }

    // Verificar conflictos con mesociclos existentes (solo en edición)
    if (editingMesocycle) {
      const conflicts = existingMesocycles.filter(m => {
        if (m.id === editingMesocycle.id) return false;
        return (
          (startWeek >= m.startWeek && startWeek <= m.endWeek) ||
          (endWeek >= m.startWeek && endWeek <= m.endWeek) ||
          (startWeek <= m.startWeek && endWeek >= m.endWeek)
        );
      });

      if (conflicts.length > 0) {
        toast.error('El período seleccionado se superpone con mesociclos existentes');
        return;
      }
    }

    // Para creación simple, usar datos básicos calculados
    const microcyclesWithId = editingMesocycle 
      ? microcycles.map((micro, index) => ({
          ...micro,
          id: `micro_${Date.now()}_${index}`
        }))
      : [];

    const mesocycleData = {
      ...formData,
      name: formData.name.trim(),
      objective: formData.objective.trim(),
      startWeek,
      endWeek,
      sessions: editingMesocycle ? calculateTotalSessions() : formData.sessions,
      totalVolume: editingMesocycle ? calculateTotalVolume() : formData.totalVolume,
      microcycles: microcyclesWithId
    };

    if (editingMesocycle && onUpdate) {
      onUpdate({
        ...mesocycleData,
        id: editingMesocycle.id,
        microcycles: microcyclesWithId
      });
      toast.success('Mesociclo actualizado exitosamente');
    } else {
      onSubmit(mesocycleData);
      toast.success('Mesociclo creado exitosamente');
    }

    handleReset();
  };

  const handleWeekRangeChange = (startWeek: number, endWeek: number) => {
    const startDate = getWeekStartDate(startWeek);
    const endDate = getWeekEndDate(endWeek);
    
    setFormData(prev => ({ 
      ...prev, 
      startWeek, 
      endWeek,
      startDate,
      endDate
    }));
    generateDefaultMicrocycles(startWeek, endWeek);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Calcular semanas basadas en fechas para modo edición
    if (editingMesocycle && field === 'startDate' && value) {
      const week = getWeekFromDate(value);
      if (week && week !== formData.startWeek) {
        const endWeek = Math.max(week + 3, formData.endWeek);
        handleWeekRangeChange(week, endWeek);
      }
    }
  };

  const getWeekFromDate = (dateString: string): number | null => {
    const date = new Date(dateString);
    const startOfYear = new Date(year, 0, 1);
    const diffTime = date.getTime() - startOfYear.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.ceil(diffDays / 7);
    
    return week >= 1 && week <= 52 ? week : null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const updateMicrocycle = (index: number, field: keyof Omit<Microcycle, 'id'>, value: any) => {
    setMicrocycles(prev => prev.map((micro, i) => 
      i === index ? { ...micro, [field]: value } : micro
    ));
  };

  const getAvailableWeeks = () => {
    const occupiedWeeks = existingMesocycles
      .filter(m => !editingMesocycle || m.id !== editingMesocycle.id)
      .flatMap(m => Array.from({ length: m.endWeek - m.startWeek + 1 }, (_, i) => m.startWeek + i));

    return Array.from({ length: 52 }, (_, i) => i + 1)
      .filter(week => !occupiedWeeks.includes(week));
  };

  const availableWeeks = getAvailableWeeks();

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baja': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateTotalSessions = () => {
    return microcycles.reduce((total, micro) => total + micro.sessions, 0);
  };

  const calculateTotalVolume = () => {
    return microcycles.reduce((total, micro) => total + micro.volume, 0);
  };

  // Actualizar totales automáticamente para el envío de datos (solo en modo edición)
  useEffect(() => {
    if (editingMesocycle) {
      setFormData(prev => ({
        ...prev,
        sessions: calculateTotalSessions(),
        totalVolume: calculateTotalVolume()
      }));
    }
  }, [microcycles, editingMesocycle]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            {editingMesocycle ? 'Editar Mesociclo' : 'Nuevo Mesociclo'}
          </DialogTitle>
          <DialogDescription>
            {editingMesocycle 
              ? 'Modifica un mesociclo y gestiona sus configuraciones avanzadas' 
              : 'Crea un nuevo mesociclo con la información básica'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos esenciales - siempre visibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del mesociclo *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Mesociclo 1 - Adaptación"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objetivo *</Label>
                <Textarea
                  id="objective"
                  placeholder="Describe el objetivo principal de este mesociclo..."
                  value={formData.objective}
                  onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Fechas - siempre visibles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="text-sm"
                    required
                  />
                  {formData.startDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(formData.startDate)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    min={formData.startDate}
                    className="text-sm"
                    required
                  />
                  {formData.endDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(formData.endDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Campos de planificación - siempre visibles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessions">Cantidad de Sesiones *</Label>
                  <Input
                    id="sessions"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.sessions}
                    onChange={(e) => setFormData(prev => ({ ...prev, sessions: parseInt(e.target.value) || 0 }))}
                    placeholder="Ej: 16"
                    disabled={!!editingMesocycle} // Calculado automáticamente en edición
                  />
                  <p className="text-xs text-muted-foreground">
                    {editingMesocycle ? 'Calculado automáticamente basado en microciclos' : 'Número total de sesiones planificadas'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalVolume">Volumen Total (km) *</Label>
                  <Input
                    id="totalVolume"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.totalVolume}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalVolume: parseInt(e.target.value) || 0 }))}
                    placeholder="Ej: 120"
                    disabled={!!editingMesocycle} // Calculado automáticamente en edición
                  />
                  <p className="text-xs text-muted-foreground">
                    {editingMesocycle ? 'Calculado automáticamente basado en microciclos' : 'Kilómetros totales planificados'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campos avanzados - solo en modo edición */}
          {editingMesocycle && (
            <div className="space-y-6">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Configuración Avanzada</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado del mesociclo</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: 'planning' | 'active' | 'completed') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                              En Planificación
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                              Activo
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                              Completado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startWeek">Semana de inicio</Label>
                        <Select 
                          value={formData.startWeek.toString()} 
                          onValueChange={(value) => {
                            const startWeek = parseInt(value);
                            const endWeek = Math.min(startWeek + 3, 52);
                            handleWeekRangeChange(startWeek, endWeek);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableWeeks.map(week => (
                              <SelectItem key={week} value={week.toString()}>
                                Semana {week}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endWeek">Semana de fin</Label>
                        <Select 
                          value={formData.endWeek.toString()} 
                          onValueChange={(value) => {
                            const endWeek = parseInt(value);
                            handleWeekRangeChange(formData.startWeek, endWeek);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableWeeks
                              .filter(week => week >= formData.startWeek)
                              .map(week => (
                                <SelectItem key={week} value={week.toString()}>
                                  Semana {week}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>


                  </div>
                </div>
              </div>

              {/* Botón para ver calendario */}
              {onViewCalendar && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Sesiones del Mesociclo</h3>
                      <p className="text-sm text-muted-foreground">
                        Visualiza y gestiona las sesiones programadas para este mesociclo
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onViewCalendar(editingMesocycle)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Ver Calendario
                    </Button>
                  </div>
                </div>
              )}

              {/* Microciclos - solo en modo edición */}
              {microcycles.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Microciclos</h3>
                    <Badge variant="outline">
                      {microcycles.length} semanas
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {microcycles.map((microcycle, index) => (
                      <Card key={index} className="border-l-4 border-l-accent">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>Semana {microcycle.weekNumber}</span>
                            <Badge className={getIntensityColor(microcycle.intensity)} variant="outline">
                              {microcycle.intensity}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Sesiones</Label>
                              <Input
                                type="number"
                                min="1"
                                max="14"
                                value={microcycle.sessions}
                                onChange={(e) => updateMicrocycle(index, 'sessions', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Volumen (km)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={microcycle.volume}
                                onChange={(e) => updateMicrocycle(index, 'volume', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Intensidad</Label>
                            <Select 
                              value={microcycle.intensity} 
                              onValueChange={(value: 'baja' | 'media' | 'alta') => 
                                updateMicrocycle(index, 'intensity', value)
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Enfoque</Label>
                            <Input
                              placeholder="Ej: Trabajo aeróbico base"
                              value={microcycle.focus}
                              onChange={(e) => updateMicrocycle(index, 'focus', e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              !formData.name.trim() || 
              !formData.objective.trim() || 
              !formData.startDate || 
              !formData.endDate ||
              (!editingMesocycle && (formData.sessions <= 0 || formData.totalVolume <= 0))
            }
            className="bg-accent hover:bg-accent/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {editingMesocycle ? 'Actualizar' : 'Crear'} Mesociclo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}