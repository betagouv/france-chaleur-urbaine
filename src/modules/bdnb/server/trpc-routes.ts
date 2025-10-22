import { getBdnbBatimentDetails } from '@/modules/bdnb/server/service';
import { zGetBdnbBatimentInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const bdnbRouter = router({
  getBdnbBatimentDetails: route.input(zGetBdnbBatimentInput).query(async ({ input }) => await getBdnbBatimentDetails(input)),
});
