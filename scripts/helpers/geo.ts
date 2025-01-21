import { readFile } from 'node:fs/promises';

export async function readFileGeometry(fileName: string): Promise<GeoJSON.Geometry> {
  let geom = JSON.parse(await readFile(fileName, 'utf8')) as GeoJSON.GeometryCollection | GeoJSON.Geometry;
  if (geom.type === 'GeometryCollection') {
    if (geom.geometries.length > 1) {
      throw new Error('Plusieurs géométries détectées');
    }
    geom = geom.geometries[0];
  }
  return geom;
}
