import { zAirtableAdemeHelp, zBatEnrByBanIdInput, zLocationInfos } from '@/modules/chaleur-renouvelable/constants';
import {
  addContactToAirtable,
  getBatEnrBatimentDetails,
  getBatEnrBatimentsByBanId,
  getLocationInfos,
} from '@/modules/chaleur-renouvelable/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  addContactToAirtable: route.input(zAirtableAdemeHelp).query(async ({ input }) => await addContactToAirtable({ input })),
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
  getBatEnrBatimentsByBanId: route.input(zBatEnrByBanIdInput).query(async ({ input }) => await getBatEnrBatimentsByBanId(input)),
  getLocationInfos: route.input(zLocationInfos).query(async ({ input }) => await getLocationInfos(input)),
});
