import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

import withSecurityHeaders from './src/config/withSecurityHeaders';
import withSentry from './src/config/withSentry';

const isGithubCI = process.env.NODE_ENV === 'production' && process.env.GITHUB_CI === 'true';

const configFunctions = [
  createMDX({
    // Add markdown plugins here, as desired
  }),
  withSentry({
    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // do not exit if the build fails to interact with the sentry server
    errorHandler: (err) => {
      console.warn(`Sentry CLI Plugin: ${err.message}`);
    },
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: 'betagouv',
    project: 'fcu-prod',
    sentryUrl: 'https://sentry.incubateur.net/',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    telemetry: false,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,
  }),
  withSecurityHeaders({
    csp: {
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
      'font-src': ["'self'", 'https:', 'data:', 'https://*.hotjar.com'],
      'frame-src': ['https://td.doubleclick.net', 'https://www.facebook.com/', 'https://www.youtube.com/'],
      'img-src': ["'self'", 'https:', 'data:'],
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
        'https://www.ssa.gov/accessibility/', // Nécessaire pour faire fonctionner le bookmarklet ANDI
        'https://ajax.googleapis.com/', // Nécessaire pour faire fonctionner le bookmarklet ANDI
      ],
      'style-src': ["'self'", 'https:', "'unsafe-inline'", 'https://*.hotjar.com'],
      'worker-src': ["'self'", 'blob:'],
    },
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
  }),
];

