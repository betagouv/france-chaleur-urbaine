import { Badge } from '@codegouvfr/react-dsfr/Badge';

import Tooltip from '@/components/ui/Tooltip';
import { NetworkUsersCell } from '@/modules/demands/client/NetworkUsersCell';

import type { NetworkTrackingSummary } from './types';
import { useNetworkTrackingRefresh } from './useNetworkTrackingRefresh';

export const managersTooltip =
  "Comptes gestionnaire, collectivité ou ALEC actifs ayant une permission sur ce réseau : ils sont prévenus de ses nouvelles demandes et relancés. Les comptes ayant accès via l'organisation du réseau n'en font pas partie.";

type NetworkTrackingManagersCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Managers of a tracked network, flagged when demands are pending and nobody is notified of them.
 * Unblocking an address refreshes the tracking screens.
 */
export function NetworkTrackingManagersCell({ network }: NetworkTrackingManagersCellProps) {
  const refresh = useNetworkTrackingRefresh();
  return network.managers.length === 0 && network.pending > 0 ? (
    <Tooltip title="Des demandes sont à traiter mais aucun compte n'a de permission sur ce réseau : personne n'est prévenu de ses demandes.">
      <Badge small severity="warning" className="cursor-help whitespace-nowrap">
        Aucun gestionnaire
      </Badge>
    </Tooltip>
  ) : (
    <NetworkUsersCell users={network.managers} emptyLabel="Aucun gestionnaire" copyable onEmailUnblocked={refresh} />
  );
}
