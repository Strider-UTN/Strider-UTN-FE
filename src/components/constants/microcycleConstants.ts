export const INTENSITY_COLORS = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  baja: 'bg-green-100 text-green-700 border-green-200'
} as const;

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  planning: 'bg-orange-100 text-orange-800 border-orange-200'
} as const;

export const STATUS_LABELS = {
  planning: 'En Planificación',
  active: 'Activo',
  completed: 'Completado'
} as const;