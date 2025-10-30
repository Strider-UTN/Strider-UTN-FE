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
  AlertCircle,
  Activity,
  ShieldAlert
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
  readOnly?: boolean;
}

export function SessionRetroalimentacionModal({
  isOpen,
  onClose,
  plannedSession,
  actualSession,
  existingFeedback,
  athleteName,
  onSaveFeedback,
  readOnly = false
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
            {readOnly || existingFeedback ? 'Retroalimentación de Sesión' : 'Dar Retroalimentación de Sesión'} - {athleteName}
          </DialogTitle>
          <DialogDescription>
            {readOnly || existingFeedback 
              ? 'Visualiza la retroalimentación proporcionada para esta sesión'
              : 'Proporciona retroalimentación específica sobre el rendimiento del atleta en esta sesión'
            }
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

          {/* Información reportada por el atleta */}
          {actualSession && (
            <div className="border rounded-lg p-6 space-y-4 bg-blue-50/30 border-blue-200">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Información Reportada por el Atleta
              </h4>

              {/* Métricas de la sesión */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Distancia</p>
                  <p className="font-medium">{actualSession.actualDistance} km</p>
                  <p className="text-xs text-muted-foreground">
                    Planeado: {plannedSession.plannedDistance} km
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ritmo</p>
                  <p className="font-medium">{actualSession.actualPace}</p>
                  <p className="text-xs text-muted-foreground">
                    Planeado: {plannedSession.plannedPace}
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Duración</p>
                  <p className="font-medium">{Math.floor(actualSession.actualDuration / 60)} min</p>
                  <p className="text-xs text-muted-foreground">
                    Planeado: {Math.floor(plannedSession.plannedDuration / 60)} min
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Esfuerzo Percibido</p>
                  <p className="font-medium">{actualSession.perceivedExertion}/10</p>
                  <p className="text-xs text-muted-foreground">
                    Planeado: {plannedSession.plannedIntensity}/10
                  </p>
                </div>
              </div>

              {/* Frecuencia cardíaca si está disponible */}
              {actualSession.heartRate && (
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Frecuencia Cardíaca</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      <p className="font-medium">{actualSession.heartRate.avg} bpm</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Máxima</p>
                      <p className="font-medium">{actualSession.heartRate.max} bpm</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Molestias o dolencias */}
              {actualSession.injuries && actualSession.injuries.length > 0 && (
                <div className="bg-red-50/50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium flex items-center gap-2 mb-3 text-red-900">
                    <ShieldAlert className="w-4 h-4" />
                    Molestias o Dolencias Reportadas
                  </h5>
                  <div className="space-y-3">
                    {actualSession.injuries.map((injury, index) => (
                      <div key={index} className="bg-white/80 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                              injury.type === 'Dolor' 
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-orange-100 text-orange-800 border-orange-300'
                            }>
                              {injury.type}
                            </Badge>
                            <span className="font-medium">{injury.location}</span>
                          </div>
                          <Badge variant="outline" className="bg-gray-100">
                            Severidad: {injury.severity}/10
                          </Badge>
                        </div>
                        {injury.description && (
                          <p className="text-sm text-muted-foreground">
                            {injury.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comentarios del atleta */}
              {(actualSession.notes || actualSession.sensations) && (
                <div className="bg-white/80 rounded-lg p-4">
                  <h5 className="font-medium flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Comentarios del Atleta
                  </h5>
                  {actualSession.sensations && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Sensaciones durante el entrenamiento:</p>
                      <p className="text-sm">{actualSession.sensations}</p>
                    </div>
                  )}
                  {actualSession.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notas adicionales:</p>
                      <p className="text-sm">{actualSession.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                    onClick={() => !readOnly && !existingFeedback && setRating(ratingOption)}
                    disabled={readOnly || !!existingFeedback}
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
                Comentarios sobre la Sesión {!readOnly && !existingFeedback && '*'}
              </label>
              <Textarea
                placeholder="Evalúa el rendimiento del atleta en esta sesión específica. Menciona aspectos positivos, áreas de mejora, cumplimiento de objetivos, técnica, actitud, etc."
                value={retroalimentacionText}
                onChange={(e) => setRetroalimentacionText(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={readOnly || !!existingFeedback}
              />
              {!readOnly && !existingFeedback && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sé específico y constructivo en tu retroalimentación
                </p>
              )}
            </div>

            {/* Recomendaciones */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Recomendaciones para Próximas Sesiones
              </label>
              <Textarea
                placeholder="Sugerencias específicas para las próximas sesiones de entrenamiento..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={readOnly || !!existingFeedback}
              />
            </div>

          </div>
        </div>

        <DialogFooter>
          {readOnly || existingFeedback ? (
            <Button onClick={handleCancel}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!retroalimentacionText.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Guardar Retroalimentación
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}