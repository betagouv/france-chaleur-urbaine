import type { ColumnFiltersState } from '@tanstack/react-table';
import dayjs from 'dayjs';

import type { NetworkType } from '@/modules/reseaux/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { isDefined } from '@/utils/core';
import { objectToURLSearchParams } from '@/utils/network';

/** URL of the admin demands list with the given table filters applied. */
export const buildAdminDemandsUrl = (filters: ColumnFiltersState) => {
  return `/admin/demandes?${objectToURLSearchParams({ demands_filters: filters }).toString()}`;
};

/** Filters of the admin demands list for the validated demands of a network, optionally limited to a recent period or to pending demands. */
export const buildDemandFilters = (
  networkId: number,
  networkType: NetworkType,
  periodMonths: number | undefined,
  pendingOnly: boolean
): ColumnFiltersState => [
  { id: 'network_id', value: { [`${networkType}:${networkId}`]: true } },
  { id: 'validated', value: { false: false, true: true } },
  ...(pendingOnly ? [{ id: 'Status', value: { [DEMANDE_STATUS.TO_PROCESS]: true } }] : []),
  ...(isDefined(periodMonths)
    ? [{ id: 'Date de la demande', value: [dayjs().subtract(periodMonths, 'month').format('YYYY-MM-DD'), null, false] }]
    : []),
];
