import type { InsertObject, RawBuilder, Selectable } from 'kysely';

import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { type DB, kdb, sql } from '@/server/db/kysely';

/**
 * Creates a LineString geometry (for networks) from a point with an offset in meters
 * @param lon Longitude in WGS84 (SRID 4326)
 * @param lat Latitude in WGS84 (SRID 4326)
 * @param offsetMeters Distance offset in meters (approximate, ~111km per degree)
 * @returns SQL expression for a LineString geometry in Lambert 93 (SRID 2154)
 */
export function createLineGeometry(lon: number, lat: number, offsetMeters: number): RawBuilder<string> {
  const offsetDegrees = offsetMeters / 111000; // Approximate conversion
  return sql`ST_Transform(ST_MakeLine(
    ST_Point(${lon + offsetDegrees}, ${lat}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat + offsetDegrees}, 4326)
  ), 2154)`;
}

/**
 * Creates a Polygon geometry (for zones) from a center point with a radius in meters
 * @param lon Longitude in WGS84 (SRID 4326)
 * @param lat Latitude in WGS84 (SRID 4326)
 * @param radiusMeters Radius in meters (approximate)
 * @returns SQL expression for a Polygon geometry in Lambert 93 (SRID 2154)
 */
export function createPolygonGeometry(lon: number, lat: number, radiusMeters: number): RawBuilder<string> {
  const offsetDegrees = radiusMeters / 111000;
  return sql`ST_Transform(ST_MakePolygon(ST_MakeLine(ARRAY[
    ST_Point(${lon - offsetDegrees}, ${lat - offsetDegrees}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat - offsetDegrees}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat + offsetDegrees}, 4326),
    ST_Point(${lon - offsetDegrees}, ${lat + offsetDegrees}, 4326),
    ST_Point(${lon - offsetDegrees}, ${lat - offsetDegrees}, 4326)
  ])), 2154)`;
}

export async function cleanDatabase() {
  // Parallelize all table cleanups (ordered by FK constraints between groups)
  await Promise.all([
    // Network tables
    kdb
      .deleteFrom('zone_de_developpement_prioritaire')
      .execute(),
    kdb.deleteFrom('zones_et_reseaux_en_construction').execute(),
    kdb.deleteFrom('reseaux_de_chaleur').execute(),

    // User-related tables
    kdb
      .deleteFrom('demand_emails')
      .execute(),
    kdb.deleteFrom('tags_reminders').execute(),
    kdb.deleteFrom('events').execute(),
    kdb.deleteFrom('pro_eligibility_tests_addresses').execute(),
    kdb.deleteFrom('jobs').execute(),
  ]);
  await Promise.all([kdb.deleteFrom('demands').execute(), kdb.deleteFrom('pro_eligibility_tests').execute()]);
  await kdb.deleteFrom('users').execute();
}

export async function seedTableUser(users: readonly Partial<InsertObject<DB, 'users'>>[]) {
  await kdb
    .insertInto('users')
    .values(
      users.map((user) => {
        const id = user.id ?? crypto.randomUUID();
        return {
          active: true,
          email: `user-${id}@test.local`,
          id,
          last_connection: sql`NOW()`,
          password: 'hashed_password',
          role: 'professionnel' as const,
          status: 'valid' as const,
          ...user,
        };
      })
    )
    .execute();
}

export async function seedProEligibilityTestsAddress(
  data: Partial<InsertObject<DB, 'pro_eligibility_tests_addresses'>> & { source_address: string }
): Promise<Selectable<DB['pro_eligibility_tests_addresses']>> {
  const defaultHistory: ProEligibilityTestHistoryEntry[] = [
    {
      calculated_at: new Date().toISOString(),
      eligibility: {
        contenu_co2_acv: undefined,
        distance: 45,
        eligible: true,
        id_fcu: 7501,
        id_sncu: '7501C',
        nom: 'CPCU',
        taux_enrr: undefined,
        type: 'reseau_existant_proche',
      },
      transition: 'initial',
    },
  ];

  const [result] = await kdb
    .insertInto('pro_eligibility_tests_addresses')
    .values({
      ban_address: data.ban_address ?? data.source_address,
      ban_score: data.ban_score ?? 95,
      ban_valid: data.ban_valid ?? true,
      eligibility_history: data.eligibility_history ?? JSON.stringify(defaultHistory),
      geom: data.geom ?? sql`st_transform(st_point(2.3522, 48.8566, 4326), 2154)`,
      ...data,
    })
    .returningAll()
    .execute();

  return result;
}

