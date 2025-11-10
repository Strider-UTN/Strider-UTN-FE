import { INTENSITY_COLORS, STATUS_COLORS } from '../constants/microcycleConstants';

export const getIntensityColor = (intensity: string) => {
  return INTENSITY_COLORS[intensity as keyof typeof INTENSITY_COLORS] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

export const getMicrocycleProgress = (completedSessions: number = 0, totalSessions: number) => {
  return Math.round((completedSessions / totalSessions) * 100);
};

export const getVolumeProgress = (actualVolume: number = 0, plannedVolume: number) => {
  return Math.round((actualVolume / plannedVolume) * 100);
};