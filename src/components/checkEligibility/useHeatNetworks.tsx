import React from 'react';
import { useServices } from 'src/services';
import { Coords } from 'src/types';

export const useHeatNetworks = () => {
  const [status, setStatus] = React.useState('idle');
  const [isEligible, setIsEligible] = React.useState<boolean>(false);
  const { heatNetworkService } = useServices();
  const checkEligibility = React.useCallback(
    async (coords: Coords) => {
      try {
        setStatus('loading');
        const network = await heatNetworkService.findByCoords(coords);
        setIsEligible(network.isEligible);
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService]
  );

  return {
    checkEligibility,
    isEligible,
    status,
  };
};
