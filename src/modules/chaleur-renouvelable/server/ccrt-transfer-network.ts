import { TRPCError } from '@trpc/server';
import type { z } from 'zod';

import type { BANAddressFeature } from '@/modules/ban/types';
import type { Context } from '@/modules/config/server/context-builder';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';

import type { zCcrtTransferNetwork } from '../constants';
import { ensureCcrtDemandAccess } from './ccrt-access';
import { getNetworkEligibilityCoordinates } from './network-eligibility-coordinates';
import { getBatEnrBatimentDetails } from './service';

/**
 * Resolves a saved building and the nearest existing network, or a selected network, with authoritative distance.
 */
export const getCcrtTransferNetwork = async (ctx: Context, input: z.infer<typeof zCcrtTransferNetwork>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const [search, building] = await Promise.all([
    fetchJSON<{ features: BANAddressFeature[] }>(`${serverConfig.banApiBaseUrl}search`, {
      params: { limit: 1, q: demand.address },
      signal: AbortSignal.timeout(10000),
    }),
    demand.batiment_construction_id ? getBatEnrBatimentDetails({ batiment_construction_id: demand.batiment_construction_id }) : null,
  ]);
  const address = search.features[0];
  if (!address) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Adresse introuvable. Impossible de déterminer le réseau et sa distance.' });
  }
  const coordinates = getNetworkEligibilityCoordinates(
    { lat: address.geometry.coordinates[1], lon: address.geometry.coordinates[0] },
    building
  );
  const point = sql`ST_Transform(ST_SetSRID(ST_MakePoint(${coordinates.lon}, ${coordinates.lat}), 4326), 2154)`;
  const network = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['id_fcu', 'nom_reseau', 'Identifiant reseau as sncu_id', 'Gestionnaire as manager'])
    .select((expression) =>
      sql<
        number | null
      >`CASE WHEN ${expression.ref('has_trace')} THEN round(ST_Distance(${expression.ref('geom')}, ${point}))::int ELSE NULL END`.as(
        'distance'
      )
    )
    .$if(input.networkId !== undefined, (query) => query.where('id_fcu', '=', input.networkId!))
    .$if(input.networkId === undefined, (query) => query.where('has_trace', '=', true).where('geom', 'is not', null))
    .orderBy((expression) => sql`${expression.ref('geom')} <-> ${point}`)
    .orderBy('id_fcu')
    .limit(1)
    .executeTakeFirst();
  if (input.networkId !== undefined && !network) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Réseau de chaleur introuvable' });
  }
  return { address: address.properties, coordinates, network: network ?? null, updatedAt: demand.updated_at.toISOString() };
};
