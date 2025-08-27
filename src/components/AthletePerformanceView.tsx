import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Zap, Target, Edit, Save, X, User, Calendar, MapPin, Clock, Heart } from 'lucide-react';
import { toast } from 'sonner';

type TimePeriod = '7d' | '30d' | '3m' | '6m' | '1y';
type Units = 'metric' | 'imperial';

interface AthleteData {
  id: string;
  name: string;
  email: string;
  age: number;
  groupName: string;
  joinDate: string;
}

interface PerformanceData {
  date: string;
  distance: number;
  pace: number;
  heartRate: number;
  duration: number;
}

interface CoachEstimations {
  targetPace: number | null;
  targetHeartRate: number | null;
  weeklyDistance: number | null;
  notes: string;
  lastUpdated: string;
}

// Generar datos simulados para un atleta específico
const generateAthleteData = (athleteId: string, period: TimePeriod): PerformanceData[] => {
  const days = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365
  }[period];

  const data: PerformanceData[] = [];
  const today = new Date();
  
  // Crear patrones únicos por atleta
  const basePace = 4.0 + (parseInt(athleteId) % 3) * 0.5 + Math.random() * 0.5;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseDistance = period === '7d' || period === '30d' ? 
      (Math.random() > 0.4 ? 3 + Math.random() * 12 : 0) :
      (i % 7 === 0 ? 0 : 2 + Math.random() * 10);
    
    const pace = basePace + Math.random() * 1.0 - 0.5;
    const duration = baseDistance > 0 ? baseDistance * pace : 0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      distance: Math.round(baseDistance * 100) / 100,
      pace: Math.round(pace * 100) / 100,
      heartRate: baseDistance > 0 ? 135 + Math.random() * 45 : 0,
      duration: Math.round(duration)
    });
  }
  
  return data;
};

interface AthletePerformanceViewProps {
  athlete: AthleteData;
  units: Units;
  onBack: () => void;
}

