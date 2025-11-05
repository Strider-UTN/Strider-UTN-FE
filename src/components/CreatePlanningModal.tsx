import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';

import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar, X, Save, Users, User, MapPin, Loader2 } from 'lucide-react';
import { PlanningService } from '../services/planningService';
import type { CreatePlanningDto } from '../types/planningTypes';

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

interface CreatePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void; // Callback opcional que se llama después de crear exitosamente
  athletes?: Athlete[];
  groups?: TrainingGroup[];
  isLoading?: boolean; // Indica si se están cargando los datos
}

export function CreatePlanningModal({ isOpen, onClose, onSubmit, athletes = [], groups = [], isLoading = false }: CreatePlanningModalProps) {
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


  const filteredAthletes = selectedGroup === 'all' 
    ? athletes 
    : athletes.filter(athlete => athlete.groupId.toString() === selectedGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    // Validar que haya selecciones según el tipo
    if (formData.assignmentType === 'individual' && selectedAthletes.length === 0) {
      return;
    }

    if (formData.assignmentType === 'group' && selectedGroups.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convertir IDs de string a number
      const athleteIds = formData.assignmentType === 'individual' 
        ? selectedAthletes.map(id => Number(id))
        : undefined;

      const groupIds = formData.assignmentType === 'group'
        ? selectedGroups.map(id => Number(id))
        : undefined;

      // Preparar el DTO para el backend
      // Convertir fechas a formato ISO con hora UTC (medianoche) para evitar problemas con PostgreSQL
      const startDateUtc = formData.startDate 
        ? new Date(`${formData.startDate}T00:00:00Z`).toISOString()
        : new Date().toISOString(); // Fallback (no debería pasar)
      
      const endDateUtc = formData.hasEndDate && formData.endDate
        ? new Date(`${formData.endDate}T00:00:00Z`).toISOString()
        : null;

      const createDto: CreatePlanningDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: startDateUtc, // ISO string con hora UTC (ej: "2025-11-28T00:00:00.000Z")
        endDate: endDateUtc, // ISO string con hora UTC o null
        status: formData.status,
        athleteIds: athleteIds,
        groupIds: groupIds
      };

      // Crear la planificación en el backend
      await PlanningService.createPlanning(createDto);

      // Si hay un callback, llamarlo
      if (onSubmit) {
        onSubmit();
      }

      // Resetear el formulario y cerrar el modal
      handleReset();
      onClose();
    } catch (error) {
      // El error ya fue manejado por el interceptor de apiClient y el servicio
      console.error('Error al crear planificación:', error);
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
    setFormData(prev => ({ ...prev, assignmentType: value }));
    // Limpiar selecciones al cambiar tipo
    setSelectedAthletes([]);
    setSelectedGroups([]);
  };

  const isFormValid = formData.name.trim() && formData.startDate && 
    (!formData.hasEndDate || formData.endDate) &&
    ((formData.assignmentType === 'individual' && selectedAthletes.length > 0) ||
     (formData.assignmentType === 'group' && selectedGroups.length > 0));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Nueva Planificación
          </DialogTitle>
          <DialogDescription>
            Crea una nueva planificación de entrenamiento, selecciona atletas individuales o sedes completas
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
                      required
                    />
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
                <Label htmlFor="status">Estado inicial</Label>
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
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de asignación */}
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

              {/* Selección de atletas individuales */}
              {formData.assignmentType === 'individual' && (
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

              {/* Selección de sedes */}
              {formData.assignmentType === 'group' && (
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

              {/* Resumen de selecciones */}
              {(selectedAthletes.length > 0 || selectedGroups.length > 0) && (
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
            disabled={!isFormValid || isSubmitting || isLoading}
            className="bg-accent hover:bg-accent/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Planificación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}