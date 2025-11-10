import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Zap, Target, Info, Clock, TrendingUp } from 'lucide-react';

interface IntensityZone {
  id: string;
  name: string;
  percentage: number;
  description: string;
  physiological: string;
  duration: string;
  color: string;
  examples: string[];
}

interface CustomResult {
  pace: string;
  velocity: number;
  percentage: number;
  zoneDescription?: string;
}

const intensityZones: IntensityZone[] = [
  {
    id: 'recovery',
    name: 'Recuperación Activa',
    percentage: 50,
    description: 'Trote muy suave para recuperación',
    physiological: 'Activación metabólica básica',
    duration: '20-60 min',
    color: 'bg-green-100 text-green-800 border-green-200',
    examples: ['Trote de calentamiento', 'Enfriamiento post-entrenamiento', 'Días de recuperación']
  },
  {
    id: 'aerobic-base',
    name: 'Base Aeróbica',
    percentage: 60,
    description: 'Trote cómodo, conversacional',
    physiological: 'Desarrollo de capacidad aeróbica',
    duration: '30-120 min',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    examples: ['Carreras largas suaves', 'Volumen base', 'Entrenamientos de resistencia']
  },
  {
    id: 'aerobic-moderate',
    name: 'Aeróbico Moderado',
    percentage: 70,
    description: 'Ritmo sostenido pero cómodo',
    physiological: 'Mejora eficiencia aeróbica',
    duration: '20-90 min',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    examples: ['Carreras de tempo moderado', 'Fartlek suave', 'Entrenamientos progresivos']
  },
  {
    id: 'tempo',
    name: 'Tempo/Umbral Aeróbico',
    percentage: 80,
    description: 'Ritmo de media maratón sostenido',
    physiological: 'Umbral aeróbico, mejora lactato',
    duration: '20-40 min',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    examples: ['Tempo runs', 'Ritmo de media maratón', 'Entrenamientos de umbral']
  },
  {
    id: 'half-marathon',
    name: 'Ritmo Media Maratón',
    percentage: 85,
    description: 'Esfuerzo de competencia 21K',
    physiological: 'Lactato estable, alta demanda aeróbica',
    duration: '10-30 min',
    color: 'bg-red-100 text-red-800 border-red-200',
    examples: ['Intervalos de media maratón', 'Tempo específico', 'Simulacros de competencia']
  },
  {
    id: 'threshold',
    name: 'Umbral Anaeróbico',
    percentage: 90,
    description: 'Límite del lactato estable',
    physiological: 'Umbral anaeróbico, alta acidosis',
    duration: '8-25 min',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    examples: ['Intervalos de umbral', 'Repeticiones tempo', 'Entrenamientos lactato']
  },
  {
    id: 'ten-k',
    name: 'Ritmo 10K',
    percentage: 95,
    description: 'Esfuerzo de competencia 10K',
    physiological: 'Alta acumulación de lactato',
    duration: '5-15 min',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    examples: ['Intervalos 10K', 'Repeticiones específicas', 'Simulacros 10K']
  },
  {
    id: 'vo2max',
    name: 'VO2 Max',
    percentage: 100,
    description: 'Potencia aeróbica máxima',
    physiological: 'Consumo máximo de oxígeno',
    duration: '3-8 min',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    examples: ['Intervalos 5K', 'Repeticiones cortas intensas', 'Desarrollo VO2']
  },
  {
    id: 'neuromuscular',
    name: 'Neuromuscular',
    percentage: 105,
    description: 'Velocidad y potencia máxima',
    physiological: 'Sistema neuromuscular, coordinación',
    duration: '30s-3 min',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    examples: ['Sprints', 'Velocidad pura', 'Entrenamientos neuromusculares']
  }
];

