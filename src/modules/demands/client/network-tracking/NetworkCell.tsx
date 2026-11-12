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
 * Identity of a network in the tracking table: state, type and SNCU badges, name linking to its detail, and its power.
 */
export function NetworkCell({ network }: NetworkCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <NetworkTrackingStateBadge state={network.state} />
        <NetworkTypeBadges networkType={network.networkType} sncuId={network.sncuId} />
      </div>
      <Link
        href={buildNetworkTrackingUrl(network.networkType, network.networkId)}
        className="self-start text-sm font-semibold leading-snug"
      >
        {getNetworkName(network)}
      </Link>
      {isDefined(network.powerMW) && <span className="text-xs text-(--text-mention-grey)">{formatMW(network.powerMW)}</span>}
    </div>
  );
}
