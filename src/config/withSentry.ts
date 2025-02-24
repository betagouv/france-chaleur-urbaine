import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withSentry =
  (webpackPluginOptions = {}, sentryOptions = {}) =>
  (nextConfig: NextConfig) =>
    withSentryConfig(
      nextConfig,
      {
        errorHandler: (err, invokeErr, compilation) => {
          (compilation as any).warnings.push('Sentry CLI Plugin: ' + err.message);
        },
        ...webpackPluginOptions,
      },
      sentryOptions
    );

export default withSentry;
