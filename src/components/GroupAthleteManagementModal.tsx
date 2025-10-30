import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Users, 
  UserPlus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Target,
  Search,
  Filter
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

interface Athlete {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  speciality: string;
  vo2Max?: number;
  joinedDate: string;
  status: 'active' | 'inactive' | 'injured';
  profileImage?: string;
  location?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface GroupAthleteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TrainingGroup | null;
}

// Datos mock de atletas en la sede
const mockAthletes: Athlete[] = [
  {
    id: 'athlete-1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+34 612 345 678',
    dateOfBirth: '1995-03-15',
    gender: 'F',
    speciality: 'Medio-fondo (1500m)',
    vo2Max: 72,
    joinedDate: '2024-01-15',
    status: 'active',
    location: 'Madrid, España',
    emergencyContact: {
      name: 'Carmen González',
      phone: '+34 612 345 679',
      relationship: 'Madre'
    }
  },
  {
    id: 'athlete-2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@email.com',
    phone: '+34 678 901 234',
    dateOfBirth: '1992-08-22',
    gender: 'M',
    speciality: 'Fondo (5000m)',
    vo2Max: 68,
    joinedDate: '2024-02-01',
    status: 'active',
    location: 'Barcelona, España'
  },
  {
    id: 'athlete-3',
    name: 'Ana Martín',
    email: 'ana.martin@email.com',
    phone: '+34 645 123 789',
    dateOfBirth: '1998-11-10',
    gender: 'F',
    speciality: 'Fondo (10000m)',
    vo2Max: 70,
    joinedDate: '2024-01-20',
    status: 'injured',
    location: 'Valencia, España'
  }
];

// Datos mock de atletas existentes que no están en la sede
const mockExistingAthletes: Athlete[] = [
  {
    id: 'athlete-4',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+34 600 123 456',
    dateOfBirth: '1990-05-12',
    gender: 'M',
    speciality: 'Medio-fondo (800m)',
    vo2Max: 65,
    joinedDate: '2024-03-01',
    status: 'active',
    location: 'Sevilla, España'
  },
  {
    id: 'athlete-5',
    name: 'Laura Jiménez',
    email: 'laura.jimenez@email.com',
    phone: '+34 655 789 012',
    dateOfBirth: '1997-09-25',
    gender: 'F',
    speciality: 'Fondo (3000m)',
    vo2Max: 69,
    joinedDate: '2024-02-15',
    status: 'active',
    location: 'Bilbao, España'
  },
  {
    id: 'athlete-6',
    name: 'Roberto Sánchez',
    email: 'roberto.sanchez@email.com',
    phone: '+34 612 456 789',
    dateOfBirth: '1994-12-08',
    gender: 'M',
    speciality: 'Maratón',
    vo2Max: 71,
    joinedDate: '2024-01-10',
    status: 'active',
    location: 'Zaragoza, España'
  }
];

