import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Clock, ChevronRight, ChevronLeft, ChevronDown, MapPin, Timer, CheckCircle, Target, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

// Interfaces para las sesiones
interface TrainingSession {
  id: string;
  microcycleId: string;
  date: string;
  time: string;
  name: string;
  type: 'training' | 'prep_competition' | 'main_competition' | 'recovery';
  duration: number; // minutos
  intensity: 'low' | 'medium' | 'high' | 'recovery';
  location: string;
  status: 'pending' | 'completed' | 'missed';
  coach: string;
  description: string;
  intervals?: {
    work: string;
    rest: string;
    repetitions: number;
  }[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
  objectives?: string[];
  equipment?: string[];
  targetZones?: {
    heartRate?: string;
    pace?: string;
    effort?: string;
  };
}

export function AthleteCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0, 1)); // Enero 2025
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set(['session1', 'session4']));

  // Datos mock de sesiones - en producción vendrían de la API
  const mockSessions: TrainingSession[] = [
    {
      id: 'session1',
      microcycleId: 'micro1',
      date: '2025-01-02',
      time: '07:00',
      name: 'Carrera Continua Base',
      type: 'training',
      duration: 45,
      intensity: 'low',
      location: 'Parque Central',
      status: 'completed',
      coach: 'María González',
      description: 'Carrera continua a ritmo aeróbico para establecer base cardiovascular',
      warmup: '10 min trote suave + movilidad articular',
      cooldown: '10 min caminata + estiramientos',
      objectives: [
        'Establecer ritmo aeróbico base',
        'Adaptación cardiovascular gradual',
        'Técnica de carrera relajada'
      ],
      equipment: ['Zapatillas running', 'Hidratación'],
      targetZones: {
        heartRate: '130-145 bpm',
        pace: '5:30-6:00 min/km',
        effort: '5-6/10'
      }
    },
    {
      id: 'session2',
      microcycleId: 'micro1',
      date: '2025-01-03',
      time: '18:30',
      name: 'Técnica + Fuerza',
      type: 'training',
      duration: 60,
      intensity: 'low',
      location: 'Gimnasio Municipal',
      status: 'pending',
      coach: 'María González',
      description: 'Trabajo técnico de carrera y fortalecimiento general',
      warmup: '15 min calentamiento dinámico',
      cooldown: '15 min estiramientos específicos',
      objectives: [
        'Mejorar técnica de carrera',
        'Fortalecimiento core y tren inferior',
        'Prevención de lesiones'
      ],
      equipment: ['Conos', 'Bandas elásticas', 'Colchonetas'],
      targetZones: {
        heartRate: '120-140 bpm',
        pace: 'Variable según ejercicio',
        effort: '4-5/10'
      }
    },
    {
      id: 'session3',
      microcycleId: 'micro1',
      date: '2025-01-04',
      time: '07:00',
      name: 'Carrera Larga Suave',
      type: 'training',
      duration: 70,
      intensity: 'medium',
      location: 'Ruta Costera',
      status: 'pending',
      coach: 'María González',
      description: 'Primera carrera larga de la temporada, énfasis en resistencia aeróbica',
      warmup: '10 min trote muy suave',
      cooldown: '10 min caminata + hidratación',
      notes: 'Mantener ritmo conversacional durante toda la carrera',
      objectives: [
        'Desarrollar resistencia aeróbica',
        'Adaptación a volumen sostenido',
        'Economía de carrera'
      ],
      equipment: ['Zapatillas trail', 'Hidratación', 'Gels energéticos'],
      targetZones: {
        heartRate: '140-155 bpm',
        pace: '5:15-5:45 min/km',
        effort: '6-7/10'
      }
    },
    {
      id: 'session4',
      microcycleId: 'micro1',
      date: '2025-01-06',
      time: '17:00',
      name: 'Recuperación Activa',
      type: 'recovery',
      duration: 30,
      intensity: 'recovery',
      location: 'Parque Central',
      status: 'completed',
      coach: 'María González',
      description: 'Carrera suave de recuperación activa',
      warmup: '5 min caminata dinámica',
      cooldown: '15 min estiramientos profundos',
      objectives: [
        'Recuperación muscular activa',
        'Mantener movilidad',
        'Relajación mental'
      ],
      equipment: ['Zapatillas suaves'],
      targetZones: {
        heartRate: '110-130 bpm',
        pace: '6:30-7:00 min/km',
        effort: '3-4/10'
      }
    },
    {
      id: 'session5',
      microcycleId: 'micro2',
      date: '2025-01-09',
      time: '07:00',
      name: 'Fartlek Suave',
      type: 'training',
      duration: 50,
      intensity: 'medium',
      location: 'Parque del Este',
      status: 'pending',
      coach: 'María González',
      description: 'Trabajo de velocidad variable para desarrollo aeróbico',
      intervals: [
        { work: '5 min ritmo base', rest: '2 min suave', repetitions: 6 }
      ],
      warmup: '15 min calentamiento progresivo',
      cooldown: '10 min trote suave',
      objectives: [
        'Adaptación a cambios de ritmo',
        'Desarrollo aeróbico con estímulos variados',
        'Economía de carrera'
      ],
      equipment: ['Zapatillas running', 'Reloj GPS'],
      targetZones: {
        heartRate: 'Base: 140-150 / Rápido: 160-170 bpm',
        pace: 'Base: 5:30 / Rápido: 4:50 min/km',
        effort: '6-8/10'
      }
    },
    {
      id: 'session6',
      microcycleId: 'micro5',
      date: '2025-01-30',
      time: '07:00',
      name: 'Intervalos 1000m',
      type: 'training',
      duration: 55,
      intensity: 'high',
      location: 'Pista de Atletismo',
      status: 'pending',
      coach: 'María González',
      description: 'Trabajo de velocidad aeróbica en pista',
      intervals: [
        { work: '1000m', rest: '400m trote', repetitions: 5 }
      ],
      warmup: '20 min calentamiento + drills',
      cooldown: '15 min enfriamiento',
      objectives: [
        'Desarrollo de velocidad aeróbica',
        'Adaptación al trabajo de intervalos',
        'Economía de carrera a ritmo objetivo'
      ],
      equipment: ['Zapatillas pista', 'Cronómetro'],
      targetZones: {
        heartRate: '170-180 bpm',
        pace: '4:20-4:30 min/km',
        effort: '8-9/10'
      }
    }
  ];

  // Funciones para el calendario
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getSessionsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mockSessions.filter(session => session.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'recovery': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prep_competition': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'main_competition': return 'bg-red-100 text-red-800 border-red-200';
      case 'recovery': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return 'Entrenamiento';
      case 'prep_competition': return 'Competencia Prep.';
      case 'main_competition': return 'Competencia Principal';
      case 'recovery': return 'Recuperación';
      default: return 'Sesión';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleSessionDetail = (session: TrainingSession) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
  };

  const handleToggleCompleted = (sessionId: string) => {
    if (completedSessions.has(sessionId)) {
      setCompletedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      toast.info('Sesión desmarcada como completada');
    } else {
      setCompletedSessions(prev => new Set([...prev, sessionId]));
      toast.success('Sesión marcada como completada', {
        description: 'Recuerda: para registrar tu rendimiento, ve a "Subir Entrenamientos"'
      });
    }
    setIsSessionDetailOpen(false);
  };

  // Estadísticas rápidas
  const totalSessions = mockSessions.length;
  const completedCount = mockSessions.filter(s => completedSessions.has(s.id)).length;
  const pendingCount = totalSessions - completedCount;
  const thisMonthSessions = mockSessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate.getMonth() === currentMonth.getMonth() && 
           sessionDate.getFullYear() === currentMonth.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Calendario de Entrenamientos</h1>
        <p className="text-muted-foreground mt-1">
          Vista completa de todas tus sesiones programadas
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalSessions}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Sesiones</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Completadas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{thisMonthSessions}</div>
              <div className="text-sm text-muted-foreground mt-1">Este Mes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendario Mensual</CardTitle>
              <CardDescription>
                Todas tus sesiones organizadas por fecha
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="px-4 py-2 text-sm font-medium">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={currentMonth}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentMonth(date);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Encabezados de días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => {
              const sessions = getSessionsForDay(date);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                  } ${isToday ? 'ring-2 ring-primary/50' : ''}`}
                >
                  <div className={`text-sm mb-2 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  } ${isToday ? 'font-semibold text-primary' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {sessions.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: getIntensityColor(session.intensity) + '20' }}
                        onClick={() => handleSessionDetail(session)}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <div className={`w-2 h-2 rounded-full ${getIntensityColor(session.intensity)}`}></div>
                          <span className="font-medium truncate">{session.time}</span>
                          {completedSessions.has(session.id) && (
                            <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
                          )}
                        </div>
                        <div className="truncate text-muted-foreground">
                          {session.name}
                        </div>
                      </div>
                    ))}
                    {sessions.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{sessions.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda de intensidades */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Recuperación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Baja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Alta</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalle de Sesión */}
      {selectedSession && (
        <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getIntensityColor(selectedSession.intensity)}`}></div>
                {selectedSession.name}
              </DialogTitle>
              <DialogDescription>
                {formatSessionDate(selectedSession.date)} • {selectedSession.time} • {selectedSession.location}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Duración</h4>
                  <p className="text-sm text-muted-foreground">{formatTime(selectedSession.duration)}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Intensidad</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedSession.intensity === 'low' ? 'Baja' :
                     selectedSession.intensity === 'medium' ? 'Media' :
                     selectedSession.intensity === 'high' ? 'Alta' : 'Recuperación'}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
              </div>

              {/* Calentamiento */}
              {selectedSession.warmup && (
                <div>
                  <h4 className="font-medium mb-2">Calentamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.warmup}</p>
                </div>
              )}

              {/* Intervalos */}
              {selectedSession.intervals && selectedSession.intervals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Intervalos</h4>
                  <div className="space-y-2">
                    {selectedSession.intervals.map((interval, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{interval.repetitions}x</span> {interval.work}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Descanso: {interval.rest}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enfriamiento */}
              {selectedSession.cooldown && (
                <div>
                  <h4 className="font-medium mb-2">Enfriamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.cooldown}</p>
                </div>
              )}

              {/* Objetivos */}
              {selectedSession.objectives && selectedSession.objectives.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Objetivos</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedSession.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Zonas objetivo */}
              {selectedSession.targetZones && (
                <div>
                  <h4 className="font-medium mb-2">Zonas Objetivo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedSession.targetZones.heartRate && (
                      <div>
                        <span className="text-sm font-medium">Frecuencia Cardíaca:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.heartRate}</p>
                      </div>
                    )}
                    {selectedSession.targetZones.pace && (
                      <div>
                        <span className="text-sm font-medium">Ritmo:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.pace}</p>
                      </div>
                    )}
                    {selectedSession.targetZones.effort && (
                      <div>
                        <span className="text-sm font-medium">Esfuerzo:</span>
                        <p className="text-sm text-muted-foreground">{selectedSession.targetZones.effort}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Equipamiento */}
              {selectedSession.equipment && selectedSession.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Equipamiento Necesario</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.equipment.map((item, index) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedSession.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notas Adicionales</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-4">
              {selectedSession.status === 'pending' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>Nota importante:</strong> Marcar una sesión como completada registrará que la realizaste, pero{' '}
                    <strong>no subirá datos de rendimiento</strong>. Para registrar métricas y rendimiento, ve a{' '}
                    <strong>"Subir Entrenamientos"</strong> y asocia la sesión al momento de subir los datos.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSessionDetailOpen(false)}>
                  Cerrar
                </Button>
                {selectedSession.status === 'pending' && (
                  <Button onClick={() => handleToggleCompleted(selectedSession.id)}>
                    {completedSessions.has(selectedSession.id) ? 'Desmarcar Completa' : 'Marcar Completa'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
