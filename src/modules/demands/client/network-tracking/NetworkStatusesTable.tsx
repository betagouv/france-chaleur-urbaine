import Link from '@/components/ui/Link';
import TableBasic from '@/components/ui/TableBasic';
import { businessRules } from '@/modules/app/business-rules';
import { buildAdminDemandsUrl, buildDemandFilters } from '@/modules/demands/client/admin-demands-url';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import { type DemandStatus, demandStatusGroups } from '@/modules/demands/constants';
import cx from '@/utils/cx';

import { formatDurationDays, historyStartLabel } from './format';
import type { NetworkTrackingDetail } from './types';

const stuckDelay = businessRules.networkTrackingStuckMonths.display;
const closedStatuses: readonly DemandStatus[] = demandStatusGroups.closed;

type NetworkStatusesTableProps = {
  summary: NetworkTrackingDetail['summary'];
  statuses: NetworkTrackingDetail['statuses'];
};

/**
 * Demands of a network by current status: how many, how long they have been in it, and how many open ones are stuck.
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
            <th className="text-right">Demandes</th>
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
                <Link
                  href={buildAdminDemandsUrl([
                    ...buildDemandFilters(summary.networkId, summary.networkType, false),
                    { id: 'Status', value: { [row.status]: true } },
                  ])}
                >
                  {row.count}
                </Link>
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
