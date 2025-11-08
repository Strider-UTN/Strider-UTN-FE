const FRONTEND_TO_BACKEND: Record<string, 'easy' | 'moderate' | 'hard' | 'veryHard' | 'max'> = {
  easy: 'easy',
  moderate: 'moderate',
  hard: 'hard',
  very_hard: 'veryHard',
  max: 'max'
};

const BACKEND_TO_FRONTEND: Record<string, 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max'> = {
  easy: 'easy',
  moderate: 'moderate',
  hard: 'hard',
  veryhard: 'very_hard',
  very_hard: 'very_hard',
  veryhard_: 'very_hard',
  max: 'max'
};

type FrontendIntensity = 'easy' | 'moderate' | 'hard' | 'very_hard' | 'max';
type BackendIntensity = 'easy' | 'moderate' | 'hard' | 'veryHard' | 'max';

export function mapIntervalIntensityToBackend(intensity?: FrontendIntensity | string): BackendIntensity | undefined {
  if (!intensity) return undefined;
  const key = intensity.toLowerCase();
  return FRONTEND_TO_BACKEND[key] ?? undefined;
}

export function mapIntervalIntensityFromBackend(intensity?: BackendIntensity | string): FrontendIntensity | undefined {
  if (!intensity) return undefined;
  const key = intensity.toString().toLowerCase();
  return BACKEND_TO_FRONTEND[key] ?? undefined;
}

