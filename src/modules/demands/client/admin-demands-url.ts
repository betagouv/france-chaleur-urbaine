import type { ColumnFiltersState } from '@tanstack/react-table';

import type { NetworkType } from '@/modules/reseaux/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { objectToURLSearchParams } from '@/utils/network';

/** URL of the admin demands list with the given table filters applied. */
export const buildAdminDemandsUrl = (filters: ColumnFiltersState) => {
  return `/admin/demandes?${objectToURLSearchParams({ demands_filters: filters }).toString()}`;
};

/** Filters of the admin demands list for the validated demands of a network, optionally limited to pending demands. */
export const buildDemandFilters = (networkId: number, networkType: NetworkType, pendingOnly: boolean): ColumnFiltersState => [
  { id: 'network_id', value: { [`${networkType}:${networkId}`]: true } },
  { id: 'validated', value: { false: false, true: true } },
  ...(pendingOnly ? [{ id: 'Status', value: { [DEMANDE_STATUS.TO_PROCESS]: true } }] : []),
];
