import { zAirtableAdemeHelp, zLocationInfos, zRnbByBanIdInput } from '@/modules/chaleur-renouvelable/constants';
import {
  addContactToAirtable,
  getBatEnrBatimentDetails,
  getLocationInfos,
  getRnbByBanId,
} from '@/modules/chaleur-renouvelable/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  addContactToAirtable: route.input(zAirtableAdemeHelp).query(async ({ input }) => await addContactToAirtable({ input })),
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
  getLocationInfos: route.input(zLocationInfos).query(async ({ input }) => await getLocationInfos(input)),
  getRnbByBanId: route.input(zRnbByBanIdInput).query(async ({ input }) => await getRnbByBanId(input)),
});
