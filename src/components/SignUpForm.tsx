import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, User, UserCheck, Activity, Shield, Phone } from 'lucide-react';
import { SocialProfileCompletion } from './SocialProfileCompletion';
import { AuthService } from '../services/authService';
import { toast } from 'sonner';

type UserType = 'athlete' | 'coach' | null;

interface AthleteFormData {
  // Paso 1: Información de cuenta
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  
  // Paso 2: Información física básica
  birthDate: string; // Formato DD/MM (sin año)
  sex: string;
  height: string;
  weight: string;
  location: string;
  
  // Paso 3: Ficha Atlética
  trainingStartDate: string; // Formato: YYYY-MM (mes y año de inicio)
  volumeType: 'weekly' | 'monthly';
  weeklyVolume: string;
  monthlyVolume: string;
  
  // Paso 4: Contacto de emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  // Paso 5: Información médica y finalizar
  healthInsuranceProvider: string;
  healthInsuranceMemberNumber: string;
  lastCheckupDate: string;
  medicalConditions: string;
  notifications: boolean;
}

interface CoachFormData {
  // Paso 1: Información de cuenta
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  birthDate: string; // Formato YYYY-MM-DD o Date
  gender: string;
  address: string;
  
  // Paso 2: información adicional
  location: string;
}

const ATHLETE_STEPS = [
  { id: 1, title: 'Información de Cuenta', description: 'Credenciales y datos personales' },
  { id: 2, title: 'Perfil Físico', description: 'Datos antropométricos y ubicación' },
  { id: 3, title: 'Experiencia Atlética', description: 'Años de experiencia y volumen de entrenamiento' },
  { id: 4, title: 'Contacto de Emergencia', description: 'Información de contacto para emergencias' },
  { id: 5, title: 'Información Médica', description: 'Apto físico y condiciones de salud' }
];

const COACH_STEPS = [
  { id: 1, title: 'Información de Cuenta', description: 'Credenciales y datos personales' },
  { id: 2, title: 'Finalizar Registro', description: 'Información adicional del perfil' }
];

const LOCATION_OPTIONS = [
  { value: 'argentina', label: 'Argentina' },
  { value: 'bolivia', label: 'Bolivia' },
  { value: 'brasil', label: 'Brasil' },
  { value: 'chile', label: 'Chile' },
  { value: 'colombia', label: 'Colombia' },
  { value: 'costa-rica', label: 'Costa Rica' },
  { value: 'cuba', label: 'Cuba' },
  { value: 'ecuador', label: 'Ecuador' },
  { value: 'el-salvador', label: 'El Salvador' },
  { value: 'espana', label: 'España' },
  { value: 'guatemala', label: 'Guatemala' },
  { value: 'honduras', label: 'Honduras' },
  { value: 'mexico', label: 'México' },
  { value: 'nicaragua', label: 'Nicaragua' },
  { value: 'panama', label: 'Panamá' },
  { value: 'paraguay', label: 'Paraguay' },
  { value: 'peru', label: 'Perú' },
  { value: 'puerto-rico', label: 'Puerto Rico' },
  { value: 'republica-dominicana', label: 'República Dominicana' },
  { value: 'uruguay', label: 'Uruguay' },
  { value: 'venezuela', label: 'Venezuela' },
  { value: 'otro', label: 'Otro país' }
];

const RELATIONSHIP_OPTIONS = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hermano', label: 'Hermano/a' },
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'pareja', label: 'Pareja' },
  { value: 'amigo', label: 'Amigo/a' },
  { value: 'otro', label: 'Otro' }
];

const SEX_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no-especifica', label: 'Prefiero no especificar' }
];

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
  // Ficha física para atletas
  physicalProfile?: {
    yearsOfExperience: number;
    trainingStartDate?: string; // Formato: YYYY-MM
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

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onSuccessfulSignUp: (user: User) => void;
  onSocialSignUp?: (partialUser: Partial<User>) => void;
  socialUser?: Partial<User>;
  skipToPhysicalProfile?: boolean;
}

