/* eslint-disable @typescript-eslint/no-var-requires */
const helmet = require('helmet');
const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isGithubCI = process.env.NODE_ENV === 'production' && process.env.CI;

const csp = {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'script-src': [
    "'self'",
    "'sha256-TXnVHDn1j7ztxp+9fAgGYQt5MDdGcfG3DMT2sJR4v/I='",
    "'sha256-uoDYfYhkG1Rred64INgKWU540cb8GBpVb+EoZcz/Zyo='",
    "'sha256-eGdlwoVjdfoAxTtVJ5JOqj8MsevToXdxA0rkY5IXIxk='",
    "'sha256-5nUSiKlxGJiE3JicLfPYxYZShtQfFZM0jtHZyyPijTE='",
    "'sha256-PAh6kZHWrs47demJXB9x6PfCgghwAf4BZ4ncKf/BhiU='",
    "'sha256-vHLisyhJqlXs8efpQOmla3M8/VBRwdzde5ZgWIhJQEA='",
    "'sha256-3I33qFPfa/PLrN/3rrrC4vJBjmKYiuXWQ+ZfnHiEWmo='",
    "'sha256-ksltjYbI6Uoozfn80t6ROvA1rBbTP9X8qGPGwHmWBpA='",
    "'sha256-6SC04Y6nNQLzwzyqa3SfGlAJoGLEAasou2bnNnkusvM='",
    "'sha256-344ePyJp7yxx64WKWpbs/ZvEDHA6mve7lS3i90cEPT4='", // ConsentBanner > tarteaucitron.init
    "'sha256-d7dsOzUkIPxujyMIFvd9lnMMqh0LRXgYPmFvbRYsL7Q='", // hotjar 3874965 6
    "'sha256-QgeMdwmWudzTtvMdGsiNx59tDaxP5VQ9M33970xxFqQ='", // google 11360539753
    'https://stats.data.gouv.fr',
    'https://stats.beta.gouv.fr',
    'https://static.axept.io',
    'https://connect.facebook.net',
    'https://www.gstatic.com/',
    'https://www.googletagmanager.com',
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://connect.facebook.net',
    'https://snap.licdn.com',
    'https://api.mapbox.com/',
    'https://*.hotjar.com',
  ],
  'connect-src': [
    "'self'",
    'https://openmaptiles.geo.data.gouv.fr',
    'https://openmaptiles.data.gouv.fr',
    'https://openmaptiles.github.io',
    'https://france-chaleur-urbaine.beta.gouv.fr/',
    'https://france-chaleur-urbaine-dev.osc-fr1.scalingo.io/',
    'https://api-adresse.data.gouv.fr/',
    'https://stats.data.gouv.fr',
    'https://stats.beta.gouv.fr',
    'https://cdn.linkedin.oribi.io',
    'https://google.com/',
    'https://px.ads.linkedin.com',
    'https://wxs.ign.fr',
    'https://api.mapbox.com/',
    'https://sentry.incubateur.net',
    'https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com',
  ],
  'img-src': ["'self'", 'https:', 'data:'],
  'font-src': ["'self'", 'https:', 'data:', 'https://*.hotjar.com'],
  'frame-src': [
    'https://td.doubleclick.net',
    'https://www.facebook.com/',
    'https://www.youtube.com/',
  ],
  'style-src': ["'self'", 'https:', "'unsafe-inline'", 'https://*.hotjar.com'],
  'worker-src': ["'self'", 'blob:'],
};

if (process.env.UNSAFE_EVAL === 'true') {
  csp['script-src'].push("'unsafe-eval'");
}

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Content-Security-Policy',
    value: Object.keys(csp)
      .map((key) => `${key} ${csp[key].join(' ')}`)
      .join(';'),
  },
];

const securityHeadersIFramable = [
  {
    key: 'X-Frame-Options',
    value: '',
  },

  {
    key: 'Content-Security-Policy',
    value: Object.keys(csp)
      .filter((key) => key !== 'frame-ancestors')
      .map((key) => `${key} ${csp[key].join(' ')}`)
      .join(';'),
  },
];

module.exports = withBundleAnalyzer(
  withSentryConfig(
    {
      compiler: {
        styledComponents: true,
      },
      assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : undefined,
      basePath: isGithubCI ? '/france-chaleur-urbaine' : undefined,
      // swcMinify: true, // Need Fix on the Rust Compiler SWC: Incompatibility with MapLibre
      eslint: {
        ignoreDuringBuilds: true,
      },
      async redirects() {
        return [
          {
            source: '/guide-france-chaleur-urbaine',
            destination: '/documentation/guide-france-chaleur-urbaine.pdf',
            permanent: false,
          },
          // redirections for pages that were removed
          {
            source: '/statistiques',
            destination: '/stats',
            permanent: true,
          },
          {
            source: '/accueil',
            destination: '/',
            permanent: true,
          },
          {
            source: '/coproprietaire',
            destination: '/',
            permanent: true,
          },
          {
            source: '/conseiller',
            destination: '/professionnels',
            permanent: true,
          },
          {
            source: '/ressources',
            destination: '/ressources/articles',
            permanent: true,
          },
        ];
      },
      async headers() {
        return [
          {
            source: '/:path*',
            headers: securityHeaders,
          },
          {
            source: '/openapi-schema.yaml',
            headers: [
              {
                key: 'Access-Control-Allow-Methods',
                value: 'GET, OPTIONS',
              },
              {
                key: 'Access-Control-Allow-Origin',
                value: '*',
              },
            ],
          },

          // Attention: keep in sync with src/services/iframe.ts
          ...[
            '/carte-collectivite',
            '/charleville-mezieres',
            '/dalkia',
            '/engie',
            '/form',
            '/idex',
            '/map',
            '/page-reseaux/:network',
            '/viaseva',
          ].map((source) => ({
            source,
            headers: securityHeadersIFramable,
          })),
        ];
      },
      webpack: function (config) {
        config.module.rules.push({
          test: /\.md$/,
          use: 'raw-loader',
        });
        return config;
      },
    },
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options
      dryRun: !process.env.NEXT_PUBLIC_SENTRY_DSN,
      // Suppresses source map uploading logs during build
      silent: true,
      org: 'betagouv',
      project: 'fcu-prod',
      url: 'https://sentry.incubateur.net/',
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: false,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: false,

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

      // Enables automatic instrumentation of Vercel Cron Monitors.
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,
    }
  )
);
