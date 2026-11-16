import { TRPCError } from '@trpc/server';

import { classifyDemandOrigin } from '@/modules/analytics/demand-origin';
import { getIntegrationLabels } from '@/modules/analytics/server/demand-origin';
import { getNearestNetwork, type UpdateAdminDemandInput } from '@/modules/demands/constants';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { computeNetworkDistance, resolveDemandAssignment } from './eligibility';
import { buildDemandQuery, enrichDemandForAdmin, getDemandById, resolveNetworkInfo } from './helpers';
import { mergeLegacyValues } from './legacy-values';
import { sendUnrealizableDemandEmailIfNeeded } from './unrealizable-email';

const logger = parentLogger.child({ module: 'demands/admin-operations' });

/**
 * Soft-delete d'une demande (remplit `deleted_at`) et trace l'événement.
 *
 * Avec `userId` : suppression manuelle → `demand_deleted` attribuée à l'utilisateur.
 * Sans `userId` : suppression automatique (batch/système) → `demand_deleted_by_system`, sans auteur.
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
      type: 'demand_deleted_by_system',
    });
  }
};

/**
 * Liste toutes les demandes pour l'admin, avec infos réseau résolues (nom, SNCU) et test d'adresse joint.
 */
export const listAdmin = async () => {
  const startTime = Date.now();

  // Flag admin (booléen, jamais renvoyé sous forme de liste de communes) : commune de la demande absente du réseau affecté.
  const records = await buildDemandQuery()
    .leftJoin('email_blocked_contacts as ebc', (join) =>
      join.on((eb) => eb('ebc.email', '=', sql<string>`lower(${eb.ref('demands.legacy_values')}->>'Mail')`))
    )
    .select('ebc.reason_code as email_blocked_reason')
    // the communes are those of the nearest network: the extension when the demand is carried by its parent network
    .leftJoin('zones_et_reseaux_en_construction as extension', 'extension.id_fcu', 'demands.extension_id')
    .select((eb) => {
      const communes = eb.fn.coalesce('extension.communes_insee', 'rdc.communes_insee', 'zrc.communes_insee');
      return eb
        .case()
        .when(
          eb.and([
            eb('demands.commune_code', 'is not', null),
            eb(eb.fn<number>('array_length', [communes, eb.val(1)]), '>', 0),
            eb.not(eb(communes, '&&', sql<string[]>`ARRAY[${eb.ref('demands.commune_code')}]`)),
          ])
        )
        .then(true)
        .else(false)
        .end()
        .as('ville_differente');
    })
    .execute();

  const { count } = await kdb
    .selectFrom('demands')
    .select(kdb.fn.count<number>('id').as('count'))
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  logger.info('kdb.getAdminDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });

  const integrationLabels = await getIntegrationLabels();
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

      const enriched = enrichDemandForAdmin({ demand, testAddress });
      return {
        ...enriched,
        origin: classifyDemandOrigin(record.acquisition, integrationLabels),
      };
    })
    .filter((v) => v !== null);

  return { count, items: demands };
};

/**
 * Admin : valide une demande (visible aux gestionnaires).
 * Le champ `Relance à activer` est défini à la création, pas ici.
 */
export const validateDemand = async (demandId: string, adminUserId: string) => {
  await kdb
    .updateTable('demands')
    .set({
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
    type: 'demand_validated',
  });
};

/**
 * Admin: changes the network assigned to a demand, given its nearest network (the one picked by the admin).
 * An extension linked to a heat network is resolved to its parent network, see `resolveDemandAssignment`; the event keeps the nearest network.
 * Pass null for both to unassign the network (désaffectation).
 * Clears any pending assignment change request on success.
 */
