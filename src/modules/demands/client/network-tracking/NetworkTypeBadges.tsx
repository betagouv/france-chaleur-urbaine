import DSFRBadge from '@codegouvfr/react-dsfr/Badge';

import Tooltip from '@/components/ui/Tooltip';
import { reseauDeChaleurNonClasseColor } from '@/modules/map/client/layers/specs/reseauxDeChaleur';
import { reseauxEnConstructionColor } from '@/modules/map/client/layers/specs/reseauxEnConstruction';
import type { NetworkType } from '@/modules/reseaux/constants';

export const networkTypeLabels = {
  reseau_de_chaleur: 'Existant',
  reseau_en_construction: 'En construction',
} as const satisfies Record<NetworkType, string>;

const networkTypeDescriptions = {
  reseau_de_chaleur: 'Réseau de chaleur existant',
  reseau_en_construction: 'Réseau de chaleur en construction',
} as const satisfies Record<NetworkType, string>;

const networkTypeColors = {
  reseau_de_chaleur: reseauDeChaleurNonClasseColor,
  reseau_en_construction: reseauxEnConstructionColor,
} as const satisfies Record<NetworkType, string>;

type NetworkTypeBadgesProps = {
  networkType: NetworkType;
  sncuId: string | null;
};

/**
 * Badges identifying a network: its type in the colour it has on the map, and its SNCU identifier when it has one.
 */
export function NetworkTypeBadges({ networkType, sncuId }: NetworkTypeBadgesProps) {
  return (
    <>
      <Tooltip title={networkTypeDescriptions[networkType]}>
        <DSFRBadge small className="text-white! cursor-help whitespace-nowrap" style={{ backgroundColor: networkTypeColors[networkType] }}>
          {networkTypeLabels[networkType]}
        </DSFRBadge>
      </Tooltip>
      {sncuId && (
        <Tooltip title="Identifiant SNCU du réseau">
          <DSFRBadge small className="cursor-help">
            {sncuId}
          </DSFRBadge>
        </Tooltip>
      )}
    </>
  );
}