export function AthletePerformanceView({ athlete, units, onBack }: AthletePerformanceViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [coachEstimations, setCoachEstimations] = useState<CoachEstimations>({
    targetPace: null,
    targetHeartRate: null,
    weeklyDistance: null,
    notes: '',
    lastUpdated: ''
  });
  
  const [editForm, setEditForm] = useState({
    targetPace: '',
    targetHeartRate: '',
    weeklyDistance: '',
    notes: ''
  });

  const data = generateAthleteData(athlete.id, timePeriod);
  
  // Calcular métricas agregadas
  const validData = data.filter(d => d.distance > 0);
  const totalDistance = data.reduce((sum, d) => sum + d.distance, 0);
  const trainingDays = validData.length;
  const avgPace = validData.reduce((sum, d) => sum + d.pace, 0) / validData.length;
  const avgHeartRate = validData.reduce((sum, d) => sum + d.heartRate, 0) / validData.length;
  const totalDuration = data.reduce((sum, d) => sum + d.duration, 0);

  const convertDistance = (km: number) => {
    return units === 'metric' ? km : km * 0.621371;
  };
  
  const formatDistance = (distance: number) => {
    const converted = convertDistance(distance);
    const unit = units === 'metric' ? 'km' : 'mi';
    return `${converted.toFixed(1)} ${unit}`;
  };
  
  const formatPace = (paceMinPerKm: number) => {
    if (units === 'imperial') {
      const paceMinPerMile = paceMinPerKm * 1.60934;
      const mins = Math.floor(paceMinPerMile);
      const secs = Math.floor((paceMinPerMile - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
    } else {
      const mins = Math.floor(paceMinPerKm);
      const secs = Math.floor((paceMinPerKm - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}/km`;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleOpenEditModal = () => {
    setEditForm({
      targetPace: coachEstimations.targetPace?.toString() || '',
      targetHeartRate: coachEstimations.targetHeartRate?.toString() || '',
      weeklyDistance: coachEstimations.weeklyDistance?.toString() || '',
      notes: coachEstimations.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEstimations = () => {
    const newEstimations: CoachEstimations = {
      targetPace: editForm.targetPace ? parseFloat(editForm.targetPace) : null,
      targetHeartRate: editForm.targetHeartRate ? parseFloat(editForm.targetHeartRate) : null,
      weeklyDistance: editForm.weeklyDistance ? parseFloat(editForm.weeklyDistance) : null,
      notes: editForm.notes,
      lastUpdated: new Date().toISOString()
    };
    
    setCoachEstimations(newEstimations);
    setIsEditModalOpen(false);
    toast.success('Estimaciones guardadas correctamente');
  };

  const periodLabels = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días', 
    '3m': 'Últimos 3 meses',
    '6m': 'Últimos 6 meses',
    '1y': 'Último año'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-primary">{athlete.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {athlete.age} años
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Miembro desde {new Date(athlete.joinDate).toLocaleDateString('es-ES')}
              </span>
              <Badge variant="outline">
                {athlete.groupName}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleOpenEditModal} className="bg-accent hover:bg-accent/90">
            <Edit className="w-4 h-4 mr-2" />
            Editar Objetivos
          </Button>
        </div>
      </div>

      {/* Métricas principales con comparación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatDistance(totalDistance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodLabels[timePeriod]}
            </p>
            {coachEstimations.weeklyDistance && (
              <p className="text-xs text-accent mt-1">
                Objetivo: {formatDistance(coachEstimations.weeklyDistance)}/semana
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días de Entrenamiento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {trainingDays}
            </div>
            <p className="text-xs text-muted-foreground">
              Sesiones completadas
            </p>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ritmo Promedio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {avgPace ? formatPace(avgPace) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Ritmo real</p>
              </div>
              {coachEstimations.targetPace && (
                <div className="pt-2 border-t border-border">
                  <div className="text-lg font-semibold text-accent">
                    {formatPace(coachEstimations.targetPace)}
                  </div>
                  <p className="text-xs text-muted-foreground">Objetivo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frecuencia Cardíaca</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {avgHeartRate ? `${avgHeartRate.toFixed(0)} bpm` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Promedio real</p>
              </div>
              {coachEstimations.targetHeartRate && (
                <div className="pt-2 border-t border-border">
                  <div className="text-lg font-semibold text-accent">
                    {coachEstimations.targetHeartRate.toFixed(0)} bpm
                  </div>
                  <p className="text-xs text-muted-foreground">Objetivo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notas del Entrenador */}
      {coachEstimations.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas del Entrenador</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última actualización: {new Date(coachEstimations.lastUpdated).toLocaleDateString('es-ES')}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{coachEstimations.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="pace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pace">Ritmo</TabsTrigger>
          <TabsTrigger value="distance">Distancia</TabsTrigger>
          <TabsTrigger value="heartrate">Frecuencia Cardíaca</TabsTrigger>
        </TabsList>

        <TabsContent value="pace">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Ritmo</CardTitle>
              <CardDescription>
                Comparación entre datos reales y objetivos del entrenador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={validData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatPace(value)}
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: number) => [formatPace(value), 'Ritmo']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pace" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    name="Datos Reales"
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 3 }}
                  />
                  {coachEstimations.targetPace && (
                    <Line 
                      type="monotone" 
                      dataKey={() => coachEstimations.targetPace}
                      stroke="var(--accent)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Objetivo del Entrenador"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distance">
          <Card>
            <CardHeader>
              <CardTitle>Volumen de Entrenamiento</CardTitle>
              <CardDescription>
                Distancia recorrida por sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis tickFormatter={(value) => formatDistance(value).split(' ')[0]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: number) => [formatDistance(value), 'Distancia']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="var(--primary)" 
                    fill="var(--primary)" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heartrate">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Frecuencia Cardíaca</CardTitle>
              <CardDescription>
                Intensidad de entrenamiento vs objetivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={validData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value} bpm`}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: number) => [`${value.toFixed(0)} bpm`, 'Frecuencia Cardíaca']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="var(--secondary)" 
                    strokeWidth={2}
                    name="Datos Reales"
                    dot={{ fill: 'var(--secondary)', strokeWidth: 2, r: 3 }}
                  />
                  {coachEstimations.targetHeartRate && (
                    <Line 
                      type="monotone" 
                      dataKey={() => coachEstimations.targetHeartRate}
                      stroke="var(--accent)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Objetivo del Entrenador"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para editar objetivos */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Objetivos - {athlete.name}</DialogTitle>
            <DialogDescription>
              Establece objetivos y metas personalizadas para este atleta
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetPace">Ritmo Objetivo (min/km)</Label>
              <Input
                id="targetPace"
                type="number"
                step="0.1"
                placeholder="Ej: 4.5"
                value={editForm.targetPace}
                onChange={(e) => setEditForm(prev => ({ ...prev, targetPace: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetHeartRate">Frecuencia Cardíaca Objetivo (bpm)</Label>
              <Input
                id="targetHeartRate"
                type="number"
                step="1"
                placeholder="Ej: 150"
                value={editForm.targetHeartRate}
                onChange={(e) => setEditForm(prev => ({ ...prev, targetHeartRate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weeklyDistance">Distancia Semanal Objetivo (km)</Label>
              <Input
                id="weeklyDistance"
                type="number"
                step="0.1"
                placeholder="Ej: 25"
                value={editForm.weeklyDistance}
                onChange={(e) => setEditForm(prev => ({ ...prev, weeklyDistance: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <textarea
                id="notes"
                className="w-full min-h-20 px-3 py-2 border border-border rounded-md text-sm"
                placeholder="Observaciones, objetivos, recomendaciones..."
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEstimations} className="bg-accent hover:bg-accent/90">
              <Save className="w-4 h-4 mr-2" />
              Guardar Objetivos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}