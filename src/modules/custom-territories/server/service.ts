import { TRPCError } from '@trpc/server';
import { type Expression, type ExpressionBuilder, type Kysely, type SqlBool, sql } from 'kysely';

import { createUserEvent } from '@/modules/events/server/service';
import type { BBox } from '@/modules/map/shared/types';
import { removePermissionFromAllUsers } from '@/modules/permissions/server/service';
import { customTerritoryPermissionType } from '@/modules/permissions/types';
import { type DB, kdb } from '@/server/db/kysely';

import type { CreateCustomTerritoryInput, CustomTerritoryRecipe, TerritoryRef, UpdateCustomTerritoryInput } from '../constants';
import type { CustomTerritory, CustomTerritoryListItem } from '../types';

const customTerritoryColumns = ['id', 'name', 'recipe', 'commune_codes', 'created_at', 'updated_at'] as const;

/** Tables carrying the denormalized `custom_territory_ids` array (kept in sync from `commune_code`). */
const demandTables = ['demands', 'demands_chaleur_renouvelable'] as const;
type DemandTable = (typeof demandTables)[number];

// ─── Recipe resolution ───────────────────────────────────────────────────────

/** Condition on `ign_communes` for one administrative territory reference. */
const communeMatchesRef = (eb: ExpressionBuilder<DB, 'ign_communes'>, ref: TerritoryRef): Expression<SqlBool> => {
  switch (ref.type) {
    case 'commune':
      return eb('insee_com', '=', ref.code);
    case 'departement':
      return eb('insee_dep', '=', ref.code);
    case 'region':
      return eb('insee_reg', '=', ref.code);
    case 'epci':
      // IGN encodes some Grand Paris memberships as `EPCI/EPT`: only the EPCI part is compared.
      return eb(sql<string>`split_part(${eb.ref('siren_epci')}, '/', 1)`, '=', ref.code);
    case 'ept':
      return eb.exists(
        eb
          .selectFrom('ept')
          .select('ept.code')
          .where('ept.code', '=', ref.code)
          .where(
            (subEb) =>
              sql<boolean>`${subEb.ref('ept.membres')} @> jsonb_build_array(jsonb_build_object('code', ${subEb.ref('ign_communes.insee_com')}))`
          )
      );
  }
};

/** Communes of the included territories minus the communes of the excluded ones, from the IGN referential. */
export const computeRecipeCommuneCodes = async (recipe: CustomTerritoryRecipe, db: Kysely<DB> = kdb): Promise<string[]> => {
  const rows = await db
    .selectFrom('ign_communes')
    .select('insee_com')
    .distinct()
    .where('insee_com', 'is not', null)
    .where((eb) => eb.or(recipe.include.map((ref) => communeMatchesRef(eb, ref))))
    .$if(recipe.exclude.length > 0, (qb) => qb.where((eb) => eb.not(eb.or(recipe.exclude.map((ref) => communeMatchesRef(eb, ref))))))
    .orderBy('insee_com')
    .execute();
  return rows.map((row) => row.insee_com).filter((code): code is string => code !== null);
};

export type RecipePreview = {
  communes_count: number;
  by_departement: { departement_code: string; nom: string; communes_count: number }[];
};

/** Resolves a recipe without saving anything: commune count, broken down by département. */
export const previewRecipe = async (recipe: CustomTerritoryRecipe): Promise<RecipePreview> => {
  const communeCodes = await computeRecipeCommuneCodes(recipe);
  if (communeCodes.length === 0) {
    return { by_departement: [], communes_count: 0 };
  }
  const byDepartement = await kdb
    .selectFrom('ign_communes')
    .leftJoin('ign_departements', 'ign_departements.insee_dep', 'ign_communes.insee_dep')
    .select((eb) => [
      sql<string>`${eb.ref('ign_communes.insee_dep')}`.as('departement_code'),
      eb.fn.coalesce('ign_departements.nom', 'ign_communes.insee_dep').as('nom'),
      eb.fn.count<number>('ign_communes.insee_com').distinct().as('communes_count'),
    ])
    .where('ign_communes.insee_com', 'in', communeCodes)
    .groupBy(['ign_communes.insee_dep', 'ign_departements.nom'])
    .orderBy('ign_communes.insee_dep')
    .execute();
  return {
    by_departement: byDepartement.map((row) => ({ ...row, communes_count: Number(row.communes_count), nom: String(row.nom) })),
    communes_count: communeCodes.length,
  };
};

type Outline = GeoJSON.Polygon | GeoJSON.MultiPolygon;

