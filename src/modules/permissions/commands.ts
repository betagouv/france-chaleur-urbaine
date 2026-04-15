import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Command } from '@commander-js/extra-typings';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { userRolesWithPermissions } from '@/types/enum/UserRole';
import { processInParallel } from '@/utils/async';

const logger = parentLogger.child({ module: 'permissions' });

export function registerPermissionsCommands(parentProgram: Command) {
  const program = parentProgram.command('permissions').description('Commandes de migration du système de permissions');

  program
    .command('backfill-demands')
    .description('Remplit les colonnes territoire, network_id et validated sur les demandes')
    .action(async () => {
      await backfillTerritoryCodes();
      await backfillNetworkId();
      await backfillValidated();
      logger.info('Backfill demands terminé');
    });

  program
    .command('backfill-territory')
    .description('Remplit uniquement les colonnes territoire (commune, dept, region, epci, ept)')
    .action(backfillTerritoryCodes);

  program
    .command('backfill-network')
    .description('Remplit uniquement network_id et network_type depuis legacy_values')
    .action(backfillNetworkId);

  program.command('backfill-validated').description('Remplit uniquement le flag validated depuis legacy_values').action(backfillValidated);

  program
    .command('generate-migration-plan')
    .description('Génère un CSV plan de migration des gestionnaires (rôles + permissions)')
    .option('-o, --output <path>', 'chemin du fichier CSV', 'migration-plan.csv')
    .action((opts) => generateMigrationPlan(opts.output));

  program
    .command('apply-migration-plan')
    .description('Applique le plan de migration CSV (rôles + permissions)')
    .argument('<file>', 'chemin du fichier CSV')
    .action((file) => applyMigrationPlan(file));

  program
    .command('diagnostic-collectivites')
    .description('Liste les comptes gestionnaires liés à des tags ville/métropole (candidats collectivité)')
    .action(diagnosticCollectivites);

  program
    .command('diagnostic-sncu')
    .description("Vérifie la cohérence entre l'id SNCU legacy et le réseau affecté (réseaux existants)")
    .action(diagnosticSncu);
}

// ─── Backfill territory ──────────────────────────────────────────────────────

async function backfillTerritoryCodes() {
  logger.info('Backfill territory codes...');

  const result = await sql`
    UPDATE demands d
    SET
      commune_code = c.insee_com,
      departement_code = c.insee_dep,
      region_code = c.insee_reg,
      epci_code = c.siren_epci
    FROM ign_communes c
    WHERE d.commune_code IS NULL
      AND d.deleted_at IS NULL
      AND d.legacy_values->>'Latitude' IS NOT NULL
      AND d.legacy_values->>'Longitude' IS NOT NULL
      AND ST_Contains(
        c.geom,
        ST_Transform(
          ST_SetSRID(
            ST_MakePoint(
              (d.legacy_values->>'Longitude')::double precision,
              (d.legacy_values->>'Latitude')::double precision
            ),
            4326
          ),
          2154
        )
      )
  `.execute(kdb);

  logger.info(`Commune/dept/region/epci: ${result.numAffectedRows} rows`);

  // EPT via membres JSONB
  const eptResult = await sql`
    UPDATE demands d
    SET
      ept_code = e.code
    FROM ept e
    WHERE d.ept_code IS NULL
      AND d.commune_code IS NOT NULL
      AND d.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(e.membres) m
        WHERE m->>'code' = d.commune_code
      )
  `.execute(kdb);

  logger.info(`EPT: ${eptResult.numAffectedRows} rows`);

  const missing = await kdb
    .selectFrom('demands')
    .select(sql`COUNT(*)`.as('count'))
    .where('commune_code', 'is', null)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  logger.info(`Demandes sans territoire: ${missing.count}`);
}

// ─── Backfill network ────────────────────────────────────────────────────────

