import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';

import type { Permission, PermissionWithLabel, TerritoryPermissionType } from '../types';
import { isNetworkPermissionType } from './helpers';
import { getUserPermissions } from './service';

// ─── Search ──────────────────────────────────────────────────────────────────

type NetworkSearchResult = {
  idFcu: number;
  sncuId: string | null;
  name: string;
  type: 'reseau_existant' | 'reseau_en_construction';
  gestionnaire: string | null;
};

/**
 * Search networks by id_fcu, SNCU id, or name. Searches both existing and construction networks.
 */
export const searchNetworks = async (query: string): Promise<NetworkSearchResult[]> => {
  const search = `%${query}%`;

  const [existing, construction] = await Promise.all([
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select(['id_fcu', 'Identifiant reseau', 'nom_reseau', 'Gestionnaire'])
      .where((eb) =>
        eb.or([
          eb('nom_reseau', 'ilike', search),
          eb('Identifiant reseau', 'ilike', search),
          eb(sql<string>`"id_fcu"::TEXT`, 'like', search),
        ])
      )
      .limit(10)
      .execute(),
    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select(['id_fcu', 'nom_reseau', 'gestionnaire'])
      .where((eb) => eb.or([eb('nom_reseau', 'ilike', search), eb(sql<string>`"id_fcu"::TEXT`, 'like', search)]))
      .where('is_zone', '=', false)
      .limit(10)
      .execute(),
  ]);

  const results: NetworkSearchResult[] = [
    ...existing.map((r) => ({
      gestionnaire: r.Gestionnaire,
      idFcu: r.id_fcu,
      name: r.nom_reseau || 'Nom inconnu',
      sncuId: r['Identifiant reseau'],
      type: 'reseau_existant' as const,
    })),
    ...construction.map((r) => ({
      gestionnaire: r.gestionnaire,
      idFcu: r.id_fcu,
      name: r.nom_reseau || 'Nom inconnu',
      sncuId: null,
      type: 'reseau_en_construction' as const,
    })),
  ];

  return results.slice(0, 15);
};

type TerritorySearchResult = {
  code: string;
  label: string;
  type: Exclude<TerritoryPermissionType, 'national'>;
};

/**
 * Search territories by label or code. Returns matching communes, EPCI, EPT, départements, régions.
 */
export const searchTerritories = async (query: string, types?: string[]): Promise<TerritorySearchResult[]> => {
  const search = `%${query}%`;
  const results: TerritorySearchResult[] = [];
  const searchTypes = types ?? ['commune', 'epci', 'ept', 'departement', 'region'];

  const searches = [];

  if (searchTypes.includes('commune')) {
    searches.push(
      kdb
        .selectFrom('ign_communes')
        .select([sql<string>`insee_com`.as('code'), sql<string>`nom`.as('label')])
        .where((eb) => eb.or([eb('nom', 'ilike', search), eb('insee_com', 'like', search)]))
        .limit(10)
        .execute()
        .then((rows) => rows.forEach((r) => results.push({ code: r.code, label: r.label, type: 'commune' })))
    );
  }

  if (searchTypes.includes('epci')) {
    searches.push(
      kdb
        .selectFrom('epci')
        .select(['code', 'nom as label'])
        .where((eb) => eb.or([eb('nom', 'ilike', search), eb('code', 'like', search)]))
        .limit(10)
        .execute()
        .then((rows) => rows.forEach((r) => results.push({ code: r.code, label: r.label, type: 'epci' })))
    );
  }

  if (searchTypes.includes('ept')) {
    searches.push(
      kdb
        .selectFrom('ept')
        .select(['code', 'nom as label'])
        .where((eb) => eb.or([eb('nom', 'ilike', search), eb('code', 'like', search)]))
        .limit(10)
        .execute()
        .then((rows) => rows.forEach((r) => results.push({ code: r.code, label: r.label, type: 'ept' })))
    );
  }

  if (searchTypes.includes('departement')) {
    searches.push(
      kdb
        .selectFrom('ign_departements')
        .select([sql<string>`insee_dep`.as('code'), sql<string>`nom`.as('label')])
        .where((eb) => eb.or([eb('nom', 'ilike', search), eb('insee_dep', 'like', search)]))
        .limit(10)
        .execute()
        .then((rows) => results.push(...rows.map((r) => ({ code: r.code, label: r.label, type: 'departement' as const }))))
    );
  }

  if (searchTypes.includes('region')) {
    searches.push(
      kdb
        .selectFrom('ign_regions')
        .select([sql<string>`insee_reg`.as('code'), sql<string>`nom`.as('label')])
        .where((eb) => eb.or([eb('nom', 'ilike', search), eb('insee_reg', 'like', search)]))
        .limit(10)
        .execute()
        .then((rows) => results.push(...rows.map((r) => ({ code: r.code, label: r.label, type: 'region' as const }))))
    );
  }

  await Promise.all(searches);

  return results.slice(0, 20);
};

