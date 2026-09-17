/** biome-ignore-all lint/suspicious/noConfusingVoidType: false positive, typescript prefers void */
import { serverConfig } from '@/server/config';
import type { DB } from '@/server/db/kysely';
import { type CommandResult, type RunCommandOptions, runBash } from '@/utils/system';

/**
 * Exécute une commande ogr2ogr
 *
 * @param args - Arguments à passer à ogr2ogr
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout quand la commande se termine
 */
export function runOgr2ogr(command: string, options: RunCommandOptions = {}): Promise<CommandResult> {
  return runBash(`ogr2ogr ${command}`, options);
}

export async function ogr2ogrImportGeoJSONToDatabaseTable(
  inputFilePath: string,
  tableName: keyof DB,
  ogr2ogrOptions: string,
  options: RunCommandOptions = {}
): Promise<CommandResult | void> {
  await runOgr2ogr(
    `-f PostgreSQL ${pgUrlToGdal(serverConfig.DATABASE_URL)} ${inputFilePath} -nln ${tableName} -lco GEOMETRY_NAME=geom -t_srs EPSG:2154 -overwrite ${ogr2ogrOptions}`,
    options
  );
}

export async function ogr2ogrExtractGeoJSONFromDatabaseTable(
  tableName: keyof DB,
  outputFilePath: string,
  options: RunCommandOptions = {}
): Promise<CommandResult | void> {
  await runOgr2ogr(`-f GeoJSON ${outputFilePath} ${pgUrlToGdal(serverConfig.DATABASE_URL)} ${tableName} -t_srs EPSG:4326`, options);
}

export async function ogr2ogrConvertToGeoJSON(
  inputFilePath: string,
  outputFilePath: string,
  options: RunCommandOptions = {}
): Promise<CommandResult | void> {
  const layers = await listNonEmptyLayers(inputFilePath);
  if (layers.length <= 1) {
    await runOgr2ogr(`-f GeoJSON ${outputFilePath} ${inputFilePath} -t_srs EPSG:4326`, options);
  } else {
    // KML (and other multi-layer formats): GeoJSON only supports one layer per file.
    // Convert the first layer normally, then append the rest under the same layer name.
    const [first, ...rest] = layers;
    await runOgr2ogr(`-f GeoJSON ${outputFilePath} ${inputFilePath} "${first}" -t_srs EPSG:4326 -nlt GEOMETRY`, options);
    for (const layer of rest) {
      await runOgr2ogr(
        `-f GeoJSON -update -append ${outputFilePath} ${inputFilePath} "${layer}" -t_srs EPSG:4326 -nlt GEOMETRY -nln "${first}"`,
        options
      );
    }
  }
}

/**
 * Returns the names of layers that contain at least one feature.
 * Skips empty layers (e.g. LIBKML metadata containers named after the source file).
 */
async function listNonEmptyLayers(filePath: string): Promise<string[]> {
  const { output } = await runBash(`ogrinfo -al -so "${filePath}"`, { captureOutput: true });

  const layers: string[] = [];
  let currentLayer: string | null = null;
  for (const line of output.split('\n')) {
    const layerMatch = line.match(/^Layer name: (.+)$/);
    if (layerMatch) {
      currentLayer = layerMatch[1].trim();
      continue;
    }
    const countMatch = line.match(/^Feature Count: (\d+)/);
    if (countMatch && currentLayer) {
      if (parseInt(countMatch[1], 10) > 0) {
        layers.push(currentLayer);
      }
      currentLayer = null;
    }
  }
  return layers;
}

export async function ogr2ogrExtractNDJSONFromDatabaseTable(
  tableName: keyof DB,
  outputFilePath: string,
  sqlWhereClause: string,
  sqlSelectClause: string,
  options: RunCommandOptions = {}
): Promise<CommandResult | void> {
  await runOgr2ogr(
    `-f GeoJSONSeq ${outputFilePath} ${pgUrlToGdal(serverConfig.DATABASE_URL)} -t_srs EPSG:4326 -sql 'select ${sqlSelectClause} from ${tableName} where ${sqlWhereClause}'`,
    options
  );
}

/**
 * Convert a PostgreSQL URL to a GDAL URL
 * @param url - The PostgreSQL URL to convert
 * @returns The GDAL URL
 * @example
 * ```tsx
 * const gdalUrl = pgUrlToGdal('postgresql://user:password@localhost:5432/database');
 * ```
 */
function pgUrlToGdal(url: string): string {
  const u = new URL(url);
  return `PG:"host=${u.hostname} port=${u.port || 5432} dbname=${u.pathname.slice(1)} user=${u.username} password=${u.password}"`;
}
