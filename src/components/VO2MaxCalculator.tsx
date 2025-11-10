import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Calculator, Activity, Clock, Target, Info } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function VO2MaxCalculator() {
  // Estados para cálculo de VO2 Max desde competencia
  const [raceDistance, setRaceDistance] = useState<string>('');
  const [raceTime, setRaceTime] = useState<string>('');
  const [calculatedVO2Max, setCalculatedVO2Max] = useState<string>('');

  // Estados para calculadora de ritmos
  const [currentVO2Max, setCurrentVO2Max] = useState<string>('');
  const [customPercentage, setCustomPercentage] = useState<string>('');
  const [customPace, setCustomPace] = useState<string>('');
  const [customVelocity, setCustomVelocity] = useState<string>('');

  // Estados para calculadora inversa
  const [observedPace, setObservedPace] = useState<string>('');
  const [estimatedPercentage, setEstimatedPercentage] = useState<string>('');
  const [calculatedVO2MaxFromPace, setCalculatedVO2MaxFromPace] = useState<string>('');

  // Distancias predefinidas para cálculo de VO2 Max
  const raceDistances = [
    { value: '800', label: '800m (Medio-fondo)' },
    { value: '1500', label: '1.500m (Medio-fondo)' },
    { value: '3000', label: '3.000m (Fondo)' },
    { value: '5000', label: '5.000m (Fondo)' },
    { value: '10000', label: '10.000m (Fondo)' },
    { value: '21097', label: 'Media Maratón (Fondo)' },
    { value: '42195', label: 'Maratón (Fondo)' }
  ];

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

  // Función para convertir tiempo en formato mm:ss a segundos totales
  const timeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  // Implementación de las fórmulas específicas
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

  // Función para calcular VO2 Max basado en tiempo de carrera
  const calculateVO2Max = () => {
    if (!raceDistance || !raceTime) return;

    const distanceKm = parseFloat(raceDistance) / 1000;
    const timeSeconds = timeToSeconds(raceTime);
    
    if (distanceKm <= 0 || timeSeconds <= 0) return;

    // Calcular ritmo promedio por kilómetro
    const paceSeconds = timeSeconds / distanceKm;
    const paceMinutes = paceSeconds / 60;
    const vo2MaxPace = minutesToPace(paceMinutes);
    
    setCalculatedVO2Max(vo2MaxPace);
  };

  // Función para calcular ritmo basado en porcentaje usando fórmulas específicas
  const calculatePaceFromPercentage = (vo2MaxPace: string, percentage: number): { pace: string; velocity: number } => {
    const vo2MaxMinutes = paceToMinutes(vo2MaxPace);
    if (vo2MaxMinutes <= 0) return { pace: '', velocity: 0 };

    // Paso 1: Convertir ritmo a velocidad (Velocidad = 60 / R)
    const vo2MaxVelocity = paceToVelocity(vo2MaxMinutes);
    
    // Paso 2: Aplicar porcentaje (Velocidad del entrenamiento = Velocidad × P/100)
    const trainingVelocity = vo2MaxVelocity * (percentage / 100);
    
    // Paso 3: Convertir velocidad de vuelta a ritmo (R = 60 / Velocidad)
    const trainingPaceMinutes = velocityToPace(trainingVelocity);
    const trainingPace = minutesToPace(trainingPaceMinutes);
    
    return { pace: trainingPace, velocity: trainingVelocity };
  };

  // Función para calcular ritmo personalizado
  const calculateCustomPace = () => {
    if (!currentVO2Max || !customPercentage) return;

    const percentage = parseFloat(customPercentage);
    if (percentage <= 0) return;

    const result = calculatePaceFromPercentage(currentVO2Max, percentage);
    setCustomPace(result.pace);
    setCustomVelocity(result.velocity.toFixed(2));
  };

  // Función para calcular VO2 Max desde ritmo observado (cálculo inverso)
  const calculateVO2MaxFromPace = () => {
    if (!observedPace || !estimatedPercentage) return;

    const percentage = parseFloat(estimatedPercentage);
    if (percentage <= 0) return;

    const observedPaceMinutes = paceToMinutes(observedPace);
    if (observedPaceMinutes <= 0) return;

    // Paso 1: Convertir ritmo observado a velocidad (Velocidad = 60 / R)
    const observedVelocity = paceToVelocity(observedPaceMinutes);
    
    // Paso 2: Calcular velocidad VO2 Max (Velocidad VO2 Max = Velocidad observada / (Porcentaje/100))
    const vo2MaxVelocity = observedVelocity / (percentage / 100);
    
    // Paso 3: Convertir velocidad VO2 Max a ritmo (R = 60 / Velocidad)
    const vo2MaxPaceMinutes = velocityToPace(vo2MaxVelocity);
    const vo2MaxPace = minutesToPace(vo2MaxPaceMinutes);
    
    setCalculatedVO2MaxFromPace(vo2MaxPace);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>VO2 Max en Atletismo:</strong> Representa el ritmo máximo al que puede correr un atleta. 
          Se calcula a partir de resultados de competencias y se usa para planificar entrenamientos mediante porcentajes.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="calculate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculate" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Desde Competencia
          </TabsTrigger>
          <TabsTrigger value="inverse" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Desde Ritmo
          </TabsTrigger>
          <TabsTrigger value="paces" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Calcular Ritmo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Determinar VO2 Max desde Competencia
              </CardTitle>
              <CardDescription>
                Ingresa el resultado de una competencia reciente para calcular el VO2 Max del atleta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distancia de la Competencia</Label>
                  <Select value={raceDistance} onValueChange={setRaceDistance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la distancia" />
                    </SelectTrigger>
                    <SelectContent>
                      {raceDistances.map((distance) => (
                        <SelectItem key={distance.value} value={distance.value}>
                          {distance.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Tiempo Total de la Competencia</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="time"
                      placeholder="mm:ss"
                      value={raceTime}
                      onChange={(e) => setRaceTime(e.target.value)}
                      className="font-mono"
                    />
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato: minutos:segundos (ej: 15:30 para 15 min 30 seg)
                  </p>
                </div>
              </div>

              <Button 
                onClick={calculateVO2Max}
                className="w-full bg-accent hover:bg-accent/90"
                disabled={!raceDistance || !raceTime}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular VO2 Max
              </Button>

              {calculatedVO2Max && (
                <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-primary">VO2 Max Calculado</h4>
                      <p className="text-sm text-muted-foreground">
                        Ritmo máximo del atleta (por kilómetro)
                      </p>
                    </div>
                    <Badge className="text-lg font-mono bg-accent text-accent-foreground px-4 py-2">
                      {calculatedVO2Max}/km
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => setCurrentVO2Max(calculatedVO2Max)}
                  >
                    Usar este VO2 Max para calcular ritmos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inverse">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-accent" />
                Calcular VO2 Max desde Ritmo Observado
              </CardTitle>
              <CardDescription>
                Calcula el VO2 Max del atleta a partir de un ritmo de entrenamiento conocido y su intensidad estimada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="observed-pace">Ritmo Observado</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="observed-pace"
                      placeholder="5:00"
                      value={observedPace}
                      onChange={(e) => setObservedPace(e.target.value)}
                      className="font-mono"
                    />
                    <span className="text-sm text-muted-foreground">/km</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ritmo en formato minutos:segundos por kilómetro
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated-percentage">Intensidad Estimada</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="estimated-percentage"
                      placeholder="80"
                      value={estimatedPercentage}
                      onChange={(e) => setEstimatedPercentage(e.target.value)}
                      type="number"
                      min="30"
                      max="120"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Porcentaje estimado del VO2 Max que representa este ritmo
                  </p>
                </div>
              </div>

              <Button
                onClick={calculateVO2MaxFromPace}
                className="w-full bg-accent hover:bg-accent/90"
                disabled={!observedPace || !estimatedPercentage}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular VO2 Max
              </Button>

              {calculatedVO2MaxFromPace && (
                <div className="mt-6 p-6 bg-accent/10 rounded-lg border-2 border-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-primary">VO2 Max Calculado</h4>
                      <p className="text-sm text-muted-foreground">
                        Basado en ritmo {observedPace}/km al {estimatedPercentage}%
                      </p>
                    </div>
                    <Badge className="text-xl font-mono bg-accent text-accent-foreground px-4 py-2">
                      {calculatedVO2MaxFromPace}/km
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cálculo inverso aplicado:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {observedPace}/km → {(60 / paceToMinutes(observedPace)).toFixed(1)} km/h → {((60 / paceToMinutes(observedPace)) / (parseFloat(estimatedPercentage) / 100)).toFixed(1)} km/h → {calculatedVO2MaxFromPace}/km
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fórmula inversa: Velocidad observada ÷ ({estimatedPercentage}% ÷ 100) = Velocidad VO2 Max → Convertir a ritmo
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCurrentVO2Max(calculatedVO2MaxFromPace)}
                    >
                      Usar para calcular ritmos
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setRaceTime('');
                        setRaceDistance('');
                        setCalculatedVO2Max(calculatedVO2MaxFromPace);
                      }}
                    >
                      Transferir a pestaña principal
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paces">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Calculadora de Ritmos Personalizada
              </CardTitle>
              <CardDescription>
                Calcula un ritmo específico basado en el VO2 Max del atleta y el porcentaje de intensidad deseado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vo2max">VO2 Max del Atleta</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="vo2max"
                      placeholder="4:00"
                      value={currentVO2Max}
                      onChange={(e) => setCurrentVO2Max(e.target.value)}
                      className="font-mono"
                    />
                    <span className="text-sm text-muted-foreground">/km</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato: minutos:segundos por kilómetro (ej: 4:00)
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
                      variant="outline"
                      size="sm"
                      onClick={calculateCustomPace}
                      disabled={!currentVO2Max || !customPercentage}
                    >
                      Calcular
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ingresa el porcentaje de intensidad deseado (30-120%)
                  </p>
                </div>
              </div>

              {customPace && (
                <div className="mt-6 p-6 bg-accent/10 rounded-lg border-2 border-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-primary">Ritmo Calculado</h4>
                      <p className="text-sm text-muted-foreground">
                        {customPercentage}% del VO2 Max ({currentVO2Max}/km)
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="text-xl font-mono bg-accent text-accent-foreground px-4 py-2">
                        {customPace}/km
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {customVelocity} km/h
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cálculo aplicado:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {currentVO2Max}/km → {(60 / paceToMinutes(currentVO2Max)).toFixed(1)} km/h → {customVelocity} km/h → {customPace}/km
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fórmula: Velocidad = 60 ÷ Ritmo → Aplicar {customPercentage}% → Convertir a ritmo
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Para consultar las zonas de intensidad predefinidas y sus descripciones fisiológicas, 
                  visita la sección "Referencia de Intensidades" en el menú principal.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}