import React from 'react';
import { useServices } from 'src/services';
import { Coords, HeatNetworksResponse } from 'src/types';
const ELIGIBILITY_DISTANCE_THRESHOLD = 300;

export const useHeatNetworks = (
  threshold: number = ELIGIBILITY_DISTANCE_THRESHOLD
) => {
  const [status, setStatus] = React.useState('idle');
  const [isEligible, setIsEligible] = React.useState<boolean>(false);
  const { heatNetworkService } = useServices();
  const checkEligibility = React.useCallback(
    async (coords: Coords) => {
      try {
        setStatus('loading');
        const network = await heatNetworkService.findByCoords(coords);
        setIsEligible(_IsNetworkOutOfThreshold(network, threshold));
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService, threshold]
  );

  return {
    checkEligibility,
    isEligible,
    status,
  };
};
function _IsNetworkOutOfThreshold(
  heatNetwork: HeatNetworksResponse,
  threshold: number
) {
  return heatNetwork?.distPointReseau <= threshold;
}
