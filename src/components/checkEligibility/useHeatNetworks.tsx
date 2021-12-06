import React from 'react';
import { useServices } from 'src/services';
import { Coords } from 'src/types';

export const useHeatNetworks = () => {
  const [status, setStatus] = React.useState('idle');
  const [isEligible, setIsEligible] = React.useState<boolean>(false);
  const { heatNetworkService } = useServices();
  const checkEligibility = React.useCallback(
    async (
      coords: Coords,
      callback?: (eligibility: boolean, address?: string) => void,
      address?: string
    ) => {
      try {
        setStatus('loading');
        const network = await heatNetworkService.findByCoords(coords);
        const eligibility = network.isEligible;
        setIsEligible(eligibility);
        setStatus('success');
        if (callback) callback(eligibility, address);
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
