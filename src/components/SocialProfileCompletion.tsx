import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ChevronLeft, ChevronRight, User, Scale, Ruler, MapPin, Calendar } from 'lucide-react';

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
}

interface PhysicalProfileData {
  birthDate: string; // Formato DD/MM (sin año)
  sex: string;
  height: string;
  weight: string;
  location: string;
}

interface SocialProfileCompletionProps {
  socialUser: Partial<User>;
  onComplete: (completeUser: User) => void;
  onBackToLogin: () => void;
}

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

const SEX_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no-especifica', label: 'Prefiero no especificar' }
];

export function SocialProfileCompletion({ socialUser, onComplete, onBackToLogin }: SocialProfileCompletionProps) {
  const [physicalData, setPhysicalData] = useState<PhysicalProfileData>({
    birthDate: '',
    sex: '',
    height: '',
    weight: '',
    location: ''
  });

  const updatePhysicalData = (field: keyof PhysicalProfileData, value: string) => {
    setPhysicalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que todos los campos estén completos
    if (!physicalData.birthDate || !physicalData.sex || !physicalData.height || !physicalData.weight || !physicalData.location) {
      return;
    }

    // Crear usuario completo combinando datos sociales y físicos
    const completeUser: User = {
      id: socialUser.id!,
      username: socialUser.username!,
      email: socialUser.email!,
      userType: socialUser.userType!,
      realName: socialUser.realName!,
      firstName: socialUser.firstName,
      lastName: socialUser.lastName,
      location: LOCATION_OPTIONS.find(opt => opt.value === physicalData.location)?.label || physicalData.location,
      dateOfBirth: physicalData.birthDate,
      sex: physicalData.sex
    };

    onComplete(completeUser);
  };

  const isFormValid = physicalData.birthDate && physicalData.sex && physicalData.height && physicalData.weight && physicalData.location;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLogin}
            className="p-1 h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-3xl font-bold text-primary mb-3">
              ¡Bienvenido, {socialUser.firstName || socialUser.realName}!
            </h2>
            <p className="text-lg text-muted-foreground">
              Completa tu perfil físico para personalizar tu entrenamiento
            </p>
          </div>
        </div>
        
        <Progress value={75} className="h-2 mb-4" />
        
        <div className="text-center">
          <h3 className="font-semibold text-primary">Perfil Físico</h3>
          <p className="text-sm text-muted-foreground">
            Información necesaria para crear tu plan de entrenamiento personalizado
          </p>
        </div>
      </div>

      {/* Información del usuario */}
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center text-base">
            <User className="w-4 h-4 mr-2" />
            Tu Información
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre:</span>
              <span className="font-medium">{socialUser.realName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{socialUser.email}</span>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Formulario de perfil físico */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Fecha de Nacimiento (DD/MM)
            </Label>
            <Input
              id="birthDate"
              type="text"
              placeholder="25/12"
              pattern="[0-9]{1,2}/[0-9]{1,2}"
              title="Formato: DD/MM (ejemplo: 25/12)"
              value={physicalData.birthDate}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir solo números y barra
                if (/^[0-9/]*$/.test(value) && value.length <= 5) {
                  updatePhysicalData('birthDate', value);
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
              value={physicalData.sex} 
              onValueChange={(value) => updatePhysicalData('sex', value)}
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
              <Label htmlFor="height" className="flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                Altura (cm)
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                min="100"
                max="250"
                value={physicalData.height}
                onChange={(e) => updatePhysicalData('height', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center">
                <Scale className="w-4 h-4 mr-1" />
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.5"
                min="30"
                max="200"
                value={physicalData.weight}
                onChange={(e) => updatePhysicalData('weight', e.target.value)}
                required
              />
            </div>
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Ubicación
            </Label>
            <Select 
              value={physicalData.location} 
              onValueChange={(value) => updatePhysicalData('location', value)}
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
              Nos ayuda a conectarte con entrenadores locales y adaptar tu plan
            </p>
          </div>
        </div>

        {/* Información motivacional */}


        {/* Botón de envío */}
        <Button 
          type="submit" 
          className="w-full h-12"
          disabled={!isFormValid}
        >
          Completar Registro
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      {/* Enlace para volver */}

    </div>
  );
}