import { round } from '@turf/helpers';
import kinks from '@turf/kinks';

import type { BoundingBox } from '../types';

export const longitudeColumnNameCandidates = ['x', 'lon', 'longitude'] as const;
export const latitudeColumnNameCandidates = ['y', 'lat', 'latitude'] as const;

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
    coordinates: [coordinates],
    type: 'Polygon',
  });
  return selfIntersections.length === 0;
}

export const getReadableDistance = (distance?: number | null) => {
  if (distance === null || distance === undefined) {
    return '';
  }

  if (distance < 1) {
    return "< 1m à vol d'oiseau";
  }
  if (distance >= 1000) {
    return `${distance / 1000}km à vol d'oiseau`;
  }
  return `${distance}m à vol d'oiseau`;
};

/**
 * Vérifie si un GeoJSON utilise la projection Lambert-93 (EPSG:2154).
 * @param geojson - L'objet GeoJSON à vérifier.
 * @returns `true` si la projection est Lambert-93, sinon `false`.
 */
export const hasLambert93Projection = (geojson: any): boolean => geojson.crs?.properties?.name?.includes('2154');

/**
 * Convertit un objet GeoJSON de la projection Lambert-93 (EPSG:2154) vers WGS84 (EPSG:4326).
 * @param geojson - L'objet GeoJSON à convertir.
 * @returns Le GeoJSON converti en EPSG:4326.
 */
export const convertLambert93GeoJSONToWGS84 = async (geojson: any): Promise<any> => {
  const proj4 = (await import('proj4')).default; // Import dynamique du module

  // Définition de la projection Lambert-93 (EPSG:2154)
  proj4.defs(
    'EPSG:2154',
    '+proj=lcc +lat_1=49.000000000 +lat_2=44.000000000 +lat_0=46.500000000 +lon_0=3.000000000 +x_0=700000.000 +y_0=6600000.000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  );

  const convertCoordinates = (coords: any, from: string, to: string): any => {
    if (Array.isArray(coords[0])) {
      return coords.map((coord: any) => convertCoordinates(coord, from, to));
    }
    return proj4(from, to, coords);
  };

  return {
    ...geojson,
    crs: { properties: { name: 'EPSG:4326' }, type: 'name' },
    features: geojson.features
      .filter((feature: any) => feature.geometry !== null)
      .map((feature: any) => ({
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: convertCoordinates(feature.geometry.coordinates, 'EPSG:2154', 'EPSG:4326'),
        },
      })),
  };
};

// Format: "BOX(3.385585947402232 47.35474249860378,3.38691096486787 47.35645923457523)"
export const parseBbox = (bbox: string): BoundingBox => {
  const [min, max] = bbox.slice(4, -1).split(',');
  const [minX, minY] = min.split(' ').map(Number);
  const [maxX, maxY] = max.split(' ').map(Number);
  return [minX, minY, maxX, maxY];
};
