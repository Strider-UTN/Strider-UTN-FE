import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { Calendar, Users, Settings, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { PlanningCalendar } from './PlanningCalendar';
import { PlanningConfigurationModal } from './PlanningConfigurationModal';
import { MacrocycleView } from './MacrocycleView';
import { MicrocycleView } from './MicrocycleView';
import { Mesocycle, Microcycle } from './types/microcycleTypes';
import { PlanningService } from '../services/planningService';
import { GroupService } from '../services/groupService';
import { CoachAthleteRelationshipService } from '../services/coachAthleteRelationshipService';
import { TrainingSessionService, TrainingSessionResponseDto } from '../services/trainingSessionService';
import { toast } from 'sonner';

interface Planning {
  id: string;
  name: string;
  description?: string; // Opcional para coincidir con el backend
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string; // Opcional para coincidir con el backend
  athletes: string[];
  groups?: string[]; // Opcional para compatibilidad
  assignmentType?: 'individual' | 'group'; // Opcional para compatibilidad
  status: 'active' | 'completed' | 'draft';
  periodsCount: number;
  groupsCount: number;
}

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface PlanningViewProps {
  planning: Planning;
  athletes: Athlete[];
  onBack: () => void;
  onUpdate: (updatedPlanning: Planning) => void;
}



export function PlanningView({ planning, athletes, onBack, onUpdate }: PlanningViewProps) {
  const [activeTab, setActiveTab] = useState('macrocycle');
  const [isConfigurationModalOpen, setIsConfigurationModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'microcycle' | 'weekly-calendar'>('main');
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<Microcycle | null>(null);
  const [selectedMesocycle, setSelectedMesocycle] = useState<Mesocycle | null>(null);
  const [calendarMesocycleFilter, setCalendarMesocycleFilter] = useState<{ id: string; name: string; startWeek?: number; endWeek?: number; startDate?: string; endDate?: string } | null>(null);
  const [calendarMicrocycleFilter, setCalendarMicrocycleFilter] = useState<{ id: string; name: string; startDate: string; endDate: string } | null>(null);
  const [isNavigatingFromMesocycle, setIsNavigatingFromMesocycle] = useState(false);
  const [isNavigatingFromMicrocycle, setIsNavigatingFromMicrocycle] = useState(false);
  const [assignedAthletes, setAssignedAthletes] = useState<Athlete[]>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);
  const [isAddAthletesModalOpen, setIsAddAthletesModalOpen] = useState(false);
  const [availableAthletes, setAvailableAthletes] = useState<Athlete[]>([]);
  const [selectedAthletesToAdd, setSelectedAthletesToAdd] = useState<string[]>([]);
  const [isLoadingAvailableAthletes, setIsLoadingAvailableAthletes] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isRemovingAthlete, setIsRemovingAthlete] = useState<string | null>(null);
  const [athleteToRemove, setAthleteToRemove] = useState<{ id: string; name: string } | null>(null);
  const [planningSessions, setPlanningSessions] = useState<TrainingSessionResponseDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Cargar atletas asignados desde el backend
  const loadAssignedAthletes = useCallback(async () => {
    setIsLoadingAthletes(true);
    try {
      // Obtener los atletas asignados directamente desde el backend
      const assignedAthletesData = await PlanningService.getAssignedAthletes(Number(planning.id));
      
      // Obtener grupos para mapear la información de grupo de cada atleta
      const groupsData = await GroupService.getAllGroups();
      
      // Crear mapa de atletas a grupos
      const athleteGroupMap = new Map<number, { groupId: string; groupName: string }>();
      
      // Cargar miembros de cada grupo para mapear atletas a grupos
      const groupMembersPromises = groupsData.map(async (group) => {
        try {
          const members = await GroupService.getGroupMembers(group.id.toString());
          members
            .filter(m => m.status === 'active')
            .forEach(member => {
              athleteGroupMap.set(member.userId, {
                groupId: group.id.toString(),
                groupName: group.name
              });
            });
        } catch (error) {
          console.error(`Error al obtener miembros del grupo ${group.id}:`, error);
        }
      });
      await Promise.all(groupMembersPromises);
      
      // Mapear los atletas asignados con información de grupo
      const assigned = assignedAthletesData.map(athleteData => {
        const groupInfo = athleteGroupMap.get(athleteData.athleteId);
        return {
          id: athleteData.athleteId.toString(),
          name: athleteData.athleteName,
          groupId: groupInfo?.groupId || '',
          groupName: groupInfo?.groupName || 'Sin grupo'
        };
      });
      
      setAssignedAthletes(assigned);
    } catch (error) {
      console.error('Error al cargar atletas asignados:', error);
      setAssignedAthletes([]);
    } finally {
      setIsLoadingAthletes(false);
    }
  }, [planning.id]);

  // Cargar atletas cuando se monta el componente o cambia el planning.id
  useEffect(() => {
    loadAssignedAthletes();
  }, [loadAssignedAthletes]);

  // Cargar atletas disponibles para agregar
  const loadAvailableAthletes = useCallback(async () => {
    setIsLoadingAvailableAthletes(true);
    try {
      // Obtener atletas del entrenador
      const athletesData = await CoachAthleteRelationshipService.getMyAthletes('Accepted');
      
      // Obtener grupos para mapear la información de grupo
      const groupsData = await GroupService.getAllGroups();
      
      // Crear mapa de atletas a grupos
      const athleteGroupMap = new Map<number, { groupId: string; groupName: string }>();
      
      // Cargar miembros de cada grupo
      const groupMembersPromises = groupsData.map(async (group) => {
        try {
          const members = await GroupService.getGroupMembers(group.id.toString());
          members
            .filter(m => m.status === 'active')
            .forEach(member => {
              athleteGroupMap.set(member.userId, {
                groupId: group.id.toString(),
                groupName: group.name
              });
            });
        } catch (error) {
          console.error(`Error al obtener miembros del grupo ${group.id}:`, error);
        }
      });
      await Promise.all(groupMembersPromises);
      
      // Mapear atletas con información de grupo
      const mapped = athletesData.map(athlete => {
        const groupInfo = athleteGroupMap.get(athlete.id);
        return {
          id: athlete.id.toString(),
          name: athlete.name,
          groupId: groupInfo?.groupId || '',
          groupName: groupInfo?.groupName || 'Sin grupo'
        };
      });
      
      // Filtrar atletas que ya están asignados
      const assignedIds = new Set(assignedAthletes.map(a => a.id));
      const available = mapped.filter(athlete => !assignedIds.has(athlete.id));
      
      setAvailableAthletes(available);
    } catch (error) {
      console.error('Error al cargar atletas disponibles:', error);
      setAvailableAthletes([]);
    } finally {
      setIsLoadingAvailableAthletes(false);
    }
  }, [assignedAthletes]);

  // Cargar atletas disponibles cuando se abre el modal
  useEffect(() => {
    if (isAddAthletesModalOpen) {
      loadAvailableAthletes();
      setSelectedAthletesToAdd([]);
      setSelectedGroupFilter('all');
    }
  }, [isAddAthletesModalOpen, loadAvailableAthletes]);

  // Abrir modal de confirmación para eliminar atleta
  const handleRemoveAthleteClick = (athleteId: string, athleteName: string) => {
    setAthleteToRemove({ id: athleteId, name: athleteName });
  };

  // Eliminar atleta de la planificación (confirmado)
  const handleConfirmRemoveAthlete = async () => {
    if (!athleteToRemove) return;

    const athleteId = athleteToRemove.id;
    setIsRemovingAthlete(athleteId);
    setAthleteToRemove(null); // Cerrar el modal

    try {
      await PlanningService.removeAthlete(Number(planning.id), Number(athleteId));
      // Recargar lista de atletas asignados
      await loadAssignedAthletes();
      // El servicio PlanningService.removeAthlete ya muestra un toast de éxito
    } catch (error) {
      console.error('Error al eliminar atleta:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setIsRemovingAthlete(null);
    }
  };

  // Agregar atletas a la planificación
  const handleAddAthletes = async () => {
    if (selectedAthletesToAdd.length === 0) {
      toast.error('Por favor selecciona al menos un atleta');
      return;
    }

    try {
      const athleteIds = selectedAthletesToAdd.map(id => Number(id));
      await PlanningService.assignAthletes(Number(planning.id), athleteIds);
      // Recargar lista de atletas asignados (esto actualizará también los disponibles)
      await loadAssignedAthletes();
      // Cerrar modal y limpiar selección
      setIsAddAthletesModalOpen(false);
      setSelectedAthletesToAdd([]);
      // El servicio PlanningService.assignAthletes ya muestra un toast de éxito
    } catch (error) {
      console.error('Error al agregar atletas:', error);
      // El error ya fue manejado por el servicio
    }
  };

  // Toggle selección de atleta
  const handleToggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletesToAdd(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  // Filtrar atletas disponibles por grupo
  const filteredAvailableAthletes = selectedGroupFilter === 'all'
    ? availableAthletes
    : availableAthletes.filter(athlete => athlete.groupId === selectedGroupFilter);

  // Obtener grupos únicos de los atletas disponibles
  const availableGroups = Array.from(
    new Map(
      availableAthletes
        .filter(a => a.groupId)
        .map(a => [a.groupId, { id: a.groupId, name: a.groupName }])
    ).values()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const toLocalDateOnly = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.includes('T') ? value.split('T')[0] : value;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const planningStartDateLocal = useMemo(() => toLocalDateOnly(planning?.startDate) ?? undefined, [planning?.startDate]);
  const planningEndDateLocal = useMemo(() => toLocalDateOnly(planning?.endDate ?? undefined) ?? undefined, [planning?.endDate]);

  const loadPlanningSessions = useCallback(async () => {
    if (!planning?.id) return;
    setIsLoadingSessions(true);
    try {
      const sessions = await TrainingSessionService.getTrainingSessionsByPlanningId(Number(planning.id));
      setPlanningSessions(sessions);
    } catch (error) {
      console.error('Error al cargar las sesiones de la planificación:', error);
      setPlanningSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [planning?.id]);

  useEffect(() => {
    loadPlanningSessions();
  }, [loadPlanningSessions]);

  const handleSessionsSynced = useCallback((sessions: TrainingSessionResponseDto[]) => {
    setPlanningSessions(sessions);
    setIsLoadingSessions(false);
  }, []);

  const handleViewWeeklyPlanning = (microcycle: Microcycle, mesocycle: Mesocycle) => {
    setSelectedMicrocycle(microcycle);
    setSelectedMesocycle(mesocycle);
    setCurrentView('microcycle');
  };

  const handleViewWeeklyCalendar = (microcycle: Microcycle, mesocycle: Mesocycle) => {
    setSelectedMicrocycle(microcycle);
    setSelectedMesocycle(mesocycle);
    setCurrentView('weekly-calendar');
  };

  const handleViewMesocycleCalendar = (mesocycle: Mesocycle) => {
    // Navegar a la pestaña de calendario y establecer el filtro del mesociclo
    setIsNavigatingFromMesocycle(true);
    setCalendarMicrocycleFilter(null); // Limpiar filtro de microciclo si existe
    setActiveTab('calendar');
    setCalendarMesocycleFilter({
      id: mesocycle.id,
      name: mesocycle.name,
      startWeek: mesocycle.startWeek,
      endWeek: mesocycle.endWeek,
      startDate: mesocycle.startDate, // Usar fechas reales si están disponibles
      endDate: mesocycle.endDate
    });
    // Resetear el flag después de un breve delay para permitir que el cambio de pestaña se complete
    setTimeout(() => setIsNavigatingFromMesocycle(false), 100);
  };

  const handleViewMicrocycleCalendar = (microcycle: Microcycle) => {
    // Navegar a la pestaña de calendario y establecer el filtro del microciclo
    setIsNavigatingFromMicrocycle(true);
    setCalendarMesocycleFilter(null); // Limpiar filtro de mesociclo si existe
    setActiveTab('calendar');
    
    // Asegurar que las fechas estén en formato ISO
    const startDate = microcycle.startDate.includes('T') 
      ? microcycle.startDate 
      : `${microcycle.startDate}T00:00:00Z`;
    const endDate = microcycle.endDate.includes('T') 
      ? microcycle.endDate 
      : `${microcycle.endDate}T23:59:59Z`;
    
    setCalendarMicrocycleFilter({
      id: microcycle.id,
      name: microcycle.name || `Semana ${microcycle.weekNumber}`,
      startDate: startDate,
      endDate: endDate
    });
    // Resetear el flag después de un breve delay para permitir que el cambio de pestaña se complete
    setTimeout(() => setIsNavigatingFromMicrocycle(false), 100);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedMicrocycle(null);
    setSelectedMesocycle(null);
  };

  // Si estamos en la vista de microciclo, mostrar MicrocycleView
  if (currentView === 'microcycle' && selectedMicrocycle && selectedMesocycle) {
    return (
      <MicrocycleView
        mesocycle={selectedMesocycle}
        athletes={assignedAthletes}
        onBack={handleBackToMain}
        onCreateSession={(session) => {
          console.log('Nueva sesión creada:', session);
        }}
        onEditMicrocycle={(microcycle) => {
          console.log('Editar microciclo:', microcycle);
        }}
        onDeleteMicrocycle={(microcycleId) => {
          console.log('Eliminar microciclo:', microcycleId);
        }}
        onViewCalendar={(microcycle) => {
          console.log('Ver calendario:', microcycle);
        }}
      />
    );
  }

  // Si estamos en la vista de calendario semanal, mostrar PlanningCalendar
  if (currentView === 'weekly-calendar' && selectedMicrocycle && selectedMesocycle) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToMain}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Macrociclo
          </Button>
          <div>
            <h2 className="text-xl font-semibold">
              Calendario - Semana {selectedMicrocycle.weekNumber}
            </h2>
            <p className="text-muted-foreground">
              {selectedMesocycle.name} • {formatDate(selectedMicrocycle.startDate)} - {formatDate(selectedMicrocycle.endDate)}
            </p>
          </div>
        </div>
        
        <PlanningCalendar
          planningId={planning.id}
          userType="coach"
          athletes={assignedAthletes}
          onSessionCreate={(session) => {
            console.log('Nueva sesión creada:', session);
            // Aquí puedes manejar la creación de la sesión
          }}
        />
      </div>
    );
  }

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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-primary">{planning.name}</h1>
              <Badge className={getStatusColor(planning.status)}>
                {getStatusText(planning.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {planning.description}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>
                Inicio: {formatDate(planning.startDate)}
              </span>
              {planning.endDate && (
                <span>
                  Fin: {formatDate(planning.endDate)}
                </span>
              )}
              <span>
                {isLoadingAthletes ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Cargando...
                  </span>
                ) : (
                  `${assignedAthletes.length} atletas asignados`
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsConfigurationModalOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>



      {/* Tabs para diferentes vistas */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // Limpiar los filtros cuando se accede directamente a la pestaña de calendario
          // (no cuando viene desde un mesociclo o microciclo)
          if (value === 'calendar' && !isNavigatingFromMesocycle && !isNavigatingFromMicrocycle) {
            setCalendarMesocycleFilter(null);
            setCalendarMicrocycleFilter(null);
          }
        }} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger 
            value="macrocycle" 
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors duration-200"
          >
            <Calendar className="w-4 h-4" />
            Macrociclo
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors duration-200"
          >
            <Calendar className="w-4 h-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger 
            value="athletes" 
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors duration-200"
          >
            <Users className="w-4 h-4" />
            Atletas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="macrocycle" className="space-y-4">
          <MacrocycleView 
            planningId={planning.id}
            year={(planningStartDateLocal ? new Date(planningStartDateLocal) : new Date(planning.startDate)).getFullYear()}
            planningStartDate={planningStartDateLocal ?? planning.startDate}
            planningEndDate={planningEndDateLocal ?? planning.endDate}
            athletes={assignedAthletes}
            trainingSessions={planningSessions}
            isLoadingSessions={isLoadingSessions}
            onViewWeeklyPlanning={handleViewWeeklyPlanning}
            onViewWeeklyCalendar={handleViewWeeklyCalendar}
            onViewMesocycleCalendar={handleViewMesocycleCalendar}
            onViewMicrocycleCalendar={handleViewMicrocycleCalendar}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Calendario de Entrenamiento
              </CardTitle>
              <CardDescription>
                Programa y gestiona sesiones de entrenamiento para esta planificación
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PlanningCalendar
                planningId={planning.id}
                userType="coach"
                year={calendarMicrocycleFilter 
                  ? new Date(calendarMicrocycleFilter.startDate).getFullYear()
                  : calendarMesocycleFilter && calendarMesocycleFilter.startDate
                    ? new Date(calendarMesocycleFilter.startDate).getFullYear()
                    : (planningStartDateLocal ? new Date(planningStartDateLocal).getFullYear() : new Date(planning.startDate).getFullYear())}
                athletes={assignedAthletes}
                mesocycleFilter={calendarMesocycleFilter || undefined}
                microcycleFilter={calendarMicrocycleFilter || undefined}
                planningStartDate={planningStartDateLocal ?? planning.startDate}
                planningEndDate={(planningEndDateLocal ?? planning.endDate) || null}
                onSessionsSync={handleSessionsSynced}
                onSessionCreate={(session) => {
                  console.log('Nueva sesión creada:', session);
                  // Aquí puedes manejar la creación de la sesión
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Atletas Asignados
                  </CardTitle>
                  <CardDescription>
                    Atletas que participan en esta planificación
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddAthletesModalOpen(true)}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Atletas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAthletes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-3" />
                  <span className="text-muted-foreground">Cargando atletas asignados...</span>
                </div>
              ) : assignedAthletes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedAthletes.map(athlete => (
                    <Card key={athlete.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{athlete.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {athlete.groupName}
                          </p>
                          {athlete.vo2max && (
                            <p className="text-sm text-muted-foreground">
                              VO₂ Max: {athlete.vo2max} ml/kg/min
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAthleteClick(athlete.id, athlete.name)}
                          disabled={isRemovingAthlete === athlete.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {isRemovingAthlete === athlete.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No hay atletas asignados</h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega atletas a esta planificación para comenzar
                  </p>
                  <Button
                    onClick={() => setIsAddAthletesModalOpen(true)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Atleta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Modal de Configuración */}
      <PlanningConfigurationModal
        isOpen={isConfigurationModalOpen}
        onClose={() => setIsConfigurationModalOpen(false)}
      />

      {/* Modal para Agregar Atletas */}
      <Dialog open={isAddAthletesModalOpen} onOpenChange={setIsAddAthletesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar Atletas a la Planificación</DialogTitle>
            <DialogDescription>
              Selecciona los atletas que deseas agregar a esta planificación
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Filtro por grupo */}
            {availableGroups.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrar por sede:</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedGroupFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGroupFilter('all')}
                  >
                    Todos
                  </Button>
                  {availableGroups.map(group => (
                    <Button
                      key={group.id}
                      variant={selectedGroupFilter === group.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedGroupFilter(group.id)}
                    >
                      {group.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de atletas disponibles */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Atletas disponibles ({selectedAthletesToAdd.length} seleccionado{selectedAthletesToAdd.length !== 1 ? 's' : ''})
              </label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-2">
                {isLoadingAvailableAthletes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Cargando atletas...</span>
                  </div>
                ) : filteredAvailableAthletes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {selectedGroupFilter === 'all'
                      ? 'No hay atletas disponibles para agregar'
                      : 'No hay atletas en la sede seleccionada'}
                  </p>
                ) : (
                  filteredAvailableAthletes.map(athlete => (
                    <div key={athlete.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id={`add-athlete-${athlete.id}`}
                        checked={selectedAthletesToAdd.includes(athlete.id)}
                        onCheckedChange={() => handleToggleAthleteSelection(athlete.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`add-athlete-${athlete.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {athlete.name}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {athlete.groupName}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddAthletesModalOpen(false);
                setSelectedAthletesToAdd([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddAthletes}
              disabled={selectedAthletesToAdd.length === 0 || isLoadingAvailableAthletes}
            >
              Agregar {selectedAthletesToAdd.length > 0 ? `(${selectedAthletesToAdd.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Eliminar Atleta */}
      <AlertDialog open={athleteToRemove !== null} onOpenChange={(open) => !open && setAthleteToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que quiere eliminar al atleta <strong>{athleteToRemove?.name}</strong> de la planificación <strong>{planning.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAthleteToRemove(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveAthlete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}