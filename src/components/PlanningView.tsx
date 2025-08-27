import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Users, Settings, ArrowLeft, Activity } from 'lucide-react';
import { PlanningCalendar } from './PlanningCalendar';
import { PlanningConfigurationModal } from './PlanningConfigurationModal';
import { MacrocycleView } from './MacrocycleView';

interface Planning {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  athletes: string[];
  status: 'active' | 'completed' | 'draft';
  periodsCount: number;
  groupsCount: number;
}

interface Athlete {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  vo2max?: number;
}

interface PlanningViewProps {
  planning: Planning;
  athletes: Athlete[];
  onBack: () => void;
  onUpdate: (updatedPlanning: Planning) => void;
}

export function PlanningView({ planning, athletes, onBack, onUpdate }: PlanningViewProps) {
  const [activeTab, setActiveTab] = useState('macrocycle');
  const [isConfigurationModalOpen, setIsConfigurationModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'completed': return 'Completada';
      case 'draft': return 'Borrador';
      default: return 'Desconocido';
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-primary">{planning.name}</h1>
              <Badge className={getStatusColor(planning.status)}>
                {getStatusText(planning.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {planning.description}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>
                Inicio: {formatDate(planning.startDate)}
              </span>
              {planning.endDate && (
                <span>
                  Fin: {formatDate(planning.endDate)}
                </span>
              )}
              <span>
                {athletes.length} atletas asignados
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsConfigurationModalOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>



      {/* Tabs para diferentes vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="macrocycle" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Macrociclo
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="athletes" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Atletas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="macrocycle" className="space-y-4">
          <MacrocycleView 
            planningId={planning.id}
            year={new Date(planning.startDate).getFullYear()}
            athletes={athletes}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Calendario de Entrenamiento
              </CardTitle>
              <CardDescription>
                Programa y gestiona sesiones de entrenamiento para esta planificación
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PlanningCalendar
                planningId={planning.id}
                userType="coach"
                athletes={athletes}
                onSessionCreate={(session) => {
                  console.log('Nueva sesión creada:', session);
                  // Aquí puedes manejar la creación de la sesión
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Atletas Asignados
              </CardTitle>
              <CardDescription>
                Atletas que participan en esta planificación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {athletes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {athletes.map(athlete => (
                    <Card key={athlete.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{athlete.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {athlete.groupName}
                          </p>
                          {athlete.vo2max && (
                            <p className="text-sm text-muted-foreground">
                              VO₂ Max: {athlete.vo2max} ml/kg/min
                            </p>
                          )}
                        </div>

                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No hay atletas asignados</h3>
                  <p className="text-muted-foreground">
                    Agrega atletas a esta planificación para comenzar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Modal de Configuración */}
      <PlanningConfigurationModal
        isOpen={isConfigurationModalOpen}
        onClose={() => setIsConfigurationModalOpen(false)}
      />
    </div>
  );
}