export function GroupAthleteManagementModal({ 
  isOpen, 
  onClose, 
  group
}: GroupAthleteManagementModalProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [athletes, setAthletes] = useState<Athlete[]>(mockAthletes);
  
  // Cargar atletas existentes al abrir el modal
  React.useEffect(() => {
    if (isOpen) {
      setExistingAthletes(mockExistingAthletes);
    }
  }, [isOpen]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [existingAthletes, setExistingAthletes] = useState<Athlete[]>([]);
  const [addAthleteSearch, setAddAthleteSearch] = useState('');
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    message: ''
  });



  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || athlete.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInviteAthlete = async () => {
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) return;
    
    // Simular envío de invitación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Invitación enviada a ${inviteForm.name}`);
    setInviteForm({ email: '', name: '', message: '' });
    setShowInviteForm(false);
  };



  const handleDeleteAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAthlete = () => {
    if (!selectedAthlete) return;
    
    setAthletes(prev => prev.filter(a => a.id !== selectedAthlete.id));
    setShowDeleteDialog(false);
    setSelectedAthlete(null);
    toast.success('Atleta eliminado de la sede');
  };

  const handleAddExistingAthlete = (athlete: Athlete) => {
    // Agregar atleta a la sede
    const athleteWithJoinDate = {
      ...athlete,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    
    setAthletes(prev => [...prev, athleteWithJoinDate]);
    setExistingAthletes(prev => prev.filter(a => a.id !== athlete.id));
    toast.success(`${athlete.name} agregado exitosamente a la sede`);
  };

  const filteredExistingAthletes = existingAthletes.filter(athlete => 
    athlete.name.toLowerCase().includes(addAthleteSearch.toLowerCase()) ||
    athlete.email.toLowerCase().includes(addAthleteSearch.toLowerCase()) ||
    athlete.speciality.toLowerCase().includes(addAthleteSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'injured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'injured': return 'Lesionado';
      default: return status;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Users className="w-5 h-5 mr-2" />
            Gestionar Atletas - {group.name}
          </DialogTitle>
          <DialogDescription>
            Administra los atletas de tu sede: invita nuevos miembros, edita información y gestiona el estado.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Lista de Atletas
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invitar Atleta
            </TabsTrigger>
          </TabsList>

          {/* Lista de Atletas */}
          <TabsContent value="list" className="space-y-4">
            {/* Controles de búsqueda, filtro y botón agregar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="injured">Lesionados</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowAddAthleteModal(true)}
                className="bg-accent hover:bg-accent/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Agregar Atleta
              </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-medium text-green-600">{athletes.filter(a => a.status === 'active').length}</div>
                    <p className="text-sm text-muted-foreground">Activos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-medium text-red-600">{athletes.filter(a => a.status === 'injured').length}</div>
                    <p className="text-sm text-muted-foreground">Lesionados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-medium text-primary">{athletes.length}</div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de atletas */}
            <div className="grid gap-4">
              {filteredAthletes.map((athlete) => (
                <Card key={athlete.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={athlete.profileImage} />
                          <AvatarFallback>{athlete.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{athlete.name}</h4>
                            <Badge className={getStatusColor(athlete.status)}>
                              {getStatusText(athlete.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {athlete.email}
                              </span>
                              {athlete.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {athlete.phone}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {athlete.speciality}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {calculateAge(athlete.dateOfBirth)} años
                              </span>
                              {athlete.vo2Max && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  VO2 Max: {athlete.vo2Max}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAthlete(athlete)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredAthletes.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No se encontraron atletas con los filtros aplicados'
                        : 'No hay atletas en esta sede. Invita a tu primer atleta.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Invitar Atleta */}
          <TabsContent value="invite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invitar Nuevo Atleta</CardTitle>
                <CardDescription>
                  Envía una invitación por email para que el atleta se una a la sede "{group.name}"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="athleteName">Nombre del Atleta *</Label>
                    <Input
                      id="athleteName"
                      placeholder="Ej: María González"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="athleteEmail">Email *</Label>
                    <Input
                      id="athleteEmail"
                      type="email"
                      placeholder="maria@email.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inviteMessage">Mensaje Personal (Opcional)</Label>
                  <Input
                    id="inviteMessage"
                    placeholder="Mensaje personalizado para la invitación..."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Vista previa de la invitación:</h4>
                  <p className="text-sm text-muted-foreground">
                    "Hola {inviteForm.name || '[Nombre]'}, has sido invitado/a a unirte a la sede {group.name}. 
                    {inviteForm.message && ` ${inviteForm.message}`} Haz clic en el enlace para completar tu registro."
                  </p>
                </div>

                <Button 
                  onClick={handleInviteAthlete}
                  disabled={!inviteForm.email.trim() || !inviteForm.name.trim()}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Invitación
                </Button>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Dialog de confirmación para eliminar */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar atleta de la sede?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará a "{selectedAthlete?.name}" de la sede "{group.name}". 
                El atleta no perderá su cuenta, pero ya no tendrá acceso a esta sede.
                Esta acción se puede revertir invitando nuevamente al atleta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAthlete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, eliminar de la sede
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal para agregar atletas existentes */}
        <Dialog open={showAddAthleteModal} onOpenChange={setShowAddAthleteModal}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-primary">
                <UserPlus className="w-5 h-5 mr-2" />
                Agregar Atleta Existente a {group.name}
              </DialogTitle>
              <DialogDescription>
                Selecciona atletas que ya están registrados en el sistema para agregarlos a esta sede.
              </DialogDescription>
            </DialogHeader>

            {/* Búsqueda de atletas existentes */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar atletas por nombre, email o especialidad..."
                  value={addAthleteSearch}
                  onChange={(e) => setAddAthleteSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de atletas disponibles */}
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredExistingAthletes.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {addAthleteSearch 
                          ? 'No se encontraron atletas con esos criterios'
                          : 'No hay atletas disponibles para agregar a esta sede'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredExistingAthletes.map((athlete) => (
                    <Card key={athlete.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={athlete.profileImage} />
                              <AvatarFallback>{athlete.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{athlete.name}</h4>
                                <Badge className={getStatusColor(athlete.status)}>
                                  {getStatusText(athlete.status)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {athlete.email}
                                  </span>
                                  {athlete.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {athlete.phone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {athlete.speciality}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {calculateAge(athlete.dateOfBirth)} años
                                  </span>
                                  {athlete.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {athlete.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleAddExistingAthlete(athlete)}
                            className="bg-accent hover:bg-accent/90"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddAthleteModal(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}