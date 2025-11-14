import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLambert93ToWGS84Converter } from '@/modules/geo/client/helpers';
import { defineTilesGenerationStrategy, type ImportLayerConfig } from '@/modules/tiles/server/generation';
import { type DB, type DBTableName, kdb, sql } from '@/server/db/kysely';
import { processInParallel } from '@/utils/async';
import { fetchJSON } from '@/utils/network';
import { ogr2ogrConvertToGeoJSON, ogr2ogrExtractGeoJSONFromDatabaseTable, ogr2ogrExtractNDJSONFromDatabaseTable } from '@/utils/ogr2ogr';
import { runBash, writeLargeFile } from '@/utils/system';

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
export const extractGeoJSONFromDatabaseTable = (tableName: DBTableName) =>
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
      feature.id = undefined; // remove string id so that tippecanoe can generate a unique numeric id
    });
    const targetTilesFilePath = join(tempDirectory, 'tiles-features.geojson');
    await writeFile(targetTilesFilePath, JSON.stringify(geojson));
    return targetTilesFilePath;
  });

/**
 * Download JSON data from a URL, transform it to GeoJSON features with mapping
 * @param url - The URL to fetch the JSON data from
 * @param mapFilterFeature - Function to transform each JSON item to a GeoJSON Feature
 * @returns a function that will download, transform and save the GeoJSON file
 */
export const downloadJSONAndTransformToGeoJSON = <T>({
  url,
  mapFilterFeature,
}: {
  url: string;
  mapFilterFeature: (
    item: T,
    helpers: { convertLambert93ToWGS84: Awaited<ReturnType<typeof createLambert93ToWGS84Converter>> }
  ) => GeoJSON.Feature | null;
}) =>
  defineTilesGenerationStrategy(async ({ logger, tempDirectory }) => {
    const items = await fetchJSON<T[]>(url);
    logger.info(`Items downloaded`, { count: items.length });

    const convertLambert93ToWGS84 = await createLambert93ToWGS84Converter();

    const features = items.map((feature) => mapFilterFeature(feature, { convertLambert93ToWGS84 })).filter((feature) => feature !== null);
    logger.info(`Items mapped to features`, { count: features.length });

    const geojson: GeoJSON.FeatureCollection = {
      features,
      type: 'FeatureCollection',
    };

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
      output: targetTilesFilePath,
      shapefile: shapefilePath,
    });

    await ogr2ogrConvertToGeoJSON(targetTilesFilePath, shapefilePath);

    return targetTilesFilePath;
  } finally {
    // Nettoie le répertoire temporaire
    await runBash(`rm -rf "${tempDir}"`).catch((err) => {
      logger.warn('Erreur lors du nettoyage du répertoire temporaire', { error: err, tempDir });
    });
  }
});

/**
 * Generate a GeoJSON file from a SQL query
 * @param featureCollectionQuery - The SQL query to execute
 * @param featureMapFunction - A function to map the features
 * @returns a function that will generate a GeoJSON file from the SQL query
 */
export const generateGeoJSONFromSQLQuery = (
  featureCollectionQuery: string,
  featureMapFunction?: (feature: GeoJSON.Feature) => GeoJSON.Feature
) =>
  defineTilesGenerationStrategy(async ({ tempDirectory, logger }) => {
    const result = await sql.raw<any>(`${featureCollectionQuery}`).execute(kdb);

    const geojson = result.rows[0].geojson as GeoJSON.FeatureCollection;
    if (!geojson) {
      throw new Error("Pas d'objet GeoJSON retourné par la requête SQL");
    }
    logger.info(`Found ${geojson.features.length} features`);

    if (featureMapFunction) {
      geojson.features = geojson.features.map(featureMapFunction);
    }
    const targetTilesFilePath = join(tempDirectory, 'tiles-features.geojson');
    logger.info(`Writing ${geojson.features.length} features to ${targetTilesFilePath}`);

    // Write GeoJSON in streaming mode to avoid memory issues with large files
    const { sizeMB } = await writeLargeFile(targetTilesFilePath, geojson);

    logger.info(`Wrote ${targetTilesFilePath}`, { size: `${sizeMB} MB` });
    return targetTilesFilePath;
  });

/**
 * Extract a NDJSON file from a database table by processing it in chunks for better performance
 * @param tableName - The name of the database table
 * @param options - Configuration options for chunk processing
 * @returns a function that will extract the NDJSON file from the database table in chunks
 */
