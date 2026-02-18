import { getBatEnrBatimentDetails } from '@/modules/batenr/server/service';
import { zGetBatenrBatimentInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  getBatEnrBatimentDetails: route.input(zGetBatenrBatimentInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
});
