import { type SentryBuildOptions, withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withSentry =
  (webpackPluginOptions: SentryBuildOptions = {}) =>
  (nextConfig: NextConfig) => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      if (!process.env.SENTRY_DISABLED_IGNORE_WARNING) {
        console.info('Sentry is disabled: NEXT_PUBLIC_SENTRY_DSN is not defined');
      }
      return nextConfig;
    }

    return withSentryConfig(nextConfig, webpackPluginOptions);
  };

export default withSentry;
