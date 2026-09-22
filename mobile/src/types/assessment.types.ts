import { SinbadClinicalData, SinbadResponse, TriageCategory } from './sinbad.types';

export type ScreeningResult = SinbadResponse;

export interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
}

export type SyncStatus = 'synced' | 'pending_upload';

export interface PatientRecord {
  id: string;
  reportNumber?: string;
  patientIdentifier: string;
  timestamp: string;
  imageUri: string;
  clinicalData: SinbadClinicalData;
  screeningResult: ScreeningResult;
  triageStatus: TriageCategory;
  location: GeoLocation | null;
  syncStatus: SyncStatus;
}
