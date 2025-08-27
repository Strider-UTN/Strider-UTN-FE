import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Link as LinkIcon, 
  Copy, 
  Trash2, 
  Crown, 
  User,
  Clock,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'athlete' | 'coach';
  status: 'active' | 'pending';
  joinedDate: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'athlete' | 'coach';
  sentDate: string;
  inviteLink: string;
}

interface TrainingGroup {
  id: string;
  name: string;
  trainingPoints: string[];
  createdDate: string;
  athleteCount: number;
}

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TrainingGroup | null;
}

export function GroupMembersModal({ isOpen, onClose, group }: GroupMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      name: 'Carlos Martínez',
      email: 'carlos.martinez@email.com',
      role: 'athlete',
      status: 'active',
      joinedDate: '2024-01-20'
    },
    {
      id: '2',
      name: 'Ana García',
      email: 'ana.garcia@email.com',
      role: 'athlete',
      status: 'active',
      joinedDate: '2024-01-22'
    },
    {
      id: '3',
      name: 'Luis Rodríguez',
      email: 'luis.rodriguez@email.com',
      role: 'coach',
      status: 'active',
      joinedDate: '2024-02-01'
    }
  ]);

  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([
    {
      id: '1',
      email: 'maria.lopez@email.com',
      role: 'athlete',
      sentDate: '2024-03-15',
      inviteLink: 'https://strider.app/invite/abc123'
    }
  ]);

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'athlete' as 'athlete' | 'coach'
  });

  const [activeTab, setActiveTab] = useState('members');
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email.trim()) return;

    setIsInviting(true);

    // Simular envío de invitación
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newInvitation: PendingInvitation = {
      id: Date.now().toString(),
      email: inviteData.email,
      role: inviteData.role,
      sentDate: new Date().toISOString().split('T')[0],
      inviteLink: `https://strider.app/invite/${Date.now()}`
    };

    setPendingInvitations(prev => [...prev, newInvitation]);
    
    // Reset form
    setInviteData({ email: '', role: 'athlete' });
    setIsInviting(false);
    
    toast.success(`Invitación enviada a ${newInvitation.email}`);
    setActiveTab('pending');
  };

  const generateInviteLink = () => {
    const inviteId = Date.now().toString();
    const link = `https://strider.app/invite/${inviteId}?group=${group?.id}&role=${inviteData.role}`;
    
    navigator.clipboard.writeText(link);
    toast.success('Link de invitación copiado al portapapeles');
    
    return link;
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado al portapapeles');
  };

  const cancelInvitation = (inviteId: string) => {
    setPendingInvitations(prev => prev.filter(invite => invite.id !== inviteId));
    toast.success('Invitación cancelada');
  };

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
    toast.success('Miembro removido de la sede');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: 'athlete' | 'coach') => {
    return role === 'coach' ? Crown : User;
  };

  const getRoleBadge = (role: 'athlete' | 'coach') => {
    return role === 'coach' ? (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Crown className="w-3 h-3 mr-1" />
        Entrenador
      </Badge>
    ) : (
      <Badge variant="outline">
        <User className="w-3 h-3 mr-1" />
        Atleta
      </Badge>
    );
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Users className="w-5 h-5 mr-2" />
            Gestionar Miembros - {group.name}
          </DialogTitle>
          <DialogDescription>
            Administra los miembros de tu sede e invita nuevos usuarios.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Miembros ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invitar
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendientes ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Miembros Activos */}
          <TabsContent value="members" className="space-y-4">
            <div className="space-y-3">
              {members.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                return (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{member.name}</h4>
                              {getRoleBadge(member.role)}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Se unió el {formatDate(member.joinedDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeMember(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Formulario de Invitación */}
          <TabsContent value="invite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Invitar por Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email del Usuario *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={inviteData.email}
                      onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      disabled={isInviting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rol en la Sede *</Label>
                    <Select 
                      value={inviteData.role} 
                      onValueChange={(value: 'athlete' | 'coach') => 
                        setInviteData(prev => ({ ...prev, role: value }))
                      }
                      disabled={isInviting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="athlete">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Atleta
                          </div>
                        </SelectItem>
                        <SelectItem value="coach">
                          <div className="flex items-center">
                            <Crown className="w-4 h-4 mr-2" />
                            Entrenador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={!inviteData.email.trim() || isInviting}
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    {isInviting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-accent-foreground/20 border-t-accent-foreground rounded-full animate-spin"></div>
                        <span>Enviando Invitación...</span>
                      </div>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Invitación
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Generar Link de Invitación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rol para el Link</Label>
                    <Select 
                      value={inviteData.role} 
                      onValueChange={(value: 'athlete' | 'coach') => 
                        setInviteData(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="athlete">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Atleta
                          </div>
                        </SelectItem>
                        <SelectItem value="coach">
                          <div className="flex items-center">
                            <Crown className="w-4 h-4 mr-2" />
                            Entrenador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={generateInviteLink}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Generar y Copiar Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitaciones Pendientes */}
          <TabsContent value="pending" className="space-y-4">
            {pendingInvitations.length > 0 ? (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{invitation.email}</span>
                            {getRoleBadge(invitation.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Enviado el {formatDate(invitation.sentDate)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Link: {invitation.inviteLink}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyInviteLink(invitation.inviteLink)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => cancelInvitation(invitation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <CardContent>
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No hay invitaciones pendientes</h3>
                  <p className="text-muted-foreground mb-4">
                    Las invitaciones que envíes aparecerán aquí hasta que sean aceptadas.
                  </p>
                  <Button onClick={() => setActiveTab('invite')} variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar Primera Invitación
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}