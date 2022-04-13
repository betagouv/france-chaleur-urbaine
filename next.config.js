const isGithubCI = process.env.NODE_ENV === 'production' && process.env.CI;

module.exports = {
  webpack5: true,
  assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : '',
  basePath: isGithubCI ? '/france-chaleur-urbaine' : '',
  // swcMinify: true, // Need Fix on the Rust Compiler SWC: Incompatibility with MapLibre
  async redirects() {
    return [
      {
        source: '/statistiques',
        destination: '/stats',
        permanent: true,
      },
    ];
  },
};
