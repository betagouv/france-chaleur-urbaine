import { TRPCError } from '@trpc/server';

import type { UpdateAdminDemandInput } from '@/modules/demands/constants';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { computeNetworkDistance } from './eligibility';
import { buildDemandQuery, enrichDemandForAdmin, getDemandById } from './helpers';

const logger = parentLogger.child({ module: 'demands/admin-operations' });

/**
 * Soft-delete d'une demande (remplit `deleted_at`) et trace l'événement.
 */
export const removeDemand = async (demandId: string, userId?: string) => {
  await kdb
    .updateTable('demands')
    .set({ deleted_at: new Date(), updated_at: new Date() })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  if (userId) {
    await createUserEvent({
      author_id: userId,
      context_id: demandId,
      context_type: 'demand',
      type: 'demand_deleted',
    });
  } else {
    await createEvent({
      context_id: demandId,
      context_type: 'demand',
      type: 'demand_deleted',
    });
  }
};

/**
 * Liste toutes les demandes pour l'admin, avec infos réseau résolues (nom, SNCU, tags) et test d'adresse joint.
 */
export const listAdmin = async () => {
  const startTime = Date.now();

  const records = await buildDemandQuery()
    .select([
      sql<string | null>`
        CASE
          WHEN demands.network_type = 'existant' THEN (SELECT nom_reseau FROM reseaux_de_chaleur WHERE id_fcu = demands.network_id)
          WHEN demands.network_type = 'en_construction' THEN (SELECT nom_reseau FROM zones_et_reseaux_en_construction WHERE id_fcu = demands.network_id)
          ELSE NULL
        END
      `.as('network_name'),
      sql<string | null>`
        CASE WHEN demands.network_type = 'existant'
          THEN (SELECT "Identifiant reseau" FROM reseaux_de_chaleur WHERE id_fcu = demands.network_id)
          ELSE NULL
        END
      `.as('network_sncu_id'),
      sql<string[]>`
        CASE
          WHEN demands.network_type = 'existant' THEN (SELECT tags FROM reseaux_de_chaleur WHERE id_fcu = demands.network_id)
          WHEN demands.network_type = 'en_construction' THEN (SELECT tags FROM zones_et_reseaux_en_construction WHERE id_fcu = demands.network_id)
          ELSE NULL
        END
      `.as('network_tags'),
    ])
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  const { count } = await kdb.selectFrom('demands').select(kdb.fn.count<number>('id').as('count')).executeTakeFirstOrThrow();

  logger.info('kdb.getAdminDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });

  const demands = records
    .map((record) => {
      const { testAddress, ...demand } = record;
      const legacyValues = record.legacy_values;

      if (!legacyValues.Latitude || !legacyValues.Longitude || !legacyValues.Ville) {
        logger.warn('missing demand fields', {
          demandId: demand.id,
          missingFields: ['Latitude', 'Longitude', 'Ville'],
        });
        return null;
      }

      return enrichDemandForAdmin({ demand, testAddress });
    })
    .filter((v) => v !== null);

  return { count, items: demands };
};

/**
 * Admin : valide une demande (visible aux gestionnaires) et active la relance si
 * distance < 200m + chauffage collectif.
 */
export const validateDemand = async (demandId: string, adminUserId: string) => {
  const demand = await kdb
    .selectFrom('demands')
    .selectAll()
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  const distance = demand.legacy_values['Distance au réseau'];
  const isCollectif = demand.legacy_values['Type de chauffage'] === 'Collectif';
  const relanceAActiver = distance != null && distance < 200 && isCollectif;

  await kdb
    .updateTable('demands')
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify({
        'Gestionnaires validés': true,
        'Relance à activer': relanceAActiver,
      })}::jsonb`,
      updated_at: new Date(),
      validated: true,
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: { relance_a_activer: relanceAActiver, validated: true },
    type: 'demand_validated',
  });
};

/**
 * Admin: unvalidates a demand (sets validated = false, syncs to legacy_values).
 */
export const unvalidateDemand = async (demandId: string, adminUserId: string) => {
  await kdb
    .updateTable('demands')
    .set({
      legacy_values: sql`legacy_values || '{"Gestionnaires validés": false}'::jsonb`,
      updated_at: new Date(),
      validated: false,
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: { validated: false },
    type: 'demand_unvalidated',
  });
};

/**
 * Admin: changes the network assigned to a demand.
 * Pass null for both to unassign the network.
 * Resets validated to false (admin must re-validate after network change).
 */
export const changeDemandNetwork = async (
  demandId: string,
  networkIdFcu: number | null,
  networkType: NetworkType | null,
  adminUserId: string
): Promise<{ distance: number | null }> => {
  let sncuId: string | null = null;
  let networkName: string | null = null;
  let distance: number | null = null;

  if (networkIdFcu && networkType === 'existant') {
    const network = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select([sql<string>`"Identifiant reseau"`.as('sncu_id'), 'nom_reseau'])
      .where('id_fcu', '=', networkIdFcu)
      .executeTakeFirst();
    sncuId = network?.sncu_id ?? null;
    networkName = network?.nom_reseau ?? null;
    distance = await computeNetworkDistance(demandId, networkIdFcu, networkType);
  } else if (networkIdFcu && networkType === 'en_construction') {
    const network = await kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select('nom_reseau')
      .where('id_fcu', '=', networkIdFcu)
      .executeTakeFirst();
    networkName = network?.nom_reseau ?? null;
    distance = await computeNetworkDistance(demandId, networkIdFcu, networkType);
  }

  await kdb
    .updateTable('demands')
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify({
        'Distance au réseau': distance,
        'Gestionnaires validés': false,
        'Identifiant réseau': sncuId,
        'Nom réseau': networkName,
      })}::jsonb`,
      network_id: networkIdFcu,
      network_type: networkType,
      updated_at: new Date(),
      validated: false,
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: { network_id: networkIdFcu, network_name: networkName, network_type: networkType },
    type: 'demand_network_changed',
  });

  return { distance };
};

