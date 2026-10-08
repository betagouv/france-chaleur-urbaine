import {
  zAddressEligibilityContextInput,
  zAdminUpdateDemandeChaleurRenouvelableInput,
  zAdminValidateDemandeChaleurRenouvelableInput,
  zBatEnrByBanIdInput,
  zCcrtCreateNote,
  zCcrtDeleteNote,
  zCcrtDemandId,
  zCcrtFollowUpInput,
  zCcrtSendEmail,
  zCcrtUpdateBuilding,
  zCcrtUpdateDemandeChaleurRenouvelableInput,
  zCcrtUpdateNote,
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
import { demandAccessRoute, route, routeRole, router } from '@/modules/trpc/server';

import { updateCcrtBuilding } from './ccrt-building';
import { sendCcrtEmail } from './ccrt-emails';
import { getCcrtFollowUp } from './ccrt-follow-up';
import { getCcrtHeatNetworkEligibility } from './ccrt-heat-network';
import { createCcrtNote, deleteCcrtNote, updateCcrtNote } from './ccrt-notes';

export const batEnrRouter = router({
  admin: {
    listDemandesChaleurRenouvelable: routeRole(['admin']).query(async () => await listDemandesChaleurRenouvelableAdmin()),
    updateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminUpdateDemandeChaleurRenouvelableInput)
      .mutation(async ({ ctx, input }) => await updateDemandeChaleurRenouvelableAdmin(ctx, input)),
    validateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminValidateDemandeChaleurRenouvelableInput)
      .mutation(async ({ input }) => await validateDemandeChaleurRenouvelableAdmin(input)),
  },
  ccrt: {
    createNote: demandAccessRoute.input(zCcrtCreateNote).mutation(({ ctx, input }) => createCcrtNote(ctx, input)),
    deleteNote: demandAccessRoute.input(zCcrtDeleteNote).mutation(({ ctx, input }) => deleteCcrtNote(ctx, input)),
    getFollowUp: demandAccessRoute.input(zCcrtFollowUpInput).query(({ ctx, input }) => getCcrtFollowUp(ctx, input)),
    getHeatNetworkEligibility: demandAccessRoute.input(zCcrtDemandId).query(({ ctx, input }) => getCcrtHeatNetworkEligibility(ctx, input)),
    listDemandesChaleurRenouvelable: demandAccessRoute.query(async ({ ctx }) => await listDemandesChaleurRenouvelableCcrt(ctx)),
    sendEmail: demandAccessRoute.input(zCcrtSendEmail).mutation(({ ctx, input }) => sendCcrtEmail(ctx, input)),
    updateBuilding: demandAccessRoute.input(zCcrtUpdateBuilding).mutation(({ ctx, input }) => updateCcrtBuilding(ctx, input)),
    updateDemandeChaleurRenouvelable: demandAccessRoute
      .input(zCcrtUpdateDemandeChaleurRenouvelableInput)
      .mutation(async ({ ctx, input }) => await updateDemandeChaleurRenouvelableCcrt(ctx, input)),
    updateNote: demandAccessRoute.input(zCcrtUpdateNote).mutation(({ ctx, input }) => updateCcrtNote(ctx, input)),
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
