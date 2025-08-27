import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

import { 
  MessageSquare,
  Send,
  Star,
  ThumbsUp,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PlannedSession {
  id: string;
  name: string;
  date: string;
  type: 'Intervalos' | 'Fondo' | 'Tempo' | 'Recuperación' | 'Test';
  plannedDistance: number;
  plannedDuration: number;
  plannedPace: string;
  plannedIntensity: number;
  notes?: string;
}

interface ActualSession {
  id: string;
  sessionId: string;
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  perceivedExertion: number;
  heartRate?: {
    avg: number;
    max: number;
  };
  notes?: string;
  sensations?: string; // Comentarios sobre cómo se sintió durante el entrenamiento
  completed: boolean;
  completedAt: string;
  injuries?: Array<{
    type: 'Molestia' | 'Dolor';
    location: string;
    severity: number; // 1-10 scale
    description?: string;
  }>;
}

interface CoachFeedback {
  id: string;
  sessionId: string;
  microcycleId: string;
  feedbackText: string;
  rating: 'excellent' | 'good' | 'needs_improvement' | 'concerning';
  recommendations?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SessionRetroalimentacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedSession: PlannedSession;
  actualSession?: ActualSession;
  existingFeedback?: CoachFeedback;
  athleteName: string;
  onSaveFeedback: (feedback: CoachFeedback) => void;
}

export function SessionRetroalimentacionModal({
  isOpen,
  onClose,
  plannedSession,
  actualSession,
  existingFeedback,
  athleteName,
  onSaveFeedback
}: SessionRetroalimentacionModalProps) {
  const [rating, setRating] = useState<CoachFeedback['rating']>('good');
  const [retroalimentacionText, setRetroalimentacionText] = useState('');
  const [recommendations, setRecommendations] = useState('');


  // Inicializar formulario con datos existentes
  useEffect(() => {
    if (existingFeedback) {
      setRating(existingFeedback.rating);
      setRetroalimentacionText(existingFeedback.feedbackText);
      setRecommendations(existingFeedback.recommendations || '');
    } else {
      setRating('good');
      setRetroalimentacionText('');
      setRecommendations('');
    }
  }, [existingFeedback, isOpen]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    });
  };



  const getRatingIcon = (ratingType: string) => {
    switch (ratingType) {
      case 'excellent':
        return <Star className="w-4 h-4 text-green-600" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4 text-blue-600" />;
      case 'needs_improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'concerning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRatingColor = (ratingType: string) => {
    switch (ratingType) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'concerning': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingLabel = (ratingType: string) => {
    switch (ratingType) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'needs_improvement': return 'Necesita Mejora';
      case 'concerning': return 'Preocupante';
      default: return 'Sin Evaluar';
    }
  };



  const handleSave = () => {
    if (!retroalimentacionText.trim()) {
      toast.error('Por favor, escribe un comentario antes de guardar');
      return;
    }

    const feedback: CoachFeedback = {
      id: existingFeedback?.id || `retroalimentacion-${Date.now()}`,
      sessionId: plannedSession.id,
      microcycleId: 'current-microcycle', // Se debería pasar como prop
      feedbackText: retroalimentacionText.trim(),
      rating,
      recommendations: recommendations.trim() || undefined,
      createdAt: existingFeedback?.createdAt || new Date().toISOString(),
      updatedAt: existingFeedback ? new Date().toISOString() : undefined
    };

    onSaveFeedback(feedback);
    toast.success('Retroalimentación guardada exitosamente');
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Retroalimentación de Sesión - {athleteName}
          </DialogTitle>
          <DialogDescription>
            Proporciona retroalimentación específica sobre el rendimiento del atleta en esta sesión
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header de la sesión */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-medium">{plannedSession.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(plannedSession.date)} • {plannedSession.type}
                </p>
              </div>
            </div>
            {existingFeedback && (
              <Badge className={`${getRatingColor(existingFeedback.rating)} flex items-center gap-1`}>
                {getRatingIcon(existingFeedback.rating)}
                {getRatingLabel(existingFeedback.rating)}
              </Badge>
            )}
          </div>



          {/* Formulario de Retroalimentación */}
          <div className="border rounded-lg p-6 space-y-6">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Tu Evaluación como Entrenador
            </h4>
            
            {/* Selector de calificación */}
            <div>
              <label className="block text-sm font-medium mb-3">Calificación General</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['excellent', 'good', 'needs_improvement', 'concerning'] as const).map((ratingOption) => (
                  <Button
                    key={ratingOption}
                    variant={rating === ratingOption ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRating(ratingOption)}
                    className={`justify-start h-auto p-3 ${rating === ratingOption ? getRatingColor(ratingOption) : ''}`}
                  >
                    <div className="flex flex-col items-center gap-1 w-full">
                      {getRatingIcon(ratingOption)}
                      <span className="text-xs">{getRatingLabel(ratingOption)}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Comentarios sobre la Sesión *
              </label>
              <Textarea
                placeholder="Evalúa el rendimiento del atleta en esta sesión específica. Menciona aspectos positivos, áreas de mejora, cumplimiento de objetivos, técnica, actitud, etc."
                value={retroalimentacionText}
                onChange={(e) => setRetroalimentacionText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sé específico y constructivo en tu retroalimentación
              </p>
            </div>

            {/* Recomendaciones */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Recomendaciones para Futuras Sesiones (Opcional)
              </label>
              <Textarea
                placeholder="Aspectos específicos a trabajar, ajustes en intensidad, técnica a mejorar, estrategias de entrenamiento..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!retroalimentacionText.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {existingFeedback ? 'Actualizar Retroalimentación' : 'Guardar Retroalimentación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}