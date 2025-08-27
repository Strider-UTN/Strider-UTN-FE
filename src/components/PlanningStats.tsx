import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, Clock, Zap, TrendingUp, Activity, User, BarChart3, Users } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
}

interface PeriodGroup {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'year' | 'month' | 'week' | 'custom';
  parentId?: string;
  children: PeriodGroup[];
  sessions: any[];
}

interface PeriodStats {
  athleteId: string;
  periodId: string;
  totalDistance: number;
  totalDuration: number;
  averagePace: number;
  intensityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

interface Planning {
  id: string;
  name: string;
  athlete: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'draft' | 'completed';
  totalSessions: number;
  completedSessions: number;
  category: 'individual' | 'group';
}

interface PlanningStatsProps {
  plannings?: Planning[];
  athletes?: Athlete[];
  periodStats?: PeriodStats[];
  periodGroups?: PeriodGroup[];
  selectedPeriod?: string;
  onPeriodChange?: (periodId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8DD1E1'];

export function PlanningStats({ 
  plannings = [],
  athletes = [], 
  periodStats = [], 
  periodGroups = [], 
  selectedPeriod = 'all', 
  onPeriodChange = () => {} 
}: PlanningStatsProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<string>('all');
  const [chartType, setChartType] = useState<'distance' | 'pace' | 'intensity'>('distance');

  // Si tenemos datos de plannings, usar modo simplificado
  if (plannings.length > 0 && periodStats.length === 0) {
    return <SimplePlanningStats plannings={plannings} />;
  }

  // Filtrar estadísticas según la selección
  const filteredStats = periodStats.filter(stat => {
    const periodMatch = selectedPeriod === 'all' || stat.periodId === selectedPeriod;
    const athleteMatch = selectedAthlete === 'all' || stat.athleteId === selectedAthlete;
    return periodMatch && athleteMatch;
  });

  // Preparar datos para gráficos
  const prepareChartData = () => {
    if (selectedAthlete !== 'all') {
      // Datos por período para un atleta específico
      return filteredStats.map(stat => {
        const period = periodGroups
          .flatMap(year => year.children)
          .find(month => month.id === stat.periodId);
        
        return {
          period: period ? period.name.split(' ')[0] : stat.periodId,
          distance: stat.totalDistance,
          pace: stat.averagePace,
          duration: Math.round(stat.totalDuration / 60), // convertir a horas
          low: stat.intensityDistribution.low,
          medium: stat.intensityDistribution.medium,
          high: stat.intensityDistribution.high
        };
      }).sort((a, b) => a.period.localeCompare(b.period));
    } else {
      // Datos agregados por atleta
      const athleteData = athletes.map(athlete => {
        const athleteStats = filteredStats.filter(stat => stat.athleteId === athlete.id);
        const totalDistance = athleteStats.reduce((sum, stat) => sum + stat.totalDistance, 0);
        const totalDuration = athleteStats.reduce((sum, stat) => sum + stat.totalDuration, 0);
        const avgPace = athleteStats.reduce((sum, stat) => sum + stat.averagePace, 0) / Math.max(athleteStats.length, 1);
        
        // Promediar distribución de intensidad
        const intensityDistribution = athleteStats.reduce(
          (acc, stat) => ({
            low: acc.low + stat.intensityDistribution.low,
            medium: acc.medium + stat.intensityDistribution.medium,
            high: acc.high + stat.intensityDistribution.high
          }),
          { low: 0, medium: 0, high: 0 }
        );
        
        const periodCount = athleteStats.length;
        if (periodCount > 0) {
          intensityDistribution.low /= periodCount;
          intensityDistribution.medium /= periodCount;
          intensityDistribution.high /= periodCount;
        }

        return {
          athlete: athlete.name.split(' ')[0],
          distance: Math.round(totalDistance * 100) / 100,
          pace: Math.round(avgPace * 100) / 100,
          duration: Math.round(totalDuration / 60),
          low: Math.round(intensityDistribution.low * 100) / 100,
          medium: Math.round(intensityDistribution.medium * 100) / 100,
          high: Math.round(intensityDistribution.high * 100) / 100
        };
      });
      
      return athleteData.sort((a, b) => b.distance - a.distance);
    }
  };

  const chartData = prepareChartData();

  // Preparar datos de distribución de intensidad para gráfico de pastel
  const prepareIntensityPieData = () => {
    const totals = filteredStats.reduce(
      (acc, stat) => ({
        low: acc.low + stat.intensityDistribution.low,
        medium: acc.medium + stat.intensityDistribution.medium,
        high: acc.high + stat.intensityDistribution.high
      }),
      { low: 0, medium: 0, high: 0 }
    );

    const total = totals.low + totals.medium + totals.high;
    if (total === 0) return [];

    return [
      { name: 'Baja Intensidad', value: Math.round((totals.low / total) * 100), color: '#00C49F' },
      { name: 'Media Intensidad', value: Math.round((totals.medium / total) * 100), color: '#FFBB28' },
      { name: 'Alta Intensidad', value: Math.round((totals.high / total) * 100), color: '#FF8042' }
    ];
  };

  const intensityPieData = prepareIntensityPieData();

  // Calcular estadísticas resumidas
  const totalDistance = filteredStats.reduce((sum, stat) => sum + stat.totalDistance, 0);
  const totalDuration = filteredStats.reduce((sum, stat) => sum + stat.totalDuration, 0);
  const avgPace = filteredStats.length > 0 
    ? filteredStats.reduce((sum, stat) => sum + stat.averagePace, 0) / filteredStats.length 
    : 0;

  const formatPace = (pace: number) => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtener opciones de períodos disponibles
  const availablePeriods = [
    { id: 'all', name: 'Todos los períodos' },
    ...periodGroups.flatMap(year => 
      year.children.map(month => ({
        id: month.id,
        name: month.name
      }))
    )
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
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
                  {athletes.map(athlete => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Métrica</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distancia</SelectItem>
                  <SelectItem value="pace">Ritmo</SelectItem>
                  <SelectItem value="intensity">Intensidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalDistance.toFixed(1)} km
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredStats.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totalDuration / 60)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(totalDuration / 60 / Math.max(athletes.filter(a => 
                selectedAthlete === 'all' || a.id === selectedAthlete
              ).length, 1))}h promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ritmo Promedio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPace(avgPace)}
            </div>
            <p className="text-xs text-muted-foreground">
              min/km promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Períodos Analizados</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {selectedPeriod === 'all' 
                ? new Set(filteredStats.map(s => s.periodId)).size
                : 1
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedAthlete === 'all' ? 'Todos los atletas' : 'Atleta individual'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico principal */}
        <Card>
          <CardHeader>
            <CardTitle>
              {chartType === 'distance' ? 'Análisis de Distancia' :
               chartType === 'pace' ? 'Análisis de Ritmo' :
               'Análisis de Intensidad'}
            </CardTitle>
            <CardDescription>
              {selectedAthlete === 'all' ? 'Comparación entre atletas' : 'Evolución por período'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'distance' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={selectedAthlete === 'all' ? 'athlete' : 'period'}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} km`, 'Distancia']} />
                  <Bar dataKey="distance" fill="var(--primary)" />
                </BarChart>
              ) : chartType === 'pace' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={selectedAthlete === 'all' ? 'athlete' : 'period'}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatPace(value)}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  />
                  <Tooltip formatter={(value: number) => [formatPace(value), 'Ritmo']} />
                  <Line 
                    type="monotone" 
                    dataKey="pace" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={selectedAthlete === 'all' ? 'athlete' : 'period'}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="low" stackId="a" fill="#00C49F" name="Baja" />
                  <Bar dataKey="medium" stackId="a" fill="#FFBB28" name="Media" />
                  <Bar dataKey="high" stackId="a" fill="#FF8042" name="Alta" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de intensidad */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Intensidad</CardTitle>
            <CardDescription>
              Porcentaje de entrenamiento por nivel de intensidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={intensityPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {intensityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {intensityPieData.length === 0 && (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p>No hay datos de intensidad disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de estadísticas detalladas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Estadísticas Detalladas
          </CardTitle>
          <CardDescription>
            Métricas individuales {selectedAthlete === 'all' ? 'por atleta' : 'por período'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    {selectedAthlete === 'all' ? 'Atleta' : 'Período'}
                  </th>
                  <th className="text-right p-2">Distancia (km)</th>
                  <th className="text-right p-2">Tiempo (h)</th>
                  <th className="text-right p-2">Ritmo</th>
                  <th className="text-right p-2">Baja %</th>
                  <th className="text-right p-2">Media %</th>
                  <th className="text-right p-2">Alta %</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      {selectedAthlete === 'all' ? row.athlete : row.period}
                    </td>
                    <td className="text-right p-2">{row.distance}</td>
                    <td className="text-right p-2">{row.duration}</td>
                    <td className="text-right p-2">{formatPace(row.pace)}</td>
                    <td className="text-right p-2">
                      <Badge variant="outline" className="bg-green-50 text-green-800">
                        {row.low}%
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-800">
                        {row.medium}%
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="outline" className="bg-red-50 text-red-800">
                        {row.high}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {chartData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>No hay datos disponibles para los filtros seleccionados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente simplificado para cuando solo tenemos datos básicos de plannings
function SimplePlanningStats({ plannings }: { plannings: Planning[] }) {
  const statusCounts = plannings.reduce((acc, planning) => {
    acc[planning.status] = (acc[planning.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSessions = plannings.reduce((sum, p) => sum + p.totalSessions, 0);
  const completedSessions = plannings.reduce((sum, p) => sum + p.completedSessions, 0);
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const categoryData = plannings.reduce((acc, planning) => {
    acc[planning.category] = (acc[planning.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Individual', value: categoryData.individual || 0, color: '#0088FE' },
    { name: 'Grupal', value: categoryData.group || 0, color: '#00C49F' }
  ].filter(item => item.value > 0);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status === 'active' ? 'Activas' : 
            status === 'draft' ? 'Borradores' : 'Completadas',
    count
  }));

  return (
    <div className="space-y-6">
      {/* Métricas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planificaciones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {plannings.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Planificaciones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Totales</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedSessions} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sesiones completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planificaciones Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {statusCounts.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En progreso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Planificaciones</CardTitle>
            <CardDescription>
              Distribución por estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Planificaciones</CardTitle>
            <CardDescription>
              Individual vs Grupal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {pieData.length === 0 && (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p>No hay datos disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de planificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Resumen de Planificaciones
          </CardTitle>
          <CardDescription>
            Detalles de todas las planificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Atleta/Grupo</th>
                  <th className="text-center p-2">Estado</th>
                  <th className="text-right p-2">Sesiones</th>
                  <th className="text-right p-2">Progreso</th>
                </tr>
              </thead>
              <tbody>
                {plannings.map((planning, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{planning.name}</td>
                    <td className="p-2">{planning.athlete}</td>
                    <td className="text-center p-2">
                      <Badge 
                        variant={
                          planning.status === 'active' ? 'default' :
                          planning.status === 'draft' ? 'secondary' : 'outline'
                        }
                      >
                        {planning.status === 'active' ? 'Activa' :
                         planning.status === 'draft' ? 'Borrador' : 'Completada'}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {planning.completedSessions}/{planning.totalSessions}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="outline">
                        {Math.round((planning.completedSessions / planning.totalSessions) * 100)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {plannings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>No hay planificaciones disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}