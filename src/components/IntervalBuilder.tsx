import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Plus, Minus, Timer, Play, Square, Save, X, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface IntervalSet {
  id: string;
  repetitions: number;
  distance: number; // metros
  pace: string; // min:seg
  recovery: {
    type: 'activa' | 'pasiva' | 'trote';
    duration: number; // segundos
    distance?: number; // metros (si es activa)
  };
  intensity: string;
  description?: string;
}

interface IntervalBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (intervals: IntervalSet[]) => void;
  existingIntervals?: IntervalSet[];
}

export function IntervalBuilder({ 
  isOpen, 
  onClose, 
  onSave, 
  existingIntervals = [] 
}: IntervalBuilderProps) {
  const [intervals, setIntervals] = useState<IntervalSet[]>(existingIntervals);
  const [currentInterval, setCurrentInterval] = useState<Partial<IntervalSet>>({
    repetitions: 1,
    distance: 400,
    pace: '4:00',
    recovery: {
      type: 'activa',
      duration: 90
    },
    intensity: 'vo2max'
  });

  const intensityColors = {
    'recuperación': 'bg-blue-100 text-blue-700 border-blue-200',
    'aeróbico': 'bg-green-100 text-green-700 border-green-200',
    'umbral': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'vo2max': 'bg-orange-100 text-orange-700 border-orange-200',
    'anaeróbico': 'bg-red-100 text-red-700 border-red-200'
  };

  const recoveryTypeLabels = {
    'activa': 'Activa (trote)',
    'pasiva': 'Pasiva (parado)',
    'trote': 'Trote suave'
  };

  const commonDistances = [200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 1600, 2000];
  const commonPaces = ['3:30', '3:45', '4:00', '4:15', '4:30', '4:45', '5:00', '5:15', '5:30'];

  const addInterval = () => {
    if (!currentInterval.repetitions || !currentInterval.distance || !currentInterval.pace) {
      toast.error('Completa todos los campos del intervalo');
      return;
    }

    const newInterval: IntervalSet = {
      id: `interval_${Date.now()}`,
      repetitions: currentInterval.repetitions!,
      distance: currentInterval.distance!,
      pace: currentInterval.pace!,
      recovery: currentInterval.recovery!,
      intensity: currentInterval.intensity!,
      description: currentInterval.description
    };

    setIntervals(prev => [...prev, newInterval]);

    // Resetear formulario
    setCurrentInterval({
      repetitions: 1,
      distance: 400,
      pace: '4:00',
      recovery: {
        type: 'activa',
        duration: 90
      },
      intensity: 'vo2max'
    });

    toast.success('Intervalo agregado');
  };

  const removeInterval = (intervalId: string) => {
    setIntervals(prev => prev.filter(interval => interval.id !== intervalId));
    toast.success('Intervalo eliminado');
  };

  const generatePreset = (type: string) => {
    let preset: Partial<IntervalSet>[] = [];

    switch (type) {
      case 'vo2max_short':
        preset = [
          {
            repetitions: 6,
            distance: 400,
            pace: '3:45',
            recovery: { type: 'activa', duration: 90 },
            intensity: 'vo2max',
            description: '6 x 400m VO2 Max'
          }
        ];
        break;

      case 'vo2max_long':
        preset = [
          {
            repetitions: 4,
            distance: 1000,
            pace: '4:00',
            recovery: { type: 'activa', duration: 180 },
            intensity: 'vo2max',
            description: '4 x 1000m VO2 Max'
          }
        ];
        break;

      case 'umbral':
        preset = [
          {
            repetitions: 3,
            distance: 1600,
            pace: '4:20',
            recovery: { type: 'activa', duration: 120 },
            intensity: 'umbral',
            description: '3 x 1600m Umbral'
          }
        ];
        break;

      case 'velocidad':
        preset = [
          {
            repetitions: 8,
            distance: 200,
            pace: '3:20',
            recovery: { type: 'activa', duration: 120 },
            intensity: 'anaeróbico',
            description: '8 x 200m Velocidad'
          }
        ];
        break;

      case 'piramide':
        preset = [
          {
            repetitions: 1,
            distance: 400,
            pace: '3:50',
            recovery: { type: 'activa', duration: 90 },
            intensity: 'vo2max',
            description: '400m'
          },
          {
            repetitions: 1,
            distance: 800,
            pace: '4:00',
            recovery: { type: 'activa', duration: 120 },
            intensity: 'vo2max',
            description: '800m'
          },
          {
            repetitions: 1,
            distance: 1200,
            pace: '4:10',
            recovery: { type: 'activa', duration: 180 },
            intensity: 'umbral',
            description: '1200m'
          },
          {
            repetitions: 1,
            distance: 800,
            pace: '4:00',
            recovery: { type: 'activa', duration: 120 },
            intensity: 'vo2max',
            description: '800m'
          },
          {
            repetitions: 1,
            distance: 400,
            pace: '3:50',
            recovery: { type: 'activa', duration: 90 },
            intensity: 'vo2max',
            description: '400m'
          }
        ];
        break;
    }

    const newIntervals = preset.map((p, index) => ({
      id: `preset_${Date.now()}_${index}`,
      ...p
    })) as IntervalSet[];

    setIntervals(newIntervals);
    toast.success(`Configuración ${type} aplicada`);
  };

  const calculateTotalVolume = () => {
    return intervals.reduce((total, interval) => {
      return total + ((interval.distance * interval.repetitions) / 1000);
    }, 0);
  };

  const calculateTotalTime = () => {
    return intervals.reduce((total, interval) => {
      const paceMinutes = convertPaceToMinutes(interval.pace);
      const runTime = (interval.distance / 1000) * paceMinutes * interval.repetitions;
      const recoveryTime = (interval.recovery.duration * (interval.repetitions - 1)) / 60;
      return total + runTime + recoveryTime;
    }, 0);
  };

  const convertPaceToMinutes = (pace: string): number => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes + (seconds / 60);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const handleSave = () => {
    if (intervals.length === 0) {
      toast.error('Agrega al menos un intervalo');
      return;
    }

    onSave(intervals);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Constructor de Intervalos
          </DialogTitle>
          <DialogDescription>
            Configura series y repeticiones con recuperaciones específicas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuraciones predefinidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuraciones Predefinidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => generatePreset('vo2max_short')}
                  className="text-sm"
                >
                  6 x 400m VO2
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generatePreset('vo2max_long')}
                  className="text-sm"
                >
                  4 x 1000m VO2
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generatePreset('umbral')}
                  className="text-sm"
                >
                  3 x 1600m Umbral
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generatePreset('velocidad')}
                  className="text-sm"
                >
                  8 x 200m Velocidad
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generatePreset('piramide')}
                  className="text-sm"
                >
                  Pirámide Clásica
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIntervals([])}
                  className="text-sm"
                >
                  Limpiar Todo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {intervals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{calculateTotalVolume().toFixed(1)}km</div>
                  <p className="text-sm text-muted-foreground">Volumen de Intervalos</p>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{formatTime(calculateTotalTime())}</div>
                  <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{intervals.length}</div>
                  <p className="text-sm text-muted-foreground">Series Configuradas</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Formulario para nuevo intervalo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agregar Nueva Serie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repetitions">Repeticiones</Label>
                  <Input
                    id="repetitions"
                    type="number"
                    min="1"
                    max="20"
                    value={currentInterval.repetitions || ''}
                    onChange={(e) => setCurrentInterval(prev => ({ 
                      ...prev, 
                      repetitions: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance">Distancia (m)</Label>
                  <Select 
                    value={currentInterval.distance?.toString() || ''} 
                    onValueChange={(value) => setCurrentInterval(prev => ({ 
                      ...prev, 
                      distance: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Distancia" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonDistances.map(distance => (
                        <SelectItem key={distance} value={distance.toString()}>
                          {distance}m
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pace">Ritmo (min:seg/km)</Label>
                  <Select 
                    value={currentInterval.pace || ''} 
                    onValueChange={(value) => setCurrentInterval(prev => ({ 
                      ...prev, 
                      pace: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ritmo" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonPaces.map(pace => (
                        <SelectItem key={pace} value={pace}>
                          {pace}/km
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensidad</Label>
                  <Select 
                    value={currentInterval.intensity || ''} 
                    onValueChange={(value) => setCurrentInterval(prev => ({ 
                      ...prev, 
                      intensity: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recuperación">Recuperación</SelectItem>
                      <SelectItem value="aeróbico">Aeróbico</SelectItem>
                      <SelectItem value="umbral">Umbral</SelectItem>
                      <SelectItem value="vo2max">VO2 Max</SelectItem>
                      <SelectItem value="anaeróbico">Anaeróbico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recoveryType">Tipo de recuperación</Label>
                  <Select 
                    value={currentInterval.recovery?.type || ''} 
                    onValueChange={(value: 'activa' | 'pasiva' | 'trote') => 
                      setCurrentInterval(prev => ({ 
                        ...prev, 
                        recovery: { ...prev.recovery!, type: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activa">Activa (trote)</SelectItem>
                      <SelectItem value="pasiva">Pasiva (parado)</SelectItem>
                      <SelectItem value="trote">Trote suave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoveryDuration">Duración recuperación (seg)</Label>
                  <Input
                    id="recoveryDuration"
                    type="number"
                    min="30"
                    max="600"
                    value={currentInterval.recovery?.duration || ''}
                    onChange={(e) => setCurrentInterval(prev => ({ 
                      ...prev, 
                      recovery: { ...prev.recovery!, duration: parseInt(e.target.value) || 90 }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoveryDistance">Distancia rec. (m) - Opcional</Label>
                  <Input
                    id="recoveryDistance"
                    type="number"
                    placeholder="200"
                    value={currentInterval.recovery?.distance || ''}
                    onChange={(e) => setCurrentInterval(prev => ({ 
                      ...prev, 
                      recovery: { 
                        ...prev.recovery!, 
                        distance: parseInt(e.target.value) || undefined 
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ej: Series principales del entrenamiento"
                  value={currentInterval.description || ''}
                  onChange={(e) => setCurrentInterval(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                />
              </div>

              <Button 
                onClick={addInterval}
                disabled={!currentInterval.repetitions || !currentInterval.distance || !currentInterval.pace}
                className="bg-accent hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Serie
              </Button>
            </CardContent>
          </Card>

          {/* Lista de intervalos configurados */}
          {intervals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Series Configuradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intervals.map((interval, index) => (
                    <Card key={interval.id} className="border-l-4 border-l-accent">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                {interval.repetitions} x {interval.distance}m a {interval.pace}/km
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Recuperación: {recoveryTypeLabels[interval.recovery.type]} - {interval.recovery.duration}seg
                                {interval.recovery.distance && ` (${interval.recovery.distance}m)`}
                              </div>
                              {interval.description && (
                                <div className="text-sm text-muted-foreground">
                                  {interval.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={intensityColors[interval.intensity]} 
                              variant="outline"
                            >
                              {interval.intensity}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInterval(interval.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={intervals.length === 0}
            className="bg-accent hover:bg-accent/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Aplicar Intervalos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}