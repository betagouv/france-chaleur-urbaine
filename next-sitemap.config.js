/** @type {import('next-sitemap').IConfig} */

const ressources = [
  'reseau',
  'energie-vertes',
  'atouts',
  'livraisons',
  'role',
  'faisabilite',
  'avantages',
  'aides',
  'facture',
  'prioritaire',
  'acteurs',
  'etat',
];

module.exports = {
  siteUrl: process.env.NEXTAUTH_URL || 'https://example.com',
  generateRobotsTxt: true, // (optional)
  additionalPaths: () => {
    return ressources.map((key) => ({ loc: `/ressource/${key}` }));
  },
  // ...other options
};
