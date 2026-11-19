import Link from '@/components/ui/Link';
import TableBasic from '@/components/ui/TableBasic';
import { businessRules } from '@/modules/app/business-rules';
import { buildAdminDemandsUrl, buildDemandFilters, type DemandsAge } from '@/modules/demands/client/admin-demands-url';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import { type DemandStatus, demandStatusGroups } from '@/modules/demands/constants';
import cx from '@/utils/cx';

import { formatDurationDays, historyStartLabel, recentWindowLabel } from './format';
import type { NetworkTrackingDetail } from './types';

const stuckDelay = businessRules.networkTrackingStuckMonths.display;
const closedStatuses: readonly DemandStatus[] = demandStatusGroups.closed;

type NetworkStatusesTableProps = {
  summary: NetworkTrackingDetail['summary'];
  statuses: NetworkTrackingDetail['statuses'];
};

/**
 * Demands of a network by current status: how many recent and older ones, how long they have been in it, and how many open ones are stuck.
 */
export function NetworkStatusesTable({ summary, statuses }: NetworkStatusesTableProps) {
  if (statuses.length === 0) {
    return <p className="mb-0 text-sm text-(--text-mention-grey)">Aucune demande validée n'est affectée à ce réseau.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <TableBasic bordered noScroll className="mb-0 overflow-x-auto" tableClassName="text-sm">
        <thead>
          <tr>
            <th>Statut</th>
            <th className="text-right">Depuis {recentWindowLabel}</th>
            <th className="text-right">Plus anciennes</th>
            <th className="text-right">Âge médian dans le statut</th>
            <th className="text-right">Bloquées depuis plus de {stuckDelay}</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((row) => (
            <tr key={row.status}>
              <td>
                <DemandStatusBadge status={row.status} />
              </td>
              <td className="text-right">
                <StatusDemandsCount summary={summary} status={row.status} age="recent" count={row.recentCount} />
              </td>
              <td className="text-right">
                <StatusDemandsCount summary={summary} status={row.status} age="older" count={row.olderCount} />
              </td>
              <td className="text-right">{row.medianAgeDays !== null ? formatDurationDays(row.medianAgeDays) : '—'}</td>
              <td className={cx('text-right', !closedStatuses.includes(row.status) && row.stuckCount > 0 && 'font-bold text-error')}>
                {closedStatuses.includes(row.status) ? '—' : row.stuckCount}
              </td>
            </tr>
          ))}
        </tbody>
      </TableBasic>
      <p className="mb-0 text-xs text-(--text-mention-grey)">
        Un statut posé avant {historyStartLabel} est compté depuis cette date, faute d'historique : son âge réel est supérieur.
      </p>
    </div>
  );
}

type StatusDemandsCountProps = {
  summary: NetworkTrackingDetail['summary'];
  status: DemandStatus;
  age: DemandsAge;
  count: number;
};

/**
 * Number of demands of a network in one status, on one side of the recent window, linking to them when there are any.
 */
function StatusDemandsCount({ summary, status, age, count }: StatusDemandsCountProps) {
  return count === 0 ? (
    <span className="text-(--text-mention-grey)">0</span>
  ) : (
    <Link
      href={buildAdminDemandsUrl([
        ...buildDemandFilters(summary.networkId, summary.networkType, false, age),
        { id: 'Status', value: { [status]: true } },
      ])}
    >
      {count}
    </Link>
  );
}
