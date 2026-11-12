import Link from '@/components/ui/Link';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import cx from '@/utils/cx';

import { formatDateRange } from './format';
import type { NetworkTrackingSummary } from './types';

type NetworkDemandsCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Demands of a network, pending then all: how many (linking to them) and the dates of the oldest and newest one.
 */
export function NetworkDemandsCell({ network }: NetworkDemandsCellProps) {
  if (network.total === 0) {
    return <span className="text-sm text-gray-400">Aucune demande</span>;
  }
  return (
    <div className="grid w-full grid-cols-[auto_1fr] items-baseline gap-x-2 gap-y-1 text-xs">
      <span>
        <Link
          href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, undefined, true))}
          className={cx('text-base font-bold', network.pending > 0 && 'text-error')}
        >
          {network.pending}
        </Link>{' '}
        à traiter
      </span>
      <span className="text-right text-(--text-mention-grey)">
        {network.oldestPendingDemandAt && network.newestPendingDemandAt
          ? formatDateRange(network.oldestPendingDemandAt, network.newestPendingDemandAt)
          : ''}
      </span>
      <span>
        <Link
          href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, undefined, false))}
          className="text-base font-bold"
        >
          {network.total}
        </Link>{' '}
        au total
      </span>
      <span className="text-right text-(--text-mention-grey)">
        {network.oldestDemandAt && network.newestDemandAt ? formatDateRange(network.oldestDemandAt, network.newestDemandAt) : ''}
      </span>
    </div>
  );
}
