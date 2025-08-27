import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SignUpVisual } from './SignUpVisual';
import { Users, Crown, User, Check, ArrowRight } from 'lucide-react';

interface InviteData {
  groupId: string;
  groupName: string;
  role: 'athlete' | 'coach';
  inviterName: string;
  isValid: boolean;
}

interface InviteRegistrationProps {
  inviteToken: string;
  onSuccessfulRegistration: (userData: any) => void;
  onBackToLogin: () => void;
}

export function InviteRegistration({ 
  inviteToken, 
  onSuccessfulRegistration, 
  onBackToLogin 
}: InviteRegistrationProps) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    realName: ''
  });

  useEffect(() => {
    // Simular validación del token de invitación
    setTimeout(() => {
      // Simular datos de invitación válida
      setInviteData({
        groupId: '1',
        groupName: 'Velocistas Elite',
        role: 'athlete',
        inviterName: 'Carlos Entrenador',
        isValid: true
      });
      setIsLoading(false);
    }, 1500);
  }, [inviteToken]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    setIsRegistering(true);

    // Simular registro exitoso
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newUser = {
      id: Date.now().toString(),
      username: formData.username,
      email: formData.email,
      userType: inviteData?.role || 'athlete',
      realName: formData.realName,
      groupId: inviteData?.groupId
    };

    onSuccessfulRegistration(newUser);
  };

  const getRoleIcon = (role: 'athlete' | 'coach') => {
    return role === 'coach' ? Crown : User;
  };

  const getRoleBadge = (role: 'athlete' | 'coach') => {
    const Icon = getRoleIcon(role);
    return role === 'coach' ? (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Icon className="w-3 h-3 mr-1" />
        Entrenador
      </Badge>
    ) : (
      <Badge variant="outline">
        <Icon className="w-3 h-3 mr-1" />
        Atleta
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <h3 className="font-semibold">Validando Invitación...</h3>
              <p className="text-sm text-muted-foreground">
                Verificando los detalles de tu invitación
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData || !inviteData.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invitación Inválida</CardTitle>
            <CardDescription>
              Este link de invitación no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBackToLogin} className="w-full">
              Volver al Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Visual storytelling */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5">
        <SignUpVisual />
      </div>
      
      {/* Panel derecho - Formulario de registro por invitación */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-bold text-primary mb-2 tracking-tight font-[Poppins] uppercase">STRIDER</h1>
            <p className="text-muted-foreground">
              Te han invitado a unirte
            </p>
          </div>

          {/* Información de la Invitación */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{inviteData.groupName}</h3>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-muted-foreground">Te invita:</span>
                  <span className="text-sm font-medium">{inviteData.inviterName}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-muted-foreground">Como:</span>
                  {getRoleBadge(inviteData.role)}
                </div>
                <div className="flex items-center justify-center text-sm text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  Invitación Válida
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario de Registro */}
          <Card>
            <CardHeader>
              <CardTitle>Completa tu Registro</CardTitle>
              <CardDescription>
                Crea tu cuenta para unirte a la agrupación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="realName">Nombre Completo *</Label>
                  <Input
                    id="realName"
                    placeholder="Tu nombre completo"
                    value={formData.realName}
                    onChange={(e) => handleInputChange('realName', e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario *</Label>
                  <Input
                    id="username"
                    placeholder="nombredeusuario"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Crea una contraseña segura"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                  {formData.password && formData.confirmPassword && 
                   formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    !formData.realName || 
                    !formData.username || 
                    !formData.email || 
                    !formData.password || 
                    formData.password !== formData.confirmPassword ||
                    isRegistering
                  }
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {isRegistering ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-accent-foreground/20 border-t-accent-foreground rounded-full animate-spin"></div>
                      <span>Registrando...</span>
                    </div>
                  ) : (
                    <>
                      Unirse a {inviteData.groupName}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <Button variant="ghost" onClick={onBackToLogin} disabled={isRegistering}>
                    ¿Ya tienes una cuenta? Iniciar Sesión
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}