import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientRecord } from '../types/assessment.types';

const STORAGE_KEY = '@heal6/patient_records';

async function readAll(): Promise<PatientRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: PatientRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const OfflineStorage = {
  async getAllAssessments() {
    const records = await readAll();
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async saveAssessment(record: PatientRecord) {
    const records = await readAll();
    const next = records.filter((r) => r.id !== record.id);
    next.push(record);
    await writeAll(next);
  },
  async clearAll() { await AsyncStorage.removeItem(STORAGE_KEY); },
};
