import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import { addresseToPublicodesRules } from '@/components/ComparateurPublicodes/mappings';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { ObjectEntries } from '@/utils/typescript';

export type TypeBatiment = 'résidentiel' | 'tertiaire';
export type TertiarySector = 'Bureaux' | 'Enseignement' | 'Commerces' | 'Café, restaurant' | 'Hôtel' | 'Santé' | 'Autres';
export type HotWaterProduction = 'oui' | 'non';
export type SimulatorFormState = {
  address: string;
  selectedAddress: BANAddressFeature | null;
  nbLogements?: number;
  producesHotWater: HotWaterProduction;
  surface?: number;
  tertiarySector: TertiarySector;
  typeBatiment: TypeBatiment;
};

export type SimulatorSituation = Partial<Record<RuleName, number | string | null>>;
export const buildAddressSituation = (infos?: LocationInfoResponse | null): SimulatorSituation =>
  ObjectEntries(addresseToPublicodesRules).reduce<SimulatorSituation>((acc, [key, infoGetter]) => {
    acc[key] = infos ? (infoGetter(infos) ?? null) : null;
    return acc;
  }, {});

type PublicodeSituationInput = Pick<SimulatorFormState, 'nbLogements' | 'producesHotWater' | 'surface' | 'tertiarySector' | 'typeBatiment'>;
export function buildPublicodeSituation({
  nbLogements,
  producesHotWater,
  surface,
  tertiarySector,
  typeBatiment,
}: PublicodeSituationInput): SimulatorSituation {
  return {
    'méthode tertiaire': typeBatiment === 'tertiaire' ? `'${tertiarySector}'` : null,
    "nombre de logements dans l'immeuble concerné":
      typeBatiment === 'résidentiel' && nbLogements != null && nbLogements > 0 ? nbLogements : null,
    'Production eau chaude sanitaire': typeBatiment === 'tertiaire' ? producesHotWater : 'oui',
    'surface logement type tertiaire': typeBatiment === 'tertiaire' && surface != null && surface > 0 ? surface : null,
    'type de bâtiment': `'${typeBatiment}'`,
  };
}