export type RecipeGeometryPreview = {
  /** Merged outline of the communes of the territory (included minus excluded), WGS84. Null when the recipe covers no commune. */
  territory: Outline | null;
  /** Merged outline of the communes of the excluded territories, WGS84. Null without exclusion. */
  excluded: Outline | null;
  /** Bounding box of both outlines, to frame the map. */
  bounds: BBox | null;
};

/**
 * Resolves a recipe into map outlines without saving anything. The IGN communes form a polygon coverage (shared
 * edges, no overlap), which `ST_CoverageUnion` merges about 8 times faster than `ST_Union`; it drops the SRID,
 * hence the `ST_SetSRID`. The merged outline is simplified (~100 m) to keep the payload small.
 */
export const previewRecipeGeometry = async (recipe: CustomTerritoryRecipe): Promise<RecipeGeometryPreview> => {
  const row = await kdb
    .selectFrom('ign_communes')
    .select((eb) => {
      const included = eb.or(recipe.include.map((ref) => communeMatchesRef(eb, ref)));
      const excluded = recipe.exclude.length > 0 ? eb.or(recipe.exclude.map((ref) => communeMatchesRef(eb, ref))) : eb.lit(false);
      const outline = (condition: Expression<SqlBool>) =>
        sql<Outline | null>`ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(ST_CoverageUnion(${eb.ref('geom')}) FILTER (WHERE ${condition}), 2154), 4326), 0.001), 5)::json`;
      const extent = sql`ST_Transform(ST_SetSRID(ST_Extent(${eb.ref('geom')})::geometry, 2154), 4326)`;
      return [
        outline(eb.and([included, eb.not(excluded)])).as('territory'),
        outline(excluded).as('excluded'),
        sql<number | null>`ST_XMin(${extent})`.as('west'),
        sql<number | null>`ST_YMin(${extent})`.as('south'),
        sql<number | null>`ST_XMax(${extent})`.as('east'),
        sql<number | null>`ST_YMax(${extent})`.as('north'),
      ];
    })
    .where('geom', 'is not', null)
    .where((eb) => eb.or([...recipe.include, ...recipe.exclude].map((ref) => communeMatchesRef(eb, ref))))
    .executeTakeFirstOrThrow();
  const { west, south, east, north } = row;
  return {
    bounds: west !== null && south !== null && east !== null && north !== null ? [west, south, east, north] : null,
    excluded: row.excluded,
    territory: row.territory,
  };
};

// ─── Denormalization on the demands tables ───────────────────────────────────

/**
 * Ids of the custom territories whose communes contain `communeCode`, as a `uuid[]` (empty when none or null commune).
 * Used both at demand creation and by the demands refresh, so the two can never diverge.
 */
const customTerritoryIdsForCommune = (db: Kysely<DB>, communeCode: Expression<string | null>) =>
  sql<string[]>`coalesce((${db
    .selectFrom('custom_territories')
    .select((eb) => sql<string[]>`array_agg(${eb.ref('id')} ORDER BY ${eb.ref('id')})`.as('ids'))
    .where('commune_codes', '@>', sql<string[]>`ARRAY[${communeCode}]::text[]`)}), '{}'::uuid[])`;

/** Custom territory ids to store on a demand located in `communeCode`, resolved at creation / correction time. */
export const resolveCustomTerritoryIds = async (communeCode: string | null): Promise<string[]> => {
  if (!communeCode) {
    return [];
  }
  const rows = await kdb
    .selectFrom('custom_territories')
    .select('id')
    .where('commune_codes', '@>', sql<string[]>`ARRAY[${communeCode}]::text[]`)
    .orderBy('id')
    .execute();
  return rows.map((row) => row.id);
};

/** Stores on one demand the ids of the custom territories containing its `commune_code` (after the commune is set). */
export const syncDemandCustomTerritoryIds = async (table: DemandTable, demandId: string): Promise<void> => {
  await kdb
    .updateTable(table)
    .set((eb) => ({ custom_territory_ids: customTerritoryIdsForCommune(kdb, eb.ref('commune_code')) }))
    .where('id', '=', demandId)
    .execute();
};

const refreshDemandTable = async (db: Kysely<DB>, table: DemandTable): Promise<number> => {
  const result = await db
    .updateTable(table)
    .set((eb) => ({ custom_territory_ids: customTerritoryIdsForCommune(db, eb.ref('commune_code')) }))
    // only rewrite the rows whose territories actually changed
    .where((eb) => eb(eb.ref('custom_territory_ids'), 'is distinct from', customTerritoryIdsForCommune(db, eb.ref('commune_code'))))
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
};

