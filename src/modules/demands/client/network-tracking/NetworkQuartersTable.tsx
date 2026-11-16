import TableBasic from '@/components/ui/TableBasic';

import { formatDurationDays, formatResponseRate } from './format';
import type { NetworkTrackingDetail } from './types';

/** `2026-T3` → `T3 2026` */
const formatQuarter = (quarter: string) => quarter.split('-').reverse().join(' ');

type NetworkQuartersTableProps = {
  quarters: NetworkTrackingDetail['quarters'];
};

/**
 * Response of the managers of a network quarter by quarter: demands received, answered, and median delay before the first action.
 */
export function NetworkQuartersTable({ quarters }: NetworkQuartersTableProps) {
  if (quarters.length === 0) {
    return <p className="mb-0 text-sm text-(--text-mention-grey)">Aucune demande reçue sur la période.</p>;
  }
  return (
    <TableBasic bordered noScroll className="mb-0 overflow-x-auto" tableClassName="text-sm">
      <thead>
        <tr>
          <th>Trimestre de réception</th>
          <th className="text-right">Demandes reçues</th>
          <th className="text-right">Avec réponse</th>
          <th className="text-right">Délai médian de réponse</th>
        </tr>
      </thead>
      <tbody>
        {quarters.map((row) => (
          <tr key={row.quarter}>
            <td>{formatQuarter(row.quarter)}</td>
            <td className="text-right">{row.received}</td>
            <td className="text-right">
              {row.responded} ({formatResponseRate(row.responded, row.received)})
            </td>
            <td className="text-right">{row.medianResponseDays !== null ? formatDurationDays(row.medianResponseDays) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </TableBasic>
  );
}
