import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientRecord } from '../types/assessment.types';
import { AppStorage } from './appStorage';

const STORAGE_PREFIX = '@heal6/patient_records_';

async function resolveStorageKey(userIdentifier?: string | null): Promise<string> {
  if (userIdentifier && userIdentifier.trim().length > 0) {
    const sanitized = userIdentifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${STORAGE_PREFIX}${sanitized}`;
  }
  try {
    const profile = await AppStorage.getProfile();
    if (profile?.email) {
      const sanitized = profile.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      return `${STORAGE_PREFIX}${sanitized}`;
    }
  } catch {}
  return `${STORAGE_PREFIX}guest`;
}

async function readAll(key: string): Promise<PatientRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(key: string, records: PatientRecord[]) {
  await AsyncStorage.setItem(key, JSON.stringify(records));
}

export const OfflineStorage = {
  async getAllAssessments(userIdentifier?: string | null): Promise<PatientRecord[]> {
    const key = await resolveStorageKey(userIdentifier);
    const records = await readAll(key);
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async saveAssessment(record: PatientRecord, userIdentifier?: string | null) {
    const key = await resolveStorageKey(userIdentifier || record.patientIdentifier);
    const records = await readAll(key);
    const next = records.filter((r) => r.id !== record.id && r.reportNumber !== record.reportNumber);
    next.push(record);
    await writeAll(key, next);
  },
  async clearUserAssessments(userIdentifier?: string | null) {
    const key = await resolveStorageKey(userIdentifier);
    await AsyncStorage.removeItem(key);
  },
  async clearAll() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const recordKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX) || k === '@heal6/patient_records');
      if (recordKeys.length > 0) {
        await AsyncStorage.multiRemove(recordKeys);
      }
    } catch {}
  },
};
