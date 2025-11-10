import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { 
  Link, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Heart, 
  Zap, 
  Calendar,
  Download,
  Settings,
  AlertCircle,
  Shield,
  Smartphone,
  Wifi,
  RefreshCw,
  ShieldAlert,
  Plus,
  X,
  FileText,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

type SyncStep = 'auth' | 'connecting' | 'downloading' | 'processing' | 'selecting' | 'health' | 'importing' | 'complete';

interface InjuryReport {
  bodyPart: string;
  severity: number; // 1-10 scale
  description: string;
  affectedPerformance: boolean;
  type: 'Molestia' | 'Dolor';
}

interface GarminActivity {
  id: string;
  name: string;
  date: string;
  type: string;
  distance: number;
  duration: string;
  avgPace: string;
  avgHeartRate: number;
  calories: number;
  elevation: number;
  selected: boolean;
  associatedSessionId?: string;
  injuries?: InjuryReport[];
  planificationId?: string;
}

interface PlannedSession {
  id: string;
  name: string;
  date: string;
  type: string;
  plannedDistance: number;
  plannedDuration: number;
  plannedPace: string;
}

interface AvailablePlanification {
  id: string;
  name: string;
  description: string;
  coach: string;
}

interface GarminSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (activities: GarminActivity[]) => void;
}

