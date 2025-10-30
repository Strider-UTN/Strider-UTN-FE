import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Save, Clock, FileText, Check, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { AthleteIntervalBuilder } from './AthleteIntervalBuilder';
import { toast } from 'sonner';

interface TrainingInterval {
  id: string;
  type: 'interval' | 'continuous' | 'recovery';
  repetitions: number;
  distance: number;
  targetTime?: string;
  recoveryTime: string;
  paceType: 'fixed' | 'vo2max_percentage';
  pace?: number;
  vo2maxPercentage?: number;
  description?: string;
  intensity?: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
  trainingMode?: 'distance' | 'time';
  duration?: string;
  targetSpeed?: string;
}

interface TrainingTemplate {
  id: string;
  name: string;
  description: string;
  type: 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series';
  category: 'training' | 'prep_competition' | 'main_competition';
  duration: number;
  distance?: number;
  targetPace?: string;
  targetHR?: string;
  intervals: TrainingInterval[];
  notes: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
  tags: string[];
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  template?: TrainingTemplate | null;
  mode: 'create' | 'edit';
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
  mode
}: CreateTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: (template?.category || 'training') as 'training' | 'prep_competition' | 'main_competition',
    notes: template?.notes || ''
  });
  
  const [intervals, setIntervals] = useState<TrainingInterval[]>(template?.intervals || []);
  const [currentStep, setCurrentStep] = useState(1);

  const categoryLabels = {
    'training': 'Entrenamiento',
    'prep_competition': 'Competencia Preparatoria',
    'main_competition': 'Competencia Principal'
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la plantilla es requerido');
      return;
    }

    if (intervals.length === 0) {
      toast.error('Debe agregar al menos una serie');
      return;
    }

    const templateData: Omit<TrainingTemplate, 'id' | 'createdAt' | 'useCount'> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: 'Intervalos', // Valor por defecto, puede adaptarse según los intervalos
      category: formData.category,
      duration: 0, // Se puede calcular desde los intervalos
      intervals: intervals,
      notes: formData.notes.trim() || '',
      difficulty: 3,
      isFavorite: false,
      tags: [],
      lastUsed: template?.lastUsed
    };

    onSave(templateData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: 'training',
      notes: ''
    });
    setIntervals([]);
    setCurrentStep(1);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAddInterval = (interval: Omit<TrainingInterval, 'id'>) => {
    const newInterval: TrainingInterval = {
      ...interval,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setIntervals(prev => [...prev, newInterval]);
  };

  const handleUpdateInterval = (intervalId: string, updatedInterval: Omit<TrainingInterval, 'id'>) => {
    setIntervals(prev => prev.map(interval => 
      interval.id === intervalId 
        ? { ...updatedInterval, id: intervalId }
        : interval
    ));
  };

  const handleDeleteInterval = (intervalId: string) => {
    setIntervals(prev => prev.filter(interval => interval.id !== intervalId));
  };

  const canGoToNextStep = () => {
    if (currentStep === 1) {
      return formData.name.trim() !== '';
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast.error('Por favor completa el nombre de la plantilla');
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isFormValid = formData.name.trim() && intervals.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            {mode === 'create' ? 'Nueva Plantilla de Entrenamiento' : 'Editar Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crea una plantilla reutilizable para futuras sesiones'
              : 'Modifica los detalles de tu plantilla'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Pasos */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Datos Básicos', icon: FileText },
              { step: 2, label: 'Series', icon: Clock }
            ].map(({ step, label, icon: Icon }, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep === step 
                        ? 'bg-accent border-accent text-white' 
                        : currentStep > step
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm ${currentStep === step ? 'font-medium text-accent' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {index < 1 && (
                  <div className={`flex-1 h-0.5 mx-4 mb-8 transition-all ${
                    currentStep > step + 1 ? 'bg-green-500' : currentStep > step ? 'bg-accent' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contenido del Paso Actual */}
        <div className="min-h-[400px]">
          {/* Paso 1: Datos Básicos */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Paso 1: Información Básica</h3>
                <p className="text-sm text-muted-foreground">
                  Completa los datos fundamentales de la plantilla de entrenamiento
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">
                    Nombre de la Plantilla <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Intervalos 8x400m"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template-category">
                    Categoría <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: 'training' | 'prep_competition' | 'main_competition') => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Entrenamiento</SelectItem>
                      <SelectItem value="prep_competition">Competencia Preparatoria</SelectItem>
                      <SelectItem value="main_competition">Competencia Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template-description">Descripción</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción detallada del entrenamiento..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template-notes">Notas Adicionales</Label>
                  <Textarea
                    id="template-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones especiales, consideraciones..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              {!formData.name.trim() && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Nombre requerido</p>
                    <p className="text-sm text-amber-700">Debes completar el nombre de la plantilla para continuar</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Series/Intervalos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">Paso 2: Constructor de Series</h3>
                  <p className="text-sm text-muted-foreground">
                    Define los intervalos y estructura de la plantilla
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {intervals.length} serie{intervals.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <Separator />

              <AthleteIntervalBuilder 
                intervals={intervals}
                onAddInterval={handleAddInterval}
                onUpdateInterval={handleUpdateInterval}
                onDeleteInterval={handleDeleteInterval}
              />

              {intervals.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Series requeridas</p>
                    <p className="text-sm text-amber-700">Debes agregar al menos una serie para crear la plantilla</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            
            {currentStep < 2 ? (
              <Button
                onClick={handleNextStep}
                disabled={!canGoToNextStep()}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {mode === 'create' ? 'Crear Plantilla' : 'Guardar Cambios'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
