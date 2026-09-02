import { serverConfig } from '@/server/config';
import { createLogger } from '@/server/helpers/logger';
import { postFetchJSON } from '@/utils/network';

import type { SimulateurPacEventInput } from '../constants';

const logger = createLogger('pac:tracking');

type SimulateurPacTrackingResult =
  | {
      tracked: true;
    }
  | {
      reason: 'posthog_disabled' | 'posthog_failed';
      tracked: false;
    };

type PostHogCapturePayload = {
  api_key: string;
  distinct_id: string;
  event: SimulateurPacEventInput['event'];
  properties: SimulateurPacEventInput['properties'] & {
    $process_person_profile: false;
    source: 'simulateur_pac';
  };
};

/**
 * Relays whitelisted PAC simulator events to PostHog from the FCU backend.
 */
export async function recordSimulateurPacEvent(input: SimulateurPacEventInput): Promise<SimulateurPacTrackingResult> {
  const postHogApiHost = serverConfig.tracking.postHogApiHost;
  const postHogKey = serverConfig.tracking.postHogKey;

  if (!postHogApiHost || !postHogKey) {
    return { reason: 'posthog_disabled', tracked: false };
  }

  try {
    await postFetchJSON(`${postHogApiHost}/capture/`, getPostHogCapturePayload(input, postHogKey));
    return { tracked: true };
  } catch (error) {
    logger.warn('PostHog PAC tracking failed', {
      error: error instanceof Error ? error.message : error,
      event: input.event,
    });
    return { reason: 'posthog_failed', tracked: false };
  }
}

function getPostHogCapturePayload(input: SimulateurPacEventInput, postHogKey: string): PostHogCapturePayload {
  return {
    api_key: postHogKey,
    distinct_id: input.distinctId,
    event: input.event,
    properties: {
      ...input.properties,
      $process_person_profile: false,
      source: 'simulateur_pac',
    },
  };
}
