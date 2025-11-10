import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CoachRetroalimentacionSystem } from './CoachFeedbackSystem';
import { SessionRetroalimentacionModal } from './SessionFeedbackModal';
import { SessionComparisonView } from './SessionComparisonView';
import { 
  MessageSquare, 
  Users, 
  Filter,
  Eye,
  Edit3
} from 'lucide-react';

// Tipos de datos mock
interface SessionPlan {
  id: string;
  name: string;
  date: string;
  type: 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series';
  plannedDistance: number;
  plannedDuration: number;
  plannedIntensity: number;
  plannedPace: string;
  intervals: Array<{
    type: 'work' | 'rest';
    distance?: number;
    duration?: number;
    intensity: number;
    description: string;
  }>;
  objectives?: string[];
  notes?: string;
}

interface SessionActual {
  id: string;
  sessionId: string;
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  heartRate?: {
    avg: number;
    max: number;
  };
  perceivedExertion: number;
  weather?: {
    temperature: number;
    condition: string;
  };
  route?: string;
  comments?: string;
  sensations?: string; // Comentarios sobre cómo se sintió durante el entrenamiento
  completed: boolean;
  injuries?: Array<{
    type: 'Molestia' | 'Dolor';
    location: string;
    severity: number;
    description?: string;
  }>;
  intervals?: Array<{
    intervalNumber: number;
    actualDistance?: number;
    actualDuration?: number;
    actualPace: string;
    avgHeartRate?: number;
    maxHeartRate?: number;
    perceivedExertion?: number;
    comments?: string;
  }>;
}

interface AthleteWeekData {
  athleteId: string;
  athleteName: string;
  sede: string;
  sessions: Array<{
    plan: SessionPlan;
    actual?: SessionActual;
  }>;
  weeklyStats: {
    plannedVolume: number;
    actualVolume: number;
    completionRate: number;
    avgIntensityCompliance: number;
    avgPerceivedExertion: number;
    injuryCount: number;
  };
}

