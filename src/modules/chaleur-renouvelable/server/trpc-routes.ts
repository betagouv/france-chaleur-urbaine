import {
  zAddressEligibilityContextInput,
  zAdminUpdateDemandeChaleurRenouvelableInput,
  zAdminValidateDemandeChaleurRenouvelableInput,
  zBatEnrByBanIdInput,
  zCcrtUpdateDemandeChaleurRenouvelableInput,
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
  listDemandesChaleurRenouvelableCcrt,
  updateDemandeChaleurRenouvelableAdmin,
  updateDemandeChaleurRenouvelableCcrt,
  validateDemandeChaleurRenouvelableAdmin,
} from '@/modules/chaleur-renouvelable/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { route, routeRole, router } from '@/modules/trpc/server';

export const batEnrRouter = router({
  admin: {
    listDemandesChaleurRenouvelable: routeRole(['admin']).query(async () => await listDemandesChaleurRenouvelableAdmin()),
    updateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminUpdateDemandeChaleurRenouvelableInput)
      .mutation(async ({ input }) => await updateDemandeChaleurRenouvelableAdmin(input)),
    validateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminValidateDemandeChaleurRenouvelableInput)
      .mutation(async ({ input }) => await validateDemandeChaleurRenouvelableAdmin(input)),
  },
  ccrt: {
    listDemandesChaleurRenouvelable: routeRole(['admin', 'ccrt']).query(async ({ ctx }) => await listDemandesChaleurRenouvelableCcrt(ctx)),
    updateDemandeChaleurRenouvelable: routeRole(['admin', 'ccrt'])
      .input(zCcrtUpdateDemandeChaleurRenouvelableInput)
      .mutation(async ({ ctx, input }) => await updateDemandeChaleurRenouvelableCcrt(ctx, input)),
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
