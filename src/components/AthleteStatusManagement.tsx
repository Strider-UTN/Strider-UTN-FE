import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Heart, 
  Shield, 
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AthleteInjuryService,
  type AthleteInjurySummary,
  type CreateAthleteInjuryPayload,
  type InjuryLocation,
  type InjurySeverity,
  type InjuryStatus,
  type InjuryTreatmentValue,
  type InjuryImpactValue
} from '../services/athleteInjuryService';
import { AthleteStatusService } from '../services/athleteStatusService';


type UiSeverity = 'Leve' | 'Moderada' | 'Grave';
type UiStatus = 'Activa' | 'Recuperándose' | 'Recuperada' | 'Cancelada';
type ImpactLabel = 'No especificado' | 'Ninguno' | 'Bajo' | 'Moderado' | 'Alto' | 'Completo';

type TreatmentValue = InjuryTreatmentValue;
type ImpactValue = InjuryImpactValue;

interface InjuryRecord {
  id: number;
  type: string;
  bodyZone: string;
  description: string;
  startDate: Date;
  estimatedEndDate: Date;
  actualEndDate?: Date;
  severity: UiSeverity;
  treatmentLabel: string;
  treatmentValue: TreatmentValue | null;
  status: UiStatus;
  impactLabel: ImpactLabel;
  impactValue: ImpactValue | null;
  notes: string;
  createdAt: Date;
  backendStatus: InjuryStatus;
  backendSeverity: InjurySeverity;
}

const BODY_ZONES = [
  'Cabeza',
  'Cuello',
  'Hombro Derecho',
  'Hombro Izquierdo',
  'Brazo Derecho',
  'Brazo Izquierdo',
  'Codo Derecho',
  'Codo Izquierdo',
  'Muñeca Derecha',
  'Muñeca Izquierda',
  'Mano Derecha',
  'Mano Izquierda',
  'Pecho',
  'Espalda Alta',
  'Espalda Baja',
  'Abdomen',
  'Cadera',
  'Muslo Derecho',
  'Muslo Izquierdo',
  'Rodilla Derecha',
  'Rodilla Izquierda',
  'Pantorrilla Derecha',
  'Pantorrilla Izquierda',
  'Tobillo Derecho',
  'Tobillo Izquierdo',
  'Pie Derecho',
  'Pie Izquierdo',
  'Aquiles Derecho',
  'Aquiles Izquierdo'
] as const;

const BODY_ZONE_TO_BACKEND: Record<(typeof BODY_ZONES)[number], InjuryLocation> = {
  Cabeza: 'Head',
  Cuello: 'Neck',
  'Hombro Derecho': 'RightShoulder',
  'Hombro Izquierdo': 'LeftShoulder',
  'Brazo Derecho': 'RightArm',
  'Brazo Izquierdo': 'LeftArm',
  'Codo Derecho': 'RightElbow',
  'Codo Izquierdo': 'LeftElbow',
  'Muñeca Derecha': 'RightWrist',
  'Muñeca Izquierda': 'LeftWrist',
  'Mano Derecha': 'RightHand',
  'Mano Izquierda': 'LeftHand',
  Pecho: 'Chest',
  'Espalda Alta': 'UpperBack',
  'Espalda Baja': 'LowerBack',
  Abdomen: 'Abdomen',
  Cadera: 'Hip',
  'Muslo Derecho': 'RightThigh',
  'Muslo Izquierdo': 'LeftThigh',
  'Rodilla Derecha': 'RightKnee',
  'Rodilla Izquierda': 'LeftKnee',
  'Pantorrilla Derecha': 'RightCalf',
  'Pantorrilla Izquierda': 'LeftCalf',
  'Tobillo Derecho': 'RightAnkle',
  'Tobillo Izquierdo': 'LeftAnkle',
  'Pie Derecho': 'RightFoot',
  'Pie Izquierdo': 'LeftFoot',
  'Aquiles Derecho': 'RightAchilles',
  'Aquiles Izquierdo': 'LeftAchilles'
};

const BACKEND_TO_BODY_ZONE: Record<string, string> = Object.entries(BODY_ZONE_TO_BACKEND).reduce(
  (acc, [label, backend]) => {
    acc[backend] = label;
    const camelKey = backend.charAt(0).toLowerCase() + backend.slice(1);
    acc[camelKey] = label;
    return acc;
  },
  {} as Record<string, string>
);

