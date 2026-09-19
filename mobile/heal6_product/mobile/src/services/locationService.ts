import * as Location from 'expo-location';
import { GeoLocation } from '../types/assessment.types';

const NULL_LOCATION: GeoLocation = { latitude: null, longitude: null };

export const LocationService = {
  /**
   * Always resolves — never throws. Returns { latitude: null, longitude: null }
   * if permission is denied or location can't be acquired, so callers never
   * need to null-check before destructuring.
   */
  async getCurrentLocation(): Promise<GeoLocation> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return NULL_LOCATION;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[LocationService] failed to get location:', error);
      }
      return NULL_LOCATION;
    }
  },
};
