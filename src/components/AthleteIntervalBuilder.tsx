import React, { useState } from 'react';
import { IntervalForm } from './IntervalForm';
import { IntervalList } from './IntervalList';
import { TrainingInterval } from './utils/athleteIntervalUtils';
import { toast } from 'sonner';

interface AthleteIntervalBuilderProps {
  intervals: TrainingInterval[];
  onAddInterval: (interval: Omit<TrainingInterval, 'id'>) => void;
  onUpdateInterval: (intervalId: string, interval: Omit<TrainingInterval, 'id'>) => void;
  onDeleteInterval: (intervalId: string) => void;
  athletes?: any[];
}

export function AthleteIntervalBuilder({ 
  intervals, 
  onAddInterval, 
  onUpdateInterval, 
  onDeleteInterval,
  athletes = []
}: AthleteIntervalBuilderProps) {
  const [newInterval, setNewInterval] = useState({
    trainingMode: 'distance' as 'distance' | 'time',
    repetitions: 1,
    distance: 400,
    duration: '',
    targetSpeed: '',
    recoveryTime: '2:00',
    description: '',
    intensity: 'moderate' as 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max'
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInterval, setEditingInterval] = useState<Omit<TrainingInterval, 'id'> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleFormChange = (field: keyof typeof newInterval, value: any) => {
    setNewInterval(prev => ({ ...prev, [field]: value }));
  };

  const handleAddInterval = async () => {
    // Validaciones básicas
    if (newInterval.repetitions < 1) {
      toast.error('Las repeticiones deben ser al menos 1');
      return;
    }

    if (newInterval.trainingMode === 'distance' && newInterval.distance < 100) {
      toast.error('La distancia mínima es 100 metros');
      return;
    }

    if (newInterval.trainingMode === 'time' && !newInterval.duration) {
      toast.error('Debes especificar la duración');
      return;
    }

    if (!newInterval.targetSpeed) {
      toast.error('Debes especificar la velocidad');
      return;
    }

    if (!newInterval.recoveryTime) {
      toast.error('Debes especificar el tiempo de recuperación');
      return;
    }

    setIsAdding(true);

    try {
      // Convertir al formato TrainingInterval
      const intervalToAdd: Omit<TrainingInterval, 'id'> = {
        type: 'interval',
        repetitions: newInterval.repetitions,
        distance: newInterval.trainingMode === 'distance' ? newInterval.distance : 0,
        targetTime: newInterval.trainingMode === 'time' ? newInterval.duration : '',
        recoveryTime: newInterval.recoveryTime,
        paceType: 'fixed',
        pace: parseSpeed(newInterval.targetSpeed),
        description: newInterval.description,
        intensity: newInterval.intensity,
        // Guardar el modo de entrenamiento como parte de la descripción interna
        trainingMode: newInterval.trainingMode,
        duration: newInterval.trainingMode === 'time' ? newInterval.duration : undefined,
        targetSpeed: newInterval.targetSpeed
      } as any;

      await new Promise(resolve => setTimeout(resolve, 300));

      onAddInterval(intervalToAdd);

      // Reset form
      setNewInterval({
        trainingMode: 'distance',
        repetitions: 1,
        distance: 400,
        duration: '',
        targetSpeed: '',
        recoveryTime: '2:00',
        description: '',
        intensity: 'moderate'
      });

      const modeText = newInterval.trainingMode === 'distance' 
        ? `${newInterval.distance >= 1000 ? `${newInterval.distance/1000}K` : `${newInterval.distance}m`}`
        : newInterval.duration;

      toast.success(`Serie agregada exitosamente`, {
        description: `${newInterval.repetitions} x ${modeText} a ${newInterval.targetSpeed}/km`
      });
    } catch (error) {
      toast.error('Error al agregar la serie');
      console.error('Error adding interval:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const parseSpeed = (speedStr: string): number => {
    try {
      const [min, sec] = speedStr.split(':').map(Number);
      return min + (sec || 0) / 60;
    } catch {
      return 4.0;
    }
  };

  const handleEditInterval = (interval: TrainingInterval) => {
    setEditingId(interval.id);
    
    // Convertir de vuelta al formato del formulario
    const intervalAny = interval as any;
    setEditingInterval({
      type: interval.type,
      repetitions: interval.repetitions,
      distance: interval.distance,
      targetTime: interval.targetTime || '',
      recoveryTime: interval.recoveryTime,
      paceType: interval.paceType,
      pace: interval.pace,
      vo2maxPercentage: interval.vo2maxPercentage,
      description: interval.description || '',
      intensity: interval.intensity || 'moderate',
      trainingMode: intervalAny.trainingMode || 'distance',
      duration: intervalAny.duration,
      targetSpeed: intervalAny.targetSpeed
    } as any);
  };

  const handleSaveEdit = () => {
    if (!editingInterval || !editingId) return;

    onUpdateInterval(editingId, editingInterval);
    setEditingId(null);
    setEditingInterval(null);
    toast.success('Serie actualizada');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingInterval(null);
  };

  const handleEditChange = (field: keyof TrainingInterval, value: any) => {
    if (editingInterval) {
      setEditingInterval(prev => ({ ...prev!, [field]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <IntervalForm
        formData={newInterval}
        onFormChange={handleFormChange}
        onSubmit={handleAddInterval}
        isLoading={isAdding}
      />

      <IntervalList
        intervals={intervals}
        editingId={editingId}
        editingInterval={editingInterval}
        onEditInterval={handleEditInterval}
        onDeleteInterval={onDeleteInterval}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onEditChange={handleEditChange}
      />
    </div>
  );
}
