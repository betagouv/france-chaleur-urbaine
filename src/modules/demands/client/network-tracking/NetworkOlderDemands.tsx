import Link from '@/components/ui/Link';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import cx from '@/utils/cx';

import { formatDay } from './format';
import type { NetworkTrackingSummary } from './types';

type NetworkOlderDemandsProps = {
  network: NetworkTrackingSummary;
  className?: string;
};

/**
 * Demands of a network deposited before the recent window, kept apart from its indicators: how many, how many still pending (each linking to them) and since when.
 * Renders nothing for a network without any.
 */
export function NetworkOlderDemands({ network, className }: NetworkOlderDemandsProps) {
  if (network.olderTotal === 0) {
    return null;
  }
  return (
    <span className={cx('flex flex-col text-(--text-mention-grey)', className)}>
      <span>
        +{' '}
        <Link href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, false, 'older'))}>
          {network.olderTotal}
        </Link>{' '}
        plus ancienne{network.olderTotal > 1 && 's'}
        {network.olderPending > 0 && (
          <>
            ,{' '}
            <span className="whitespace-nowrap">
              dont{' '}
              <Link href={buildAdminDemandsUrl(buildDemandFilters(network.networkId, network.networkType, true, 'older'))}>
                {network.olderPending}
              </Link>{' '}
              à traiter
            </span>
          </>
        )}
      </span>
      {network.oldestDemandAt && <span>depuis le {formatDay(network.oldestDemandAt)}</span>}
    </span>
  );
}