async function backfillNetworkId() {
  logger.info('Backfill network_id via dernière éligibilité...');

  // 1a. Éligibilité directe (hors dans_pdp_*) : id_fcu pointe directement vers le réseau
  const directResult = await sql`
    WITH latest_eligibility AS (
      SELECT
        a.demand_id,
        (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int AS id_fcu,
        a.eligibility_history->-1->'eligibility'->>'type' AS elig_type
      FROM pro_eligibility_tests_addresses a
      WHERE a.demand_id IS NOT NULL
        AND jsonb_array_length(a.eligibility_history) > 0
        AND (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int > 0
        AND a.eligibility_history->-1->'eligibility'->>'type' != 'trop_eloigne'
        AND a.eligibility_history->-1->'eligibility'->>'type' NOT LIKE 'dans_pdp_%'
        AND (
          (a.eligibility_history->-1->'eligibility'->>'distance') IS NULL
          OR (a.eligibility_history->-1->'eligibility'->>'distance')::int < 500
        )
    )
    UPDATE demands d SET
      network_id = le.id_fcu,
      network_type = CASE
        WHEN le.elig_type LIKE '%futur%' THEN 'en_construction'
        ELSE 'existant'
      END
    FROM latest_eligibility le
    WHERE d.id = le.demand_id
      AND d.network_id IS NULL
      AND d.deleted_at IS NULL
  `.execute(kdb);

  logger.info(`Network ID (éligibilité directe): ${(directResult as any).numAffectedRows ?? '?'} rows`);

  // 1b. dans_pdp_* : id_fcu = PDP id → résoudre via PDP (SNCU, reseau_de_chaleur_ids, reseau_en_construction_ids)
  // Même logique que findPDPAssociatedNetwork : cherche le réseau le plus proche parmi tous ceux du PDP
  const pdpResult = await sql`
    WITH pdp_eligibility AS (
      SELECT
        a.demand_id,
        -- PDP 219 a été réindexé en 111
        CASE WHEN (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int = 219
          THEN 111
          ELSE (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int
        END AS pdp_id,
        ST_Transform(ST_SetSRID(ST_MakePoint(
          (d.legacy_values->>'Longitude')::double precision,
          (d.legacy_values->>'Latitude')::double precision
        ), 4326), 2154) AS demand_geom
      FROM pro_eligibility_tests_addresses a
      JOIN demands d ON d.id = a.demand_id
      WHERE a.demand_id IS NOT NULL
        AND d.network_id IS NULL
        AND d.deleted_at IS NULL
        AND jsonb_array_length(a.eligibility_history) > 0
        AND (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int > 0
        AND a.eligibility_history->-1->'eligibility'->>'type' LIKE 'dans_pdp_%'
        AND d.legacy_values->>'Longitude' IS NOT NULL
        AND d.legacy_values->>'Latitude' IS NOT NULL
    ),
    pdp_candidates AS (
      -- Réseaux existants via SNCU
      SELECT pe.demand_id, r.id_fcu AS network_id, 'existant' AS network_type,
        ST_Distance(r.geom, pe.demand_geom) AS dist
      FROM pdp_eligibility pe
      JOIN zone_de_developpement_prioritaire z ON z.id_fcu = pe.pdp_id
      JOIN reseaux_de_chaleur r ON r."Identifiant reseau" = z."Identifiant reseau" AND r.has_trace = true
      WHERE z."Identifiant reseau" IS NOT NULL AND z."Identifiant reseau" != ''
      UNION ALL
      -- Réseaux existants via reseau_de_chaleur_ids
      SELECT pe.demand_id, r.id_fcu AS network_id, 'existant' AS network_type,
        ST_Distance(r.geom, pe.demand_geom) AS dist
      FROM pdp_eligibility pe
      JOIN zone_de_developpement_prioritaire z ON z.id_fcu = pe.pdp_id
      JOIN reseaux_de_chaleur r ON r.id_fcu = ANY(z.reseau_de_chaleur_ids) AND r.has_trace = true
      WHERE z.reseau_de_chaleur_ids IS NOT NULL AND array_length(z.reseau_de_chaleur_ids, 1) > 0
      UNION ALL
      -- Réseaux/zones en construction via reseau_en_construction_ids
      SELECT pe.demand_id, rec.id_fcu AS network_id, 'en_construction' AS network_type,
        ST_Distance(rec.geom, pe.demand_geom) AS dist
      FROM pdp_eligibility pe
      JOIN zone_de_developpement_prioritaire z ON z.id_fcu = pe.pdp_id
      JOIN zones_et_reseaux_en_construction rec ON rec.id_fcu = ANY(z.reseau_en_construction_ids)
      WHERE z.reseau_en_construction_ids IS NOT NULL AND array_length(z.reseau_en_construction_ids, 1) > 0
    ),
    pdp_best AS (
      SELECT DISTINCT ON (demand_id) demand_id, network_id, network_type
      FROM pdp_candidates
      ORDER BY demand_id, dist
    )
    UPDATE demands d SET
      network_id = pb.network_id,
      network_type = pb.network_type
    FROM pdp_best pb
    WHERE d.id = pb.demand_id
      AND d.network_id IS NULL
      AND d.deleted_at IS NULL
  `.execute(kdb);

  logger.info(`Network ID (PDP): ${(pdpResult as any).numAffectedRows ?? '?'} rows`);

  // 2e passe : si la demande a un id SNCU legacy, on écrase avec le réseau existant correspondant
  const sncuResult = await sql`
    UPDATE demands d SET
      network_id = r.id_fcu,
      network_type = 'existant'
    FROM reseaux_de_chaleur r
    WHERE d.deleted_at IS NULL
      AND d.legacy_values->>'Identifiant réseau' IS NOT NULL
      AND d.legacy_values->>'Identifiant réseau' != ''
      AND r."Identifiant reseau" = d.legacy_values->>'Identifiant réseau'
      AND d.network_id IS NOT NULL
      AND d.network_id != r.id_fcu
  `.execute(kdb);

  logger.info(`Network ID (correction SNCU): ${(sncuResult as any).numAffectedRows ?? '?'} rows`);

  // Report des demandes sans éligibilité rattachable
  const missing = await sql`
    SELECT COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE a.id IS NULL)::int as no_eligibility_address,
      COUNT(*) FILTER (WHERE a.id IS NOT NULL AND (
        jsonb_array_length(a.eligibility_history) = 0
        OR a.eligibility_history->-1->'eligibility'->>'id_fcu' IS NULL
        OR (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int = 0
        OR a.eligibility_history->-1->'eligibility'->>'type' = 'trop_eloigne'
        OR (
          (a.eligibility_history->-1->'eligibility'->>'distance') IS NOT NULL
          AND (a.eligibility_history->-1->'eligibility'->>'distance')::int >= 500
        )
      ))::int as no_network_in_eligibility
    FROM demands d
    LEFT JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.network_id IS NULL
      AND d.deleted_at IS NULL
  `.execute(kdb);

  const stats = missing.rows[0] as any;
  logger.info(
    `Demandes sans network_id: ${stats.total} (${stats.no_eligibility_address} sans adresse éligibilité, ${stats.no_network_in_eligibility} sans réseau dans éligibilité)`
  );

  // Détail des demandes non affectées par type d'éligibilité
  const details = await sql`
    SELECT
      a.eligibility_history->-1->'eligibility'->>'type' as elig_type,
      COUNT(*)::int as cnt,
      MIN((a.eligibility_history->-1->'eligibility'->>'distance')::int) as distance_min,
      MAX((a.eligibility_history->-1->'eligibility'->>'distance')::int) as distance_max
    FROM demands d
    JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.network_id IS NULL
      AND d.deleted_at IS NULL
      AND jsonb_array_length(a.eligibility_history) > 0
    GROUP BY 1
    ORDER BY cnt DESC
  `.execute(kdb);

  if (details.rows.length > 0) {
    logger.info('Détail des demandes non affectées :');
    for (const row of details.rows) {
      const r = row as any;
      const distStr = r.distance_min != null ? `distance ${r.distance_min}-${r.distance_max}m` : 'distance N/A';
      logger.info(`  ${r.elig_type ?? "(pas d'éligibilité)"}: ${r.cnt} demandes (${distStr})`);
    }
  }

  // Export CSV des demandes non affectées
  const unassigned = await sql`
    SELECT
      d.id,
      d.created_at,
      d.legacy_values->>'Adresse' as adresse,
      d.legacy_values->>'Ville' as ville,
      d.legacy_values->>'Code Postal' as code_postal,
      d.legacy_values->>'Nom' as nom,
      d.legacy_values->>'Mail' as mail,
      d.legacy_values->>'Status' as status,
      d.legacy_values->>'Identifiant réseau' as sncu_legacy,
      d.commune_code,
      a.eligibility_history->-1->'eligibility'->>'type' as elig_type,
      (a.eligibility_history->-1->'eligibility'->>'id_fcu')::int as elig_id_fcu,
      a.eligibility_history->-1->'eligibility'->>'nom' as elig_nom,
      (a.eligibility_history->-1->'eligibility'->>'distance')::int as elig_distance,
      a.eligibility_history->-1->'eligibility'->>'id_sncu' as elig_sncu
    FROM demands d
    LEFT JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.network_id IS NULL
      AND d.deleted_at IS NULL
    ORDER BY a.eligibility_history->-1->'eligibility'->>'type', d.created_at DESC
  `.execute(kdb);

  if (unassigned.rows.length > 0) {
    const csvPath = '/tmp/backfill-network-unassigned.csv';
    const headers = [
      'id',
      'created_at',
      'adresse',
      'ville',
      'code_postal',
      'nom',
      'mail',
      'status',
      'sncu_legacy',
      'commune_code',
      'elig_type',
      'elig_id_fcu',
      'elig_nom',
      'elig_distance',
      'elig_sncu',
    ];
    const csvRows = [headers.join(',')];
    for (const row of unassigned.rows) {
      const r = row as any;
      csvRows.push(
        headers
          .map((h) => {
            const val = r[h];
            if (val == null) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      );
    }
    writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
    logger.info(`${unassigned.rows.length} demandes non affectées exportées → ${csvPath}`);
  }
}

// ─── Backfill validated ──────────────────────────────────────────────────────

async function backfillValidated() {
  logger.info('Backfill validated...');

  await sql`
    UPDATE demands
    SET
      validated = COALESCE(legacy_values->>'Gestionnaires validés' = 'true', false)
  `.execute(kdb);

  const stats = await sql`
    SELECT validated, COUNT(*)::int as cnt
    FROM demands WHERE deleted_at IS NULL GROUP BY validated
  `.execute(kdb);

  for (const row of stats.rows) {
    logger.info(`  validated=${(row as any).validated}: ${(row as any).cnt}`);
  }
}

// ─── Tag → territory resolution ─────────────────────────────────────────────

/**
 * Hardcoded mapping for tags that don't match standard patterns.
 * key = tag name, value = { type, search } where search is the EPCI/commune name to look up.
 */
const specialTagMappings: Record<string, { type: 'epci'; search: string } | { type: 'commune'; search: string }> = {
  // Metropole tags with non-standard naming
  Ardenne_Metropole: { search: 'CA Ardenne Métropole', type: 'epci' },
  BordeauxM_Sud: { search: 'Bordeaux Métropole', type: 'epci' }, // sous-zone, même EPCI
  // Ville tags with EPCI/CC/CU prefix
  CA_Ouest_Rhodanien: { search: "CA de l'Ouest Rhodanien", type: 'epci' },
  CC_Loue_Lison: { search: 'CC Loue-Lison', type: 'epci' },
  Cergy_Pontoise: { search: 'CA de Cergy-Pontoise', type: 'epci' },
  'Clermont-FerrandM': { search: 'Clermont Auvergne Métropole', type: 'epci' },
  'CU_Charleville-Mezieres': { search: 'CA Ardenne Métropole', type: 'epci' },
  GrandAngoulême: { search: 'CA du Grand Angoulême', type: 'epci' },
  GrandBelfortCA: { search: 'CA Grand Belfort', type: 'epci' },
  GrandParisSud: { search: 'CA Grand Paris Sud Seine Essonne Sénart', type: 'epci' },
  'Lannion-Trégor Communauté': { search: 'CA Lannion-Trégor Communauté', type: 'epci' },
  'Le HavreM': { search: 'CU Le Havre Seine Métropole', type: 'epci' },
  'Le MansM': { search: 'CU Le Mans Métropole', type: 'epci' },
  'Mont-de-Marsan_Agglomération': { search: 'CA Mont de Marsan Agglomération', type: 'epci' },
  MorlaixCA: { search: 'CA Morlaix Communauté', type: 'epci' },
  MulhouseAg: { search: 'CA Mulhouse Alsace Agglomération', type: 'epci' },
  'Pau-Béarn-Pyrénées_CA': { search: 'CA Pau Béarn Pyrénées', type: 'epci' },
  QuimperCA: { search: 'CA Quimper Bretagne Occidentale', type: 'epci' },
  RouenM_rivegauche: { search: 'Métropole Rouen Normandie', type: 'epci' }, // sous-zone, même EPCI
  'Saint-EtienneM': { search: 'Saint-Étienne Métropole', type: 'epci' },
  // Commune name mismatches (accents, orthography)
  'Saint-Narbord': { search: 'Saint-Nabord', type: 'commune' },
  'Saint-Nazaire-Agglomération': { search: "CA de la Région Nazairienne et de l'Estuaire (CARENE)", type: 'epci' },
};

type ResolvedPermission = {
  type: 'commune' | 'epci' | 'ept' | 'reseau_existant' | 'reseau_en_construction';
  resource_id: string;
  label: string; // human-readable label for the report
};

type TagResolution = {
  tag: string;
  tagType: 'ville' | 'metropole' | 'gestionnaire' | 'reseau' | null;
  permissions: ResolvedPermission[];
  confidence: 'ok' | 'ambiguous' | 'not_found';
  note?: string;
};

/** Preload all commune names and EPCI names for fast in-memory lookup */
async function loadLookupTables() {
  const [communes, epcis] = await Promise.all([
    sql`SELECT nom, insee_com, population FROM ign_communes ORDER BY population DESC`.execute(kdb),
    sql`SELECT nom, code, type FROM epci ORDER BY nom`.execute(kdb),
  ]);

  // Group communes by unaccented lowercase name, sorted by population desc (already ordered)
  const communesByName = new Map<string, { nom: string; insee_com: string; population: number }[]>();
  for (const row of communes.rows) {
    const r = row as any;
    const key = normalizeForLookup(r.nom);
    if (!communesByName.has(key)) {
      communesByName.set(key, []);
    }
    communesByName.get(key)!.push({ insee_com: r.insee_com, nom: r.nom, population: Number(r.population) });
  }

  // Index EPCI by normalized name
  const epciByName = new Map<string, { nom: string; code: string; type: string }>();
  for (const row of epcis.rows) {
    const r = row as any;
    epciByName.set(normalizeForLookup(r.nom), { code: r.code, nom: r.nom, type: r.type });
  }

  return { communesByName, epciByName };
}

function normalizeForLookup(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function resolveTagToTerritory(
  tagName: string,
  tagType: string | null,
  communesByName: Map<string, { nom: string; insee_com: string; population: number }[]>,
  epciByName: Map<string, { nom: string; code: string; type: string }>
): TagResolution {
  // 1. Hardcoded special mappings
  const special = specialTagMappings[tagName];
  if (special) {
    if (special.type === 'commune') {
      const key = normalizeForLookup(special.search);
      const matches = communesByName.get(key);
      if (matches && matches.length > 0) {
        return {
          confidence: 'ok',
          note: `mapping spécial → ${matches[0].nom}`,
          permissions: [{ label: matches[0].nom, resource_id: matches[0].insee_com, type: 'commune' }],
          tag: tagName,
          tagType: tagType as any,
        };
      }
    }
    if (special.type === 'epci') {
      // Try exact match first, then partial
      const key = normalizeForLookup(special.search);
      const exact = epciByName.get(key);
      if (exact) {
        return {
          confidence: 'ok',
          note: `mapping spécial → ${exact.nom}`,
          permissions: [{ label: exact.nom, resource_id: exact.code, type: 'epci' }],
          tag: tagName,
          tagType: tagType as any,
        };
      }
      // Partial match
      for (const [k, v] of Array.from(epciByName)) {
        if (k.includes(key) || key.includes(k)) {
          return {
            confidence: 'ok',
            note: `mapping spécial (partiel) → ${v.nom}`,
            permissions: [{ label: v.nom, resource_id: v.code, type: 'epci' }],
            tag: tagName,
            tagType: tagType as any,
          };
        }
      }
    }
    return {
      confidence: 'not_found',
      note: `mapping spécial défini mais non trouvé en base: ${special.search}`,
      permissions: [],
      tag: tagName,
      tagType: tagType as any,
    };
  }

  // 2. Metropole tags (ending with M, or tagged as 'metropole')
  if (tagType === 'metropole') {
    // Strip trailing M, CA suffixes for EPCI search
    let baseName = tagName;
    if (/M$/.test(baseName) && !baseName.includes(' ')) {
      baseName = baseName.slice(0, -1);
    }
    // Insert spaces before uppercase letters: "StrasbourgM" → "Strasbourg"
    baseName = baseName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');

    // Try "${baseName} Métropole" and variations
    const searches = [
      `${baseName} Métropole`,
      `${baseName} Metropole`,
      `Métropole de ${baseName}`,
      `Métropole ${baseName}`,
      `Eurométropole de ${baseName}`,
      `CU ${baseName} Métropole`,
      `CA ${baseName} Métropole`,
      baseName,
    ];

    for (const search of searches) {
      const key = normalizeForLookup(search);
      const exact = epciByName.get(key);
      if (exact) {
        return {
          confidence: 'ok',
          permissions: [{ label: exact.nom, resource_id: exact.code, type: 'epci' }],
          tag: tagName,
          tagType: 'metropole',
        };
      }
    }

    // Partial match on baseName
    const baseKey = normalizeForLookup(baseName);
    for (const [k, v] of Array.from(epciByName)) {
      if (k.includes(baseKey) && (v.type === 'METRO' || v.type === 'MET69' || v.type === 'CU' || v.type === 'CA')) {
        return {
          confidence: 'ambiguous',
          note: `match partiel EPCI: ${v.nom}`,
          permissions: [{ label: v.nom, resource_id: v.code, type: 'epci' }],
          tag: tagName,
          tagType: 'metropole',
        };
      }
    }

    return { confidence: 'not_found', note: `EPCI non trouvé pour "${baseName}"`, permissions: [], tag: tagName, tagType: 'metropole' };
  }

  // 3. Ville tags → commune lookup
  if (tagType === 'ville') {
    const key = normalizeForLookup(tagName);
    const matches = communesByName.get(key);
    if (matches && matches.length === 1) {
      return {
        confidence: 'ok',
        permissions: [{ label: matches[0].nom, resource_id: matches[0].insee_com, type: 'commune' }],
        tag: tagName,
        tagType: 'ville',
      };
    }
    if (matches && matches.length > 1) {
      // Take the most populated
      return {
        confidence: 'ambiguous',
        note: `${matches.length} homonymes, pris la plus peuplée (${matches[0].population} hab.)`,
        permissions: [{ label: matches[0].nom, resource_id: matches[0].insee_com, type: 'commune' }],
        tag: tagName,
        tagType: 'ville',
      };
    }
    return { confidence: 'not_found', note: 'commune non trouvée dans ign_communes', permissions: [], tag: tagName, tagType: 'ville' };
  }

  // 4. Non-territory tag (reseau, gestionnaire)
  return { confidence: 'ok', note: 'tag réseau/gestionnaire (pas de territoire)', permissions: [], tag: tagName, tagType: tagType as any };
}

// ─── Generate migration plan ────────────────────────────────────────────────

const CSV_SEPARATOR = ';';
const MULTI_VALUE_SEPARATOR = ' | ';
const CSV_HEADERS = [
  'email',
  'active',
  'tags_avant',
  'validé',
  'role_actuel',
  'role_cible',
  'categorie',
  'notes',
  'permissions_territoire',
  'permissions_reseau',
];

function formatPermForCsv(p: ResolvedPermission): string {
  return `${p.type}:${p.resource_id} (${p.label})`;
}

function escapeCsvField(value: string): string {
  if (value.includes(CSV_SEPARATOR) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvLine(fields: string[]): string {
  return fields.map(escapeCsvField).join(CSV_SEPARATOR);
}

async function generateMigrationPlan(outputPath: string) {
  logger.info('Génération du plan de migration...');

  const { communesByName, epciByName } = await loadLookupTables();

  // Preload tag types
  const allTags = await sql`SELECT name, type FROM tags`.execute(kdb);
  const tagTypeMap = new Map<string, string>();
  for (const row of allTags.rows) {
    tagTypeMap.set((row as any).name, (row as any).type);
  }

  // All gestionnaire users with tags
  const users = await kdb
    .selectFrom('users')
    .select(['id', 'email', 'gestionnaires', 'active'])
    .where('role', '=', 'gestionnaire')
    .where('gestionnaires', 'is not', null)
    .execute();

  logger.info(`${users.length} gestionnaires avec tags`);

  // Preload network tag associations
  const [existingNetworkTags, constructionNetworkTags, existingBySncuRows] = await Promise.all([
    sql`SELECT id_fcu, nom_reseau, unnest(tags) as tag FROM reseaux_de_chaleur WHERE tags IS NOT NULL`.execute(kdb),
    sql`SELECT id_fcu, nom_reseau, unnest(tags) as tag FROM zones_et_reseaux_en_construction WHERE tags IS NOT NULL`.execute(kdb),
    sql`SELECT id_fcu, nom_reseau, "Identifiant reseau" as sncu FROM reseaux_de_chaleur WHERE "Identifiant reseau" IS NOT NULL`.execute(
      kdb
    ),
  ]);

  const existingByTag = new Map<string, { id_fcu: number; nom: string }[]>();
  for (const row of existingNetworkTags.rows) {
    const r = row as any;
    if (!existingByTag.has(r.tag)) existingByTag.set(r.tag, []);
    existingByTag.get(r.tag)!.push({ id_fcu: r.id_fcu, nom: r.nom_reseau ?? '' });
  }

  const constructionByTag = new Map<string, { id_fcu: number; nom: string }[]>();
  for (const row of constructionNetworkTags.rows) {
    const r = row as any;
    if (!constructionByTag.has(r.tag)) constructionByTag.set(r.tag, []);
    constructionByTag.get(r.tag)!.push({ id_fcu: r.id_fcu, nom: r.nom_reseau ?? '' });
  }

  const existingBySncu = new Map<string, { id_fcu: number; nom: string }>();
  for (const row of existingBySncuRows.rows) {
    const r = row as any;
    existingBySncu.set(r.sncu, { id_fcu: r.id_fcu, nom: r.nom_reseau ?? '' });
  }

  // ALEC_MVE EPTs
  const alecMveEpts = await sql`SELECT code, nom FROM ept WHERE nom IN ('Est Ensemble', 'Paris Est Marne et Bois')`.execute(kdb);
  const alecMveEptCodes = alecMveEpts.rows.map((r: any) => ({ code: r.code, nom: r.nom }));

  // Build CSV rows
  type CsvRow = {
    email: string;
    active: boolean;
    tags: string[];
    roleActuel: string;
    roleCible: string;
    categorie: string;
    territoryPerms: ResolvedPermission[];
    networkPerms: ResolvedPermission[];
    notes: string[];
  };

  const rows: CsvRow[] = [];

  await processInParallel(users, 10, async (user) => {
    if (!user.gestionnaires || user.gestionnaires.length === 0) return;

    const networkPerms: ResolvedPermission[] = [];
    const territoryPerms: ResolvedPermission[] = [];
    const notes: string[] = [];
    let isAlec = false;
    let isApc = false;

    for (const tagName of user.gestionnaires) {
      const tagType = tagTypeMap.get(tagName) ?? null;

      // ALEC_MVE
      if (tagName === 'ALEC_MVE') {
        isAlec = true;
        for (const ept of alecMveEptCodes) {
          territoryPerms.push({ label: ept.nom, resource_id: ept.code, type: 'ept' });
        }
        continue;
      }

      // APC → gestionnaire avec permission commune Paris
      if (tagName === 'APC') {
        isApc = true;
        territoryPerms.push({ label: 'Paris', resource_id: '75056', type: 'commune' });
        continue;
      }

      // Network permissions
      const existing = existingByTag.get(tagName) ?? [];
      for (const net of existing) {
        networkPerms.push({ label: net.nom, resource_id: String(net.id_fcu), type: 'reseau_existant' });
      }

      const construction = constructionByTag.get(tagName) ?? [];
      for (const net of construction) {
        networkPerms.push({ label: net.nom, resource_id: String(net.id_fcu), type: 'reseau_en_construction' });
      }

      // Fallback SNCU
      if (existing.length === 0 && construction.length === 0) {
        const sncuMatch = tagName.match(/_(\d{4}C)$/);
        if (sncuMatch) {
          const sncu = sncuMatch[1];
          const net = existingBySncu.get(sncu);
          if (net) {
            networkPerms.push({ label: net.nom, resource_id: String(net.id_fcu), type: 'reseau_existant' });
            notes.push(`fallback SNCU ${sncu} → réseau #${net.id_fcu}`);
          } else {
            notes.push(`tag ${tagName}: SNCU ${sncu} non trouvé`);
          }
        }
      }

      // Territory permissions
      // Effective type: use tag type from DB, or fallback to 'ville' if the tag matches a commune name
      let effectiveTagType = tagType;
      if (!effectiveTagType) {
        const key = normalizeForLookup(tagName);
        if (communesByName.has(key)) {
          effectiveTagType = 'ville';
          notes.push(`tag ${tagName}: absent de la table tags, trouvé dans ign_communes`);
        }
      }

      if (effectiveTagType === 'ville' || effectiveTagType === 'metropole') {
        const resolution = resolveTagToTerritory(tagName, effectiveTagType, communesByName, epciByName);
        for (const perm of resolution.permissions) {
          territoryPerms.push(perm);
        }
        if (resolution.confidence === 'ambiguous') {
          if (effectiveTagType === 'ville') {
            const key = normalizeForLookup(tagName);
            const matches = communesByName.get(key);
            if (matches && matches.length > 1) {
              const details = matches.map((m) => `${m.nom} (${m.insee_com}, ${m.population} hab.)`).join(' / ');
              notes.push(`homonymes pour ${tagName}: ${details} → pris le plus peuplé`);
            }
          }
          if (resolution.note) notes.push(resolution.note);
        } else if (resolution.confidence === 'not_found') {
          notes.push(`tag ${tagName}: ${resolution.note ?? 'territoire non trouvé'}`);
        }
      } else if (!effectiveTagType && !tagName.match(/_(\d{4}C)$/) && tagName !== 'ALEC_MVE') {
        // Tag truly unknown
        notes.push(`tag ${tagName}: type inconnu (absent de la table tags et ign_communes)`);
      }
    }

    // Deduplicate permissions by type:resource_id
    const dedup = (perms: ResolvedPermission[]) => {
      const seen = new Set<string>();
      return perms.filter((p) => {
        const key = `${p.type}:${p.resource_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const dedupNetwork = dedup(networkPerms);
    const dedupTerritory = dedup(territoryPerms);

    // Classify
    const hasNetwork = dedupNetwork.length > 0;
    const hasTerritory = dedupTerritory.length > 0;

    let categorie: string;
    let roleCible: string;

    if (isAlec) {
      categorie = 'alec';
      roleCible = 'alec';
    } else if (isApc) {
      categorie = 'gestionnaire_territoire';
      roleCible = 'gestionnaire';
    } else if (hasNetwork && !hasTerritory) {
      categorie = 'gestionnaire_pur';
      roleCible = 'gestionnaire';
    } else if (!hasNetwork && hasTerritory) {
      categorie = 'collectivite_pur';
      roleCible = 'collectivite';
    } else if (hasNetwork && hasTerritory) {
      categorie = 'mixte_reseau_territoire';
      roleCible = ''; // à trancher
    } else {
      categorie = 'sans_permission';
      roleCible = ''; // à trancher
    }

    rows.push({
      active: user.active ?? false,
      categorie,
      email: user.email,
      networkPerms: dedupNetwork,
      notes,
      roleActuel: 'gestionnaire',
      roleCible,
      tags: user.gestionnaires,
      territoryPerms: dedupTerritory,
    });
  });

  // Sort by categorie then email
  const categoryOrder = [
    'alec',
    'gestionnaire_territoire',
    'collectivite_pur',
    'gestionnaire_pur',
    'mixte_reseau_territoire',
    'sans_permission',
  ];
  rows.sort((a, b) => {
    const catDiff = categoryOrder.indexOf(a.categorie) - categoryOrder.indexOf(b.categorie);
    if (catDiff !== 0) return catDiff;
    return a.email.localeCompare(b.email);
  });

  // Write CSV
  const csvRows = [csvLine(CSV_HEADERS)];
  for (const row of rows) {
    csvRows.push(
      csvLine([
        row.email,
        row.active ? 'oui' : 'non',
        row.tags.join(MULTI_VALUE_SEPARATOR),
        '',
        row.roleActuel,
        row.roleCible,
        row.categorie,
        row.notes.join(MULTI_VALUE_SEPARATOR),
        row.territoryPerms.map(formatPermForCsv).join(MULTI_VALUE_SEPARATOR),
        row.networkPerms.map(formatPermForCsv).join(MULTI_VALUE_SEPARATOR),
      ])
    );
  }

  writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');

  // Summary
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.categorie] = (counts[row.categorie] ?? 0) + 1;
  }

  logger.info('');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  RÉSUMÉ');
  logger.info('═══════════════════════════════════════════════════════════');
  for (const cat of categoryOrder) {
    logger.info(`  ${cat}: ${counts[cat] ?? 0}`);
  }
  logger.info(`  Total: ${rows.length}`);
  logger.info(`  Rôle pré-rempli: ${rows.filter((r) => r.roleCible !== '').length}`);
  logger.info(`  À trancher: ${rows.filter((r) => r.roleCible === '').length}`);
  logger.info('');
  const absolutePath = resolve(outputPath);
  const fileLink = `\x1b]8;;file://${absolutePath}\x1b\\${absolutePath}\x1b]8;;\x1b\\`;
  logger.info(`Plan généré → ${fileLink}`);
}

// ─── Apply migration plan ───────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === CSV_SEPARATOR) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parsePermsFromCsv(value: string): { type: string; resource_id: string }[] {
  if (!value.trim()) return [];
  return value.split(MULTI_VALUE_SEPARATOR.trim()).map((s) => {
    const match = s.trim().match(/^(\w+):(\S+)\s*\(/);
    if (!match) {
      throw new Error(`Format de permission invalide: "${s.trim()}" — attendu: type:id (label)`);
    }
    return { resource_id: match[2], type: match[1] };
  });
}

async function applyMigrationPlan(filePath: string) {
  logger.info(`Application du plan de migration: ${filePath}`);

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim());

  if (lines.length < 2) {
    logger.error('Fichier CSV vide ou invalide');
    return;
  }

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const colIndex = (name: string) => {
    const idx = headers.indexOf(name);
    if (idx === -1) throw new Error(`Colonne "${name}" manquante dans le CSV`);
    return idx;
  };

  const emailIdx = colIndex('email');
  const roleCibleIdx = colIndex('role_cible');
  const permsTerritoireIdx = colIndex('permissions_territoire');
  const permsReseauIdx = colIndex('permissions_reseau');

  const validRoleSchema = z.enum(userRolesWithPermissions);

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const email = fields[emailIdx]?.trim();
    const rawRole = fields[roleCibleIdx]?.trim();

    if (!email) continue;

    if (!rawRole) {
      skipped++;
      continue;
    }

    const roleResult = validRoleSchema.safeParse(rawRole);
    if (!roleResult.success) {
      logger.error(`Ligne ${i + 1}: rôle "${rawRole}" invalide pour ${email} (attendu: ${userRolesWithPermissions.join(', ')})`);
      errors++;
      continue;
    }
    const roleCible = roleResult.data;

    // Find user
    const user = await kdb.selectFrom('users').select(['id']).where('email', '=', email).executeTakeFirst();
    if (!user) {
      logger.error(`Ligne ${i + 1}: utilisateur ${email} non trouvé`);
      errors++;
      continue;
    }

    // Parse permissions
    let territoryPerms: { type: string; resource_id: string }[];
    let networkPerms: { type: string; resource_id: string }[];
    try {
      territoryPerms = parsePermsFromCsv(fields[permsTerritoireIdx] ?? '');
      networkPerms = parsePermsFromCsv(fields[permsReseauIdx] ?? '');
    } catch (e: any) {
      logger.error(`Ligne ${i + 1} (${email}): ${e.message}`);
      errors++;
      continue;
    }

    // Apply: update role
    await kdb.updateTable('users').set({ role: roleCible }).where('id', '=', user.id).execute();

    // Apply: replace permissions
    await kdb.deleteFrom('user_permissions').where('user_id', '=', user.id).execute();

    const allPerms = [...territoryPerms, ...networkPerms].map((p) => ({
      resource_id: p.resource_id,
      type: p.type,
      user_id: user.id,
    }));

    if (allPerms.length > 0) {
      await kdb
        .insertInto('user_permissions')
        .values(allPerms)
        .onConflict((oc) => oc.columns(['user_id', 'type', 'resource_id']).doNothing())
        .execute();
    }

    logger.info(`  [OK] ${email} → ${roleCible} (${allPerms.length} permissions)`);
    applied++;
  }

  logger.info('');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  RÉSUMÉ APPLICATION');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info(`  Appliqués: ${applied}`);
  logger.info(`  Ignorés (role_cible vide): ${skipped}`);
  logger.info(`  Erreurs: ${errors}`);
}

// ─── Diagnostic collectivités ────────────────────────────────────────────────

async function diagnosticCollectivites() {
  logger.info('Diagnostic: comptes gestionnaires avec tags ville/métropole...');

  const results = await sql`
    SELECT
      u.id,
      u.email,
      u.gestionnaires,
      u.structure_name,
      u.active,
      ARRAY(
        SELECT t.name FROM tags t
        WHERE t.name = ANY(u.gestionnaires) AND t.type IN ('ville', 'metropole')
      ) as territory_tags,
      ARRAY(
        SELECT t.name FROM tags t
        WHERE t.name = ANY(u.gestionnaires) AND t.type NOT IN ('ville', 'metropole')
      ) as other_tags
    FROM users u
    WHERE u.role = 'gestionnaire'
      AND u.gestionnaires IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM tags t
        WHERE t.name = ANY(u.gestionnaires) AND t.type IN ('ville', 'metropole')
      )
    ORDER BY u.email
  `.execute(kdb);

  logger.info(`${results.rows.length} comptes candidats collectivité:`);
  for (const row of results.rows) {
    const r = row as any;
    const hasOtherTags = r.other_tags.length > 0;
    logger.info(
      `  ${r.email} (active=${r.active}) — tags territoire: [${r.territory_tags.join(', ')}]${hasOtherTags ? ` — ATTENTION aussi tags non-territoire: [${r.other_tags.join(', ')}]` : ''}`
    );
  }
}

// ─── Diagnostic SNCU ────────────────────────────────────────────────────────

async function diagnosticSncu() {
  logger.info('Diagnostic: cohérence id SNCU legacy vs réseau affecté...');

  const results = await sql`
    SELECT
      d.id,
      d.created_at,
      d.updated_at,
      d.network_id as reseau_affecte_id_fcu,
      r.nom_reseau as reseau_affecte_nom,
      r."Identifiant reseau" as reseau_affecte_sncu,
      d.legacy_values->>'Identifiant réseau' as sncu_legacy,
      r_legacy.id_fcu as sncu_legacy_id_fcu,
      r_legacy.nom_reseau as sncu_legacy_nom,
      d.legacy_values->>'Adresse' as adresse,
      d.legacy_values->>'Ville' as ville,
      d.legacy_values->>'Code Postal' as code_postal,
      d.legacy_values->>'Status' as status,
      d.legacy_values->>'Nom' as nom,
      d.legacy_values->>'Mail' as mail,
      d.legacy_values->>'Structure' as structure,
      d.validated,
      d.commune_code,
      a.eligibility_history->-1->'eligibility'->>'type' as elig_type,
      (a.eligibility_history->-1->'eligibility'->>'distance')::int as elig_distance,
      a.eligibility_history->-1->'calculated_at' as elig_date,
      CASE
        WHEN d.legacy_values->>'Identifiant réseau' IS NULL OR d.legacy_values->>'Identifiant réseau' = '' THEN 'pas_de_sncu_legacy'
        WHEN r."Identifiant reseau" = d.legacy_values->>'Identifiant réseau' THEN 'match'
        ELSE 'mismatch'
      END as coherence
    FROM demands d
    JOIN reseaux_de_chaleur r ON r.id_fcu = d.network_id
    LEFT JOIN reseaux_de_chaleur r_legacy ON r_legacy."Identifiant reseau" = d.legacy_values->>'Identifiant réseau'
    LEFT JOIN pro_eligibility_tests_addresses a ON a.demand_id = d.id
    WHERE d.deleted_at IS NULL
      AND d.network_type = 'existant'
      AND d.network_id IS NOT NULL
  `.execute(kdb);

  // Stats
  const byStatus: Record<string, number> = {};
  let mismatchCount = 0;
  for (const row of results.rows) {
    const r = row as any;
    byStatus[r.coherence] = (byStatus[r.coherence] ?? 0) + 1;
    if (r.coherence === 'mismatch') mismatchCount++;
  }

  logger.info(`Résultats sur ${results.rows.length} demandes (réseau existant) :`);
  for (const [status, count] of Object.entries(byStatus)) {
    logger.info(`  ${status}: ${count}`);
  }

  // Export CSV des mismatches
  if (mismatchCount > 0) {
    const csvPath = '/tmp/diagnostic-sncu-mismatches.csv';
    const headers = [
      'id',
      'created_at',
      'updated_at',
      'reseau_affecte_id_fcu',
      'reseau_affecte_nom',
      'reseau_affecte_sncu',
      'sncu_legacy',
      'sncu_legacy_id_fcu',
      'sncu_legacy_nom',
      'adresse',
      'ville',
      'code_postal',
      'status',
      'nom',
      'mail',
      'structure',
      'validated',
      'commune_code',
      'elig_type',
      'elig_distance',
      'elig_date',
    ];
    const csvRows = [headers.join(',')];
    for (const row of results.rows) {
      const r = row as any;
      if (r.coherence !== 'mismatch') continue;
      csvRows.push(
        headers
          .map((h) => {
            const val = r[h];
            if (val == null) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      );
    }
    writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
    logger.info(`${mismatchCount} incohérences exportées → ${csvPath}`);
  } else {
    logger.info('Aucune incohérence détectée.');
  }
}
