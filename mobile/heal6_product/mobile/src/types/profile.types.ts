export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'other' | 'not_sure';

export interface UserProfile {
  id?: number;
  name: string;
  email?: string;
  age: string;
  gender: string;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  bloodGroup: string;
  diabetesType: DiabetesType;
  diabetesDurationYears: string;
  previousUlcer: boolean;
  symptoms: string;
  allergies: string;
  phone: string;
  emergencyContact: string;
}
