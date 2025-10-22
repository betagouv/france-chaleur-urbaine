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
  let inputFileName = basename(inputFilePath);
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    const randomPrefix = `input_${Math.random().toString(36).substring(2, 10)}_`;
    inputFileName = `${randomPrefix}${inputFileName}`;
    await rename(inputFilePath, join(dockerVolumePath, inputFileName));
  }
  await runOgr2ogr(
    `-f PostgreSQL ${pgUrlToGdal(serverConfig.DATABASE_URL)} ${tableName} -nln ${tableName} -lco GEOMETRY_NAME=geom -t_srs EPSG:2154 -overwrite ${ogr2ogrOptions}`,
    options
  );
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    // input
    await rename(join(dockerVolumePath, inputFileName), inputFilePath);
  }
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
  await runOgr2ogr(
    `-f GeoJSON ${serverConfig.USE_DOCKER_GEO_COMMANDS ? 'output.geojson' : outputFilePath} ${serverConfig.USE_DOCKER_GEO_COMMANDS ? inputFileName : inputFilePath} -t_srs EPSG:4326`,
    options
  );
  if (serverConfig.USE_DOCKER_GEO_COMMANDS) {
    // input
    await rename(join(dockerVolumePath, inputFileName), inputFilePath);
    // output
    await rename(join(dockerVolumePath, 'output.geojson'), outputFilePath);
  }
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
