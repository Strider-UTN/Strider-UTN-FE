import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { 
  UserPlus, 
  Users, 
  Search, 
  CheckCircle2, 
  Loader2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { CoachAthleteRelationshipService, AthleteResponseDto } from '../services/coachAthleteRelationshipService';
import { GroupService } from '../services/groupService';
import type { TrainingGroup, TrainingGroupMember } from '../types/groupTypes';

interface InviteAthleteToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TrainingGroup | null;
  onInvitationSent?: () => void;
}

export function InviteAthleteToGroupModal({ 
  isOpen, 
  onClose, 
  group,
  onInvitationSent 
}: InviteAthleteToGroupModalProps) {
  const [athletes, setAthletes] = useState<AthleteResponseDto[]>([]);
  const [groupMembers, setGroupMembers] = useState<TrainingGroupMember[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && group) {
      loadData();
      // Reset state
      setSelectedAthletes(new Set());
      setSearchTerm('');
      setMessage('');
    }
  }, [isOpen, group]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar atletas asignados y miembros del grupo en paralelo
      const [athleteRelationships, members] = await Promise.all([
        CoachAthleteRelationshipService.getMyAthletes('Accepted'),
        GroupService.getGroupMembers(group!.id)
      ]);
      
      setAthletes(athleteRelationships);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener IDs de atletas que ya son miembros del grupo (activos o pendientes)
  const existingMemberIds = new Set(
    groupMembers
      .filter(member => member.status === 'active' || member.status === 'pending')
      .map(member => member.userId)
  );

  const filteredAthletes = athletes.filter(athlete => {
    // Excluir atletas que ya son miembros del grupo
    if (existingMemberIds.has(athlete.id)) {
      return false;
    }
    
    // Aplicar filtro de búsqueda
    const matchesSearch = 
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleToggleAthlete = (athleteId: number) => {
    setSelectedAthletes(prev => {
      const next = new Set(prev);
      if (next.has(athleteId)) {
        next.delete(athleteId);
      } else {
        next.add(athleteId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedAthletes.size === filteredAthletes.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(filteredAthletes.map(a => a.id)));
    }
  };

  const handleSendInvitations = async () => {
    if (!group || selectedAthletes.size === 0) {
      toast.error('Selecciona al menos un atleta para invitar');
      return;
    }

    setIsInviting(true);
    try {
      const invitations = Array.from(selectedAthletes).map(athleteId => 
        GroupService.inviteAthleteToGroup(group.id, athleteId, message || undefined)
      );

      await Promise.all(invitations);

      toast.success(`Invitaciones enviadas a ${selectedAthletes.size} atleta(s)`);
      
      // Reset state
      setSelectedAthletes(new Set());
      setMessage('');
      
      // Callback to refresh parent
      if (onInvitationSent) {
        onInvitationSent();
      }

      onClose();
    } catch (error) {
      console.error('Error al enviar invitaciones:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setIsInviting(false);
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

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invitar Atletas a {group.name}
          </DialogTitle>
          <DialogDescription>
            Selecciona uno o más atletas de tu equipo para invitarlos a esta sede
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message input */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje Personal (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Añade un mensaje personal a las invitaciones..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atletas por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select all button */}
          {filteredAthletes.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredAthletes.length} atleta(s) disponible(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedAthletes.size === filteredAthletes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
            </div>
          )}

          {/* Athletes list */}
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando atletas...</span>
              </CardContent>
            </Card>
          ) : filteredAthletes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  {searchTerm 
                    ? 'No se encontraron atletas' 
                    : athletes.length === 0
                      ? 'No tienes atletas asignados'
                      : 'Todos tus atletas ya son miembros de esta sede'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm 
                    ? 'Intenta con otro término de búsqueda'
                    : athletes.length === 0
                      ? 'Necesitas tener atletas asignados para poder invitarlos a sedes'
                      : 'Todos los atletas asignados ya están en este grupo o tienen una invitación pendiente'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAthletes.map((athlete) => (
                <Card 
                  key={athlete.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedAthletes.has(athlete.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleToggleAthlete(athlete.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <Checkbox
                      checked={selectedAthletes.has(athlete.id)}
                      onCheckedChange={() => handleToggleAthlete(athlete.id)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(athlete.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">{athlete.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3" />
                        {athlete.email}
                      </CardDescription>
                    </div>
                    {selectedAthletes.has(athlete.id) && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedAthletes.size > 0 && (
                <span>{selectedAthletes.size} atleta(s) seleccionado(s)</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isInviting}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendInvitations}
                disabled={selectedAthletes.size === 0 || isInviting}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar Invitaciones ({selectedAthletes.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

