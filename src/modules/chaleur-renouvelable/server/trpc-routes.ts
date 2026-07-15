import {
  zAddressEligibilityContextInput,
  zAdminUpdateDemandeChaleurRenouvelableInput,
  zBatEnrByBanIdInput,
  zDemandeChaleurRenouvelable,
  zFranceRenovSpaceInput,
  zLocationInfos,
} from '@/modules/chaleur-renouvelable/constants';
import {
  createDemandeChaleurRenouvelable,
  getAddressEligibilityContext,
  getBatEnrBatimentDetails,
  getBatEnrBatimentsByBanId,
  getBatEnrBatimentsSelectionContextByBanId,
  getFranceRenovSpace,
  getLocationInfos,
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
  getAddressEligibilityContext: route
    .input(zAddressEligibilityContextInput)
    .query(async ({ input }) => await getAddressEligibilityContext(input)),
  getBatEnrBatimentDetails: route.input(zGetBdnbConstructionInput).query(async ({ input }) => await getBatEnrBatimentDetails(input)),
  getBatEnrBatimentsByBanId: route.input(zBatEnrByBanIdInput).query(async ({ input }) => await getBatEnrBatimentsByBanId(input)),
  getBatEnrBatimentsSelectionContextByBanId: route
    .input(zBatEnrByBanIdInput)
    .query(async ({ input }) => await getBatEnrBatimentsSelectionContextByBanId(input)),
  getFranceRenovSpace: route.input(zFranceRenovSpaceInput).query(async ({ input }) => await getFranceRenovSpace(input)),
  getLocationInfos: route.input(zLocationInfos).query(async ({ input }) => await getLocationInfos(input)),
});