/** Recomputes `custom_territory_ids` on every demand from its `commune_code`, inside the transaction of each territory change. */
const refreshDemandsCustomTerritoryIds = async (db: Kysely<DB>): Promise<Record<DemandTable, number>> => {
  const [demands, demandsChaleurRenouvelable] = await Promise.all(demandTables.map((table) => refreshDemandTable(db, table)));
  return { demands, demands_chaleur_renouvelable: demandsChaleurRenouvelable };
};

export type StaleCustomTerritory = Pick<CustomTerritory, 'id' | 'name'> & {
  /** Communes of the recipe against the current referential. */
  commune_codes: string[];
  /** Communes the recipe now covers but the stored list misses. */
  added_count: number;
  /** Communes still stored although the recipe no longer covers them. */
  removed_count: number;
};

/**
 * Territories whose stored `commune_codes` no longer match their recipe, i.e. the referential changed since they
 * were last saved. Single definition of "stale": the data diagnostic reports exactly what the refresh would rewrite.
 */
export const findStaleCustomTerritories = async (db: Kysely<DB> = kdb): Promise<StaleCustomTerritory[]> => {
  const territories = await db.selectFrom('custom_territories').select(['id', 'name', 'recipe', 'commune_codes']).orderBy('name').execute();
  const staleTerritories: StaleCustomTerritory[] = [];
  for (const territory of territories) {
    const communeCodes = await computeRecipeCommuneCodes(territory.recipe, db);
    const storedCodes = new Set(territory.commune_codes);
    const resolvedCodes = new Set(communeCodes);
    const addedCount = communeCodes.filter((code) => !storedCodes.has(code)).length;
    const removedCount = territory.commune_codes.filter((code) => !resolvedCodes.has(code)).length;
    if (addedCount > 0 || removedCount > 0) {
      staleTerritories.push({
        added_count: addedCount,
        commune_codes: communeCodes,
        id: territory.id,
        name: territory.name,
        removed_count: removedCount,
      });
    }
  }
  return staleTerritories;
};

export type CustomTerritoryOrphanRefs = Pick<CustomTerritory, 'id' | 'name'> & CustomTerritoryRecipe;

/**
 * Territories whose recipe references a territory that no longer matches any commune of the referential (absorbed
 * commune, dissolved EPCI / EPT), with those references. Invisible to the stale check: once refreshed, the stored
 * communes match the recipe again although it silently lost an inclusion or an exclusion. Only editing the recipe fixes it.
 */
export const findCustomTerritoriesWithOrphanRefs = async (): Promise<CustomTerritoryOrphanRefs[]> => {
  const territories = await kdb.selectFrom('custom_territories').select(['id', 'name', 'recipe']).orderBy('name').execute();
  const orphanRefs = async (refs: TerritoryRef[]) => {
    const orphans: TerritoryRef[] = [];
    for (const ref of refs) {
      const commune = await kdb
        .selectFrom('ign_communes')
        .select('insee_com')
        .where((eb) => communeMatchesRef(eb, ref))
        .limit(1)
        .executeTakeFirst();
      if (!commune) {
        orphans.push(ref);
      }
    }
    return orphans;
  };
  const results: CustomTerritoryOrphanRefs[] = [];
  for (const territory of territories) {
    const include = await orphanRefs(territory.recipe.include);
    const exclude = await orphanRefs(territory.recipe.exclude);
    if (include.length > 0 || exclude.length > 0) {
      results.push({ exclude, id: territory.id, include, name: territory.name });
    }
  }
  return results;
};

/** Re-resolves every recipe against the current referential; returns the number of territories whose communes changed. */
const refreshCommuneCodes = async (db: Kysely<DB>): Promise<number> => {
  const staleTerritories = await findStaleCustomTerritories(db);
  for (const territory of staleTerritories) {
    await db
      .updateTable('custom_territories')
      .set({ commune_codes: territory.commune_codes, updated_at: new Date() })
      .where('id', '=', territory.id)
      .execute();
  }
  return staleTerritories.length;
};

/** Rows rewritten by a full refresh: territories whose communes changed, demands whose territories changed. */
export type RefreshResult = Record<'custom_territories' | DemandTable, number>;

/**
 * Full refresh, to run from the CLI after every referential update (IGN communes, EPT): `commune_codes` is only a
 * materialization of the recipe, so every recipe is resolved again before the demands are realigned.
 * Nothing triggers it: the data diagnostic reports the territories that need it.
 */
