import type { EligibilityType } from '@/server/services/addresseInformation';

export type ProEligibilityTestEligibility = {
  id_fcu: number;
  id_sncu: string;
  type: EligibilityType;
  distance: number;
  nom: string;
  contenuCO2ACV?: number;
  tauxENRR?: number;
};

export type ProEligibilityTestHistoryEntry = {
  calculated_at: string;
  eligibility: ProEligibilityTestEligibility;
  transition: string;
};
