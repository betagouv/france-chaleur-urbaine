import { readFile } from 'node:fs/promises';

import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

export type GeometryWithSrid = {
  geom: GeoJSON.Geometry;
  srid: 4326 | 2154;
};

/**
 * Maps GeoJSON geometry type to PostGIS dimension for ST_CollectionExtract.
 * See https://postgis.net/docs/ST_CollectionExtract.html
 * @param geometryType - The GeoJSON geometry type
 * @returns The dimension (1 for Point, 2 for LineString, 3 for Polygon)
 */
function getGeometryDimension(geometryType: GeoJSON.Geometry['type']): 1 | 2 | 3 {
  switch (geometryType) {
    case 'Point':
    case 'MultiPoint':
      return 1;
    case 'LineString':
    case 'MultiLineString':
      return 2;
    case 'Polygon':
    case 'MultiPolygon':
      return 3;
    default:
      throw new Error(`Unsupported geometry type: ${geometryType}`);
  }
}

/**
 * Create a SQL expression to transform a GeoJSON geometry into a PostGIS geometry.
 * Also validates and fixes the geometry using ST_MakeValid with ST_CollectionExtract based on the geometry type.
 * Applies ST_Force2D to ensure 2D geometries.
 * @param geom - The GeoJSON geometry
 * @param srid - The SRID (4326 or 2154)
 * @returns A SQL expression that creates a valid, properly extracted, and 2D PostGIS geometry
 */
export function createGeometryExpression(geom: GeoJSON.Geometry, srid: number) {
  const dim = getGeometryDimension(geom.type);
  const fixed2dExtract = sql<string>`
    ST_CollectionExtract(
      ST_MakeValid(
        ST_Force2D(
          ST_GeomFromGeoJSON(${sql.lit(JSON.stringify(geom))})
        )
      ),
      ${dim}
    )
  `;
  return srid === 4326 ? sql<any>`st_transform(${fixed2dExtract}, 2154)` : sql<any>`st_setsrid(${fixed2dExtract}, 2154)`;
}

/**
 * Process a GeoJSON geometry and return it with its detected SRID.
 * Handles FeatureCollection, GeometryCollection, and converts single geometries to multi-geometries.
 */
export async function processGeometry(
  geometry: GeoJSON.FeatureCollection | GeoJSON.GeometryCollection | GeoJSON.Geometry
): Promise<GeometryWithSrid> {
  let geom = geometry;

  if (geom.type === 'FeatureCollection') {
    if (geom.features.length > 1) {
      logger.debug('Multiple features detected. Will merging them into one geometry');
      geom = await mergeGeoJSONFeaturesGeometries(geom);
    } else {
      geom = geom.features[0].geometry;
    }
  }

  if (geom.type === 'GeometryCollection') {
    if (geom.geometries.length > 1) {
      throw new Error('Plusieurs géométries détectées');
    }
    geom = geom.geometries[0];
  }

  // convert to multi-geometry if needed
  if (geom.type === 'LineString') {
    geom = {
      coordinates: [geom.coordinates],
      type: 'MultiLineString',
    };
  } else if (geom.type === 'Polygon') {
    geom = {
      coordinates: [geom.coordinates],
      type: 'MultiPolygon',
    };
  }

  const srid = detectSrid(geom);

  logger.debug('Geometry type', { srid, type: geom.type });

  return {
    geom,
    srid,
  };
}

/**
 * Read a GeoJSON file and return the unique geometry with its detected SRID.
 * Throws an error if the file contains multiple features or geometries.
 */
export async function readFileGeometry(fileName: string): Promise<GeometryWithSrid> {
  const geometry = JSON.parse(await readFile(fileName, 'utf8')) as
    | GeoJSON.FeatureCollection
    | GeoJSON.GeometryCollection
    | GeoJSON.Geometry;
  return processGeometry(geometry);
}

/**
 * Merge multiple GeoJSON features into a single geometry
 * @param geoJson - The GeoJSON feature collection to merge
 * @returns A promise that resolves to the merged GeoJSON geometry
 */
async function mergeGeoJSONFeaturesGeometries(geoJson: GeoJSON.FeatureCollection): Promise<GeoJSON.Geometry> {
  const srid = geoJson.features.length > 0 ? detectSrid(geoJson.features[0].geometry) : 4326;

  const res = await kdb
    .with('features', (db) => {
      const featuresJson = JSON.stringify(geoJson.features);
      return db.selectNoFrom(sql<any>`jsonb_array_elements(${featuresJson}::jsonb)`.as('feature'));
    })
    .with('geometries', (db) =>
      db
        .selectFrom('features')
        .select(
          srid === 4326
            ? sql<any>`st_transform(ST_GeomFromGeoJSON(features.feature->>'geometry'), 2154)`.as('geom')
            : sql<any>`st_setsrid(ST_GeomFromGeoJSON(features.feature->>'geometry'), 2154)`.as('geom')
        )
    )
    .with('merged', (db) => db.selectFrom('geometries').select(sql<any>`st_multi(st_union(array_agg(geom)))`.as('merged_geom')))
    .selectFrom('merged')
    .select(sql<string>`st_asgeojson(st_transform(merged.merged_geom, 4326))`.as('geojson'))
    .executeTakeFirstOrThrow();

  return JSON.parse(res.geojson) as GeoJSON.Geometry;
}

/**
 * Detect SRID from coordinates values
 * Lambert 93 (2154) coordinates are typically large numbers (6-7 digits)
 * WGS84 (4326) coordinates are between -180/180 for longitude and -90/90 for latitude
 */
export function detectSrid(geom: GeoJSON.Geometry): 4326 | 2154 {
  const checkCoordinates = (coords: number[]) => {
    return Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90 ? 4326 : 2154;
  };

  switch (geom.type) {
    case 'Point':
      return checkCoordinates(geom.coordinates);
    case 'LineString':
    case 'MultiPoint':
      return checkCoordinates(geom.coordinates[0]);
    case 'Polygon':
    case 'MultiLineString':
      return checkCoordinates(geom.coordinates[0][0]);
    case 'MultiPolygon':
      return checkCoordinates(geom.coordinates[0][0][0]);
    default:
      throw new Error('Unsupported geometry type');
  }
}
