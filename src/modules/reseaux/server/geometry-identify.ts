import { copyFile, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createGeometryExpression, processGeometry } from '@/modules/geo/server/helpers';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { ogr2ogrConvertToGeoJSON } from '@/utils/ogr2ogr';

// Buffer (m) used to decide whether two traces overlap. Same order of magnitude as geometry-diff.
const BUFFER_M = 20;
// 2 segments per quadrant is enough for length-coverage stats and ~4x faster.
const BUFFER_QUAD_SEGS = 2;
// ST_Subdivide chunk size — smaller = faster buffers on big networks (e.g. CPCU).
const SUBDIVIDE_MAX_VERTICES = 256;
// Candidate networks are pre-filtered with ST_DWithin (GIST index) at this distance.
const DEFAULT_MAX_DISTANCE_M = 300;
// Minimum F1 score (harmonic mean of both coverages) to call a match "fort".
const DEFAULT_MIN_SCORE = 50;
// A "fort" match also needs this margin over the second candidate, else it is "ambigu".
const MIN_MARGIN = 15;
// Number of candidates returned per file (best + alternatives for the report).
const CANDIDATE_LIMIT = 5;

type Statut = 'fort' | 'ambigu' | 'faible' | 'aucun' | 'vide' | 'erreur';
type NetworkType = 'chaleur' | 'froid';

type CandidateRow = {
  id_sncu: string;
  type: NetworkType;
  communes: string[] | null;
  len_net: string | number | null;
  len_trace: string | number | null;
  cov_reseau: string | number | null;
  cov_trace: string | number | null;
  score: string | number | null;
};

type IdentifyRow = {
  fichier: string;
  statut: Statut;
  id_sncu: string | null;
  type: NetworkType | null;
  score: number | null;
  cov_trace: number | null;
  cov_reseau: number | null;
  longueur_trace_m: number | null;
  longueur_reseau_m: number | null;
  commune_match: boolean | null;
  id_sncu_2: string | null;
  score_2: number | null;
  ecrit: boolean;
  erreur: string | null;
};

const csvHeaders = [
  'fichier',
  'statut',
  'id_sncu',
  'type',
  'score',
  'cov_trace',
  'cov_reseau',
  'longueur_trace_m',
  'longueur_reseau_m',
  'commune_match',
  'id_sncu_2',
  'score_2',
  'ecrit',
  'erreur',
] as const satisfies ReadonlyArray<keyof IdentifyRow>;

type IdentifyOptions = {
  outputPath: string;
  writeDir?: string;
  minScore?: number;
  maxDistance?: number;
};

export async function identifyNetworkGeometries(directory: string, options: IdentifyOptions): Promise<void> {
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  const maxDistance = options.maxDistance ?? DEFAULT_MAX_DISTANCE_M;

  const entries = await readdir(directory);
  const files = entries.filter((f) => /\.(kml|kmz|geojson|json)$/i.test(f)).sort();

  if (files.length === 0) {
    logger.warn(`Aucun fichier .kml / .geojson trouvé dans ${directory}`);
    return;
  }

  logger.info(`Identification de ${files.length} fichiers (distance candidats: ${maxDistance} m, score fort: ${minScore})`);

  if (options.writeDir) {
    await mkdir(options.writeDir, { recursive: true });
  }
  const tempDir = await mkdtemp(path.join(tmpdir(), 'geom-identify-'));

  // Sequential: each file runs a spatial query + optional ogr2ogr conversion. Keeps logs ordered
  // and avoids saturating the DB connection pool / ogr2ogr processes.
  const rows: IdentifyRow[] = [];
  for (const [index, file] of files.entries()) {
    rows.push(
      await identifyOne(path.join(directory, file), tempDir, index, {
        maxDistance,
        minScore,
        writeDir: options.writeDir,
      })
    );
  }

  await writeFile(options.outputPath, toCsv(rows), 'utf8');

  const counts = rows.reduce<Record<Statut, number>>((acc, r) => ({ ...acc, [r.statut]: acc[r.statut] + 1 }), {
    ambigu: 0,
    aucun: 0,
    erreur: 0,
    faible: 0,
    fort: 0,
    vide: 0,
  });
  logger.info(`Rapport écrit dans ${options.outputPath}`);
  logger.info(`  ${counts.fort} matchs forts`);
  logger.info(`  ${counts.ambigu} ambigus (à arbitrer manuellement)`);
  logger.info(`  ${counts.faible} faibles`);
  logger.info(`  ${counts.aucun} sans candidat`);
  if (counts.vide > 0) logger.warn(`  ${counts.vide} fichiers vides`);
  if (counts.erreur > 0) logger.warn(`  ${counts.erreur} erreurs`);
  if (options.writeDir) {
    logger.info(
      `Fichiers GeoJSON écrits dans ${options.writeDir} — supprimer ceux à ne pas importer, renommer les sans candidat en <id_sncu>.geojson, puis lancer bulk-update.`
    );
  } else {
    logger.info(`Relancer avec --write <dir> pour convertir et écrire tous les fichiers en GeoJSON.`);
  }
}

