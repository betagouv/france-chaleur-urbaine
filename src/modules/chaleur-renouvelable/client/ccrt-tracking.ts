import { trackPostHogEvent } from '@/modules/analytics/client';
import type { PostHogEventMap } from '@/modules/analytics/posthog.config';
import type { RouterOutput } from '@/modules/trpc/client';

import type { CcrtDemand } from '../types';

/** Builds demand context without contact details or user-entered content. */
export const getCcrtTrackingProperties = (demand: CcrtDemand, structureName: string | null = null) => ({
  demande_id: demand.id,
  departement: demand.departement_code,
  solution_1: demand.alternative_heating_solutions[0] ?? null,
  structure_ccrt: structureName,
});

/** Tracks only transitions confirmed by the server, through the consent-controlled browser SDK. */
export const trackCcrtFollowUpChanges = (
  properties: PostHogEventMap['ccrt_demande:internal_note_created'],
  result: Pick<RouterOutput['batEnr']['ccrt']['updateDemandeChaleurRenouvelable'], 'changes'> & { noteCreated?: boolean },
  trigger: 'manuel' | 'auto' = 'manuel'
) => {
  if (result.changes.status) {
    trackPostHogEvent('ccrt_demande:status_changed', {
      ...properties,
      declenchement: trigger,
      statut_apres: result.changes.status.to,
      statut_avant: result.changes.status.from,
      type_statut: 'suivi',
    });
  }
  if (result.noteCreated) {
    trackPostHogEvent('ccrt_demande:internal_note_created', properties);
  }
};
