import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Play, Timer, Zap } from 'lucide-react';
import { DISTANCE_OPTIONS, INTENSITY_OPTIONS } from './constants/athleteIntervalConstants';
import { calculateEstimatedPace } from './utils/athleteIntervalUtils';

interface IntervalFormData {
  type: 'interval' | 'continuous' | 'recovery';
  repetitions: number;
  distance: number;
  targetTime: string;
  recoveryTime: string;
  paceType: 'fixed' | 'vo2max_percentage';
  pace: number;
  vo2maxPercentage: number;
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

  // Validación en tiempo real
  const isFormValid = () => {
    return (
      formData.distance >= 100 &&
      (formData.type !== 'interval' || formData.repetitions >= 1) &&
      formData.vo2maxPercentage >= 50 &&
      formData.vo2maxPercentage <= 110
    );
  };

  const getValidationErrors = () => {
    const errors = [];
    
    if (formData.distance < 100) {
      errors.push('La distancia mínima es 100 metros');
    }
    
    if (formData.type === 'interval' && formData.repetitions < 1) {
      errors.push('Las repeticiones deben ser al menos 1');
    }
    
    if (formData.vo2maxPercentage < 50 || formData.vo2maxPercentage > 110) {
      errors.push('El % VO₂ Max debe estar entre 50% y 110%');
    }
    
    return errors;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      return;
    }
    onSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Agregar Intervalo
        </CardTitle>
        <CardDescription>
          Define las características del entrenamiento siguiendo el formato atlético estándar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de intervalo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Entrenamiento</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => onFormChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interval">
                  <div className="flex items-center">
                    <Timer className="w-4 h-4 mr-2" />
                    Intervalos
                  </div>
                </SelectItem>
                <SelectItem value="continuous">
                  <div className="flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    Continuo
                  </div>
                </SelectItem>
                <SelectItem value="recovery">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Recuperación
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'interval' && (
            <div className="space-y-2">
              <Label>Repeticiones</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.repetitions}
                onChange={(e) => onFormChange('repetitions', Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Distancia</Label>
            <Select
              value={formData.distance.toString()}
              onValueChange={(value) => onFormChange('distance', parseInt(value))}
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
        </div>

        {/* Intensidad y tiempos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Intensidad</Label>
            <Select
              value={formData.intensity}
              onValueChange={(value: any) => {
                const intensityInfo = getIntensityInfo(value);
                onFormChange('intensity', value);
                onFormChange('vo2maxPercentage', intensityInfo.percentage);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENSITY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${option.color.split(' ')[0]}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>% VO₂ Max</Label>
            <Input
              type="number"
              min="50"
              max="110"
              value={formData.vo2maxPercentage}
              onChange={(e) => onFormChange('vo2maxPercentage', Math.max(50, Math.min(110, parseInt(e.target.value) || 85)))}
              className={
                formData.vo2maxPercentage < 50 || formData.vo2maxPercentage > 110 
                  ? 'border-destructive/50 focus:border-destructive' 
                  : ''
              }
            />
            {(formData.vo2maxPercentage < 50 || formData.vo2maxPercentage > 110) && (
              <p className="text-xs text-destructive">Debe estar entre 50% y 110%</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tiempo Objetivo (mm:ss)</Label>
            <Input
              placeholder="Ej: 1:30"
              value={formData.targetTime}
              onChange={(e) => onFormChange('targetTime', e.target.value)}
            />
            {formData.targetTime && (
              <p className="text-xs text-muted-foreground">
                Ritmo: {calculateEstimatedPace(formData.distance, formData.targetTime)}
              </p>
            )}
          </div>

          {formData.type === 'interval' && (
            <div className="space-y-2">
              <Label>Recuperación (mm:ss)</Label>
              <Input
                placeholder="Ej: 2:00"
                value={formData.recoveryTime}
                onChange={(e) => onFormChange('recoveryTime', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <Textarea
            placeholder="Ej: Series a ritmo de 5K, mantener cadencia alta"
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Agrega detalles específicos sobre la ejecución del entrenamiento
          </p>
        </div>

        {/* Preview del intervalo */}
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm font-medium mb-1">Vista previa:</p>
          <div className="flex items-center gap-2">
            <Badge className={getIntensityInfo(formData.intensity).color}>
              {getIntensityInfo(formData.intensity).label}
            </Badge>
            <span className="font-medium">
              {formData.type === 'continuous' 
                ? `${formData.distance >= 1000 ? `${formData.distance/1000}K` : `${formData.distance}m`} continuo`
                : `${formData.repetitions} x ${formData.distance >= 1000 ? `${formData.distance/1000}K` : `${formData.distance}m`}`
              }
            </span>
            {formData.targetTime && (
              <span className="text-muted-foreground">• {formData.targetTime}</span>
            )}
            {formData.type === 'interval' && formData.recoveryTime !== '0:00' && (
              <span className="text-muted-foreground">• rec: {formData.recoveryTime}</span>
            )}
          </div>
        </div>

        {/* Indicadores de validación */}
        {!isFormValid() && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm font-medium text-destructive mb-1">Campos requeridos:</p>
            <ul className="text-xs text-destructive space-y-1">
              {getValidationErrors().map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-1">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={!isFormValid() || isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isLoading ? 'Agregando...' : 'Agregar Intervalo'}
        </Button>
      </CardContent>
    </Card>
  );
}