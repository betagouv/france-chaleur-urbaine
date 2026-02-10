// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

/**
 * Check if PostHog consent was already given by reading the DSFR consent stored in localStorage.
 * This must run synchronously before posthog.init() to initialize with the right persistence mode,
 * otherwise a new distinct_id is generated on every page load when using memory persistence.
 */
const hasPostHogConsent = () => {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
      .filter((key): key is string => !!key?.startsWith('@codegouvfr/react-dsfr finalityConsent'))
      .some((key) => JSON.parse(localStorage.getItem(key)!).posthog === true);
  } catch {
    return false;
  }
};

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  const consentGiven = hasPostHogConsent();

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: '/ph',
    autocapture: consentGiven,
    capture_pageview: consentGiven,
    cross_subdomain_cookie: false,
    defaults: '2026-01-30',
    disable_session_recording: true,
    loaded: (posthog) => {
      if (process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true') posthog.debug();
    },
    persistence: consentGiven ? 'localStorage+cookie' : 'memory',
    person_profiles: 'always',
    respect_dnt: true,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}
