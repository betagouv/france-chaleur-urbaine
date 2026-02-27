import { getBatEnrBatimentDetails } from '@/modules/chaleur-renouvelable/server/batenr/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
});
