import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { X, Plus, MapPin, Calendar } from 'lucide-react';

interface TrainingGroup {
  name: string;
  trainingPoints: string[];
  createdDate: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: TrainingGroup) => void;
}

export function CreateGroupModal({ isOpen, onClose, onCreateGroup }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    trainingPoints: [] as string[],
    currentPoint: '',
    createdDate: new Date().toISOString().split('T')[0]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTrainingPoint = () => {
    const point = formData.currentPoint.trim();
    if (point && !formData.trainingPoints.includes(point)) {
      setFormData(prev => ({
        ...prev,
        trainingPoints: [...prev.trainingPoints, point],
        currentPoint: ''
      }));
    }
  };

  const removeTrainingPoint = (pointToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      trainingPoints: prev.trainingPoints.filter(point => point !== pointToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrainingPoint();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }
    
    if (formData.trainingPoints.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newGroup: TrainingGroup = {
      name: formData.name.trim(),
      trainingPoints: formData.trainingPoints,
      createdDate: formData.createdDate
    };
    
    onCreateGroup(newGroup);
    
    // Reset form
    setFormData({
      name: '',
      trainingPoints: [],
      currentPoint: '',
      createdDate: new Date().toISOString().split('T')[0]
    });
    
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form on close
      setFormData({
        name: '',
        trainingPoints: [],
        currentPoint: '',
        createdDate: new Date().toISOString().split('T')[0]
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Sede Atlética
          </DialogTitle>
          <DialogDescription>
            Crea una nueva sede para organizar y entrenar a tus atletas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre de la Agrupación */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Nombre de la Sede *</Label>
            <Input
              id="groupName"
              placeholder="ej. Velocistas Elite, Fondistas Amateur..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={isSubmitting}
              className="focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Elige un nombre descriptivo que identifique el tipo de entrenamiento o nivel.
            </p>
          </div>

          {/* Puntos de Entrenamiento */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Puntos de Entrenamiento *
            </Label>
            
            <div className="flex space-x-2">
              <Input
                placeholder="ej. Pista Municipal, Parque Central..."
                value={formData.currentPoint}
                onChange={(e) => handleInputChange('currentPoint', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTrainingPoint}
                disabled={!formData.currentPoint.trim() || isSubmitting}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Lista de puntos agregados */}
            {formData.trainingPoints.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Puntos agregados:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.trainingPoints.map((point, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="bg-primary/10 text-primary pr-1"
                    >
                      {point}
                      <button
                        type="button"
                        onClick={() => removeTrainingPoint(point)}
                        disabled={isSubmitting}
                        className="ml-1 text-primary/60 hover:text-primary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Agrega las ubicaciones donde se realizarán los entrenamientos (mínimo 1).
            </p>
          </div>

          {/* Fecha de Creación */}
          <div className="space-y-2">
            <Label htmlFor="createdDate" className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Fecha de Creación
            </Label>
            <Input
              id="createdDate"
              type="date"
              value={formData.createdDate}
              onChange={(e) => handleInputChange('createdDate', e.target.value)}
              required
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]}
              className="focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Fecha en que se creó oficialmente la sede.
            </p>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || formData.trainingPoints.length === 0 || isSubmitting}
              className="bg-accent hover:bg-accent/90"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-accent-foreground/20 border-t-accent-foreground rounded-full animate-spin"></div>
                  <span>Creando...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Sede
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}