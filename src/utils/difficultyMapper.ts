/**
 * Utilidades para mapear dificultad entre frontend y backend
 * 
 * El backend usa un enum TrainingDifficulty que puede venir como string:
 * - "VeryEasy" (1), "Easy" (2), "Moderate" (3), "Hard" (4), "VeryHard" (5)
 * 
 * El frontend usa números: 1 | 2 | 3 | 4 | 5
 */

/**
 * Convierte la dificultad del backend (string enum o número) al formato del frontend (número)
 * @param difficulty Dificultad del backend (puede ser string enum, número, o string numérico)
 * @returns Número del 1 al 5
 */
export function mapDifficultyFromBackend(difficulty: string | number | undefined): 1 | 2 | 3 | 4 | 5 {
  // Si es undefined o null, retornar valor por defecto
  if (difficulty === undefined || difficulty === null) {
    return 3; // Moderado por defecto
  }

  // Si ya es un número, validarlo y retornarlo
  if (typeof difficulty === 'number') {
    if (difficulty >= 1 && difficulty <= 5) {
      return difficulty as 1 | 2 | 3 | 4 | 5;
    }
    return 3; // Por defecto si está fuera del rango
  }

  // Si es string, puede ser un enum del backend o un número como string
  const difficultyStr = String(difficulty).trim();

  // Mapeo de enum strings del backend a números
  const enumMapping: Record<string, 1 | 2 | 3 | 4 | 5> = {
    'VeryEasy': 1,
    'Easy': 2,
    'Moderate': 3,
    'Hard': 4,
    'VeryHard': 5,
    // También soportar camelCase (como viene del backend)
    'veryEasy': 1,
    'easy': 2,
    'moderate': 3,
    'hard': 4,
    'veryHard': 5,
    // También soportar minúsculas por si acaso
    'veryeasy': 1,
    'veryhard': 5
  };

  // Si es un enum string, retornar el número correspondiente
  if (enumMapping[difficultyStr]) {
    return enumMapping[difficultyStr];
  }

  // Si es un número como string, convertirlo
  const numValue = parseInt(difficultyStr, 10);
  if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
    return numValue as 1 | 2 | 3 | 4 | 5;
  }

  // Por defecto retornar Moderado (3)
  return 3;
}

/**
 * Convierte la dificultad del frontend (número) al formato del backend (puede ser número o string enum)
 * Por ahora retornamos el número ya que el backend puede aceptarlo
 * @param difficulty Número del 1 al 5
 * @returns El mismo número (el backend lo puede convertir al enum)
 */
export function mapDifficultyToBackend(difficulty: 1 | 2 | 3 | 4 | 5): number {
  return difficulty;
}

