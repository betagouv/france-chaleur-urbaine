// This file configures the initialization of Sentry on the server (Next.js nodejs runtime and cron).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init } from '@sentry/nextjs';

import { sentryOptions } from './src/config/sentry';

init(sentryOptions);
