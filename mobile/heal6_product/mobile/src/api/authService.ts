import { apiClient } from './client';
import { AppStorage } from '../services/appStorage';
import { UserProfile } from '../types/profile.types';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  authProvider: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const AuthService = {
  async testLogin(email: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/test-login', { email, password });
    await AppStorage.setToken(data.accessToken);
    return data;
  },

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/register', { email, password, name });
    await AppStorage.setToken(data.accessToken);
    return data;
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/google', { id_token: idToken });
    await AppStorage.setToken(data.accessToken);
    return data;
  },

  async getProfile(): Promise<UserProfile | null> {
    try {
      const { data } = await apiClient.get<UserProfile>('/api/v1/profile/me');
      return data;
    } catch {
      return null;
    }
  },

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>('/api/v1/profile/me', profile);
    return data;
  },

  async validateSession(): Promise<boolean> {
    try {
      await apiClient.get('/api/v1/profile/me');
      return true;
    } catch {
      return false;
    }
  },
};
