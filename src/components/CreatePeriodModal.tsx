import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, X, Save, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Mesocycle {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  objective: string;
  sessions: number;
  totalVolume: number;
}

interface Period {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  objective: string;
  status: 'planning' | 'active' | 'completed';
  mesocycles: Mesocycle[];
}

interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (period: Period) => void;
  editingPeriod: Period | null;
  otherPeriods: Period[];
  year: number;
}

export function CreatePeriodModal({ 
  isOpen, 
  onClose, 
  onUpdate,
  editingPeriod,
  otherPeriods,
  year 
}: CreatePeriodModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    status: 'planning' as 'planning' | 'active' | 'completed',
    startWeek: 1,
    endWeek: 26
  });

  // Poblar formulario si se está editando
  useEffect(() => {
    if (editingPeriod) {
      setFormData({
        name: editingPeriod.name,
        objective: editingPeriod.objective,
        status: editingPeriod.status,
        startWeek: editingPeriod.startWeek,
        endWeek: editingPeriod.endWeek
      });
    }
  }, [editingPeriod]);

  const handleReset = () => {
    setFormData({
      name: '',
      objective: '',
      status: 'planning',
      startWeek: 1,
      endWeek: 26
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPeriod) {
      toast.error('No hay período para editar');
      return;
    }

    if (!formData.name.trim() || !formData.objective.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.startWeek >= formData.endWeek) {
      toast.error('La semana de fin debe ser posterior a la semana de inicio');
      return;
    }

    if (formData.endWeek - formData.startWeek + 1 < 4) {
      toast.error('Un período debe tener al menos 4 semanas');
      return;
    }

    // Verificar conflictos con otros períodos
    const conflicts = otherPeriods.filter(p => {
      if (p.id === editingPeriod.id) return false;
      return (
        (formData.startWeek >= p.startWeek && formData.startWeek <= p.endWeek) ||
        (formData.endWeek >= p.startWeek && formData.endWeek <= p.endWeek) ||
        (formData.startWeek <= p.startWeek && formData.endWeek >= p.endWeek)
      );
    });

    if (conflicts.length > 0) {
      toast.error('El rango de semanas seleccionado se superpone con otros períodos');
      return;
    }

    // Verificar que los mesociclos existentes caben en el nuevo rango
    const conflictingMesocycles = editingPeriod.mesocycles.filter(meso => 
      meso.startWeek < formData.startWeek || meso.endWeek > formData.endWeek
    );

    if (conflictingMesocycles.length > 0) {
      toast.error(
        `Los siguientes mesociclos están fuera del nuevo rango de semanas: ${
          conflictingMesocycles.map(m => m.name).join(', ')
        }`
      );
      return;
    }

    const updatedPeriod: Period = {
      ...editingPeriod,
      name: formData.name.trim(),
      objective: formData.objective.trim(),
      status: formData.status,
      startWeek: formData.startWeek,
      endWeek: formData.endWeek
    };

    onUpdate(updatedPeriod);
    toast.success('Período actualizado exitosamente');
    handleReset();
  };

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

  const calculateWeeksDuration = () => {
    return formData.endWeek - formData.startWeek + 1;
  };

  const getAffectedMesocycles = () => {
    if (!editingPeriod) return [];
    
    const currentRange = { start: editingPeriod.startWeek, end: editingPeriod.endWeek };
    const newRange = { start: formData.startWeek, end: formData.endWeek };
    
    if (currentRange.start === newRange.start && currentRange.end === newRange.end) {
      return [];
    }

    return editingPeriod.mesocycles.filter(meso => 
      meso.startWeek < newRange.start || meso.endWeek > newRange.end
    );
  };

  const affectedMesocycles = getAffectedMesocycles();
  const weeksDuration = calculateWeeksDuration();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Editar Período
          </DialogTitle>
          <DialogDescription>
            Modifica la información y configuración del período del macrociclo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del período *</Label>
              <Input
                id="name"
                placeholder="Ej: Primer Período - Preparación General"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo del período *</Label>
              <Textarea
                id="objective"
                placeholder="Describe el objetivo principal de este período..."
                value={formData.objective}
                onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado del período</Label>
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

          {/* Configuración temporal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuración Temporal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startWeek">Semana de inicio *</Label>
                <Select 
                  value={formData.startWeek.toString()} 
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, startWeek: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => i + 1).map(week => {
                      // Verificar si esta semana está ocupada por otros períodos
                      const isOccupied = otherPeriods.some(p => 
                        p.id !== editingPeriod?.id && 
                        week >= p.startWeek && 
                        week <= p.endWeek
                      );
                      
                      return (
                        <SelectItem 
                          key={week} 
                          value={week.toString()}
                          disabled={isOccupied}
                        >
                          Semana {week} {isOccupied && '(ocupada)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endWeek">Semana de fin *</Label>
                <Select 
                  value={formData.endWeek.toString()} 
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, endWeek: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => i + 1)
                      .filter(week => week > formData.startWeek)
                      .map(week => {
                        // Verificar si esta semana está ocupada por otros períodos
                        const isOccupied = otherPeriods.some(p => 
                          p.id !== editingPeriod?.id && 
                          week >= p.startWeek && 
                          week <= p.endWeek
                        );
                        
                        return (
                          <SelectItem 
                            key={week} 
                            value={week.toString()}
                            disabled={isOccupied}
                          >
                            Semana {week} {isOccupied && '(ocupada)'}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Información calculada */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Duración</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {weeksDuration} semanas
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(weeksDuration / 4.3)} meses aprox.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estado Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(formData.status)} variant="outline">
                    {getStatusText(formData.status)}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mesociclos existentes */}
          {editingPeriod && editingPeriod.mesocycles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mesociclos en este Período</h3>
              
              <div className="space-y-2">
                {editingPeriod.mesocycles.map(mesocycle => (
                  <div 
                    key={mesocycle.id} 
                    className={`p-3 border rounded-lg ${
                      affectedMesocycles.some(m => m.id === mesocycle.id)
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{mesocycle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Semanas {mesocycle.startWeek} - {mesocycle.endWeek}
                        </p>
                      </div>
                      {affectedMesocycles.some(m => m.id === mesocycle.id) && (
                        <div className="flex items-center text-destructive">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-sm">Fuera del rango</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {affectedMesocycles.length > 0 && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-medium text-destructive">Advertencia</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {affectedMesocycles.length} mesociclo(s) quedarían fuera del nuevo rango de semanas.
                        Ajusta las semanas del período o modifica los mesociclos afectados antes de continuar.
                      </p>
                    </div>
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
              affectedMesocycles.length > 0
            }
            className="bg-accent hover:bg-accent/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Actualizar Período
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}