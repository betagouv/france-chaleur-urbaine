import { zBuildTilesInput } from '@/modules/tiles/constants';
import {
  applyGeometriesUpdates,
  createBuildTilesJob,
  syncGeometriesToAirtable,
  syncMetadataFromAirtable,
} from '@/modules/tiles/server/service';
import { router, routeRole } from '@/modules/trpc/server';

export const tilesRouter = router({
  createBuildTilesJob: routeRole(['admin'])
    .input(zBuildTilesInput)
    .mutation(async ({ input, ctx }) => await createBuildTilesJob(input, ctx)),
  applyGeometriesUpdates: routeRole(['admin']).mutation(async ({ ctx }) => await applyGeometriesUpdates(ctx)),
  syncGeometriesToAirtable: routeRole(['admin']).mutation(async ({ ctx }) => await syncGeometriesToAirtable(ctx)),
  syncMetadataFromAirtable: routeRole(['admin']).mutation(async ({ ctx }) => await syncMetadataFromAirtable(ctx)),
});
