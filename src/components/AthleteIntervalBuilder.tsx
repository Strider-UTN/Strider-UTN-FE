import React, { useState, useEffect } from 'react';
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
    paceType: 'fixed' as 'fixed' | 'vo2max_percentage',
    targetSpeed: '',
    vo2maxPercentage: undefined as number | undefined,
    recoveryTime: '2:00',
    description: '',
    intensity: 'moderate' as 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max'
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInterval, setEditingInterval] = useState<Omit<TrainingInterval, 'id'> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Resetear el estado de edición cuando cambian los intervals
  // (por ejemplo, cuando se carga una nueva plantilla)
  useEffect(() => {
    // Si el intervalo que estábamos editando ya no existe en la lista, cancelar la edición
    if (editingId && !intervals.find(i => String(i.id) === String(editingId))) {
      setEditingId(null);
      setEditingInterval(null);
    }
  }, [intervals, editingId]);

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

    if (newInterval.trainingMode === 'distance') {
      if (newInterval.paceType === 'fixed' && !newInterval.targetSpeed) {
        toast.error('Debes especificar la velocidad');
        return;
      }
      if (newInterval.paceType === 'vo2max_percentage' && (!newInterval.vo2maxPercentage || newInterval.vo2maxPercentage <= 0 || newInterval.vo2maxPercentage > 100)) {
        toast.error('Debes especificar un porcentaje de VO2Max válido (1-100)');
        return;
      }
    } else {
      if (!newInterval.targetSpeed) {
        toast.error('Debes especificar la velocidad');
        return;
      }
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
        paceType: newInterval.trainingMode === 'distance' ? newInterval.paceType : 'fixed',
        pace: newInterval.trainingMode === 'distance' && newInterval.paceType === 'fixed' 
          ? parseSpeed(newInterval.targetSpeed) 
          : (newInterval.trainingMode === 'time' ? parseSpeed(newInterval.targetSpeed) : undefined),
        vo2maxPercentage: newInterval.trainingMode === 'distance' && newInterval.paceType === 'vo2max_percentage'
          ? newInterval.vo2maxPercentage
          : undefined,
        description: newInterval.description,
        intensity: newInterval.intensity,
        // Guardar el modo de entrenamiento como parte de la descripción interna
        trainingMode: newInterval.trainingMode,
        duration: newInterval.trainingMode === 'time' ? newInterval.duration : undefined,
        targetSpeed: newInterval.paceType === 'fixed' ? newInterval.targetSpeed : undefined
      } as any;

      await new Promise(resolve => setTimeout(resolve, 300));

      onAddInterval(intervalToAdd);

      // Reset form
      setNewInterval({
        trainingMode: 'distance',
        repetitions: 1,
        distance: 400,
        duration: '',
        paceType: 'fixed',
        targetSpeed: '',
        vo2maxPercentage: undefined,
        recoveryTime: '2:00',
        description: '',
        intensity: 'moderate'
      });

      const modeText = newInterval.trainingMode === 'distance' 
        ? `${newInterval.distance >= 1000 ? `${newInterval.distance/1000}K` : `${newInterval.distance}m`}`
        : newInterval.duration;

      const speedText = newInterval.trainingMode === 'distance' && newInterval.paceType === 'vo2max_percentage'
        ? `${newInterval.vo2maxPercentage}% VO₂ Max`
        : `${newInterval.targetSpeed}/km`;

      toast.success(`Serie agregada exitosamente`, {
        description: `${newInterval.repetitions} x ${modeText} a ${speedText}`
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

  const formatSpeedFromPace = (paceMinutes: number): string => {
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEditInterval = (interval: TrainingInterval) => {
    // Convertir de vuelta al formato del formulario
    const intervalAny = interval as any;
    
    // Si no hay targetSpeed pero hay pace, convertir pace a targetSpeed
    let targetSpeed = intervalAny.targetSpeed;
    if (!targetSpeed && interval.pace) {
      targetSpeed = formatSpeedFromPace(interval.pace);
    }
    
    const editingData: Omit<TrainingInterval, 'id'> = {
      type: interval.type,
      repetitions: interval.repetitions,
      distance: interval.distance,
      targetTime: interval.targetTime || '',
      recoveryTime: interval.recoveryTime,
      paceType: interval.paceType || 'fixed',
      pace: interval.pace,
      vo2maxPercentage: interval.vo2maxPercentage,
      description: interval.description || '',
      intensity: interval.intensity || 'moderate',
      trainingMode: intervalAny.trainingMode || 'distance',
      duration: intervalAny.duration || interval.targetTime,
      targetSpeed: targetSpeed || ''
    } as any;
    
    setEditingId(interval.id);
    setEditingInterval(editingData);
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
