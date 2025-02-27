import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withSentry =
  (webpackPluginOptions = {}, sentryOptions = {}) =>
  (nextConfig: NextConfig) => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      console.log('Sentry is disabled: NEXT_PUBLIC_SENTRY_DSN is not defined');
      return nextConfig;
    }

    return withSentryConfig(
      nextConfig,
      {
        errorHandler: (err: Error, invokeErr: Error, compilation: { warnings: string[] }) => {
          compilation.warnings.push('Sentry CLI Plugin: ' + err.message);
        },
        ...webpackPluginOptions,
      },
      sentryOptions
    );
  };

export default withSentry;
