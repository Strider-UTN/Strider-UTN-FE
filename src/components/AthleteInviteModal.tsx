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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

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
    name: '',
    personalMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const generateInviteLink = () => {
    // Simular generación de link de invitación
    const inviteToken = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `${window.location.origin}?invite=${inviteToken}`;
  };

  const handleSendInvite = async () => {
    // Validaciones
    if (!inviteData.email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    if (!inviteData.name.trim()) {
      toast.error('El nombre del atleta es obligatorio');
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
      // Simular envío de invitación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedLink = generateInviteLink();
      setInviteLink(generatedLink);
      
      toast.success('Invitación enviada exitosamente');
    } catch (error) {
      toast.error('Error al enviar la invitación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Link copiado al portapapeles');
    }
  };

  const handleClose = () => {
    setInviteData({
      email: '',
      name: '',
      personalMessage: ''
    });
    setInviteLink(null);
    onClose();
  };

  const defaultMessage = `Hola ${inviteData.name || '[Nombre del atleta]'},

${coachName} te ha invitado a unirte a Strider como atleta. 

Strider es una plataforma integral de entrenamiento donde podrás:
• Ver tus planificaciones de entrenamiento personalizadas
• Subir y analizar tus entrenamientos
• Recibir feedback detallado de tu progreso
• Comunicarte directamente con tu entrenador

Para completar tu registro, simplemente haz clic en el link de invitación que aparecerá en este email.

¡Esperamos verte pronto en Strider!

Saludos,
El equipo de Strider`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invitar Atleta
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por email a un atleta para que se una a tu equipo
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="athleteName">Nombre del Atleta *</Label>
                    <Input
                      id="athleteName"
                      value={inviteData.name}
                      onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre y apellidos"
                    />
                  </div>

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
                      />
                    </div>
                  </div>
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
                  <Label htmlFor="personalMessage">Mensaje Personal (Opcional)</Label>
                  <Textarea
                    id="personalMessage"
                    value={inviteData.personalMessage}
                    onChange={(e) => setInviteData(prev => ({ ...prev, personalMessage: e.target.value }))}
                    placeholder="Agrega un mensaje personal..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este mensaje se agregará al inicio del email de invitación
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-medium mb-2">Vista previa del mensaje:</p>
                  <div className="text-sm text-muted-foreground space-y-2 max-h-40 overflow-y-auto">
                    {inviteData.personalMessage && (
                      <div className="p-3 bg-accent/10 rounded border-l-2 border-accent">
                        <p className="font-medium text-accent-foreground">Mensaje personal:</p>
                        <p className="mt-1">{inviteData.personalMessage}</p>
                      </div>
                    )}
                    <div className="whitespace-pre-line">
                      {defaultMessage}
                    </div>
                  </div>
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
                    <h3 className="text-lg font-medium">¡Invitación Enviada!</h3>
                    <p className="text-muted-foreground">
                      Se ha enviado una invitación a <strong>{inviteData.email}</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Link de Invitación</CardTitle>
                <CardDescription>
                  También puedes compartir este link directamente con el atleta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este link expirará en 7 días
                </p>
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
                    El atleta recibirá un email con instrucciones para completar su registro. 
                    Una vez que se registre, aparecerá automáticamente en tu lista de atletas.
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
            {inviteLink ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!inviteLink && (
            <Button onClick={handleSendInvite} disabled={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}