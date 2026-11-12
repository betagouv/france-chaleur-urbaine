import { NetworkUsersCell } from '@/modules/demands/client/NetworkUsersCell';

import type { NetworkTrackingSummary } from './types';
import { useNetworkTrackingRefresh } from './useNetworkTrackingRefresh';

type NetworkTrackingUsersCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Accounts holding a permission on a tracked network; unblocking an address refreshes the tracking screens.
 */
export function NetworkTrackingUsersCell({ network }: NetworkTrackingUsersCellProps) {
  const refresh = useNetworkTrackingRefresh();
  return <NetworkUsersCell users={network.users} onEmailUnblocked={refresh} />;
}
