import type { InsertObject, RawBuilder, Selectable } from 'kysely';

import { createGeometryExpression } from '@/modules/geo/server/helpers';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { omit } from '@/utils/objects';

import { eligibilityFixtures } from './fixtures/eligibility';

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

    // Geographic tables
    kdb
      .deleteFrom('ign_communes')
      .execute(),
    kdb.deleteFrom('ign_departements').execute(),
    kdb.deleteFrom('ign_regions').execute(),

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

export async function seedCommune(data: InsertObject<DB, 'ign_communes'>) {
  return await kdb.insertInto('ign_communes').values(data).returningAll().executeTakeFirstOrThrow();
}

export async function seedDepartement(data: InsertObject<DB, 'ign_departements'>) {
  return await kdb.insertInto('ign_departements').values(data).returningAll().executeTakeFirstOrThrow();
}

export async function seedRegion(data: InsertObject<DB, 'ign_regions'>) {
  return await kdb.insertInto('ign_regions').values(data).returningAll().executeTakeFirstOrThrow();
}

/**
 * Properties to exclude when extracting entity properties (everything except data properties)
 */
const EXCLUDED_PROPERTIES = [
  'type',
  'geom',
  'expectedEligibilityType',
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-opacity',
  'stroke-width',
  'marker-color',
  'marker-size',
  'marker-symbol',
] as const;

/**
 * Seed the database with the eligibility test data.
 */
export async function seedEligibilityTestsData() {
  for (const feature of eligibilityFixtures.features) {
    // Convert GeoJSON to PostGIS geometry (4326 -> 2154)
    const geom = createGeometryExpression(feature.geometry, 4326);

    switch (feature.properties.type) {
      case 'commune': {
        await kdb
          .insertInto('ign_communes')
          .values({
            ...omit(feature.properties, EXCLUDED_PROPERTIES),
            geom,
          })
          .execute();
        break;
      }
      case 'departement': {
        await kdb
          .insertInto('ign_departements')
          .values({
            ...omit(feature.properties, EXCLUDED_PROPERTIES),
            geom,
          })
          .execute();
        break;
      }
      case 'region': {
        await kdb
          .insertInto('ign_regions')
          .values({
            ...omit(feature.properties, EXCLUDED_PROPERTIES),
            geom,
          })
          .execute();
        break;
      }
      case 'pdp': {
        await kdb
          .insertInto('zone_de_developpement_prioritaire')
          .values({
            ...omit(feature.properties, EXCLUDED_PROPERTIES),
            geom,
          })
          .execute();
        break;
      }
      case 'reseauDeChaleur': {
        await kdb
          .insertInto('reseaux_de_chaleur')
          .values({
            ...omit(feature.properties, EXCLUDED_PROPERTIES),
            geom,
          })
          .execute();
        break;
      }
      case 'reseauEnConstruction': {
        await kdb
          .insertInto('zones_et_reseaux_en_construction')
          .values({
            ...omit(feature.properties, EXCLUDED_PROPERTIES),
            geom,
          })
          .execute();
        break;
      }
      case 'test': {
        // Skip test points - they're just for visualization
        break;
      }
    }
  }
}
