import { type Expression, type RawBuilder, type SqlBool, sql } from 'kysely';

import { kdb } from '@/server/db/kysely';

import { type NetworkPermission, type Permission, type PermissionType, permissionBoundsKey } from '../types';
import { isNetworkPermissionType } from './helpers';

type PermissionGeomRow = { type: PermissionType; code: string; geom: string };
type TerritoryGeomRow = { type: PermissionType; code: string; label: string; geometry: GeoJSON.Geometry };

// ─── Types ───────────────────────────────────────────────────────────────────

type TerritoryFeatureProperties = {
  type: string;
  code: string;
  label: string;
};

type BoundingBox = [west: number, south: number, east: number, north: number];

export type PermissionsMapData = {
  highlightReseauxExistants: number[];
  highlightReseauxEnConstruction: number[];
  highlightPdpIdsFcu: number[];
  territories: GeoJSON.FeatureCollection<GeoJSON.Geometry, TerritoryFeatureProperties>;
  bounds: BoundingBox | null;
  perPermissionBounds: Record<string, BoundingBox>;
};

// ─── Main orchestrator ──────────────────────────────────────────────────────

/**
 * Returns all data needed to render the permissions map in a single call.
 */
export const getPermissionsMapData = async (permissions: Permission[]): Promise<PermissionsMapData> => {
  const networkPerms = permissions.filter((p): p is NetworkPermission => isNetworkPermissionType(p.type));

  const existingIds = networkPerms.filter((p) => p.type === 'reseau_de_chaleur').map((p) => Number(p.resource_id));
  const constructionIds = networkPerms.filter((p) => p.type === 'reseau_en_construction').map((p) => Number(p.resource_id));

  const pdpPromise =
    existingIds.length > 0 || constructionIds.length > 0
      ? kdb
          .selectFrom('zone_de_developpement_prioritaire')
          .select('id_fcu')
          .where((eb) => {
            const conditions: Expression<SqlBool>[] = [];
            if (existingIds.length > 0) {
              conditions.push(eb('reseau_de_chaleur_ids', '&&', sql<number[]>`ARRAY[${sql.join(existingIds.map(sql.lit))}]::int[]`));
            }
            if (constructionIds.length > 0) {
              conditions.push(
                eb('reseau_en_construction_ids', '&&', sql<number[]>`ARRAY[${sql.join(constructionIds.map(sql.lit))}]::int[]`)
              );
            }
            return eb.or(conditions);
          })
          .execute()
          .then((rows) => rows.map((r) => r.id_fcu))
      : Promise.resolve([] as number[]);

  const [territories, boundsData, pdpIds] = await Promise.all([
    getTerritoryGeometries(permissions),
    getBoundsData(permissions),
    pdpPromise,
  ]);

  return {
    bounds: boundsData.bounds,
    highlightPdpIdsFcu: pdpIds,
    highlightReseauxEnConstruction: constructionIds,
    highlightReseauxExistants: existingIds,
    perPermissionBounds: boundsData.perPermissionBounds,
    territories,
  };
};

// ─── Territory geometries (single UNION ALL query) ──────────────────────────

/**
 * Returns territory geometries as a GeoJSON FeatureCollection.
 * Uses a single SQL query with UNION ALL across all territory types.
 * EPCI/EPT geometries are derived via ST_Union of member communes.
 * National permissions are excluded (no geometry).
 */