export function FeedbackManagement() {
  const [selectedMacrocycle, setSelectedMacrocycle] = useState('2024');
  const [selectedAthlete, setSelectedAthlete] = useState('all');
  const [selectedSede, setSelectedSede] = useState('all');
  const [viewingEvaluation, setViewingEvaluation] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'pending' | 'evaluated'>('pending');
  const [evaluatingAthlete, setEvaluatingAthlete] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{
    plan: SessionPlan;
    actual?: SessionActual;
    athleteName: string;
  } | null>(null);
  const [feedbackSession, setFeedbackSession] = useState<{
    plan: SessionPlan;
    actual?: SessionActual;
    athleteName: string;
    existingFeedback?: any;
  } | null>(null);

  // Datos mock para demostración
  const mockAthleteData: AthleteWeekData[] = [
    {
      athleteId: '1',
      athleteName: 'Juan Pérez',
      sede: 'Sede Madrid Centro',
      sessions: [
        {
          plan: {
            id: 'session-1',
            name: 'Carrera Tempo 8km',
            date: '2024-01-15',
            type: 'Tempo',
            plannedDistance: 8.0,
            plannedDuration: 35,
            plannedIntensity: 85,
            plannedPace: '4:22',
            intervals: [
              {
                type: 'work',
                duration: 25,
                intensity: 85,
                description: 'Ritmo tempo sostenido'
              }
            ],
            objectives: ['Mejorar umbral anaeróbico', 'Mantener ritmo constante'],
            notes: 'Enfocarse en respiración controlada'
          },
          actual: {
            id: 'actual-1',
            sessionId: 'session-1',
            actualDistance: 8.2,
            actualDuration: 36,
            actualPace: '4:23',
            heartRate: {
              avg: 165,
              max: 175
            },
            perceivedExertion: 7,
            weather: {
              temperature: 18,
              condition: 'Nublado'
            },
            route: 'Parque del Retiro - Circuito Principal',
            comments: 'Me sentí muy bien durante toda la sesión. Ritmo controlado.',
            sensations: 'Excelente día de entrenamiento. Las piernas respondían muy bien, respiración controlada durante todo el tempo. Sentí que podría haber mantenido ese ritmo por más tiempo.',
            completed: true,
            injuries: [
              {
                type: 'Molestia',
                location: 'Talón izquierdo',
                severity: 3,
                description: 'Molestia leve al final, probablemente por las zapatillas nuevas'
              }
            ],
            intervals: [
              {
                intervalNumber: 1,
                actualDuration: 25,
                actualPace: '4:20',
                avgHeartRate: 168,
                perceivedExertion: 7
              }
            ]
          }
        },
        {
          plan: {
            id: 'session-2',
            name: 'Intervalos 5x1000m',
            date: '2024-01-17',
            type: 'Intervalos',
            plannedDistance: 7.0,
            plannedDuration: 30,
            plannedIntensity: 95,
            plannedPace: '3:45',
            intervals: [
              {
                type: 'work',
                distance: 1.0,
                intensity: 95,
                description: '1000m a ritmo VO₂ Max'
              },
              {
                type: 'rest',
                duration: 3,
                intensity: 60,
                description: 'Recuperación activa'
              }
            ]
          },
          actual: {
            id: 'actual-2',
            sessionId: 'session-2',
            actualDistance: 6.5,
            actualDuration: 28,
            actualPace: '3:48',
            heartRate: {
              avg: 180,
              max: 190
            },
            perceivedExertion: 9,
            comments: 'Último intervalo muy duro. Tuve que parar 30 segundos en el 4to.',
            sensations: 'Los primeros 3 intervalos se sintieron bien, pero a partir del 4to las piernas empezaron a fallar. Notaba como si no llegara oxígeno suficiente a los músculos.',
            completed: false,
            injuries: [
              {
                type: 'Molestia',
                location: 'Pantorrilla izquierda',
                severity: 2,
                description: 'Molestia leve al final del entrenamiento'
              }
            ]
          }
        }
      ],
      weeklyStats: {
        plannedVolume: 45.0,
        actualVolume: 42.3,
        completionRate: 85,
        avgIntensityCompliance: 88,
        avgPerceivedExertion: 7.2,
        injuryCount: 1
      }
    },
    {
      athleteId: '2',
      athleteName: 'María García',
      sede: 'Sede Madrid Norte',
      sessions: [
        {
          plan: {
            id: 'session-3',
            name: 'Carrera Larga 15km',
            date: '2024-01-16',
            type: 'Continuo',
            plannedDistance: 15.0,
            plannedDuration: 75,
            plannedIntensity: 70,
            plannedPace: '5:00',
            intervals: []
          },
          actual: {
            id: 'actual-3',
            sessionId: 'session-3',
            actualDistance: 15.1,
            actualDuration: 74,
            actualPace: '4:54',
            heartRate: {
              avg: 145,
              max: 155
            },
            perceivedExertion: 6,
            comments: 'Excelente sesión. Me sentí muy cómoda todo el tiempo.',
            sensations: 'Me sentí como flotando durante todo el recorrido. Ritmo muy cómodo, piernas ligeras, y pude mantener una conversación mental fluida. Terminé con ganas de seguir corriendo.',
            completed: true,
            injuries: [] // Ninguna molestia reportada
          }
        }
      ],
      weeklyStats: {
        plannedVolume: 55.0,
        actualVolume: 56.2,
        completionRate: 100,
        avgIntensityCompliance: 95,
        avgPerceivedExertion: 6.8,
        injuryCount: 0
      }
    },
    {
      athleteId: '3',
      athleteName: 'Carlos Ruiz',
      sede: 'Sede Madrid Sur',
      sessions: [
        {
          plan: {
            id: 'session-4',
            name: 'Intervalos 8x400m',
            date: '2024-01-14',
            type: 'Intervalos',
            plannedDistance: 6.0,
            plannedDuration: 25,
            plannedIntensity: 90,
            plannedPace: '3:30',
            intervals: [
              {
                type: 'work',
                distance: 0.4,
                intensity: 90,
                description: '400m a ritmo de 1500m'
              },
              {
                type: 'rest',
                duration: 2,
                intensity: 50,
                description: 'Recuperación caminando'
              }
            ],
            objectives: ['Mejorar velocidad anaeróbica', 'Técnica de carrera'],
            notes: 'Concentrarse en mantener la forma en las últimas repeticiones'
          },
          actual: {
            id: 'actual-4',
            sessionId: 'session-4',
            actualDistance: 5.2,
            actualDuration: 23,
            actualPace: '3:35',
            heartRate: {
              avg: 185,
              max: 195
            },
            perceivedExertion: 8,
            comments: 'Paré en la repetición 6. Me dolía mucho la rodilla derecha.',
            sensations: 'Al principio me sentía bien, con buena potencia en las piernas. Pero después de la 4ta repetición empecé a sentir una molestia en la rodilla que se fue intensificando hasta convertirse en dolor punzante.',
            completed: false,
            injuries: [
              {
                type: 'Dolor',
                location: 'Rodilla derecha',
                severity: 6,
                description: 'Dolor punzante durante los intervalos rápidos'
              }
            ]
          }
        },
        {
          plan: {
            id: 'session-5',
            name: 'Carrera Recuperación 5km',
            date: '2024-01-16',
            type: 'Recuperación',
            plannedDistance: 5.0,
            plannedDuration: 30,
            plannedIntensity: 60,
            plannedPace: '6:00',
            intervals: [],
            notes: 'Muy suave, enfoque en recuperación'
          }
          // No actual - sesión no realizada
        }
      ],
      weeklyStats: {
        plannedVolume: 35.0,
        actualVolume: 18.7,
        completionRate: 50,
        avgIntensityCompliance: 75,
        avgPerceivedExertion: 8.0,
        injuryCount: 1
      }
    }
  ];

  const handleSessionDetail = (sessionPlan: SessionPlan, sessionActual?: SessionActual) => {
    const athlete = mockAthleteData.find(a => 
      a.sessions.some(s => s.plan.id === sessionPlan.id)
    );
    
    if (athlete) {
      setSelectedSession({
        plan: sessionPlan,
        actual: sessionActual,
        athleteName: athlete.athleteName
      });
    }
  };

  const handleViewEvaluation = (athleteId: string) => {
    setViewingEvaluation(athleteId);
  };

  const handleEvaluateAthlete = (athleteId: string, editMode: boolean = false) => {
    setEvaluatingAthlete(athleteId);
    setIsEditMode(editMode);
  };

  // Datos mock para evaluaciones históricas con microciclos completos
  const getHistoricalEvaluationData = (athleteId: string) => {
    const evaluationData = {
      'evaluated-1': {
        athlete: {
          id: 'evaluated-1',
          name: 'María González',
          vo2max: 58,
          sede: 'Club Atletismo Madrid'
        },
        microcycle: {
          id: 'micro-maria-week3',
          weekNumber: 3,
          startDate: '2024-01-15',
          endDate: '2024-01-21',
          focus: 'Resistencia aeróbica',
          intensity: 'media' as const,
          volume: 45,
          microcycleFeedback: {
            overallRating: 'excellent' as const,
            summary: 'Excelente semana de entrenamiento. María mostró gran consistencia en todas las sesiones y mantuvo un alto nivel de intensidad cuando era requerido. Su capacidad de recuperación ha mejorado notablemente.',
            recommendations: 'Continuar con el volumen actual. En la próxima semana podemos introducir intervalos más largos a ritmo umbral.',
            createdAt: '2024-01-22T10:30:00.000Z'
          },
          sessions: [
            {
              plan: {
                id: 'session-maria-1',
                name: 'Resistencia Base',
                date: '2024-01-15',
                type: 'Fondo' as const,
                plannedDistance: 12.0,
                plannedDuration: 65,
                plannedIntensity: 6.5,
                plannedPace: '5:25',
                notes: 'Trote continuo en zona aeróbica'
              },
              actual: {
                id: 'actual-maria-1',
                sessionId: 'session-maria-1',
                actualDistance: 12.2,
                actualDuration: 64,
                actualPace: '5:15',
                perceivedExertion: 6,
                heartRate: { avg: 152, max: 168 },
                sensations: 'Excelente sensación durante todo el entrenamiento',
                notes: 'Me sentí muy bien, las piernas respondieron bien',
                completed: true,
                completedAt: '2024-01-15T08:30:00.000Z',
                injuries: []
              },
              coachFeedback: {
                id: 'feedback-session-maria-1',
                sessionId: 'session-maria-1',
                microcycleId: 'micro-maria-week3',
                rating: 'excellent' as const,
                feedbackText: 'Excelente ejecución. Ritmo perfecto para el objetivo aeróbico.',
                recommendations: 'Mantener esta consistencia',
                createdAt: '2024-01-16T09:00:00.000Z'
              }
            },
            {
              plan: {
                id: 'session-maria-2',
                name: 'Intervalos 4x1000m',
                date: '2024-01-17',
                type: 'Intervalos' as const,
                plannedDistance: 8.0,
                plannedDuration: 45,
                plannedIntensity: 8.5,
                plannedPace: '4:30',
                notes: '4x1000m a ritmo 5K con 2min recuperación'
              },
              actual: {
                id: 'actual-maria-2',
                sessionId: 'session-maria-2',
                actualDistance: 8.1,
                actualDuration: 46,
                actualPace: '4:28',
                perceivedExertion: 8,
                heartRate: { avg: 175, max: 188 },
                sensations: 'Los intervalos fueron exigentes pero los completé todos bien',
                notes: 'Intervalos ejecutados perfectamente, recuperaciones respetadas',
                completed: true,
                completedAt: '2024-01-17T07:30:00.000Z',
                injuries: []
              },
              coachFeedback: {
                id: 'feedback-session-maria-2',
                sessionId: 'session-maria-2',
                microcycleId: 'micro-maria-week3',
                rating: 'excellent' as const,
                feedbackText: 'Intervalos ejecutados con precisión. Ritmos consistentes.',
                recommendations: 'Preparada para intervalos más largos',
                createdAt: '2024-01-18T08:30:00.000Z'
              }
            }
          ]
        }
      }
    };

    return evaluationData[athleteId as keyof typeof evaluationData] || null;
  };

  // Datos mock de atletas pendientes de evaluación
  const mockPendingAthletes = [
    {
      id: '1',
      name: 'Juan Pérez',
      sede: 'Sede Madrid Centro',
      weekNumber: 4,
      startDate: '2024-01-22',
      endDate: '2024-01-28',
      completedSessions: 5,
      totalSessions: 6,
      injuryCount: 1
    },
    {
      id: '2',
      name: 'María García',
      sede: 'Sede Madrid Norte',
      weekNumber: 4,
      startDate: '2024-01-22',
      endDate: '2024-01-28',
      completedSessions: 6,
      totalSessions: 6,
      injuryCount: 0
    },
    {
      id: '3',
      name: 'Carlos Ruiz',
      sede: 'Sede Madrid Sur',
      weekNumber: 4,
      startDate: '2024-01-22',
      endDate: '2024-01-28',
      completedSessions: 3,
      totalSessions: 6,
      injuryCount: 1
    }
  ];

  // Datos mock de atletas evaluados
  const mockEvaluatedAthletes = [
    {
      id: 'evaluated-1',
      name: 'María González',
      lastEvaluation: '2024-01-15',
      overallRating: 'excellent' as const,
      completedSessions: 6,
      totalSessions: 6,
      weekNumber: 3,
      sede: 'Club Atletismo Madrid'
    },
    {
      id: 'evaluated-2', 
      name: 'Carlos Ruiz',
      lastEvaluation: '2024-01-12',
      overallRating: 'good' as const,
      completedSessions: 5,
      totalSessions: 6,
      weekNumber: 2,
      sede: 'Runners Valencia'
    },
    {
      id: 'evaluated-3',
      name: 'Ana Torres',
      lastEvaluation: '2024-01-10',
      overallRating: 'needs_improvement' as const,
      completedSessions: 4,
      totalSessions: 6,
      weekNumber: 2,
      sede: 'Club Atletismo Madrid'
    }
  ];

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    } else if (direction === 'next' && selectedWeek < 52) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const handleSaveFeedback = (feedback: any, type: 'session' | 'microcycle', id: string) => {
    // Aquí implementarías la lógica para guardar el feedback
    console.log('Saving feedback:', { feedback, type, id });
    // toast.success('Feedback guardado exitosamente');
  };

  const handleOpenSessionFeedback = (sessionPlan: any, sessionActual?: any) => {
    console.log('Opening session feedback for:', sessionPlan.id, 'Viewing evaluation:', viewingEvaluation, 'Evaluating athlete:', evaluatingAthlete);
    
    // Si estamos viendo una evaluación histórica, usar esos datos directamente
    if (viewingEvaluation) {
      const evaluationData = getHistoricalEvaluationData(viewingEvaluation);
      if (evaluationData) {
        // Buscar la sesión en los datos de evaluación para obtener el feedback existente
        const sessionWithFeedback = evaluationData.microcycle.sessions.find(
          s => s.plan.id === sessionPlan.id
        );
        
        console.log('Found session with feedback:', sessionWithFeedback);
        
        setFeedbackSession({
          plan: sessionPlan,
          actual: sessionActual,
          athleteName: evaluationData.athlete.name,
          existingFeedback: sessionWithFeedback?.coachFeedback
        });
        return;
      }
    }
    
    // Intentar encontrar el atleta en mockAthleteData
    let athlete = mockAthleteData.find(a => 
      a.sessions.some(s => s.plan.id === sessionPlan.id)
    );
    
    // Si no se encuentra y estamos evaluando un atleta, usar esos datos
    if (!athlete && evaluatingAthlete) {
      const athleteData = mockAthleteData.find(a => a.athleteId === evaluatingAthlete);
      if (athleteData) {
        athlete = athleteData;
      }
    }
    
    if (athlete) {
      setFeedbackSession({
        plan: sessionPlan,
        actual: sessionActual,
        athleteName: athlete.athleteName,
        existingFeedback: undefined // Se podría cargar feedback existente aquí
      });
    } else {
      console.log('No athlete found for session:', sessionPlan.id);
    }
  };

  const handleSaveSessionFeedback = (feedback: any) => {
    // Aquí implementarías la lógica para guardar el feedback específico de sesión
    console.log('Saving session feedback:', feedback);
    // Actualizar el estado local o hacer llamada a API
    setFeedbackSession(null);
  };

  // Filtrar atletas pendientes por sede y atleta
  const filteredPendingAthletes = mockPendingAthletes.filter(athlete => {
    const matchesSede = selectedSede === 'all' || athlete.sede === selectedSede;
    const matchesAthlete = selectedAthlete === 'all' || athlete.id === selectedAthlete;
    return matchesSede && matchesAthlete;
  });

  // Filtrar atletas evaluados por sede y atleta
  const filteredEvaluatedAthletes = mockEvaluatedAthletes.filter(athlete => {
    const matchesSede = selectedSede === 'all' || athlete.sede === selectedSede;
    const matchesAthlete = selectedAthlete === 'all' || athlete.id === selectedAthlete;
    return matchesSede && matchesAthlete;
  });

  // Lista completa de atletas para el selector
  const allAthletes = [...mockPendingAthletes, ...mockEvaluatedAthletes];
  const uniqueAthletes = Array.from(new Map(allAthletes.map(a => [a.id, a])).values());

  // Si estamos evaluando un atleta (pendiente o editando evaluado), mostrar el componente de retroalimentación
  if (evaluatingAthlete) {
    // Primero intentar buscar en atletas pendientes
    let athleteData = mockAthleteData.find(a => a.athleteId === evaluatingAthlete);
    let pendingAthlete = mockPendingAthletes.find(a => a.id === evaluatingAthlete);
    
    // Si no está en pendientes y estamos en modo edición, buscar en evaluados
    let existingEvaluationData = null;
    if (isEditMode && !pendingAthlete) {
      existingEvaluationData = getHistoricalEvaluationData(evaluatingAthlete);
      if (existingEvaluationData) {
        // Usar los datos de la evaluación existente
        athleteData = {
          athleteId: existingEvaluationData.athlete.id,
          athleteName: existingEvaluationData.athlete.name,
          sede: existingEvaluationData.athlete.sede || '',
          sessions: existingEvaluationData.microcycle.sessions.map(s => ({
            plan: s.plan,
            actual: s.actual || undefined
          })),
          weeklyStats: {
            plannedVolume: existingEvaluationData.microcycle.volume,
            actualVolume: existingEvaluationData.microcycle.volume,
            completionRate: 80,
            avgIntensityCompliance: 85,
            avgPerceivedExertion: 7.5,
            injuryCount: 0
          }
        };
        pendingAthlete = {
          id: existingEvaluationData.athlete.id,
          name: existingEvaluationData.athlete.name,
          startDate: existingEvaluationData.microcycle.startDate,
          endDate: existingEvaluationData.microcycle.endDate,
          weekNumber: existingEvaluationData.microcycle.weekNumber,
          completedSessions: 5,
          totalSessions: 6,
          injuryCount: 0,
          sede: existingEvaluationData.athlete.sede || ''
        };
      }
    }
    
    if (athleteData && pendingAthlete) {
      const microcycleData = existingEvaluationData ? existingEvaluationData.microcycle : {
        id: `microcycle-${pendingAthlete.weekNumber}`,
        weekNumber: pendingAthlete.weekNumber,
        startDate: pendingAthlete.startDate,
        endDate: pendingAthlete.endDate,
        focus: 'Desarrollo Aeróbico',
        intensity: 'media' as const,
        volume: athleteData.weeklyStats.plannedVolume,
        sessions: athleteData.sessions.map(session => ({
          plan: {
            ...session.plan,
            plannedIntensity: session.plan.plannedIntensity / 10
          },
          actual: session.actual ? {
            ...session.actual,
            notes: session.actual.comments,
            completedAt: session.actual.completed ? new Date().toISOString() : ''
          } : null,
          coachFeedback: undefined
        }))
      };

      return (
        <>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEvaluatingAthlete(null);
                  setIsEditMode(false);
                }}
                className="flex items-center gap-2"
              >
                ← Volver a Atletas {isEditMode ? 'Evaluados' : 'Pendientes'}
              </Button>
            </div>

            <div className="space-y-2">
              <h1>{isEditMode ? 'Editar Evaluación' : 'Evaluación'} - {athleteData.athleteName}</h1>
              <p className="text-muted-foreground">
                {athleteData.sede} • Semana {pendingAthlete.weekNumber} • 
                {new Date(pendingAthlete.startDate).toLocaleDateString('es-ES')} - 
                {new Date(pendingAthlete.endDate).toLocaleDateString('es-ES')}
              </p>
            </div>

            <CoachRetroalimentacionSystem
              athlete={{
                id: athleteData.athleteId,
                name: athleteData.athleteName,
                vo2max: 65,
                sede: athleteData.sede
              }}
              microcycle={microcycleData}
              onSaveFeedback={handleSaveFeedback}
              onOpenSessionFeedback={handleOpenSessionFeedback}
              isEditMode={isEditMode}
            />
          </div>

          {/* Modal de feedback de sesión */}
          {feedbackSession && (
            <SessionRetroalimentacionModal
              isOpen={!!feedbackSession}
              onClose={() => setFeedbackSession(null)}
              plannedSession={feedbackSession.plan}
              actualSession={feedbackSession.actual}
              existingFeedback={feedbackSession.existingFeedback}
              athleteName={feedbackSession.athleteName}
              onSaveFeedback={handleSaveSessionFeedback}
            />
          )}

          {/* Modal de comparación detallada */}
          {selectedSession && (
            <SessionComparisonView
              isOpen={!!selectedSession}
              onClose={() => setSelectedSession(null)}
              sessionPlan={selectedSession.plan}
              sessionActual={selectedSession.actual}
              athleteName={selectedSession.athleteName}
            />
          )}
        </>
      );
    }
  }

  // Si estamos viendo una evaluación histórica, mostrar el componente de retroalimentación
  if (viewingEvaluation) {
    const evaluationData = getHistoricalEvaluationData(viewingEvaluation);
    
    if (evaluationData) {
      return (
        <>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingEvaluation(null)}
                className="flex items-center gap-2"
              >
                ← Volver a Atletas Evaluados
              </Button>
            </div>

            <div className="space-y-2">
              <h1>Evaluación Histórica - {evaluationData.athlete.name}</h1>
              <p className="text-muted-foreground">
                {evaluationData.athlete.sede} • Semana {evaluationData.microcycle.weekNumber} • 
                {new Date(evaluationData.microcycle.startDate).toLocaleDateString('es-ES')} - 
                {new Date(evaluationData.microcycle.endDate).toLocaleDateString('es-ES')}
              </p>
            </div>

            <CoachRetroalimentacionSystem
              athlete={evaluationData.athlete}
              microcycle={evaluationData.microcycle}
              onSaveFeedback={handleSaveFeedback}
              onOpenSessionFeedback={handleOpenSessionFeedback}
            />
          </div>

          {/* Modal de feedback de sesión */}
          {feedbackSession && (
            <SessionRetroalimentacionModal
              isOpen={!!feedbackSession}
              onClose={() => setFeedbackSession(null)}
              plannedSession={feedbackSession.plan}
              actualSession={feedbackSession.actual}
              existingFeedback={feedbackSession.existingFeedback}
              athleteName={feedbackSession.athleteName}
              onSaveFeedback={handleSaveSessionFeedback}
            />
          )}

          {/* Modal de comparación detallada */}
          {selectedSession && (
            <SessionComparisonView
              isOpen={!!selectedSession}
              onClose={() => setSelectedSession(null)}
              sessionPlan={selectedSession.plan}
              sessionActual={selectedSession.actual}
              athleteName={selectedSession.athleteName}
            />
          )}
        </>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Retroalimentación de Entrenamientos</h1>
        <p className="text-muted-foreground">
          Análisis comparativo entre entrenamientos planificados y realizados
        </p>
      </div>

      {/* Controles de filtrado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Macrociclo</label>
              <Select value={selectedMacrocycle} onValueChange={setSelectedMacrocycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">Macrociclo 2024</SelectItem>
                  <SelectItem value="2023">Macrociclo 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sede</label>
              <Select value={selectedSede} onValueChange={setSelectedSede}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {Array.from(new Set(allAthletes.map(a => a.sede))).map((sede) => (
                    <SelectItem key={sede} value={sede}>
                      {sede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Atleta</label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los atletas</SelectItem>
                  {uniqueAthletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.name} • {athlete.sede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector de vista: Pendientes vs Evaluados */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveView('pending')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                activeView === 'pending'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-6 h-6 ${activeView === 'pending' ? 'text-accent' : 'text-gray-500'}`} />
                  <h3 className={`font-semibold ${activeView === 'pending' ? 'text-accent' : 'text-gray-700'}`}>
                    Atletas Pendientes de Evaluación
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Atletas que requieren retroalimentación y evaluación del microciclo
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Pendientes
                  </Badge>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveView('evaluated')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                activeView === 'evaluated'
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className={`w-6 h-6 ${activeView === 'evaluated' ? 'text-accent' : 'text-gray-500'}`} />
                  <h3 className={`font-semibold ${activeView === 'evaluated' ? 'text-accent' : 'text-gray-700'}`}>
                    Atletas Evaluados
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Atletas con retroalimentación y evaluación completa del microciclo
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completados
                  </Badge>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal de retroalimentación */}
      <div className="space-y-6">
        {/* Vista de Atletas Pendientes */}
        {activeView === 'pending' && (
          <div className="space-y-4">
            {filteredPendingAthletes.length > 0 ? (
              filteredPendingAthletes.map((athlete) => (
                <Card key={athlete.id} className="bg-orange-50/30 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{athlete.name}</h4>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            Pendiente de Evaluación
                          </Badge>
                          {athlete.injuryCount > 0 && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              {athlete.injuryCount} {athlete.injuryCount === 1 ? 'Molestia' : 'Molestias'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Período:</span>
                            <p className="font-medium">
                              Semana {athlete.weekNumber} ({new Date(athlete.startDate).toLocaleDateString('es-ES')} - {new Date(athlete.endDate).toLocaleDateString('es-ES')})
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sesiones completadas:</span>
                            <p className="font-medium">{athlete.completedSessions}/{athlete.totalSessions}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tasa de cumplimiento:</span>
                            <p className="font-medium">{Math.round((athlete.completedSessions / athlete.totalSessions) * 100)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sede:</span>
                            <p className="font-medium">{athlete.sede}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleEvaluateAthlete(athlete.id)}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Evaluar Atleta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No hay atletas pendientes</h3>
                  <p className="text-muted-foreground">
                    No se encontraron atletas pendientes de evaluación con los filtros seleccionados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Vista de Atletas Evaluados */}
        {activeView === 'evaluated' && (
          <div className="space-y-4">
            {filteredEvaluatedAthletes.length > 0 ? (
              filteredEvaluatedAthletes.map((athlete) => (
                <Card key={athlete.id} className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{athlete.name}</h4>
                          <Badge className={`
                            ${athlete.overallRating === 'excellent' ? 'bg-green-100 text-green-800 border-green-300' :
                              athlete.overallRating === 'good' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              athlete.overallRating === 'needs_improvement' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              'bg-red-100 text-red-800 border-red-300'
                            } flex items-center gap-1`}>
                            {athlete.overallRating === 'excellent' ? '⭐ Excelente' :
                             athlete.overallRating === 'good' ? '👍 Bueno' :
                             athlete.overallRating === 'needs_improvement' ? '⚠️ Mejorar' : '❌ Preocupante'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Última evaluación:</span>
                            <p className="font-medium">{new Date(athlete.lastEvaluation).toLocaleDateString('es-ES')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Semana evaluada:</span>
                            <p className="font-medium">Semana {athlete.weekNumber}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sesiones completadas:</span>
                            <p className="font-medium">{athlete.completedSessions}/{athlete.totalSessions}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sede:</span>
                            <p className="font-medium">{athlete.sede}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewEvaluation(athlete.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Evaluación
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No hay atletas evaluados</h3>
                  <p className="text-muted-foreground">
                    No se encontraron atletas evaluados con los filtros seleccionados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal de feedback de sesión */}
      {feedbackSession && (
        <SessionRetroalimentacionModal
          isOpen={!!feedbackSession}
          onClose={() => setFeedbackSession(null)}
          plannedSession={feedbackSession.plan}
          actualSession={feedbackSession.actual}
          existingFeedback={feedbackSession.existingFeedback}
          athleteName={feedbackSession.athleteName}
          onSaveFeedback={handleSaveSessionFeedback}
        />
      )}

      {/* Modal de comparación detallada */}
      {selectedSession && (
        <SessionComparisonView
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          sessionPlan={selectedSession.plan}
          sessionActual={selectedSession.actual}
          athleteName={selectedSession.athleteName}
        />
      )}
    </div>
  );
}