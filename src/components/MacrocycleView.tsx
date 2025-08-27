import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Target, TrendingUp, Plus, Activity, Edit, Trash2, ArrowLeft, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CreateMesocycleModal } from './CreateMesocycleModal';
import { EditMicrocycleModal } from './EditMicrocycleModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PlanningCalendar } from './PlanningCalendar';
import { toast } from 'sonner';

interface MacrocycleViewProps {
  planningId: string;
  year: number;
  athletes: Array<{
    id: string;
    name: string;
    groupName: string;
  }>;
}

interface Mesocycle {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  objective: string;
  microcycles: Microcycle[];
  sessions: number;
  totalVolume: number;
  status: 'planning' | 'active' | 'completed';
}

interface Microcycle {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: number;
  volume: number;
  intensity: 'baja' | 'media' | 'alta';
  focus: string;
}

export function MacrocycleView({ planningId, year, athletes }: MacrocycleViewProps) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [isCreateMesocycleModalOpen, setIsCreateMesocycleModalOpen] = useState(false);
  const [editingMesocycle, setEditingMesocycle] = useState<Mesocycle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingMesocycleCalendar, setViewingMesocycleCalendar] = useState<Mesocycle | null>(null);
  const [viewingMicrocycleCalendar, setViewingMicrocycleCalendar] = useState<{microcycle: Microcycle, mesocycle: Mesocycle} | null>(null);
  const [expandedMesocycles, setExpandedMesocycles] = useState<Set<string>>(new Set());
  const [editingMicrocycle, setEditingMicrocycle] = useState<{microcycle: Microcycle, mesocycle: Mesocycle} | null>(null);
  const [deletingMicrocycle, setDeletingMicrocycle] = useState<{microcycle: Microcycle, mesocycle: Mesocycle} | null>(null);

  // Mock data para el macrociclo
  const [macrocycle, setMacrocycle] = useState({
    year: selectedYear,
    totalWeeks: 52,
    mesocycles: [
      {
        id: 'meso_1',
        name: 'Mesociclo 1 - Adaptación General',
        startWeek: 1,
        endWeek: 4,
        objective: 'Adaptación inicial y construcción de base aeróbica',
        sessions: 16,
        totalVolume: 120,
        status: 'active' as const,
        microcycles: []
      },
      {
        id: 'meso_2',
        name: 'Mesociclo 2 - Desarrollo Aeróbico',
        startWeek: 5,
        endWeek: 8,
        objective: 'Desarrollo de capacidades aeróbicas y incremento de volumen',
        sessions: 16,
        totalVolume: 140,
        status: 'planning' as const,
        microcycles: []
      },
      {
        id: 'meso_3',
        name: 'Mesociclo 3 - Velocidad Específica',
        startWeek: 27,
        endWeek: 30,
        objective: 'Desarrollo de velocidad específica y potencia aeróbica',
        sessions: 16,
        totalVolume: 100,
        status: 'planning' as const,
        microcycles: []
      },
      {
        id: 'meso_4',
        name: 'Mesociclo 4 - Competitivo',
        startWeek: 31,
        endWeek: 34,
        objective: 'Preparación específica para competencias principales',
        sessions: 14,
        totalVolume: 85,
        status: 'planning' as const,
        microcycles: []
      }
    ]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'planning': return 'En Planificación';
      default: return 'Desconocido';
    }
  };

  const handleCreateMesocycle = (mesocycleData: Omit<Mesocycle, 'id'>) => {
    const newMesocycle: Mesocycle = {
      ...mesocycleData,
      id: `meso_${Date.now()}`
    };

    setMacrocycle(prev => ({
      ...prev,
      mesocycles: [...prev.mesocycles, newMesocycle].sort((a, b) => a.startWeek - b.startWeek)
    }));

    setIsCreateMesocycleModalOpen(false);
  };

  const handleUpdateMesocycle = (updatedMesocycle: Mesocycle) => {
    setMacrocycle(prev => ({
      ...prev,
      mesocycles: prev.mesocycles.map(meso =>
        meso.id === updatedMesocycle.id ? updatedMesocycle : meso
      )
    }));

    setIsCreateMesocycleModalOpen(false);
    setEditingMesocycle(null);
  };

  const handleDeleteMesocycle = (mesocycleId: string) => {
    setMacrocycle(prev => ({
      ...prev,
      mesocycles: prev.mesocycles.filter(meso => meso.id !== mesocycleId)
    }));

    setDeleteConfirmId(null);
    toast.success('Mesociclo eliminado exitosamente');
  };

  const handleEditMesocycle = (mesocycle: Mesocycle) => {
    setEditingMesocycle(mesocycle);
    setIsCreateMesocycleModalOpen(true);
  };

  const handleViewCalendar = (mesocycle: Mesocycle) => {
    setViewingMesocycleCalendar(mesocycle);
    setIsCreateMesocycleModalOpen(false);
    toast.success(`Navegando al calendario del ${mesocycle.name}`);
  };

  const handleViewMicrocycleCalendar = (microcycle: Microcycle, mesocycle: Mesocycle) => {
    setViewingMicrocycleCalendar({ microcycle, mesocycle });
    toast.success(`Navegando al calendario de la Semana ${microcycle.weekNumber}`);
  };

  const handleEditMicrocycle = (microcycle: Microcycle, mesocycle: Mesocycle) => {
    setEditingMicrocycle({ microcycle, mesocycle });
  };

  const handleSaveMicrocycle = (updatedMicrocycle: Microcycle) => {
    if (!editingMicrocycle) return;

    setMacrocycle(prevData => ({
      ...prevData,
      mesocycles: prevData.mesocycles.map(mesocycle => {
        if (mesocycle.id === editingMicrocycle.mesocycle.id) {
          return {
            ...mesocycle,
            microcycles: mesocycle.microcycles.map(microcycle => 
              microcycle.id === updatedMicrocycle.id 
                ? updatedMicrocycle 
                : microcycle
            )
          };
        }
        return mesocycle;
      })
    }));

    setEditingMicrocycle(null);
  };

  const handleDeleteMicrocycle = () => {
    if (!deletingMicrocycle) return;

    setMacrocycle(prevData => ({
      ...prevData,
      mesocycles: prevData.mesocycles.map(mesocycle => {
        if (mesocycle.id === deletingMicrocycle.mesocycle.id) {
          return {
            ...mesocycle,
            microcycles: mesocycle.microcycles.filter(microcycle => 
              microcycle.id !== deletingMicrocycle.microcycle.id
            )
          };
        }
        return mesocycle;
      })
    }));

    toast.success(`Semana ${deletingMicrocycle.microcycle.weekNumber} eliminada exitosamente`);
    setDeletingMicrocycle(null);
  };

  const handleToggleMicrocycles = (mesocycleId: string) => {
    setExpandedMesocycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mesocycleId)) {
        newSet.delete(mesocycleId);
      } else {
        newSet.add(mesocycleId);
        // Generar microciclos si no existen
        const mesocycle = macrocycle.mesocycles.find(m => m.id === mesocycleId);
        if (mesocycle && mesocycle.microcycles.length === 0) {
          const updatedMesocycles = macrocycle.mesocycles.map(m => 
            m.id === mesocycleId 
              ? { ...m, microcycles: generateMockMicrocycles(m) }
              : m
          );
          setMacrocycle(prev => ({ ...prev, mesocycles: updatedMesocycles }));
        }
      }
      return newSet;
    });
  };

  const generateMockMicrocycles = (mesocycle: Mesocycle): Microcycle[] => {
    const weekCount = mesocycle.endWeek - mesocycle.startWeek + 1;
    const microcycles: Microcycle[] = [];
    
    for (let i = 0; i < weekCount; i++) {
      const weekNumber = mesocycle.startWeek + i;
      microcycles.push({
        id: `micro_${mesocycle.id}_${weekNumber}`,
        weekNumber,
        startDate: getWeekStartDate(weekNumber, year),
        endDate: getWeekEndDate(weekNumber, year),
        sessions: Math.floor(mesocycle.sessions / weekCount),
        volume: Math.floor(mesocycle.totalVolume / weekCount),
        intensity: i < weekCount - 1 ? 'media' : 'baja' as const,
        focus: i === 0 ? 'Adaptación' : i === weekCount - 1 ? 'Recuperación' : 'Desarrollo'
      });
    }
    
    return microcycles;
  };

  const getWeekStartDate = (weekNumber: number, year: number) => {
    const startOfYear = new Date(year, 0, 1);
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7);
    return startOfWeek.toISOString().split('T')[0];
  };

  const getWeekEndDate = (weekNumber: number, year: number) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfWeek = new Date(startOfYear);
    endOfWeek.setDate(endOfWeek.getDate() + (weekNumber - 1) * 7 + 6);
    return endOfWeek.toISOString().split('T')[0];
  };

  const calculateTotalSessions = () => {
    return macrocycle.mesocycles.reduce((total, meso) => total + meso.sessions, 0);
  };

  const calculateTotalVolume = () => {
    return macrocycle.mesocycles.reduce((total, meso) => total + meso.totalVolume, 0);
  };

  const getOccupiedWeeks = () => {
    return macrocycle.mesocycles.flatMap(meso => 
      Array.from({ length: meso.endWeek - meso.startWeek + 1 }, (_, i) => meso.startWeek + i)
    );
  };



  // Si hay un microciclo seleccionado para ver su calendario, mostrar la vista de calendario
  if (viewingMicrocycleCalendar) {
    return (
      <div className="space-y-6">
        {/* Header del calendario del microciclo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setViewingMicrocycleCalendar(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Macrociclo
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Semana {viewingMicrocycleCalendar.microcycle.weekNumber} - {viewingMicrocycleCalendar.mesocycle.name}
              </h2>
              <p className="text-muted-foreground">
                {viewingMicrocycleCalendar.microcycle.focus}
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>
                  {new Date(viewingMicrocycleCalendar.microcycle.startDate).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })} - {new Date(viewingMicrocycleCalendar.microcycle.endDate).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <Badge 
                  variant="outline" 
                  className={
                    viewingMicrocycleCalendar.microcycle.intensity === 'alta' ? 'border-red-200 text-red-700 bg-red-50' :
                    viewingMicrocycleCalendar.microcycle.intensity === 'media' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                    'border-green-200 text-green-700 bg-green-50'
                  }
                >
                  Intensidad {viewingMicrocycleCalendar.microcycle.intensity}
                </Badge>
              </div>
            </div>
          </div>
        </div>



        {/* Calendario del microciclo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendario Semanal - Semana {viewingMicrocycleCalendar.microcycle.weekNumber}
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las sesiones programadas para esta semana de entrenamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PlanningCalendar
              planningId={planningId}
              userType="coach"
              athletes={athletes}
              microcycleFilter={{
                id: viewingMicrocycleCalendar.microcycle.id,
                weekNumber: viewingMicrocycleCalendar.microcycle.weekNumber,
                startDate: viewingMicrocycleCalendar.microcycle.startDate,
                endDate: viewingMicrocycleCalendar.microcycle.endDate,
                mesocycleName: viewingMicrocycleCalendar.mesocycle.name
              }}
              onSessionCreate={(session) => {
                console.log('Nueva sesión creada para microciclo:', session);
                toast.success(`Sesión creada en Semana ${viewingMicrocycleCalendar.microcycle.weekNumber}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay un mesociclo seleccionado para ver su calendario, mostrar la vista de calendario
  if (viewingMesocycleCalendar) {
    return (
      <div className="space-y-6">
        {/* Header del calendario del mesociclo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setViewingMesocycleCalendar(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Macrociclo
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                {viewingMesocycleCalendar.name}
              </h2>
              <p className="text-muted-foreground">
                {viewingMesocycleCalendar.objective}
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Semanas {viewingMesocycleCalendar.startWeek}-{viewingMesocycleCalendar.endWeek}</span>
                <Badge className={getStatusColor(viewingMesocycleCalendar.status)}>
                  {getStatusText(viewingMesocycleCalendar.status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario del mesociclo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendario del Mesociclo
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las sesiones programadas para este período de entrenamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PlanningCalendar
              planningId={planningId}
              userType="coach"
              athletes={athletes}
              mesocycleFilter={{
                id: viewingMesocycleCalendar.id,
                name: viewingMesocycleCalendar.name,
                startWeek: viewingMesocycleCalendar.startWeek,
                endWeek: viewingMesocycleCalendar.endWeek
              }}
              onSessionCreate={(session) => {
                console.log('Nueva sesión creada para mesociclo:', session);
                toast.success(`Sesión creada en ${viewingMesocycleCalendar.name}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Macrociclo {selectedYear}
            </h2>
            <p className="text-muted-foreground">
              Planificación anual estructurada en mesociclos flexibles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Estadísticas del Macrociclo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Semanas Totales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{macrocycle.totalWeeks}</div>
              <p className="text-xs text-muted-foreground">
                {getOccupiedWeeks().length} semanas ocupadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesociclos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{macrocycle.mesocycles.length}</div>
              <p className="text-xs text-muted-foreground">
                Programados en total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sesiones Totales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{calculateTotalSessions()}</div>
              <p className="text-xs text-muted-foreground">
                En todos los mesociclos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volumen Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{calculateTotalVolume()}km</div>
              <p className="text-xs text-muted-foreground">
                Kilómetros programados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mesociclos del Macrociclo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Mesociclos</h3>
            <Button
              onClick={() => setIsCreateMesocycleModalOpen(true)}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Mesociclo
            </Button>
          </div>

          {macrocycle.mesocycles.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium mb-1">No hay mesociclos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Agrega tu primer mesociclo para comenzar la planificación
                  </p>
                  <Button 
                    onClick={() => setIsCreateMesocycleModalOpen(true)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Mesociclo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            macrocycle.mesocycles.map((mesocycle) => {
              const isExpanded = expandedMesocycles.has(mesocycle.id);
              const mesocycleWithMicrocycles = mesocycle.microcycles.length > 0 
                ? mesocycle 
                : { ...mesocycle, microcycles: generateMockMicrocycles(mesocycle) };
              
              return (
                <Card key={mesocycle.id} className="border-l-4 border-l-accent">
                  <Collapsible open={isExpanded}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{mesocycle.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {mesocycle.objective}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Semanas {mesocycle.startWeek}-{mesocycle.endWeek}
                          </Badge>
                          <Badge className={getStatusColor(mesocycle.status)}>
                            {getStatusText(mesocycle.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {mesocycle.sessions} sesiones
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {mesocycle.totalVolume}km
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title={isExpanded ? 'Ocultar microciclos' : 'Ver microciclos'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMicrocycles(mesocycle.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title="Ver calendario del mesociclo"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCalendar(mesocycle);
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title="Editar mesociclo"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMesocycle(mesocycle);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/20 text-destructive"
                              title="Eliminar mesociclo"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(mesocycle.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="border-t border-border pt-4">
                          <div className="space-y-2">
                            {mesocycleWithMicrocycles.microcycles.map((microcycle, index) => (
                              <div 
                                key={microcycle.id} 
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                                  index !== mesocycleWithMicrocycles.microcycles.length - 1 ? 'border-b border-border' : ''
                                }`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Semana {microcycle.weekNumber}</span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          microcycle.intensity === 'alta' ? 'border-red-200 text-red-700 bg-red-50' :
                                          microcycle.intensity === 'media' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                          'border-green-200 text-green-700 bg-green-50'
                                        }`}
                                      >
                                        {microcycle.intensity}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(microcycle.startDate).toLocaleDateString('es-ES', { 
                                        day: '2-digit', 
                                        month: 'short' 
                                      })} - {new Date(microcycle.endDate).toLocaleDateString('es-ES', { 
                                        day: '2-digit', 
                                        month: 'short' 
                                      })}
                                    </p>
                                  </div>
                                  
                                  <div className="text-sm text-muted-foreground flex-1 min-w-0">
                                    <span className="truncate block">{microcycle.focus}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="text-foreground font-medium">{microcycle.sessions}</div>
                                      <div className="text-xs text-muted-foreground">sesiones</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-foreground font-medium">{microcycle.volume} km</div>
                                      <div className="text-xs text-muted-foreground">volumen</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-accent/20"
                                    title="Ver calendario"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewMicrocycleCalendar(microcycle, mesocycle);
                                    }}
                                  >
                                    <Calendar className="h-3 w-3" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-accent/20"
                                    title="Editar microciclo"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditMicrocycle(microcycle, mesocycle);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-destructive/20 text-destructive"
                                    title="Eliminar microciclo"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingMicrocycle({ microcycle, mesocycle });
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal para crear/editar mesociclo */}
        <CreateMesocycleModal
          isOpen={isCreateMesocycleModalOpen}
          onClose={() => {
            setIsCreateMesocycleModalOpen(false);
            setEditingMesocycle(null);
          }}
          onSubmit={handleCreateMesocycle}
          onUpdate={handleUpdateMesocycle}
          macrocycle={macrocycle}
          existingMesocycles={macrocycle.mesocycles}
          editingMesocycle={editingMesocycle}
          year={selectedYear}
          onViewCalendar={handleViewCalendar}
        />

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar mesociclo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el mesociclo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirmId && handleDeleteMesocycle(deleteConfirmId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de edición de microciclo */}
        {editingMicrocycle && (
          <EditMicrocycleModal
            isOpen={!!editingMicrocycle}
            onClose={() => setEditingMicrocycle(null)}
            microcycle={editingMicrocycle.microcycle}
            mesocycleName={editingMicrocycle.mesocycle.name}
            onSave={handleSaveMicrocycle}
          />
        )}

        {/* Diálogo de confirmación de eliminación de microciclo */}
        <AlertDialog open={!!deletingMicrocycle} onOpenChange={() => setDeletingMicrocycle(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar microciclo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la Semana {deletingMicrocycle?.microcycle.weekNumber} del {deletingMicrocycle?.mesocycle.name}.
                {deletingMicrocycle?.microcycle.sessions > 0 && (
                  <span className="block mt-2 text-amber-600">
                    ⚠️ Esta semana contiene {deletingMicrocycle.microcycle.sessions} sesión(es) programada(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteMicrocycle}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar Semana
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}