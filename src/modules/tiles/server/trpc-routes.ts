import { zBuildTilesInput } from '@/modules/tiles/constants';
import { createBuildTilesJob } from '@/modules/tiles/server/service';
import { routeRole, router } from '@/modules/trpc/server';

export const tilesRouter = router({
  createBuildTilesJob: routeRole(['admin'])
    .input(zBuildTilesInput)
    .mutation(async ({ input, ctx }) => await createBuildTilesJob(input, ctx)),
});
