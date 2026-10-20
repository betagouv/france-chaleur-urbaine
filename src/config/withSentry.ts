import { type SentryBuildOptions, withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

import { clientConfig } from '../client-config';

const withSentry =
  (webpackPluginOptions: SentryBuildOptions = {}) =>
  (nextConfig: NextConfig) => {
    if (!clientConfig.sentryDsn) {
      if (!process.env.SENTRY_DISABLED_IGNORE_WARNING) {
        console.info('Sentry is disabled: NEXT_PUBLIC_SENTRY_DSN is not defined');
      }
      return nextConfig;
    }

    return withSentryConfig(nextConfig, webpackPluginOptions);
  };

export default withSentry;
