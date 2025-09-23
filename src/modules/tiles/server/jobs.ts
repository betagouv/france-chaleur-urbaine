import { type Selectable } from 'kysely';
import { type Logger } from 'winston';

import { createUserEvent } from '@/modules/events/server/service';
import { type BuildTilesInput, type SyncGeometriesInput } from '@/modules/tiles/constants';
import { runTilesGeneration } from '@/modules/tiles/server/generation-run';
import { type Jobs } from '@/server/db/kysely';
import { type DatabaseSourceId } from '@/server/services/tiles.config';
import { downloadNetwork } from '@cli/networks/download-network';
import { syncPostgresToAirtable } from '@cli/networks/sync-pg-to-airtable';

export type BuildTilesJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'build_tiles';
  data: {
    name: BuildTilesInput['name'];
  };
};

export async function processBuildTilesJob(job: BuildTilesJob, logger: Logger) {
  const { name } = job.data;
  const config = await runTilesGeneration(name);
  logger.info(`La table ${config.tilesTableName} a été populée avec les données pour ${name}.`);
  await createUserEvent({
    type: 'build_tiles',
    data: { name },
    author_id: job.user_id,
  });
}

export type SyncMetadataFromAirtableJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'syncMetadataFromAirtable';
  data: {
    name: SyncGeometriesInput['name'];
  };
};

/**
 * Synchronise les métadonnées depuis Airtable vers Postgres.
 * Équivalent de la CLI download-network pour toutes les tables.
 */
export async function processSyncMetadataFromAirtableJob(job: SyncMetadataFromAirtableJob, logger: Logger) {
  const { name } = job.data;
  await downloadNetwork(name as DatabaseSourceId);
  logger.info(`Les données ont été récupérées depuis Airtable et ont été insérées dans la table ${name}.`);
  await createUserEvent({
    type: 'syncMetadataFromAirtable',
    data: { name },
    author_id: job.user_id,
  });
}

export type SyncGeometriesToAirtableJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'syncGeometriesToAirtable';
  data: {
    name: SyncGeometriesInput['name'];
  };
};

/**
 * Synchronise les géométries mises à jour vers Airtable.
 * Équivalent de la CLI sync-postgres-to-airtable.
 */
export async function processSyncGeometriesToAirtableJob(job: SyncGeometriesToAirtableJob, logger: Logger) {
  const { name } = job.data;
  await syncPostgresToAirtable(false); // false = pas de dry run
  logger.info(`Les géométries ont été envoyées sur Airtable depuis la table ${name}.`);
  await createUserEvent({
    type: 'syncGeometriesToAirtable',
    data: { name },
    author_id: job.user_id,
  });
}