/**
 * Admin: generic update of demand fields from `zAdminDemandUpdateValues`.
 * Syncs column-backed fields (`validated`, `network_id`, `network_type`, `comment_fcu`)
 * and merges the remaining fields into `legacy_values`.
 */
export const updateDemandByAdmin = async (demandId: string, values: UpdateAdminDemandInput, adminUserId: string) => {
  const { comment_fcu, ...legacyUpdates } = values;

  const currentDemand = await kdb.selectFrom('demands').selectAll().where('id', '=', demandId).executeTakeFirst();
  if (!currentDemand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }

  // If 'Affecté à' is changing, clear the downstream 'Gestionnaire Affecté à'.
  const legacyPatch: Record<string, unknown> = { ...legacyUpdates };
  if (
    legacyUpdates['Affecté à'] &&
    currentDemand.legacy_values['Gestionnaire Affecté à'] &&
    legacyUpdates['Affecté à'] !== currentDemand.legacy_values['Affecté à']
  ) {
    legacyPatch['Gestionnaire Affecté à'] = null;
  }

  const columnUpdates: Record<string, unknown> = {};
  if ('Gestionnaires validés' in legacyUpdates) {
    columnUpdates.validated = legacyUpdates['Gestionnaires validés'] === true;
  }
  if ('Identifiant réseau' in legacyUpdates) {
    const sncuId = legacyUpdates['Identifiant réseau'];
    if (sncuId) {
      const network = await kdb
        .selectFrom('reseaux_de_chaleur')
        .select('id_fcu')
        .where('"Identifiant reseau"' as any, '=', sncuId)
        .executeTakeFirst();
      if (network) {
        columnUpdates.network_id = network.id_fcu;
        columnUpdates.network_type = 'existant';
      }
    } else {
      columnUpdates.network_id = null;
      columnUpdates.network_type = null;
    }
  }

  const [updatedDemand] = await kdb
    .updateTable('demands')
    .set({
      ...(comment_fcu && { comment_fcu }),
      ...columnUpdates,
      legacy_values: sql`legacy_values || ${JSON.stringify(legacyPatch)}::jsonb`,
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .returningAll()
    .execute();

  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .selectAll()
    .where('demand_id', '=', updatedDemand.id)
    .executeTakeFirst();

  const eventType = columnUpdates.validated === true ? 'demand_assigned' : 'demand_updated';
  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: values,
    type: eventType,
  });

  const demand = await getDemandById(updatedDemand.id);
  if (!demand) {
    throw new Error('Demand not found');
  }
  return enrichDemandForAdmin({ demand, testAddress: testAddress || null });
};
