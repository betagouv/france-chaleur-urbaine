import type { IssueSeverity } from './types';

export const MAX_ITEMS_PER_ISSUE = 1000;

export const issueSeverityLabels = {
  error: 'Erreur',
  warning: 'Avertissement',
} as const satisfies Record<IssueSeverity, string>;

export const issueSeverityDsfr = {
  error: 'error',
  warning: 'warning',
} as const satisfies Record<IssueSeverity, 'error' | 'warning'>;
