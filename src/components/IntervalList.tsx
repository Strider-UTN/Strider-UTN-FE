import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Timer, Edit, X, Ruler, Clock } from 'lucide-react';
import { INTENSITY_OPTIONS } from './constants/athleteIntervalConstants';
import { TrainingInterval } from './utils/athleteIntervalUtils';

interface IntervalListProps {
  intervals: TrainingInterval[];
  editingId: string | null;
  editingInterval: Omit<TrainingInterval, 'id'> | null;
  onEditInterval: (interval: TrainingInterval) => void;
  onDeleteInterval: (intervalId: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditChange: (field: keyof TrainingInterval, value: any) => void;
}

export function IntervalList({
  intervals,
  editingId,
  editingInterval,
  onEditInterval,
  onDeleteInterval,
  onSaveEdit,
  onCancelEdit,
  onEditChange
}: IntervalListProps) {
  const getIntensityInfo = (intensity: string) => {
    return INTENSITY_OPTIONS.find(opt => opt.value === intensity) || INTENSITY_OPTIONS[1];
  };

  const formatIntervalDisplay = (interval: any) => {
    const trainingMode = interval.trainingMode || 'distance';
    const repetitions = interval.repetitions || 1;
    
    if (trainingMode === 'distance') {
      const distance = interval.distance >= 1000 
        ? `${interval.distance / 1000}K` 
        : `${interval.distance}m`;
      return `${repetitions} x ${distance}`;
    } else {
      const duration = interval.duration || interval.targetTime || '0:00';
      return `${repetitions} x ${duration}`;
    }
  };

  if (intervals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No hay series configuradas</h3>
          <p className="text-sm text-muted-foreground">
            Agrega tu primera serie usando el formulario de arriba
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Series Configuradas ({intervals.length})</CardTitle>
        <CardDescription>
          Secuencia de entrenamiento programada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {intervals.map((interval, index) => {
            const intervalAny = interval as any;
            const trainingMode = intervalAny.trainingMode || 'distance';
            
            return (
              <div key={interval.id}>
                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge variant="outline" className="font-mono mt-1">
                      {index + 1}
                    </Badge>
                    
                    <div className="flex-1 space-y-2">
                      {/* Línea principal */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getIntensityInfo(interval.intensity || 'moderate').color}>
                          {getIntensityInfo(interval.intensity || 'moderate').label}
                        </Badge>
                        
                        <div className="flex items-center gap-1.5">
                          {trainingMode === 'distance' ? (
                            <Ruler className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">
                            {formatIntervalDisplay(intervalAny)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Detalles */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        {intervalAny.targetSpeed && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Velocidad:</span>
                            {intervalAny.targetSpeed}/km
                          </span>
                        )}
                        
                        {interval.recoveryTime && interval.recoveryTime !== '0:00' && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Recuperación:</span>
                            {interval.recoveryTime}
                          </span>
                        )}
                      </div>
                      
                      {/* Descripción */}
                      {interval.description && (
                        <p className="text-sm text-muted-foreground italic">
                          {interval.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditInterval(interval)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteInterval(interval.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {index < intervals.length - 1 && <Separator className="my-2" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