export async function seedReseauDeChaleur(data: InsertObject<DB, 'reseaux_de_chaleur'>) {
  return await kdb.insertInto('reseaux_de_chaleur').values(data).returningAll().executeTakeFirstOrThrow();
}

export async function seedZoneEtReseauEnConstruction(data: InsertObject<DB, 'zones_et_reseaux_en_construction'>) {
  return await kdb.insertInto('zones_et_reseaux_en_construction').values(data).returningAll().executeTakeFirstOrThrow();
}

export async function seedZoneDeDeveloppementPrioritaire(data: InsertObject<DB, 'zone_de_developpement_prioritaire'>) {
  return await kdb.insertInto('zone_de_developpement_prioritaire').values(data).returningAll().executeTakeFirstOrThrow();
}

/**
 * Reference coordinates for network eligibility testing
 * All coordinates are in Paris area (WGS84)
 */
/**
 * Coordonnées de référence pour les tests d'éligibilité
 *
 * Point de référence : testPoint (Paris centre)
 * Toutes les autres coordonnées sont exprimées relativement à ce point
 * pour faciliter la compréhension des distances et scénarios de test.
 */
export const NETWORK_TEST_COORDS = {
  /** Zone PDP (autour du réseau proche) */
  pdpZone: { lat: 48.8566, lon: 2.35355 }, // Même position que reseauProche

  /** Réseau futur loin (~500m du testPoint) */
  reseauFuturLoin: { lat: 48.8566, lon: 2.3572 }, // +0.005° lon ≈ 500m

  /** Réseau futur proche (~150m du testPoint) */
  reseauFuturProche: { lat: 48.8566, lon: 2.35355 }, // +0.00135° lon ≈ 150m

  /** Réseau futur très proche (~50m du testPoint) */
  reseauFuturTresProche: { lat: 48.8566, lon: 2.35265 }, // +0.00045° lon ≈ 50m

  /** Réseau existant loin (~500m du testPoint) */
  reseauLoin: { lat: 48.8566, lon: 2.3572 }, // +0.005° lon ≈ 500m

  /** Réseau existant proche (~150m du testPoint) */
  reseauProche: { lat: 48.8566, lon: 2.35355 }, // +0.00135° lon ≈ 150m

  /** Réseau sans trace (pas de géométrie, seulement référence ville) */
  reseauSansTrace: null,

  /** Réseau existant très loin (>2000m du testPoint) - évite les erreurs "undefined" dans le code legacy */
  reseauTresLoin: { lat: 48.8566, lon: 2.372 }, // +0.02° lon ≈ 2000m

  /** Réseau existant très proche (~40m du testPoint) */
  reseauTresProche: { lat: 48.8566, lon: 2.35256 }, // +0.00036° lon ≈ 40m
  /** Point de référence pour les tests (centre de Paris) */
  testPoint: { city: 'Paris', lat: 48.8566, lon: 2.3522 },

  /** Zone de réseau futur contenant le testPoint */
  zoneReseauFutur: { lat: 48.8566, lon: 2.3522 }, // Même position que testPoint (zone englobante)
} as const;

/**
 * Seeds a complete set of networks for eligibility testing
 * Creates networks at various distances from NETWORK_TEST_COORDS.testPoint
 * All insertions are parallelized for maximum performance
 */
