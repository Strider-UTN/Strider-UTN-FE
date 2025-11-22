import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, UserCheck, Activity, Shield, Phone, CalendarIcon, X } from 'lucide-react';
import { SocialProfileCompletion } from './SocialProfileCompletion';
import { AuthService } from '../services/authService';
import { toast } from 'sonner';

type UserType = 'athlete' | 'coach' | null;

interface AthleteFormData {
  // Paso 1: Información de cuenta
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  
  // Paso 2: Información física básica
  birthDate: string; // Formato YYYY-MM-DD
  sex: string;
  height: string;
  weight: string;
  location: string;
  phone: string;
  
  // Paso 3: Ficha Atlética
  trainingStartDate: string; // Formato: YYYY-MM (mes y año de inicio)
  
  // Paso 4: Contacto de emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  // Paso 5: Información médica y finalizar
  hasHealthInsurance: boolean;
  healthInsuranceProvider: string;
  healthInsuranceMemberNumber: string;
  lastCheckupDate: string;
  medicalConditions: string[]; // Lista de condiciones médicas
  notifications: boolean;
}

interface CoachFormData {
  // Paso 1: Información de cuenta
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  birthDate: string; // Formato YYYY-MM-DD o Date
  gender: string;
  location: string; // Cambiado de address a location para consistencia
  phone: string;
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

// Utilidades de fecha
const parseYmdToLocalDate = (ymd?: string): Date | undefined => {
  if (!ymd) return undefined;
  // Formato YYYY-MM-DD
  if (ymd.includes('-')) {
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  }
  return undefined;
};

const safeFormatYmdPretty = (ymd?: string): string => {
  const dt = parseYmdToLocalDate(ymd);
  return dt ? format(dt, 'PPP', { locale: es }) : '';
};

const buildYearRange = (start: number, end: number): number[] => {
  const years: number[] = [];
  for (let i = end; i >= start; i--) {
    years.push(i);
  }
  return years;
};

const monthNamesEs = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

interface User {
  id: string;
  username: string;
  email: string;
  userType: 'athlete' | 'coach';
  realName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string; // Formato YYYY-MM-DD
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dobVisibleMonth, setDobVisibleMonth] = useState<Date>(new Date());
  const [trainingVisibleMonth, setTrainingVisibleMonth] = useState<Date>(new Date());
  
