import React, { useState } from 'react';
import { IntervalForm } from './IntervalForm';
import { IntervalList } from './IntervalList';
import { TrainingInterval, calculateTargetTimeFromPace } from './utils/athleteIntervalUtils';
import { toast } from 'sonner';

interface AthleteIntervalBuilderProps {
  intervals: TrainingInterval[];
  onAddInterval: (interval: Omit<TrainingInterval, 'id'>) => void;
  onUpdateInterval: (intervalId: string, interval: Omit<TrainingInterval, 'id'>) => void;
  onDeleteInterval: (intervalId: string) => void;
}

export function AthleteIntervalBuilder({ 
  intervals, 
  onAddInterval, 
  onUpdateInterval, 
  onDeleteInterval 
}: AthleteIntervalBuilderProps) {
  const [newInterval, setNewInterval] = useState({
    type: 'interval' as 'interval' | 'continuous' | 'recovery',
    repetitions: 1,
    distance: 400,
    targetTime: '',
    recoveryTime: '2:00',
    paceType: 'vo2max_percentage' as 'fixed' | 'vo2max_percentage',
    pace: 4.0,
    vo2maxPercentage: 85,
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
    if (newInterval.type === 'interval' && newInterval.repetitions < 1) {
      toast.error('Las repeticiones deben ser al menos 1');
      return;
    }

    if (newInterval.distance < 100) {
      toast.error('La distancia mínima es 100 metros');
      return;
    }

    if (newInterval.vo2maxPercentage < 50 || newInterval.vo2maxPercentage > 110) {
      toast.error('El % VO₂ Max debe estar entre 50% y 110%');
      return;
    }

    setIsAdding(true);

    try {
      // Auto-rellenar tiempo objetivo si no se proporciona
      let finalTargetTime = newInterval.targetTime;
      if (!finalTargetTime && newInterval.paceType === 'vo2max_percentage') {
        const estimatedPace = newInterval.vo2maxPercentage! / 100 * 4.0; // Asumiendo VO2 max base de 4:00/km
        finalTargetTime = calculateTargetTimeFromPace(newInterval.distance, estimatedPace);
      }

      // Simular una pequeña demora para mostrar el estado de carga
      await new Promise(resolve => setTimeout(resolve, 300));

      onAddInterval({
        ...newInterval,
        targetTime: finalTargetTime
      });

      // Reset form
      setNewInterval({
        type: 'interval',
        repetitions: 1,
        distance: 400,
        targetTime: '',
        recoveryTime: '2:00',
        paceType: 'vo2max_percentage',
        pace: 4.0,
        vo2maxPercentage: 85,
        description: '',
        intensity: 'moderate'
      });

      toast.success(`Intervalo agregado exitosamente`, {
        description: `${newInterval.type === 'continuous' 
          ? `${newInterval.distance >= 1000 ? `${newInterval.distance/1000}K` : `${newInterval.distance}m`} continuo`
          : `${newInterval.repetitions} x ${newInterval.distance >= 1000 ? `${newInterval.distance/1000}K` : `${newInterval.distance}m`}`
        }`
      });
    } catch (error) {
      toast.error('Error al agregar el intervalo');
      console.error('Error adding interval:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditInterval = (interval: TrainingInterval) => {
    setEditingId(interval.id);
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
      intensity: interval.intensity || 'moderate'
    });
  };

  const handleSaveEdit = () => {
    if (!editingInterval || !editingId) return;

    onUpdateInterval(editingId, editingInterval);
    setEditingId(null);
    setEditingInterval(null);
    toast.success('Intervalo actualizado');
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