import type { Selectable } from 'kysely';
import type { Logger } from 'winston';

import { createUserEvent } from '@/modules/events/server/service';
import type { ApplyGeometriesUpdatesInput } from '@/modules/reseaux/constants';
import { downloadNetwork } from '@/modules/reseaux/server/download-network';
import { syncPostgresToAirtable } from '@/modules/reseaux/server/sync-pg-to-airtable';
import type { BuildTilesInput } from '@/modules/tiles/constants';
import type { Jobs } from '@/server/db/kysely';

import { runTilesGeneration } from './generation-run';

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
    author_id: job.user_id,
    data: { name },
    type: 'build_tiles',
  });
}

export type SyncMetadataFromAirtableJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'sync_metadata_from_airtable';
  data: {
    name: Exclude<ApplyGeometriesUpdatesInput['name'], 'perimetres-de-developpement-prioritaire'>;
  };
};

/**
 * Synchronise les métadonnées depuis Airtable vers Postgres.
 * Équivalent de la CLI download-network pour toutes les tables.
 */
export async function processSyncMetadataFromAirtableJob(job: SyncMetadataFromAirtableJob, logger: Logger) {
  const { name } = job.data;
  await downloadNetwork(name);
  logger.info(`Les données ont été récupérées depuis Airtable et ont été insérées pour ${name}.`);
  await createUserEvent({
    author_id: job.user_id,
    data: { name },
    type: 'sync_metadata_from_airtable',
  });
}

export type SyncGeometriesToAirtableJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'sync_geometries_to_airtable';
  data: {
    name: ApplyGeometriesUpdatesInput['name'];
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
    author_id: job.user_id,
    data: { name },
    type: 'sync_geometries_to_airtable',
  });
}
