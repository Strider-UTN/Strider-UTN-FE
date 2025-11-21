import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TrainingDetailModal } from './TrainingDetailModal';
import { TrainingUpload } from './TrainingUpload';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Target, 
  Users, 
  Search, 
  Filter,
  Edit,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface TrainingSession {
  id: string;
  name: string;
  type: 'Continuo' | 'Intervalos' | 'Tempo' | 'Fartlek' | 'Recuperación' | 'Cuestas' | 'Series';
  date: string;
  duration: number; // minutes
  distance: number; // km
  intensity: number; // % VO2 Max
  pace: string; // min:seg/km
  location?: string;
  notes?: string;
  assignedAthletes?: string[]; // IDs de atletas asignados (para entrenadores)
  athleteNames?: string[]; // Nombres de atletas asignados (para mostrar)
  status?: 'planned' | 'completed' | 'partial' | 'missed'; // Estado para atletas
  uploadedData?: {
    actualDistance: number;
    actualDuration: number;
    actualPace: string;
    avgHeartRate?: number;
    perceivedExertion: number;
    uploadDate: string;
  };
}

interface TrainingListProps {
  userType: 'athlete' | 'coach';
  refreshTrigger?: number; // Cuando cambia, recarga las sesiones
}

export function TrainingList({ userType, refreshTrigger }: TrainingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [uploadingSession, setUploadingSession] = useState<TrainingSession | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar sesiones del backend para coaches
  useEffect(() => {
    if (userType === 'coach') {
      loadSessions();
    }
    // Para atletas, por ahora mantener datos mock hasta tener endpoint específico
    // TODO: Implementar endpoint para atletas
  }, [userType, refreshTrigger]); // Agregar refreshTrigger como dependencia

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const backendSessions = await trainingSessionService.getAllTrainingSessions();
      // Convertir del formato del backend al formato del frontend
      const convertedSessions = backendSessions.map(convertBackendToFrontend);
      setSessions(convertedSessions);
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
      // En caso de error, usar datos mock como fallback
      setSessions(mockCoachSessions);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para convertir del backend al formato del frontend
  const convertBackendToFrontend = (backendSession: TrainingSessionResponseDto): TrainingSession => {
    // Calcular duración total y distancia total desde los intervalos
    const totalDistance = backendSession.intervals.reduce((sum, interval) => sum + interval.distance, 0) / 1000; // metros a km
    // Calcular duración aproximada (esto es una simplificación, podrías calcular mejor desde intervalos)
    const estimatedDuration = Math.ceil(totalDistance * 5); // Estimación simple

    return {
      id: backendSession.id.toString(),
      name: backendSession.name,
      type: 'Intervalos' as const, // Por defecto, podrías inferir desde intervalos
      date: backendSession.date,
      duration: estimatedDuration,
      distance: totalDistance,
      intensity: 80, // Valor por defecto, podrías calcular desde intervalos
      pace: '4:30', // Valor por defecto, podrías calcular desde intervalos
      notes: backendSession.notes,
      assignedAthletes: backendSession.athletes.map(a => a.athleteId.toString()),
      athleteNames: backendSession.athletes.map(a => a.athleteName)
    };
  };

  // Datos mock para atletas (hasta tener endpoint específico)
  const mockCoachSessions: TrainingSession[] = [
    {
      id: '1',
      name: 'Tempo 8km - Grupo Madrid Centro',
      type: 'Tempo',
      date: '2024-12-05',
      duration: 35,
      distance: 8.0,
      intensity: 85,
      pace: '4:22',
      location: 'Parque del Retiro',
      notes: 'Enfocarse en mantener ritmo constante. Hidratación cada 2km.',
      assignedAthletes: ['1', '2'],
      athleteNames: ['Juan Pérez', 'María García']
    },
    {
      id: '2',
      name: 'Intervalos 5x1000m - Juan Pérez',
      type: 'Intervalos',
      date: '2024-12-07',
      duration: 30,
      distance: 7.0,
      intensity: 95,
      pace: '3:45',
      location: 'Pista Atletismo Vallehermoso',
      notes: 'Recuperación de 3 minutos entre intervalos. Monitorear FC.',
      assignedAthletes: ['1'],
      athleteNames: ['Juan Pérez']
    },
    {
      id: '3',
      name: 'Carrera Larga 15km - Grupo Fondo',
      type: 'Continuo',
      date: '2024-12-09',
      duration: 75,
      distance: 15.0,
      intensity: 70,
      pace: '5:00',
      location: 'Casa de Campo',
      notes: 'Ritmo aeróbico cómodo. Enfocarse en economía de carrera.',
      assignedAthletes: ['1', '3', '4'],
      athleteNames: ['Juan Pérez', 'Carlos Ruiz', 'Laura Fernández']
    }
  ];

  const mockAthleteSessions: TrainingSession[] = [
    {
      id: '1',
      name: 'Tempo 8km',
      type: 'Tempo',
      date: '2024-12-05',
      duration: 35,
      distance: 8.0,
      intensity: 85,
      pace: '4:22',
      location: 'Parque del Retiro',
      notes: 'Enfocarse en mantener ritmo constante. Hidratación cada 2km.',
      status: 'completed',
      uploadedData: {
        actualDistance: 8.2,
        actualDuration: 36,
        actualPace: '4:23',
        avgHeartRate: 165,
        perceivedExertion: 7,
        uploadDate: '2024-12-05T18:30:00'
      }
    },
    {
      id: '2',
      name: 'Intervalos 5x1000m',
      type: 'Intervalos',
      date: '2024-12-07',
      duration: 30,
      distance: 7.0,
      intensity: 95,
      pace: '3:45',
      location: 'Pista Atletismo Vallehermoso',
      notes: 'Recuperación de 3 minutos entre intervalos. Monitorear FC.',
      status: 'planned'
    },
    {
      id: '3',
      name: 'Carrera Larga 15km',
      type: 'Continuo',
      date: '2024-12-09',
      duration: 75,
      distance: 15.0,
      intensity: 70,
      pace: '5:00',
      location: 'Casa de Campo',
      notes: 'Ritmo aeróbico cómodo. Enfocarse en economía de carrera.',
      status: 'partial',
      uploadedData: {
        actualDistance: 12.5,
        actualDuration: 65,
        actualPace: '5:12',
        avgHeartRate: 142,
        perceivedExertion: 8,
        uploadDate: '2024-12-09T19:15:00'
      }
    },
    {
      id: '4',
      name: 'Recuperación 5km',
      type: 'Recuperación',
      date: '2024-12-02',
      duration: 30,
      distance: 5.0,
      intensity: 60,
      pace: '5:30',
      status: 'missed'
    }
  ];

  // Para atletas, usar datos mock hasta tener endpoint
  const displaySessions = userType === 'coach' ? sessions : mockAthleteSessions;

  const filteredSessions = displaySessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (session.athleteNames && session.athleteNames.some(name => 
                           name.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    const matchesType = typeFilter === 'all' || session.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesType && 
           (userType === 'coach' || matchesStatus);
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'missed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'planned': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const handleUploadComplete = (sessionId: string, uploadData: any) => {
    console.log('Training uploaded for session:', sessionId, uploadData);
    setUploadingSession(null);
    // Aquí actualizarías el estado real de la sesión
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            {userType === 'coach' && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Recargar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={userType === 'coach' ? "Buscar por sesión o atleta..." : "Buscar sesiones..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Continuo">Continuo</SelectItem>
                <SelectItem value="Intervalos">Intervalos</SelectItem>
                <SelectItem value="Tempo">Tempo</SelectItem>
                <SelectItem value="Fartlek">Fartlek</SelectItem>
                <SelectItem value="Recuperación">Recuperación</SelectItem>
                <SelectItem value="Cuestas">Cuestas</SelectItem>
                <SelectItem value="Series">Series</SelectItem>
              </SelectContent>
            </Select>

            {userType === 'athlete' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="planned">Planificado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="missed">No realizado</SelectItem>
                </SelectContent>
              </Select>
            )}

            {userType === 'coach' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredSessions.length} sesiones creadas
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de sesiones */}
      <div className="grid gap-4">
        {filteredSessions.map(session => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{session.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(session.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{session.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{session.distance} km</span>
                        </div>
                        {session.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{session.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.type}</Badge>
                      {userType === 'athlete' && session.status && (
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1">
                            {session.status === 'completed' ? 'Completado' :
                             session.status === 'partial' ? 'Parcial' :
                             session.status === 'missed' ? 'No realizado' : 'Planificado'}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Intensidad</p>
                      <p className="font-medium">{session.intensity}% VO₂</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ritmo Objetivo</p>
                      <p className="font-medium">{session.pace}</p>
                    </div>
                    {userType === 'coach' && session.athleteNames && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Atletas Asignados</p>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <p className="font-medium">{session.athleteNames.join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {userType === 'athlete' && session.uploadedData && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Distancia Real</p>
                          <p className="font-medium">{session.uploadedData.actualDistance} km</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ritmo Real</p>
                          <p className="font-medium">{session.uploadedData.actualPace}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {session.notes && (
                    <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                      {session.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(session)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  
                  {userType === 'coach' && (
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}

                  {userType === 'athlete' && session.status === 'planned' && (
                    <Button
                      size="sm"
                      onClick={() => setUploadingSession(session)}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Subir Datos
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {!isLoading && filteredSessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <p>
                {userType === 'coach' 
                  ? 'No has creado ninguna sesión aún' 
                  : 'No tienes sesiones con los filtros aplicados'
                }
              </p>
              {userType === 'coach' && (
                <p className="text-sm mt-2">
                  Usa el botón "Crear Sesión" para planificar entrenamientos para tus atletas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      {selectedSession && (
        <TrainingDetailModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          userType={userType}
        />
      )}

      {uploadingSession && userType === 'athlete' && (
        <TrainingUpload
          isOpen={!!uploadingSession}
          onClose={() => setUploadingSession(null)}
          session={uploadingSession}
          onUploadComplete={(uploadData) => handleUploadComplete(uploadingSession.id, uploadData)}
        />
      )}
    </div>
  );
}