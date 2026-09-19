export type SiteValue = 'forefoot' | 'midfoot' | 'none';
export type IschemiaValue = 'normal_pulse' | 'reduced_or_absent';
export type NeuropathyValue = 'protective_sensation_intact' | 'loss_of_sensation';
export type InfectionValue = 'none' | 'present';
export type AreaValue = 'less_than_1cm' | 'greater_or_equal_1cm';
export type DepthValue = 'superficial' | 'deep_ulcer_or_bone';

export interface SinbadClinicalData {
  site: SiteValue;
  ischemia: IschemiaValue;
  neuropathy: NeuropathyValue;
  bacterialInfection: InfectionValue;
  area: AreaValue;
  depth: DepthValue;
  has_infection?: boolean;
  has_neuropathy?: boolean;
  symptomFlags?: Record<string, boolean>;
}

export type TriageCategory = 'LOW_CONCERN' | 'ATTENTION_RECOMMENDED' | 'URGENT_ATTENTION';

export interface ClinicalRequest {
  patientIdentifier: string;
  image: { uri: string; type: string; name: string };
  clinicalData: SinbadClinicalData;
  latitude?: number;
  longitude?: number;
}

export interface UserProfileContract {
  name: string;
  age: string;
  gender: string;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  bloodGroup: string;
  diabetesType: string;
  diabetesDurationYears: string;
  previousUlcer: boolean;
  symptoms: string;
  allergies: string;
  phone: string;
  emergencyContact: string;
}

export interface ScreeningBreakdown {
  totalScore: number;
  maxPossibleScore: number;
  category: TriageCategory;
  siteScore: number;
  ischemiaScore: number;
  neuropathyScore: number;
  infectionScore: number;
  areaScore: number;
  depthScore: number;
}

export interface ScreeningDiagnostics {
  task1Classification: string;
  convnextConfidence: number;
  infectionRiskPercent: number;
  calculatedAreaCm2: number;
  arucoDetected: boolean;
  pixelsPerCm: number;
  coveragePercentage: number;
  woundDetected: boolean;
  tissueBreakdown: { granulation: number; slough: number; necrotic: number };
  maskImageBase64: string;
  volumetric?: {
    max_depth_mm?: number;
    mean_depth_mm?: number;
    wound_volume_cm3?: number;
    depth_classification?: string;
  };
  modelWarnings?: string[];
}

export interface ScreeningProtocol {
  recommendation: string;
  actionDeadline: string;
  doctorFeedback: string;
  medications: string[];
}

export interface SinbadResponse {
  assessmentId: string;
  reportNumber?: string;
  triageCategory: TriageCategory;
  riskLevel?: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  severityTier?: string;
  sinbadBreakdown: ScreeningBreakdown;
  findings: string[];
  recommendedActions: string[];
  requiresSpecialistEscalation: boolean;
  generatedAt: string;
  profile?: UserProfileContract;
  aiDiagnostics?: ScreeningDiagnostics;
  clinicalProtocol?: ScreeningProtocol;
  pdfUrl?: string;
}
