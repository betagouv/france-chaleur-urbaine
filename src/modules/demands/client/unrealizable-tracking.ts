import type { UnrealizableDialogTrackingProperties } from '@/modules/analytics/posthog.config';
import type { Demand } from '@/modules/demands/types';
import type { UserRole } from '@/types/enum/UserRole';

/** Where the reason dialog was opened from: the status select, or a refusal email template. */
export type UnrealizableDialogSource = UnrealizableDialogTrackingProperties['source'];

export type UnrealizableTrackedDemand = Pick<Demand, 'en PDP' | 'network_id' | 'network_type'>;

/**
 * Non-personal context shared by the PostHog events of the unrealizable reason dialog.
 */
export const getUnrealizableDialogContext = (
  demand: UnrealizableTrackedDemand,
  userRole: UserRole | undefined,
  source: UnrealizableDialogSource
): UnrealizableDialogTrackingProperties => ({
  is_in_pdp: demand['en PDP'] === 'Oui',
  network_id: demand.network_id ?? null,
  network_type: demand.network_type ?? null,
  source,
  user_role: userRole ?? null,
});
