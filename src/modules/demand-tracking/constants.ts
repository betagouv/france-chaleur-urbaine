import { z } from 'zod';

import type { DemandStatusDisplay } from '@/modules/demands/constants';

export const zRequestDemandTrackingInput = z.object({
  // normalized before the format check so a pasted address with spaces is accepted, and matched case-insensitively
  email: z.string().trim().toLowerCase().pipe(z.email('Veuillez saisir une adresse email valide')),
});
export type RequestDemandTrackingInput = z.infer<typeof zRequestDemandTrackingInput>;

/** Where the "Suivre ma demande" form is embedded (PostHog `emplacement`). */
export const demandTrackingPlacements = ['homepage', 'page_suivi'] as const;
export type DemandTrackingPlacement = (typeof demandTrackingPlacements)[number];

export const DEMAND_TRACKING_PAGE_PATH = '/suivre-ma-demande';

export const demandTrackingDemandTypes = ['raccordement', 'accompagnement'] as const;
export type DemandTrackingDemandType = (typeof demandTrackingDemandTypes)[number];

/** One row of the "Où en est votre demande ?" email. */
export type DemandTrackingEmailRow = {
  address: string;
  type: DemandTrackingDemandType;
  status: DemandStatusDisplay;
};
