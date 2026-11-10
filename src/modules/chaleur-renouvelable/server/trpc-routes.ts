import {
  zAddressEligibilityContextInput,
  zAdminUpdateDemandeChaleurRenouvelableInput,
  zAdminValidateDemandeChaleurRenouvelableInput,
  zBatEnrByBanIdInput,
  zCcrtAdminComment,
  zCcrtArchiveDemand,
  zCcrtDemandId,
  zCcrtFollowUpInput,
  zCcrtSendEmail,
  zCcrtTransferDemand,
  zCcrtTransferNetwork,
  zCcrtUpdateBuilding,
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
  getSimulationPrefill,
  listDemandesChaleurRenouvelableAdmin,
  listDemandesChaleurRenouvelableCcrt,
  updateDemandeChaleurRenouvelableAdmin,
  updateDemandeChaleurRenouvelableCcrt,
  validateDemandeChaleurRenouvelableAdmin,
} from '@/modules/chaleur-renouvelable/server/service';
import { zGetBdnbConstructionInput } from '@/modules/tiles/constants';
import { renewableHeatAccessRoute, route, routeRole, router } from '@/modules/trpc/server';

import { listCcrtAssignmentCandidates } from './ccrt-access';
import { updateCcrtBuilding } from './ccrt-building';
import { sendCcrtEmail } from './ccrt-emails';
import { getCcrtFollowUp } from './ccrt-follow-up';
import { getCcrtHeatNetworkEligibility } from './ccrt-heat-network';
import { archiveCcrtDemand, getCcrtAdminComment, restoreCcrtDemand, transferCcrtDemand, updateCcrtAdminComment } from './ccrt-moderation';
import { getCcrtTransferNetwork } from './ccrt-transfer-network';

export const batEnrRouter = router({
  admin: {
    archiveDemand: routeRole(['admin'])
      .input(zCcrtArchiveDemand)
      .mutation(({ ctx, input }) => archiveCcrtDemand(ctx, input)),
    getAdminComment: routeRole(['admin'])
      .input(zCcrtDemandId)
      .query(({ input }) => getCcrtAdminComment(input)),
    getTransferNetwork: routeRole(['admin'])
      .input(zCcrtTransferNetwork)
      .query(({ ctx, input }) => getCcrtTransferNetwork(ctx, input)),
    listAssignmentCandidates: routeRole(['admin'])
      .input(zCcrtDemandId)
      .query(({ ctx, input }) => listCcrtAssignmentCandidates(ctx, input.demandId)),
    listDemandesChaleurRenouvelable: routeRole(['admin']).query(async () => await listDemandesChaleurRenouvelableAdmin()),
    restoreDemand: routeRole(['admin'])
      .input(zCcrtDemandId)
      .mutation(({ ctx, input }) => restoreCcrtDemand(ctx, input)),
    transferDemand: routeRole(['admin'])
      .input(zCcrtTransferDemand)
      .mutation(({ ctx, input }) => transferCcrtDemand(ctx, input)),
    updateAdminComment: routeRole(['admin'])
      .input(zCcrtAdminComment)
      .mutation(({ ctx, input }) => updateCcrtAdminComment(ctx, input)),
    updateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminUpdateDemandeChaleurRenouvelableInput)
      .mutation(async ({ ctx, input }) => await updateDemandeChaleurRenouvelableAdmin(ctx, input)),
    validateDemandeChaleurRenouvelable: routeRole(['admin'])
      .input(zAdminValidateDemandeChaleurRenouvelableInput)
      .mutation(async ({ input }) => await validateDemandeChaleurRenouvelableAdmin(input)),
  },
  ccrt: {
    getFollowUp: renewableHeatAccessRoute.input(zCcrtFollowUpInput).query(({ ctx, input }) => getCcrtFollowUp(ctx, input)),
    getHeatNetworkEligibility: renewableHeatAccessRoute
      .input(zCcrtDemandId)
      .query(({ ctx, input }) => getCcrtHeatNetworkEligibility(ctx, input)),
    listDemandesChaleurRenouvelable: renewableHeatAccessRoute.query(async ({ ctx }) => await listDemandesChaleurRenouvelableCcrt(ctx)),
    sendEmail: renewableHeatAccessRoute.input(zCcrtSendEmail).mutation(({ ctx, input }) => sendCcrtEmail(ctx, input)),
    updateBuilding: renewableHeatAccessRoute.input(zCcrtUpdateBuilding).mutation(({ ctx, input }) => updateCcrtBuilding(ctx, input)),
    updateDemandeChaleurRenouvelable: renewableHeatAccessRoute
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
  getSimulationPrefill: route.input(zGetBdnbConstructionInput).query(({ input }) => getSimulationPrefill(input)),
});
