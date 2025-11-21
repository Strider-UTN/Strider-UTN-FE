import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Settings, 
  Bell, 
  Edit,
  Camera,
  Save,
  X,
  Moon,
  Sun,
  Heart,
  Trash2,
  Shield,
  Activity,
  AlertTriangle,
  ClipboardList,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  Users,
  UserX,
  Loader2,
  CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { UserService, UpdateUserProfileDto, UserProfileResponseDto } from '../services/userService';

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
    height?: number; // Altura en cm
    weight?: number; // Peso en kg
    vo2Max?: string; // Velocidad máxima por km en formato mm:ss (ejemplo: "03:30")
    yearsOfExperience: number;
    trainingStartDate?: string; // Formato: YYYY-MM (ejemplo: 2020-03)
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
        certificateFile?: string;
        certificateFileName?: string;
        uploadDate?: string;
      };
    };
  };
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

// Utilidades de fecha sin desfase por timezone (YYYY-MM-DD)
const parseYmdToLocalDate = (ymd?: string): Date | undefined => {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const parseYmToLocalDate = (ym?: string): Date | undefined => {
  if (!ym) return undefined;
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return undefined;
  return new Date(y, m - 1, 1);
};

const safeFormatYmdPretty = (ymd?: string, localeArg = es): string => {
  const dt = parseYmdToLocalDate(ymd);
  return dt ? format(dt, 'PPP', { locale: localeArg }) : '';
};

const safeFormatYmPretty = (ym?: string, localeArg = es): string => {
  const dt = parseYmToLocalDate(ym);
  return dt ? format(dt, 'LLLL yyyy', { locale: localeArg }) : '';
};

// Función helper para verificar si el perfil tiene campos incompletos
// Solo considera campos de información personal (excluyendo "Sobre ti" e información atlética)
const hasIncompleteProfile = (user: User): boolean => {
  // Función helper para verificar si un string está vacío o es inválido
  const isEmpty = (value: string | undefined | null): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string') return true;
    return value.trim() === '';
  };

  // Campos comunes para todos los usuarios
  const missingPhone = isEmpty(user.phone);
  const missingDateOfBirth = isEmpty(user.dateOfBirth);
  const missingLocation = isEmpty(user.location);
  const missingCommonFields = missingPhone || missingDateOfBirth || missingLocation;

  // Para entrenadores: también verificar nombre y apellidos
  if (user.userType === 'coach') {
    // Verificar firstName y lastName, o si no existen, verificar que realName tenga al menos dos palabras
    const hasFirstName = !isEmpty(user.firstName);
    const hasLastName = !isEmpty(user.lastName);
    const hasFullName = !isEmpty(user.realName) && user.realName.trim().split(/\s+/).length >= 2;
    const hasName = (hasFirstName && hasLastName) || hasFullName;
    
    return missingCommonFields || !hasName;
  }
  
  // Para atletas: verificar altura y peso además de los campos comunes
  if (user.userType === 'athlete') {
    // Verificar que physicalProfile exista y tenga height y weight válidos (> 0)
    if (!user.physicalProfile) {
      return true; // Si no existe physicalProfile, el perfil está incompleto
    }
    
    const hasHeight = user.physicalProfile.height !== undefined && 
                      user.physicalProfile.height !== null && 
                      user.physicalProfile.height > 0;
    const hasWeight = user.physicalProfile.weight !== undefined && 
                      user.physicalProfile.weight !== null && 
                      user.physicalProfile.weight > 0;
    const missingAthletePhysicalFields = !hasHeight || !hasWeight;
    
    return missingCommonFields || missingAthletePhysicalFields;
  }
  
  return missingCommonFields;
};

