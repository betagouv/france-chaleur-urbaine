import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { territoryPermissionToColumn } from '@/modules/permissions/types';
import { sql } from '@/server/db/kysely';
import { ObjectEntries } from '@/utils/typescript';

import { selectDemandesChaleurRenouvelableForList } from './ccrt-demand-query';

/**
 * Correlates access holders in one query, including accounts that will see an unpublished demand.
 */
export const selectCcrtDemandsForAdmin = () =>
  selectDemandesChaleurRenouvelableForList().select((expression) =>
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
                permissionExpression.or(
                  ObjectEntries(territoryPermissionToColumn).map(([type, column]) =>
                    permissionExpression.and([
                      permissionExpression('access_permission.type', '=', type),
                      permissionExpression(
                        'access_permission.resource_id',
                        '=',
                        permissionExpression.ref(`demands_chaleur_renouvelable.${column}`)
                      ),
                    ])
                  )
                )
              )
          )
        )
        .orderBy('access_user.email')
    ).as('access_users')
  );

/**
 * Keeps the admin-only access details out of the CCRT list.
 */
export const getCcrtAdminAccessUsers = async (demandId: string) =>
  (await selectCcrtDemandsForAdmin().where('id', '=', demandId).executeTakeFirstOrThrow()).access_users;
