import DSFRBadge from '@codegouvfr/react-dsfr/Badge';

import { reseauDeChaleurNonClasseColor } from '@/components/Map/layers/reseauxDeChaleur';
import { reseauxEnConstructionColor } from '@/components/Map/layers/reseauxEnConstruction';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import type { NetworkType } from '@/modules/reseaux/constants';

type AffectedNetworkProps = {
  networkName: string | null;
  networkType: NetworkType | null;
  networkSncuId: string | null;
  distance: number | null | undefined;
  notFound?: boolean;
};

/**
 * Affichage lecture seule du réseau affecté à une demande.
 * Badges (existant / en construction), identifiant SNCU, nom et distance.
 * Si `notFound` est vrai, affiche un fallback "Réseau introuvable" (ex. réseau supprimé).
 */
export default function AffectedNetwork({ networkName, networkType, networkSncuId, distance, notFound }: AffectedNetworkProps) {
  if (notFound) {
    return (
      <Tooltip title="Le réseau demandé n'existe plus ou est introuvable">
        <span className="inline-flex items-center gap-1 text-sm text-gray-500 italic">
          <Icon name="fr-icon-warning-line" size="sm" color="var(--text-default-warning)" />
          Réseau introuvable
        </span>
      </Tooltip>
    );
  }

  if (!networkName || !networkType) {
    return <span className="text-gray-400 italic text-sm">Non affecté</span>;
  }

  const isExistant = networkType === 'existant';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Tooltip title={isExistant ? 'Réseau de chaleur existant' : 'Réseau de chaleur en construction'}>
          <DSFRBadge
            small
            className="text-white! cursor-help shrink-0"
            style={{ backgroundColor: isExistant ? reseauDeChaleurNonClasseColor : reseauxEnConstructionColor }}
          >
            {isExistant ? 'Existant' : 'En construction'}
          </DSFRBadge>
        </Tooltip>
        {networkSncuId && (
          <Tooltip title="Identifiant SNCU du réseau">
            <DSFRBadge small className="cursor-help shrink-0">
              {networkSncuId}
            </DSFRBadge>
          </Tooltip>
        )}
      </div>

      <span className="text-sm font-semibold leading-snug">{networkName}</span>

      {distance === 0 ? (
        <span className="text-xs text-gray-500">Dans la zone</span>
      ) : distance === null ? (
        <span className="text-xs text-gray-500 italic">Distance inconnue</span>
      ) : (
        distance != null && distance > 0 && <span className="text-xs text-gray-500">Distance au réseau : {distance} m</span>
      )}
    </div>
  );
}
