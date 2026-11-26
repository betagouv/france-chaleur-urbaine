import type { InsertObject, RawBuilder, Selectable } from 'kysely';

import type { CreateDemandInput } from '@/modules/demands/constants';
import { createGeometryExpression } from '@/modules/geo/server/helpers';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { omit } from '@/utils/objects';

import { eligibilityFixtures } from './fixtures/eligibility';

/**
 * Construit un input de création de demande valide. Surcharger les champs nécessaires au test
 * (`coords` pilote le calcul d'éligibilité ; les autres champs alimentent les legacy_values).
 */
export const buildDemandInput = (overrides: Partial<CreateDemandInput> = {}): CreateDemandInput => ({
  address: '10 Rue de Rivoli 75001 Paris',
  city: 'Paris',
  company: '',
  companyType: '',
  coords: { lat: 48.8566, lon: 2.3522 },
  demandCompanyName: '',
  demandCompanyType: '',
  department: 'Paris',
  eligibility: { distance: 45, inPDP: false, isEligible: true },
  email: 'test@example.com',
  firstName: 'Jean',
  heatingEnergy: 'gaz',
  heatingType: 'collectif',
  lastName: 'Dupont',
  phone: '',
  postcode: '75001',
  region: 'Île-de-France',
  structure: 'Copropriété',
  termOfUse: true,
  ...overrides,
});

/**
 * Coordonnées du point de test de la fixture d'éligibilité, identifié par sa clé (`name` du point,
 * ou à défaut son `expectedEligibilityType`).
 */
export function getTestPointCoordinates(name: string): { lat: number; lon: number } {
  const testPoint = eligibilityFixtures.features.find(
    (feature) => feature.properties.type === 'test' && (feature.properties.name ?? feature.properties.expectedEligibilityType) === name
  );
  if (testPoint?.geometry.type !== 'Point') {
    throw new Error(`Point de test non trouvé pour ${name}`);
  }
  const [lon, lat] = testPoint.geometry.coordinates;
  return { lat, lon };
}

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

/** Tables filled by the migrations or by PostGIS: the application relies on their content, they are never emptied. */
const TABLES_KEPT_BY_CLEAN_DATABASE = ['kysely_migrations', 'kysely_migration_lock', 'spatial_ref_sys', 'tiles_metadata'];

let cleanDatabaseStatement: Promise<RawBuilder<unknown>> | undefined;

/**
 * Empties every table of the test database in one round trip. The tables and their deletion order are read from the Postgres
 * catalog (once per test file), so a new table is covered without touching this function; only a table that a migration
 * fills has to be added to `TABLES_KEPT_BY_CLEAN_DATABASE`.
 */
export async function cleanDatabase() {
  cleanDatabaseStatement ??= buildCleanDatabaseStatement();
  await (await cleanDatabaseStatement).execute(kdb);
}

/** One `DELETE` per table, sent as a single query: Postgres runs them in order, in one implicit transaction. */
async function buildCleanDatabaseStatement() {
  const [tables, foreignKeys] = await Promise.all([
    sql<{ name: string }>`
      SELECT tablename AS name FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> ALL(${TABLES_KEPT_BY_CLEAN_DATABASE})
      ORDER BY tablename`.execute(kdb),
    sql<ForeignKey>`
      SELECT child.relname AS child, parent.relname AS parent
      FROM pg_constraint
      INNER JOIN pg_class AS child ON child.oid = pg_constraint.conrelid
      INNER JOIN pg_class AS parent ON parent.oid = pg_constraint.confrelid
      WHERE pg_constraint.contype = 'f' AND pg_constraint.connamespace = 'public'::regnamespace`.execute(kdb),
  ]);
  const orderedTables = orderForDeletion(
    tables.rows.map((table) => table.name),
    foreignKeys.rows
  );
  return sql.join(
    orderedTables.map((table) => sql`DELETE FROM ${sql.id(table)}`),
    sql`; `
  );
}

type ForeignKey = { child: string; parent: string };

/**
 * Orders the tables so that each one comes after every table that references it: its rows are then deleted without
 * breaking a foreign key, nor triggering a cascade. A table referencing itself needs no order (one statement empties it).
 */
