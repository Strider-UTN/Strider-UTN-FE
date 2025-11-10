import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Zap, Info, Target } from 'lucide-react';

interface IntensityZone {
  id: string;
  percentage: number;
  name: string;
  description: string;
  color: string;
  physiological: string;
}

const intensityZones: IntensityZone[] = [
  {
    id: 'recovery',
    percentage: 50,
    name: 'Recuperación Activa',
    description: 'Trote muy suave para activación metabólica',
    physiological: 'Activación aeróbica básica',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'aerobic',
    percentage: 60,
    name: 'Base Aeróbica',
    description: 'Trote conversacional, desarrollo aeróbico',
    physiological: 'Mejora capacidad aeróbica',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'moderate',
    percentage: 70,
    name: 'Aeróbico Moderado',
    description: 'Ritmo sostenido pero cómodo',
    physiological: 'Eficiencia aeróbica',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'tempo',
    percentage: 80,
    name: 'Tempo/Umbral Aeróbico',
    description: 'Ritmo de media maratón sostenido',
    physiological: 'Umbral aeróbico',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'half-marathon',
    percentage: 85,
    name: 'Ritmo Media Maratón',
    description: 'Esfuerzo específico 21K',
    physiological: 'Lactato estable, alta demanda aeróbica',
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'threshold',
    percentage: 90,
    name: 'Umbral Anaeróbico',
    description: 'Límite del lactato estable',
    physiological: 'Umbral anaeróbico, alta acidosis',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'ten-k',
    percentage: 95,
    name: 'Ritmo 10K',
    description: 'Esfuerzo específico 10K',
    physiological: 'Alta acumulación de lactato',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 'vo2max',
    percentage: 100,
    name: 'VO2 Max',
    description: 'Potencia aeróbica máxima',
    physiological: 'Consumo máximo de oxígeno',
    color: 'bg-gray-100 text-gray-800'
  },
  {
    id: 'neuromuscular',
    percentage: 105,
    name: 'Neuromuscular',
    description: 'Velocidad y potencia máxima',
    physiological: 'Sistema neuromuscular',
    color: 'bg-indigo-100 text-indigo-800'
  }
];

interface IntensitySelectorProps {
  selectedIntensity: string;
  selectedPercentage: string;
  onIntensityChange: (intensity: string, percentage: string) => void;
  showAdvanced?: boolean;
}

export function IntensitySelector({ 
  selectedIntensity, 
  selectedPercentage, 
  onIntensityChange,
  showAdvanced = false 
}: IntensitySelectorProps) {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  const simpleIntensities = [
    { value: 'Muy Baja', label: 'Muy Baja', percentage: '50', description: 'Recuperación activa' },
    { value: 'Baja', label: 'Baja', percentage: '60', description: 'Base aeróbica' },
    { value: 'Moderada', label: 'Moderada', percentage: '70', description: 'Aeróbico moderado' },
    { value: 'Media', label: 'Media', percentage: '80', description: 'Tempo/Umbral' },
    { value: 'Alta', label: 'Alta', percentage: '90', description: 'Umbral anaeróbico' },
    { value: 'Muy Alta', label: 'Muy Alta', percentage: '95', description: 'Ritmo 10K' },
    { value: 'Máxima', label: 'Máxima', percentage: '100', description: 'VO2 Max' }
  ];

  const handleSimpleChange = (value: string) => {
    const intensity = simpleIntensities.find(i => i.value === value);
    if (intensity) {
      onIntensityChange(intensity.value, intensity.percentage);
    }
  };

  const handleAdvancedChange = (zoneId: string) => {
    const zone = intensityZones.find(z => z.id === zoneId);
    if (zone) {
      onIntensityChange(zone.name, zone.percentage.toString());
    }
  };

  const getZoneByPercentage = (percentage: string) => {
    const perc = parseInt(percentage);
    return intensityZones.find(z => z.percentage === perc) || intensityZones[0];
  };

  if (!showAdvanced) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Intensidad</label>
          <Badge variant="outline" className="text-xs">
            {selectedPercentage}% VO2 Max
          </Badge>
        </div>
        <Select value={selectedIntensity} onValueChange={handleSimpleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona intensidad" />
          </SelectTrigger>
          <SelectContent>
            {simpleIntensities.map((intensity) => (
              <SelectItem key={intensity.value} value={intensity.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{intensity.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({intensity.percentage}%)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {simpleIntensities.find(i => i.value === selectedIntensity)?.description}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Intensidad del Entrenamiento</label>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'simple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('simple')}
          >
            Simple
          </Button>
          <Button
            variant={viewMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('advanced')}
          >
            Avanzado
          </Button>
        </div>
      </div>

      {viewMode === 'simple' ? (
        <div className="space-y-2">
          <Select value={selectedIntensity} onValueChange={handleSimpleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona intensidad" />
            </SelectTrigger>
            <SelectContent>
              {simpleIntensities.map((intensity) => (
                <SelectItem key={intensity.value} value={intensity.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{intensity.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({intensity.percentage}% VO2 Max)
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPercentage && (
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zona Seleccionada:</span>
                <Badge className="bg-accent text-accent-foreground">
                  {selectedPercentage}% VO2 Max
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {simpleIntensities.find(i => i.percentage === selectedPercentage)?.description}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Selecciona la zona de intensidad basada en porcentajes científicos del VO2 Max
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {intensityZones.map((zone) => {
              const isSelected = selectedPercentage === zone.percentage.toString();
              
              return (
                <Card 
                  key={zone.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-accent shadow-lg' : ''
                  }`}
                  onClick={() => handleAdvancedChange(zone.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${zone.color}`}>
                        {zone.percentage}%
                      </Badge>
                      {isSelected && (
                        <Target className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <h4 className="text-sm font-medium mb-1">{zone.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {zone.description}
                    </p>
                    <div className="flex items-center">
                      <Zap className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {zone.physiological}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedPercentage && (
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-primary">Zona Seleccionada</h4>
                <Badge className="bg-accent text-accent-foreground">
                  {selectedPercentage}% VO2 Max
                </Badge>
              </div>
              {(() => {
                const zone = getZoneByPercentage(selectedPercentage);
                return zone ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">{zone.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Aspecto fisiológico:</strong> {zone.physiological}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}