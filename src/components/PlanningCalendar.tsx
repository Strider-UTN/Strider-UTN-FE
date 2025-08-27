import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { CreateTrainingSessionModal } from './CreateTrainingSessionModal';

interface PeriodGroup {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'year' | 'month' | 'week' | 'custom';
  parentId?: string;
  children: PeriodGroup[];
  sessions: TrainingSession[];
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athletes: string[];
  intervals: any[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface MesocycleFilter {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
}

interface PlanningCalendarProps {
  planningId?: string;
  userType?: 'athlete' | 'coach';
  year?: number;
  periodGroups?: PeriodGroup[];
  athletes?: Athlete[];
  mesocycleFilter?: MesocycleFilter;
  onPeriodSelect?: (periodId: string) => void;
  onSessionCreate?: (session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'training': return 'bg-blue-500';
    case 'prep_competition': return 'bg-orange-500';
    case 'main_competition': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'training': return 'Entrenamiento';
    case 'prep_competition': return 'Prep. Competencia';
    case 'main_competition': return 'Competencia';
    default: return 'Otro';
  }
};

export function PlanningCalendar({ 
  planningId, 
  userType = 'coach', 
  year = new Date().getFullYear(), 
  periodGroups = [], 
  athletes = [], 
  mesocycleFilter,
  onPeriodSelect = () => {}, 
  onSessionCreate 
}: PlanningCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'month'>('overview');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);

  // Atletas por defecto con VO2 Max
  const defaultAthletes: Athlete[] = athletes.length > 0 ? athletes : [
    { id: '1', name: 'María González', groupId: '1', groupName: 'Grupo Élite', vo2max: 55 },
    { id: '2', name: 'Carlos Ruiz', groupId: '2', groupName: 'Grupo Juvenil', vo2max: 62 },
    { id: '3', name: 'Ana López', groupId: '1', groupName: 'Grupo Élite', vo2max: 58 },
    { id: '4', name: 'Pedro Martín', groupId: '3', groupName: 'Grupo Principiantes', vo2max: 48 },
    { id: '5', name: 'Sofia Chen', groupId: '2', groupName: 'Grupo Juvenil', vo2max: 60 },
    { id: '6', name: 'Diego Morales', groupId: '1', groupName: 'Grupo Élite', vo2max: 61 },
    { id: '7', name: 'Laura Fernández', groupId: '3', groupName: 'Grupo Principiantes', vo2max: 45 },
    { id: '8', name: 'Roberto Silva', groupId: '2', groupName: 'Grupo Juvenil', vo2max: 59 }
  ];

  // Agregar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (userType === 'coach' && (event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        handleCreateSession(dateString);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userType]);

  useEffect(() => {
    if (trainingSessions.length === 0 && planningId) {
      const exampleSessions: TrainingSession[] = [
        {
          id: '1',
          date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`,
          name: 'Intervalos de Velocidad',
          description: 'Sesión de intervalos para mejorar velocidad aeróbica',
          category: 'training',
          athletes: ['1', '2'],
          intervals: [
            {
              id: 'i1',
              type: 'work',
              paceType: 'vo2max_percentage',
              vo2maxPercentage: 90,
              durationType: 'time',
              duration: 3,
              description: 'Intervalo intenso',
              repetitions: 6
            },
            {
              id: 'i2',
              type: 'rest',
              paceType: 'fixed',
              durationType: 'time',
              duration: 1.5,
              description: 'Recuperación activa',
              repetitions: 5
            }
          ],
          warmup: '15 minutos de trote suave y ejercicios de movilidad',
          cooldown: '10 minutos de trote suave y estiramientos',
          notes: 'Mantener hidratación constante',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-12`,
          name: 'Test de Evaluación 5K',
          description: 'Prueba de tiempo en 5000 metros',
          category: 'prep_competition',
          athletes: ['1'],
          intervals: [
            {
              id: 'i3',
              type: 'work',
              paceType: 'fixed',
              pace: 4.2,
              durationType: 'distance',
              duration: 5,
              description: 'Esfuerzo máximo sostenido'
            }
          ],
          warmup: '20 minutos de calentamiento progresivo',
          cooldown: '15 minutos de vuelta a la calma',
          notes: 'Registrar tiempo y frecuencia cardíaca',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-18`,
          name: 'Entrenamiento de Fondo',
          description: 'Carrera continua para desarrollar resistencia aeróbica',
          category: 'training',
          athletes: ['1', '2', '3'],
          intervals: [
            {
              id: 'i4',
              type: 'work',
              paceType: 'vo2max_percentage',
              vo2maxPercentage: 70,
              durationType: 'time',
              duration: 45,
              description: 'Ritmo aeróbico cómodo'
            }
          ],
          warmup: '10 minutos de activación',
          cooldown: '10 minutos de relajación',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTrainingSessions(exampleSessions);
    }
  }, [planningId, year, trainingSessions.length]);

  // Obtener sesiones existentes para una fecha específica
  const getSessionsForDate = (date: string): TrainingSession[] => {
    return trainingSessions.filter(session => session.date === date);
  };

  const handleCreateSession = (date: string) => {
    console.log('🚀 Abriendo modal para crear sesión en fecha:', date);
    setSelectedDate(date);
    setIsSessionModalOpen(true);
    
    // Mensaje de confirmación visual
    if (viewMode === 'month') {
      toast.success(`Creando sesión para ${new Date(date).toLocaleDateString('es-ES')}`, {
        duration: 2000
      });
    }
  };

  const handleSessionSubmit = (sessionData: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('📝 Datos de sesión recibidos:', sessionData);
    
    const newSession: TrainingSession = {
      ...sessionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTrainingSessions(prev => [...prev, newSession]);
    setIsSessionModalOpen(false);
    
    // Mostrar mensaje de éxito con detalles
    toast.success(`Sesión "${sessionData.name}" creada exitosamente`, {
      description: `${sessionData.intervals.length} intervalos • ${sessionData.athletes.length} atletas asignados`,
      duration: 4000
    });
    
    if (onSessionCreate) {
      onSessionCreate(sessionData);
    }
  };

  const handleCloseModal = () => {
    console.log('❌ Cerrando modal de creación de sesión');
    setIsSessionModalOpen(false);
    setSelectedDate('');
  };

  const yearGroup = periodGroups.find(group => group.type === 'year');
  const months = yearGroup ? yearGroup.children : [];

  // Si no tenemos periodGroups, crear meses por defecto para el año actual
  const defaultMonths = months.length === 0 ? monthNames.map((name, index) => ({
    id: `month-${index}`,
    name,
    startDate: `${year}-${String(index + 1).padStart(2, '0')}-01`,
    endDate: `${year}-${String(index + 1).padStart(2, '0')}-${new Date(year, index + 1, 0).getDate()}`,
    type: 'month' as const,
    parentId: 'year-1',
    children: [],
    sessions: []
  })) : months;

  const handleMonthClick = (monthIndex: number) => {
    console.log('📅 Seleccionando mes:', monthIndex);
    setSelectedMonth(monthIndex);
    setViewMode('month');
    const monthPeriod = defaultMonths.find(m => new Date(m.startDate).getMonth() === monthIndex);
    if (monthPeriod) {
      onPeriodSelect(monthPeriod.id);
    }
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedMonth(null);
    onPeriodSelect('all');
  };

  if (viewMode === 'month' && selectedMonth !== null) {
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, selectedMonth, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lunes = 0

    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayString = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = getSessionsForDate(dayString);
      days.push({ day, sessions: daySessions, date: dayString });
    }

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleBackToOverview}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h3 className="text-xl font-semibold text-primary">
              {monthNames[selectedMonth]} {year}
            </h3>
          </div>
          
          <Button 
            onClick={() => {
              const today = new Date();
              const currentMonth = selectedMonth;
              const dateForSession = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              console.log('🎯 Botón "Agregar Sesión" clickeado. Fecha:', dateForSession);
              handleCreateSession(dateForSession);
            }}
            className="bg-accent hover:bg-accent/90 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            disabled={userType === 'athlete'}
            title={userType === 'athlete' ? 'Solo los entrenadores pueden crear sesiones' : 'Crear nueva sesión de entrenamiento (Ctrl+N)'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Sesión
          </Button>
        </div>

        {/* Calendario mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Vista Mensual
            </CardTitle>
            <CardDescription>
              {defaultAthletes.length} atletas • {trainingSessions.filter(s => s.date.startsWith(`${year}-${String(selectedMonth + 1).padStart(2, '0')}`)).length} sesiones programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Encabezados de días */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((dayData, index) => (
                <div 
                  key={index} 
                  className={`min-h-32 p-2 border rounded-lg transition-all duration-200 ${
                    dayData && userType === 'coach' 
                      ? 'bg-background hover:bg-accent/5 hover:border-accent/30 cursor-pointer hover:shadow-sm' 
                      : dayData 
                        ? 'bg-background cursor-default'
                        : 'bg-muted/20'
                  }`}
                  onClick={() => {
                    if (dayData && userType === 'coach') {
                      console.log('🖱️ Click en día del calendario:', dayData.date);
                      handleCreateSession(dayData.date);
                    }
                  }}
                  title={dayData && userType === 'coach' ? `Hacer clic para agregar sesión el ${dayData.date}` : undefined}
                >
                  {dayData && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-primary">{dayData.day}</div>
                        {dayData.sessions.length === 0 && userType === 'coach' && (
                          <Plus className="w-4 h-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayData.sessions.slice(0, 3).map(session => (
                          <div
                            key={session.id}
                            className="text-xs p-2 rounded-md flex items-center space-x-2"
                            style={{ backgroundColor: `${getCategoryColor(session.category)}20` }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div 
                              className={`w-2 h-2 rounded-full ${getCategoryColor(session.category)}`}
                            />
                            <span className="truncate flex-1 font-medium">
                              {session.name}
                            </span>
                          </div>
                        ))}
                        {dayData.sessions.length > 3 && (
                          <div className="text-xs text-muted-foreground font-medium">
                            +{dayData.sessions.length - 3} más
                          </div>
                        )}
                        {dayData.sessions.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {dayData.sessions.reduce((total, session) => total + session.athletes.length, 0)} atletas
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leyenda de categorías de sesión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorías de Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { category: 'training', name: 'Entrenamiento' },
                { category: 'prep_competition', name: 'Competencia Preparatoria' },
                { category: 'main_competition', name: 'Competencia Principal' }
              ].map(({ category, name }) => (
                <div key={category} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getCategoryColor(category)}`} />
                  <span className="font-medium">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal para crear sesiones */}
        <CreateTrainingSessionModal
          isOpen={isSessionModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSessionSubmit}
          athletes={defaultAthletes}
          selectedDate={selectedDate}
          existingSessions={getSessionsForDate(selectedDate)}
          userType={userType}
        />
      </div>
    );
  }

  // Vista general del año
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary">
          {mesocycleFilter ? `${mesocycleFilter.name} - ${year}` : `Vista General - ${year}`}
        </h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              const today = new Date();
              const dateForSession = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              console.log('🎯 Botón "Crear Sesión" de vista general clickeado. Fecha:', dateForSession);
              handleCreateSession(dateForSession);
            }}
            className="bg-accent hover:bg-accent/90 transition-all duration-200 hover:scale-105"
            disabled={userType === 'athlete'}
            title={userType === 'athlete' ? 'Solo los entrenadores pueden crear sesiones' : 'Crear sesión de entrenamiento'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Sesión
          </Button>
        </div>
      </div>

      {/* Grid de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {monthNames.map((monthName, index) => {
          const monthPeriod = defaultMonths.find(m => new Date(m.startDate).getMonth() === index);
          
          // Si hay filtro de mesociclo, verificar si el mes está dentro del rango
          let isActive = monthPeriod !== undefined;
          let isInMesocycleRange = true;
          
          if (mesocycleFilter) {
            // Calcular fecha aproximada de semanas del mesociclo
            const startWeekDate = new Date(year, 0, 1 + (mesocycleFilter.startWeek - 1) * 7);
            const endWeekDate = new Date(year, 0, 1 + mesocycleFilter.endWeek * 7);
            const monthStart = new Date(year, index, 1);
            const monthEnd = new Date(year, index + 1, 0);
            
            // Verificar si el mes se solapa con el rango del mesociclo
            isInMesocycleRange = monthStart <= endWeekDate && monthEnd >= startWeekDate;
            isActive = isActive && isInMesocycleRange;
          }
          
          const monthSessions = trainingSessions.filter(s => s.date.startsWith(`${year}-${String(index + 1).padStart(2, '0')}`));
          
          return (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isActive ? 'border-primary/20' : 'opacity-60'
              }`}
              onClick={() => isActive && handleMonthClick(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-primary">{monthName}</CardTitle>
                  {isActive && (
                    <Badge variant="outline" className="text-xs">
                      {monthSessions.length} sesiones
                    </Badge>
                  )}
                </div>
                {monthPeriod && (
                  <CardDescription>
                    {new Date(monthPeriod.startDate).toLocaleDateString('es-ES', { day: '2-digit' })} - {' '}
                    {new Date(monthPeriod.endDate).toLocaleDateString('es-ES', { day: '2-digit' })}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                {!isActive ? (
                  <p className="text-sm text-muted-foreground">
                    {mesocycleFilter && !isInMesocycleRange 
                      ? 'Mes fuera del rango del mesociclo' 
                      : 'Mes no incluido en la planificación'
                    }
                  </p>
                ) : (
                  <div className="space-y-3">
                    {monthSessions.length > 0 ? (
                      <>
                        {/* Distribución por categoría */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Distribución de sesiones:</p>
                          <div className="space-y-1">
                            {['training', 'prep_competition', 'main_competition'].map(category => {
                              const count = monthSessions.filter(s => s.category === category).length;
                              if (count === 0) return null;
                              
                              return (
                                <div key={category} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`} />
                                    <span>{getCategoryName(category)}</span>
                                  </div>
                                  <span className="font-medium">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay sesiones programadas
                      </p>
                    )}

                    {/* Botón de edición */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMonthClick(index);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {mesocycleFilter ? `Resumen del ${mesocycleFilter.name}` : 'Resumen de Atletas'}
          </CardTitle>
          {mesocycleFilter && (
            <CardDescription>
              Semanas {mesocycleFilter.startWeek} - {mesocycleFilter.endWeek} del año {year}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total atletas:</span>
              <div className="font-medium text-primary">{defaultAthletes.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Grupos activos:</span>
              <div className="font-medium text-primary">
                {new Set(defaultAthletes.map(a => a.groupId)).size}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">
                {mesocycleFilter ? 'Sesiones del mesociclo:' : 'Sesiones totales:'}
              </span>
              <div className="font-medium text-primary">{trainingSessions.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal para crear sesiones - también disponible en vista general */}
      <CreateTrainingSessionModal
        isOpen={isSessionModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSessionSubmit}
        athletes={defaultAthletes}
        selectedDate={selectedDate}
        existingSessions={getSessionsForDate(selectedDate)}
        userType={userType}
      />
    </div>
  );
}