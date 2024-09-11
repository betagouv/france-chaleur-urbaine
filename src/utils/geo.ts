import { round } from '@turf/helpers';

/**
 * Pretty format a distance in meters or kilometers.
 */
export function formatDistance(distance: number): string {
  if (distance < 2000) {
    return `${round(distance)} m`;
  }
  return `${round(distance / 1000, 2)} km`;
}
