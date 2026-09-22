import { Platform } from 'react-native';
import { apiClient } from './client';
import { ClinicalRequest, SinbadResponse } from '../types/sinbad.types';

export const ScreeningService = {
  async submit(request: ClinicalRequest): Promise<SinbadResponse> {
    const formData = new FormData();

    // Cross-platform image payload construction
    if (Platform.OS === 'web') {
      try {
        const fetchRes = await fetch(request.image.uri);
        const blob = await fetchRes.blob();
        formData.append('image', blob, request.image.name || 'foot_scan.jpg');
      } catch {
        // Fallback for standard web uri
        formData.append('image', {
          uri: request.image.uri,
          type: request.image.type || 'image/jpeg',
          name: request.image.name || 'foot_scan.jpg',
        } as any);
      }
    } else {
      // React Native Android/iOS native file descriptor
      const fileUri =
        Platform.OS === 'android'
          ? request.image.uri
          : request.image.uri.replace('file://', '');

      formData.append('image', {
        uri: fileUri,
        type: request.image.type || 'image/jpeg',
        name: request.image.name || 'foot_scan.jpg',
      } as any);
    }

    formData.append('patient_identifier', request.patientIdentifier);
    formData.append('clinical_data', JSON.stringify(request.clinicalData));
    if (request.latitude !== undefined) formData.append('latitude', String(request.latitude));
    if (request.longitude !== undefined) formData.append('longitude', String(request.longitude));

    // CRITICAL: Do NOT set 'Content-Type': 'multipart/form-data' explicitly in headers!
    // Doing so overrides and strips the boundary string in React Native / Axios.
    const { data } = await apiClient.post<SinbadResponse>('/api/v1/screenings', formData, {
      headers: {
        'Accept': 'application/json',
      },
      transformRequest: [(data) => data],
      timeout: 60000,
    });
    return data;
  },
  async listReports(): Promise<SinbadResponse[]> {
    const { data } = await apiClient.get<SinbadResponse[]>('/api/v1/reports');
    return data;
  },
  getPdfUrl(reportNumber: string, token?: string) {
    return `${apiClient.defaults.baseURL}/api/v1/reports/${encodeURIComponent(reportNumber)}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  async getPdfLink(reportNumber: string): Promise<string> {
    const { data } = await apiClient.get<{ url: string }>(`/api/v1/reports/${encodeURIComponent(reportNumber)}/pdf-link`);
    return data.url;
  },
  async getLatestDoctorReview(): Promise<{
    hasReview: boolean;
    patientIdentifier?: string;
    reportNumber?: string;
    physicianName?: string;
    doctorNotes?: string;
    reviewStatus?: string;
    prescriptions?: string[];
    precautions?: string[];
    followUpDate?: string;
    callBackDays?: number;
    verifiedAt?: string;
  }> {
    try {
      const { data } = await apiClient.get<any>('/api/v1/screenings/latest-review');
      return data;
    } catch {
      return { hasReview: false };
    }
  },
};
