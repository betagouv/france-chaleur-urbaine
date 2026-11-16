import type { ExpressionBuilder } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';

import { permissionMatchesCustomTerritoryIds } from '@/modules/permissions/server/demand-access';
import { customTerritoryPermissionType, territoryPermissionToColumn } from '@/modules/permissions/types';
import { type DB, kdb, sql } from '@/server/db/kysely';
import { ObjectEntries } from '@/utils/typescript';

import { selectDemandesChaleurRenouvelableForList } from './ccrt-demand-query';

/**
 * Correlates access holders in one query, including accounts that will see an unpublished demand.
 */
export const selectCcrtDemandsForAdmin = () =>
  selectDemandesChaleurRenouvelableForList().select((expression) => [
    selectCcrtAccessUsers(expression),
    jsonObjectFrom(
      expression
        .selectFrom('events')
        .innerJoin('users as author', 'author.id', 'events.author_id')
        .select((eventExpression) => [
          sql<string>`${eventExpression.ref('events.data')}->'changes'->'status'->>'to'`.as('status'),
          sql<string>`to_char(${eventExpression.ref('events.created_at')} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.as('date'),
        ])
        .where('context_type', '=', 'ccrt_demand')
        .where('context_id', '=', sql<string>`${expression.ref('demands_chaleur_renouvelable.id')}::text`)
        .where('type', '=', 'ccrt_demand_updated')
        .where('author.role', '=', 'ccrt')
        .where((eventExpression) => sql<boolean>`${eventExpression.ref('events.data')}->'changes' ? 'status'`)
        .orderBy('events.created_at', 'desc')
        .orderBy('events.id', 'desc')
        .limit(1)
    ).as('last_ccrt_status_change'),
  ]);

/**
 * Keeps the admin-only access details out of the CCRT list.
 */
export const getCcrtAdminAccessUsers = async (demandId: string) =>
  (await kdb.selectFrom('demands_chaleur_renouvelable').select(selectCcrtAccessUsers).where('id', '=', demandId).executeTakeFirstOrThrow())
    .access_users;

const selectCcrtAccessUsers = (expression: ExpressionBuilder<DB, 'demands_chaleur_renouvelable'>) =>
  jsonArrayFrom(
    expression
      .selectFrom('users as access_user')
      .select([
        'access_user.id',
        'access_user.email',
        'access_user.role',
        'access_user.first_name',
        'access_user.last_name',
        'access_user.structure_name',
      ])
      .select((userExpression) =>
        sql<
          string | null
        >`to_char(${userExpression.ref('access_user.last_connection')} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.as(
          'last_connection'
        )
      )
      .where('access_user.active', '=', true)
      .where('access_user.role', '=', 'ccrt')
      .where((userExpression) =>
        userExpression.exists(
          userExpression
            .selectFrom('user_permissions as access_permission')
            .select('access_permission.id')
            .whereRef('access_permission.user_id', '=', 'access_user.id')
            .where((permissionExpression) =>
              permissionExpression.or([
                ...ObjectEntries(territoryPermissionToColumn).map(([type, column]) =>
                  permissionExpression.and([
                    permissionExpression('access_permission.type', '=', type),
                    permissionExpression(
                      'access_permission.resource_id',
                      '=',
                      permissionExpression.ref(`demands_chaleur_renouvelable.${column}`)
                    ),
                  ])
                ),
                permissionExpression.and([
                  permissionExpression('access_permission.type', '=', customTerritoryPermissionType),
                  permissionMatchesCustomTerritoryIds(
                    permissionExpression.ref('access_permission.resource_id'),
                    permissionExpression.ref('demands_chaleur_renouvelable.custom_territory_ids')
                  ),
                ]),
              ])
            )
        )
      )
      .orderBy('access_user.email')
  ).as('access_users');
