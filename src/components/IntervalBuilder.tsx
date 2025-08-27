import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export interface TrainingInterval {
  id: string;
  type: "work" | "rest";
  duration: number;
  durationUnit: "time" | "distance";
  pace?: string;
  intensity?: string;
  description?: string;
}

interface IntervalBuilderProps {
  existingIntervals: TrainingInterval[];
  onIntervalsChange: React.Dispatch<React.SetStateAction<TrainingInterval[]>>;
  trainingType: "Recuperación" | "Continuo" | "Intervalos" | "Tempo" | "Fartlek" | "Cuestas" | "Series";
}

export function IntervalBuilder({
  existingIntervals,
  onIntervalsChange,
  trainingType
}: IntervalBuilderProps) {
  const [localIntervals, setLocalIntervals] = useState<TrainingInterval[]>(existingIntervals);

  useEffect(() => {
    setLocalIntervals(existingIntervals);
  }, [existingIntervals]);

  const handleAddInterval = () => {
    const newInterval: TrainingInterval = {
      id: `int_${Date.now()}`,
      type: "work",
      duration: 5,
      durationUnit: "time",
      pace: "",
      intensity: "",
      description: ""
    };
    const updated = [...localIntervals, newInterval];
    setLocalIntervals(updated);
    onIntervalsChange(updated);
  };

  const handleRemoveInterval = (id: string) => {
    const updated = localIntervals.filter((i) => i.id !== id);
    setLocalIntervals(updated);
    onIntervalsChange(updated);
  };

  const handleChange = (id: string, field: keyof TrainingInterval, value: any) => {
    const updated = localIntervals.map((interval) =>
      interval.id === id ? { ...interval, [field]: value } : interval
    );
    setLocalIntervals(updated);
    onIntervalsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Intervalos ({trainingType})</h3>
        <Button onClick={handleAddInterval}>+ Agregar Intervalo</Button>
      </div>

      {localIntervals.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay intervalos definidos todavía.
        </p>
      )}

      {localIntervals.map((interval) => (
        <div
          key={interval.id}
          className="flex items-center gap-2 border rounded-lg p-2"
        >
          <select
            value={interval.type}
            onChange={(e) => handleChange(interval.id, "type", e.target.value)}
            className="border rounded p-1"
          >
            <option value="work">Trabajo</option>
            <option value="rest">Descanso</option>
          </select>

          <input
            type="number"
            value={interval.duration}
            onChange={(e) =>
              handleChange(interval.id, "duration", Number(e.target.value))
            }
            className="w-16 border rounded p-1"
          />

          <select
            value={interval.durationUnit}
            onChange={(e) =>
              handleChange(interval.id, "durationUnit", e.target.value)
            }
            className="border rounded p-1"
          >
            <option value="time">Tiempo (min)</option>
            <option value="distance">Distancia (m)</option>
          </select>

          <input
            type="text"
            placeholder="Ritmo"
            value={interval.pace || ""}
            onChange={(e) => handleChange(interval.id, "pace", e.target.value)}
            className="w-24 border rounded p-1"
          />

          <input
            type="text"
            placeholder="Intensidad"
            value={interval.intensity || ""}
            onChange={(e) => handleChange(interval.id, "intensity", e.target.value)}
            className="w-24 border rounded p-1"
          />

          <input
            type="text"
            placeholder="Descripción"
            value={interval.description || ""}
            onChange={(e) => handleChange(interval.id, "description", e.target.value)}
            className="flex-1 border rounded p-1"
          />

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleRemoveInterval(interval.id)}
          >
            Eliminar
          </Button>
        </div>
      ))}
    </div>
  );
}