const getTerritoryGeometries = async (
  permissions: Permission[]
): Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry, TerritoryFeatureProperties>> => {
  const territoryPerms = permissions.filter((p) => !isNetworkPermissionType(p.type) && p.type !== 'national');
  if (territoryPerms.length === 0) {
    return { features: [], type: 'FeatureCollection' };
  }

  const communeCodes = territoryPerms.filter((p) => p.type === 'commune').map((p) => p.resource_id!);
  const deptCodes = territoryPerms.filter((p) => p.type === 'departement').map((p) => p.resource_id!);
  const regionCodes = territoryPerms.filter((p) => p.type === 'region').map((p) => p.resource_id!);
  const epciCodes = territoryPerms.filter((p) => p.type === 'epci').map((p) => p.resource_id!);
  const eptCodes = territoryPerms.filter((p) => p.type === 'ept').map((p) => p.resource_id!);

  // Build UNION ALL parts — only include types that have permissions
  const parts: RawBuilder<TerritoryGeomRow>[] = [];

  if (communeCodes.length > 0) {
    parts.push(
      sql<TerritoryGeomRow>`${kdb
        .selectFrom('ign_communes')
        .select((eb) => [
          sql.lit<PermissionType>('commune').as('type'),
          eb.ref('insee_com').as('code'),
          eb.ref('nom').as('label'),
          sql<GeoJSON.Geometry>`ST_AsGeoJSON(ST_Simplify(ST_Transform(${eb.ref('geom')}, 4326), 0.0005))::json`.as('geometry'),
        ])
        .where('insee_com', 'in', communeCodes)
        .where('geom', 'is not', null)}`
    );
  }

  if (deptCodes.length > 0) {
    parts.push(
      sql<TerritoryGeomRow>`${kdb
        .selectFrom('ign_departements')
        .select((eb) => [
          sql.lit<PermissionType>('departement').as('type'),
          eb.ref('insee_dep').as('code'),
          eb.ref('nom').as('label'),
          sql<GeoJSON.Geometry>`ST_AsGeoJSON(ST_Simplify(ST_Transform(${eb.ref('geom')}, 4326), 0.001))::json`.as('geometry'),
        ])
        .where('insee_dep', 'in', deptCodes)
        .where('geom', 'is not', null)}`
    );
  }

  if (regionCodes.length > 0) {
    parts.push(
      sql<TerritoryGeomRow>`${kdb
        .selectFrom('ign_regions')
        .select((eb) => [
          sql.lit<PermissionType>('region').as('type'),
          eb.ref('insee_reg').as('code'),
          eb.ref('nom').as('label'),
          sql<GeoJSON.Geometry>`ST_AsGeoJSON(ST_Simplify(ST_Transform(${eb.ref('geom')}, 4326), 0.002))::json`.as('geometry'),
        ])
        .where('insee_reg', 'in', regionCodes)
        .where('geom', 'is not', null)}`
    );
  }

  if (epciCodes.length > 0) {
    parts.push(sql<TerritoryGeomRow>`
      SELECT ${sql.lit<PermissionType>('epci')} AS type, e.code, e.nom AS label,
        ST_AsGeoJSON(ST_Simplify(ST_Transform(ST_Union(c.geom), 4326), 0.001))::json AS geometry
      FROM epci e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(epciCodes.map(sql.lit))})
      GROUP BY e.code, e.nom
    `);
  }

  if (eptCodes.length > 0) {
    parts.push(sql<TerritoryGeomRow>`
      SELECT ${sql.lit<PermissionType>('ept')} AS type, e.code, e.nom AS label,
        ST_AsGeoJSON(ST_Simplify(ST_Transform(ST_Union(c.geom), 4326), 0.001))::json AS geometry
      FROM ept e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(eptCodes.map(sql.lit))})
      GROUP BY e.code, e.nom
    `);
  }

  if (parts.length === 0) {
    return { features: [], type: 'FeatureCollection' };
  }

  const query = sql<TerritoryGeomRow>`${sql.join(parts, sql` UNION ALL `)}`;

  const result = await query.execute(kdb);

  const features = result.rows
    .filter((row) => row.geometry)
    .map((row) => ({
      geometry: row.geometry,
      properties: { code: row.code, label: row.label, type: row.type },
      type: 'Feature' as const,
    }));

  return { features, type: 'FeatureCollection' };
};

// ─── Per-permission geometry parts (single source of truth) ─────────────────

/**
 * Builds one SELECT per permission type, each returning `(type, code, geom)`.
 * Reused both for global bounds aggregation and per-permission bounds.
 *
 * Simple parts use the Kysely query builder for column-level type checking.
 * `epci` / `ept` fall back to typed raw SQL because PG's `LATERAL jsonb_array_elements`
 * has no ergonomic Kysely equivalent.
 */
