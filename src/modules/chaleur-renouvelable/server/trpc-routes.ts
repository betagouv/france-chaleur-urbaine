import {
  zAdminUpdateDemandeChaleurRenouvelableInput,
  zDemandeChaleurRenouvelable,
  zLocationInfos,
  zRnbByBanIdInput,
} from '@/modules/chaleur-renouvelable/constants';
import {
  createDemandeChaleurRenouvelable,
  getBatEnrBatimentDetails,
  getLocationInfos,
  getRnbByBanId,
  listDemandesChaleurRenouvelableAdmin,
  updateDemandeChaleurRenouvelableAdmin,
} from '@/modules/chaleur-renouvelable/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, routeRole, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  admin: {
    listDemandesChaleurRenouvelable: routeRole(['admin']).query(async () => await listDemandesChaleurRenouvelableAdmin()),
    updateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminUpdateDemandeChaleurRenouvelableInput)
      .mutation(async ({ input }) => await updateDemandeChaleurRenouvelableAdmin(input)),
  },
  createDemandeChaleurRenouvelable: route
    .input(zDemandeChaleurRenouvelable)
    .mutation(async ({ input }) => await createDemandeChaleurRenouvelable({ input })),
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
  getLocationInfos: route.input(zLocationInfos).query(async ({ input }) => await getLocationInfos(input)),
  getRnbByBanId: route.input(zRnbByBanIdInput).query(async ({ input }) => await getRnbByBanId(input)),
});
