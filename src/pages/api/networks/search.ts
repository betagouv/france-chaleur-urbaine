import {
  handleRouteErrors,
  requirePostMethod,
  validateObjectSchema,
} from '@helpers/server';
import { clientConfig } from 'src/client-config';
import db from 'src/db';
import { Network } from 'src/types/Summary/Network';
import { z } from 'zod';

const selectedNetworkFields = [
  'id_fcu',
  'Identifiant reseau',
  'nom_reseau',
  'MO',
  'adresse_mo',
  'CP_MO',
  'ville_mo',
  'Gestionnaire',
  'adresse_gestionnaire',
  'CP_gestionnaire',
  'ville_gestionnaire',
  'website_gestionnaire',
  'reseaux classes',
  'informationsComplementaires',
  'fichiers',
] satisfies (keyof Network)[];

export type NetworkSearchResult = Pick<
  Network,
  (typeof selectedNetworkFields)[number]
>;

/**
 * Search for hot and cold networks by id or name, and return 10 elements max
 */
export default handleRouteErrors(async (req) => {
  requirePostMethod(req);
  const { search } = await validateObjectSchema(req.body, {
    search: z
      .string()
      .min(clientConfig.networkSearchMinimumCharactersThreshold),
  });
  const [hotNetworks, coldNetworks] = await Promise.all([
    db<NetworkSearchResult>('reseaux_de_chaleur')
      .select(selectedNetworkFields)
      .where('Identifiant reseau', 'ilike', `%${search}%`)
      .orWhere('nom_reseau', 'ilike', `%${search}%`)
      .limit(10),
    db<NetworkSearchResult>('reseaux_de_froid')
      .select(selectedNetworkFields)
      .where('Identifiant reseau', 'ilike', `%${search}%`)
      .orWhere('nom_reseau', 'ilike', `%${search}%`)
      .limit(10),
  ]);
  return [...hotNetworks, ...coldNetworks]
    .sort((a, b) =>
      a['Identifiant reseau'] < b['Identifiant reseau'] ? -1 : 1
    )
    .slice(0, 10)
    .map((network) => {
      network.website_gestionnaire = network.website_gestionnaire?.trim(); // type postgresql character... should be varying character
      if (!network.nom_reseau) {
        network.nom_reseau = 'Réseau inconnu';
      }
      return network;
    });
});
