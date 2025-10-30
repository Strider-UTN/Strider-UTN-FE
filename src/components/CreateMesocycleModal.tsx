import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar, X, Save, Target, AlertCircle } from 'lucide-react';
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
  startDate: string;
  endDate: string;
  objective: string;
  weeksCount: number;
  microcycles: Microcycle[];
  status: 'planning' | 'active' | 'completed';
}

interface CreateMesocycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mesocycle: Omit<Mesocycle, 'id' | 'microcycles'>) => void;
  existingMesocycles: Mesocycle[];
  year: number;
}

export function CreateMesocycleModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  existingMesocycles,
  year
}: CreateMesocycleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    weeksCount: 4,
    objective: '',
    status: 'planning' as 'planning' | 'active' | 'completed'
  });

  const [endDate, setEndDate] = useState('');
  const [hasOverlap, setHasOverlap] = useState(false);
  const [overlappingMesocycles, setOverlappingMesocycles] = useState<Mesocycle[]>([]);

  // Calcular fecha de fin automáticamente basada en la fecha de inicio y cantidad de semanas
  useEffect(() => {
    if (formData.startDate && formData.weeksCount > 0) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (formData.weeksCount * 7) - 1); // -1 para que sea inclusivo
      setEndDate(end.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
  }, [formData.startDate, formData.weeksCount]);

  // Verificar superposición con mesociclos existentes
  useEffect(() => {
    if (formData.startDate && endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(endDate);

      const overlapping = existingMesocycles.filter(meso => {
        const mesoStart = new Date(meso.startDate);
        const mesoEnd = new Date(meso.endDate);

        // Verificar si hay superposición
        return (
          (start >= mesoStart && start <= mesoEnd) ||
          (end >= mesoStart && end <= mesoEnd) ||
          (start <= mesoStart && end >= mesoEnd)
        );
      });

      setHasOverlap(overlapping.length > 0);
      setOverlappingMesocycles(overlapping);
    } else {
      setHasOverlap(false);
      setOverlappingMesocycles([]);
    }
  }, [formData.startDate, endDate, existingMesocycles]);

  const handleReset = () => {
    setFormData({
      name: '',
      startDate: '',
      weeksCount: 4,
      objective: '',
      status: 'planning'
    });
    setEndDate('');
    setHasOverlap(false);
    setOverlappingMesocycles([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Por favor ingresa un nombre para el mesociclo');
      return;
    }

    if (!formData.objective.trim()) {
      toast.error('Por favor ingresa un objetivo para el mesociclo');
      return;
    }

    if (!formData.startDate) {
      toast.error('Por favor selecciona la fecha de inicio');
      return;
    }

    if (formData.weeksCount < 1 || formData.weeksCount > 52) {
      toast.error('La cantidad de semanas debe estar entre 1 y 52');
      return;
    }

    if (hasOverlap) {
      toast.error('El mesociclo se superpone con otro existente. Por favor ajusta las fechas.');
      return;
    }

    const mesocycleData = {
      name: formData.name.trim(),
      startDate: formData.startDate,
      endDate: endDate,
      weeksCount: formData.weeksCount,
      objective: formData.objective.trim(),
      status: formData.status
    };

    onSubmit(mesocycleData);
    toast.success('Mesociclo creado exitosamente');
    handleReset();
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

  const getMinDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Nuevo Mesociclo
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo mesociclo especificando la fecha de inicio y cantidad de semanas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del Mesociclo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Mesociclo 1 - Adaptación Anatómica"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="objective">
              Objetivo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="objective"
              placeholder="Describe el objetivo principal de este mesociclo..."
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Fecha de Inicio y Cantidad de Semanas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Fecha de Inicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={getMinDate()}
                required
              />
              {formData.startDate && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(formData.startDate)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeksCount">
                Cantidad de Semanas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weeksCount"
                type="number"
                min="1"
                max="52"
                value={formData.weeksCount}
                onChange={(e) => setFormData(prev => ({ ...prev, weeksCount: parseInt(e.target.value) || 1 }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Entre 1 y 52 semanas
              </p>
            </div>
          </div>

          {/* Fecha de Fin Calculada */}
          {endDate && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-accent mb-1">Fecha de Finalización</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(endDate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Duración: {formData.weeksCount} semana{formData.weeksCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Superposición */}
          {hasOverlap && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-2">Superposición Detectada</p>
                  <p className="text-sm text-red-700 mb-3">
                    El mesociclo que intentas crear se superpone con {overlappingMesocycles.length} mesociclo{overlappingMesocycles.length !== 1 ? 's' : ''} existente{overlappingMesocycles.length !== 1 ? 's' : ''}.
                  </p>
                  <div className="space-y-2">
                    {overlappingMesocycles.map(meso => (
                      <div key={meso.id} className="bg-white rounded p-2 border border-red-200">
                        <p className="text-sm font-medium text-red-900">{meso.name}</p>
                        <p className="text-xs text-red-700">
                          {new Date(meso.startDate).toLocaleDateString('es-ES')} - {new Date(meso.endDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-700 mt-3 font-medium">
                    Por favor, modifica la fecha de inicio o la cantidad de semanas para evitar la superposición.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info sobre lista vacía */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Creación Manual:</strong> Los mesociclos se crean uno a uno de forma manual. 
                  Los microciclos y sesiones se gestionarán posteriormente desde la vista de planificación.
                </p>
              </div>
            </div>
          </div>
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
              !endDate ||
              hasOverlap ||
              formData.weeksCount < 1
            }
            className="bg-accent hover:bg-accent/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Crear Mesociclo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
