import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Timer, Edit, X, Check } from 'lucide-react';
import { DISTANCE_OPTIONS, INTENSITY_OPTIONS } from './constants/athleteIntervalConstants';
import { TrainingInterval, formatIntervalDisplay } from './utils/athleteIntervalUtils';

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

  if (intervals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No hay intervalos configurados</h3>
          <p className="text-sm text-muted-foreground">
            Agrega tu primer intervalo usando el formulario de arriba
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intervalos Configurados ({intervals.length})</CardTitle>
        <CardDescription>
          Secuencia de entrenamiento programada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {intervals.map((interval, index) => (
            <div key={interval.id}>
              {editingId === interval.id ? (
                // Formulario de edición
                <Card className="border-2 border-accent">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Editando Intervalo {index + 1}</h4>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={onSaveEdit}>
                          <Check className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={onCancelEdit}>
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    
                    {editingInterval && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Repeticiones</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editingInterval.repetitions}
                            onChange={(e) => onEditChange('repetitions', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Distancia</Label>
                          <Select
                            value={editingInterval.distance.toString()}
                            onValueChange={(value) => onEditChange('distance', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DISTANCE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tiempo (mm:ss)</Label>
                          <Input
                            value={editingInterval.targetTime || ''}
                            onChange={(e) => onEditChange('targetTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Recuperación</Label>
                          <Input
                            value={editingInterval.recoveryTime}
                            onChange={(e) => onEditChange('recoveryTime', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Vista normal del intervalo
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getIntensityInfo(interval.intensity || 'moderate').color}>
                          {getIntensityInfo(interval.intensity || 'moderate').label}
                        </Badge>
                        <span className="font-medium">
                          {formatIntervalDisplay(interval)}
                        </span>
                        {interval.targetTime && (
                          <span className="text-muted-foreground">• {interval.targetTime}</span>
                        )}
                      </div>
                      {interval.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {interval.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              )}
              
              {index < intervals.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}