function orderForDeletion(tables: string[], foreignKeys: ForeignKey[]): string[] {
  if (tables.length === 0) {
    return [];
  }
  const deletableTables = tables.filter(
    (table) =>
      !foreignKeys.some((foreignKey) => foreignKey.parent === table && foreignKey.child !== table && tables.includes(foreignKey.child))
  );
  if (deletableTables.length === 0) {
    throw new Error(`cleanDatabase: these tables reference each other in a cycle, order them by hand: ${tables.join(', ')}`);
  }
  return [
    ...deletableTables,
    ...orderForDeletion(
      tables.filter((table) => !deletableTables.includes(table)),
      foreignKeys
    ),
  ];
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

/** `Gestionnaire`, `MO` and `nom_reseau` are generated columns: a seed gives them as the survey (FEDENE) values. */
type SeedNetworkValues<Table extends 'reseaux_de_chaleur' | 'reseaux_de_froid'> = InsertObject<DB, Table> & {
  Gestionnaire?: string | null;
  MO?: string | null;
  nom_reseau?: string | null;
};

const toSurveyColumns = <Table extends 'reseaux_de_chaleur' | 'reseaux_de_froid'>({
  Gestionnaire,
  MO,
  nom_reseau,
  ...data
}: SeedNetworkValues<Table>): InsertObject<DB, Table> =>
  ({
    ...data,
    ...(Gestionnaire !== undefined ? { gestionnaire_fedene: Gestionnaire } : {}),
    ...(MO !== undefined ? { mo_fedene: MO } : {}),
    ...(nom_reseau !== undefined ? { nom_reseau_fedene: nom_reseau } : {}),
  }) as InsertObject<DB, Table>;

export async function seedReseauDeChaleur(data: SeedNetworkValues<'reseaux_de_chaleur'>) {
  return await kdb.insertInto('reseaux_de_chaleur').values(toSurveyColumns(data)).returningAll().executeTakeFirstOrThrow();
}

export async function seedReseauDeFroid(data: SeedNetworkValues<'reseaux_de_froid'>) {
  return await kdb.insertInto('reseaux_de_froid').values(toSurveyColumns(data)).returningAll().executeTakeFirstOrThrow();
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

export async function seedCcrtExperimentationTerritory() {
  await kdb
    .insertInto('departements')
    .values({
      annee: '2026',
      dju_chaud_moyen: 0,
      dju_froid_moyen: 0,
      id: '13',
      nom_departement: 'Bouches-du-Rhône',
      source: 'test',
      sous_zone_climatique: null,
      zone_climatique: null,
    })
    .onConflict((onConflict) =>
      onConflict.column('id').doUpdateSet({
        annee: '2026',
        nom_departement: 'Bouches-du-Rhône',
        source: 'test',
      })
    )
    .execute();

  await kdb
    .insertInto('communes')
    .values({
      altitude_moyenne: 0,
      code_postal: '13001',
      commune: 'MARSEILLE',
      departement_id: '13',
      id: '13055',
      source: 'test',
      temperature_ref_altitude_moyenne: 0,
    })
    .onConflict((onConflict) =>
      onConflict.column('id').doUpdateSet({
        code_postal: '13001',
        commune: 'MARSEILLE',
        departement_id: '13',
        source: 'test',
      })
    )
    .execute();
}

export async function seedDemandeChaleurRenouvelable(data: Partial<InsertObject<DB, 'demands_chaleur_renouvelable'>> = {}) {
  return await kdb
    .insertInto('demands_chaleur_renouvelable')
    .values({
      address: '10 Rue de Rivoli 75001 Paris',
      average_area: 70,
      average_residents: 2,
      dpe: 'E',
      email: 'demandeur@example.fr',
      first_name: 'Jean',
      heating_energy: 'Gaz',
      housing_count: 25,
      housing_type: 'immeuble_chauffage_collectif',
      last_name: 'Dupont',
      occupant_status: 'Copropriétaire',
      origin_demand_id: null,
      outdoor_space: 'none',
      project_status: ['Début de réflexion'],
      simulation_url: '/chaleur-renouvelable/resultat?adresse=10+Rue+de+Rivoli+75001+Paris',
      ...data,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
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
