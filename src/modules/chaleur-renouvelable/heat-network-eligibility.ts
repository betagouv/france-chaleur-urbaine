import { businessRules } from '@/modules/app/business-rules';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

import type { TypeRadiateur } from './constants';

type CanProposeHeatNetworkParams = {
  heatNetworkEligibility: Pick<HeatNetwork, 'isEligible' | 'distance'> | null | undefined;
  hasAlreadyReceivedHeatNetworkRefusal: boolean;
  radiatorType: TypeRadiateur | null;
};

/**
 * Shared eligibility rule for the heat-network solution and contact flow.
 */
export const canProposeHeatNetwork = (params: CanProposeHeatNetworkParams) =>
  params.heatNetworkEligibility?.isEligible === true &&
  params.heatNetworkEligibility.distance !== null &&
  params.heatNetworkEligibility.distance < businessRules.fcrHeatNetworkMaxDistanceMeters.value &&
  !params.hasAlreadyReceivedHeatNetworkRefusal &&
  params.radiatorType === 'radiateur-eau';
