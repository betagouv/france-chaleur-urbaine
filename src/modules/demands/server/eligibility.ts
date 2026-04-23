import { TRPCError } from '@trpc/server';

import { type CreateFCUTeamContactInput, zAirtableFCUTeamContact } from '@/modules/demands/constants';
import { updateEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import type { NetworkType } from '@/modules/reseaux/constants';
import { AirtableDB } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import type { EligibilityType } from '@/server/services/addresseInformation';
import { Airtable } from '@/types/enum/Airtable';

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
};

const getNetworkTypeFromEligibilityType = (type: EligibilityType): NetworkType | null => {
  switch (type) {
    case 'dans_pdp_reseau_existant':
    case 'reseau_existant_proche':
    case 'reseau_existant_tres_proche':
    case 'reseau_existant_loin':
    case 'dans_ville_reseau_existant_sans_trace':
      return 'existant';
    case 'dans_pdp_reseau_futur':
    case 'dans_zone_reseau_futur':
    case 'reseau_futur_tres_proche':
    case 'reseau_futur_loin':
    case 'reseau_futur_proche':
      return 'en_construction';
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
  const reseau = await (networkType === 'existant'
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
        .executeTakeFirst()
    : kdb
        .selectFrom('zones_et_reseaux_en_construction as n')
        .innerJoin('pro_eligibility_tests_addresses as pe', (join) => join.onTrue())
        .where('n.id_fcu', '=', networkIdFcu)
        .where('pe.demand_id', '=', demandId)
        .select((eb) => sql<number>`round(ST_Distance(${eb.ref('n.geom')}, ${eb.ref('pe.geom')}))::int`.as('distance'))
        .executeTakeFirst());

  if (!reseau) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Réseau ou demande introuvable' });
  }
  return reseau.distance;
};

/**
 * Auto-assigns network_id and network_type on a demand based on its eligibility test address.
 * Also populates legacy fields for backward compatibility.
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

  if (!lastEligibility?.id_fcu || lastEligibility.type === 'trop_eloigne') return;

  const networkType = getNetworkTypeFromEligibilityType(lastEligibility.type);
  if (!networkType) return;

  await kdb
    .updateTable('demands')
    .set({
      legacy_values: mergeLegacyValues({
        'Distance au réseau': lastEligibility.distance,
        'Identifiant réseau': lastEligibility.id_sncu,
        'Nom réseau': lastEligibility.nom,
      }),
      network_id: lastEligibility.id_fcu,
      network_type: networkType,
    })
    .where('id', '=', demandId)
    .execute();
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

export const createFCUTeamContact = async (values: CreateFCUTeamContactInput) => {
  await AirtableDB(Airtable.CONTACT_ENTRETIEN_UTILISATEUR).create(
    zAirtableFCUTeamContact.parse({
      Adresse: values.address,
      Date: new Date().toISOString(),
      Email: values.email,
      'Mode de chauffage': values.heatingEnergy,
      Nom: values.lastName,
      'Nom de la structure': values.company,
      'Nombre de logement': values.nbLogements,
      Prenom: values.firstName,
      Structure: values.structure,
      Surface: values.demandArea,
      'Type de structure': values.companyType,
      Téléphone: values.phone,
    })
  );
};
