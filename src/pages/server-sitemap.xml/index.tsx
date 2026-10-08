import type { GetServerSideProps } from 'next';
import { getServerSideSitemapLegacy } from 'next-sitemap';

import { clientConfig } from '@/client-config';
import { kdb } from '@/server/db/kysely';

/**
 * Sitemap of the network pages, rendered on request since they are no longer prerendered (the build sitemap only lists
 * static pages). Referenced from robots.txt by `next-sitemap.config.js`.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const networks = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select('Identifiant reseau as id')
    .where('Identifiant reseau', 'is not', null)
    .union(kdb.selectFrom('reseaux_de_froid').select('Identifiant reseau as id').where('Identifiant reseau', 'is not', null))
    .execute();
  return getServerSideSitemapLegacy(
    context,
    networks.map((network) => ({ changefreq: 'weekly', loc: `${clientConfig.websiteUrl}/reseaux/${network.id}`, priority: 1 }))
  );
};

// the response is written by getServerSideProps
export default function ServerSitemap() {
  return null;
}
