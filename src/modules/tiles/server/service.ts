import { type BuildTilesInput } from '@/modules/tiles/constants';
import { kdb } from '@/server/db/kysely';
import { type ApiContext } from '@/server/db/kysely/base-model';

export const createBuildTilesJob = async ({ name }: BuildTilesInput, context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      type: 'build_tiles',
      data: {
        name,
      },
      status: 'pending',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};
