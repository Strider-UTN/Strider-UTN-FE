import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Timer, Edit, X, Ruler, Clock, Save } from 'lucide-react';
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
            // Comparar IDs como strings para asegurar que funcione
            const isEditing = editingId !== null && String(editingId) === String(interval.id);
            const editData = editingInterval || {};
            const editDataAny = editData as any;
            
            return (
              <div key={interval.id}>
                {isEditing ? (
                  /* Modo Edición */
                  <div className="p-4 border-2 border-accent rounded-lg bg-accent/5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="font-mono">
                          Editar Serie {index + 1}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={onSaveEdit}
                            className="bg-accent hover:bg-accent/90"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={onCancelEdit}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-repetitions-${interval.id}`}>
                            Repeticiones
                          </Label>
                          <Input
                            id={`edit-repetitions-${interval.id}`}
                            type="number"
                            min="1"
                            value={editData.repetitions || 1}
                            onChange={(e) => onEditChange('repetitions', parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-intensity-${interval.id}`}>
                            Intensidad
                          </Label>
                          <Select
                            value={editData.intensity || 'moderate'}
                            onValueChange={(value) => onEditChange('intensity', value)}
                          >
                            <SelectTrigger id={`edit-intensity-${interval.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INTENSITY_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`} />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {trainingMode === 'distance' ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-distance-${interval.id}`}>
                                Distancia (metros)
                              </Label>
                              <Input
                                id={`edit-distance-${interval.id}`}
                                type="number"
                                min="100"
                                value={editData.distance || 400}
                                onChange={(e) => {
                                  onEditChange('trainingMode', 'distance');
                                  onEditChange('distance', parseInt(e.target.value) || 400);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-speed-${interval.id}`}>
                                Velocidad (min/km)
                              </Label>
                              <Input
                                id={`edit-speed-${interval.id}`}
                                placeholder="Ej: 4:30"
                                value={editDataAny.targetSpeed || ''}
                                onChange={(e) => onEditChange('targetSpeed', e.target.value)}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-duration-${interval.id}`}>
                                Duración (mm:ss)
                              </Label>
                              <Input
                                id={`edit-duration-${interval.id}`}
                                placeholder="Ej: 10:00"
                                value={editDataAny.duration || editData.targetTime || ''}
                                onChange={(e) => {
                                  onEditChange('trainingMode', 'time');
                                  onEditChange('duration', e.target.value);
                                  onEditChange('targetTime', e.target.value);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-speed-time-${interval.id}`}>
                                Velocidad (min/km)
                              </Label>
                              <Input
                                id={`edit-speed-time-${interval.id}`}
                                placeholder="Ej: 4:30"
                                value={editDataAny.targetSpeed || ''}
                                onChange={(e) => onEditChange('targetSpeed', e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-recovery-${interval.id}`}>
                          Recuperación (mm:ss)
                        </Label>
                        <Input
                          id={`edit-recovery-${interval.id}`}
                          placeholder="Ej: 2:00"
                          value={editData.recoveryTime || ''}
                          onChange={(e) => onEditChange('recoveryTime', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-description-${interval.id}`}>
                          Descripción
                        </Label>
                        <Textarea
                          id={`edit-description-${interval.id}`}
                          placeholder="Descripción opcional"
                          value={editData.description || ''}
                          onChange={(e) => onEditChange('description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Modo Lectura */
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
                          {intervalAny.paceType === 'vo2max_percentage' && intervalAny.vo2maxPercentage ? (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Velocidad:</span>
                              {intervalAny.vo2maxPercentage}% VO₂ Max
                            </span>
                          ) : intervalAny.targetSpeed ? (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Velocidad:</span>
                              {intervalAny.targetSpeed}/km
                            </span>
                          ) : null}
                          
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditInterval(interval);
                        }}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
