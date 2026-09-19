import { SinbadClinicalData, SinbadResponse } from '../types/sinbad.types';
import { PatientRecord } from '../types/assessment.types';

export const ROUTES = {
  AUTH: 'Auth',
  PROFILE_SETUP: 'ProfileSetup',
  MAIN_APP: 'MainApp',
  APPOINTMENT: 'Appointment',
  HOME: 'Home',
  SCAN: 'Scan',
  HISTORY: 'History',
  GUIDE: 'Guide',
  PROFILE: 'Profile',
  SCANNER_INSTRUCTIONS: 'ScannerInstructions',
  CAMERA_SCAN: 'CameraScan',
  IMAGE_REVIEW: 'ImageReview',
  CLINICAL_INTAKE: 'ClinicalIntake',
  ANALYSIS_LOADING: 'AnalysisLoading',
  RESULT_SUMMARY: 'ResultSummary',
} as const;

export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  MainApp: { screen?: keyof MainTabParamList } | undefined;
  Appointment: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Scan: { screen?: keyof ScanStackParamList } | undefined;
  History: undefined;
  Guide: undefined;
  Profile: undefined;
};

export type ScanStackParamList = {
  ScannerInstructions: undefined;
  CameraScan: undefined;
  ImageReview: { imageUri: string };
  ClinicalIntake: { imageUri: string };
  AnalysisLoading: { imageUri: string; patientId: string; clinicalData: SinbadClinicalData };
  ResultSummary: { record: PatientRecord; response: SinbadResponse };
};