const SEVERITY_BACKEND_TO_UI: Record<string, UiSeverity> = {
  Mild: 'Leve',
  mild: 'Leve',
  Moderate: 'Moderada',
  moderate: 'Moderada',
  Severe: 'Grave',
  severe: 'Grave'
};

const SEVERITY_UI_TO_BACKEND: Record<UiSeverity, InjurySeverity> = {
  Leve: 'Mild',
  Moderada: 'Moderate',
  Grave: 'Severe'
};

const STATUS_BACKEND_TO_UI: Record<string, UiStatus> = {
  Active: 'Activa',
  active: 'Activa',
  UnderTreatment: 'Recuperándose',
  underTreatment: 'Recuperándose',
  Recovered: 'Recuperada',
  recovered: 'Recuperada',
  Cancelled: 'Cancelada',
  cancelled: 'Cancelada'
};

const STATUS_UI_TO_BACKEND: Record<UiStatus, InjuryStatus> = {
  Activa: 'Active',
  'Recuperándose': 'UnderTreatment',
  Recuperada: 'Recovered',
  Cancelada: 'Cancelled'
};

const TREATMENT_OPTIONS: Array<{ value: TreatmentValue; label: string }> = [
  { value: 'Rest', label: 'Reposo' },
  { value: 'Physiotherapy', label: 'Fisioterapia' },
  { value: 'Medication', label: 'Medicación' },
  { value: 'Rehabilitation', label: 'Rehabilitación' },
  { value: 'ManualTherapy', label: 'Terapia Manual' },
  { value: 'SpecificExercises', label: 'Ejercicios Específicos' },
  { value: 'Cryotherapy', label: 'Crioterapia' },
  { value: 'Thermotherapy', label: 'Termoterapia' },
  { value: 'Electrotherapy', label: 'Electroterapia' },
  { value: 'Surgery', label: 'Cirugía' },
  { value: 'Other', label: 'Otro' }
];

const TREATMENT_LABELS = TREATMENT_OPTIONS.reduce<Record<TreatmentValue, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<TreatmentValue, string>);

const DEFAULT_TREATMENT_LABEL = 'No especificado';

const IMPACT_OPTIONS: Array<{ value: ImpactValue; label: ImpactLabel }> = [
  { value: 'None', label: 'Ninguno' },
  { value: 'Low', label: 'Bajo' },
  { value: 'Moderate', label: 'Moderado' },
  { value: 'High', label: 'Alto' },
  { value: 'Full', label: 'Completo' }
];

const IMPACT_LABELS = IMPACT_OPTIONS.reduce<Record<ImpactValue, ImpactLabel>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<ImpactValue, ImpactLabel>);

const DEFAULT_IMPACT_LABEL: ImpactLabel = 'No especificado';

const normalizeTreatmentValue = (value?: string | null): TreatmentValue | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const match = TREATMENT_OPTIONS.find(option => option.value.toLowerCase() === normalized);
  return match ? match.value : null;
};

const normalizeImpactValue = (value?: string | null): ImpactValue | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const match = IMPACT_OPTIONS.find(option => option.value.toLowerCase() === normalized);
  return match ? match.value : null;
};

const INJURY_TYPES = [
  'Contractura', 'Desgarro', 'Esguince', 'Fractura', 'Luxación',
  'Tendinitis', 'Bursitis', 'Fascitis', 'Sobrecarga', 'Fatiga Muscular',
  'Lesión Ligamentaria', 'Lesión Meniscal', 'Síndrome de Fricción',
  'Periostitis', 'Fractura por Estrés', 'Otro'
];

