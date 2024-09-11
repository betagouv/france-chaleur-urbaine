const ressources = [
  'reseau',
  'energies-vertes',
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
  'reseau-de-froid',
  'reseau-classe',
];

// Category pages, homepage, top landing pages
const highPriorityPages = ['/', '/professionnels', '/collectivites-et-exploitants', '/carte', '/actus', '/ressources/articles'];

// Pages that are not as important like outdated content or utility-type pages
const lowPriorityPages = [
  '/',
  '/accessibilite',
  '/connexion',
  '/contact',
  '/contribution',
  '/mentions-legales',
  '/politique-de-confidentialite',
  '/reset-password',
  '/stats',
];

function getPagePriority(/** @type {string} */ path) {
  return highPriorityPages.includes(path) ? 1 : lowPriorityPages.includes(path) ? 0.3 : 0.7;
}

// Page that should not be indexed by Google because there is no point
const excludedPages = [
  // authenticated pages
  '/admin',
  '/aide',
  '/gestionnaire',

  // iframes
  '/carte-collectivite',
  '/charleville-mezieres',
  '/dalkia',
  '/engie',
  '/form',
  '/idex',
  '/map',
  '/viaseva',

  // misc pages
  '/stats-v1',
  '/satisfaction',

  // TODO pas encore public, supprimer quand prêt à être indexé
  '/outils/comparateur-performances',
];

/** @type {import('next-sitemap').IConfig} */
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
  exclude: excludedPages,
  transform: (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: getPagePriority(path),
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  // ...other options
};
