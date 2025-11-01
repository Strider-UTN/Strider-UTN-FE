/**
 * Utilidades para traducir valores de plantillas al español
 */

/**
 * Traduce la categoría de una plantilla al español
 */
export function translateCategory(category: string): string {
  const translations: Record<string, string> = {
    'training': 'Entrenamiento',
    'prep_competition': 'Competencia Preparatoria',
    'main_competition': 'Competencia Principal',
    'Training': 'Entrenamiento',
    'PrepCompetition': 'Competencia Preparatoria',
    'MainCompetition': 'Competencia Principal'
  };
  return translations[category] || category;
}

/**
 * Traduce el tipo de entrenamiento (ya viene en español del backend)
 */
export function translateType(type: string): string {
  return type; // Ya viene en español
}

/**
 * Traduce el tipo de intervalo al español
 */
export function translateIntervalType(type: string): string {
  const translations: Record<string, string> = {
    'interval': 'Intervalo',
    'Interval': 'Intervalo',
    'continuous': 'Continuo',
    'Continuous': 'Continuo',
    'recovery': 'Recuperación',
    'Recovery': 'Recuperación'
  };
  return translations[type] || type;
}

/**
 * Traduce el tipo de ritmo al español
 */
export function translatePaceType(paceType: string): string {
  const translations: Record<string, string> = {
    'fixed': 'Fijo',
    'Fixed': 'Fijo',
    'vo2max_percentage': 'Porcentaje VO2Max',
    'Vo2MaxPercentage': 'Porcentaje VO2Max'
  };
  return translations[paceType] || paceType;
}

/**
 * Traduce el nivel de intensidad al español
 */
export function translateIntensity(intensity: string): string {
  const translations: Record<string, string> = {
    'easy': 'Fácil',
    'Easy': 'Fácil',
    'moderate': 'Moderado',
    'Moderate': 'Moderado',
    'hard': 'Duro',
    'Hard': 'Duro',
    'very_hard': 'Muy Duro',
    'VeryHard': 'Muy Duro',
    'max': 'Máximo',
    'Max': 'Máximo'
  };
  return translations[intensity] || intensity;
}

/**
 * Traduce el modo de entrenamiento al español
 */
export function translateTrainingMode(mode: string): string {
  const translations: Record<string, string> = {
    'distance': 'Distancia',
    'Distance': 'Distancia',
    'time': 'Tiempo',
    'Time': 'Tiempo'
  };
  return translations[mode] || mode;
}

