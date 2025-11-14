import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { UserProfile } from './UserProfile';
import { CreateTrainingSessionModal } from './CreateTrainingSessionModal';
import { TemplateManagement } from './TemplateManagement';
import { IndividualAthletesManagement } from './IndividualAthletesManagement';
import { TrainingList } from './TrainingList';
import { TrainingUpload } from './TrainingUpload';
import { AthleteCalendar } from './AthleteCalendar';
import { AthleteTrainingPlan } from './AthleteTrainingPlan';
import { AthleteTrainingHistory } from './AthleteTrainingHistory';
import { AthletePerformanceView } from './AthletePerformanceView';
import { PerformanceView } from './PerformanceView';
import { AthleteStatusManagement } from './AthleteStatusManagement';
import { InvitationsView } from './InvitationsView';
import { CoachAthleteRelationshipService } from '../services/coachAthleteRelationshipService';
import { GroupService } from '../services/groupService';
import { PlanningManagement } from './PlanningManagement';
import { ReportsView } from './ReportsView';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupConfigurationModal } from './GroupConfigurationModal';
import { GroupAthleteManagementModal } from './GroupAthleteManagementModal';
import { InviteAthleteToGroupModal } from './InviteAthleteToGroupModal';
import { FeedbackManagement } from './FeedbackManagement';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  Calendar, 
  CalendarDays,
  FileText, 
  BarChart3, 
  Settings, 
  User,
  Plus,
  MapPin,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Search,
  Filter,
  X,
  Upload,
  Heart,
  Mail,
  UserPlus
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { AuthService } from '../services/authService';

interface User {
  id: string;
  username: string;
  email: string;
  userType: 'athlete' | 'coach';
  realName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  profileImage?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    units?: 'metric' | 'imperial';
    notifications?: {
      email: boolean;
    };
  };
  physicalProfile?: {
    yearsOfExperience: number;
    trainingVolume: {
      weekly?: number;
      monthly?: number;
      unit: 'km' | 'miles';
    };
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalInfo: {
      healthInsurance?: {
        provider: string;
        memberNumber: string;
      };
      medicalClearance: {
        hasValidClearance: boolean;
        lastCheckupDate?: string;
        expiryDate?: string;
        isExpired?: boolean;
      };
    };
  };
}

interface TrainingGroup {
  id: string;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  memberCount: number;
  description?: string;
}

interface DashboardProps {
  onLogout: () => void;
  userType: 'athlete' | 'coach';
  user: User;
  onUpdateUser: (user: User) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type CoachActiveView = 
  | 'my-athletes'
  | 'my-groups' 
  | 'planning'
  | 'reports'
  | 'feedback'
  | 'templates';

type AthleteActiveView = 'calendar' | 'training-plan' | 'upload-training' | 'training-history' | 'performance' | 'status' | 'invitations';

export function Dashboard({ onLogout, userType, user, onUpdateUser, theme, onToggleTheme }: DashboardProps) {
  const [coachActiveView, setCoachActiveView] = useState<CoachActiveView>('my-athletes');
  const [athleteActiveView, setAthleteActiveView] = useState<AthleteActiveView>('calendar');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [isAthleteManagementOpen, setIsAthleteManagementOpen] = useState(false);
  const [selectedGroupForAthletes, setSelectedGroupForAthletes] = useState<TrainingGroup | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  
  // Estados para filtros de sedes
  const [groupNameFilter, setGroupNameFilter] = useState('');
  const [trainingPointFilter, setTrainingPointFilter] = useState('all');
  const [trainingGroups, setTrainingGroups] = useState<TrainingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  
  // Estados para invitaciones a grupos
  const [isInviteAthleteToGroupModalOpen, setIsInviteAthleteToGroupModalOpen] = useState(false);
  const [selectedGroupForInvitation, setSelectedGroupForInvitation] = useState<TrainingGroup | null>(null);

  // Menú reorganizado sin sesiones: mis atletas, mis sedes, planificación, reportes, retroalimentación, plantillas
  const coachMenuItems = [
    { id: 'my-athletes', label: 'Mis Atletas', icon: User },
    { id: 'my-groups', label: 'Mis Sedes', icon: MapPin },
    { id: 'planning', label: 'Planificaciones', icon: Calendar },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'feedback', label: 'Retroalimentación', icon: MessageSquare },
    { id: 'templates', label: 'Plantillas', icon: FileText }
  ];

  // Función para cargar el contador de invitaciones pendientes (usada desde InvitationsView también)
  const loadPendingInvitationsCount = useCallback(async () => {
    if (userType === 'athlete') {
      try {
        // Cargar invitaciones de coaches y sedes en paralelo
        const [coachInvitations, groupInvitations] = await Promise.all([
          CoachAthleteRelationshipService.getPendingInvitations(),
          GroupService.getPendingInvitations()
        ]);
        // Sumar ambas cantidades
        setPendingInvitationsCount(coachInvitations.length + groupInvitations.length);
      } catch (error) {
        // Error silencioso, el usuario verá el error si va a la vista de invitaciones
        console.error('Error al cargar invitaciones pendientes:', error);
      }
    }
  }, [userType]);

