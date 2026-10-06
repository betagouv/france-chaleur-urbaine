import type { PostHogEvent, PostHogEventMap } from '@/modules/analytics/posthog.config';
import { serverConfig } from '@/server/config';
import { createLogger } from '@/server/helpers/logger';
import { postFetchJSON } from '@/utils/network';

const logger = createLogger('chaleur-renouvelable:ccrt-tracking');

type ServerPostHogCapturePayload<Event extends PostHogEvent> = {
  api_key: string;
  distinct_id: string;
  event: Event;
  properties: PostHogEventMap[Event] & {
    $process_person_profile: false;
    source: 'ccrt_workspace';
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
    await postFetchJSON(`${postHogApiHost}/capture/`, getPostHogCapturePayload({ distinctId, event, properties }, postHogKey));
  } catch (error) {
    logger.warn('PostHog CCRT tracking failed', {
      error: error instanceof Error ? error.message : error,
      event,
    });
  }
}

function getPostHogCapturePayload<Event extends PostHogEvent>(
  input: {
    distinctId: string;
    event: Event;
    properties: PostHogEventMap[Event];
  },
  postHogKey: string
): ServerPostHogCapturePayload<Event> {
  return {
    api_key: postHogKey,
    distinct_id: input.distinctId,
    event: input.event,
    properties: {
      ...input.properties,
      $process_person_profile: false,
      source: 'ccrt_workspace',
    },
  };
}
