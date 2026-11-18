import { TRPCError } from '@trpc/server';

import { businessRules } from '@/modules/app/business-rules';
import { syncDemandCustomTerritoryIds } from '@/modules/custom-territories/server/service';
import { createEvent } from '@/modules/events/server/service';
import { getAddressEligibilityHistoryEntry, updateEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';
import type { EligibilityType } from '@/server/services/addresseInformation';
import { processInParallel } from '@/utils/async';

import { getNearestNetwork } from '../constants';
import { mergeLegacyValues } from './legacy-values';

/**
 * Fills territory columns on a demand from its coordinates using PostGIS.
 */
export const fillDemandTerritoryFromCoords = async (demandId: string, lon: number, lat: number) => {
  // Commune, département, région, EPCI in one query via ign_communes
  await sql`
    UPDATE demands d SET
      commune_code = c.insee_com,
      departement_code = c.insee_dep,
      region_code = c.insee_reg,
      epci_code = c.siren_epci
    FROM ign_communes c
    WHERE d.id = ${demandId}
      AND ST_Contains(c.geom, ST_Transform(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 2154))
  `.execute(kdb);

  // EPT via membres JSONB (Île-de-France only)
  await sql`
    UPDATE demands d SET ept_code = e.code
    FROM ept e
    WHERE d.id = ${demandId}
      AND d.commune_code IS NOT NULL
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(e.membres) m WHERE m->>'code' = d.commune_code)
  `.execute(kdb);

  await syncDemandCustomTerritoryIds('demands', demandId);
};

const getNetworkTypeFromEligibilityType = (type: EligibilityType): NetworkType | null => {
  switch (type) {
    case 'dans_pdp_reseau_existant':
    case 'reseau_existant_proche':
    case 'reseau_existant_tres_proche':
    case 'reseau_existant_loin':
    case 'dans_ville_reseau_existant_sans_trace':
      return 'reseau_de_chaleur';
    case 'dans_pdp_reseau_futur':
    case 'dans_zone_reseau_futur':
    case 'reseau_futur_tres_proche':
    case 'reseau_futur_loin':
    case 'reseau_futur_proche':
      return 'reseau_en_construction';
    default:
      return null;
  }
};

/**
 * Mappe un type d'éligibilité sur l'entité concernée (PDP, réseau existant ou en construction).
 */
export const getEntityFromEligibilityType = (type: EligibilityType) => {
  switch (type) {
    case 'dans_pdp_reseau_futur':
    case 'dans_pdp_reseau_existant':
      return 'PDP';
    case 'reseau_existant_proche':
    case 'reseau_existant_tres_proche':
    case 'reseau_existant_loin':
    case 'dans_ville_reseau_existant_sans_trace':
      return 'ReseauDeChaleur';
    case 'dans_zone_reseau_futur':
    case 'reseau_futur_tres_proche':
    case 'reseau_futur_loin':
    case 'reseau_futur_proche':
      return 'ReseauEnConstruction';
    default:
      return null;
  }
};

/**
 * Computes the distance (in meters) from a demand's geocoded point to the assigned network.
 * Uses pro_eligibility_tests_addresses.geom (already in SRID 2154) as the point source.
 * Returns `null` for existing networks without trace, `0` when the point is inside a zone.
 */
export const computeNetworkDistance = async (demandId: string, networkIdFcu: number, networkType: NetworkType): Promise<number | null> => {
  const reseau = await (networkType === 'reseau_de_chaleur'
    ? kdb
        .selectFrom('reseaux_de_chaleur as n')
        .innerJoin('pro_eligibility_tests_addresses as pe', (join) => join.onTrue())
        .where('n.id_fcu', '=', networkIdFcu)
        .where('pe.demand_id', '=', demandId)
        .select((eb) =>
          sql<
            number | null
          >`CASE WHEN ${eb.ref('n.has_trace')} THEN round(ST_Distance(${eb.ref('n.geom')}, ${eb.ref('pe.geom')}))::int ELSE NULL END`.as(
            'distance'
          )
        )
        .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Réseau ou demande introuvable' }))
    : kdb
        .selectFrom('zones_et_reseaux_en_construction as n')
        .innerJoin('pro_eligibility_tests_addresses as pe', (join) => join.onTrue())
        .where('n.id_fcu', '=', networkIdFcu)
        .where('pe.demand_id', '=', demandId)
        .select((eb) => sql<number>`round(ST_Distance(${eb.ref('n.geom')}, ${eb.ref('pe.geom')}))::int`.as('distance'))
        .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Réseau ou demande introuvable' })));

  return reseau.distance;
};

/**
 * Assignment columns of a demand for the given nearest network. An extension linked to a heat network never carries a demand:
 * its parent network does (permissions, notifications, tracking), the extension is kept aside in `extension_id`.
 */
export const resolveDemandAssignment = async (networkIdFcu: number, networkType: NetworkType) => {
  const extension =
    networkType === 'reseau_en_construction'
      ? await kdb
          .selectFrom('zones_et_reseaux_en_construction')
          .select('reseau_de_chaleur_id')
          .where('id_fcu', '=', networkIdFcu)
          .executeTakeFirst()
      : undefined;
  return extension?.reseau_de_chaleur_id
    ? { extension_id: networkIdFcu, network_id: extension.reseau_de_chaleur_id, network_type: 'reseau_de_chaleur' as const }
    : { extension_id: null, network_id: networkIdFcu, network_type: networkType };
};

/** Max distance (m) to auto-assign a network for the non-eligible "réseau loin" cases. */
const networkAssignmentDistanceThreshold = businessRules.autoAssignMaxDistance.value;

/**
 * Auto-assigns network_id and network_type on a demand based on its eligibility case.
 * Eligible cases (PDP, in-zone, within the eligible distance) are assigned by definition; the
 * non-eligible "réseau loin" cases only within the 500m limit. Cases beyond that (no trace, too far)
 * have a null distance and stay unassigned. Also populates legacy fields for backward compatibility.
 */
export const autoAssignNetworkFromEligibility = async (demandId: string) => {
  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select('eligibility_history')
    .where('demand_id', '=', demandId)
    .executeTakeFirst();

  if (!testAddress) return;

  const history = testAddress.eligibility_history as ProEligibilityTestHistoryEntry[] | null;
  const lastEligibility = history?.[history.length - 1]?.eligibility;
  if (!lastEligibility?.id_fcu) return;

  const isAssignable =
    lastEligibility.eligible || (lastEligibility.distance !== null && lastEligibility.distance < networkAssignmentDistanceThreshold);
  if (!isAssignable) return;

  const networkType = getNetworkTypeFromEligibilityType(lastEligibility.type);
  const assignment = networkType
    ? await resolveDemandAssignment(lastEligibility.id_fcu, networkType)
    : { extension_id: null, network_id: lastEligibility.id_fcu, network_type: null };

  await kdb
    .updateTable('demands')
    .set({
      ...assignment,
      legacy_values: mergeLegacyValues({
        'Distance au réseau': lastEligibility.distance,
        'Identifiant réseau': lastEligibility.id_sncu,
        'Nom réseau': lastEligibility.nom,
      }),
    })
    .where('id', '=', demandId)
    .execute();
};

/** Demands processed at once when their eligibility is recomputed after a network deletion. */
const REASSIGNMENT_CONCURRENCY = 10;

/**
 * Reassigns the demands whose network no longer exists (deleted, effective at the sync): nobody can process them anymore.
 * Their eligibility is recomputed from the stored coordinates, then the usual auto-assignment applies; without an assignable
 * network they go back to « sans réseau », triaged by the territory accounts. Traced by a system `demand_assignment_changed`
 * event per demand. Idempotent: only looks at demands pointing to a missing network. `dryRun` only counts them.
 */
export const reassignDemandsOfDeletedNetworks = async ({ dryRun = false }: { dryRun?: boolean } = {}) => {
  const orphanDemands = await kdb
    .selectFrom('demands')
    .leftJoin('pro_eligibility_tests_addresses as address', 'address.demand_id', 'demands.id')
    .select([
      'demands.id',
      'demands.network_id',
      'demands.network_type',
      'demands.legacy_values',
      'address.id as address_id',
      'address.eligibility_history',
    ])
    .select((eb) => [
      sql<number | null>`ST_Y(ST_Transform(${eb.ref('address.geom')}, 4326))`.as('latitude'),
      sql<number | null>`ST_X(ST_Transform(${eb.ref('address.geom')}, 4326))`.as('longitude'),
    ])
    .where('demands.deleted_at', 'is', null)
    .where('demands.network_id', 'is not', null)
    .where((eb) =>
      eb.or([
        eb.and([
          eb('demands.network_type', '=', 'reseau_de_chaleur'),
          eb.not(
            eb.exists(eb.selectFrom('reseaux_de_chaleur as rdc').select('rdc.id_fcu').whereRef('rdc.id_fcu', '=', 'demands.network_id'))
          ),
        ]),
        eb.and([
          eb('demands.network_type', '=', 'reseau_en_construction'),
          eb.not(
            eb.exists(
              eb
                .selectFrom('zones_et_reseaux_en_construction as zrc')
                .select('zrc.id_fcu')
                .whereRef('zrc.id_fcu', '=', 'demands.network_id')
            )
          ),
        ]),
      ])
    )
    .execute();
  if (dryRun) {
    return orphanDemands.length;
  }

  await processInParallel(orphanDemands, REASSIGNMENT_CONCURRENCY, async (demand) => {
    const history = (demand.eligibility_history ?? []) as ProEligibilityTestHistoryEntry[];
    const historyEntry =
      demand.latitude !== null && demand.longitude !== null
        ? await getAddressEligibilityHistoryEntry(demand.latitude, demand.longitude, history[history.length - 1]?.eligibility)
        : null;
    if (demand.address_id && historyEntry && historyEntry.transition !== 'none') {
      await kdb
        .updateTable('pro_eligibility_tests_addresses')
        .set({ eligibility_history: JSON.stringify([...history, historyEntry]) })
        .where('id', '=', demand.address_id)
        .execute();
    }

    await kdb
      .updateTable('demands')
      .set({
        extension_id: null,
        // filled again by the auto-assignment when a network is assignable
        legacy_values: mergeLegacyValues({ 'Distance au réseau': null, 'Identifiant réseau': null, 'Nom réseau': null }),
        network_id: null,
        network_type: null,
        updated_at: new Date(),
      })
      .where('id', '=', demand.id)
      .execute();
    await autoAssignNetworkFromEligibility(demand.id);

    const reassigned = await kdb
      .selectFrom('demands')
      .select(['network_id', 'network_type', 'extension_id', 'legacy_values'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    const newNetwork = getNearestNetwork(reassigned);
    await createEvent({
      context_id: demand.id,
      context_type: 'demand',
      data: {
        new: {
          distance: newNetwork ? (reassigned.legacy_values['Distance au réseau'] ?? null) : null,
          network_id: newNetwork?.id ?? null,
          network_name: newNetwork ? (reassigned.legacy_values['Nom réseau'] ?? null) : null,
          network_sncu_id: newNetwork ? (reassigned.legacy_values['Identifiant réseau'] ?? null) : null,
          network_type: newNetwork?.type ?? null,
        },
        old: {
          distance: demand.legacy_values['Distance au réseau'] ?? null,
          network_id: demand.network_id,
          network_name: demand.legacy_values['Nom réseau'] ?? null,
          network_sncu_id: demand.legacy_values['Identifiant réseau'] ?? null,
          network_type: demand.network_type,
        },
      },
      type: 'demand_assignment_changed',
    });
  });

  return orphanDemands.length;
};

/**
 * Number of demands a network deletion concerns: those it carries (reassigned once the deletion is effective) and, for an
 * extension linked to a heat network, those it is the nearest network of (they stay on the parent network).
 */
export const countNetworkDemands = async (networkIdFcu: number, networkType: NetworkType) => {
  const counts = await kdb
    .selectFrom('demands')
    .select((eb) => [
      eb.fn
        .countAll<number>()
        .filterWhere((filter) => filter.and([filter('network_type', '=', networkType), filter('network_id', '=', networkIdFcu)]))
        .as('assigned'),
      eb.fn
        .countAll<number>()
        .filterWhere((filter) => (networkType === 'reseau_en_construction' ? filter('extension_id', '=', networkIdFcu) : filter.lit(false)))
        .as('kept_on_parent'),
    ])
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();
  return { assigned: Number(counts.assigned), keptOnParent: Number(counts.kept_on_parent) };
};

/**
 * Retourne la consommation de gaz connue à proximité des coordonnées (buffer 3,5m).
 */
export const getConsommationGazAdresse = async (lat: number, lon: number) => {
  const result = await kdb
    .selectFrom('donnees_de_consos')
    .select('conso_nb')
    .where(
      sql<boolean>`
        ST_INTERSECTS(
          ST_Transform(${sql.raw(`'SRID=4326;POINT(${lon} ${lat})'::geometry`)}, 2154),
          ST_BUFFER(geom, 3.5)
        )
      `
    )
    .executeTakeFirst();
  return result;
};

/**
 * Retourne les infos bâtiment (BNB) à proximité des coordonnées : id du groupe + nombre de logements.
 */
export const getBatimentInfoAtCoords = async (lat: number, lon: number) => {
  const result = await kdb
    .selectFrom('bdnb_batiments')
    .select(['batiment_groupe_id', 'ffo_bat_nb_log as nb_logements'])
    .where(
      sql.raw<boolean>(`
      ST_DWithin(
        geom,
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
        3.5
      )
    `)
    )
    .executeTakeFirst();
  return result;
};

/**
 * Recalcule l'éligibilité d'une demande en re-géocodant l'adresse via la BAN.
 * Délègue à updateEligibilityTestAddress qui met à jour l'adresse et les legacy_values de la demande.
 */
export const recalculateEligibility = async (demandId: string) => {
  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select(['id', 'source_address'])
    .where('demand_id', '=', demandId)
    .executeTakeFirstOrThrow();

  return updateEligibilityTestAddress(testAddress.id, testAddress.source_address);
};