export function UserProfile({ isOpen, onClose, user, onUpdateUser, theme = 'light', onToggleTheme }: UserProfileProps) {
  const [formData, setFormData] = useState<User>({
    ...user,
    firstName: user.firstName || user.realName.split(' ')[0] || '',
    lastName: user.lastName || user.realName.split(' ').slice(1).join(' ') || '',
    preferences: {
      theme: 'light',
      units: 'metric',
      notifications: {
        email: true
      },
      ...user.preferences
    },
    physicalProfile: user.userType === 'athlete' ? {
      yearsOfExperience: 0,
      trainingVolume: {
        weekly: 0,
        monthly: 0,
        unit: 'km'
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      medicalInfo: {
        healthInsurance: {
          provider: '',
          memberNumber: ''
        },
        medicalClearance: {
          hasValidClearance: false,
          lastCheckupDate: '',
          expiryDate: '',
          isExpired: false
        }
      },
      ...user.physicalProfile
    } : undefined
  });

  // Mantener una copia de los datos originales para restaurar en Cancelar
  const [initialData, setInitialData] = useState<User>(JSON.parse(JSON.stringify(user)) as User);

  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUnlinkingCoach, setIsUnlinkingCoach] = useState(false);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Estado para mes visible en los calendarios (mejor UX)
  const [dobVisibleMonth, setDobVisibleMonth] = useState<Date | undefined>(undefined);
  const [trainingVisibleMonth, setTrainingVisibleMonth] = useState<Date | undefined>(undefined);

  // Calcular si el perfil está incompleto basándose en formData
  const isProfileIncomplete = hasIncompleteProfile(formData);

  // Utilidades para selects de mes/año en español
  const monthNamesEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const buildYearRange = (from: number, to: number): number[] => {
    const years: number[] = [];
    for (let y = from; y <= to; y++) years.push(y);
    return years;
  };

  // Cargar datos del backend cuando se abre el modal y resetear estado de edición
  useEffect(() => {
    if (isOpen) {
      loadProfileFromBackend();
      // Resetear estado de edición al abrir el modal
      setIsEditing(false);
    } else {
      // Al cerrar el modal, cancelar cualquier edición pendiente
      // Restaurar valores originales y resetear estado de edición
      setFormData(prev => JSON.parse(JSON.stringify(initialData)) as User);
      setImagePreview(null);
      setIsEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadProfileFromBackend = async () => {
    setIsLoadingProfile(true);
    try {
      const profileData = await UserService.getProfile();
      
      // Mapear los datos del backend al formato del frontend
      // Formatear fecha de nacimiento para el input (YYYY-MM-DD)
      const formattedBirthDate = profileData.birthDate 
        ? (typeof profileData.birthDate === 'string' 
            ? (profileData.birthDate.includes('T')
                ? profileData.birthDate.split('T')[0]
                : profileData.birthDate)
            : undefined)
        : undefined;

      const mappedUserType: 'athlete' | 'coach' = ((): 'athlete' | 'coach' => {
        if (typeof profileData.userType === 'string') {
          const v = profileData.userType.toLowerCase();
          return v === 'athlete' ? 'athlete' : 'coach';
        }
        return profileData.userType === 0 ? 'athlete' : 'coach';
      })();

      const mappedTheme: 'light' | 'dark' = ((): 'light' | 'dark' => {
        if (typeof profileData.preferredTheme === 'string') {
          const v = profileData.preferredTheme.toLowerCase();
          return v === 'dark' ? 'dark' : 'light';
        }
        return profileData.preferredTheme === 1 ? 'dark' : 'light';
      })();

      const mappedTrainingVolume = ((): { weekly?: number; monthly?: number; unit: 'km' | 'miles' } => {
        const km = profileData.trainingVolumeKm || 0;
        if (typeof profileData.trainingVolumeType === 'string') {
          const v = profileData.trainingVolumeType.toLowerCase();
          return v === 'monthly' 
            ? { monthly: km, unit: 'km' }
            : { weekly: km, unit: 'km' };
        }
        // numérico: 0 weekly, 1 monthly (asumido)
        return profileData.trainingVolumeType === 1
          ? { monthly: km, unit: 'km' }
          : { weekly: km, unit: 'km' };
      })();

      // Separar fullName en firstName y lastName
      const nameParts = profileData.fullName ? profileData.fullName.trim().split(/\s+/) : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const mappedUser: User = {
        id: profileData.id.toString(),
        username: profileData.username,
        email: profileData.email,
        userType: mappedUserType,
        realName: profileData.fullName,
        firstName: firstName,
        lastName: lastName,
        phone: profileData.phoneNumber,
        location: profileData.address,
        profileImage: profileData.profilePictureUrl,
        dateOfBirth: formattedBirthDate,
        bio: profileData.bio || '',
        preferences: {
          theme: mappedTheme,
          units: 'metric',
          notifications: {
            email: true
          }
        },
        physicalProfile: mappedUserType === 'athlete' ? {
          height: profileData.height,
          weight: profileData.weight,
          vo2Max: (profileData as any).vO2Max || profileData.vo2Max, // Backend retorna vO2Max (camelCase)
          yearsOfExperience: profileData.yearsOfExperience,
          trainingStartDate: profileData.trainingStartDate || '',
          trainingVolume: mappedTrainingVolume,
          emergencyContact: {
            name: profileData.emergencyContactName || '',
            phone: profileData.emergencyContactPhone || '',
            relationship: profileData.emergencyContactRelationship || ''
          },
          medicalInfo: {
            healthInsurance: {
              provider: '',
              memberNumber: ''
            },
            medicalClearance: {
              hasValidClearance: false,
              isExpired: false
            }
          }
        } : undefined
      };

      // Establecer datos iniciales y del formulario
      const next = {
        ...mappedUser,
        firstName: mappedUser.realName.split(' ')[0] || '',
        lastName: mappedUser.realName.split(' ').slice(1).join(' ') || '',
        preferences: {
          theme: mappedUser.preferences?.theme || 'light',
          units: 'metric',
          notifications: {
            email: true
          },
          ...mappedUser.preferences
        },
        physicalProfile: mappedUser.physicalProfile
      } as User;

      setInitialData(JSON.parse(JSON.stringify(next)) as User);
      setFormData(next);

      // Sincronizar meses visibles de los calendarios
      setDobVisibleMonth(parseYmdToLocalDate(next.dateOfBirth) || new Date());
      setTrainingVisibleMonth(parseYmToLocalDate(next.physicalProfile?.trainingStartDate) || new Date());
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      // No mostrar error si falla, usar los datos que ya tenemos del prop user
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    try {
      // Preparar DTO para el backend
      const updateDto: UpdateUserProfileDto = {
        fullName: formData.realName?.trim() || '',
        phoneNumber: formData.phone,
        address: formData.location,
        profilePictureUrl: formData.profileImage,
        birthDate: formData.dateOfBirth || undefined,
        bio: formData.bio
      };

      // Si es atleta, agregar campos específicos
      if (formData.userType === 'athlete' && formData.physicalProfile) {
        if (formData.physicalProfile.height !== undefined) {
          updateDto.height = formData.physicalProfile.height;
        }
        if (formData.physicalProfile.weight !== undefined) {
          updateDto.weight = formData.physicalProfile.weight;
        }
        updateDto.emergencyContactName = formData.physicalProfile.emergencyContact.name;
        updateDto.emergencyContactPhone = formData.physicalProfile.emergencyContact.phone;
        updateDto.emergencyContactRelationship = formData.physicalProfile.emergencyContact.relationship;
        updateDto.country = formData.location;
        updateDto.vo2Max = formData.physicalProfile.vo2Max;
        updateDto.trainingStartDate = formData.physicalProfile.trainingStartDate;
        updateDto.trainingVolumeType = formData.physicalProfile.trainingVolume.weekly ? 'Weekly' : 'Monthly';
        updateDto.trainingVolumeKm = formData.physicalProfile.trainingVolume.weekly || formData.physicalProfile.trainingVolume.monthly || 0;
      }

      // Llamar al servicio del backend
      await UserService.updateProfile(updateDto);

      // Recargar los datos del backend para asegurar que tenemos los datos actualizados
      await loadProfileFromBackend();

      // Actualizar el usuario en el componente padre con los datos actualizados
      // Usar formData que ya fue actualizado por loadProfileFromBackend
      const updatedUser = {
        ...formData,
        realName: formData.realName?.trim() || formData.realName
      };

      onUpdateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      // El error ya fue manejado por el servicio
      console.error('Error al actualizar el perfil:', error);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setFormData(JSON.parse(JSON.stringify(initialData)) as User);
    setImagePreview(null);
    setIsEditing(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede ser mayor a 5MB');
        return;
      }

      // Crear URL de previsualización
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({
          ...prev,
          profileImage: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      profileImage: undefined
    }));
  };

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Solo se permiten imágenes (JPG, PNG, HEIC) o PDF');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 10MB');
      return;
    }

    setIsUploadingCertificate(true);

    // Simular subida
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCertificatePreview(null);
    }

    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      physicalProfile: {
        ...prev.physicalProfile!,
        medicalInfo: {
          ...prev.physicalProfile!.medicalInfo,
          medicalClearance: {
            ...prev.physicalProfile!.medicalInfo.medicalClearance,
            certificateFile: URL.createObjectURL(file),
            certificateFileName: file.name,
            uploadDate: new Date().toISOString(),
            hasValidClearance: true
          }
        }
      }
    }));

    setIsUploadingCertificate(false);
    toast.success('Certificado subido correctamente');
  };

  const handleRemoveCertificate = () => {
    setCertificatePreview(null);
    setFormData(prev => ({
      ...prev,
      physicalProfile: {
        ...prev.physicalProfile!,
        medicalInfo: {
          ...prev.physicalProfile!.medicalInfo,
          medicalClearance: {
            ...prev.physicalProfile!.medicalInfo.medicalClearance,
            certificateFile: undefined,
            certificateFileName: undefined,
            uploadDate: undefined
          }
        }
      }
    }));
    toast.success('Certificado eliminado');
  };

  const handleViewCertificate = () => {
    const certificateUrl = formData.physicalProfile?.medicalInfo.medicalClearance.certificateFile;
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
    }
  };

  const handleToggleTheme = () => {
    const newTheme = formData.preferences?.theme === 'dark' ? 'light' : 'dark';
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences!,
        theme: newTheme
      }
    }));
    
    // Si no estamos editando, aplicar el cambio inmediatamente
    if (!isEditing && onToggleTheme) {
      onToggleTheme();
    }
  };

  const handleUnlinkCoach = () => {
    setIsUnlinkingCoach(true);
  };

  const confirmUnlinkCoach = () => {
    const updatedUser = {
      ...formData,
      currentCoach: undefined
    };
    onUpdateUser(updatedUser);
    setFormData(updatedUser);
    setIsUnlinkingCoach(false);
    toast.success('Te has desvinculado del entrenador exitosamente');
  };

  const cancelUnlinkCoach = () => {
    setIsUnlinkingCoach(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserFirstName = () => {
    return formData.firstName || formData.realName.split(' ')[0] || 'Usuario';
  };

  // Calcular si el apto médico está vencido
  const isMedicalClearanceExpired = () => {
    if (!formData.physicalProfile?.medicalInfo.medicalClearance.expiryDate) return false;
    const expiryDate = new Date(formData.physicalProfile.medicalInfo.medicalClearance.expiryDate);
    const today = new Date();
    return today > expiryDate;
  };

  // Calcular días restantes para vencimiento
  const getDaysUntilExpiry = () => {
    if (!formData.physicalProfile?.medicalInfo.medicalClearance.expiryDate) return null;
    const expiryDate = new Date(formData.physicalProfile.medicalInfo.medicalClearance.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleChangePassword = () => {
    // Validar que todos los campos estén llenos
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Validar que la nueva contraseña tenga al menos 8 caracteres
    if (passwordData.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    // Aquí iría la lógica real de cambio de contraseña
    // Por ahora, simulamos un cambio exitoso
    toast.success('¡Contraseña actualizada con éxito!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-12">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 mr-2 text-accent" />
              ¡Hola {getUserFirstName()}!
              <span className="ml-3 text-xs px-2 py-1 rounded-full border bg-muted text-muted-foreground uppercase tracking-wide">
                {formData.userType === 'athlete' ? 'Atleta' : 'Entrenador'}
              </span>
              {isProfileIncomplete && (
                <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Perfil incompleto
                </Badge>
              )}
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-4"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {isProfileIncomplete ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Tu perfil tiene campos incompletos. Por favor, completa la información faltante.</span>
              </div>
            ) : (
              'Nos alegra verte de nuevo. Aquí puedes personalizar tu información y configuración de Strider.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando perfil...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Tu Información Personal
                </CardTitle>
                <CardDescription>
                  Datos básicos de tu cuenta ({formData.userType === 'athlete' ? 'Atleta' : 'Entrenador'})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar y Nombre */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={imagePreview || formData.profileImage} />
                      <AvatarFallback className="text-lg">
                        {getInitials(formData.realName)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute -bottom-2 -right-2 flex space-x-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="profile-image-input"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 rounded-full p-0"
                          onClick={() => document.getElementById('profile-image-input')?.click()}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                        {(imagePreview || formData.profileImage) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-full p-0 text-destructive hover:text-destructive"
                            onClick={handleRemoveImage}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold">{formData.realName}</h3>
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {formData.userType === 'coach' ? 'Entrenador' : 'Atleta'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {formData.email}
                    </p>
                    {isEditing && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <p>• Formatos admitidos: JPG, PNG, GIF</p>
                        <p>• Tamaño máximo: 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Campos editables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fullName">Nombre/s y Apellido/s</Label>
                    <Input
                      id="fullName"
                      value={formData.realName}
                      onChange={(e) => setFormData(prev => ({ ...prev, realName: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                    {isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={!isEditing}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dateOfBirth 
                              ? safeFormatYmdPretty(formData.dateOfBirth)
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
                            selected={parseYmdToLocalDate(formData.dateOfBirth)}
                            onSelect={(date) => {
                              if (date) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  dateOfBirth: format(date, 'yyyy-MM-dd')
                                }));
                              }
                            }}
                            disabled={(date) => {
                              // Deshabilitar fechas futuras y fechas muy antiguas (más de 120 años)
                              const today = new Date();
                              const maxDate = new Date();
                              maxDate.setFullYear(today.getFullYear() - 120);
                              return date > today || date < maxDate;
                            }}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formData.dateOfBirth 
                            ? safeFormatYmdPretty(formData.dateOfBirth)
                            : 'No especificada'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Tu ciudad, país"
                    />
                  </div>

                  {/* Altura y Peso - Solo para atletas */}
                  {formData.userType === 'athlete' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="height">Altura (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          min="0"
                          value={formData.physicalProfile?.height || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            physicalProfile: {
                              ...prev.physicalProfile!,
                              height: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }))}
                          disabled={!isEditing}
                          placeholder="Ej: 175"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.physicalProfile?.weight || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            physicalProfile: {
                              ...prev.physicalProfile!,
                              weight: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }))}
                          disabled={!isEditing}
                          placeholder="Ej: 70.5"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Sobre ti</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Cuéntanos un poco sobre ti y tus objetivos..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ficha Física - Solo para atletas */}
            {formData.userType === 'athlete' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Tu Ficha Física
                  </CardTitle>
                  <CardDescription>
                    Información específica para tu entrenamiento como atleta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información Atlética */}
                  <div>
                    <h4 className="flex items-center mb-4">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Información Atlética
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2 md:col-span-1 flex flex-col">
                        <Label htmlFor="trainingStartDate" className="min-h-[1.25rem]">Fecha de Inicio de Entrenamiento</Label>
                        {isEditing ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-10"
                                disabled={!isEditing}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.physicalProfile?.trainingStartDate
                                  ? safeFormatYmPretty(formData.physicalProfile.trainingStartDate)
                                  : 'Seleccionar mes y año'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-3" align="start">
                              {/* Controles de mes/año (sin calendario de días) */}
                              <div className="flex items-center gap-2">
                                <Select
                                  value={(trainingVisibleMonth ? (trainingVisibleMonth.getMonth()+1).toString() : (new Date().getMonth()+1).toString())}
                                  onValueChange={(val) => {
                                    setTrainingVisibleMonth(prev => {
                                      const base = prev ?? new Date();
                                      const y = base.getFullYear();
                                      const m = parseInt(val) - 1;
                                      const next = new Date(y, m, 1);
                                      // Persistir inmediatamente YYYY-MM y años
                                      const ym = `${y}-${(m+1).toString().padStart(2,'0')}`;
                                      setFormData(prevForm => {
                                        const updated = {
                                          ...prevForm,
                                          physicalProfile: {
                                            ...prevForm.physicalProfile!,
                                            trainingStartDate: ym
                                          }
                                        };
                                        // Calcular años
                                        const today = new Date();
                                        let years = today.getFullYear() - y;
                                        const monthDiff = today.getMonth() - m;
                                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < 1)) {
                                          years--;
                                        }
                                        updated.physicalProfile!.yearsOfExperience = Math.max(0, years);
                                        return updated;
                                      });
                                      return next;
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Mes" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {monthNamesEs.map((mName, idx) => (
                                      <SelectItem key={mName} value={(idx+1).toString()}>{mName.charAt(0).toUpperCase()+mName.slice(1)}</SelectItem>
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
                                      // Persistir inmediatamente YYYY-MM y años
                                      const ym = `${y}-${(m+1).toString().padStart(2,'0')}`;
                                      setFormData(prevForm => {
                                        const updated = {
                                          ...prevForm,
                                          physicalProfile: {
                                            ...prevForm.physicalProfile!,
                                            trainingStartDate: ym
                                          }
                                        };
                                        const today = new Date();
                                        let years = today.getFullYear() - y;
                                        const monthDiff = today.getMonth() - m;
                                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < 1)) {
                                          years--;
                                        }
                                        updated.physicalProfile!.yearsOfExperience = Math.max(0, years);
                                        return updated;
                                      });
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
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formData.physicalProfile?.trainingStartDate
                                ? safeFormatYmPretty(formData.physicalProfile.trainingStartDate)
                                : 'No especificada'}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Usamos el día 1 del mes para calcular automáticamente tus años de experiencia.
                        </p>
                      </div>

                      <div className="space-y-2 md:col-span-1 flex flex-col">
                        <div className="flex items-center gap-2 min-h-[1.25rem]">
                          <Label htmlFor="vo2Max" className="flex-1">VO₂ Max</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Velocidad máxima que puedes mantener por kilómetro. 
                                  Ingresa el tiempo en formato mm:ss (ejemplo: 03:30 para 3 minutos y 30 segundos por km).
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {isEditing ? (
                          <Input
                            id="vo2Max"
                            className="h-10"
                            value={formData.physicalProfile?.vo2Max || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Validar formato mm:ss mientras el usuario escribe
                              if (value === '' || /^\d{0,2}:?\d{0,2}$/.test(value)) {
                                setFormData(prev => ({
                                  ...prev,
                                  physicalProfile: {
                                    ...prev.physicalProfile!,
                                    vo2Max: value
                                  }
                                }));
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              // Validar y formatear al perder el foco
                              if (value && !/^\d{2}:\d{2}$/.test(value)) {
                                // Intentar parsear formatos comunes
                                const parts = value.split(':');
                                if (parts.length === 2) {
                                  const minutes = parts[0].padStart(2, '0');
                                  const seconds = parts[1].padStart(2, '0');
                                  if (parseInt(minutes) < 60 && parseInt(seconds) < 60) {
                                    setFormData(prev => ({
                                      ...prev,
                                      physicalProfile: {
                                        ...prev.physicalProfile!,
                                        vo2Max: `${minutes}:${seconds}`
                                      }
                                    }));
                                    return;
                                  }
                                }
                                toast.error('Formato inválido. Usa mm:ss (ejemplo: 03:30)');
                                e.target.focus();
                              }
                            }}
                            disabled={!isEditing}
                            placeholder="mm:ss (ej: 03:30)"
                            maxLength={5}
                          />
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formData.physicalProfile?.vo2Max || 'No especificado'}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Formato: mm:ss (ejemplo: 03:30 para 3 minutos y 30 segundos por km)
                        </p>
                      </div>

                      {formData.physicalProfile?.trainingVolume.weekly ? (
                        <div className="space-y-2">
                          <Label htmlFor="trainingVolumeWeekly">Volumen Semanal (km)</Label>
                          <Input
                            id="trainingVolumeWeekly"
                            type="number"
                            min="0"
                            value={formData.physicalProfile?.trainingVolume.weekly || 0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              physicalProfile: {
                                ...prev.physicalProfile!,
                                trainingVolume: {
                                  ...prev.physicalProfile!.trainingVolume,
                                  weekly: parseInt(e.target.value) || 0
                                }
                              }
                            }))}
                            disabled={!isEditing}
                            placeholder="Kilómetros por semana"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="trainingVolumeMonthly">Volumen Mensual (km)</Label>
                          <Input
                            id="trainingVolumeMonthly"
                            type="number"
                            min="0"
                            value={formData.physicalProfile?.trainingVolume.monthly || 0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              physicalProfile: {
                                ...prev.physicalProfile!,
                                trainingVolume: {
                                  ...prev.physicalProfile!.trainingVolume,
                                  monthly: parseInt(e.target.value) || 0
                                }
                              }
                            }))}
                            disabled={!isEditing}
                            placeholder="Kilómetros por mes"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Contacto de Emergencia */}
                  <div>
                    <h4 className="flex items-center mb-4">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Contacto de Emergencia
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Nombre Completo</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.physicalProfile?.emergencyContact.name || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            physicalProfile: {
                              ...prev.physicalProfile!,
                              emergencyContact: {
                                ...prev.physicalProfile!.emergencyContact,
                                name: e.target.value
                              }
                            }
                          }))}
                          disabled={!isEditing}
                          placeholder="Nombre y apellidos"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Teléfono de Emergencia</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          value={formData.physicalProfile?.emergencyContact.phone || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            physicalProfile: {
                              ...prev.physicalProfile!,
                              emergencyContact: {
                                ...prev.physicalProfile!.emergencyContact,
                                phone: e.target.value
                              }
                            }
                          }))}
                          disabled={!isEditing}
                          placeholder="+34 600 000 000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactRelationship">Relación</Label>
                        <Select
                          value={formData.physicalProfile?.emergencyContact.relationship || ''}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            physicalProfile: {
                              ...prev.physicalProfile!,
                              emergencyContact: {
                                ...prev.physicalProfile!.emergencyContact,
                                relationship: value
                              }
                            }
                          }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar relación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="padre">Padre</SelectItem>
                            <SelectItem value="madre">Madre</SelectItem>
                            <SelectItem value="hermano">Hermano/a</SelectItem>
                            <SelectItem value="conyuge">Cónyuge</SelectItem>
                            <SelectItem value="pareja">Pareja</SelectItem>
                            <SelectItem value="amigo">Amigo/a</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Información Médica */}
                  <div>
                    <h4 className="flex items-center mb-4">
                      <Shield className="w-4 h-4 mr-2" />
                      Información Médica
                    </h4>
                    
                    {/* Obra Social / Prepaga */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="healthInsuranceProvider">Prepaga / Obra Social</Label>
                          <Input
                            id="healthInsuranceProvider"
                            value={formData.physicalProfile?.medicalInfo.healthInsurance?.provider || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              physicalProfile: {
                                ...prev.physicalProfile!,
                                medicalInfo: {
                                  ...prev.physicalProfile!.medicalInfo,
                                  healthInsurance: {
                                    ...prev.physicalProfile!.medicalInfo.healthInsurance,
                                    provider: e.target.value
                                  }
                                }
                              }
                            }))}
                            disabled={!isEditing}
                            placeholder="Nombre de la prepaga/obra social"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="healthInsuranceMemberNumber">Número de Afiliado</Label>
                          <Input
                            id="healthInsuranceMemberNumber"
                            value={formData.physicalProfile?.medicalInfo.healthInsurance?.memberNumber || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              physicalProfile: {
                                ...prev.physicalProfile!,
                                medicalInfo: {
                                  ...prev.physicalProfile!.medicalInfo,
                                  healthInsurance: {
                                    ...prev.physicalProfile!.medicalInfo.healthInsurance,
                                    memberNumber: e.target.value
                                  }
                                }
                              }
                            }))}
                            disabled={!isEditing}
                            placeholder="Número de afiliado"
                          />
                        </div>
                      </div>

                      {/* Apto Físico */}
                      <div className="space-y-4">
                        <h5 className="flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Apto Físico (Anual)
                        </h5>
                        
                        {/* Subir Certificado */}
                        <div className="space-y-3">
                          <Label>Certificado Médico</Label>
                          
                          {formData.physicalProfile?.medicalInfo.medicalClearance.certificateFile ? (
                            <div className="border border-border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-start gap-4">
                                {certificatePreview || formData.physicalProfile.medicalInfo.medicalClearance.certificateFile?.includes('unsplash') ? (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={certificatePreview || formData.physicalProfile.medicalInfo.medicalClearance.certificateFile}
                                      alt="Certificado"
                                      className="w-24 h-24 object-cover rounded-lg"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                    <ClipboardList className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {formData.physicalProfile.medicalInfo.medicalClearance.certificateFileName || 'certificado.pdf'}
                                  </p>
                                  {formData.physicalProfile.medicalInfo.medicalClearance.uploadDate && (
                                    <p className="text-sm text-muted-foreground">
                                      Subido el {new Date(formData.physicalProfile.medicalInfo.medicalClearance.uploadDate).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleViewCertificate}
                                      type="button"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Ver
                                    </Button>
                                    {isEditing && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemoveCertificate}
                                        type="button"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Eliminar
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                              <input
                                type="file"
                                id="certificate-upload"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/heic,application/pdf"
                                onChange={handleCertificateUpload}
                                disabled={!isEditing || isUploadingCertificate}
                              />
                              <label 
                                htmlFor="certificate-upload" 
                                className={`cursor-pointer ${(!isEditing || isUploadingCertificate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                                <p className="font-medium mb-1">
                                  {isUploadingCertificate ? 'Subiendo...' : 'Subir Certificado Médico'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  JPG, PNG, HEIC o PDF (máx. 10MB)
                                </p>
                              </label>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Sube una foto o archivo de tu apto físico para actividad deportiva
                          </p>
                        </div>

                        {/* Alerta de vencimiento */}
                        {formData.physicalProfile?.medicalInfo.medicalClearance.expiryDate && (
                          <div className={`p-3 rounded-lg border ${
                            isMedicalClearanceExpired() 
                              ? 'bg-red-50 border-red-200 text-red-800' 
                              : getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 30
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                              : 'bg-green-50 border-green-200 text-green-800'
                          }`}>
                            <div className="flex items-center">
                              <AlertTriangle className={`w-4 h-4 mr-2 ${
                                isMedicalClearanceExpired() 
                                  ? 'text-red-600' 
                                  : getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 30
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              }`} />
                              <span className="text-sm">
                                {isMedicalClearanceExpired() 
                                  ? '¡Apto físico vencido! Necesitas renovarlo'
                                  : getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 30
                                  ? `Tu apto vence en ${getDaysUntilExpiry()} días`
                                  : 'Apto físico vigente'
                                }
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="lastCheckupDate">Fecha del Último Chequeo</Label>
                            <Input
                              id="lastCheckupDate"
                              type="date"
                              value={formData.physicalProfile?.medicalInfo.medicalClearance.lastCheckupDate || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                physicalProfile: {
                                  ...prev.physicalProfile!,
                                  medicalInfo: {
                                    ...prev.physicalProfile!.medicalInfo,
                                    medicalClearance: {
                                      ...prev.physicalProfile!.medicalInfo.medicalClearance,
                                      lastCheckupDate: e.target.value,
                                      hasValidClearance: e.target.value ? true : false
                                    }
                                  }
                                }
                              }))}
                              disabled={!isEditing}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                            <Input
                              id="expiryDate"
                              type="date"
                              value={formData.physicalProfile?.medicalInfo.medicalClearance.expiryDate || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                physicalProfile: {
                                  ...prev.physicalProfile!,
                                  medicalInfo: {
                                    ...prev.physicalProfile!.medicalInfo,
                                    medicalClearance: {
                                      ...prev.physicalProfile!.medicalInfo.medicalClearance,
                                      expiryDate: e.target.value,
                                      isExpired: e.target.value ? new Date(e.target.value) < new Date() : false
                                    }
                                  }
                                }
                              }))}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entrenador Coordinador (solo para atletas) */}
            {false && user.userType === 'athlete' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Entrenador Coordinador
                  </CardTitle>
                  <CardDescription>
                    Información sobre el entrenador que coordina tu planificación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Eliminado: esta información se gestiona desde Invitaciones */}
                </CardContent>
              </Card>
            )}

            {/* Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Seguridad de tu Cuenta
                </CardTitle>
                <CardDescription>
                  Mantén tu cuenta segura actualizando tu contraseña regularmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isChangingPassword ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Contraseña</Label>
                      <p className="text-sm text-muted-foreground">
                        ••••••••••
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Cambiar Contraseña
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Ingresa tu contraseña actual"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Ingresa tu nueva contraseña"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirma tu nueva contraseña"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" onClick={handleCancelPasswordChange}>
                        Cancelar
                      </Button>
                      <Button onClick={handleChangePassword} className="bg-accent hover:bg-accent/90">
                        Actualizar Contraseña
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Tus Preferencias
                </CardTitle>
                <CardDescription>
                  Personaliza Strider según tus gustos y necesidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tema de la Aplicación</Label>
                      <p className="text-sm text-muted-foreground">
                        Elige entre modo claro u oscuro para tu comodidad
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4 text-muted-foreground" />
                      <Switch
                        checked={formData.preferences?.theme === 'dark'}
                        onCheckedChange={handleToggleTheme}
                      />
                      <Moon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Unidades de Medida</Label>
                      <p className="text-sm text-muted-foreground">
                        Tu sistema de medición preferido
                      </p>
                    </div>
                    <Select
                      value={formData.preferences?.units || 'metric'}
                      onValueChange={(value: 'metric' | 'imperial') => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences!, units: value }
                      }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Métrico</SelectItem>
                        <SelectItem value="imperial">Imperial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center">
                        <Bell className="w-4 h-4 mr-2" />
                        Notificaciones por Email
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Mantente al día con las novedades de Strider
                      </p>
                    </div>
                    <Switch
                      checked={formData.preferences?.notifications?.email || false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences!,
                          notifications: { email: checked }
                        }
                      }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            )}
          </div>
        )}

      {/* AlertDialog de confirmación de desvinculación */}
      <AlertDialog open={isUnlinkingCoach} onOpenChange={setIsUnlinkingCoach}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ¿Confirmar desvinculación?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  Estás a punto de desvincularte de <strong>{formData.currentCoach?.name}</strong>.
                </div>
                <div>
                  Al confirmar esta acción:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                  <li>Perderás acceso a la planificación compartida por este entrenador</li>
                  <li>El entrenador ya no podrá ver tu progreso ni enviarte nuevas sesiones</li>
                  <li>Deberás esperar una nueva invitación para volver a vincularte</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelUnlinkCoach}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlinkCoach}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, desvincularme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}