// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init } from '@sentry/nextjs';

init({
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring / tracing and Session Replay disabled: we only report errors with stack traces.
  tracesSampleRate: 0,
});
