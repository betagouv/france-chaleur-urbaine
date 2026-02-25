import { getBatEnrBatimentDetails } from '@/modules/batenr/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
});
