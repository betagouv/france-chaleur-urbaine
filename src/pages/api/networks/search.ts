import type { Selectable } from 'kysely';
import { z } from 'zod';

import { clientConfig } from '@/client-config';
import { networkDocumentsJsonAgg } from '@/modules/reseaux/server/documents';
import type { NetworkDocumentSummary } from '@/modules/reseaux/types';
import type { DB } from '@/server/db/kysely';
import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';

const selectedNetworkFields = [
  'id_fcu',
  'Identifiant reseau',
  'nom_reseau',
  'MO',
  'Gestionnaire',
  'website_gestionnaire',
  'reseaux classes',
  'informationsComplementaires',
] satisfies (keyof DB['reseaux_de_chaleur'])[];

export type NetworkSearchResult = Pick<Selectable<DB['reseaux_de_chaleur']>, (typeof selectedNetworkFields)[number]> & {
  documents: NetworkDocumentSummary[];
};

/**
 * Search for hot and cold networks by id or name, and return 10 elements max
 */
export default handleRouteErrors(async (req) => {
  requirePostMethod(req);
  const { search } = await validateObjectSchema(req.body, {
    search: z.string().min(clientConfig.networkSearchMinimumCharactersThreshold),
  });
  const [hotNetworks, coldNetworks] = await Promise.all([
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select([...selectedNetworkFields, networkDocumentsJsonAgg('reseaux_de_chaleur', 'reseau_de_chaleur').as('documents')])
      .where((eb) => eb.or([eb('Identifiant reseau', 'ilike', `%${search}%`), eb('nom_reseau', 'ilike', `%${search}%`)]))
      .limit(10)
      .execute(),
    kdb
      .selectFrom('reseaux_de_froid')
      .select([...selectedNetworkFields, networkDocumentsJsonAgg('reseaux_de_froid', 'reseau_de_froid').as('documents')])
      .where((eb) => eb.or([eb('Identifiant reseau', 'ilike', `%${search}%`), eb('nom_reseau', 'ilike', `%${search}%`)]))
      .limit(10)
      .execute(),
  ]);
  return [...hotNetworks, ...coldNetworks]
    .sort((a, b) => ((a['Identifiant reseau'] ?? '') < (b['Identifiant reseau'] ?? '') ? -1 : 1))
    .slice(0, 10)
    .map((network) => {
      if (!network.nom_reseau) {
        network.nom_reseau = 'Nom inconnu';
      }
      return network;
    });
});
