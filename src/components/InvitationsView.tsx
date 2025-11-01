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
  RefreshCw
} from 'lucide-react';
import { 
  CoachAthleteRelationshipService, 
  CoachAthleteRelationshipResponseDto,
  CoachResponseDto
} from '../services/coachAthleteRelationshipService';
import { toast } from 'sonner';

interface InvitationsViewProps {
  onInvitationResponded?: () => void; // Callback para actualizar el contador en Dashboard
}

export function InvitationsView({ onInvitationResponded }: InvitationsViewProps) {
  const [pendingInvitations, setPendingInvitations] = useState<CoachAthleteRelationshipResponseDto[]>([]);
  const [myCoaches, setMyCoaches] = useState<CoachResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'coaches'>('pending');
  const [respondingToId, setRespondingToId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invitations, coaches] = await Promise.all([
        CoachAthleteRelationshipService.getPendingInvitations(),
        CoachAthleteRelationshipService.getMyCoaches('Accepted')
      ]);
      setPendingInvitations(invitations);
      setMyCoaches(coaches);
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
            Gestiona las invitaciones de entrenadores y tus coaches activos
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

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
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
          onClick={() => setActiveTab('coaches')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'coaches'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Mis Coaches
            {myCoaches.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {myCoaches.length}
              </Badge>
            )}
          </div>
        </button>
      </div>

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
          {/* Invitaciones Pendientes */}
          {activeTab === 'pending' && (
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

          {/* Mis Coaches */}
          {activeTab === 'coaches' && (
            <div className="space-y-4">
              {myCoaches.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No tienes coaches asignados</h3>
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
        </>
      )}
    </div>
  );
}

