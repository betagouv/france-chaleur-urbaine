import { businessRules } from '@/modules/app/business-rules';

export const getNetworkEligibilityDistances = (networkId: string) => {
  // cas spécifique pour les réseaux de Paris
  return ['7501C', '7511C'].includes(networkId)
    ? { eligibleDistance: businessRules.eligibleDistanceParis.value, veryEligibleDistance: businessRules.veryEligibleDistanceParis.value }
    : {
        eligibleDistance: businessRules.eligibleDistanceDefault.value,
        veryEligibleDistance: businessRules.veryEligibleDistanceDefault.value,
      };
};
