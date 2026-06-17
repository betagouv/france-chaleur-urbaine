import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createGeometryExpression, processGeometry } from '@/modules/geo/server/helpers';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

import { networkTableForId } from '../constants';

const BUFFER_SMALL_M = 5;
const BUFFER_LARGE_M = 20;
// Below this %, we consider the geometry unchanged (covers floating-point noise).
const UNCHANGED_THRESHOLD_POURCENT = 0.01;
// Lower buffer detail: 2 segments per quadrant is enough for length-coverage stats and ~4x faster.
const BUFFER_QUAD_SEGS = 2;
// ST_Subdivide chunk size — smaller = faster buffers but more chunks.
// 256 vertices gives ~12x speedup on 50k-point networks vs buffering the whole geometry at once.
const SUBDIVIDE_MAX_VERTICES = 256;

type Statut = 'nouveau' | 'modifié' | 'inchangé' | 'vide' | 'erreur';

type DiffRow = {
  id_sncu: string;
  statut: Statut;
  longueur_bdd_m: number | null;
  longueur_fichier_m: number | null;
  delta_longueur_m: number | null;
  delta_longueur_pourcent: number | null;
  pourcent_ajoute_5m: number | null;
  pourcent_ajoute_20m: number | null;
  pourcent_supprime_20m: number | null;
  erreur: string | null;
};

const csvHeaders = [
  'id_sncu',
  'statut',
  'longueur_bdd_m',
  'longueur_fichier_m',
  'delta_longueur_m',
  'delta_longueur_pourcent',
  'pourcent_ajoute_5m',
  'pourcent_ajoute_20m',
  'pourcent_supprime_20m',
  'erreur',
] as const satisfies ReadonlyArray<keyof DiffRow>;

export async function diffNetworkGeometries(directory: string, outputPath: string): Promise<void> {
  const entries = await readdir(directory);
  const files = entries.filter((f) => f.toLowerCase().endsWith('.geojson')).sort();

  if (files.length === 0) {
    logger.warn(`Aucun fichier .geojson trouvé dans ${directory}`);
    return;
  }

  logger.info(`Comparaison de ${files.length} fichiers GeoJSON avec la BDD`);

  const rows = (
    await Promise.all(files.map((file) => diffSingle(path.basename(file, path.extname(file)), path.join(directory, file))))
  ).sort((a, b) => a.id_sncu.localeCompare(b.id_sncu));

  await writeFile(outputPath, toCsv(rows), 'utf8');

  const counts = rows.reduce<Record<Statut, number>>((acc, r) => ({ ...acc, [r.statut]: acc[r.statut] + 1 }), {
    erreur: 0,
    inchangé: 0,
    modifié: 0,
    nouveau: 0,
    vide: 0,
  });
  logger.info(`Rapport écrit dans ${outputPath}`);
  logger.info(`  ${counts.nouveau} nouveaux (à créer)`);
  logger.info(`  ${counts.modifié} modifiés`);
  logger.info(`  ${counts.inchangé} inchangés`);
  logger.info(`  ${counts.vide} fichiers vides (potentiellement à supprimer)`);
  if (counts.erreur > 0) logger.warn(`  ${counts.erreur} erreurs`);
}

