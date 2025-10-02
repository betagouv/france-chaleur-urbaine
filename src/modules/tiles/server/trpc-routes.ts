import { zBuildTilesInput, zSyncGeometriesInput } from '@/modules/tiles/constants';
import { applyGeometriesUpdates, createBuildTilesJob } from '@/modules/tiles/server/service';
import { routeRole, router } from '@/modules/trpc/server';

export const tilesRouter = router({
  applyGeometriesUpdates: routeRole(['admin'])
    .input(zSyncGeometriesInput)
    .mutation(async ({ input, ctx }) => await applyGeometriesUpdates(input, ctx)),
  createBuildTilesJob: routeRole(['admin'])
    .input(zBuildTilesInput)
    .mutation(async ({ input, ctx }) => await createBuildTilesJob(input, ctx)),
});
