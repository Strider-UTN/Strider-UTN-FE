import React, { useState } from 'react';
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
import { AthleteStatusManagement } from './AthleteStatusManagement';
import { PlanningManagement } from './PlanningManagement';
import { ReportsView } from './ReportsView';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupConfigurationModal } from './GroupConfigurationModal';
import { GroupAthleteManagementModal } from './GroupAthleteManagementModal';
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
  Heart
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

type AthleteActiveView = 'calendar' | 'training-plan' | 'upload-training' | 'training-history' | 'performance' | 'status';

export function Dashboard({ onLogout, userType, user, onUpdateUser, theme, onToggleTheme }: DashboardProps) {
  const [coachActiveView, setCoachActiveView] = useState<CoachActiveView>('my-athletes');
  const [athleteActiveView, setAthleteActiveView] = useState<AthleteActiveView>('calendar');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [isAthleteManagementOpen, setIsAthleteManagementOpen] = useState(false);
  const [selectedGroupForAthletes, setSelectedGroupForAthletes] = useState<TrainingGroup | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Estados para filtros de sedes
  const [groupNameFilter, setGroupNameFilter] = useState('');
  const [trainingPointFilter, setTrainingPointFilter] = useState('all');
  const [trainingGroups, setTrainingGroups] = useState<TrainingGroup[]>([
    {
      id: 'group1',
      name: 'Sede Madrid Centro',
      trainingPoints: ['Pista Municipal Madrid', 'Parque del Retiro'],
      createdDate: '2024-01-15',
      memberCount: 12,
      description: 'Grupo principal de fondistas en el centro de Madrid'
    },
    {
      id: 'group2',
      name: 'Sede Madrid Norte',
      trainingPoints: ['Pista Vallehermoso', 'Monte de El Pardo'],
      createdDate: '2024-02-20',
      memberCount: 8,
      description: 'Sede especializada en entrenamientos de montaña'
    },
    {
      id: 'group3',
      name: 'Sede Madrid Sur',
      trainingPoints: ['Pista de Leganes', 'Cerro de los Ángeles'],
      createdDate: '2024-03-10',
      memberCount: 15,
      description: 'Sede con enfoque en medio fondo y velocidad'
    }
  ]);

  // Menú reorganizado sin sesiones: mis atletas, mis sedes, planificación, reportes, retroalimentación, plantillas
  const coachMenuItems = [
    { id: 'my-athletes', label: 'Mis Atletas', icon: User },
    { id: 'my-groups', label: 'Mis Sedes', icon: MapPin },
    { id: 'planning', label: 'Planificaciones', icon: Calendar },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'feedback', label: 'Retroalimentación', icon: MessageSquare },
    { id: 'templates', label: 'Plantillas', icon: FileText }
  ];

  const athleteMenuItems = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'training-plan', label: 'Planificación', icon: CalendarDays },
    { id: 'upload-training', label: 'Subir Entrenamientos', icon: Upload },
    { id: 'training-history', label: 'Histórico de entrenamientos', icon: FileText },
    { id: 'performance', label: 'Rendimiento', icon: BarChart3 },
    { id: 'status', label: 'Estado y Lesiones', icon: Heart }
  ];

  const handleCreateSession = (session: any) => {
    console.log('Session created:', session);
    toast.success('Sesión creada exitosamente');
    setIsSessionModalOpen(false);
  };

  const handleCreateGroup = (groupData: { name: string; trainingPoints: string[]; createdDate: string }) => {
    const newGroup: TrainingGroup = {
      id: `group-${Date.now()}`,
      name: groupData.name,
      trainingPoints: groupData.trainingPoints,
      createdDate: groupData.createdDate,
      memberCount: 0,
      description: `Nueva sede: ${groupData.name}`
    };
    
    setTrainingGroups(prev => [...prev, newGroup]);
    toast.success(`Sede "${groupData.name}" creada exitosamente`);
    setIsGroupModalOpen(false);
  };

  const handleUpdateGroup = (updatedGroup: TrainingGroup) => {
    setTrainingGroups(prev => prev.map(group => 
      group.id === updatedGroup.id ? updatedGroup : group
    ));
  };

  const handleDeleteGroup = (groupId: string) => {
    setTrainingGroups(prev => prev.filter(group => group.id !== groupId));
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
    switch (athleteActiveView) {
      case 'calendar':
        return <AthleteCalendar />;
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
        // Para atletas, crear un objeto atleta basado en el usuario actual
        const athleteForPerformance = {
          id: user.id,
          name: user.realName,
          email: user.email,
          age: user.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : 25,
          groupName: 'Mi Entrenamiento',
          joinDate: '2024-01-01'
        };
        return (
          <AthletePerformanceView 
            athlete={athleteForPerformance}
            units={user.preferences?.units || 'metric'}
            onBack={() => setAthleteActiveView('training-plan')}
          />
        );
      case 'status':
        return <AthleteStatusManagement />;
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
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">S</span>
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