import { apiClient } from './apiClient';

/**
 * Enum for athlete health status message types
 */
export enum AthleteHealthStatusMessageType {
  Warning = 'Warning',
  Ok = 'Ok'
}

/**
 * DTO for athlete health status response
 */
export interface AthleteHealthStatusResponseDto {
  title: string;
  description: string;
  type: AthleteHealthStatusMessageType;
}

/**
 * Service for athlete analysis operations
 */
export class AthleteAnalysisService {
  /**
   * Gets the health status analysis for a specific athlete
   * @param id - The athlete ID
   * @returns Array of athlete health status responses
   */
  static async getAthleteAnalysis(id: number): Promise<AthleteHealthStatusResponseDto[]> {
    try {
      const { data } = await apiClient.get<AthleteHealthStatusResponseDto[]>(
        `/api/athlete/${id}/analysis`
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
}

