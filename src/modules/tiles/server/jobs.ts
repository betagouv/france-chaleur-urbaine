import type { Selectable } from 'kysely';
import type { Logger } from 'winston';

import { createUserEvent } from '@/modules/events/server/service';
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
