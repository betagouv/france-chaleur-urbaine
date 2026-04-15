import { type Expression, type SqlBool, sql } from 'kysely';

import { kdb } from '@/server/db/kysely';

import type { NetworkPermission, Permission } from '../types';
import { isNetworkPermissionType } from './helpers';

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
};

// ─── Main orchestrator ──────────────────────────────────────────────────────

/**
 * Returns all data needed to render the permissions map in a single call.
 */
export const getPermissionsMapData = async (permissions: Permission[]): Promise<PermissionsMapData> => {
  const networkPerms = permissions.filter((p): p is NetworkPermission => isNetworkPermissionType(p.type));

  const existingIds = networkPerms.filter((p) => p.type === 'reseau_existant').map((p) => Number(p.resourceId));
  const constructionIds = networkPerms.filter((p) => p.type === 'reseau_en_construction').map((p) => Number(p.resourceId));

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

  const [territories, bounds, pdpIds] = await Promise.all([getTerritoryGeometries(permissions), getBounds(permissions), pdpPromise]);

  return {
    bounds,
    highlightPdpIdsFcu: pdpIds,
    highlightReseauxEnConstruction: constructionIds,
    highlightReseauxExistants: existingIds,
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

  const communeCodes = territoryPerms.filter((p) => p.type === 'commune').map((p) => p.resourceId!);
  const deptCodes = territoryPerms.filter((p) => p.type === 'departement').map((p) => p.resourceId!);
  const regionCodes = territoryPerms.filter((p) => p.type === 'region').map((p) => p.resourceId!);
  const epciCodes = territoryPerms.filter((p) => p.type === 'epci').map((p) => p.resourceId!);
  const eptCodes = territoryPerms.filter((p) => p.type === 'ept').map((p) => p.resourceId!);

  // Build UNION ALL parts — only include types that have permissions
  const parts: ReturnType<typeof sql>[] = [];

  if (communeCodes.length > 0) {
    parts.push(sql`
      SELECT 'commune' AS type, insee_com AS code, nom AS label,
        ST_AsGeoJSON(ST_Simplify(ST_Transform(geom, 4326), 0.0005))::json AS geometry
      FROM ign_communes
      WHERE insee_com IN (${sql.join(communeCodes.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (deptCodes.length > 0) {
    parts.push(sql`
      SELECT 'departement' AS type, insee_dep AS code, nom AS label,
        ST_AsGeoJSON(ST_Simplify(ST_Transform(geom, 4326), 0.001))::json AS geometry
      FROM ign_departements
      WHERE insee_dep IN (${sql.join(deptCodes.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (regionCodes.length > 0) {
    parts.push(sql`
      SELECT 'region' AS type, insee_reg AS code, nom AS label,
        ST_AsGeoJSON(ST_Simplify(ST_Transform(geom, 4326), 0.002))::json AS geometry
      FROM ign_regions
      WHERE insee_reg IN (${sql.join(regionCodes.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (epciCodes.length > 0) {
    parts.push(sql`
      SELECT 'epci' AS type, e.code, e.nom AS label,
        ST_AsGeoJSON(ST_Simplify(ST_Transform(ST_Union(c.geom), 4326), 0.001))::json AS geometry
      FROM epci e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(epciCodes.map(sql.lit))})
      GROUP BY e.code, e.nom
    `);
  }

  if (eptCodes.length > 0) {
    parts.push(sql`
      SELECT 'ept' AS type, e.code, e.nom AS label,
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

  const query = sql<{ type: string; code: string; label: string; geometry: GeoJSON.Geometry }>`
    ${sql.join(parts, sql` UNION ALL `)}
  `;

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

// ─── Bounds (single UNION ALL query) ────────────────────────────────────────

/**
 * Computes a bounding box encompassing all permissions (territories + networks)
 * in a single SQL query using UNION ALL + ST_Extent.
 */
const getBounds = async (permissions: Permission[]): Promise<BoundingBox | null> => {
  const territoryPerms = permissions.filter((p) => !isNetworkPermissionType(p.type) && p.type !== 'national');
  const networkPerms = permissions.filter((p): p is NetworkPermission => isNetworkPermissionType(p.type));

  if (territoryPerms.length === 0 && networkPerms.length === 0) {
    return null;
  }

  const communeCodes = territoryPerms.filter((p) => p.type === 'commune').map((p) => p.resourceId!);
  const deptCodes = territoryPerms.filter((p) => p.type === 'departement').map((p) => p.resourceId!);
  const regionCodes = territoryPerms.filter((p) => p.type === 'region').map((p) => p.resourceId!);
  const epciCodes = territoryPerms.filter((p) => p.type === 'epci').map((p) => p.resourceId!);
  const eptCodes = territoryPerms.filter((p) => p.type === 'ept').map((p) => p.resourceId!);
  const existingIds = networkPerms.filter((p) => p.type === 'reseau_existant').map((p) => Number(p.resourceId));
  const constructionIds = networkPerms.filter((p) => p.type === 'reseau_en_construction').map((p) => Number(p.resourceId));

  const parts: ReturnType<typeof sql>[] = [];

  if (communeCodes.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(geom, 4326) AS geom FROM ign_communes
      WHERE insee_com IN (${sql.join(communeCodes.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (deptCodes.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(geom, 4326) AS geom FROM ign_departements
      WHERE insee_dep IN (${sql.join(deptCodes.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (regionCodes.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(geom, 4326) AS geom FROM ign_regions
      WHERE insee_reg IN (${sql.join(regionCodes.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (epciCodes.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(c.geom, 4326) AS geom
      FROM epci e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(epciCodes.map(sql.lit))})
    `);
  }

  if (eptCodes.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(c.geom, 4326) AS geom
      FROM ept e
      CROSS JOIN LATERAL jsonb_array_elements(e.membres) AS m
      JOIN ign_communes c ON c.insee_com = m->>'code'
      WHERE e.code IN (${sql.join(eptCodes.map(sql.lit))})
    `);
  }

  if (existingIds.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(geom, 4326) AS geom FROM reseaux_de_chaleur
      WHERE id_fcu IN (${sql.join(existingIds.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (constructionIds.length > 0) {
    parts.push(sql`
      SELECT ST_Transform(geom, 4326) AS geom FROM zones_et_reseaux_en_construction
      WHERE id_fcu IN (${sql.join(constructionIds.map(sql.lit))}) AND geom IS NOT NULL
    `);
  }

  if (parts.length === 0) {
    return null;
  }

  const result = await sql<{ west: number; south: number; east: number; north: number }>`
    SELECT
      ST_XMin(ST_Extent(geom)) AS west,
      ST_YMin(ST_Extent(geom)) AS south,
      ST_XMax(ST_Extent(geom)) AS east,
      ST_YMax(ST_Extent(geom)) AS north
    FROM (${sql.join(parts, sql` UNION ALL `)}) AS all_geoms
  `.execute(kdb);

  const row = result.rows[0];
  if (!row || row.west === null) {
    return null;
  }

  return [row.west, row.south, row.east, row.north];
};
