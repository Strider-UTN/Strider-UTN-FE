import { apiClient } from './apiClient';

export interface AthleteStatusResponse {
  isActive: boolean;
}

export interface UpdateAthleteStatusPayload {
  isActive: boolean;
}

export const AthleteStatusService = {
  async getMyStatus(): Promise<AthleteStatusResponse> {
    const response = await apiClient.get<AthleteStatusResponse>('/api/athlete/me/status');
    return response.data;
  },

  async updateStatus(payload: UpdateAthleteStatusPayload): Promise<AthleteStatusResponse> {
    const response = await apiClient.put<AthleteStatusResponse>('/api/athlete/me/status', payload);
    return response.data;
  }
};
