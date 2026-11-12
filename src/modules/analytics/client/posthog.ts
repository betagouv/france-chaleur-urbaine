import posthog from 'posthog-js';

import { isDevModeEnabled } from '@/hooks/useDevMode';

import type { PostHogEvent, PostHogEventMap } from '../posthog.config';

/**
 * Track un événement vers PostHog.
 *
 * Cette API est séparée de trackEvent() (Matomo) car pas compatible.
 *
 * @param event - Nom de l'événement (format category:object_action)
 * @param properties - Propriétés de l'événement
 */
export function trackPostHogEvent<Event extends PostHogEvent>(event?: Event, properties?: PostHogEventMap[Event]): void {
  if (!event) {
    return;
  }

  const eventProperties = properties ?? {};
  if (isDevModeEnabled()) {
    console.log('[PostHog] track', event, eventProperties);
  }

  posthog.capture(event, eventProperties);
}
