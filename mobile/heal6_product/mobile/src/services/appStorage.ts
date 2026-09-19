import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types/profile.types';

const TOKEN_KEY = '@heal6/access_token';
const PROFILE_KEY = '@heal6/profile';
const LANGUAGE_KEY = '@heal6/language';
const TUTORIAL_KEY = '@heal6/tutorial_complete';
const APPOINTMENT_KEY = '@heal6/last_appointment';

export type Language = 'english' | 'hindi' | 'odia';

export interface SavedAppointment {
  reason: string;
  date: string;
  notes?: string;
  timestamp: string;
}

export const AppStorage = {
  async getToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async setToken(token: string) {
    return AsyncStorage.setItem(TOKEN_KEY, token);
  },
  async clearAuth() {
    await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]);
  },
  async getProfile(): Promise<UserProfile | null> {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setProfile(profile: UserProfile) {
    return AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },
  async getLanguage(): Promise<Language> {
    return ((await AsyncStorage.getItem(LANGUAGE_KEY)) as Language | null) || 'english';
  },
  async setLanguage(language: Language) {
    return AsyncStorage.setItem(LANGUAGE_KEY, language);
  },
  async getTutorialComplete() {
    return (await AsyncStorage.getItem(TUTORIAL_KEY)) === 'true';
  },
  async setTutorialComplete(value = true) {
    return AsyncStorage.setItem(TUTORIAL_KEY, String(value));
  },
  async getLastAppointment(): Promise<SavedAppointment | null> {
    const raw = await AsyncStorage.getItem(APPOINTMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setLastAppointment(data: SavedAppointment) {
    return AsyncStorage.setItem(APPOINTMENT_KEY, JSON.stringify(data));
  },
};
