import { NetworkUsersCell } from '@/modules/demands/client/NetworkUsersCell';
import trpc from '@/modules/trpc/client';

import type { NetworkTrackingSummary } from './types';

type NetworkTrackingUsersCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Accounts holding a permission on a tracked network; unblocking an address refreshes the tracking table.
 */
export function NetworkTrackingUsersCell({ network }: NetworkTrackingUsersCellProps) {
  const utils = trpc.useUtils();
  return <NetworkUsersCell users={network.users} onEmailUnblocked={() => utils.demands.admin.listNetworkTracking.invalidate()} />;
}
