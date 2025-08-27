import React, { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { TooltipProvider } from './ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { PlanningCalendar } from './PlanningCalendar';
import { MicrocycleSummary } from './MicrocycleSummary';
import { MicrocycleCard } from './MicrocycleCard';
import { MicrocycleViewProps, Microcycle } from './types/microcycleTypes';
import { getStatusColor } from './utils/microcycleUtils';
import { STATUS_LABELS } from './constants/microcycleConstants';
import { MOCK_TRAINING_SESSIONS } from './constants/mockMicrocycleData';
import { toast } from 'sonner';

export function MicrocycleView({
  mesocycle,
  athletes,
  onBack,
  onCreateSession,
  onEditMicrocycle,
  onDeleteMicrocycle,
  onViewCalendar
}: MicrocycleViewProps) {
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<Microcycle | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleViewCalendar = (microcycle: Microcycle) => {
    setSelectedMicrocycle(microcycle);
    setShowCalendar(true);
  };

  const handleDeleteMicrocycle = (microcycleId: string) => {
    if (onDeleteMicrocycle) {
      onDeleteMicrocycle(microcycleId);
      toast.success('Microciclo eliminado exitosamente');
    }
    setDeleteConfirmId(null);
  };

  if (showCalendar && selectedMicrocycle) {
    return (
      <PlanningCalendar
        view="microcycle"
        currentDate={selectedMicrocycle.startDate}
        microcycle={selectedMicrocycle}
        onBack={() => setShowCalendar(false)}
        athletes={athletes}
        onCreateSession={onCreateSession}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Mesociclos
            </Button>
            <div className="border-l h-6 border-border" />
            <div>
              <h1 className="text-2xl font-bold">{mesocycle.name}</h1>
              <p className="text-muted-foreground">{mesocycle.objective}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(mesocycle.status)}>
              {STATUS_LABELS[mesocycle.status]}
            </Badge>
            <Badge variant="outline">
              Semanas {mesocycle.startWeek}-{mesocycle.endWeek}
            </Badge>
          </div>
        </div>

        {/* Resumen del mesociclo */}
        <MicrocycleSummary mesocycle={mesocycle} athletes={athletes} />

        {/* Lista de microciclos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Microciclos Semanales</h2>
            <Badge variant="secondary">
              {mesocycle.microcycles.length} semanas planificadas
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mesocycle.microcycles.map((microcycle) => (
              <MicrocycleCard
                key={microcycle.id}
                microcycle={microcycle}
                mockTrainingSessions={MOCK_TRAINING_SESSIONS}
                onViewCalendar={handleViewCalendar}
                onCreateSession={onCreateSession}
                onEditMicrocycle={onEditMicrocycle}
                onDeleteMicrocycle={(id) => setDeleteConfirmId(id)}
              />
            ))}
          </div>
        </div>

        {/* Dialog de confirmación para eliminar */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el microciclo
                y todas las sesiones asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirmId && handleDeleteMicrocycle(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}