// ─── Label resolution ────────────────────────────────────────────────────────

type ResolvedPermissionLabel = Permission & { label: string };

/**
 * Resolves human-readable labels for a list of permissions.
 */
export const resolvePermissionLabels = async (permissions: Permission[]): Promise<ResolvedPermissionLabel[]> => {
  if (permissions.length === 0) return [];

  const result: ResolvedPermissionLabel[] = [];

  const networkIds = permissions.filter((p) => isNetworkPermissionType(p.type)).map((p) => p.resource_id!);
  const communeCodes = permissions.filter((p) => p.type === 'commune').map((p) => p.resource_id!);
  const epciCodes = permissions.filter((p) => p.type === 'epci').map((p) => p.resource_id!);
  const eptCodes = permissions.filter((p) => p.type === 'ept').map((p) => p.resource_id!);
  const deptCodes = permissions.filter((p) => p.type === 'departement').map((p) => p.resource_id!);
  const regionCodes = permissions.filter((p) => p.type === 'region').map((p) => p.resource_id!);

  const lookups = [];

  if (networkIds.length > 0) {
    const numericIds = networkIds.map(Number);
    lookups.push(
      Promise.all([
        kdb
          .selectFrom('reseaux_de_chaleur')
          .select(['id_fcu', 'nom_reseau', 'Identifiant reseau'])
          .where('id_fcu', 'in', numericIds)
          .execute(),
        kdb
          .selectFrom('zones_et_reseaux_en_construction')
          .select(['id_fcu', 'nom_reseau'])
          .where('id_fcu', 'in', numericIds)
          .where('is_zone', '=', false)
          .execute(),
      ]).then(([existing, construction]) => {
        const existingMap = new Map(existing.map((r) => [r.id_fcu, r]));
        const constructionMap = new Map(construction.map((r) => [r.id_fcu, r]));

        for (const p of permissions.filter((p) => isNetworkPermissionType(p.type))) {
          const id = Number(p.resource_id);
          const ex = existingMap.get(id);
          const co = constructionMap.get(id);
          const name = ex?.nom_reseau || co?.nom_reseau || 'Réseau inconnu';
          const sncu = ex?.['Identifiant reseau'] ? ` (${ex['Identifiant reseau']})` : '';
          result.push({ label: `${name}${sncu}`, resource_id: p.resource_id, type: p.type as any });
        }
      })
    );
  }

  if (communeCodes.length > 0) {
    lookups.push(
      kdb
        .selectFrom('ign_communes')
        .select([sql<string>`insee_com`.as('code'), sql<string>`nom`.as('label')])
        .where('insee_com', 'in', communeCodes)
        .execute()
        .then((rows) => {
          const map = new Map(rows.map((r) => [r.code, r.label]));
          for (const code of communeCodes) {
            result.push({ label: map.get(code) ?? code, resource_id: code, type: 'commune' });
          }
        })
    );
  }

  if (epciCodes.length > 0) {
    lookups.push(
      kdb
        .selectFrom('epci')
        .select(['code', 'nom as label'])
        .where('code', 'in', epciCodes)
        .execute()
        .then((rows) => {
          const map = new Map(rows.map((r) => [r.code, r.label]));
          for (const code of epciCodes) {
            result.push({ label: map.get(code) ?? code, resource_id: code, type: 'epci' });
          }
        })
    );
  }

  if (eptCodes.length > 0) {
    lookups.push(
      kdb
        .selectFrom('ept')
        .select(['code', 'nom as label'])
        .where('code', 'in', eptCodes)
        .execute()
        .then((rows) => {
          const map = new Map(rows.map((r) => [r.code, r.label]));
          for (const code of eptCodes) {
            result.push({ label: map.get(code) ?? code, resource_id: code, type: 'ept' });
          }
        })
    );
  }

  if (deptCodes.length > 0) {
    lookups.push(
      kdb
        .selectFrom('ign_departements')
        .select([sql<string>`insee_dep`.as('code'), sql<string>`nom`.as('label')])
        .where('insee_dep', 'in', deptCodes)
        .execute()
        .then((rows) => {
          const map = new Map(rows.map((r) => [r.code, r.label]));
          for (const code of deptCodes) {
            result.push({ label: map.get(code) ?? code, resource_id: code, type: 'departement' });
          }
        })
    );
  }

  if (regionCodes.length > 0) {
    lookups.push(
      kdb
        .selectFrom('ign_regions')
        .select([sql<string>`insee_reg`.as('code'), sql<string>`nom`.as('label')])
        .where('insee_reg', 'in', regionCodes)
        .execute()
        .then((rows) => {
          const map = new Map(rows.map((r) => [r.code, r.label]));
          for (const code of regionCodes) {
            result.push({ label: map.get(code) ?? code, resource_id: code, type: 'region' });
          }
        })
    );
  }

  if (permissions.some((p) => p.type === 'national')) {
    result.push({ label: 'National', resource_id: null, type: 'national' });
  }

  await Promise.all(lookups);

  return result;
};

