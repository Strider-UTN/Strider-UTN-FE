import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity,
  Heart,
  Users,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthYear: number;
  height: number; // cm
  weight: number; // kg
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  athleticExperience: {
    yearsRunning: number;
    weeklyVolume: number; // km
    monthlyVolume: number; // km
  };
}

interface AthleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteProfile | null;
  onSave: (athlete: AthleteProfile) => void;
  isCreateMode: boolean;
}

export function AthleteProfileModal({
  isOpen,
  onClose,
  athlete,
  onSave,
  isCreateMode
}: AthleteProfileModalProps) {
  const [formData, setFormData] = useState<AthleteProfile>(
    athlete || {
      id: '',
      name: '',
      email: '',
      phone: '',
      birthYear: new Date().getFullYear() - 25,
      height: 0,
      weight: 0,
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      athleticExperience: {
        yearsRunning: 0,
        weeklyVolume: 0,
        monthlyVolume: 0
      }
    }
  );

  const [activeTab, setActiveTab] = useState('basic');
  const currentYear = new Date().getFullYear();

  const handleSave = () => {
    // Validaciones
    if (!formData.name.trim()) {
      toast.error('El nombre completo es obligatorio');
      setActiveTab('basic');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      setActiveTab('basic');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('El número de teléfono es obligatorio');
      setActiveTab('basic');
      return;
    }

    if (formData.birthYear < 1950 || formData.birthYear > currentYear - 12) {
      toast.error('Por favor, ingresa un año de nacimiento válido');
      setActiveTab('physical');
      return;
    }

    if (formData.height <= 0 || formData.height > 250) {
      toast.error('Por favor, ingresa una altura válida (en cm)');
      setActiveTab('physical');
      return;
    }

    if (formData.weight <= 0 || formData.weight > 200) {
      toast.error('Por favor, ingresa un peso válido (en kg)');
      setActiveTab('physical');
      return;
    }

    if (!formData.emergencyContact.name.trim()) {
      toast.error('El nombre del contacto de emergencia es obligatorio');
      setActiveTab('emergency');
      return;
    }

    if (!formData.emergencyContact.phone.trim()) {
      toast.error('El teléfono de emergencia es obligatorio');
      setActiveTab('emergency');
      return;
    }

    if (formData.athleticExperience.yearsRunning < 0) {
      toast.error('Los años de experiencia no pueden ser negativos');
      setActiveTab('experience');
      return;
    }

    const athleteToSave: AthleteProfile = {
      ...formData,
      id: formData.id || `athlete-${Date.now()}`
    };

    onSave(athleteToSave);
    toast.success(isCreateMode ? 'Atleta creado exitosamente' : 'Perfil actualizado exitosamente');
    onClose();
  };

  // Calcular volumen mensual automáticamente
  const handleWeeklyVolumeChange = (weeklyVolume: number) => {
    const monthlyVolume = weeklyVolume * 4.33; // Promedio de semanas por mes
    setFormData(prev => ({
      ...prev,
      athleticExperience: {
        ...prev.athleticExperience,
        weeklyVolume,
        monthlyVolume: Math.round(monthlyVolume * 10) / 10 // Redondear a 1 decimal
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {isCreateMode ? 'Crear Nuevo Atleta' : 'Editar Perfil de Atleta'}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode 
              ? 'Complete la información básica del atleta'
              : 'Modifique la información del atleta'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2 px-4 py-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Información Básica</span>
              <span className="sm:hidden">Básica</span>
            </TabsTrigger>
            <TabsTrigger value="physical" className="flex items-center gap-2 px-4 py-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil Físico</span>
              <span className="sm:hidden">Físico</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2 px-4 py-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contacto Emergencia</span>
              <span className="sm:hidden">Emergencia</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2 px-4 py-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Experiencia Atlética</span>
              <span className="sm:hidden">Experiencia</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="basic" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información Básica
                  </CardTitle>
                  <CardDescription>
                    Datos personales y de contacto del atleta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre y apellidos completos"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@ejemplo.com"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Número de Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+34 666 777 888"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="physical" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Perfil Físico
                  </CardTitle>
                  <CardDescription>
                    Características físicas básicas del atleta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthYear">Año de Nacimiento *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="birthYear"
                          type="number"
                          value={formData.birthYear}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            birthYear: parseInt(e.target.value) || currentYear - 25 
                          }))}
                          min="1950"
                          max={currentYear - 12}
                          placeholder="1995"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Altura (cm) *</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          height: parseFloat(e.target.value) || 0 
                        }))}
                        min="120"
                        max="250"
                        placeholder="175"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          weight: parseFloat(e.target.value) || 0 
                        }))}
                        min="30"
                        max="200"
                        step="0.1"
                        placeholder="70.5"
                      />
                    </div>
                  </div>

                  {formData.birthYear && formData.birthYear > 1950 && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800">
                            Edad: {currentYear - formData.birthYear} años
                          </p>
                          <p className="text-sm text-blue-600">
                            Nacido en {formData.birthYear}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contacto de Emergencia
                  </CardTitle>
                  <CardDescription>
                    Persona a contactar en caso de emergencia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Nombre Completo *</Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          name: e.target.value
                        }
                      }))}
                      placeholder="Nombre y apellidos del contacto"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Teléfono de Emergencia *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="emergencyPhone"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              phone: e.target.value
                            }
                          }))}
                          placeholder="+34 600 111 222"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationship">Relación</Label>
                      <Select
                        value={formData.emergencyContact.relationship}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact,
                            relationship: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar relación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Padre">Padre</SelectItem>
                          <SelectItem value="Madre">Madre</SelectItem>
                          <SelectItem value="Cónyuge">Cónyuge</SelectItem>
                          <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                          <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                          <SelectItem value="Amigo/a">Amigo/a</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.emergencyContact.name && formData.emergencyContact.phone && (
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">
                            {formData.emergencyContact.name}
                          </p>
                          <p className="text-sm text-green-600">
                            {formData.emergencyContact.phone}
                          </p>
                          {formData.emergencyContact.relationship && (
                            <p className="text-sm text-green-600">
                              {formData.emergencyContact.relationship}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Experiencia Atlética
                  </CardTitle>
                  <CardDescription>
                    Historial de entrenamiento y volumen actual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="yearsRunning">Años de Experiencia Corriendo</Label>
                    <Input
                      id="yearsRunning"
                      type="number"
                      value={formData.athleticExperience.yearsRunning}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        athleticExperience: {
                          ...prev.athleticExperience,
                          yearsRunning: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="50"
                      placeholder="5"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weeklyVolume">Volumen Semanal (km)</Label>
                      <Input
                        id="weeklyVolume"
                        type="number"
                        value={formData.athleticExperience.weeklyVolume}
                        onChange={(e) => {
                          const weeklyVolume = parseFloat(e.target.value) || 0;
                          handleWeeklyVolumeChange(weeklyVolume);
                        }}
                        min="0"
                        step="0.1"
                        placeholder="50.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyVolume">Volumen Mensual (km)</Label>
                      <Input
                        id="monthlyVolume"
                        type="number"
                        value={formData.athleticExperience.monthlyVolume}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        placeholder="Calculado automáticamente"
                      />
                      <p className="text-xs text-muted-foreground">
                        Calculado automáticamente (volumen semanal × 4.33)
                      </p>
                    </div>
                  </div>

                  {formData.athleticExperience.weeklyVolume > 0 && (
                    <div className="p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
                      <div className="flex items-start gap-3">
                        <Activity className="w-5 h-5 text-accent mt-0.5" />
                        <div>
                          <p className="font-medium text-accent-foreground mb-1">
                            Clasificación de Volumen
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formData.athleticExperience.weeklyVolume < 30 ? '🟡 Volumen Bajo (< 30 km/semana)' :
                             formData.athleticExperience.weeklyVolume < 60 ? '🟠 Volumen Medio (30-60 km/semana)' :
                             formData.athleticExperience.weeklyVolume < 100 ? '🔴 Volumen Alto (60-100 km/semana)' :
                             '🟣 Volumen Muy Alto (> 100 km/semana)'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Volumen mensual estimado: {formData.athleticExperience.monthlyVolume} km
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <Separator className="flex-shrink-0 my-6" />

        <div className="flex justify-end gap-6 flex-shrink-0 px-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="min-w-[150px] px-6 py-2"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="min-w-[180px] px-6 py-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {isCreateMode ? 'Crear Atleta' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}