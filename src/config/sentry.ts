import type { init } from '@sentry/nextjs';

import { clientConfig } from '@/client-config';

// Options shared by the 3 Sentry runtimes: sentry.server.config.ts, sentry.edge.config.ts and src/instrumentation-client.ts.
// Build-time integration (source maps upload) lives in withSentry.ts.
export const sentryOptions: Parameters<typeof init>[0] = {
  dsn: clientConfig.sentryDsn,

  // "production" only on the production site, "development" everywhere else (local, staging, review apps) so that errors are never mixed.
  environment: clientConfig.isProductionSite ? 'production' : 'development',

  // Never send PII (IP, cookies, headers): errors are correlated by stack trace only, users are never identified in Sentry
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Performance monitoring / tracing disabled: we only report errors with stack traces.
  tracesSampleRate: 0,
};
