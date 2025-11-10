import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Clock, Target, Activity, Route, Timer, Plus, Minus, 
  Play, Square, Mountain, Zap, Heart, AlertCircle,
  Save, X, Calculator, TrendingUp, Edit, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface IntervalSet {
  id: string;
  repetitions: number;
  distance: number; // metros
  pace: string; // formato mm:ss
  recovery: {
    type: 'activa' | 'pasiva' | 'trote';
    duration: number; // segundos
    distance?: number; // metros (si es activa)
  };
  intensity: 'recuperación' | 'aeróbico' | 'umbral' | 'vo2max' | 'anaeróbico';
  description?: string;
}

interface SessionPhase {
  id: string;
  name: string;
  type: 'calentamiento' | 'principal' | 'enfriamiento';
  distance: number; // en kilómetros
  duration?: number; // en minutos (opcional)
  pace: string; // formato mm:ss
  intensity: 'recuperación' | 'aeróbico' | 'umbral' | 'vo2max' | 'anaeróbico';
  description: string;
  intervals?: IntervalSet[];
  isIntervalSession?: boolean;
}

interface TrainingSession {
  id: string;
  name: string;
  date: string;
  turno: 'mañana' | 'tarde' | 'noche';
  objective: string;
  totalVolume: number; // kilómetros totales
  estimatedDuration: number; // minutos estimados
  phases: SessionPhase[];
  notes: string;
  difficulty: 'fácil' | 'moderado' | 'difícil' | 'muy difícil';
  trainingType: 'continuo' | 'intervalos' | 'fartlek' | 'cuestas' | 'técnico' | 'recuperación';
  targetPace?: string; // ritmo objetivo principal
  weather?: string;
  location?: string;
}

interface SessionBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: TrainingSession) => void;
  editingSession?: TrainingSession | null;
  userType?: 'athlete' | 'coach';
  athletes: Array<{
    id: string;
    name: string;
    specialty: 'fondo' | 'medio-fondo';
    currentPaces: {
      aeróbico: string;
      umbral: string;
      vo2max: string;
    };
  }>;
}