  // Función para recargar las sedes desde el backend
  const loadTrainingGroups = useCallback(async () => {
    if (userType !== 'coach') return;
    
    setIsLoadingGroups(true);
    try {
      const groups = await GroupService.getAllGroups();
      setTrainingGroups(groups);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setIsLoadingGroups(false);
    }
  }, [userType]);

  // Cargar invitaciones pendientes para atletas
  // Usa Page Visibility API para solo hacer polling cuando la pestaña está visible
  useEffect(() => {
    if (userType === 'athlete') {

      // Cargar inmediatamente al montar
      loadPendingInvitationsCount();

      // Polling solo cuando la pestaña está visible
      // Intervalo más largo (60 segundos) cuando está visible
      // No hace polling cuando la pestaña está oculta
      let interval: NodeJS.Timeout | null = null;

      const startPolling = () => {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
          // Solo hacer polling si la pestaña está visible
          if (document.visibilityState === 'visible') {
            loadPendingInvitationsCount();
          }
        }, 60000); // 60 segundos cuando está visible
      };

      const stopPolling = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      // Manejar cambios de visibilidad para iniciar/detener polling
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Cargar inmediatamente cuando se vuelve visible
          loadPendingInvitationsCount();
          startPolling();
        } else {
          // Detener polling cuando la pestaña está oculta
          stopPolling();
        }
      };

      // Iniciar polling si la pestaña está visible
      if (document.visibilityState === 'visible') {
        startPolling();
      }

      // Listener para cambios de visibilidad
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        stopPolling();
      };
    }
  }, [userType]);

  // Cargar sedes al montar el componente si es coach
  useEffect(() => {
    if (userType === 'coach') {
      loadTrainingGroups();
    }
  }, [userType, loadTrainingGroups]);

  // Actualizar contador cuando el usuario entra a la vista de invitaciones
  useEffect(() => {
    if (userType === 'athlete' && athleteActiveView === 'invitations') {
      loadPendingInvitationsCount();
    }
  }, [userType, athleteActiveView]);

  const athleteMenuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'training-plan', label: 'Planificación', icon: CalendarDays },
    { id: 'upload-training', label: 'Subir Entrenamientos', icon: Upload },
    { id: 'training-history', label: 'Histórico de sesiones', icon: FileText },
    { id: 'performance', label: 'Rendimiento', icon: BarChart3 },
    { id: 'status', label: 'Estado y Lesiones', icon: Heart },
    { id: 'invitations', label: 'Invitaciones', icon: Mail, badgeCount: pendingInvitationsCount }
  ];

  const handleCreateSession = (session: any) => {
    console.log('Session created:', session);
    // Trigger refresh de TrainingList incrementando el contador
    setSessionRefreshTrigger(prev => prev + 1);
    setIsSessionModalOpen(false);
  };

  const handleCreateGroup = async (groupData?: { name: string; trainingPoints: string[]; createdDate: string }) => {
    // El modal ahora maneja la creación directamente con el servicio
    // Este callback es solo para retrocompatibilidad
    if (groupData) {
      // Recargar las sedes desde el backend
      await loadTrainingGroups();
    }
  };

  const handleGroupCreated = async () => {
    // Recargar las sedes después de crear una nueva
    await loadTrainingGroups();
    setIsGroupModalOpen(false);
  };

  const handleUpdateGroup = async (updatedGroup: TrainingGroup) => {
    try {
      // El modal de configuración debería llamar directamente a GroupService.updateGroup()
      // Este callback es solo para retrocompatibilidad
      // Recargar las sedes desde el backend
      await loadTrainingGroups();
    } catch (error) {
      console.error('Error al actualizar sede:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await GroupService.deleteGroup(groupId);
      // Recargar las sedes desde el backend
      await loadTrainingGroups();
    } catch (error) {
      // El error ya fue manejado por el servicio
      console.error('Error al eliminar sede:', error);
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Obtener todos los puntos de entrenamiento únicos
  const allTrainingPoints = Array.from(
    new Set(trainingGroups.flatMap(group => group.trainingPoints))
  ).sort();

  // Filtrar sedes
  const filteredGroups = trainingGroups.filter(group => {
    const matchesName = group.name.toLowerCase().includes(groupNameFilter.toLowerCase());
    const matchesTrainingPoint = trainingPointFilter === 'all' || 
                                group.trainingPoints.some(point => 
                                  point.toLowerCase().includes(trainingPointFilter.toLowerCase())
                                );
    return matchesName && matchesTrainingPoint;
  });

  const clearFilters = () => {
    setGroupNameFilter('');
    setTrainingPointFilter('all');
  };

  const hasActiveFilters = groupNameFilter !== '' || trainingPointFilter !== 'all';

  const renderGroupsList = () => (
    <div className="space-y-4">
      {/* Controles de filtrado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar Sedes</CardTitle>
          <CardDescription>
            Busca por nombre de sede o filtra por punto de entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda por nombre */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre de sede..."
                  value={groupNameFilter}
                  onChange={(e) => setGroupNameFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtro por punto de entrenamiento */}
            <div className="sm:w-64">
              <Select value={trainingPointFilter} onValueChange={setTrainingPointFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por punto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los puntos</SelectItem>
                  {allTrainingPoints.map((point) => (
                    <SelectItem key={point} value={point}>
                      {point}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
          
          {/* Indicador de resultados */}
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredGroups.length === trainingGroups.length 
                ? `Mostrando todas las ${trainingGroups.length} sedes`
                : `Mostrando ${filteredGroups.length} de ${trainingGroups.length} sedes`
              }
            </span>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span>Filtros activos:</span>
                {groupNameFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Nombre: {groupNameFilter}
                  </Badge>
                )}
                {trainingPointFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Punto: {trainingPointFilter}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de sedes */}
      <div className="grid gap-4">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-medium">No se encontraron sedes</p>
                  <p className="text-sm">
                    {hasActiveFilters 
                      ? 'Intenta ajustar los filtros para encontrar lo que buscas'
                      : 'No tienes sedes creadas aún'
                    }
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button onClick={() => setIsGroupModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primera sede
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
        <Card key={group.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {group.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {group.description}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {group.memberCount} atletas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Puntos de Entrenamiento:</p>
                <div className="flex flex-wrap gap-2">
                  {group.trainingPoints.map((point, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Creada el {formatDate(group.createdDate)}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedGroupForInvitation(group);
                      setIsInviteAthleteToGroupModalOpen(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Invitar Atletas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedGroupForAthletes(group);
                      setIsAthleteManagementOpen(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Gestionar Atletas
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderCoachContent = () => {
    switch (coachActiveView) {
      case 'my-athletes':
        return <IndividualAthletesManagement />;
      case 'my-groups':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1>Mis Sedes</h1>
                <p className="text-muted-foreground">
                  Gestiona tus sedes de entrenamiento y sus miembros
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsGroupModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Sede
                </Button>
                <Button variant="outline" onClick={() => setIsGroupManagementOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración de Sedes
                </Button>
              </div>
            </div>
            
            {trainingGroups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-medium">No tienes sedes creadas</p>
                      <p className="text-sm">Crea tu primera sede para organizar tus entrenamientos</p>
                    </div>
                    <Button onClick={() => setIsGroupModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primera sede
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              renderGroupsList()
            )}
          </div>
        );
      case 'planning':
        return <PlanningManagement />;
      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h1>Reportes de Entrenamiento</h1>
              <p className="text-muted-foreground">
                Analiza el rendimiento y métricas de tus atletas por periodo
              </p>
            </div>
            <ReportsView 
              planningId="all"
              athletes={[
                { id: 'athlete1', name: 'Carlos Mendoza', groupId: 'group1', groupName: 'Sede Madrid Centro', vo2max: 65 },
                { id: 'athlete2', name: 'María García', groupId: 'group1', groupName: 'Sede Madrid Centro', vo2max: 62 },
                { id: 'athlete3', name: 'Juan López', groupId: 'group2', groupName: 'Sede Madrid Norte', vo2max: 58 }
              ]}
            />
          </div>
        );
      case 'feedback':
        return <FeedbackManagement />;
      case 'templates':
        return <TemplateManagement />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  const renderAthleteContent = () => {
    const athleteIdFromToken = AuthService.getCurrentUserId();
    const fallbackId = Number(user.id);
    const resolvedAthleteId = typeof athleteIdFromToken === 'number' && !Number.isNaN(athleteIdFromToken)
      ? athleteIdFromToken
      : (!Number.isNaN(fallbackId) ? fallbackId : 0);

    switch (athleteActiveView) {
      case 'calendar':
        return (
          <AthleteCalendar 
            athleteId={resolvedAthleteId} 
            onNavigateToUpload={(date, sessionId) => {
              setAthleteActiveView('upload-training');
              // Guardar los parámetros para TrainingUpload
              // Guardar como string YYYY-MM-DD para evitar problemas de zona horaria
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              sessionStorage.setItem('trainingUpload_initialDate', dateStr);
              sessionStorage.setItem('trainingUpload_initialSessionId', sessionId);
            }}
          />
        );
      case 'training-plan':
        return <AthleteTrainingPlan />;
      case 'upload-training':
        return <TrainingUpload />;
      case 'training-history':
        // Para atletas, crear un objeto atleta basado en el usuario actual
        const athleteFromUser = {
          id: user.id,
          name: user.realName,
          email: user.email,
          profileImage: user.profileImage
        };
        return (
          <AthleteTrainingHistory 
            athlete={athleteFromUser}
            onBack={() => setAthleteActiveView('training-plan')}
          />
        );
      case 'performance':
        // Usar PerformanceView que carga datos reales del backend
        return (
          <PerformanceView 
            units={user.preferences?.units || 'metric'}
            onUnitsChange={(units) => {
              // Actualizar preferencias del usuario si es necesario
              if (onUpdateUser) {
                onUpdateUser({
                  ...user,
                  preferences: {
                    ...user.preferences,
                    units
                  }
                });
              }
            }}
          />
        );
      case 'status':
        return <AthleteStatusManagement />;
      case 'invitations':
        return <InvitationsView onInvitationResponded={loadPendingInvitationsCount} />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/LogoStriderSinTexto.png" 
                  alt="Strider Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-semibold">Strider</p>
                <Badge variant="outline" className="text-xs">
                  {userType === 'coach' ? 'Entrenador' : 'Atleta'}
                </Badge>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navegación</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {(userType === 'coach' ? coachMenuItems : athleteMenuItems).map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          if (userType === 'coach') {
                            setCoachActiveView(item.id as CoachActiveView);
                          } else {
                            setAthleteActiveView(item.id as AthleteActiveView);
                          }
                        }}
                        isActive={
                          userType === 'coach' 
                            ? coachActiveView === item.id
                            : athleteActiveView === item.id
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {'badgeCount' in item && item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                          >
                            {item.badgeCount > 99 ? '99+' : item.badgeCount}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center">
                <SidebarTrigger />
              </div>
              
              {/* Perfil del usuario y opciones en la parte superior derecha */}
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 px-3 gap-2 hover:bg-accent/10">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.profileImage} alt={user.realName} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.firstName || user.realName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium leading-none">
                          {user.firstName || user.realName.split(' ')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.firstName || user.realName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge variant="outline" className="text-xs w-fit mt-1">
                          {userType === 'coach' ? 'Entrenador' : 'Atleta'}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleTheme}>
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 mr-2" />
                      ) : (
                        <Moon className="w-4 h-4 mr-2" />
                      )}
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onLogout}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative">
            <div className="w-full max-w-full">
              {userType === 'coach' ? renderCoachContent() : renderAthleteContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      {userType === 'coach' && (
        <CreateTrainingSessionModal 
          isOpen={isSessionModalOpen} 
          onClose={() => setIsSessionModalOpen(false)}
          onSubmit={handleCreateSession}
          onSessionCreated={() => setSessionRefreshTrigger(prev => prev + 1)} // Refrescar listas
          athletes={[
            { id: '1', name: 'Juan Pérez', groupId: 'group1', groupName: 'Sede Madrid Centro', vo2max: 4.2 },
            { id: '2', name: 'María García', groupId: 'group1', groupName: 'Sede Madrid Centro', vo2max: 4.5 },
            { id: '3', name: 'Carlos Ruiz', groupId: 'group2', groupName: 'Sede Madrid Norte', vo2max: 4.1 },
            { id: '4', name: 'Laura Fernández', groupId: 'group2', groupName: 'Sede Madrid Norte', vo2max: 4.3 },
            { id: '5', name: 'David López', groupId: 'group3', groupName: 'Sede Madrid Sur', vo2max: 4.0 }
          ]}
          selectedDate={new Date().toISOString().split('T')[0]}
        />
      )}
      
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        onGroupCreated={handleGroupCreated}
      />
      
      <GroupConfigurationModal 
        isOpen={isGroupManagementOpen} 
        onClose={() => setIsGroupManagementOpen(false)}
        groups={trainingGroups}
        onUpdateGroup={handleUpdateGroup}
      />
      
      <GroupAthleteManagementModal 
        isOpen={isAthleteManagementOpen} 
        onClose={() => setIsAthleteManagementOpen(false)}
        group={selectedGroupForAthletes}
      />

      <InviteAthleteToGroupModal
        isOpen={isInviteAthleteToGroupModalOpen}
        onClose={() => {
          setIsInviteAthleteToGroupModalOpen(false);
          setSelectedGroupForInvitation(null);
        }}
        group={selectedGroupForInvitation}
        onInvitationSent={() => {
          // Recargar grupos y miembros si es necesario
          loadTrainingGroups();
        }}
      />

      {/* Modal de Perfil de Usuario */}
      <UserProfile 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user} 
        onUpdateUser={onUpdateUser}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </SidebarProvider>
  );
}