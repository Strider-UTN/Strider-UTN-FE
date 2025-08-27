import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { PlusCircle, Calendar, Users, Target, Trash2, Settings, Eye, Search, Filter, Edit, X } from 'lucide-react';
import { PlanningView } from './PlanningView';
import { CreatePlanningModal } from './CreatePlanningModal';
import { toast } from 'sonner';

interface TrainingGroup {
  id: string;
  name: string;
  athleteCount: number;
}

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
}

interface Planning {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null; // null = indefinido
  createdAt: string;
  updatedAt: string;
  athletes: string[]; // IDs de atletas
  groups: string[]; // IDs de sedes
  assignmentType: 'individual' | 'group';
  status: 'active' | 'completed' | 'draft';
  periodsCount: number;
  groupsCount: number;
}

// Datos simulados
const mockGroups: TrainingGroup[] = [
  { id: '1', name: 'Sede Velocistas Elite', athleteCount: 12 },
  { id: '2', name: 'Sede Fondistas Amateur', athleteCount: 8 },
  { id: '3', name: 'Sede Mediofondistas', athleteCount: 6 }
];

const mockAthletes: Athlete[] = [
  { id: '1', name: 'Carlos Mendoza', groupId: '1', groupName: 'Sede Velocistas Elite' },
  { id: '2', name: 'Ana Rodríguez', groupId: '1', groupName: 'Sede Velocistas Elite' },
  { id: '3', name: 'Miguel Torres', groupId: '2', groupName: 'Sede Fondistas Amateur' },
  { id: '4', name: 'Laura Sánchez', groupId: '2', groupName: 'Sede Fondistas Amateur' },
  { id: '5', name: 'David García', groupId: '3', groupName: 'Sede Mediofondistas' },
  { id: '6', name: 'Sofia López', groupId: '3', groupName: 'Sede Mediofondistas' }
];

const mockPlannings: Planning[] = [
  {
    id: '1',
    name: 'Preparación Temporada 2024',
    description: 'Plan integral para la temporada competitiva 2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-20T15:30:00Z',
    athletes: ['1', '2', '3'],
    groups: [],
    assignmentType: 'individual',
    status: 'active',
    periodsCount: 48,
    groupsCount: 12
  },
  {
    id: '2',
    name: 'Plan Velocidad Primavera',
    description: 'Entrenamiento específico de velocidad para competencias de primavera',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    createdAt: '2024-02-15T14:20:00Z',
    updatedAt: '2024-03-18T09:15:00Z',
    athletes: ['1', '2', '5'],
    groups: [],
    assignmentType: 'individual',
    status: 'active',
    periodsCount: 16,
    groupsCount: 4
  },
  {
    id: '3',
    name: 'Preparación Sede Completa',
    description: 'Plan grupal para toda la sede de fondistas amateur',
    startDate: '2024-04-01',
    endDate: null,
    createdAt: '2024-03-10T11:45:00Z',
    updatedAt: '2024-03-19T16:20:00Z',
    athletes: [],
    groups: ['2'],
    assignmentType: 'group',
    status: 'draft',
    periodsCount: 0,
    groupsCount: 0
  }
];

interface PlanningManagementProps {
  onBack: () => void;
}