export const extractNDJSONFromDatabaseTable = <TableName extends DBTableName, Fields extends (keyof DB[TableName])[]>(
  tableName: TableName,
  options: {
    chunkSize?: number;
    maxConcurrency?: number;
    idField?: keyof DB[TableName] | 'id';
    fields?: Fields;
    where?: string;
  } = {}
) =>
  defineTilesGenerationStrategy(async ({ tempDirectory, logger }) => {
    const { chunkSize = 10000, maxConcurrency = availableParallelism(), idField = 'id' } = options;

    const targetTilesFilePath = join(tempDirectory, 'tiles-features.json');
    const chunksDir = join(tempDirectory, 'chunks');

    await mkdir(chunksDir, { recursive: true });

    // 1. Calcul des chunks
    logger.info('Calcul de la taille de la table et des chunks', { tableName });

    const { count, max_id } = await kdb
      .selectFrom(kdb.dynamic.table(tableName).as('t'))
      .select([sql<number>`COUNT(*)`.as('count'), sql<number>`MAX(${sql.ref(idField as string)})`.as('max_id')])
      .executeTakeFirstOrThrow();

    const totalChunks = Math.ceil(count / chunkSize);

    logger.info('Informations de la table', {
      chunkSize,
      maxId: max_id,
      tableName,
      totalChunks,
      totalRecords: count,
    });

    if (count === 0) {
      throw new Error(`La table ${tableName} est vide`);
    }

    const chunks = Array.from({ length: totalChunks }, (_, chunkIndex) => ({
      chunkFilePath: join(chunksDir, `features_${chunkIndex}.ndjson`),
      chunkIndex,
      endId: Math.min((chunkIndex + 1) * chunkSize, max_id),
      startId: chunkIndex * chunkSize + 1,
    }));

    // 2. Traitement des chunks en parallèle
    logger.info("Début de l'extraction des chunks", { maxConcurrency, totalChunks });
    await processInParallel(chunks, maxConcurrency, async ({ chunkIndex, startId, endId, chunkFilePath }) => {
      try {
        const start = Date.now();
        logger.info(`Traitement du chunk ${chunkIndex + 1}/${totalChunks}`, {
          chunkFilePath,
          endId,
          startId,
        });

        let whereClause = `${idField as string} BETWEEN ${startId} AND ${endId}`;
        if (options.where) {
          whereClause += ` AND ${options.where}`;
        }
        await ogr2ogrExtractNDJSONFromDatabaseTable(
          tableName,
          chunkFilePath,
          whereClause,
          options.fields?.map((field) => `"${field as string}"`).join(', ') || '*'
        );

        logger.info(`Chunk ${chunkIndex + 1} terminé`, { chunkFilePath, duration: Date.now() - start });
      } catch (error) {
        logger.error(`Erreur lors du traitement du chunk ${chunkIndex + 1}`, {
          endId,
          error: error instanceof Error ? error.message : String(error),
          startId,
        });
        throw error;
      }
    });

    // 3. Assemble tous les fichiers NDJSON en un seul fichier
    logger.info('Assemblage des fichiers NDJSON', { chunksCount: chunks.length, chunksDir });
    await runBash(`find "${chunksDir}" -name "features_*.ndjson" -exec cat {} + > "${targetTilesFilePath}"`);

    logger.info('Assemblage terminé', {
      outputFile: targetTilesFilePath,
    });

    return targetTilesFilePath;
  });

/**
 * Download JSON data from a URL, transform it to multiple GeoJSON files for different layers
 * @param url - The URL to fetch the JSON data from
 * @param layerConfigs - Array of layer configurations with their respective mapping functions
 * @returns a function that will download, transform and save multiple GeoJSON files
 */
export const downloadJSONAndTransformToMultipleGeoJSON = <T>({
  url,
  layerConfigs,
}: {
  url: string;
  layerConfigs: Array<{
    layerName: string;
    mapFilterFeature: (
      item: T,
      helpers: { convertLambert93ToWGS84: Awaited<ReturnType<typeof createLambert93ToWGS84Converter>> }
    ) => GeoJSON.Feature | null;
  }>;
}) =>
  defineTilesGenerationStrategy(async ({ logger, tempDirectory }) => {
    const items = await fetchJSON<T[]>(url);
    logger.info(`Items downloaded`, { count: items.length });

    const convertLambert93ToWGS84 = await createLambert93ToWGS84Converter();

    const layerFiles: ImportLayerConfig[] = [];

    for (const { layerName, mapFilterFeature } of layerConfigs) {
      const features = items
        .map((item) => mapFilterFeature(item, { convertLambert93ToWGS84 }))
        .filter((feature): feature is GeoJSON.Feature => feature !== null);

      logger.info(`Layer ${layerName}`, { featuresCount: features.length });

      const geojson: GeoJSON.FeatureCollection = {
        features,
        type: 'FeatureCollection',
      };

      const filePath = join(tempDirectory, `temp_${layerName}.geojson`);
      await writeFile(filePath, JSON.stringify(geojson));
      logger.info(`Wrote ${filePath}`, { featuresCount: features.length });

      layerFiles.push({ filePath, layerName });
    }

    return layerFiles;
  });
