import { readFile } from 'node:fs/promises';

/**
 * Detect SRID from coordinates values
 * Lambert 93 (2154) coordinates are typically large numbers (6-7 digits)
 * WGS84 (4326) coordinates are between -180/180 for longitude and -90/90 for latitude
 */
function detectSrid(geometry: GeoJSON.Geometry): 4326 | 2154 {
  const coordinates = JSON.stringify((geometry as any).coordinates);
  // Check if any coordinate is outside WGS84 bounds
  const hasLargeCoordinates = coordinates.match(/[0-9]{6,}/) !== null;

  return hasLargeCoordinates ? 2154 : 4326;
}

type GeometryWithSrid = {
  geom: GeoJSON.Geometry;
  srid: 4326 | 2154;
};

/**
 * Read a GeoJSON file and return the unique geometry with its detected SRID.
 * Throws an error if the file contains multiple features or geometries.
 */
export async function readFileGeometry(fileName: string): Promise<GeometryWithSrid> {
  let geom = JSON.parse(await readFile(fileName, 'utf8')) as GeoJSON.FeatureCollection | GeoJSON.GeometryCollection | GeoJSON.Geometry;

  if (geom.type === 'FeatureCollection') {
    if (geom.features.length > 1) {
      throw new Error('Plusieurs features détectées');
    }
    geom = geom.features[0].geometry;
  }

  if (geom.type === 'GeometryCollection') {
    if (geom.geometries.length > 1) {
      throw new Error('Plusieurs géométries détectées');
    }
    geom = geom.geometries[0];
  }

  const srid = detectSrid(geom);

  console.info('Geometry type: %s (SRID: %s)', geom.type, srid);

  return {
    geom,
    srid,
  };
}
