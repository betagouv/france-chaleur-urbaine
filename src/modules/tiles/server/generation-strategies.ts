import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sql } from 'kysely';

import { defineTilesGenerationStrategy } from '@/modules/tiles/server/generation';
import { type DB, kdb } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';
import { ogr2ogrConvertToGeoJSON, ogr2ogrExtractGeoJSONFromDatabaseTable } from '@/utils/ogr2ogr';
import { runBash } from '@/utils/system';

export const getInputFilePath = defineTilesGenerationStrategy(async ({ inputFilePath }) => {
  if (!inputFilePath) {
    throw new Error('Vous devez fournir un fichier source');
  }
  return inputFilePath;
});

/**
 * Extract a GeoJSON file from a database table
 * @param tableName - The name of the database table
 * @returns a function that will extract the GeoJSON file from the database table
 */
export const extractGeoJSONFromDatabaseTable = (tableName: keyof DB) =>
  defineTilesGenerationStrategy(async ({ tempDirectory }) => {
    const targetTilesFilePath = join(tempDirectory, 'tiles-features.geojson');
    await ogr2ogrExtractGeoJSONFromDatabaseTable(tableName, targetTilesFilePath);
    return targetTilesFilePath;
  });

/**
 * Generate a GeoJSON file from a URL
 * @param url - The URL to the GeoJSON file
 * @returns a function that will download and save the GeoJSON file from the URL
 */
export const downloadGeoJSONFromURL = (url: string) =>
  defineTilesGenerationStrategy(async ({ logger, tempDirectory }) => {
    const geojson = await fetchJSON<GeoJSON.FeatureCollection>(url);
    const featuresCount = geojson.features?.length || 0;
    logger.info(`Features downloaded`, { count: featuresCount });
    geojson.features.forEach((feature: any) => {
      delete feature.id; // remove string id so that tippecanoe can generate a unique numeric id
    });
    const targetTilesFilePath = join(tempDirectory, 'tiles-features.geojson');
    await writeFile(targetTilesFilePath, JSON.stringify(geojson));
    return targetTilesFilePath;
  });

/**
 * Extract a shapefile from a ZIP file and convert it to a GeoJSON file
 * @returns The path to the generated GeoJSON file
 */
export const extractZippedShapefileToGeoJSON = defineTilesGenerationStrategy(async ({ tempDirectory, logger, inputFilePath }) => {
  if (!inputFilePath) {
    throw new Error('Vous devez fournir une archive source');
  }
  const targetTilesFilePath = join(tempDirectory, 'tiles-features.geojson');

  const tempDir = await mkdtemp(join(tmpdir(), 'zip-extract-'));

  try {
    logger.info('Extraction du fichier ZIP', { inputFilePath, tempDir });

    await runBash(`unzip -o "${inputFilePath}" -d "${tempDir}"`);

    const findShapefile = async (dir: string): Promise<string | null> => {
      const files = await readdir(dir, { withFileTypes: true });

      // search in current directory
      const shpFile = files.find((file) => !file.isDirectory() && file.name.endsWith('.shp'));
      if (shpFile) {
        return join(dir, shpFile.name);
      }

      // search in subdirectories
      for (const file of files) {
        if (file.isDirectory()) {
          const result = await findShapefile(join(dir, file.name));
          if (result) return result;
        }
      }

      return null;
    };

    const shapefilePath = await findShapefile(tempDir);

    if (!shapefilePath) {
      throw new Error('Aucun fichier shapefile (.shp) trouvé dans le ZIP');
    }

    logger.info('Conversion du shapefile en GeoJSON', {
      shapefile: shapefilePath,
      output: targetTilesFilePath,
    });

    await ogr2ogrConvertToGeoJSON(targetTilesFilePath, shapefilePath);

    return targetTilesFilePath;
  } finally {
    // Nettoie le répertoire temporaire
    await runBash(`rm -rf "${tempDir}"`).catch((err) => {
      logger.warn('Erreur lors du nettoyage du répertoire temporaire', { tempDir, error: err });
    });
  }
});

/**
 * Generate a GeoJSON file from a SQL query
 * @param featureCollectionQuery - The SQL query to execute
 * @param featureMapFunction - A function to map the features
 * @returns a function that will generate a GeoJSON file from the SQL query
 */
export const fromSQLQuery = (featureCollectionQuery: string, featureMapFunction?: (feature: GeoJSON.Feature) => GeoJSON.Feature) =>
  defineTilesGenerationStrategy(async ({ tempDirectory, logger }) => {
    const result = await sql<any>`${featureCollectionQuery}`.execute(kdb);

    const geojson = result.rows[0].geojson as GeoJSON.FeatureCollection;
    if (!geojson) {
      throw new Error("Pas d'objet GeoJSON retourné par la requête SQL");
    }
    logger.info(`Found ${geojson.features.length} features`);

    if (featureMapFunction) {
      geojson.features = geojson.features.map(featureMapFunction);
    }
    const targetTilesFilePath = join(tempDirectory, 'tiles-features.geojson');
    await writeFile(targetTilesFilePath, JSON.stringify(geojson));
    return targetTilesFilePath;
  });
