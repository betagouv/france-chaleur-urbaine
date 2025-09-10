import { unlink } from 'node:fs/promises';

import { type Selectable } from 'kysely';
import { type Logger } from 'winston';

import { createUserEvent } from '@/modules/events/server/service';
import { type BuildTilesInput } from '@/modules/tiles/constants';
import { type Jobs } from '@/server/db/kysely';
import tilesManager from '@cli/tiles';

export type BuildTilesJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'build_tiles';
  data: {
    name: BuildTilesInput['name'];
  };
};

export async function processBuildTilesJob(job: BuildTilesJob, logger: Logger) {
  const { name } = job.data;
  logger.info(`Génération du fichier GeoJSON pour ${name}`);
  const tileManager = tilesManager(name as any); // TODO temporaire le temps d'implémenter le reste des couches
  const filepath = await tileManager.generateGeoJSON({});
  if (!filepath) {
    throw new Error("Le fichier GeoJSON n'a pas été généré.");
  }
  logger.info(`GeoJSON généré: ${filepath}`);
  const tilesDatabaseName = `${tileManager.databaseName}_tiles`;
  logger.info(`Importation dans la table: ${tilesDatabaseName}`);
  await tileManager.importGeoJSON(filepath);
  await unlink(filepath);
  logger.info(`La table ${tilesDatabaseName} a été populée avec les données pour ${name}.`);
  await createUserEvent({
    type: 'build_tiles',
    data: { name },
    author_id: job.user_id,
  });
}
