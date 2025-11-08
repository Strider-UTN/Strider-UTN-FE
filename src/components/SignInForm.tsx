import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ChevronRight, ChevronLeft, Eye, EyeOff, User, UserCheck } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { AuthService } from '../services/authService';

interface User {
  id: string;
  username: string;
  email: string;
  userType: 'athlete' | 'coach';
  realName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  profileImage?: string;
}

type UserType = 'athlete' | 'coach' | null;

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSuccessfulLogin: (user: User) => void;
  userType: UserType;
  onUserTypeSelection: (userType: UserType) => void;
  onBackToUserTypeSelection: () => void;
  onSocialSignUp?: (partialUser: Partial<User>) => void;
}

export function SignInForm({ 
  onSwitchToSignUp, 
  onSuccessfulLogin, 
  userType,
  onUserTypeSelection,
  onBackToUserTypeSelection,
  onSocialSignUp
}: SignInFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType) return;
    
    try {
      // Usar el servicio de autenticación
      const { user } = await AuthService.handleEmailLogin(
        formData.email,
        formData.password,
        userType
      );
      
      onSuccessfulLogin(user);
    } catch (error) {
      console.error('Error en login con email:', error);
      // El toast ya se muestra en AuthService.handleEmailLogin
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!userType) return;
    
    try {
      // Usar el servicio de autenticación
      const { token, userInfo } = await AuthService.handleGoogleLogin(credentialResponse, userType);

      // Construir el objeto User usando el helper, pasando el token para extraer el tema
      const completeUser = AuthService.buildUserFromGoogleInfo(userInfo, userType, token);
      
      onSuccessfulLogin(completeUser);
    } catch (error) {
      console.error('Error en login con Google:', error);
      // El toast ya se muestra en AuthService.handleGoogleLogin
    }
  };

  // Si no se ha seleccionado tipo de usuario, mostrar selector
  if (!userType) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-3">¡Bienvenido de vuelta!</h2>
          <p className="text-lg text-muted-foreground">
            Selecciona tu tipo de perfil para iniciar sesión
          </p>
        </div>

        <div className="space-y-6">
          {/* Opción Atleta */}
          <button
            onClick={() => onUserTypeSelection('athlete')}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-primary rounded-full text-primary-foreground group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-primary mb-1">Soy Atleta</h3>
                <p className="text-sm text-muted-foreground">
                  Acceder a mi entrenamiento personalizado
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>

          {/* Opción Entrenador */}
          <button
            onClick={() => onUserTypeSelection('coach')}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400/8 to-cyan-500/12 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/30 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-cyan-400 rounded-full text-white group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-cyan-600 mb-1">Soy Entrenador</h3>
                <p className="text-sm text-muted-foreground">
                  Gestionar mis atletas y entrenamientos
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-500/60 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-primary hover:underline font-medium"
            >
              Registrarse
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Formulario de inicio de sesión específico por tipo de usuario
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header con botón de regreso */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToUserTypeSelection}
            className="p-1 h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-3xl font-bold text-primary mb-3">
              {userType === 'athlete' ? 'Acceso de Atleta' : 'Acceso de Entrenador'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {userType === 'athlete' 
                ? 'Continúa con tu entrenamiento personalizado'
                : 'Gestiona tus atletas y entrenamientos'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Botón de login social */}
      <div className="space-y-4 mb-6">
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error('Google Login Failed')}
            useOneTap
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O inicia sesión con email
            </span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={userType === 'athlete' ? 'atleta@ejemplo.com' : 'entrenador@ejemplo.com'}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mensaje específico por tipo de usuario */}
        {userType === 'athlete' && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-sm text-primary">
              💪 ¡Prepárate para llevar tu rendimiento al siguiente nivel! 
              Accede a tu plan de entrenamiento personalizado y seguimiento de progreso.
            </p>
          </div>
        )}

        {userType === 'coach' && (
          <div className="p-4 bg-cyan-400/10 rounded-lg border border-cyan-400/20">
            <p className="text-sm text-cyan-700">
              🏃‍♂️ Panel de control completo para gestionar tus atletas, 
              crear planes de entrenamiento y hacer seguimiento del progreso del equipo.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12"
          style={{ 
            backgroundColor: userType === 'athlete' ? 'var(--primary)' : 'var(--accent)',
            color: 'white'
          }}
        >
          Iniciar Sesión
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Enlace de contraseña olvidada */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
      
      {/* Link para registro */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="text-primary hover:underline font-medium"
          >
            Registrarse
          </button>
        </p>
      </div>
    </div>
  );
}