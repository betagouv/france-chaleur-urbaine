import { TRPCError } from '@trpc/server';
import { type Expression, type ExpressionBuilder, type Kysely, type SqlBool, sql } from 'kysely';

import { createUserEvent } from '@/modules/events/server/service';
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
export const computeRecipeCommuneCodes = async (recipe: CustomTerritoryRecipe): Promise<string[]> => {
  const rows = await kdb
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

// ─── Denormalization on the demands tables ───────────────────────────────────

/**
 * Ids of the custom territories whose communes contain `communeCode`, as a `uuid[]` (empty when none or null commune).
 * Used both at demand creation and by the full refresh, so the two can never diverge.
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

export type RefreshResult = Record<DemandTable, number>;

/**
 * Recomputes `custom_territory_ids` on every demand from its `commune_code`.
 * Called after each territory change, and from the CLI after a referential (IGN) update.
 */
export const refreshDemandsCustomTerritoryIds = async (db: Kysely<DB> = kdb): Promise<RefreshResult> => {
  const [demands, demandsChaleurRenouvelable] = await Promise.all(demandTables.map((table) => refreshDemandTable(db, table)));
  return { demands, demands_chaleur_renouvelable: demandsChaleurRenouvelable };
};

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
