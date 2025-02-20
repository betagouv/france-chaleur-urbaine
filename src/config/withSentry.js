/* eslint-disable @typescript-eslint/no-var-requires */
const { withSentryConfig } = require('@sentry/nextjs');

module.exports =
  (webpackPluginOptions = {}, sentryOptions = {}) =>
  (nextConfig) =>
    withSentryConfig(
      nextConfig,
      {
        errorHandler: (err, invokeErr, compilation) => {
          compilation.warnings.push('Sentry CLI Plugin: ' + err.message);
        },
        ...webpackPluginOptions,
      },
      sentryOptions
    );
