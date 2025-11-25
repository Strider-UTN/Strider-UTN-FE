import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { AthleteProfileModal } from './AthleteProfileModal';
import { AthleteInviteModal } from './AthleteInviteModal';
import { AthletePerformanceView } from './AthletePerformanceView';
import { MedicalClearanceUpload } from './MedicalClearanceUpload';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Activity,
  Heart,
  Users,
  User,
  UserPlus,
  Send,
  Eye,
  MessageSquare,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import { CoachAthleteRelationshipService, AthleteResponseDto } from '../services/coachAthleteRelationshipService';
import { Loader2, UserX, Trash2 } from 'lucide-react';
import { CoachInjuryService, type CoachRecentInjury } from '../services/coachInjuryService';

interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthYear: number;
  birthDate?: string; // Fecha de nacimiento completa (formato ISO)
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
  medicalInfo: {
    healthInsurance: {
      provider: string;
      memberNumber: string;
      hasInsurance?: boolean;
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
    medicalConditions?: string[];
  };
  status: 'Activo' | 'Lesionado' | 'Descanso' | 'Inactivo';
  joinDate: string;
  lastActivity: string;
  daysSinceLastWorkout?: number; // Días desde el último entrenamiento completado
  trainingStartDate?: string; // Fecha de inicio de entrenamiento (formato: YYYY-MM)
  vo2Max?: string; // Velocidad máxima por km en formato mm:ss (ejemplo: "03:30")
}

