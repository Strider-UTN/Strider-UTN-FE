import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  Mail, 
  Send, 
  X,
  Users,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { CoachAthleteRelationshipService } from '../services/coachAthleteRelationshipService';

interface AthleteInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName: string;
}

export function AthleteInviteModal({
  isOpen,
  onClose,
  coachName
}: AthleteInviteModalProps) {
  const [inviteData, setInviteData] = useState({
    email: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);

  const handleSendInvite = async () => {
    // Validaciones
    if (!inviteData.email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      toast.error('Por favor, ingresa un email válido');
      return;
    }

    setIsLoading(true);

    try {
      await CoachAthleteRelationshipService.inviteAthlete({
        athleteEmail: inviteData.email.trim(),
        message: inviteData.message.trim() || undefined
      });

      setInvitationSent(true);
      // El toast ya se muestra en el servicio
    } catch (error) {
      // El error ya fue manejado por el servicio
      console.error('Error al enviar invitación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteData({
      email: '',
      message: ''
    });
    setInvitationSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invitar Atleta
          </DialogTitle>
          <DialogDescription>
            Invita a un atleta por email para que se una a tu equipo. El atleta verá la invitación en su panel.
          </DialogDescription>
        </DialogHeader>

        {!invitationSent ? (
          <div className="space-y-6">
            {/* Información del atleta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Información del Atleta
                </CardTitle>
                <CardDescription>
                  Datos básicos del atleta a invitar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="athleteEmail">Email del Atleta *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="athleteEmail"
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="atleta@ejemplo.com"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El atleta debe tener una cuenta registrada en Strider
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mensaje de invitación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5" />
                  Mensaje de Invitación
                </CardTitle>
                <CardDescription>
                  Personaliza el mensaje que recibirá el atleta (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje Personal (Opcional)</Label>
                  <Textarea
                    id="message"
                    value={inviteData.message}
                    onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Agrega un mensaje personal para la invitación..."
                    rows={3}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este mensaje se mostrará al atleta cuando vea la invitación en su panel
                  </p>
                </div>


              </CardContent>
            </Card>
          </div>
        ) : (
          /* Confirmación de envío */
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">¡Invitación Creada!</h3>
                    <p className="text-muted-foreground">
                      Se ha creado una invitación para <strong>{inviteData.email}</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">
                    Próximos pasos
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    El atleta verá la invitación en su panel de "Invitaciones" dentro de la aplicación. 
                    Puede aceptar o rechazar la invitación desde allí.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            {invitationSent ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!invitationSent && (
            <Button onClick={handleSendInvite} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Invitación
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}