export function SessionBuilder({ 
  isOpen, 
  onClose, 
  onSave, 
  editingSession,
  userType = 'coach',
  athletes 
}: SessionBuilderProps) {
  const [sessionData, setSessionData] = useState<Omit<TrainingSession, 'id'>>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    turno: 'mañana',
    objective: '',
    totalVolume: 0,
    estimatedDuration: 0,
    phases: [],
    notes: '',
    difficulty: 'moderado',
    trainingType: 'continuo',
    targetPace: '',
    weather: '',
    location: ''
  });

  const [selectedAthlete, setSelectedAthlete] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<Partial<SessionPhase>>({
    type: 'calentamiento',
    distance: 0,
    pace: '5:00',
    intensity: 'aeróbico',
    description: '',
    isIntervalSession: false,
    intervals: []
  });

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

  const [activeTab, setActiveTab] = useState('general');

  // Inicializar con datos de edición si existe
  useEffect(() => {
    if (editingSession) {
      setSessionData(editingSession);
    } else {
      // Resetear formulario
      setSessionData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        turno: 'mañana',
        objective: '',
        totalVolume: 0,
        estimatedDuration: 0,
        phases: [],
        notes: '',
        difficulty: 'moderado',
        trainingType: 'continuo',
        targetPace: '',
        weather: '',
        location: ''
      });
    }
  }, [editingSession, isOpen]);

  // Calcular volumen total automáticamente
  useEffect(() => {
    const totalVolume = sessionData.phases.reduce((sum, phase) => {
      if (phase.isIntervalSession && phase.intervals) {
        const intervalVolume = phase.intervals.reduce((intervalSum, interval) => {
          return intervalSum + ((interval.distance * interval.repetitions) / 1000);
        }, 0);
        return sum + intervalVolume;
      }
      return sum + phase.distance;
    }, 0);

    const estimatedDuration = sessionData.phases.reduce((sum, phase) => {
      if (phase.isIntervalSession && phase.intervals) {
        const intervalTime = phase.intervals.reduce((intervalSum, interval) => {
          const paceMinutes = convertPaceToMinutes(interval.pace);
          const runTime = (interval.distance / 1000) * paceMinutes * interval.repetitions;
          const recoveryTime = (interval.recovery.duration * (interval.repetitions - 1)) / 60;
          return intervalSum + runTime + recoveryTime;
        }, 0);
        return sum + intervalTime;
      } else {
        const paceMinutes = convertPaceToMinutes(phase.pace);
        return sum + (phase.distance * paceMinutes) + (phase.duration || 0);
      }
    }, 0);

    setSessionData(prev => ({
      ...prev,
      totalVolume,
      estimatedDuration: Math.round(estimatedDuration)
    }));
  }, [sessionData.phases]);

  const convertPaceToMinutes = (pace: string): number => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes + (seconds / 60);
  };

  const intensityColors = {
    'recuperación': 'bg-blue-100 text-blue-700 border-blue-200',
    'aeróbico': 'bg-green-100 text-green-700 border-green-200',
    'umbral': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'vo2max': 'bg-orange-100 text-orange-700 border-orange-200',
    'anaeróbico': 'bg-red-100 text-red-700 border-red-200'
  };

  const difficultyColors = {
    'fácil': 'bg-green-100 text-green-700',
    'moderado': 'bg-yellow-100 text-yellow-700',
    'difícil': 'bg-orange-100 text-orange-700',
    'muy difícil': 'bg-red-100 text-red-700'
  };

  const trainingTypeIcons = {
    'continuo': Route,
    'intervalos': Timer,
    'fartlek': Zap,
    'cuestas': Mountain,
    'técnico': Target,
    'recuperación': Heart
  };

  const recoveryTypeLabels = {
    'activa': 'Activa (trote)',
    'pasiva': 'Pasiva (parado)',
    'trote': 'Trote suave'
  };

  const commonDistances = [200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 1600, 2000];
  const commonPaces = ['3:30', '3:45', '4:00', '4:15', '4:30', '4:45', '5:00', '5:15', '5:30'];

  const addIntervalToCurrentPhase = () => {
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

    setCurrentPhase(prev => ({
      ...prev,
      intervals: [...(prev.intervals || []), newInterval],
      isIntervalSession: true
    }));

    // Resetear formulario de intervalo
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

  const removeIntervalFromCurrentPhase = (intervalId: string) => {
    setCurrentPhase(prev => ({
      ...prev,
      intervals: prev.intervals?.filter(interval => interval.id !== intervalId) || []
    }));
    toast.success('Intervalo eliminado');
  };

  const addPhase = () => {
    if (!currentPhase.name) {
      toast.error('Completa el nombre de la fase');
      return;
    }

    if (!currentPhase.isIntervalSession && !currentPhase.distance) {
      toast.error('Completa la distancia de la fase');
      return;
    }

    if (currentPhase.isIntervalSession && (!currentPhase.intervals || currentPhase.intervals.length === 0)) {
      toast.error('Agrega al menos un intervalo para la fase de intervalos');
      return;
    }

    const newPhase: SessionPhase = {
      id: `phase_${Date.now()}`,
      name: currentPhase.name!,
      type: currentPhase.type!,
      distance: currentPhase.isIntervalSession ? 0 : currentPhase.distance!,
      duration: currentPhase.duration,
      pace: currentPhase.isIntervalSession ? '' : currentPhase.pace!,
      intensity: currentPhase.isIntervalSession ? 'vo2max' : currentPhase.intensity!,
      description: currentPhase.description || '',
      intervals: currentPhase.intervals || [],
      isIntervalSession: currentPhase.isIntervalSession || false
    };

    setSessionData(prev => ({
      ...prev,
      phases: [...prev.phases, newPhase]
    }));

    // Resetear fase actual
    setCurrentPhase({
      type: 'principal',
      distance: 0,
      pace: '5:00',
      intensity: 'aeróbico',
      description: '',
      isIntervalSession: false,
      intervals: []
    });

    toast.success('Fase agregada exitosamente');
  };

  const removePhase = (phaseId: string) => {
    setSessionData(prev => ({
      ...prev,
      phases: prev.phases.filter(phase => phase.id !== phaseId)
    }));
    toast.success('Fase eliminada');
  };

  const handleSuggestPaces = () => {
    if (!selectedAthlete) {
      toast.error('Selecciona un atleta para sugerir ritmos');
      return;
    }

    const athlete = athletes.find(a => a.id === selectedAthlete);
    if (!athlete) return;

    // Sugerir ritmo objetivo basado en el tipo de entrenamiento
    let suggestedPace = '';
    switch (sessionData.trainingType) {
      case 'continuo':
      case 'recuperación':
        suggestedPace = athlete.currentPaces.aeróbico;
        break;
      case 'umbral':
        suggestedPace = athlete.currentPaces.umbral;
        break;
      case 'intervalos':
        suggestedPace = athlete.currentPaces.vo2max;
        break;
      default:
        suggestedPace = athlete.currentPaces.aeróbico;
    }

    setSessionData(prev => ({ ...prev, targetPace: suggestedPace }));
    setCurrentPhase(prev => ({ ...prev, pace: suggestedPace }));
    setCurrentInterval(prev => ({ ...prev, pace: suggestedPace }));

    toast.success('Ritmos sugeridos aplicados');
  };

  const generateTemplateSession = (type: string) => {
    let template: Partial<TrainingSession> = {};

    switch (type) {
      case 'continuo':
        template = {
          name: 'Entrenamiento Continuo',
          trainingType: 'continuo',
          difficulty: 'moderado',
          phases: [
            {
              id: 'warm_1',
              name: 'Calentamiento',
              type: 'calentamiento',
              distance: 2,
              pace: '5:30',
              intensity: 'aeróbico',
              description: 'Trote suave de activación',
              isIntervalSession: false
            },
            {
              id: 'main_1', 
              name: 'Parte Principal',
              type: 'principal',
              distance: 8,
              pace: '4:45',
              intensity: 'aeróbico',
              description: 'Ritmo aeróbico sostenido',
              isIntervalSession: false
            },
            {
              id: 'cool_1',
              name: 'Enfriamiento',
              type: 'enfriamiento',
              distance: 1,
              pace: '6:00',
              intensity: 'recuperación',
              description: 'Trote muy suave',
              isIntervalSession: false
            }
          ]
        };
        break;

      case 'intervalos':
        template = {
          name: 'Entrenamiento de Intervalos 6x400m',
          trainingType: 'intervalos',
          difficulty: 'difícil',
          phases: [
            {
              id: 'warm_2',
              name: 'Calentamiento',
              type: 'calentamiento',
              distance: 3,
              pace: '5:20',
              intensity: 'aeróbico',
              description: 'Calentamiento progresivo',
              isIntervalSession: false
            },
            {
              id: 'main_2',
              name: 'Intervalos VO2 Max',
              type: 'principal',
              distance: 0,
              pace: '',
              intensity: 'vo2max',
              description: '6 x 400m a ritmo VO2 Max',
              isIntervalSession: true,
              intervals: [
                {
                  id: 'int_1',
                  repetitions: 6,
                  distance: 400,
                  pace: '3:45',
                  recovery: { type: 'activa', duration: 90 },
                  intensity: 'vo2max',
                  description: 'Serie principal VO2 Max'
                }
              ]
            },
            {
              id: 'cool_2',
              name: 'Enfriamiento',
              type: 'enfriamiento',
              distance: 2,
              pace: '5:45',
              intensity: 'recuperación',
              description: 'Vuelta a la calma',
              isIntervalSession: false
            }
          ]
        };
        break;

      case 'cuestas':
        template = {
          name: 'Entrenamiento de Cuestas',
          trainingType: 'cuestas',
          difficulty: 'difícil',
          phases: [
            {
              id: 'warm_3',
              name: 'Calentamiento',
              type: 'calentamiento',
              distance: 2.5,
              pace: '5:15',
              intensity: 'aeróbico',
              description: 'Calentamiento en terreno plano',
              isIntervalSession: false
            },
            {
              id: 'main_3',
              name: 'Cuestas',
              type: 'principal',
              distance: 0,
              pace: '',
              intensity: 'umbral',
              description: '6 x 300m cuesta al 85% esfuerzo',
              isIntervalSession: true,
              intervals: [
                {
                  id: 'int_3',
                  repetitions: 6,
                  distance: 300,
                  pace: '4:20',
                  recovery: { type: 'activa', duration: 180 },
                  intensity: 'umbral',
                  description: 'Cuestas de fuerza'
                }
              ]
            },
            {
              id: 'cool_3',
              name: 'Enfriamiento', 
              type: 'enfriamiento',
              distance: 1.5,
              pace: '5:50',
              intensity: 'recuperación',
              description: 'Trote de recuperación',
              isIntervalSession: false
            }
          ]
        };
        break;
    }

    setSessionData(prev => ({
      ...prev,
      ...template
    }));

    toast.success(`Plantilla ${type} aplicada`);
  };

  const calculateIntervalVolume = (intervals: IntervalSet[]) => {
    return intervals.reduce((total, interval) => {
      return total + ((interval.distance * interval.repetitions) / 1000);
    }, 0);
  };

  const handleSave = () => {
    if (!sessionData.name || !sessionData.objective || sessionData.phases.length === 0) {
      toast.error('Completa todos los campos obligatorios y agrega al menos una fase');
      return;
    }

    const session: TrainingSession = {
      id: editingSession?.id || `session_${Date.now()}`,
      ...sessionData
    };

    onSave(session);
    toast.success(editingSession ? 'Sesión actualizada' : 'Sesión creada exitosamente');
  };

  const TypeIcon = trainingTypeIcons[sessionData.trainingType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            {editingSession ? 'Editar Sesión' : 'Nueva Sesión de Entrenamiento'}
          </DialogTitle>
          <DialogDescription>
            Configura volumen (km), intensidad (ritmo min:seg/km) y estructura de la sesión
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="structure">Estructura</TabsTrigger>
            <TabsTrigger value="phases">Fases</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionName">Nombre de la sesión *</Label>
                    <Input
                      id="sessionName"
                      placeholder="Ej: Entrenamiento de Intervalos"
                      value={sessionData.name}
                      onChange={(e) => setSessionData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha</Label>
                      <Input
                        id="date"
                        type="date"
                        value={sessionData.date}
                        onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="turno">Turno</Label>
                      <Select 
                        value={sessionData.turno} 
                        onValueChange={(value: 'mañana' | 'tarde' | 'noche') => 
                          setSessionData(prev => ({ ...prev, turno: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mañana">Mañana</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noche">Noche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo de la sesión *</Label>
                    <Textarea
                      id="objective"
                      placeholder="Describe el objetivo principal..."
                      value={sessionData.objective}
                      onChange={(e) => setSessionData(prev => ({ ...prev, objective: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales</Label>
                    <Textarea
                      id="notes"
                      placeholder="Instrucciones especiales, consideraciones..."
                      value={sessionData.notes}
                      onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de entrenamiento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuración de Entrenamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trainingType">Tipo de entrenamiento</Label>
                    <Select 
                      value={sessionData.trainingType} 
                      onValueChange={(value: any) => 
                        setSessionData(prev => ({ ...prev, trainingType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuo">
                          <div className="flex items-center">
                            <Route className="w-4 h-4 mr-2" />
                            Continuo
                          </div>
                        </SelectItem>
                        <SelectItem value="intervalos">
                          <div className="flex items-center">
                            <Timer className="w-4 h-4 mr-2" />
                            Intervalos
                          </div>
                        </SelectItem>
                        <SelectItem value="fartlek">
                          <div className="flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            Fartlek
                          </div>
                        </SelectItem>
                        <SelectItem value="cuestas">
                          <div className="flex items-center">
                            <Mountain className="w-4 h-4 mr-2" />
                            Cuestas
                          </div>
                        </SelectItem>
                        <SelectItem value="técnico">
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Técnico
                          </div>
                        </SelectItem>
                        <SelectItem value="recuperación">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-2" />
                            Recuperación
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificultad</Label>
                    <Select 
                      value={sessionData.difficulty} 
                      onValueChange={(value: any) => 
                        setSessionData(prev => ({ ...prev, difficulty: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fácil">Fácil</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="difícil">Difícil</SelectItem>
                        <SelectItem value="muy difícil">Muy Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetPace">Ritmo objetivo (min:seg/km)</Label>
                    <Input
                      id="targetPace"
                      placeholder="4:30"
                      value={sessionData.targetPace}
                      onChange={(e) => setSessionData(prev => ({ ...prev, targetPace: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weather">Clima esperado</Label>
                      <Input
                        id="weather"
                        placeholder="Soleado, 20°C"
                        value={sessionData.weather}
                        onChange={(e) => setSessionData(prev => ({ ...prev, weather: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        placeholder="Pista, Parque..."
                        value={sessionData.location}
                        onChange={(e) => setSessionData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                  </div>

                  {athletes.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="athlete">Atleta de referencia</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={selectedAthlete} 
                          onValueChange={setSelectedAthlete}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar atleta..." />
                          </SelectTrigger>
                          <SelectContent>
                            {athletes.map(athlete => (
                              <SelectItem key={athlete.id} value={athlete.id}>
                                {athlete.name} ({athlete.specialty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          onClick={handleSuggestPaces}
                          disabled={!selectedAthlete}
                        >
                          <Calculator className="w-4 h-4 mr-2" />
                          Sugerir Ritmos
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Plantillas rápidas - Solo para entrenadores */}
            {userType === 'coach' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plantillas Rápidas</CardTitle>
                  <CardDescription>
                    Aplica estructuras predefinidas para diferentes tipos de entrenamiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => generateTemplateSession('continuo')}
                      className="flex items-center justify-center h-16 hover:bg-green-50 hover:border-green-300"
                    >
                      <div className="text-center">
                        <Route className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <div className="text-sm font-medium">Continuo Base</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateTemplateSession('intervalos')}
                      className="flex items-center justify-center h-16 hover:bg-accent/10 hover:border-accent"
                    >
                      <div className="text-center">
                        <Timer className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <div className="text-sm font-medium">Intervalos VO2</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateTemplateSession('cuestas')}
                      className="flex items-center justify-center h-16 hover:bg-orange-50 hover:border-orange-300"
                    >
                      <div className="text-center">
                        <Mountain className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                        <div className="text-sm font-medium">Cuestas Fuerza</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas de la Sesión</CardTitle>
                <CardDescription>
                  Volumen total e intensidad promedio de la sesión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{sessionData.totalVolume.toFixed(1)}km</div>
                      <p className="text-sm text-muted-foreground">Volumen Total</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{sessionData.estimatedDuration}min</div>
                      <p className="text-sm text-muted-foreground">Duración Estimada</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{sessionData.phases.length}</div>
                      <p className="text-sm text-muted-foreground">Fases</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Badge className={difficultyColors[sessionData.difficulty]}>
                        {sessionData.difficulty}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">Dificultad</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Acceso rápido a intervalos - Solo para entrenadores */}
            {userType === 'coach' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                  <CardDescription>
                    Agrega rápidamente diferentes tipos de fases a tu sesión
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPhase({
                          type: 'principal',
                          name: 'Intervalos',
                          distance: 0,
                          pace: '4:00',
                          intensity: 'vo2max',
                          description: 'Fase de intervalos',
                          isIntervalSession: true,
                          intervals: []
                        });
                        setActiveTab('phases');
                      }}
                      className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-accent/10 hover:border-accent"
                    >
                      <Timer className="w-6 h-6 text-accent" />
                      <span>Crear Intervalos</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPhase({
                          type: 'calentamiento',
                          name: 'Calentamiento',
                          distance: 2,
                          pace: '5:30',
                          intensity: 'aeróbico',
                          description: 'Trote suave de activación',
                          isIntervalSession: false,
                          intervals: []
                        });
                        setActiveTab('phases');
                      }}
                      className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
                    >
                      <Play className="w-6 h-6 text-green-600" />
                      <span>Calentamiento</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPhase({
                          type: 'enfriamiento',
                          name: 'Enfriamiento',
                          distance: 1.5,
                          pace: '6:00',
                          intensity: 'recuperación',
                          description: 'Trote muy suave',
                          isIntervalSession: false,
                          intervals: []
                        });
                        setActiveTab('phases');
                      }}
                      className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Square className="w-6 h-6 text-blue-600" />
                      <span>Enfriamiento</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de fases existentes */}
            {sessionData.phases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fases Configuradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessionData.phases.map((phase, index) => (
                      <Card key={phase.id} className="border-l-4 border-l-accent">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize">
                                {phase.type}
                              </Badge>
                              <div>
                                <h4 className="font-medium">{phase.name}</h4>
                                {phase.isIntervalSession ? (
                                  <div className="text-sm text-muted-foreground">
                                    <div>Intervalos: {calculateIntervalVolume(phase.intervals || []).toFixed(1)}km total</div>
                                    <div>
                                      {phase.intervals?.map((interval, idx) => (
                                        <span key={idx} className="mr-2">
                                          {interval.repetitions}x{interval.distance}m @ {interval.pace}/km
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {phase.distance}km • {phase.pace}/km
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {phase.isIntervalSession ? (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                                  Intervalos
                                </Badge>
                              ) : (
                                <Badge 
                                  className={intensityColors[phase.intensity]} 
                                  variant="outline"
                                >
                                  {phase.intensity}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePhase(phase.id)}
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
          </TabsContent>

          <TabsContent value="phases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agregar Nueva Fase</CardTitle>
                <CardDescription>
                  Define cada parte de la sesión con volumen e intensidad específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phaseName">Nombre de la fase</Label>
                    <Input
                      id="phaseName"
                      placeholder="Ej: Calentamiento"
                      value={currentPhase.name || ''}
                      onChange={(e) => setCurrentPhase(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phaseType">Tipo de fase</Label>
                    <Select 
                      value={currentPhase.type} 
                      onValueChange={(value: 'calentamiento' | 'principal' | 'enfriamiento') => 
                        setCurrentPhase(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calentamiento">Calentamiento</SelectItem>
                        <SelectItem value="principal">Parte Principal</SelectItem>
                        <SelectItem value="enfriamiento">Enfriamiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Modalidad de la fase</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={!currentPhase.isIntervalSession ? "default" : "outline"}
                        onClick={() => setCurrentPhase(prev => ({ ...prev, isIntervalSession: false, intervals: [] }))}
                        className="flex-1"
                      >
                        <Route className="w-4 h-4 mr-2" />
                        Continuo
                      </Button>
                      <Button
                        type="button"
                        variant={currentPhase.isIntervalSession ? "default" : "outline"}
                        onClick={() => setCurrentPhase(prev => ({ ...prev, isIntervalSession: true }))}
                        className="flex-1 bg-accent/10 hover:bg-accent/20 border-accent text-accent-foreground"
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        Crear Intervalos
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Configuración para fase continua */}
                {!currentPhase.isIntervalSession && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phaseDistance">Volumen (km)</Label>
                      <Input
                        id="phaseDistance"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={currentPhase.distance || ''}
                        onChange={(e) => setCurrentPhase(prev => ({ 
                          ...prev, 
                          distance: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phasePace">Intensidad - Ritmo (min:seg/km)</Label>
                      <Select 
                        value={currentPhase.pace || ''} 
                        onValueChange={(value) => setCurrentPhase(prev => ({ ...prev, pace: value }))}
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
                      <Label htmlFor="phaseIntensity">Zona de intensidad</Label>
                      <Select 
                        value={currentPhase.intensity} 
                        onValueChange={(value: any) => 
                          setCurrentPhase(prev => ({ ...prev, intensity: value }))
                        }
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
                )}

                {/* Configuración para fase de intervalos */}
                {currentPhase.isIntervalSession && (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-accent/30 bg-accent/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center">
                          <Timer className="w-4 h-4 mr-2 text-accent" />
                          Configurar Intervalos
                        </h4>
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          Modo Intervalos Activo
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                        <div className="flex items-end gap-2">
                          <Button 
                            type="button"
                            onClick={addIntervalToCurrentPhase}
                            disabled={!currentInterval.repetitions || !currentInterval.distance || !currentInterval.pace}
                            className="bg-accent hover:bg-accent/90 flex-1"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Intervalo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              // Preset rápido 6x400m
                              const preset = {
                                repetitions: 6,
                                distance: 400,
                                pace: '3:45',
                                recovery: { type: 'activa' as const, duration: 90 },
                                intensity: 'vo2max' as const
                              };
                              setCurrentInterval(preset);
                              toast.success('Configuración 6x400m aplicada');
                            }}
                            className="whitespace-nowrap"
                          >
                            6x400m
                          </Button>
                        </div>
                      </div>

                      {/* Lista de intervalos agregados */}
                      {currentPhase.intervals && currentPhase.intervals.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm flex items-center">
                              <Timer className="w-4 h-4 mr-2 text-accent" />
                              Intervalos configurados:
                            </h5>
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                              {currentPhase.intervals.length} serie{currentPhase.intervals.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {currentPhase.intervals.map((interval, index) => (
                            <div key={interval.id} className="flex items-center justify-between p-3 bg-white border border-accent/20 rounded-lg shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                                  {index + 1}
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {interval.repetitions} x {interval.distance}m @ {interval.pace}/km
                                  </div>
                                  <div className="text-muted-foreground">
                                    Rec: {recoveryTypeLabels[interval.recovery.type]} - {interval.recovery.duration}seg
                                  </div>
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
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeIntervalFromCurrentPhase(interval.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="text-sm text-accent font-medium bg-accent/10 p-2 rounded-lg border border-accent/20">
                            💪 Volumen total de intervalos: {calculateIntervalVolume(currentPhase.intervals).toFixed(1)}km
                          </div>
                        </div>
                      )}

                      {/* Mensaje cuando no hay intervalos */}
                      {currentPhase.intervals && currentPhase.intervals.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <Timer className="w-8 h-8 mx-auto mb-2 text-accent/50" />
                          <p className="text-sm">No hay intervalos configurados</p>
                          <p className="text-xs">Configura repeticiones, distancia y ritmo arriba</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phaseDescription">Descripción</Label>
                  <Textarea
                    id="phaseDescription"
                    placeholder="Describe las características de esta fase..."
                    value={currentPhase.description || ''}
                    onChange={(e) => setCurrentPhase(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={addPhase}
                  disabled={!currentPhase.name || (!currentPhase.isIntervalSession && !currentPhase.distance) || (currentPhase.isIntervalSession && (!currentPhase.intervals || currentPhase.intervals.length === 0))}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Fase
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TypeIcon className="w-5 h-5 mr-2" />
                  {sessionData.name || 'Nueva Sesión'}
                </CardTitle>
                <CardDescription>
                  {sessionData.objective || 'Sin objetivo definido'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Métricas principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{sessionData.totalVolume.toFixed(1)}km</div>
                    <p className="text-sm text-muted-foreground">Volumen Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{sessionData.estimatedDuration}min</div>
                    <p className="text-sm text-muted-foreground">Duración</p>
                  </div>
                  <div className="text-center">
                    <Badge className={difficultyColors[sessionData.difficulty]}>
                      {sessionData.difficulty}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">Dificultad</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary capitalize">{sessionData.turno}</div>
                    <p className="text-sm text-muted-foreground">Turno</p>
                  </div>
                </div>

                <Separator />

                {/* Estructura de fases */}
                <div>
                  <h4 className="font-medium mb-3">Estructura de la Sesión</h4>
                  <div className="space-y-2">
                    {sessionData.phases.map((phase, index) => (
                      <div key={phase.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{phase.name}</div>
                            {phase.isIntervalSession ? (
                              <div className="text-sm text-muted-foreground">
                                Intervalos: {calculateIntervalVolume(phase.intervals || []).toFixed(1)}km
                                {phase.intervals?.map((interval, idx) => (
                                  <div key={idx} className="text-xs">
                                    {interval.repetitions}x{interval.distance}m @ {interval.pace}/km
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {phase.distance}km • {phase.pace}/km
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {phase.type}
                          </Badge>
                          {phase.isIntervalSession ? (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                              Intervalos
                            </Badge>
                          ) : (
                            <Badge 
                              className={intensityColors[phase.intensity]} 
                              variant="outline"
                            >
                              {phase.intensity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {sessionData.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notas Adicionales</h4>
                      <p className="text-muted-foreground">{sessionData.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!sessionData.name || !sessionData.objective || sessionData.phases.length === 0}
            className="bg-accent hover:bg-accent/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {editingSession ? 'Actualizar' : 'Crear'} Sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}