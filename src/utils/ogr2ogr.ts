/** biome-ignore-all lint/suspicious/noConfusingVoidType: false positive, typescript prefers void */
import { rename } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { serverConfig } from '@/server/config';
import type { DB } from '@/server/db/kysely';
import { type CommandResult, dockerImageArch, dockerVolumePath, type RunCommandOptions, runBash, runDocker } from '@/utils/system';

/**
 * Exécute une commande ogr2ogr avec support Docker
 *
 * @param args - Arguments à passer à ogr2ogr
 * @param options - Options d'exécution
 * @returns Une promesse qui se résout quand la commande se termine
 */
export function runOgr2ogr(command: string, options: RunCommandOptions = {}): Promise<CommandResult> {
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    return runDocker(`ghcr.io/osgeo/gdal:alpine-normal-latest-${dockerImageArch}`, `ogr2ogr ${command}`, options);
  } else {
    return runBash(`ogr2ogr ${command}`, options);
  }
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
  await runOgr2ogr(
    `-f GeoJSON ${serverConfig.USE_DOCKER_GEO_COMMANDS ? 'output.geojson' : outputFilePath} ${pgUrlToGdal(serverConfig.DATABASE_URL)} ${tableName} -t_srs EPSG:4326`,
    options
  );
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    await rename(join(dockerVolumePath, 'output.geojson'), outputFilePath);
  }
}

export async function ogr2ogrConvertToGeoJSON(
  inputFilePath: string,
  outputFilePath: string,
  options: RunCommandOptions = {}
): Promise<CommandResult | void> {
  let inputFileName = basename(inputFilePath);
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    const randomPrefix = `input_${Math.random().toString(36).substring(2, 10)}_`;
    inputFileName = `${randomPrefix}${inputFileName}`;
    await rename(inputFilePath, join(dockerVolumePath, inputFileName));
  }

  const inputArg = serverConfig.USE_DOCKER_GEO_COMMANDS ? inputFileName : inputFilePath;
  const outputArg = serverConfig.USE_DOCKER_GEO_COMMANDS ? 'output.geojson' : outputFilePath;

  const layers = await listNonEmptyLayers(inputArg);
  if (layers.length <= 1) {
    await runOgr2ogr(`-f GeoJSON ${outputArg} ${inputArg} -t_srs EPSG:4326`, options);
  } else {
    // KML (and other multi-layer formats): GeoJSON only supports one layer per file.
    // Convert the first layer normally, then append the rest under the same layer name.
    const [first, ...rest] = layers;
    await runOgr2ogr(`-f GeoJSON ${outputArg} ${inputArg} "${first}" -t_srs EPSG:4326 -nlt GEOMETRY`, options);
    for (const layer of rest) {
      await runOgr2ogr(
        `-f GeoJSON -update -append ${outputArg} ${inputArg} "${layer}" -t_srs EPSG:4326 -nlt GEOMETRY -nln "${first}"`,
        options
      );
    }
  }

  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    // input
    await rename(join(dockerVolumePath, inputFileName), inputFilePath);
    // output
    await rename(join(dockerVolumePath, 'output.geojson'), outputFilePath);
  }
}

/**
 * Returns the names of layers that contain at least one feature.
 * Skips empty layers (e.g. LIBKML metadata containers named after the source file).
 */
async function listNonEmptyLayers(filePath: string): Promise<string[]> {
  const run = serverConfig.USE_DOCKER_GEO_COMMANDS
    ? (cmd: string) => runDocker(`ghcr.io/osgeo/gdal:alpine-normal-latest-${dockerImageArch}`, cmd, { captureOutput: true })
    : (cmd: string) => runBash(cmd, { captureOutput: true });

  const { output } = await run(`ogrinfo -al -so "${filePath}"`);

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
  let dockerOutputFileName = 'output.json';
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    dockerOutputFileName = `output_${Math.random().toString(36).substring(2, 10)}.json`;
  }
  await runOgr2ogr(
    `-f GeoJSONSeq ${serverConfig.USE_DOCKER_GEO_COMMANDS ? dockerOutputFileName : outputFilePath} ${pgUrlToGdal(serverConfig.DATABASE_URL)} -t_srs EPSG:4326 -sql 'select ${sqlSelectClause} from ${tableName} where ${sqlWhereClause}'`,
    options
  );
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    await rename(join(dockerVolumePath, dockerOutputFileName), outputFilePath);
  }
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
