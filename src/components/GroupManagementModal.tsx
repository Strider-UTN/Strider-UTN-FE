import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  Settings, 
  Edit3, 
  BarChart3, 
  Activity, 
  Trash2,
  Save,
  Users,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  Target,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingGroup {
  id: string;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  athleteCount: number;
}

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TrainingGroup | null;
  onUpdateGroup: (updatedGroup: TrainingGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

interface GroupStats {
  totalWorkouts: number;
  completedWorkouts: number;
  plannedWorkouts: number;
  activeMembers: number;
}

export function GroupManagementModal({ 
  isOpen, 
  onClose, 
  group,
  onUpdateGroup,
  onDeleteGroup
}: GroupManagementModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: group?.name || '',
    trainingPoints: group?.trainingPoints.join(', ') || '',
    description: '',
    maxMembers: 50,
    isPublic: true,
    allowSelfJoin: false,
    requireApproval: true
  });

  // Datos simulados de estadísticas
  const [groupStats] = useState<GroupStats>({
    totalWorkouts: 127,
    completedWorkouts: 108,
    plannedWorkouts: 127,
    activeMembers: group?.athleteCount || 0
  });

  React.useEffect(() => {
    if (group) {
      setEditForm({
        name: group.name,
        trainingPoints: group.trainingPoints.join(', '),
        description: `Sede especializada en entrenamiento de ${group.trainingPoints.join(', ').toLowerCase()}`,
        maxMembers: 50,
        isPublic: true,
        allowSelfJoin: false,
        requireApproval: true
      });
    }
  }, [group]);

  const handleSave = async () => {
    if (!group) return;
    
    setIsSaving(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const updatedGroup: TrainingGroup = {
      ...group,
      name: editForm.name,
      trainingPoints: editForm.trainingPoints.split(',').map(point => point.trim()).filter(Boolean)
    };
    
    onUpdateGroup(updatedGroup);
    setIsEditing(false);
    setIsSaving(false);
    toast.success('Equipo actualizado exitosamente');
  };

  const handleConfirmDelete = () => {
    if (!group) return;
    
    onDeleteGroup(group.id);
    setShowDeleteDialog(false);
    onClose();
    toast.success('Equipo eliminado exitosamente');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateCompletionPercentage = () => {
    if (groupStats.plannedWorkouts === 0) return 0;
    return Math.round((groupStats.completedWorkouts / groupStats.plannedWorkouts) * 100);
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Settings className="w-5 h-5 mr-2" />
            Gestionar Sede - {group.name}
          </DialogTitle>
          <DialogDescription>
            Administra la configuración, estadísticas y ajustes de tu sede.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Información General */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Información Básica</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isSaving}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Nombre del Equipo *</Label>
                      <Input
                        id="groupName"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trainingPoints">Puntos de Entrenamiento *</Label>
                      <Input
                        id="trainingPoints"
                        placeholder="Ej: Pista, Parque Central, Estadio Municipal"
                        value={editForm.trainingPoints}
                        onChange={(e) => setEditForm(prev => ({ ...prev, trainingPoints: e.target.value }))}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separa múltiples ubicaciones con comas
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe el enfoque y objetivos de tu equipo..."
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={!editForm.name.trim() || !editForm.trainingPoints.trim() || isSaving}
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
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Nombre</Label>
                      <p className="font-medium">{group.name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Puntos de Entrenamiento</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {group.trainingPoints.map((point, index) => (
                          <Badge key={index} variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Fecha de Creación</Label>
                      <p className="font-medium">{formatDate(group.createdDate)}</p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Miembros Activos</Label>
                      <p className="font-medium">{group.athleteCount} atletas</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estadísticas */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{groupStats.activeMembers}</div>
                    <p className="text-xs text-muted-foreground">Miembros Activos</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold">{groupStats.totalWorkouts}</div>
                    <p className="text-xs text-muted-foreground">Entrenamientos</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{calculateCompletionPercentage()}%</div>
                    <p className="text-xs text-muted-foreground">Entrenamientos Completados</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Rendimiento</CardTitle>
                <CardDescription>
                  Resumen del progreso y actividad del equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Entrenamientos Completados</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: `${calculateCompletionPercentage()}%` }}></div>
                      </div>
                      <span className="text-sm font-medium">{calculateCompletionPercentage()}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retención de Miembros</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Membresía</CardTitle>
                <CardDescription>
                  Controla cómo se unen nuevos miembros a tu equipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Equipo Público</Label>
                    <p className="text-xs text-muted-foreground">
                      Los usuarios pueden ver y solicitar unirse al equipo
                    </p>
                  </div>
                  <Switch
                    checked={editForm.isPublic}
                    onCheckedChange={(checked) => 
                      setEditForm(prev => ({ ...prev, isPublic: checked }))
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
                    checked={editForm.allowSelfJoin}
                    onCheckedChange={(checked) => 
                      setEditForm(prev => ({ ...prev, allowSelfJoin: checked }))
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
                    checked={editForm.requireApproval}
                    onCheckedChange={(checked) => 
                      setEditForm(prev => ({ ...prev, requireApproval: checked }))
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
                    value={editForm.maxMembers}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      maxMembers: parseInt(e.target.value) || 50 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                  Configura qué notificaciones deseas recibir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <Label>Nuevos Miembros</Label>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <Label>Entrenamientos Completados</Label>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente el equipo "{group?.name}" y todos sus datos asociados, incluyendo miembros, entrenamientos y estadísticas. 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sí, eliminar equipo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}