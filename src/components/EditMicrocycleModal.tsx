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
  name: string; // ✅ NUEVO - Nombre del microciclo
  description?: string; // ✅ NUEVO - Descripción del microciclo (opcional)
  weekNumber: number;
  startDate: string;
  endDate: string;
  focus: string;
  intensity: 'baja' | 'media' | 'alta';
  volume: number; // Calculado automáticamente - readonly
  sessions: number; // Calculado automáticamente - readonly
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
  // Función helper para convertir fecha ISO a formato YYYY-MM-DD para inputs type="date"
  // IMPORTANTE: Evitar problemas de timezone parseando directamente la fecha sin conversión
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Si viene en formato ISO (con hora y timezone), extraer solo la parte de la fecha
    // Ejemplo: "2025-12-01T00:00:00Z" -> "2025-12-01"
    if (dateString.includes('T')) {
      const [datePart] = dateString.split('T');
      // Verificar que tenga el formato correcto YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    // Si no se pudo extraer directamente, parsear como fecha local (sin conversión de timezone)
    // Esto evita que se muestre un día menos
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Usar UTC para evitar problemas de timezone
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Inicializar formData con valores por defecto si faltan
  const initializeFormData = (microcycle: Microcycle): Microcycle => {
    const initialized = {
      id: microcycle.id,
      name: microcycle.name || `Semana ${microcycle.weekNumber}`,
      description: microcycle.description || '',
      weekNumber: microcycle.weekNumber,
      startDate: formatDateForInput(microcycle.startDate),
      endDate: formatDateForInput(microcycle.endDate),
      focus: microcycle.focus || '',
      intensity: (microcycle.intensity || 'media') as 'baja' | 'media' | 'alta',
      volume: microcycle.volume || 0,
      sessions: microcycle.sessions || 0
    };
    
    // Debug: verificar que los valores se están inicializando correctamente
    console.log('Initializing formData:', {
      original: microcycle,
      initialized: initialized
    });
    
    return initialized;
  };

  const [formData, setFormData] = useState<Microcycle>(() => initializeFormData(microcycle));
  const [isLoading, setIsLoading] = useState(false);

  // Actualizar formData cuando cambie el microciclo o cuando se abra el modal
  useEffect(() => {
    if (isOpen && microcycle) {
      const initialized = initializeFormData(microcycle);
      setFormData(initialized);
    }
  }, [microcycle, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validaciones básicas
      if (!formData.name.trim()) {
        toast.error('El nombre del microciclo es obligatorio');
        return;
      }

      // Focus es opcional - si está vacío, se enviará como null al backend
      // El backend espera un enum MicrocycleFocus o null, no un string libre

      // Guardar cambios (sessions y volume se calculan automáticamente en el backend)
      onSave(formData);
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
          <div className="space-y-4">
            {/* ✅ NUEVO - Nombre del microciclo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Microciclo *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Semana 1, Semana de Base, etc."
                className="w-full"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Este nombre se mostrará de forma destacada en las tarjetas del microciclo
              </p>
            </div>

            {/* ✅ NUEVO - Descripción del microciclo */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción breve del microciclo (opcional)"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-20"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                Esta descripción se mostrará en gris más tenue debajo del nombre
              </p>
            </div>
          </div>

          {/* Información adicional */}
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
                disabled
              />
              <p className="text-xs text-muted-foreground">No editable</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intensity">Intensidad</Label>
              <Select 
                value={formData.intensity || 'media'} 
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

          {/* Fechas (Readonly - No editables) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                className="w-full bg-muted cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                No editable - Se calcula automáticamente desde el mesociclo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                className="w-full bg-muted cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                No editable - Se calcula automáticamente desde el mesociclo
              </p>
            </div>
          </div>

          {/* Enfoque */}
          <div className="space-y-2">
            <Label htmlFor="focus">Enfoque Principal</Label>
            <Select 
              value={formData.focus || ''} 
              onValueChange={(value) => handleInputChange('focus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar enfoque">
                  {formData.focus || 'Seleccionar enfoque'}
                </SelectValue>
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

          {/* Métricas (Readonly - Calculadas automáticamente) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volumen (km)</Label>
              <Input
                id="volume"
                type="number"
                min="0"
                step="0.1"
                value={formData.volume.toFixed(2)}
                className="w-full bg-muted cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Calculado automáticamente desde las sesiones asignadas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions">Número de Sesiones</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                max="14"
                value={formData.sessions}
                className="w-full bg-muted cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Calculado automáticamente desde las sesiones asignadas
              </p>
            </div>
          </div>

          {/* ❌ REMOVIDO - Notas adicionales no se persisten en el backend */}


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