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
    "'sha256-97wOF3M88fYLy2LjCcAesoBeW6RxVfjzwxmdozWRZ6g='", // DEV - google 11414741136
    "'sha256-b4GFU36HxV/ajsLtGxYpBvVIlonNc0Dz5lk+ZTMKysY='", // PROD - Facebook Pixel 3064783047067401
    "'sha256-HJKFxmK7TOzDhaTvZ/x57pCQ5J3T79wgEi6DW/SQUYw='", // PROD - Google AW-11414741136
    "'sha256-9xQZ2hSESjymT1y2YtvxuZ6EXm0FLyd5Phk9Z66fbMg='", // PROD - Google G-B35Q28PSV8
    "'sha256-/CSSb6w0OrYpmMov6mf2agdZaX5CEjsuUL45DW0yKI4='", // PROD - Hotjar 3874965 6
    "'sha256-cLrFOA9eDIz+hTs9m3AUrlzvroRre9vJ4cvv1ygI/Bw='", // PROD - LinkedIn 3494650
    'https://stats.data.gouv.fr',
    'https://stats.beta.gouv.fr',
    'https://static.axept.io',
    'https://connect.facebook.net',
    'https://www.gstatic.com/',
    'https://www.googletagmanager.com https://*.googletagmanager.com',
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
    'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com',
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
      reactStrictMode: true,
      swcMinify: true,
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
      webpack: (config) => {
        config.module.rules.push({
          test: /\.md$/,
          use: 'raw-loader',
        });
        config.module.rules.push({
          test: /\.woff2$/,
          type: 'asset/resource',
        });
        return config;
      },
      transpilePackages: ['@codegouvfr/react-dsfr'],
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
      // do not exit if the build fails to interact with the sentry server
      errorHandler: (err, invokeErr, compilation) => {
        compilation.warnings.push('Sentry CLI Plugin: ' + err.message);
      },
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
