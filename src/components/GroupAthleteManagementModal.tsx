import React, { useState, useEffect } from 'react';
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
  Calendar,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { GroupService } from '../services/groupService';
import type { TrainingGroupMember } from '../types/groupTypes';
import { InviteAthleteToGroupModal } from './InviteAthleteToGroupModal';

interface TrainingGroup {
  id: string;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  memberCount: number;
  description?: string;
}


interface GroupAthleteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TrainingGroup | null;
}


export function GroupAthleteManagementModal({ 
  isOpen, 
  onClose, 
  group
}: GroupAthleteManagementModalProps) {
  const [members, setMembers] = useState<TrainingGroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TrainingGroupMember | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  
  // Cargar miembros del grupo cuando se abre el modal
  useEffect(() => {
    if (isOpen && group) {
      loadGroupMembers();
    }
  }, [isOpen, group]);

  const loadGroupMembers = async () => {
    if (!group) return;
    
    setIsLoading(true);
    try {
      const groupMembers = await GroupService.getGroupMembers(group.id);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error al cargar miembros del grupo:', error);
      toast.error('Error al cargar los miembros del grupo');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar miembros del grupo - solo mostrar miembros activos o pendientes (excluir rejected, cancelled)
  const validMembers = members.filter(member => 
    member.status === 'active' || member.status === 'pending'
  );

  const filteredMembers = validMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteMember = (member: TrainingGroupMember) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember || !group) return;
    
    try {
      await GroupService.removeMember(group.id, selectedMember.id);
      await loadGroupMembers(); // Recargar miembros
      setShowDeleteDialog(false);
      setSelectedMember(null);
      toast.success('Atleta eliminado de la sede');
    } catch (error) {
      console.error('Error al eliminar miembro:', error);
      // El error ya fue manejado por el servicio
    }
  };

  const handleInvitationSent = () => {
    // Recargar miembros cuando se envía una invitación
    loadGroupMembers();
    setShowAddAthleteModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

        <Tabs value="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Lista de Atletas
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
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
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
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Cargando miembros...</span>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-medium text-green-600">{validMembers.filter(m => m.status === 'active').length}</div>
                        <p className="text-sm text-muted-foreground">Activos</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-medium text-yellow-600">{validMembers.filter(m => m.status === 'pending').length}</div>
                        <p className="text-sm text-muted-foreground">Pendientes</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-medium text-primary">{validMembers.length}</div>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de atletas */}
                <div className="grid gap-4">
                  {filteredMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.profileImage} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{member.name}</h4>
                                <Badge className={getStatusColor(member.status)}>
                                  {getStatusText(member.status)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {member.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Se unió el {new Date(member.joinedDate).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredMembers.length === 0 && (
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
              </>
            )}
          </TabsContent>


        </Tabs>

        {/* Dialog de confirmación para eliminar */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar atleta de la sede?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará a "{selectedMember?.name}" de la sede "{group?.name}". 
                El atleta no perderá su cuenta, pero ya no tendrá acceso a esta sede.
                Esta acción se puede revertir invitando nuevamente al atleta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, eliminar de la sede
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal para agregar atletas - usando InviteAthleteToGroupModal */}
        <InviteAthleteToGroupModal
          isOpen={showAddAthleteModal}
          onClose={() => setShowAddAthleteModal(false)}
          group={group}
          onInvitationSent={handleInvitationSent}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}