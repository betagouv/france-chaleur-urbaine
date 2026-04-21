import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import { addresseToPublicodesRules } from '@/components/ComparateurPublicodes/mappings';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { ObjectEntries } from '@/utils/typescript';

export type TypeBatiment = 'résidentiel' | 'tertiaire';
export type SimulatorFormState = {
  address: string;
  selectedAddress: BANAddressFeature | null;
  nbLogements?: number;
  producesHotWater: 'oui' | 'non';
  surface?: number;
  tertiarySector: 'Bureaux' | 'Enseignement' | 'Commerces' | 'Hôtellerie/Restauration' | 'Santé' | 'Autres';
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
    'méthode tertiaire 2026': typeBatiment === 'tertiaire' ? `'${tertiarySector}'` : null,
    "nombre de logements dans l'immeuble concerné":
      typeBatiment === 'résidentiel' && nbLogements != null && nbLogements > 0 ? nbLogements : null,
    'Production eau chaude sanitaire': typeBatiment === 'tertiaire' ? producesHotWater : 'oui',
    'surface logement type tertiaire': typeBatiment === 'tertiaire' && surface != null && surface > 0 ? surface : null,
    'type de bâtiment': `'${typeBatiment}'`,
  };
}
