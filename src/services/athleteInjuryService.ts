import { apiClient } from './apiClient';

export type InjurySeverity = 'Mild' | 'Moderate' | 'Severe';
export type InjuryStatus = 'Active' | 'UnderTreatment' | 'Recovered' | 'Cancelled';
export type InjuryLocation =
  | 'Head'
  | 'Neck'
  | 'RightShoulder'
  | 'LeftShoulder'
  | 'RightArm'
  | 'LeftArm'
  | 'RightElbow'
  | 'LeftElbow'
  | 'RightWrist'
  | 'LeftWrist'
  | 'RightHand'
  | 'LeftHand'
  | 'Chest'
  | 'UpperBack'
  | 'LowerBack'
  | 'Abdomen'
  | 'Hip'
  | 'RightThigh'
  | 'LeftThigh'
  | 'RightKnee'
  | 'LeftKnee'
  | 'RightCalf'
  | 'LeftCalf'
  | 'RightAnkle'
  | 'LeftAnkle'
  | 'RightFoot'
  | 'LeftFoot'
  | 'RightAchilles'
  | 'LeftAchilles';

export type InjuryTreatmentValue =
  | 'Rest'
  | 'Physiotherapy'
  | 'Medication'
  | 'Rehabilitation'
  | 'ManualTherapy'
  | 'SpecificExercises'
  | 'Cryotherapy'
  | 'Thermotherapy'
  | 'Electrotherapy'
  | 'Surgery'
  | 'Other';

export type InjuryImpactValue = 'None' | 'Low' | 'Moderate' | 'High' | 'Full';

export interface AthleteInjurySummary {
  id: number;
  title: string;
  description?: string;
  affectedArea?: InjuryLocation;
  severity: InjurySeverity;
  status: InjuryStatus;
  diagnosisDate: string;
  recoveryEstimateDate?: string | null;
  recoveryDate?: string | null;
  treatment?: string | null;
  impactOnTraining?: string | null;
  notes?: string;
}

export interface CreateAthleteInjuryPayload {
  title: string;
  description?: string;
  affectedArea?: InjuryLocation;
  severity: InjurySeverity;
  status: InjuryStatus;
  diagnosisDate: string;
  recoveryEstimateDate?: string;
  recoveryDate?: string;
  treatment?: InjuryTreatmentValue;
  impactOnTraining?: InjuryImpactValue;
  notes?: string;
}

export interface UpdateAthleteInjuryPayload {
  status: InjuryStatus;
  severity?: InjurySeverity;
  recoveryEstimateDate?: string;
  recoveryDate?: string;
  treatment?: InjuryTreatmentValue;
  impactOnTraining?: InjuryImpactValue;
  notes?: string;
}

export const AthleteInjuryService = {
  async getMyInjuries(): Promise<AthleteInjurySummary[]> {
    const response = await apiClient.get<AthleteInjurySummary[]>('/api/athlete/injuries/mine');
    return response.data;
  },

  async getById(injuryId: number): Promise<AthleteInjurySummary> {
    const response = await apiClient.get<AthleteInjurySummary>(`/api/athlete/injuries/${injuryId}`);
    return response.data;
  },

  async create(payload: CreateAthleteInjuryPayload): Promise<AthleteInjurySummary> {
    const response = await apiClient.post<AthleteInjurySummary>('/api/athlete/injuries', payload);
    return response.data;
  },

  async update(injuryId: number, payload: UpdateAthleteInjuryPayload): Promise<AthleteInjurySummary> {
    const response = await apiClient.put<AthleteInjurySummary>(`/api/athlete/injuries/${injuryId}`, payload);
    return response.data;
  }
};