async function identifyOne(
  filePath: string,
  tempDir: string,
  index: number,
  options: { minScore: number; maxDistance: number; writeDir?: string }
): Promise<IdentifyRow> {
  const fichier = path.basename(filePath);
  const empty = (): IdentifyRow => buildRow(fichier, 'vide');

  try {
    const isKml = /\.(kml|kmz)$/i.test(filePath);
    let geojsonText: string;
    if (isKml) {
      // ogr2ogrConvertToGeoJSON builds an unquoted shell command: neither the input nor the output
      // path may contain spaces. Stage the source under a space-free name in the temp dir first.
      const stagedInput = path.join(tempDir, `input-${index}${path.extname(filePath)}`);
      const outPath = path.join(tempDir, `input-${index}.geojson`);
      await copyFile(filePath, stagedInput);
      await ogr2ogrConvertToGeoJSON(stagedInput, outPath);
      geojsonText = await readFile(outPath, 'utf8');
    } else {
      geojsonText = await readFile(filePath, 'utf8');
    }

    const parsed = JSON.parse(geojsonText) as GeoJSON.FeatureCollection | GeoJSON.GeometryCollection | GeoJSON.Geometry;
    const isEmpty =
      (parsed.type === 'FeatureCollection' && parsed.features.length === 0) ||
      (parsed.type === 'GeometryCollection' && parsed.geometries.length === 0);
    if (isEmpty) {
      logger.warn(`${fichier}: fichier vide, ignoré`);
      return empty();
    }

    const { geom, srid } = await processGeometry(parsed);
    const candidates = await scoreCandidates(geom, srid, options.maxDistance);

    if (candidates.length === 0) {
      logger.info(`${fichier}: aucun réseau dans un rayon de ${options.maxDistance} m`);
      if (options.writeDir) {
        const outName = path.basename(fichier, path.extname(fichier));
        await writeFile(path.join(options.writeDir, `${outName}.geojson`), geojsonText, 'utf8');
      }
      return buildRow(fichier, 'aucun');
    }

    const best = candidates[0];
    const second = candidates[1];
    const score = num(best.score) ?? 0;
    const score2 = second ? num(second.score) : null;

    let statut: Statut;
    if (score < options.minScore) {
      statut = 'faible';
    } else if (score2 !== null && score - score2 < MIN_MARGIN) {
      statut = 'ambigu';
    } else {
      statut = 'fort';
    }

    const communeMatch = matchesCommune(fichier, best.communes);

    let ecrit = false;
    if (options.writeDir) {
      await writeFile(path.join(options.writeDir, `${best.id_sncu}.geojson`), geojsonText, 'utf8');
      ecrit = true;
    }

    logger.info(
      `${fichier}: ${statut} → ${best.id_sncu} (${best.type}, score ${score}, trace ${num(best.cov_trace)}%, réseau ${num(
        best.cov_reseau
      )}%${communeMatch ? ', commune ✓' : ''})`
    );

    return {
      commune_match: communeMatch,
      cov_reseau: num(best.cov_reseau),
      cov_trace: num(best.cov_trace),
      ecrit,
      erreur: null,
      fichier,
      id_sncu: best.id_sncu,
      id_sncu_2: second?.id_sncu ?? null,
      longueur_reseau_m: num(best.len_net),
      longueur_trace_m: num(best.len_trace),
      score,
      score_2: score2,
      statut,
      type: best.type,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`${fichier}: ${message}`);
    return { ...buildRow(fichier, 'erreur'), erreur: message };
  }
}

/**
 * For a trace geometry, return the nearby networks (both heat and cold) ranked by overlap score.
 * Score = harmonic mean of two length coverages computed with a {@link BUFFER_M} buffer:
 *  - cov_trace: % of the imported trace lying on the existing network,
 *  - cov_reseau: % of the existing network lying under the imported trace.
 * Candidate networks are clipped to the trace neighbourhood before buffering to bound the cost
 * on very large networks (e.g. CPCU), while the full network length is kept as the cov_reseau denominator.
 */
