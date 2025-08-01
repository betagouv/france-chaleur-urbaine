import { type ExpressionBuilder } from 'kysely';
import { type ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser';
import { type UpdateObjectExpression } from 'kysely/dist/cjs/parser/update-set-parser';
import { z } from 'zod';

import { type Context as ApiContext, type ListConfig } from '@/server/api/crud';
import { applyFilters, type DB, type InsertObject, kdb } from '@/server/db/kysely';

const filterSchema = z.record(
  z.string(),
  z.any().refine((val) => !(Array.isArray(val) && val[0] === 'raw'), { message: "Operators like 'raw' are not allowed in filters" })
);

/**
 * Creates basic CRUD operations for a database table
 *
 * @param tableName - The name of the database table
 * @returns Object containing CRUD operations for the specified table
 */
export function createBaseModel<T extends keyof DB>(tableName: T) {
  const create = async (data: InsertObject<DB, T>, _context: ApiContext) => {
    const record = await kdb.insertInto(tableName).values(data).returningAll().executeTakeFirstOrThrow();

    return record as unknown as DB[T];
  };

  const createMine = async (data: Omit<InsertObject<DB, T>, 'user_id'> & { user_id?: never }, context: ApiContext): Promise<DB[T]> => {
    return create({ ...data, user_id: context.user.id } as InsertObject<DB, T>, context);
  };

  const get = async (id: string, _config: ListConfig<T>, _context: ApiContext) => {
    const query = kdb
      .selectFrom(tableName)
      .where('id' as any, '=', id)
      .selectAll();

    const record = await query.executeTakeFirstOrThrow();

    return record as unknown as DB[T];
  };

  const getMine = async (id: string, config: ListConfig<T>, context: ApiContext) => {
    return get(id, { ...config, filters: { ...config.filters, user_id: context.user.id } }, context);
  };

  const applyConfigFilters = (query: any, config: ListConfig<T>) => {
    if (config.filters) {
      const parsedFilters = filterSchema.parse(config.filters);
      query = applyFilters(query as Parameters<typeof applyFilters>[0], tableName, parsedFilters);
    }
    return query;
  };

  const applyConfig = (query: any, config: ListConfig<T>) => {
    query = applyConfigFilters(query, config);

    if (query.select && query.selectAll) {
      if (config.select) {
        query = query.select(config.select as any);
      } else {
        query = query.selectAll();
      }
    }

    if (query.orderBy) {
      if (config.orderBy) {
        for (const [column, direction] of Object.entries(config.orderBy)) {
          query = query.orderBy(column as any, direction);
        }
      }
    }
    return query;
  };

  const list = async (config: ListConfig<T>, _context: ApiContext) => {
    const baseQuery = kdb.selectFrom(tableName);

    const countQuery = applyConfigFilters(baseQuery, config);
    const countResult = await countQuery
      .select((eb: ExpressionBuilder<DB, ExtractTableAlias<DB, T>>) => eb.fn.countAll().as('total_count'))
      .executeTakeFirstOrThrow();
    const count = parseInt(countResult.total_count as string, 10); // Parse count to number (handle string/bigint cases)

    let query = applyConfig(baseQuery, config);
    if (config.page && config.pageSize) {
      query = query.offset((config.page - 1) * config.pageSize).limit(config.pageSize);
    }

    const records = await query.execute();

    return {
      items: records as unknown as DB[T][], // TODO return the correct fields in select
      count,
    };
  };

  const listMine = async (config: ListConfig<T>, context: ApiContext) => {
    return list({ ...config, filters: { ...config.filters, user_id: context.user.id } }, context);
  };

  const update = async (
    id: string,
    data: UpdateObjectExpression<DB, ExtractTableAlias<DB, T>, ExtractTableAlias<DB, T>>,
    config: ListConfig<T>,
    _context: ApiContext
  ) => {
    let query = kdb
      .updateTable(tableName)
      .set(data)
      .where('id' as any, '=', id);

    query = applyConfig(query, config);

    const record = await query.returningAll().executeTakeFirstOrThrow();

    return record as unknown as DB[T];
  };

  const updateMine = async (id: string, data: Partial<InsertObject<DB, T>>, config: ListConfig<T>, context: ApiContext) => {
    return update(
      id,
      { ...data, user_id: context.user.id } as UpdateObjectExpression<DB, ExtractTableAlias<DB, T>, ExtractTableAlias<DB, T>>,
      { ...config, filters: { ...config.filters, user_id: context.user.id } },
      context
    );
  };

  const remove = async (id: string, config: ListConfig<T>, _context: ApiContext) => {
    let getQuery = kdb.selectFrom(tableName).where('id' as any, '=', id);

    if (config) {
      getQuery = applyConfig(getQuery, config);
    }
    const record = await getQuery.executeTakeFirstOrThrow();

    let deleteQuery = kdb.deleteFrom(tableName).where('id' as any, '=', id);

    if (config) {
      deleteQuery = applyConfig(deleteQuery, config);
    }

    await deleteQuery.execute();

    return record as unknown as DB[T];
  };

  const removeMine = async (id: string, config: ListConfig<T>, context: ApiContext) => {
    return remove(id, { ...config, filters: { ...config.filters, user_id: context.user.id } }, context);
  };

  return {
    get,
    getMine,
    list,
    listMine,
    create,
    createMine,
    update,
    updateMine,
    remove,
    removeMine,
  };
}
