import React, { useState } from 'react';
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
  Download, 
  Calendar,
  Settings,
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

interface GarminSession {
  id: string;
  date: Date;
  activityType: string;
  distance: number;
  duration: string;
  avgPace: string;
  heartRate?: number;
  calories?: number;
  synced: boolean;
}

export function GarminIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<{
    email: string;
    name: string;
    connectedSince: Date;
  } | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  // Datos mock de sesiones importadas desde Garmin
  const [importedSessions, setImportedSessions] = useState<GarminSession[]>([
    {
      id: 'g1',
      date: new Date(2025, 9, 25),
      activityType: 'Carrera',
      distance: 12.5,
      duration: '1:02:30',
      avgPace: '5:00',
      heartRate: 152,
      calories: 850,
      synced: true
    },
    {
      id: 'g2',
      date: new Date(2025, 9, 23),
      activityType: 'Carrera',
      distance: 8.0,
      duration: '0:36:00',
      avgPace: '4:30',
      heartRate: 165,
      calories: 520,
      synced: true
    },
    {
      id: 'g3',
      date: new Date(2025, 9, 21),
      activityType: 'Carrera',
      distance: 15.0,
      duration: '1:15:00',
      avgPace: '5:00',
      heartRate: 148,
      calories: 980,
      synced: true
    }
  ]);

  const handleShowLoginForm = () => {
    setShowLoginForm(true);
    setFormErrors({});
  };

  const handleCancelLogin = () => {
    setShowLoginForm(false);
    setGarminEmail('');
    setGarminPassword('');
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!garminEmail.trim()) {
      errors.email = 'El email o usuario es requerido';
    }
    
    if (!garminPassword) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsConnecting(true);
    toast.info('Autenticando con Garmin Connect...');
    
    setTimeout(() => {
      // Simular autenticación exitosa
      setConnectedAccount({
        email: garminEmail,
        name: 'Usuario Garmin',
        connectedSince: new Date()
      });
      setIsConnected(true);
      setLastSyncDate(new Date());
      setIsConnecting(false);
      setShowLoginForm(false);
      setGarminEmail('');
      setGarminPassword('');
      toast.success('¡Conectado exitosamente con Garmin Connect!');
    }, 2000);
  };

  const handleDisconnect = () => {
    if (confirm('¿Estás seguro de que deseas desconectar tu cuenta de Garmin? Las sesiones ya importadas se mantendrán.')) {
      setIsConnected(false);
      setConnectedAccount(null);
      setLastSyncDate(null);
      toast.success('Cuenta de Garmin desconectada');
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    toast.info('Sincronizando con Garmin Connect...');

    setTimeout(() => {
      setLastSyncDate(new Date());
      setIsSyncing(false);
      
      // Simular nuevas sesiones importadas
      const newSession: GarminSession = {
        id: 'g' + (importedSessions.length + 1),
        date: new Date(),
        activityType: 'Carrera',
        distance: 10.0,
        duration: '0:50:00',
        avgPace: '5:00',
        heartRate: 155,
        calories: 650,
        synced: true
      };
      
      setImportedSessions([newSession, ...importedSessions]);
      toast.success('Sincronización completada. 1 nueva sesión importada.');
    }, 2000);
  };

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
                          <Label htmlFor="garmin-email">
                            Email o nombre de usuario
                          </Label>
                          <Input
                            id="garmin-email"
                            type="text"
                            placeholder="tu-email@ejemplo.com"
                            value={garminEmail}
                            onChange={(e) => {
                              setGarminEmail(e.target.value);
                              if (formErrors.email) {
                                setFormErrors({ ...formErrors, email: undefined });
                              }
                            }}
                            className={formErrors.email ? 'border-red-500' : ''}
                            disabled={isConnecting}
                          />
                          {formErrors.email && (
                            <p className="text-sm text-red-600">{formErrors.email}</p>
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
                    <p className="text-slate-900">{connectedAccount?.name}</p>
                    <p className="text-slate-500">{connectedAccount?.email}</p>
                    <p className="text-xs text-slate-400">
                      Conectado desde {connectedAccount?.connectedSince && format(connectedAccount.connectedSince, "d 'de' MMMM, yyyy", { locale: es })}
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

      {/* Imported Sessions */}
      {isConnected && importedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sesiones Importadas</CardTitle>
                <CardDescription>
                  Entrenamientos sincronizados desde Garmin Connect
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {importedSessions.length} {importedSessions.length === 1 ? 'sesión' : 'sesiones'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importedSessions.map((session) => (
                <div 
                  key={session.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 rounded-lg">
                        <Activity className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-slate-900">{session.activityType}</p>
                        <p className="text-sm text-slate-500">
                          {format(session.date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    {session.synced && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sincronizado
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Distancia</p>
                      <p className="text-slate-900">{session.distance} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Duración</p>
                      <p className="text-slate-900">{session.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Ritmo promedio</p>
                      <p className="text-slate-900">{session.avgPace}/km</p>
                    </div>
                    {session.heartRate && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">FC promedio</p>
                        <p className="text-slate-900">{session.heartRate} bpm</p>
                      </div>
                    )}
                    {session.calories && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Calorías</p>
                        <p className="text-slate-900">{session.calories} kcal</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50">
                      <Download className="h-4 w-4 mr-2" />
                      Importar a Strider
                    </Button>
                  </div>
                </div>
              ))}
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
                <p className="text-2xl text-slate-900">{importedSessions.length}</p>
                <p className="text-xs text-slate-500">Sesiones importadas</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Volumen total</span>
                </div>
                <p className="text-2xl text-slate-900">
                  {importedSessions.reduce((sum, s) => sum + s.distance, 0).toFixed(1)} km
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
