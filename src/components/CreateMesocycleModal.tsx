import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar, X, Save, Target, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MesocycleService, type CreateMesocycleDto } from '../services/mesocycleService';

interface Microcycle {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: number;
  volume: number;
  intensity: 'baja' | 'media' | 'alta';
  focus: string;
}

interface Mesocycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  objective: string;
  weeksCount: number;
  microcycles: Microcycle[];
  status: 'planning' | 'active' | 'completed';
}

interface CreateMesocycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mesocycle: Omit<Mesocycle, 'id' | 'microcycles'>) => void;
  editingMesocycle?: Mesocycle | null; // Mesociclo a editar (si es null, está en modo creación)
  existingMesocycles: Mesocycle[];
  year: number;
  planningId: string;
  planningStartDate: string; // Fecha de inicio de la planificación
  planningEndDate?: string | null; // Fecha de fin de la planificación (opcional)
}

export function CreateMesocycleModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  editingMesocycle,
  existingMesocycles,
  year,
  planningId,
  planningStartDate,
  planningEndDate
}: CreateMesocycleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    weeksCount: 4,
    objective: '',
    status: 'planning' as 'planning' | 'active' | 'completed'
  });

  const [endDate, setEndDate] = useState('');
  const [hasOverlap, setHasOverlap] = useState(false);
  const [overlappingMesocycles, setOverlappingMesocycles] = useState<Mesocycle[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [extendsBeyondYear, setExtendsBeyondYear] = useState(false);
  const [nextYearInfo, setNextYearInfo] = useState<{ year: number; startDate: string } | null>(null);

  const parseDateComponents = (value?: string | null) => {
    if (!value) return null;
    const normalized = value.includes('T') ? value.split('T')[0] : value;
    const parts = normalized.split('-');
    if (parts.length !== 3) return null;
    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if ([year, month, day].some(num => Number.isNaN(num))) {
      return null;
    }
    return { year, month, day };
  };

  const toDateOnly = (value?: string | null, endOfDay = false): Date | null => {
    const components = parseDateComponents(value);
    if (!components) return null;
    const date = new Date(components.year, components.month - 1, components.day, 0, 0, 0, 0);
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const toDateKey = (value?: string | null): number | null => {
    const components = parseDateComponents(value);
    if (!components) return null;
    const { year, month, day } = components;
    return year * 10000 + month * 100 + day;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatOverlapDate = (value?: string | null) => {
    const components = parseDateComponents(value);
    if (!components) return '';
    const date = new Date(components.year, components.month - 1, components.day, 0, 0, 0, 0);
    return date.toLocaleDateString('es-ES');
  };

  // Calcular la fecha de inicio recomendada (día siguiente al último mesociclo)
  // Busca la fecha de fin más tardía de todos los mesociclos y recomienda el día siguiente
  // Esto asegura que el nuevo mesociclo no se superponga con ningún mesociclo existente
  const getRecommendedStartDate = (): string => {
    // Parsear fecha de inicio de planificación como fecha local
    const planningStartParts = planningStartDate.split('T')[0].split('-').map(Number);
    const planningStart = new Date(planningStartParts[0], planningStartParts[1] - 1, planningStartParts[2], 0, 0, 0, 0);

    if (existingMesocycles.length === 0) {
      // Si no hay mesociclos, usar la fecha de inicio de la planificación
      return `${planningStartParts[0]}-${String(planningStartParts[1]).padStart(2, '0')}-${String(planningStartParts[2]).padStart(2, '0')}`;
    }

    // Encontrar todas las fechas de fin de los mesociclos (parsear como fechas locales)
    const endDates: Date[] = existingMesocycles
      .map(meso => {
        if (!meso.endDate) return null;
        
        // Parsear la fecha como local (evitar problemas de zona horaria)
        const dateStr = meso.endDate.split('T')[0]; // Obtener solo la parte de fecha (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month - 1 porque Date usa meses 0-indexados
        return endDate;
      })
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime()); // Ordenar de más tardía a más temprana

    // Si hay fechas, usar la más tardía (la última fecha de fin)
    if (endDates.length > 0) {
      const latestEndDate = endDates[0];
      
      // Calcular el día siguiente (sumar 1 día)
      const recommendedDate = new Date(latestEndDate);
      recommendedDate.setDate(recommendedDate.getDate() + 1);
      recommendedDate.setHours(0, 0, 0, 0); // Resetear a inicio del día

      // Validar que no exceda la fecha de fin de la planificación
      if (planningEndDate) {
        const planningEndParts = planningEndDate.split('T')[0].split('-').map(Number);
        const planningEnd = new Date(planningEndParts[0], planningEndParts[1] - 1, planningEndParts[2], 0, 0, 0, 0);
        
        if (recommendedDate > planningEnd) {
          // Si excede, usar la fecha de inicio de la planificación
          return `${planningStartParts[0]}-${String(planningStartParts[1]).padStart(2, '0')}-${String(planningStartParts[2]).padStart(2, '0')}`;
        }
      }

      // Validar que la fecha recomendada no sea anterior a la fecha de inicio de la planificación
      if (recommendedDate < planningStart) {
        return `${planningStartParts[0]}-${String(planningStartParts[1]).padStart(2, '0')}-${String(planningStartParts[2]).padStart(2, '0')}`;
      }

      // Formatear la fecha recomendada como YYYY-MM-DD
      const recYear = recommendedDate.getFullYear();
      const recMonth = String(recommendedDate.getMonth() + 1).padStart(2, '0');
      const recDay = String(recommendedDate.getDate()).padStart(2, '0');
      return `${recYear}-${recMonth}-${recDay}`;
    }

    // Si no hay fechas válidas, usar la fecha de inicio de la planificación
    return `${planningStartParts[0]}-${String(planningStartParts[1]).padStart(2, '0')}-${String(planningStartParts[2]).padStart(2, '0')}`;
  };

  // Pre-llenar el formulario cuando se está editando un mesociclo
  useEffect(() => {
    if (isOpen && editingMesocycle) {
      // Convertir fechas ISO a formato local (YYYY-MM-DD)
      // Validar que las fechas existan antes de hacer split
      if (!editingMesocycle.startDate) {
        console.error('editingMesocycle.startDate is undefined');
        return;
      }

      const startDateLocal = editingMesocycle.startDate.includes('T') 
        ? editingMesocycle.startDate.split('T')[0]
        : editingMesocycle.startDate;
      
      const endDateLocal = editingMesocycle.endDate && editingMesocycle.endDate.includes('T')
        ? editingMesocycle.endDate.split('T')[0]
        : editingMesocycle.endDate || startDateLocal;
      
      setFormData({
        name: editingMesocycle.name || '',
        startDate: startDateLocal,
        weeksCount: editingMesocycle.weeksCount || 4,
        objective: editingMesocycle.objective || '',
        status: editingMesocycle.status || 'planning'
      });
      
      // Calcular y establecer la fecha de fin
      // Si ya tenemos endDate, usarlo; si no, calcularlo desde startDate
      if (editingMesocycle.endDate && endDateLocal) {
        setEndDate(endDateLocal);
      } else {
        const endDate = new Date(startDateLocal);
        endDate.setDate(endDate.getDate() + ((editingMesocycle.weeksCount || 4) * 7) - 1);
        setEndDate(formatDateForInput(endDate));
      }
    } else if (isOpen && !editingMesocycle) {
      // Modo creación: inicializar con valores por defecto
      const recommendedDate = getRecommendedStartDate();
      setFormData({
        name: '',
        startDate: recommendedDate,
        weeksCount: 4,
        objective: '',
        status: 'planning'
      });
      // Calcular fecha de fin por defecto
      if (recommendedDate) {
        const endDate = new Date(recommendedDate);
        endDate.setDate(endDate.getDate() + (4 * 7) - 1);
        setEndDate(formatDateForInput(endDate));
      } else {
        setEndDate('');
      }
    }
  }, [isOpen, editingMesocycle, existingMesocycles, planningStartDate, planningEndDate]);

  // Obtener el último día del año seleccionado
  const getYearEndDate = (): Date => {
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // 31 de diciembre del año seleccionado
    return yearEnd;
  };

  // Validar que las fechas estén dentro del rango de la planificación
  // Permite que el mesociclo se extienda más allá del año seleccionado
  const validateDateRange = React.useCallback((start: Date, end: Date) => {
    const planningStartKey = toDateKey(planningStartDate);
    const startKey = toDateKey(formData.startDate);
    const endKey = toDateKey(formatDateForInput(end));

    let error: string | null = null;
    if (planningStartKey !== null && startKey !== null && startKey < planningStartKey) {
      error = `La fecha de inicio no puede ser anterior a ${formatOverlapDate(planningStartDate)}`;
    }

    const yearEnd = getYearEndDate();
    const yearEndKey = yearEnd.getFullYear() * 10000 + (yearEnd.getMonth() + 1) * 100 + yearEnd.getDate();

    if (endKey !== null && endKey > yearEndKey) {
      const nextYear = year + 1;
      const nextYearStart = new Date(nextYear, 0, 1);

      setExtendsBeyondYear(true);
      setNextYearInfo({
        year: nextYear,
        startDate: nextYearStart.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      });
    } else {
      setExtendsBeyondYear(false);
      setNextYearInfo(null);
    }

    if (planningEndDate) {
      const planningEnd = toDateOnly(planningEndDate, true);
      if (planningEnd) {
        const planningEndKey = planningEnd.getFullYear() * 10000 + (planningEnd.getMonth() + 1) * 100 + planningEnd.getDate();
        if (endKey !== null && endKey > planningEndKey) {
          error = `El período no puede extenderse más allá de ${formatOverlapDate(planningEndDate)}. Ajusta la cantidad de semanas.`;
        }
      }
    }

    setDateRangeError(error);
  }, [planningStartDate, planningEndDate, year, getYearEndDate, formData.startDate]);

  // Calcular fecha de fin automáticamente basada en la fecha de inicio y cantidad de semanas
  // Permite que el mesociclo se extienda más allá del año seleccionado
  useEffect(() => {
    if (formData.startDate && formData.weeksCount > 0) {
      // Parsear la fecha como fecha local (no UTC) para evitar problemas de zona horaria
      const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0); // month - 1 porque Date usa meses 0-indexados
      
      let end = new Date(start);
      end.setDate(end.getDate() + (formData.weeksCount * 7) - 1); // -1 para que sea inclusivo
      
      // Verificar el límite de la planificación si existe (solo este es restrictivo)
      if (planningEndDate) {
        const planningEndDateObj = new Date(planningEndDate);
        const planningEndYear = planningEndDateObj.getFullYear();
        const planningEndMonth = planningEndDateObj.getMonth();
        const planningEndDay = planningEndDateObj.getDate();
        const planningEnd = new Date(planningEndYear, planningEndMonth, planningEndDay, 23, 59, 59, 999);
        
        // Solo limitar por la planificación, no por el año
        if (end > planningEnd) {
          end = planningEnd;
          
          // Recalcular las semanas si se limita por la planificación
          const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const adjustedWeeks = Math.floor(daysDiff / 7);
          
          if (adjustedWeeks !== formData.weeksCount && adjustedWeeks > 0) {
            setFormData(prev => ({ ...prev, weeksCount: adjustedWeeks }));
          }
        }
      }
      
      // Formatear la fecha de fin como YYYY-MM-DD
      const endYear = end.getFullYear();
      const endMonth = String(end.getMonth() + 1).padStart(2, '0');
      const endDay = String(end.getDate()).padStart(2, '0');
      setEndDate(`${endYear}-${endMonth}-${endDay}`);
      
      // Validar que el período esté dentro del rango de la planificación
      // (no se valida el año, solo se informa si se extiende más allá)
      validateDateRange(start, end);
    } else {
      setEndDate('');
      setDateRangeError(null);
      setExtendsBeyondYear(false);
      setNextYearInfo(null);
    }
  }, [formData.startDate, formData.weeksCount, validateDateRange, planningEndDate, year]);

  // Verificar superposición con mesociclos existentes
  useEffect(() => {
    if (formData.startDate && endDate) {
      const startKey = toDateKey(formData.startDate);
      const endKey = toDateKey(endDate);

      if (startKey === null || endKey === null) {
        setHasOverlap(false);
        setOverlappingMesocycles([]);
        return;
      }
 
      // Filtrar mesociclos existentes, excluyendo el que se está editando
      const mesocyclesToCheck = editingMesocycle 
        ? existingMesocycles.filter(meso => meso.id !== editingMesocycle.id)
        : existingMesocycles;
 
      const overlapping = mesocyclesToCheck.filter(meso => {
        const mesoStartKey = toDateKey(meso.startDate);
        const mesoEndKey = toDateKey(meso.endDate);

        if (mesoStartKey === null || mesoEndKey === null) {
          return false;
        }

        // Verificar si hay superposición
        // Dos mesociclos se superponen si hay solapamiento real de días
        // Un mesociclo que termina el día X y otro que empieza el día X+1 NO se superponen (son consecutivos)
        // Hay superposición si:
        // - El nuevo empieza antes o durante el existente Y termina después o durante el existente
        // - Pero NO si son consecutivos (uno termina y el otro empieza al día siguiente)
        
        // Caso 1: El nuevo mesociclo empieza después de que termine el existente (consecutivos)
        if (startKey > mesoEndKey) {
          return false;
        }
        
        // Caso 2: El nuevo mesociclo termina antes de que empiece el existente (consecutivos)
        if (endKey < mesoStartKey) {
          return false;
        }
        
        // Caso 3: Son exactamente consecutivos (uno termina y el otro empieza al día siguiente)
        if (endKey + 1 === mesoStartKey || mesoEndKey + 1 === startKey) {
          return false; // No hay superposición si son consecutivos
        }
        
        // Si llegamos aquí, hay solapamiento real
        return true;
      });

      setHasOverlap(overlapping.length > 0);
      setOverlappingMesocycles(overlapping);
    } else {
      setHasOverlap(false);
      setOverlappingMesocycles([]);
    }
  }, [formData.startDate, endDate, existingMesocycles, editingMesocycle]);

  const handleReset = () => {
    setFormData({
      name: '',
      startDate: '',
      weeksCount: 4,
      objective: '',
      status: 'planning'
    });
    setEndDate('');
    setHasOverlap(false);
    setOverlappingMesocycles([]);
    setExtendsBeyondYear(false);
    setNextYearInfo(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Por favor ingresa un nombre para el mesociclo');
      return;
    }

    if (!formData.objective.trim()) {
      toast.error('Por favor ingresa un objetivo para el mesociclo');
      return;
    }

    if (!formData.startDate) {
      toast.error('Por favor selecciona la fecha de inicio');
      return;
    }

    if (!endDate) {
      toast.error('Por favor selecciona una cantidad de semanas válida');
      return;
    }

    if (formData.weeksCount < 1 || formData.weeksCount > 52) {
      toast.error('La cantidad de semanas debe estar entre 1 y 52');
      return;
    }

    if (dateRangeError) {
      toast.error(dateRangeError);
      return;
    }

    if (hasOverlap) {
      toast.error('El mesociclo se superpone con otro existente. Por favor ajusta las fechas.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar datos del mesociclo
      const mesocycleData = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        endDate: endDate,
        weeksCount: formData.weeksCount,
        objective: formData.objective.trim(),
        status: formData.status
      };

      if (editingMesocycle) {
        // Modo edición: solo llamar al callback (handleUpdateMesocycle ya maneja la actualización)
        onSubmit(mesocycleData);
        handleReset();
        onClose();
      } else {
        // Modo creación: crear el mesociclo en el backend
        const startDateISO = new Date(formData.startDate + 'T00:00:00Z').toISOString();
        const endDateISO = new Date(endDate + 'T23:59:59Z').toISOString();

        const createMesocycleDto: CreateMesocycleDto = {
          name: formData.name.trim(),
          description: formData.objective.trim(),
          startDate: startDateISO,
          endDate: endDateISO,
          weeksCount: formData.weeksCount,
          objective: formData.objective.trim(),
          status: formData.status
        };

        await MesocycleService.createMesocycleWithAutoMicrocycles(
          Number(planningId),
          createMesocycleDto
        );

        // Llamar al callback para actualizar la UI
        onSubmit(mesocycleData);
        handleReset();
        onClose();
      }
    } catch (error) {
      console.error(`Error al ${editingMesocycle ? 'actualizar' : 'crear'} mesociclo:`, error);
      // El error ya fue manejado por el servicio
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Parsear la fecha como fecha local (no UTC) para evitar problemas de zona horaria
    // El formato dateString viene como "YYYY-MM-DD" del input type="date"
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque Date usa meses 0-indexados
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMinDate = () => {
    // La fecha mínima es la fecha de inicio de la planificación
    const planningStart = toDateOnly(planningStartDate);
    return planningStart ? formatDateForInput(planningStart) : undefined;
  };
 
  const getMaxDate = () => {
     // La fecha máxima es la fecha de fin de la planificación (si existe)
     // Permitimos que el mesociclo se extienda más allá del año seleccionado
     if (planningEndDate) {
      const planningEnd = toDateOnly(planningEndDate, true);
      return planningEnd ? formatDateForInput(planningEnd) : undefined;
     }
     
     // Si no hay fecha de fin de planificación, sin límite (solo limitado por 52 semanas)
     return undefined;
   };

  // Calcular el máximo de semanas permitido basado en la planificación
  // Permite que el mesociclo se extienda más allá del año seleccionado
  const getMaxWeeks = (): number => {
    if (!formData.startDate) return 52;
    
    const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    
    // Si hay fecha de fin de planificación, calcular semanas hasta ahí
    if (planningEndDate) {
      const planningEndDateObj = new Date(planningEndDate);
      const planningEndYear = planningEndDateObj.getFullYear();
      const planningEndMonth = planningEndDateObj.getMonth();
      const planningEndDay = planningEndDateObj.getDate();
      const planningEnd = new Date(planningEndYear, planningEndMonth, planningEndDay, 23, 59, 59, 999);
      
      const planningMaxDays = Math.floor((planningEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const planningMaxWeeks = Math.floor(planningMaxDays / 7);
      return Math.max(1, Math.min(planningMaxWeeks, 52));
    }
    
    // Si no hay fecha de fin de planificación, permitir hasta 52 semanas
    return 52;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            {editingMesocycle ? 'Editar Mesociclo' : 'Nuevo Mesociclo'}
          </DialogTitle>
          <DialogDescription>
            {editingMesocycle 
              ? 'Modifica los datos del mesociclo. Los microciclos se actualizarán automáticamente si cambias la cantidad de semanas.'
              : 'Crea un nuevo mesociclo especificando la fecha de inicio y cantidad de semanas'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del Mesociclo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Mesociclo 1 - Adaptación Anatómica"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="objective">
              Objetivo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="objective"
              placeholder="Describe el objetivo principal de este mesociclo..."
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Fecha de Inicio y Cantidad de Semanas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Fecha de Inicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
              {formData.startDate && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(formData.startDate)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeksCount">
                Cantidad de Semanas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weeksCount"
                type="number"
                min="1"
                max={getMaxWeeks()}
                value={formData.weeksCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  const maxWeeks = getMaxWeeks();
                  setFormData(prev => ({ ...prev, weeksCount: Math.min(value, maxWeeks) }));
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Entre 1 y {getMaxWeeks()} semanas (máximo según el rango de la planificación)
              </p>
            </div>
          </div>

          {/* Fecha de Fin Calculada */}
          {endDate && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-accent mb-1">Fecha de Finalización</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(endDate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Duración: {formData.weeksCount} semana{formData.weeksCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Error de Rango de Fechas */}
          {dateRangeError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-1">Fuera del Rango de la Planificación</p>
                  <p className="text-sm text-red-700">
                    {dateRangeError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información cuando el mesociclo se extiende más allá del año */}
          {extendsBeyondYear && !dateRangeError && nextYearInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 mb-1">Extensión a Otro Año</p>
                  <p className="text-sm text-blue-700">
                    Este mesociclo se extiende más allá del año {year}. 
                    La parte que corresponde al año {nextYearInfo.year} (a partir del {nextYearInfo.startDate}) se mostrará cuando selecciones ese año en el dropdown.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Superposición */}
          {hasOverlap && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-2">Superposición Detectada</p>
                  <p className="text-sm text-red-700 mb-3">
                    El mesociclo que intentas crear se superpone con {overlappingMesocycles.length} mesociclo{overlappingMesocycles.length !== 1 ? 's' : ''} existente{overlappingMesocycles.length !== 1 ? 's' : ''}.
                  </p>
                  <div className="space-y-2">
                    {overlappingMesocycles.map(meso => (
                      <div key={meso.id} className="bg-white rounded p-2 border border-red-200">
                        <p className="text-sm font-medium text-red-900">{meso.name}</p>
                        <p className="text-xs text-red-700">
                          {formatOverlapDate(meso.startDate)} - {formatOverlapDate(meso.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-700 mt-3 font-medium">
                    Por favor, modifica la fecha de inicio o la cantidad de semanas para evitar la superposición.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info sobre lista vacía */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Creación Manual:</strong> Los mesociclos se crean uno a uno de forma manual. 
                  Los microciclos y sesiones se gestionarán posteriormente desde la vista de planificación.
                </p>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              !formData.name.trim() || 
              !formData.objective.trim() || 
              !formData.startDate || 
              !endDate ||
              hasOverlap ||
              !!dateRangeError ||
              formData.weeksCount < 1 ||
              isSubmitting
            }
            className="bg-accent hover:bg-accent/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingMesocycle ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingMesocycle ? 'Actualizar Mesociclo' : 'Crear Mesociclo'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
