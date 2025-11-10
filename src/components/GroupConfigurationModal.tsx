import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  Settings, 
  Bell,
  Activity,
  Save,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingGroup {
  id: string;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  memberCount: number;
  description?: string;
}

interface GroupConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: TrainingGroup[];
  onUpdateGroup: (updatedGroup: TrainingGroup) => void;
}

export function GroupConfigurationModal({ 
  isOpen, 
  onClose, 
  groups,
  onUpdateGroup
}: GroupConfigurationModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  
  const [configForm, setConfigForm] = useState({
    maxMembers: 50,
    isPublic: true,
    allowSelfJoin: false,
    requireApproval: true,
    notifications: {
      newMembers: true,
      completedWorkouts: true,
      injuries: true,
      missedSessions: false
    }
  });

  React.useEffect(() => {
    if (selectedGroup) {
      // Resetear a valores por defecto cuando cambia la sede seleccionada
      setConfigForm({
        maxMembers: 50,
        isPublic: true,
        allowSelfJoin: false,
        requireApproval: true,
        notifications: {
          newMembers: true,
          completedWorkouts: true,
          injuries: true,
          missedSessions: false
        }
      });
    }
  }, [selectedGroup]);

  const handleSave = async () => {
    if (!selectedGroup) return;
    
    setIsSaving(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSaving(false);
    toast.success('Configuración de sede actualizada exitosamente');
  };

  if (groups.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-primary">
              <Settings className="w-5 h-5 mr-2" />
              Configuración de Sedes
            </DialogTitle>
            <DialogDescription>
              No hay sedes disponibles para configurar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Primero debes crear una sede para poder configurarla.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Settings className="w-5 h-5 mr-2" />
            Configuración de Sedes
          </DialogTitle>
          <DialogDescription>
            Configura los ajustes de membresía y notificaciones de tus sedes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de Sede */}
          {groups.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seleccionar Sede</CardTitle>
                <CardDescription>
                  Elige la sede que deseas configurar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groups.map((group) => (
                    <Button
                      key={group.id}
                      variant={selectedGroupId === group.id ? "default" : "outline"}
                      className={`h-auto p-4 justify-start ${selectedGroupId === group.id ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs opacity-70">{group.memberCount} atletas</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de la Sede Seleccionada */}
          {selectedGroup && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sede Actual: {selectedGroup.name}</CardTitle>
                <CardDescription>
                  Configurando ajustes para esta sede
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Puntos de Entrenamiento</Label>
                    <p>{selectedGroup.trainingPoints.join(', ')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Miembros Activos</Label>
                    <p>{selectedGroup.memberCount} atletas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuración de Membresía */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Membresía</CardTitle>
              <CardDescription>
                Controla cómo se unen nuevos miembros a tu sede
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sede Pública</Label>
                  <p className="text-xs text-muted-foreground">
                    Los usuarios pueden ver y solicitar unirse a la sede
                  </p>
                </div>
                <Switch
                  checked={configForm.isPublic}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Auto-Inscripción</Label>
                  <p className="text-xs text-muted-foreground">
                    Los usuarios pueden unirse sin aprobación del entrenador
                  </p>
                </div>
                <Switch
                  checked={configForm.allowSelfJoin}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ ...prev, allowSelfJoin: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Requerir Aprobación</Label>
                  <p className="text-xs text-muted-foreground">
                    Las solicitudes de membresía requieren aprobación manual
                  </p>
                </div>
                <Switch
                  checked={configForm.requireApproval}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ ...prev, requireApproval: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Máximo de Miembros</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="1"
                  max="200"
                  value={configForm.maxMembers}
                  onChange={(e) => setConfigForm(prev => ({ 
                    ...prev, 
                    maxMembers: parseInt(e.target.value) || 50 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Límite máximo de atletas que pueden unirse a esta sede
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura qué notificaciones deseas recibir para esta sede
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <div>
                    <Label>Nuevos Miembros</Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando se une un nuevo atleta a la sede
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={configForm.notifications.newMembers}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, newMembers: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <div>
                    <Label>Entrenamientos Completados</Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando los atletas completan sesiones de entrenamiento
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={configForm.notifications.completedWorkouts}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, completedWorkouts: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <div>
                    <Label>Molestias y Lesiones</Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando los atletas reportan molestias o dolores
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={configForm.notifications.injuries}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, injuries: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <div>
                    <Label>Sesiones Perdidas</Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando los atletas faltan a entrenamientos programados
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={configForm.notifications.missedSessions}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, missedSessions: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent hover:bg-accent/90"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-accent-foreground/20 border-t-accent-foreground rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}