export async function seedNetworksForEligibilityTests() {
  const { testPoint } = NETWORK_TEST_COORDS;

  await Promise.all([
    // 1. Very far default networks (to avoid undefined errors in legacy code)
    seedReseauDeChaleur({
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 2000),
      has_trace: true,
      'Identifiant reseau': 'DEFAULT-FAR',
      id_fcu: 9999,
      ouvert_aux_raccordements: true,
      tags: [],
    }),

    seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 3000),
      id_fcu: 9998,
      ouvert_aux_raccordements: true,
      tags: [],
    }),

    // 2. Very close existing network (~40m)
    seedReseauDeChaleur({
      'contenu CO2 ACV': 50,
      Gestionnaire: 'CPCU',
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 40),
      has_trace: true,
      'Identifiant reseau': '7501C',
      id_fcu: 7501,
      nom_reseau: 'CPCU',
      ouvert_aux_raccordements: true,
      'reseaux classes': true,
      'Taux EnR&R': 65,
      tags: [],
    }),

    // 3. Very close future network (~50m)
    seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 50),
      gestionnaire: 'Gestionnaire Futur',
      id_fcu: 9001,
      nom_reseau: 'Réseau Futur Test',
      ouvert_aux_raccordements: true,
      tags: [],
    }),

    // 4. Future zone (encompassing testPoint)
    seedZoneEtReseauEnConstruction({
      geom: createPolygonGeometry(testPoint.lon, testPoint.lat, 500),
      gestionnaire: 'Gestionnaire Zone',
      id_fcu: 9002,
      nom_reseau: null,
      ouvert_aux_raccordements: true,
      tags: [],
    }),

    // 5. Close existing network (~150m)
    seedReseauDeChaleur({
      'contenu CO2 ACV': 55,
      Gestionnaire: 'Test Gestionnaire',
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 150),
      has_PDP: true,
      has_trace: true,
      'Identifiant reseau': '7502C',
      id_fcu: 7502,
      nom_reseau: 'Réseau Proche',
      ouvert_aux_raccordements: true,
      'reseaux classes': false,
      'Taux EnR&R': 50,
      tags: [],
    }),

    // 6. Close future network (~150m)
    seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 150),
      gestionnaire: 'Gestionnaire Futur Proche',
      id_fcu: 9003,
      nom_reseau: 'Réseau Futur Proche',
      ouvert_aux_raccordements: true,
      tags: [],
    }),

    // 7. Far existing network (~500m)
    seedReseauDeChaleur({
      'contenu CO2 ACV': 60,
      Gestionnaire: 'Test Gestionnaire Loin',
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 500),
      has_trace: true,
      'Identifiant reseau': '7503C',
      id_fcu: 7503,
      nom_reseau: 'Réseau Loin',
      ouvert_aux_raccordements: true,
      'reseaux classes': false,
      'Taux EnR&R': 45,
      tags: [],
    }),

    // 8. Far future network (~500m)
    seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 500),
      gestionnaire: 'Gestionnaire Futur Loin',
      id_fcu: 9004,
      nom_reseau: 'Réseau Futur Loin',
      ouvert_aux_raccordements: true,
      tags: [],
    }),

    // 9. Network without trace (no geometry, only city reference)
    seedReseauDeChaleur({
      communes: ['Paris'],
      'contenu CO2 ACV': 45,
      Gestionnaire: 'Test Sans Trace',
      has_trace: false,
      'Identifiant reseau': '7504C',
      id_fcu: 7504,
      nom_reseau: 'Réseau Sans Trace',
      ouvert_aux_raccordements: true,
      'Taux EnR&R': 70,
      tags: [],
    }),

    // 10. PDP zone (around close network #7502)
    seedZoneDeDeveloppementPrioritaire({
      geom: createPolygonGeometry(testPoint.lon, testPoint.lat, 100),
      'Identifiant reseau': '7502C',
      id_fcu: 8001,
      reseau_de_chaleur_ids: [7502],
      reseau_en_construction_ids: [],
    }),

    // 11. Existing network NOT open for connections (~30m - should be ignored)
    seedReseauDeChaleur({
      'contenu CO2 ACV': 40,
      Gestionnaire: 'Gestionnaire Non Ouvert',
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 30),
      has_trace: true,
      'Identifiant reseau': '7505C',
      id_fcu: 7505,
      nom_reseau: 'Réseau Non Ouvert',
      ouvert_aux_raccordements: false,
      'reseaux classes': true,
      'Taux EnR&R': 80,
      tags: [],
    }),

    // 12. Future network NOT open for connections (~35m - should be ignored)
    seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(testPoint.lon, testPoint.lat, 35),
      gestionnaire: 'Gestionnaire Futur Non Ouvert',
      id_fcu: 9005,
      nom_reseau: 'Réseau Futur Non Ouvert',
      ouvert_aux_raccordements: false,
      tags: [],
    }),
  ]);
}
