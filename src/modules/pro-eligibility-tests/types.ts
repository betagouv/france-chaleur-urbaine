import type { EligibilityType } from '@/server/services/addresseInformation';
import type { TransitionType } from './constants';

export type ProEligibilityTestEligibility = {
  id_fcu: number;
  id_sncu: string;
  type: EligibilityType;
  distance: number;
  nom: string;
  contenu_co2_acv?: number;
  taux_enrr?: number;
  eligible: boolean;
};

export type ProEligibilityTestHistoryEntry = {
  calculated_at: string;
  eligibility: ProEligibilityTestEligibility;
  transition: TransitionType;
};
