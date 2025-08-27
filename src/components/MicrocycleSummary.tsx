import React from 'react';
import { Card, CardContent } from './ui/card';
import { CalendarDays, Timer, BarChart3, Users } from 'lucide-react';
import { Mesocycle, Athlete } from './types/microcycleTypes';

interface MicrocycleSummaryProps {
  mesocycle: Mesocycle;
  athletes: Athlete[];
}

export function MicrocycleSummary({ mesocycle, athletes }: MicrocycleSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Microciclos</p>
              <p className="text-2xl font-bold">{mesocycle.microcycles.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Sesiones Totales</p>
              <p className="text-2xl font-bold">{mesocycle.sessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Volumen Total</p>
              <p className="text-2xl font-bold">{mesocycle.totalVolume} km</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Atletas</p>
              <p className="text-2xl font-bold">{athletes.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}