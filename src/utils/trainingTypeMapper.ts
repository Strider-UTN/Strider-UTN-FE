/**
 * Utilidades para mapear tipos de entrenamiento entre frontend y backend
 * 
 * El backend usa un enum TrainingType con valores específicos (sin tildes):
 * - Continuo, Intervalos, Tempo, Fartlek, Recuperacion, Cuestas, Series
 * 
 * El frontend usa strings con tildes: 'Recuperación'
 */

/**
 * Convierte el tipo de entrenamiento del frontend al formato del enum del backend
 * @param type Tipo del frontend (puede tener tildes)
 * @returns Tipo del backend (sin tildes, coincide con el enum)
 */
export function mapTrainingTypeToBackend(type: string): string {
  const mapping: Record<string, string> = {
    'Continuo': 'Continuo',
    'Intervalos': 'Intervalos',
    'Tempo': 'Tempo',
    'Fartlek': 'Fartlek',
    'Recuperación': 'Recuperacion', // Sin tilde en el backend
    'Cuestas': 'Cuestas',
    'Series': 'Series'
  };

  return mapping[type] || type;
}

/**
 * Convierte el tipo de entrenamiento del backend al formato del frontend
 * @param type Tipo del backend (sin tildes)
 * @returns Tipo del frontend (con tildes si corresponde)
 */
export function mapTrainingTypeFromBackend(type: string): string {
  const mapping: Record<string, string> = {
    'Continuo': 'Continuo',
    'Intervalos': 'Intervalos',
    'Tempo': 'Tempo',
    'Fartlek': 'Fartlek',
    'Recuperacion': 'Recuperación', // Con tilde en el frontend
    'Cuestas': 'Cuestas',
    'Series': 'Series'
  };

  return mapping[type] || type;
}

