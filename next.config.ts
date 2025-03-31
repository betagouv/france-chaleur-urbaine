import withBundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

import withSecurityHeaders from './src/config/withSecurityHeaders';
import withSentry from './src/config/withSentry';

const isGithubCI = process.env.NODE_ENV === 'production' && process.env.GITHUB_CI === 'true';

const configFunctions = [
  createMDX({
    // Add markdown plugins here, as desired
  }),
  withSentry(
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
  ),
  withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  }),
  withSecurityHeaders({
    iframes: [
      // Attention: keep in sync with src/services/iframe.ts
      '/carte-collectivite',
      '/charleville-mezieres',
      '/dalkia',
      '/engie',
      '/form',
      '/idex',
      '/map',
      '/page-reseaux/:network',
      '/viaseva',
      '/iframe/potentiel-creation-reseau',
    ],
    csp: {
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
        "'sha256-b4GFU36HxV/ajsLtGxYpBvVIlonNc0Dz5lk+ZTMKysY='", // PROD - Facebook Pixel 3064783047067401
        "'sha256-Ny4QAH1g1FWyqlgrnIVWh1mj+jM8c6SjgqJ2i6c2REU='", // PROD - google analytics common
        "'sha256-8r71P9EINuYzK2mdhvMfZG0nDrKZhY5rvxXNAgVD45g='", // PROD - Google AW-16641573937
        "'sha256-/To7QTI1yR8LpZjhrqYdP21zirnpAwwI4s7M8TwKxnI='", // PROD - Google G-B35Q28PSV8
        "'sha256-/CSSb6w0OrYpmMov6mf2agdZaX5CEjsuUL45DW0yKI4='", // PROD - Hotjar 3874965 6
        "'sha256-cLrFOA9eDIz+hTs9m3AUrlzvroRre9vJ4cvv1ygI/Bw='", // PROD - LinkedIn 3494650
        "'sha256-cWPc/BJwUWRnFb5b17VxDNk72/ZwL1GOqTQ6dAU/P3E='", // PROD - unknown yet
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
        'https://data.geopf.fr',
        'https://api.mapbox.com/',
        'https://sentry.incubateur.net',
        'https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com',
        'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com',
      ],
      'img-src': ["'self'", 'https:', 'data:'],
      'font-src': ["'self'", 'https:', 'data:', 'https://*.hotjar.com'],
      'frame-src': ['https://td.doubleclick.net', 'https://www.facebook.com/', 'https://www.youtube.com/'],
      'style-src': ["'self'", 'https:', "'unsafe-inline'", 'https://*.hotjar.com'],
      'worker-src': ["'self'", 'blob:'],
    },
  }),
];

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : undefined,
  basePath: isGithubCI ? '/france-chaleur-urbaine' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    turbo: {
      rules: {
        '*.svgr': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
        '*.md': {
          loaders: ['raw-loader'],
          as: '*.js',
        },
      },
    },
  },
  // too many conflicts with map draw listeners
  // reactStrictMode: true,
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
      {
        source: '/evos',
        destination: '/campagnes2024',
        permanent: true,
      },
      {
        source: '/index-fioul-campaign',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index-gaz-campaign-1',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index-gaz-campaign-2',
        destination: '/',
        permanent: true,
      },
      {
        source: '/ressources/prioritaire',
        destination: '/ressources/obligations-raccordement',
        permanent: true,
      },
      {
        source: '/gestionnaire',
        destination: '/pro/demandes',
        permanent: true,
      },
      {
        source: '/aide',
        destination: '/pro/aide',
        permanent: true,
      },
      {
        source: '/outils/comparateur-performances',
        destination: '/comparateur-couts-performances',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
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
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });
    config.module.rules.push({
      test: /\.svgr$/,
      use: '@svgr/webpack',
    });
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    });

    // https://github.com/gregberge/svgr/issues/860#issuecomment-1653928947
    // This is done to prevent DSFR Display component to fail with undefined URL for SVG See https://github.com/betagouv/france-chaleur-urbaine/pull/882
    // In order to load a SVG, you will need to suffix it with ?icon
    // example: `import IconPotentiel from '@/public/icons/potentiel.svg?icon';`
    const nextImageLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));

    if (nextImageLoaderRule) {
      nextImageLoaderRule.resourceQuery = {
        not: [...(nextImageLoaderRule.resourceQuery?.not || []), /icon/],
      };
    }

    config.module.rules.push({
      issuer: nextImageLoaderRule?.issuer,
      resourceQuery: /icon/, // *.svg?icon
      use: ['@svgr/webpack'],
    });

    return config;
  },
  transpilePackages: ['@codegouvfr/react-dsfr'],
};

const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (arg: T): T =>
    fns.reduceRight((res, fn) => fn(res), arg);

export default compose(...configFunctions)(nextConfig);
