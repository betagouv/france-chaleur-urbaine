import { zGristAdemeHelp, zLocationInfos, zRnbByBanIdInput } from '@/modules/chaleur-renouvelable/constants';
import {
  addContactToGrist,
  getBatEnrBatimentDetails,
  getLocationInfos,
  getRnbByBanId,
} from '@/modules/chaleur-renouvelable/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  addContactToGrist: route.input(zGristAdemeHelp).mutation(async ({ input }) => await addContactToGrist({ input })),
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
  getLocationInfos: route.input(zLocationInfos).query(async ({ input }) => await getLocationInfos(input)),
  getRnbByBanId: route.input(zRnbByBanIdInput).query(async ({ input }) => await getRnbByBanId(input)),
});
