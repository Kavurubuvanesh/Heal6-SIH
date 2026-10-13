import axios from 'axios';
import { Platform } from 'react-native';
import { AppStorage } from '../services/appStorage';

const CURRENT_HOST_IP = '10.21.55.108';

// Automatic platform-aware base URL fallback with LAN and emulator failover
const getDefaultBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (url) {
    if (url.includes(':8001')) {
      url = url.replace(':8001', ':8000');
    }
    if (url.includes('10.240.17.113') || url.includes('10.20.51.53')) {
      url = url.replace(/10\.(240\.17\.113|20\.51\.53)/, CURRENT_HOST_IP);
    }
    return url;
  }
  // Web browser access
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  // Android Emulator uses 10.0.2.2 to reach host machine loopback, or LAN IP for physical device
  if (Platform.OS === 'android') {
    return `http://${CURRENT_HOST_IP}:8000`;
  }
  // iOS Simulator / Physical Devices
  return `http://${CURRENT_HOST_IP}:8000`;
};

export const API_BASE_URL = getDefaultBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AppStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      console.log(`[Heal6 Network Status] Backend connection at ${API_BASE_URL} unavailable; engaging offline cache.`);
    }
    return Promise.reject(error);
  }
);

/**
 * Diagnostic helper to ping backend health
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await apiClient.get('/api/v1/health', { timeout: 4000 });
    return res.data?.status === 'ONLINE';
  } catch {
    return false;
  }
};
