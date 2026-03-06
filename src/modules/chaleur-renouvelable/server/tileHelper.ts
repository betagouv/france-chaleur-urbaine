import { gunzipSync } from 'zlib';

import { VectorTile } from '@mapbox/vector-tile';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import Protobuf from 'pbf';

import { getTile } from '@/modules/tiles/server/service';
import type { TileSourceId } from '@/modules/tiles/server/tiles.config';

type DecodedFeature = {
  id: number | string | undefined;
  properties: Record<string, unknown>;
  geojson: GeoJSON.Feature;
};

export function lonLatToTile(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z };
}

export function findFeatureContainingPoint(features: DecodedFeature[], lon: number, lat: number) {
  const pt = point([lon, lat]);

  return (
    features.find((feature) => {
      if (!feature.geojson?.geometry) return false;

      const geometry = feature.geojson.geometry;
      if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
        return false;
      }

      return booleanPointInPolygon(pt, geometry);
    }) ?? null
  );
}

export async function getFeatureAtPoint(sourceId: TileSourceId, lon: number, lat: number, z = 12) {
  const { x, y } = lonLatToTile(lon, lat, z);

  const tile = await getTile(sourceId, x, y, z);
  if (!tile) {
    return null;
  }

  const features = await decodeMvtTile({
    compressed: tile.compressed,
    data: tile.data,
    x,
    y,
    z,
  });
  // Il peut y avoir plusieurs features sur une même tile
  // On cherche donc à identifier quelle feature contient réellement notre point
  return findFeatureContainingPoint(features, lon, lat);
}

// Les tiles que l'on récupère de la BDD sont gzip, il faut donc les décompresser avant de lire leur propriété
export function decodeMvtTile({
  data,
  compressed,
  x,
  y,
  z,
}: {
  data: Buffer;
  compressed: boolean;
  x: number;
  y: number;
  z: number;
}): DecodedFeature[] {
  const raw = compressed ? gunzipSync(data) : data;

  const vt = new VectorTile(new Protobuf(raw));
  const layer = vt.layers.layer;

  if (!layer) {
    return [];
  }

  const features: DecodedFeature[] = [];
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);

    features.push({
      geojson: feature.toGeoJSON(x, y, z) as GeoJSON.Feature,
      id: feature.id,
      properties: feature.properties,
    });
  }

  return features;
}
