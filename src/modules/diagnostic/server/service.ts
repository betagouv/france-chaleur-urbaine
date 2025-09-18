import { serverConfig } from '@/server/config';
import { createLogger } from '@/server/helpers/logger';
import { testCommandExists } from '@/utils/system';
import { knownAirtableBases } from '@cli/airtable/bases';

const logger = createLogger('diagnostic');

export async function runDiagnostic() {
  return {
    geo: await checkGeoCommands(),
    airtable: getAirtableBase(),
  };
}

async function checkGeoCommands() {
  logger.info('Vérification des commandes géographiques...');

  const [ogr2ogr, tippecanoe] = await Promise.all([testCommandExists('ogr2ogr'), testCommandExists('tippecanoe')]);

  return {
    USE_DOCKER_GEO_COMMANDS: serverConfig.USE_DOCKER_GEO_COMMANDS,
    ogr2ogr,
    tippecanoe,
  };
}

function getAirtableBase(): string {
  return (
    Object.entries(knownAirtableBases).find(([_, value]) => value === serverConfig.AIRTABLE_BASE)?.[0] ||
    `inconnu ${serverConfig.AIRTABLE_BASE}`
  );
}