export function SignUpForm({ onSwitchToSignIn, onSuccessfulSignUp, onSocialSignUp, socialUser, skipToPhysicalProfile }: SignUpFormProps) {
  // Siempre inicializar todos los hooks en el mismo orden
  const [userType, setUserType] = useState<UserType>(socialUser?.userType || null);
  const [currentStep, setCurrentStep] = useState(skipToPhysicalProfile ? 2 : 1);
  const [athleteFormData, setAthleteFormData] = useState<AthleteFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    birthDate: '',
    sex: '',
    height: '',
    weight: '',
    location: '',
    trainingStartDate: '',
    volumeType: 'weekly',
    weeklyVolume: '',
    monthlyVolume: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    healthInsuranceProvider: '',
    healthInsuranceMemberNumber: '',
    lastCheckupDate: '',
    medicalConditions: '',
    notifications: true
  });
  
  const [coachFormData, setCoachFormData] = useState<CoachFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    birthDate: '',
    gender: '',
    address: '',
    location: ''
  });

  // Si viene de registro social, prellenar algunos datos
  useEffect(() => {
    if (socialUser && skipToPhysicalProfile) {
      if (userType === 'athlete') {
        setAthleteFormData(prev => ({
          ...prev,
          username: socialUser.username || '',
          email: socialUser.email || '',
          realName: socialUser.realName || '',
          password: 'social_login',
          confirmPassword: 'social_login'
        }));
      } else {
        setCoachFormData(prev => ({
          ...prev,
          username: socialUser.username || '',
          email: socialUser.email || '',
          realName: socialUser.realName || '',
          password: 'social_login',
          confirmPassword: 'social_login'
        }));
      }
    }
  }, [socialUser, skipToPhysicalProfile, userType]);

  const updateAthleteFormData = (field: keyof AthleteFormData, value: string | boolean) => {
    setAthleteFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCoachFormData = (field: keyof CoachFormData, value: string | boolean) => {
    setCoachFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    const maxSteps = userType === 'athlete' ? 5 : 2;
    if (currentStep < maxSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Registro con ${provider} como ${userType}`);
    
    // Simular registro exitoso con Google
    const partialUser: Partial<User> = {
      id: Date.now().toString(),
      username: 'google_user',
      email: userType === 'athlete' ? 'atleta@google.com' : 'entrenador@google.com',
      userType: userType || 'athlete',
      realName: userType === 'athlete' ? 'María López Santos' : 'José Martín González',
      firstName: userType === 'athlete' ? 'María' : 'José',
      lastName: userType === 'athlete' ? 'López Santos' : 'Martín González'
    };
    
    if (onSocialSignUp) {
      onSocialSignUp(partialUser);
    } else {
      onSuccessfulSignUp(partialUser as User);
    }
  };

  const calculateExpiryDate = (lastCheckupDate: string): string => {
    if (!lastCheckupDate) return '';
    const checkupDate = new Date(lastCheckupDate);
    const expiryDate = new Date(checkupDate);
    expiryDate.setFullYear(checkupDate.getFullYear() + 1);
    return expiryDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentFormData = userType === 'athlete' ? athleteFormData : coachFormData;
    
    if (userType === 'athlete') {
      console.log('Registro de atleta enviado:', athleteFormData);
      
      // Calcular años de experiencia desde trainingStartDate
      let yearsOfExperience = 0;
      if (athleteFormData.trainingStartDate) {
        try {
          const [year, month] = athleteFormData.trainingStartDate.split('-').map(Number);
          const startDate = new Date(year, month - 1, 1);
          const today = new Date();
          yearsOfExperience = today.getFullYear() - startDate.getFullYear();
          const monthDiff = today.getMonth() - startDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startDate.getDate())) {
            yearsOfExperience--;
          }
          yearsOfExperience = Math.max(0, yearsOfExperience);
        } catch (error) {
          console.error('Error al calcular años de experiencia:', error);
          yearsOfExperience = 0;
        }
      }
      
      // Crear perfil físico completo para atletas
      const physicalProfile = {
        yearsOfExperience: yearsOfExperience,
        trainingStartDate: athleteFormData.trainingStartDate,
        trainingVolume: {
          weekly: athleteFormData.volumeType === 'weekly' ? parseInt(athleteFormData.weeklyVolume) || 0 : undefined,
          monthly: athleteFormData.volumeType === 'monthly' ? parseInt(athleteFormData.monthlyVolume) || 0 : undefined,
          unit: 'km' as const
        },
        emergencyContact: {
          name: athleteFormData.emergencyContactName,
          phone: athleteFormData.emergencyContactPhone,
          relationship: athleteFormData.emergencyContactRelationship
        },
        medicalInfo: {
          healthInsurance: {
            provider: athleteFormData.healthInsuranceProvider,
            memberNumber: athleteFormData.healthInsuranceMemberNumber
          },
          medicalClearance: {
            hasValidClearance: !!athleteFormData.lastCheckupDate,
            lastCheckupDate: athleteFormData.lastCheckupDate,
            expiryDate: calculateExpiryDate(athleteFormData.lastCheckupDate),
            isExpired: athleteFormData.lastCheckupDate ? new Date(calculateExpiryDate(athleteFormData.lastCheckupDate)) < new Date() : false
          }
        }
      };

      const newUser: User = {
        id: Date.now().toString(),
        username: currentFormData.username,
        email: currentFormData.email,
        userType: userType!,
        realName: currentFormData.realName,
        dateOfBirth: athleteFormData.birthDate,
        sex: athleteFormData.sex,
        location: athleteFormData.location,
        physicalProfile: physicalProfile,
        preferences: {
          theme: 'light',
          units: 'metric',
          notifications: {
            email: athleteFormData.notifications
          }
        }
      };
      
      onSuccessfulSignUp(newUser);
    } else {
      // Validar que las contraseñas coincidan
      if (coachFormData.password !== coachFormData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      // Validar campos requeridos
      if (!coachFormData.birthDate || !coachFormData.gender || !coachFormData.address) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      try {
        // Convertir birthDate string a Date
        // Si viene en formato YYYY-MM-DD, usarlo directamente
        // Si viene en otro formato, intentar parsearlo
        const birthDate = new Date(coachFormData.birthDate);
        
        if (isNaN(birthDate.getTime())) {
          toast.error('Fecha de nacimiento inválida');
          return;
        }

        // Registrar el coach en el backend
        await AuthService.createCoach({
          username: coachFormData.username,
          fullName: coachFormData.realName,
          email: coachFormData.email,
          password: coachFormData.password,
          birthDate: birthDate,
          address: coachFormData.address,
          gender: coachFormData.gender as 'masculino' | 'femenino' | 'no-especifica'
        });

        // Crear el objeto User para el frontend
        const newUser: User = {
          id: Date.now().toString(),
          username: coachFormData.username,
          email: coachFormData.email,
          userType: 'coach',
          realName: coachFormData.realName,
          location: coachFormData.location,
          preferences: {
            theme: 'light',
            units: 'metric',
            notifications: {
              email: true
            }
          }
        };
        
        onSuccessfulSignUp(newUser);
      } catch (error) {
        console.error('Error al registrar coach:', error);
        // El error ya se maneja automáticamente en apiClient.ts
      }
    }
  };

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type);
    setCurrentStep(skipToPhysicalProfile ? 2 : 1);
  };

  const handleBackToUserType = () => {
    if (skipToPhysicalProfile) {
      onSwitchToSignIn(); // Si viene de social, volver al login
    } else {
      setUserType(null);
      setCurrentStep(1);
    }
  };

  // Renderizado condicional al final, después de todos los hooks
  
  // Si viene del registro social para completar perfil físico de atleta
  if (skipToPhysicalProfile && socialUser && socialUser.userType === 'athlete') {
    return (
      <SocialProfileCompletion
        socialUser={socialUser}
        onComplete={onSuccessfulSignUp}
        onBackToLogin={onSwitchToSignIn}
      />
    );
  }

  // Si no se ha seleccionado tipo de usuario, mostrar selector
  if (!userType) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-3">¡Bienvenido a Strider!</h2>
          <p className="text-lg text-muted-foreground">
            Selecciona tu tipo de perfil para comenzar
          </p>
        </div>

        <div className="space-y-6">
          {/* Opción 1: Estilo Card con gradiente y sombra */}
          <button
            onClick={() => handleUserTypeSelection('athlete')}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-primary rounded-full text-primary-foreground group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-primary mb-1">Soy Atleta</h3>
                <p className="text-sm text-muted-foreground">
                  Busco entrenamiento personalizado
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>

          <button
            onClick={() => handleUserTypeSelection('coach')}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400/8 to-cyan-500/12 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/30 hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-cyan-400 rounded-full text-white group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-cyan-600 mb-1">Soy Entrenador</h3>
                <p className="text-sm text-muted-foreground">
                  Quiero entrenar y gestionar atletas
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-500/60 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-primary hover:underline font-medium"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    );
  }

  const steps = userType === 'athlete' ? ATHLETE_STEPS : COACH_STEPS;
  const maxSteps = steps.length;
  const progress = (currentStep / maxSteps) * 100;
  const formData = userType === 'athlete' ? athleteFormData : coachFormData;
  const updateFormData = userType === 'athlete' ? updateAthleteFormData : updateCoachFormData;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header con progreso */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToUserType}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-3xl font-bold text-primary">
              {userType === 'athlete' ? 'Registro de Atleta' : 'Registro de Entrenador'}
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            Paso {currentStep} de {maxSteps}
          </span>
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        <div className="text-center">
          <h3 className="font-semibold text-primary">{steps[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
        </div>
      </div>



      {/* Formulario */}
      <form 
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          const maxSteps = userType === 'athlete' ? 5 : 2;
          if (currentStep < maxSteps) {
            e.preventDefault();
            e.stopPropagation();
            // No avanzar paso desde aquí, solo prevenir submit
            // El botón "Siguiente" manejará el avance de paso
          } else {
            handleSubmit(e);
          }
        }} 
        className="space-y-6"
      >
        {/* Paso 1: Información de cuenta */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                placeholder={userType === 'athlete' ? 'atletarunner123' : 'coach_martinez'}
                value={formData.username}
                onChange={(e) => updateFormData('username', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="realName">Nombre Real</Label>
              <Input
                id="realName"
                placeholder="Juan Carlos Pérez"
                value={formData.realName}
                onChange={(e) => updateFormData('realName', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                required
              />
            </div>

            {/* Campos adicionales solo para Coach */}
            {userType === 'coach' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={coachFormData.birthDate}
                    onChange={(e) => updateCoachFormData('birthDate', e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select 
                    value={coachFormData.gender} 
                    onValueChange={(value: string) => updateCoachFormData('gender', value)}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEX_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Calle, número, ciudad"
                    value={coachFormData.address}
                    onChange={(e) => updateCoachFormData('address', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dirección completa para contacto y ubicación
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Paso 2 para Atletas: Información física básica */}
        {currentStep === 2 && userType === 'athlete' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de Nacimiento (DD/MM)</Label>
              <Input
                id="birthDate"
                type="text"
                placeholder="25/12"
                pattern="[0-9]{1,2}/[0-9]{1,2}"
                title="Formato: DD/MM (ejemplo: 25/12)"
                value={athleteFormData.birthDate}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir solo números y barra
                  if (/^[0-9/]*$/.test(value) && value.length <= 5) {
                    updateAthleteFormData('birthDate', value);
                  }
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Solo día y mes (ejemplo: 25/12)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sexo</Label>
              <Select 
                value={athleteFormData.sex} 
                onValueChange={(value: string) => updateAthleteFormData('sex', value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tu sexo" />
                </SelectTrigger>
                <SelectContent>
                  {SEX_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">              
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  min="100"
                  max="250"
                  value={athleteFormData.height}
                  onChange={(e) => updateAthleteFormData('height', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  min="30"
                  max="200"
                  value={athleteFormData.weight}
                  onChange={(e) => updateAthleteFormData('weight', e.target.value)}
                  required
                />
              </div>
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Select 
                value={athleteFormData.location} 
                onValueChange={(value: string) => updateAthleteFormData('location', value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nos ayuda a conectarte con entrenadores locales
              </p>
            </div>
          </div>
        )}

        {/* Paso 3 para Atletas: Experiencia Atlética */}
        {currentStep === 3 && userType === 'athlete' && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center mb-2">
                <Activity className="w-5 h-5 mr-2 text-accent" />
                <h4 className="font-semibold text-primary">Tu Experiencia Atlética</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta información nos ayuda a personalizar tu plan de entrenamiento
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trainingStartDate">Fecha de Inicio de Entrenamiento</Label>
                <Input
                  id="trainingStartDate"
                  type="month"
                  value={athleteFormData.trainingStartDate}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    updateAthleteFormData('trainingStartDate', startDate);
                  }}
                  required
                />
                {athleteFormData.trainingStartDate && (() => {
                  try {
                    const [year, month] = athleteFormData.trainingStartDate.split('-').map(Number);
                    const startDate = new Date(year, month - 1, 1);
                    const today = new Date();
                    let years = today.getFullYear() - startDate.getFullYear();
                    const monthDiff = today.getMonth() - startDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startDate.getDate())) {
                      years--;
                    }
                    const yearsDisplay = Math.max(0, years);
                    return (
                      <p className="text-xs text-muted-foreground">
                        Experiencia aproximada: {yearsDisplay} {yearsDisplay === 1 ? 'año' : 'años'}
                      </p>
                    );
                  } catch {
                    return null;
                  }
                })()}
                <p className="text-xs text-muted-foreground">
                  Selecciona el mes y año aproximado en que comenzaste a entrenar
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="volumeType">Tipo de Volumen de Entrenamiento</Label>
                  <Select 
                    value={athleteFormData.volumeType} 
                    onValueChange={(value: 'weekly' | 'monthly') => updateAthleteFormData('volumeType', value)}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona tipo de volumen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Elige cómo prefieres reportar tu volumen de entrenamiento
                  </p>
                </div>

                {athleteFormData.volumeType === 'weekly' ? (
                  <div className="space-y-2">
                    <Label htmlFor="weeklyVolume">Volumen Semanal (km)</Label>
                    <Input
                      id="weeklyVolume"
                      type="number"
                      placeholder="40"
                      min="0"
                      max="200"
                      value={athleteFormData.weeklyVolume}
                      onChange={(e) => updateAthleteFormData('weeklyVolume', e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Kilómetros que corres en una semana típica
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="monthlyVolume">Volumen Mensual (km)</Label>
                    <Input
                      id="monthlyVolume"
                      type="number"
                      placeholder="160"
                      min="0"
                      max="800"
                      value={athleteFormData.monthlyVolume}
                      onChange={(e) => updateAthleteFormData('monthlyVolume', e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Kilómetros que corres en un mes típico
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paso 4 para Atletas: Contacto de emergencia */}
        {currentStep === 4 && userType === 'athlete' && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center mb-2">
                <Phone className="w-5 h-5 mr-2 text-accent" />
                <h4 className="font-semibold text-primary">Contacto de Emergencia</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Información de contacto en caso de emergencias durante entrenamientos
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nombre Completo</Label>
                <Input
                  id="emergencyContactName"
                  placeholder="María García López"
                  value={athleteFormData.emergencyContactName}
                  onChange={(e) => updateAthleteFormData('emergencyContactName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Teléfono de Emergencia</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  placeholder="+34 612 345 678"
                  value={athleteFormData.emergencyContactPhone}
                  onChange={(e) => updateAthleteFormData('emergencyContactPhone', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relación</Label>
                <Select 
                  value={athleteFormData.emergencyContactRelationship} 
                  onValueChange={(value: string) => updateAthleteFormData('emergencyContactRelationship', value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona relación" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Paso 5 para Atletas: Información médica y finalizar */}
        {currentStep === 5 && userType === 'athlete' && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="w-5 h-5 mr-2 text-accent" />
                <h4 className="font-semibold text-primary">Información Médica</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Información confidencial para tu seguridad y planificación de entrenamientos
              </p>
            </div>

            <div className="space-y-4">
              {/* Cobertura médica */}
              <div className="space-y-3">
                <h5 className="font-medium">Cobertura Médica</h5>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="healthInsuranceProvider">Prepaga / Obra Social</Label>
                    <Input
                      id="healthInsuranceProvider"
                      placeholder="Ej: Osde, Swiss Medical, Galeno"
                      value={athleteFormData.healthInsuranceProvider}
                      onChange={(e) => updateAthleteFormData('healthInsuranceProvider', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="healthInsuranceMemberNumber">Número de Afiliado</Label>
                    <Input
                      id="healthInsuranceMemberNumber"
                      placeholder="123456789"
                      value={athleteFormData.healthInsuranceMemberNumber}
                      onChange={(e) => updateAthleteFormData('healthInsuranceMemberNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Apto físico */}
              <div className="space-y-3">
                <h5 className="font-medium">Apto Físico</h5>
                <div className="space-y-2">
                  <Label htmlFor="lastCheckupDate">Fecha del Último Chequeo Médico</Label>
                  <Input
                    id="lastCheckupDate"
                    type="date"
                    value={athleteFormData.lastCheckupDate}
                    onChange={(e) => updateAthleteFormData('lastCheckupDate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendamos apto físico anual para actividad deportiva
                  </p>
                </div>
              </div>

              <Separator />

              {/* Condiciones médicas */}
              <div className="space-y-2">
                <Label htmlFor="medicalConditions">
                  Condiciones Médicas o de Salud
                </Label>
                <Textarea
                  id="medicalConditions"
                  placeholder="Describe cualquier enfermedad, lesión previa, condición física o tratamiento médico que pueda afectar tu rendimiento deportivo o representar un riesgo durante el entrenamiento..."
                  rows={4}
                  value={athleteFormData.medicalConditions}
                  onChange={(e) => updateAthleteFormData('medicalConditions', e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Esta información es confidencial y solo será compartida con tu entrenador asignado para personalizar tu plan de entrenamiento de manera segura.
                </p>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-medium">Preferencias de Comunicación</h5>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={athleteFormData.notifications}
                    onChange={(e) => updateAthleteFormData('notifications', e.target.checked)}
                    className="rounded border-border"
                  />
                  <Label htmlFor="notifications" className="text-sm">
                    Recibir notificaciones sobre mi progreso y entrenamientos
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2 para Entrenadores: Información adicional */}
        {currentStep === 2 && userType === 'coach' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Select 
                value={coachFormData.location} 
                onValueChange={(value: string) => updateCoachFormData('location', value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nos ayuda a conectarte con atletas de tu área
              </p>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">¡Bienvenido, Entrenador!</h4>
              <p className="text-sm text-muted-foreground">
                Una vez que completes tu registro, podrás crear planes de entrenamiento personalizados, 
                hacer seguimiento del progreso de tus atletas y acceder a herramientas avanzadas de análisis.
              </p>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className={`flex pt-4 ${currentStep === 1 ? 'justify-center' : 'justify-between'}`}>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
          )}
          
          {currentStep < maxSteps ? (
            <Button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                nextStep(e);
              }}
              className="flex items-center"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90"
            >
              Crear Cuenta
            </Button>
          )}
        </div>
      </form>
      
      {/* Link para iniciar sesión */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="text-primary hover:underline font-medium"
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}