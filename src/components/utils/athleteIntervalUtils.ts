export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseTime = (timeStr: string): number => {
  const [mins, secs] = timeStr.split(':').map(Number);
  return (mins || 0) * 60 + (secs || 0);
};

export const calculateEstimatedPace = (distance: number, targetTime: string): string => {
  if (!targetTime || !distance) return '';
  
  const totalSeconds = parseTime(targetTime);
  const pacePerKm = (totalSeconds / (distance / 1000)) / 60; // min/km
  const mins = Math.floor(pacePerKm);
  const secs = Math.round((pacePerKm - mins) * 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
};

export const calculateTargetTimeFromPace = (distance: number, paceMinPerKm: number): string => {
  const totalMinutes = (distance / 1000) * paceMinPerKm;
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatIntervalDisplay = (interval: TrainingInterval): string => {
  const distanceKm = interval.distance >= 1000 
    ? `${interval.distance / 1000}K` 
    : `${interval.distance}m`;
  
  if (interval.type === 'continuous') {
    return `${distanceKm} continuo`;
  }
  
  const recovery = interval.recoveryTime !== '0:00' ? ` (rec: ${interval.recoveryTime})` : '';
  return `${interval.repetitions} x ${distanceKm}${recovery}`;
};

export interface TrainingInterval {
  id: string;
  type: 'interval' | 'continuous' | 'recovery';
  repetitions: number;
  distance: number;
  targetTime?: string;
  recoveryTime: string;
  paceType: 'fixed' | 'vo2max_percentage';
  pace?: number;
  vo2maxPercentage?: number;
  description?: string;
  intensity?: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
  // Nuevos campos para soporte de modo distancia/tiempo
  trainingMode?: 'distance' | 'time';
  duration?: string;
  targetSpeed?: string;
}