async function scoreCandidates(geom: GeoJSON.Geometry, srid: number, maxDistance: number): Promise<CandidateRow[]> {
  const traceExpr = createGeometryExpression(geom, srid);
  const maxDist = sql.lit(maxDistance);
  const bufferM = sql.lit(BUFFER_M);
  const bufferOpts = sql.lit(`quad_segs=${BUFFER_QUAD_SEGS}`);
  const subdivideMax = sql.lit(SUBDIVIDE_MAX_VERTICES);

  const { rows } = await sql<CandidateRow>`
    WITH n AS (SELECT ${traceExpr} AS g),
    nlen AS (SELECT g, ST_Length(g) AS len, ST_Expand(ST_Envelope(g), ${maxDist}) AS zone FROM n),
    n_sub AS (SELECT ST_Subdivide(g, ${subdivideMax}) AS chunk FROM n),
    nbuf AS (SELECT ST_UnaryUnion(ST_Collect(ST_Buffer(chunk, ${bufferM}, ${bufferOpts}))) AS gbuf FROM n_sub),
    candidates AS (
      SELECT r."Identifiant reseau" AS id_sncu, 'chaleur'::text AS type, r.communes,
             r.geom AS g, ST_Intersection(r.geom, nlen.zone) AS g_local
      FROM reseaux_de_chaleur r, nlen
      WHERE r.geom IS NOT NULL AND r."Identifiant reseau" IS NOT NULL AND ST_DWithin(r.geom, nlen.g, ${maxDist})
      UNION ALL
      SELECT r."Identifiant reseau", 'froid'::text, r.communes,
             r.geom, ST_Intersection(r.geom, nlen.zone)
      FROM reseaux_de_froid r, nlen
      WHERE r.geom IS NOT NULL AND r."Identifiant reseau" IS NOT NULL AND ST_DWithin(r.geom, nlen.g, ${maxDist})
    ),
    scored AS (
      SELECT c.id_sncu, c.type, c.communes,
        ST_Length(c.g) AS len_net,
        nlen.len AS len_trace,
        COALESCE(ST_Length(ST_Intersection(c.g_local, nbuf.gbuf)), 0) AS net_covered,
        COALESCE(cb.trace_covered, 0) AS trace_covered
      FROM candidates c, nlen, nbuf
      CROSS JOIN LATERAL (
        SELECT ST_Length(ST_Intersection(nlen.g, nb2.gbuf)) AS trace_covered
        FROM (
          SELECT ST_UnaryUnion(ST_Collect(ST_Buffer(sub.chunk, ${bufferM}, ${bufferOpts}))) AS gbuf
          FROM ST_Subdivide(c.g_local, ${subdivideMax}) AS sub(chunk)
        ) nb2
      ) cb
    ),
    final AS (
      SELECT id_sncu, type, communes, len_net, len_trace,
        100.0 * net_covered / NULLIF(len_net, 0) AS cov_reseau,
        100.0 * trace_covered / NULLIF(len_trace, 0) AS cov_trace
      FROM scored
    )
    SELECT id_sncu, type, communes,
      ROUND(len_net::numeric, 0) AS len_net,
      ROUND(len_trace::numeric, 0) AS len_trace,
      ROUND(cov_reseau::numeric, 1) AS cov_reseau,
      ROUND(cov_trace::numeric, 1) AS cov_trace,
      ROUND((2 * cov_reseau * cov_trace / NULLIF(cov_reseau + cov_trace, 0))::numeric, 1) AS score
    FROM final
    ORDER BY score DESC NULLS LAST
    LIMIT ${sql.lit(CANDIDATE_LIMIT)}
  `.execute(kdb);

  return rows;
}

/** Loose match between the file name (city) and a candidate's communes — confirmation signal only. */
function matchesCommune(fichier: string, communes: string[] | null): boolean | null {
  if (!communes || communes.length === 0) return null;
  const nf = normalize(path.basename(fichier, path.extname(fichier)));
  if (nf.length === 0) return null;
  return communes.some((c) => {
    const nc = normalize(c);
    return nc.length > 2 && (nf.includes(nc) || nc.includes(nf));
  });
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildRow(fichier: string, statut: Statut): IdentifyRow {
  return {
    commune_match: null,
    cov_reseau: null,
    cov_trace: null,
    ecrit: false,
    erreur: null,
    fichier,
    id_sncu: null,
    id_sncu_2: null,
    longueur_reseau_m: null,
    longueur_trace_m: null,
    score: null,
    score_2: null,
    statut,
    type: null,
  };
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toCsv(rows: IdentifyRow[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const dataLines = rows.map((row) => csvHeaders.map((header) => escape(row[header])).join(','));
  return `${[csvHeaders.join(','), ...dataLines].join('\n')}\n`;
}
