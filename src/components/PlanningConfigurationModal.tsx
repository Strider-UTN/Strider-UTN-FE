import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Calendar, 
  Settings, 
  Target, 
  Clock, 
  Zap, 
  Bell, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  AlertTriangle,
  Activity,
  Timer,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanningConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SeasonPeriod {
  id: string;
  name: string;
  duration: number;
  color: string;
  description: string;
}

interface SessionTemplate {
  id: string;
  name: string;
  category: 'training' | 'preparatory' | 'competition';
  warmupDuration: number;
  mainWork: string;
  cooldownDuration: number;
  tags: string[];
}

interface AlertConfiguration {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

export function PlanningConfigurationModal({ isOpen, onClose }: PlanningConfigurationModalProps) {
  const [activeTab, setActiveTab] = useState('seasons');
  
  // Estados para configuración de temporadas
  const [seasonPeriods, setSeasonPeriods] = useState<SeasonPeriod[]>([
    { id: '1', name: 'Preparación Base', duration: 8, color: '#06b6d4', description: 'Desarrollo de resistencia aeróbica' },
    { id: '2', name: 'Preparación Específica', duration: 6, color: '#0891b2', description: 'Trabajo de velocidad y fuerza específica' },
    { id: '3', name: 'Competición', duration: 4, color: '#1e293b', description: 'Mantenimiento y competiciones principales' },
    { id: '4', name: 'Transición', duration: 2, color: '#717182', description: 'Recuperación activa y descanso' }
  ]);

  // Estados para plantillas de sesiones
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([
    {
      id: '1',
      name: 'Entrenamiento Base',
      category: 'training',
      warmupDuration: 15,
      mainWork: '45min a ritmo aeróbico',
      cooldownDuration: 10,
      tags: ['aeróbico', 'base']
    },
    {
      id: '2',
      name: 'Intervalos VO2Max',
      category: 'training',
      warmupDuration: 20,
      mainWork: '6x3min al 95% VO2Max (rec: 90s)',
      cooldownDuration: 15,
      tags: ['intervalos', 'vo2max']
    },
    {
      id: '3',
      name: 'Test 5K',
      category: 'preparatory',
      warmupDuration: 25,
      mainWork: 'Test progresivo 5000m',
      cooldownDuration: 20,
      tags: ['test', 'evaluación']
    }
  ]);

  // Estados para configuración de alertas
  const [alerts, setAlerts] = useState<AlertConfiguration[]>([
    { id: '1', name: 'Sobrecarga Semanal', condition: 'weekly_load_increase', threshold: 10, enabled: true },
    { id: '2', name: 'Días Sin Entrenamiento', condition: 'days_without_training', threshold: 3, enabled: true },
    { id: '3', name: 'Intensidad Consecutiva', condition: 'consecutive_high_intensity', threshold: 2, enabled: false }
  ]);

  // Estados para métricas
  const [metricsConfig, setMetricsConfig] = useState({
    distanceUnit: 'km',
    paceUnit: 'min/km',
    autoCalculateVo2Max: true,
    trackLoadDistribution: true,
    weeklyVolumeTarget: 50,
    intensityZones: 5
  });

  const [newPeriod, setNewPeriod] = useState({ name: '', duration: 0, color: '#06b6d4', description: '' });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'training' as 'training' | 'preparatory' | 'competition',
    warmupDuration: 15,
    mainWork: '',
    cooldownDuration: 10,
    tags: [] as string[]
  });

  const handleSaveConfiguration = () => {
    // Aquí guardarías la configuración en el backend o localStorage
    toast.success('Configuración guardada correctamente');
    onClose();
  };

  const addSeasonPeriod = () => {
    if (newPeriod.name && newPeriod.duration > 0) {
      setSeasonPeriods([...seasonPeriods, { 
        ...newPeriod, 
        id: Date.now().toString() 
      }]);
      setNewPeriod({ name: '', duration: 0, color: '#06b6d4', description: '' });
      toast.success('Período agregado correctamente');
    }
  };

  const removeSeasonPeriod = (id: string) => {
    setSeasonPeriods(seasonPeriods.filter(period => period.id !== id));
    toast.success('Período eliminado');
  };

  const addSessionTemplate = () => {
    if (newTemplate.name && newTemplate.mainWork) {
      setSessionTemplates([...sessionTemplates, {
        ...newTemplate,
        id: Date.now().toString(),
        tags: newTemplate.tags
      }]);
      setNewTemplate({
        name: '',
        category: 'training',
        warmupDuration: 15,
        mainWork: '',
        cooldownDuration: 10,
        tags: []
      });
      toast.success('Plantilla agregada correctamente');
    }
  };

  const removeSessionTemplate = (id: string) => {
    setSessionTemplates(sessionTemplates.filter(template => template.id !== id));
    toast.success('Plantilla eliminada');
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-6 h-6 text-accent" />
              Configuración de Planificaciones
            </DialogTitle>
            <DialogDescription className="text-base">
              Configura los parámetros, plantillas y alertas para optimizar tus planificaciones de entrenamiento
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="seasons" className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  Temporadas
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  Plantillas
                </TabsTrigger>
                <TabsTrigger value="metrics" className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  Métricas
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4" />
                  Alertas
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="seasons" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 py-6 pb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Períodos de Temporada</CardTitle>
                      <CardDescription className="text-base">
                        Define los períodos estándar de entrenamiento y sus duraciones
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {seasonPeriods.map((period) => (
                        <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: period.color }}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-base">{period.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{period.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              {period.duration} semanas
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSeasonPeriod(period.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <Separator className="my-6" />

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-medium mb-4 text-base">Agregar Nuevo Período</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Nombre del período</Label>
                            <Input
                              value={newPeriod.name}
                              onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                              placeholder="ej. Preparación Base"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Duración (semanas)</Label>
                            <Input
                              type="number"
                              value={newPeriod.duration || ''}
                              onChange={(e) => setNewPeriod({ ...newPeriod, duration: parseInt(e.target.value) || 0 })}
                              placeholder="8"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Color</Label>
                            <Input
                              type="color"
                              value={newPeriod.color}
                              onChange={(e) => setNewPeriod({ ...newPeriod, color: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Descripción</Label>
                            <Input
                              value={newPeriod.description}
                              onChange={(e) => setNewPeriod({ ...newPeriod, description: e.target.value })}
                              placeholder="Breve descripción del período"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button onClick={addSeasonPeriod} className="w-full mt-4 bg-accent hover:bg-accent/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Período
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="templates" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 py-6 pb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Plantillas de Sesiones</CardTitle>
                      <CardDescription className="text-base">
                        Crea plantillas predefinidas para acelerar la creación de sesiones
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sessionTemplates.map((template) => (
                        <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-base">{template.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                template.category === 'training' ? 'default' :
                                template.category === 'preparatory' ? 'secondary' : 'destructive'
                              } className="text-sm">
                                {template.category === 'training' ? 'Entrenamiento' :
                                 template.category === 'preparatory' ? 'Preparatorio' : 'Competición'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSessionTemplate(template.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p className="flex items-center">
                              <Clock className="w-4 h-4 inline mr-2" />
                              Calentamiento: {template.warmupDuration} min
                            </p>
                            <p className="flex items-center">
                              <Zap className="w-4 h-4 inline mr-2" />
                              Trabajo principal: {template.mainWork}
                            </p>
                            <p className="flex items-center">
                              <Timer className="w-4 h-4 inline mr-2" />
                              Enfriamiento: {template.cooldownDuration} min
                            </p>
                          </div>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {template.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}

                      <Separator className="my-6" />

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-medium mb-4 text-base">Agregar Nueva Plantilla</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Nombre de la plantilla</Label>
                            <Input
                              value={newTemplate.name}
                              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                              placeholder="ej. Intervalos VO2Max"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Categoría</Label>
                            <Select 
                              value={newTemplate.category} 
                              onValueChange={(value: 'training' | 'preparatory' | 'competition') => 
                                setNewTemplate({ ...newTemplate, category: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="training">Entrenamiento</SelectItem>
                                <SelectItem value="preparatory">Preparatorio</SelectItem>
                                <SelectItem value="competition">Competición</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Calentamiento (min)</Label>
                            <Input
                              type="number"
                              value={newTemplate.warmupDuration}
                              onChange={(e) => setNewTemplate({ ...newTemplate, warmupDuration: parseInt(e.target.value) || 0 })}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Enfriamiento (min)</Label>
                            <Input
                              type="number"
                              value={newTemplate.cooldownDuration}
                              onChange={(e) => setNewTemplate({ ...newTemplate, cooldownDuration: parseInt(e.target.value) || 0 })}
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-full space-y-2">
                            <Label className="text-sm">Trabajo Principal</Label>
                            <Input
                              value={newTemplate.mainWork}
                              onChange={(e) => setNewTemplate({ ...newTemplate, mainWork: e.target.value })}
                              placeholder="ej. 6x3min al 95% VO2Max (rec: 90s)"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button onClick={addSessionTemplate} className="w-full mt-4 bg-accent hover:bg-accent/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="metrics" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 py-6 pb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configuración de Métricas</CardTitle>
                      <CardDescription className="text-base">
                        Ajusta las unidades y parámetros de seguimiento de rendimiento
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm">Unidad de Distancia</Label>
                          <Select 
                            value={metricsConfig.distanceUnit} 
                            onValueChange={(value) => setMetricsConfig({ ...metricsConfig, distanceUnit: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="km">Kilómetros</SelectItem>
                              <SelectItem value="miles">Millas</SelectItem>
                              <SelectItem value="m">Metros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Unidad de Ritmo</Label>
                          <Select 
                            value={metricsConfig.paceUnit} 
                            onValueChange={(value) => setMetricsConfig({ ...metricsConfig, paceUnit: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="min/km">min/km</SelectItem>
                              <SelectItem value="min/mile">min/milla</SelectItem>
                              <SelectItem value="mph">mph</SelectItem>
                              <SelectItem value="kph">km/h</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-base">Cálculo automático de VO₂ Max</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Estimar VO₂ Max basado en tiempos de carrera
                            </p>
                          </div>
                          <Switch 
                            checked={metricsConfig.autoCalculateVo2Max}
                            onCheckedChange={(checked) => setMetricsConfig({ ...metricsConfig, autoCalculateVo2Max: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-base">Seguimiento de distribución de carga</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Monitorear balance entre diferentes intensidades
                            </p>
                          </div>
                          <Switch 
                            checked={metricsConfig.trackLoadDistribution}
                            onCheckedChange={(checked) => setMetricsConfig({ ...metricsConfig, trackLoadDistribution: checked })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm">Objetivo volumen semanal ({metricsConfig.distanceUnit})</Label>
                          <Input
                            type="number"
                            value={metricsConfig.weeklyVolumeTarget}
                            onChange={(e) => setMetricsConfig({ ...metricsConfig, weeklyVolumeTarget: parseInt(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Zonas de intensidad</Label>
                          <Select 
                            value={metricsConfig.intensityZones.toString()} 
                            onValueChange={(value) => setMetricsConfig({ ...metricsConfig, intensityZones: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 zonas</SelectItem>
                              <SelectItem value="5">5 zonas</SelectItem>
                              <SelectItem value="7">7 zonas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 py-6 pb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configuración de Alertas</CardTitle>
                      <CardDescription className="text-base">
                        Configure alertas automáticas para prevenir sobreentrenamiento y optimizar el rendimiento
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <AlertTriangle className={`w-5 h-5 ${alert.enabled ? 'text-amber-500' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <p className="font-medium text-base">{alert.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Umbral: {alert.threshold}
                                {alert.condition === 'weekly_load_increase' && '% incremento semanal'}
                                {alert.condition === 'days_without_training' && ' días sin entrenar'}
                                {alert.condition === 'consecutive_high_intensity' && ' días consecutivos alta intensidad'}
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={alert.enabled}
                            onCheckedChange={() => toggleAlert(alert.id)}
                          />
                        </div>
                      ))}

                      <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6">
                        <div className="flex items-start gap-4">
                          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 text-base">
                              Notificaciones Inteligentes
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 leading-relaxed">
                              Las alertas se activarán automáticamente cuando se detecten patrones de riesgo en las planificaciones.
                              Recibirás notificaciones por email y en el dashboard.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 pt-4 border-t">
          <div className="flex justify-end">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="text-sm">
                Cancelar
              </Button>
              <Button onClick={handleSaveConfiguration} className="bg-accent hover:bg-accent/90 text-sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}