export function PlanningManagement({ onBack }: PlanningManagementProps) {
  const [selectedPlanning, setSelectedPlanning] = useState<Planning | null>(null);
  const [plannings, setPlannings] = useState<Planning[]>(mockPlannings);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingPlanning, setEditingPlanning] = useState<Planning | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: 'draft' as 'active' | 'completed' | 'draft',
    startDate: '',
    endDate: '',
    hasEndDate: false,
    athletes: [] as string[]
  });

  const filteredPlannings = plannings.filter(planning => {
    const matchesSearch = planning.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         planning.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || planning.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'completed': return 'Completada';
      case 'draft': return 'Borrador';
      default: return 'Desconocido';
    }
  };

  const handleCreatePlanning = (planningData: Omit<Planning, 'id' | 'createdAt' | 'updatedAt' | 'periodsCount' | 'groupsCount'>) => {
    const newPlanning: Planning = {
      ...planningData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      periodsCount: 0,
      groupsCount: 0
    };

    setPlannings(prev => [newPlanning, ...prev]);
    setIsCreateModalOpen(false);
    
    const type = planningData.assignmentType === 'individual' ? 'individual' : 'grupal';
    toast.success(`Planificación ${type} creada exitosamente`);
  };

  const handleDeletePlanning = (planningId: string) => {
    setPlannings(prev => prev.filter(p => p.id !== planningId));
    setDeleteConfirmId(null);
    toast.success('Planificación eliminada');
  };

  const handleEditPlanning = (planning: Planning) => {
    setEditingPlanning(planning);
    setEditForm({
      name: planning.name,
      description: planning.description,
      status: planning.status,
      startDate: planning.startDate,
      endDate: planning.endDate || '',
      hasEndDate: !!planning.endDate,
      athletes: planning.athletes
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePlanning = () => {
    if (!editingPlanning) return;

    if (!editForm.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!editForm.startDate) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }

    if (editForm.hasEndDate && editForm.endDate && new Date(editForm.endDate) <= new Date(editForm.startDate)) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    const updatedPlanning: Planning = {
      ...editingPlanning,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
      startDate: editForm.startDate,
      endDate: editForm.hasEndDate ? editForm.endDate : null,
      athletes: editForm.athletes,
      updatedAt: new Date().toISOString()
    };

    setPlannings(prev => prev.map(p => p.id === updatedPlanning.id ? updatedPlanning : p));
    setIsEditModalOpen(false);
    setEditingPlanning(null);
    toast.success('Planificación actualizada exitosamente');
  };

  const getAthletesInPlanning = (planning: Planning) => {
    if (planning.assignmentType === 'individual') {
      return mockAthletes.filter(athlete => planning.athletes.includes(athlete.id));
    } else {
      return mockAthletes.filter(athlete => planning.groups.includes(athlete.groupId));
    }
  };

  const getGroupsInPlanning = (groupIds: string[]) => {
    return mockGroups.filter(group => groupIds.includes(group.id));
  };

  const getTotalAthletesInPlanning = (planning: Planning) => {
    if (planning.assignmentType === 'individual') {
      return planning.athletes.length;
    } else {
      return planning.groups.reduce((total, groupId) => {
        const group = mockGroups.find(g => g.id === groupId);
        return total + (group?.athleteCount || 0);
      }, 0);
    }
  };

  const handleAthleteToggle = (athleteId: string) => {
    setEditForm(prev => ({
      ...prev,
      athletes: prev.athletes.includes(athleteId)
        ? prev.athletes.filter(id => id !== athleteId)
        : [...prev.athletes, athleteId]
    }));
  };

  const getGroupedAthletes = () => {
    const grouped: { [key: string]: Athlete[] } = {};
    mockAthletes.forEach(athlete => {
      if (!grouped[athlete.groupName]) {
        grouped[athlete.groupName] = [];
      }
      grouped[athlete.groupName].push(athlete);
    });
    return grouped;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Si hay una planificación seleccionada, mostrar su vista detallada
  if (selectedPlanning) {
    return (
      <PlanningView
        planning={selectedPlanning}
        athletes={getAthletesInPlanning(selectedPlanning)}
        onBack={() => setSelectedPlanning(null)}
        onUpdate={(updatedPlanning) => {
          setPlannings(prev => prev.map(p => p.id === updatedPlanning.id ? updatedPlanning : p));
          setSelectedPlanning(updatedPlanning);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onBack}>
              ← Volver
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-primary">Planificaciones</h2>
              <p className="text-muted-foreground">
                Crea y administra planificaciones de entrenamiento para tus atletas
              </p>
            </div>
          </div>
        </div>
        
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-accent hover:bg-accent/90">
          <PlusCircle className="w-4 h-4 mr-2" />
          Nueva Planificación
        </Button>
      </div>

      {/* Estadísticas generales */}


      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar planificación</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de planificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPlannings.map((planning) => (
          <Card key={planning.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{planning.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {planning.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(planning.status)}>
                  {getStatusText(planning.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Inicio:</span>
                  <div className="font-medium">{formatDate(planning.startDate)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Fin:</span>
                  <div className="font-medium">
                    {planning.endDate ? formatDate(planning.endDate) : 'Indefinido'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {planning.assignmentType === 'individual' ? 'Atletas:' : 'Total atletas:'}
                  </span>
                  <div className="font-medium">{getTotalAthletesInPlanning(planning)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <div className="font-medium">
                    {planning.assignmentType === 'individual' ? 'Individual' : 'Grupal'}
                  </div>
                </div>
              </div>

              {(planning.athletes.length > 0 || planning.groups.length > 0) && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {planning.assignmentType === 'individual' ? 'Atletas asignados:' : 'Sedes asignadas:'}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {planning.assignmentType === 'individual' 
                      ? getAthletesInPlanning(planning).map(athlete => (
                          <Badge key={athlete.id} variant="outline" className="text-xs">
                            {athlete.name}
                          </Badge>
                        ))
                      : getGroupsInPlanning(planning.groups).map(group => (
                          <Badge key={group.id} variant="outline" className="text-xs">
                            {group.name} ({group.athleteCount})
                          </Badge>
                        ))
                    }
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => setSelectedPlanning(planning)}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEditPlanning(planning)}
                  className="text-primary hover:text-primary"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmId(planning.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlannings.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron planificaciones</h3>
            <p className="text-muted-foreground mb-4">
              Ajusta los filtros o crea una nueva planificación
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="w-4 h-4 mr-2" />
              Crear Primera Planificación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de creación */}
      <CreatePlanningModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePlanning}
        athletes={mockAthletes}
        groups={mockGroups}
      />

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Planificación</DialogTitle>
            <DialogDescription>
              Modifica la información, fechas y atletas asignados a la planificación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre de la planificación"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado *</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value: any) => setEditForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                          Borrador
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          Activa
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          Completada
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la planificación"
                  rows={3}
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fechas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Fecha de Inicio *</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-end-date"
                      checked={editForm.hasEndDate}
                      onCheckedChange={(checked) => setEditForm(prev => ({ 
                        ...prev, 
                        hasEndDate: !!checked,
                        endDate: checked ? prev.endDate : ''
                      }))}
                    />
                    <Label htmlFor="has-end-date">¿Tiene fecha de fin?</Label>
                  </div>
                  {editForm.hasEndDate && (
                    <Input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                      min={editForm.startDate}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Atletas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Atletas Asignados</h3>
                <Badge variant="outline">
                  {editForm.athletes.length} seleccionados
                </Badge>
              </div>

              {editForm.athletes.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                  {mockAthletes.filter(a => editForm.athletes.includes(a.id)).map(athlete => (
                    <Badge key={athlete.id} variant="secondary" className="flex items-center gap-1">
                      {athlete.name}
                      <button
                        onClick={() => handleAthleteToggle(athlete.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-4 max-h-48 overflow-y-auto border rounded-lg p-3">
                {Object.entries(getGroupedAthletes()).map(([groupName, athletes]) => (
                  <div key={groupName} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                      {groupName}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {athletes.map(athlete => (
                        <div key={athlete.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`athlete-${athlete.id}`}
                            checked={editForm.athletes.includes(athlete.id)}
                            onCheckedChange={() => handleAthleteToggle(athlete.id)}
                          />
                          <Label htmlFor={`athlete-${athlete.id}`} className="text-sm cursor-pointer">
                            {athlete.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlanning} className="bg-accent hover:bg-accent/90">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar planificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la planificación
              y todos sus períodos configurados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDeletePlanning(deleteConfirmId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}