/**
 * Utilidades para convertir entre tipos de usuario del frontend y enum del backend
 */

export type UserType = 'athlete' | 'coach' | null;

/**
 * Convierte el userType del frontend ('athlete' | 'coach') al enum numérico del backend
 * Athlete = 0, Coach = 1
 */
export function userTypeToEnum(userType: 'athlete' | 'coach'): number {
  return userType === 'athlete' ? 0 : 1;
}

/**
 * Convierte el enum numérico del backend al userType del frontend
 */
export function enumToUserType(userTypeEnum: number): 'athlete' | 'coach' {
  return userTypeEnum === 0 ? 'athlete' : 'coach';
}

