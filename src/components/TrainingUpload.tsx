import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Upload, Calendar as CalendarIcon, Plus, ShieldAlert, Timer, Heart, Zap, Target, User, ArrowRight, ArrowLeft, CheckCircle, Watch, Download, Link2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { format, addDays, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface InjuryReport {
  bodyPart: string;
  severity: number; // 1-10 scale
  description: string;
  affectedPerformance: boolean;
  type: 'Molestia' | 'Dolor';
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  type: string;
  duration: number;
  distance: number;
  avgPace: string;
  maxHR: number;
  avgHR: number;
  calories: number;
  elevation: number;
  comments: string;
  sensations: {
    effort: number;
    fatigue: number;
    motivation: number;
    muscularLoad: number;
    overallFeeling: number;
  };
  conditions: {
    temperature: number;
    weather: string;
    surface: string;
    humidity?: number;
    wind?: string;
  };
  splits: Array<{
    km: number;
    pace: string;
    hr: number;
    elevation: number;
    cadence?: number;
  }>;
  hrZones: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  advancedMetrics: {
    vo2MaxPercentage?: number;
    trainingLoad?: number;
    recoveryTime?: number;
    cadence?: number;
    strideLength?: number;
    verticalOscillation?: number;
    groundContactTime?: number;
  };
  route?: {
    startLocation: string;
    endLocation: string;
    routeType: string;
  };
  injuries?: InjuryReport[];
  associatedSessionId?: string;
  linkedSessionId?: string;
  status: 'Pendiente' | 'Completado' | 'Incompleto' | 'Parcialmente Incompleto';
  uploadSource: 'manual' | 'garmin';
}

interface Athlete {
  id: string;
  name: string;
  specialty: string;
}

interface PlannedSession {
  id: string;
  date: string;
  name: string;
  type: string;
  plannedDuration: number;
  plannedDistance: number;
  plannedPace: string;
  targetHR: string;
  athleteId: string;
  planningName: string;
  intervals?: Array<{
    type: 'work' | 'rest';
    duration: number;
    pace: string;
    intensity: string;
    distance?: number;
  }>;
}

interface GarminActivity {
  id: string;
  activityName: string;
  activityType: string;
  startTime: string;
  duration: number; // in minutes
  distance: number; // in km
  averagePace: string; // min/km format
  averageHR: number;
  maxHR: number;
  calories: number;
  elevation: number;
  cadence?: number;
  trainingEffect?: number;
}

export function TrainingUpload() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateInputValue, setDateInputValue] = useState('');

  const [currentInjury, setCurrentInjury] = useState<Partial<InjuryReport>>({
    bodyPart: 'none',
    severity: 1,
    description: '',
    affectedPerformance: false,
    type: 'Molestia'
  });

  const [sessionId, setSessionId] = useState('');
  const [completedTraining, setCompletedTraining] = useState<TrainingSession | null>(null);
  
  // Garmin states
  const [isGarminConnected, setIsGarminConnected] = useState(false);
  const [isConnectingGarmin, setIsConnectingGarmin] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'garmin' | 'manual'>('garmin');
  const [garminDateRange, setGarminDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedGarminActivity, setSelectedGarminActivity] = useState<string>('');
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [garminDateInputFrom, setGarminDateInputFrom] = useState('');
  const [garminDateInputTo, setGarminDateInputTo] = useState('');
  
  // Garmin login modal states
  const [showGarminModal, setShowGarminModal] = useState(false);
  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [garminFormErrors, setGarminFormErrors] = useState<{ email?: string; password?: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    duration: '',
    distance: '',
    avgPace: '',
    maxHR: '',
    avgHR: '',
    calories: '',
    elevation: '',
    comments: '',
    effort: 5,
    fatigue: 5,
    motivation: 5,
    muscularLoad: 5,
    overallFeeling: 5,
    temperature: '',
    weather: '',
    surface: '',
    humidity: '',
    wind: '',
    vo2MaxPercentage: '',
    cadence: '',
    strideLength: '',
    verticalOscillation: '',
    groundContactTime: ''
  });

  // Lista de partes del cuerpo para el selector
  const bodyParts = [
    'Rodilla izquierda', 'Rodilla derecha',
    'Tobillo izquierdo', 'Tobillo derecho',
    'Pantorrilla izquierda', 'Pantorrilla derecha',
    'Cuádriceps izquierdo', 'Cuádriceps derecho',
    'Isquiotibiales izquierdos', 'Isquiotibiales derechos',
    'Gemelo izquierdo', 'Gemelo derecho',
    'Pie izquierdo', 'Pie derecho',
    'Cadera izquierda', 'Cadera derecha',
    'Espalda baja', 'Espalda media', 'Espalda alta',
    'Hombro izquierdo', 'Hombro derecho',
    'Otra zona'
  ];

  // Mock data de actividades de Garmin (se mostrarían según el rango de fechas)
  const mockGarminActivities: GarminActivity[] = [
    {
      id: 'garmin_001',
      activityName: 'Carrera matutina',
      activityType: 'Carrera',
      startTime: '2025-01-02T07:30:00',
      duration: 47,
      distance: 8.2,
      averagePace: '5:44',
      averageHR: 142,
      maxHR: 165,
      calories: 612,
      elevation: 85,
      cadence: 172,
      trainingEffect: 3.2
    },
    {
      id: 'garmin_002',
      activityName: 'Entrenamiento de técnica',
      activityType: 'Carrera',
      startTime: '2025-01-03T18:00:00',
      duration: 58,
      distance: 5.1,
      averagePace: '6:02',
      averageHR: 135,
      maxHR: 152,
      calories: 423,
      elevation: 42,
      cadence: 168,
      trainingEffect: 2.5
    },
    {
      id: 'garmin_003',
      activityName: 'Carrera larga fin de semana',
      activityType: 'Carrera',
      startTime: '2025-01-04T08:00:00',
      duration: 72,
      distance: 12.4,
      averagePace: '5:48',
      averageHR: 148,
      maxHR: 170,
      calories: 894,
      elevation: 156,
      cadence: 170,
      trainingEffect: 3.8
    },
    {
      id: 'garmin_004',
      activityName: 'Tempo run',
      activityType: 'Carrera',
      startTime: '2025-01-09T17:30:00',
      duration: 52,
      distance: 9.3,
      averagePace: '5:35',
      averageHR: 158,
      maxHR: 175,
      calories: 748,
      elevation: 98,
      cadence: 174,
      trainingEffect: 3.5
    },
    {
      id: 'garmin_005',
      activityName: 'Intervalos en pista',
      activityType: 'Carrera',
      startTime: '2025-01-16T18:15:00',
      duration: 63,
      distance: 10.2,
      averagePace: '6:10',
      averageHR: 165,
      maxHR: 184,
      calories: 821,
      elevation: 12,
      cadence: 176,
      trainingEffect: 4.2
    }
  ];

  // Mock data para atletas disponibles
  const availableAthletes: Athlete[] = [
    {
      id: 'athlete1',
      name: 'Carlos Mendoza',
      specialty: 'Fondo'
    },
    {
      id: 'athlete2',
      name: 'Ana López',
      specialty: 'Medio-fondo'
    },
    {
      id: 'athlete3',
      name: 'Pedro Ramírez',
      specialty: 'Fondo'
    }
  ];

  // Mock data para sesiones planificadas por el entrenador
  const plannedSessions: PlannedSession[] = [
    {
      id: 'session1',
      date: '2025-01-02',
      name: 'Carrera Continua Base',
      type: 'Continuo',
      plannedDuration: 45,
      plannedDistance: 8.0,
      plannedPace: '5:45',
      targetHR: '130-145 bpm',
      athleteId: 'athlete1',
      planningName: 'Mesociclo 1: Base Aeróbica'
    },
    {
      id: 'session2',
      date: '2025-01-03',
      name: 'Técnica + Fuerza',
      type: 'Técnica',
      plannedDuration: 60,
      plannedDistance: 5.0,
      plannedPace: '6:00',
      targetHR: '120-140 bpm',
      athleteId: 'athlete1',
      planningName: 'Mesociclo 1: Base Aeróbica'
    },
    {
      id: 'session3',
      date: '2025-01-04',
      name: 'Carrera Larga Suave',
      type: 'Continuo',
      plannedDuration: 70,
      plannedDistance: 12.0,
      plannedPace: '5:30',
      targetHR: '140-155 bpm',
      athleteId: 'athlete1',
      planningName: 'Mesociclo 1: Base Aeróbica'
    },
    {
      id: 'session5',
      date: '2025-01-09',
      name: 'Carrera Tempo',
      type: 'Tempo',
      plannedDuration: 50,
      plannedDistance: 9.0,
      plannedPace: '5:00',
      targetHR: '150-165 bpm',
      athleteId: 'athlete1',
      planningName: 'Mesociclo 2: Desarrollo de Velocidad',
      intervals: [
        { type: 'work', duration: 20, pace: '4:45', intensity: 'Media-Alta', distance: 4.5 },
        { type: 'rest', duration: 5, pace: '6:00', intensity: 'Baja', distance: 1.0 },
        { type: 'work', duration: 15, pace: '4:30', intensity: 'Alta', distance: 3.5 }
      ]
    },
    {
      id: 'session10',
      date: '2025-01-16',
      name: 'Intervalos Aeróbicos',
      type: 'Intervalos',
      plannedDuration: 65,
      plannedDistance: 10.0,
      plannedPace: '4:15',
      targetHR: '170-180 bpm',
      athleteId: 'athlete1',
      planningName: 'Mesociclo 2: Desarrollo de Velocidad',
      intervals: [
        { type: 'work', duration: 6, pace: '4:15', intensity: 'Muy Alta', distance: 1.5 },
        { type: 'rest', duration: 3, pace: '6:30', intensity: 'Baja', distance: 0.8 }
      ]
    },
    {
      id: 'session26',
      date: '2025-01-26',
      name: 'Sesión de Intervalos en Pista',
      type: 'Intervalos',
      plannedDuration: 60,
      plannedDistance: 10.0,
      plannedPace: '4:30',
      targetHR: '165-180 bpm',
      athleteId: 'athlete2',
      planningName: 'Mesociclo 3: Preparación Competitiva',
      intervals: [
        { type: 'work', duration: 5, pace: '4:15', intensity: 'Muy Alta', distance: 1.2 },
        { type: 'rest', duration: 3, pace: '6:00', intensity: 'Baja', distance: 0.5 }
      ]
    },
    {
      id: 'session26b',
      date: '2025-01-26',
      name: 'Entrenamiento de Velocidad',
      type: 'Velocidad',
      plannedDuration: 50,
      plannedDistance: 8.0,
      plannedPace: '4:45',
      targetHR: '160-175 bpm',
      athleteId: 'athlete2',
      planningName: 'Mesociclo 3: Preparación Competitiva'
    },
    {
      id: 'session27',
      date: '2025-01-27',
      name: 'Carrera Continua Matutina',
      type: 'Continuo',
      plannedDuration: 45,
      plannedDistance: 8.0,
      plannedPace: '5:15',
      targetHR: '150-165 bpm',
      athleteId: 'athlete2',
      planningName: 'Mesociclo 3: Preparación Competitiva'
    },
    {
      id: 'session27b',
      date: '2025-01-27',
      name: 'Rodaje Suave',
      type: 'Continuo',
      plannedDuration: 40,
      plannedDistance: 7.5,
      plannedPace: '5:30',
      targetHR: '145-160 bpm',
      athleteId: 'athlete3',
      planningName: 'Mesociclo 1: Adaptación General'
    },
    {
      id: 'session27c',
      date: '2025-01-27',
      name: 'Carrera Base Aeróbica',
      type: 'Continuo',
      plannedDuration: 50,
      plannedDistance: 9.0,
      plannedPace: '5:00',
      targetHR: '155-170 bpm',
      athleteId: 'athlete3',
      planningName: 'Mesociclo 1: Adaptación General'
    }
  ];

  // Función para obtener TODAS las sesiones planificadas por el entrenador en una fecha (de cualquier atleta)
  const getSessionsByDate = (date: Date | undefined) => {
    if (!date) return [];
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    return plannedSessions.filter(session => session.date === selectedDateStr);
  };

  // Función para formateo automático de fechas con "/" fijos
  const formatDateInput = (value: string): string => {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '');
    
    // Limitar a 8 dígitos (ddmmyyyy)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Formatear con "/" automáticamente
    let formatted = '';
    for (let i = 0; i < limitedNumbers.length; i++) {
      if (i === 2 || i === 4) {
        formatted += '/';
      }
      formatted += limitedNumbers[i];
    }
    
    return formatted;
  };

  // Funciones para manejar input manual de fechas
  const handleDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setDateInputValue(formatted);
    
    // Intentar parsear la fecha cuando tenga el formato completo
    if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsed) && parsed <= new Date()) {
        setSelectedDate(parsed);
        setSessionId('');
      }
    } else {
      // Si se borra o está incompleto, limpiar la fecha seleccionada
      setSelectedDate(undefined);
    }
  };

  // Funciones para manejar molestias/lesiones
  const addInjury = () => {
    if (!currentInjury.bodyPart || currentInjury.bodyPart === 'none' || !currentInjury.description) {
      toast.error('Por favor completa la zona corporal y descripción');
      return;
    }

    const newInjury: InjuryReport = {
      bodyPart: currentInjury.bodyPart!,
      severity: currentInjury.severity || 1,
      description: currentInjury.description!,
      affectedPerformance: currentInjury.affectedPerformance || false,
      type: currentInjury.type || 'Molestia'
    };

    setInjuries(prev => [...prev, newInjury]);
    setCurrentInjury({
      bodyPart: 'none',
      severity: 1,
      description: '',
      affectedPerformance: false,
      type: 'Molestia'
    });
    setShowInjuryForm(false);
    toast.success('Molestia/dolor agregado correctamente');
  };

  const removeInjury = (index: number) => {
    setInjuries(prev => prev.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-50';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 3) return 'Leve';
    if (severity <= 6) return 'Moderado';
    return 'Severo';
  };

  // Funciones auxiliares para generar datos automáticamente
  const generateSplits = (distance: number, avgPace: string, avgHR: number, maxHR: number, elevation: number, type: string) => {
    const splits = [];
    const kmCount = Math.floor(distance);
    const [avgMin, avgSec] = avgPace.split(':').map(Number);
    const avgPaceSeconds = avgMin * 60 + avgSec;
    
    for (let km = 1; km <= kmCount; km++) {
      let variation = 0;
      if (type === 'Intervalos') {
        variation = (km % 2 === 1) ? -15 : 10;
      } else if (type === 'Fartlek') {
        variation = Math.random() * 30 - 15;
      } else {
        variation = Math.random() * 10 - 5;
      }
      
      const splitPaceSeconds = avgPaceSeconds + variation;
      const splitMinutes = Math.floor(splitPaceSeconds / 60);
      const splitSeconds = Math.round(splitPaceSeconds % 60);
      const splitPace = `${splitMinutes}:${splitSeconds.toString().padStart(2, '0')}`;
      
      const hrVariation = variation > 0 ? -5 : 5;
      const splitHR = Math.max(avgHR - 20, Math.min(maxHR, avgHR + hrVariation + Math.random() * 10 - 5));
      
      const splitElevation = Math.max(0, elevation / kmCount + Math.random() * 20 - 10);
      const cadence = 170 + Math.random() * 20;
      
      splits.push({
        km,
        pace: splitPace,
        hr: Math.round(splitHR),
        elevation: Math.round(splitElevation),
        cadence: Math.round(cadence)
      });
    }
    
    return splits;
  };

  const generateHRZones = (type: string, avgHR: number, maxHR: number) => {
    switch (type) {
      case 'Intervalos':
        return { zone1: 5, zone2: 15, zone3: 25, zone4: 35, zone5: 20 };
      case 'Tempo':
        return { zone1: 10, zone2: 25, zone3: 45, zone4: 20, zone5: 0 };
      case 'Recuperación':
        return { zone1: 60, zone2: 35, zone3: 5, zone4: 0, zone5: 0 };
      case 'Fartlek':
        return { zone1: 15, zone2: 30, zone3: 30, zone4: 20, zone5: 5 };
      default:
        return { zone1: 20, zone2: 50, zone3: 25, zone4: 5, zone5: 0 };
    }
  };

  const calculateVO2MaxPercentage = (pace: string, type: string) => {
    const [min, sec] = pace.split(':').map(Number);
    const paceSeconds = min * 60 + sec;
    
    let basePercentage = Math.max(50, Math.min(100, 400 - paceSeconds));
    
    if (type === 'Intervalos') basePercentage += 10;
    else if (type === 'Tempo') basePercentage += 5;
    else if (type === 'Recuperación') basePercentage -= 15;
    
    return Math.round(Math.max(50, Math.min(100, basePercentage)));
  };

  const calculateTrainingLoad = (duration: number, avgHR: number, type: string) => {
    const baseLoad = duration * (avgHR / 10);
    const typeMultiplier = type === 'Intervalos' ? 1.8 : type === 'Tempo' ? 1.4 : type === 'Fartlek' ? 1.6 : 1.0;
    return Math.round(baseLoad * typeMultiplier);
  };

  const generateAdvancedMetrics = (pace: string, type: string, duration: number, avgHR: number) => {
    return {
      vo2MaxPercentage: calculateVO2MaxPercentage(pace, type),
      trainingLoad: calculateTrainingLoad(duration, avgHR, type),
      recoveryTime: type === 'Intervalos' ? 24 + Math.random() * 12 : type === 'Tempo' ? 18 + Math.random() * 8 : 12 + Math.random() * 6,
      cadence: 170 + Math.random() * 20,
      strideLength: 1.20 + Math.random() * 0.25,
      verticalOscillation: 7.5 + Math.random() * 3,
      groundContactTime: 240 + Math.random() * 20
    };
  };

  const validateStep1 = () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona la fecha del entrenamiento');
      return false;
    }

    const availableSessions = getSessionsByDate(selectedDate);
    if (availableSessions.length === 0) {
      toast.error('No hay sesiones planificadas por el entrenador en esta fecha. Por favor selecciona otra fecha.');
      return false;
    }
    
    if (!sessionId) {
      toast.error('Por favor selecciona una sesión planificada para asociar');
      return false;
    }
    
    return true;
  };

  const validateForm = () => {
    const required = ['name', 'type', 'duration', 'distance', 'avgPace'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (missing.length > 0) {
      toast.error(`Por favor completa los campos requeridos: ${missing.join(', ')}`);
      return false;
    }
    
    const pacePattern = /^\d{1,2}:\d{2}$/;
    if (!pacePattern.test(formData.avgPace)) {
      toast.error('El formato del ritmo debe ser MM:SS (ej: 5:30)');
      return false;
    }
    
    return true;
  };

  const handleContinueToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      toast.success('Sesión vinculada correctamente', {
        description: 'Ahora puedes importar desde Garmin o registrar manualmente los datos del entrenamiento.'
      });
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  // Funciones de Garmin
  const handleConnectGarmin = () => {
    setShowGarminModal(true);
    setGarminFormErrors({});
  };

  const validateGarminForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!garminEmail.trim()) {
      errors.email = 'El email o usuario es requerido';
    }
    
    if (!garminPassword) {
      errors.password = 'La contraseña es requerida';
    }
    
    setGarminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGarminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGarminForm()) {
      return;
    }

    setIsConnectingGarmin(true);
    try {
      // Simular autenticación con Garmin
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsGarminConnected(true);
      setShowGarminModal(false);
      setGarminEmail('');
      setGarminPassword('');
      toast.success('Cuenta de Garmin conectada exitosamente', {
        description: 'Ahora puedes importar entrenamientos desde tu cuenta de Garmin Connect'
      });
    } catch (error) {
      toast.error('Error al conectar con Garmin', {
        description: 'Por favor intenta nuevamente'
      });
    } finally {
      setIsConnectingGarmin(false);
    }
  };

  const handleCancelGarminLogin = () => {
    setShowGarminModal(false);
    setGarminEmail('');
    setGarminPassword('');
    setGarminFormErrors({});
  };

  const handleDisconnectGarmin = () => {
    setIsGarminConnected(false);
    setGarminDateRange({});
    setSelectedGarminActivity('');
    toast.info('Cuenta de Garmin desconectada');
  };

  const getFilteredGarminActivities = (): GarminActivity[] => {
    if (!garminDateRange.from) return [];
    
    const fromDate = garminDateRange.from;
    const toDate = garminDateRange.to || garminDateRange.from;
    
    return mockGarminActivities.filter(activity => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= fromDate && activityDate <= toDate;
    });
  };

  const handleSearchGarminActivities = async () => {
    if (!garminDateRange.from) {
      toast.error('Por favor selecciona un rango de fechas');
      return;
    }
    
    setIsLoadingActivities(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const activities = getFilteredGarminActivities();
      
      if (activities.length === 0) {
        toast.info('No se encontraron entrenamientos en el rango de fechas seleccionado');
      } else {
        toast.success(`Se encontraron ${activities.length} entrenamiento${activities.length > 1 ? 's' : ''}`);
      }
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleSelectGarminActivity = (activityId: string) => {
    setSelectedGarminActivity(activityId);
  };

  const handleGarminDateInputFrom = (value: string) => {
    const formatted = formatDateInput(value);
    setGarminDateInputFrom(formatted);
    
    // Intentar parsear la fecha cuando tenga el formato completo
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        setGarminDateRange({ ...garminDateRange, from: parsedDate });
      }
    } else {
      // Si se borra o está incompleto, limpiar la fecha
      setGarminDateRange({ ...garminDateRange, from: undefined });
    }
  };

  const handleGarminDateInputTo = (value: string) => {
    const formatted = formatDateInput(value);
    setGarminDateInputTo(formatted);
    
    // Intentar parsear la fecha cuando tenga el formato completo
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        setGarminDateRange({ ...garminDateRange, to: parsedDate });
      }
    } else {
      // Si se borra o está incompleto, limpiar la fecha
      setGarminDateRange({ ...garminDateRange, to: undefined });
    }
  };

  const handleLinkGarminActivity = () => {
    const activity = mockGarminActivities.find(a => a.id === selectedGarminActivity);
    if (!activity) return;

    if (!selectedDate || !sessionId) {
      toast.error('Debe seleccionar una fecha y sesión planificada');
      return;
    }

    // Crear el entrenamiento directamente con los datos de Garmin
    const advancedMetrics = generateAdvancedMetrics(activity.averagePace, 'Continuo', activity.duration, activity.averageHR);
    
    const newTraining: TrainingSession = {
      id: `training-${Date.now()}`,
      date: format(selectedDate, 'yyyy-MM-dd'),
      name: activity.activityName,
      type: 'Continuo',
      duration: activity.duration,
      distance: activity.distance,
      avgPace: activity.averagePace,
      maxHR: activity.maxHR,
      avgHR: activity.averageHR,
      calories: activity.calories,
      elevation: activity.elevation,
      comments: 'Importado desde Garmin Connect',
      sensations: {
        effort: 5,
        fatigue: 5,
        motivation: 5,
        muscularLoad: 5,
        overallFeeling: 5
      },
      conditions: {
        temperature: 20,
        weather: 'No especificado',
        surface: 'No especificado',
        humidity: 50,
        wind: 'No especificado'
      },
      splits: generateSplits(activity.distance, activity.averagePace, activity.averageHR, activity.maxHR, activity.elevation, 'Continuo'),
      hrZones: generateHRZones('Continuo', activity.averageHR, activity.maxHR),
      advancedMetrics: {
        ...advancedMetrics,
        cadence: activity.cadence || advancedMetrics.cadence,
        strideLength: advancedMetrics.strideLength,
        verticalOscillation: advancedMetrics.verticalOscillation,
        groundContactTime: advancedMetrics.groundContactTime
      },
      injuries: injuries.length > 0 ? injuries : undefined,
      associatedSessionId: sessionId,
      linkedSessionId: sessionId,
      status: 'Completado',
      uploadSource: 'garmin'
    };

    if (activity.distance > 10) {
      newTraining.route = {
        startLocation: 'Punto de Inicio (Garmin)',
        endLocation: activity.distance > 15 ? 'Punto Final (Garmin)' : 'Punto de Inicio (Garmin)',
        routeType: activity.distance > 15 ? 'Punto a Punto' : 'Circuito'
      };
    }

    // Guardar el entrenamiento completado y pasar al Paso 3
    setCompletedTraining(newTraining);
    setCurrentStep(3);
    
    toast.success('Entrenamiento importado desde Garmin', {
      description: 'Los datos han sido vinculados con la sesión planificada.'
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      duration: '',
      distance: '',
      avgPace: '',
      maxHR: '',
      avgHR: '',
      calories: '',
      elevation: '',
      comments: '',
      effort: 5,
      fatigue: 5,
      motivation: 5,
      muscularLoad: 5,
      overallFeeling: 5,
      temperature: '',
      weather: '',
      surface: '',
      humidity: '',
      wind: '',
      vo2MaxPercentage: '',
      cadence: '',
      strideLength: '',
      verticalOscillation: '',
      groundContactTime: '',
    });
    setSelectedDate(undefined);
    setDateInputValue('');
    setSessionId('');
    setInjuries([]);
    setSelectedGarminActivity('');
    setGarminDateRange({});
    setGarminDateInputFrom('');
    setGarminDateInputTo('');
    setUploadMethod('garmin');
    setCompletedTraining(null);
    setCurrentStep(1);
    setCurrentInjury({
      bodyPart: 'none',
      severity: 1,
      description: '',
      affectedPerformance: false,
      type: 'Molestia'
    });
    setShowInjuryForm(false);
    setCurrentStep(1);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInjuryChange = (field: string, value: string | number | boolean) => {
    setCurrentInjury(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = parseInt(formData.duration);
      const distance = parseFloat(formData.distance);
      const maxHR = parseInt(formData.maxHR) || 180;
      const avgHR = parseInt(formData.avgHR) || 155;
      const elevation = parseInt(formData.elevation) || 0;
      const calories = parseInt(formData.calories) || Math.round(duration * 12 * (avgHR / 160));
      
      const advancedMetrics = generateAdvancedMetrics(formData.avgPace, formData.type, duration, avgHR);
      
      const newTraining: TrainingSession = {
        id: `training_${Date.now()}`,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        name: formData.name,
        type: formData.type,
        duration,
        distance,
        avgPace: formData.avgPace,
        maxHR,
        avgHR,
        calories,
        elevation,
        comments: formData.comments || 'Sin comentarios adicionales',
        sensations: {
          effort: formData.effort,
          fatigue: formData.fatigue,
          motivation: formData.motivation,
          muscularLoad: formData.muscularLoad,
          overallFeeling: formData.overallFeeling
        },
        conditions: {
          temperature: parseInt(formData.temperature) || 20,
          weather: formData.weather || 'Soleado',
          surface: formData.surface || 'Asfalto',
          humidity: parseInt(formData.humidity) || 50,
          wind: formData.wind || 'Sin viento'
        },
        splits: generateSplits(distance, formData.avgPace, avgHR, maxHR, elevation, formData.type),
        hrZones: generateHRZones(formData.type, avgHR, maxHR),
        advancedMetrics: {
          ...advancedMetrics,
          cadence: parseInt(formData.cadence) || advancedMetrics.cadence,
          strideLength: parseFloat(formData.strideLength) || advancedMetrics.strideLength,
          verticalOscillation: parseFloat(formData.verticalOscillation) || advancedMetrics.verticalOscillation,
          groundContactTime: parseInt(formData.groundContactTime) || advancedMetrics.groundContactTime
        },
        injuries: injuries.length > 0 ? injuries : undefined,
        associatedSessionId: sessionId,
        linkedSessionId: sessionId,
        status: 'Completado',
        uploadSource: 'manual'
      };
      
      if (distance > 10) {
        newTraining.route = {
          startLocation: 'Punto de Inicio',
          endLocation: distance > 15 ? 'Punto Final' : 'Punto de Inicio',
          routeType: distance > 15 ? 'Punto a Punto' : 'Circuito'
        };
      }
      
      // Guardar el entrenamiento completado y pasar al Paso 3
      setCompletedTraining(newTraining);
      setCurrentStep(3);
      
    } catch (error) {
      toast.error('Error al procesar el entrenamiento. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmLink = () => {
    const associatedSession = plannedSessions.find(s => s.id === sessionId);
    const selectedAthlete = associatedSession ? availableAthletes.find(a => a.id === associatedSession.athleteId) : null;
    
    let toastDescription = '';
    if (associatedSession && selectedAthlete) {
      toastDescription = `Atleta: ${selectedAthlete.name}\nVinculado a: ${associatedSession.name}`;
    }
    if (injuries.length > 0) {
      toastDescription += `\n${injuries.length} molestia${injuries.length > 1 ? 's' : ''}/dolor${injuries.length > 1 ? 'es' : ''} registrada${injuries.length > 1 ? 's' : ''}`;
    }

    toast.success('¡Entrenamiento vinculado exitosamente!', {
      description: toastDescription
    });

    // Reiniciar el formulario
    resetForm();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2>Subir Entrenamientos</h2>
          <p className="text-muted-foreground">
            {currentStep === 1 
              ? 'Paso 1: Vincula el entrenamiento con una sesión planificada' 
              : currentStep === 2 
              ? 'Paso 2: Importa desde Garmin o registra manualmente'
              : 'Paso 3: Confirma la vinculación del entrenamiento'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(currentStep === 2 || currentStep === 3) && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep === 2) {
                    handleBackToStep1();
                  } else {
                    // Volver al paso 2 y limpiar entrenamiento completado
                    setCompletedTraining(null);
                    setCurrentStep(2);
                  }
                }}
                disabled={isSubmitting}
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <Badge variant={currentStep === 1 ? "default" : "outline"} className="gap-1">
            {currentStep === 1 ? <div className="w-2 h-2 rounded-full bg-white" /> : <CheckCircle className="w-3 h-3" />}
            Paso 1
          </Badge>
          <div className="w-8 h-px bg-border" />
          <Badge variant={currentStep === 2 ? "default" : "outline"} className="gap-1">
            {currentStep === 2 ? <div className="w-2 h-2 rounded-full bg-white" /> : currentStep === 3 ? <CheckCircle className="w-3 h-3" /> : null}
            Paso 2
          </Badge>
          <div className="w-8 h-px bg-border" />
          <Badge variant={currentStep === 3 ? "default" : "outline"} className="gap-1">
            {currentStep === 3 && <div className="w-2 h-2 rounded-full bg-white" />}
            Paso 3
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {/* PASO 1: Vincular Entrenamiento */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Vincular Entrenamiento</CardTitle>
              <CardDescription>Selecciona la fecha del entrenamiento para ver las sesiones planificadas por el entrenador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fecha del Entrenamiento */}
              <div className="space-y-2">
                <Label htmlFor="training-date">Fecha del Entrenamiento *</Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="training-date"
                    placeholder="dd/mm/yyyy"
                    value={dateInputValue}
                    onChange={(e) => handleDateInput(e.target.value)}
                    maxLength={10}
                    className="w-[160px]"
                  />
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setDateInputValue(date ? format(date, 'dd/MM/yyyy') : '');
                          setSessionId('');
                          setIsDatePickerOpen(false);
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {selectedDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "PPPP", { locale: es })}
                  </p>
                )}
              </div>

              {selectedDate && <Separator />}

              {/* Asociación con Sesión Planificada por el Entrenador */}
              {selectedDate && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent" />
                    <Label className="font-medium">Asociar con Sesión Planificada *</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selecciona la sesión planificada por el entrenador para esta fecha
                  </p>
                  
                  {getSessionsByDate(selectedDate).length > 0 ? (
                    <div className="space-y-2">
                      <Label htmlFor="session">Sesiones Planificadas para {format(selectedDate, "d 'de' MMMM", { locale: es })} *</Label>
                      <Select 
                        onValueChange={(value) => setSessionId(value)} 
                        value={sessionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sesión...">
                            {sessionId && (() => {
                              const selectedSession = getSessionsByDate(selectedDate).find(s => s.id === sessionId);
                              return selectedSession ? selectedSession.name : "Seleccionar sesión...";
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-w-md">
                          {getSessionsByDate(selectedDate).map(session => {
                            const athlete = availableAthletes.find(a => a.id === session.athleteId);
                            return (
                              <SelectItem key={session.id} value={session.id} className="py-3">
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium text-foreground">{athlete?.name}</span>
                                  </div>
                                  <div className="text-sm text-foreground">{session.name}</div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">{session.type}</Badge>
                                    <span>•</span>
                                    <span>{session.plannedDistance}km</span>
                                    <span>•</span>
                                    <span>{session.plannedDuration}min</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Plan: {session.planningName}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      {/* Mostrar detalles de la sesión seleccionada */}
                      {sessionId && (() => {
                        const selectedSession = getSessionsByDate(selectedDate).find(s => s.id === sessionId);
                        const selectedAthlete = selectedSession ? availableAthletes.find(a => a.id === selectedSession.athleteId) : null;
                        
                        return selectedSession ? (
                          <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-accent" />
                              <span className="font-medium">Atleta: {selectedAthlete?.name}</span>
                              <Badge variant="outline">{selectedAthlete?.specialty}</Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-muted-foreground">Distancia planeada:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedDistance}km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duración planeada:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedDuration}min</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ritmo objetivo:</span>
                                <span className="ml-1 font-medium">{selectedSession.plannedPace}/km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">FC objetivo:</span>
                                <span className="ml-1 font-medium">{selectedSession.targetHR}</span>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900">No hay sesiones planificadas</p>
                          <p className="text-sm text-yellow-700">
                            No existen sesiones planificadas por el entrenador para esta fecha. Por favor selecciona otra fecha.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón Continuar */}
              {selectedDate && getSessionsByDate(selectedDate).length > 0 && (
                <>
                  <Separator className="mt-6" />
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleContinueToStep2} className="gap-2">
                      Continuar al Paso 2
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* PASO 2: Importar desde Garmin o Registro Manual */}
        {currentStep === 2 && (
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Registro de Entrenamiento</CardTitle>
              <CardDescription>Importa desde Garmin Connect o ingresa manualmente los datos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'garmin' | 'manual')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="garmin" className="gap-2">
                    <Watch className="w-4 h-4" />
                    Importar desde Garmin
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Registro Manual
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Importar desde Garmin */}
                <TabsContent value="garmin" className="flex-1 space-y-4 mt-0">
                  {!isGarminConnected ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="rounded-full bg-accent/10 p-6">
                        <Watch className="w-12 h-12 text-accent" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3>Conecta tu cuenta de Garmin</h3>
                        <p className="text-muted-foreground max-w-md">
                          Vincula tu cuenta de Garmin Connect para importar automáticamente tus entrenamientos realizados
                        </p>
                      </div>
                      <Button 
                        onClick={handleConnectGarmin} 
                        disabled={isConnectingGarmin}
                        className="gap-2"
                        size="lg"
                      >
                        <Link2 className="w-4 h-4" />
                        {isConnectingGarmin ? 'Conectando...' : 'Conectar con Garmin'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Estado de conexión */}
                      <Alert className="border-accent/50 bg-accent/5">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>Cuenta de Garmin conectada</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleDisconnectGarmin}
                            className="h-auto p-1"
                          >
                            Desconectar
                          </Button>
                        </AlertDescription>
                      </Alert>

                      {/* Selector de rango de fechas */}
                      <div className="space-y-3">
                        <Label>Rango de fechas para buscar entrenamientos *</Label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Desde</Label>
                            <Input
                              placeholder="dd/mm/yyyy"
                              value={garminDateInputFrom}
                              onChange={(e) => handleGarminDateInputFrom(e.target.value)}
                              maxLength={10}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Hasta</Label>
                            <Input
                              placeholder="dd/mm/yyyy"
                              value={garminDateInputTo}
                              onChange={(e) => handleGarminDateInputTo(e.target.value)}
                              maxLength={10}
                              disabled={!garminDateRange.from}
                            />
                          </div>
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal gap-2"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {garminDateRange.from ? (
                                garminDateRange.to ? (
                                  <>
                                    {format(garminDateRange.from, "PPP", { locale: es })} - {format(garminDateRange.to, "PPP", { locale: es })}
                                  </>
                                ) : (
                                  format(garminDateRange.from, "PPP", { locale: es })
                                )
                              ) : (
                                "O seleccionar desde el calendario"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={garminDateRange}
                              onSelect={(range) => {
                                setGarminDateRange(range || {});
                                if (range?.from) setGarminDateInputFrom(format(range.from, 'dd/MM/yyyy'));
                                if (range?.to) setGarminDateInputTo(format(range.to, 'dd/MM/yyyy'));
                              }}
                              disabled={(date) => date > new Date()}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>

                        <Button 
                          onClick={handleSearchGarminActivities}
                          disabled={!garminDateRange.from || isLoadingActivities}
                          className="w-full gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {isLoadingActivities ? 'Buscando...' : 'Buscar Entrenamientos'}
                        </Button>
                      </div>

                      {/* Lista de actividades de Garmin */}
                      {garminDateRange.from && getFilteredGarminActivities().length > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          <div>
                            <Label>Entrenamientos disponibles ({getFilteredGarminActivities().length})</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Selecciona el entrenamiento que quieres vincular con la sesión planificada
                            </p>
                          </div>
                          
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {getFilteredGarminActivities().map((activity) => (
                              <Card 
                                key={activity.id}
                                className={`cursor-pointer transition-all hover:border-accent ${
                                  selectedGarminActivity === activity.id ? 'border-accent bg-accent/5' : ''
                                }`}
                                onClick={() => handleSelectGarminActivity(activity.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium">{activity.activityName}</h4>
                                        <Badge variant="outline" className="text-xs">
                                          {activity.activityType}
                                        </Badge>
                                        {selectedGarminActivity === activity.id && (
                                          <CheckCircle className="w-4 h-4 text-accent" />
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {format(new Date(activity.startTime), "PPP 'a las' HH:mm", { locale: es })}
                                      </p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Distancia:</span>
                                          <p className="font-medium">{activity.distance} km</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Duración:</span>
                                          <p className="font-medium">{activity.duration} min</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Ritmo:</span>
                                          <p className="font-medium">{activity.averagePace}/km</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">FC Prom:</span>
                                          <p className="font-medium">{activity.averageHR} bpm</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {selectedGarminActivity && (
                            <>
                              <Separator />
                              <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-accent/5">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-accent/10 p-2">
                                    <CheckCircle className="w-5 h-5 text-accent" />
                                  </div>
                                  <div>
                                    <p className="font-medium">Entrenamiento seleccionado</p>
                                    <p className="text-sm text-muted-foreground">
                                      {mockGarminActivities.find(a => a.id === selectedGarminActivity)?.activityName}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={handleLinkGarminActivity}
                                  className="gap-2"
                                >
                                  <Link2 className="w-4 h-4" />
                                  Vincular con la Planificación
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {garminDateRange.from && getFilteredGarminActivities().length === 0 && !isLoadingActivities && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No se encontraron entrenamientos en el rango de fechas seleccionado
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* TAB: Registro Manual */}
                <TabsContent value="manual" className="flex-1 mt-0">
                  <div className="h-full">
              <form onSubmit={handleManualSubmit} className="space-y-6 h-full flex flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto">
                  {/* Datos Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Entrenamiento *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ej: Carrera continua matutina"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Entrenamiento *</Label>
                      <Select onValueChange={(value) => handleInputChange('type', value)} value={formData.type}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Continuo">Continuo</SelectItem>
                          <SelectItem value="Intervalos">Intervalos</SelectItem>
                          <SelectItem value="Tempo">Tempo</SelectItem>
                          <SelectItem value="Fartlek">Fartlek</SelectItem>
                          <SelectItem value="Recuperación">Recuperación</SelectItem>
                          <SelectItem value="Técnica">Técnica</SelectItem>
                          <SelectItem value="Competencia">Competencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Métricas Principales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        Duración (min) *
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        placeholder="45"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distance">Distancia (km) *</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.1"
                        value={formData.distance}
                        onChange={(e) => handleInputChange('distance', e.target.value)}
                        placeholder="8.5"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avgPace">Ritmo Promedio (min/km) *</Label>
                      <Input
                        id="avgPace"
                        value={formData.avgPace}
                        onChange={(e) => handleInputChange('avgPace', e.target.value)}
                        placeholder="5:30"
                        required
                      />
                    </div>
                  </div>

                  {/* Frecuencia Cardíaca */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxHR" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        FC Máxima (bpm)
                      </Label>
                      <Input
                        id="maxHR"
                        type="number"
                        value={formData.maxHR}
                        onChange={(e) => handleInputChange('maxHR', e.target.value)}
                        placeholder="180"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgHR">
                        FC Promedio (bpm)
                      </Label>
                      <Input
                        id="avgHR"
                        type="number"
                        value={formData.avgHR}
                        onChange={(e) => handleInputChange('avgHR', e.target.value)}
                        placeholder="155"
                      />
                    </div>
                  </div>

                  {/* Métricas Adicionales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calorías</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={formData.calories}
                        onChange={(e) => handleInputChange('calories', e.target.value)}
                        placeholder="Auto-calculado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elevation">Elevación (m)</Label>
                      <Input
                        id="elevation"
                        type="number"
                        value={formData.elevation}
                        onChange={(e) => handleInputChange('elevation', e.target.value)}
                        placeholder="120"
                      />
                    </div>
                  </div>

                  {/* Métricas Avanzadas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <Label className="font-medium">Métricas Avanzadas (Opcional)</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vo2MaxPercentage">% VO2 Max</Label>
                        <Input
                          id="vo2MaxPercentage"
                          type="number"
                          min="50"
                          max="100"
                          value={formData.vo2MaxPercentage}
                          onChange={(e) => handleInputChange('vo2MaxPercentage', e.target.value)}
                          placeholder="Auto-calculado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cadence">Cadencia (pasos/min)</Label>
                        <Input
                          id="cadence"
                          type="number"
                          value={formData.cadence}
                          onChange={(e) => handleInputChange('cadence', e.target.value)}
                          placeholder="170-190"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="strideLength">Longitud de Zancada (m)</Label>
                        <Input
                          id="strideLength"
                          type="number"
                          step="0.01"
                          value={formData.strideLength}
                          onChange={(e) => handleInputChange('strideLength', e.target.value)}
                          placeholder="1.25"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="verticalOscillation">Oscilación Vertical (cm)</Label>
                        <Input
                          id="verticalOscillation"
                          type="number"
                          step="0.1"
                          value={formData.verticalOscillation}
                          onChange={(e) => handleInputChange('verticalOscillation', e.target.value)}
                          placeholder="8.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="groundContactTime">Tiempo de Contacto (ms)</Label>
                        <Input
                          id="groundContactTime"
                          type="number"
                          value={formData.groundContactTime}
                          onChange={(e) => handleInputChange('groundContactTime', e.target.value)}
                          placeholder="245"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Sensaciones */}
                  <div className="space-y-4">
                    <Label className="font-medium">Sensaciones Durante el Entrenamiento</Label>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="effort">Esfuerzo Percibido</Label>
                          <span className="text-sm text-muted-foreground">{formData.effort}/10</span>
                        </div>
                        <Input
                          id="effort"
                          type="range"
                          min="1"
                          max="10"
                          value={formData.effort}
                          onChange={(e) => handleInputChange('effort', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="fatigue">Fatiga</Label>
                          <span className="text-sm text-muted-foreground">{formData.fatigue}/10</span>
                        </div>
                        <Input
                          id="fatigue"
                          type="range"
                          min="1"
                          max="10"
                          value={formData.fatigue}
                          onChange={(e) => handleInputChange('fatigue', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="motivation">Motivación</Label>
                          <span className="text-sm text-muted-foreground">{formData.motivation}/10</span>
                        </div>
                        <Input
                          id="motivation"
                          type="range"
                          min="1"
                          max="10"
                          value={formData.motivation}
                          onChange={(e) => handleInputChange('motivation', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="muscularLoad">Carga Muscular</Label>
                          <span className="text-sm text-muted-foreground">{formData.muscularLoad}/10</span>
                        </div>
                        <Input
                          id="muscularLoad"
                          type="range"
                          min="1"
                          max="10"
                          value={formData.muscularLoad}
                          onChange={(e) => handleInputChange('muscularLoad', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="overallFeeling">Sensación General</Label>
                          <span className="text-sm text-muted-foreground">{formData.overallFeeling}/10</span>
                        </div>
                        <Input
                          id="overallFeeling"
                          type="range"
                          min="1"
                          max="10"
                          value={formData.overallFeeling}
                          onChange={(e) => handleInputChange('overallFeeling', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Condiciones Ambientales */}
                  <div className="space-y-4">
                    <Label className="font-medium">Condiciones Ambientales</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperatura (°C)</Label>
                        <Input
                          id="temperature"
                          type="number"
                          value={formData.temperature}
                          onChange={(e) => handleInputChange('temperature', e.target.value)}
                          placeholder="20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="humidity">Humedad (%)</Label>
                        <Input
                          id="humidity"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.humidity}
                          onChange={(e) => handleInputChange('humidity', e.target.value)}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weather">Clima</Label>
                        <Select onValueChange={(value) => handleInputChange('weather', value)} value={formData.weather}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar clima" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Soleado">Soleado</SelectItem>
                            <SelectItem value="Parcialmente Nublado">Parcialmente Nublado</SelectItem>
                            <SelectItem value="Nublado">Nublado</SelectItem>
                            <SelectItem value="Lluvioso">Lluvioso</SelectItem>
                            <SelectItem value="Ventoso">Ventoso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surface">Superficie</Label>
                        <Select onValueChange={(value) => handleInputChange('surface', value)} value={formData.surface}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar superficie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asfalto">Asfalto</SelectItem>
                            <SelectItem value="Pista">Pista</SelectItem>
                            <SelectItem value="Tierra">Tierra</SelectItem>
                            <SelectItem value="Trail">Trail</SelectItem>
                            <SelectItem value="Césped">Césped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="wind">Viento</Label>
                        <Input
                          id="wind"
                          value={formData.wind}
                          onChange={(e) => handleInputChange('wind', e.target.value)}
                          placeholder="Ej: Viento moderado del norte"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Molestias/Lesiones */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Molestias o Dolores</Label>
                      {!showInjuryForm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInjuryForm(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      )}
                    </div>

                    {injuries.length > 0 && (
                      <div className="space-y-2">
                        {injuries.map((injury, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(injury.severity)}>
                                  {injury.type} - {getSeverityLabel(injury.severity)}
                                </Badge>
                                <span className="font-medium">{injury.bodyPart}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{injury.description}</p>
                              {injury.affectedPerformance && (
                                <p className="text-xs text-orange-600 mt-1">Afectó el rendimiento</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInjury(index)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showInjuryForm && (
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="injuryType">Tipo</Label>
                            <Select 
                              onValueChange={(value) => handleInjuryChange('type', value)} 
                              value={currentInjury.type}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Molestia">Molestia</SelectItem>
                                <SelectItem value="Dolor">Dolor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bodyPart">Zona Corporal</Label>
                            <Select 
                              onValueChange={(value) => handleInjuryChange('bodyPart', value)} 
                              value={currentInjury.bodyPart}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar zona" />
                              </SelectTrigger>
                              <SelectContent>
                                {bodyParts.map((part) => (
                                  <SelectItem key={part} value={part}>
                                    {part}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="severity">Severidad</Label>
                              <span className="text-sm text-muted-foreground">{currentInjury.severity}/10</span>
                            </div>
                            <Input
                              id="severity"
                              type="range"
                              min="1"
                              max="10"
                              value={currentInjury.severity}
                              onChange={(e) => handleInjuryChange('severity', parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="injuryDescription">Descripción</Label>
                            <Textarea
                              id="injuryDescription"
                              value={currentInjury.description}
                              onChange={(e) => handleInjuryChange('description', e.target.value)}
                              placeholder="Describe la molestia o dolor..."
                              rows={3}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="affectedPerformance"
                              checked={currentInjury.affectedPerformance}
                              onChange={(e) => handleInjuryChange('affectedPerformance', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="affectedPerformance" className="cursor-pointer">
                              Esta molestia/dolor afectó mi rendimiento
                            </Label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={addInjury}
                              size="sm"
                            >
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowInjuryForm(false);
                                setCurrentInjury({
                                  bodyPart: 'none',
                                  severity: 1,
                                  description: '',
                                  affectedPerformance: false,
                                  type: 'Molestia'
                                });
                              }}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Separator />

                  {/* Comentarios */}
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comentarios Adicionales</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      placeholder="Agrega comentarios sobre el entrenamiento..."
                      rows={4}
                    />
                  </div>
                </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? 'Subiendo...' : 'Subir Entrenamiento'}
                      </Button>
                    </div>
                  </form>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* PASO 3: Confirmación de Vinculación */}
        {currentStep === 3 && completedTraining && (
          <div className="space-y-4">
            {/* Mensaje de éxito */}
            <Card className="border-accent/50 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-accent/10 p-3">
                    <CheckCircle className="w-8 h-8 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2">Vinculación Exitosa</h3>
                    <p className="text-muted-foreground">
                      El entrenamiento realizado ha sido vinculado correctamente con la sesión planificada. 
                      Revisa los detalles a continuación antes de confirmar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparación Planificado vs Realizado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sesión Planificada */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <CardTitle>Sesión Planificada</CardTitle>
                  </div>
                  <CardDescription>Objetivos establecidos por el entrenador</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const plannedSession = plannedSessions.find(s => s.id === sessionId);
                    const athlete = plannedSession ? availableAthletes.find(a => a.id === plannedSession.athleteId) : null;
                    
                    return plannedSession ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{athlete?.name}</span>
                            <Badge variant="outline" className="text-xs">{athlete?.specialty}</Badge>
                          </div>
                          <div>
                            <h4 className="font-medium">{plannedSession.name}</h4>
                            <p className="text-sm text-muted-foreground">{plannedSession.planningName}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipo</span>
                            <Badge variant="outline">{plannedSession.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Distancia</span>
                            <span className="font-medium">{plannedSession.plannedDistance} km</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Duración</span>
                            <span className="font-medium">{plannedSession.plannedDuration} min</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Ritmo objetivo</span>
                            <span className="font-medium">{plannedSession.plannedPace}/km</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">FC objetivo</span>
                            <span className="font-medium">{plannedSession.targetHR}</span>
                          </div>
                        </div>

                        {plannedSession.intervals && plannedSession.intervals.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium mb-2">Intervalos planeados</p>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {plannedSession.intervals.map((interval, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Badge variant={interval.type === 'work' ? 'default' : 'secondary'} className="text-xs">
                                      {interval.type === 'work' ? 'Trabajo' : 'Descanso'}
                                    </Badge>
                                    <span>{interval.duration}min • {interval.pace}/km</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : null;
                  })()}
                </CardContent>
              </Card>

              {/* Entrenamiento Realizado */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <CardTitle>Entrenamiento Realizado</CardTitle>
                  </div>
                  <CardDescription>
                    {completedTraining.uploadSource === 'garmin' 
                      ? 'Importado desde Garmin Connect'
                      : 'Registrado manualmente'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{completedTraining.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(completedTraining.date), "PPP", { locale: es })}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tipo</span>
                      <Badge variant="outline">{completedTraining.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Distancia</span>
                      <span className="font-medium">{completedTraining.distance} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duración</span>
                      <span className="font-medium">{completedTraining.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ritmo promedio</span>
                      <span className="font-medium">{completedTraining.avgPace}/km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">FC promedio</span>
                      <span className="font-medium">{completedTraining.avgHR} bpm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">FC máxima</span>
                      <span className="font-medium">{completedTraining.maxHR} bpm</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Calorías</span>
                      <span className="font-medium">{completedTraining.calories} kcal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Desnivel</span>
                      <span className="font-medium">{completedTraining.elevation} m</span>
                    </div>
                  </div>

                  {injuries.length > 0 && (
                    <>
                      <Separator />
                      <Alert variant="destructive" className="bg-destructive/10">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertDescription>
                          {injuries.length} molestia{injuries.length > 1 ? 's' : ''}/dolor{injuries.length > 1 ? 'es' : ''} registrada{injuries.length > 1 ? 's' : ''}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Métricas adicionales y sensaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Datos Adicionales del Entrenamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sensaciones */}
                  <div>
                    <h4 className="font-medium mb-3">Sensaciones</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Esfuerzo</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.effort / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.effort}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fatiga</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.fatigue / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.fatigue}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Motivación</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(completedTraining.sensations.motivation / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{completedTraining.sensations.motivation}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Condiciones */}
                  <div>
                    <h4 className="font-medium mb-3">Condiciones</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Temperatura</span>
                        <span className="text-sm font-medium">{completedTraining.conditions.temperature}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Clima</span>
                        <span className="text-sm font-medium">{completedTraining.conditions.weather}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Superficie</span>
                        <span className="text-sm font-medium">{completedTraining.conditions.surface}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {completedTraining.comments && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-medium mb-2">Comentarios</h4>
                      <p className="text-sm text-muted-foreground">{completedTraining.comments}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botón de confirmación */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium mb-1">¿Confirmar vinculación?</h4>
                    <p className="text-sm text-muted-foreground">
                      El entrenamiento quedará asociado a la sesión planificada
                    </p>
                  </div>
                  <Button 
                    onClick={handleConfirmLink}
                    size="lg"
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmar Vinculación
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de conexión con Garmin */}
      <Dialog open={showGarminModal} onOpenChange={setShowGarminModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <motion.div 
                className="p-2 bg-cyan-600 rounded-lg"
                animate={isConnectingGarmin ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: isConnectingGarmin ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Watch className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <DialogTitle>Conectar con Garmin Connect</DialogTitle>
                <DialogDescription>
                  {isConnectingGarmin ? 'Autenticando con Garmin...' : 'Ingresa tus credenciales de Garmin'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleGarminLogin} className="space-y-4">
            <motion.div 
              className="space-y-2"
              animate={isConnectingGarmin ? { opacity: 0.5 } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Label htmlFor="garmin-email">
                Email o nombre de usuario
              </Label>
              <Input
                id="garmin-email"
                type="text"
                placeholder="tu-email@ejemplo.com"
                value={garminEmail}
                onChange={(e) => {
                  setGarminEmail(e.target.value);
                  if (garminFormErrors.email) {
                    setGarminFormErrors({ ...garminFormErrors, email: undefined });
                  }
                }}
                className={garminFormErrors.email ? 'border-red-500' : ''}
                disabled={isConnectingGarmin}
              />
              <AnimatePresence>
                {garminFormErrors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-600"
                  >
                    {garminFormErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div 
              className="space-y-2"
              animate={isConnectingGarmin ? { opacity: 0.5 } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Label htmlFor="garmin-password">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="garmin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={garminPassword}
                  onChange={(e) => {
                    setGarminPassword(e.target.value);
                    if (garminFormErrors.password) {
                      setGarminFormErrors({ ...garminFormErrors, password: undefined });
                    }
                  }}
                  className={`pr-10 ${garminFormErrors.password ? 'border-red-500' : ''}`}
                  disabled={isConnectingGarmin}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isConnectingGarmin}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {garminFormErrors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-600"
                  >
                    {garminFormErrors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Indicador de progreso durante la conexión */}
            <AnimatePresence>
              {isConnectingGarmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-5 w-5 text-cyan-600" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-900">Conectando con Garmin Connect</p>
                        <p className="text-xs text-cyan-700">Verificando credenciales...</p>
                      </div>
                    </div>
                    <div className="w-full bg-cyan-200 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Alert className="bg-cyan-50 border-cyan-200">
              <AlertCircle className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-cyan-800">
                Tus credenciales son enviadas de forma segura a Garmin Connect y no son almacenadas por Strider.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelGarminLogin}
                disabled={isConnectingGarmin}
              >
                Cancelar
              </Button>
              <motion.div
                whileTap={!isConnectingGarmin ? { scale: 0.95 } : {}}
              >
                <Button
                  type="submit"
                  disabled={isConnectingGarmin}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {isConnectingGarmin ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Conectar
                    </>
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
