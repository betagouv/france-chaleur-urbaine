import { normalize } from '@/utils/strings';

import {
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_COMPLETED,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  demandeChaleurRenouvelableStatuses,
} from '../constants';
import type { CcrtDemand } from '../types';
import type { CcrtDemandTab } from './CcrtDemandTabs';

/**
 * Separates the postal locality from the street without rewriting the saved address.
 */
export const formatCcrtAddress = (address: string): string => address.replace(/(?:,\s*|\s+)(\d{5}\s+\S.*)$/, ', $1');

const closedStatuses = new Set<string>(
  demandeChaleurRenouvelableStatuses
    .filter((status) => ['irrelevant', 'redirected_france_renov', 'abandoned_by_prospect'].includes(status.value))
    .map((status) => status.label)
);

/**
 * Groups existing follow-up statuses without changing their stored values.
 */
export function getCcrtDemandTab(demand: Pick<CcrtDemand, 'status'>): Exclude<CcrtDemandTab, 'all'> {
  return demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS
    ? 'to_process'
    : demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_COMPLETED
      ? 'completed'
      : closedStatuses.has(demand.status)
        ? 'closed'
        : 'in_progress';
}

/**
 * Matches a demand by its contact, address or identifier, ignoring accents.
 */
export function matchesCcrtDemandSearch(
  demand: Pick<CcrtDemand, 'id' | 'first_name' | 'last_name' | 'email' | 'phone' | 'address'>,
  search: string
): boolean {
  const searchableText = normalize([demand.id, demand.first_name, demand.last_name, demand.email, demand.phone, demand.address].join(' '));
  return normalize(search)
    .trim()
    .split(/\s+/)
    .every((term) => searchableText.includes(term));
}