export const refreshCustomTerritories = async (): Promise<RefreshResult> =>
  kdb.transaction().execute(async (transaction) => {
    const customTerritories = await refreshCommuneCodes(transaction);
    const demands = await refreshDemandsCustomTerritoryIds(transaction);
    return { custom_territories: customTerritories, ...demands };
  });

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const listCustomTerritories = async (): Promise<CustomTerritoryListItem[]> => {
  const rows = await kdb
    .selectFrom('custom_territories')
    .select(customTerritoryColumns)
    .select((eb) => [
      sql<number>`cardinality(${eb.ref('commune_codes')})`.as('communes_count'),
      eb
        .selectFrom('user_permissions')
        .select((subEb) => subEb.fn.countAll<number>().as('count'))
        .where('user_permissions.type', '=', customTerritoryPermissionType)
        .whereRef('user_permissions.resource_id', '=', sql<string>`${eb.ref('custom_territories.id')}::text`)
        .as('users_count'),
    ])
    .orderBy('name')
    .execute();
  return rows.map((row) => ({ ...row, communes_count: Number(row.communes_count), users_count: Number(row.users_count) }));
};

export const getCustomTerritory = async (id: string): Promise<CustomTerritory> =>
  kdb
    .selectFrom('custom_territories')
    .select(customTerritoryColumns)
    .where('id', '=', id)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Territoire personnalisé introuvable' }));

const ensureRecipeIsNotEmpty = (communeCodes: string[]) => {
  if (communeCodes.length === 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette recette ne couvre aucune commune' });
  }
};

// A duplicated name (unique index `idx_custom_territories_name`) is translated globally by the tRPC `db-errors` middleware.
export const createCustomTerritory = async (input: CreateCustomTerritoryInput, authorId: string): Promise<CustomTerritory> => {
  const communeCodes = await computeRecipeCommuneCodes(input.recipe);
  ensureRecipeIsNotEmpty(communeCodes);
  const territory = await kdb.transaction().execute(async (transaction) => {
    const created = await transaction
      .insertInto('custom_territories')
      .values({ commune_codes: communeCodes, name: input.name, recipe: JSON.stringify(input.recipe) })
      .returning(customTerritoryColumns)
      .executeTakeFirstOrThrow();
    await refreshDemandsCustomTerritoryIds(transaction);
    return created;
  });
  await createUserEvent({
    author_id: authorId,
    context_id: territory.id,
    context_type: 'custom_territory',
    data: { communes_count: communeCodes.length, custom_territory_id: territory.id, name: territory.name },
    type: 'custom_territory_created',
  });
  return territory;
};

export const updateCustomTerritory = async (id: string, input: UpdateCustomTerritoryInput, authorId: string): Promise<CustomTerritory> => {
  const communeCodes = await computeRecipeCommuneCodes(input.recipe);
  ensureRecipeIsNotEmpty(communeCodes);
  const territory = await kdb.transaction().execute(async (transaction) => {
    const updated = await transaction
      .updateTable('custom_territories')
      .set({ commune_codes: communeCodes, name: input.name, recipe: JSON.stringify(input.recipe), updated_at: new Date() })
      .where('id', '=', id)
      .returning(customTerritoryColumns)
      .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Territoire personnalisé introuvable' }));
    await refreshDemandsCustomTerritoryIds(transaction);
    return updated;
  });
  await createUserEvent({
    author_id: authorId,
    context_id: territory.id,
    context_type: 'custom_territory',
    data: { communes_count: communeCodes.length, custom_territory_id: territory.id, name: territory.name },
    type: 'custom_territory_updated',
  });
  return territory;
};

export const deleteCustomTerritory = async (id: string, authorId: string): Promise<void> => {
  const territory = await getCustomTerritory(id);
  // `user_permissions.resource_id` has no FK: remove the permissions first or they would point to a dead id.
  await removePermissionFromAllUsers(customTerritoryPermissionType, id, authorId);
  await kdb.transaction().execute(async (transaction) => {
    await transaction.deleteFrom('custom_territories').where('id', '=', id).execute();
    await refreshDemandsCustomTerritoryIds(transaction);
  });
  await createUserEvent({
    author_id: authorId,
    context_id: id,
    context_type: 'custom_territory',
    data: { communes_count: territory.commune_codes.length, custom_territory_id: id, name: territory.name },
    type: 'custom_territory_deleted',
  });
};
