import { zBuildTilesInput, zGetBdnbBatimentInput } from '@/modules/tiles/constants';
import { createBuildTilesJob, getBdnbBatimentDetails } from '@/modules/tiles/server/service';
import { route, routeRole, router } from '@/modules/trpc/server';

export const tilesRouter = router({
  createBuildTilesJob: routeRole(['admin'])
    .input(zBuildTilesInput)
    .mutation(async ({ input, ctx }) => await createBuildTilesJob(input, ctx)),
  getBdnbBatimentDetails: route.input(zGetBdnbBatimentInput).query(async ({ input }) => await getBdnbBatimentDetails(input)),
});
