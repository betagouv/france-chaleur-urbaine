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
  '/pro/*',
  '/admin',
  '/admin/*',

  // iframes
  '/iframe/*',
  '/carte-collectivite',
  '/charleville-mezieres',
  '/dalkia',
  '/engie',
  '/form',
  '/idex',
  '/map',
  '/viaseva',

  // developer sandboxes (also noindex via SimplePage and an X-Robots-Tag header, see next.config.ts)
  '/dev/*',

  // misc pages
  '/satisfaction',
  '/inscription/bravo',

  // dynamic sitemap of the network pages (listed in robots.txt below, not a page)
  '/server-sitemap.xml',
];

// Only the production site (identified by its public URL) may be crawled; keep in sync with clientConfig.isProductionSite (src/client-config.ts)
const isProductionSite = process.env.NEXT_PUBLIC_SITE_URL === 'https://france-chaleur-urbaine.beta.gouv.fr';

/** @type {import('next-sitemap').IConfig} */
export default {
  exclude: excludedPages,
  generateRobotsTxt: true, // (optional)
  robotsTxtOptions: {
    // the network pages are rendered on request: their sitemap is served by the app
    additionalSitemaps: [`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://france-chaleur-urbaine.beta.gouv.fr'}/server-sitemap.xml`],
    policies: [isProductionSite ? { allow: '/', disallow: '/dev/', userAgent: '*' } : { disallow: '/', userAgent: '*' }],
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://france-chaleur-urbaine.beta.gouv.fr',
  transform: (config, path) => {
    return {
      changefreq: config.changefreq,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      loc: path,
      priority: getPagePriority(path),
    };
  },
};
