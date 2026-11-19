import Link from '@/components/ui/Link';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import cx from '@/utils/cx';

import { formatDateRange, recentWindowLabel } from './format';
import { NetworkOlderDemands } from './NetworkOlderDemands';
import type { NetworkTrackingSummary } from './types';

type NetworkDemandsCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Demands of a network: the recent ones first, pending (with the dates of the oldest and newest one) then all, each figure linking to them; the older ones below, apart.
 */
export function NetworkDemandsCell({ network }: NetworkDemandsCellProps) {
  if (network.state === 'no_demand') {
    return <span className="text-sm text-gray-400">Aucune demande</span>;
  }
  return (
    <div className="flex flex-col gap-2 text-xs">
      {network.recentTotal === 0 ? (
        <span className="text-(--text-mention-grey)">Aucune demande sur {recentWindowLabel}</span>
      ) : (
        <>
          <div className="flex flex-col">
            <span>
              <Link
                href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, true, 'recent'))}
                className={cx('text-base font-bold', network.recentPending > 0 && 'text-error')}
              >
                {network.recentPending}
              </Link>{' '}
              à traiter
            </span>
            {network.oldestRecentPendingDemandAt && network.newestRecentPendingDemandAt && (
              <span className="text-(--text-mention-grey)">
                {formatDateRange(network.oldestRecentPendingDemandAt, network.newestRecentPendingDemandAt)}
              </span>
            )}
          </div>
          <span>
            <Link
              href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, false, 'recent'))}
              className="text-base font-bold"
            >
              {network.recentTotal}
            </Link>{' '}
            sur {recentWindowLabel}
          </span>
        </>
      )}
      <NetworkOlderDemands network={network} />
    </div>
  );
}
