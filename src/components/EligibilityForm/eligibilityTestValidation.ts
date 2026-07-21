import { z } from 'zod';

import type { BANAddressFeature } from '@/modules/ban/types';
import { ObjectEntries } from '@/utils/typescript';

import { energyInputsDefaultLabels } from './EligibilityFormAddress';

/**
 * Validation of the public address eligibility test (HeadSliceForm, EligibilityTestBox):
 * a heating type and an address actually picked from the BAN autocomplete.
 */
export const zEligibilityTest = z.object({
  geoAddress: z.custom<BANAddressFeature>((value) => !!value, "N'oubliez pas de sélectionner votre adresse dans la liste."),
  heatingType: z.string().min(1, "N'oubliez pas d'indiquer votre type de chauffage."),
});

export type EligibilityTestValues = z.input<typeof zEligibilityTest>;

export const heatingTypeOptions = ObjectEntries(energyInputsDefaultLabels).map(([value, label]) => ({
  label,
  nativeInputProps: { 'data-attr': `heatingType-${value}`, value },
}));
