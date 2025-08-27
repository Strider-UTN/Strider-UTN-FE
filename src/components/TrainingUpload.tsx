import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Upload, Calendar as CalendarIcon, Plus, ShieldAlert, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface InjuryReport {
  bodyPart: string;
  severity: number; // 1-10 scale
  description: string;
  affectedPerformance: boolean;
  type: 'Molestia' | 'Dolor';
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  type: string;
  duration: number;
  distance: number;
  avgPace: string;
  maxHR: number;
  avgHR: number;
  calories: number;
  elevation: number;
  comments: string;
  sensations: {
    effort: number;
    fatigue: number;
    motivation: number;
  };
  conditions: {
    temperature: number;
    weather: string;
    surface: string;
  };
  splits: Array<{
    km: number;
    pace: string;
    hr: number;
    elevation: number;
  }>;
  hrZones: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  route?: {
    startLocation: string;
    endLocation: string;
    routeType: string;
  };
  injuries?: InjuryReport[];
  associatedSessionId?: string;
  status: 'Pendiente' | 'Completado' | 'Incompleto' | 'Parcialmente Incompleto';
}

interface PlannedSession {
  id: string;
  date: string;
  name: string;
  type: string;
  plannedDuration: number;
  plannedDistance: number;
  plannedPace: string;
  targetHR: string;
  intervals?: Array<{
    type: 'work' | 'rest';
    duration: number;
    pace: string;
    intensity: string;
    distance?: number;
  }>;
}