  const [athleteFormData, setAthleteFormData] = useState<AthleteFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    birthDate: '',
    sex: '',
    height: '',
    weight: '',
    location: '',
    phone: '',
    trainingStartDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    hasHealthInsurance: false,
    healthInsuranceProvider: '',
    healthInsuranceMemberNumber: '',
    lastCheckupDate: '',
    medicalConditions: [],
    notifications: true
  });
  
  const [coachFormData, setCoachFormData] = useState<CoachFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    birthDate: '',
    gender: '',
    location: '',
    phone: ''
  });

  // Si viene de registro social, prellenar algunos datos
  useEffect(() => {
    if (socialUser && skipToPhysicalProfile) {
      if (userType === 'athlete') {
        setAthleteFormData(prev => ({
          ...prev,
          email: socialUser.email || '',
          realName: socialUser.realName || '',
          password: 'social_login',
          confirmPassword: 'social_login'
        }));
      } else {
        setCoachFormData(prev => ({
          ...prev,
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

  // Funciones de validación para cada paso
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    const currentFormData = userType === 'athlete' ? athleteFormData : coachFormData;
    
    if (!currentFormData.realName || currentFormData.realName.trim() === '') {
      errors.realName = 'El nombre completo es requerido';
    }
    
    if (!currentFormData.email || currentFormData.email.trim() === '') {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFormData.email)) {
      errors.email = 'El email no es válido';
    }
    
    if (!currentFormData.password || currentFormData.password.trim() === '') {
      errors.password = 'La contraseña es requerida';
    } else if (currentFormData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!currentFormData.confirmPassword || currentFormData.confirmPassword.trim() === '') {
      errors.confirmPassword = 'Confirma tu contraseña';
    }
    
    if (currentFormData.password && currentFormData.confirmPassword && 
        currentFormData.password !== currentFormData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
      errors.password = errors.password || 'Las contraseñas no coinciden';
    }
    
    // Validaciones adicionales para coach en el paso 1
    if (userType === 'coach') {
      if (!coachFormData.birthDate || coachFormData.birthDate.trim() === '') {
        errors.birthDate = 'La fecha de nacimiento es requerida';
      }
      
      if (!coachFormData.gender || coachFormData.gender.trim() === '') {
        errors.gender = 'El género es requerido';
      }
      
      if (!coachFormData.location || coachFormData.location.trim() === '') {
        errors.location = 'La ubicación es requerida';
      }
      
      if (!coachFormData.phone || coachFormData.phone.trim() === '') {
        errors.phone = 'El teléfono es requerido';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (userType === 'coach') return true; // Coach no tiene paso 2
    
    const errors: Record<string, string> = {};
    
    if (!athleteFormData.birthDate || athleteFormData.birthDate.trim() === '') {
      errors.birthDate = 'La fecha de nacimiento es requerida';
    }
    
    if (!athleteFormData.sex || athleteFormData.sex.trim() === '') {
      errors.sex = 'El género es requerido';
    }
    
    if (!athleteFormData.height || athleteFormData.height.trim() === '') {
      errors.height = 'La altura es requerida';
    } else if (parseFloat(athleteFormData.height) <= 0) {
      errors.height = 'La altura debe ser mayor a 0';
    }
    
    if (!athleteFormData.weight || athleteFormData.weight.trim() === '') {
      errors.weight = 'El peso es requerido';
    } else if (parseFloat(athleteFormData.weight) <= 0) {
      errors.weight = 'El peso debe ser mayor a 0';
    }
    
    if (!athleteFormData.phone || athleteFormData.phone.trim() === '') {
      errors.phone = 'El teléfono es requerido';
    }
    
    if (!athleteFormData.location || athleteFormData.location.trim() === '') {
      errors.location = 'La ubicación es requerida';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (userType === 'coach') return true;
    
    const errors: Record<string, string> = {};
    
    if (!athleteFormData.trainingStartDate || athleteFormData.trainingStartDate.trim() === '') {
      errors.trainingStartDate = 'La fecha de inicio de entrenamiento es requerida';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = (): boolean => {
    if (userType === 'coach') return true;
    
    const errors: Record<string, string> = {};
    
    if (!athleteFormData.emergencyContactName || athleteFormData.emergencyContactName.trim() === '') {
      errors.emergencyContactName = 'El nombre del contacto de emergencia es requerido';
    }
    
    if (!athleteFormData.emergencyContactPhone || athleteFormData.emergencyContactPhone.trim() === '') {
      errors.emergencyContactPhone = 'El teléfono de emergencia es requerido';
    }
    
    if (!athleteFormData.emergencyContactRelationship || athleteFormData.emergencyContactRelationship.trim() === '') {
      errors.emergencyContactRelationship = 'La relación con el contacto es requerida';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep5 = (): boolean => {
    // El paso 5 no tiene campos obligatorios, todos son opcionales
    setValidationErrors({});
    return true;
  };

  // Funciones para verificar si un paso está completo (sin validar, solo verificar que tenga valores)
  const isStep1Complete = (): boolean => {
    const currentFormData = userType === 'athlete' ? athleteFormData : coachFormData;
    
    if (!currentFormData.realName || currentFormData.realName.trim() === '') return false;
    if (!currentFormData.email || currentFormData.email.trim() === '') return false;
    if (!currentFormData.password || currentFormData.password.trim() === '') return false;
    if (!currentFormData.confirmPassword || currentFormData.confirmPassword.trim() === '') return false;
    if (currentFormData.password !== currentFormData.confirmPassword) return false;
    
    // Validaciones adicionales para coach en el paso 1
    if (userType === 'coach') {
      if (!coachFormData.birthDate || coachFormData.birthDate.trim() === '') return false;
      if (!coachFormData.gender || coachFormData.gender.trim() === '') return false;
      if (!coachFormData.location || coachFormData.location.trim() === '') return false;
      if (!coachFormData.phone || coachFormData.phone.trim() === '') return false;
    }
    
    return true;
  };

  const isStep2Complete = (): boolean => {
    if (userType === 'coach') return true; // Coach no tiene paso 2
    
    if (!athleteFormData.birthDate || athleteFormData.birthDate.trim() === '') return false;
    if (!athleteFormData.sex || athleteFormData.sex.trim() === '') return false;
    if (!athleteFormData.height || athleteFormData.height.trim() === '') return false;
    if (!athleteFormData.weight || athleteFormData.weight.trim() === '') return false;
    if (!athleteFormData.phone || athleteFormData.phone.trim() === '') return false;
    if (!athleteFormData.location || athleteFormData.location.trim() === '') return false;
    
    return true;
  };

  const isStep3Complete = (): boolean => {
    if (userType === 'coach') return true;
    
    if (!athleteFormData.trainingStartDate || athleteFormData.trainingStartDate.trim() === '') return false;
    
    return true;
  };

  const isStep4Complete = (): boolean => {
    if (userType === 'coach') return true;
    
    if (!athleteFormData.emergencyContactName || athleteFormData.emergencyContactName.trim() === '') return false;
    if (!athleteFormData.emergencyContactPhone || athleteFormData.emergencyContactPhone.trim() === '') return false;
    if (!athleteFormData.emergencyContactRelationship || athleteFormData.emergencyContactRelationship.trim() === '') return false;
    
    return true;
  };

  const isStep5Complete = (): boolean => {
    // El paso 5 no tiene campos obligatorios
    return true;
  };

  // Función para verificar si el paso actual está completo
  const isCurrentStepComplete = (): boolean => {
    if (userType === 'athlete') {
      switch (currentStep) {
        case 1:
          return isStep1Complete();
        case 2:
          return isStep2Complete();
        case 3:
          return isStep3Complete();
        case 4:
          return isStep4Complete();
        case 5:
          return isStep5Complete();
        default:
          return true;
      }
    } else if (userType === 'coach') {
      switch (currentStep) {
        case 1:
          return isStep1Complete();
        case 2:
          return true; // El paso 2 del coach es solo finalizar
        default:
          return true;
      }
    }
    return false;
  };

  const nextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Validar el paso actual antes de avanzar
    let isValid = false;
    if (userType === 'athlete') {
      switch (currentStep) {
        case 1:
          isValid = validateStep1();
          break;
        case 2:
          isValid = validateStep2();
          break;
        case 3:
          isValid = validateStep3();
          break;
        case 4:
          isValid = validateStep4();
          break;
        case 5:
          isValid = validateStep5();
          break;
        default:
          isValid = true;
      }
    } else if (userType === 'coach') {
      switch (currentStep) {
        case 1:
          isValid = validateStep1();
          break;
        case 2:
          isValid = true; // El paso 2 del coach es solo finalizar
          break;
        default:
          isValid = true;
      }
    }
    
    if (!isValid) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    // Limpiar errores al avanzar
    setValidationErrors({});
    
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
      toast.success('¡Registro exitoso! Por favor inicia sesión con tus credenciales.');
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
      try {
        // Convertir fecha de nacimiento de YYYY-MM-DD a Date
        const birthDate = new Date(athleteFormData.birthDate);
        if (isNaN(birthDate.getTime())) {
          toast.error('La fecha de nacimiento no es válida');
          return;
        }

        // Mapear sex a gender (masculino/femenino/no-especifica)
        const genderMap: Record<string, 'masculino' | 'femenino' | 'no-especifica'> = {
          'masculino': 'masculino',
          'femenino': 'femenino',
          'no-especifica': 'no-especifica'
        };
        const gender = genderMap[athleteFormData.sex] || 'no-especifica';

        // Convertir lastCheckupDate de string a Date si existe
        let lastCheckupDate: Date | undefined = undefined;
        if (athleteFormData.lastCheckupDate && athleteFormData.lastCheckupDate.trim() !== '') {
          const checkupDate = new Date(athleteFormData.lastCheckupDate);
          if (!isNaN(checkupDate.getTime())) {
            lastCheckupDate = checkupDate;
          }
        }

        // Determinar si tiene seguro médico (si tiene provider o memberNumber, asumimos que sí)
        const hasHealthInsurance = !!(athleteFormData.healthInsuranceProvider?.trim() || athleteFormData.healthInsuranceMemberNumber?.trim());

        // Llamar al backend para crear el atleta
        await AuthService.createAthlete({
          username: currentFormData.email.split('@')[0] || 'usuario',
          fullName: currentFormData.realName,
          email: currentFormData.email,
          password: currentFormData.password,
          birthDate: birthDate,
          address: athleteFormData.location || '',
          gender: gender,
          phoneNumber: athleteFormData.phone?.trim() || '',
          heightCm: parseFloat(athleteFormData.height) || 0,
          weightKg: parseFloat(athleteFormData.weight) || 0,
          country: athleteFormData.location || '',
          trainingStartDate: athleteFormData.trainingStartDate,
          emergencyContactName: athleteFormData.emergencyContactName || '',
          emergencyContactPhone: athleteFormData.emergencyContactPhone || '',
          emergencyContactRelationship: athleteFormData.emergencyContactRelationship || '',
          // Información médica
          hasHealthInsurance: athleteFormData.hasHealthInsurance || false,
          healthInsuranceProvider: athleteFormData.healthInsuranceProvider?.trim() || '',
          healthInsuranceMemberNumber: athleteFormData.healthInsuranceMemberNumber?.trim() || '',
          lastCheckupDate: lastCheckupDate,
          medicalConditions: athleteFormData.medicalConditions.filter(c => c.trim() !== '')
        });

        // Después del registro exitoso, mostrar mensaje y redirigir al login
        toast.success('¡Registro exitoso! Por favor inicia sesión con tus credenciales.');
        onSuccessfulSignUp({
          id: Date.now().toString(),
          username: currentFormData.email.split('@')[0] || 'usuario',
          email: currentFormData.email,
          userType: userType!,
          realName: currentFormData.realName
        } as User);
      } catch (error) {
        // El error ya se maneja automáticamente en apiClient.ts y AuthService
        console.error('Error al registrar atleta:', error);
        // No llamar a onSuccessfulSignUp si hay error
        return;
      }
    } else {
      // Validar que las contraseñas coincidan
      if (coachFormData.password !== coachFormData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      // Validar campos requeridos
      if (!coachFormData.birthDate || !coachFormData.gender || !coachFormData.location || !coachFormData.phone) {
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
          username: coachFormData.email.split('@')[0] || coachFormData.email,
          fullName: coachFormData.realName,
          email: coachFormData.email,
          password: coachFormData.password,
          birthDate: birthDate,
          address: coachFormData.location, // El backend usa Address, pero en el frontend usamos location
          gender: coachFormData.gender as 'masculino' | 'femenino' | 'no-especifica',
          phoneNumber: coachFormData.phone.trim() || undefined
        });

        // Crear el objeto User para el frontend
        const newUser: User = {
          id: Date.now().toString(),
          username: coachFormData.email.split('@')[0] || coachFormData.email,
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
        
        toast.success('¡Registro exitoso! Por favor inicia sesión con tus credenciales.');
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
              <Label htmlFor="realName">Nombre/s y Apellido/s</Label>
              <Input
                id="realName"
                placeholder="Juan Carlos Pérez"
                value={formData.realName}
                onChange={(e) => {
                  updateFormData('realName', e.target.value);
                  if (validationErrors.realName) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.realName;
                      return newErrors;
                    });
                  }
                }}
                className={validationErrors.realName ? 'border-red-500' : ''}
                required
              />
              {validationErrors.realName && (
                <p className="text-sm text-red-500">{validationErrors.realName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={(e) => {
                  updateFormData('email', e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.email;
                      return newErrors;
                    });
                  }
                }}
                className={validationErrors.email ? 'border-red-500' : ''}
                required
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  updateFormData('password', e.target.value);
                  // Validar contraseñas en tiempo real
                  const currentFormData = userType === 'athlete' ? athleteFormData : coachFormData;
                  if (currentFormData.confirmPassword && e.target.value !== currentFormData.confirmPassword) {
                    setValidationErrors(prev => ({
                      ...prev,
                      password: 'Las contraseñas no coinciden',
                      confirmPassword: 'Las contraseñas no coinciden'
                    }));
                  } else if (validationErrors.password) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.password;
                      if (e.target.value === currentFormData.confirmPassword) {
                        delete newErrors.confirmPassword;
                      }
                      return newErrors;
                    });
                  }
                }}
                className={validationErrors.password ? 'border-red-500' : ''}
                required
              />
              {validationErrors.password && (
                <p className="text-sm text-red-500">{validationErrors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => {
                  updateFormData('confirmPassword', e.target.value);
                  // Validar contraseñas en tiempo real
                  const currentFormData = userType === 'athlete' ? athleteFormData : coachFormData;
                  if (currentFormData.password && e.target.value !== currentFormData.password) {
                    setValidationErrors(prev => ({
                      ...prev,
                      confirmPassword: 'Las contraseñas no coinciden',
                      password: 'Las contraseñas no coinciden'
                    }));
                  } else if (validationErrors.confirmPassword) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      if (e.target.value === currentFormData.password) {
                        delete newErrors.password;
                      }
                      return newErrors;
                    });
                  }
                }}
                className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                required
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Campos adicionales solo para Coach */}
            {userType === 'coach' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${validationErrors.birthDate ? 'border-red-500' : ''}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {coachFormData.birthDate 
                          ? safeFormatYmdPretty(coachFormData.birthDate)
                          : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-3" align="start">
                      {/* Controles de mes/año */}
                      <div className="flex items-center gap-2 mb-2">
                        <Select
                          value={(dobVisibleMonth ? (dobVisibleMonth.getMonth()+1).toString() : (new Date().getMonth()+1).toString())}
                          onValueChange={(val) => {
                            setDobVisibleMonth(prev => {
                              const base = prev ?? new Date();
                              const y = base.getFullYear();
                              const m = parseInt(val) - 1;
                              return new Date(y, m, 1);
                            });
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNamesEs.map((mName, idx) => (
                              <SelectItem key={mName} value={(idx+1).toString()}>{mName.charAt(0).toUpperCase()+mName.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={(dobVisibleMonth ? dobVisibleMonth.getFullYear() : new Date().getFullYear()).toString()}
                          onValueChange={(val) => {
                            setDobVisibleMonth(prev => {
                              const base = prev ?? new Date();
                              const y = parseInt(val);
                              const m = base.getMonth();
                              return new Date(y, m, 1);
                            });
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildYearRange(1900, new Date().getFullYear()).map(y => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <CalendarComponent
                        mode="single"
                        month={dobVisibleMonth}
                        onMonthChange={setDobVisibleMonth}
                        selected={parseYmdToLocalDate(coachFormData.birthDate)}
                        onSelect={(date) => {
                          if (date) {
                            const formattedDate = format(date, 'yyyy-MM-dd');
                            updateCoachFormData('birthDate', formattedDate);
                            if (validationErrors.birthDate) {
                              setValidationErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.birthDate;
                                return newErrors;
                              });
                            }
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          const maxDate = new Date();
                          maxDate.setFullYear(today.getFullYear() - 120);
                          return date > today || date < maxDate;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.birthDate && (
                    <p className="text-sm text-red-500">{validationErrors.birthDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select 
                    value={coachFormData.gender} 
                    onValueChange={(value: string) => {
                      updateCoachFormData('gender', value);
                      if (validationErrors.gender) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.gender;
                          return newErrors;
                        });
                      }
                    }}
                    required
                  >
                    <SelectTrigger className={`w-full ${validationErrors.gender ? 'border-red-500' : ''}`}>
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
                  {validationErrors.gender && (
                    <p className="text-sm text-red-500">{validationErrors.gender}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={coachFormData.phone}
                    onChange={(e) => {
                      updateCoachFormData('phone', e.target.value);
                      if (validationErrors.phone) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                      }
                    }}
                    className={validationErrors.phone ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    placeholder="Tu ciudad, país"
                    value={coachFormData.location}
                    onChange={(e) => {
                      updateCoachFormData('location', e.target.value);
                      if (validationErrors.location) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.location;
                          return newErrors;
                        });
                      }
                    }}
                    className={validationErrors.location ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.location && (
                    <p className="text-sm text-red-500">{validationErrors.location}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Nos ayuda a conectarte con atletas de tu área
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
              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${validationErrors.birthDate ? 'border-red-500' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {athleteFormData.birthDate 
                      ? safeFormatYmdPretty(athleteFormData.birthDate)
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-3" align="start">
                  {/* Controles de mes/año */}
                  <div className="flex items-center gap-2 mb-2">
                    <Select
                      value={(dobVisibleMonth ? (dobVisibleMonth.getMonth()+1).toString() : (new Date().getMonth()+1).toString())}
                      onValueChange={(val) => {
                        setDobVisibleMonth(prev => {
                          const base = prev ?? new Date();
                          const y = base.getFullYear();
                          const m = parseInt(val) - 1;
                          return new Date(y, m, 1);
                        });
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNamesEs.map((mName, idx) => (
                          <SelectItem key={mName} value={(idx+1).toString()}>{mName.charAt(0).toUpperCase()+mName.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={(dobVisibleMonth ? dobVisibleMonth.getFullYear() : new Date().getFullYear()).toString()}
                      onValueChange={(val) => {
                        setDobVisibleMonth(prev => {
                          const base = prev ?? new Date();
                          const y = parseInt(val);
                          const m = base.getMonth();
                          return new Date(y, m, 1);
                        });
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Año" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildYearRange(1900, new Date().getFullYear()).map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CalendarComponent
                    mode="single"
                    month={dobVisibleMonth}
                    onMonthChange={setDobVisibleMonth}
                    selected={parseYmdToLocalDate(athleteFormData.birthDate)}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        updateAthleteFormData('birthDate', formattedDate);
                        if (validationErrors.birthDate) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.birthDate;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      const maxDate = new Date();
                      maxDate.setFullYear(today.getFullYear() - 120);
                      return date > today || date < maxDate;
                    }}
                  />
                </PopoverContent>
              </Popover>
              {validationErrors.birthDate && (
                <p className="text-sm text-red-500">{validationErrors.birthDate}</p>
              )}
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
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={athleteFormData.phone}
                onChange={(e) => {
                  updateAthleteFormData('phone', e.target.value);
                  if (validationErrors.phone) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.phone;
                      return newErrors;
                    });
                  }
                }}
                className={validationErrors.phone ? 'border-red-500' : ''}
                required
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-500">{validationErrors.phone}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Tu ciudad, país"
                value={athleteFormData.location}
                onChange={(e) => {
                  updateAthleteFormData('location', e.target.value);
                  if (validationErrors.location) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.location;
                      return newErrors;
                    });
                  }
                }}
                className={validationErrors.location ? 'border-red-500' : ''}
                required
              />
              {validationErrors.location && (
                <p className="text-sm text-red-500">{validationErrors.location}</p>
              )}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${validationErrors.trainingStartDate ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {athleteFormData.trainingStartDate
                        ? (() => {
                            try {
                              const [year, month] = athleteFormData.trainingStartDate.split('-').map(Number);
                              const monthName = monthNamesEs[month - 1] || '';
                              return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
                            } catch {
                              return 'Seleccionar mes y año';
                            }
                          })()
                        : 'Seleccionar mes y año'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-4" align="start">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={(trainingVisibleMonth ? (trainingVisibleMonth.getMonth()+1).toString() : (new Date().getMonth()+1).toString())}
                          onValueChange={(val) => {
                            setTrainingVisibleMonth(prev => {
                              const base = prev ?? new Date();
                              const y = base.getFullYear();
                              const m = parseInt(val) - 1;
                              const next = new Date(y, m, 1);
                              // Persistir inmediatamente YYYY-MM
                              const ym = `${y}-${(m+1).toString().padStart(2,'0')}`;
                              updateAthleteFormData('trainingStartDate', ym);
                              if (validationErrors.trainingStartDate) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.trainingStartDate;
                                  return newErrors;
                                });
                              }
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNamesEs.map((mName, idx) => (
                              <SelectItem key={mName} value={(idx+1).toString()}>
                                {mName.charAt(0).toUpperCase() + mName.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={(trainingVisibleMonth ? trainingVisibleMonth.getFullYear() : new Date().getFullYear()).toString()}
                          onValueChange={(val) => {
                            setTrainingVisibleMonth(prev => {
                              const base = prev ?? new Date();
                              const y = parseInt(val);
                              const m = base.getMonth();
                              const next = new Date(y, m, 1);
                              // Persistir inmediatamente YYYY-MM
                              const ym = `${y}-${(m+1).toString().padStart(2,'0')}`;
                              updateAthleteFormData('trainingStartDate', ym);
                              if (validationErrors.trainingStartDate) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.trainingStartDate;
                                  return newErrors;
                                });
                              }
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildYearRange(1970, new Date().getFullYear()).map(y => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {athleteFormData.trainingStartDate && (() => {
                        try {
                          const [year, month] = athleteFormData.trainingStartDate.split('-').map(Number);
                          const startDate = new Date(year, month - 1, 1);
                          const today = new Date();
                          
                          // Calcular años completos
                          let years = today.getFullYear() - startDate.getFullYear();
                          let months = today.getMonth() - startDate.getMonth();
                          
                          // Ajustar si aún no se ha cumplido un año completo
                          if (months < 0 || (months === 0 && today.getDate() < startDate.getDate())) {
                            years--;
                            months += 12;
                          }
                          
                          // Asegurar que no sea negativo
                          years = Math.max(0, years);
                          months = Math.max(0, months);
                          
                          // Formatear el mensaje
                          const parts: string[] = [];
                          if (years > 0) {
                            parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
                          }
                          if (months > 0) {
                            parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
                          }
                          
                          const experienceText = parts.length > 0 ? parts.join(' y ') : 'Sin Experiencia';
                          
                          return (
                            <p className="text-sm text-muted-foreground pt-2 border-t">
                              Experiencia aproximada: <span className="font-semibold text-foreground">{experienceText}</span>
                            </p>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  </PopoverContent>
                </Popover>
                {validationErrors.trainingStartDate && (
                  <p className="text-sm text-red-500">{validationErrors.trainingStartDate}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecciona el mes y año aproximado en que comenzaste a entrenar
                </p>
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasHealthInsurance"
                    checked={athleteFormData.hasHealthInsurance || false}
                    onChange={(e) => updateAthleteFormData('hasHealthInsurance', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="hasHealthInsurance" className="font-normal cursor-pointer">
                    Tengo prepaga/obra social
                  </Label>
                </div>

                {(athleteFormData.hasHealthInsurance || athleteFormData.healthInsuranceProvider || athleteFormData.healthInsuranceMemberNumber) && (
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
                )}
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
                <Label>
                  Condiciones Médicas o de Salud
                </Label>
                <div className="space-y-3">
                  {athleteFormData.medicalConditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={condition}
                        onChange={(e) => {
                          const updated = [...athleteFormData.medicalConditions];
                          updated[index] = e.target.value;
                          updateAthleteFormData('medicalConditions', updated);
                        }}
                        placeholder="Ej: Asma, Alergia a medicamentos, Lesión de rodilla previa"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = athleteFormData.medicalConditions.filter((_, i) => i !== index);
                          updateAthleteFormData('medicalConditions', updated);
                        }}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      updateAthleteFormData('medicalConditions', [...athleteFormData.medicalConditions, '']);
                    }}
                    className="w-full"
                  >
                    + Agregar Condición
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta información es confidencial y solo será compartida con tu entrenador asignado para personalizar tu plan de entrenamiento de manera segura.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2 para Entrenadores: Información adicional */}
        {currentStep === 2 && userType === 'coach' && (
          <div className="space-y-4">
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
              disabled={!isCurrentStepComplete()}
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