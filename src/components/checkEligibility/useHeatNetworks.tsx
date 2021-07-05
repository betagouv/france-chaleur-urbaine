import React from 'react';
import { useServices } from 'src/services';
import { Coords, HeatNetworksResponse } from 'src/types';
const ELIGIBILITY_DISTANCE_THRESHOLD = 300;

export const useHeatNetworks = (
  threshold: number = ELIGIBILITY_DISTANCE_THRESHOLD
) => {
  const [status, setStatus] = React.useState('idle');
  const [nearNetwork, setNearNetwork] =
    React.useState<HeatNetworksResponse | null>(null);
  const { heatNetworkService } = useServices();
  const findNearHeatNetwork = React.useCallback(
    async (coords: Coords) => {
      setStatus('loading');
      try {
        const network = await heatNetworkService.findByCoords(coords);
        setNearNetwork(network);
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService]
  );

  return {
    checkEligibility: async (coords: Coords): Promise<void> => {
      await findNearHeatNetwork(coords);
    },
    isEligible: !!nearNetwork && _IsOutOfThreshold(nearNetwork, threshold),
    status,
  };
};
function _IsOutOfThreshold(
  nearNetwork: HeatNetworksResponse,
  threshold: number
) {
  return nearNetwork.distPointReseau <= threshold;
}
