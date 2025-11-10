import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  Mail, 
  Check, 
  X, 
  Clock, 
  UserPlus, 
  Loader2,
  AlertCircle,
  UserCheck,
  RefreshCw,
  Users
} from 'lucide-react';
import { 
  CoachAthleteRelationshipService, 
  CoachAthleteRelationshipResponseDto,
  CoachResponseDto
} from '../services/coachAthleteRelationshipService';
import { 
  GroupService, 
  GroupInvitationResponseDto,
  MyTrainingGroupResponseDto
} from '../services/groupService';
import { toast } from 'sonner';

interface InvitationsViewProps {
  onInvitationResponded?: () => void; // Callback para actualizar el contador en Dashboard
}

export function InvitationsView({ onInvitationResponded }: InvitationsViewProps) {
  const [pendingInvitations, setPendingInvitations] = useState<CoachAthleteRelationshipResponseDto[]>([]);
  const [myCoaches, setMyCoaches] = useState<CoachResponseDto[]>([]);
  const [pendingGroupInvitations, setPendingGroupInvitations] = useState<GroupInvitationResponseDto[]>([]);
  const [myGroups, setMyGroups] = useState<MyTrainingGroupResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'coaches' | 'groups'>('coaches');
  const [activeCoachTab, setActiveCoachTab] = useState<'pending' | 'coaches'>('pending');
  const [activeGroupTab, setActiveGroupTab] = useState<'pending' | 'my-groups'>('pending');
  const [respondingToId, setRespondingToId] = useState<number | null>(null);
  const [respondingToGroupInvitationId, setRespondingToGroupInvitationId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        invitations, 
        coaches,
        groupInvitations,
        groups
      ] = await Promise.all([
        CoachAthleteRelationshipService.getPendingInvitations(),
        CoachAthleteRelationshipService.getMyCoaches('Accepted'),
        GroupService.getPendingInvitations(),
        GroupService.getMyGroups()
      ]);
      setPendingInvitations(invitations);
      setMyCoaches(coaches);
      setPendingGroupInvitations(groupInvitations);
      setMyGroups(groups);
    } catch (error) {
      console.error('Error al cargar invitaciones:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToInvitation = async (relationshipId: number, accept: boolean) => {
    setRespondingToId(relationshipId);
    try {
      await CoachAthleteRelationshipService.respondToInvitation(relationshipId, accept);
      await loadData(); // Recargar datos
      
      // Notificar al Dashboard para actualizar el contador del badge
      if (onInvitationResponded) {
        onInvitationResponded();
      }
    } catch (error) {
      console.error('Error al responder invitación:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setRespondingToId(null);
    }
  };

  const handleRemoveCoach = async (relationshipId: number) => {
    try {
      await CoachAthleteRelationshipService.removeRelationship(relationshipId);
      await loadData(); // Recargar datos
    } catch (error) {
      console.error('Error al eliminar relación:', error);
      // El error ya fue manejado por el servicio
    }
  };

  const handleRespondToGroupInvitation = async (invitationId: number, accept: boolean) => {
    setRespondingToGroupInvitationId(invitationId);
    try {
      await GroupService.respondToInvitation(invitationId, accept);
      await loadData(); // Recargar datos
      
      // Notificar al Dashboard para actualizar el contador del badge
      if (onInvitationResponded) {
        onInvitationResponded();
      }
    } catch (error) {
      console.error('Error al responder invitación de sede:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setRespondingToGroupInvitationId(null);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await GroupService.leaveGroup(groupId.toString());
      await loadData(); // Recargar datos
    } catch (error) {
      console.error('Error al abandonar sede:', error);
      // El error ya fue manejado por el servicio
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las invitaciones de entrenadores, entrenadores activos y sedes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setActiveMainTab('coaches')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeMainTab === 'coaches'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Entrenadores
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingInvitations.length}
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveMainTab('groups')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeMainTab === 'groups'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Sedes
            {pendingGroupInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingGroupInvitations.length}
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Sub-tabs para Entrenadores */}
      {activeMainTab === 'coaches' && (
        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveCoachTab('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCoachTab === 'pending'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Pendientes
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingInvitations.length}
                </Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveCoachTab('coaches')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCoachTab === 'coaches'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Mis Entrenadores
            </div>
          </button>
        </div>
      )}

      {/* Sub-tabs para Sedes */}
      {activeMainTab === 'groups' && (
        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveGroupTab('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeGroupTab === 'pending'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Pendientes
              {pendingGroupInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingGroupInvitations.length}
                </Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveGroupTab('my-groups')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeGroupTab === 'my-groups'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mis Sedes
            </div>
          </button>
        </div>
      )}

      {/* Contenido */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando invitaciones...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Invitaciones de Entrenadores - Pendientes */}
          {activeMainTab === 'coaches' && activeCoachTab === 'pending' && (
            <div className="space-y-4">
              {pendingInvitations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No hay invitaciones pendientes</h3>
                    <p className="text-muted-foreground text-sm">
                      Cuando un entrenador te invite, aparecerá aquí
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingInvitations.map((invitation) => (
                  <Card key={invitation.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(invitation.coachName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{invitation.coachName}</CardTitle>
                            <CardDescription>{invitation.coachEmail}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(invitation.invitedAt)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {invitation.invitationMessage && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Mensaje:</strong>
                          </p>
                          <p className="text-sm">{invitation.invitationMessage}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRespondToInvitation(invitation.id, true)}
                          className="flex-1"
                          disabled={respondingToId === invitation.id}
                        >
                          {respondingToId === invitation.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Aceptar
                        </Button>
                        <Button
                          onClick={() => handleRespondToInvitation(invitation.id, false)}
                          variant="destructive"
                          className="flex-1"
                          disabled={respondingToId === invitation.id}
                        >
                          {respondingToId === invitation.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-2" />
                          )}
                          Rechazar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Mis Entrenadores */}
          {activeMainTab === 'coaches' && activeCoachTab === 'coaches' && (
            <div className="space-y-4">
              {myCoaches.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No tienes entrenadores asignados</h3>
                    <p className="text-muted-foreground text-sm">
                      Acepta una invitación para comenzar a trabajar con un entrenador
                    </p>
                  </CardContent>
                </Card>
              ) : (
                myCoaches.map((coach) => {
                  // El relationshipId debería venir del backend
                  // Si no viene, usamos el id del coach como fallback (no ideal, pero funcional)
                  const relationshipId = coach.relationshipId || coach.id;
                  
                  return (
                    <Card key={coach.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(coach.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{coach.name}</CardTitle>
                              <CardDescription>{coach.email}</CardDescription>
                              {coach.phone && (
                                <CardDescription className="text-xs">{coach.phone}</CardDescription>
                              )}
                            </div>
                          </div>
                          <Badge variant="default">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Activo desde {formatDate(coach.linkedSince)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleRemoveCoach(relationshipId)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Eliminar relación
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Invitaciones de Sedes - Pendientes */}
          {activeMainTab === 'groups' && activeGroupTab === 'pending' && (
            <div className="space-y-4">
              {pendingGroupInvitations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No hay invitaciones de sedes pendientes</h3>
                    <p className="text-muted-foreground text-sm">
                      Cuando un entrenador te invite a una sede, aparecerá aquí
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingGroupInvitations.map((invitation) => (
                  <Card key={invitation.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {getInitials(invitation.trainingGroupName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{invitation.trainingGroupName}</CardTitle>
                            <CardDescription>
                              Invitado por {invitation.coachName} ({invitation.coachEmail})
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(invitation.joinedDate)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {invitation.invitationMessage && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Mensaje:</strong>
                          </p>
                          <p className="text-sm">{invitation.invitationMessage}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRespondToGroupInvitation(invitation.id, true)}
                          className="flex-1"
                          disabled={respondingToGroupInvitationId === invitation.id}
                        >
                          {respondingToGroupInvitationId === invitation.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Aceptar
                        </Button>
                        <Button
                          onClick={() => handleRespondToGroupInvitation(invitation.id, false)}
                          variant="destructive"
                          className="flex-1"
                          disabled={respondingToGroupInvitationId === invitation.id}
                        >
                          {respondingToGroupInvitationId === invitation.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-2" />
                          )}
                          Rechazar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Mis Sedes */}
          {activeMainTab === 'groups' && activeGroupTab === 'my-groups' && (
            <div className="space-y-4">
              {myGroups.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No perteneces a ninguna sede</h3>
                    <p className="text-muted-foreground text-sm">
                      Acepta una invitación para comenzar a formar parte de una sede
                    </p>
                  </CardContent>
                </Card>
              ) : (
                myGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(group.trainingGroupName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{group.trainingGroupName}</CardTitle>
                            <CardDescription>
                              Entrenador: {group.coachName} ({group.coachEmail})
                            </CardDescription>
                            {group.description && (
                              <CardDescription className="mt-1">{group.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        <Badge variant="default">
                          <Users className="w-3 h-3 mr-1" />
                          {group.memberCount} miembro(s)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {group.trainingPoints.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Puntos de Entrenamiento:</p>
                          <div className="flex flex-wrap gap-2">
                            {group.trainingPoints.map((point, idx) => (
                              <Badge key={idx} variant="outline">{point}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          Miembro desde {formatDate(group.joinedDate)}
                        </Badge>
                        <Button
                          onClick={() => handleLeaveGroup(group.trainingGroupId)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Abandonar Sede
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

