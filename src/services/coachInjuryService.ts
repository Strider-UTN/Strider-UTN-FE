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
  recoveryDate?: string | null;
  createdAt: string;
  treatment?: string | null;
  impactOnTraining?: string | null;
  description?: string | null;
  notes?: string | null;
  affectedArea?: string | null;
}

export const CoachInjuryService = {
  async getRecentInjuries(): Promise<CoachRecentInjury[]> {
    const response = await apiClient.get<CoachRecentInjury[]>('/api/coach/injuries/recent');
    return response.data;
  },

  async getTop3RecentInjuriesForAthlete(athleteId: number): Promise<CoachRecentInjury[]> {
    const response = await apiClient.get<CoachRecentInjury[]>(`/api/coach/injuries/athlete/${athleteId}/top3`);
    return response.data;
  }
};
