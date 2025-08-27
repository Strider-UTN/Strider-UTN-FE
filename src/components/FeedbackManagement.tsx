import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CoachRetroalimentacionSystem } from './CoachFeedbackSystem';
import { SessionRetroalimentacionModal } from './SessionFeedbackModal';
import { SessionComparisonView } from './SessionComparisonView';
import { 
  Calendar as CalendarIcon, 
  MessageSquare, 
  BarChart3, 
  Users, 
  TrendingUp,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMacrocycle, setSelectedMacrocycle] = useState('2024');
  const [selectedAthlete, setSelectedAthlete] = useState('1');
  const [selectedSede, setSelectedSede] = useState('all');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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

  const formatWeekDates = (weekNumber: number) => {
    const startDate = new Date(2024, 0, 1); // 1 enero 2024
    const weekStart = new Date(startDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    };
  };

  const weekDates = formatWeekDates(selectedWeek);

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

  const handleOpenSessionFeedback = (sessionPlan: SessionPlan, sessionActual?: SessionActual) => {
    const athlete = mockAthleteData.find(a => 
      a.sessions.some(s => s.plan.id === sessionPlan.id)
    );
    
    if (athlete) {
      setFeedbackSession({
        plan: sessionPlan,
        actual: sessionActual,
        athleteName: athlete.athleteName,
        existingFeedback: undefined // Se podría cargar feedback existente aquí
      });
    }
  };

  const handleSaveSessionFeedback = (feedback: any) => {
    // Aquí implementarías la lógica para guardar el feedback específico de sesión
    console.log('Saving session feedback:', feedback);
    // Actualizar el estado local o hacer llamada a API
    setFeedbackSession(null);
  };

  // Efecto para resetear el atleta seleccionado cuando cambia la sede
  useEffect(() => {
    if (selectedSede !== 'all') {
      const athletesInSede = mockAthleteData.filter(a => a.sede === selectedSede);
      if (athletesInSede.length > 0 && !athletesInSede.find(a => a.athleteId === selectedAthlete)) {
        setSelectedAthlete(athletesInSede[0].athleteId);
      }
    }
  }, [selectedSede, selectedAthlete]);

  // Filtrar atletas por sede
  const filteredAthleteData = mockAthleteData.filter(athlete => 
    selectedSede === 'all' || athlete.sede === selectedSede
  );

  // Convertir datos mock al formato esperado por CoachFeedbackSystem
  const selectedAthleteData = filteredAthleteData.find(a => a.athleteId === selectedAthlete);
  
  const microcycleData = selectedAthleteData ? {
    id: `microcycle-${selectedWeek}`,
    weekNumber: selectedWeek,
    startDate: weekDates.start,
    endDate: weekDates.end,
    focus: 'Desarrollo Aeróbico',
    intensity: 'media' as const,
    volume: selectedAthleteData.weeklyStats.plannedVolume,
    sessions: selectedAthleteData.sessions.map(session => ({
      plan: {
        ...session.plan,
        plannedIntensity: session.plan.plannedIntensity / 10 // Convertir de 0-100 a 0-10
      },
      actual: session.actual ? {
        ...session.actual,
        notes: session.actual.comments, // Mapear comments a notes para compatibilidad
        completedAt: session.actual.completed ? new Date().toISOString() : ''
      } : null,
      coachFeedback: undefined // Se podría cargar feedback existente aquí
    }))
  } : null;

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Retroalimentación de Entrenamientos</h1>
          <p className="text-muted-foreground">
            Análisis comparativo entre entrenamientos planificados y realizados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Controles de navegación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                  {Array.from(new Set(mockAthleteData.map(a => a.sede))).map((sede) => (
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
                  {filteredAthleteData.map((athlete) => (
                    <SelectItem key={athlete.athleteId} value={athlete.athleteId}>
                      {athlete.athleteName} • {athlete.sede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Microciclo</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  disabled={selectedWeek <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Select 
                  value={selectedWeek.toString()} 
                  onValueChange={(value) => setSelectedWeek(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Semana {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  disabled={selectedWeek >= 52}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha específica</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date || new Date());
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button className="h-10">
              <BarChart3 className="w-4 h-4 mr-2" />
              Actualizar Vista
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal de retroalimentación */}
      {selectedAthleteData && microcycleData ? (
        <div className="space-y-6">
          {/* Botón de acceso rápido a feedback de sesión */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Retroalimentación Detallada</h2>
              <p className="text-muted-foreground">
                Proporciona retroalimentación específica por sesión y evalúa el microciclo completo
              </p>
            </div>
            <Button
              onClick={() => {
                // Abrir modal para la última sesión completada
                const lastCompletedSession = selectedAthleteData.sessions.find(s => s.actual?.completed);
                if (lastCompletedSession) {
                  handleOpenSessionFeedback(lastCompletedSession.plan, lastCompletedSession.actual);
                } else {
                  console.error('No hay sesiones completadas para dar retroalimentación rápida');
                }
              }}
              className="bg-accent hover:bg-accent/90"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Retroalimentación Rápida de Sesión
            </Button>
          </div>

          <CoachRetroalimentacionSystem
            athlete={{
              id: selectedAthleteData.athleteId,
              name: selectedAthleteData.athleteName,
              vo2max: 65, // Mock value
              sede: selectedAthleteData.sede
            }}
            microcycle={microcycleData}
            onSaveFeedback={handleSaveFeedback}
            onOpenSessionFeedback={handleOpenSessionFeedback}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground">
              No se encontraron datos para el atleta y semana seleccionados.
            </p>
          </CardContent>
        </Card>
      )}

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