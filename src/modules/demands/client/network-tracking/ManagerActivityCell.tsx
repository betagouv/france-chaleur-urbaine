import { formatDurationDays, formatResponseRate, recentWindowLabel } from './format';
import { LastManagerAction } from './LastManagerAction';
import type { NetworkTrackingSummary } from './types';

type ManagerActivityCellProps = {
  network: NetworkTrackingSummary;
};

/**
 * What the managers of a network did with its demands: last action on any of them, then response rate and median delay on the recent ones.
 */
export function ManagerActivityCell({ network }: ManagerActivityCellProps) {
  if (network.state === 'no_demand') {
    return null;
  }
  return (
    <div className="flex flex-col gap-1 text-xs">
      <span className="text-sm">
        <LastManagerAction date={network.lastManagerActionAt} />
      </span>
      {network.recentReceived === 0 ? (
        <span className="text-(--text-mention-grey)">aucune demande reçue sur {recentWindowLabel}</span>
      ) : (
        <>
          <span>
            <span className="font-bold">{formatResponseRate(network.recentResponded, network.recentReceived)}</span> de réponse (
            {network.recentResponded} sur {network.recentReceived})
          </span>
          {network.medianResponseDays !== null && <span>délai médian : {formatDurationDays(network.medianResponseDays)}</span>}
        </>
      )}
    </div>
  );
}
