import React, { useState } from 'react';
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
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

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

  const handleSave = () => {
    // Actualizar realName basado en firstName y lastName
    const updatedUser = {
      ...formData,
      realName: `${formData.firstName} ${formData.lastName}`.trim()
    };

    onUpdateUser(updatedUser);
    setIsEditing(false);
    toast.success('¡Perfil actualizado con éxito!');
  };

  const handleCancel = () => {
    setFormData({
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
            <div className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-accent" />
              ¡Hola {getUserFirstName()}!
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
            Nos alegra verte de nuevo. Aquí puedes personalizar tu información y configuración de Strider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Tu Información Personal
              </CardTitle>
              <CardDescription>
                Mantén tus datos actualizados para una mejor experiencia en Strider
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
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Tus apellidos"
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
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    disabled={!isEditing}
                  />
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
                  Información atlética y médica para tu seguimiento deportivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información Atlética */}
                <div>
                  <h4 className="flex items-center mb-4">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Información Atlética
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Años de Experiencia</Label>
                      <Input
                        id="yearsOfExperience"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.physicalProfile?.yearsOfExperience || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          physicalProfile: {
                            ...prev.physicalProfile!,
                            yearsOfExperience: parseInt(e.target.value) || 0
                          }
                        }))}
                        disabled={!isEditing}
                        placeholder="Años corriendo"
                      />
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
          {user.userType === 'athlete' && (
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
                {formData.currentCoach ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-3 flex-1">
                        <div>
                          <Label className="text-sm text-muted-foreground">Nombre</Label>
                          <p className="font-medium">{formData.currentCoach.name}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </Label>
                            <p className="text-sm">{formData.currentCoach.email}</p>
                          </div>
                          {formData.currentCoach.phone && (
                            <div>
                              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Teléfono
                              </Label>
                              <p className="text-sm">{formData.currentCoach.phone}</p>
                            </div>
                          )}
                        </div>
                        {formData.currentCoach.linkedSince && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Vinculado desde</Label>
                            <p className="text-sm">
                              {new Date(formData.currentCoach.linkedSince).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        variant="destructive"
                        onClick={handleUnlinkCoach}
                        className="w-full md:w-auto"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Desvincularme de este entrenador
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Al desvincularte, perderás acceso a la planificación compartida por este entrenador
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No tienes un entrenador coordinador asignado</p>
                    <p className="text-sm text-muted-foreground">
                      Espera a recibir una invitación de un entrenador para comenzar tu planificación
                    </p>
                  </div>
                )}
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
        </div>

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
      </DialogContent>

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
    </Dialog>
  );
}