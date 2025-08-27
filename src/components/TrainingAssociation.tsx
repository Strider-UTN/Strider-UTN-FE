import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Link2, CheckCircle, XCircle, AlertCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlannedSession {
  id: string;
  date: string;
  name: string;
  type: string;
  plannedDuration: number;
  plannedDistance: number;
  plannedPace: string;
  targetHR: string;
  athlete: string;
  status: 'pending' | 'completed' | 'partially_completed' | 'not_completed';
  associatedTrainingId?: string;
}

interface CompletedTraining {
  id: string;
  date: string;
  name: string;
  duration: number;
  distance: number;
  avgPace: string;
  avgHR: number;
  athlete: string;
  status: 'pending_association' | 'associated' | 'reviewed';
  comments: string;
  sensations: {
    effort: number;
    fatigue: number;
    motivation: number;
  };
}

interface Comparison {
  plannedSession: PlannedSession;
  completedTraining: CompletedTraining;
  complianceScore: number;
  deviations: {
    duration: number; // porcentaje
    distance: number; // porcentaje
    pace: number; // porcentaje
  };
}

export function TrainingAssociation() {
  const [activeTab, setActiveTab] = useState('pending');

  // Datos de ejemplo
  const plannedSessions: PlannedSession[] = [
    {
      id: 'ps1',
      date: '2025-01-26',
      name: 'Carrera Tempo Matutina',
      type: 'training',
      plannedDuration: 45,
      plannedDistance: 8.0,
      plannedPace: '4:45',
      targetHR: '75% VO₂ Max',
      athlete: 'Carlos Mendoza',
      status: 'completed',
      associatedTrainingId: 'ct1'
    },
    {
      id: 'ps2',
      date: '2025-01-24',
      name: 'Intervalos VO₂ Max',
      type: 'training',
      plannedDuration: 60,
      plannedDistance: 10.0,
      plannedPace: '4:20',
      targetHR: '90-95% VO₂ Max',
      athlete: 'Carlos Mendoza',
      status: 'partially_completed',
      associatedTrainingId: 'ct2'
    },
    {
      id: 'ps3',
      date: '2025-01-25',
      name: 'Carrera de Recuperación',
      type: 'recovery',
      plannedDuration: 30,
      plannedDistance: 5.0,
      plannedPace: '5:30',
      targetHR: '65% VO₂ Max',
      athlete: 'Ana Rodríguez',
      status: 'pending'
    }
  ];

  const completedTrainings: CompletedTraining[] = [
    {
      id: 'ct1',
      date: '2025-01-26',
      name: 'Carrera Matutina',
      duration: 42,
      distance: 8.5,
      avgPace: '4:58',
      avgHR: 155,
      athlete: 'Carlos Mendoza',
      status: 'associated',
      comments: 'Me sentí muy bien durante todo el recorrido',
      sensations: { effort: 6, fatigue: 4, motivation: 8 }
    },
    {
      id: 'ct2',
      date: '2025-01-24',
      name: 'Intervalos VO₂ Max',
      duration: 58,
      distance: 10.2,
      avgPace: '4:25',
      avgHR: 164,
      athlete: 'Carlos Mendoza',
      status: 'associated',
      comments: 'Completé todos los intervalos según lo planeado',
      sensations: { effort: 9, fatigue: 7, motivation: 7 }
    },
    {
      id: 'ct3',
      date: '2025-01-27',
      name: 'Carrera Vespertina',
      duration: 35,
      distance: 6.2,
      avgPace: '5:15',
      avgHR: 148,
      athlete: 'Ana Rodríguez',
      status: 'pending_association',
      comments: 'Carrera tranquila, me sentí bien',
      sensations: { effort: 4, fatigue: 3, motivation: 7 }
    }
  ];

  // Generar comparaciones
  const generateComparisons = (): Comparison[] => {
    return plannedSessions
      .filter(ps => ps.associatedTrainingId)
      .map(ps => {
        const ct = completedTrainings.find(ct => ct.id === ps.associatedTrainingId);
        if (!ct) return null;

        const durationDeviation = ((ct.duration - ps.plannedDuration) / ps.plannedDuration) * 100;
        const distanceDeviation = ((ct.distance - ps.plannedDistance) / ps.plannedDistance) * 100;
        
        // Convertir pace a segundos para comparación
        const plannedPaceSeconds = parseInt(ps.plannedPace.split(':')[0]) * 60 + parseInt(ps.plannedPace.split(':')[1]);
        const actualPaceSeconds = parseInt(ct.avgPace.split(':')[0]) * 60 + parseInt(ct.avgPace.split(':')[1]);
        const paceDeviation = ((actualPaceSeconds - plannedPaceSeconds) / plannedPaceSeconds) * 100;

        // Calcular score de cumplimiento
        const complianceScore = Math.max(0, 100 - Math.abs(durationDeviation * 0.3) - Math.abs(distanceDeviation * 0.3) - Math.abs(paceDeviation * 0.4));

        return {
          plannedSession: ps,
          completedTraining: ct,
          complianceScore: Math.round(complianceScore),
          deviations: {
            duration: Math.round(durationDeviation),
            distance: Math.round(distanceDeviation),
            pace: Math.round(paceDeviation)
          }
        };
      })
      .filter(Boolean) as Comparison[];
  };

  const comparisons = generateComparisons();

  const handleAssociateTraining = (sessionId: string, trainingId: string) => {
    console.log(`Asociando entrenamiento ${trainingId} con sesión ${sessionId}`);
    // Aquí se actualizaría el estado/backend
  };

  const handleUpdateStatus = (sessionId: string, status: PlannedSession['status']) => {
    console.log(`Actualizando estado de sesión ${sessionId} a ${status}`);
    // Aquí se actualizaría el estado/backend
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'partially_completed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_completed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Cumplido';
      case 'partially_completed': return 'Parcialmente Cumplido';
      case 'not_completed': return 'Incumplido';
      default: return 'Pendiente';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeviationText = (deviation: number, metric: string) => {
    const sign = deviation > 0 ? '+' : '';
    return `${sign}${deviation}%`;
  };

  const pendingTrainings = completedTrainings.filter(ct => ct.status === 'pending_association');
  const pendingSessions = plannedSessions.filter(ps => ps.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Asociación de Entrenamientos</h2>
          <p className="text-muted-foreground">
            Gestiona la asociación entre entrenamientos planificados y realizados
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="comparisons">
            <TrendingUp className="w-4 h-4 mr-2" />
            Comparaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Entrenamientos sin asociar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Entrenamientos Sin Asociar
              </CardTitle>
              <CardDescription>
                Entrenamientos subidos por atletas que necesitan ser asociados con sesiones planificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTrainings.length > 0 ? (
                <div className="space-y-3">
                  {pendingTrainings.map((training) => (
                    <div key={training.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{training.name}</h4>
                          <Badge variant="outline">{training.athlete}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(training.date), 'PPP', { locale: es })} • 
                          {training.distance}km • {training.duration}min • {training.avgPace}/km
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select onValueChange={(sessionId) => handleAssociateTraining(sessionId, training.id)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Asociar con sesión..." />
                          </SelectTrigger>
                          <SelectContent>
                            {plannedSessions
                              .filter(ps => ps.athlete === training.athlete && !ps.associatedTrainingId)
                              .map(ps => (
                                <SelectItem key={ps.id} value={ps.id}>
                                  {ps.name} - {format(new Date(ps.date), 'dd/MM/yyyy')}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay entrenamientos pendientes de asociación
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sesiones sin completar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sesiones Pendientes
              </CardTitle>
              <CardDescription>
                Sesiones planificadas que aún no han sido completadas por los atletas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSessions.length > 0 ? (
                <div className="space-y-3">
                  {pendingSessions.map((session) => (
                    <div key={session.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{session.name}</h4>
                          <Badge variant="outline">{session.athlete}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.date), 'PPP', { locale: es })} • 
                          {session.plannedDistance}km • {session.plannedDuration}min • {session.plannedPace}/km
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select onValueChange={(status) => handleUpdateStatus(session.id, status as any)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Actualizar estado..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_completed">Marcar como No Cumplido</SelectItem>
                            <SelectItem value="partially_completed">Parcialmente Cumplido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay sesiones pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-4">
          {comparisons.map((comparison) => (
            <Card key={comparison.plannedSession.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {comparison.plannedSession.name}
                      <Badge variant="outline">{comparison.completedTraining.athlete}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(comparison.plannedSession.date), 'PPP', { locale: es })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(comparison.plannedSession.status)}>
                      {getStatusText(comparison.plannedSession.status)}
                    </Badge>
                    <p className={`text-sm font-semibold mt-1 ${getComplianceColor(comparison.complianceScore)}`}>
                      {comparison.complianceScore}% cumplimiento
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comparación de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Duración</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan: {comparison.plannedSession.plannedDuration}min</span>
                      <span className={comparison.deviations.duration > 10 || comparison.deviations.duration < -10 ? 'text-red-600' : 'text-green-600'}>
                        Real: {comparison.completedTraining.duration}min ({getDeviationText(comparison.deviations.duration, 'duration')})
                      </span>
                    </div>
                    <Progress value={Math.min(100, (comparison.completedTraining.duration / comparison.plannedSession.plannedDuration) * 100)} />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Distancia</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan: {comparison.plannedSession.plannedDistance}km</span>
                      <span className={comparison.deviations.distance > 10 || comparison.deviations.distance < -10 ? 'text-red-600' : 'text-green-600'}>
                        Real: {comparison.completedTraining.distance}km ({getDeviationText(comparison.deviations.distance, 'distance')})
                      </span>
                    </div>
                    <Progress value={Math.min(100, (comparison.completedTraining.distance / comparison.plannedSession.plannedDistance) * 100)} />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Ritmo</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan: {comparison.plannedSession.plannedPace}/km</span>
                      <span className={Math.abs(comparison.deviations.pace) > 10 ? 'text-red-600' : 'text-green-600'}>
                        Real: {comparison.completedTraining.avgPace}/km ({getDeviationText(comparison.deviations.pace, 'pace')})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sensaciones del atleta */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Sensaciones del Atleta</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Esfuerzo</p>
                      <p className="font-semibold">{comparison.completedTraining.sensations.effort}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fatiga</p>
                      <p className="font-semibold">{comparison.completedTraining.sensations.fatigue}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Motivación</p>
                      <p className="font-semibold">{comparison.completedTraining.sensations.motivation}/10</p>
                    </div>
                  </div>
                </div>

                {/* Comentarios del atleta */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Comentarios del Atleta</h4>
                  <p className="text-sm text-muted-foreground">{comparison.completedTraining.comments}</p>
                </div>

                <div className="flex space-x-2">
                  <Select onValueChange={(status) => handleUpdateStatus(comparison.plannedSession.id, status as any)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Cambiar estado..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Marcar como Cumplido</SelectItem>
                      <SelectItem value="partially_completed">Parcialmente Cumplido</SelectItem>
                      <SelectItem value="not_completed">No Cumplido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>


      </Tabs>
    </div>
  );
}