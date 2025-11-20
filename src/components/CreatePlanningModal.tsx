import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';

import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar, X, Save, Users, User, MapPin, Loader2, Edit, AlertCircle } from 'lucide-react';
import { PlanningService } from '../services/planningService';
import { apiClient } from '../services/apiClient';
import { toast } from 'sonner';
import type { CreatePlanningDto, UpdatePlanningDto } from '../types/planningTypes';

interface TrainingGroup {
  id: string | number;
  name: string;
  athleteCount: number;
}

interface Athlete {
  id: string | number;
  name: string;
  groupId: string | number;
  groupName: string;
}

interface Planning {
  id: string | number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status: 'active' | 'completed' | 'draft';
  athletes?: string[]; // IDs de atletas
}

interface CreatePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void; // Callback opcional que se llama después de crear/actualizar exitosamente
  athletes?: Athlete[];
  groups?: TrainingGroup[];
  isLoading?: boolean; // Indica si se están cargando los datos
  editingPlanning?: Planning | null; // Planificación a editar (null o undefined = modo creación)
}

export function CreatePlanningModal({ isOpen, onClose, onSubmit, athletes = [], groups = [], isLoading = false, editingPlanning = null }: CreatePlanningModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    hasEndDate: false,
    assignmentType: 'individual' as 'individual' | 'group',
    status: 'draft' as 'active' | 'completed' | 'draft'
  });
  
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAssignedAthletes, setIsLoadingAssignedAthletes] = useState(false);
  const [originalAssignedAthletes, setOriginalAssignedAthletes] = useState<string[]>([]); // IDs originales en modo edición
  const [showNoAthletesConfirmDialog, setShowNoAthletesConfirmDialog] = useState(false);

  // Función para formatear fecha ISO a formato input date (YYYY-MM-DD)
  const formatDateForInput = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Ajustar por zona horaria para obtener la fecha correcta
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Cargar atletas asignados cuando se abre en modo edición
  const loadAssignedAthletes = async (planningId: number) => {
    setIsLoadingAssignedAthletes(true);
    try {
      const assignedAthletesData = await PlanningService.getAssignedAthletes(planningId);
      
      // Mapear IDs de atletas asignados
      const assignedIds = assignedAthletesData.map(a => a.athleteId.toString());
      setSelectedAthletes(assignedIds);
      setOriginalAssignedAthletes(assignedIds); // Guardar IDs originales para comparar después

      // Determinar si es individual o grupal basándose en los atletas asignados
      // Si hay atletas asignados, asumimos que es individual (por defecto)
      if (assignedIds.length > 0) {
        setFormData(prev => ({ ...prev, assignmentType: 'individual' }));
      }
    } catch (error) {
      console.error('Error al cargar atletas asignados:', error);
    } finally {
      setIsLoadingAssignedAthletes(false);
    }
  };

  // Sincronizar atletas asignados: remover los que ya no están y agregar los nuevos
  const syncAthletes = async (planningId: number, newAthleteIds: string[]) => {
    const newIds = new Set(newAthleteIds);
    const originalIds = new Set(originalAssignedAthletes);

    // Atletas a remover: están en original pero no en nuevo
    const toRemove = originalAssignedAthletes.filter(id => !newIds.has(id));
    
    // Atletas a agregar: están en nuevo pero no en original
    const toAdd = newAthleteIds.filter(id => !originalIds.has(id));

    let removedCount = 0;
    let addedCount = 0;
    const errors: string[] = [];

    // Remover atletas que ya no están seleccionados
    for (const athleteId of toRemove) {
      try {
        // Llamar directamente al API para evitar toasts individuales
        await apiClient.delete(`/api/Planning/${planningId}/athletes/${athleteId}`);
        removedCount++;
      } catch (error) {
        console.error(`Error al remover atleta ${athleteId}:`, error);
        errors.push(`Error al remover atleta ${athleteId}`);
      }
    }

    // Agregar nuevos atletas (solo si hay alguno)
    if (toAdd.length > 0) {
      try {
        // Llamar directamente al API para evitar toasts individuales
        await apiClient.post(`/api/Planning/${planningId}/athletes`, {
          athleteIds: toAdd.map(id => Number(id))
        });
        addedCount = toAdd.length;
      } catch (error) {
        console.error('Error al agregar atletas:', error);
        errors.push('Error al agregar atletas');
        throw error; // Lanzar error si falla la asignación
      }
    }

    // Mostrar mensaje consolidado
    if (removedCount > 0 || addedCount > 0) {
      const messages: string[] = [];
      if (addedCount > 0) {
        messages.push(`${addedCount} atleta${addedCount !== 1 ? 's' : ''} agregado${addedCount !== 1 ? 's' : ''}`);
      }
      if (removedCount > 0) {
        messages.push(`${removedCount} atleta${removedCount !== 1 ? 's' : ''} removido${removedCount !== 1 ? 's' : ''}`);
      }
      
      if (errors.length === 0) {
        toast.success('Atletas actualizados exitosamente', {
          description: messages.join(', ') + '.'
        });
      } else {
        toast.warning('Atletas actualizados con algunos errores', {
          description: messages.join(', ') + '. ' + errors.join(', ')
        });
      }
    } else if (newAthleteIds.length === 0 && originalAssignedAthletes.length === 0) {
      // No había atletas antes ni ahora, no mostrar mensaje
    }
  };

  // Cargar datos cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && editingPlanning) {
      // Precargar datos de la planificación
      setFormData({
        name: editingPlanning.name,
        description: editingPlanning.description || '',
        startDate: formatDateForInput(editingPlanning.startDate),
        endDate: editingPlanning.endDate ? formatDateForInput(editingPlanning.endDate) : '',
        hasEndDate: !!editingPlanning.endDate,
        assignmentType: 'individual', // Por defecto individual, se determinará después
        status: editingPlanning.status
      });

      // Cargar atletas asignados desde el backend
      loadAssignedAthletes(Number(editingPlanning.id));
    } else if (isOpen && !editingPlanning) {
      // Resetear formulario en modo creación
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        hasEndDate: false,
        assignmentType: 'individual',
        status: 'draft'
      });
      setSelectedAthletes([]);
      setSelectedGroups([]);
      setSelectedGroup('all');
      setOriginalAssignedAthletes([]);
    }
  }, [isOpen, editingPlanning]);


  const filteredAthletes = selectedGroup === 'all' 
    ? athletes 
    : athletes.filter(athlete => athlete.groupId.toString() === selectedGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    // En modo creación, NO es obligatorio tener atletas asignados (se pueden asignar después)
    // La validación de atletas se ha removido para permitir planificaciones sin atletas

    // Si no hay atletas ni grupos seleccionados y estamos creando (no editando), mostrar modal de confirmación
    if (!editingPlanning && selectedAthletes.length === 0 && selectedGroups.length === 0) {
      setShowNoAthletesConfirmDialog(true);
      return;
    }

    // Si hay atletas/grupos o estamos editando, proceder directamente
    await submitPlanning();
  };

  const submitPlanning = async () => {
    setIsSubmitting(true);

    try {
      // Validar que la fecha de inicio no sea anterior al día de hoy
      if (formData.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(`${formData.startDate}T00:00:00Z`);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          toast.error('La fecha de inicio no puede ser anterior al día de hoy');
          setIsSubmitting(false);
          return;
        }
      }

      // Preparar fechas en formato ISO
      const startDateUtc = formData.startDate 
        ? new Date(`${formData.startDate}T00:00:00Z`).toISOString()
        : new Date().toISOString();
      
      const endDateUtc = formData.hasEndDate && formData.endDate
        ? new Date(`${formData.endDate}T00:00:00Z`).toISOString()
        : null;

      if (editingPlanning) {
        // Modo edición: actualizar planificación
        const updateDto: UpdatePlanningDto = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          startDate: startDateUtc,
          endDate: endDateUtc,
          status: formData.status
        };

        await PlanningService.updatePlanning(Number(editingPlanning.id), updateDto);

        // Sincronizar atletas asignados (solo si hay cambios)
        // Permitir guardar sin atletas asignados (puede ser una lista vacía)
        const currentSelectedIds = formData.assignmentType === 'individual' 
          ? selectedAthletes 
          : [];

        // Si hay diferencias, sincronizar
        const currentSet = new Set(currentSelectedIds);
        const originalSet = new Set(originalAssignedAthletes);
        const hasChanges = currentSelectedIds.length !== originalAssignedAthletes.length ||
          !currentSelectedIds.every(id => originalSet.has(id)) ||
          !originalAssignedAthletes.every(id => currentSet.has(id));

        if (hasChanges) {
          await syncAthletes(Number(editingPlanning.id), currentSelectedIds);
        }
      } else {
        // Modo creación: crear nueva planificación
        const athleteIds = formData.assignmentType === 'individual' 
          ? selectedAthletes.map(id => Number(id))
          : undefined;

        const groupIds = formData.assignmentType === 'group'
          ? selectedGroups.map(id => Number(id))
          : undefined;

        const createDto: CreatePlanningDto = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          startDate: startDateUtc,
          endDate: endDateUtc,
          status: formData.status,
          athleteIds: athleteIds,
          groupIds: groupIds
        };

        await PlanningService.createPlanning(createDto);
        setShowNoAthletesConfirmDialog(false);
      }

      // Si hay un callback, llamarlo
      if (onSubmit) {
        onSubmit();
      }

      // Resetear el formulario y cerrar el modal
      handleReset();
      onClose();
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient y el servicio
      console.error(`Error al ${editingPlanning ? 'actualizar' : 'crear'} planificación:`, error);
      // No resetear el formulario si hay error, para que el usuario pueda corregir
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      hasEndDate: false,
      assignmentType: 'individual',
      status: 'draft'
    });
    setSelectedAthletes([]);
    setSelectedGroups([]);
    setSelectedGroup('all');
    setOriginalAssignedAthletes([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAthleteToggle = (athleteId: string | number) => {
    const athleteIdStr = athleteId.toString();
    setSelectedAthletes(prev => 
      prev.includes(athleteIdStr)
        ? prev.filter(id => id !== athleteIdStr)
        : [...prev, athleteIdStr]
    );
  };

  const handleGroupToggle = (groupId: string | number) => {
    const groupIdStr = groupId.toString();
    setSelectedGroups(prev => 
      prev.includes(groupIdStr)
        ? prev.filter(id => id !== groupIdStr)
        : [...prev, groupIdStr]
    );
  };

  const handleSelectAllInGroup = () => {
    const athleteIds = filteredAthletes.map(a => a.id.toString());
    const allSelected = athleteIds.every(id => selectedAthletes.includes(id));
    
    if (allSelected) {
      // Deseleccionar todos del grupo actual
      setSelectedAthletes(prev => prev.filter(id => !athleteIds.includes(id)));
    } else {
      // Seleccionar todos del grupo actual
      setSelectedAthletes(prev => [...new Set([...prev, ...athleteIds])]);
    }
  };

  const getSelectedAthletesInGroup = () => {
    const athleteIds = filteredAthletes.map(a => a.id.toString());
    return selectedAthletes.filter(id => athleteIds.includes(id)).length;
  };

  const getSelectedAssignments = () => {
    if (formData.assignmentType === 'individual') {
      return athletes.filter(a => selectedAthletes.includes(a.id.toString()));
    } else {
      return groups.filter(g => selectedGroups.includes(g.id.toString()));
    }
  };

  const getTotalAthletes = () => {
    if (formData.assignmentType === 'individual') {
      return selectedAthletes.length;
    } else {
      return selectedGroups.reduce((total, groupId) => {
        const group = groups.find(g => g.id === groupId);
        return total + (group?.athleteCount || 0);
      }, 0);
    }
  };

  const handleAssignmentTypeChange = (value: 'individual' | 'group') => {
    // En modo edición, no permitir cambiar el tipo de asignación
    if (editingPlanning) {
      return;
    }
    setFormData(prev => ({ ...prev, assignmentType: value }));
    // Limpiar selecciones al cambiar tipo
    setSelectedAthletes([]);
    setSelectedGroups([]);
  };

  const isFormValid = formData.name.trim() && formData.startDate && 
    (!formData.hasEndDate || formData.endDate);
    // No validar que haya atletas seleccionados - se puede guardar sin atletas

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {editingPlanning ? (
              <>
                <Edit className="w-5 h-5 mr-2" />
                Editar Planificación
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Nueva Planificación
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingPlanning 
              ? 'Modifica la información de la planificación de entrenamiento'
              : 'Crea una nueva planificación de entrenamiento, selecciona atletas individuales o sedes completas'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la planificación *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Preparación Temporada 2024"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe los objetivos y características de esta planificación..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="space-y-4">
                <h4 className="font-medium">Período de Planificación</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de inicio *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      La fecha de inicio no puede ser anterior al día de hoy
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasEndDate"
                        checked={formData.hasEndDate}
                        onCheckedChange={(checked: boolean) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            hasEndDate: !!checked,
                            endDate: checked ? prev.endDate : ''
                          }))
                        }
                      />
                      <Label htmlFor="hasEndDate">Definir fecha de fin</Label>
                    </div>
                    
                    {formData.hasEndDate && (
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        min={formData.startDate}
                      />
                    )}
                    
                    {!formData.hasEndDate && (
                      <p className="text-sm text-muted-foreground">
                        La planificación se extenderá indefinidamente
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado inicial */}
              <div className="space-y-2">
                <Label htmlFor="status">{editingPlanning ? 'Estado' : 'Estado inicial'}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'completed' | 'draft') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    {editingPlanning && <SelectItem value="completed">Completada</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de asignación - Solo en modo creación */}
              {!editingPlanning && (
                <div className="space-y-4">
                  <h4 className="font-medium">Tipo de Planificación</h4>
                  <RadioGroup 
                    value={formData.assignmentType} 
                    onValueChange={handleAssignmentTypeChange}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="individual"
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value="individual" id="individual" />
                      <div className="flex-1">
                        <div className="font-medium flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Planificación Individual
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Selecciona atletas específicos para esta planificación
                        </p>
                      </div>
                    </Label>
                    
                    <Label
                      htmlFor="group"
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value="group" id="group" />
                      <div className="flex-1">
                        <div className="font-medium flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Planificación Grupal
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Selecciona sedes completas para esta planificación
                        </p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>
              )}

              {/* Selección de atletas en modo edición - permite modificar */}
              {editingPlanning && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Atletas Participantes
                    </h4>
                    <Badge variant="outline">
                      {selectedAthletes.length} seleccionados
                    </Badge>
                  </div>

                  {/* Filtro por grupo */}
                  <div className="space-y-2">
                    <Label>Filtrar por sede</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las sedes</SelectItem>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name} ({group.athleteCount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSelectAllInGroup}
                        className="whitespace-nowrap"
                      >
                        {getSelectedAthletesInGroup() === filteredAthletes.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                      </Button>
                    </div>
                  </div>

                  {/* Lista de atletas */}
                  <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                    {isLoadingAssignedAthletes ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Cargando atletas...</span>
                      </div>
                    ) : filteredAthletes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {selectedGroup === 'all' 
                          ? 'No hay atletas asignados al entrenador'
                          : 'No hay atletas en la sede seleccionada'}
                      </p>
                    ) : (
                      filteredAthletes.map(athlete => (
                        <div key={athlete.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`athlete-edit-${athlete.id}`}
                            checked={selectedAthletes.includes(athlete.id.toString())}
                            onCheckedChange={() => handleAthleteToggle(athlete.id)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`athlete-edit-${athlete.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {athlete.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {athlete.groupName || 'Sin grupo'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Resumen de selecciones */}
                  {selectedAthletes.length > 0 && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          Atletas seleccionados:
                        </p>
                        <Badge variant="secondary">
                          {selectedAthletes.length} atleta{selectedAthletes.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {athletes
                          .filter(a => selectedAthletes.includes(a.id.toString()))
                          .map(item => (
                            <Badge key={item.id} variant="secondary" className="text-xs">
                              {item.name}
                              <button
                                type="button"
                                onClick={() => handleAthleteToggle(item.id)}
                                className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {selectedAthletes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No hay atletas seleccionados. La planificación se puede guardar sin atletas asignados.
                    </p>
                  )}
                </div>
              )}

              {/* Selección de atletas individuales - Solo en modo creación */}
              {!editingPlanning && formData.assignmentType === 'individual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Atletas Participantes
                    </h4>
                    <Badge variant="outline">
                      {selectedAthletes.length} seleccionados
                    </Badge>
                  </div>

                  {/* Filtro por grupo */}
                  <div className="space-y-2">
                    <Label>Filtrar por sede</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las sedes</SelectItem>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name} ({group.athleteCount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSelectAllInGroup}
                        className="whitespace-nowrap"
                      >
                        {getSelectedAthletesInGroup() === filteredAthletes.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                      </Button>
                    </div>
                  </div>

                  {/* Lista de atletas */}
                  <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Cargando atletas...</span>
                      </div>
                    ) : filteredAthletes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {selectedGroup === 'all' 
                          ? 'No hay atletas asignados al entrenador'
                          : 'No hay atletas en la sede seleccionada'}
                      </p>
                    ) : (
                      filteredAthletes.map(athlete => (
                        <div key={athlete.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`athlete-${athlete.id}`}
                            checked={selectedAthletes.includes(athlete.id.toString())}
                            onCheckedChange={() => handleAthleteToggle(athlete.id)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`athlete-${athlete.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {athlete.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {athlete.groupName || 'Sin grupo'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Selección de sedes - Solo en modo creación */}
              {!editingPlanning && formData.assignmentType === 'group' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Sedes Participantes
                    </h4>
                    <Badge variant="outline">
                      {selectedGroups.length} seleccionadas
                    </Badge>
                  </div>

                  {/* Lista de sedes */}
                  <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Cargando sedes...</span>
                      </div>
                    ) : groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay sedes disponibles
                      </p>
                    ) : (
                      groups.map(group => (
                        <div key={group.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedGroups.includes(group.id.toString())}
                            onCheckedChange={() => handleGroupToggle(group.id)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`group-${group.id}`}
                              className="text-sm cursor-pointer font-medium"
                            >
                              {group.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {group.athleteCount} atletas
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Resumen de selecciones - Solo en modo creación */}
              {!editingPlanning && (selectedAthletes.length > 0 || selectedGroups.length > 0) && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {formData.assignmentType === 'individual' ? 'Atletas seleccionados' : 'Sedes seleccionadas'}:
                    </p>
                    <Badge variant="secondary">
                      {getTotalAthletes()} atletas total
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedAssignments().map(item => (
                      <Badge key={item.id} variant="secondary" className="text-xs">
                        {item.name}
                        {formData.assignmentType === 'group' && ` (${(item as TrainingGroup).athleteCount})`}
                        <button
                          type="button"
                          onClick={() => 
                            formData.assignmentType === 'individual' 
                              ? handleAthleteToggle(item.id)
                              : handleGroupToggle(item.id)
                          }
                          className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting || isLoading || (editingPlanning && isLoadingAssignedAthletes)}
            className="bg-accent hover:bg-accent/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingPlanning ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingPlanning ? 'Guardar Cambios' : 'Crear Planificación'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de confirmación para crear sin atletas */}
    <AlertDialog open={showNoAthletesConfirmDialog} onOpenChange={setShowNoAthletesConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Crear planificación sin atletas asignados</AlertDialogTitle>
          <AlertDialogDescription>
            Estás por crear una planificación sin atletas ni grupos asignados. 
            Podrás asignar atletas y grupos a esta planificación más adelante.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={submitPlanning} disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Continuar sin asignar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}