export function IntensityReference() {
  const [athleteVO2Max, setAthleteVO2Max] = useState<string>('');
  const [customPercentage, setCustomPercentage] = useState<string>('');
  const [customResult, setCustomResult] = useState<CustomResult | null>(null);
  const [selectedZone, setSelectedZone] = useState<IntensityZone | null>(null);

  // Función para convertir ritmo mm:ss a minutos decimales
  const paceToMinutes = (paceStr: string): number => {
    const parts = paceStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes + seconds / 60;
    }
    return 0;
  };

  // Función para convertir minutos decimales a formato mm:ss
  const minutesToPace = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Implementación de las fórmulas específicas:
  // Fórmula 1: Velocidad = 60 / R (donde R es ritmo en min/km)
  const paceToVelocity = (paceMinutes: number): number => {
    if (paceMinutes <= 0) return 0;
    return 60 / paceMinutes;
  };

  // Fórmula 2: R = 60 / Velocidad
  const velocityToPace = (velocity: number): number => {
    if (velocity <= 0) return 0;
    return 60 / velocity;
  };

  // Función para determinar la zona de entrenamiento más cercana
  const getZoneDescription = (percentage: number): string | undefined => {
    // Encontrar la zona más cercana
    const sortedZones = intensityZones.sort((a, b) => 
      Math.abs(a.percentage - percentage) - Math.abs(b.percentage - percentage)
    );
    
    const closestZone = sortedZones[0];
    if (Math.abs(closestZone.percentage - percentage) <= 5) {
      return `${closestZone.name} (${closestZone.description})`;
    }
    
    return undefined;
  };

  // Función para calcular ritmo personalizado usando fórmulas específicas
  const calculateCustomPace = () => {
    if (!athleteVO2Max || !customPercentage) return;

    const percentage = parseFloat(customPercentage);
    if (percentage <= 0) return;

    const vo2MaxMinutes = paceToMinutes(athleteVO2Max);
    if (vo2MaxMinutes <= 0) return;

    // Paso 1: Convertir ritmo a velocidad (Velocidad = 60 / R)
    const vo2MaxVelocity = paceToVelocity(vo2MaxMinutes);
    
    // Paso 2: Aplicar porcentaje (Velocidad del entrenamiento = Velocidad × P/100)
    const trainingVelocity = vo2MaxVelocity * (percentage / 100);
    
    // Paso 3: Convertir velocidad de vuelta a ritmo (R = 60 / Velocidad)
    const trainingPaceMinutes = velocityToPace(trainingVelocity);
    const trainingPace = minutesToPace(trainingPaceMinutes);
    
    const result: CustomResult = {
      pace: trainingPace,
      velocity: trainingVelocity,
      percentage: percentage,
      zoneDescription: getZoneDescription(percentage)
    };

    setCustomResult(result);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">
            Referencia de Intensidades
          </h2>
          <p className="text-muted-foreground">
            Zonas de entrenamiento basadas en VO2 Max con descripciones fisiológicas
          </p>
        </div>
        <Zap className="w-8 h-8 text-accent" />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Las intensidades están basadas en porcentajes del VO2 Max y siguen la metodología estándar 
          de entrenamiento atlético para corredores de fondo y medio-fondo.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Calculadora Personal
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Zonas de Intensidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Calculadora Personal de Ritmos
              </CardTitle>
              <CardDescription>
                Ingresa el VO2 Max y el porcentaje deseado para calcular el ritmo específico de entrenamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="athlete-vo2max">VO2 Max del Atleta</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="athlete-vo2max"
                      placeholder="4:00"
                      value={athleteVO2Max}
                      onChange={(e) => setAthleteVO2Max(e.target.value)}
                      className="font-mono"
                    />
                    <span className="text-sm text-muted-foreground">/km</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato: minutos:segundos por kilómetro
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-percentage">Porcentaje de Intensidad</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-percentage"
                      placeholder="80"
                      value={customPercentage}
                      onChange={(e) => setCustomPercentage(e.target.value)}
                      type="number"
                      min="30"
                      max="120"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <Button
                      onClick={calculateCustomPace}
                      disabled={!athleteVO2Max || !customPercentage}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Calcular
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ingresa el porcentaje de intensidad deseado (30-120%)
                  </p>
                </div>
              </div>

              {customResult && (
                <div className="mt-6 p-6 bg-accent/10 rounded-lg border-2 border-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-primary">Ritmo Calculado</h4>
                      <p className="text-sm text-muted-foreground">
                        {customResult.percentage}% del VO2 Max ({athleteVO2Max}/km)
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="text-xl font-mono bg-accent text-accent-foreground px-4 py-2">
                        {customResult.pace}/km
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {customResult.velocity.toFixed(1)} km/h
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cálculo aplicado:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {athleteVO2Max}/km → {(60 / paceToMinutes(athleteVO2Max)).toFixed(1)} km/h → {customResult.velocity.toFixed(1)} km/h → {customResult.pace}/km
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fórmula: Velocidad = 60 ÷ Ritmo → Aplicar {customResult.percentage}% → Convertir a ritmo
                    </div>
                  </div>

                  {customResult.zoneDescription && (
                    <div className="mt-4 p-3 bg-white/80 rounded border border-accent/30">
                      <p className="text-sm font-medium text-accent">
                        Zona de entrenamiento sugerida:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customResult.zoneDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intensityZones.map((zone) => (
              <Card 
                key={zone.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedZone?.id === zone.id ? 'ring-2 ring-accent' : ''
                }`}
                onClick={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{zone.name}</CardTitle>
                    <Badge className={`${zone.color} font-mono text-xs`}>
                      {zone.percentage}%
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {zone.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duración:</span>
                      <span className="font-medium">{zone.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedZone && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  {selectedZone.name} - Información Detallada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Aspectos Fisiológicos</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedZone.physiological}
                    </p>
                    
                    <h4 className="font-semibold text-primary mb-2">Duración Recomendada</h4>
                    <Badge className="bg-accent/10 text-accent border border-accent/20">
                      {selectedZone.duration}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Ejemplos de Entrenamiento</h4>
                    <ul className="space-y-1">
                      {selectedZone.examples.map((example, index) => (
                        <li key={index} className="flex items-center text-sm text-muted-foreground">
                          <span className="w-2 h-2 bg-accent rounded-full mr-2 flex-shrink-0"></span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}