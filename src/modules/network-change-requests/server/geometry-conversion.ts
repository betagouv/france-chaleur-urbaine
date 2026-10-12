import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { processGeometryToWgs84 } from '@/modules/geo/server/helpers';
import { ogr2ogrConvertToGeoJSON } from '@/utils/ogr2ogr';

export type GeoSourceFile = { content: Buffer; filename: string };

export type GeoConversionResult = {
  geometry: GeoJSON.Geometry;
  /** files ogr2ogr could not read, left out of the geometry (public upload: one bad file must not block the others) */
  skippedFiles: { filename: string; error: string }[];
};

// formats ogr2ogr reads directly; shapefile parts (.shx, .dbf, .prj, .cpg) are picked up next to their .shp (a missing
// .shx index is rebuilt, see `runGdal`)
const convertibleExtensions = ['.geojson', '.json', '.kml', '.kmz', '.gpkg', '.shp', '.zip'];

// staged under a plain name (no space or special character), GDAL being picky with some of them
const sanitizeName = (filename: string) => filename.replace(/[^A-Za-z0-9._-]/g, '_');

/**
 * Converts the geo files uploaded for one role (trace or PDP) into a single WGS84 GeoJSON geometry, with ogr2ogr in a
 * temporary directory. The files of a shapefile must be given together (same base name). A file ogr2ogr cannot read is
 * skipped (reported in `skippedFiles`) as long as another one gives a geometry. Throws with a French message meant for
 * the admin when nothing usable is found, naming each file that failed.
 */
export const convertGeoFilesToGeometry = async (files: GeoSourceFile[]): Promise<GeoConversionResult> => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'request-geometry-'));
  try {
    await Promise.all(files.map((file) => writeFile(path.join(tempDir, sanitizeName(file.filename)), file.content)));
    const inputs = files
      .map((file) => ({ name: sanitizeName(file.filename), original: file.filename }))
      .filter((input) => convertibleExtensions.includes(path.extname(input.name).toLowerCase()));
    if (inputs.length === 0) {
      throw new Error('Aucun fichier géographique exploitable (GeoJSON, KML, KMZ, GeoPackage, Shapefile ou archive zip)');
    }

    const features: GeoJSON.Feature[] = [];
    const skippedFiles: GeoConversionResult['skippedFiles'] = [];
    // sequential: one ogr2ogr process at a time
    for (const [index, { name, original }] of inputs.entries()) {
      const stagedPath = path.join(tempDir, name);
      const input = name.toLowerCase().endsWith('.zip') ? `/vsizip/${stagedPath}` : stagedPath;
      const output = path.join(tempDir, `output-${index}.geojson`);
      try {
        // public upload: a pathological file must not block the single job worker
        await ogr2ogrConvertToGeoJSON(input, output, { timeoutMs: 2 * 60 * 1000 });
        const collection = JSON.parse(await readFile(output, 'utf8')) as GeoJSON.FeatureCollection;
        features.push(...collection.features.filter((feature) => feature.geometry));
      } catch (error) {
        // the GDAL message names the staged path: shown to the admin under the original file name
        const message = (error instanceof Error ? error.message : String(error)).replaceAll(`${tempDir}/`, '');
        skippedFiles.push({ error: message, filename: original });
      }
    }
    if (features.length === 0) {
      throw new Error(
        skippedFiles.length > 0
          ? `Aucun fichier lisible : ${skippedFiles.map((file) => `${file.filename} (${file.error})`).join(' ; ')}`
          : 'Aucune géométrie trouvée dans les fichiers transmis'
      );
    }
    // ogr2ogr reprojects when the projection is declared (.prj, crs); a Lambert 93 file without it is caught here
    return { geometry: await processGeometryToWgs84({ features, type: 'FeatureCollection' }), skippedFiles };
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
};
