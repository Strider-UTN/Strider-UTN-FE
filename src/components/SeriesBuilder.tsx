import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Plus, Trash2, GripVertical, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface IntervalInSeries {
  id: string;
  trainingMode: 'distance' | 'time';
  repetitions: number;
  distance?: number; // en metros
  duration?: string; // formato MM:SS
  paceType: 'fixed' | 'vo2max_percentage'; // Tipo de velocidad
  targetSpeed?: string; // ritmo en min/km - solo para fixed
  vo2maxPercentage?: number; // Porcentaje de VO2Max - solo para vo2max_percentage
  description?: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
}

interface SeriesSet {
  id: string;
  name: string;
  repetitions: number; // Cuántas veces se repite toda la serie
  intervals: IntervalInSeries[]; // Los diferentes intervalos dentro de la serie
  recoveryBetweenSets: string; // Recuperación entre cada repetición de la serie completa
}

interface SeriesBuilderProps {
  series: SeriesSet[];
  onAddSeries: (series: Omit<SeriesSet, 'id'>) => void;
  onUpdateSeries: (seriesId: string, series: Omit<SeriesSet, 'id'>) => void;
  onDeleteSeries: (seriesId: string) => void;
}

export function SeriesBuilder({ 
  series, 
  onAddSeries, 
  onUpdateSeries, 
  onDeleteSeries 
}: SeriesBuilderProps) {
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);
  
  // Estado para nueva serie
  const [newSeries, setNewSeries] = useState<Omit<SeriesSet, 'id'>>({
    name: '',
    repetitions: 3,
    intervals: [],
    recoveryBetweenSets: '3:00'
  });

  // Estado para nuevo intervalo dentro de la serie
  const [newInterval, setNewInterval] = useState<Omit<IntervalInSeries, 'id'>>({
    trainingMode: 'distance',
    repetitions: 4,
    distance: 200,
    paceType: 'fixed',
    targetSpeed: '4:00',
    intensity: 'hard'
  });

  const toggleSeriesExpansion = (seriesId: string) => {
    setExpandedSeries(prev => 
      prev.includes(seriesId) 
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  const handleAddIntervalToNewSeries = () => {
    // Validaciones
    if (newInterval.repetitions < 1) {
      toast.error('Las repeticiones deben ser al menos 1');
      return;
    }

    if (newInterval.trainingMode === 'distance' && (!newInterval.distance || newInterval.distance < 100)) {
      toast.error('La distancia mínima es 100 metros');
      return;
    }

    if (newInterval.trainingMode === 'time' && !newInterval.duration) {
      toast.error('Debes especificar la duración');
      return;
    }

    if (newInterval.trainingMode === 'distance') {
      if (newInterval.paceType === 'fixed' && !newInterval.targetSpeed) {
        toast.error('Debes especificar la velocidad objetivo');
        return;
      }
      if (newInterval.paceType === 'vo2max_percentage' && (!newInterval.vo2maxPercentage || newInterval.vo2maxPercentage <= 0 || newInterval.vo2maxPercentage > 100)) {
        toast.error('Debes especificar un porcentaje de VO2Max válido (1-100)');
        return;
      }
    } else {
      if (!newInterval.targetSpeed) {
        toast.error('Debes especificar la velocidad objetivo');
        return;
      }
    }

    const intervalToAdd: IntervalInSeries = {
      id: `interval-${Date.now()}-${Math.random()}`,
      ...newInterval
    };

    setNewSeries(prev => ({
      ...prev,
      intervals: [...prev.intervals, intervalToAdd]
    }));

    // Reset interval form
    setNewInterval({
      trainingMode: 'distance',
      repetitions: 4,
      distance: 200,
      paceType: 'fixed',
      targetSpeed: '4:00',
      intensity: 'hard'
    });

    toast.success('Intervalo agregado a la serie');
  };

  const handleRemoveIntervalFromNewSeries = (intervalId: string) => {
    setNewSeries(prev => ({
      ...prev,
      intervals: prev.intervals.filter(int => int.id !== intervalId)
    }));
  };

  const handleSaveSeries = () => {
    if (!newSeries.name.trim()) {
      toast.error('Debes especificar un nombre para la serie');
      return;
    }

    if (newSeries.intervals.length === 0) {
      toast.error('Debes agregar al menos un intervalo a la serie');
      return;
    }

    if (newSeries.repetitions < 1) {
      toast.error('Las repeticiones de la serie deben ser al menos 1');
      return;
    }

    onAddSeries(newSeries);
    
    // Reset
    setNewSeries({
      name: '',
      repetitions: 3,
      intervals: [],
      recoveryBetweenSets: '3:00'
    });
    setIsCreatingSeries(false);
    
    toast.success('Serie creada exitosamente');
  };

  const handleDuplicateSeries = (seriesToDuplicate: SeriesSet) => {
    const duplicated: Omit<SeriesSet, 'id'> = {
      name: `${seriesToDuplicate.name} (copia)`,
      repetitions: seriesToDuplicate.repetitions,
      intervals: seriesToDuplicate.intervals.map(int => ({
        ...int,
        id: `interval-${Date.now()}-${Math.random()}`
      })),
      recoveryBetweenSets: seriesToDuplicate.recoveryBetweenSets
    };
    
    onAddSeries(duplicated);
    toast.success('Serie duplicada');
  };

  const formatIntervalDisplay = (interval: IntervalInSeries): string => {
    if (interval.trainingMode === 'distance') {
      let speedText: string;
      const intervalAny = interval as any; // Para acceder a propiedades que pueden venir del backend
      const paceTypeStr = String(interval.paceType || '');
      const isVo2MaxPercentage = paceTypeStr === 'vo2max_percentage' || 
                                 paceTypeStr.toLowerCase() === 'vo2maxpercentage' || 
                                 paceTypeStr === 'vo2MaxPercentage';
      const vo2MaxValue = interval.vo2maxPercentage ?? intervalAny.vo2MaxPercentage;
      
      if (isVo2MaxPercentage && vo2MaxValue) {
        speedText = `${vo2MaxValue}% VO₂ Max`;
      } else if (interval.targetSpeed) {
        speedText = `${interval.targetSpeed}/km`;
      } else {
        speedText = 'N/A';
      }
      return `${interval.repetitions}x${interval.distance}m @ ${speedText}`;
    } else {
      return `${interval.repetitions}x${interval.duration} @ ${interval.targetSpeed || 'N/A'}/km`;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'easy': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'moderate': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'hard': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'very_hard': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'max': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default: return 'bg-muted';
    }
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'easy': return 'Suave';
      case 'moderate': return 'Moderado';
      case 'hard': return 'Fuerte';
      case 'very_hard': return 'Muy Fuerte';
      case 'max': return 'Máximo';
      default: return intensity;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg">Series con Intervalos</h3>
          <p className="text-sm text-muted-foreground">
            Crea series que contienen múltiples tipos de intervalos
          </p>
        </div>
        {!isCreatingSeries && (
          <Button onClick={() => setIsCreatingSeries(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Serie
          </Button>
        )}
      </div>

      {/* Formulario para crear nueva serie */}
      {isCreatingSeries && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Crear Nueva Serie</CardTitle>
            <CardDescription>
              Ejemplo: 3 series de 4x200m + 6x500m
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuración básica de la serie */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nombre de la Serie</Label>
                <Input
                  placeholder="Ej: Series piramidales"
                  value={newSeries.name}
                  onChange={(e) => setNewSeries(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Repeticiones de la Serie</Label>
                <Input
                  type="number"
                  min="1"
                  value={newSeries.repetitions}
                  onChange={(e) => setNewSeries(prev => ({ ...prev, repetitions: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-xs text-muted-foreground">
                  Veces que se repite toda la serie
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recuperación entre Series</Label>
              <Input
                placeholder="MM:SS"
                value={newSeries.recoveryBetweenSets}
                onChange={(e) => setNewSeries(prev => ({ ...prev, recoveryBetweenSets: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo de recuperación entre cada repetición de la serie completa
              </p>
            </div>

            <Separator />

            {/* Intervalos dentro de la serie */}
            <div className="space-y-3">
              <Label>Intervalos dentro de la Serie</Label>
              
              {newSeries.intervals.length > 0 && (
                <div className="space-y-2">
                  {newSeries.intervals.map((interval, index) => (
                    <div 
                      key={interval.id}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">
                          {index + 1}. {formatIntervalDisplay(interval)}
                        </p>
                        {interval.description && (
                          <p className="text-xs text-muted-foreground">{interval.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={getIntensityColor(interval.intensity)}>
                        {getIntensityLabel(interval.intensity)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIntervalFromNewSeries(interval.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar intervalo */}
              <Card className="bg-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Agregar Intervalo a la Serie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Modo</Label>
                      <Select
                        value={newInterval.trainingMode}
                        onValueChange={(value: 'distance' | 'time') => 
                          setNewInterval(prev => ({ ...prev, trainingMode: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="distance">Por Distancia</SelectItem>
                          <SelectItem value="time">Por Tiempo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Repeticiones</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newInterval.repetitions}
                        onChange={(e) => setNewInterval(prev => ({ 
                          ...prev, 
                          repetitions: parseInt(e.target.value) || 1 
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {newInterval.trainingMode === 'distance' ? (
                      <div className="space-y-2">
                        <Label className="text-xs">Distancia (metros)</Label>
                        <Input
                          type="number"
                          min="100"
                          step="50"
                          placeholder="200"
                          value={newInterval.distance || ''}
                          onChange={(e) => setNewInterval(prev => ({ 
                            ...prev, 
                            distance: parseInt(e.target.value) || undefined 
                          }))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs">Duración (MM:SS)</Label>
                        <Input
                          placeholder="02:00"
                          value={newInterval.duration || ''}
                          onChange={(e) => setNewInterval(prev => ({ 
                            ...prev, 
                            duration: e.target.value 
                          }))}
                        />
                      </div>
                    )}

                    {newInterval.trainingMode === 'distance' ? (
                      <div className="space-y-2">
                        <Label className="text-xs">Tipo de Velocidad</Label>
                        <Select
                          value={newInterval.paceType}
                          onValueChange={(value: 'fixed' | 'vo2max_percentage') => {
                            setNewInterval(prev => {
                              const updated = { ...prev, paceType: value };
                              // Resetear campos cuando cambia el tipo
                              if (value === 'fixed') {
                                updated.vo2maxPercentage = undefined;
                              } else {
                                updated.targetSpeed = undefined;
                              }
                              return updated;
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Velocidad Fija</SelectItem>
                            <SelectItem value="vo2max_percentage">% VO₂ Max</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs">Velocidad (min/km)</Label>
                        <Input
                          placeholder="4:00"
                          value={newInterval.targetSpeed || ''}
                          onChange={(e) => setNewInterval(prev => ({ 
                            ...prev, 
                            targetSpeed: e.target.value 
                          }))}
                        />
                      </div>
                    )}
                  </div>

                  {newInterval.trainingMode === 'distance' && (
                    <div className="space-y-2">
                      {newInterval.paceType === 'fixed' ? (
                        <div className="space-y-2">
                          <Label className="text-xs">Velocidad (min/km)</Label>
                          <Input
                            placeholder="4:00"
                            value={newInterval.targetSpeed || ''}
                            onChange={(e) => setNewInterval(prev => ({ 
                              ...prev, 
                              targetSpeed: e.target.value 
                            }))}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-xs">Porcentaje de VO₂ Max</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="85"
                            value={newInterval.vo2maxPercentage || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              setNewInterval(prev => ({ 
                                ...prev, 
                                vo2maxPercentage: value 
                              }));
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Porcentaje de la velocidad máxima del atleta (1-100%)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Intensidad</Label>
                    <Select
                      value={newInterval.intensity}
                      onValueChange={(value: any) => 
                        setNewInterval(prev => ({ ...prev, intensity: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Suave</SelectItem>
                        <SelectItem value="moderate">Moderado</SelectItem>
                        <SelectItem value="hard">Fuerte</SelectItem>
                        <SelectItem value="very_hard">Muy Fuerte</SelectItem>
                        <SelectItem value="max">Máximo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Descripción (opcional)</Label>
                    <Input
                      placeholder="Ej: Ritmo de 5K"
                      value={newInterval.description || ''}
                      onChange={(e) => setNewInterval(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                    />
                  </div>

                  <Button 
                    onClick={handleAddIntervalToNewSeries} 
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Intervalo
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Vista previa de la serie */}
            {newSeries.intervals.length > 0 && (
              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <p className="text-sm">Vista previa:</p>
                <p className="text-sm">
                  <strong>{newSeries.repetitions} series</strong> de{' '}
                  {newSeries.intervals.map((int, idx) => (
                    <span key={int.id}>
                      {idx > 0 && ' + '}
                      <strong>{int.repetitions}x{int.trainingMode === 'distance' ? `${int.distance}m` : int.duration}</strong>
                    </span>
                  ))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Recuperación entre series: {newSeries.recoveryBetweenSets}
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveSeries}
                disabled={newSeries.intervals.length === 0}
                className="flex-1"
              >
                Guardar Serie
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsCreatingSeries(false);
                  setNewSeries({
                    name: '',
                    repetitions: 3,
                    intervals: [],
                    recoveryBetweenSets: '3:00'
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de series existentes */}
      {series.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {series.length} {series.length === 1 ? 'serie configurada' : 'series configuradas'}
          </p>
          
          {series.map((s, idx) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <CardTitle className="text-base">{s.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      {s.repetitions} {s.repetitions === 1 ? 'serie' : 'series'} de{' '}
                      {s.intervals.map((int, intIdx) => (
                        <span key={int.id}>
                          {intIdx > 0 && ' + '}
                          <strong>{int.repetitions}x{int.trainingMode === 'distance' ? `${int.distance}m` : int.duration}</strong>
                        </span>
                      ))}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateSeries(s)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSeriesExpansion(s.id)}
                    >
                      {expandedSeries.includes(s.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteSeries(s.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedSeries.includes(s.id) && (
                <CardContent className="space-y-2 pt-0">
                  <Separator className="mb-3" />
                  <div className="space-y-2">
                    <p className="text-sm">Intervalos en la serie:</p>
                    {s.intervals.map((interval, intIdx) => (
                      <div 
                        key={interval.id}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded"
                      >
                        <span className="text-xs text-muted-foreground w-6">{intIdx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm">{formatIntervalDisplay(interval)}</p>
                          {interval.description && (
                            <p className="text-xs text-muted-foreground">{interval.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={getIntensityColor(interval.intensity)}>
                          {getIntensityLabel(interval.intensity)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Recuperación entre series: {s.recoveryBetweenSets}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {series.length === 0 && !isCreatingSeries && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No hay series configuradas. Haz clic en "Nueva Serie" para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
