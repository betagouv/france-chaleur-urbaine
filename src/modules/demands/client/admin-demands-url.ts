import type { ColumnFiltersState } from '@tanstack/react-table';

import { getRecentDemandsStart } from '@/modules/demands/constants';
import type { NetworkType } from '@/modules/reseaux/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { dayjs } from '@/utils/date';
import { objectToURLSearchParams } from '@/utils/network';

/** Side of the network tracking window: demands deposited since `getRecentDemandsStart`, or before. */
export type DemandsAge = 'recent' | 'older';

/** URL of the admin demands list with the given table filters applied. */
export const buildAdminDemandsUrl = (filters: ColumnFiltersState) => {
  return `/admin/demandes?${objectToURLSearchParams({ demands_filters: filters }).toString()}`;
};

/**
 * Filters of the admin demands list for the validated demands of a network, optionally limited to pending demands and to one side of the network tracking window.
 * The date filter compares ISO strings: a day alone as lower bound includes it, as upper bound excludes it.
 */
export const buildDemandFilters = (
  networkId: number,
  networkType: NetworkType,
  pendingOnly: boolean,
  age?: DemandsAge
): ColumnFiltersState => {
  const recentStartDay = dayjs.utc(getRecentDemandsStart(new Date())).format('YYYY-MM-DD');
  return [
    { id: 'network_id', value: { [`${networkType}:${networkId}`]: true } },
    { id: 'validated', value: { false: false, true: true } },
    ...(pendingOnly ? [{ id: 'Status', value: { [DEMANDE_STATUS.TO_PROCESS]: true } }] : []),
    ...(age ? [{ id: 'Date de la demande', value: age === 'recent' ? [recentStartDay, null, false] : [null, recentStartDay, false] }] : []),
  ];
};
