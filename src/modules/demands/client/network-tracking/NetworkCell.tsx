import Link from '@/components/ui/Link';
import { isDefined } from '@/utils/core';
import { formatMW } from '@/utils/strings';

import { buildNetworkTrackingUrl, getNetworkName } from './format';
import { NetworkTrackingStateBadge } from './NetworkTrackingStateBadge';
import { NetworkTypeBadges } from './NetworkTypeBadges';
import type { NetworkTrackingSummary } from './types';

type NetworkCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * Identity of a network in the tracking table: name linking to its detail followed by its state, then its type, SNCU identifier and power.
 */
export function NetworkCell({ network }: NetworkCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href={buildNetworkTrackingUrl(network.networkType, network.networkId)} className="text-sm font-semibold leading-snug">
          {getNetworkName(network)}
        </Link>
        <NetworkTrackingStateBadge state={network.state} />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <NetworkTypeBadges networkType={network.networkType} sncuId={network.sncuId} />
        {isDefined(network.powerMW) && <span className="text-xs text-(--text-mention-grey)">{formatMW(network.powerMW)}</span>}
      </div>
    </div>
  );
}
