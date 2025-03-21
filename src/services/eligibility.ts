export const getNetworkEligibilityDistances = (networkId: string) => {
  // cas spécifique pour les réseaux de Paris
  return ['7501C', '7511C'].includes(networkId)
    ? { eligibleDistance: 100, veryEligibleDistance: 60 }
    : { eligibleDistance: 200, veryEligibleDistance: 100 };
};
