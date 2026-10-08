import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { processGeometryToWgs84 } from '@/modules/geo/server/helpers';
import { ogr2ogrConvertToGeoJSON } from '@/utils/ogr2ogr';

export type GeoSourceFile = { content: Buffer; filename: string };

// formats ogr2ogr reads directly; shapefile parts (.shx, .dbf, .prj, .cpg) are picked up next to their .shp (a missing
// .shx index is rebuilt, see `runGdal`)
const convertibleExtensions = ['.geojson', '.json', '.kml', '.kmz', '.gpkg', '.shp', '.zip'];

// staged under a plain name (no space or special character), GDAL being picky with some of them
const sanitizeName = (filename: string) => filename.replace(/[^A-Za-z0-9._-]/g, '_');

/**
 * Converts the geo files uploaded for one role (trace or PDP) into a single WGS84 GeoJSON geometry, with ogr2ogr in a
 * temporary directory. The files of a shapefile must be given together (same base name). Throws with a French message
 * meant for the admin when nothing usable is found.
 */
export const convertGeoFilesToGeometry = async (files: GeoSourceFile[]): Promise<GeoJSON.Geometry> => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'request-geometry-'));
  try {
    await Promise.all(files.map((file) => writeFile(path.join(tempDir, sanitizeName(file.filename)), file.content)));
    const inputs = files
      .map((file) => sanitizeName(file.filename))
      .filter((name) => convertibleExtensions.includes(path.extname(name).toLowerCase()));
    if (inputs.length === 0) {
      throw new Error('Aucun fichier géographique exploitable (GeoJSON, KML, KMZ, GeoPackage, Shapefile ou archive zip)');
    }

    const features: GeoJSON.Feature[] = [];
    // sequential: one ogr2ogr process at a time
    for (const [index, name] of inputs.entries()) {
      const stagedPath = path.join(tempDir, name);
      const input = name.toLowerCase().endsWith('.zip') ? `/vsizip/${stagedPath}` : stagedPath;
      const output = path.join(tempDir, `output-${index}.geojson`);
      // public upload: a pathological file must not block the single job worker
      await ogr2ogrConvertToGeoJSON(input, output, { timeoutMs: 2 * 60 * 1000 });
      const collection = JSON.parse(await readFile(output, 'utf8')) as GeoJSON.FeatureCollection;
      features.push(...collection.features.filter((feature) => feature.geometry));
    }
    if (features.length === 0) {
      throw new Error('Aucune géométrie trouvée dans les fichiers transmis');
    }
    // ogr2ogr reprojects when the projection is declared (.prj, crs); a Lambert 93 file without it is caught here
    return await processGeometryToWgs84({ features, type: 'FeatureCollection' });
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
};