const nextConfig: NextConfig = {
  assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : undefined,
  basePath: isGithubCI ? '/france-chaleur-urbaine' : undefined,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
    optimizePackageImports: [
      '@betagouv/france-chaleur-urbaine-publicodes',
      '@bprogress/next',
      '@codegouvfr/react-dsfr',
      '@commander-js/extra-typings',
      '@emotion/is-prop-valid',
      '@faker-js/faker',
      '@incubateur-ademe/legal-pages-react',
      '@mapbox/geo-viewport',
      '@mapbox/mapbox-gl-draw',
      '@mdx-js/loader',
      '@mdx-js/react',
      '@next/mdx',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@reach/combobox',
      '@react-email/components',
      '@react-email/markdown',
      '@react-email/render',
      '@react-hookz/web',
      '@rivercode/facebook-conversion-api-nextjs',
      '@sentry/nextjs',
      '@socialgouv/matomo-next',
      '@tanstack/react-form',
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      '@tmcw/togeojson',
      '@trpc/client',
      '@trpc/next',
      '@trpc/react-query',
      '@trpc/server',
      '@turf/area',
      '@turf/bbox',
      '@turf/boolean-point-in-polygon',
      '@turf/center',
      '@turf/distance',
      '@turf/explode',
      '@turf/helpers',
      '@turf/kinks',
      '@turf/length',
      '@turf/nearest-point',
      '@turf/nearest-point-on-line',
      '@types/mdx',
      '@uiw/react-color-colorful',
      'airtable',
      'archiver',
      'axios',
      'axios-retry',
      'base64-stream',
      'bcryptjs',
      'chardet',
      'class-variance-authority',
      'commander',
      'cors',
      'cron',
      'dayjs',
      'deep-object-diff',
      'dom-to-image',
      'dotenv',
      'express-rate-limit',
      'formidable',
      'geojson-vt',
      'get-stream',
      'helmet',
      'jotai',
      'js-cookie',
      'jsonwebtoken',
      'jszip',
      // 'knex' error: Can't resolve 'better-sqlite3'
      'kysely',
      'maplibre-gl',
      'mitt',
      'motion',
      'next',
      'next-auth',
      'next-sitemap',
      'nodemailer',
      'nuqs',
      'p-limit',
      'papaparse',
      'pg',
      'proj4',
      'prompts',
      'publicodes',
      'react',
      'react-dom',
      'react-google-charts',
      'react-hot-toast',
      'react-loader-spinner',
      'react-map-gl',
      'react-resizable-panels',
      'rehype-raw',
      'rehype-react',
      'remark-breaks',
      'remark-directive',
      'remark-directive-rehype',
      'remark-parse',
      'remark-rehype',
      'schema-dts',
      'shapefile',
      'sharp',
      'styled-components',
      'superjson',
      'tsafe',
      'tslib',
      'tsx',
      'typescript',
      'unified',
      'uuid',
      'vaul',
      'vt-pbf',
      'winston',
      'xlsx',
      'zod',
      '@biomejs/biome',
      '@svgr/webpack',
      '@tailwindcss/postcss',
      '@testing-library/dom',
      '@testing-library/react',
      '@types/archiver',
      '@types/base64-stream',
      '@types/cors',
      '@types/dom-to-image',
      '@types/formidable',
      '@types/geojson',
      '@types/geojson-vt',
      '@types/js-cookie',
      '@types/jsonwebtoken',
      '@types/mapbox__geo-viewport',
      '@types/mapbox__mapbox-gl-draw',
      '@types/node',
      '@types/nodemailer',
      '@types/papaparse',
      '@types/pg',
      '@types/prompts',
      '@types/react',
      '@types/react-dom',
      '@types/shapefile',
      '@types/vt-pbf',
      '@vitejs/plugin-react',
      'babel-plugin-react-compiler',
      'camelcase',
      'globals',
      'happy-dom',
      'husky',
      'kysely-codegen',
      'lint-staged',
      'node-mocks-http',
      'node-talisman',
      'postcss',
      'postcss-import',
      'raw-loader',
      'react-email',
      'tailwindcss',
      'tailwindcss-animate',
      'trpc-ui',
      'vite-tsconfig-paths',
    ],
  },
  async headers() {
    return [
      {
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
        source: '/openapi-schema.yaml',
      },
    ];
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
  reactCompiler: true,
  // too many conflicts with map draw listeners
  // reactStrictMode: true,
  async redirects() {
    return [
      {
        destination: '/documentation/guide-france-chaleur-urbaine.pdf',
        permanent: false,
        source: '/guide-france-chaleur-urbaine',
      },
      // redirections for pages that were removed
      {
        destination: '/stats',
        permanent: true,
        source: '/statistiques',
      },
      {
        destination: '/',
        permanent: true,
        source: '/accueil',
      },
      {
        destination: '/',
        permanent: true,
        source: '/coproprietaire',
      },
      {
        destination: '/professionnels',
        permanent: true,
        source: '/conseiller',
      },
      {
        destination: '/ressources/articles',
        permanent: true,
        source: '/ressources',
      },
      {
        destination: '/campagnes2024',
        permanent: true,
        source: '/evos',
      },
      {
        destination: '/',
        permanent: true,
        source: '/index-fioul-campaign',
      },
      {
        destination: '/',
        permanent: true,
        source: '/index-gaz-campaign-1',
      },
      {
        destination: '/',
        permanent: true,
        source: '/index-gaz-campaign-2',
      },
      {
        destination: '/ressources/obligations-raccordement',
        permanent: true,
        source: '/ressources/prioritaire',
      },
      {
        destination: '/pro/demandes',
        permanent: true,
        source: '/gestionnaire',
      },
      {
        destination: '/pro/aide',
        permanent: true,
        source: '/aide',
      },
      {
        destination: '/comparateur-couts-performances',
        permanent: true,
        source: '/outils/comparateur-performances',
      },
      {
        destination: '/webinaires/20250401_webinaire_classement_FCU.pdf',
        permanent: false,
        source: '/webinaire/2025/presentation-classement',
      },
      {
        destination: 'https://youtu.be/iIwDUexhmlw',
        permanent: true,
        source: '/webinaire/2025/replay-classement',
      },
      {
        destination: '/webinaires/20250128_webinaire_communes_sans_reseau.pdf',
        permanent: false,
        source: '/webinaire/2025/presentation-initier-un-reseau',
      },
      {
        destination: 'https://youtu.be/yHyRZk_-eb4',
        permanent: true,
        source: '/webinaire/2025/replay-initier-un-reseau',
      },
      {
        destination: '/webinaires/20250617_webinaire_collectivites_exploitants_juin.pdf',
        permanent: false,
        source: '/webinaire/2025/presentation-collectivites-exploitants-juin',
      },
      {
        destination: '/webinaires/202506_webinaire_comparateur.pdf',
        permanent: false,
        source: '/webinaire/2025/presentation-comparateur',
      },
      {
        destination: 'https://vimeo.com/1095849733',
        permanent: false,
        source: '/webinaire/2025/replay-presentation-comparateur',
      },
      {
        destination: 'https://youtu.be/aetWYIxs0MA',
        permanent: true,
        source: '/webinaire/2025/replay-collectivites-exploitants-juin',
      },
      {
        destination: '/webinaires/202506_webinaire_presentation.pdf',
        permanent: true,
        source: '/webinaire/2025/presentation-france-chaleur-urbaine',
      },
      {
        destination: 'https://youtu.be/tfGtfrTK2gc',
        permanent: true,
        source: '/webinaire/2025/replay-presentation-france-chaleur-urbaine',
      },
    ];
  },
  transpilePackages: ['@codegouvfr/react-dsfr'],
  turbopack: {
    rules: {
      '*.md': {
        as: '*.js',
        loaders: ['raw-loader'],
      },
      '*.svgr': {
        as: '*.js',
        loaders: ['@svgr/webpack'],
      },
    },
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
};

const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (arg: T): T =>
    fns.reduceRight((res, fn) => fn(res), arg);

export default compose(...configFunctions)(nextConfig);
