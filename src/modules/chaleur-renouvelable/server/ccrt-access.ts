import { TRPCError } from '@trpc/server';
import type { SelectQueryBuilder } from 'kysely';

import type { Context } from '@/modules/config/server/context-builder';
import { canUserAccessDemand, type DemandForAccess, getUsersWithAccessToDemand } from '@/modules/permissions/server/demand-access';
import { type Permission, territoryPermissionToColumn } from '@/modules/permissions/types';
import { type DB, kdb, sql } from '@/server/db/kysely';

import { selectDemandesChaleurRenouvelableForList } from './ccrt-demand-query';

/**
 * Matches classic territorial permissions for a renewable-heat demand without an assigned network.
 */
export const canUserAccessCcrtDemand = (
  user: Parameters<typeof canUserAccessDemand>[0],
  permissions: Permission[],
  demand: Omit<DemandForAccess, 'network_id' | 'network_type' | 'network_organization_id'>
) => canUserAccessDemand(user, permissions, { ...demand, network_id: null, network_organization_id: null, network_type: null });

/**
 * Uses the same territorial scopes for the list and every individual action, including impersonation.
 */
export const applyCcrtAccessFilter = <Output>(
  query: SelectQueryBuilder<DB, 'demands_chaleur_renouvelable', Output>,
  user: Context['user'],
  permissions: Permission[]
) => {
  if (user.role === 'admin') {
    return query;
  }
  const territories = Object.entries(territoryPermissionToColumn);
  return query.where('validated', '=', true).where((expression) => {
    const conditions = territories.flatMap(([type, column]) =>
      permissions.filter((permission) => permission.type === type).map((permission) => expression(column, '=', permission.resource_id))
    );
    return conditions.length ? expression.or(conditions) : sql.lit(false);
  });
};

export const ensureCcrtDemandAccess = async (ctx: Context, demandId: string) =>
  applyCcrtAccessFilter(selectDemandesChaleurRenouvelableForList(), ctx.user, await ctx.getPermissions())
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }));

/**
 * Finds active CCRT accounts covering the demand territory, including before publication.
 */
export const listCcrtAssignmentCandidates = async (ctx: Context, demandId: string) => {
  const demand = await ensureCcrtDemandAccess(ctx, demandId);
  const users = await getUsersWithAccessToDemand({ ...demand, network_id: null, network_organization_id: null, network_type: null });
  return users.filter((user) => user.role === 'ccrt');
};

/**
 * Resolves administrative scopes from authoritative geographic tables, never from an address context string.
 */
export const getCcrtTerritory = async (cityCode: string | null, departmentCode: string | null) => {
  const [commune, ept, department] = await Promise.all([
    cityCode
      ? kdb
          .selectFrom('ign_communes')
          .select(['insee_com', 'insee_dep', 'insee_reg', 'siren_epci'])
          .where('insee_com', '=', cityCode)
          .executeTakeFirst()
      : undefined,
    cityCode
      ? kdb
          .selectFrom('ept')
          .select('code')
          .where((expression) => sql<boolean>`${expression.ref('membres')} @> ${JSON.stringify([{ code: cityCode }])}::jsonb`)
          .executeTakeFirst()
      : undefined,
    departmentCode
      ? kdb.selectFrom('ign_departements').select('insee_reg').where('insee_dep', '=', departmentCode).executeTakeFirst()
      : undefined,
  ]);
  return {
    commune_code: commune?.insee_com ?? cityCode,
    departement_code: commune?.insee_dep ?? departmentCode,
    epci_code: commune?.siren_epci ?? null,
    ept_code: ept?.code ?? null,
    region_code: commune?.insee_reg ?? department?.insee_reg ?? null,
  };
};

/**
 * Opens public accompaniment only where an active CCRT account has territorial access.
 */
export const hasCcrtTerritoryCoverage = async (territory: Awaited<ReturnType<typeof getCcrtTerritory>>) => {
  const users = await getUsersWithAccessToDemand({
    ...territory,
    network_id: null,
    network_organization_id: null,
    network_type: null,
    validated: false,
  });
  return users.some((user) => user.role === 'ccrt');
};

export const listCcrtUsersWithAccess = async (demand: Awaited<ReturnType<typeof ensureCcrtDemandAccess>>) => {
  const [users, admins] = await Promise.all([
    demand.validated ? getUsersWithAccessToDemand({ ...demand, network_id: null, network_organization_id: null, network_type: null }) : [],
    kdb
      .selectFrom('users')
      .select(['id', 'email', 'role', 'first_name', 'last_name', 'structure_name'])
      .where('active', '=', true)
      .where('role', '=', 'admin')
      .orderBy('email')
      .execute(),
  ]);
  return [...users, ...admins];
};