export const changeDemandAssignment = async (
  demandId: string,
  networkIdFcu: number | null,
  networkType: NetworkType | null,
  adminUserId: string
): Promise<{ distance: number | null }> => {
  const currentDemand = await kdb
    .selectFrom('demands')
    .select(['network_id', 'network_type', 'extension_id'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();
  const currentNetwork = getNearestNetwork(currentDemand);

  const newInfo =
    networkIdFcu !== null && networkType !== null
      ? await resolveNetworkInfo(networkType, networkIdFcu)
      : { network_name: null, network_sncu_id: null };
  const newDistance =
    networkIdFcu !== null && networkType !== null ? await computeNetworkDistance(demandId, networkIdFcu, networkType) : null;
  const assignment =
    networkIdFcu !== null && networkType !== null
      ? await resolveDemandAssignment(networkIdFcu, networkType)
      : { extension_id: null, network_id: networkIdFcu, network_type: networkType };

  const oldInfo = currentNetwork
    ? await resolveNetworkInfo(currentNetwork.type, currentNetwork.id)
    : { network_name: null, network_sncu_id: null };
  let oldDistance: number | null = null;
  if (currentNetwork) {
    try {
      oldDistance = await computeNetworkDistance(demandId, currentNetwork.id, currentNetwork.type);
    } catch {
      oldDistance = null;
    }
  }

  await kdb
    .updateTable('demands')
    .set({
      ...assignment,
      legacy_values: mergeLegacyValues({
        'Distance au réseau': newDistance,
        'Identifiant réseau': newInfo.network_sncu_id,
        'Nom réseau': newInfo.network_name,
      }),
      pending_assignment_change: null,
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: {
      new: {
        distance: newDistance,
        network_id: networkIdFcu,
        network_name: newInfo.network_name,
        network_sncu_id: newInfo.network_sncu_id,
        network_type: networkType,
      },
      old: {
        distance: oldDistance,
        network_id: currentNetwork?.id ?? null,
        network_name: oldInfo.network_name,
        network_sncu_id: oldInfo.network_sncu_id,
        network_type: currentNetwork?.type ?? null,
      },
    },
    type: 'demand_assignment_changed',
  });

  return { distance: newDistance };
};

/**
 * Admin: rejects a pending assignment change request on a demand.
 * Clears the pending JSONB without touching the current assignment.
 */
export const rejectDemandAssignmentChangeRequest = async (demandId: string, adminUserId: string) => {
  const demand = await kdb
    .selectFrom('demands')
    .select(['id', 'pending_assignment_change'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));

  const pending = demand.pending_assignment_change;
  if (!pending) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aucune demande de réaffectation en attente' });
  }

  await kdb.updateTable('demands').set({ pending_assignment_change: null, updated_at: new Date() }).where('id', '=', demandId).execute();

  const info =
    pending.network_type !== null && pending.network_id !== null
      ? await resolveNetworkInfo(pending.network_type, pending.network_id)
      : { network_name: null, network_sncu_id: null };

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: {
      comment: pending.comment,
      pending: {
        distance: pending.distance,
        network_id: pending.network_id,
        network_name: info.network_name,
        network_sncu_id: info.network_sncu_id,
        network_type: pending.network_type,
      },
    },
    type: 'demand_assignment_change_request_rejected',
  });
};

/**
 * Admin: generic update of demand fields from `zAdminDemandUpdateValues`.
 * Syncs column-backed fields (`validated`, `network_id`, `network_type`, `comment_fcu`)
 * and merges the remaining fields into `legacy_values`.
 */
export const updateDemandByAdmin = async (demandId: string, values: UpdateAdminDemandInput, adminUserId: string) => {
  const { comment_fcu, ...legacyUpdates } = values;

  const currentDemand = await kdb
    .selectFrom('demands')
    .selectAll()
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));

  const [updatedDemand] = await kdb
    .updateTable('demands')
    .set({
      ...(comment_fcu && { comment_fcu }),
      legacy_values: mergeLegacyValues(legacyUpdates),
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

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: values,
    type: 'demand_updated',
  });
  await sendUnrealizableDemandEmailIfNeeded({ actorRole: 'admin', currentDemand, nextStatus: values.Status });

  const demand = await getDemandById(updatedDemand.id);
  return enrichDemandForAdmin({ demand, testAddress: testAddress || null });
};
