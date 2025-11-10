import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Ruler, Clock, AlertCircle } from 'lucide-react';
import { INTENSITY_OPTIONS } from './constants/athleteIntervalConstants';
import { Separator } from './ui/separator';

interface IntervalFormData {
  trainingMode: 'distance' | 'time'; // Nuevo: tipo de entrenamiento
  repetitions: number;
  distance: number; // Para modo distancia
  duration: string; // Para modo tiempo (formato mm:ss)
  targetSpeed: string; // Velocidad en min/km (formato mm:ss)
  recoveryTime: string;
  description: string;
  intensity: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
}

interface IntervalFormProps {
  formData: IntervalFormData;
  onFormChange: (field: keyof IntervalFormData, value: any) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function IntervalForm({ formData, onFormChange, onSubmit, isLoading = false }: IntervalFormProps) {
  const getIntensityInfo = (intensity: string) => {
    return INTENSITY_OPTIONS.find(opt => opt.value === intensity) || INTENSITY_OPTIONS[1];
  };

  const distanceOptions = [
    { value: 200, label: '200m' },
    { value: 300, label: '300m' },
    { value: 400, label: '400m' },
    { value: 500, label: '500m' },
    { value: 600, label: '600m' },
    { value: 800, label: '800m' },
    { value: 1000, label: '1000m (1K)' },
    { value: 1200, label: '1200m' },
    { value: 1500, label: '1500m' },
    { value: 2000, label: '2000m (2K)' },
    { value: 3000, label: '3000m (3K)' },
    { value: 5000, label: '5000m (5K)' },
    { value: 8000, label: '8000m (8K)' },
    { value: 10000, label: '10000m (10K)' },
    { value: 15000, label: '15000m (15K)' },
  ];

  // Validación en tiempo real
  const isFormValid = () => {
    const hasValidRepetitions = formData.repetitions >= 1;
    const hasValidRecovery = formData.recoveryTime.trim() !== '';
    
    if (formData.trainingMode === 'distance') {
      return hasValidRepetitions && formData.distance >= 100 && formData.targetSpeed.trim() !== '' && hasValidRecovery;
    } else {
      return hasValidRepetitions && formData.duration.trim() !== '' && formData.targetSpeed.trim() !== '' && hasValidRecovery;
    }
  };

  const getValidationErrors = () => {
    const errors = [];
    
    if (formData.repetitions < 1) {
      errors.push('Las repeticiones deben ser al menos 1');
    }
    
    if (formData.trainingMode === 'distance') {
      if (formData.distance < 100) {
        errors.push('La distancia mínima es 100 metros');
      }
      if (!formData.targetSpeed.trim()) {
        errors.push('Debes especificar la velocidad objetivo');
      }
    } else {
      if (!formData.duration.trim()) {
        errors.push('Debes especificar la duración');
      }
      if (!formData.targetSpeed.trim()) {
        errors.push('Debes especificar la velocidad objetivo');
      }
    }
    
    if (!formData.recoveryTime.trim()) {
      errors.push('Debes especificar el tiempo de recuperación');
    }
    
    return errors;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      return;
    }
    onSubmit();
  };

