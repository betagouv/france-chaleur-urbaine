import { Badge } from '@codegouvfr/react-dsfr/Badge';

import Tooltip from '@/components/ui/Tooltip';
import { NetworkUsersCell } from '@/modules/demands/client/NetworkUsersCell';

import type { NetworkTrackingSummary } from './types';
import { useNetworkTrackingRefresh } from './useNetworkTrackingRefresh';

type NetworkTrackingUsersCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Accounts holding a permission on a tracked network, flagged when demands are pending and no account can answer them.
 * Unblocking an address refreshes the tracking screens.
 */
export function NetworkTrackingUsersCell({ network }: NetworkTrackingUsersCellProps) {
  const refresh = useNetworkTrackingRefresh();
  return network.users.length === 0 && network.pending > 0 ? (
    <Tooltip title="Des demandes sont à traiter mais aucun compte n'a accès à ce réseau : personne ne peut y répondre.">
      <Badge small severity="warning" className="cursor-help whitespace-nowrap">
        Aucun utilisateur
      </Badge>
    </Tooltip>
  ) : (
    <NetworkUsersCell users={network.users} onEmailUnblocked={refresh} />
  );
}
