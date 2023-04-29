/** @type {import('next-sitemap').IConfig} */

const ressources = [
  'reseau',
  'energies-verte',
  'atouts',
  'livraisons',
  'histoire',
  'role',
  'faisabilite',
  'avantages',
  'aides',
  'financement',
  'facture',
  'prioritaire',
  'acteurs',
  'etat',
  'supports',
];

module.exports = {
  siteUrl: process.env.NEXTAUTH_URL || 'https://example.com',
  generateRobotsTxt: true, // (optional)
  additionalPaths: () => {
    return ressources.map((key) => ({
      loc: `/ressources/${key}`,
      priority: 0.7,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
    }));
  },
  transform: (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === '/' ? 1 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  // ...other options
};
