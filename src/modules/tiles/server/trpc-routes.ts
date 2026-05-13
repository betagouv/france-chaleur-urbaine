import { zBuildTilesInput } from '@/modules/tiles/constants';
import { createBuildTilesJob } from '@/modules/tiles/server/service';
import { adminRoute, router } from '@/modules/trpc/server';

export const tilesRouter = router({
  createBuildTilesJob: adminRoute.input(zBuildTilesInput).mutation(async ({ input, ctx }) => await createBuildTilesJob(input, ctx)),
});