const buildPermissionGeomParts = (permissions: Permission[]): RawBuilder<PermissionGeomRow>[] => {
  const territoryPerms = permissions.filter((p) => !isNetworkPermissionType(p.type) && p.type !== 'national');
  const networkPerms = permissions.filter((p): p is NetworkPermission => isNetworkPermissionType(p.type));

  const communeCodes = territoryPerms.filter((p) => p.type === 'commune').map((p) => p.resource_id!);
  const deptCodes = territoryPerms.filter((p) => p.type === 'departement').map((p) => p.resource_id!);
  const regionCodes = territoryPerms.filter((p) => p.type === 'region').map((p) => p.resource_id!);
  const epciCodes = territoryPerms.filter((p) => p.type === 'epci').map((p) => p.resource_id!);
  const eptCodes = territoryPerms.filter((p) => p.type === 'ept').map((p) => p.resource_id!);
  const reseauxExistantsIds = networkPerms.filter((p) => p.type === 'reseau_de_chaleur').map((p) => Number(p.resource_id));
  const reseauxEnConstructionIds = networkPerms.filter((p) => p.type === 'reseau_en_construction').map((p) => Number(p.resource_id));

  const parts: RawBuilder<PermissionGeomRow>[] = [];

  if (communeCodes.length > 0) {
    parts.push(
      sql<PermissionGeomRow>`${kdb
        .selectFrom('ign_communes')
        .select((eb) => [
          sql.lit<PermissionType>('commune').as('type'),
          eb.ref('insee_com').as('code'),
          sql<string>`ST_Transform(${eb.ref('geom')}, 4326)`.as('geom'),
        ])
        .where('insee_com', 'in', communeCodes)
        .where('geom', 'is not', null)}`
    );
  }
  if (deptCodes.length > 0) {
    parts.push(
      sql<PermissionGeomRow>`${kdb
        .selectFrom('ign_departements')
        .select((eb) => [
          sql.lit<PermissionType>('departement').as('type'),
          eb.ref('insee_dep').as('code'),
          sql<string>`ST_Transform(${eb.ref('geom')}, 4326)`.as('geom'),
        ])
        .where('insee_dep', 'in', deptCodes)
        .where('geom', 'is not', null)}`
    );
  }
  if (regionCodes.length > 0) {
    parts.push(
      sql<PermissionGeomRow>`${kdb
        .selectFrom('ign_regions')
        .select((eb) => [
          sql.lit<PermissionType>('region').as('type'),
          eb.ref('insee_reg').as('code'),
          sql<string>`ST_Transform(${eb.ref('geom')}, 4326)`.as('geom'),
        ])
        .where('insee_reg', 'in', regionCodes)
        .where('geom', 'is not', null)}`
    );
  }
  if (epciCodes.length > 0) {
    parts.push(sql<PermissionGeomRow>`
      SELECT ${sql.lit<PermissionType>('epci')} AS type, e.code AS code, ST_Transform(c.geom, 4326) AS geom
      FROM epci e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(epciCodes.map(sql.lit))})
    `);
  }
  if (eptCodes.length > 0) {
    parts.push(sql<PermissionGeomRow>`
      SELECT ${sql.lit<PermissionType>('ept')} AS type, e.code AS code, ST_Transform(c.geom, 4326) AS geom
      FROM ept e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(eptCodes.map(sql.lit))})
    `);
  }
  if (reseauxExistantsIds.length > 0) {
    parts.push(
      sql<PermissionGeomRow>`${kdb
        .selectFrom('reseaux_de_chaleur')
        .select((eb) => [
          sql.lit<PermissionType>('reseau_de_chaleur').as('type'),
          sql<string>`${eb.ref('id_fcu')}::text`.as('code'),
          sql<string>`ST_Transform(${eb.ref('geom')}, 4326)`.as('geom'),
        ])
        .where('id_fcu', 'in', reseauxExistantsIds)
        .where('geom', 'is not', null)}`
    );
  }
  if (reseauxEnConstructionIds.length > 0) {
    parts.push(
      sql<PermissionGeomRow>`${kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select((eb) => [
          sql.lit<PermissionType>('reseau_en_construction').as('type'),
          sql<string>`${eb.ref('id_fcu')}::text`.as('code'),
          sql<string>`ST_Transform(${eb.ref('geom')}, 4326)`.as('geom'),
        ])
        .where('id_fcu', 'in', reseauxEnConstructionIds)
        .where('geom', 'is not', null)}`
    );
  }

  return parts;
};

// ─── Global + per-permission bounds (single SQL query, two results) ─────────

/**
 * Computes in one query:
 *  - the per-permission bounds (keyed by `${type}:${resource_id}`)
 *  - the global bounds encompassing all permissions
 *
 * Uses a CTE over the shared `buildPermissionGeomParts`.
 */
const getBoundsData = async (
  permissions: Permission[]
): Promise<{ bounds: BoundingBox | null; perPermissionBounds: Record<string, BoundingBox> }> => {
  const parts = buildPermissionGeomParts(permissions);
  if (parts.length === 0) {
    return { bounds: null, perPermissionBounds: {} };
  }

  const result = await sql<{
    type: PermissionType | null;
    code: string | null;
    west: number;
    south: number;
    east: number;
    north: number;
  }>`
    WITH geoms AS (${sql.join(parts, sql` UNION ALL `)})
    SELECT type, code,
      ST_XMin(ST_Extent(geom)) AS west,
      ST_YMin(ST_Extent(geom)) AS south,
      ST_XMax(ST_Extent(geom)) AS east,
      ST_YMax(ST_Extent(geom)) AS north
    FROM geoms
    GROUP BY GROUPING SETS ((type, code), ())
  `.execute(kdb);

  let bounds: BoundingBox | null = null;
  const perPermissionBounds: Record<string, BoundingBox> = {};
  for (const row of result.rows) {
    if (row.west === null) continue;
    const bbox: BoundingBox = [row.west, row.south, row.east, row.north];
    if (row.type === null) {
      bounds = bbox;
    } else if (row.code !== null) {
      perPermissionBounds[permissionBoundsKey(row.type, row.code)] = bbox;
    }
  }
  return { bounds, perPermissionBounds };
};
