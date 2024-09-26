import { round } from '@turf/helpers';
import kinks from '@turf/kinks';

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

/**
 * Check if 2 points are equal
 * @returns true if they're the same, false otherwise
 */
export function pointsEqual([lon1, lat1]: GeoJSON.Position, [lon2, lat2]: GeoJSON.Position): boolean {
  return lon1 === lon2 && lat1 === lat2;
}

/**
 * Validate the geometry of a polygon for self-intersections.
 * Also removes the duplicate point (n-1) if equal to the point (n-2) added by mapdraw-gl.
 *
 * Detail : When the feature is being finished by double-click, there are duplicate points (n-2) and (n-1).
 * Note that (n) is the same as (0) in a polygon.
 * We clean the polygon so that kinks does not return this point.
 */
export function validatePolygonGeometry(coordinates: GeoJSON.Position[]): boolean {
  const n = coordinates.length;

  if (n > 2 && pointsEqual(coordinates[n - 3], coordinates[n - 2])) {
    coordinates.splice(n - 2, 1);
  }
  const { features: selfIntersections } = kinks({
    type: 'Polygon',
    coordinates: [coordinates],
  });
  return selfIntersections.length === 0;
}
