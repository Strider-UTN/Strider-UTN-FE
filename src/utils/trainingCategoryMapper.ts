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
  category: 'training' | 'prep_competition' | 'main_competition' | string
): string {
  const normalized = (category || 'training')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

  switch (normalized) {
    case 'training':
      return 'training';
    case 'prepcompetition':
      return 'prepCompetition';
    case 'maincompetition':
      return 'mainCompetition';
    default:
      return 'training';
  }
}

/**
 * Convierte la categoría del backend al formato del frontend
 * @param category Categoría del backend (PascalCase del enum)
 * @returns Categoría del frontend (snake_case)
 */
export function mapTrainingCategoryFromBackend(category: string): 'training' | 'prep_competition' | 'main_competition' {
  const normalized = (category || 'training')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

  switch (normalized) {
    case 'training':
      return 'training';
    case 'prepcompetition':
      return 'prep_competition';
    case 'maincompetition':
      return 'main_competition';
    default:
      return 'training';
  }
}

