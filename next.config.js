/* eslint-disable @typescript-eslint/no-var-requires */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isGithubCI = process.env.NODE_ENV === 'production' && process.env.CI;

module.exports = withBundleAnalyzer({
  assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : undefined,
  basePath: isGithubCI ? '/france-chaleur-urbaine' : undefined,
  // swcMinify: true, // Need Fix on the Rust Compiler SWC: Incompatibility with MapLibre
  async redirects() {
    return [
      {
        source: '/statistiques',
        destination: '/stats',
        permanent: true,
      },
      {
        source: '/guide-france-chaleur-urbaine',
        destination: '/documentation/guide-france-chaleur-urbaine.pdf',
        permanent: false,
      },
    ];
  },
});