export function TrainingUpload() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [currentInjury, setCurrentInjury] = useState<Partial<InjuryReport>>({
    bodyPart: 'none',
    severity: 1,
    description: '',
    affectedPerformance: false,
    type: 'Molestia'
  });

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    duration: '',
    distance: '',
    avgPace: '',
    maxHR: '',
    avgHR: '',
    calories: '',
    elevation: '',
    comments: '',
    effort: 5,
    fatigue: 5,
    motivation: 5,
    temperature: '',
    weather: '',
    surface: '',
    uploadType: 'manual',
    planificationId: '',
    sessionId: ''
  });

  // Lista de partes del cuerpo para el selector
  const bodyParts = [
    'Rodilla izquierda', 'Rodilla derecha',
    'Tobillo izquierdo', 'Tobillo derecho',
    'Pantorrilla izquierda', 'Pantorrilla derecha',
    'Cuádriceps izquierdo', 'Cuádriceps derecho',
    'Isquiotibiales izquierdos', 'Isquiotibiales derechos',
    'Gemelo izquierdo', 'Gemelo derecho',
    'Pie izquierdo', 'Pie derecho',
    'Cadera izquierda', 'Cadera derecha',
    'Espalda baja', 'Espalda media', 'Espalda alta',
    'Hombro izquierdo', 'Hombro derecho',
    'Otra zona'
  ];

  // Mock data para planificaciones disponibles
  const availablePlanifications = [
    {
      id: 'plan_1',
      name: 'Preparación 10K - Enero',
      description: 'Plan de 4 semanas para mejorar tiempo en 10K',
      coach: 'Juan Pérez'
    },
    {
      id: 'plan_2', 
      name: 'Base Aeróbica - Invierno',
      description: 'Construcción de base aeróbica para temporada',
      coach: 'Juan Pérez'
    },
    {
      id: 'plan_3',
      name: 'Velocidad y Potencia',
      description: 'Desarrollo de velocidad máxima y potencia',
      coach: 'Juan Pérez'
    }
  ];

  // Mock data para sesiones planificadas
  const plannedSessions: PlannedSession[] = [
    {
      id: 'session_1',
      date: '2024-01-15',
      name: 'Trote Continuo',
      type: 'Continuo',
      plannedDuration: 45,
      plannedDistance: 8.0,
      plannedPace: '5:20',
      targetHR: '150-160 bpm',
      intervals: []
    },
    {
      id: 'session_2',
      date: '2024-01-16',
      name: 'Intervalos 400m',
      type: 'Intervalos',
      plannedDuration: 40,
      plannedDistance: 6.0,
      plannedPace: '4:00',
      targetHR: '170-180 bpm',
      intervals: [
        { type: 'work', duration: 90, pace: '4:00', intensity: 'Alta', distance: 0.4 },
        { type: 'rest', duration: 90, pace: '6:00', intensity: 'Baja', distance: 0.4 }
      ]
    },
    {
      id: 'session_3',
      date: '2024-01-17',
      name: 'Tempo Run',
      type: 'Tempo',
      plannedDuration: 35,
      plannedDistance: 7.0,
      plannedPace: '4:45',
      targetHR: '160-170 bpm',
      intervals: []
    }
  ];

  // Función para obtener sesiones por planificación
  const getSessionsByPlanification = (planificationId: string) => {
    if (planificationId === 'plan_1') {
      return plannedSessions.filter(session => session.id === 'session_1' || session.id === 'session_3');
    } else if (planificationId === 'plan_2') {
      return plannedSessions.filter(session => session.id === 'session_1');
    } else if (planificationId === 'plan_3') {
      return plannedSessions.filter(session => session.id === 'session_2');
    }
    return [];
  };

  // Funciones para manejar molestias/lesiones
  const addInjury = () => {
    if (!currentInjury.bodyPart || currentInjury.bodyPart === 'none' || !currentInjury.description) {
      toast.error('Por favor completa la zona corporal y descripción');
      return;
    }

    const newInjury: InjuryReport = {
      bodyPart: currentInjury.bodyPart!,
      severity: currentInjury.severity || 1,
      description: currentInjury.description!,
      affectedPerformance: currentInjury.affectedPerformance || false,
      type: currentInjury.type || 'Molestia'
    };

    setInjuries(prev => [...prev, newInjury]);
    setCurrentInjury({
      bodyPart: 'none',
      severity: 1,
      description: '',
      affectedPerformance: false,
      type: 'Molestia'
    });
    setShowInjuryForm(false);
    toast.success('Molestia/dolor agregado correctamente');
  };

  const removeInjury = (index: number) => {
    setInjuries(prev => prev.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-50';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 3) return 'Leve';
    if (severity <= 6) return 'Moderado';
    return 'Severo';
  };

  // Funciones auxiliares para generar datos automáticamente
  const generateSplits = (distance: number, avgPace: string, avgHR: number, maxHR: number, elevation: number, type: string) => {
    const splits = [];
    const kmCount = Math.floor(distance);
    const [avgMin, avgSec] = avgPace.split(':').map(Number);
    const avgPaceSeconds = avgMin * 60 + avgSec;
    
    for (let km = 1; km <= kmCount; km++) {
      let variation = 0;
      if (type === 'Intervalos') {
        variation = (km % 2 === 1) ? -15 : 10;
      } else if (type === 'Fartlek') {
        variation = Math.random() * 30 - 15;
      } else {
        variation = Math.random() * 10 - 5;
      }
      
      const splitPaceSeconds = avgPaceSeconds + variation;
      const splitMinutes = Math.floor(splitPaceSeconds / 60);
      const splitSeconds = Math.round(splitPaceSeconds % 60);
      const splitPace = `${splitMinutes}:${splitSeconds.toString().padStart(2, '0')}`;
      
      const hrVariation = variation > 0 ? -5 : 5;
      const splitHR = Math.max(avgHR - 20, Math.min(maxHR, avgHR + hrVariation + Math.random() * 10 - 5));
      
      const splitElevation = Math.max(0, elevation / kmCount + Math.random() * 20 - 10);
      
      splits.push({
        km,
        pace: splitPace,
        hr: Math.round(splitHR),
        elevation: Math.round(splitElevation)
      });
    }
    
    return splits;
  };

  const generateHRZones = (type: string, avgHR: number, maxHR: number) => {
    switch (type) {
      case 'Intervalos':
        return { zone1: 5, zone2: 15, zone3: 25, zone4: 35, zone5: 20 };
      case 'Tempo':
        return { zone1: 10, zone2: 25, zone3: 45, zone4: 20, zone5: 0 };
      case 'Recuperación':
        return { zone1: 60, zone2: 35, zone3: 5, zone4: 0, zone5: 0 };
      case 'Fartlek':
        return { zone1: 15, zone2: 30, zone3: 30, zone4: 20, zone5: 5 };
      default:
        return { zone1: 20, zone2: 50, zone3: 25, zone4: 5, zone5: 0 };
    }
  };

  const generateCalories = (duration: number, avgHR: number, type: string) => {
    const baseCalories = duration * 12;
    const hrMultiplier = Math.max(0.8, avgHR / 160);
    const typeMultiplier = type === 'Intervalos' ? 1.3 : type === 'Tempo' ? 1.2 : 1.0;
    return Math.round(baseCalories * hrMultiplier * typeMultiplier);
  };

  const validateForm = () => {
    const required = ['name', 'type', 'duration', 'distance', 'avgPace'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (!selectedDate) {
      toast.error('Por favor selecciona una fecha para el entrenamiento');
      return false;
    }
    
    if (missing.length > 0) {
      toast.error(`Por favor completa los campos requeridos: ${missing.join(', ')}`);
      return false;
    }
    
    // Validar formato de ritmo
    const pacePattern = /^\d{1,2}:\d{2}$/;
    if (!pacePattern.test(formData.avgPace)) {
      toast.error('El formato del ritmo debe ser MM:SS (ej: 5:30)');
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      duration: '',
      distance: '',
      avgPace: '',
      maxHR: '',
      avgHR: '',
      calories: '',
      elevation: '',
      comments: '',
      effort: 5,
      fatigue: 5,
      motivation: 5,
      temperature: '',
      weather: '',
      surface: '',
      uploadType: 'manual',
      planificationId: '',
      sessionId: ''
    });
    setSelectedDate(undefined);
    setInjuries([]);
    setCurrentInjury({
      bodyPart: 'none',
      severity: 1,
      description: '',
      affectedPerformance: false,
      type: 'Molestia'
    });
    setShowInjuryForm(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInjuryChange = (field: string, value: string | number | boolean) => {
    setCurrentInjury(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = parseInt(formData.duration);
      const distance = parseFloat(formData.distance);
      const maxHR = parseInt(formData.maxHR) || 180;
      const avgHR = parseInt(formData.avgHR) || 155;
      const elevation = parseInt(formData.elevation) || 0;
      const calories = parseInt(formData.calories) || generateCalories(duration, avgHR, formData.type);
      
      const newTraining: TrainingSession = {
        id: `training_${Date.now()}`,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        name: formData.name,
        type: formData.type,
        duration,
        distance,
        avgPace: formData.avgPace,
        maxHR,
        avgHR,
        calories,
        elevation,
        comments: formData.comments || 'Sin comentarios adicionales',
        sensations: {
          effort: formData.effort,
          fatigue: formData.fatigue,
          motivation: formData.motivation
        },
        conditions: {
          temperature: parseInt(formData.temperature) || 20,
          weather: formData.weather || 'Soleado',
          surface: formData.surface || 'Asfalto'
        },
        splits: generateSplits(distance, formData.avgPace, avgHR, maxHR, elevation, formData.type),
        hrZones: generateHRZones(formData.type, avgHR, maxHR),
        injuries: injuries.length > 0 ? injuries : undefined,
        associatedSessionId: formData.sessionId || undefined,
        status: 'Completado'
      };
      
      if (distance > 10) {
        newTraining.route = {
          startLocation: 'Punto de Inicio',
          endLocation: distance > 15 ? 'Punto Final' : 'Punto de Inicio',
          routeType: distance > 15 ? 'Punto a Punto' : 'Circuito'
        };
      }
      
      resetForm();
      
      let toastDescription = `${formData.name} - ${distance} km en ${duration} minutos`;
      if (formData.sessionId) {
        const associatedSession = plannedSessions.find(s => s.id === formData.sessionId);
        if (associatedSession) {
          toastDescription += ` (Asociado a: ${associatedSession.name})`;
        }
      }
      if (injuries.length > 0) {
        toastDescription += ` (${injuries.length} molestia${injuries.length > 1 ? 's' : ''}/dolor${injuries.length > 1 ? 'es' : ''} registrada${injuries.length > 1 ? 's' : ''})`;
      }

      toast.success('¡Entrenamiento subido exitosamente!', {
        description: toastDescription
      });
      
    } catch (error) {
      toast.error('Error al subir el entrenamiento. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2>Subir Entrenamientos</h2>
          <p className="text-muted-foreground">
            Sube tus entrenamientos manualmente
          </p>
        </div>
      </div>

      <div className="flex-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Subida Manual
            </CardTitle>
            <CardDescription>
              Ingresa los datos de tu entrenamiento manualmente
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del Entrenamiento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-accent" />
                    <Label className="font-medium">Asociar con Planificación (Opcional)</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="planification">Planificación</Label>
                    <Select 
                      onValueChange={(value) => {
                        handleInputChange('planificationId', value === 'none' ? '' : value);
                        handleInputChange('sessionId', '');
                      }} 
                      value={formData.planificationId || 'none'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar planificación..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asociar</SelectItem>
                        {availablePlanifications.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex flex-col">
                              <span>{plan.name}</span>
                              <span className="text-xs text-muted-foreground">{plan.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.planificationId && (
                    <div className="space-y-2">
                      <Label htmlFor="session">Sesión Específica</Label>
                      <Select 
                        onValueChange={(value) => handleInputChange('sessionId', value === 'none' ? '' : value)} 
                        value={formData.sessionId || 'none'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sesión..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna sesión específica</SelectItem>
                          {getSessionsByPlanification(formData.planificationId).map(session => (
                            <SelectItem key={session.id} value={session.id}>
                              <div className="flex flex-col">
                                <span>{session.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(session.date), "d 'de' MMMM", { locale: es })} - 
                                  {session.plannedDistance}km en {session.plannedDuration}min
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.sessionId && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                      {(() => {
                        const selectedSession = plannedSessions.find(s => s.id === formData.sessionId);
                        if (!selectedSession) return null;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-accent" />
                              <span className="text-sm font-medium text-accent">Sesión Seleccionada</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Distancia planeada:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedDistance}km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duración planeada:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedDuration}min</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ritmo objetivo:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedPace}/km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">FC objetivo:</span>
                                <span className="ml-1 font-medium">{selectedSession.targetHR}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Entrenamiento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej: Trote matutino"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select onValueChange={(value) => handleInputChange('type', value)} value={formData.type}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Continuo">Continuo</SelectItem>
                        <SelectItem value="Intervalos">Intervalos</SelectItem>
                        <SelectItem value="Tempo">Tempo</SelectItem>
                        <SelectItem value="Fartlek">Fartlek</SelectItem>
                        <SelectItem value="Recuperación">Recuperación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="45"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distancia (km) *</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      value={formData.distance}
                      onChange={(e) => handleInputChange('distance', e.target.value)}
                      placeholder="8.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgPace">Ritmo Promedio (min:seg/km) *</Label>
                    <Input
                      id="avgPace"
                      value={formData.avgPace}
                      onChange={(e) => handleInputChange('avgPace', e.target.value)}
                      placeholder="5:30"
                      title="Formato: MM:SS (ej: 5:30)"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxHR">FC Máxima</Label>
                    <Input
                      id="maxHR"
                      type="number"
                      value={formData.maxHR}
                      onChange={(e) => handleInputChange('maxHR', e.target.value)}
                      placeholder="180"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgHR">FC Promedio</Label>
                    <Input
                      id="avgHR"
                      type="number"
                      value={formData.avgHR}
                      onChange={(e) => handleInputChange('avgHR', e.target.value)}
                      placeholder="155"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calorías</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.calories}
                      onChange={(e) => handleInputChange('calories', e.target.value)}
                      placeholder="Auto-calculado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elevation">Elevación (m)</Label>
                    <Input
                      id="elevation"
                      type="number"
                      value={formData.elevation}
                      onChange={(e) => handleInputChange('elevation', e.target.value)}
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comentarios</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    placeholder="¿Cómo te sentiste durante el entrenamiento?"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Sensaciones (1-10)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center space-y-2">
                      <Label className="text-sm">Esfuerzo</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.effort}
                        onChange={(e) => handleInputChange('effort', parseInt(e.target.value))}
                        className="text-center"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <Label className="text-sm">Fatiga</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.fatigue}
                        onChange={(e) => handleInputChange('fatigue', parseInt(e.target.value))}
                        className="text-center"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <Label className="text-sm">Motivación</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.motivation}
                        onChange={(e) => handleInputChange('motivation', parseInt(e.target.value))}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-500" />
                      Molestias o Dolores
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInjuryForm(!showInjuryForm)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar
                    </Button>
                  </div>

                  {injuries.length > 0 && (
                    <div className="space-y-2">
                      {injuries.map((injury, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getSeverityColor(injury.severity)}>
                                {getSeverityLabel(injury.severity)} ({injury.severity}/10)
                              </Badge>
                              <Badge variant="outline">{injury.type}</Badge>
                            </div>
                            <p className="text-sm font-medium">{injury.bodyPart}</p>
                            <p className="text-xs text-muted-foreground">{injury.description}</p>
                            {injury.affectedPerformance && (
                              <Badge variant="outline" className="text-xs mt-1 text-red-600 bg-red-50">
                                Afectó rendimiento
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInjury(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showInjuryForm && (
                    <div className="p-3 border rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Zona Corporal</Label>
                          <Select 
                            onValueChange={(value) => handleInjuryChange('bodyPart', value === 'none' ? 'none' : value)}
                            value={currentInjury.bodyPart || 'none'}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Seleccionar zona</SelectItem>
                              {bodyParts.map(part => (
                                <SelectItem key={part} value={part}>{part}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Tipo</Label>
                          <Select 
                            onValueChange={(value) => handleInjuryChange('type', value)}
                            value={currentInjury.type}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Molestia">Molestia</SelectItem>
                              <SelectItem value="Dolor">Dolor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Intensidad (1-10)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="range"
                            min="1"
                            max="10"
                            value={currentInjury.severity}
                            onChange={(e) => handleInjuryChange('severity', parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <Badge className={getSeverityColor(currentInjury.severity || 1)}>
                            {currentInjury.severity}/10
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Descripción</Label>
                        <Textarea
                          value={currentInjury.description}
                          onChange={(e) => handleInjuryChange('description', e.target.value)}
                          placeholder="Describe la molestia/dolor..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="affectedPerformance"
                          checked={currentInjury.affectedPerformance}
                          onCheckedChange={(checked) => handleInjuryChange('affectedPerformance', checked)}
                        />
                        <Label htmlFor="affectedPerformance" className="text-xs">
                          Afectó mi rendimiento durante el entrenamiento
                        </Label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={addInjury}
                          className="flex-1"
                        >
                          Agregar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInjuryForm(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Subir Entrenamiento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}