export function GarminSyncModal({ isOpen, onClose, onImportComplete }: GarminSyncModalProps) {
  const [currentStep, setCurrentStep] = useState<SyncStep>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activities, setActivities] = useState<GarminActivity[]>([]);
  const [autoSync, setAutoSync] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para manejo de molestias/dolores
  const [activityInjuries, setActivityInjuries] = useState<{[activityId: string]: InjuryReport[]}>({});
  const [showInjuryForm, setShowInjuryForm] = useState<{[activityId: string]: boolean}>({});
  const [currentInjury, setCurrentInjury] = useState<{[activityId: string]: Partial<InjuryReport>}>({});
  
  // No necesitamos estados para creación - solo para asociación

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

  // Mock data para planificaciones disponibles (similar al TrainingUpload)
  const availablePlanifications: AvailablePlanification[] = [
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

  // Sesiones planificadas disponibles para asociar
  const plannedSessions: PlannedSession[] = [
    {
      id: 'session_1',
      name: 'Trote Continuo Matutino',
      date: '2024-01-20',
      type: 'Continuo',
      plannedDistance: 8.0,
      plannedDuration: 45,
      plannedPace: '5:20'
    },
    {
      id: 'session_2',
      name: 'Intervalos 5x1000m',
      date: '2024-01-19',
      type: 'Intervalos',
      plannedDistance: 6.5,
      plannedDuration: 40,
      plannedPace: '4:30'
    },
    {
      id: 'session_3',
      name: 'Carrera Larga Fin de Semana',
      date: '2024-01-14',
      type: 'Continuo',
      plannedDistance: 18.0,
      plannedDuration: 90,
      plannedPace: '5:10'
    },
    {
      id: 'session_4',
      name: 'Tempo Run',
      date: '2024-01-17',
      type: 'Tempo',
      plannedDistance: 10.0,
      plannedDuration: 48,
      plannedPace: '4:45'
    }
  ];

  // Datos simulados de actividades Garmin
  const mockGarminActivities: GarminActivity[] = [
    {
      id: '1',
      name: 'Entrenamiento de Tempo',
      date: '2024-01-20T06:30:00Z',
      type: 'Carrera',
      distance: 10.5,
      duration: '48:30',
      avgPace: '4:37',
      avgHeartRate: 165,
      calories: 680,
      elevation: 120,
      selected: true
    },
    {
      id: '2',
      name: 'Entrenamiento Fácil',
      date: '2024-01-19T07:00:00Z',
      type: 'Carrera',
      distance: 8.2,
      duration: '42:15',
      avgPace: '5:09',
      avgHeartRate: 145,
      calories: 520,
      elevation: 85,
      selected: true
    },
    {
      id: '3',
      name: 'Intervalos 400m',
      date: '2024-01-17T18:00:00Z',
      type: 'Carrera',
      distance: 6.8,
      duration: '35:20',
      avgPace: '4:12',
      avgHeartRate: 178,
      calories: 485,
      elevation: 15,
      selected: false
    },
    {
      id: '4',
      name: 'Carrera Larga',
      date: '2024-01-14T08:00:00Z',
      type: 'Carrera',
      distance: 18.5,
      duration: '1:32:45',
      avgPace: '5:01',
      avgHeartRate: 152,
      calories: 1240,
      elevation: 250,
      selected: true
    }
  ];

  // Función para obtener sesiones por planificación (copiada del TrainingUpload)
  const getSessionsByPlanification = (planificationId: string) => {
    if (planificationId === 'plan_1') {
      return plannedSessions.filter(session => session.id === 'session_1' || session.id === 'session_4');
    } else if (planificationId === 'plan_2') {
      return plannedSessions.filter(session => session.id === 'session_1');
    } else if (planificationId === 'plan_3') {
      return plannedSessions.filter(session => session.id === 'session_2');
    }
    return [];
  };

  const handleAuthentication = async () => {
    if (!email || !password) {
      toast.error('Por favor, ingresa tu email y contraseña');
      return;
    }

    setIsLoading(true);
    setCurrentStep('connecting');
    
    // Simular proceso de autenticación
    setTimeout(() => {
      setIsAuthenticated(true);
      setCurrentStep('downloading');
      startDataDownload();
    }, 2000);
  };

  const startDataDownload = () => {
    setSyncProgress(0);
    
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentStep('processing');
          setTimeout(() => {
            setActivities(mockGarminActivities);
            setCurrentStep('selecting');
            setIsLoading(false);
          }, 1500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleActivityToggle = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, selected: !activity.selected }
          : activity
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = activities.every(activity => activity.selected);
    setActivities(prev => 
      prev.map(activity => ({ ...activity, selected: !allSelected }))
    );
  };

  const handlePlanificationAssociation = (activityId: string, planificationId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              planificationId: planificationId === 'none' ? undefined : planificationId,
              associatedSessionId: undefined // Reset session when planification changes
            }
          : activity
      )
    );
  };

  const handleSessionAssociation = (activityId: string, sessionId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              associatedSessionId: sessionId === 'none' ? undefined : sessionId
            }
          : activity
      )
    );
  };

  const getPlannedSessionById = (sessionId: string) => {
    return plannedSessions.find(session => session.id === sessionId);
  };

  // Funciones para manejar molestias/lesiones
  const addInjury = (activityId: string) => {
    const injury = currentInjury[activityId];
    if (!injury?.bodyPart || !injury?.description) {
      toast.error('Por favor completa la zona corporal y descripción');
      return;
    }

    const newInjury: InjuryReport = {
      bodyPart: injury.bodyPart!,
      severity: injury.severity || 1,
      description: injury.description!,
      affectedPerformance: injury.affectedPerformance || false,
      type: injury.type || 'Molestia'
    };

    setActivityInjuries(prev => ({
      ...prev,
      [activityId]: [...(prev[activityId] || []), newInjury]
    }));

    setCurrentInjury(prev => ({
      ...prev,
      [activityId]: {
        bodyPart: '',
        severity: 1,
        description: '',
        affectedPerformance: false,
        type: 'Molestia'
      }
    }));

    setShowInjuryForm(prev => ({ ...prev, [activityId]: false }));
    toast.success('Molestia/dolor agregado correctamente');
  };

  const removeInjury = (activityId: string, index: number) => {
    setActivityInjuries(prev => ({
      ...prev,
      [activityId]: prev[activityId]?.filter((_, i) => i !== index) || []
    }));
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

  const handleInjuryChange = (activityId: string, field: string, value: string | number | boolean) => {
    setCurrentInjury(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value
      }
    }));
  };

  // Ya no necesitamos las funciones de creación

  const proceedToHealthStep = () => {
    const selectedActivities = activities.filter(activity => activity.selected);
    
    if (selectedActivities.length === 0) {
      toast.error('Selecciona al menos una actividad para importar');
      return;
    }

    setCurrentStep('health');
  };

  const handleImport = () => {
    const selectedActivities = activities.filter(activity => activity.selected).map(activity => ({
      ...activity,
      injuries: activityInjuries[activity.id] || []
    }));

    setCurrentStep('importing');
    setIsLoading(true);
    setSyncProgress(0);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentStep('complete');
          setIsLoading(false);
          setTimeout(() => {
            onImportComplete(selectedActivities);
            toast.success(`${selectedActivities.length} entrenamientos importados exitosamente`);
            onClose();
            resetModal();
          }, 2000);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  const resetModal = () => {
    setCurrentStep('auth');
    setIsAuthenticated(false);
    setSyncProgress(0);
    setEmail('');
    setPassword('');
    setActivities([]);
    setIsLoading(false);
    setActivityInjuries({});
    setShowInjuryForm({});
    setCurrentInjury({});
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  const selectedCount = activities.filter(activity => activity.selected).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Sincronización con Garmin Connect
          </DialogTitle>
          <DialogDescription>
            Conecta tu cuenta de Garmin para importar entrenamientos automáticamente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep === 'auth' ? 'connect' : currentStep === 'health' ? 'health' : 'sync'} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connect" disabled={currentStep !== 'auth'}>
              Conectar Cuenta
            </TabsTrigger>
            <TabsTrigger value="sync" disabled={currentStep === 'auth' || currentStep === 'health'}>
              Sincronizar Datos
            </TabsTrigger>
            <TabsTrigger value="health" disabled={currentStep !== 'health'}>
              Estado de Salud
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Autenticación Segura
                </CardTitle>

              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de Garmin Connect</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu-email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Strider no almacena tus credenciales. La autenticación se realiza directamente con Garmin.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleAuthentication} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Conectar con Garmin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Configuración de Sincronización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sincronización Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Importar entrenamientos automáticamente
                    </p>
                  </div>
                  <Switch 
                    checked={autoSync} 
                    onCheckedChange={setAutoSync}
                    disabled={isLoading}
                  />
                </div>

                {autoSync && (
                  <div className="space-y-2">
                    <Label>Frecuencia de Sincronización</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={syncFrequency}
                      onChange={(e) => setSyncFrequency(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="realtime">Tiempo Real</option>
                      <option value="hourly">Cada Hora</option>
                      <option value="daily">Diariamente</option>
                      <option value="weekly">Semanalmente</option>
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6 mt-6">
            {currentStep === 'connecting' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Wifi className="w-12 h-12 text-primary mb-4 animate-pulse" />
                  <h3 className="text-lg font-semibold mb-2">Conectando con Garmin</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Estableciendo conexión segura con Garmin Connect...
                  </p>
                </CardContent>
              </Card>
            )}

            {currentStep === 'downloading' && (
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <Download className="w-12 h-12 text-primary animate-bounce" />
                    <h3 className="text-lg font-semibold">Descargando Entrenamientos</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Obteniendo tus actividades recientes de Garmin Connect...
                    </p>
                    <div className="w-full max-w-sm">
                      <Progress value={syncProgress} className="w-full" />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {syncProgress}% completado
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'processing' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="w-12 h-12 text-primary mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-2">Procesando Datos</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Analizando entrenamientos y buscando coincidencias con tu plan...
                  </p>
                </CardContent>
              </Card>
            )}

            {currentStep === 'selecting' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Entrenamientos Encontrados</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecciona los entrenamientos que deseas importar
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSelectAll}
                    >
                      {activities.every(a => a.selected) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </Button>
                    <Badge variant="secondary">
                      {selectedCount} de {activities.length} seleccionados
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  {activities.map((activity) => (
                    <Card 
                      key={activity.id} 
                      className={`transition-all ${
                        activity.selected ? 'ring-2 ring-primary' : 'hover:border-muted-foreground'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header con checkbox y datos básicos */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                checked={activity.selected}
                                onCheckedChange={() => handleActivityToggle(activity.id)}
                              />
                              <div className="space-y-1">
                                <h4 className="font-semibold">{activity.name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(activity.date).toLocaleDateString('es-ES')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {activity.distance.toFixed(1)} km
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {activity.avgPace}/km
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {activity.avgHeartRate} bpm
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Selector de asociación jerárquica: Planificación → Sesión */}
                          {activity.selected && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-accent" />
                                <Label className="font-medium">Asociar con Planificación (Opcional)</Label>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-sm">Planificación</Label>
                                <Select 
                                  onValueChange={(value) => handlePlanificationAssociation(activity.id, value)}
                                  value={activity.planificationId || 'none'}
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

                              {activity.planificationId && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Sesión Específica</Label>
                                  <Select 
                                    onValueChange={(value) => handleSessionAssociation(activity.id, value)}
                                    value={activity.associatedSessionId || 'none'}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar sesión..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sin sesión específica</SelectItem>
                                      {getSessionsByPlanification(activity.planificationId).map((session) => (
                                        <SelectItem key={session.id} value={session.id}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{session.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {session.plannedDistance}km - {session.plannedPace}/km - {new Date(session.date).toLocaleDateString('es-ES')}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {activity.associatedSessionId && (
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                      <div className="flex items-center gap-1 text-green-700">
                                        <CheckCircle className="w-3 h-3" />
                                        <span className="font-medium">Entrenamiento asociado correctamente</span>
                                      </div>
                                      {(() => {
                                        const selectedPlan = availablePlanifications.find(p => p.id === activity.planificationId);
                                        const selectedSession = getSessionsByPlanification(activity.planificationId).find(s => s.id === activity.associatedSessionId);
                                        return (
                                          <p className="text-xs text-green-600 mt-1">
                                            {selectedPlan?.name} → {selectedSession?.name}
                                          </p>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={proceedToHealthStep}
                    disabled={selectedCount === 0}
                  >
                    Continuar ({selectedCount} entrenamientos)
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'importing' && (
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                    <h3 className="text-lg font-semibold">Importando Entrenamientos</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Procesando y guardando tus entrenamientos en Strider...
                    </p>
                    <div className="w-full max-w-sm">
                      <Progress value={syncProgress} className="w-full" />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {Math.floor((syncProgress / 100) * selectedCount)} de {selectedCount} importados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'complete' && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">¡Sincronización Completada!</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {selectedCount} entrenamientos han sido importados exitosamente
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {activities.filter(a => a.selected && a.associatedSessionId).length} con asociación
                    </Badge>
                    <Badge variant="outline">
                      {activities.filter(a => a.selected && !a.associatedSessionId).length} sin asociar
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="health" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Estado de Salud y Molestias</h3>
                <p className="text-sm text-muted-foreground">
                  Reporta cualquier molestia o dolor que hayas experimentado durante estos entrenamientos
                </p>
              </div>

              <div className="space-y-4">
                {activities.filter(activity => activity.selected).map((activity) => (
                  <Card key={activity.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header del entrenamiento */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{activity.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(activity.date).toLocaleDateString('es-ES')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.distance.toFixed(1)} km
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.duration}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInjuryForm(prev => ({ 
                              ...prev, 
                              [activity.id]: !prev[activity.id] 
                            }))}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Agregar Molestia
                          </Button>
                        </div>

                        {/* Lista de molestias existentes */}
                        {activityInjuries[activity.id] && activityInjuries[activity.id].length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-orange-600">Molestias reportadas:</Label>
                            {activityInjuries[activity.id].map((injury, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={getSeverityColor(injury.severity)}>
                                      {getSeverityLabel(injury.severity)} ({injury.severity}/10)
                                    </Badge>
                                    <Badge variant="outline">{injury.type}</Badge>
                                  </div>
                                  <p className="text-sm font-medium text-orange-800">{injury.bodyPart}</p>
                                  <p className="text-xs text-orange-700">{injury.description}</p>
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
                                  onClick={() => removeInjury(activity.id, index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulario para agregar nueva molestia */}
                        {showInjuryForm[activity.id] && (
                          <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Zona Corporal</Label>
                                <Select 
                                  onValueChange={(value) => handleInjuryChange(activity.id, 'bodyPart', value)}
                                  value={currentInjury[activity.id]?.bodyPart || ''}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {bodyParts.map(part => (
                                      <SelectItem key={part} value={part}>{part}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Tipo</Label>
                                <Select 
                                  onValueChange={(value) => handleInjuryChange(activity.id, 'type', value)}
                                  value={currentInjury[activity.id]?.type || 'Molestia'}
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
                                <Slider
                                  value={[currentInjury[activity.id]?.severity || 1]}
                                  onValueChange={(value) => handleInjuryChange(activity.id, 'severity', value[0])}
                                  max={10}
                                  min={1}
                                  step={1}
                                  className="flex-1"
                                />
                                <Badge className={getSeverityColor(currentInjury[activity.id]?.severity || 1)}>
                                  {currentInjury[activity.id]?.severity || 1}/10
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Descripción</Label>
                              <Textarea
                                value={currentInjury[activity.id]?.description || ''}
                                onChange={(e) => handleInjuryChange(activity.id, 'description', e.target.value)}
                                placeholder="Describe la molestia/dolor..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`affectedPerformance-${activity.id}`}
                                checked={currentInjury[activity.id]?.affectedPerformance || false}
                                onCheckedChange={(checked) => handleInjuryChange(activity.id, 'affectedPerformance', checked)}
                              />
                              <Label htmlFor={`affectedPerformance-${activity.id}`} className="text-xs">
                                Afectó mi rendimiento durante el entrenamiento
                              </Label>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addInjury(activity.id)}
                                className="flex-1"
                              >
                                Agregar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowInjuryForm(prev => ({ ...prev, [activity.id]: false }))}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('selecting')}
                >
                  Volver a Selección
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport}>
                    Importar {selectedCount} entrenamientos
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}