import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import { addresseToPublicodesRules } from '@/components/ComparateurPublicodes/mappings';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { ObjectEntries } from '@/utils/typescript';

export const TOTAL_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . Total' as RuleName;
export const TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . Total montant' as RuleName;
export const BOOSTED_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . Coup de pouce' as RuleName;
export const STANDARD_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . CEE' as RuleName;
export const RESIDENTIAL_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . BAR-TH-137' as RuleName;
export const TERTIARY_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . BAT-TH-127' as RuleName;
export const CEE_VALUE_RULE = 'Paramètres économiques . Aides . Valeur CEE' as RuleName;

export type TypeBatiment = 'residentiel' | 'tertiaire';
export type Structure = 'Résidentiel' | 'Tertiaire';
export type TertiarySector = 'Bureaux' | 'Enseignement' | 'Commerces' | 'Café, restaurant' | 'Hôtel' | 'Santé' | 'Autres';
export type HotWaterProduction = 'oui' | 'non';
export type SimulatorFormState = {
  nbLogements?: number;
  producesHotWater: HotWaterProduction;
  surface?: number;
  tertiarySector: TertiarySector;
  typeBatiment: TypeBatiment;
};
export type ConcernedHelp = {
  label: string;
  noteUrl?: string;
};

export type SimulatorSituation = Partial<Record<RuleName, number | string | null>>;
export const buildAddressSituation = (infos: LocationInfoResponse): SimulatorSituation =>
  ObjectEntries(addresseToPublicodesRules).reduce<SimulatorSituation>((acc, [key, infoGetter]) => {
    acc[key] = infoGetter(infos) ?? null;
    return acc;
  }, {});

export const buildClearedAddressSituation = (): SimulatorSituation =>
  ObjectEntries(addresseToPublicodesRules).reduce<SimulatorSituation>((acc, [key]) => {
    acc[key] = null;
    return acc;
  }, {});

function isStrictlyPositiveNumber(value: number | undefined): value is number {
  return typeof value === 'number' && value > 0;
}

export function buildBuildingSituation({
  nbLogements,
  producesHotWater,
  surface,
  tertiarySector,
  typeBatiment,
}: SimulatorFormState): SimulatorSituation {
  return {
    'méthode tertiaire': typeBatiment === 'tertiaire' ? `'${tertiarySector}'` : null,
    "nombre de logements dans l'immeuble concerné":
      typeBatiment === 'residentiel' && isStrictlyPositiveNumber(nbLogements) ? nbLogements : null,
    'Production eau chaude sanitaire': typeBatiment === 'tertiaire' ? producesHotWater : 'oui',
    'surface logement type tertiaire': typeBatiment === 'tertiaire' && isStrictlyPositiveNumber(surface) ? surface : null,
    'type de bâtiment': typeBatiment === 'residentiel' ? "'résidentiel'" : "'tertiaire'",
  };
}

export function buildCeeValueSituation(ceeValue: string): SimulatorSituation {
  const normalizedCeeValue = ceeValue.replace(',', '.').trim();
  const parsedCeeValue = normalizedCeeValue === '' ? null : Number(normalizedCeeValue) / 1000;

  return {
    [CEE_VALUE_RULE]: parsedCeeValue !== null && Number.isFinite(parsedCeeValue) ? parsedCeeValue : null,
  };
}
