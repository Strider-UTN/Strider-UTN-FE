import { apiClient } from './apiClient';

export interface CoachRecentInjury {
  injuryId: number;
  athleteId: number;
  athleteName: string;
  title: string;
  severity: string;
  status: string;
  diagnosisDate: string;
  recoveryEstimateDate?: string | null;
  createdAt: string;
  treatment?: string | null;
  impactOnTraining?: string | null;
}

export const CoachInjuryService = {
  async getRecentInjuries(): Promise<CoachRecentInjury[]> {
    const response = await apiClient.get<CoachRecentInjury[]>('/api/coach/injuries/recent');
    return response.data;
  }
};