// Función para calcular años y meses de experiencia desde TrainingStartDate
const calculateExperience = (trainingStartDate?: string): { years: number; months: number } | null => {
  if (!trainingStartDate) {
    return null;
  }

  try {
    // Parsear formato YYYY-MM y crear fecha con día 1
    const [year, month] = trainingStartDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const today = new Date();

    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    // Si el día de hoy es menor que el día de inicio, restar un mes
    if (today.getDate() < startDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    return { years: Math.max(0, years), months: Math.max(0, months) };
  } catch (error) {
    console.error('Error al calcular experiencia:', error);
    return null;
  }
};

// Función para formatear experiencia como texto
const formatExperience = (trainingStartDate?: string): string => {
  const experience = calculateExperience(trainingStartDate);
  if (!experience) {
    return '-';
  }

  const parts: string[] = [];
  if (experience.years > 0) {
    parts.push(`${experience.years} ${experience.years === 1 ? 'Año' : 'Años'}`);
  }
  if (experience.months > 0) {
    parts.push(`${experience.months} ${experience.months === 1 ? 'Mes' : 'Meses'}`);
  }

  return parts.length > 0 ? parts.join(' y ') : '-';
};

export function IndividualAthletesManagement() {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [athletesWithRelationships, setAthletesWithRelationships] = useState<Map<string, number>>(new Map()); // Map<athleteId, relationshipId>
  const [isLoading, setIsLoading] = useState(true);
  const [isRemovingRelationship, setIsRemovingRelationship] = useState<string | null>(null);
  const [recentInjuries, setRecentInjuries] = useState<CoachRecentInjury[]>([]);
  const [isLoadingRecentInjuries, setIsLoadingRecentInjuries] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);

  const [isAthleteDetailsModalOpen, setIsAthleteDetailsModalOpen] = useState(false);
  const [athleteForDetails, setAthleteForDetails] = useState<AthleteProfile | null>(null);
  const [athleteInjuries, setAthleteInjuries] = useState<CoachRecentInjury[]>([]);
  const [isLoadingAthleteInjuries, setIsLoadingAthleteInjuries] = useState(false);
  const [showPerformanceView, setShowPerformanceView] = useState(false);
  const [athleteForPerformance, setAthleteForPerformance] = useState<AthleteProfile | null>(null);
  const [isMedicalClearanceModalOpen, setIsMedicalClearanceModalOpen] = useState(false);
  const [athleteForMedicalClearance, setAthleteForMedicalClearance] = useState<AthleteProfile | null>(null);
  const [selectedInjury, setSelectedInjury] = useState<CoachRecentInjury | null>(null);
  const [isInjuryDetailsModalOpen, setIsInjuryDetailsModalOpen] = useState(false);

  // Cargar atletas del backend
  useEffect(() => {
    const loadAthletes = async () => {
      setIsLoading(true);
      try {
        const athleteRelationships = await CoachAthleteRelationshipService.getMyAthletes('Accepted');
        
        // Mapear los atletas del backend a la estructura AthleteProfile
        // Nota: El backend solo devuelve información básica, algunos campos pueden ser mock por ahora
        const mappedAthletes: AthleteProfile[] = athleteRelationships.map((athlete: AthleteResponseDto) => {
          // Calcular birthYear desde birthDate si está disponible
          let birthYear = 1990; // Default
          if (athlete.birthDate) {
            birthYear = new Date(athlete.birthDate).getFullYear();
          }
          
          // Calcular si el apto físico está expirado
          const isExpired = athlete.medicalClearanceExpiryDate 
            ? new Date(athlete.medicalClearanceExpiryDate) < new Date()
            : false;
          
          const hasValidClearance = !!athlete.lastCheckupDate;

          return {
          id: athlete.id.toString(),
          name: athlete.name,
          email: athlete.email,
          phone: athlete.phone || '',
          birthYear: birthYear,
          birthDate: athlete.birthDate,
          height: athlete.height || 0,
          weight: athlete.weight || 0,
          emergencyContact: {
            name: athlete.emergencyContactName || '',
            phone: athlete.emergencyContactPhone || '',
            relationship: athlete.emergencyContactRelationship || ''
          },
          athleticExperience: {
            yearsRunning: 5, // TODO: Calcular desde trainingStartDate
            weeklyVolume: 50, // TODO: Obtener del backend cuando esté disponible
            monthlyVolume: 200 // TODO: Obtener del backend cuando esté disponible
          },
          medicalInfo: {
            healthInsurance: {
              provider: athlete.healthInsuranceProvider || '',
              memberNumber: athlete.healthInsuranceMemberNumber || '',
              hasInsurance: athlete.hasHealthInsurance || false
            },
            medicalClearance: {
              hasValidClearance: hasValidClearance,
              lastCheckupDate: athlete.lastCheckupDate,
              expiryDate: athlete.medicalClearanceExpiryDate,
              isExpired: isExpired
            },
            medicalConditions: athlete.medicalConditions || []
          },
          status: 'Activo' as const,
          joinDate: athlete.linkedSince ? new Date(athlete.linkedSince).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActivity: athlete.lastActivity ? new Date(athlete.lastActivity).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          daysSinceLastWorkout: athlete.daysSinceLastWorkout,
          trainingStartDate: athlete.trainingStartDate,
          vo2Max: (athlete as any).vO2Max || athlete.vo2Max // Backend retorna vO2Max (camelCase)
        };
        });

        setAthletes(mappedAthletes);
        
        // Guardar el mapeo de athleteId -> relationshipId
        const relationshipMap = new Map<string, number>();
        athleteRelationships.forEach((athlete: AthleteResponseDto) => {
          relationshipMap.set(athlete.id.toString(), athlete.relationshipId);
        });
        setAthletesWithRelationships(relationshipMap);
      } catch (error) {
        console.error('Error al cargar atletas:', error);
        toast.error('Error al cargar la lista de atletas');
      } finally {
        setIsLoading(false);
      }
    };

    loadAthletes();
    const loadCoachInjuries = async () => {
      setIsLoadingRecentInjuries(true);
      try {
        const injuries = await CoachInjuryService.getRecentInjuries();
        setRecentInjuries(injuries);
      } catch (error) {
        console.error('Error al cargar lesiones recientes:', error);
        toast.error('No se pudieron cargar las lesiones recientes de tus atletas');
      } finally {
        setIsLoadingRecentInjuries(false);
      }
    };

    loadCoachInjuries();
  }, []);

  useEffect(() => {
    if (recentInjuries.length === 0) {
      setAthletes(prev => prev.map(athlete =>
        athlete.status === 'Lesionado'
          ? { ...athlete, status: 'Activo' as const }
          : athlete
      ));
      return;
    }

    const injuredIds = new Set(recentInjuries.map(injury => injury.athleteId.toString()));

    setAthletes(prev => prev.map(athlete => {
      if (injuredIds.has(athlete.id) && athlete.status !== 'Lesionado') {
        return { ...athlete, status: 'Lesionado' as const };
      }

      if (!injuredIds.has(athlete.id) && athlete.status === 'Lesionado') {
        return { ...athlete, status: 'Activo' as const };
      }

      return athlete;
    }));
  }, [recentInjuries]);

  // Función para recargar atletas (usada después de eliminar o invitar)
  const reloadAthletes = async () => {
    setIsLoading(true);
    try {
      const athleteRelationships = await CoachAthleteRelationshipService.getMyAthletes('Accepted');
      
      const mappedAthletes: AthleteProfile[] = athleteRelationships.map((athlete: AthleteResponseDto) => {
        let birthYear = 1990;
        if (athlete.birthDate) {
          birthYear = new Date(athlete.birthDate).getFullYear();
        }
        
        const isExpired = athlete.medicalClearanceExpiryDate 
          ? new Date(athlete.medicalClearanceExpiryDate) < new Date()
          : false;
        
        const hasValidClearance = !!athlete.lastCheckupDate;

        return {
          id: athlete.id.toString(),
          name: athlete.name,
          email: athlete.email,
          phone: athlete.phone || '',
          birthYear: birthYear,
          birthDate: athlete.birthDate,
          height: athlete.height || 0,
          weight: athlete.weight || 0,
          emergencyContact: {
            name: athlete.emergencyContactName || '',
            phone: athlete.emergencyContactPhone || '',
            relationship: athlete.emergencyContactRelationship || ''
          },
          athleticExperience: {
            yearsRunning: 5, // TODO: Calcular desde trainingStartDate
            weeklyVolume: 50, // TODO: Obtener del backend cuando esté disponible
            monthlyVolume: 200 // TODO: Obtener del backend cuando esté disponible
          },
          medicalInfo: {
            healthInsurance: {
              provider: athlete.healthInsuranceProvider || '',
              memberNumber: athlete.healthInsuranceMemberNumber || '',
              hasInsurance: athlete.hasHealthInsurance || false
            },
            medicalClearance: {
              hasValidClearance: hasValidClearance,
              lastCheckupDate: athlete.lastCheckupDate,
              expiryDate: athlete.medicalClearanceExpiryDate,
              isExpired: isExpired
            },
            medicalConditions: athlete.medicalConditions || []
          },
          status: 'Activo' as const,
          joinDate: athlete.linkedSince ? new Date(athlete.linkedSince).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActivity: athlete.lastActivity ? new Date(athlete.lastActivity).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          daysSinceLastWorkout: athlete.daysSinceLastWorkout,
          trainingStartDate: athlete.trainingStartDate,
          vo2Max: (athlete as any).vO2Max || athlete.vo2Max // Backend retorna vO2Max (camelCase)
        };
      });

      setAthletes(mappedAthletes);
      
      const relationshipMap = new Map<string, number>();
      athleteRelationships.forEach((athlete: AthleteResponseDto) => {
        relationshipMap.set(athlete.id.toString(), athlete.relationshipId);
      });
      setAthletesWithRelationships(relationshipMap);
    } catch (error) {
      console.error('Error al recargar atletas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || athlete.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });



  const handleInviteAthlete = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteModalClose = async () => {
    setIsInviteModalOpen(false);
    // Recargar la lista después de invitar un atleta
    // para mostrar si el atleta aceptó la invitación inmediatamente
    await reloadAthletes();
  };

  const handleEditAthlete = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsProfileModalOpen(true);
  };

  const handleSaveAthlete = (athleteData: any) => {
    // El AthleteProfileModal usa una interfaz diferente, así que mapeamos los campos necesarios
    setAthletes(prev => prev.map(a => 
      a.id === athleteData.id ? { 
        ...a,
        ...athleteData,
        status: a.status, 
        joinDate: a.joinDate, 
        lastActivity: a.lastActivity,
        medicalInfo: a.medicalInfo // Mantener la información médica existente
      } : a
    ));
    toast.success('Perfil actualizado exitosamente');
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    const relationshipId = athletesWithRelationships.get(athleteId);
    
    if (!relationshipId) {
      toast.error('No se pudo encontrar la relación con este atleta');
      return;
    }

    setIsRemovingRelationship(athleteId);

    try {
      await CoachAthleteRelationshipService.removeRelationship(relationshipId);
      
      // Recargar la lista completa desde el backend para asegurar consistencia
      await reloadAthletes();
    } catch (error) {
      console.error('Error al eliminar relación:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setIsRemovingRelationship(null);
    }
  };

  const handleViewAthleteDetails = async (athlete: AthleteProfile) => {
    setAthleteForDetails(athlete);
    setIsAthleteDetailsModalOpen(true);
    // Cargar lesiones del atleta
    setIsLoadingAthleteInjuries(true);
    try {
      const injuries = await CoachInjuryService.getTop3RecentInjuriesForAthlete(parseInt(athlete.id));
      setAthleteInjuries(injuries);
    } catch (error) {
      console.error('Error al cargar lesiones del atleta:', error);
      setAthleteInjuries([]);
    } finally {
      setIsLoadingAthleteInjuries(false);
    }
  };

  const handleViewAthletePerformance = (athlete: AthleteProfile) => {
    setAthleteForPerformance(athlete);
    setShowPerformanceView(true);
  };

  const handleBackFromPerformance = () => {
    setShowPerformanceView(false);
    setAthleteForPerformance(null);
  };

  const handleManageMedicalClearance = (athlete: AthleteProfile) => {
    setAthleteForMedicalClearance(athlete);
    setIsMedicalClearanceModalOpen(true);
  };

  const handleSaveMedicalClearance = (clearance: any) => {
    if (athleteForMedicalClearance) {
      setAthletes(prev => prev.map(a => 
        a.id === athleteForMedicalClearance.id 
          ? { 
              ...a, 
              medicalInfo: {
                ...a.medicalInfo,
                medicalClearance: {
                  ...a.medicalInfo.medicalClearance,
                  ...clearance
                }
              }
            }
          : a
      ));
      
      // Si hay atleta seleccionado para detalles, actualizar también
      if (athleteForDetails?.id === athleteForMedicalClearance.id) {
        setAthleteForDetails({
          ...athleteForMedicalClearance,
          medicalInfo: {
            ...athleteForMedicalClearance.medicalInfo,
            medicalClearance: {
              ...athleteForMedicalClearance.medicalInfo.medicalClearance,
              ...clearance
            }
          }
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Lesionado': return 'bg-red-100 text-red-800';
      case 'Descanso': return 'bg-yellow-100 text-yellow-800';
      case 'Inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVolumeClassification = (weeklyVolume: number) => {
    if (weeklyVolume < 30) return { text: 'Bajo', color: 'bg-yellow-100 text-yellow-800' };
    if (weeklyVolume < 60) return { text: 'Medio', color: 'bg-blue-100 text-blue-800' };
    if (weeklyVolume < 100) return { text: 'Alto', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Muy Alto', color: 'bg-red-100 text-red-800' };
  };

  // Calcular edad desde birthDate considerando si el cumpleaños ya pasó este año
  const calculateAge = (birthDate?: string | null): number => {
    if (!birthDate) return 0;
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      // Verificar que la fecha es válida
      if (isNaN(birth.getTime())) return 0;
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : 0;
    } catch {
      return 0;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getSeverityBadge = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'mild':
        return 'bg-yellow-200 text-yellow-900 border-yellow-400 font-semibold';
      case 'moderate':
        return 'bg-orange-200 text-orange-900 border-orange-400 font-semibold';
      case 'severe':
        return 'bg-red-200 text-red-900 border-red-400 font-semibold';
      default:
        return 'bg-gray-200 text-gray-900 border-gray-400 font-semibold';
    }
  };

  const mapSeverityLabel = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'mild':
        return 'Leve';
      case 'moderate':
        return 'Moderada';
      case 'severe':
        return 'Grave';
      default:
        return severity;
    }
  };

  const mapStatusLabel = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Activa';
      case 'undertreatment':
        return 'En Tratamiento';
      case 'recovered':
        return 'Recuperada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-red-200 text-red-900 border-red-400 font-semibold';
      case 'undertreatment':
        return 'bg-orange-200 text-orange-900 border-orange-400 font-semibold';
      case 'recovered':
        return 'bg-green-200 text-green-900 border-green-400 font-semibold';
      case 'cancelled':
        return 'bg-gray-200 text-gray-900 border-gray-400 font-semibold';
      default:
        return 'bg-gray-200 text-gray-900 border-gray-400 font-semibold';
    }
  };

  const mapImpactLabel = (impact?: string | null): string => {
    if (!impact) {
      return 'Impacto no informado';
    }

    switch (impact.toLowerCase()) {
      case 'none':
        return 'Ninguno';
      case 'low':
        return 'Bajo';
      case 'moderate':
        return 'Moderado';
      case 'high':
        return 'Alto';
      case 'full':
        return 'Completo';
      default:
        return impact;
    }
  };

  const mapTreatmentLabel = (treatment?: string | null): string => {
    if (!treatment) {
      return 'No informado';
    }

    switch (treatment.toLowerCase()) {
      case 'rest':
        return 'Reposo';
      case 'physiotherapy':
        return 'Fisioterapia';
      case 'medication':
        return 'Medicación';
      case 'rehabilitation':
        return 'Rehabilitación';
      case 'manualtherapy':
        return 'Terapia Manual';
      case 'specificexercises':
        return 'Ejercicios Específicos';
      case 'cryotherapy':
        return 'Crioterapia';
      case 'thermotherapy':
        return 'Termoterapia';
      case 'electrotherapy':
        return 'Electroterapia';
      case 'surgery':
        return 'Cirugía';
      case 'other':
        return 'Otro';
      default:
        return treatment;
    }
  };

  const mapInjuryLocationToSpanish = (location?: string | null): string => {
    if (!location) {
      return 'No informada';
    }
    
    const normalized = location.trim();
    
    const mapping: Record<string, string> = {
      'Head': 'Cabeza',
      'head': 'Cabeza',
      'Neck': 'Cuello',
      'neck': 'Cuello',
      'RightShoulder': 'Hombro Derecho',
      'rightShoulder': 'Hombro Derecho',
      'rightshoulder': 'Hombro Derecho',
      'LeftShoulder': 'Hombro Izquierdo',
      'leftShoulder': 'Hombro Izquierdo',
      'leftshoulder': 'Hombro Izquierdo',
      'RightArm': 'Brazo Derecho',
      'rightArm': 'Brazo Derecho',
      'rightarm': 'Brazo Derecho',
      'LeftArm': 'Brazo Izquierdo',
      'leftArm': 'Brazo Izquierdo',
      'leftarm': 'Brazo Izquierdo',
      'RightElbow': 'Codo Derecho',
      'rightElbow': 'Codo Derecho',
      'rightelbow': 'Codo Derecho',
      'LeftElbow': 'Codo Izquierdo',
      'leftElbow': 'Codo Izquierdo',
      'leftelbow': 'Codo Izquierdo',
      'RightWrist': 'Muñeca Derecha',
      'rightWrist': 'Muñeca Derecha',
      'rightwrist': 'Muñeca Derecha',
      'LeftWrist': 'Muñeca Izquierda',
      'leftWrist': 'Muñeca Izquierda',
      'leftwrist': 'Muñeca Izquierda',
      'RightHand': 'Mano Derecha',
      'rightHand': 'Mano Derecha',
      'righthand': 'Mano Derecha',
      'LeftHand': 'Mano Izquierda',
      'leftHand': 'Mano Izquierda',
      'lefthand': 'Mano Izquierda',
      'Chest': 'Pecho',
      'chest': 'Pecho',
      'UpperBack': 'Espalda Alta',
      'upperBack': 'Espalda Alta',
      'upperback': 'Espalda Alta',
      'LowerBack': 'Espalda Baja',
      'lowerBack': 'Espalda Baja',
      'lowerback': 'Espalda Baja',
      'Abdomen': 'Abdomen',
      'abdomen': 'Abdomen',
      'Hip': 'Cadera',
      'hip': 'Cadera',
      'RightThigh': 'Muslo Derecho',
      'rightThigh': 'Muslo Derecho',
      'rightthigh': 'Muslo Derecho',
      'LeftThigh': 'Muslo Izquierdo',
      'leftThigh': 'Muslo Izquierdo',
      'leftthigh': 'Muslo Izquierdo',
      'RightKnee': 'Rodilla Derecha',
      'rightKnee': 'Rodilla Derecha',
      'rightknee': 'Rodilla Derecha',
      'LeftKnee': 'Rodilla Izquierda',
      'leftKnee': 'Rodilla Izquierda',
      'leftknee': 'Rodilla Izquierda',
      'RightCalf': 'Pantorrilla Derecha',
      'rightCalf': 'Pantorrilla Derecha',
      'rightcalf': 'Pantorrilla Derecha',
      'LeftCalf': 'Pantorrilla Izquierda',
      'leftCalf': 'Pantorrilla Izquierda',
      'leftcalf': 'Pantorrilla Izquierda',
      'RightAnkle': 'Tobillo Derecho',
      'rightAnkle': 'Tobillo Derecho',
      'rightankle': 'Tobillo Derecho',
      'LeftAnkle': 'Tobillo Izquierdo',
      'leftAnkle': 'Tobillo Izquierdo',
      'leftankle': 'Tobillo Izquierdo',
      'RightFoot': 'Pie Derecho',
      'rightFoot': 'Pie Derecho',
      'rightfoot': 'Pie Derecho',
      'LeftFoot': 'Pie Izquierdo',
      'leftFoot': 'Pie Izquierdo',
      'leftfoot': 'Pie Izquierdo',
      'RightAchilles': 'Aquiles Derecho',
      'rightAchilles': 'Aquiles Derecho',
      'rightachilles': 'Aquiles Derecho',
      'LeftAchilles': 'Aquiles Izquierdo',
      'leftAchilles': 'Aquiles Izquierdo',
      'leftachilles': 'Aquiles Izquierdo'
    };
    
    return mapping[normalized] || location;
  };

  // Si se está mostrando la vista de rendimiento, renderizar AthletePerformanceView
  if (showPerformanceView && athleteForPerformance) {
    // Calcular edad desde birthDate considerando si el cumpleaños ya pasó este año
    const calculateAge = (birthDate?: string): number => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    return (
      <AthletePerformanceView
        athlete={{
          id: athleteForPerformance.id,
          name: athleteForPerformance.name,
          email: athleteForPerformance.email,
          age: calculateAge(athleteForPerformance.birthDate),
          groupName: 'Sin grupo', // TODO: Obtener del backend cuando esté disponible
          joinDate: athleteForPerformance.joinDate,
          vo2Max: athleteForPerformance.vo2Max
        }}
        onBack={handleBackFromPerformance}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando atletas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Lesiones activas en tus atletas
            </CardTitle>
            <CardDescription>
              Monitorea las lesiones en curso y el impacto estimado en los entrenamientos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRecentInjuries ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Cargando lesiones recientes...
            </div>
          ) : recentInjuries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              No hay atletas con lesiones activas.
            </div>
          ) : (
            <Accordion type="single" collapsible defaultValue="recent-injuries">
              <AccordionItem value="recent-injuries">
                <AccordionTrigger>
                  {`Lesiones activas (${recentInjuries.length})`}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {recentInjuries.map(injury => (
                      <div
                        key={injury.injuryId}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {injury.athleteName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {injury.title} · Registrada el {new Date(injury.createdAt).toLocaleDateString('es-ES')}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className={getSeverityBadge(injury.severity)}>
                              {mapSeverityLabel(injury.severity)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Impacto en entrenamiento: {mapImpactLabel(injury.impactOnTraining)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          <p className="text-sm text-muted-foreground">
                            Recuperación estimada: {injury.recoveryEstimateDate ? new Date(injury.recoveryEstimateDate).toLocaleDateString('es-ES') : 'No informada'}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInjury(injury);
                              setIsInjuryDetailsModalOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Medical Clearance Modal */}
      {athleteForMedicalClearance && (
        <MedicalClearanceUpload
          isOpen={isMedicalClearanceModalOpen}
          onClose={() => {
            setIsMedicalClearanceModalOpen(false);
            setAthleteForMedicalClearance(null);
          }}
          athleteName={athleteForMedicalClearance.name}
          currentClearance={athleteForMedicalClearance.medicalInfo.medicalClearance}
          onSave={handleSaveMedicalClearance}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Mis Atletas</h1>
          <p className="text-muted-foreground">
            Gestiona los perfiles de tus atletas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInviteAthlete}>
            <Send className="w-4 h-4 mr-2" />
            Invitar Atleta
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atletas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Lesionado">Lesionado</SelectItem>
                <SelectItem value="Descanso">Descanso</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredAthletes.length} atletas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de atletas */}
      <div className="grid gap-4">
        {filteredAthletes.map(athlete => {
          const volumeClassification = getVolumeClassification(athlete.athleticExperience.weeklyVolume);
          
          return (
            <Card key={athlete.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback>{getInitials(athlete.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{athlete.name}</h3>
                          <Badge className={`${getStatusColor(athlete.status)}`}>
                            {athlete.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{athlete.email}</span>
                          <Phone className="w-3 h-3 ml-2" />
                          <span>{athlete.phone}</span>
                        </div>
                      </div>

                      {/* Información esencial simplificada */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-accent" />
                          <div>
                            <p className="text-muted-foreground">Experiencia</p>
                            <p className="font-medium">{formatExperience(athlete.trainingStartDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-secondary" />
                          <div>
                            <p className="text-muted-foreground">Edad</p>
                            <p className="font-medium">
                              {athlete.birthDate 
                                ? `${calculateAge(athlete.birthDate)} años` 
                                : athlete.birthYear && athlete.birthYear > 1900
                                  ? `${new Date().getFullYear() - athlete.birthYear} años`
                                  : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="text-muted-foreground">VO₂ Max</p>
                            <p className="font-medium">{athlete.vo2Max || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Días desde último entrenamiento</p>
                            <p className={`font-medium ${
                              athlete.daysSinceLastWorkout != null && athlete.daysSinceLastWorkout > 5
                                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                                : ''
                            }`}>
                              {athlete.daysSinceLastWorkout != null 
                                ? `${athlete.daysSinceLastWorkout} ${athlete.daysSinceLastWorkout === 1 ? 'día' : 'días'}`
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAthletePerformance(athlete)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Activity className="w-4 h-4 mr-1" />
                      Rendimiento
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAthleteDetails(athlete)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Ver Detalles
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteAthlete(athlete.id)}
                          disabled={isRemovingRelationship === athlete.id}
                          className="text-destructive focus:text-destructive"
                        >
                          {isRemovingRelationship === athlete.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Eliminar Relación
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAthletes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium">No se encontraron atletas</p>
                <p className="text-sm">Invita atletas para que se unan a tu planificación</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={handleInviteAthlete}>
                  <Send className="w-4 h-4 mr-2" />
                  Invitar atleta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de perfil */}
      <AthleteProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        athlete={selectedAthlete}
        onSave={handleSaveAthlete}
        isCreateMode={false}
      />

      {/* Modal de invitación */}
      <AthleteInviteModal
        isOpen={isInviteModalOpen}
        onClose={handleInviteModalClose}
        coachName="Carlos Martínez" // Este debería venir del contexto del usuario autenticado
      />

      {/* Modal de detalles del atleta */}
      <Dialog open={isAthleteDetailsModalOpen} onOpenChange={setIsAthleteDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalles del Atleta
            </DialogTitle>
            <DialogDescription>
              Información completa del perfil del atleta
            </DialogDescription>
          </DialogHeader>

          {athleteForDetails && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-lg">
                    {getInitials(athleteForDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{athleteForDetails.name}</h3>
                  <div className="flex items-center gap-4 text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{athleteForDetails.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{athleteForDetails.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getStatusColor(athleteForDetails.status)}>
                      {athleteForDetails.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Información detallada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edad:</span>
                      <span className="font-medium">
                        {athleteForDetails.birthDate 
                          ? `${calculateAge(athleteForDetails.birthDate)} años` 
                          : athleteForDetails.birthYear && athleteForDetails.birthYear > 1900
                            ? `${new Date().getFullYear() - athleteForDetails.birthYear} años`
                            : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Año de nacimiento:</span>
                      <span className="font-medium">{athleteForDetails.birthYear}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Físico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Altura:</span>
                      <span className="font-medium">{athleteForDetails.height} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso:</span>
                      <span className="font-medium">{athleteForDetails.weight} kg</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      Experiencia Atlética
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experiencia:</span>
                      <span className="font-medium">{formatExperience(athleteForDetails.trainingStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vol. semanal:</span>
                      <span className="font-medium">{athleteForDetails.athleticExperience.weeklyVolume} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vol. mensual:</span>
                      <span className="font-medium">{athleteForDetails.athleticExperience.monthlyVolume} km</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      Contacto de Emergencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">{athleteForDetails.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-medium">{athleteForDetails.emergencyContact.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Relación:</span>
                      <span className="font-medium">{athleteForDetails.emergencyContact.relationship}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Información Médica */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Información Médica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        Obra Social
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tiene prepaga/obra social:</span>
                        <Badge className={athleteForDetails.medicalInfo.healthInsurance.hasInsurance 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'}>
                          {athleteForDetails.medicalInfo.healthInsurance.hasInsurance ? 'Sí' : 'No'}
                        </Badge>
                      </div>
                      {athleteForDetails.medicalInfo.healthInsurance.hasInsurance && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Proveedor:</span>
                            <span className="font-medium">
                              {athleteForDetails.medicalInfo.healthInsurance.provider || 'No especificado'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">N° de Afiliado:</span>
                            <span className="font-medium">
                              {athleteForDetails.medicalInfo.healthInsurance.memberNumber || 'No especificado'}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {athleteForDetails.medicalInfo.medicalClearance.hasValidClearance ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        Apto Físico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge className={
                          athleteForDetails.medicalInfo.medicalClearance.hasValidClearance
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {athleteForDetails.medicalInfo.medicalClearance.hasValidClearance ? 'Vigente' : 'No Vigente'}
                        </Badge>
                      </div>
                      {athleteForDetails.medicalInfo.medicalClearance.lastCheckupDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Último control:</span>
                          <span className="font-medium">
                            {formatDate(athleteForDetails.medicalInfo.medicalClearance.lastCheckupDate)}
                          </span>
                        </div>
                      )}
                      {athleteForDetails.medicalInfo.medicalClearance.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vencimiento:</span>
                          <span className={`font-medium ${
                            athleteForDetails.medicalInfo.medicalClearance.isExpired 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {formatDate(athleteForDetails.medicalInfo.medicalClearance.expiryDate)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Condiciones Médicas */}
                {athleteForDetails.medicalInfo.medicalConditions && athleteForDetails.medicalInfo.medicalConditions.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        Condiciones Médicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {athleteForDetails.medicalInfo.medicalConditions.map((condition, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {condition}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Lesiones Recientes */}
                {isLoadingAthleteInjuries ? (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Lesiones Recientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Cargando lesiones...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : athleteInjuries.length > 0 ? (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Lesiones Recientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {athleteInjuries.map((injury) => (
                          <div key={injury.injuryId} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">{injury.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Diagnóstico: {new Date(injury.diagnosisDate).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                                <Badge className={`${getSeverityBadge(injury.severity)} border-2`}>
                                  {mapSeverityLabel(injury.severity)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge className={`${getStatusBadge(injury.status)} border-2 text-xs`}>
                                  Estado: {mapStatusLabel(injury.status)}
                                </Badge>
                                {injury.impactOnTraining && (
                                  <Badge variant="outline" className="text-xs">
                                    Impacto: {mapImpactLabel(injury.impactOnTraining)}
                                  </Badge>
                                )}
                              </div>
                            {injury.recoveryDate ? (
                              <p className="text-xs text-green-600 font-medium">
                                ✓ Recuperado el: {new Date(injury.recoveryDate).toLocaleDateString('es-ES')}
                              </p>
                            ) : injury.recoveryEstimateDate && (
                              <p className="text-xs text-muted-foreground">
                                Recuperación estimada: {new Date(injury.recoveryEstimateDate).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Injury Details Modal */}
      <Dialog open={isInjuryDetailsModalOpen} onOpenChange={setIsInjuryDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Detalles de la Lesión
            </DialogTitle>
            <DialogDescription>
              Información completa de la lesión reportada
            </DialogDescription>
          </DialogHeader>
          
          {selectedInjury && (
            <div className="space-y-6">
              {/* Información del Atleta */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">ATLETA</h3>
                <p className="text-lg font-medium">{selectedInjury.athleteName}</p>
              </div>

              <Separator />

              {/* Título y Ubicación */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">TÍTULO</h3>
                <p className="text-base">{selectedInjury.title}</p>
              </div>

              {/* Ubicación */}
              {selectedInjury.affectedArea && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">UBICACIÓN</h3>
                    <Badge variant="outline" className="text-sm">
                      {mapInjuryLocationToSpanish(selectedInjury.affectedArea)}
                    </Badge>
                  </div>
                </>
              )}

              <Separator />

              {/* Estado y Severidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">ESTADO</h3>
                  <Badge variant="outline" className="text-sm">
                    {mapStatusLabel(selectedInjury.status)}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">SEVERIDAD</h3>
                  <Badge className={getSeverityBadge(selectedInjury.severity)}>
                    {mapSeverityLabel(selectedInjury.severity)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">FECHA DE DIAGNÓSTICO</h3>
                  <p className="text-sm">
                    {new Date(selectedInjury.diagnosisDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">RECUPERACIÓN ESTIMADA</h3>
                  <p className="text-sm">
                    {selectedInjury.recoveryEstimateDate
                      ? new Date(selectedInjury.recoveryEstimateDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'No informada'}
                  </p>
                </div>
                {selectedInjury.recoveryDate && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">FECHA DE RECUPERACIÓN</h3>
                    <p className="text-sm">
                      {new Date(selectedInjury.recoveryDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Impacto en Entrenamiento */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">IMPACTO EN ENTRENAMIENTO</h3>
                <Badge variant="outline" className="text-sm">
                  {mapImpactLabel(selectedInjury.impactOnTraining)}
                </Badge>
              </div>

              {/* Descripción */}
              {selectedInjury.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">DESCRIPCIÓN</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedInjury.description}</p>
                  </div>
                </>
              )}

              {/* Tratamiento */}
              {selectedInjury.treatment && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">TRATAMIENTO</h3>
                    <Badge variant="outline" className="text-sm">
                      {mapTreatmentLabel(selectedInjury.treatment)}
                    </Badge>
                  </div>
                </>
              )}

              {/* Notas */}
              {selectedInjury.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">NOTAS</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedInjury.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Fecha de Registro */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">REGISTRADA EL</h3>
                <p className="text-sm">
                  {new Date(selectedInjury.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}