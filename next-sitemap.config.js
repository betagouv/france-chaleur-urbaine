const highPriorityPages = [
  '/',
  '/professionnels',
  '/collectivites-et-exploitants',
  '/collectivites-et-exploitants/potentiel-creation-reseau',
  '/carte',
  /\/actus(\/.*)?/i,
  /\/ressources(\/.*)?/i,
  /\/reseaux(\/.*)?/i,
  /\/villes(\/.*)?/i,
];

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
  const isHighPriority = highPriorityPages.some((entry) => (typeof entry === 'string' ? entry === path : entry.test(path)));

  if (isHighPriority) {
    return 1;
  }

  const isLowPriority = lowPriorityPages.some((entry) => entry === path);

  if (isLowPriority) {
    return 0.3;
  }

  return 0.7;
}

// Page that should not be indexed by Google because there is no point
const excludedPages = [
  // authenticated pages
  '/tableau-de-bord',
  '/tests-adresse',
  '/gestionnaire',
  '/demandes',
  '/aide',
  '/admin',
  '/admin/users',

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
  exclude: excludedPages,
  transform: (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: getPagePriority(path),
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
