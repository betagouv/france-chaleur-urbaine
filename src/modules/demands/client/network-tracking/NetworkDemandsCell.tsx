import Link from '@/components/ui/Link';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import cx from '@/utils/cx';

import { formatDateRange } from './format';
import type { NetworkTrackingSummary } from './types';

type NetworkDemandsCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Demands of a network, pending then all: how many (linking to them) and, below each figure, the dates of the oldest and newest one.
 */
export function NetworkDemandsCell({ network }: NetworkDemandsCellProps) {
  if (network.total === 0) {
    return <span className="text-sm text-gray-400">Aucune demande</span>;
  }
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-col">
        <span>
          <Link
            href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, true))}
            className={cx('text-base font-bold', network.pending > 0 && 'text-error')}
          >
            {network.pending}
          </Link>{' '}
          à traiter
        </span>
        {network.oldestPendingDemandAt && network.newestPendingDemandAt && (
          <span className="text-(--text-mention-grey)">
            {formatDateRange(network.oldestPendingDemandAt, network.newestPendingDemandAt)}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span>
          <Link
            href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, false))}
            className="text-base font-bold"
          >
            {network.total}
          </Link>{' '}
          au total
        </span>
        {network.oldestDemandAt && network.newestDemandAt && (
          <span className="text-(--text-mention-grey)">{formatDateRange(network.oldestDemandAt, network.newestDemandAt)}</span>
        )}
      </div>
    </div>
  );
}
