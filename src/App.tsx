import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SignUpForm } from './components/SignUpForm';
import { SignInForm } from './components/SignInForm';
import { SignUpVisual } from './components/SignUpVisual';
import { Dashboard } from './components/Dashboard';
import { InviteRegistration } from './components/InviteRegistration';
import { Toaster } from './components/ui/sonner';

type AuthMode = 'signin' | 'signup' | 'invite' | 'social-profile';
type UserType = 'athlete' | 'coach' | null;

interface User {
  id: string;
  username: string;
  email: string;
  userType: 'athlete' | 'coach';
  realName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string; // Formato DD/MM para atletas
  sex?: string; // Para atletas
  location?: string;
  bio?: string;
  profileImage?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    units?: 'metric' | 'imperial';
    notifications?: {
      email: boolean;
    };
  };
  // Información del entrenador coordinador (solo para atletas)
  currentCoach?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    linkedSince?: string; // Fecha de vinculación
  };
  // Ficha física para atletas
  physicalProfile?: {
    yearsOfExperience: number;
    trainingVolume: {
      weekly?: number;
      monthly?: number;
      unit: 'km' | 'miles';
    };
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalInfo: {
      healthInsurance?: {
        provider: string;
        memberNumber: string;
      };
      medicalClearance: {
        hasValidClearance: boolean;
        lastCheckupDate?: string;
        expiryDate?: string;
        isExpired?: boolean;
      };
    };
  };
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [signInUserType, setSignInUserType] = useState<UserType>(null);
  const [socialUser, setSocialUser] = useState<Partial<User> | null>(null);

  // Aplicar tema basado en las preferencias del usuario
  useEffect(() => {
    const root = window.document.documentElement;
    const theme = currentUser?.preferences?.theme || 'light';
    
    // Remover clases anteriores
    root.classList.remove('light', 'dark');
    
    // Agregar clase de tema
    root.classList.add(theme);
  }, [currentUser?.preferences?.theme]);

  const switchToSignUp = () => {
    setAuthMode('signup');
    setSignInUserType(null);
  };
  
  const switchToSignIn = () => {
    setAuthMode('signin');
    setSignInUserType(null);
  };
  
  // Simular detección de invitación en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invite = urlParams.get('invite');
    if (invite) {
      setInviteToken(invite);
      setAuthMode('invite');
    }
  }, []);

  const handleSuccessfulAuth = (userData: User) => {
    // Asegurar que siempre tenga preferencias con tema por defecto
    const userWithDefaults: User = {
      ...userData,
      preferences: {
        theme: 'light', // Por defecto siempre claro
        units: 'metric',
        notifications: {
          email: true
        },
        ...userData.preferences
      },
      // Agregar entrenador coordinador de ejemplo para atletas (en producción vendría del backend)
      currentCoach: userData.userType === 'athlete' ? {
        id: 'coach-001',
        name: 'Carlos Martínez',
        email: 'carlos.martinez@strider.com',
        phone: '+34 666 777 888',
        linkedSince: '2024-03-15'
      } : undefined
    };
    
    setCurrentUser(userWithDefaults);
    setIsAuthenticated(true);
    setSocialUser(null); // Limpiar datos sociales temporales
  };

  const handleSocialSignUp = (partialUserData: Partial<User>) => {
    if (partialUserData.userType === 'athlete') {
      // Para atletas, pasar al formulario de perfil físico
      setSocialUser(partialUserData);
      setAuthMode('social-profile');
    } else {
      // Para entrenadores, registro completo inmediato
      const completeUser: User = {
        id: partialUserData.id!,
        username: partialUserData.username!,
        email: partialUserData.email!,
        userType: partialUserData.userType!,
        realName: partialUserData.realName!,
        firstName: partialUserData.firstName,
        lastName: partialUserData.lastName,
        location: partialUserData.location
      };
      handleSuccessfulAuth(completeUser);
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleToggleTheme = () => {
    if (currentUser) {
      const newTheme = currentUser.preferences?.theme === 'dark' ? 'light' : 'dark';
      const updatedUser: User = {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          theme: newTheme
        }
      };
      setCurrentUser(updatedUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthMode('signin');
    setInviteToken(null);
    setSignInUserType(null);
    setSocialUser(null);
    
    // Restaurar tema por defecto al cerrar sesión
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    
    // Limpiar URL de invitación
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleBackToLogin = () => {
    setAuthMode('signin');
    setInviteToken(null);
    setSignInUserType(null);
    setSocialUser(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleSignInUserTypeSelection = (userType: UserType) => {
    setSignInUserType(userType);
  };

  const handleBackToUserTypeSelection = () => {
    setSignInUserType(null);
  };

  // Si el usuario está autenticado, mostrar dashboard
  if (isAuthenticated && currentUser) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
        <Toaster />
        <Dashboard 
          onLogout={handleLogout} 
          userType={currentUser.userType}
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          theme={currentUser.preferences?.theme || 'light'}
          onToggleTheme={handleToggleTheme}
        />
      </GoogleOAuthProvider>
    );
  }

  // Si hay una invitación, mostrar el formulario de registro por invitación
  if (authMode === 'invite' && inviteToken) {
    return (
      <>
        <Toaster />
        <InviteRegistration
          inviteToken={inviteToken}
          onSuccessfulRegistration={handleSuccessfulAuth}
          onBackToLogin={handleBackToLogin}
        />
      </>
    );
  }

  // Si no está autenticado, mostrar pantallas de login/registro
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
      <Toaster />
      <div className="min-h-screen flex">
        {/* Panel izquierdo - Visual storytelling */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5">
          <SignUpVisual />
        </div>
        
        {/* Panel derecho - Formulario */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justificar-center p-6 lg:p-12 bg-background">
          <div className="w-full max-w-md">
            {/* Renderizar el formulario según el modo */}
            {authMode === 'signin' ? (
              <SignInForm 
                onSwitchToSignUp={switchToSignUp}
                onSuccessfulLogin={handleSuccessfulAuth}
                userType={signInUserType}
                onUserTypeSelection={handleSignInUserTypeSelection}
                onBackToUserTypeSelection={handleBackToUserTypeSelection}
                onSocialSignUp={handleSocialSignUp}
              />
            ) : authMode === 'signup' ? (
              <SignUpForm 
                onSwitchToSignIn={switchToSignIn}
                onSuccessfulSignUp={handleSuccessfulAuth}
                onSocialSignUp={handleSocialSignUp}
              />
            ) : authMode === 'social-profile' && socialUser ? (
              <SignUpForm 
                onSwitchToSignIn={switchToSignIn}
                onSuccessfulSignUp={handleSuccessfulAuth}
                onSocialSignUp={handleSocialSignUp}
                socialUser={socialUser}
                skipToPhysicalProfile={true}
              />
            ) : null}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}