export function AthleteStatusManagement() {
  const [injuryHistory, setInjuryHistory] = useState<InjuryRecord[]>([]);
  const [currentInjury, setCurrentInjury] = useState<InjuryRecord | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateInjuryModalOpen, setIsCreateInjuryModalOpen] = useState(false);
  const [selectedInjuryForDetails, setSelectedInjuryForDetails] = useState<InjuryRecord | null>(null);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<boolean | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    type: '',
    bodyZone: '',
    description: '',
    startDate: new Date(),
    estimatedEndDate: new Date(),
    severity: 'Leve' as UiSeverity,
    treatmentValue: null as TreatmentValue | null,
    impactValue: null as ImpactValue | null,
    notes: ''
  });

  const safeParseDate = useCallback((value?: string | null): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }, []);

  const mapSummaryToRecord = useCallback(
    (summary: AthleteInjurySummary): InjuryRecord => {
      const startDate = safeParseDate(summary.diagnosisDate) ?? new Date();
      const estimateDate =
        safeParseDate(summary.recoveryEstimateDate ?? undefined) ?? startDate;
      const recoveryDate = safeParseDate(summary.recoveryDate ?? undefined) ?? undefined;

      const severity = SEVERITY_BACKEND_TO_UI[summary.severity] ?? 'Moderada';
      const status = STATUS_BACKEND_TO_UI[summary.status] ?? 'Activa';
      const bodyZone = summary.affectedArea
        ? BACKEND_TO_BODY_ZONE[summary.affectedArea] ?? 'No especificada'
        : 'No especificada';
 
      const description = summary.description?.trim() || summary.notes?.trim() || 'Sin descripción provista.';
      const treatmentValue = normalizeTreatmentValue(summary.treatment as string | undefined);
      const treatmentLabel = treatmentValue ? TREATMENT_LABELS[treatmentValue] : DEFAULT_TREATMENT_LABEL;
      const impactValue = normalizeImpactValue(summary.impactOnTraining as string | undefined);
      const impactLabel: ImpactLabel = impactValue ? IMPACT_LABELS[impactValue] : DEFAULT_IMPACT_LABEL;
      const notes = summary.notes?.trim() ?? '';
 
      return {
        id: summary.id,
        type: summary.title?.trim() || 'Lesión sin título',
        bodyZone,
        description,
        startDate,
        estimatedEndDate: estimateDate,
        actualEndDate: recoveryDate ?? undefined,
        severity,
        treatmentLabel,
        treatmentValue,
        status,
        impactLabel,
        impactValue,
        notes,
        createdAt: startDate,
        backendStatus: summary.status,
        backendSeverity: summary.severity
      };
    },
    [safeParseDate]
  );

  const loadInjuries = useCallback(async () => {
    try {
      setIsLoading(true);
      const summaries = await AthleteInjuryService.getMyInjuries();
      const records = summaries
        .map(mapSummaryToRecord)
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      setInjuryHistory(records);

      const activeRecord = records.find(record => record.status === 'Activa' || record.status === 'Recuperándose') ?? null;
      setCurrentInjury(activeRecord);
    } catch (error) {
      console.error('Error loading injuries', error);
      toast.error('No se pudieron cargar tus lesiones en este momento. Intenta nuevamente más tarde.');
    } finally {
      setIsLoading(false);
    }
  }, [mapSummaryToRecord]);

  const loadStatus = useCallback(async () => {
    try {
      const response = await AthleteStatusService.getMyStatus();
      setIsActive(response.isActive);
    } catch (error) {
      console.error('Error loading athlete status', error);
      toast.error('No se pudo obtener tu estado actual. Intenta nuevamente.');
    }
  }, []);

  const updateAthleteStatus = useCallback(
    async (nextStatus: boolean, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      try {
        setIsUpdatingStatus(true);
        await AthleteStatusService.updateStatus({ isActive: nextStatus });
        setIsActive(nextStatus);

        if (!silent) {
          if (nextStatus) {
            toast.success('Marcado como activo. ¡Listo para entrenar!');
          } else {
            toast.info('Te marcamos como en recuperación.');
          }
        }
      } catch (error) {
        console.error('Error updating athlete status', error);
        toast.error('No pudimos actualizar tu estado. Intenta nuevamente.');
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    []
  );
 
  useEffect(() => {
    loadInjuries();
    loadStatus();
  }, [loadInjuries, loadStatus]);

  const handleStatusChange = async (newStatus: boolean) => {
    if (isUpdatingStatus || isSubmitting) {
      return;
    }

    if (newStatus && currentInjury) {
      setPendingStatusChange(newStatus);
      setIsStatusChangeModalOpen(true);
      return;
    }

    await updateAthleteStatus(newStatus, { silent: false });
  };

  const handleConfirmRecovery = async () => {
    if (!currentInjury || pendingStatusChange === null) return;

    try {
      setIsSubmitting(true);
      await AthleteInjuryService.update(currentInjury.id, {
        status: STATUS_UI_TO_BACKEND['Recuperada'],
        recoveryDate: new Date().toISOString()
      });
      await updateAthleteStatus(true, { silent: true });
      await loadInjuries();

      toast.success('¡Felicitaciones! Lesión marcada como recuperada.');
    } catch (error) {
      console.error('Error al marcar la lesión como recuperada', error);
      toast.error('No pudimos actualizar el estado de tu lesión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
      setIsStatusChangeModalOpen(false);
      setPendingStatusChange(null);
    }
  };

  const handleStayInactive = () => {
    if (!currentInjury) {
      setIsStatusChangeModalOpen(false);
      setPendingStatusChange(null);
      return;
    }

    toast.info('Mantendremos la lesión en seguimiento.');
    setIsStatusChangeModalOpen(false);
    setPendingStatusChange(null);
  };

  const handleCancelStatusChange = () => {
    setIsStatusChangeModalOpen(false);
    setPendingStatusChange(null);
  };

  const handleCreateInjury = async () => {
    if (!formData.type || !formData.bodyZone || !formData.description) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const backendLocation = (formData.bodyZone && BODY_ZONE_TO_BACKEND[formData.bodyZone as (typeof BODY_ZONES)[number]]) || undefined;
 
    const notesValue = formData.notes?.trim();
 
    const payload: CreateAthleteInjuryPayload = {
      title: formData.type.trim(),
      description: formData.description.trim(),
      affectedArea: backendLocation,
      severity: SEVERITY_UI_TO_BACKEND[formData.severity],
      status: 'Active',
      diagnosisDate: formData.startDate.toISOString(),
      recoveryEstimateDate: formData.estimatedEndDate ? formData.estimatedEndDate.toISOString() : undefined,
      treatment: formData.treatmentValue || undefined,
      impactOnTraining: formData.impactValue || undefined,
      notes: notesValue?.length ? notesValue : undefined
    };

    try {
      setIsSubmitting(true);
      await AthleteInjuryService.create(payload);
      await updateAthleteStatus(false, { silent: true });
      await loadInjuries();
      setIsCreateInjuryModalOpen(false);
      setFormData({
        type: '',
        bodyZone: '',
        description: '',
        startDate: new Date(),
        estimatedEndDate: new Date(),
        severity: 'Leve',
        treatmentValue: null,
        impactValue: null,
        notes: ''
      });
      toast.success('Lesión registrada correctamente');
    } catch (error) {
      console.error('Error al registrar la lesión', error);
      if (!('response' in (error as any))) {
        toast.error('No se pudo registrar la lesión. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Leve': return 'bg-yellow-100 text-yellow-800';
      case 'Moderada': return 'bg-orange-100 text-orange-800';
      case 'Grave': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa': return 'bg-red-100 text-red-800';
      case 'Recuperándose': return 'bg-blue-100 text-blue-800';
      case 'Recuperada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateRecoveryProgress = (injury: InjuryRecord) => {
    const start = injury.startDate.getTime();
    const estimated = injury.estimatedEndDate?.getTime() ?? start;

    if (!Number.isFinite(start) || !Number.isFinite(estimated) || estimated <= start) {
      return injury.actualEndDate ? 100 : 0;
    }

    const referenceEnd = injury.actualEndDate?.getTime() ?? Date.now();
    const elapsed = Math.max(0, Math.min(referenceEnd, estimated) - start);
    const total = estimated - start;

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Lesión Activa - PROMINENTE */}
      {currentInjury && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-lg shadow-lg border-2 border-red-600">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-xl">Lesión Activa en Seguimiento</h3>
                  <Badge className="bg-white text-red-600 hover:bg-white">
                    {currentInjury.status}
                  </Badge>
                </div>
                {currentInjury.estimatedEndDate && currentInjury.estimatedEndDate < new Date() && !currentInjury.actualEndDate && (
                  <div className="mb-3">
                    <div className="rounded-md border border-yellow-300 bg-yellow-50/80 px-4 py-3 text-yellow-900 shadow-sm">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold">Fecha estimada superada</p>
                          <p className="text-yellow-800">
                            Ya pasó la fecha estimada de recuperación. Si te sentís mejor, actualizá tu estado para que podamos ajustar tus entrenamientos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-red-100 text-sm">Tipo de Lesión</p>
                    <p className="font-semibold text-lg">{currentInjury.type}</p>
                  </div>
                  <div>
                    <p className="text-red-100 text-sm">Zona Afectada</p>
                    <p className="font-semibold text-lg">{currentInjury.bodyZone}</p>
                  </div>
                  <div>
                    <p className="text-red-100 text-sm">Impacto en Entrenamiento</p>
                    <p className="font-semibold text-lg">{currentInjury.impactLabel}</p>
                  </div>
                </div>
                <p className="text-red-50 text-sm mb-3">{currentInjury.description}</p>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-50">Progreso de Recuperación</span>
                    <span className="font-semibold">{Math.round(calculateRecoveryProgress(currentInjury))}%</span>
                  </div>
                  <Progress 
                    value={calculateRecoveryProgress(currentInjury)} 
                    className="h-2 bg-white/20" 
                  />
                  <div className="flex justify-between text-xs mt-2 text-red-100">
                    <span>Inicio: {currentInjury.startDate.toLocaleDateString('es-ES')}</span>
                    <span>Estimado: {currentInjury.estimatedEndDate.toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPendingStatusChange(true);
                setIsStatusChangeModalOpen(true);
              }}
              className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar Estado
            </Button>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isActive ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                Estado Actual del Atleta
              </CardTitle>
              <CardDescription>
                Gestiona tu estado de actividad y registra lesiones
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-switch" className="text-sm font-medium">
                    {isActive ? 'Activo' : 'Inactivo'}
                  </Label>
                  <Switch
                    id="status-switch"
                    checked={isActive}
                    onCheckedChange={handleStatusChange}
                    disabled={isUpdatingStatus || isSubmitting}
                  />
                </div>
                {currentInjury && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingStatusChange(true);
                      setIsStatusChangeModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Actualizar Estado
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                {isActive ? (
                  <Activity className="w-5 h-5 text-green-600" />
                ) : (
                  <Heart className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {isActive ? 'Listo para Entrenar' : 'En Recuperación'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Sin limitaciones' : 'Lesión activa'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{injuryHistory.length}</p>
                <p className="text-sm text-muted-foreground">Lesiones Registradas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">
                  {injuryHistory.filter(i => i.status === 'Recuperada').length}
                </p>
                <p className="text-sm text-muted-foreground">Recuperaciones Exitosas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Dialog open={isCreateInjuryModalOpen} onOpenChange={setIsCreateInjuryModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Registrar Lesión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Lesión</DialogTitle>
              <DialogDescription>
                Completa los detalles de tu lesión para un seguimiento adecuado
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="injury-type">Tipo de Lesión *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {INJURY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="body-zone">Zona Corporal *</Label>
                  <Select value={formData.bodyZone} onValueChange={(value) => setFormData(prev => ({ ...prev, bodyZone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_ZONES.map(zone => (
                        <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción de la Lesión *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe cómo ocurrió la lesión y los síntomas..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gravedad</Label>
                  <Select value={formData.severity} onValueChange={(value: UiSeverity) => setFormData(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leve">Leve</SelectItem>
                      <SelectItem value="Moderada">Moderada</SelectItem>
                      <SelectItem value="Grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Impacto en Entrenamiento</Label>
                  <Select
                    value={formData.impactValue ?? ''}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, impactValue: value as ImpactValue }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPACT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Tratamiento</Label>
                <Select
                  value={formData.treatmentValue ?? ''}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, treatmentValue: value as TreatmentValue }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate.toLocaleDateString('es-ES')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Fecha Estimada de Recuperación</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.estimatedEndDate.toLocaleDateString('es-ES')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.estimatedEndDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, estimatedEndDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional, recomendaciones médicas, etc..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateInjuryModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateInjury} disabled={isSubmitting} className="flex items-center gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Registrando...' : 'Registrar Lesión'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Change Confirmation Modal */}
      <Dialog open={isStatusChangeModalOpen} onOpenChange={setIsStatusChangeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              Actualizar Estado de Recuperación
            </DialogTitle>
            <DialogDescription>
              Tienes una lesión en seguimiento. Por favor, actualiza tu estado actual para un mejor seguimiento médico y deportivo.
            </DialogDescription>
          </DialogHeader>
          
          {currentInjury && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Lesión en Seguimiento</span>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Tipo:</span>
                      <p className="text-blue-900">{currentInjury.type}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Zona:</span>
                      <p className="text-blue-900">{currentInjury.bodyZone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-blue-700 font-medium text-sm">Descripción:</span>
                    <p className="text-xs text-blue-800">{currentInjury.description}</p>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-700 font-medium">Progreso Temporal</span>
                      <span className="text-blue-900 font-semibold">{Math.round(calculateRecoveryProgress(currentInjury))}%</span>
                    </div>
                    <Progress value={calculateRecoveryProgress(currentInjury)} className="h-2" />
                    <div className="flex justify-between text-xs mt-1 text-blue-600">
                      <span>Inicio: {currentInjury.startDate.toLocaleDateString('es-ES')}</span>
                      <span>Estimado: {currentInjury.estimatedEndDate.toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground mb-1">
                    ¿Cómo te sientes hoy?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tu respuesta ayudará a ajustar tu plan de entrenamiento
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleConfirmRecovery}
                    disabled={isSubmitting}
                    className="w-full justify-start h-auto p-4 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 hover:border-green-300 transition-all disabled:opacity-60"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-green-800">¡Me siento completamente recuperado!</p>
                        <p className="text-xs text-green-600 mt-1">
                          Sin dolor ni molestias, listo para entrenar al 100%
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-700">
                            {isSubmitting ? 'Actualizando...' : 'Marcar lesión como recuperada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={handleStayInactive}
                    disabled={isSubmitting}
                    className="w-full justify-start h-auto p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200 hover:border-orange-300 transition-all disabled:opacity-60"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-orange-800">Aún estoy en proceso de recuperación</p>
                        <p className="text-xs text-orange-600 mt-1">
                          Siento molestias o no me siento 100% confiado
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-xs text-orange-700">Mantener seguimiento de lesión</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
              
              <div className="pt-3 border-t border-muted">
                <Button
                  variant="ghost"
                  onClick={handleCancelStatusChange}
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Mantener estado actual sin cambios
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Puedes actualizar tu estado en cualquier momento
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Injury History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Lesiones</CardTitle>
          <CardDescription>
            Registro completo de tus lesiones y recuperaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {injuryHistory.length > 0 ? (
            <div className="space-y-4">
              {injuryHistory.map((injury) => (
                <div key={injury.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{injury.type}</h4>
                        <Badge className={getSeverityColor(injury.severity)}>
                          {injury.severity}
                        </Badge>
                        <Badge className={getStatusColor(injury.status)}>
                          {injury.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInjuryForDetails(injury)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Zona: </span>
                      <span className="font-medium">{injury.bodyZone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inicio: </span>
                      <span className="font-medium">
                        {injury.startDate.toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {injury.actualEndDate ? 'Recuperado: ' : 'Estimado: '}
                      </span>
                      <span className="font-medium">
                        {(injury.actualEndDate || injury.estimatedEndDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  
                  {injury.status === 'Activa' && (
                    <div className="mt-3">
                      <Progress value={calculateRecoveryProgress(injury)} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Sin lesiones registradas</h3>
              <p className="text-muted-foreground mb-4">
                ¡Excelente! Mantén este buen registro de salud.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Injury Details Modal */}
      <Dialog open={!!selectedInjuryForDetails} onOpenChange={() => setSelectedInjuryForDetails(null)}>
        <DialogContent className="max-w-2xl">
          {selectedInjuryForDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Detalles de Lesión
                </DialogTitle>
                <DialogDescription>
                  Información completa de la lesión registrada
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Lesión</Label>
                    <p className="font-semibold">{selectedInjuryForDetails.type}</p>
                  </div>
                  <div>
                    <Label>Zona Corporal</Label>
                    <p className="font-semibold">{selectedInjuryForDetails.bodyZone}</p>
                  </div>
                  <div>
                    <Label>Gravedad</Label>
                    <Badge className={getSeverityColor(selectedInjuryForDetails.severity)}>
                      {selectedInjuryForDetails.severity}
                    </Badge>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Badge className={getStatusColor(selectedInjuryForDetails.status)}>
                      {selectedInjuryForDetails.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Descripción</Label>
                  <p className="text-sm text-muted-foreground">{selectedInjuryForDetails.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tratamiento</Label>
                    <p className="font-medium">{selectedInjuryForDetails.treatmentLabel}</p>
                  </div>
                  <div>
                    <Label>Impacto en Entrenamiento</Label>
                    <Badge variant="outline">{selectedInjuryForDetails.impactLabel}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de Inicio</Label>
                    <p className="font-medium">
                      {selectedInjuryForDetails.startDate.toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <Label>
                      {selectedInjuryForDetails.actualEndDate ? 'Fecha de Recuperación' : 'Fecha Estimada'}
                    </Label>
                    <p className="font-medium">
                      {(selectedInjuryForDetails.actualEndDate || selectedInjuryForDetails.estimatedEndDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                
                {selectedInjuryForDetails.notes && (
                  <div>
                    <Label>Notas Adicionales</Label>
                    <p className="text-sm text-muted-foreground">{selectedInjuryForDetails.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedInjuryForDetails(null)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}