  // Calcular distancia estimada en modo tiempo
  const calculateEstimatedDistance = () => {
    if (formData.trainingMode === 'time' && formData.duration && formData.targetSpeed) {
      try {
        const [durationMin, durationSec] = formData.duration.split(':').map(Number);
        const totalDurationMin = durationMin + (durationSec || 0) / 60;
        
        const [speedMin, speedSec] = formData.targetSpeed.split(':').map(Number);
        const pacePerKm = speedMin + (speedSec || 0) / 60;
        
        if (pacePerKm > 0) {
          const distanceKm = totalDurationMin / pacePerKm;
          return (distanceKm * 1000).toFixed(0);
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Calcular tiempo estimado en modo distancia
  const calculateEstimatedTime = () => {
    if (formData.trainingMode === 'distance' && formData.distance && formData.targetSpeed) {
      try {
        const [speedMin, speedSec] = formData.targetSpeed.split(':').map(Number);
        const pacePerKm = speedMin + (speedSec || 0) / 60;
        
        const distanceKm = formData.distance / 1000;
        const totalMin = distanceKm * pacePerKm;
        const minutes = Math.floor(totalMin);
        const seconds = Math.round((totalMin - minutes) * 60);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const estimatedDistance = calculateEstimatedDistance();
  const estimatedTime = calculateEstimatedTime();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Agregar Serie
        </CardTitle>
        <CardDescription>
          Define las características del entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de Tipo de Entrenamiento */}
        <div className="space-y-3">
          <Label className="text-base">Tipo de Entrenamiento</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onFormChange('trainingMode', 'distance')}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.trainingMode === 'distance'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Ruler className={`w-6 h-6 ${formData.trainingMode === 'distance' ? 'text-accent' : 'text-gray-500'}`} />
                <span className={`font-medium ${formData.trainingMode === 'distance' ? 'text-accent' : 'text-gray-700'}`}>
                  Distancia
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Setear distancia y velocidad
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onFormChange('trainingMode', 'time')}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.trainingMode === 'time'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Clock className={`w-6 h-6 ${formData.trainingMode === 'time' ? 'text-accent' : 'text-gray-500'}`} />
                <span className={`font-medium ${formData.trainingMode === 'time' ? 'text-accent' : 'text-gray-700'}`}>
                  Tiempo
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Setear tiempo y velocidad
                </span>
              </div>
            </button>
          </div>
        </div>

        <Separator />

        {/* Parámetros Comunes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="repetitions">
              Repeticiones <span className="text-red-500">*</span>
            </Label>
            <Input
              id="repetitions"
              type="number"
              min="1"
              max="50"
              value={formData.repetitions}
              onChange={(e) => onFormChange('repetitions', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity">
              Intensidad <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.intensity}
              onValueChange={(value: any) => onFormChange('intensity', value)}
            >
              <SelectTrigger id="intensity">
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

        {/* Parámetros Específicos por Modo */}
        <div className="space-y-4">
          {formData.trainingMode === 'distance' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">
                    Distancia <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.distance.toString()}
                    onValueChange={(value) => onFormChange('distance', parseInt(value))}
                  >
                    <SelectTrigger id="distance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {distanceOptions.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetSpeed">
                    Velocidad (min/km) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="targetSpeed"
                    placeholder="Ej: 4:30"
                    value={formData.targetSpeed}
                    onChange={(e) => onFormChange('targetSpeed', e.target.value)}
                  />
                  {estimatedTime && (
                    <p className="text-xs text-muted-foreground">
                      Tiempo estimado: {estimatedTime}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duración (mm:ss) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    placeholder="Ej: 10:00"
                    value={formData.duration}
                    onChange={(e) => onFormChange('duration', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetSpeed-time">
                    Velocidad (min/km) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="targetSpeed-time"
                    placeholder="Ej: 4:30"
                    value={formData.targetSpeed}
                    onChange={(e) => onFormChange('targetSpeed', e.target.value)}
                  />
                  {estimatedDistance && (
                    <p className="text-xs text-muted-foreground">
                      Distancia estimada: {estimatedDistance}m
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="recoveryTime">
              Recuperación (mm:ss) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recoveryTime"
              placeholder="Ej: 2:00"
              value={formData.recoveryTime}
              onChange={(e) => onFormChange('recoveryTime', e.target.value)}
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Ej: Series a ritmo de 5K, mantener cadencia alta"
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            rows={2}
          />
        </div>

        {/* Vista Previa */}
        <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2 text-accent">Vista previa:</p>
          <div className="flex items-center flex-wrap gap-2">
            <Badge className={getIntensityInfo(formData.intensity).color}>
              {getIntensityInfo(formData.intensity).label}
            </Badge>
            <span className="font-medium">
              {formData.repetitions} x {
                formData.trainingMode === 'distance' 
                  ? (formData.distance >= 1000 ? `${formData.distance/1000}K` : `${formData.distance}m`)
                  : formData.duration || '0:00'
              }
            </span>
            {formData.targetSpeed && (
              <span className="text-muted-foreground">• Velocidad: {formData.targetSpeed}/km</span>
            )}
            {formData.recoveryTime && (
              <span className="text-muted-foreground">• Rec: {formData.recoveryTime}</span>
            )}
          </div>
          {formData.description && (
            <p className="text-sm text-muted-foreground mt-2">{formData.description}</p>
          )}
        </div>

        {/* Errores de Validación */}
        {!isFormValid() && getValidationErrors().length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">Campos requeridos:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {getValidationErrors().map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          className="w-full bg-accent hover:bg-accent/90"
          disabled={!isFormValid() || isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isLoading ? 'Agregando...' : 'Agregar Serie'}
        </Button>
      </CardContent>
    </Card>
  );
}
