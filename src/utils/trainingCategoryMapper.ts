/**
 * Utilidades para mapear categorías de entrenamiento entre frontend y backend
 * 
 * El backend usa un enum TrainingCategory con valores PascalCase:
 * - Training, PrepCompetition, MainCompetition
 * 
 * El frontend usa strings con snake_case: 'training', 'prep_competition', 'main_competition'
 */

/**
 * Convierte la categoría del frontend al formato del enum del backend
 * @param category Categoría del frontend (snake_case)
 * @returns Categoría del backend (PascalCase, coincide con el enum)
 */
export function mapTrainingCategoryToBackend(
  category: 'training' | 'prep_competition' | 'main_competition'
): string {
  const mapping: Record<string, string> = {
    'training': 'Training',
    'prep_competition': 'PrepCompetition',
    'main_competition': 'MainCompetition'
  };

  return mapping[category] || 'Training';
}

/**
 * Convierte la categoría del backend al formato del frontend
 * @param category Categoría del backend (PascalCase del enum)
 * @returns Categoría del frontend (snake_case)
 */
export function mapTrainingCategoryFromBackend(category: string): 'training' | 'prep_competition' | 'main_competition' {
  const mapping: Record<string, 'training' | 'prep_competition' | 'main_competition'> = {
    'Training': 'training',
    'PrepCompetition': 'prep_competition',
    'MainCompetition': 'main_competition'
  };

  return mapping[category] || 'training';
}