async function diffSingle(id_sncu: string, filePath: string): Promise<DiffRow> {
  try {
    const table = networkTableForId(id_sncu);
    if (!table) {
      throw new Error(`Identifiant inattendu (ni C ni F): ${id_sncu}`);
    }

    const parsed = JSON.parse(await readFile(filePath, 'utf8')) as
      | GeoJSON.FeatureCollection
      | GeoJSON.GeometryCollection
      | GeoJSON.Geometry;

    const isEmpty =
      (parsed.type === 'FeatureCollection' && parsed.features.length === 0) ||
      (parsed.type === 'GeometryCollection' && parsed.geometries.length === 0);
    if (isEmpty) {
      const dbRow = await kdb
        .selectFrom(table)
        .select(sql<number>`ST_Length(geom)`.as('longueur_bdd'))
        .where('Identifiant reseau', '=', id_sncu)
        .executeTakeFirst();
      return {
        delta_longueur_m: null,
        delta_longueur_pourcent: null,
        erreur: null,
        id_sncu,
        longueur_bdd_m: round(num(dbRow?.longueur_bdd) ?? null, 0),
        longueur_fichier_m: 0,
        pourcent_ajoute_5m: null,
        pourcent_ajoute_20m: null,
        pourcent_supprime_20m: null,
        statut: 'vide',
      };
    }

    const { geom, srid } = await processGeometry(parsed);
    const newGeomExpr = createGeometryExpression(geom, srid);

    // ST_Equals short-circuit: if geometries are equal, the o_sub / n_sub CTEs are empty
    // (filtered by `WHERE NOT eq.equal`), so all ST_Collect aggregates return NULL and
    // ST_Intersection on NULL returns NULL → length 0.
    // For the heavy case, ST_Subdivide breaks each MultiLineString into <=256-vertex chunks
    // before buffering, which is ~12x faster than ST_Buffer on the whole geometry.
    const bufferOpts = sql.lit(`quad_segs=${BUFFER_QUAD_SEGS}`);
    const subdivideMax = sql.lit(SUBDIVIDE_MAX_VERTICES);
    const result = await kdb
      .with('o', (db) =>
        db.selectFrom(table).where('Identifiant reseau', '=', id_sncu).select(sql<any>`ST_RemoveRepeatedPoints(geom, 0.001)`.as('g'))
      )
      .with('n', (db) => db.selectNoFrom(newGeomExpr.as('g')))
      .with('eq', (db) => db.selectFrom(['o', 'n']).select(sql<boolean>`ST_Equals(o.g, n.g)`.as('equal')))
      .with('o_sub', (db) =>
        db.selectFrom(['o', 'eq']).where(sql<boolean>`NOT eq.equal`).select(sql<any>`ST_Subdivide(o.g, ${subdivideMax})`.as('chunk'))
      )
      .with('n_sub', (db) =>
        db.selectFrom(['n', 'eq']).where(sql<boolean>`NOT eq.equal`).select(sql<any>`ST_Subdivide(n.g, ${subdivideMax})`.as('chunk'))
      )
      .with('bufs', (db) =>
        db.selectNoFrom([
          sql<any>`(SELECT ST_UnaryUnion(ST_Collect(ST_Buffer(chunk, ${sql.lit(BUFFER_SMALL_M)}, ${bufferOpts}))) FROM o_sub)`.as('o5'),
          sql<any>`(SELECT ST_UnaryUnion(ST_Collect(ST_Buffer(chunk, ${sql.lit(BUFFER_LARGE_M)}, ${bufferOpts}))) FROM o_sub)`.as('o20'),
          sql<any>`(SELECT ST_UnaryUnion(ST_Collect(ST_Buffer(chunk, ${sql.lit(BUFFER_LARGE_M)}, ${bufferOpts}))) FROM n_sub)`.as('n20'),
        ])
      )
      .selectNoFrom([
        sql<boolean>`EXISTS (SELECT 1 FROM o)`.as('has_old'),
        sql<number | null>`(SELECT ST_Length(g) FROM o)`.as('longueur_bdd'),
        sql<number>`(SELECT ST_Length(g) FROM n)`.as('longueur_fichier'),
        sql<number | null>`(
          SELECT CASE
            WHEN eq.equal THEN 0
            ELSE 100.0 * (ST_Length(n.g) - COALESCE(ST_Length(ST_Intersection(n.g, bufs.o5)), 0)) / NULLIF(ST_Length(n.g), 0)
          END
          FROM n, eq, bufs
        )`.as('pourcent_ajoute_5m'),
        sql<number | null>`(
          SELECT CASE
            WHEN eq.equal THEN 0
            ELSE 100.0 * (ST_Length(n.g) - COALESCE(ST_Length(ST_Intersection(n.g, bufs.o20)), 0)) / NULLIF(ST_Length(n.g), 0)
          END
          FROM n, eq, bufs
        )`.as('pourcent_ajoute_20m'),
        sql<number | null>`(
          SELECT CASE
            WHEN eq.equal THEN 0
            ELSE 100.0 * (ST_Length(o.g) - COALESCE(ST_Length(ST_Intersection(o.g, bufs.n20)), 0)) / NULLIF(ST_Length(o.g), 0)
          END
          FROM o, eq, bufs
        )`.as('pourcent_supprime_20m'),
      ])
      .executeTakeFirstOrThrow();

    const longueur_fichier_m = num(result.longueur_fichier);
    if (longueur_fichier_m === null) {
      throw new Error('Longueur de la nouvelle géométrie invalide');
    }

    if (!result.has_old) {
      return {
        delta_longueur_m: null,
        delta_longueur_pourcent: null,
        erreur: null,
        id_sncu,
        longueur_bdd_m: null,
        longueur_fichier_m: round(longueur_fichier_m, 0),
        pourcent_ajoute_5m: null,
        pourcent_ajoute_20m: null,
        pourcent_supprime_20m: null,
        statut: 'nouveau',
      };
    }

    const longueur_bdd_m = num(result.longueur_bdd) ?? 0;
    const delta_longueur_m = longueur_fichier_m - longueur_bdd_m;
    const delta_longueur_pourcent = longueur_bdd_m === 0 ? null : (100 * delta_longueur_m) / longueur_bdd_m;
    const pourcent_ajoute_5m = num(result.pourcent_ajoute_5m);
    const pourcent_ajoute_20m = num(result.pourcent_ajoute_20m);
    const pourcent_supprime_20m = num(result.pourcent_supprime_20m);
    const movement = Math.max(pourcent_ajoute_20m ?? 0, pourcent_supprime_20m ?? 0);

    return {
      delta_longueur_m: round(delta_longueur_m, 0),
      delta_longueur_pourcent: round(delta_longueur_pourcent, 2),
      erreur: null,
      id_sncu,
      longueur_bdd_m: round(longueur_bdd_m, 0),
      longueur_fichier_m: round(longueur_fichier_m, 0),
      pourcent_ajoute_5m: round(pourcent_ajoute_5m, 2),
      pourcent_ajoute_20m: round(pourcent_ajoute_20m, 2),
      pourcent_supprime_20m: round(pourcent_supprime_20m, 2),
      statut: movement < UNCHANGED_THRESHOLD_POURCENT ? 'inchangé' : 'modifié',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Erreur sur ${id_sncu}: ${message}`);
    return {
      delta_longueur_m: null,
      delta_longueur_pourcent: null,
      erreur: message,
      id_sncu,
      longueur_bdd_m: null,
      longueur_fichier_m: null,
      pourcent_ajoute_5m: null,
      pourcent_ajoute_20m: null,
      pourcent_supprime_20m: null,
      statut: 'erreur',
    };
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function round(n: number | null, digits: number): number | null {
  if (n === null) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function toCsv(rows: DiffRow[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const dataLines = rows.map((row) => csvHeaders.map((header) => escape(row[header])).join(','));
  return `${[csvHeaders.join(','), ...dataLines].join('\n')}\n`;
}
