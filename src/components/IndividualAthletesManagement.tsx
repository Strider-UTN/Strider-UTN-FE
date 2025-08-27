import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { AthleteProfileModal } from './AthleteProfileModal';
import { AthleteInviteModal } from './AthleteInviteModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Activity,
  Heart,
  Users,
  UserPlus,
  Send,
  Eye,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';

interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthYear: number;
  height: number; // cm
  weight: number; // kg
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  athleticExperience: {
    yearsRunning: number;
    weeklyVolume: number; // km
    monthlyVolume: number; // km
  };
  status: 'Activo' | 'Lesionado' | 'Descanso' | 'Inactivo';
  joinDate: string;
  lastActivity: string;
}

export function IndividualAthletesManagement() {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([
    {
      id: '1',
      name: 'Juan Pérez García',
      email: 'juan.perez@email.com',
      phone: '+34 666 777 888',
      birthYear: 1995,
      height: 175,
      weight: 68.5,
      emergencyContact: {
        name: 'María García',
        phone: '+34 600 111 222',
        relationship: 'Esposa'
      },
      athleticExperience: {
        yearsRunning: 8,
        weeklyVolume: 85,
        monthlyVolume: 368
      },
      status: 'Activo',
      joinDate: '2024-01-15',
      lastActivity: '2024-12-01'
    },
    {
      id: '2',
      name: 'María García López',
      email: 'maria.garcia@email.com',
      phone: '+34 677 888 999',
      birthYear: 1992,
      height: 165,
      weight: 55.0,
      emergencyContact: {
        name: 'José García',
        phone: '+34 611 222 333',
        relationship: 'Padre'
      },
      athleticExperience: {
        yearsRunning: 6,
        weeklyVolume: 65,
        monthlyVolume: 281
      },
      status: 'Activo',
      joinDate: '2024-02-20',
      lastActivity: '2024-11-29'
    },
    {
      id: '3',
      name: 'Carlos Ruiz Fernández',
      email: 'carlos.ruiz@email.com',
      phone: '+34 688 999 000',
      birthYear: 1988,
      height: 180,
      weight: 72.0,
      emergencyContact: {
        name: 'Ana Fernández',
        phone: '+34 622 333 444',
        relationship: 'Esposa'
      },
      athleticExperience: {
        yearsRunning: 15,
        weeklyVolume: 120,
        monthlyVolume: 520
      },
      status: 'Lesionado',
      joinDate: '2023-09-10',
      lastActivity: '2024-11-15'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);

  const [isAthleteDetailsModalOpen, setIsAthleteDetailsModalOpen] = useState(false);
  const [athleteForDetails, setAthleteForDetails] = useState<AthleteProfile | null>(null);

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || athlete.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });



  const handleInviteAthlete = () => {
    setIsInviteModalOpen(true);
  };

  const handleEditAthlete = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsProfileModalOpen(true);
  };

  const handleSaveAthlete = (athleteData: AthleteProfile) => {
    setAthletes(prev => prev.map(a => 
      a.id === athleteData.id ? { ...athleteData, status: a.status, joinDate: a.joinDate, lastActivity: a.lastActivity } : a
    ));
    toast.success('Perfil actualizado exitosamente');
  };

  const handleDeleteAthlete = (athleteId: string) => {
    setAthletes(prev => prev.filter(a => a.id !== athleteId));
    toast.success('Atleta eliminado');
  };

  const handleViewAthleteDetails = (athlete: AthleteProfile) => {
    setAthleteForDetails(athlete);
    setIsAthleteDetailsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Lesionado': return 'bg-red-100 text-red-800';
      case 'Descanso': return 'bg-yellow-100 text-yellow-800';
      case 'Inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVolumeClassification = (weeklyVolume: number) => {
    if (weeklyVolume < 30) return { text: 'Bajo', color: 'bg-yellow-100 text-yellow-800' };
    if (weeklyVolume < 60) return { text: 'Medio', color: 'bg-blue-100 text-blue-800' };
    if (weeklyVolume < 100) return { text: 'Alto', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Muy Alto', color: 'bg-red-100 text-red-800' };
  };

  const calculateAge = (birthYear: number) => {
    return new Date().getFullYear() - birthYear;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Mis Atletas</h1>
          <p className="text-muted-foreground">
            Gestiona los perfiles de tus atletas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInviteAthlete}>
            <Send className="w-4 h-4 mr-2" />
            Invitar Atleta
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atletas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Lesionado">Lesionado</SelectItem>
                <SelectItem value="Descanso">Descanso</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredAthletes.length} atletas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de atletas */}
      <div className="grid gap-4">
        {filteredAthletes.map(athlete => {
          const volumeClassification = getVolumeClassification(athlete.athleticExperience.weeklyVolume);
          
          return (
            <Card key={athlete.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback>{getInitials(athlete.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{athlete.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            <span>{athlete.email}</span>
                            <Phone className="w-3 h-3 ml-2" />
                            <span>{athlete.phone}</span>
                          </div>
                        </div>
                        
                        <Badge className={getStatusColor(athlete.status)}>
                          {athlete.status}
                        </Badge>
                      </div>

                      {/* Información esencial simplificada */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-accent" />
                          <div>
                            <p className="text-muted-foreground">Experiencia</p>
                            <p className="font-medium">{athlete.athleticExperience.yearsRunning} años</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-secondary" />
                          <div>
                            <p className="text-muted-foreground">Vol. Semanal</p>
                            <p className="font-medium">{athlete.athleticExperience.weeklyVolume} km</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAthleteDetails(athlete)}
                      className="text-primary hover:text-primary/80"
                    >
                      Ver Detalles
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Aquí se podría abrir directamente el modal de feedback
                        // o navegar a la sección de retroalimentación con ese atleta
                        console.log('Abrir feedback para', athlete.name);
                      }}
                      className="text-accent hover:text-accent/80"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Feedback
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAthlete(athlete)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewAthleteDetails(athlete)}>
                          Ver Detalles Completos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAthlete(athlete)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteAthlete(athlete.id)}
                        >
                          Eliminar Atleta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAthletes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium">No se encontraron atletas</p>
                <p className="text-sm">Invita atletas para que se unan a tu planificación</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={handleInviteAthlete}>
                  <Send className="w-4 h-4 mr-2" />
                  Invitar atleta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de perfil */}
      <AthleteProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        athlete={selectedAthlete}
        onSave={handleSaveAthlete}
        isCreateMode={false}
      />

      {/* Modal de invitación */}
      <AthleteInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        coachName="Carlos Martínez" // Este debería venir del contexto del usuario autenticado
      />

      {/* Modal de detalles del atleta */}
      <Dialog open={isAthleteDetailsModalOpen} onOpenChange={setIsAthleteDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalles del Atleta
            </DialogTitle>
            <DialogDescription>
              Información completa del perfil del atleta
            </DialogDescription>
          </DialogHeader>

          {athleteForDetails && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-lg">
                    {getInitials(athleteForDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{athleteForDetails.name}</h3>
                  <div className="flex items-center gap-4 text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{athleteForDetails.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{athleteForDetails.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getStatusColor(athleteForDetails.status)}>
                      {athleteForDetails.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Información detallada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edad:</span>
                      <span className="font-medium">{calculateAge(athleteForDetails.birthYear)} años</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Año de nacimiento:</span>
                      <span className="font-medium">{athleteForDetails.birthYear}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Físico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Altura:</span>
                      <span className="font-medium">{athleteForDetails.height} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso:</span>
                      <span className="font-medium">{athleteForDetails.weight} kg</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      Experiencia Atlética
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Años corriendo:</span>
                      <span className="font-medium">{athleteForDetails.athleticExperience.yearsRunning} años</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vol. semanal:</span>
                      <span className="font-medium">{athleteForDetails.athleticExperience.weeklyVolume} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vol. mensual:</span>
                      <span className="font-medium">{athleteForDetails.athleticExperience.monthlyVolume} km</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      Contacto de Emergencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">{athleteForDetails.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-medium">{athleteForDetails.emergencyContact.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Relación:</span>
                      <span className="font-medium">{athleteForDetails.emergencyContact.relationship}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fechas importantes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Historial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha de registro:</span>
                      <span className="font-medium">{formatDate(athleteForDetails.joinDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última actividad:</span>
                      <span className="font-medium">{formatDate(athleteForDetails.lastActivity)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}