import type trpc from '@/modules/trpc/client';

type InvalidateCcrtDemandOptions = { buildingChanged?: boolean };

/**
 * Refreshes every view of a shared demand after a successful mutation.
 */
export const invalidateCcrtDemand = (
  utils: ReturnType<typeof trpc.useUtils>,
  demandId: string,
  options: InvalidateCcrtDemandOptions = {}
) =>
  Promise.all([
    utils.batEnr.ccrt.listDemandesChaleurRenouvelable.invalidate(),
    utils.batEnr.admin.listDemandesChaleurRenouvelable.invalidate(),
    utils.batEnr.ccrt.getFollowUp.invalidate({ demandId }),
    ...(options.buildingChanged
      ? [
          utils.batEnr.ccrt.getHeatNetworkEligibility.invalidate({ demandId }),
          utils.batEnr.admin.listAssignmentCandidates.invalidate({ demandId }),
        ]
      : []),
  ]);
