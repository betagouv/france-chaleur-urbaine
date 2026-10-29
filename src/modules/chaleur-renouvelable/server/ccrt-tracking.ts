import type { PostHogEvent, PostHogEventMap } from '@/modules/analytics/posthog.config';
import type { Context } from '@/modules/config/server/context-builder';
import { serverConfig } from '@/server/config';
import { kdb } from '@/server/db/kysely';
import { createLogger } from '@/server/helpers/logger';
import { postFetchJSON } from '@/utils/network';

import type { CcrtUpdateDemandeChaleurRenouvelableInput } from '../constants';
import type { ensureCcrtDemandAccess } from './ccrt-access';
import type { applyCcrtFollowUpUpdate } from './ccrt-demand-update';

const logger = createLogger('chaleur-renouvelable:ccrt-tracking');

/**
 * Reports committed transitions using the previous values read under the demand lock.
 */
export const recordCcrtFollowUpChanges = async (
  ctx: Context,
  demand: Pick<Awaited<ReturnType<typeof ensureCcrtDemandAccess>>, 'id' | 'departement_code' | 'alternative_heating_solutions'>,
  changes: Awaited<ReturnType<typeof applyCcrtFollowUpUpdate>>['changes'],
  trigger: CcrtUpdateDemandeChaleurRenouvelableInput['trigger'],
  noteCreated = false
) => {
  if (!changes.status && !noteCreated) {
    return;
  }
  const properties = await getCcrtServerTrackingProperties(ctx, demand);
  const declenchement = trigger === 'contact' ? 'auto' : 'manuel';
  if (changes.status) {
    await recordCcrtPostHogEvent({
      distinctId: ctx.user.id,
      event: 'ccrt_demande:status_changed',
      properties: {
        ...properties,
        declenchement,
        statut_apres: changes.status.to,
        statut_avant: changes.status.from,
        type_statut: 'suivi',
      },
    });
  }
  if (noteCreated) {
    await recordCcrtPostHogEvent({ distinctId: ctx.user.id, event: 'ccrt_demande:internal_note_created', properties });
  }
};

/**
 * Builds the same non-personal demand context for every committed server action.
 */
export const getCcrtServerTrackingProperties = async (
  ctx: Context,
  demand: Pick<Awaited<ReturnType<typeof ensureCcrtDemandAccess>>, 'id' | 'departement_code' | 'alternative_heating_solutions'>
) => {
  const user = await kdb.selectFrom('users').select('structure_name').where('id', '=', ctx.user.id).executeTakeFirst();
  return {
    demande_id: demand.id,
    departement: demand.departement_code,
    solution_1: demand.alternative_heating_solutions[0] ?? null,
    structure_ccrt: user?.structure_name ?? null,
  };
};

/**
 * Relays CCRT workspace events emitted from server-side workflows to PostHog.
 */
export async function recordCcrtPostHogEvent<Event extends PostHogEvent>({
  distinctId,
  event,
  properties,
}: {
  distinctId: string;
  event: Event;
  properties: PostHogEventMap[Event];
}) {
  const postHogApiHost = serverConfig.tracking?.postHogApiHost;
  const postHogKey = serverConfig.tracking?.postHogKey;

  if (!postHogApiHost || !postHogKey) {
    return;
  }

  try {
    await postFetchJSON(`${postHogApiHost}/capture/`, {
      api_key: postHogKey,
      distinct_id: distinctId,
      event,
      properties: { ...properties, $process_person_profile: false, source: 'ccrt_workspace' },
    });
  } catch (error) {
    logger.warn('PostHog CCRT tracking failed', {
      error: error instanceof Error ? error.message : error,
      event,
    });
  }
}
