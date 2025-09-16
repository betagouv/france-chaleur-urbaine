import { z } from 'zod';

import { zBuildTilesInput } from '@/modules/tiles/constants';
import { applyGeometriesUpdates, createBuildTilesJob } from '@/modules/tiles/server/service';
import { router, routeRole } from '@/modules/trpc/server';

export const tilesRouter = router({
  createBuildTilesJob: routeRole(['admin'])
    .input(zBuildTilesInput)
    .mutation(async ({ input, ctx }) => await createBuildTilesJob(input, ctx)),
  applyGeometriesUpdates: routeRole(['admin'])
    .input(z.object({}))
    .mutation(async ({ ctx }) => await applyGeometriesUpdates(ctx)),
});
