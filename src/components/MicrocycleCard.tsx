import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Microcycle, TrainingSession } from './types/microcycleTypes';
import { getIntensityColor, formatDateRange, formatDate, getMicrocycleProgress, getVolumeProgress } from './utils/microcycleUtils';

interface MicrocycleCardProps {
  microcycle: Microcycle;
  mockTrainingSessions: TrainingSession[];
  onViewCalendar: (microcycle: Microcycle) => void;
  onCreateSession?: (microcycleId: string, date: string) => void;
  onEditMicrocycle?: (microcycle: Microcycle) => void;
  onDeleteMicrocycle: (microcycleId: string) => void;
}

export function MicrocycleCard({
  microcycle,
  mockTrainingSessions,
  onViewCalendar,
  onCreateSession,
  onEditMicrocycle,
  onDeleteMicrocycle
}: MicrocycleCardProps) {
  const progress = getMicrocycleProgress(microcycle.completedSessions, microcycle.sessions);
  const volumeProgress = getVolumeProgress(microcycle.actualVolume, microcycle.volume);

  const sessionsForWeek = mockTrainingSessions.filter(session => {
    const sessionDate = new Date(session.date);
    const startDate = new Date(microcycle.startDate);
    const endDate = new Date(microcycle.endDate);
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Semana {microcycle.weekNumber}</CardTitle>
            <CardDescription>
              {formatDateRange(microcycle.startDate, microcycle.endDate)}
            </CardDescription>
          </div>
          <Badge className={getIntensityColor(microcycle.intensity)} variant="outline">
            {microcycle.intensity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enfoque */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Enfoque</p>
          <p className="text-sm">{microcycle.focus}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Sesiones</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {microcycle.completedSessions || 0}/{microcycle.sessions}
              </span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">Volumen</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {microcycle.actualVolume || 0}/{microcycle.volume} km
              </span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(volumeProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sesiones programadas */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Sesiones Programadas
          </p>
          <div className="space-y-1">
            {sessionsForWeek
              .slice(0, 2)
              .map(session => (
                <div key={session.id} className="text-xs bg-muted/50 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{session.name}</span>
                    <span className="text-muted-foreground">
                      {formatDate(session.date)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {session.volume} • {session.intensity}
                  </p>
                </div>
              ))
            }
            {sessionsForWeek.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No hay sesiones programadas
              </p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewCalendar(microcycle)}
                className="h-8 w-8 p-0 hover:bg-accent/20"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver calendario del microciclo</p>
            </TooltipContent>
          </Tooltip>

          {onCreateSession && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateSession(microcycle.id, microcycle.startDate)}
                  className="h-8 w-8 p-0 hover:bg-accent/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Crear sesión</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onEditMicrocycle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMicrocycle(microcycle)}
                  className="h-8 w-8 p-0 hover:bg-accent/20"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar microciclo</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteMicrocycle(microcycle.id)}
                className="h-8 w-8 p-0 hover:bg-destructive/20 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar microciclo</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}