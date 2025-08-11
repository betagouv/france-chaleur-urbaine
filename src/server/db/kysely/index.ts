import '@/server/db'; // permet d'importer les variables d'env correctement
import {
  type ComparisonOperatorExpression,
  type Expression,
  type Insertable,
  type InsertObject,
  Kysely,
  type OperandValueExpressionOrList,
  PostgresDialect,
  type ReferenceExpression,
  sql,
} from 'kysely';
import { Pool, types } from 'pg';

import { serverConfig } from '@/server/config';
import { parentLogger } from '@/server/helpers/logger';
import { sleep } from '@/utils/time';

import { type DB as Database } from './database';

export * from './database';
export { Insertable, InsertObject, sql };

// Automatically convert postgres number fields from string to javascript numbers.
types.setTypeParser(types.builtins.INT2, (value) => parseInt(value));
types.setTypeParser(types.builtins.INT4, (value) => parseInt(value));
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value));
types.setTypeParser(types.builtins.FLOAT4, (value) => parseFloat(value));
types.setTypeParser(types.builtins.FLOAT8, (value) => parseFloat(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString: process.env.DATABASE_URL }),
});

const logger = parentLogger.child({
  module: 'database',
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
  log: serverConfig.LOG_SQL_QUERIES
    ? (event) => {
        logger.debug(`query ${event.level === 'error' ? 'failed' : 'completed'}`, {
          durationMs: Math.round(event.queryDurationMillis),
          sql: event.query.sql,
          params: event.query.parameters,
          ...(event.level === 'error' ? { error: event.error } : {}),
        });
      }
    : undefined,
});

/**
 * Try to shut down database connections. (timeout is 2 seconds)
 */
export async function shutdownKyselyDatabase() {
  logger.warn('shutting down database connections');
  await Promise.race([db.destroy(), sleep(2000)]);
}

type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'ilike' | 'in' | 'is';

type FilterValue<T extends keyof Database, C extends keyof Database[T]> =
  | Database[T][C]
  | null
  | [FilterOperator, Database[T][C] | (Database[T][C] | null)[] | null];

type Filter<T extends keyof Database> = {
  [C in keyof Database[T]]?: FilterValue<T, C>;
};
// Define a type for query builders that support the `where` method
interface WhereableQueryBuilder<DB, TB extends keyof DB, O> {
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): WhereableQueryBuilder<DB, TB, O>;
  where<E extends Expression<unknown>>(expression: E): WhereableQueryBuilder<DB, TB, O>;
}

// Utility type to extract table alias (ensure this is defined correctly in your codebase)
type ExtractTableAlias<DB, T extends keyof DB> = T extends string ? T : never;

/**
 * Applies filters to a Kysely query based on a filter object.
 *
 * @param query - The Kysely query builder to apply filters to
 * @param tableName - The name of the database table
 * @param filters - An object containing filter conditions
 * @returns The modified query with all filters applied
 *
 * Example usage:
 * ```
 * const query = kdb.selectFrom('users');
 * const filteredQuery = applyFilters(query, 'users', {
 *   status: 'active',
 *   age: ['>', 18],
 *   user_id: ['raw', `user_id IS NULL OR user_id = '${context.user.id}'`],
 *   role: ['in', ['admin', 'moderator']]
 * });
 * ```
 */
export function applyFilters<T extends keyof Database, O>(
  query: WhereableQueryBuilder<Database, ExtractTableAlias<Database, T>, O>,
  tableName: T,
  filters: Filter<T> = {}
): WhereableQueryBuilder<Database, ExtractTableAlias<Database, T>, O> {
  let modifiedQuery = query;

  for (const [column, filterValue] of Object.entries(filters)) {
    const columnRef = `${String(tableName)}.${column}` as ReferenceExpression<Database, ExtractTableAlias<Database, T>>;

    const [operator, value] = Array.isArray(filterValue) ? filterValue : ['=', filterValue];

    switch (operator) {
      case '=':
      case '!=':
      case '>':
      case '>=':
      case '<':
      case '<=':
      case 'like':
      case 'ilike':
        modifiedQuery = modifiedQuery.where(columnRef, operator, value);
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          modifiedQuery = modifiedQuery.where(columnRef, 'in', value);
        } else {
          // Empty IN clause returns no results
          modifiedQuery = modifiedQuery.where(sql`false` as any);
        }
        break;
      case 'is':
        if (value === null) {
          modifiedQuery = modifiedQuery.where(columnRef, 'is', null);
        } else {
          modifiedQuery = modifiedQuery.where(columnRef, '=', value);
        }
        break;
      case 'raw':
        modifiedQuery = modifiedQuery.where(sql.raw(value));
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  return modifiedQuery;
}
/**
 * Kysely database. Allows better distinction with knex `db` variable.
 */
export const kdb = db;
