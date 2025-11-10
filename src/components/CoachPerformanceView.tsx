import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, TrendingUp, Activity, Zap, User } from 'lucide-react';
import { AthletePerformanceView } from './AthletePerformanceView';

type Units = 'metric' | 'imperial';

interface AthleteData {
  id: string;
  name: string;
  email: string;
  age: number;
  groupName: string;
  joinDate: string;
  lastActivity: string;
  currentVo2Max: number;
  weeklyDistance: number;
  status: 'active' | 'injured';
}

interface TrainingGroup {
  id: string;
  name: string;
  athleteCount: number;
}

// Datos simulados de atletas
const mockAthletes: AthleteData[] = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    age: 24,
    groupName: 'Velocistas Elite',
    joinDate: '2024-01-15',
    lastActivity: '2024-03-20',
    currentVo2Max: 52.3,
    weeklyDistance: 35.5,
    status: 'active'
  },
  {
    id: '2',
    name: 'Ana Rodríguez',
    email: 'ana.rodriguez@email.com',
    age: 28,
    groupName: 'Velocistas Elite',
    joinDate: '2024-02-01',
    lastActivity: '2024-03-19',
    currentVo2Max: 48.7,
    weeklyDistance: 42.1,
    status: 'active'
  },
  {
    id: '3',
    name: 'Miguel Torres',
    email: 'miguel.torres@email.com',
    age: 31,
    groupName: 'Fondistas Amateur',
    joinDate: '2024-02-20',
    lastActivity: '2024-03-18',
    currentVo2Max: 45.2,
    weeklyDistance: 28.9,
    status: 'active'
  },
  {
    id: '4',
    name: 'Laura Sánchez',
    email: 'laura.sanchez@email.com',
    age: 26,
    groupName: 'Fondistas Amateur',
    joinDate: '2024-01-30',
    lastActivity: '2024-03-15',
    currentVo2Max: 49.8,
    weeklyDistance: 38.7,
    status: 'active'
  },
  {
    id: '5',
    name: 'David García',
    email: 'david.garcia@email.com',
    age: 29,
    groupName: 'Velocistas Elite',
    joinDate: '2024-03-01',
    lastActivity: '2024-03-10',
    currentVo2Max: 51.1,
    weeklyDistance: 15.2,
    status: 'injured'
  }
];

const mockGroups: TrainingGroup[] = [
  { id: '1', name: 'Velocistas Elite', athleteCount: 12 },
  { id: '2', name: 'Fondistas Amateur', athleteCount: 8 }
];

interface CoachPerformanceViewProps {
  units: Units;
  onUnitsChange: (units: Units) => void;
}

export function CoachPerformanceView({ units, onUnitsChange }: CoachPerformanceViewProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const convertDistance = (km: number) => {
    return units === 'metric' ? km : km * 0.621371;
  };
  
  const formatDistance = (distance: number) => {
    const converted = convertDistance(distance);
    const unit = units === 'metric' ? 'km' : 'mi';
    return `${converted.toFixed(1)} ${unit}`;
  };

  // Filtrar atletas para estadísticas (por agrupación y estado)
  const athletesByGroup = mockAthletes.filter(athlete => {
    const matchesGroup = selectedGroup === 'all' || athlete.groupName === selectedGroup;
    const matchesStatus = selectedStatus === 'all' || athlete.status === selectedStatus;
    return matchesGroup && matchesStatus;
  });

  // Filtrar atletas para la lista (por agrupación y estado)
  const filteredAthletes = mockAthletes.filter(athlete => {
    const matchesGroup = selectedGroup === 'all' || athlete.groupName === selectedGroup;
    const matchesStatus = selectedStatus === 'all' || athlete.status === selectedStatus;
    return matchesGroup && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'injured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'injured': return 'Lesionado';
      default: return 'Desconocido';
    }
  };

  // Si hay un atleta seleccionado, mostrar su vista detallada
  if (selectedAthlete) {
    return (
      <AthletePerformanceView
        athlete={selectedAthlete}
        units={units}
        onBack={() => setSelectedAthlete(null)}
      />
    );
  }

  // Vista principal de lista de atletas
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Rendimiento de Atletas</h2>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tus atletas y agrega estimaciones personalizadas
          </p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Agrupaciones</SelectItem>
              {mockGroups.map(group => (
                <SelectItem key={group.id} value={group.name}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="injured">Lesionados</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={units} onValueChange={(value: Units) => onUnitsChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Métrico</SelectItem>
              <SelectItem value="imperial">Imperial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen estadístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Atletas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{athletesByGroup.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedGroup === 'all' ? `En ${mockGroups.length} agrupaciones` : `En ${selectedGroup}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atletas Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {athletesByGroup.filter(a => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Entrenando regularmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VO₂ Max Promedio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {athletesByGroup.length > 0 
                ? (athletesByGroup.reduce((sum, a) => sum + a.currentVo2Max, 0) / athletesByGroup.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              ml/kg/min {selectedGroup === 'all' ? 'del equipo' : 'de la agrupación'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Km Semanales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatDistance(athletesByGroup.reduce((sum, a) => sum + a.weeklyDistance, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total {selectedGroup === 'all' ? 'del equipo' : 'de la agrupación'}
            </p>
          </CardContent>
        </Card>
      </div>



      {/* Lista de atletas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAthletes.map((athlete) => (
          <Card key={athlete.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{athlete.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{athlete.age} años</p>
                  </div>
                </div>
                <Badge className={getStatusColor(athlete.status)}>
                  {getStatusText(athlete.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agrupación:</span>
                  <Badge variant="outline">{athlete.groupName}</Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VO₂ Max:</span>
                  <span className="font-semibold">{athlete.currentVo2Max} ml/kg/min</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Km Semanales:</span>
                  <span className="font-semibold">{formatDistance(athlete.weeklyDistance)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Última actividad:</span>
                  <span className="text-xs">{new Date(athlete.lastActivity).toLocaleDateString('es-ES')}</span>
                </div>
                
                <Button 
                  className="w-full mt-4 bg-accent hover:bg-accent/90"
                  onClick={() => setSelectedAthlete(athlete)}
                >
                  Ver Rendimiento Detallado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAthletes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron atletas</h3>
            <p className="text-muted-foreground">
              Ajusta los filtros de agrupación y estado para ver más resultados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}