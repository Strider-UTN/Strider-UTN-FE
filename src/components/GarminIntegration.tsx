import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { 
  Watch, 
  Link2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Calendar,
  LogOut,
  Clock,
  Activity,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { GarminService, GarminWorkoutResponseDto, GarminAccountResponseDto } from '../services/garminService';
import { AuthService } from '../services/authService';

export function GarminIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<GarminAccountResponseDto | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [garminUsername, setGarminUsername] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});
  const [importedWorkouts, setImportedWorkouts] = useState<GarminWorkoutResponseDto[]>([]);

  // Initialize loading state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleShowLoginForm = () => {
    setShowLoginForm(true);
    setFormErrors({});
  };

  const handleCancelLogin = () => {
    setShowLoginForm(false);
    setGarminUsername('');
    setGarminPassword('');
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: { username?: string; password?: string } = {};
    
    if (!garminUsername.trim()) {
      errors.username = 'El email o usuario es requerido';
    }
    
    if (!garminPassword) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsConnecting(true);
    
    try {
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        toast.error('No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.');
        return;
      }
      const account = await GarminService.connectAccount(userId.toString(), {
        garminUsername,
        garminPassword
      });
      
      setIsConnected(true);
      setConnectedAccount(account);
      // Last login date is returned from connectAccount
      if (account.connectedSince) {
        setLastSyncDate(new Date(account.connectedSince));
      }
      setShowLoginForm(false);
      setGarminUsername('');
      setGarminPassword('');
    } catch (error) {
      // Error is already handled by the service
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('¿Estás seguro de que deseas desconectar tu cuenta de Garmin? Las sesiones ya importadas se mantendrán.')) {
      setIsConnected(false);
      setConnectedAccount(null);
      setLastSyncDate(null);
      setImportedWorkouts([]);
      setShowLoginForm(true);
      toast.success('Cuenta de Garmin desconectada');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        toast.error('No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.');
        return;
      }
      const workouts = await GarminService.syncWorkouts(userId.toString());
      // Parse dates from API response (they come as strings)
      const parsedWorkouts = workouts.map(workout => ({
        ...workout,
        date: new Date(workout.date),
        laps: workout.laps.map(lap  => ({
          ...lap,
          startTime: new Date(lap.startTime.toISOString())
        }))
      }));
      setImportedWorkouts(workouts);
    } catch (error) {
      // Error is already handled by the service
    } finally {
      setIsSyncing(false);
    }
  };

  function durationToTime(duration: number): React.ReactNode {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-slate-900">Integración con Garmin</h2>
          <p className="text-slate-600 mt-1">
            Conecta tu cuenta de Garmin Connect para importar automáticamente tus entrenamientos
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-900">Integración con Garmin</h2>
        <p className="text-slate-600 mt-1">
          Conecta tu cuenta de Garmin Connect para importar automáticamente tus entrenamientos
        </p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isConnected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                <Watch className={`h-6 w-6 ${isConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <CardTitle>Garmin Connect</CardTitle>
                <CardDescription>
                  {isConnected ? 'Cuenta conectada' : 'No conectado'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-emerald-500' : ''}>
              {isConnected ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Inactivo</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected ? (
            <>
              {!showLoginForm ? (
                <>
                  <Alert>
                    <Link2 className="h-4 w-4" />
                    <AlertDescription>
                      Conecta tu cuenta de Garmin Connect para importar automáticamente tus entrenamientos y métricas de rendimiento.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <p className="text-slate-700">
                        <strong>¿Qué se importará?</strong>
                      </p>
                      <ul className="space-y-2 text-slate-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Actividades de carrera con métricas completas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Distancia, ritmo, frecuencia cardíaca y calorías</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Datos de GPS y elevación</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Historial de entrenamientos pasados</span>
                        </li>
                      </ul>
                    </div>

                    <Button 
                      onClick={handleShowLoginForm} 
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                      size="lg"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Conectar con Garmin Connect
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Formulario de login de Garmin */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-600 rounded-lg">
                          <Watch className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-slate-900">Iniciar sesión en Garmin Connect</p>
                          <p className="text-sm text-slate-600">
                            Ingresa tus credenciales de Garmin
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleConnect} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="garmin-username">
                            Email o nombre de usuario
                          </Label>
                          <Input
                            id="garmin-username"
                            type="text"
                            placeholder="tu-email@ejemplo.com"
                            value={garminUsername}
                            onChange={(e) => {
                              setGarminUsername(e.target.value);
                              if (formErrors.username) {
                                setFormErrors({ ...formErrors, username: undefined });
                              }
                            }}
                            className={formErrors.username ? 'border-red-500' : ''}
                            disabled={isConnecting}
                          />
                          {formErrors.username && (
                            <p className="text-sm text-red-600">{formErrors.username}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="garmin-password">
                            Contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="garmin-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={garminPassword}
                              onChange={(e) => {
                                setGarminPassword(e.target.value);
                                if (formErrors.password) {
                                  setFormErrors({ ...formErrors, password: undefined });
                                }
                              }}
                              className={`pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                              disabled={isConnecting}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              disabled={isConnecting}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {formErrors.password && (
                            <p className="text-sm text-red-600">{formErrors.password}</p>
                          )}
                        </div>

                        <Alert className="bg-cyan-50 border-cyan-200">
                          <AlertCircle className="h-4 w-4 text-cyan-600" />
                          <AlertDescription className="text-cyan-800">
                            Tus credenciales son enviadas de forma segura a Garmin Connect y no son almacenadas por Strider.
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelLogin}
                            disabled={isConnecting}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={isConnecting}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                          >
                            {isConnecting ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Conectando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Conectar
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Connected Account Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-900">Cuenta de Garmin conectada</p>
                    <p className="text-xs text-slate-400">
                      Conectado desde {connectedAccount?.connectedSince && format(new Date(connectedAccount.connectedSince), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                </div>

                <Separator />

                {/* Sync Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync">Sincronización automática</Label>
                      <p className="text-xs text-slate-500">
                        Importa automáticamente nuevas actividades cada 24 horas
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={(checked: boolean) => {
                        setAutoSync(checked);
                        toast.success(checked ? 'Sincronización automática activada' : 'Sincronización automática desactivada');
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Última sincronización: {lastSyncDate ? format(lastSyncDate, "d/MM/yyyy 'a las' HH:mm", { locale: es }) : 'Nunca'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sincronizar ahora
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Imported Workouts */}
      {isConnected && importedWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Entrenamientos Importados</CardTitle>
                <CardDescription>
                  Entrenamientos sincronizados desde Garmin Connect
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {importedWorkouts.length} {importedWorkouts.length === 1 ? 'entrenamiento' : 'entrenamientos'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importedWorkouts.map((workout) => {
                // Calcular ritmo promedio en minutos por kilómetro
                const durationInMinutes = workout.duration / 60;
                const avgPace = durationInMinutes / workout.distance;

                return (
                  <div 
                    key={workout.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-50 rounded-lg">
                          <Activity className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-slate-900">{workout.name}</p>
                          <p className="text-sm text-slate-500">
                            {workout.date}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sincronizado
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Distancia</p>
                        <p className="text-slate-900">{workout.distance} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Duración</p>
                        <p className="text-slate-900">{durationToTime(workout.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Ritmo promedio</p>
                        <p className="text-slate-900">{avgPace}/km</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">FC promedio</p>
                        <p className="text-slate-900">{workout.averageHR} bpm</p>
                      </div>
                    </div>

                    {workout.laps && workout.laps.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">Vueltas: {workout.laps.length}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Total sincronizado</span>
                </div>
                <p className="text-2xl text-slate-900">{importedWorkouts.length}</p>
                <p className="text-xs text-slate-500">Entrenamientos importados</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Volumen total</span>
                </div>
                <p className="text-2xl text-slate-900">
                  {importedWorkouts.reduce((sum, w) => sum + w.distance, 0).toFixed(1)} km
                </p>
                <p className="text-xs text-slate-500">Desde la conexión</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Próxima sincronización</span>
                </div>
                <p className="text-2xl text-slate-900">{autoSync ? '18:00' : 'Manual'}</p>
                <p className="text-xs text-slate-500">
                  {autoSync ? 'Sincronización automática' : 'Solo sincronización manual'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
