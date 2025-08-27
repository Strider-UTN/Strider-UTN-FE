import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Microcycle {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  focus: string;
  intensity: 'baja' | 'media' | 'alta';
  volume: number;
  sessions: number;
  notes?: string;
}

interface EditMicrocycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  microcycle: Microcycle;
  onSave: (updatedMicrocycle: Microcycle) => void;
  mesocycleName: string;
}

export function EditMicrocycleModal({ 
  isOpen, 
  onClose, 
  microcycle, 
  onSave,
  mesocycleName 
}: EditMicrocycleModalProps) {
  const [formData, setFormData] = useState<Microcycle>(microcycle);
  const [isLoading, setIsLoading] = useState(false);

  // Actualizar formData cuando cambie el microciclo
  useEffect(() => {
    setFormData(microcycle);
  }, [microcycle]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validaciones básicas
      if (!formData.focus.trim()) {
        toast.error('El enfoque del microciclo es obligatorio');
        return;
      }

      if (formData.volume <= 0) {
        toast.error('El volumen debe ser mayor a 0');
        return;
      }

      if (formData.sessions <= 0) {
        toast.error('El número de sesiones debe ser mayor a 0');
        return;
      }

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(formData);
      toast.success(`Semana ${formData.weekNumber} actualizada exitosamente`);
      onClose();
    } catch (error) {
      toast.error('Error al guardar los cambios del microciclo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Microcycle, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const intensityColors = {
    baja: 'text-green-700',
    media: 'text-yellow-700', 
    alta: 'text-red-700'
  };

  const focusOptions = [
    'Resistencia Aeróbica',
    'Velocidad',
    'Fuerza',
    'Recuperación',
    'Trabajo Anaeróbico',
    'Técnica de Carrera',
    'Competición',
    'Transición',
    'Descanso Activo'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Editar Semana {microcycle.weekNumber} - {mesocycleName}
          </DialogTitle>
          <DialogDescription>
            Modifica los parámetros del microciclo, incluyendo intensidad, volumen y enfoque de entrenamiento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekNumber">Número de Semana</Label>
              <Input
                id="weekNumber"
                type="number"
                min="1"
                max="52"
                value={formData.weekNumber}
                onChange={(e) => handleInputChange('weekNumber', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intensity">Intensidad</Label>
              <Select 
                value={formData.intensity} 
                onValueChange={(value: 'baja' | 'media' | 'alta') => handleInputChange('intensity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar intensidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">
                    <span className="text-green-700">Baja</span>
                  </SelectItem>
                  <SelectItem value="media">
                    <span className="text-yellow-700">Media</span>
                  </SelectItem>
                  <SelectItem value="alta">
                    <span className="text-red-700">Alta</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Enfoque */}
          <div className="space-y-2">
            <Label htmlFor="focus">Enfoque Principal</Label>
            <Select 
              value={formData.focus} 
              onValueChange={(value) => handleInputChange('focus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar enfoque" />
              </SelectTrigger>
              <SelectContent>
                {focusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volumen (km)</Label>
              <Input
                id="volume"
                type="number"
                min="0"
                step="0.1"
                value={formData.volume}
                onChange={(e) => handleInputChange('volume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions">Número de Sesiones</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                max="14"
                value={formData.sessions}
                onChange={(e) => handleInputChange('sessions', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones, consideraciones especiales, etc."
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="min-h-20"
            />
          </div>


        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}