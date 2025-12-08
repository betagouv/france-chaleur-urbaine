import { createRequire } from 'node:module';
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
        'https://data.geopf.fr/',
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
  }),
];

// Build optimizePackageImports dynamically from package.json deps
const requireFromHere = createRequire(import.meta.url);
const pkgJson = requireFromHere('./package.json');
const packagesSet = new Set<string>([
  ...Object.keys(pkgJson.dependencies || {}),
  ...Object.keys(pkgJson.optionalDependencies || {}),
  ...Object.keys(pkgJson.peerDependencies || {}),
]);

const excludedOptimizeImports = new Set<string>([
  // Known to pull native optional deps and break with native dependencies like "better-sqlite3"
  'knex',
  'pg', // panic with scalingo only : Error [TurbopackInternalError]: The packages specified in the 'transpilePackages' conflict with the 'serverExternalPackages': ["pg"]
]);

const optimizePackageImports = Array.from(packagesSet).filter((name) => !excludedOptimizeImports.has(name));

const nextConfig: NextConfig = {
  assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : undefined,
  basePath: isGithubCI ? '/france-chaleur-urbaine' : undefined,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
    // disabled because it adds 480 MB to the Scalingo image size by putting lots of .map files in .next ...
    // optimizePackageImports,
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
  // disabled because it seems to break tanstack table sorting (e.g. https://github.com/TanStack/table/issues/6117)
  // reactCompiler: true,
  // too many conflicts with map draw listeners
  // reactStrictMode: true,
  async redirects() {
    return [
      // iframe pages moved under /iframe/*
      {
        destination: '/iframe/carte-reseaux-de-chaleur-et-froid',
        permanent: true,
        source: '/carte-reseaux-de-chaleur-et-froid',
      },
      {
        destination: '/iframe/carte-collectivite',
        permanent: true,
        source: '/carte-collectivite',
      },
      {
        destination: '/iframe/charleville-mezieres',
        permanent: true,
        source: '/charleville-mezieres',
      },
      {
        destination: '/iframe/dalkia',
        permanent: true,
        source: '/dalkia',
      },
      {
        destination: '/iframe/engie',
        permanent: true,
        source: '/engie',
      },
      {
        destination: '/iframe/form',
        permanent: true,
        source: '/form',
      },
      {
        destination: '/iframe/idex',
        permanent: true,
        source: '/idex',
      },
      {
        destination: '/iframe/map',
        permanent: true,
        source: '/map',
      },
      {
        destination: '/iframe/page-reseaux/:network',
        permanent: true,
        source: '/page-reseaux/:network',
      },
      {
        destination: '/iframe/viaseva',
        permanent: true,
        source: '/viaseva',
      },
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
  // Exclude knex from server bundling to avoid TypeScript errors with optional dialect dependencies
  // Knex loads dialects dynamically via require(), and we only use PostgreSQL
  serverExternalPackages: ['knex'],
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
