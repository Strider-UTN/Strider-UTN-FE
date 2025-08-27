import { TrainingSession } from '../types/microcycleTypes';

export const MOCK_TRAINING_SESSIONS: TrainingSession[] = [
  {
    id: 'session_1',
    date: '2024-08-06',
    name: '8 x 400m',
    description: 'Series de velocidad',
    category: 'training',
    athletes: ['athlete_1', 'athlete_2'],
    intervals: [],
    volume: '6 km',
    intensity: 'Alta',
    notes: 'Enfoque en cadencia',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 'session_2',
    date: '2024-08-08',
    name: 'Carrera Continua',
    description: 'Trabajo aeróbico base',
    category: 'training',
    athletes: ['athlete_1', 'athlete_2', 'athlete_3'],
    intervals: [],
    volume: '15 km',
    intensity: 'Baja',
    notes: 'Ritmo conversacional',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  }
];