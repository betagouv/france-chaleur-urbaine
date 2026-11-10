import type { Selectable, Transaction } from 'kysely';

import { createUserEvent } from '@/modules/events/server/service';
import { type DB, type Demands, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { omitEmptyStringValues } from '@/utils/objects';

import { type CreateDemandInput, formatDataToLegacyValues } from '../constants';

type CreateTransferredDemandInput = {
  values: CreateDemandInput;
  territory: Pick<Selectable<Demands>, 'commune_code' | 'departement_code' | 'epci_code' | 'ept_code' | 'region_code'>;
  network: { id_fcu: number; nom_reseau: string | null; sncu_id: string | null; distance: number | null };
  adminUserId: string;
};

/**
 * Creates a validated connection demand inside the moderation transaction, without the public confirmation email.
 */
export const createTransferredDemand = async (transaction: Transaction<DB>, input: CreateTransferredDemandInput) => {
  const legacyValues = omitEmptyStringValues({
    ...formatDataToLegacyValues(input.values),
    'Date de la demande': new Date().toISOString(),
    'Identifiant réseau': input.network.sncu_id,
    'Nom réseau': input.network.nom_reseau,
    'Relance à activer': input.values.heatingType === 'collectif',
    Status: DEMANDE_STATUS.TO_PROCESS,
  });
  const demand = await transaction
    .insertInto('demands')
    .values({
      comment_user: input.values.commentUser || null,
      commune_code: input.territory.commune_code,
      departement_code: input.territory.departement_code,
      epci_code: input.territory.epci_code,
      ept_code: input.territory.ept_code,
      legacy_values: sql<string>`${JSON.stringify(legacyValues)}::jsonb`,
      network_id: input.network.id_fcu,
      network_type: 'reseau_de_chaleur',
      region_code: input.territory.region_code,
      validated: true,
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  await transaction
    .insertInto('pro_eligibility_tests_addresses')
    .values({
      ban_address: input.values.address,
      ban_valid: true,
      demand_id: demand.id,
      geom: sql<GeoJSON.Point>`ST_Transform(ST_SetSRID(ST_MakePoint(${input.values.coords.lon}, ${input.values.coords.lat}), 4326), 2154)`,
      source_address: input.values.address,
    })
    .execute();
  await createUserEvent(
    {
      author_id: input.adminUserId,
      context_id: demand.id,
      context_type: 'demand',
      data: { source: 'renewable_heat_transfer' },
      type: 'demand_created',
    },
    transaction
  );
  await createUserEvent(
    { author_id: input.adminUserId, context_id: demand.id, context_type: 'demand', type: 'demand_validated' },
    transaction
  );
  return demand;
};