/**
 * Resolves labels for an already-loaded list of permissions.
 */
export const resolvePermissionsWithLabels = async (permissions: Permission[]): Promise<PermissionWithLabel[]> => {
  if (permissions.length === 0) return [];
  const labels = await resolvePermissionLabels(permissions);
  const labelMap = new Map(labels.map((l) => [`${l.type}:${l.resource_id}`, l.label]));
  return permissions.map(
    (p): PermissionWithLabel => ({
      ...p,
      label: labelMap.get(`${p.type}:${p.resource_id}`) ?? (p.type === 'national' ? 'National' : (p.resource_id ?? '')),
    })
  );
};

/**
 * Get permissions for a user with resolved labels (loads from DB).
 * Use `resolvePermissionsWithLabels` instead when permissions are already loaded.
 */
export const getUserPermissionsWithLabels = async (userId: string): Promise<PermissionWithLabel[]> =>
  resolvePermissionsWithLabels(await getUserPermissions(userId));

/**
 * Get all user permissions with resolved labels, grouped by user ID.
 * Deduplicates permissions for efficient batch label resolution.
 */
export const getAllPermissionsWithLabels = async (): Promise<Record<string, PermissionWithLabel[]>> => {
  const permissions = (await kdb.selectFrom('user_permissions').select(['user_id', 'type', 'resource_id']).execute()) as (Permission & {
    user_id: string;
  })[];
  if (permissions.length === 0) return {};

  const uniquePerms = new Map<string, Permission>();
  for (const permission of permissions) {
    uniquePerms.set(`${permission.type}:${permission.resource_id}`, permission);
  }

  const labels = await resolvePermissionLabels([...uniquePerms.values()]);
  const labelMap = new Map(labels.map((l) => [`${l.type}:${l.resource_id}`, l.label]));

  const result: Record<string, PermissionWithLabel[]> = {};
  for (const permission of permissions) {
    const label =
      labelMap.get(`${permission.type}:${permission.resource_id}`) ??
      (permission.type === 'national' ? 'National' : (permission.resource_id ?? ''));
    (result[permission.user_id] ??= []).push({ ...permission, label } as PermissionWithLabel);
  }

  return result;
};
