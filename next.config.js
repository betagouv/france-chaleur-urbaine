const isGithubCI = process.env.NODE_ENV === 'production' && process.env.CI;

module.exports = {
  webpack5: true,
  assetPrefix: isGithubCI ? '/france-chaleur-urbaine/' : '',
  basePath: isGithubCI ? '/france-chaleur-urbaine' : '',
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
