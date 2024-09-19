import { round } from '@turf/helpers';

/**
 * Pretty format a distance in meters or kilometers.
 */
export function formatDistance(distance: number): string {
  if (distance < 0) {
    throw new Error('Distance cannot be negative');
  }

  if (distance < 2000) {
    return `${round(distance).toLocaleString()} m`;
  }

  return `${round(distance / 1000, 2).toLocaleString()} km`;
}
