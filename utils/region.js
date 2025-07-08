import * as Location from 'expo-location';
import { logDev } from './logger';

const REGION_PACKS = {
  IN: ['32'], // Snakes & Ladders
  JP: ['9'],  // Gomoku
};

export async function getRegionPack() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return [];
    const loc = await Location.getCurrentPositionAsync({});
    const [geo] = await Location.reverseGeocodeAsync(loc.coords);
    const code = geo.isoCountryCode?.toUpperCase();
    if (!code) return [];
    return REGION_PACKS[code] || [];
  } catch (e) {
    logDev('Failed to fetch region pack', e);
    return [];
  }
}
